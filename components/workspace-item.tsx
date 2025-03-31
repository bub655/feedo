"use client"

import { useState } from "react"
import { Building, ChevronDown, ChevronUp, Users, Video } from "lucide-react"
import ProjectCard from "@/components/project-card"
import AddVideoDialog from "@/components/add-video-dialog"

interface Project {
  id: string
  title: string
  thumbnail: string
  status: string
  dueDate: string
  client: string
  type: string
  videoUrl?: string | null
}

interface Workspace {
  id: string
  name: string
  description?: string
  members: number
  teamMembers?: string[]
  videos: number
  projects: Project[]
}

interface WorkspaceItemProps {
  workspace: Workspace
  isExpanded: boolean
  onToggle: () => void
  onAddVideo: (videoData: any) => void
}

export default function WorkspaceItem({ workspace, isExpanded, onToggle, onAddVideo }: WorkspaceItemProps) {
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false)

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
                {workspace.members} members
              </span>
              <span className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                {workspace.videos} videos
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AddVideoDialog workspaceName={workspace.name} onVideoAdded={onAddVideo} />
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
              {workspace.projects.map((project) => (
                <ProjectCard key={project.id} project={project} workspaceId={workspace.id}/>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No projects in this workspace yet</p>
              <AddVideoDialog
                workspaceName={workspace.name}
                buttonText="Add Your First Video"
                onVideoAdded={onAddVideo}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

