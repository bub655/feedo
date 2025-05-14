"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MoreVertical, Play, User, Loader2 } from "lucide-react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface ProjectCardProps {
  project: WorkspaceProject,
  client: string,
  workspaceId: string,
  versionNo: number,
  tier: string
}

interface WorkspaceProject {
  createdAt: string,
  dueDate: string,
  numVersions: number,
  progress: number,
  size: number,
  status: string,
  title: string,
  updatedAt: string,
  versions: Versions[]
}

interface Versions {
  id: string,
  thumbnail?: string,
  thumbnailId?: string,
  version: number,
  videoSize: number,
  videoType: string,
  videoUrl: string,
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  } else if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  } else if (bytes >= 1024) {
    return (bytes / 1024).toFixed(2) + " KB";
  }
  return bytes + " B";
}

export default function ProjectCard({ project, workspaceId, client, versionNo, tier }: ProjectCardProps) {
  const [status, setStatus] = useState(project.status)
  const [selectedVersion, setSelectedVersion] = useState(
    project.versions.reduce((max, current) => 
      (current.version > max.version ? current : max), 
      project.versions[0]
    )
  )
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(true)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress || user?.id
  const [userPermission, setUserPermission] = useState<string>("viewer")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-700"
      case "Pending Review":
        return "bg-amber-100 text-amber-700"
      case "Reviewed":
        return "bg-purple-100 text-purple-700"
      case "Rejected":
        return "bg-red-100 text-red-700"
      case "Completed":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  useEffect(() => {
    const fetchThumbnail = async () => {
      setIsLoadingThumbnail(true)
      try {
        // First check for thumbnailId
        if (selectedVersion.thumbnailId) {
          const thumbnailDoc = await getDoc(doc(db, "thumbnails", selectedVersion.thumbnailId))
          if (thumbnailDoc.exists()) {
            setThumbnail(thumbnailDoc.data().data)
            setIsLoadingThumbnail(false)
            return
          }
        }
        
        // If no thumbnailId or thumbnail not found, check for thumbnail property
        if (selectedVersion.thumbnail) {
          setThumbnail(selectedVersion.thumbnail)
          setIsLoadingThumbnail(false)
          return
        }

        // If neither exists, set thumbnail to null
        setThumbnail(null)
      } catch (error) {
        console.error("Error fetching thumbnail:", error)
        setThumbnail(null)
      } finally {
        setIsLoadingThumbnail(false)
      }
    }

    fetchThumbnail()
  }, [selectedVersion])

  useEffect(() => {
    const fetchUserPermission = async () => {
      try {
        const workspaceDoc = await getDoc(doc(db, "workspaces", workspaceId))
        if (workspaceDoc.exists()) {
          const workspaceData = workspaceDoc.data()
          const collaborator = workspaceData.collaborators.find((c: any) => c.email === userEmail)
          setUserPermission(collaborator?.permission || "viewer")
        }
      } catch (error) {
        console.error("Error fetching user permission:", error)
      }
    }

    fetchUserPermission()
  }, [workspaceId, userEmail])

  const canEdit = userPermission === "owner" || userPermission === "editor"

  const changeStatus = async (status: string) => {
    console.log("status", status)
    // update status in projects docs for this project
    for (const version of project.versions) {
      const versionDoc = doc(db, "projects", version.id)
      updateDoc(versionDoc, { status: status })
    }
    
    // update status in workspace doc for this project
    const workspaceDoc = doc(db, "workspaces", workspaceId)
    const workspaceSnapshot = await getDoc(workspaceDoc)
    if (workspaceSnapshot.exists()) {
      const workspaceData = workspaceSnapshot.data()
      const projectIndex = workspaceData.projects.findIndex((p: any) => p.versions[0].id === project.versions[0].id)
      if(projectIndex !== -1) {
        workspaceData.projects[projectIndex].status = status
        await updateDoc(workspaceDoc, { projects: workspaceData.projects })
      }
    }
    setStatus(status)
  }

  const handleDelete = () => {
    // Implement the delete logic here
    console.log("Deleting project")
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="relative">
        {isLoadingThumbnail ? (
          <div className="h-36 w-full flex items-center justify-center bg-gray-100">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : thumbnail ? (
          <Image
            src={thumbnail}
            alt={project.title}
            width={250}
            height={150}
            className="h-36 w-full object-cover"
          />
        ) : (
          <div className="h-36 w-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">No thumbnail available</span>
          </div>
        )}

        <Link href={`/dashboard/video/${selectedVersion.id}?workspaceId=${workspaceId}`}>
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-sky-600">
              <Play className="h-6 w-6" />
            </div>
          </div>
        </Link>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/dashboard/video/${selectedVersion.id}?workspaceId=${workspaceId}`} className="hover:underline">
            <h3 className="font-medium text-gray-900">{project.title}</h3>
          </Link>

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => tier === "free" ? setShowUpgradeDialog(true) : setShowDeleteDialog(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-3">
          <Select value={status} onValueChange={changeStatus}>
            <SelectTrigger className={`h-7 text-xs font-medium ${getStatusColor(status || "in progress")}`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Pending Review">Pending Review</SelectItem>
              <SelectItem value="Reviewed">Reviewed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Due: {project.dueDate}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Client: {client}
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
            Size: {formatBytes(selectedVersion.videoSize)}
          </div>
        </div>
      </div>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Required</DialogTitle>
            <DialogDescription>
              To delete projects, you need to upgrade to a paid plan. This feature is available in our Premium and Enterprise tiers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Link href="/pricing">
              <Button className="bg-sky-500 hover:bg-sky-600">
                View Pricing Plans
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete the project “{project.title}”? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={async () => {
                await handleDelete();
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


