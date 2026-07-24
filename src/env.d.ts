/// <reference types="vite/client" />
/// <reference types="vite-ssg" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'glightbox' {
  interface GLightboxOptions {
    elements?: unknown[]
    loop?: boolean
    touchNavigation?: boolean
    [key: string]: unknown
  }
  interface GLightboxInstance {
    open: () => void
    openAt: (index: number) => void
    close: () => void
    destroy: () => void
    reload: () => void
    on: (event: string, cb: (...args: unknown[]) => void) => void
  }
  export default function GLightbox(options?: GLightboxOptions): GLightboxInstance
}

declare module 'glightbox/dist/css/glightbox.min.css'
