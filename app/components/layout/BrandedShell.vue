<script setup lang="ts">
const { partner } = usePartner()

// Inject brand colors as CSS custom properties + Inter font
useHead({
  style: [{
    innerHTML: `:root { --brand-primary: ${partner.primary_color}; --brand-secondary: ${partner.secondary_color}; }`,
  }],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
  ],
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <slot />
  </div>
</template>
