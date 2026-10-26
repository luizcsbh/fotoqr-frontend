/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ADSENSE_CLIENT_ID?: string;
  readonly VITE_ADSENSE_SLOT_LANDING?: string;
  readonly VITE_ADSENSE_SLOT_DASHBOARD?: string;
  readonly VITE_ADSENSE_SLOT_GALLERY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
