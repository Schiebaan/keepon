import { v as defineNuxtRouteMiddleware, l as useAuth, x as executeAsync, n as navigateTo } from './server.mjs';
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

const rolePlatform = defineNuxtRouteMiddleware(async () => {
  let __temp, __restore;
  const { userRole, resolveRole } = useAuth();
  if (!userRole.value) {
    [__temp, __restore] = executeAsync(() => resolveRole()), await __temp, __restore();
  }
  if (userRole.value !== "platform_admin") {
    return navigateTo("/");
  }
});

export { rolePlatform as default };
//# sourceMappingURL=role-platform-DYe5uxS-.mjs.map
