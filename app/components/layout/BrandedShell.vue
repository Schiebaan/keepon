<script setup lang="ts">
const { partner } = usePartner()

// Title, favicon and theme-color are handled globally in app.vue.
// Here we only inject brand-color CSS variables + load Inter font.
useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
  ],
  style: [{
    innerHTML: computed(() => `:root { --brand-primary: ${partner.value?.primary_color || '#1a56db'}; --brand-secondary: ${partner.value?.secondary_color || '#f3f4f6'}; }`),
  }],
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <slot />
  </div>
</template>
