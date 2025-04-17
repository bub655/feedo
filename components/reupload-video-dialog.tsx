"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { db } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

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
    if (!file || !user) return

    setIsUploading(true)
    setError(null)

    try {
        console.log("currentVersion", currentVersion)
      const fileExtension = file.name.split('.').pop()
      const fileName = `${projectId}-${Date.now()}.${fileExtension}`

      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', fileName)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload video')
      const { url } = await response.json()

      const projectRef = doc(db, "projects", projectId)
      
      const newVersion = {
        id: crypto.randomUUID(),
        title: currentVersion.title,
        videoUrl: url,
        thumbnail: currentVersion.thumbnail,
        status: "processing",
        progress: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        comments: [],
        annotations: [],
        version: currentVersion.version + 1,
        metadata: {
          size: file.size,
          type: file.type
        }
      }

      await updateDoc(projectRef, {
        versions: arrayUnion(newVersion),
        currentVersion: newVersion.version,
        updatedAt: serverTimestamp()
      })

      onClose()
      router.push(`/dashboard/video/${newVersion.id}`)
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
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-gray-500">or drag and drop</p>
                </div>
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