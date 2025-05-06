import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="container relative mx-auto px-16 pt-16 pb-8 md:pt-16 md:pb-8 text-center bg-blue-50">
          <div className="mb-4">
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 mb-4">
              The Ultimate Video Collaboration Platform
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              Video Feedback <span className="text-blue-600">Reimagined</span>
            </h1>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Streamline your video feedback and approval process. Get better results, faster.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-lg font-semibold">Start Free Trial</Button>
              <Button variant="outline" className="px-6 py-2 text-lg font-semibold">Explore Features</Button>
            </div>
          </div>
        </section>

        {/* Why Teams Choose Feedo */}
        <section className="bg-white py-12">
          <div className="container mx-auto px-12">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Why Teams Choose Feedo</h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Designed for video professionals who need feedback that's clear, contextual, and actionable.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-left">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-block bg-blue-50 p-2 rounded-full">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A2 2 0 0020 6.382V5a2 2 0 00-2-2H6a2 2 0 00-2 2v1.382a2 2 0 00.447 1.342L9 10m6 0v4m0 0l-4.553 2.276A2 2 0 016 17.618V19a2 2 0 002 2h8a2 2 0 002-2v-1.382a2 2 0 00-.447-1.342L15 14z" /></svg>
                  </span>
                  Video Collaboration
                </h3>
                <p className="text-gray-600 mb-2">Real-time feedback directly on your videos with timestamp comments</p>
                <ul className="text-gray-500 text-sm list-disc pl-5 space-y-1">
                  <li>Share videos with your team and clients</li>
                  <li>Collect feedback in one place</li>
                  <li>Track revision progress</li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-left">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-block bg-blue-50 p-2 rounded-full">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 6 9-6" /></svg>
                  </span>
                  Smart Workspaces
                </h3>
                <p className="text-gray-600 mb-2">Organize your videos by client, project, or team for better workflow</p>
                <ul className="text-gray-500 text-sm list-disc pl-5 space-y-1">
                  <li>Create custom workspaces</li>
                  <li>Control access permissions</li>
                  <li>Keep projects organized</li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-left">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="inline-block bg-blue-50 p-2 rounded-full">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  </span>
                  Review & Approval
                </h3>
                <p className="text-gray-600 mb-2">Streamlined approval process with status tracking and notifications</p>
                <ul className="text-gray-500 text-sm list-disc pl-5 space-y-1">
                  <li>Track approval status</li>
                  <li>Get instant notifications</li>
                  <li>Manage revision requests</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Powerful Features */}
        <section className="bg-gray-50 py-12">
          <div className="container mx-auto px-12">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Powerful Features</h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">Everything you need to streamline your video workflow</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-center">
                <div className="flex justify-center mb-2">
                  <span className="inline-block bg-blue-50 p-2 rounded-full">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" /></svg>
                  </span>
                </div>
                <h4 className="font-semibold mb-1">Team Collaboration</h4>
                <p className="text-gray-500 text-sm">Invite unlimited team members to collaborate on your videos</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-center">
                <div className="flex justify-center mb-2">
                  <span className="inline-block bg-blue-50 p-2 rounded-full">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                </div>
                <h4 className="font-semibold mb-1">Time-Stamped Comments</h4>
                <p className="text-gray-500 text-sm">Add precise feedback at exact moments in your videos</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-center">
                <div className="flex justify-center mb-2">
                  <span className="inline-block bg-blue-50 p-2 rounded-full">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 6 9-6" /></svg>
                  </span>
                </div>
                <h4 className="font-semibold mb-1">Version History</h4>
                <p className="text-gray-500 text-sm">Keep track of all revisions and feedback history in one place</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-center">
                <div className="flex justify-center mb-2">
                  <span className="inline-block bg-blue-50 p-2 rounded-full">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  </span>
                </div>
                <h4 className="font-semibold mb-1">Client-Friendly Interface</h4>
                <p className="text-gray-500 text-sm">Simple interface that clients love to use - no login required</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        {/* <section className="bg-white py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Loved by Teams Worldwide</h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">See what our customers are saying about Feedo</p>
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <div className="rounded-lg border border-gray-200 bg-blue-50 p-6 shadow-sm max-w-md mx-auto">
                <div className="flex items-center mb-2">
                  <span className="text-yellow-400 text-xl mr-1">★★★★★</span>
                </div>
                <p className="text-gray-800 mb-2">"Feedo has transformed our video review process. What used to take days now takes hours."</p>
                <div className="text-gray-600 text-sm font-medium">Sarah J.</div>
                <div className="text-gray-400 text-xs">Marketing Director, TechCorp Inc.</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-blue-50 p-6 shadow-sm max-w-md mx-auto">
                <div className="flex items-center mb-2">
                  <span className="text-yellow-400 text-xl mr-1">★★★★★</span>
                </div>
                <p className="text-gray-800 mb-2">"Our clients love how easy it is to give feedback. No more confused email threads!"</p>
                <div className="text-gray-600 text-sm font-medium">Michael T.</div>
                <div className="text-gray-400 text-xs">Creative Director, DesignHub Agency</div>
              </div>
            </div>
          </div>
        </section> */}

        {/* Call to Action */}
        <section className="bg-blue-600 py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Ready to transform your video workflow?</h2>
            <p className="text-blue-100 mb-6">Join thousands of creators and teams who trust Feedo</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2 text-lg">Start Free Trial</Button>
              <Button variant="outline" className="bg-blue-500 border-white text-white px-6 py-2 text-lg hover:bg-blue-700 hover:text-white">Get Started</Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

