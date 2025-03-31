"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Copy, Check } from "lucide-react"
import type { Project } from "@/lib/types"

interface ShareProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  project: Project
  onToggleAccess: () => void
}

export default function ShareProjectDialog({ isOpen, onClose, project, onToggleAccess }: ShareProjectDialogProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/project/${project.id}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 text-white border-slate-800 max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">Client Access</div>
              <div className="text-slate-400">Allow client to view this project</div>
            </div>
            <Switch checked={project.clientAccess} onCheckedChange={onToggleAccess} />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Project Link</div>
            <div className="flex">
              <Input value={shareUrl} readOnly className="bg-slate-800 border-slate-700 rounded-r-none" />
              <Button onClick={handleCopyLink} variant="outline" className="rounded-l-none border-slate-700">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="text-sm text-slate-400">
            {project.clientAccess
              ? "This project is currently visible to the client."
              : "This project is currently private and only visible to you."}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

