"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from "firebase/firestore"

interface WorkspaceMember {
  email: string
  permission: "view" | "edit" | "admin"
}

interface ShareWorkspaceDialogProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  currentUserEmail: string
}

export default function ShareWorkspaceDialog({ isOpen, onClose, workspaceId, currentUserEmail }: ShareWorkspaceDialogProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [newPermission, setNewPermission] = useState<"view" | "edit" | "admin">("view")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadWorkspaceMembers = async () => {
      if (!workspaceId) {
        console.warn("No workspace ID provided")
        setIsLoading(false)
        return
      }
      
      try {
        const workspaceDoc = await getDoc(doc(db, "workspaces", workspaceId))
        if (workspaceDoc.exists()) {
          const workspaceData = workspaceDoc.data()
          const collaborators = workspaceData.collaborators || []
          setMembers(collaborators)
        } else {
          console.warn("Workspace not found:", workspaceId)
          toast.error("Workspace not found")
        }
      } catch (error) {
        console.error("Error loading workspace members:", error)
        toast.error("Failed to load workspace members")
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      setIsLoading(true)
      loadWorkspaceMembers()
    }
  }, [workspaceId, isOpen])

  const handleAddMember = async () => {
    if (!newEmail) {
      toast.error("Please enter an email address")
      return
    }

    if (members.length >= 10) {
      toast.error("Maximum of 10 members allowed")
      return
    }

    if (members.some(member => member.email.toLowerCase() === newEmail.toLowerCase())) {
      toast.error("This email is already added")
      return
    }

    const newMember = { email: newEmail, permission: newPermission }
    setMembers([...members, newMember])
    setNewEmail("")
  }

  const handleRemoveMember = (email: string) => {
    if (email === currentUserEmail) {
      toast.error("Cannot remove yourself from the workspace")
      return
    }
    setMembers(members.filter(member => member.email !== email))
  }

  const handlePermissionChange = (email: string, permission: "view" | "edit" | "admin") => {
    if (email === currentUserEmail) {
      toast.error("Cannot change your own permission")
      return
    }
    setMembers(members.map(member => 
      member.email === email ? { ...member, permission } : member
    ))
  }

  const handleSave = async () => {
    try {
      // Update workspace document
      const workspaceRef = doc(db, "workspaces", workspaceId)
      await updateDoc(workspaceRef, {
        collaborators: members
      })

      // Update UID documents for all members
      for (const member of members) {
        const userDocRef = doc(db, "UID", member.email)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          // User exists, update their workspaces array
          const existingWorkspaces = userDoc.data()?.workspaces || []
          if (!existingWorkspaces.includes(workspaceId)) {
            await updateDoc(userDocRef, {
              workspaces: arrayUnion(workspaceId)
            })
          }
        } else {
          // User doesn't exist, create new document
          await setDoc(userDocRef, {
            email: member.email,
            workspaces: [workspaceId]
          })
        }
      }

      toast.success("Workspace members updated successfully")
      onClose()
    } catch (error) {
      console.error("Error saving workspace members:", error)
      toast.error("Failed to save workspace members")
    }
  }

  if (!workspaceId) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share Workspace</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500">Unable to share workspace. Please try again later.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share Workspace</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Workspace</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Add Team Member
            </label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={newPermission} onValueChange={(value: "view" | "edit" | "admin") => setNewPermission(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember}>Add</Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-500">Team members ({members.length}/10)</p>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800">{member.email}</span>
                    {member.email === currentUserEmail ? (
                      <span className="text-sm text-gray-500">(You)</span>
                    ) : (
                      <Select
                        value={member.permission}
                        onValueChange={(value: "view" | "edit" | "admin") => 
                          handlePermissionChange(member.email, value)
                        }
                      >
                        <SelectTrigger className="h-7 w-[100px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="edit">Edit</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {member.email !== currentUserEmail && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.email)}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 