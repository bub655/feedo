"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Plus, Upload, X } from "lucide-react"
import { v4 as uuidv4 } from 'uuid'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, setDoc } from "firebase/firestore"
import { storageService } from "@/lib/storage"

interface AddVideoDialogProps {
  workspaceName: string
  buttonText?: string
  onVideoAdded: (videoData: any) => void
}

export default function AddVideoDialog({ workspaceName, buttonText = "Add Video", onVideoAdded }: AddVideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadeddata = () => {
        video.currentTime = 1
        video.onseeked = () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL('image/jpeg'))
          }
        }
      }
      video.src = URL.createObjectURL(file)
    })
  }

  const getVideoDurationInSeconds = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }
      video.src = URL.createObjectURL(file)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!title || !dueDate || !selectedFile) return

    setIsUploading(true)

    try {
      console.log("Starting upload process...")
      console.log("File details:", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      })

      // generate video thumbnail
      const thumbnail = await generateVideoThumbnail(selectedFile)
      console.log("Video thumbnail")

      // Get video duration
      const duration = await getVideoDurationInSeconds(selectedFile)
      console.log("Video duration:", duration)

      // Upload file using storage service
      console.log("Uploading file to server...")
      const { url, filename } = await storageService.uploadFile(selectedFile)
      console.log("File uploaded successfully:", { url, filename })

      const now = new Date()
      // Create video data object
      // local
      const videoUrl = "dev/" + filename
      // prod
      // const videoUrl = "prod/" + filename
      const videoData = {
        annotations: [],
        client: workspaceName,
        comments: [],
        createdAt: now,
        dueDate: dueDate,
        id: uuidv4(),
        progress: 0,
        status: "in progress",
        title: title,
        updatedAt: now,
        videoDuration: duration,
        videoSize: selectedFile.size,
        videoType: selectedFile.type,
        videoUrl: videoUrl,
      }

      // Log to console
      console.log("Saving video data to Firestore:", videoData)

      // Add to Firestore with document ID of videoData.id
      const docRef = doc(db, "projects", videoData.id)
      await setDoc(docRef, videoData)
      console.log("Document written with ID:", docRef.id)
      

      // Pass the video data to the parent component with the correct document ID
      onVideoAdded({...videoData, thumbnail: thumbnail})

      // Reset form
      setTitle("")
      setDueDate("")
      setSelectedFile(null)
      setIsUploading(false)
      setUploadProgress(0)
      setIsOpen(false)
    } catch (error) {
      console.error("Error uploading video:", error)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDueDate("")
    setSelectedFile(null)
    setIsUploading(false)
    setUploadProgress(0)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-sky-500 hover:bg-sky-600">
          <Plus className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add new video</DialogTitle>
          <DialogDescription>Upload a video to the workspace</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label htmlFor="video-title" className="text-sm font-medium">
              Video Title
            </label>
            <Input
              id="video-title"
              placeholder="Enter video title"
              className="w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="due-date" className="text-sm font-medium">
              Submission Date
            </label>
            <Input
              id="due-date"
              type="date"
              className="w-full"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Video</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">Drag and drop your video file here, or click to browse</p>
                  <p className="text-xs text-gray-400">Supported formats: MP4, MOV, AVI (max 500MB)</p>
                </>
              )}
              <Input
                type="file"
                accept="video/*"
                className="hidden"
                id="video-upload"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <label htmlFor="video-upload">
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click() // Trigger file input click
                  }}
                >
                  Browse Files
                </Button>
              </label>
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="bg-sky-500 hover:bg-sky-600"
            onClick={handleUpload}
            disabled={!title || !dueDate || !selectedFile || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Video"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

