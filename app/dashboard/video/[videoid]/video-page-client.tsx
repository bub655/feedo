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
  FieldValue
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
} from "lucide-react"
import { useParams, useSearchParams } from 'next/navigation'

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import VideoComment from "@/components/video-comment"
import VideoPlayer from "@/components/video-player"
import DashboardNavbar from "@/components/dashboard-navbar"
import AnnotationCanvas from "@/components/annotation-canvas"
import ReuploadVideoDialog from "@/components/reupload-video-dialog"

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

interface Comment {
  id: string
  content: string
  timestamp: string | null
  createdAt: Timestamp
  userId: string
  userName: string
  userImageUrl: string
  isResolved: boolean
  resolved: Resolver | null
}

interface Annotation {
  id: string
  data: string
  timestamp: string
  timeFormatted: string
  createdAt: Timestamp
  userId: string
  userName: string
  userImageUrl: string
  isResolved: boolean
  resolved: Resolver | null
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
  console.log("workspaceId: ", workspaceId)
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

  // Add useEffect to log project changes
  useEffect(() => {
    console.log("Project updated:", project);
  }, [project]);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        console.log("fetching video: ", projectId)
        const docRef = doc(db, "projects", projectId)
        console.log("docRef: ", docRef)
        const docSnap = await getDoc(docRef)
        console.log("docSnap: ", docSnap)
        
        if (docSnap.exists()) {
          console.log("video found")
          const projectData = docSnap.data()
          console.log("projectData: ", projectData)
          setProject({
            id: projectData.id,
            ...projectData,
          } as Project)
          console.log("project: ", project)
          // Set comments and annotations from the video document
          setComments(projectData.comments?.sort((a: Comment, b: Comment) => 
            b.createdAt.toMillis() - a.createdAt.toMillis()
          ) || [])
          setAnnotations(projectData.annotations || [])
          console.log("Done setting")
        }
      } catch (error) {
        console.error("Error fetching video:", error)
      } finally {
        setLoading(false)
      }
    }
    console.log("Fetching video")
    fetchVideo()
    console.log("Done fetching")
  }, [projectId])

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
      
      if (annotationId) {
        // Update existing annotation
        const updatedAnnotations = annotations.map(annotation => 
          annotation.id === annotationId
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
      if (Math.abs(timeInMs - annotationTimeInMs) > 1000) { // 1 second tolerance in milliseconds
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
      a.href = url
      a.download = project.title || 'video'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading video:', error)
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
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5"
                onClick={() => setIsReuploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4" />
                Reupload
              </Button>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
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
          </div>

          {/* Comments and Annotations Section */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Comments & Annotations</h2>
              </div>
            </div>

            <div className="flex flex-col h-[calc(90vh-5rem)]">
              {/* Timeline Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {[...comments, ...annotations].sort((a, b) => 
                  b.createdAt.toMillis() - a.createdAt.toMillis()
                ).map(item => {
                  if ('data' in item) {
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
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={item.userImageUrl} alt={item.userName} />
                            <AvatarFallback>{item.userName[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{item.userName}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {item.timeFormatted.toString().substring(0, item.timeFormatted.toString().length-2)}
                          </Badge>
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
                        <div className="aspect-video overflow-hidden rounded-md">
                          <img
                            src={item.data}
                            alt={`Annotation at ${item.timeFormatted}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )
                  } else {
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
                      />
                    )
                  }
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
                      <Badge variant="secondary" className="bg-gray-100 font-mono">
                        {formatTime(currentTime)}
                      </Badge>
                      <span className="text-xs text-gray-500">Type @time to add timestamp</span>
                    </div>
                    <textarea
                      placeholder="Add a comment..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="w-full resize-none rounded-lg border border-gray-200 p-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      rows={3}
                    />
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