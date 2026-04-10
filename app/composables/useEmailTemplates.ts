// Email templates composable — dual mode
export function useEmailTemplates() {
  const mock = useMockData()

  return {
    templates: mock.emailTemplates,
    getTemplate: (type: string) => mock.getEmailTemplate(type),
    updateTemplate: (type: string, updates: any) => mock.updateEmailTemplate(type, updates),
    resetTemplate: (type: string) => mock.resetEmailTemplate(type),
    // TODO: Replace with Supabase queries when email_templates table is populated
  }
}
