"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import type { Project, ProjectType } from "@/lib/types"

interface AddProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddProject: (project: Project) => void
}

export default function AddProjectDialog({ isOpen, onClose, onAddProject }: AddProjectDialogProps) {
  const [projectType, setProjectType] = useState<ProjectType>("storyboard")
  const [title, setTitle] = useState("")
  const [releaseDate, setReleaseDate] = useState("")
  const [isFinalEdit, setIsFinalEdit] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setVideoFile(file)

    // Create a video element to extract the first frame
    const video = document.createElement("video")
    video.preload = "metadata"

    video.onloadeddata = () => {
      // Create a canvas to draw the first frame
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw the first frame
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const thumbnailDataUrl = canvas.toDataURL("image/jpeg")
        setThumbnailUrl(thumbnailDataUrl)
      }

      // Clean up
      URL.revokeObjectURL(video.src)
    }

    // Set the video source to the file
    video.src = URL.createObjectURL(file)
  }

  const handleSubmit = () => {
    setIsLoading(true)

    // Validate form
    if (!title.trim()) {
      toast.error("Please enter a title")
      setIsLoading(false)
      return
    }

    if (projectType === "video" && !videoFile) {
      toast.error("Please upload a video file")
      setIsLoading(false)
      return
    }

    // Create a new project
    const newProject: Project = {
      id: Date.now().toString(),
      type: projectType,
      title: title.trim(),
      releaseDate: releaseDate || "Not set",
      isFinalEdit: false,
      clients: [],
      createdAt: new Date().toISOString(),
      thumbnailUrl: projectType === "video" ? thumbnailUrl : "/placeholder.svg?height=200&width=300",
      comments: [
        {
          id: "c1",
          text: "The intro looks great! Can we make the logo animation a bit slower?",
          author: "client",
          timestamp: "2025-03-15T14:30:00Z",
          videoTime: 12.5,
        },
      ],
      annotations: [
        {
          id: "a1",
          text: "Logo needs to be larger here",
          author: "client",
          timestamp: "2025-03-15T14:35:00Z",
          videoTime: 15.2,
          position: { x: 50, y: 30 },
        },
      ],

    }

    // Add the project
    setTimeout(() => {
      onAddProject(newProject)
      resetForm()
      setIsLoading(false)
    }, 500) // Simulate loading
  }

  const resetForm = () => {
    setProjectType("storyboard")
    setTitle("")
    setReleaseDate("")
    setIsFinalEdit(false)
    setVideoFile(null)
    setThumbnailUrl("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 text-white border-slate-800 max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Project Type</Label>
            <RadioGroup
              value={projectType}
              onValueChange={(value) => setProjectType(value as ProjectType)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="storyboard" value="storyboard" />
                <Label htmlFor="storyboard">Storyboard</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="video" value="video" />
                <Label htmlFor="video">Video Editing</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
              className="bg-slate-800 border-slate-700"
              required
            />
          </div>

          {projectType === "video" && (
            <div className="space-y-2">
              <Label htmlFor="video">Video File *</Label>
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="bg-slate-800 border-slate-700"
                required
              />
              {thumbnailUrl && (
                <div className="mt-2">
                  <p className="text-sm text-slate-400 mb-1">Preview:</p>
                  <img
                    src={thumbnailUrl || "/placeholder.svg"}
                    alt="Video thumbnail"
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="releaseDate">Release Date</Label>
            <Input
              id="releaseDate"
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="finalEdit"
              checked={isFinalEdit}
              onCheckedChange={(checked) => setIsFinalEdit(checked === true)}
            />
            {/* <Label htmlFor="finalEdit">Final Edit</Label> */}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="border-slate-700">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-blue-900 hover:bg-blue-800">
            {isLoading ? "Adding..." : "Add Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

