export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  // Use app/ as source directory (same as compat v4, but without the .nuxt/dist cleanup that causes EPERM on Windows)
  srcDir: 'app/',
  serverDir: 'server/',

  modules: [
    // Supabase alleen laden als we NIET in demo mode zijn
    ...(process.env.DEMO_MODE !== 'true' ? ['@nuxtjs/supabase'] : []),
  ],

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/auth/callback',
      // /support is de publieke kennisbank — moet zonder login leesbaar zijn.
      // Het beheer ervan zit onder /platform/support en blijft wél afgeschermd.
      exclude: ['/', '/login', '/welkom/*', '/voorwaarden/*', '/api/*', '/auth/*', '/support', '/support/*'],
    },
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    mollieApiKey: '',
    supabaseServiceRoleKey: '',
    public: {
      baseDomain: 'localhost:3000',
      supabaseUrl: '',
      supabaseKey: '',
      demoMode: process.env.DEMO_MODE === 'true',
    },
  },

  app: {
    head: {
      // Title, description, theme-color and favicon are set dynamically per partner
      // in app.vue via useHead. Only truly static meta lives here.
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  // Flatten component directory prefixes so layout/AppHeader.vue is <AppHeader> not <LayoutAppHeader>
  components: [
    { path: '~/components', pathPrefix: false },
  ],

  typescript: {
    strict: true,
  },

  // Polling only needed for Windows/dev — skip in production
  ...(process.env.NODE_ENV !== 'production' ? {
    vite: {
      server: {
        watch: {
          usePolling: true,
          interval: 1000,
        },
      },
    },
  } : {}),
})
