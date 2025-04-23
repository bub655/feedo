"use client"

import { useState } from "react"
import { Building, ChevronDown, ChevronUp, Users, Video } from "lucide-react"
import ProjectCard from "@/components/project-card"
import AddVideoDialog from "@/components/add-video-dialog"
import { db } from "@/lib/firebase"
import { doc, updateDoc, arrayUnion, collection, addDoc } from "firebase/firestore"

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
  thumbnail: string,
  version: number,
  videoSize: number,
  videoType: string,
  videoUrl: string,
}

interface Collaborator {
  name: string
  email: string
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
}

export default function WorkspaceItem({ workspace, workspaceId, isExpanded, onToggle }: WorkspaceItemProps) {
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false)

  const handleVideoAdded = async (videoData: any) => {
    try {
      const version = {
        id: videoData.id,
        thumbnail: videoData.thumbnail,
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
      console.log("workspaceProject", workspaceProject)
      console.log("workspace", workspaceId)
      // Update workspace in Firestore
      const workspaceRef = doc(db, "workspaces", workspaceId)
      console.log("workspaceRef", workspaceRef)
      await updateDoc(workspaceRef, {
        projects: [workspaceProject, ...(workspace.projects || [])],
        videos: (workspace.videos || 0) + 1,
        size: (workspace.size || 0) + videoData.videoSize
      })
      console.log("workspace updated")
      // Update local state
      workspace.projects = [workspaceProject, ...(workspace.projects || [])]
      workspace.videos = (workspace.videos || 0) + 1
    } catch (error) {
      console.error("Error adding video to workspace:", error)
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
              <span className="flex items-center gap-1">
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
          <AddVideoDialog workspaceName={workspace.name} onVideoAdded={handleVideoAdded} />
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
                <ProjectCard key={index} project={project} client={workspace.name} versionNo={-1} workspaceId={workspaceId}/>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No projects in this workspace yet</p>
              <AddVideoDialog
                workspaceName={workspace.name}
                buttonText="Add Your First Video"
                onVideoAdded={handleVideoAdded}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

