-- Wedloop in de ticketnummering dichtzetten.
--
-- 017 beloofde in het commentaar "SELECT ... FOR UPDATE zodat twee gelijktijdige
-- inserts niet hetzelfde nummer pakken", maar die FOR UPDATE stond er niet. En
-- hij zou ook niet geholpen hebben: een MAX()-aggregatie vergrendelt geen rijen,
-- en bij de eerste ticket van een partner is er niets om te vergrendelen.
--
-- Gevolg: twee klanten die op hetzelfde moment een melding indienen krijgen
-- allebei nummer N, en de tweede insert loopt stuk op
-- service_tickets_partner_ticket_number_key. Die klant kreeg een 500.
-- Waargenomen bij het testen van dubbelklik-bescherming, maar het treft net zo
-- goed twee verschillende klanten.
--
-- Oplossing: een advisory lock per partner, voor de duur van de transactie.
-- Gelijktijdige inserts voor dezelfde partner staan daardoor netjes in de rij;
-- inserts voor verschillende partners hinderen elkaar niet.

CREATE OR REPLACE FUNCTION assign_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    -- Serialiseert alleen deze partner, en alleen tot het einde van de
    -- transactie. Geen expliciete unlock nodig.
    PERFORM pg_advisory_xact_lock(hashtext('service_tickets.ticket_number'),
                                  hashtext(NEW.partner_id::text));

    SELECT COALESCE(MAX(ticket_number), 0) + 1
    INTO NEW.ticket_number
    FROM service_tickets
    WHERE partner_id = NEW.partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
