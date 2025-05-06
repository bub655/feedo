"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { db } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion, setDoc, getDoc, serverTimestamp, increment } from "firebase/firestore"
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
  const [userTier, setUserTier] = useState<string>("free")
  const [storageUsed, setStorageUsed] = useState<number>(0)

  // Get storage limit based on tier
  const getStorageLimit = (tier: string) => {
    switch (tier) {
      case "premium":
        return 2048 // 2TB
      case "enterprise":
        return 8192 // 8TB
      default: // free
        return 2 // 2GB
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDocRef = doc(db, "UID", user.primaryEmailAddress?.emailAddress || user.id);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserTier(userData.tier || "free");
          
          // Calculate total storage used across all workspaces
          const workspaceIds = Array.from(new Set(userData.workspaces || []));
          let totalStorageUsed = 0;
          const userEmail = user.primaryEmailAddress?.emailAddress || user.id;
          
          for (const workspaceId of workspaceIds) {
            const workspaceDoc = await getDoc(doc(db, "workspaces", workspaceId as string));
            if (workspaceDoc.exists()) {
              const workspaceData = workspaceDoc.data();
              // Check if user has owner or editor permissions
              const userPermission = workspaceData.collaborators?.find(
                (collaborator: { email: string; permission: string }) => 
                collaborator.email === userEmail
              )?.permission;

              // Only count storage if user is owner or editor
              if (userPermission === "owner" || userPermission === "editor") {
                totalStorageUsed += (workspaceData.size || 0) / (1024 * 1024 * 1024); // Convert bytes to GB
              }
            }
          }
          
          setStorageUsed(totalStorageUsed);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]);

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
    console.log("handleUpload function called")
    const startTime = new Date()
    console.log("start time: ", startTime)
    if (!file || !user) return

    // Double check storage limit before upload
    const storageLimit = getStorageLimit(userTier) // 2 gb
    const newFileSizeGB = file.size / (1024 * 1024 * 1024) // 0.12 GB
    // const currentVersionSizeGB = currentVersion.videoSize / (1024 * 1024 * 1024) // 0.1 2GB
    console.log("storageLimit: ", storageLimit)
    console.log("newFileSizeGB: ", newFileSizeGB)
    console.log("storageUsed: ", storageUsed)
    const newStorageUsed = storageUsed + newFileSizeGB
    console.log("newStorageUsed: ", newStorageUsed)
    if (newStorageUsed > storageLimit) {
      //say how much is left instead of saying how much is needed
      setError(`You have ${storageLimit - newStorageUsed}GB of storage left. Please delete some content or upgrade your plan.`)
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // console.log("current version: ", currentVersion)

      const filename = currentVersion.title + "-" + uuidv4() + ".mp4"
      // console.log("filename: ", filename)
      const FILE_SIZE_THRESHOLD = 20 * 1024 * 1024 // 20MB
      let key: string

      if (file.size > FILE_SIZE_THRESHOLD) {
        // Multipart upload for large files
        console.log("Starting multipart upload for large file")
        const response = await fetch('/api/upload/multipart/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: filename,
            contentType: file.type,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to start multipart upload')
        }

        let {uploadId} = await response.json()

        let totalSize = file.size
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
        // console.log("Presigned URLs: ", presignedUrlsData)

        let parts: any[] = []
        const uploadPromises = []

        for (let i = 0; i < numChunks; i++) {
          let start = i * chunkSize;
          let end = Math.min(start + chunkSize, totalSize)
          let part = file.slice(start, end)
          let presignedUrl = presignedUrlsData[i]

          uploadPromises.push(uploadPart(presignedUrl, part, i + 1, file.type))
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
        // console.log("Complete Response: ", data)
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
            contentType: file.type,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get upload URL')
        }

        const { url, fields, key: uploadKey } = await response.json()
        key = uploadKey
        // console.log("Single Upload Key: ", key)
        const formData = new FormData()
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value as string)
        })
        formData.append('file', file)

        const uploadResponse = await fetch(url, {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Upload failed')
        }
      }

      // Generate thumbnail and get duration
      // console.log("THE PATH SHOULD BE: ", key)
      // console.log("Generating thumbnail")
      let thumbnail: string
      try {
        thumbnail = await generateVideoThumbnail(file)
        console.log("Thumbnail generated")
      } catch (error) {
        console.error("Failed to generate thumbnail, using placeholder:", error)
        thumbnail = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" // 1x1 transparent PNG
      }
      const duration = await getVideoDurationInSeconds(file)
      console.log("Duration: ", duration)

      // Create thumbnail document first
      const thumbnailId = uuidv4()
      const thumbnailDoc = {
        id: thumbnailId,
        data: thumbnail,
        createdAt: serverTimestamp(),
      }

      // console.log("thumbnailDoc: ", thumbnailDoc)
      const thumbnailRef = doc(db, "thumbnails", thumbnailId)
      await setDoc(thumbnailRef, thumbnailDoc)
      // console.log("thumbnail saved to thumbnails collection")
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
        status: currentVersion.status,
        thumbnailId: thumbnailId,
        title: currentVersion.title,
        updatedAt: now,
        videoDuration: duration,
        videoSize: file.size,
        videoType: file.type,
        videoUrl: key,
      }

      // create new project document
      const projectRef = doc(db, "projects", newVersion.id)
      await setDoc(projectRef, newVersion)
      console.log("new version created")
      // console.log(newVersion)
      // console.log("workspace id", workspaceId)
      // find the project in the workspace and update it with the new version
      const workspaceRef = doc(db, "workspaces", workspaceId)
      const workspace = await getDoc(workspaceRef)
      const workspaceData = workspace.data()
      // console.log("workspace data")
      if (!workspaceData) throw new Error('Workspace not found')

      // get project index
      console.log("workspaceData.projects: ", workspaceData.projects)
      let foundProjectIndex = 0
      let check = false
      while (foundProjectIndex < workspaceData.projects.length && !check) {

        for (const version of workspaceData.projects[foundProjectIndex].versions) {
          if(version.id === projectId) {
            console.log("found project index", foundProjectIndex)
            console.log("version", version.id)
            check = true
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
        thumbnailId: newVersion.thumbnailId,
        videoType: newVersion.videoType,
        version: workspaceData.projects[projectIndex].versions.reduce((max: number, version: any) => Math.max(max, version.version), 0) + 1,
        videoSize: newVersion.videoSize,
      })
      workspaceData.projects[projectIndex].size += newVersion.videoSize
      workspaceData.projects[projectIndex].updatedAt = now
      workspaceData.projects[projectIndex].numVersions = workspaceData.projects[projectIndex].versions.length
      // delete the first element in the project.versions array until the size is less than 1048576
      while (JSON.stringify(workspaceData).length >= 1048576) {
        workspaceData.projects[projectIndex].versions.shift()
        workspaceData.projects[projectIndex].size = workspaceData.projects[projectIndex].versions.reduce((sum: number, version: any) => sum + version.videoSize, 0)
        workspaceData.projects[projectIndex].numVersions = workspaceData.projects[projectIndex].versions.length
      }
      // console.log("workspace data", workspaceData)
      // console.log("workspace data length", JSON.stringify(workspaceData).length); // in bytes
      //projects
      // console.log("workspace data projects length", JSON.stringify(workspaceData.projects).length)
      // console.log("workspace data projects", workspaceData.projects)

      await updateDoc(workspaceRef, {
        projects: workspaceData.projects,
        size: increment(newVersion.videoSize),
      })
      console.log("workspace data updated")
      // await updateDoc(projectRef, {
      //   versions: arrayUnion(newVersion),
      //   currentVersion: newVersion.version,
      //   updatedAt: serverTimestamp()
      // })

      const endTime = new Date()
      console.log("end time: ", endTime)
      console.log("time taken in milliseconds: ", endTime.getTime() - startTime.getTime())

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
                        setError(null)
                      }}
                    >
                      <X className="h-4 w-4"/>
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