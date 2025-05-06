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
        {/* Hero Section */}
        <section className="container relative mx-auto px-16 pt-2 pb-8 md:pt-12 md:pb-16">
          <div className="grid gap-x-8 lg:grid-cols-2 lg:gap-x-12">
            <div className="flex flex-col justify-center space-y-6">
              <span className="text-sm font-medium uppercase tracking-wider text-sky-600">INTRODUCING FEEDO</span>
              <h1 className="text-4xl font-bold tracking-tight text-sky-800 sm:text-5xl md:text-6xl">
              Work Together, Create Faster
              </h1>
              <p className="max-w-lg text-lg text-gray-600">
              Feedo streamlines video collaboration—share videos, get frame-accurate feedback, and manage approvals in one intuitive platform.
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
                className="absolute -bottom-4 left-4 z-20"
              />
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="bg-gray-50 py-8 md:py-12 px-8">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Designed for simplicity and power</h2>
              <p className="mb-12 text-lg text-gray-600">
                Every feature carefully crafted to enhance collaboration without adding complexity.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 text-sky-500">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">Timeline-Linked Comments</h3>
                <p className="text-gray-600">Comments automatically scroll to match video playback position, making it easy to see feedback in context.</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 text-sky-500">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 17h16M4 12h16M4 7h16" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">Intuitive Interface</h3>
                <p className="text-gray-600">Clean, straightforward design that guides non-technical users through the video review process.</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 text-sky-500">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">Simple Annotation Tools</h3>
                <p className="text-gray-600">Draw directly on video frames to pinpoint exactly what needs attention, no technical expertise required.</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 text-sky-500">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">Automatic Transcription</h3>
                <p className="text-gray-600">AI powered transcription lets you search for specific dialogue without scrolling through videos.</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 text-sky-500">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">Streamlined Collaboration</h3>
                <p className="text-gray-600">Invite team members or clients with simple permissions that don't overwhelm non-technical users.</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 text-sky-500">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">Enterprise-Grade Security</h3>
                <p className="text-gray-600">Keep your videos secure with encryption and role-based access controls.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-8 md:py-12 px-8">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">How Feedo works</h2>
              <p className="mb-12 text-lg text-gray-600">
                A simple workflow designed to make video collaboration effortless.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="relative text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <span className="text-xl font-semibold">01</span>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-lg font-semibold">Upload your video</h3>
                  <p className="text-gray-600 text-sm">Simply drag and drop your video file or select from your computer.</p>
                </div>
              </div>
              

              <div className="relative text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <span className="text-xl font-semibold">02</span>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-lg font-semibold">Invite collaborators</h3>
                  <p className="text-gray-600 text-sm">Share a simple link with your team or clients to review your video.</p>
                </div>
              </div>

              <div className="relative text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <span className="text-xl font-semibold">03</span>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-lg font-semibold">Collect precise feedback</h3>
                  <p className="text-gray-600 text-sm">Receive comments tied to specific timestamps for clear, actionable feedback.</p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full bg-sky-500 hover:bg-sky-600">
                  Start your first project
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-gray-50 py-16 md:py-16 px-6">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Loved by Users</h2>
              <p className="mb-12 text-lg text-gray-600">
                See what our customers are saying about their experience with Feedo.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-4 flex text-yellow-400">
                  {"★★★★★".split("").map((star, i) => (
                    <span key={i}>{star}</span>
                  ))}
                </div>
                <p className="mb-4 text-gray-600">
                  "I used to struggle with other video platforms, but Feedo makes it easy for me to give my videographer precise feedback without feeling overwhelmed."
                </p>
                <div>
                  <p className="font-semibold">Sarah K.</p>
                  <p className="text-sm text-gray-500">Marketing Director</p>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-4 flex text-yellow-400">
                  {"★★★★★".split("").map((star, i) => (
                    <span key={i}>{star}</span>
                  ))}
                </div>
                <p className="mb-4 text-gray-600">
                  "The timeline-linked comments are a game-changer. I can see exactly what my clients are referring to without any confusion. It's simplified our workflow tremendously!"
                </p>
                <div>
                  <p className="font-semibold">Michael R.</p>
                  <p className="text-sm text-gray-500">Video Producer</p>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-4 flex text-yellow-400">
                  {"★★★★★".split("").map((star, i) => (
                    <span key={i}>{star}</span>
                  ))}
                </div>
                <p className="mb-4 text-gray-600">
                  "As someone who isn't tech-savvy, I was worried about collaborating on video projects. Feedo's intuitive design makes it incredibly simple to provide feedback."
                </p>
                <div>
                  <p className="font-semibold">Rebecca T.</p>
                  <p className="text-sm text-gray-500">Small Business Owner</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-sky-900 py-16 text-white md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to simplify your video collaboration?</h2>
                  <p className="mb-6 text-sky-100">
                    Join thousands of creators and clients who've made their video review process seamless and efficient with Feedo.
                  </p>
                  <ul className="mb-8 space-y-2">
                    <li className="flex items-center">
                      <svg className="mr-2 h-5 w-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      No credit card required
                    </li>
                    <li className="flex items-center">
                      <svg className="mr-2 h-5 w-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Free plan available
                    </li>
                    <li className="flex items-center">
                      <svg className="mr-2 h-5 w-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited commenters
                    </li>
                    <li className="flex items-center">
                      <svg className="mr-2 h-5 w-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      14-day free trial on all plans
                    </li>
                  </ul>
                  <Link href="/dashboard">
                    <Button size="lg" className="rounded-full bg-white text-sky-900 hover:bg-sky-50">
                      Get started for free
                    </Button>
                  </Link>
                </div>

                <div className="rounded-xl bg-sky-800 p-8">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold">Free</h3>
                    <p className="text-sky-200">For individuals</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-sky-200">/month</span>
                  </div>
                  <ul className="mb-8 space-y-4">
                    <li className="flex items-center text-sky-100">
                      <svg className="mr-2 h-5 w-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Up to 3 projects
                    </li>
                    <li className="flex items-center text-sky-100">
                      <svg className="mr-2 h-5 w-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      2GB storage
                    </li>
                    <li className="flex items-center text-sky-100">
                      <svg className="mr-2 h-5 w-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited commenters
                    </li>
                    <li className="flex items-center text-sky-100">
                      <svg className="mr-2 h-5 w-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Basic annotation tools
                    </li>
                  </ul>
                  <Button size="lg" className="w-full rounded-full bg-sky-500 hover:bg-sky-600">
                    Start for free
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
    </div>
  )
}

