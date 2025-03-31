import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import FeatureCard from "@/components/feature-card"
import FeatureCallout from "@/components/feature-callout"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-6">
              <span className="text-sm font-medium uppercase tracking-wider text-sky-600">INTRODUCING FEEDO</span>
              <h1 className="text-4xl font-bold tracking-tight text-sky-800 sm:text-5xl md:text-6xl">
                Video collaboration simplified
              </h1>
              <p className="max-w-lg text-lg text-gray-600">
                Simplify video feedback with timeline-linked comments, intuitive tools, and a beautiful interface
                designed for non-techy clients.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-full bg-sky-500 hover:bg-sky-600">
                    <span>Start for free</span>
                    <svg
                      className="ml-2 h-4 w-4"
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
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-sky-200 text-sky-700 hover:bg-sky-50"
                >
                  <Play className="mr-2 h-4 w-4" />
                  <span>Watch demo</span>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10 rounded-lg shadow-xl">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-W7yKFMUQTd9YODEWyaGqWQvZQHWVR7.png"
                  alt="Feedo desktop application"
                  width={600}
                  height={400}
                  className="rounded-lg"
                />
              </div>

              {/* Feature Callouts */}
              <FeatureCallout
                icon="comment"
                title="Timeline comments"
                description="Linked to specific moments"
                className="absolute -right-4 -top-4 z-20"
              />

              <FeatureCallout
                icon="pencil"
                title="Easy annotations"
                description="Draw directly on frames"
                className="absolute -bottom-4 right-12 z-20"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Designed for simplicity and power</h2>
              <p className="mb-12 text-lg text-gray-600">
                Every feature carefully crafted to enhance collaboration without adding complexity.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon="timeline"
                title="Timeline-Linked Comments"
                description="Comments automatically scroll to match video playback position, making it easy to see feedback in context."
              />
              <FeatureCard
                icon="interface"
                title="Intuitive Interface"
                description="Clean, straightforward design that guides non-technical users through the video review process."
              />
              <FeatureCard
                icon="annotation"
                title="Simple Annotation Tools"
                description="Draw directly on video frames to pinpoint exactly what needs attention, no technical expertise required."
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

