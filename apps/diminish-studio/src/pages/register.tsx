import { SignUp } from "@clerk/clerk-react";
import { useRuntimeConfig } from "@/lib/runtime-config";

export function RegisterPage() {
  const runtimeConfig = useRuntimeConfig();
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center">
      <SignUp
        path="/register"
        routing="path"
        signInUrl="/login"
        fallbackRedirectUrl={runtimeConfig.ui.postLoginRedirect}
      />
    </div>
  );
}
