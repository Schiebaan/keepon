import { d as defineEventHandler, r as readBody, c as createError, g as getServiceRoleClient } from '../../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../../_/auth-guard.mjs';
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

const STEP_ORDER = ["hero", "voorstel", "incasso", "done"];
const STEP_INDEX = Object.fromEntries(STEP_ORDER.map((s, i) => [s, i]));
const step_post = defineEventHandler(async (event) => {
  var _a, _b;
  const user = await requireAuth(event);
  const body = await readBody(event);
  const step = body == null ? void 0 : body.step;
  if (!step || !(step in STEP_INDEX)) {
    throw createError({ statusCode: 400, message: "Onbekende stap" });
  }
  const supabase = getServiceRoleClient();
  const current = ((_a = user.user_metadata) == null ? void 0 : _a.onboarding) || {};
  const currentStep = current.step || "hero";
  const currentIdx = (_b = STEP_INDEX[currentStep]) != null ? _b : 0;
  const nextIdx = STEP_INDEX[step];
  if (nextIdx < currentIdx) {
    return { step: currentStep, regression_blocked: true };
  }
  await Promise.all([
    supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        onboarding: { ...current, step }
      }
    }),
    supabase.from("customers").update({ onboarding_step: step }).eq("auth_user_id", user.id)
  ]);
  return { step };
});

export { step_post as default };
//# sourceMappingURL=step.post.mjs.map
