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
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { storageService } from "@/lib/storage"

interface AddVideoDialogProps {
  workspaceName: string
  buttonText?: string
  onVideoAdded: (videoData: any) => void
}

export default function AddVideoDialog({ workspaceName, buttonText = "Add Video", onVideoAdded }: AddVideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateVideoThumbnail = (file: File): Promise<string> => {
    console.log("Generating Thumbnail")
    return new Promise((resolve, reject) => {
      console.log("Creating Video Element")
      const video = document.createElement('video')
      console.log("Video Element Created")
      
      // Set only necessary video attributes for thumbnail generation
      video.setAttribute('playsinline', '')
      video.setAttribute('muted', 'true')
      video.setAttribute('preload', 'metadata')
      
      // Create a FileReader to read the file
      const reader = new FileReader()
      
      reader.onload = (e) => {
        if (!e.target?.result) {
          reject(new Error('Failed to read file'))
          return
        }
        
        const videoUrl = e.target.result as string
        console.log("Created Video URL from FileReader")
        
        video.addEventListener('loadedmetadata', () => {
          console.log("Loaded Metadata")
          console.log("Video Duration:", video.duration)
          console.log("Video Width:", video.videoWidth)
          console.log("Video Height:", video.videoHeight)
          
          // Set current time to 1 second or duration if less than 1 second
          video.currentTime = Math.min(1, video.duration)
        })

        video.addEventListener('seeked', () => {
          console.log("Seeked")
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            console.log("Drawing Image")
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL('image/jpeg'))
          } else {
            reject(new Error('Could not create canvas context'))
          }
        })

        video.addEventListener('error', (e) => {
          console.error("Video Error:", e)
          reject(new Error('Error loading video'))
        })

        video.addEventListener('stalled', () => {
          console.log("Video Stalled")
        })

        video.addEventListener('suspend', () => {
          console.log("Video Suspend")
        })

        video.src = videoUrl
        console.log("Set Video Source")
        
        // Try to force load
        video.load()
        console.log("Called video.load()")
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      // Read the file as a data URL
      reader.readAsDataURL(file)
      console.log("Started reading file")
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
    if (!title || !selectedFile) return

    setIsUploading(true)

    console.log("Due Date: ", dueDate)
    try {
      // Get presigned URL from API
      const response = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { url, fields, key, cdnUrl } = await response.json()

      // Create form data with presigned fields
      const formData = new FormData()
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string)
      })
      formData.append('file', selectedFile)

      // Upload to S3 using presigned URL
      const uploadResponse = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      // Generate thumbnail and get duration
      const thumbnail = await generateVideoThumbnail(selectedFile)
      console.log("Generated Thumbnail")
      const duration = await getVideoDurationInSeconds(selectedFile)

      // Create thumbnail document first
      const thumbnailId = uuidv4()
      const thumbnailDoc = {
        id: thumbnailId,
        data: thumbnail,
        createdAt: serverTimestamp(),
      }
      
      // Add thumbnail to Firestore
      const thumbnailRef = doc(db, "thumbnails", thumbnailId)
      await setDoc(thumbnailRef, thumbnailDoc)

      const now = new Date()
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
        videoUrl: key,
        thumbnailId: thumbnailId, // Reference to the thumbnail document
      }

      console.log("Video Data: ", videoData)
      // Add to Firestore
      const docRef = doc(db, "projects", videoData.id)
      await setDoc(docRef, videoData)

      // Pass the video data to the parent component
      onVideoAdded(videoData)
      resetForm()
    } catch (error) {
      console.error("Error uploading video:", error)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDueDate(new Date().toISOString().split('T')[0])
    setSelectedFile(null)
    setIsUploading(false)
    setUploadProgress(0)
    setIsOpen(false)
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
            disabled={!dueDate || !title || !selectedFile || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Video"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

