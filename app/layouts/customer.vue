<template>
  <BrandedShell>
    <div class="flex min-h-screen flex-col">
      <AppHeader variant="customer" />
      <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <slot />
      </main>
      <AppFooter />
    </div>
  </BrandedShell>
</template>
