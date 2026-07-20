/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_RECAPTCHA_SITE_KEY: string;
  readonly VITE_START_YEAR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
