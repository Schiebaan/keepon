export function useBranding() {
  const tenant = useTenant()

  useHead(() => ({
    style: tenant.value ? [{
      innerHTML: `:root {
        --brand-primary: ${tenant.value.primary_color};
        --brand-secondary: ${tenant.value.secondary_color};
      }`
    }] : [],
    title: tenant.value ? `${tenant.value.name} - Mijn Portaal` : 'KeepON',
  }))

  return { tenant }
}
