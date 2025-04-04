import { SignUp } from "@clerk/nextjs";
import { UserPlus } from "lucide-react";
import Navbar from "@/components/navbar";
export default function SignUpPage() {
  return (
    <>
    <Navbar />
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex flex-col items-center text-center mb-10">
        <p className="text-xl text-muted-foreground">
          Join the Feedo community
        </p>
      </div>

      <div className="w-full flex justify-center">
        <SignUp signInUrl="/signin" />
      </div>
    </div>
    </>
  );
}
