<script setup lang="ts">
definePageMeta({ layout: false })

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body_md: string
  body_html: string
  category: string | null
  updated_at: string
}

const route = useRoute()
const slug = route.params.slug as string

const { data: article, error } = await useFetch<Article>(`/api/support/articles/${slug}`, {
  key: `support-article-${slug}`,
})

useHead(() => ({
  title: article.value ? `${article.value.title} · UPsol Support` : 'Support · UPsol',
  meta: article.value?.excerpt
    ? [{ name: 'description', content: article.value.excerpt }]
    : [],
}))

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return '' }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="border-b border-gray-100 bg-white">
      <div class="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <NuxtLink to="/support" class="text-sm font-semibold text-gray-900 no-underline">← Support</NuxtLink>
        <NuxtLink to="/" class="text-sm text-gray-500 no-underline">UPsol</NuxtLink>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-4 py-10">
      <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Artikel niet gevonden of niet gepubliceerd.
        <NuxtLink to="/support" class="underline">Terug naar overzicht</NuxtLink>
      </div>

      <article v-else-if="article" class="rounded-2xl border border-gray-100 bg-white p-8">
        <p v-if="article.category" class="text-xs font-semibold uppercase tracking-wider text-gray-400">{{ article.category }}</p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-gray-900">{{ article.title }}</h1>
        <p v-if="article.excerpt" class="mt-2 text-base text-gray-500">{{ article.excerpt }}</p>
        <p class="mt-3 text-xs text-gray-400">Bijgewerkt op {{ fmtDate(article.updated_at) }}</p>

        <div class="prose prose-sm mt-8 max-w-none" v-html="article.body_html" />
      </article>

      <div class="mt-8 text-center">
        <NuxtLink to="/support" class="text-sm text-gray-500 hover:text-gray-800">← Bekijk alle artikelen</NuxtLink>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Minimalist prose-styling voor de rendered markdown. Als we later @tailwindcss/typography
   toevoegen kan dit weg — voor nu is dit self-contained. */
:deep(.prose h2) { font-size: 1.25rem; font-weight: 700; color: #111827; margin-top: 2rem; margin-bottom: 0.75rem; }
:deep(.prose h3) { font-size: 1.05rem; font-weight: 600; color: #111827; margin-top: 1.5rem; margin-bottom: 0.5rem; }
:deep(.prose p)  { color: #374151; line-height: 1.65; margin-bottom: 1rem; }
:deep(.prose ul), :deep(.prose ol) { margin: 0.75rem 0 1rem 1.25rem; }
:deep(.prose li) { color: #374151; line-height: 1.65; margin-bottom: 0.4rem; }
:deep(.prose ul) { list-style: disc; }
:deep(.prose ol) { list-style: decimal; }
:deep(.prose a)  { color: #2563eb; text-decoration: underline; }
:deep(.prose strong) { color: #111827; font-weight: 600; }
:deep(.prose code) { background: #f3f4f6; padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.9em; }
:deep(.prose pre)  { background: #111827; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
:deep(.prose pre code) { background: transparent; padding: 0; color: inherit; }
:deep(.prose blockquote) { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #6b7280; margin: 1rem 0; font-style: italic; }
:deep(.prose table) { border-collapse: collapse; margin: 1rem 0; width: 100%; }
:deep(.prose th), :deep(.prose td) { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; }
:deep(.prose th) { background: #f9fafb; font-weight: 600; }
</style>
