"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { db } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion, setDoc, getDoc } from "firebase/firestore"
import { v4 as uuidv4 } from 'uuid'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

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

interface ReuploadVideoDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  currentVersion: any
  workspaceId: string
}

export default function ReuploadVideoDialog({
  isOpen,
  onClose,
  projectId,
  currentVersion,
  workspaceId,
}: ReuploadVideoDialogProps) {
  const router = useRouter()
  const { user } = useUser()
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Please select a valid video file')
      }
    }
  }

  const handleUpload = async () => {
    // put console.log throughout this function to make it readable and see whats going on and wheere it errors
    console.log("handleUpload function called")
    if (!file || !user) return

    setIsUploading(true)
    setError(null)

    try {
      // Calculate video duration
      console.log("file: ", file)
      const duration = await getVideoDurationInSeconds(file)
      console.log("duration: ", duration)

      // Generate thumbnail
      const video = document.createElement('video')
      video.preload = 'metadata'
      const thumbnailPromise = new Promise<string>((resolve) => {
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

      const thumbnail = await thumbnailPromise
      URL.revokeObjectURL(video.src)
      console.log("thumbnailPromise")


      // Get presigned URL from API
      const response = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { url, fields, key, cdnUrl } = await response.json()

      console.log("url: ", url)
      console.log("fields: ", fields)
      console.log("key: ", key)
      console.log("cdnUrl: ", cdnUrl)
      // Create form data with presigned fields
      const formData = new FormData()
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string)
      })
      formData.append('file', file)

      // Upload to S3 using presigned URL
      const uploadResponse = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      console.log("key: ", key)


      // const projectRef = doc(db, "projects", projectId)
      const now = new Date()
      const newVersion = {
        annotations: [],
        client: currentVersion.client,
        comments: [],
        createdAt: now,
        dueDate: currentVersion.dueDate,
        id: uuidv4(),
        progress: 0,
        status: "in progress",
        thumbnail: thumbnail,
        title: currentVersion.title,
        updatedAt: now,
        videoDuration: duration,
        videoSize: file.size,
        videoType: file.type,
        videoUrl: key,

      }

      // createw new project document
      const projectRef = doc(db, "projects", newVersion.id)
      await setDoc(projectRef, newVersion)
      console.log("new version created")
      console.log(newVersion)
      console.log("workspace id", workspaceId)
      // find the project in the workspace and update it with the new version
      const workspaceRef = doc(db, "workspaces", workspaceId)
      const workspace = await getDoc(workspaceRef)
      const workspaceData = workspace.data()
      console.log("workspace data")
      if (!workspaceData) throw new Error('Workspace not found')

      // get project index
      let foundProjectIndex = 0
      while (foundProjectIndex < workspaceData.projects.length) {
        for (const version of workspaceData.projects[foundProjectIndex].versions) {
          if(version.id === projectId) {
            break
          }
        }
        foundProjectIndex++
      }
      console.log("foundProjectIndex: ", foundProjectIndex)

      const projectIndex = foundProjectIndex - 1
      workspaceData.projects[projectIndex].versions.push({
        id: newVersion.id,
        videoUrl: newVersion.videoUrl,
        thumbnail: newVersion.thumbnail,
        videoType: newVersion.videoType,
        version: workspaceData.projects[projectIndex].versions.reduce((max: number, version: any) => Math.max(max, version.version), 0) + 1,
        videoSize: newVersion.videoSize,
      })
      workspaceData.projects[projectIndex].size = workspaceData.projects[projectIndex].size + newVersion.videoSize
      workspaceData.projects[projectIndex].updatedAt = now
      workspaceData.projects[projectIndex].numVersions = workspaceData.projects[projectIndex].versions.length
      console.log("workspace data", workspaceData)
      await updateDoc(workspaceRef, {
        projects: workspaceData.projects,
        size: workspaceData.projects[projectIndex].size + newVersion.videoSize,
      })
      console.log("workspace data updated")
      // await updateDoc(projectRef, {
      //   versions: arrayUnion(newVersion),
      //   currentVersion: newVersion.version,
      //   updatedAt: serverTimestamp()
      // })

      onClose()
      router.push(`/dashboard/video/${newVersion.id}?workspaceId=${workspaceId}`)
    } catch (error) {
      console.error('Error uploading video:', error)
      setError('Failed to upload video. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reupload Video</DialogTitle>
          <DialogDescription>
            Upload a new version of this video. Comments and annotations will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label
              htmlFor="video"
              className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
            >
              {file ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">Drag and drop your video file here, or click to browse</p>
                  <p className="text-xs text-gray-400">Supported formats: MP4, MOV, AVI (max 500MB)</p>
                </>
              )}
              
              <input
                id="video"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-gray-500">Uploading video...</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 