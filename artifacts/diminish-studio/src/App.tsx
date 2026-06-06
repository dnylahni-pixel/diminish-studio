import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@clerk/clerk-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";

import { AppLayout } from "@/components/layout/app-layout";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { LibraryPage } from "@/pages/library";
import { PlayerPage } from "@/pages/player";
import { LearnPage } from "@/pages/learn";
import { ProcessPage } from "@/pages/process";
import { ProfilePage } from "@/pages/profile";

const queryClient = new QueryClient();

function AuthSetup() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(async () => {
      const token = await getToken();
      return token;
    });
  }, [getToken]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />

      <Route path="/login" component={LoginPage} />
      <Route path="/login/:rest*" component={LoginPage} />

      <Route path="/register" component={RegisterPage} />
      <Route path="/register/:rest*" component={RegisterPage} />

      <Route path="/library">
        <AppLayout>
          <LibraryPage />
        </AppLayout>
      </Route>

      <Route path="/songs/:id">
        <AppLayout>
          <PlayerPage />
        </AppLayout>
      </Route>

      <Route path="/learn">
        <AppLayout>
          <LearnPage />
        </AppLayout>
      </Route>

      <Route path="/process">
        <AppLayout>
          <ProcessPage />
        </AppLayout>
      </Route>

      <Route path="/profile">
        <AppLayout>
          <ProfilePage />
        </AppLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthSetup />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
