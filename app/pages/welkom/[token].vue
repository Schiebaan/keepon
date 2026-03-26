<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const token = route.params.token as string
const { getOnboardingData, activateOnboarding, partner, serviceTiers } = useMockData()
const data = getOnboardingData(token)

// Step state
const step = ref(1)

// Form fields (pre-filled from customer data)
const form = reactive({
  full_name: data?.customer.full_name || '',
  email: data?.customer.email || '',
  phone: data?.customer.phone || '',
  street: data?.customer.street || '',
  house_number: data?.customer.house_number || '',
  postal_code: data?.customer.postal_code || '',
  city: data?.customer.city || '',
})

// Terms checkbox
const termsAccepted = ref(false)

// Activation state
const isActivating = ref(false)
const activationDone = ref(false)

// Module theme for the installed module
const theme = computed(() => {
  if (!data) return getModuleTheme('solar')
  return getModuleTheme(data.moduleType)
})

// Customer first name
const firstName = computed(() => {
  if (!data?.customer.full_name) return ''
  return data.customer.full_name.split(' ')[0]
})

// Subscription price
const monthlyPrice = computed(() => {
  if (!data?.subscription) return null
  return formatCurrency(data.subscription.price_cents)
})

// Service tier for onboarding
const serviceTier = computed(() => data?.serviceTier || serviceTiers[1])

// Consumer-friendly bullets for the service tier
const tierBullets = computed(() => {
  const tier = serviceTier.value
  if (!tier) return []
  const bullets: string[] = []
  for (const f of tier.features) {
    if (!f.included) continue
    switch (f.label) {
      case 'Monitoring portal':
        bullets.push('Je hebt een persoonlijk portaal voor je installatie')
        break
      case 'Proactieve monitoring 24/7':
        bullets.push('Wij houden je systeem 24/7 in de gaten')
        break
      case 'Storingsanalyse':
        bullets.push('Bij een storing analyseren we direct de oorzaak')
        break
      case 'Rapportages':
        bullets.push(f.detail === 'Maandelijks'
          ? 'Maandelijks rapport over je opbrengst'
          : 'Jaarlijks rapport over je opbrengst')
        break
      case 'Oplosservice':
        bullets.push(f.detail === 'Binnen 1 werkdag'
          ? 'Je installateur neemt binnen 1 werkdag contact op'
          : 'Je installateur neemt binnen 3 werkdagen contact op')
        break
      case 'Jaarlijkse inspectie (APK)':
        bullets.push('Jaarlijkse inspectie van je installatie')
        break
      case 'Super Service':
        bullets.push('Geen extra kosten bij veelvoorkomende storingen')
        break
    }
  }
  return bullets
})

// Service tier price formatted
const tierPrice = computed(() => {
  const tier = serviceTier.value
  if (!tier || tier.price_cents === 0) return 'Gratis'
  return formatCurrency(tier.price_cents)
})

// Partner for branding (use onboarding data partner if available)
const brandPartner = computed(() => data?.partner || partner)

// Activate handler
async function handleActivate() {
  if (!termsAccepted.value || isActivating.value) return
  isActivating.value = true

  activateOnboarding(token, {
    full_name: form.full_name,
    email: form.email,
    phone: form.phone,
    street: form.street,
    house_number: form.house_number,
    postal_code: form.postal_code,
    city: form.city,
  })

  // Brief delay for success animation
  await new Promise(resolve => setTimeout(resolve, 800))
  activationDone.value = true

  // Redirect after showing success
  setTimeout(() => {
    navigateTo('/klant')
  }, 2000)
}
</script>

<template>
  <BrandedShell>
    <!-- Invalid token -->
    <div v-if="!data" class="min-h-screen flex items-center justify-center p-6">
      <div class="text-center max-w-sm">
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          :style="{ backgroundColor: partner.secondary_color }"
        >
          <AppIcon name="x-circle" :size="32" class="text-gray-400" />
        </div>
        <h1 class="text-xl font-semibold text-gray-900 mb-2">Deze link is niet meer geldig</h1>
        <p class="text-gray-500 mb-8">
          De activatielink is verlopen of al gebruikt. Neem contact op met je installateur als je hulp nodig hebt.
        </p>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all"
          :style="{ backgroundColor: partner.primary_color }"
        >
          Naar de homepage
          <AppIcon name="arrow-right" :size="16" />
        </NuxtLink>
      </div>
    </div>

    <!-- Already activated -->
    <div v-else-if="data.record.status === 'activated'" class="min-h-screen flex items-center justify-center p-6">
      <div class="text-center max-w-sm">
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          :style="{ backgroundColor: brandPartner.secondary_color }"
        >
          <AppIcon name="check-circle" :size="32" :style="{ color: brandPartner.primary_color }" />
        </div>
        <h1 class="text-xl font-semibold text-gray-900 mb-2">Je account is al geactiveerd</h1>
        <p class="text-gray-500 mb-8">
          Je kunt direct naar je persoonlijke dashboard.
        </p>
        <NuxtLink
          to="/klant"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all"
          :style="{ backgroundColor: brandPartner.primary_color }"
        >
          Ga naar je dashboard
          <AppIcon name="arrow-right" :size="16" />
        </NuxtLink>
      </div>
    </div>

    <!-- Onboarding flow -->
    <div v-else class="min-h-screen" :style="{ background: `linear-gradient(180deg, ${brandPartner.primary_color}08 0%, ${brandPartner.secondary_color}40 50%, white 100%)` }">
        <!-- STEP 1: Welkom -->
        <div v-if="step === 1 && !activationDone" class="min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <div class="w-full max-w-md mx-auto text-center">
            <!-- Partner logo -->
            <div class="mb-8">
              <img
                v-if="brandPartner.logo_url"
                :src="brandPartner.logo_url"
                :alt="brandPartner.name"
                class="h-12 mx-auto"
              />
              <div
                v-else
                class="w-12 h-12 rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold"
                :style="{ backgroundColor: brandPartner.primary_color }"
              >
                {{ brandPartner.name.charAt(0) }}
              </div>
            </div>

            <!-- Welcome text -->
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welkom bij {{ brandPartner.name }}
            </h1>
            <p class="text-lg text-gray-500 mb-8">
              Hallo {{ firstName }}
            </p>

            <!-- Installed module card -->
            <div
              class="bg-white rounded-2xl shadow-sm border-2 p-6 mb-6 text-left"
              :style="{ borderColor: theme.accent + '40' }"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  :style="{ backgroundColor: theme.accent + '15', color: theme.accent }"
                >
                  <AppIcon :name="theme.icon" :size="28" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-900 text-lg">{{ theme.label }}</p>
                  <div class="flex items-center gap-1.5 mt-1.5">
                    <span
                      class="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full"
                      :style="{ backgroundColor: theme.accent + '15', color: theme.accent }"
                    >
                      <AppIcon name="check" :size="14" />
                      Geinstalleerd en gekoppeld
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Service package section -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 text-left">
              <p class="text-sm font-semibold text-gray-900 mb-4">
                Jouw servicepakket: {{ serviceTier.name }}
              </p>
              <ul class="space-y-3 mb-4">
                <li
                  v-for="(bullet, idx) in tierBullets"
                  :key="idx"
                  class="flex items-start gap-2.5 text-sm text-gray-700"
                >
                  <AppIcon
                    name="check-circle"
                    :size="18"
                    class="shrink-0 mt-0.5"
                    :style="{ color: brandPartner.primary_color }"
                  />
                  <span>{{ bullet }}</span>
                </li>
              </ul>
              <button
                class="text-xs font-medium transition-colors hover:underline"
                :style="{ color: brandPartner.primary_color }"
                @click.prevent
              >
                Bekijk alle pakketten
              </button>
            </div>

            <!-- Price -->
            <div class="mb-8">
              <p class="text-2xl font-bold text-gray-900">
                {{ tierPrice }}
                <span v-if="serviceTier.price_cents > 0" class="text-base font-normal text-gray-500">per maand</span>
              </p>
            </div>

            <!-- CTA -->
            <button
              class="w-full py-4 px-6 rounded-xl text-white font-semibold text-base transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
              :style="{
                backgroundColor: brandPartner.primary_color,
                boxShadow: `0 4px 14px ${brandPartner.primary_color}40`,
              }"
              @click="step = 2"
            >
              Activeer mijn account
            </button>
            <p class="text-xs text-gray-400 mt-3">Dit duurt minder dan 30 seconden</p>
          </div>
        </div>

        <!-- STEP 2: Bevestig & activeer -->
        <div v-else-if="step === 2 && !activationDone" key="step2" class="min-h-screen flex flex-col items-center px-6 py-12">
          <div class="w-full max-w-md mx-auto">
            <!-- Back button -->
            <button
              class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
              @click="step = 1"
            >
              <AppIcon name="chevron-right" :size="16" class="rotate-180" />
              Terug
            </button>

            <!-- Header -->
            <h1 class="text-2xl font-bold text-gray-900 mb-1">Controleer je gegevens</h1>
            <p class="text-gray-500 mb-8">Pas aan waar nodig en activeer je account.</p>

            <!-- Form card -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div class="space-y-4">
                <!-- Naam -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1.5">Naam</label>
                  <input
                    v-model="form.full_name"
                    type="text"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                    :style="{ '--tw-ring-color': brandPartner.primary_color + '40' }"
                  />
                </div>

                <!-- E-mail -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1.5">E-mail</label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                    :style="{ '--tw-ring-color': brandPartner.primary_color + '40' }"
                  />
                </div>

                <!-- Telefoon -->
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1.5">Telefoon</label>
                  <input
                    v-model="form.phone"
                    type="tel"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                    :style="{ '--tw-ring-color': brandPartner.primary_color + '40' }"
                  />
                </div>

                <!-- Adres -->
                <div class="grid grid-cols-3 gap-3">
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-gray-500 mb-1.5">Straat</label>
                    <input
                      v-model="form.street"
                      type="text"
                      class="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                      :style="{ '--tw-ring-color': brandPartner.primary_color + '40' }"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1.5">Nr.</label>
                    <input
                      v-model="form.house_number"
                      type="text"
                      class="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                      :style="{ '--tw-ring-color': brandPartner.primary_color + '40' }"
                    />
                  </div>
                </div>

                <!-- Postcode + Woonplaats -->
                <div class="grid grid-cols-5 gap-3">
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-gray-500 mb-1.5">Postcode</label>
                    <input
                      v-model="form.postal_code"
                      type="text"
                      class="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                      :style="{ '--tw-ring-color': brandPartner.primary_color + '40' }"
                    />
                  </div>
                  <div class="col-span-3">
                    <label class="block text-xs font-medium text-gray-500 mb-1.5">Woonplaats</label>
                    <input
                      v-model="form.city"
                      type="text"
                      class="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                      :style="{ '--tw-ring-color': brandPartner.primary_color + '40' }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Service contract card -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h3 class="text-sm font-semibold text-gray-900 mb-4">Je servicecontract</h3>
              <div class="flex items-center gap-3 mb-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  :style="{ backgroundColor: theme.accent + '15', color: theme.accent }"
                >
                  <AppIcon :name="theme.icon" :size="20" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 text-sm">{{ theme.label }}</p>
                  <p v-if="monthlyPrice" class="text-sm text-gray-500">{{ monthlyPrice }} per maand</p>
                </div>
              </div>
              <a
                :href="'/voorwaarden/' + (brandPartner.slug || 'volt4u')"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-xs font-medium transition-colors"
                :style="{ color: brandPartner.primary_color }"
              >
                Bekijk de voorwaarden
                <AppIcon name="external" :size="12" />
              </a>
            </div>

            <!-- Terms checkbox -->
            <label class="flex items-start gap-3 mb-6 cursor-pointer select-none">
              <input
                v-model="termsAccepted"
                type="checkbox"
                class="mt-0.5 w-5 h-5 rounded border-gray-300 transition-colors cursor-pointer"
                :style="{ accentColor: brandPartner.primary_color }"
              />
              <span class="text-sm text-gray-600">
                Ik ga akkoord met de servicevoorwaarden
              </span>
            </label>

            <!-- Activate button -->
            <button
              class="w-full py-4 px-6 rounded-xl text-white font-semibold text-base transition-all"
              :class="termsAccepted && !isActivating ? 'hover:shadow-xl active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'"
              :style="{
                backgroundColor: brandPartner.primary_color,
                boxShadow: termsAccepted ? `0 4px 14px ${brandPartner.primary_color}40` : 'none',
              }"
              :disabled="!termsAccepted || isActivating"
              @click="handleActivate"
            >
              <span v-if="isActivating" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Account activeren...
              </span>
              <span v-else>Account activeren</span>
            </button>
          </div>
        </div>

        <!-- Success state -->
        <div v-else key="success" class="min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <div class="text-center max-w-sm mx-auto">
            <div
              class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-once"
              :style="{ backgroundColor: brandPartner.primary_color + '15' }"
            >
              <AppIcon name="check-circle" :size="40" :style="{ color: brandPartner.primary_color }" />
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Je account is actief!</h1>
            <p class="text-gray-500">Je wordt doorgestuurd naar je dashboard...</p>
          </div>
        </div>
    </div>
  </BrandedShell>
</template>

<style scoped>
/* Fade transition between steps */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* Focus ring using CSS variable set by style binding */
input:focus {
  --tw-ring-opacity: 1;
  box-shadow: 0 0 0 3px var(--tw-ring-color, rgba(59, 130, 246, 0.3));
}

/* Success bounce animation */
@keyframes bounce-once {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.1); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); opacity: 1; }
}

.animate-bounce-once {
  animation: bounce-once 0.5s ease-out forwards;
}
</style>
