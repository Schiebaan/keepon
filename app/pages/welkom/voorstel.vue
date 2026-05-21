<script setup lang="ts">
definePageMeta({ layout: false, middleware: ['auth'] })

const { state, isLoading, load, acceptProposal, formatPrice, targetRouteForStep } = useOnboarding()

onMounted(async () => {
  const s = await load()
  if (!s) return
  // A finished customer doesn't need to see the celebration page again; send
  // them straight to the portal where the actual product lives.
  if (s.mandate_at || s.mandate_skipped) navigateTo('/klant')
})

const partner = computed(() => state.value?.partner)
const firstName = computed(() => state.value?.customer?.first_name || 'daar')
const addressShort = computed(() => state.value?.customer?.address_short || null)
const proposal = computed(() => state.value?.proposal)
const allModules = computed(() => proposal.value?.modules || [])
const alreadyAccepted = computed(() => !!state.value?.accepted_at)
const mandateSet = computed(() => !!state.value?.mandate_at)

// Module selection — checked by default, customer can opt out
const selectedModules = ref<Set<string>>(new Set())

function syncDefaults() {
  if (!allModules.value.length) return
  const next = new Set<string>()
  // Start from previously accepted modules if available, else select all
  const prev = state.value?.accepted_modules
  if (Array.isArray(prev) && prev.length) {
    for (const m of prev) next.add(m)
  } else {
    for (const m of allModules.value) next.add(m.module)
  }
  selectedModules.value = next
}
watch([allModules, alreadyAccepted], syncDefaults, { immediate: true })

function toggleModule(module: string) {
  if (alreadyAccepted.value) return
  const next = new Set(selectedModules.value)
  next.has(module) ? next.delete(module) : next.add(module)
  selectedModules.value = next
}
function isSelected(module: string) {
  return selectedModules.value.has(module)
}

const selectedTotalMonthly = computed(() =>
  allModules.value
    .filter(m => isSelected(m.module))
    .reduce((s, m) => s + (m.price?.monthly_cents || 0), 0),
)
const selectedTotalYearly = computed(() =>
  allModules.value
    .filter(m => isSelected(m.module))
    .reduce((s, m) => s + (m.price?.yearly_cents || 0), 0),
)
const selectedCount = computed(() => selectedModules.value.size)

// Termijn-keuze: maand of jaar. Default = wat al op de klant staat (admin
// kan een voorkeur ingesteld hebben). Geen yearly-optie tonen als er geen
// jaar-korting is — dan is jaarbetaling alleen maar nadeel.
const billingInterval = ref<'monthly' | 'yearly'>('monthly')
const yearlyDiscountMonths = computed(() => state.value?.proposal?.yearly_discount_months || 0)
const showYearlyOption = computed(() => yearlyDiscountMonths.value > 0)
const trialMonths = computed(() => state.value?.proposal?.trial_months || 0)
watch(() => state.value?.proposal?.billing_interval, (v) => {
  if (v === 'yearly' || v === 'monthly') billingInterval.value = v
}, { immediate: true })

const selectedTotalForInterval = computed(() =>
  billingInterval.value === 'yearly' ? selectedTotalYearly.value : selectedTotalMonthly.value,
)
const yearlySavingsCents = computed(() =>
  Math.max(0, selectedTotalMonthly.value * 12 - selectedTotalYearly.value),
)

const accepting = ref(false)
const acceptError = ref('')
const consentChecked = ref(false)
watch(alreadyAccepted, (v) => { if (v) consentChecked.value = true }, { immediate: true })

const acceptSection = ref<HTMLElement | null>(null)
function jumpToActivate() {
  acceptSection.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  if (acceptSection.value) {
    acceptSection.value.classList.add('pulse')
    setTimeout(() => acceptSection.value?.classList.remove('pulse'), 1400)
  }
}

async function handleAccept() {
  if (!consentChecked.value || accepting.value || selectedCount.value === 0) return
  accepting.value = true
  acceptError.value = ''
  try {
    await acceptProposal([...selectedModules.value], billingInterval.value)
    // Stay on the voorstel page — show the akkoord-celebration.
    // We deliberately do NOT push the customer to /welkom/incasso;
    // the portal is the next step, incasso is a quiet follow-up.
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } catch (e: any) {
    acceptError.value = e?.data?.message || 'Activeren mislukt. Probeer het nogmaals.'
  } finally {
    accepting.value = false
  }
}

function handleHelp() {
  const supportMail = partner.value?.support_email || ''
  if (!supportMail) return
  const subject = encodeURIComponent('Vraag over mijn service-voorstel')
  const body = encodeURIComponent(`Hoi ${partner.value?.name || ''},\n\nIk heb een vraag over het service-voorstel.\n\nGroet,\n`)
  window.location.href = `mailto:${supportMail}?subject=${subject}&body=${body}`
}

// --- Per-module copy ---
const MODULE_LABEL: Record<string, string> = {
  solar: 'Zonnepanelen', heat_pump: 'Warmtepomp', ev_charger: 'Laadpaal', battery: 'Thuisbatterij',
}
const MODULE_LABEL_SHORT: Record<string, string> = {
  solar: 'zonnepanelen', heat_pump: 'warmtepomp', ev_charger: 'laadpaal', battery: 'thuisbatterij',
}
const MODULE_ICON: Record<string, string> = {
  solar: 'solar', heat_pump: 'heat-pump', ev_charger: 'ev-charger', battery: 'battery',
}
const MODULE_THEME: Record<string, { bg: string; iconBg: string; iconColor: string; chip: string; chipText: string; ring: string }> = {
  solar: {
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    iconColor: '#fff',
    chip: 'rgba(255,255,255,0.7)',
    chipText: '#92400e',
    ring: '#f59e0b',
  },
  heat_pump: {
    bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    iconBg: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    iconColor: '#fff',
    chip: 'rgba(255,255,255,0.7)',
    chipText: '#9f1239',
    ring: '#f43f5e',
  },
  ev_charger: {
    bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    iconBg: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    iconColor: '#fff',
    chip: 'rgba(255,255,255,0.7)',
    chipText: '#075985',
    ring: '#0ea5e9',
  },
  battery: {
    bg: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)',
    iconBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    iconColor: '#fff',
    chip: 'rgba(255,255,255,0.7)',
    chipText: '#5b21b6',
    ring: '#8b5cf6',
  },
}

const MODULE_STORY: Record<string, { headline: string; story: string; bullets: string[] }> = {
  solar: {
    headline: 'Maximaal halen uit jouw panelen',
    story: 'Je panelen liggen er al. Wij volgen live wat ze opleveren en geven je een seintje als de opbrengst tegenvalt.',
    bullets: ['Live opbrengst', 'Seintje bij storing', 'Voorrang bij service'],
  },
  heat_pump: {
    headline: 'Warmte zonder zorgen',
    story: 'Een warmtepomp die het laat afweten op de koudste dag, daar zit niemand op te wachten. Wij houden hem 24/7 voor je in de gaten.',
    bullets: ['COP en temperatuur live', 'Vroege signalering bij uitval', 'Voorrang bij spoed'],
  },
  ev_charger: {
    headline: 'Slim laden, geen verrassingen',
    story: 'Wat kost een laadsessie, en hoeveel daarvan komt van je eigen panelen? Je krijgt het complete overzicht en storingen zien we direct.',
    bullets: ['Sessies en kosten', 'Eigen zon zichtbaar', 'Hulp bij storingen'],
  },
  battery: {
    headline: 'Jouw stroom, op het juiste moment',
    story: 'Een thuisbatterij verdient zichzelf alleen terug als hij slim laadt en ontlaadt. Wij houden cycli en gezondheid in de gaten, zodat hij zo lang mogelijk meegaat.',
    bullets: ['Gezondheid in beeld', 'Slim laadadvies', 'Continu monitoren'],
  },
}

const faqs = [
  { q: 'Waarom ontvang ik dit?',     a: () => `Omdat ${partner.value?.name || 'je installateur'} jouw installaties heeft geleverd of beheert.` },
  { q: 'Is dit verplicht?',          a: () => 'Nee, je kiest zelf of je de service activeert. Zonder akkoord gebeurt er niets.' },
  { q: 'Kan ik later opzeggen?',     a: () => 'Ja, na de minimale looptijd is het maandelijks opzegbaar.' },
  { q: 'Wanneer wordt er betaald?',  a: () => 'Pas vanaf de volgende maand. Eerst regelen we de incasso, dat doe je in de volgende stap.' },
  { q: 'Bij wie kom ik terecht?',    a: () => `Voor service en vragen: ${partner.value?.name || 'je installateur'}.` },
]
const openFaq = ref<number | null>(null)
function toggleFaq(i: number) { openFaq.value = openFaq.value === i ? null : i }

// Personal title fragment used in section heading
const installLine = computed(() => {
  const c = selectedCount.value
  if (c === 0) {
    return addressShort.value ? `Jouw installaties op ${addressShort.value}` : 'Jouw installaties'
  }
  const noun = c === 1 ? 'installatie' : 'installaties'
  if (addressShort.value) return `${c} ${noun} op ${addressShort.value}`
  return `${c} ${noun}`
})
</script>

<template>
  <div class="page" :style="partner?.primary_color ? `--brand: ${partner.primary_color};` : ''">
    <div class="bg-gradient" aria-hidden="true" />

    <div class="container">
      <header class="topbar">
        <div class="brand">
          <img v-if="partner?.logo_url" :src="partner.logo_url" alt="" aria-hidden="true" class="logo" />
          <span class="brand-name">{{ partner?.name }}</span>
        </div>
        <div class="step-dots" :aria-label="alreadyAccepted ? 'Stap 2 van 2: portaal' : 'Stap 1 van 2: voorstel'">
          <span class="dot" :class="{ active: !alreadyAccepted, done: alreadyAccepted }" />
          <span class="dot" :class="{ active: alreadyAccepted }" />
        </div>
      </header>

      <div v-if="isLoading && !state" class="loading">
        <div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
      </div>

      <template v-else>
        <!-- ============================================================== -->
        <!-- HERO                                                            -->
        <!-- ============================================================== -->
        <section class="hero">
          <p class="eyebrow">Persoonlijk voor {{ firstName }}</p>
          <h1 class="hero-title">
            Hoi {{ firstName }},<br/>
            zo regelen we de service voor jouw installaties.
          </h1>
          <p v-if="addressShort" class="hero-address">
            <AppIcon name="map-pin" :size="14" />
            {{ addressShort }}
          </p>
          <p class="hero-sub">
            {{ partner?.name }} heeft een service-voorstel klaargezet voor jouw installaties.
            Activeer met één klik. Geen gedoe, geen verrassingen.
          </p>

          <template v-if="alreadyAccepted">
            <div class="akkoord-block">
              <div class="akkoord-check">
                <AppIcon name="check" :size="32" />
              </div>
              <p class="akkoord-eyebrow">Akkoord ontvangen</p>
              <h1 class="akkoord-title">Bedankt {{ firstName }}.</h1>
              <p class="akkoord-text">
                Je service is actief vanaf vandaag. Je portaal staat klaar.
              </p>
              <NuxtLink to="/klant" class="btn-primary akkoord-cta">
                Open mijn portaal <AppIcon name="chevron-right" :size="16" />
              </NuxtLink>
              <p v-if="!mandateSet" class="incasso-hint">
                De betaling regelen we daarna.
                <NuxtLink to="/welkom/incasso" class="incasso-link">Incasso nu instellen</NuxtLink>
                of later via je portaal.
              </p>
            </div>
          </template>

          <template v-else>
            <div class="hero-actions">
              <button class="btn-primary" @click="jumpToActivate">
                Activeer mijn service <AppIcon name="chevron-right" :size="16" />
              </button>
            </div>
            <p v-if="selectedTotalMonthly > 0" class="hero-price-hint">
              <strong>€ {{ formatPrice(selectedTotalMonthly) }}</strong> per maand voor {{ installLine }}
            </p>
            <ul class="reassurance">
              <li><span class="check"><AppIcon name="check" :size="10" /></span> Direct actief</li>
              <li><span class="check"><AppIcon name="check" :size="10" /></span> Geen verrassingen</li>
              <li><span class="check"><AppIcon name="check" :size="10" /></span> Stop wanneer je wil</li>
            </ul>
          </template>
        </section>

        <!-- ============================================================== -->
        <!-- INSTALLATIONS — selectable cards                               -->
        <!-- ============================================================== -->
        <section v-if="allModules.length" class="modules">
          <div class="section-head">
            <p class="section-eyebrow">Voor jou klaargezet</p>
            <h2 class="section-title">{{ installLine }}</h2>
            <p v-if="!alreadyAccepted" class="section-sub">
              Wil je niet alles? Vink uit wat je niet hoeft. De prijs past zich aan.
            </p>
          </div>

          <article
            v-for="m in allModules"
            :key="m.id"
            class="module-hero"
            :class="{ unselected: !isSelected(m.module), locked: alreadyAccepted }"
            :style="{ background: MODULE_THEME[m.module]?.bg }"
            :tabindex="alreadyAccepted ? -1 : 0"
            :role="alreadyAccepted ? undefined : 'checkbox'"
            :aria-checked="alreadyAccepted ? undefined : isSelected(m.module)"
            :aria-label="alreadyAccepted ? undefined : `${MODULE_LABEL[m.module]} ${isSelected(m.module) ? 'geselecteerd' : 'niet geselecteerd'}, druk op enter om te wisselen`"
            @click="toggleModule(m.module)"
            @keydown.enter.prevent="toggleModule(m.module)"
            @keydown.space.prevent="toggleModule(m.module)"
          >
            <!-- Toggle indicator (top-right) — hidden once locked -->
            <div
              v-if="!alreadyAccepted"
              class="toggle"
              :class="{ on: isSelected(m.module) }"
              :style="isSelected(m.module) ? { background: MODULE_THEME[m.module]?.ring, borderColor: MODULE_THEME[m.module]?.ring } : {}"
              aria-hidden="true"
            >
              <AppIcon v-if="isSelected(m.module)" name="check" :size="14" />
            </div>
            <!-- Active badge after akkoord — replaces the toggle on locked cards -->
            <div
              v-else
              class="active-badge"
              :style="{ background: MODULE_THEME[m.module]?.ring, color: 'white' }"
              aria-hidden="true"
            >
              <AppIcon name="check" :size="12" /> Actief
            </div>

            <div class="module-icon-large" :style="{ background: MODULE_THEME[m.module]?.iconBg, color: MODULE_THEME[m.module]?.iconColor }">
              <AppIcon :name="MODULE_ICON[m.module] || 'puzzle'" :size="28" />
            </div>

            <div class="module-content">
              <p class="module-tag" :style="{ color: MODULE_THEME[m.module]?.chipText }">{{ MODULE_LABEL[m.module] }}</p>
              <h3 class="module-headline">{{ MODULE_STORY[m.module]?.headline }}</h3>
              <p class="module-story">{{ MODULE_STORY[m.module]?.story }}</p>

              <div class="module-chips">
                <span v-for="b in MODULE_STORY[m.module]?.bullets || []" :key="b" class="chip" :style="{ background: MODULE_THEME[m.module]?.chip, color: MODULE_THEME[m.module]?.chipText }">
                  {{ b }}
                </span>
              </div>

              <div v-if="m.price" class="module-price-row">
                <div class="price-tag">
                  <span class="price-amount">€ {{ formatPrice(m.price.monthly_cents) }}</span>
                  <span class="price-unit">per maand</span>
                </div>
                <span v-if="!isSelected(m.module)" class="off-label">Niet actief</span>
              </div>
            </div>
          </article>
        </section>

        <!-- Empty state -->
        <section v-else class="card-block empty">
          <AppIcon name="puzzle" :size="32" class="text-gray-300 mx-auto" />
          <p>
            Er staan nog geen installaties klaar bij ons.
            <template v-if="partner?.support_email">
              Mail <a :href="`mailto:${partner.support_email}`">{{ partner.support_email }}</a> en we zetten dit voor je recht.
            </template>
            <template v-else>
              Neem contact op met {{ partner?.name }} om je voorstel compleet te maken.
            </template>
          </p>
        </section>

        <!-- ============================================================== -->
        <!-- ACTIVATE                                                        -->
        <!-- ============================================================== -->
        <section v-if="!alreadyAccepted" ref="acceptSection" class="activate-block">
          <div class="activate-inner">
            <p class="activate-eyebrow">Klaar voor activatie</p>
            <h2 class="activate-title">Activeer in één klik</h2>

            <!-- Termijn-keuze — alleen tonen als er ook een jaar-optie is met korting -->
            <div v-if="showYearlyOption" class="interval-toggle" role="radiogroup" aria-label="Betaaltermijn">
              <button
                type="button"
                class="interval-option"
                :class="{ active: billingInterval === 'monthly' }"
                role="radio"
                :aria-checked="billingInterval === 'monthly'"
                @click="billingInterval = 'monthly'"
              >
                <span class="interval-option-label">Per maand</span>
                <span class="interval-option-amount">€ {{ formatPrice(selectedTotalMonthly) }}</span>
              </button>
              <button
                type="button"
                class="interval-option"
                :class="{ active: billingInterval === 'yearly' }"
                role="radio"
                :aria-checked="billingInterval === 'yearly'"
                @click="billingInterval = 'yearly'"
              >
                <span class="interval-option-badge">
                  Bespaar € {{ formatPrice(yearlySavingsCents) }}
                </span>
                <span class="interval-option-label">Per jaar</span>
                <span class="interval-option-amount">€ {{ formatPrice(selectedTotalYearly) }}</span>
              </button>
            </div>

            <div v-else class="price-summary">
              <span class="price-summary-label">Jouw maandbedrag</span>
              <span class="price-summary-amount">€ {{ formatPrice(selectedTotalMonthly) }}</span>
            </div>

            <p v-if="trialMonths > 0" class="trial-callout">
              <AppIcon name="check-circle" :size="14" />
              Eerste {{ trialMonths === 1 ? 'maand' : `${trialMonths} maanden` }} gratis na het instellen van de incasso.
            </p>

            <p class="activate-text">
              Vandaag akkoord, vandaag actief. De betaling regelen we daarna.
            </p>

            <label class="consent">
              <input v-model="consentChecked" type="checkbox" :disabled="selectedCount === 0" />
              <span>
                Ik ga akkoord met de prijs en de
                <a :href="partner?.terms_url || '#'" target="_blank" rel="noopener">servicevoorwaarden</a>.
              </span>
            </label>

            <p v-if="acceptError" class="error" role="alert" aria-live="assertive">{{ acceptError }}</p>
            <p v-else-if="selectedCount === 0" class="soft-hint" aria-live="polite">Kies minstens één onderdeel om te activeren.</p>

            <button
              class="btn-cta"
              :disabled="!consentChecked || accepting || selectedCount === 0"
              @click="handleAccept"
            >
              <span v-if="accepting" class="spinner" />
              <template v-else>
                <AppIcon name="zap" :size="18" />
                Activeer mijn service
              </template>
            </button>

            <button v-if="partner?.support_email" class="btn-link" @click="handleHelp">
              Liever eerst overleggen met {{ partner?.name }}?
            </button>
          </div>
        </section>

        <!-- ============================================================== -->
        <!-- FAQ                                                             -->
        <!-- ============================================================== -->
        <section class="faq-block">
          <h2 class="faq-title">Vragen?</h2>
          <ul class="faq">
            <li v-for="(item, i) in faqs" :key="i" :class="{ open: openFaq === i }">
              <button class="faq-q" @click="toggleFaq(i)">
                {{ item.q }}
                <AppIcon name="chevron-down" :size="14" :class="{ 'rotate-180': openFaq === i }" />
              </button>
              <p v-if="openFaq === i" class="faq-a">{{ item.a() }}</p>
            </li>
          </ul>
        </section>

        <!-- Final CTA echo -->
        <div v-if="!alreadyAccepted" class="final-cta">
          <button class="btn-cta btn-cta-final" @click="jumpToActivate">
            <AppIcon name="zap" :size="18" />
            Activeer mijn service
          </button>
          <p class="final-trust">
            <AppIcon name="shield" :size="12" />
            Niets gebeurt zonder jouw akkoord
          </p>
        </div>

        <p class="legal">
          Service door <strong>{{ partner?.name }}</strong>. Contractuele afhandeling via UPsol B.V.
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* ====================================================================== *
 * Page shell + ambient gradient
 * ====================================================================== */
.page { position: relative; min-height: 100vh; background: #fafafa; padding: 1rem 1rem 4rem; overflow: hidden; }
.bg-gradient {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 60% 40% at 20% 0%, color-mix(in srgb, var(--brand, #2563eb) 12%, transparent), transparent 60%),
    radial-gradient(ellipse 50% 30% at 90% 10%, color-mix(in srgb, var(--brand, #2563eb) 8%, transparent), transparent 65%);
}
.container { position: relative; max-width: 720px; margin: 0 auto; }

.topbar { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0 3rem; }
.brand { display: flex; align-items: center; gap: 0.625rem; }
.logo { height: 3rem; max-width: 12rem; object-fit: contain; }
.brand-name { font-weight: 600; font-size: 0.95rem; color: #0f172a; }
.step-dots { display: flex; gap: 0.4rem; }
.step-dots .dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: #e2e8f0; transition: background 0.3s; }
.step-dots .dot.active { background: var(--brand, #0f172a); }
.step-dots .dot.done { background: #10b981; }

.loading { padding: 4rem 0; text-align: center; }

/* ====================================================================== *
 * Hero
 * ====================================================================== */
.hero { text-align: center; margin-bottom: 4rem; }
.eyebrow {
  display: inline-block;
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--brand, #2563eb);
  background: color-mix(in srgb, var(--brand, #2563eb) 10%, white);
  padding: 0.4rem 0.85rem; border-radius: 9999px;
  margin: 0 0 1.25rem;
}
.hero-title {
  font-size: clamp(2rem, 5.5vw, 3rem);
  font-weight: 800; color: #0f172a;
  margin: 0 0 0.875rem;
  line-height: 1.1;
  letter-spacing: -0.025em;
}
.hero-address {
  display: inline-flex; align-items: center; gap: 0.375rem;
  font-size: 0.875rem; color: #64748b;
  margin: 0 0 1rem;
}
.hero-sub { font-size: 1.0625rem; color: #475569; line-height: 1.55; max-width: 32rem; margin: 0 auto 2rem; }
@media (min-width: 768px) { .hero-sub { font-size: 1.1875rem; } }

.hero-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
.hero-price-hint {
  margin: 1rem auto 0; font-size: 0.875rem; color: #64748b;
}
.hero-price-hint strong { color: #0f172a; font-weight: 700; }
.reassurance {
  list-style: none; padding: 0; margin: 1.25rem 0 0;
  display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem;
  font-size: 0.875rem; color: #475569;
}
.reassurance li { display: inline-flex; align-items: center; gap: 0.4rem; }
.reassurance .check {
  width: 1rem; height: 1rem; border-radius: 50%;
  background: #10b981; color: white;
  display: inline-flex; align-items: center; justify-content: center;
}

/* Akkoord celebration — replaces the old "geactiveerd" banner */
.akkoord-block {
  text-align: center;
  background: white;
  border: 1px solid #d1fae5;
  border-radius: 1.5rem;
  padding: 2.25rem 1.75rem;
  margin: 0 auto 1.5rem;
  max-width: 32rem;
  box-shadow: 0 14px 32px -12px rgba(16, 185, 129, 0.22);
}
.akkoord-check {
  width: 4rem; height: 4rem;
  margin: 0 auto 1.125rem;
  border-radius: 50%;
  background: #10b981; color: white;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 24px -6px rgba(16, 185, 129, 0.5);
  animation: pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes pop { 0% { transform: scale(0.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.akkoord-eyebrow {
  font-size: 0.7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.12em;
  color: #10b981; margin: 0 0 0.4rem;
}
.akkoord-title {
  font-size: 1.875rem; font-weight: 800;
  color: #0f172a; margin: 0 0 0.5rem;
  line-height: 1.15; letter-spacing: -0.02em;
}
.akkoord-text {
  font-size: 1rem; color: #475569;
  margin: 0 auto 1.5rem; max-width: 24rem; line-height: 1.5;
}
.akkoord-cta {
  display: inline-flex; padding: 0.95rem 1.75rem; font-size: 1rem;
}
.incasso-hint {
  margin: 1.25rem auto 0; max-width: 24rem;
  font-size: 0.8125rem; color: #94a3b8; line-height: 1.5;
}
.incasso-link {
  color: #64748b; text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: 500;
}
.incasso-link:hover { color: #0f172a; }

/* ====================================================================== *
 * Section heading
 * ====================================================================== */
.section-head { text-align: center; margin-bottom: 1.5rem; }
.section-eyebrow {
  font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase; color: #94a3b8; margin: 0 0 0.5rem;
}
.section-title {
  font-size: 1.5rem; font-weight: 700; color: #0f172a;
  margin: 0; line-height: 1.2; letter-spacing: -0.01em;
}
.section-sub {
  font-size: 0.875rem; color: #64748b;
  margin: 0.625rem 0 0; max-width: 28rem; margin-left: auto; margin-right: auto;
  line-height: 1.5;
}

/* ====================================================================== *
 * Module hero blocks (selectable)
 * ====================================================================== */
.modules { margin-bottom: 3rem; }
.module-hero {
  position: relative;
  border-radius: 1.5rem;
  padding: 2rem 2rem 1.75rem;
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  align-items: start;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.2s ease;
  user-select: none;
}
.module-hero::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  border: 1px solid rgba(0, 0, 0, 0.04); pointer-events: none;
}
.module-hero:hover:not(.locked) { transform: translateY(-1px); }
.module-hero.unselected { opacity: 0.45; filter: saturate(0.4); }
.module-hero.unselected:hover { opacity: 0.7; filter: saturate(0.6); }
.module-hero.locked { cursor: default; }

.toggle {
  position: absolute;
  top: 1.25rem; right: 1.25rem;
  width: 1.5rem; height: 1.5rem;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.15);
  background: white;
  display: flex; align-items: center; justify-content: center;
  color: white;
  transition: background 0.15s, border-color 0.15s, transform 0.15s;
}
.toggle.on { transform: scale(1.05); }
.active-badge {
  position: absolute;
  top: 1.25rem; right: 1.25rem;
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.04em;
  box-shadow: 0 4px 10px -3px rgba(0,0,0,0.18);
}
.module-hero:focus-visible {
  outline: 2px solid var(--brand, #2563eb);
  outline-offset: 3px;
}

.module-icon-large {
  width: 4rem; height: 4rem;
  border-radius: 1.25rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.25);
}
.module-content { min-width: 0; }
.module-tag { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.5rem; }
.module-headline { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 0.625rem; line-height: 1.2; letter-spacing: -0.01em; }
.module-story { font-size: 0.9375rem; line-height: 1.5; color: #334155; margin: 0 0 1rem; max-width: 36ch; }
.module-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1.25rem; }
.chip {
  display: inline-flex; align-items: center;
  padding: 0.35rem 0.75rem; border-radius: 9999px;
  font-size: 0.75rem; font-weight: 600;
  backdrop-filter: blur(8px);
}
.module-price-row {
  display: flex; align-items: baseline; justify-content: space-between; gap: 1rem;
  padding-top: 1rem; border-top: 1px dashed rgba(0, 0, 0, 0.08);
}
.price-tag { display: flex; align-items: baseline; gap: 0.4rem; }
.price-amount { font-size: 1.5rem; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
.price-unit { font-size: 0.875rem; color: #475569; }
.off-label {
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
  color: #94a3b8; padding: 0.2rem 0.5rem; background: rgba(0, 0, 0, 0.05); border-radius: 9999px;
}

@media (max-width: 540px) {
  .module-hero { grid-template-columns: 1fr; padding: 1.5rem 1.5rem 1.25rem; gap: 1rem; }
  .module-icon-large { width: 3.25rem; height: 3.25rem; border-radius: 1rem; }
  .toggle { top: 1rem; right: 1rem; }
}

/* ====================================================================== *
 * Activate block
 * ====================================================================== */
.activate-block {
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
  border-radius: 1.5rem;
  padding: 0.5rem;
  margin-bottom: 3rem;
  scroll-margin-top: 1rem;
  transition: box-shadow 0.4s ease;
}
.activate-block.pulse {
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--brand, #2563eb) 35%, transparent);
}
.activate-inner {
  background: white; border-radius: 1.125rem;
  padding: 2.5rem 2rem; text-align: center;
}
.activate-eyebrow {
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--brand, #2563eb);
  margin: 0 0 0.5rem;
}
.activate-title { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0 0 1.25rem; line-height: 1.1; letter-spacing: -0.015em; }

.price-summary {
  display: flex; justify-content: space-between; align-items: baseline;
  background: #f8fafc; border-radius: 0.875rem;
  padding: 0.875rem 1.25rem;
  max-width: 24rem; margin: 0 auto 0.5rem;
}
.price-summary-label { font-size: 0.875rem; color: #64748b; font-weight: 500; }
.price-summary-amount { font-size: 1.5rem; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; letter-spacing: -0.015em; }
.price-summary-yearly { font-size: 0.8125rem; color: #94a3b8; max-width: 24rem; margin: 0 auto 1.5rem; text-align: right; padding-right: 0.25rem; }

.interval-toggle {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem;
  max-width: 24rem; margin: 0 auto 1rem;
}
.interval-option {
  position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
  padding: 0.875rem 0.75rem;
  border: 2px solid #e2e8f0; border-radius: 0.875rem; background: #ffffff;
  cursor: pointer; transition: all 0.15s;
}
.interval-option:hover { border-color: #cbd5e1; }
.interval-option.active { border-color: #0f172a; background: #f8fafc; }
.interval-option-label { font-size: 0.8125rem; font-weight: 600; color: #475569; }
.interval-option-amount { font-size: 1.125rem; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }
.interval-option-badge {
  position: absolute; top: -0.55rem; right: 0.5rem;
  background: #059669; color: #ffffff; font-size: 0.6875rem; font-weight: 700;
  padding: 0.15rem 0.5rem; border-radius: 9999px; letter-spacing: 0.01em;
}

.trial-callout {
  display: inline-flex; align-items: center; gap: 0.375rem;
  background: #d1fae5; color: #065f46;
  font-size: 0.8125rem; font-weight: 600;
  padding: 0.4rem 0.75rem; border-radius: 9999px;
  margin: 0 auto 1rem;
}

.activate-text { font-size: 0.9375rem; color: #475569; line-height: 1.55; margin: 0 0 1.5rem; max-width: 28rem; margin-left: auto; margin-right: auto; }

.consent {
  display: flex; gap: 0.625rem; align-items: start;
  font-size: 0.875rem; color: #334155; line-height: 1.5;
  cursor: pointer;
  max-width: 24rem; margin: 0 auto 1rem;
  text-align: left;
}
.consent input { margin-top: 0.2rem; flex-shrink: 0; width: 1.05rem; height: 1.05rem; accent-color: var(--brand, #2563eb); cursor: pointer; }
.consent a { color: var(--brand, #2563eb); text-decoration: underline; }

.error { color: #b91c1c; background: #fef2f2; border-radius: 0.625rem; padding: 0.625rem 0.875rem; font-size: 0.875rem; max-width: 24rem; margin: 0 auto 0.875rem; }
.soft-hint { color: #64748b; background: #f1f5f9; border-radius: 0.625rem; padding: 0.5rem 0.875rem; font-size: 0.8125rem; max-width: 24rem; margin: 0 auto 0.875rem; }

/* ====================================================================== *
 * Buttons
 * ====================================================================== */
.btn-primary, .btn-secondary, .btn-cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  border: 0; border-radius: 0.875rem;
  font-weight: 600; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.15s, filter 0.15s;
  text-decoration: none;
}
.btn-primary {
  padding: 0.95rem 1.75rem;
  background: #0f172a; color: white;
  font-size: 1rem;
  box-shadow: 0 8px 22px -8px rgba(15, 23, 42, 0.5);
}
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); box-shadow: 0 14px 32px -10px rgba(15, 23, 42, 0.55); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-secondary {
  padding: 0.875rem 1.5rem;
  background: white; color: #0f172a;
  border: 1px solid #e2e8f0;
  font-size: 0.95rem;
}
.btn-secondary:hover { border-color: #cbd5e1; transform: translateY(-1px); }

.btn-cta {
  padding: 1.1rem 2.25rem;
  background: var(--brand, #0f172a); color: white;
  font-size: 1.125rem; font-weight: 700;
  width: 100%; max-width: 22rem;
  letter-spacing: -0.005em;
  box-shadow: 0 14px 30px -10px color-mix(in srgb, var(--brand, #0f172a) 65%, transparent);
}
.btn-cta:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 20px 40px -12px color-mix(in srgb, var(--brand, #0f172a) 75%, transparent); }
.btn-cta:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-link { display: block; margin: 1rem auto 0; background: transparent; border: 0; color: #64748b; font-size: 0.875rem; cursor: pointer; }
.btn-link:hover { color: #0f172a; text-decoration: underline; }

.spinner { width: 1.125rem; height: 1.125rem; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ====================================================================== *
 * FAQ
 * ====================================================================== */
.faq-block { background: white; border: 1px solid #f1f5f9; border-radius: 1.25rem; padding: 1.75rem; margin-bottom: 2rem; }
.faq-title { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 0.875rem; text-align: center; }
.faq { list-style: none; padding: 0; margin: 0; }
.faq li { border-bottom: 1px solid #f1f5f9; }
.faq li:last-child { border-bottom: 0; }
.faq-q {
  width: 100%; background: transparent; border: 0;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.95rem 0; font-size: 0.9375rem; font-weight: 600;
  color: #0f172a; text-align: left; cursor: pointer;
}
.faq-q:hover { color: var(--brand, #2563eb); }
.faq-q svg { transition: transform 0.2s ease; color: #94a3b8; flex-shrink: 0; margin-left: 1rem; }
.faq-q .rotate-180 { transform: rotate(180deg); }
.faq-a { font-size: 0.875rem; color: #475569; line-height: 1.55; padding: 0 0 1rem; margin: 0; }

/* ====================================================================== *
 * Final CTA + legal
 * ====================================================================== */
.final-cta { text-align: center; padding: 2rem 0 1rem; }
.btn-cta-final { max-width: 24rem; }
.final-trust { display: inline-flex; align-items: center; gap: 0.375rem; margin: 1rem 0 0; font-size: 0.75rem; color: #94a3b8; }
.final-trust svg { color: #10b981; }

.legal { margin-top: 1rem; font-size: 0.7rem; color: #94a3b8; text-align: center; letter-spacing: 0.02em; }
.legal strong { color: #64748b; font-weight: 600; }

.card-block.empty {
  background: white; border: 1px solid #f1f5f9; border-radius: 1.25rem;
  padding: 2.5rem 1.5rem; text-align: center;
  margin-bottom: 2rem;
}
.card-block.empty p { margin: 0.875rem auto 0; color: #64748b; font-size: 0.9375rem; max-width: 24rem; line-height: 1.55; }
</style>
