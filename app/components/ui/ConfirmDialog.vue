<script setup lang="ts">
const dialog = useConfirmState()
const { partner } = usePartner()

function close(ok: boolean) {
  if (!dialog.value) return
  dialog.value.resolve(ok)
  dialog.value = null
}

const { onMouseDown: onBackdropDown, onClick: onBackdropClick } = useBackdropClose(() => close(false))

// Keyboard shortcuts: Esc cancels, Enter confirms
function onKey(e: KeyboardEvent) {
  if (!dialog.value) return
  if (e.key === 'Escape') { e.preventDefault(); close(false) }
  if (e.key === 'Enter')  { e.preventDefault(); close(true)  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

// Auto-focus the primary button when the dialog opens
const confirmBtn = ref<HTMLButtonElement | null>(null)
watch(() => dialog.value?.id, (id) => {
  if (id) nextTick(() => confirmBtn.value?.focus())
})
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div
        v-if="dialog"
        class="confirm-overlay"
        @mousedown="onBackdropDown"
        @click="onBackdropClick"
        :style="partner?.primary_color ? `--brand: ${partner.primary_color}` : ''"
      >
        <div class="confirm-backdrop" />

        <div class="confirm-card" role="dialog" aria-modal="true">
          <div class="confirm-icon" :class="dialog.dangerous ? 'danger' : 'neutral'">
            <AppIcon :name="dialog.dangerous ? 'alert-circle' : 'help-circle'" :size="22" />
          </div>

          <h2 v-if="dialog.title" class="confirm-title">{{ dialog.title }}</h2>
          <p class="confirm-message">{{ dialog.message }}</p>

          <div class="confirm-actions">
            <button class="btn-secondary" @click="close(false)">{{ dialog.cancelLabel }}</button>
            <button
              ref="confirmBtn"
              class="btn-primary"
              :class="{ 'btn-danger': dialog.dangerous }"
              @click="close(true)"
            >
              {{ dialog.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.confirm-backdrop {
  position: absolute; inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}
.confirm-card {
  position: relative;
  width: 100%; max-width: 420px;
  background: white; border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.3);
  text-align: center;
}
.confirm-icon {
  width: 3rem; height: 3rem; margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.confirm-icon.neutral { background: color-mix(in srgb, var(--brand, #2563eb) 12%, white); color: var(--brand, #2563eb); }
.confirm-icon.danger { background: #fee2e2; color: #dc2626; }
.confirm-title {
  font-size: 1.125rem; font-weight: 700; color: #111827;
  margin: 0 0 0.5rem;
}
.confirm-message {
  font-size: 0.9375rem; color: #4b5563;
  line-height: 1.5;
  margin: 0 0 1.5rem;
  white-space: pre-line;
}
.confirm-actions {
  display: flex; gap: 0.625rem; justify-content: center;
}
.btn-secondary, .btn-primary {
  padding: 0.625rem 1.25rem;
  border-radius: 0.625rem;
  font-size: 0.9rem; font-weight: 600;
  border: 0; cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}
.btn-secondary {
  background: #f3f4f6; color: #374151;
}
.btn-secondary:hover { background: #e5e7eb; }
.btn-primary {
  background: var(--brand, #111827); color: white;
}
.btn-primary:hover { transform: translateY(-1px); filter: brightness(1.05); }
.btn-primary.btn-danger {
  background: #dc2626;
}
.btn-primary.btn-danger:hover { background: #b91c1c; }

/* Transition */
.confirm-enter-active, .confirm-leave-active {
  transition: opacity 0.18s ease;
}
.confirm-enter-active .confirm-card, .confirm-leave-active .confirm-card {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.confirm-enter-from, .confirm-leave-to { opacity: 0; }
.confirm-enter-from .confirm-card,
.confirm-leave-to .confirm-card {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}
</style>
