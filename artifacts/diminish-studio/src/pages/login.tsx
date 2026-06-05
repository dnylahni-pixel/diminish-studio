import { SignIn } from "@clerk/clerk-react";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center">
      <SignIn 
        path="/login"
        routing="path"
        signUpUrl="/register"
        fallbackRedirectUrl="/library"
      />
    </div>
  );
}