"use client"

import { useState } from "react"
import { Building, ChevronDown, ChevronUp, Users, Video, Trash2, Plus, X } from "lucide-react"
import ProjectCard from "@/components/project-card"
import AddVideoDialog from "@/components/add-video-dialog"
import { db } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion, collection, addDoc, deleteDoc, getDoc, setDoc, arrayRemove, increment } from "firebase/firestore"
import { useUser } from "@clerk/nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface WorkspaceProject {
  createdAt: string,
  dueDate: string,
  numVersions: number,
  progress: number,
  size: number,
  status: string,
  title: string,
  updatedAt: string,
  versions: Version[]
}

interface Version {
  id: string,
  thumbnailId?: string,
  thumbnail?: string, 
  version: number,
  videoSize: number,
  videoType: string,
  videoUrl: string,
}

interface Collaborator {
  email: string
  permission: string
}

interface Workspace {
  collaborators: Collaborator[],
  createdAt: string,
  description: string,
  name: string,
  numMembers: number,
  projects: WorkspaceProject[],
  size: number,
  updatedAt: string,
  videos: number,
}

interface WorkspaceItemProps {
  workspace: Workspace
  isExpanded: boolean
  workspaceId: string
  onToggle: () => void
  storageLeft: number,
  tier: string
}

export default function WorkspaceItem({ workspace, workspaceId, isExpanded, onToggle, storageLeft, tier }: WorkspaceItemProps) {
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [newTeamMember, setNewTeamMember] = useState("")
  const [newTeamMemberPermission, setNewTeamMemberPermission] = useState("viewer")
  const [teamMemberError, setTeamMemberError] = useState<string | null>(null)
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress || user?.id
  const userPermission = workspace.collaborators.find(c => c.email === userEmail)?.permission || "viewer"
  const canEdit = userPermission === "owner" || userPermission === "editor"

  const handleVideoAdded = async (videoData: any) => {
    try {
      const version = {
        id: videoData.id,
        thumbnailId: videoData.thumbnailId,
        version: 1,
        videoSize: videoData.videoSize,
        videoType: videoData.videoType,
        videoUrl: videoData.videoUrl,
      }

      //save version to firestore subcollection of worksapce document
      // const versionsCollectionRef = collection(db, "workspaces", workspaceId, "versions")
      // // add version to subcollection and get the id
      // const docRef = await addDoc(versionsCollectionRef, version)
      // const versionId = docRef.id
      // console.log("versionId", versionId)

      const workspaceProject = {
        createdAt: videoData.createdAt,
        dueDate: videoData.dueDate,
        numVersions: 1,
        progress: videoData.progress,
        size: videoData.videoSize,
        status: videoData.status,
        title: videoData.title,
        updatedAt: videoData.updatedAt,
        versions: [version]
      }
      // console.log("workspaceProject", workspaceProject)
      // console.log("workspace", workspaceId)
      // Update workspace in Firestore
      const workspaceRef = doc(db, "workspaces", workspaceId)
      // console.log("workspaceRef", workspaceRef)
      await updateDoc(workspaceRef, {
        projects: [workspaceProject, ...(workspace.projects || [])],
        videos: (workspace.videos || 0) + 1,
        size: (workspace.size || 0) + videoData.videoSize
      })
      // console.log("workspace updated")
      // Update local state
      workspace.projects = [workspaceProject, ...(workspace.projects || [])]
      workspace.videos = (workspace.videos || 0) + 1
    } catch (error) {
      console.error("Error adding video to workspace:", error)
    }
  }

  const handleDeleteWorkspace = async () => {
    try {
      setIsDeleting(true);
    } catch (error) {
      console.error("Error deleting workspace:", error)
    } finally {
      setIsDeleting(false);
    }
  }

  const handleAddTeamMember = async () => {
    if (!newTeamMember || !newTeamMemberPermission) return

    // Check if member already exists
    const existingMember = workspace.collaborators.find(member => member.email === newTeamMember)
    if (existingMember) {
      setTeamMemberError("This team member is already on the list")
      return
    }

    try {
      const docRef = doc(db, "workspaces", workspaceId)
      const newMember = { email: newTeamMember, permission: newTeamMemberPermission }
      
      await updateDoc(docRef, {
        collaborators: arrayUnion(newMember),
        numMembers: increment(1)
      })

      // Add to UID collection
      const userDocRef = doc(db, "UID", newTeamMember)
      const userDoc = await getDoc(userDocRef)
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          workspaces: [workspaceId]
        })
      } else {
        await updateDoc(userDocRef, {
          workspaces: arrayUnion(workspaceId)
        })
      }

      // Update local state
      workspace.collaborators = [...workspace.collaborators, newMember]
      workspace.numMembers = (workspace.numMembers || workspace.collaborators.length) + 1
      
      setNewTeamMember("")
      setNewTeamMemberPermission("viewer")
      setTeamMemberError(null)
    } catch (error) {
      console.error("Error adding team member:", error)
      setTeamMemberError("Failed to add team member. Please try again.")
    }
  }

  const handleRemoveTeamMember = async (email: string) => {
    try {
      const memberToRemove = workspace.collaborators.find(member => member.email === email)
      if (!memberToRemove) return

      const docRef = doc(db, "workspaces", workspaceId)
      
      await updateDoc(docRef, {
        collaborators: arrayRemove(memberToRemove),
        numMembers: increment(-1)
      })

      // Remove from UID collection
      const userDocRef = doc(db, "UID", email)
      await updateDoc(userDocRef, {
        workspaces: arrayRemove(workspaceId)
      })

      // Update local state
      workspace.collaborators = workspace.collaborators.filter(member => member.email !== email)
      workspace.numMembers = Math.max(0, (workspace.numMembers || workspace.collaborators.length) - 1)
    } catch (error) {
      console.error("Error removing team member:", error)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-600">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{workspace.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span 
                className="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMembersDialog(true);
                }}
              >
                <Users className="h-4 w-4" />
                {workspace.collaborators.length} members
              </span>
              <span className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                {workspace.videos} videos
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && <AddVideoDialog 
            workspaceName={workspace.name} 
            onVideoAdded={handleVideoAdded} 
            storageLeft={storageLeft}
          />}
          {userPermission === "owner" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  if (tier === "free") {
                    setShowUpgradeDialog(true);
                  } else {
                    setShowDeleteDialog(true);
                  }
                }}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              {/* Upgrade dialog for free tier users */}
              <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upgrade Required</DialogTitle>
                    <DialogDescription>
                      To delete workspaces, you need to upgrade to a paid plan. This feature is available in our Premium and Enterprise tiers.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                      Cancel
                    </Button>
                    <Link href="/pricing">
                      <Button className="bg-sky-500 hover:bg-sky-600">
                        View Pricing Plans
                      </Button>
                    </Link>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Members dialog */}
              <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Workspace Members</DialogTitle>
                    <DialogDescription>
                      Members of "{workspace.name}" workspace
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Add new member section - only for owners/editors */}
                    {canEdit && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Invite Team Members</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter email address"
                            value={newTeamMember}
                            onChange={(e) => {
                              setNewTeamMember(e.target.value)
                              setTeamMemberError(null)
                            }}
                            className="flex-1"
                          />
                          <select
                            value={newTeamMemberPermission}
                            onChange={(e) => setNewTeamMemberPermission(e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <Button 
                            type="button" 
                            onClick={handleAddTeamMember} 
                            className="bg-sky-500 hover:bg-sky-600 px-3"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {teamMemberError && (
                          <div className="text-red-500 text-sm mt-1">
                            {teamMemberError}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Current members list */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <label className="text-sm font-medium">Current Members</label>
                      {workspace.collaborators.map((collaborator, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-sm font-medium">
                              {collaborator.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {collaborator.email}
                              </p>
                              {collaborator.email === userEmail && (
                                <p className="text-xs text-gray-500">(You)</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              collaborator.permission === 'owner' 
                                ? 'bg-purple-100 text-purple-800'
                                : collaborator.permission === 'editor'
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {collaborator.permission.charAt(0).toUpperCase() + collaborator.permission.slice(1)}
                            </span>
                            {/* Only show remove button for non-owners and if current user can edit */}
                            {canEdit && collaborator.permission !== 'owner' && collaborator.email !== userEmail && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTeamMember(collaborator.email)}
                                className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setShowMembersDialog(false)
                      setNewTeamMember("")
                      setNewTeamMemberPermission("viewer")
                      setTeamMemberError(null)
                    }}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Delete confirmation dialog for paid tiers */}
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Workspace</DialogTitle>
                  </DialogHeader>
                  <p>Are you sure you want to delete this workspace? This action cannot be undone.</p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-red-500 hover:bg-red-600"
                      onClick={async () => {
                        await handleDeleteWorkspace();
                        setShowDeleteDialog(false);
                        // Optionally, trigger a refresh or remove from UI
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-md text-gray-700">Projects</h4>
          </div>

          {workspace.projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {workspace.projects.map((project, index) => (
                <ProjectCard key={index} project={project} client={workspace.name} versionNo={-1} workspaceId={workspaceId} tier={tier} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No projects in this workspace yet</p>
              {canEdit && <AddVideoDialog
                workspaceName={workspace.name}
                buttonText="Add Your First Video"
                onVideoAdded={handleVideoAdded}
                storageLeft={storageLeft}
              />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

