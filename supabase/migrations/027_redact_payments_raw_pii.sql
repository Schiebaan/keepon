-- Verwijder PII-velden uit `payments.raw` voor bestaande rijen.
--
-- Wij hebben tot nu toe de complete Mollie-response in JSONB opgeslagen voor
-- debug-doeleinden. Voor direct-debit-betalingen bevat dat onder `details`:
--   - consumerAccount  → het volledige IBAN
--   - consumerName     → de naam op de bankrekening
--   - consumerBic      → de BIC
-- Die data is geen toegevoegde waarde voor onze admin-flow (alles staat al bij
-- Mollie + we tonen het nergens), en het verkleinen van het opslag-oppervlak
-- voor PII is netter conform GDPR data-minimalisatie.
--
-- Vanaf nu strippen we deze velden bij het wegschrijven (zie
-- server/utils/mollie.ts → redactMollieResponse). Deze migratie ruimt de
-- historische rijen op.
--
-- `jsonb #- path` verwijdert een key op een specifiek pad — geen-op als het
-- pad niet bestaat, dus idempotent.

UPDATE payments
SET raw = raw
  #- '{details,consumerAccount}'
  #- '{details,consumerName}'
  #- '{details,consumerBic}'
  #- '{details,cardHolder}'
  #- '{details,billingEmail}'
WHERE raw IS NOT NULL
  AND (
       raw -> 'details' ? 'consumerAccount'
    OR raw -> 'details' ? 'consumerName'
    OR raw -> 'details' ? 'consumerBic'
    OR raw -> 'details' ? 'cardHolder'
    OR raw -> 'details' ? 'billingEmail'
  );
