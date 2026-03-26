import type { Installation } from '~~/shared/types/database'

export function useInstallation() {
  const config = useRuntimeConfig()

  // Demo mode: use mock data
  if (config.public.demoMode) {
    const { installations, getCustomerInstallations } = useMockData()

    return {
      getInstallations: async (): Promise<Installation[]> => installations,
      getInstallation: async (id: string): Promise<Installation | null> => {
        return installations.find(i => i.id === id) ?? null
      },
    }
  }

  // Production: use Supabase
  const supabase = useSupabaseClient()

  async function getInstallations(): Promise<Installation[]> {
    const { data, error } = await supabase
      .from('installations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Installation[]
  }

  async function getInstallation(id: string): Promise<Installation | null> {
    const { data, error } = await supabase
      .from('installations')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return (data as Installation) ?? null
  }

  return {
    getInstallations,
    getInstallation,
  }
}
