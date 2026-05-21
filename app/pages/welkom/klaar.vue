<script setup lang="ts">
import { getModuleCopy } from '~/utils/onboarding-copy'

definePageMeta({ layout: false, middleware: ['auth'] })

const { state, isLoading, load, targetRouteForStep } = useOnboarding()

onMounted(async () => {
  const s = await load()
  if (!s) return
  if (s.step !== 'done') {
    navigateTo(targetRouteForStep(s.step))
  } else {
    // Trigger confetti after first paint
    setTimeout(launchConfetti, 250)
  }
})

const partner = computed(() => state.value?.partner)
const firstName = computed(() => state.value?.customer?.first_name || 'daar')
const modules = computed(() => state.value?.proposal?.modules || [])
const mandateSkipped = computed(() => !!state.value?.mandate_skipped)

// Pure-CSS-driven confetti without external deps
const confettiPieces = ref<{ id: number; left: number; delay: number; color: string; rotate: number }[]>([])
function launchConfetti() {
  const colors = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c']
  confettiPieces.value = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    color: colors[i % colors.length],
    rotate: Math.random() * 360,
  }))
  setTimeout(() => { confettiPieces.value = [] }, 3500)
}

const tourCards = computed(() => {
  const cards: { title: string; text: string; icon: string; to: string; bg: string; text_class: string }[] = []
  for (const m of modules.value) {
    const c = getModuleCopy(m.module)
    if (!c) continue
    if (m.module === 'solar') {
      cards.push({ title: 'Je opbrengst', text: 'Live data, vergelijking met voorspelling, jaaroverzicht.', icon: c.icon, to: '/klant/zonnepanelen', bg: c.bg, text_class: c.text })
    }
    if (m.module === 'heat_pump') {
      cards.push({ title: 'Je warmtepomp', text: 'Status, COP en watertemperatuur, straks live in beeld.', icon: c.icon, to: '/klant/warmtepomp', bg: c.bg, text_class: c.text })
    }
    if (m.module === 'ev_charger') {
      cards.push({ title: 'Je laadpaal', text: 'Sessies en kosten op één plek.', icon: c.icon, to: '/klant/laadpaal', bg: c.bg, text_class: c.text })
    }
  }
  // Always show the service card
  cards.push({ title: 'Hulp nodig?', text: 'Stel een vraag of bekijk je meldingen.', icon: 'tool', to: '/klant/service', bg: 'bg-indigo-50', text_class: 'text-indigo-700' })
  return cards
})
</script>

<template>
  <div class="page" :style="partner?.primary_color ? `--brand: ${partner.primary_color};` : ''">
    <!-- Confetti overlay -->
    <div class="confetti" aria-hidden="true">
      <span
        v-for="p in confettiPieces"
        :key="p.id"
        class="confetti-piece"
        :style="{ left: p.left + '%', backgroundColor: p.color, animationDelay: p.delay + 's', '--rot': p.rotate + 'deg' }"
      />
    </div>

    <div class="container">
      <header class="header">
        <div class="brand">
          <img v-if="partner?.logo_url" :src="partner.logo_url" alt="" aria-hidden="true" class="logo" />
          <span class="brand-name">{{ partner?.name }}</span>
        </div>
        <span class="step-marker">Klaar</span>
      </header>

      <div v-if="isLoading && !state" class="text-center py-16">
        <div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
      </div>

      <template v-else>
        <div class="hero">
          <div class="check-circle">
            <AppIcon name="check" :size="44" />
          </div>
          <p class="eyebrow">Klaar voor gebruik</p>
          <h1 class="title">{{ firstName }}, je portaal staat live!</h1>
          <p class="subtitle">
            Bedankt voor je akkoord. Vanaf nu krijg je een seintje als je systeem
            aandacht nodig heeft. Je kunt op elk moment terugkomen om alles te zien.
          </p>
        </div>

        <!-- Status checklist -->
        <ul class="checklist">
          <li class="done">
            <AppIcon name="check-circle" :size="20" />
            <span>Account aangemaakt</span>
          </li>
          <li class="done">
            <AppIcon name="check-circle" :size="20" />
            <span>Servicecontract akkoord</span>
          </li>
          <li :class="mandateSkipped ? 'pending' : 'done'">
            <AppIcon :name="mandateSkipped ? 'clock' : 'check-circle'" :size="20" />
            <span v-if="mandateSkipped">Incasso volgt nog, we sturen je later een mailtje</span>
            <span v-else>Automatische incasso geregeld</span>
          </li>
        </ul>

        <!-- Tour: where to find what -->
        <div class="tour">
          <p class="tour-title">Wat kan je hier?</p>
          <div class="tour-grid">
            <NuxtLink v-for="t in tourCards" :key="t.to" :to="t.to" class="tour-card" :class="t.bg + ' no-underline'">
              <div class="tour-icon" :class="[t.bg, t.text_class]">
                <AppIcon :name="t.icon" :size="18" />
              </div>
              <p class="tour-card-title">{{ t.title }}</p>
              <p class="tour-card-text">{{ t.text }}</p>
            </NuxtLink>
          </div>
        </div>

        <NuxtLink to="/klant" class="cta-link">
          Naar mijn portaal
          <AppIcon name="chevron-right" :size="16" />
        </NuxtLink>

        <p class="footnote">
          Servicecontract bij UPsol · Service door {{ partner?.name }}
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: linear-gradient(180deg, color-mix(in srgb, var(--brand, #111) 8%, white) 0%, #f9fafb 60%); padding: 1.5rem 1rem 4rem; position: relative; overflow: hidden; }
.container { max-width: 640px; margin: 0 auto; position: relative; z-index: 1; }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2.5rem; }
.brand { display: flex; align-items: center; gap: 0.5rem; }
.logo { height: 3rem; max-width: 12rem; object-fit: contain; }
.brand-name { font-weight: 600; font-size: 0.875rem; color: #1f2937; }
.step-marker { font-size: 0.75rem; color: #9ca3af; font-variant-numeric: tabular-nums; }

.hero { text-align: center; margin-bottom: 2rem; }
.check-circle {
  width: 5rem; height: 5rem; margin: 0 auto 1.25rem; border-radius: 50%;
  background: #10b981; color: white;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12px 30px -8px rgba(16, 185, 129, 0.55);
  animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes pop { 0% { transform: scale(0.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.eyebrow { color: #10b981; font-weight: 600; font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 0.5rem; }
.title { font-size: 2rem; font-weight: 700; color: #111827; margin: 0 0 0.75rem; line-height: 1.2; }
.subtitle { font-size: 0.95rem; color: #6b7280; max-width: 480px; margin: 0 auto; line-height: 1.55; }

.checklist { list-style: none; padding: 1rem 1.25rem; margin: 0 auto 2rem; max-width: 420px; background: white; border: 1px solid #e5e7eb; border-radius: 0.875rem; display: flex; flex-direction: column; gap: 0.625rem; }
.checklist li { display: flex; align-items: center; gap: 0.625rem; font-size: 0.875rem; }
.checklist li.done { color: #047857; }
.checklist li.done svg { color: #10b981; }
.checklist li.pending { color: #92400e; }
.checklist li.pending svg { color: #f59e0b; }

.tour { margin-bottom: 2rem; }
.tour-title { font-size: 0.75rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 0.75rem; text-align: center; }
.tour-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.625rem; }
.tour-card { display: block; padding: 1rem; border-radius: 0.875rem; text-decoration: none; transition: transform 0.15s ease; border: 1px solid #f3f4f6; }
.tour-card:hover { transform: translateY(-2px); }
.tour-icon { display: flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 0.5rem; margin-bottom: 0.5rem; }
.tour-card-title { font-size: 0.875rem; font-weight: 600; color: #111827; margin: 0 0 0.125rem; }
.tour-card-text { font-size: 0.75rem; color: #6b7280; margin: 0; line-height: 1.4; }

.cta-link {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; max-width: 320px; margin: 0 auto;
  padding: 0.875rem 1.5rem; border-radius: 0.875rem;
  background: #111827; color: white; font-weight: 600; font-size: 0.95rem;
  text-decoration: none; transition: background 0.15s ease, transform 0.15s ease;
}
.cta-link:hover { background: #1f2937; transform: translateY(-1px); }
.footnote { margin-top: 1.5rem; font-size: 0.75rem; color: #9ca3af; text-align: center; }

/* Confetti */
.confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.confetti-piece {
  position: absolute; top: -1rem; width: 0.5rem; height: 0.875rem;
  border-radius: 1px;
  animation: confetti-fall 3s ease-out forwards;
  transform: rotate(var(--rot, 0deg));
}
@keyframes confetti-fall {
  0% { transform: translateY(-1rem) rotate(var(--rot, 0deg)); opacity: 1; }
  100% { transform: translateY(110vh) rotate(calc(var(--rot, 0deg) + 720deg)); opacity: 0.7; }
}

@media (max-width: 540px) {
  .tour-grid { grid-template-columns: 1fr; }
  .title { font-size: 1.625rem; }
}
</style>
