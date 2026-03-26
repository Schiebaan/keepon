<script setup lang="ts">
import { renderTerms } from '~/utils/render-terms'

definePageMeta({ layout: false })

const route = useRoute()
const slug = route.params.slug as string
const { getPartnerBySlug } = useMockData()

const partner = getPartnerBySlug(slug)

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

4. Looptijd en opzegging

4.1 Het servicecontract heeft een minimale looptijd zoals vermeld bij het afsluiten van het contract.
4.2 Na afloop van de minimale looptijd is het contract maandelijks opzegbaar met een opzegtermijn van 1 maand.
4.3 Opzegging kan via het klantportaal of per e-mail naar {{email}}.

5. Betaling

5.1 Betaling geschiedt maandelijks via automatische incasso.
5.2 Bij het uitblijven van betaling wordt de klant per e-mail herinnerd.
5.3 Na twee mislukte incasso's kan {{bedrijfsnaam}} het servicecontract opschorten.

6. Monitoring en data

6.1 {{bedrijfsnaam}} monitort de installatie via het KeepON-platform in samenwerking met gespecialiseerde monitoringpartners.
6.2 Klantgegevens worden verwerkt conform de AVG en zijn uitsluitend toegankelijk voor {{bedrijfsnaam}} en de klant zelf.
6.3 Gegevens van klanten van {{bedrijfsnaam}} zijn nooit zichtbaar voor andere installateurs of derden.

7. Aansprakelijkheid

7.1 {{bedrijfsnaam}} is niet aansprakelijk voor schade als gevolg van storingen in de installatie, tenzij sprake is van grove nalatigheid.
7.2 De aansprakelijkheid van {{bedrijfsnaam}} is beperkt tot het bedrag van het servicecontract over de voorafgaande 12 maanden.

8. Wijzigingen

8.1 {{bedrijfsnaam}} behoudt zich het recht voor deze voorwaarden te wijzigen. Klanten worden hiervan minimaal 30 dagen van tevoren per e-mail op de hoogte gesteld.
8.2 Bij ingrijpende wijzigingen heeft de klant het recht het contract kosteloos op te zeggen.

9. Contact

Voor vragen over deze voorwaarden kunt u contact opnemen met:
{{bedrijfsnaam}}
{{adres}}
{{email}}
{{telefoon}}
KvK: {{kvk}}`

const termsTemplate = computed(() => {
  if (!partner) return ''
  return partner.terms_content || DEFAULT_TERMS_TEMPLATE
})

const renderedTerms = computed(() => {
  if (!partner) return ''
  const placeholders = partner.terms_placeholders || {}
  return renderTerms(termsTemplate.value, placeholders)
})

/**
 * Applies bold styling to section heading lines (lines starting with a number like "1." or "3.2").
 * Returns an array of { text, bold } segments split by line.
 */
const formattedLines = computed(() => {
  if (!renderedTerms.value) return []
  return renderedTerms.value.split('\n').map(line => ({
    text: line,
    bold: /^\d+\./.test(line.trim()),
  }))
})

const partnerInitial = computed(() => {
  if (!partner) return ''
  return partner.name.charAt(0).toUpperCase()
})
</script>

<template>
  <!-- Error state -->
  <div v-if="!partner" class="terms-page">
    <div class="terms-container">
      <div class="terms-error">
        <div class="terms-error__icon">?</div>
        <h1 class="terms-error__title">Pagina niet gevonden</h1>
        <p class="terms-error__text">
          De voorwaardenpagina voor deze partner kon niet worden gevonden.
          Controleer of de URL correct is.
        </p>
        <NuxtLink to="/" class="terms-error__link">
          Terug naar de homepage
        </NuxtLink>
      </div>
    </div>
  </div>

  <!-- Terms page -->
  <div v-else class="terms-page">
    <div class="terms-container">
      <!-- Header with partner branding -->
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

      <!-- Document title -->
      <h1 class="terms-title">Servicevoorwaarden</h1>

      <!-- Rendered terms content -->
      <div class="terms-body">
        <template v-for="(line, idx) in formattedLines" :key="idx">
          <span v-if="line.bold" class="terms-line terms-line--bold">{{ line.text }}<br/></span>
          <span v-else class="terms-line">{{ line.text }}<br/></span>
        </template>
      </div>

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
  max-width: 48rem; /* max-w-3xl */
  margin: 0 auto;
  padding: 2rem 0;
}

/* Header */
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
  width: 2.5rem;
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

/* Title */
.terms-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2rem;
  line-height: 1.3;
}

/* Terms body */
.terms-body {
  color: #374151;
  font-size: 0.9375rem;
  line-height: 1.75;
}

.terms-line {
  /* whitespace-pre-line behavior via the br tags */
}

.terms-line--bold {
  font-weight: 700;
  color: #111827;
}

/* Footer */
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

.terms-footer__link:hover {
  opacity: 0.8;
}

/* Error state */
.terms-error {
  text-align: center;
  padding: 4rem 1rem;
}

.terms-error__icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background-color: #fef2f2;
  color: #dc2626;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.terms-error__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.terms-error__text {
  color: #6b7280;
  font-size: 0.9375rem;
  max-width: 28rem;
  margin: 0 auto 1.5rem;
  line-height: 1.6;
}

.terms-error__link {
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
}

.terms-error__link:hover {
  text-decoration: underline;
}

/* Print styles */
@media print {
  .terms-page {
    padding: 0;
    background: white;
  }

  .terms-container {
    max-width: 100%;
    padding: 0;
  }

  .terms-header {
    margin-bottom: 1rem;
  }

  .terms-header__logo,
  .terms-header__initial {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .terms-footer {
    display: none;
  }

  .terms-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .terms-body {
    font-size: 0.8125rem;
    line-height: 1.6;
  }
}
</style>
