import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { setBaseUrl } from '@workspace/api-client-react'
import './index.css'
import App from './App.tsx'
import { frontendConfig } from './config.ts'

setBaseUrl(frontendConfig.apiBaseUrl)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={frontendConfig.clerkPublishableKey}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
