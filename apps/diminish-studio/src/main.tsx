import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { setBaseUrl } from '@workspace/api-client-react'
import './index.css'
import App from './App.tsx'
import { frontendConfig } from './config.ts'
import { isClerkPublishableKeyValid } from './config-schema.ts'

setBaseUrl(frontendConfig.apiBaseUrl)

// ——— Helpers: decide whether to mount ClerkProvider ———

function isLabRoute(): boolean {
  try {
    return window.location.pathname.startsWith('/lab/')
  } catch {
    return false
  }
}

const hasRealClerkKey = isClerkPublishableKeyValid(
  frontendConfig.clerkPublishableKey,
)
const isLab = isLabRoute()
const shouldUseClerk = hasRealClerkKey && !isLab

// Gracefully recover if ClerkProvider throws at init (e.g. domain not
// allow-listed on preview). Without this boundary the whole app white-screens
// even for /lab/sidebar-atomic which doesn't need auth.
class ClerkErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      '[Clerk] ClerkProvider failed — falling back to no-auth mode. ' +
        'Add VITE_CLERK_PUBLISHABLE_KEY and allow-list the preview domain in Clerk dashboard if you want real auth.',
      error,
      info,
    )
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

const rootEl = document.getElementById('root')!

if (shouldUseClerk) {
  createRoot(rootEl).render(
    <StrictMode>
      <ClerkErrorBoundary fallback={<App enableClerk={false} />}>
        <ClerkProvider publishableKey={frontendConfig.clerkPublishableKey}>
          <App enableClerk />
        </ClerkProvider>
      </ClerkErrorBoundary>
    </StrictMode>,
  )
} else {
  if (!hasRealClerkKey) {
    console.warn(
      '[Clerk] No valid publishableKey (dummy or missing) — rendering without ClerkProvider. ' +
        'Preview will work for /lab/sidebar-atomic in degraded auth mode. ' +
        'To enable real auth on Vercel Preview, set VITE_CLERK_PUBLISHABLE_KEY (pk_test_...) in Vercel dashboard.',
    )
  }
  if (isLab) {
    console.info('[Clerk] /lab/* route — bypassing ClerkProvider by design')
  }
  createRoot(rootEl).render(
    <StrictMode>
      <App enableClerk={false} />
    </StrictMode>,
  )
}
