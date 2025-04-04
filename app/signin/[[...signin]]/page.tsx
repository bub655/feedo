import Navbar from "@/components/navbar";
import { SignIn } from "@clerk/nextjs";
import { LogIn } from "lucide-react";

export default function SignInPage() {
  return (   
    <>
    <Navbar />
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex flex-col items-center text-center mb-10">
        <LogIn className="h-12 w-12 mb-4" />
        <h1 className="text-4xl font-bold mb-2">Sign In</h1>
        <p className="text-xl text-muted-foreground">
          Welcome back to Feedo
        </p>
      </div>

      <div className="w-full flex justify-center">
        <SignIn signUpUrl="/signup" />
      </div>
    </div>
    </>
  );
}
