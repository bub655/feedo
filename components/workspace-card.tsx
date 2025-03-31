import Link from "next/link"
import { Building, MoreVertical, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface WorkspaceCardProps {
  workspace: {
    id: string
    name: string
    members: number
    projects: number
    lastUpdated: string
  }
}

export default function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-600">
              <Building className="h-5 w-5" />
            </div>
            <Link href={`/workspace/${workspace.id}`}>
              <h3 className="font-medium text-gray-900 hover:text-sky-600 hover:underline">{workspace.name}</h3>
            </Link>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Workspace</DropdownMenuItem>
              <DropdownMenuItem>Manage Members</DropdownMenuItem>
              <DropdownMenuItem>Workspace Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Delete Workspace</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-md bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{workspace.members} Members</span>
            </div>
          </div>

          <div className="rounded-md bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" x2="12" y1="22" y2="12" />
              </svg>
              <span className="text-sm text-gray-700">{workspace.projects} Projects</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">{workspace.lastUpdated}</span>

          <Link href={`/workspace/${workspace.id}`}>
            <Button size="sm" variant="outline" className="text-sky-600 hover:bg-sky-50 hover:text-sky-700">
              Open Workspace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

