export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  // Use app/ as source directory (same as compat v4, but without the .nuxt/dist cleanup that causes EPERM on Windows)
  srcDir: 'app/',

  modules: [
    // Supabase alleen laden als we NIET in demo mode zijn
    ...(process.env.DEMO_MODE !== 'true' ? ['@nuxtjs/supabase'] : []),
  ],

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/auth/callback',
      exclude: ['/', '/login', '/welkom/*', '/voorwaarden/*'],
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
      title: 'RunON',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Modulair klantportaal voor installateurs' },
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

  // Prevent Windows EPERM errors during HMR
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },
  },
})
