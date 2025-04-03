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
  Timestamp 
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

interface VideoPageClientProps {
  videoId: string
}

interface Video {
  id: string
  title: string
  status: string
  videoPath: string
  thumbnail: string
  client: string
  dueDate: string
  metadata: {
    lastModified: string
    size: number
    type: string
  }
  progress: number
  comments?: Comment[]
}

interface Comment {
  id: string
  content: string
  timestamp: string
  createdAt: Timestamp
  userId: string
  userName: string
  userImageUrl: string
  isResolved: boolean
}

export default function VideoPageClient({ videoId }: VideoPageClientProps) {
  const { user } = useUser()
  const [video, setVideo] = useState<Video | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [commentInput, setCommentInput] = useState("")

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const docRef = doc(db, "projects", videoId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const videoData = docSnap.data()
          setVideo({
            id: docSnap.id,
            ...videoData,
          } as Video)
          // Set comments from the video document
          setComments(videoData.comments?.sort((a: Comment, b: Comment) => 
            b.createdAt.toMillis() - a.createdAt.toMillis()
          ) || [])
        }
      } catch (error) {
        console.error("Error fetching video:", error)
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
      const newComment: Comment = {
        id: crypto.randomUUID(), // Generate a unique ID
        content: commentInput.trim(),
        timestamp: `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`,
        createdAt: Timestamp.now(),
        userId: user.id,
        userName: user.fullName || user.username || 'Anonymous',
        userImageUrl: user.imageUrl,
        isResolved: false
      }

      // Add the new comment to the project document
      await updateDoc(docRef, {
        comments: arrayUnion(newComment)
      })
      
      // Update local state
      setComments(prevComments => [newComment, ...prevComments])
      setCommentInput("")
    } catch (error) {
      console.error("Error adding comment:", error)
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
              <Button variant="outline" size="sm" className="gap-1.5">
                <Users className="h-4 w-4" />
                Invite
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
            {/* Video Player */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="aspect-video bg-black">
                <VideoPlayer videoUrl={video.videoPath} thumbnailUrl={video.thumbnail} />
              </div>
            </div>

            {/* Project Details */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Project Details</h2>
                  <p className="text-sm text-gray-500">Last updated: {new Date(video.metadata.lastModified).toLocaleDateString()}</p>
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
                    <span className="font-medium text-gray-900">{video.metadata.type}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Size:</span>
                    <span className="font-medium text-gray-900">
                      {(video.metadata.size / (1024 * 1024)).toFixed(2)} MB
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

          {/* Comments Section */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Comments</h2>
              </div>
            </div>

            <div className="flex flex-col">
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {comments.map(comment => (
                  <VideoComment
                    key={comment.id}
                    user={{
                      id: comment.userId,
                      name: comment.userName,
                      imageUrl: comment.userImageUrl
                    }}
                    timestamp={comment.timestamp}
                    content={comment.content}
                    time={new Date(comment.createdAt.toDate()).toLocaleString()}
                    isResolved={comment.isResolved}
                    onResolve={() => handleCommentResolve(comment.id)}
                  />
                ))}
              </div>

              {/* Comment Input */}
              <div className="border-t border-gray-200 bg-white p-6">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                    <AvatarFallback>{user?.fullName?.[0] || user?.username?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gray-100">
                        {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
                      </Badge>
                      <span className="text-xs text-gray-500">Current timestamp</span>
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
    </div>
  )
} 