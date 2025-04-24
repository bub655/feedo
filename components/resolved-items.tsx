import { MessageSquare, CheckCircle, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Comment, Annotation } from "@/types/video"

interface ResolvedItemsProps {
  items: (Comment | Annotation)[]
  onItemClick: (item: Comment | Annotation) => void
}

export default function ResolvedItems({ items, onItemClick }: ResolvedItemsProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <h2 className="text-lg font-medium text-gray-900">Resolved Items</h2>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center">No resolved items yet</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
              onClick={() => onItemClick(item)}
            >
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={item.userImageUrl} alt={item.userName} />
                  <AvatarFallback>{item.userName[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{item.userName}</span>
                {item.timestamp && (
                  <Badge variant="secondary" className="ml-auto bg-blue-100">
                    {item.timestamp.toString().substring(0, item.timestamp.toString().length-2)}
                  </Badge>
                )}
              </div>

              {'content' in item ? (
                <p className="text-sm text-gray-600">{item.content}</p>
              ) : 'data' in item && (
                <div className="aspect-video overflow-hidden rounded-md">
                  <img
                    src={item.data}
                    alt={`Annotation at ${item.timestamp}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {item.resolved && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>Resolved by {item.resolved.userName}</span>
                  </div>
                  <span>•</span>
                  <span>{format(item.resolved.resolvedAt.toDate(), 'MMM d, yyyy h:mm a')}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 