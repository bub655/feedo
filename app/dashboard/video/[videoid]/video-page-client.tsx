"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  Share2,
  Download,
  MessageSquare,
  PenTool,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Tag,
  Paperclip,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import VideoComment from "@/components/video-comment"
import DashboardNavbar from "@/components/dashboard-navbar"
import VideoPlayer from "@/components/video-player"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VideoPageClientProps {
  videoId: string;
}

export default function VideoPageClient({ videoId }: VideoPageClientProps) {
  const [status, setStatus] = useState("In Progress")
  const [activeTab, setActiveTab] = useState("comments")

  // Sample video data
  const video = {
    id: videoId,
    title: "Brand Video Redesign",
    client: "Acme Corporation",
    dueDate: "Oct 15, 2023",
    createdAt: "Sep 28, 2023",
    description:
      "Redesign of the brand video for the new product launch. Focus on modern aesthetics and clear messaging.",
    tags: ["Brand", "Marketing", "Product Launch"],
    attachments: ["Brief.pdf", "Brand Guidelines.pdf"],
    thumbnail: "/placeholder.svg?height=150&width=250",
    videoUrl: "/placeholder.mp4",
    progress: 75,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-700"
      case "Pending Review":
        return "bg-amber-100 text-amber-700"
      case "Approved":
        return "bg-green-100 text-green-700"
      case "Rejected":
        return "bg-red-100 text-red-700"
      case "Completed":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Progress":
        return <Clock className="h-4 w-4" />
      case "Pending Review":
        return <Clock className="h-4 w-4" />
      case "Approved":
        return <CheckCircle className="h-4 w-4" />
      case "Rejected":
        return <XCircle className="h-4 w-4" />
      case "Completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <DashboardNavbar />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {/* Video Header */}
          <div className="border-b border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">{video.title}</h1>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button size="sm" className="gap-1.5 bg-sky-500 hover:bg-sky-600">
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-4">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={`h-8 w-40 text-xs font-medium ${getStatusColor(status)}`}>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(status)}
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Pending Review">Pending Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Progress value={video.progress} className="h-2 w-24" />
                <span>{video.progress}% Complete</span>
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className="relative aspect-video bg-black">
            <VideoPlayer videoUrl={video.videoUrl} thumbnailUrl={video.thumbnail} />
          </div>

          {/* Video Metadata */}
          <div className="border-t border-b border-gray-200 bg-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Project Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Client:</span>
                    <span className="font-medium text-gray-700">{video.client}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Due Date:</span>
                    <span className="font-medium text-gray-700">{video.dueDate}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium text-gray-700">{video.createdAt}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-600">{video.description}</p>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Tag
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {video.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <a href="#" className="text-sky-600 hover:underline">
                          {attachment}
                        </a>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Attachment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="border-b border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Timeline</h3>
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
                Add Marker
              </Button>
            </div>

            <div className="h-8 w-full rounded-md bg-gray-100">
              <div className="relative h-full w-full">
                <div className="absolute left-[30%] top-0 h-full w-0.5 bg-sky-500"></div>

                {/* Timeline markers */}
                <div className="absolute left-[15%] top-0 h-full w-0.5 bg-amber-400" title="Comment at 00:22"></div>
                <div className="absolute left-[45%] top-0 h-full w-0.5 bg-amber-400" title="Comment at 01:05"></div>
                <div className="absolute left-[75%] top-0 h-full w-0.5 bg-amber-400" title="Comment at 01:52"></div>
              </div>
            </div>
          </div>
        </main>

        {/* Comments Sidebar */}
        <aside className="hidden w-96 flex-shrink-0 border-l border-gray-200 bg-white md:block">
          <Tabs defaultValue="comments" value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200">
              <TabsList className="w-full justify-start rounded-none border-b border-transparent bg-transparent p-0">
                <TabsTrigger
                  value="comments"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Comments
                </TabsTrigger>
                <TabsTrigger
                  value="annotations"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <PenTool className="mr-2 h-4 w-4" />
                  Annotations
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="comments" className="m-0 p-0">
              <div className="flex h-[calc(100vh-10rem)] flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  <VideoComment
                    user={{
                      name: "Sarah Johnson",
                      avatar: "/placeholder.svg?height=40&width=40",
                      role: "Creative Director",
                    }}
                    timestamp="00:22"
                    content="The intro animation feels a bit slow. Can we speed it up by about 20%?"
                    time="2 days ago"
                    replies={[
                      {
                        user: {
                          name: "Mike Chen",
                          avatar: "/placeholder.svg?height=40&width=40",
                          role: "Motion Designer",
                        },
                        content: "Good point, I'll adjust the timing in the next revision.",
                        time: "1 day ago",
                      },
                    ]}
                  />

                  <VideoComment
                    user={{
                      name: "Alex Rodriguez",
                      avatar: "/placeholder.svg?height=40&width=40",
                      role: "Product Manager",
                    }}
                    timestamp="01:05"
                    content="The product features section needs more emphasis. Can we add a subtle highlight effect when each feature is mentioned?"
                    time="1 day ago"
                    replies={[]}
                  />

                  <VideoComment
                    user={{
                      name: "Emily Wong",
                      avatar: "/placeholder.svg?height=40&width=40",
                      role: "Marketing Lead",
                    }}
                    timestamp="01:52"
                    content="The call-to-action at the end should be more prominent. Let's use our primary brand color and make the button slightly larger."
                    time="12 hours ago"
                    replies={[]}
                  />
                </div>

                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="@user" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <textarea
                        placeholder="Add a comment at 00:45..."
                        className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        rows={3}
                      ></textarea>
                      <div className="mt-2 flex justify-end">
                        <Button size="sm" className="bg-sky-500 hover:bg-sky-600">
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="annotations" className="m-0 p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">Drawing Tools</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M7.5 0.875C7.01675 0.875 6.625 1.26675 6.625 1.75C6.625 2.23325 7.01675 2.625 7.5 2.625C7.98325 2.625 8.375 2.23325 8.375 1.75C8.375 1.26675 7.98325 0.875 7.5 0.875ZM2.5 7.5C2.5 7.01675 2.89175 6.625 3.375 6.625C3.85825 6.625 4.25 7.01675 4.25 7.5C4.25 7.98325 3.85825 8.375 3.375 8.375C2.89175 8.375 2.5 7.98325 2.5 7.5ZM6.625 13.25C6.625 12.7668 7.01675 12.375 7.5 12.375C7.98325 12.375 8.375 12.7668 8.375 13.25C8.375 13.7332 7.98325 14.125 7.5 14.125C7.01675 14.125 6.625 13.7332 6.625 13.25ZM10.75 7.5C10.75 7.01675 11.1418 6.625 11.625 6.625C12.1082 6.625 12.5 7.01675 12.5 7.5C12.5 7.98325 12.1082 8.375 11.625 8.375C11.1418 8.375 10.75 7.98325 10.75 7.5Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M1 1C0.447715 1 0 1.44772 0 2V13C0 13.5523 0.447715 14 1 14H14C14.5523 14 15 13.5523 15 13V2C15 1.44772 14.5523 1 14 1H1ZM14 2H1V13H14V2Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V7H10.5C10.7762 7 11 7.22386 11 7.5C11 7.77614 10.7762 8 10.5 8H7.50003C7.22389 8 7.00003 7.77614 7.00003 7.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">Color</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 border-red-500"
                    ></Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 border-blue-500"
                    ></Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 border-green-500"
                    ></Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 bg-yellow-500 hover:bg-yellow-600 border-yellow-500"
                    ></Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white hover:bg-gray-100 border-gray-300"
                    ></Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">Stroke Width</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                      Thin
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs bg-gray-100">
                      Medium
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                      Thick
                    </Button>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="flex flex-col space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Saved Annotations</h3>

                  <div className="rounded-md border border-gray-200 p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <PenTool className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Logo Placement</p>
                          <p className="text-xs text-gray-500">00:15 • Sarah Johnson</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Drawing</Badge>
                    </div>
                  </div>

                  <div className="rounded-md border border-gray-200 p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <PenTool className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Text Highlight</p>
                          <p className="text-xs text-gray-500">01:22 • Mike Chen</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Highlight</Badge>
                    </div>
                  </div>

                  <Button className="w-full bg-sky-500 hover:bg-sky-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Annotation
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="m-0 p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-900">Video Quality</h3>
                  <select className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500">
                    <option>Auto (Recommended)</option>
                    <option>720p</option>
                    <option>1080p</option>
                    <option>1440p</option>
                  </select>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-900">Playback Speed</h3>
                  <select className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500">
                    <option>1x</option>
                    <option>0.5x</option>
                    <option>0.75x</option>
                    <option>1.25x</option>
                    <option>1.5x</option>
                    <option>2x</option>
                  </select>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-900">Autoplay</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoplay"
                      className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <label htmlFor="autoplay" className="ml-2 text-sm text-gray-700">
                      Automatically play videos
                    </label>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-900">Notification Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notify-comments"
                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        defaultChecked
                      />
                      <label htmlFor="notify-comments" className="ml-2 text-sm text-gray-700">
                        Notify me about new comments
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notify-mentions"
                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        defaultChecked
                      />
                      <label htmlFor="notify-mentions" className="ml-2 text-sm text-gray-700">
                        Notify me when I'm mentioned
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  )
} 