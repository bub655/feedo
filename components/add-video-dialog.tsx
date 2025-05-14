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
import { Progress } from "@/components/ui/progress"

interface AddVideoDialogProps {
  workspaceName: string
  onVideoAdded: (videoData: any) => Promise<void>
  buttonText?: string
  storageLeft: number // in GB
}

export default function AddVideoDialog({ workspaceName, onVideoAdded, buttonText = "Add Video", storageLeft }: AddVideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateVideoThumbnail = (file: File): Promise<string> => {
    console.log("Generating Thumbnail")
    return new Promise((resolve, reject) => {
      console.log("Creating Video Element")
      const video = document.createElement('video')
      console.log("Video Element Created")
      
      video.setAttribute('playsinline', '')
      video.setAttribute('muted', 'true')
      video.setAttribute('preload', 'auto')
      
      const timeout = setTimeout(() => {
        console.error("Thumbnail generation timed out")
        URL.revokeObjectURL(video.src)
        reject(new Error('Thumbnail generation timed out'))
      }, 10000) // 10 second timeout
      
      video.addEventListener('loadedmetadata', () => {
        console.log("Loaded Metadata")
        console.log("Video Duration:", video.duration)
        console.log("Original Video Width:", video.videoWidth)
        console.log("Original Video Height:", video.videoHeight)
        
        // Set video size to a reasonable size for thumbnail
        const maxSize = 320
        const scale = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight)
        video.width = video.videoWidth * scale
        video.height = video.videoHeight * scale
        console.log("Scaled Video Width:", video.width)
        console.log("Scaled Video Height:", video.height)
        
        // Seek to 10% of the video duration
        const seekTime = Math.max(1, video.duration * 0.1)
        console.log("Seeking to time:", seekTime)
        video.currentTime = seekTime
      })
  
      video.addEventListener('seeked', () => {
        console.log("Seeked to position")
        // Add a small delay to ensure the frame is ready
        setTimeout(() => {
          console.log("Creating canvas after delay")
          const canvas = document.createElement('canvas')
          canvas.width = video.width
          canvas.height = video.height
          console.log("Canvas size:", canvas.width, "x", canvas.height)
          
          const ctx = canvas.getContext('2d')
          if (ctx) {
            console.log("Drawing Image")
            // Fill background with white in case video is transparent
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            console.log("Image drawn, converting to data URL")
            // Use lower quality for faster processing
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
            console.log("Generated data URL")
            URL.revokeObjectURL(video.src)
            clearTimeout(timeout)
            resolve(dataUrl)
          } else {
            console.error("Could not create canvas context")
            URL.revokeObjectURL(video.src)
            clearTimeout(timeout)
            reject(new Error('Could not create canvas context'))
          }
        }, 100) // Small delay to ensure frame is ready
      })
  
      video.addEventListener('error', (e) => {
        console.error("Video Error:", e)
        URL.revokeObjectURL(video.src)
        clearTimeout(timeout)
        reject(new Error('Error loading video'))
      })
  
      video.addEventListener('stalled', () => {
        console.log("Video Stalled")
      })
  
      video.addEventListener('suspend', () => {
        console.log("Video Suspend")
      })
  
      const objectUrl = URL.createObjectURL(file)
      console.log("Created Object URL")
      video.src = objectUrl
      console.log("Set Video Source")
      
      // Try to force load
      video.load()
      console.log("Called video.load()")
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
    setError(null)
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    setError(null)
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    setError(null)
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const uploadPart = async (presignedUrl: string, part: Blob, partNumber: number, type: string) => {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: part,
      headers: {
        'Content-Type': type,
      },
    })
    if (!response.ok) throw new Error(`Failed to upload part ${partNumber}`)
    const etag = response.headers.get('ETag')
    return { ETag: etag, PartNumber: partNumber }
  }

  const handleUpload = async () => {
    const startTime = new Date()
    console.log("Start Time: ", startTime)
    if (!title || !selectedFile) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)
    console.log("Starting upload process...")

    if (selectedFile.size > storageLeft * 1024 * 1024 * 1024) {
      setError(`You only have ${storageLeft.toFixed(2)}GB left. You cannot upload this video.`)
      setIsUploading(false)
      setUploadProgress(0)
      return
    }
    try {
      const filename = title + "-" + uuidv4() + ".mp4"
      const FILE_SIZE_THRESHOLD = 20 * 1024 * 1024 // 20MB
      let key: string

      if (selectedFile.size > FILE_SIZE_THRESHOLD) {
        // Multipart upload for large files
        console.log("Starting multipart upload for large file")
        const response = await fetch('/api/upload/multipart/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: filename,
            contentType: selectedFile.type,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to start multipart upload')
        }

        let {uploadId} = await response.json()

        let totalSize = selectedFile.size
        let chunkSize = 10 * 1024 * 1024 // 10MB
        let numChunks = Math.ceil(totalSize / chunkSize)

        let presignedUrls = await fetch('/api/upload/multipart/presign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileName: filename, uploadId: uploadId, partNumbers: numChunks }),
        })

        if (!presignedUrls.ok) {
          throw new Error('Failed to get presigned URLs')
        }

        let { presignedUrls: presignedUrlsData } = await presignedUrls.json()
        console.log("Presigned URLs: ", presignedUrlsData)

        let parts: any[] = []
        const uploadPromises = []

        for (let i = 0; i < numChunks; i++) {
          let start = i * chunkSize;
          let end = Math.min(start + chunkSize, totalSize)
          let part = selectedFile.slice(start, end)
          let presignedUrl = presignedUrlsData[i]

          uploadPromises.push(uploadPart(presignedUrl, part, i + 1, selectedFile.type))
        }

        const uploadResponses = await Promise.all(uploadPromises)
        uploadResponses.forEach((response, i) => {
          parts.push({
            ETag: response.ETag,
            PartNumber: response.PartNumber,
          })
        })

        const completeResponse = await fetch('/api/upload/multipart/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filename: filename, uploadId: uploadId, parts: parts }),
        })

        if (!completeResponse.ok) {
          throw new Error('Failed to complete multipart upload')
        }

        let { data, key: uploadKey, fields, cdnUrl } = await completeResponse.json()
        key = uploadKey
        console.log("MULTIPART UPLOAD KEY: ", key)
        console.log("Complete Response: ", data)
      } else {
        // Single upload for small files
        console.log("Starting single upload for small file")
        const response = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: filename,
            contentType: selectedFile.type,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get upload URL')
        }

        const { url, fields, key: uploadKey } = await response.json()
        key = uploadKey
        console.log("Single Upload Key: ", key)
        const formData = new FormData()
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value as string)
        })
        formData.append('file', selectedFile)

        const uploadResponse = await fetch(url, {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Upload failed')
        }
      }

      // Generate thumbnail and get duration
      console.log("THE PATH SHOULD BE: ", key)
      console.log("Generating thumbnail")
      let thumbnail: string
      try {
        thumbnail = await generateVideoThumbnail(selectedFile)
        console.log("Thumbnail generated")
      } catch (error) {
        console.error("Failed to generate thumbnail, using placeholder:", error)
        thumbnail = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" // 1x1 transparent PNG
      }
      const duration = await getVideoDurationInSeconds(selectedFile)
      console.log("Duration: ", duration)

      // Create thumbnail document first
      const thumbnailId = uuidv4()
      const thumbnailDoc = {
        id: thumbnailId,
        data: thumbnail,
        createdAt: serverTimestamp(),
      }
      
      const thumbnailRef = doc(db, "thumbnails", thumbnailId)
      await setDoc(thumbnailRef, thumbnailDoc)

      const now = new Date()
      const videoId = uuidv4()
      const videoData = {
        annotations: [],
        client: workspaceName,
        comments: [],
        createdAt: now,
        dueDate: dueDate,
        id: videoId,
        progress: 0,
        status: "In Progress",
        title: title,
        updatedAt: now,
        videoDuration: duration,
        videoSize: selectedFile.size,
        videoType: selectedFile.type,
        videoUrl: key,
        thumbnailId: thumbnailId,
      }

      const videoRef = doc(db, "projects", videoId)
      await setDoc(videoRef, videoData)

      const endTime = new Date()
      console.log("end time: ", endTime)
      console.log("time taken in milliseconds: ", endTime.getTime() - startTime.getTime())
      await onVideoAdded(videoData)
      resetForm()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An error occurred while uploading the video")
      }
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
    setError(null)
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
          <DialogTitle>Add Video to {workspaceName}</DialogTitle>
          <DialogDescription>
            Upload a video file to add to this workspace. Maximum file size: {storageLeft}GB
          </DialogDescription>
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
              Due Date
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

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

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

