<script setup lang="ts">
import type { Partner } from '~~/shared/types/database'

definePageMeta({ layout: 'platform', middleware: ['auth', 'role-platform'] })

const route = useRoute()
const partnerId = route.params.id as string
const supabase = useSupabaseClient()

const { data: partner, refresh } = await useAsyncData(`partner-${partnerId}`, async () => {
  const { data } = await supabase
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .single()
  return data as Partner | null
})

const form = ref({
  name: '',
  slug: '',
  primary_color: '#1a56db',
  secondary_color: '#f3f4f6',
  support_email: '',
  terms_url: '',
  is_active: true,
})

watchEffect(() => {
  if (partner.value) {
    form.value = {
      name: partner.value.name,
      slug: partner.value.slug,
      primary_color: partner.value.primary_color,
      secondary_color: partner.value.secondary_color,
      support_email: partner.value.support_email || '',
      terms_url: partner.value.terms_url || '',
      is_active: partner.value.is_active,
    }
  }
})

const isSaving = ref(false)
const message = ref('')

async function save() {
  isSaving.value = true
  message.value = ''

  try {
    const { error } = await supabase
      .from('partners')
      .update({
        ...form.value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partnerId)

    if (error) throw error
    message.value = 'Opgeslagen!'
    await refresh()
  } catch (err: any) {
    message.value = `Fout: ${err.message}`
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div>
    <NuxtLink to="/platform/partners" class="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
      &larr; Terug naar partners
    </NuxtLink>

    <h1 class="mb-6 text-2xl font-bold text-gray-900">
      {{ partner?.name || 'Partner' }}
    </h1>

    <div v-if="partner" class="max-w-lg space-y-6">
      <div class="card">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Gegevens</h2>

        <div class="space-y-4">
          <div>
            <label class="label">Naam</label>
            <input v-model="form.name" type="text" class="input">
          </div>
          <div>
            <label class="label">Slug</label>
            <input v-model="form.slug" type="text" class="input">
            <p class="mt-1 text-xs text-gray-400">{{ form.slug }}.runon.nl</p>
          </div>
          <div>
            <label class="label">Support e-mail</label>
            <input v-model="form.support_email" type="email" class="input">
          </div>
          <div>
            <label class="label">Voorwaarden URL</label>
            <input v-model="form.terms_url" type="url" class="input">
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Branding</h2>

        <div class="flex gap-4">
          <div>
            <label class="label">Primaire kleur</label>
            <div class="flex items-center gap-2">
              <input
                v-model="form.primary_color"
                type="color"
                class="h-10 w-10 cursor-pointer rounded border border-gray-300"
              >
              <input v-model="form.primary_color" type="text" class="input w-28">
            </div>
          </div>
          <div>
            <label class="label">Achtergrondkleur</label>
            <div class="flex items-center gap-2">
              <input
                v-model="form.secondary_color"
                type="color"
                class="h-10 w-10 cursor-pointer rounded border border-gray-300"
              >
              <input v-model="form.secondary_color" type="text" class="input w-28">
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <label class="flex items-center gap-2">
          <input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300">
          <span class="text-sm font-medium text-gray-700">Partner actief</span>
        </label>
      </div>

      <div class="flex items-center gap-4">
        <button
          class="btn-primary"
          :disabled="isSaving"
          @click="save"
        >
          {{ isSaving ? 'Opslaan...' : 'Opslaan' }}
        </button>
        <span v-if="message" class="text-sm" :class="message.startsWith('Fout') ? 'text-red-600' : 'text-green-600'">
          {{ message }}
        </span>
      </div>
    </div>
  </div>
</template>
