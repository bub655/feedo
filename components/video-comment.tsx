"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface VideoCommentProps {
  user: {
    id: string
    name: string
    imageUrl: string
  }
  content: string
  time: string
  timestamp?: string
  isResolved?: boolean
  resolvedBy?: {
    id: string
    name: string
    imageUrl: string
  }
  onResolve?: () => void
  onClick?: () => void
}

export default function VideoComment({
  user,
  content,
  time,
  timestamp,
  isResolved,
  resolvedBy,
  onResolve,
  onClick
}: VideoCommentProps) {
  return (
    <div 
      className="group relative mb-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer" 
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.imageUrl} alt={user.name} />
          <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{user.name}</span>
              <span className="text-sm text-gray-500">{time}</span>
            </div>
            {onResolve && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onResolve()
                }}
                className={`${isResolved ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-green-500'}`}
              >
                <CheckCircle className="h-5 w-5" />
              </Button>
            )}
          </div>

          {timestamp && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="bg-gray-100">
                {timestamp.toString().substring(0, timestamp.toString().length-2)}
              </Badge>
              {isResolved && (
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  Resolved
                </Badge>
              )}
            </div>
          )}

          <p className="mt-2 text-sm text-gray-700">{content}</p>
        </div>
      </div>
    </div>
  )
}

