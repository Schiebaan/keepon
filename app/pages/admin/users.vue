<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { partner } = usePartner()

const users = ref<{ id: string; email: string; created_at: string; last_sign_in: string | null }[]>([])
const isLoading = ref(true)
const showAddModal = ref(false)
const newEmail = ref('')
const isAdding = ref(false)
const addResult = ref<{ email: string; temporary_password: string } | null>(null)
const addError = ref('')

async function getAuthHeaders() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function loadUsers() {
  isLoading.value = true
  try {
    const headers = await getAuthHeaders()
    users.value = await $fetch('/api/partners/users', { headers })
  } catch {} finally {
    isLoading.value = false
  }
}

async function addUser() {
  if (!newEmail.value) return
  isAdding.value = true
  addError.value = ''
  addResult.value = null
  try {
    const headers = await getAuthHeaders()
    const result = await $fetch('/api/partners/users', {
      method: 'POST',
      headers,
      body: { email: newEmail.value },
    })
    addResult.value = { email: result.email, temporary_password: result.temporary_password }
    await loadUsers()
  } catch (e: any) {
    addError.value = e?.data?.message || e?.message || 'Toevoegen mislukt'
  } finally {
    isAdding.value = false
  }
}

async function removeUser(userId: string, email: string) {
  if (!confirm(`Weet je zeker dat je ${email} wilt verwijderen als beheerder?`)) return
  const headers = await getAuthHeaders()
  await $fetch(`/api/partners/users/${userId}`, { method: 'DELETE', headers })
  await loadUsers()
}

function closeModal() {
  showAddModal.value = false
  newEmail.value = ''
  addResult.value = null
  addError.value = ''
}

function formatDate(d: string | null) {
  if (!d) return 'Nooit'
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(loadUsers)
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gebruikers</h1>
        <p class="mt-1 text-sm text-gray-500">Beheer wie toegang heeft tot het {{ partner.name }} portaal.</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        @click="showAddModal = true"
      >
        <AppIcon name="plus" :size="16" />
        Gebruiker toevoegen
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="section py-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      <p class="mt-3 text-sm text-gray-500">Laden...</p>
    </div>

    <!-- Users list -->
    <div v-else class="section">
      <div v-if="users.length === 0" class="py-12 text-center">
        <AppIcon name="users" :size="32" class="mx-auto text-gray-300 mb-3" />
        <p class="text-sm text-gray-500">Nog geen extra gebruikers toegevoegd.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="u in users"
          :key="u.id"
          class="flex items-center justify-between py-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
              :style="{ backgroundColor: partner.primary_color }"
            >
              {{ u.email.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ u.email }}</p>
              <p class="text-xs text-gray-400">Laatst ingelogd: {{ formatDate(u.last_sign_in) }}</p>
            </div>
          </div>
          <button
            class="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Verwijderen"
            @click="removeUser(u.id, u.email)"
          >
            <AppIcon name="trash" :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Add user modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="closeModal"
        >
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div class="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
            <div class="border-b border-gray-100 px-6 py-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">Gebruiker toevoegen</h3>
                <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" @click="closeModal">
                  <AppIcon name="x" :size="18" />
                </button>
              </div>
            </div>

            <div class="px-6 py-5">
              <!-- Success -->
              <div v-if="addResult" class="text-center">
                <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                  <AppIcon name="check-circle" :size="28" class="text-green-600" />
                </div>
                <p class="text-sm font-semibold text-gray-900 mb-1">Gebruiker aangemaakt</p>
                <p class="text-sm text-gray-600 mb-4">{{ addResult.email }}</p>

                <div class="rounded-lg bg-amber-50 border border-amber-200 p-3 text-left mb-4">
                  <p class="text-xs font-semibold text-amber-800 mb-1">Tijdelijk wachtwoord</p>
                  <p class="font-mono text-sm text-amber-900 select-all">{{ addResult.temporary_password }}</p>
                  <p class="text-xs text-amber-600 mt-1">Deel dit veilig met de gebruiker. Ze kunnen het wijzigen na inloggen.</p>
                </div>

                <button class="btn-primary w-full" @click="closeModal">Sluiten</button>
              </div>

              <!-- Form -->
              <template v-else>
                <p class="text-sm text-gray-600 mb-4">
                  Voeg een collega toe als beheerder van {{ partner.name }}. Ze krijgen dezelfde toegang als jij.
                </p>

                <form @submit.prevent="addUser">
                  <div>
                    <label class="label">E-mailadres</label>
                    <input
                      v-model="newEmail"
                      type="email"
                      class="input"
                      placeholder="collega@bedrijf.nl"
                      required
                      autofocus
                    />
                  </div>

                  <p v-if="addError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {{ addError }}
                  </p>

                  <div class="mt-5 flex justify-end gap-3">
                    <button type="button" class="btn-secondary" @click="closeModal">Annuleren</button>
                    <button
                      type="submit"
                      class="btn-primary"
                      :disabled="!newEmail || isAdding"
                    >
                      <AppIcon v-if="!isAdding" name="plus" :size="16" />
                      {{ isAdding ? 'Toevoegen...' : 'Toevoegen' }}
                    </button>
                  </div>
                </form>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
