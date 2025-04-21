"use client"

import { use } from "react"
import VideoPageClient from "./video-page-client"

interface PageParams {
  videoid: string
}

interface VideoPageProps {
  params: Promise<PageParams>
}

export default function VideoPage({ params }: VideoPageProps) {
  const resolvedParams = use(params)
  return <VideoPageClient projectId={resolvedParams.videoid} />
}
