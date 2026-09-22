-- Bijhouden of een uitnodiging daadwerkelijk verstuurd is.
--
-- Tot nu toe verstuurde het aanmaken van een klant altijd direct de
-- uitnodigingsmail, dus "aangemaakt" en "uitgenodigd" vielen samen. Om een lijst
-- klanten klaar te zetten en pas later te versturen moeten die twee los van
-- elkaar bestaan.
--
-- NULL = nog niet verstuurd. Bestaande klanten zijn allemaal gemaild bij het
-- aanmaken, dus die krijgen created_at als verzendmoment.

ALTER TABLE customers ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ;

UPDATE customers SET invite_sent_at = created_at WHERE invite_sent_at IS NULL;
