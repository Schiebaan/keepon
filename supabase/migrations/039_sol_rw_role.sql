-- Databaserol voor Sol, de beheer-agent van Sundata.
--
-- Sol mag lezen, toevoegen en wijzigen in de app-tabellen. Geen DELETE en geen
-- DDL: schemawijzigingen lopen alleen via migraties (upsol-deploy).
--
-- Het wachtwoord staat hier bewust niet. Dat zet het installatiescript op de
-- server; zolang er geen wachtwoord is, kan de rol niet inloggen.
--
-- RLS staat op alle tabellen aan, met policies voor ingelogde app-gebruikers
-- (auth.uid()). Een beheerrol valt daar buiten, dus sol_rw krijgt BYPASSRLS.
-- De tabelrechten hieronder blijven gewoon gelden.
--
-- Overgeslagen, omdat er geheimen in staan:
--   integration_credentials  wachtwoorden en API-sleutels van de koppelingen
--   onboarding_records       eenmalige onboarding-tokens
-- Beperkt:
--   audit_log                alleen SELECT en INSERT: een audittrail pas je niet aan
--   user_roles               alleen SELECT: rollen uitdelen loopt via de app
--   schema_migrations        alleen SELECT: dit is de administratie van de migraties
--
-- Nieuwe tabellen krijgen niet vanzelf rechten. Geef ze expliciet in de
-- migratie die de tabel aanmaakt, en sla tabellen met geheimen over.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sol_rw') THEN
    CREATE ROLE sol_rw LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION
      NOINHERIT BYPASSRLS CONNECTION LIMIT 5;
  END IF;
END $$;

ALTER ROLE sol_rw SET statement_timeout = '60s';
ALTER ROLE sol_rw SET idle_in_transaction_session_timeout = '5min';

GRANT USAGE ON SCHEMA public TO sol_rw;

GRANT SELECT, INSERT, UPDATE ON
  public.conversation_messages,
  public.conversations,
  public.customer_documents,
  public.customer_module_prices,
  public.customer_products,
  public.customers,
  public.device_alerts,
  public.email_status,
  public.email_templates,
  public.installations,
  public.mailing_batch_customers,
  public.mailing_batches,
  public.module_definitions,
  public.partner_module_configs,
  public.partners,
  public.payments,
  public.service_ticket_labels,
  public.service_tickets,
  public.smart_meter_readings,
  public.smart_meters,
  public.subscriptions,
  public.sundata_plant_links,
  public.support_articles,
  public.ticket_labels,
  public.weheat_snapshots
TO sol_rw;

GRANT SELECT, INSERT ON public.audit_log TO sol_rw;
GRANT SELECT ON public.user_roles, public.schema_migrations TO sol_rw;
