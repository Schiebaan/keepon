<script setup lang="ts">
import { renderTerms } from '~/utils/render-terms'

definePageMeta({ layout: false })

const route = useRoute()
const slug = route.params.slug as string

interface PartnerTerms {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  terms_content: string | null
  terms_placeholders: Record<string, any> | null
  support_email: string | null
  support_phone: string | null
}

// SSR-safe fetch — uses `useFetch` so the data is embedded in the payload and the page
// renders the terms fully on first paint (good for search engines and bookmarks).
const { data: partner, error } = await useFetch<PartnerTerms>(`/api/voorwaarden/${slug}`)

const DEFAULT_TERMS_TEMPLATE = `Servicevoorwaarden {{bedrijfsnaam}}

Laatst bijgewerkt: maart 2026

1. Algemeen

Deze servicevoorwaarden zijn van toepassing op alle servicecontracten afgesloten bij {{bedrijfsnaam}}, gevestigd te {{adres}}, ingeschreven bij de Kamer van Koophandel onder nummer {{kvk}}.

2. Definities

Serviceprovider: {{bedrijfsnaam}}, bereikbaar via {{email}} en {{telefoon}}.
Klant: de natuurlijke persoon die een servicecontract heeft afgesloten.
Installatie: het energiesysteem (zonnepanelen, warmtepomp en/of laadpaal) waarop het servicecontract betrekking heeft.

3. Servicecontract

3.1 Het servicecontract omvat monitoring, storingsanalyse en indien van toepassing proactief onderhoud van de installatie.
3.2 De exacte diensten zijn afhankelijk van het gekozen servicepakket (Start, Slim of Max).
3.3 {{bedrijfsnaam}} spant zich in om storingen binnen de afgesproken termijn te analyseren en op te lossen.

4. Tarieven buiten het contract

4.1 Werkzaamheden die buiten het servicecontract vallen worden gefactureerd tegen het geldende uurtarief van € {{uurtarief}} per uur (excl. btw).
4.2 Voor het bezoek aan locatie worden voorrijkosten berekend van € {{voorrijkosten}} (excl. btw).

5. Productvoorwaarden

Voor specifieke voorwaarden per product gelden de bijlagen hieronder (indien van toepassing op jouw installatie).

6. Looptijd en opzegging

6.1 Het servicecontract heeft een minimale looptijd zoals vermeld bij het afsluiten van het contract.
6.2 Na afloop van de minimale looptijd is het contract maandelijks opzegbaar met een opzegtermijn van 1 maand.
6.3 Opzegging kan via het klantportaal of per e-mail naar {{email}}.

7. Betaling

7.1 Betaling geschiedt maandelijks via automatische incasso.
7.2 Bij het uitblijven van betaling wordt de klant per e-mail herinnerd.

8. Contact

Voor vragen over deze voorwaarden:
{{bedrijfsnaam}} · {{adres}} · {{email}} · {{telefoon}} · KvK: {{kvk}}`

// Combine the raw placeholders with auto-fill fallbacks for the new keys
const placeholders = computed<Record<string, string>>(() => {
  const raw = (partner.value?.terms_placeholders || {}) as Record<string, any>
  return {
    bedrijfsnaam: raw.bedrijfsnaam || partner.value?.name || '',
    kvk: raw.kvk || '',
    adres: raw.adres || '',
    email: raw.email || partner.value?.support_email || '',
    telefoon: raw.telefoon || partner.value?.support_phone || '',
    uurtarief: raw.uurtarief || '—',
    voorrijkosten: raw.voorrijkosten || '—',
  }
})

const generalTerms = computed(() => {
  if (!partner.value) return ''
  const template = partner.value.terms_content || DEFAULT_TERMS_TEMPLATE
  return renderTerms(template, placeholders.value)
})

const MODULE_META = [
  { key: 'solar',      label: 'Zonnepanelen',  appendix: 'A' },
  { key: 'heat_pump',  label: 'Warmtepomp',    appendix: 'B' },
  { key: 'ev_charger', label: 'Laadpaal',      appendix: 'C' },
  { key: 'battery',    label: 'Batterij',      appendix: 'D' },
] as const

/** Bijlagen die daadwerkelijk inhoud hebben, al gerenderd met placeholders. */
const appendices = computed(() => {
  const mods = (partner.value?.terms_placeholders?.module_terms || {}) as Record<string, string>
  return MODULE_META
    .map(m => ({ ...m, content: (mods[m.key] || '').trim() }))
    .filter(m => m.content)
    .map(m => ({ ...m, rendered: renderTerms(m.content, placeholders.value) }))
})

function formatLines(text: string) {
  return text.split('\n').map(line => ({
    text: line,
    bold: /^\d+\./.test(line.trim()),
  }))
}

const generalLines = computed(() => formatLines(generalTerms.value))

const partnerInitial = computed(() => partner.value?.name?.charAt(0).toUpperCase() || '')
</script>

<template>
  <!-- Error state -->
  <div v-if="error || !partner" class="terms-page">
    <div class="terms-container">
      <div class="terms-error">
        <div class="terms-error__icon">?</div>
        <h1 class="terms-error__title">Pagina niet gevonden</h1>
        <p class="terms-error__text">
          De voorwaardenpagina voor deze partner kon niet worden gevonden.
          Controleer of de URL correct is.
        </p>
        <NuxtLink to="/" class="terms-error__link">Terug naar de homepage</NuxtLink>
      </div>
    </div>
  </div>

  <!-- Terms page -->
  <div v-else class="terms-page">
    <div class="terms-container">
      <!-- Header -->
      <header class="terms-header">
        <div class="terms-header__brand">
          <img
            v-if="partner.logo_url"
            :src="partner.logo_url"
            :alt="partner.name"
            class="terms-header__logo"
          />
          <div
            v-else
            class="terms-header__initial"
            :style="{ backgroundColor: partner.primary_color }"
          >
            {{ partnerInitial }}
          </div>
          <span class="terms-header__name">{{ partner.name }}</span>
        </div>
      </header>

      <!-- Title -->
      <h1 class="terms-title">Servicevoorwaarden</h1>

      <!-- General terms -->
      <div class="terms-body">
        <template v-for="(line, idx) in generalLines" :key="idx">
          <span v-if="line.bold" class="terms-line terms-line--bold">{{ line.text }}<br/></span>
          <span v-else class="terms-line">{{ line.text }}<br/></span>
        </template>
      </div>

      <!-- Appendices per product (only those with content) -->
      <template v-if="appendices.length">
        <hr class="terms-divider" />
        <section
          v-for="app in appendices"
          :key="app.key"
          :id="`bijlage-${app.key}`"
          class="terms-appendix"
        >
          <p class="terms-appendix__label">Bijlage {{ app.appendix }}</p>
          <h2 class="terms-appendix__title">Aanvullende voorwaarden — {{ app.label }}</h2>
          <div class="terms-body">
            <template v-for="(line, idx) in formatLines(app.rendered)" :key="idx">
              <span v-if="line.bold" class="terms-line terms-line--bold">{{ line.text }}<br/></span>
              <span v-else class="terms-line">{{ line.text }}<br/></span>
            </template>
          </div>
        </section>
      </template>

      <!-- Footer -->
      <footer class="terms-footer">
        <NuxtLink to="/klant" class="terms-footer__link" :style="{ color: partner.primary_color }">
          &larr; Terug naar portaal
        </NuxtLink>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.terms-page {
  min-height: 100vh;
  background-color: #ffffff;
  padding: 2rem 1rem;
}

.terms-container {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem 0;
}

.terms-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.terms-header__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.terms-header__logo {
  height: 2.5rem;
  width: auto;
  max-width: 8rem;
  border-radius: 0.5rem;
  object-fit: contain;
}

.terms-header__initial {
  height: 2.5rem;
  width: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 1.125rem;
}

.terms-header__name {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.terms-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2rem;
  line-height: 1.3;
}

.terms-body {
  color: #374151;
  font-size: 0.9375rem;
  line-height: 1.75;
}

.terms-line--bold {
  font-weight: 700;
  color: #111827;
}

.terms-divider {
  margin: 3rem 0 2rem;
  border: 0;
  border-top: 1px solid #e5e7eb;
}

.terms-appendix {
  margin-top: 2.5rem;
}

.terms-appendix:first-of-type {
  margin-top: 0;
}

.terms-appendix__label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #6b7280;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.terms-appendix__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
  line-height: 1.3;
}

.terms-footer {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.terms-footer__link {
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.15s;
}

/* Error state */
.terms-error {
  text-align: center;
  padding: 4rem 0;
}

.terms-error__icon {
  width: 3rem;
  height: 3rem;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
  color: #9ca3af;
}

.terms-error__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.terms-error__text {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.terms-error__link {
  color: #2563eb;
  font-weight: 500;
  text-decoration: none;
}
</style>
