<script setup lang="ts">
definePageMeta({ layout: 'platform', middleware: ['auth', 'role-platform'] })

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  category: string | null
  sort_order: number
  published_at: string | null
  updated_at: string
}

const articles = ref<Article[]>([])
const loading = ref(true)
const router = useRouter()

async function authHeaders() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function load() {
  loading.value = true
  try {
    articles.value = await $fetch<Article[]>('/api/support/admin/articles', { headers: await authHeaders() })
  } catch { articles.value = [] }
  finally { loading.value = false }
}
onMounted(load)

async function createNew() {
  const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' }
  const created = await $fetch<Article>('/api/support/admin/articles', {
    method: 'POST',
    headers,
    body: { title: 'Nieuw artikel', body_md: '# Nieuw artikel\n\nSchrijf hier je inhoud...' },
  })
  router.push(`/platform/support/${created.id}`)
}

async function togglePublish(a: Article) {
  const headers = { ...(await authHeaders()), 'Content-Type': 'application/json' }
  await $fetch(`/api/support/admin/articles/${a.id}`, {
    method: 'PUT',
    headers,
    body: { publish: !a.published_at },
  })
  await load()
}

const confirm = useConfirm()
async function remove(a: Article) {
  const ok = await confirm({
    title: 'Artikel verwijderen',
    message: `"${a.title}" wordt definitief verwijderd.`,
    confirmLabel: 'Verwijderen',
    dangerous: true,
  })
  if (!ok) return
  await $fetch(`/api/support/admin/articles/${a.id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  await load()
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '' }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Support-kennisbank</h1>
        <p class="mt-1 text-sm text-gray-500">
          Artikelen die je op <NuxtLink to="/support" class="text-blue-600 hover:underline">upsol.nl/support</NuxtLink> publiceert.
          Alleen platform-admins kunnen deze bewerken — partners niet.
        </p>
      </div>
      <button class="btn-primary" @click="createNew">
        <AppIcon name="plus" :size="16" />
        Nieuw artikel
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center">
      <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <div v-else-if="!articles.length" class="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
      <AppIcon name="file-text" :size="40" class="mx-auto text-gray-300 mb-3" />
      <p class="text-sm text-gray-500">Nog geen artikelen. Klik "Nieuw artikel" om te beginnen.</p>
    </div>

    <div v-else class="section overflow-hidden p-0">
      <table class="w-full text-sm">
        <thead class="border-b border-gray-100 bg-gray-50">
          <tr class="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th class="px-4 py-3">Titel</th>
            <th class="px-4 py-3">Categorie</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Bijgewerkt</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="a in articles" :key="a.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <NuxtLink :to="`/platform/support/${a.id}`" class="text-gray-900 font-medium hover:underline">
                {{ a.title }}
              </NuxtLink>
              <p v-if="a.excerpt" class="mt-0.5 text-xs text-gray-500 truncate max-w-md">{{ a.excerpt }}</p>
            </td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ a.category || '—' }}</td>
            <td class="px-4 py-3">
              <button
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                :class="a.published_at
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'"
                :title="a.published_at ? 'Klik om te depubliceren' : 'Klik om te publiceren'"
                @click="togglePublish(a)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="a.published_at ? 'bg-green-500' : 'bg-amber-500'" />
                {{ a.published_at ? 'Gepubliceerd' : 'Concept' }}
              </button>
            </td>
            <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{{ fmtDate(a.updated_at) }}</td>
            <td class="px-4 py-3 text-right">
              <button class="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500" title="Verwijderen" @click="remove(a)">
                <AppIcon name="trash" :size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
