"use client"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useState } from "react"

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
  )
}

function XIcon() {
  return (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
  )
}

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')

  const prices = billing === 'monthly'
    ? [
        { price: '$0', period: '/month' },
        { price: '$19', period: '/month' },
        { price: '$49', period: '/month' },
      ]
    : [
        { price: '$0', period: '/year' },
        { price: '$180', period: '/year' },
        { price: '$468', period: '/year' },
      ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-12 pb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Simple, Transparent Pricing</h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Choose the plan that's right for your team. All plans include a 14-day free trial.
          </p>
          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-10 relative">
            <span className={`text-lg font-semibold transition-colors duration-150 ${billing === 'monthly' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>Monthly</span>
            <button
              className="relative w-16 h-8 bg-blue-100 rounded-full flex items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              role="switch"
              aria-checked={billing === 'yearly'}
              onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
              tabIndex={0}
            >
              <span
                className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${billing === 'yearly' ? 'translate-x-8' : ''}`}
                aria-hidden
              />
              <span className="sr-only">Toggle billing period</span>
            </button>
            <span className={`text-lg font-semibold transition-colors duration-150 ${billing === 'yearly' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>Yearly</span>
            <span className={`ml-2 text-xs text-green-600 bg-green-100 rounded px-2 py-0.5 font-medium select-none transition-opacity duration-200 ${billing === 'yearly' ? 'opacity-100' : 'opacity-0'}`}>Save 20%</span>
          </div>
          {/* Pricing Cards */}
          <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch mb-16">
            {/* Free */}
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm flex-1 max-w-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Free</h3>
                <div className="text-3xl font-bold mb-1">{prices[0].price}<span className="text-base font-normal">{prices[0].period}</span></div>
                <div className="text-gray-500 mb-4">For individuals just getting started with video feedback</div>
                <ul className="text-gray-700 text-sm space-y-2 mb-6 text-left">
                  <li className="flex items-center gap-2"><CheckIcon />3 active videos</li>
                  <li className="flex items-center gap-2"><CheckIcon />2 team members</li>
                  <li className="flex items-center gap-2"><CheckIcon />Basic video commenting</li>
                  <li className="flex items-center gap-2"><CheckIcon />1 workspace</li>
                  <li className="flex items-center gap-2"><CheckIcon />7-day history</li>
                  <li className="flex items-center gap-2 text-gray-400"><XIcon />Client access controls</li>
                  <li className="flex items-center gap-2 text-gray-400"><XIcon />Version history</li>
                  <li className="flex items-center gap-2 text-gray-400"><XIcon />Custom branding</li>
                  <li className="flex items-center gap-2 text-gray-400"><XIcon />Priority support</li>
                </ul>
              </div>
              <Button className="w-full bg-gray-900 text-white mt-auto">Start for Free</Button>
            </div>
            {/* Pro */}
            <div className="rounded-xl border-2 border-blue-400 bg-white p-8 shadow-md flex-1 max-w-sm flex flex-col justify-between relative">
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full shadow">Most Popular</span>
              <div>
                <h3 className="text-lg font-semibold mb-2">Pro</h3>
                <div className="text-3xl font-bold mb-1">{prices[1].price}<span className="text-base font-normal">{prices[1].period}</span></div>
                <div className="text-gray-500 mb-4">Billed annually</div>
                <div className="text-gray-500 mb-4">Perfect for freelancers and small teams</div>
                <ul className="text-gray-700 text-sm space-y-2 mb-6 text-left">
                  <li className="flex items-center gap-2"><CheckIcon />Unlimited active videos</li>
                  <li className="flex items-center gap-2"><CheckIcon />10 team members</li>
                  <li className="flex items-center gap-2"><CheckIcon />Advanced commenting & annotations</li>
                  <li className="flex items-center gap-2"><CheckIcon />5 workspaces</li>
                  <li className="flex items-center gap-2"><CheckIcon />30-day history</li>
                  <li className="flex items-center gap-2"><CheckIcon />Client access controls</li>
                  <li className="flex items-center gap-2 text-gray-400"><XIcon />Basic version history</li>
                  <li className="flex items-center gap-2 text-gray-400"><XIcon />Custom branding</li>
                  <li className="flex items-center gap-2 text-gray-400"><XIcon />Priority support</li>
                </ul>
              </div>
              <Button className="w-full bg-blue-500 text-white mt-auto">Start Now</Button>
            </div>
            {/* Business */}
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm flex-1 max-w-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Business</h3>
                <div className="text-3xl font-bold mb-1">{prices[2].price}<span className="text-base font-normal">{prices[2].period}</span></div>
                <div className="text-gray-500 mb-4">Billed annually</div>
                <div className="text-gray-500 mb-4">For growing teams and agencies with multiple clients</div>
                <ul className="text-gray-700 text-sm space-y-2 mb-6 text-left">
                  <li className="flex items-center gap-2"><CheckIcon />Unlimited active videos</li>
                  <li className="flex items-center gap-2"><CheckIcon />Unlimited team members</li>
                  <li className="flex items-center gap-2"><CheckIcon />Advanced commenting & annotations</li>
                  <li className="flex items-center gap-2"><CheckIcon />Unlimited workspaces</li>
                  <li className="flex items-center gap-2"><CheckIcon />Unlimited history</li>
                  <li className="flex items-center gap-2"><CheckIcon />Client access controls</li>
                  <li className="flex items-center gap-2"><CheckIcon />Advanced version history</li>
                  <li className="flex items-center gap-2"><CheckIcon />Custom branding</li>
                  <li className="flex items-center gap-2"><CheckIcon />Priority support</li>
                  <li className="flex items-center gap-2"><CheckIcon />API access</li>
                </ul>
              </div>
              <Button className="w-full bg-gray-900 text-white mt-auto">Start Now</Button>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="container mx-auto px-12 py-12 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Compare All Features</h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">Find the plan that's right for you and your team</p>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-4 py-2 font-semibold text-gray-700">Feature</th>
                  <th className="text-center px-4 py-2 font-semibold text-gray-700 bg-blue-50">Free</th>
                  <th className="text-center px-4 py-2 font-semibold text-gray-700 bg-blue-50">Pro</th>
                  <th className="text-center px-4 py-2 font-semibold text-gray-700 bg-blue-50">Business</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2">Active Videos</td>
                  <td className="text-center px-4 py-2">3</td>
                  <td className="text-center px-4 py-2">Unlimited</td>
                  <td className="text-center px-4 py-2">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2">Team Members</td>
                  <td className="text-center px-4 py-2">2</td>
                  <td className="text-center px-4 py-2">10</td>
                  <td className="text-center px-4 py-2">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2">Workspaces</td>
                  <td className="text-center px-4 py-2">1</td>
                  <td className="text-center px-4 py-2">5</td>
                  <td className="text-center px-4 py-2">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2">Video History</td>
                  <td className="text-center px-4 py-2">7 days</td>
                  <td className="text-center px-4 py-2">30 days</td>
                  <td className="text-center px-4 py-2">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2">Client Access</td>
                  <td className="text-center px-4 py-2 text-gray-400">&times;</td>
                  <td className="text-center px-4 py-2 text-blue-600">&#10003;</td>
                  <td className="text-center px-4 py-2 text-blue-600">&#10003;</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2">Custom Branding</td>
                  <td className="text-center px-4 py-2 text-gray-400">&times;</td>
                  <td className="text-center px-4 py-2 text-gray-400">&times;</td>
                  <td className="text-center px-4 py-2 text-blue-600">&#10003;</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Priority Support</td>
                  <td className="text-center px-4 py-2 text-gray-400">&times;</td>
                  <td className="text-center px-4 py-2 text-gray-400">&times;</td>
                  <td className="text-center px-4 py-2 text-blue-600">&#10003;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full bg-blue-600 py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Frequently Asked Questions</h2>
            <p className="text-blue-100 text-center mb-10 max-w-2xl mx-auto">Have questions? We've got answers.</p>
            <div className="space-y-4 max-w-2xl mx-auto">
              <FAQItem
                question="Can I cancel my subscription at any time?"
                answer="Yes, you can cancel your subscription at any time. If you cancel, you'll have access to your plan until the end of your billing period."
              />
              <FAQItem
                question="Is there a free trial?"
                answer="Yes, all paid plans come with a 14-day free trial. No credit card required."
              />
              <FAQItem
                question="What happens to my videos if I downgrade?"
                answer="Your videos remain stored in your account, but you may lose access to some features and may need to reduce the number of active videos to comply with your new plan's limits."
              />
              <FAQItem
                question="Can I change plans later?"
                answer="Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features."
              />
            </div>
          </div>
        </section>
        <section className="container mx-auto px-4 py-12 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Pricing FAQ</h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">Have questions? We've got answers.</p>
        </section>
      </main>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-5 text-left">
      <div className="font-semibold mb-1 text-blue-900">{question}</div>
      <div className="text-blue-700 text-sm">{answer}</div>
    </div>
  )
}

