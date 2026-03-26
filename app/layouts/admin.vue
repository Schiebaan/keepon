<template>
  <BrandedShell>
    <div class="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div class="flex flex-1 flex-col overflow-hidden">
        <AdminTopBar />
        <main class="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
          <div class="mx-auto max-w-6xl">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </BrandedShell>
</template>
