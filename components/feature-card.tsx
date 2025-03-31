import { MessageSquare, Layers, PenTool } from "lucide-react"

interface FeatureCardProps {
  icon: "timeline" | "interface" | "annotation"
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4">
        {icon === "timeline" && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <MessageSquare className="h-6 w-6" />
          </div>
        )}
        {icon === "interface" && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <Layers className="h-6 w-6" />
          </div>
        )}
        {icon === "annotation" && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <PenTool className="h-6 w-6" />
          </div>
        )}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

