import { MessageSquare, PenTool } from "lucide-react"

interface FeatureCalloutProps {
  icon: "comment" | "pencil"
  title: string
  description: string
  className?: string
}

export default function FeatureCallout({ icon, title, description, className = "" }: FeatureCalloutProps) {
  return (
    <div className={`flex max-w-xs items-start gap-3 rounded-lg bg-white p-4 shadow-lg ${className}`}>
      <div className="flex-shrink-0">
        {icon === "comment" && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <MessageSquare className="h-5 w-5" />
          </div>
        )}
        {icon === "pencil" && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <PenTool className="h-5 w-5" />
          </div>
        )}
      </div>
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}

