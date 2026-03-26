export interface Partner {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  terms_url: string | null
  terms_content: string
  terms_placeholders: Record<string, string>
  support_email: string | null
  support_phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  auth_user_id: string
  partner_id: string
  email: string
  full_name: string | null
  phone: string | null
  mollie_customer_id: string | null
  street: string | null
  house_number: string | null
  postal_code: string | null
  city: string | null
  created_at: string
  updated_at: string
}

export interface Installation {
  id: string
  customer_id: string
  partner_id: string
  name: string
  address_street: string | null
  address_house_number: string | null
  address_postal_code: string | null
  address_city: string | null
  created_at: string
  updated_at: string
}

export interface ModuleDefinition {
  id: string
  type: ModuleType
  name: string
  description: string | null
  icon: string | null
  integration_type: IntegrationType
  default_price_monthly: number | null
  default_price_yearly: number | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface PartnerModuleConfig {
  id: string
  partner_id: string
  module_definition_id: string
  is_enabled: boolean
  price_monthly: number
  price_yearly: number
  min_contract_months: number
  custom_terms: string | null
  created_at: string
  updated_at: string
  // Joined
  module_definition?: ModuleDefinition
}

export type SubscriptionStatus = 'pending_payment' | 'active' | 'paused' | 'cancelled' | 'expired'
export type IntegrationStatus = 'pending' | 'linking' | 'active' | 'error'

export interface Subscription {
  id: string
  customer_id: string
  installation_id: string
  partner_module_config_id: string
  status: SubscriptionStatus
  billing_interval: 'monthly' | 'yearly'
  price_cents: number
  mollie_subscription_id: string | null
  mollie_mandate_id: string | null
  external_device_id: string | null
  integration_status: IntegrationStatus
  integration_meta: Record<string, unknown>
  terms_accepted_at: string | null
  terms_version: string | null
  activated_at: string | null
  cancelled_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  // Joined
  partner_module_config?: PartnerModuleConfig
}

export type PaymentStatus = 'open' | 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled'

export interface Payment {
  id: string
  subscription_id: string
  customer_id: string
  mollie_payment_id: string
  amount_cents: number
  currency: string
  status: PaymentStatus
  is_first_payment: boolean
  payment_method: string | null
  paid_at: string | null
  created_at: string
}

export interface IntegrationCredentials {
  id: string
  partner_id: string
  integration_type: IntegrationType
  credentials: Record<string, string>
  is_active: boolean
  last_verified_at: string | null
  created_at: string
  updated_at: string
}

export type UserRole = 'customer' | 'partner_admin' | 'platform_admin'

export interface UserRoleRecord {
  id: string
  auth_user_id: string
  partner_id: string | null
  role: UserRole
  created_at: string
}

export interface AuditLogEntry {
  id: string
  actor_id: string | null
  partner_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  meta: Record<string, unknown>
  created_at: string
}

export type ModuleType = 'solar' | 'heat_pump' | 'ev_charger'
export type IntegrationType = 'sundata' | 'weheat' | 'easee'
