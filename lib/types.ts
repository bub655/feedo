export type ProjectType = "storyboard" | "video"

export interface Project {
  id: string
  type: ProjectType
  title: string
  releaseDate: string
  isFinalEdit: boolean
  clients?: string[]
  client?: string
  createdAt: string
  thumbnailUrl: string
  videoUrl?: string
  status?: string
  comments: Comment[]
  annotations: Annotation[]
  clientAccess?: boolean
}

export interface Comment {
  id: string
  text: string
  author: string
  timestamp: string
  videoTime: number
}

export interface Annotation {
  id: string
  text: string
  author: string
  timestamp: string
  videoTime: number
  position: {
    x: number
    y: number
  }
}

