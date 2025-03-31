"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Project } from "@/lib/types"
import { Calendar, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProjectGalleryProps {
  projects: Project[]
}

export default function ProjectGallery({ projects }: ProjectGalleryProps) {
  const router = useRouter();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="bg-slate-900 border-slate-800 overflow-hidden hover:border-blue-800 transition-all"
          onClick={() => router.push(`/project/${project.id}`)}
        >
          <div className="aspect-video relative overflow-hidden bg-slate-800">
            <img
              src={project.thumbnailUrl || "/placeholder.svg"}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge className={project.type === "video" ? "bg-blue-700" : "bg-purple-700"}>
                {project.type === "video" ? "Video" : "Storyboard"}
              </Badge>
            </div>
            {project.isFinalEdit && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Final
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2 line-clamp-1">{project.title}</h3>
          </CardContent>
          <CardFooter className="p-4 pt-0 text-sm text-slate-400 flex justify-between">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {project.releaseDate}
            </div>
            {/* <div>{project.client.length > 0 ? `Clients: ${project.clients.join(", ")}` : "No clients"}</div> */}
            {project.clients && (
              <div>
                {project.clients.length > 0 ? `Clients: ${project.clients.join(", ")}` : "No clients"}
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

