"use client"

import { useState, useEffect } from "react"
import { Building, ChevronDown, ChevronUp, Users, Video } from "lucide-react"
import ProjectCard from "@/components/project-card"
import AddVideoDialog from "@/components/add-video-dialog"
import { db } from "@/lib/firebase"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"

interface ProjectVersion {
  id: string
  title: string
  videoUrl: string
  thumbnail: string
  status: string
  progress: number
  createdAt: string
  updatedAt: string
  comments: any[]
  annotations: any[]
  version: number
  videoSize?: number
  videoDuration?: number
}

interface Project {
  id: string
  name: string
  description?: string
  versions: ProjectVersion[]
  currentVersion: number
  createdAt: string
  updatedAt: string
}

interface Workspace {
  id: string
  name: string
  description?: string
  members: string[]
  projects: Project[]
  createdAt?: string
  updatedAt?: string
}

interface WorkspaceItemProps {
  workspace: Workspace
  isExpanded: boolean
  onToggle: () => void
}

export default function WorkspaceItem({ workspace, isExpanded, onToggle }: WorkspaceItemProps) {
  const { user } = useUser()
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const workspaceRef = doc(db, "workspaces", workspace.id)
        const workspaceDoc = await getDoc(workspaceRef)

        if (workspaceDoc.exists()) {
          const workspaceData = workspaceDoc.data()
          const projects = workspaceData.projects || []
          setProjects(projects)
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
        setProjects([])
      }
    }

    fetchProjects()
  }, [workspace.id])

  const handleVideoAdded = async (videoData: any) => {
    if (!user) return

    try {
      const newProject = {
        id: videoData.id,
        name: videoData.title || 'Untitled Video',
        description: videoData.description || '',
        versions: [{
          id: videoData.id,
          title: videoData.title || 'Untitled Video',
          videoUrl: videoData.videoUrl || '',
          thumbnail: videoData.thumbnail || '',
          status: "processing",
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          comments: [],
          annotations: [],
          version: 1,
          videoSize: videoData.videoSize || 0,
          videoDuration: videoData.videoDuration || 0
        }],
        currentVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Get the workspace document
      const workspaceRef = doc(db, "workspaces", workspace.id)
      const workspaceDoc = await getDoc(workspaceRef)

      if (workspaceDoc.exists()) {
        const workspaceData = workspaceDoc.data()
        const projects = workspaceData.projects || []

        // Add new project to workspace
        projects.push(newProject)

        // Update workspace with new projects array
        await updateDoc(workspaceRef, {
          projects: projects,
          updatedAt: new Date().toISOString()
        })

        // Update local state
        setProjects([...projects])
      }

      toast.success("Video added successfully!")
    } catch (error) {
      console.error("Error adding video:", error)
      toast.error("Failed to add video. Please try again.")
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
                {workspace.members.length} members
              </span>
              <span className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                {projects.length} projects
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

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  workspaceId={workspace.id}
                  versionHistory={project.versions}
                />
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

