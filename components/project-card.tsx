"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MoreVertical, Play, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"

interface ProjectVersion {
  id: string,
  videoUrl: string,
  thumbnail: string,
  version: number,
  videoSize: number,
  videoType: string,
}

interface Project {
  title: string,
  numVersions: number,
  status: string,
  progress: number,
  createdAt: string,
  updatedAt: string,
  dueDate: string,
  versions: ProjectVersion[],
  size: number,
}

interface ProjectCardProps {
  project: Project
  workspaceId: string
  versionHistory: ProjectVersion[]
}

export default function ProjectCard({ project, workspaceId, versionHistory }: ProjectCardProps) {
  const currentVersion = project.versions[project.versions.length - 1]
  const [status, setStatus] = useState(project.status || "processing")
  const [thumbnailSrc, setThumbnailSrc] = useState<string>("/placeholder.svg")
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!currentVersion?.videoUrl) {
      console.log('No video URL provided')
      setIsLoading(false)
      return
    }

    const video = videoRef.current
    console.log('project.videoUrl', currentVersion.videoUrl)

    if (!video) {
      console.log('Video ref not available')
      setIsLoading(false)
      return
    }

    const captureFrame = () => {
      try {
        console.log('Attempting to capture frame...')
        // Create canvas with video dimensions
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 360
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          console.log('Could not get canvas context')
          setIsLoading(false)
          return
        }

        // Draw the current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert to data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
        console.log('Successfully captured frame')
        setThumbnailSrc(thumbnailUrl)
        setIsLoading(false)
      } catch (error) {
        console.error('Error capturing video frame:', error)
        setIsLoading(false)
      }
    }

    const handleLoadedData = () => {
      console.log('Video data loaded')
      video.currentTime = 1.0
    }

    const handleTimeUpdate = () => {
      console.log('Time updated:', video.currentTime)
      if (video.currentTime >= 1.0) {
        captureFrame()
        video.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.load()

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [currentVersion?.videoUrl])
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-700"
      case "Pending Review":
        return "bg-amber-100 text-amber-700"
      case "Approved":
        return "bg-green-100 text-green-700"
      case "Rejected":
        return "bg-red-100 text-red-700"
      case "Completed":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const changeStatus = (status: string) => {
    setStatus(status)
    // update status in firestore workspace collection for the given project

  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="relative">
        {/* Hidden video element to capture first frame */}
        <video 
          ref={videoRef}
          className="hidden"
          preload="metadata"
          playsInline
          muted
          crossOrigin="anonymous"
        >
          <source src={currentVersion?.videoUrl ? `${process.env.NEXT_PUBLIC_AWS_CDN_URL}${currentVersion.videoUrl}` : ''} type={currentVersion?.videoType} />
        </video>

        <Link href={`/dashboard/video/${currentVersion.id}?workspaceId=${workspaceId}`}>
          {isLoading ? (
            <div className="h-36 w-full animate-pulse bg-gray-200 flex items-center justify-center">
              <div className="text-gray-400">Loading thumbnail...</div>
            </div>
          ) : (
            <Image
              src={thumbnailSrc}
              alt={project.title || "Untitled Video"}
              width={250}
              height={150}
              className="h-36 w-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-sky-600">
              <Play className="h-6 w-6" />
            </div>
          </div>
        </Link>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/dashboard/video/${currentVersion.id}?workspaceId=${workspaceId}`} className="hover:underline">
            <h3 className="font-medium text-gray-900">{project.title}</h3>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={`h-7 text-xs font-medium ${getStatusColor(status || "in progress")}`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>

              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Pending Review">Pending Review</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="None">Processing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Version: {currentVersion?.version || 1}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Updated: {new Date(project.updatedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <svg
              className="mr-1.5 h-3.5 w-3.5"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.29 7 12 12 20.71 7" />
              <line x1="12" x2="12" y1="22" y2="12" />
            </svg>
            Progress: {project.progress || 0}%
          </div>
        </div>
      </div>
    </div>
  )
}


