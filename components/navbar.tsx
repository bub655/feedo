import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

export default function Navbar() {
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-500 text-white">
            <span className="text-xl font-bold">F</span>
          </div>
          <span className="text-xl font-medium text-gray-800">feedo</span>
        </div>

        <nav className="hidden md:flex">
          <ul className="flex items-center gap-8">
            <li>
              <Link href="/" className="text-gray-700 hover:text-sky-600">
                Home
              </Link>
            </li>
            <li>
              <Link href="/features" className="text-gray-700 hover:text-sky-600">
                Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-gray-700 hover:text-sky-600">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-gray-700 hover:text-sky-600">
                Dashboard
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          {/* <Link href="/signin" className="hidden text-gray-700 hover:text-sky-600 md:block">
            Sign In
          </Link> */}
          <SignedIn>
              <UserButton />
          </SignedIn>
          <SignedOut>
            <Link href="/dashboard">
              <Button className="rounded-full bg-sky-500 hover:bg-sky-600">
                Get Started
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
          </SignedOut>
        </div>
      </div>
    </header>
  )
}

