/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the API, e.g. /api/v1 (uses Vite proxy in dev) */
  readonly VITE_API_URL: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
