"use client"

import { useState } from "react"
import { MessageSquare, ReplyIcon, ThumbsUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface User {
  name: string
  avatar: string
  role: string
}

interface CommentReply {
  user: User
  content: string
  time: string
}

interface VideoCommentProps {
  user: User
  timestamp: string
  content: string
  time: string
  replies: CommentReply[]
}

export default function VideoComment({ user, timestamp, content, time, replies }: VideoCommentProps) {
  const [showReplies, setShowReplies] = useState(true)
  const [isReplying, setIsReplying] = useState(false)

  return (
    <div className="mb-6">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="mt-1 h-full w-0.5 flex-1 bg-gray-200"></div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{user.name}</span>
                <span className="text-xs text-gray-500">{user.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-sky-600">{timestamp}</span>
                <span className="text-xs text-gray-500">• {time}</span>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-gray-500 hover:text-gray-700">
              <ThumbsUp className="h-3.5 w-3.5" />
              Like
            </Button>
          </div>

          <div className="mt-2 text-sm text-gray-700">{content}</div>

          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => setIsReplying(!isReplying)}
            >
              <ReplyIcon className="h-3.5 w-3.5" />
              Reply
            </Button>

            {replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-gray-500 hover:text-gray-700"
                onClick={() => setShowReplies(!showReplies)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
              </Button>
            )}
          </div>

          {isReplying && (
            <div className="mt-3">
              <textarea
                placeholder="Write a reply..."
                className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                rows={2}
              ></textarea>
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setIsReplying(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="text-xs bg-sky-500 hover:bg-sky-600">
                  Reply
                </Button>
              </div>
            </div>
          )}

          {replies.length > 0 && showReplies && (
            <div className="mt-3 space-y-3">
              {replies.map((reply, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={reply.user.avatar} alt={reply.user.name} />
                    <AvatarFallback>{reply.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">{reply.user.name}</span>
                      <span className="text-xs text-gray-500">{reply.user.role}</span>
                      <span className="text-xs text-gray-500">• {reply.time}</span>
                    </div>

                    <div className="mt-1 text-xs text-gray-700">{reply.content}</div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Like
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

