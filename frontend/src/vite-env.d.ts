/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_URL: string;
  // add other VITE_ vars here…
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
