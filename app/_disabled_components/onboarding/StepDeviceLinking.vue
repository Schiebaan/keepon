<script setup lang="ts">
import type { Subscription } from '~~/shared/types/database'

const props = defineProps<{
  subscription: Subscription
}>()

const emit = defineEmits<{
  linked: []
}>()

const supabase = useSupabaseClient()
const integrationStatus = ref(props.subscription.integration_status)

// Subscribe to realtime changes on this subscription
onMounted(() => {
  const channel = supabase
    .channel(`subscription:${props.subscription.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'subscriptions',
      filter: `id=eq.${props.subscription.id}`,
    }, (payload: any) => {
      integrationStatus.value = payload.new.integration_status
      if (payload.new.integration_status === 'active') {
        emit('linked')
      }
    })
    .subscribe()

  onUnmounted(() => {
    supabase.removeChannel(channel)
  })

  // Also check current status in case webhook already fired
  checkStatus()
})

async function checkStatus() {
  const { data } = await supabase
    .from('subscriptions')
    .select('integration_status, status')
    .eq('id', props.subscription.id)
    .single()

  if (data) {
    integrationStatus.value = data.integration_status
    if (data.integration_status === 'active') {
      emit('linked')
    }
  }
}

const statusMessages: Record<string, { text: string; color: string }> = {
  pending: { text: 'Wachten op betaling...', color: 'text-yellow-600' },
  linking: { text: 'Je apparaat wordt gekoppeld...', color: 'text-blue-600' },
  active: { text: 'Succesvol gekoppeld!', color: 'text-green-600' },
  error: { text: 'Er ging iets mis bij het koppelen.', color: 'text-red-600' },
}

const currentStatus = computed(() => statusMessages[integrationStatus.value] || statusMessages.pending)
</script>

<template>
  <div class="text-center">
    <h2 class="text-lg font-semibold text-gray-900">Koppeling</h2>
    <p class="mt-1 text-sm text-gray-500">
      We verbinden je apparaat met het monitoringsplatform.
    </p>

    <div class="mt-8">
      <!-- Spinner for pending/linking states -->
      <div
        v-if="integrationStatus === 'pending' || integrationStatus === 'linking'"
        class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-brand-primary"
      />

      <!-- Success icon -->
      <div
        v-else-if="integrationStatus === 'active'"
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl"
      >
        &#10003;
      </div>

      <!-- Error icon -->
      <div
        v-else-if="integrationStatus === 'error'"
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl"
      >
        &#10007;
      </div>

      <p class="mt-4 text-sm font-medium" :class="currentStatus.color">
        {{ currentStatus.text }}
      </p>
    </div>

    <div v-if="integrationStatus === 'error'" class="mt-4">
      <p class="text-sm text-gray-500">
        Neem contact op met je installateur voor hulp.
      </p>
      <NuxtLink to="/" class="btn-secondary mt-4">
        Terug naar dashboard
      </NuxtLink>
    </div>
  </div>
</template>
