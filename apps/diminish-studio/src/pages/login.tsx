import { SignIn } from "@clerk/clerk-react";
import { useRuntimeConfig } from "@/lib/runtime-config";

export function LoginPage() {
  const runtimeConfig = useRuntimeConfig();
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center">
      <SignIn
        path="/login"
        routing="path"
        signUpUrl="/register"
        fallbackRedirectUrl={runtimeConfig.ui.postLoginRedirect}
      />
    </div>
  );
}