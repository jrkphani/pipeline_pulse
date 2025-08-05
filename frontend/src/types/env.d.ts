/// <reference types="vite/client" />

/**
 * Environment variables interface for Pipeline Pulse Frontend
 * 
 * This interface defines all environment variables available through import.meta.env
 * in the Vite build system. All custom environment variables must be prefixed with VITE_
 * to be exposed to the client-side code.
 */
interface ImportMetaEnv {
  // Development mode flag (built-in Vite variable)
  readonly DEV: boolean
  
  // Production mode flag (built-in Vite variable)
  readonly PROD: boolean
  
  // Server-side rendering flag (built-in Vite variable)
  readonly SSR: boolean
  
  // API Configuration
  readonly VITE_API_URL: string
  
  // Environment Configuration
  readonly VITE_ENVIRONMENT: 'development' | 'production' | 'staging'
  
  // App Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_COMPANY_NAME: string
  
  // Add any additional environment variables here
  // Example:
  // readonly VITE_FEATURE_FLAG_NAME: string
}

/**
 * Extend the ImportMeta interface to include our custom env property
 */
interface ImportMeta {
  readonly env: ImportMetaEnv
}
