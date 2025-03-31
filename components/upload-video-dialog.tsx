"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Project } from "@/lib/types"

interface UploadVideoDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (project: Project) => void
}

export default function UploadVideoDialog({ isOpen, onClose, onUpload }: UploadVideoDialogProps) {
  const [title, setTitle] = useState("")
  const [client, setClient] = useState("")
  const [status, setStatus] = useState("In Progress")
  const [releaseDate, setReleaseDate] = useState("")
  const [clientAccess, setClientAccess] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    // Simulate upload delay
    setTimeout(() => {
      const newProject: Project = {
        id: Date.now().toString(),
        title,
        client,
        status,
        releaseDate: releaseDate || new Date().toISOString().split("T")[0],
        clientAccess,
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnailUrl: "/placeholder.svg?height=200&width=300",
        comments: [],
        annotations: [],
        type: "video",
        createdAt: new Date().toISOString(),
        isFinalEdit: false,
      }

      onUpload(newProject)
      resetForm()
      setIsUploading(false)
    }, 1500)
  }

  const resetForm = () => {
    setTitle("")
    setClient("")
    setStatus("In Progress")
    setReleaseDate("")
    setClientAccess(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 text-white border-slate-800 max-w-md">
        <DialogHeader>
          <DialogTitle>Upload New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
              required
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client Name</Label>
            <Input
              id="client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Enter client name"
              required
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Project Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Review">Ready for Review</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
            <Switch id="clientAccess" checked={clientAccess} onCheckedChange={setClientAccess} />
            <Label htmlFor="clientAccess">Share with client</Label>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-700">
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading} className="bg-blue-900 hover:bg-blue-800">
              {isUploading ? "Uploading..." : "Upload Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

