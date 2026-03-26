// Stubs for Supabase composables when @nuxtjs/supabase module is disabled
// These are only used in demo mode — the real composables come from the module
// Remove this file when @nuxtjs/supabase is enabled in nuxt.config.ts

// Check if the real composables exist (they would be auto-imported by the module)
// If not, provide stubs to prevent compile errors

function createChainableStub(): any {
  const handler: ProxyHandler<any> = {
    get: (_target, prop) => {
      if (prop === 'then') return undefined // not a promise
      if (prop === 'data') return { value: null }
      if (prop === 'error') return null
      return new Proxy((..._args: any[]) => new Proxy({}, handler), handler)
    },
    apply: () => new Proxy({}, handler),
  }
  return new Proxy({}, handler)
}

// These will only be used if @nuxtjs/supabase doesn't provide them
// Nuxt auto-import will prefer the module's composables when available
export function useSupabaseClient() {
  return createChainableStub()
}

export function useSupabaseUser() {
  return ref(null)
}
