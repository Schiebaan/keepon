import type { PartnerModuleConfig, Subscription } from '~~/shared/types/database'

export function useModules() {
  const config = useRuntimeConfig()

  // Demo mode: use mock data
  if (config.public.demoMode) {
    const { partnerModuleConfigs, subscriptions, getInstallationSubscriptions: getInstSubs } = useMockData()

    return {
      getAvailableModules: async (): Promise<PartnerModuleConfig[]> => {
        return partnerModuleConfigs.filter(c => c.is_enabled)
      },
      getInstallationSubscriptions: async (installationId: string): Promise<Subscription[]> => {
        return getInstSubs(installationId)
      },
      getAllSubscriptions: async (): Promise<Subscription[]> => {
        return subscriptions.filter(s => s.status === 'active')
      },
    }
  }

  // Production: use Supabase
  const supabase = useSupabaseClient()
  const tenant = useTenant()

  async function getAvailableModules(): Promise<PartnerModuleConfig[]> {
    if (!tenant.value) return []

    const { data, error } = await supabase
      .from('partner_module_configs')
      .select('*, module_definition:module_definitions(*)')
      .eq('partner_id', tenant.value.id)
      .eq('is_enabled', true)
      .order('module_definitions(sort_order)')

    if (error) throw error
    return (data ?? []) as PartnerModuleConfig[]
  }

  async function getInstallationSubscriptions(installationId: string): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, partner_module_config:partner_module_configs(*, module_definition:module_definitions(*))')
      .eq('installation_id', installationId)
      .in('status', ['active', 'pending_payment'])

    if (error) throw error
    return (data ?? []) as Subscription[]
  }

  async function getAllSubscriptions(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, partner_module_config:partner_module_configs(*, module_definition:module_definitions(*))')
      .in('status', ['active', 'pending_payment'])
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Subscription[]
  }

  return {
    getAvailableModules,
    getInstallationSubscriptions,
    getAllSubscriptions,
  }
}
