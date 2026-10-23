import { v as defineNuxtRouteMiddleware, w as useSupabaseUser, n as navigateTo, j as useRuntimeConfig } from './server.mjs';
import 'vue';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@supabase/functions-js';
import '@supabase/postgrest-js';
import '@supabase/realtime-js';
import '@supabase/storage-js';
import '@supabase/auth-js';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'devalue';
import 'vue/server-renderer';
import '@unhead/ssr';
import 'unhead';
import '@unhead/shared';
import 'vue-router';
import '@supabase/ssr';

const auth = defineNuxtRouteMiddleware(async () => {
  const config = useRuntimeConfig();
  if (config.public.demoMode) {
    return;
  }
  const user = useSupabaseUser();
  if (!user.value) {
    return navigateTo("/login");
  }
});

export { auth as default };
//# sourceMappingURL=auth-DuNIFa0I.mjs.map
