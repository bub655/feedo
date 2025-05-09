"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import firebase_app, { db } from "@/lib/firebase"
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  FieldValue,
  increment,
  setDoc
} from "firebase/firestore"
import {
  ChevronLeft,
  Share2,
  Download,
  MessageSquare,
  User,
  Calendar,
  Users,
  CheckCircle,
  Upload,
  Plus,
  X,
  Clock,
  Trash2
} from "lucide-react"
import { useParams, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import VideoComment from "@/components/video-comment"
import VideoPlayer from "@/components/video-player"
import DashboardNavbar from "@/components/dashboard-navbar"
import AnnotationCanvas from "@/components/annotation-canvas"
import ReuploadVideoDialog from "@/components/reupload-video-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import ResolvedItems from "@/components/resolved-items"
import { Comment, Annotation } from "@/types/video"

interface VideoPageClientProps {
  projectId: string
}

interface Project {
  annotations: [],
  client: string,
  comments: [],
  createdAt: string,
  dueDate: string,
  id: string,
  progress: number,
  status: string,
  title: string,
  updatedAt: string,
  videoDuration: number,
  videoSize: number,
  videoType: string,
  videoUrl: string,
}

interface Resolver {
  id: string
  userName: string
  userImageUrl: string
  resolvedAt: Timestamp
}

export default function VideoPageClient({ projectId }: VideoPageClientProps) {
  const { user } = useUser()
  const params = useParams()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceId as string || searchParams.get('workspaceId') || ''
  const [project, setProject] = useState<Project | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [commentInput, setCommentInput] = useState("@time ")
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined)
  const [isReuploadDialogOpen, setIsReuploadDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [newTeamMember, setNewTeamMember] = useState("")
  const [newTeamMemberPermission, setNewTeamMemberPermission] = useState("viewer")
  const [teamMembers, setTeamMembers] = useState<{ email: string; permission: string }[]>([])
  const [teamMemberError, setTeamMemberError] = useState<string | null>(null)
  const [resolvedItems, setResolvedItems] = useState<(Comment | Annotation)[]>([])
  const [versions, setVersions] = useState<{ id: string; thumbnail: string; version: string; videoSize: number; videoType: string; videoUrl: string;}[]>([])
  const [userPermission, setUserPermission] = useState<string>("viewer")

  // Add useEffect to fetch workspace data and set team members
  useEffect(() => {
    // console.log("useEffect triggered with workspaceId:", workspaceId)
    
    const fetchWorkspaceData = async () => {
      // console.log("Starting to fetch workspace data")
      if (!workspaceId) {
        // console.log("No workspaceId provided, skipping fetch")
        return
      }
      
      try {
        // console.log("Fetching workspace document for ID:", workspaceId)
        const workspaceRef = doc(db, "workspaces", workspaceId)
        const workspaceDoc = await getDoc(workspaceRef)
        
        if (workspaceDoc.exists()) {
          // console.log("Workspace document found")
          const workspaceData = workspaceDoc.data()
          // console.log("Workspace data:", workspaceData)
          
          if (workspaceData.collaborators) {
            // console.log("Setting team members:", workspaceData.collaborators)
            //if permission is owner don't show in the team members list
            setTeamMembers(workspaceData.collaborators)
          } else {
            console.log("No collaborators found in workspace data")
          }
        } else {
          console.log("Workspace document does not exist")
        }
      } catch (error) {
        console.error("Error fetching workspace data:", error)
      }
    }

    fetchWorkspaceData()
  }, [workspaceId])

  // Add useEffect to log team members changes
  // useEffect(() => {
  //   console.log("Team members updated:", teamMembers)
  // }, [teamMembers])

  // Add useEffect to log project changes
  // useEffect(() => {
  //   console.log("Project updated:", project);
  // }, [project]);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        // console.log("fetching video: ", projectId)
        const docRef = doc(db, "projects", projectId)
        // console.log("docRef: ", docRef)
        const docSnap = await getDoc(docRef)
        // console.log("docSnap: ", docSnap)
        
        if (docSnap.exists()) {
          // console.log("video found")
          const projectData = docSnap.data()
          // console.log("projectData: ", projectData)
          setProject({
            id: projectData.id,
            ...projectData,
          } as Project)
          // console.log("project: ", project)
          // Set comments and annotations from the video document
          setComments(projectData.comments?.sort((a: Comment, b: Comment) => 
            b.createdAt.toMillis() - a.createdAt.toMillis()
          ) || [])
          setAnnotations(projectData.annotations || [])
          // console.log("Done setting")
        }
      } catch (error) {
        console.error("Error fetching video:", error)
      } finally {
        setLoading(false)
      }
    }
    // console.log("Fetching video")
    fetchVideo()
    // console.log("Done fetching")
  }, [projectId])

  useEffect(() => {
    const resolvedComments = comments.filter(comment => comment.isResolved)
    const resolvedAnnotations = annotations.filter(annotation => annotation.isResolved)
    setResolvedItems([...resolvedComments, ...resolvedAnnotations])
  }, [comments, annotations])

  useEffect(() => {
    const fetchVersions = async () => {
      if (!workspaceId || !projectId) return;
      
      try {
        console.log("fetching versions")
        const workspaceRef = doc(db, "workspaces", workspaceId);
        const workspaceDoc = await getDoc(workspaceRef);
        console.log("workspaceDoc retrieved")
        if (workspaceDoc.exists()) {
          const workspaceData = workspaceDoc.data();
          console.log("workspaceData retrieved")
          // go through all the versions in the worksapce and find the version that has the same as projectId.
          let projectVersions: any[] = [];
          for(const project of workspaceData.projects){
            console.log("project: ", project)
            for(const version of project.versions){
              console.log("version: ", version)
              if(version.id === projectId){
                // Push only the matching version's parent project versions
                projectVersions = project.versions;
                break;
              }
            }
          }
          // Sort versions by version number, newest first
          const sortedVersions = projectVersions.sort((a: any, b: any) => 
            parseInt(b.version) - parseInt(a.version)
          );
          console.log("sortedVersions: ", sortedVersions)
          console.log("projectVersions: ", projectVersions)
          
          setVersions(sortedVersions);
        }
      } catch (error) {
        console.error("Error fetching versions:", error);
      }
    };

    fetchVersions();
  }, [workspaceId, projectId]);

  useEffect(() => {
    const fetchUserPermission = async () => {
      if (!workspaceId || !user) return
      
      try {
        const workspaceDoc = await getDoc(doc(db, "workspaces", workspaceId))
        if (workspaceDoc.exists()) {
          const workspaceData = workspaceDoc.data()
          const collaborator = workspaceData.collaborators.find((c: any) => c.email === user.primaryEmailAddress?.emailAddress)
          setUserPermission(collaborator?.permission || "viewer")
        }
      } catch (error) {
        console.error("Error fetching user permission:", error)
      }
    }

    fetchUserPermission()
  }, [workspaceId, user])

  const canEdit = userPermission === "owner" || userPermission === "editor"

  const handleResolveComment = async (commentId: string) => {
    if (!project) return

    try {
      const docRef = doc(db, "projects", projectId)
      const updatedComment = comments.find(c => c.id === commentId)
      
      if (updatedComment) {
        const resolvedComment = {
          ...updatedComment,
          isResolved: true,
          resolved: {
            id: user?.id || '',
            userName: user?.fullName || user?.username || '',
            userImageUrl: user?.imageUrl || '',
            resolvedAt: Timestamp.now()
          }
        }

        // Remove the old comment and add the updated one
        await updateDoc(docRef, {
          comments: arrayRemove(updatedComment)
        })
        await updateDoc(docRef, {
          comments: arrayUnion(resolvedComment)
        })

        
        const updatedComments = comments.map(comment => 
          comment.id === commentId
            ? resolvedComment
            : comment
        )
        // updated firebase
        await updateDoc(docRef, {
          comments: updatedComments
        })
        setComments(updatedComments)
      }
    } catch (error) {
      console.error("Error resolving comment:", error)
    }
  }

  const handleAddComment = async () => {
    if (!user || !commentInput.trim() || !project) return

    try {
      const docRef = doc(db, "projects", projectId)
      const hasTimestamp = commentInput.startsWith("@time")
      const content = hasTimestamp ? commentInput.replace("@time", "").trim() : commentInput
      const timestamp = hasTimestamp ? formatTime(currentTime) : null

      const newComment: Comment = {
        id: crypto.randomUUID(),
        content,
        timestamp,
        createdAt: Timestamp.now(),
        userId: user.id,
        userName: user.fullName || user.username || 'Anonymous',
        userImageUrl: user.imageUrl,
        isResolved: false,
        resolved: null
      }

      await updateDoc(docRef, {
        comments: arrayUnion(newComment)
      })
      
      setComments(prevComments => [newComment, ...prevComments])
      setCommentInput("@time ")
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const handleSaveAnnotation = async (annotationData: string, annotationId?: string) => {
    if (!user || !project) return

    try {
      const docRef = doc(db, "projects", projectId)
      const timestamp = formatTime(currentTime)

      if (selectedAnnotation) {
        // Update existing annotation by ID
        const updatedAnnotations = annotations.map(annotation =>
          annotation.id === selectedAnnotation.id
            ? {
                ...annotation,
                data: annotationData,
                timestamp,
                timeFormatted: timestamp,
                updatedAt: Timestamp.now()
              }
            : annotation
        )
        await updateDoc(docRef, {
          annotations: updatedAnnotations
        })
        setAnnotations(updatedAnnotations)
      } else {
        // Create new annotation
        const newAnnotation: Annotation = {
          id: crypto.randomUUID(),
          data: annotationData,
          timestamp,
          timeFormatted: timestamp,
          createdAt: Timestamp.now(),
          userId: user.id,
          userName: user.fullName || user.username || 'Anonymous',
          userImageUrl: user.imageUrl,
          isResolved: false,
          resolved: null
        }
        await updateDoc(docRef, {
          annotations: arrayUnion(newAnnotation)
        })
        setAnnotations(prevAnnotations => [...prevAnnotations, newAnnotation])
      }
      setIsDrawing(false)
      setSelectedAnnotation(null)
    } catch (error) {
      console.error("Error saving annotation:", error)
    }
  }

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!project) return

    try {
      const docRef = doc(db, "projects", projectId)
      const updatedAnnotations = annotations.filter(a => a.id !== annotationId)

      await updateDoc(docRef, {
        annotations: updatedAnnotations
      })

      setAnnotations(updatedAnnotations)
      setSelectedAnnotation(null)
      setIsDrawing(false)
    } catch (error) {
      console.error("Error deleting annotation:", error)
    }
  }

  const handleResolveAnnotation = async (annotationId: string) => {
    if (!project) return

    //do the same as comment resolve
    const docRef = doc(db, "projects", projectId)
    const updatedAnnotation = annotations.find(a => a.id === annotationId)

    if (updatedAnnotation) {
      const resolvedAnnotation = {
        ...updatedAnnotation,
        isResolved: true,
        resolved: {
          id: user?.id || '',
          userName: user?.fullName || user?.username || '',
          userImageUrl: user?.imageUrl || '',
          resolvedAt: Timestamp.now()
        }
      }

      const updatedAnnotations = annotations.map(annotation => 
        annotation.id === annotationId
          ? resolvedAnnotation
          : annotation
      )

      await updateDoc(docRef, {
        annotations: updatedAnnotations
      })

      setAnnotations(updatedAnnotations)
    }
  }

  const formatTime = (timeInMs: number): string => {
    const minutes = Math.floor(timeInMs / 60000)
    const seconds = Math.floor((timeInMs % 60000) / 1000)
    const milliseconds = timeInMs % 1000
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}.${milliseconds.toString().padStart(3, '0')}`
  }

  const handleAnnotationClick = (annotation: Annotation) => {
    if (selectedAnnotation?.id !== annotation.id) {
      setSelectedAnnotation(annotation)
    } else {
      setSelectedAnnotation(null)
    }
    // Convert timestamp string to milliseconds
    const [minutesPart, secondsPart] = annotation.timestamp.split(':')
    const [seconds, milliseconds = '0'] = secondsPart.split('.')
    const timeInMs = parseInt(minutesPart) * 60000 + parseInt(seconds) * 1000 + parseInt(milliseconds)
    setSeekTo(timeInMs / 1000) // Convert to seconds for video seeking
    setTimeout(() => setSeekTo(undefined), 500)
    setIsPlaying(false)
    const video = document.querySelector('video')
    if (video) {
      video.pause()
    }
  }

  const handleCommentClick = (comment: Comment) => {
    setSelectedAnnotation(null)
    if (comment.timestamp) {
      // Convert timestamp string to milliseconds
      const [minutesPart, secondsPart] = comment.timestamp.split(':')
      const [seconds, milliseconds = '0'] = secondsPart.split('.')
      const timeInMs = parseInt(minutesPart) * 60000 + parseInt(seconds) * 1000 + parseInt(milliseconds)
      setSeekTo(timeInMs / 1000) // Convert to seconds for video seeking
      setTimeout(() => setSeekTo(undefined), 500)
      setIsPlaying(false)
      const video = document.querySelector('video')
      if (video) {
        video.pause()
      }
    }
  }

  const handleClearSelection = () => {
    setSelectedAnnotation(null)
  }

  const handleTimeUpdate = (time: number) => {
    const timeInMs = Math.floor(time * 1000) // Convert seconds to milliseconds
    setCurrentTime(timeInMs)
    if (selectedAnnotation) {
      const [minutesPart, secondsPart] = selectedAnnotation.timestamp.split(':')
      const [seconds, milliseconds = '0'] = secondsPart.split('.')
      const annotationTimeInMs = parseInt(minutesPart) * 60000 + parseInt(seconds) * 1000 + parseInt(milliseconds)
      if (Math.abs(timeInMs - annotationTimeInMs) > 0) { // 0 second tolerance
        setSelectedAnnotation(null)
      }
    }
  }

  const handleDownload = async () => {
    if (!project?.videoUrl) return

    try {
      const videoUrl = `${process.env.NEXT_PUBLIC_AWS_CDN_URL}${project.videoUrl}`
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      // Ensure the filename has a proper extension
      let filename = project.title || 'video'
      if (!filename.toLowerCase().endsWith('.mp4')) {
        filename += '.mp4'
      }
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading video:', error)
    }
  }

  const handleAddTeamMember = async () => {
    if (!newTeamMember || !newTeamMemberPermission) return

    // Check if member already exists
    const existingMember = teamMembers.find(member => member.email === newTeamMember)
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

      //need to UID too
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

      setTeamMembers(prev => [...prev, newMember])
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
      const docRef = doc(db, "workspaces", workspaceId)
      const updatedMembers = teamMembers.filter(member => member.email !== email)
      
      await updateDoc(docRef, {
        collaborators: updatedMembers,
        numMembers: increment(-1)
      })

      //need to remove from UID too
      const data = await getDoc(doc(db, "UID", email))
      console.log("removing team member: ", email)
      console.log("workspaces: ", data.data())
      const userDocRef = doc(db, "UID", email)
      await updateDoc(userDocRef, {
        workspaces: arrayRemove(workspaceId)
      })

      setTeamMembers(updatedMembers)
    } catch (error) {
      console.error("Error removing team member:", error)
    }
  }

  const handleResolvedItemClick = (item: Comment | Annotation) => {
    // If it's an annotation, set it as selected
    if ('data' in item) {
      setSelectedAnnotation(item);
    }

    if (item.timestamp) {
      const [minutesPart, secondsPart] = item.timestamp.split(':')
      const [seconds, milliseconds = '0'] = secondsPart.split('.')
      const timeInMs = parseInt(minutesPart) * 60000 + parseInt(seconds) * 1000 + parseInt(milliseconds)
      setSeekTo(timeInMs / 1000)
      setIsPlaying(false)
      const video = document.querySelector('video')
      if (video) {
        video.pause()
      }
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!project) return

    try {
      // Update status in projects collection for all versions
      for (const version of versions) {
        const versionDoc = doc(db, "projects", version.id)
        await updateDoc(versionDoc, { status: newStatus })
      }
      
      // Update status in workspace document
      const workspaceDoc = doc(db, "workspaces", workspaceId)
      const workspaceSnapshot = await getDoc(workspaceDoc)
      if (workspaceSnapshot.exists()) {
        const workspaceData = workspaceSnapshot.data()
        let foundProjectIndex = -1
        for (const project of workspaceData.projects) {
          const projectIndex = project.versions.findIndex((p: any) => p.id === versions[0].id)
          foundProjectIndex++
          if(projectIndex !== -1) {
            break
          }
        }
        if (foundProjectIndex !== -1) {
          workspaceData.projects[foundProjectIndex].status = newStatus
          await updateDoc(workspaceDoc, { projects: workspaceData.projects })
        }

      }

      // Update local state
      setProject(prev => prev ? { ...prev, status: newStatus } : null)
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-700"
      case "Pending Review":
        return "bg-amber-100 text-amber-700"
      case "Reviewed":
        return "bg-purple-100 text-purple-700"
      case "Rejected":
        return "bg-red-100 text-red-700"
      case "Completed":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!project) return
    try {
      const docRef = doc(db, "projects", projectId)
      const updatedComments = comments.filter(c => c.id !== commentId)
      await updateDoc(docRef, {
        comments: updatedComments
      })
      setComments(updatedComments)
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading video...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Video not found</p>
          <p className="mt-1 text-sm text-gray-500">The video you're looking for doesn't exist or has been removed.</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="mb-2 inline-block text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="mr-1 -mt-0.5 inline-block h-4 w-4" />
            Back to projects
                </Link>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">{project.title}</h1>
              <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5"
                    onClick={() => setIsReuploadDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    Reupload
                  </Button>
                  <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        size="sm" 
                        className="gap-1.5"
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share Video</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
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
                              <option value="client">Client</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <Button type="button" onClick={handleAddTeamMember} className="bg-sky-500 hover:bg-sky-600 px-3">
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>
                          {teamMemberError && (
                            <div className="text-red-500 text-sm mt-1">
                              {teamMemberError}
                            </div>
                          )}

                          {teamMembers.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-500 mb-2">Team members:</p>
                              <div className="space-y-2">
                                {teamMembers
                                  .filter(({ permission }) => permission !== "owner")
                                  .map(({ email, permission }) => (
                                    <div
                                      key={email}
                                      className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-800">{email}</span>
                                        <span className="text-sm text-gray-500">({permission})</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveTeamMember(email)}
                                        className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                      >
                                        <X className="h-4 w-4" />
                  </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="border-t pt-4">
                          <label className="text-sm font-medium">Private Link</label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              readOnly
                              value={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/video/${projectId}?workspaceId=${workspaceId}`}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/video/${projectId}`)
                              }}
                            >
                              Copy Link
                  </Button>
                </div>
              </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player with Annotation Canvas */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="aspect-video bg-black relative">
                <VideoPlayer 
                  videoUrl={`${process.env.NEXT_PUBLIC_AWS_CDN_URL}${project.videoUrl}`}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  seekTo={seekTo}
                />
                <AnnotationCanvas
                  isDrawing={isDrawing}
                  setIsDrawing={setIsDrawing}
                  onSave={handleSaveAnnotation}
                  onDelete={handleDeleteAnnotation}
                  selectedAnnotation={selectedAnnotation}
                  isPlaying={isPlaying}
                  onClearSelection={handleClearSelection}
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Project Details</h2>
                  <p className="text-sm text-gray-500">Last updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  {canEdit && (
                    <Select value={project.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className={`w-[180px] ${getStatusColor(project.status)}`}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In Progress" className="bg-blue-100 text-blue-700">In Progress</SelectItem>
                        <SelectItem value="Pending Review" className="bg-amber-100 text-amber-700">Pending Review</SelectItem>
                        <SelectItem value="Reviewed" className="bg-purple-100 text-purple-700">Reviewed</SelectItem>
                        <SelectItem value="Rejected" className="bg-red-100 text-red-700">Rejected</SelectItem>
                        <SelectItem value="Completed" className="bg-green-100 text-green-700">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Client:</span>
                    <span className="font-medium text-gray-900">{project.client}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Due Date:</span>
                    <span className="font-medium text-gray-900">{project.dueDate}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Format:</span>
                    <span className="font-medium text-gray-900">{project.videoType}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Size:</span>
                    <span className="font-medium text-gray-900">
                      {(project.videoSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </div>

                <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="mt-1" />
              </div>
            </div>

            {/* Resolved Items Section */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm max-h-[500px] overflow-y-auto">
              <ResolvedItems 
                items={resolvedItems}
                onItemClick={handleResolvedItemClick} 
              />
            </div>
          </div>

          {/* Comments and Annotations Section */}
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm h-[calc(100vh-5rem)]">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Comments & Annotations</h2>
            </div>
              </div>

              <div className="flex flex-col h-[calc(90vh-5rem)]">
                {/* Timeline Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {[...comments, ...annotations]
                    .filter(item => !item.isResolved)
                    .sort((a, b) => 
                      b.createdAt.toMillis() - a.createdAt.toMillis()
                    ).map(item => {
                    if ('data' in item && 'timeFormatted' in item) {
                      // Render annotation
                      return (
                        <div
                          key={item.id}
                          className={`group relative mb-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer ${
                            item.id === selectedAnnotation?.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200"
                          }`}
                          onClick={() => handleAnnotationClick(item)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={item.userImageUrl} alt={item.userName} />
                              <AvatarFallback>{item.userName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{item.userName}</span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteAnnotation(item.id)
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleResolveAnnotation(item.id)
                                    }}
                                    className="text-gray-400 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-5 w-5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <Badge variant="secondary" className="bg-blue-100">
                                  {item.timeFormatted.toString().substring(0, item.timeFormatted.toString().length-2)}
                                </Badge>
                                <span className="text-sm text-gray-500">{new Date(item.createdAt.toDate()).toLocaleString()}</span>
                              </div>
                              <div className="mt-2 aspect-video overflow-hidden rounded-md">
                                <img
                                  src={item.data}
                                  alt={`Annotation at ${item.timeFormatted}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    } else if ('content' in item) {
                      // Render comment
                      return (
                        <VideoComment
                          key={item.id}
                          user={{
                            id: item.userId,
                            name: item.userName,
                            imageUrl: item.userImageUrl
                          }}
                          content={item.content}
                          time={new Date(item.createdAt.toDate()).toLocaleString()}
                          timestamp={item.timestamp || undefined}
                          isResolved={item.isResolved}
                          resolvedBy={item.resolved ? {
                            id: item.resolved.id,
                            name: item.resolved.userName,
                            imageUrl: item.resolved.userImageUrl
                          } : undefined}
                          onResolve={() => handleResolveComment(item.id)}
                          onClick={() => handleCommentClick(item)}
                          onDelete={() => handleDeleteComment(item.id)}
                        />
                      )
                    }
                    return null;
                  })}
                </div>

                {/* Comment Input */}
                <div className="border-t border-gray-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                      <AvatarFallback>{user?.fullName?.[0] || user?.username?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-100 font-mono">
                          {formatTime(currentTime)}
                        </Badge>
                        <span className="text-xs text-gray-500">Type @time to add timestamp</span>
                      </div>
                      <div className="relative">
                      <textarea
                          placeholder="Add a comment..."
                          value={commentInput}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const cursorPosition = e.target.selectionStart;
                            
                            // Only delete @time if we're deleting and cursor is at position 5 (right after @time)
                            if (newValue.length < commentInput.length && 
                                commentInput.startsWith("@time") && 
                                cursorPosition === 5) {
                              setCommentInput(newValue.replace(/^@time\s*/, ''));
                            } else {
                              setCommentInput(newValue);
                            }
                          }}
                          className="w-full resize-none rounded-lg border border-gray-200 p-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        rows={3}
                        />
                        {commentInput.startsWith("@time") && (
                          <div 
                            className="absolute top-2 left-2 text-sm pointer-events-none"
                            style={{ 
                              background: 'white',
                              width: '42px',
                              color: '#2563eb'
                            }}
                          >
                            @time
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          className="bg-sky-500 hover:bg-sky-600"
                          onClick={handleAddComment}
                          disabled={!commentInput.trim()}
                        >
                          Add Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                  </div>
                </div>

            {/* Versions List */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Version History</h2>
                </div>
                  </div>
              <div className="px-6 py-4">
                {versions.length === 0 ? (
                  <p className="text-sm text-gray-500">No previous versions found</p>
                ) : (
                  <div className="space-y-3">
                    {versions.map((version, index) => (
                      <div 
                        key={version.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                            <span className="text-sm font-medium">v{version.version}</span>
                </div>
                          <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {version.videoType} • {(version.videoSize / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                <p className="text-xs text-gray-500">
                                  Version {version.version}
                                </p>
                        </div>
                    </div>
                  </div>
                        </div>
                        <Link 
                          href={`/dashboard/video/${version.id}?workspaceId=${workspaceId}`}
                          className="text-sm font-medium text-sky-600 hover:text-sky-700"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                    </div>
                  </div>
                </div>
              </div>
      <ReuploadVideoDialog
        isOpen={isReuploadDialogOpen}
        onClose={() => setIsReuploadDialogOpen(false)}
        projectId={projectId}
        currentVersion={project}
        workspaceId={workspaceId}
      />
    </div>
  )
} 