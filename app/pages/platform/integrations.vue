<script setup lang="ts">
definePageMeta({ layout: 'platform', middleware: ['auth', 'role-platform'] })

const integrations = [
  {
    type: 'sundata',
    name: 'Sundata',
    description: 'Monitoring van zonnepanelen via Sundata API',
    fields: ['api_email', 'api_password'],
  },
  {
    type: 'weheat',
    name: 'Weheat',
    description: 'Monitoring van warmtepompen via Weheat API',
    fields: ['client_id', 'client_secret'],
  },
  {
    type: 'easee',
    name: 'Easee',
    description: 'Monitoring van laadpalen via Easee API',
    fields: ['username', 'password'],
  },
  {
    type: 'mollie',
    name: 'Mollie',
    description: 'Betalingen via Mollie',
    fields: ['api_key'],
  },
]
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold text-gray-900">Integraties</h1>
    <p class="mb-6 text-sm text-gray-500">
      Overzicht van beschikbare integraties. Credentials worden per partner geconfigureerd.
    </p>

    <div class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="integration in integrations"
        :key="integration.type"
        class="card"
      >
        <h3 class="font-semibold text-gray-900">{{ integration.name }}</h3>
        <p class="mt-1 text-sm text-gray-500">{{ integration.description }}</p>
        <div class="mt-3">
          <p class="text-xs font-medium text-gray-400">Benodigde velden:</p>
          <div class="mt-1 flex flex-wrap gap-1">
            <span
              v-for="field in integration.fields"
              :key="field"
              class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {{ field }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
