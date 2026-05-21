-- Company users (partner_admin) krijgen een echte naam.
--
-- Tot nu toe hadden admin-accounts alleen een e-mailadres. Dat is voldoende om
-- in te loggen, maar onbruikbaar voor klantgerichte zichtbaarheid (denk: ticket-
-- reactie ondertekend door "Mark" i.p.v. "info@volt4u.nl").
--
-- Eén simpele kolom op user_roles is genoeg — admins kunnen zelf bij meerdere
-- partners horen, maar in de praktijk is de naam dezelfde, dus we tolereren de
-- denormalisatie.

ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS full_name TEXT;
