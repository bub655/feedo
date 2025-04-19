"use client"

import { useState, useEffect } from "react"
import { Building, ChevronDown, ChevronUp, Users, Video } from "lucide-react"
import ProjectCard from "@/components/project-card"
import AddVideoDialog from "@/components/add-video-dialog"
import { db } from "@/lib/firebase"
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"

interface ProjectVersion {
  id: string,
  videoUrl: string,
  thumbnail: string,
  version: number,
  videoSize: number,
  videoType: string,
}

interface Project {
  id: string,
  title: string,
  numVersions: number,
  status: string,
  progress: number,
  createdAt: string,
  updatedAt: string,
  dueDate: string,
  versions: ProjectVersion[],
  size: number,
}

interface Workspace {
  id: string
  name: string
  description?: string
  members: string[]
  projects: Project[],
  size: number,
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
      // add project to firestore
      // const newProject = {
      //   id: videoData.id,
      //   description: videoData.description || '',
      //   title: videoData.title || 'Untitled Video',
      //   videoUrl: videoData.videoUrl || '',
      //   thumbnail: videoData.thumbnail || '',
      //   status: "In Progress",
      //   createdAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString(),
      //   comments: [],
      //   annotations: [],
      //   progress: 0,
      //   videoSize: videoData.videoSize || 0,
      //   videoDuration: videoData.videoDuration || 0,
      //   dueDate: new Date().toISOString(),
      // }

      // try {
      //   await setDoc(doc(db, "projects", videoData.id), newProject)
      // } catch (error) {
      //   console.error("Error adding project to projects firestore:", error)
      //   toast.error("Failed to add project to projects firestore. Please try again.")
      // }

      const newWorkspaceProject = {
        title: videoData.title || 'Untitled Video',
        numVersions: 1,
        status: "In Progress",
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        versions: [
          {
            id: videoData.id,
            videoUrl: videoData.videoUrl || '',
            thumbnail: videoData.thumbnail || '',
            version: 1,
            videoSize: videoData.videoSize || 0,
            videoType: videoData.videoType || '',
          }
        ],
        size: videoData.videoSize || 0,
      }

      // Get the workspace document
      const workspaceRef = doc(db, "workspaces", workspace.id)
      const workspaceDoc = await getDoc(workspaceRef)

      if (workspaceDoc.exists()) {
        const workspaceData = workspaceDoc.data()
        const projects = workspaceData.projects || []

        // Add new project to workspace
        projects.unshift(newWorkspaceProject)

        // udpate workspace size
        const newWorkspaceSize = workspaceData.size + newWorkspaceProject.size

        // Update workspace with new projects array
        await updateDoc(workspaceRef, {
          projects: projects,
          size: newWorkspaceSize,
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
          <AddVideoDialog workspaceName={workspace.name} onVideoAdded={handleVideoAdded}/>
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

