import { buildWelcomeEmail, buildPasswordResetEmail, buildActivationConfirmEmail } from '~~/server/utils/email'

export default defineEventHandler(async (event) => {
  // Require partner_admin or platform_admin
  await requireRole(event, 'partner_admin')

  const query = getQuery(event)
  const template = (query.template as string) || 'welcome'

  const demoPartner = {
    name: 'Volt4U',
    primary_color: '#f97316',
    logo_url: '',
    support_email: 'info@volt4u.nl',
  }

  let result: { subject: string; html: string }

  switch (template) {
    case 'welcome':
      result = buildWelcomeEmail({
        customerName: 'Jan de Vries',
        customerEmail: 'jan@voorbeeld.nl',
        onboardingUrl: 'https://upsol.nl/welkom/demo-token-123',
        moduleName: 'Zonnepanelen monitoring',
        partner: demoPartner,
      })
      break

    case 'reset':
      result = buildPasswordResetEmail({
        customerName: 'Jan de Vries',
        resetUrl: 'https://upsol.nl/auth/reset-password?token=demo',
        partner: demoPartner,
      })
      break

    case 'activation':
      result = buildActivationConfirmEmail({
        customerName: 'Jan de Vries',
        loginUrl: 'https://upsol.nl/login',
        moduleName: 'Zonnepanelen monitoring',
        partner: demoPartner,
      })
      break

    default:
      throw createError({ statusCode: 400, message: `Unknown template: ${template}. Use: welcome, reset, activation` })
  }

  // Return HTML directly so you can view it in the browser
  setHeader(event, 'content-type', 'text/html')
  return result.html
})
