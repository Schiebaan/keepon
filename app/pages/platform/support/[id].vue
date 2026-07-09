<script setup lang="ts">
definePageMeta({ layout: 'platform', middleware: ['auth', 'role-platform'] })

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body_md: string
  category: string | null
  sort_order: number
  published_at: string | null
  updated_at: string
}

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const article = ref<Article | null>(null)
const loading = ref(true)
const saving = ref(false)
const saveMsg = ref('')
const error = ref('')
const preview = ref<string>('')
const showPreview = ref(false)

async function authHeaders() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function load() {
  loading.value = true
  try {
    article.value = await $fetch<Article>(`/api/support/admin/articles/${id}`, { headers: await authHeaders() })
  } catch (e: any) {
    error.value = e?.data?.message || 'Kon niet laden'
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function save(opts: { publish?: boolean } = {}) {
  if (!article.value) return
  saving.value = true
  saveMsg.value = ''
  error.value = ''
  try {
    const body: Record<string, any> = {
      title: article.value.title,
      slug: article.value.slug,
      excerpt: article.value.excerpt || '',
      body_md: article.value.body_md,
      category: article.value.category || '',
      sort_order: article.value.sort_order,
    }
    if (opts.publish === true) body.publish = true
    if (opts.publish === false) body.publish = false

    const updated = await $fetch<Article>(`/api/support/admin/articles/${id}`, {
      method: 'PUT',
      headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      body,
    })
    if (article.value) {
      article.value.published_at = updated.published_at
      article.value.updated_at = updated.updated_at
    }
    saveMsg.value = 'Opgeslagen'
    setTimeout(() => { saveMsg.value = '' }, 2000)
  } catch (e: any) {
    error.value = e?.data?.message || 'Opslaan mislukt'
  } finally {
    saving.value = false
  }
}

// Live preview via de public GET endpoint (die rendert de MD naar HTML).
async function togglePreview() {
  showPreview.value = !showPreview.value
  if (!showPreview.value) return
  if (!article.value?.body_md) { preview.value = '<em>Nog geen inhoud</em>'; return }
  // Simpele client-side MD rendering via een tijdelijke fetch met dummy-slug
  // is niet mogelijk zonder DB — we sturen daarom de MD naar een lichte
  // hulproute, of we doen 't hier client-side met marked. Voor simpelheid:
  // render preview client-side. Dynamische import zodat de bundle-size van
  // /platform/support/[id] alleen groter wordt als de auteur preview gebruikt.
  const { marked } = await import('marked')
  preview.value = marked.parse(article.value.body_md, { gfm: true, breaks: false, async: false }) as string
}

watch(() => article.value?.body_md, () => {
  if (showPreview.value) togglePreview() // niet toggle, refresh
})

// --- Screenshot upload -----------------------------------------------------
const fileInput = ref<HTMLInputElement | null>(null)
const bodyTextarea = ref<HTMLTextAreaElement | null>(null)
const uploading = ref(false)

function pickImage() {
  fileInput.value?.click()
}

async function onImagePicked(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''  // reset zodat re-upload van hetzelfde bestand ook trigger geeft
  if (!file || !article.value) return

  uploading.value = true
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file)
    const headers = await authHeaders()
    const res = await $fetch<{ url: string }>('/api/support/admin/upload-image', {
      method: 'POST',
      headers,
      body: fd,
    })

    // Voeg de markdown-image-syntax in op de cursorpositie
    const ta = bodyTextarea.value
    const alt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ')
    const md = `\n\n![${alt}](${res.url})\n\n`

    if (ta) {
      const start = ta.selectionStart ?? article.value.body_md.length
      const end = ta.selectionEnd ?? start
      const before = article.value.body_md.slice(0, start)
      const after = article.value.body_md.slice(end)
      article.value.body_md = before + md + after
      // Herstel cursor na de ingevoegde tekst
      nextTick(() => {
        ta.focus()
        const pos = start + md.length
        ta.setSelectionRange(pos, pos)
      })
    } else {
      article.value.body_md += md
    }
  } catch (e: any) {
    error.value = e?.data?.message || 'Upload mislukt'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="loading" class="py-12 text-center">
      <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <template v-else-if="article">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <NuxtLink to="/platform/support" class="text-xs text-gray-500 hover:text-gray-800 no-underline">← Alle artikelen</NuxtLink>
          <h1 class="mt-1 text-xl font-bold text-gray-900">Artikel bewerken</h1>
          <p class="text-xs text-gray-500">
            Publieke URL:
            <a :href="`/support/${article.slug}`" target="_blank" class="text-blue-600 hover:underline">/support/{{ article.slug }}</a>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="saveMsg" class="text-xs font-medium text-green-600">{{ saveMsg }}</span>
          <button class="btn-secondary text-sm" @click="togglePreview">
            <AppIcon :name="showPreview ? 'x' : 'search'" :size="14" />
            {{ showPreview ? 'Sluit preview' : 'Preview' }}
          </button>
          <button
            v-if="!article.published_at"
            class="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"
            :disabled="saving"
            @click="save({ publish: true })"
          >
            Publiceer
          </button>
          <button
            v-else
            class="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
            :disabled="saving"
            @click="save({ publish: false })"
          >
            Depubliceer
          </button>
          <button class="btn-primary text-sm" :disabled="saving" @click="save()">
            {{ saving ? 'Opslaan...' : 'Opslaan' }}
          </button>
        </div>
      </div>

      <div v-if="error" class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{{ error }}</div>

      <div class="grid gap-4" :class="showPreview ? 'lg:grid-cols-2' : ''">
        <!-- Editor -->
        <div class="section space-y-4">
          <div>
            <label class="label">Titel</label>
            <input v-model="article.title" type="text" class="input" maxlength="200" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Slug (URL)</label>
              <input v-model="article.slug" type="text" class="input font-mono text-sm" maxlength="80" />
            </div>
            <div>
              <label class="label">Categorie</label>
              <input v-model="article.category" type="text" class="input" placeholder="bv. Aan de slag" maxlength="60" />
            </div>
          </div>
          <div>
            <label class="label">Excerpt (korte samenvatting)</label>
            <textarea v-model="article.excerpt" class="input" rows="2" maxlength="400" placeholder="1-2 zinnen die op de indexpagina getoond worden" />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="label !mb-0">Inhoud <span class="text-gray-400 font-normal">(Markdown)</span></label>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                :disabled="uploading"
                @click="pickImage"
              >
                <AppIcon name="upload" :size="12" />
                {{ uploading ? 'Uploaden...' : 'Screenshot invoegen' }}
              </button>
              <input
                ref="fileInput"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                class="hidden"
                @change="onImagePicked"
              />
            </div>
            <textarea
              ref="bodyTextarea"
              v-model="article.body_md"
              class="input font-mono text-sm"
              style="min-height: 500px;"
              spellcheck="true"
            />
            <p class="mt-1 text-[11px] text-gray-400">
              Ondersteuning: <code>##</code> koppen, <code>**vet**</code>, <code>*cursief*</code>, <code>[link](url)</code>,
              lijsten, code-blocks, tabellen (GFM). Screenshots plakken via de knop hierboven.
            </p>
          </div>
        </div>

        <!-- Preview (optioneel) -->
        <div v-if="showPreview" class="section">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Preview</p>
          <h1 class="text-2xl font-bold text-gray-900">{{ article.title }}</h1>
          <p v-if="article.excerpt" class="mt-1 text-sm text-gray-500">{{ article.excerpt }}</p>
          <div class="prose prose-sm mt-6 max-w-none" v-html="preview" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
:deep(.prose h2) { font-size: 1.25rem; font-weight: 700; color: #111827; margin-top: 1.5rem; margin-bottom: 0.5rem; }
:deep(.prose h3) { font-size: 1.05rem; font-weight: 600; color: #111827; margin-top: 1rem; margin-bottom: 0.4rem; }
:deep(.prose p)  { color: #374151; line-height: 1.6; margin-bottom: 0.75rem; }
:deep(.prose ul), :deep(.prose ol) { margin: 0.5rem 0 0.75rem 1.25rem; }
:deep(.prose ul) { list-style: disc; }
:deep(.prose ol) { list-style: decimal; }
:deep(.prose li) { margin-bottom: 0.25rem; }
:deep(.prose a)  { color: #2563eb; text-decoration: underline; }
:deep(.prose strong) { color: #111827; font-weight: 600; }
:deep(.prose code) { background: #f3f4f6; padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.9em; }
</style>
