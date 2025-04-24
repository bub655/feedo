import { Timestamp } from "firebase/firestore"

export interface Comment {
  id: string
  content: string
  timestamp: string | null
  createdAt: Timestamp
  userId: string
  userName: string
  userImageUrl: string
  isResolved: boolean
  resolved: {
    id: string
    userName: string
    userImageUrl: string
    resolvedAt: Timestamp
  } | null
}

export interface Annotation {
  id: string
  data: string
  timestamp: string
  timeFormatted: string
  createdAt: Timestamp
  userId: string
  userName: string
  userImageUrl: string
  isResolved: boolean
  resolved: {
    id: string
    userName: string
    userImageUrl: string
    resolvedAt: Timestamp
  } | null
} 