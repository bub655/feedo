"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { db } from "@/lib/firebase"
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  query,
  collection,
  getDocs,
  where,
  onSnapshot
} from "firebase/firestore"
import {
  ChevronLeft,
  Share2,
  Download,
  MessageSquare,
  User,
  Calendar,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import VideoComment from "@/components/video-comment"
import VideoPlayer from "@/components/video-player"
import DashboardNavbar from "@/components/dashboard-navbar"
import AnnotationCanvas from "@/components/annotation-canvas"
import ShareWorkspaceDialog from "@/components/share-workspace-dialog"

interface VideoPageClientProps {
  videoId: string
}

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

interface Video {
  id: string
  title: string
  status: string
  videoUrl: string
  thumbnail: string
  client: string
  dueDate: string
  updatedAt: string
  metadata?: {
    size: number
    type: string
  }
  progress: number
  comments?: Comment[]
  annotations?: Annotation[]
  version: number
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
}

export default function VideoPageClient({ videoId }: VideoPageClientProps) {
  const { user } = useUser()
  const [video, setVideo] = useState<Video | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [commentInput, setCommentInput] = useState("@time ")
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string>("")

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        // Directly fetch the project document from the projects collection
        const projectRef = doc(db, "projects", videoId)
        const projectDoc = await getDoc(projectRef)

        if (projectDoc.exists()) {
          const projectData = projectDoc.data()
          const foundVideo: Video = {
            id: projectDoc.id,
            title: projectData.title,
            status: projectData.status,
            videoUrl: projectData.videoUrl,
            thumbnail: projectData.thumbnail,
            client: projectData.client,
            dueDate: projectData.dueDate,
            updatedAt: projectData.updatedAt,
            metadata: projectData.metadata,
            progress: projectData.progress,
            comments: projectData.comments || [],
            annotations: projectData.annotations || [],
            version: projectData.version
          }

          setVideo(foundVideo)
          setComments(foundVideo.comments || [])
          setAnnotations(foundVideo.annotations || [])

          // Set up real-time listener for the project
          const unsubscribe = onSnapshot(projectRef, (doc) => {
            if (doc.exists()) {
              const updatedData = doc.data()
              const updatedVideo: Video = {
                id: doc.id,
                title: updatedData.title,
                status: updatedData.status,
                videoUrl: updatedData.videoUrl,
                thumbnail: updatedData.thumbnail,
                client: updatedData.client,
                dueDate: updatedData.dueDate,
                updatedAt: updatedData.updatedAt,
                metadata: updatedData.metadata,
                progress: updatedData.progress,
                comments: updatedData.comments || [],
                annotations: updatedData.annotations || [],
                version: updatedData.version
              }
              setVideo(updatedVideo)
              setComments(updatedVideo.comments || [])
              setAnnotations(updatedVideo.annotations || [])
            }
          })

          return () => unsubscribe()
        } else {
          console.warn("No project found with ID:", videoId)
        }
      } catch (error) {
        console.error("Error fetching project:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVideo()
  }, [videoId])

  const handleCommentResolve = async (commentId: string) => {
    if (!video) return

    try {
      const docRef = doc(db, "projects", videoId)
      const updatedComment = comments.find(c => c.id === commentId)
      
      if (updatedComment) {
        const resolvedComment = {
          ...updatedComment,
          isResolved: true,
          resolvedAt: serverTimestamp()
        }

        // Remove the old comment and add the updated one
        await updateDoc(docRef, {
          comments: arrayRemove(updatedComment)
        })
        await updateDoc(docRef, {
          comments: arrayUnion(resolvedComment)
        })

        // Update local state
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId
              ? { ...comment, isResolved: true }
              : comment
          )
        )
      }
    } catch (error) {
      console.error("Error resolving comment:", error)
    }
  }

  const handleAddComment = async () => {
    if (!user || !commentInput.trim() || !video) return

    try {
      const docRef = doc(db, "projects", videoId)
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
        isResolved: false
      }

      await updateDoc(docRef, {
        comments: arrayUnion(newComment)
      })
      
      setCommentInput("@time ")
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const handleSaveAnnotation = async (annotationData: string) => {
    if (!user || !video) return

    try {
      const docRef = doc(db, "projects", videoId)
      const timestamp = formatTime(currentTime)
      
      if (selectedAnnotation) {
        // Update existing annotation
        const updatedAnnotation: Annotation = {
          ...selectedAnnotation,
          data: annotationData,
          timestamp,
          timeFormatted: timestamp,
          createdAt: Timestamp.now()
        }

        await updateDoc(docRef, {
          annotations: arrayRemove(selectedAnnotation)
        })

        await updateDoc(docRef, {
          annotations: arrayUnion(updatedAnnotation)
        })

        setSelectedAnnotation(updatedAnnotation)
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
          userImageUrl: user.imageUrl
        }

        await updateDoc(docRef, {
          annotations: arrayUnion(newAnnotation)
        })
      }

      setIsDrawing(false)
    } catch (error) {
      console.error("Error saving annotation:", error)
    }
  }

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!video) return

    try {
      const docRef = doc(db, "projects", videoId)
      const annotationToDelete = annotations.find(a => a.id === annotationId)

      if (annotationToDelete) {
        await updateDoc(docRef, {
          annotations: arrayRemove(annotationToDelete)
        })

        // Update local state
        setAnnotations(prevAnnotations => 
          prevAnnotations.filter(annotation => annotation.id !== annotationId)
        )
      }
    } catch (error) {
      console.error("Error deleting annotation:", error)
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 1000)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}.${milliseconds.toString().padStart(3, '0')}`
  }

  const handleAnnotationClick = (annotation: Annotation) => {
    if (selectedAnnotation?.id !== annotation.id) {
      setSelectedAnnotation(annotation)
    } else {
      setSelectedAnnotation(null)
    }
    // Convert timestamp string to seconds with milliseconds
    const [minutes, secondsAndMs] = annotation.timestamp.split(':')
    const [seconds, milliseconds] = secondsAndMs.split('.')
    const timeInSeconds = (parseInt(minutes) * 60) + parseInt(seconds) + (parseInt(milliseconds) / 1000)
    setSeekTo(timeInSeconds)
    setIsPlaying(false)
    const video = document.querySelector('video')
    if (video) {
      video.pause()
    }
  }

  const handleCommentClick = (comment: Comment) => {
    setSelectedAnnotation(null)
    if (comment.timestamp) {
      // Convert timestamp string to seconds with milliseconds
      const [minutes, secondsAndMs] = comment.timestamp.split(':')
      const [seconds, milliseconds] = secondsAndMs.split('.')
      const timeInSeconds = (parseInt(minutes) * 60) + parseInt(seconds) + (parseInt(milliseconds) / 1000)
      setSeekTo(timeInSeconds)
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
    setCurrentTime(time)
    // Clear annotation if current time doesn't match any annotation's timestamp
    if (selectedAnnotation) {
      const [minutes, secondsAndMs] = selectedAnnotation.timestamp.split(':')
      const [seconds, milliseconds] = secondsAndMs.split('.')
      const annotationTimeInSeconds = (parseInt(minutes) * 60) + parseInt(seconds) + (parseInt(milliseconds) / 1000)
      // If current time is more than 1 second away from annotation time, clear it
      if (Math.abs(time - annotationTimeInSeconds) > 1) {
        setSelectedAnnotation(null)
      }
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

  if (!video) {
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
            <h1 className="text-2xl font-semibold text-gray-900">{video.title}</h1>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5"
                  onClick={() => setIsShareDialogOpen(true)}
                >
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
                  videoUrl={`${process.env.NEXT_PUBLIC_AWS_CDN_URL}${video.videoUrl}`} 
                  thumbnailUrl={video.thumbnail}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  seekTo={seekTo}
                />
                <AnnotationCanvas
                  isDrawing={isDrawing}
                  setIsDrawing={setIsDrawing}
                  onSave={handleSaveAnnotation}
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
                  <p className="text-sm text-gray-500">Last updated: {new Date(video.updatedAt).toLocaleDateString()}</p>
                  </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5">
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
                    <span className="font-medium text-gray-900">{video.client}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Due Date:</span>
                    <span className="font-medium text-gray-900">{video.dueDate}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Format:</span>
                    <span className="font-medium text-gray-900">
                      {video.metadata?.type || 'MP4'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Size:</span>
                    <span className="font-medium text-gray-900">
                      {video.metadata?.size ? `${(video.metadata.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

                <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className="text-sm font-medium text-gray-900">{video.progress}%</span>
                </div>
                <Progress value={video.progress} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Comments and Annotations Section */}
          <div className="h-[calc(56.25vw*0.425+24rem)] lg:max-w-[33.333vw] rounded-lg border border-gray-200 bg-white shadow-sm flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Comments & Annotations</h2>
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Timeline Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {[...comments, ...annotations].sort((a, b) => 
                  b.createdAt.toMillis() - a.createdAt.toMillis()
                ).map((item, index) => {
                  if ('data' in item) {
                    // Render annotation
                    return (
                      <div
                        key={`annotation-${item.id}-${index}`}
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
                            {item.timeFormatted}
                          </Badge>
                    <Button
                            variant="ghost"
                      size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteAnnotation(item.id)
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
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
                        key={`comment-${item.id}-${index}`}
                        user={{
                          id: item.userId,
                          name: item.userName,
                          imageUrl: item.userImageUrl
                        }}
                        content={item.content}
                        time={new Date(item.createdAt.toDate()).toLocaleString()}
                        timestamp={item.timestamp || undefined}
                        isResolved={item.isResolved}
                        onResolve={() => handleCommentResolve(item.id)}
                        onClick={() => handleCommentClick(item)}
                      />
                    )
                  }
                })}
              </div>

              {/* Comment Input - Fixed at bottom */}
              <div className="border-t border-gray-200 bg-white p-6">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                    <AvatarFallback>{user?.fullName?.[0] || user?.username?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gray-100">
                        {formatTime(currentTime)}
                      </Badge>
                      <span className="text-xs text-gray-500">Type @time to add timestamp</span>
                    </div>
                    <textarea
                      placeholder="Add a comment..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="w-full resize-none rounded-lg border border-gray-200 p-4 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      rows={3}
                    />
                    <div className="mt-3 flex justify-end">
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
      <ShareWorkspaceDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        workspaceId={workspaceId}
        currentUserEmail={user?.emailAddresses[0]?.emailAddress || ""}
      />
    </div>
  )
} 