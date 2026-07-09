<script setup lang="ts">
definePageMeta({ layout: false })

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  category: string | null
  updated_at: string
}

interface Resp {
  articles: Article[]
  categories: { name: string; items: Article[] }[]
  total: number
  query: string | null
}

const searchInput = ref('')
const data = ref<Resp | null>(null)
const loading = ref(true)
const error = ref('')

async function load(q = '') {
  loading.value = true
  error.value = ''
  try {
    const url = q ? `/api/support/articles?q=${encodeURIComponent(q)}` : '/api/support/articles'
    data.value = await $fetch<Resp>(url)
  } catch (e: any) {
    error.value = e?.data?.message || 'Kon artikelen niet laden'
  } finally {
    loading.value = false
  }
}
onMounted(() => load())

let searchTimer: any = null
watch(searchInput, (v) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(v.trim()), 250)
})

useHead({
  title: 'Support · UPsol',
  meta: [{ name: 'description', content: 'Handleiding en kennisartikelen voor installateurs die met UPsol werken.' }],
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top bar -->
    <header class="border-b border-gray-100 bg-white">
      <div class="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <NuxtLink to="/" class="text-sm font-semibold text-gray-900 no-underline">← Terug naar UPsol</NuxtLink>
        <NuxtLink to="/support" class="text-sm font-semibold text-gray-500 no-underline">Support</NuxtLink>
      </div>
    </header>

    <!-- Hero + search -->
    <div class="mx-auto max-w-4xl px-4 py-10">
      <h1 class="text-3xl font-bold tracking-tight text-gray-900">Hoe kunnen we helpen?</h1>
      <p class="mt-2 text-sm text-gray-500">Handleidingen, uitleg en veel-gestelde vragen over UPsol.</p>

      <div class="mt-6 relative">
        <AppIcon name="search" :size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchInput"
          type="search"
          class="input pl-11 text-base py-3"
          placeholder="Zoek een artikel..."
          autofocus
        />
      </div>
    </div>

    <!-- Content -->
    <main class="mx-auto max-w-4xl px-4 pb-16">
      <div v-if="loading" class="py-12 text-center">
        <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>

      <div v-else-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{{ error }}</div>

      <!-- Zoek-resultaten (platte lijst) -->
      <div v-else-if="data?.query" class="space-y-3">
        <p class="text-xs text-gray-500 uppercase tracking-wider">
          {{ data.total }} {{ data.total === 1 ? 'resultaat' : 'resultaten' }} voor "{{ data.query }}"
        </p>
        <NuxtLink
          v-for="a in data.articles"
          :key="a.id"
          :to="`/support/${a.slug}`"
          class="block rounded-2xl border border-gray-100 bg-white p-5 hover:border-gray-200 hover:shadow-sm transition-all no-underline"
        >
          <p v-if="a.category" class="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{{ a.category }}</p>
          <h3 class="mt-1 text-base font-semibold text-gray-900">{{ a.title }}</h3>
          <p v-if="a.excerpt" class="mt-1 text-sm text-gray-500">{{ a.excerpt }}</p>
        </NuxtLink>
        <div v-if="!data.articles.length" class="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
          <p class="text-sm text-gray-500">Niets gevonden. Probeer andere zoektermen.</p>
        </div>
      </div>

      <!-- Standaardweergave: gegroepeerd per category -->
      <div v-else class="space-y-8">
        <div v-for="cat in data?.categories" :key="cat.name">
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">{{ cat.name }}</h2>
          <div class="space-y-2">
            <NuxtLink
              v-for="a in cat.items"
              :key="a.id"
              :to="`/support/${a.slug}`"
              class="block rounded-2xl border border-gray-100 bg-white p-5 hover:border-gray-200 hover:shadow-sm transition-all no-underline"
            >
              <h3 class="text-base font-semibold text-gray-900">{{ a.title }}</h3>
              <p v-if="a.excerpt" class="mt-1 text-sm text-gray-500">{{ a.excerpt }}</p>
              <div class="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                <AppIcon name="chevron-right" :size="12" />
                Lees artikel
              </div>
            </NuxtLink>
          </div>
        </div>
        <div v-if="!data?.categories.length" class="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
          <p class="text-sm text-gray-500">Er zijn nog geen artikelen gepubliceerd.</p>
        </div>
      </div>
    </main>
  </div>
</template>
