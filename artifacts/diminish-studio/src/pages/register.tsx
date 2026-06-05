import { SignUp } from "@clerk/clerk-react";

export function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center">
      <SignUp 
        path="/register"
        routing="path"
        signInUrl="/login"
        redirectUrl="/library"
      />
    </div>
  );
}