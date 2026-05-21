# Roadmap

Toekomstige features die niet acuut zijn — niet bouwen tot expliciet gevraagd.

## Tickets

- **Real-time chat-update in ticketdetail.** Als een admin of klant in een ticket
  reageert, ziet de andere partij de update nu pas na een refresh. Werkt prima
  asynchroon (mail-notificaties dragen het gesprek), maar in de toekomst zou
  het natuurlijker voelen als nieuwe berichten direct verschijnen — bijvoorbeeld
  via Supabase realtime channels op de `ticket_messages`-tabel.

## Pricing & billing

- **Automatische facturatie-cron.** Vandaag triggert de admin handmatig
  "Stuur factuur" per klant. Logische volgende stap: een dagelijkse cron die
  per klant kijkt naar `billing_interval` en `period_end` van de laatste
  geslaagde betaling, en automatisch een nieuwe incasso aanmaakt zodra een
  nieuwe periode begint. Houd rekening met:
  - Idempotency op `(customer_id, period_start, period_end)` zodat retries
    niet dubbel boeken.
  - Trial-respect (skip als `mandate_at + trial_months > now()`).
  - Failed-payment retry-flow (Mollie geeft dat aan via webhook;
    we kunnen 1× automatisch opnieuw proberen na X dagen).

- **Partner-default voor jaarkorting + trial in /admin/instellingen.** De
  data-laag heeft `partners.default_yearly_discount_months` en het concept
  van standaard-trial-maanden — maar er is nog geen UI om die per partner
  in te stellen. Vandaag set je dit per klant in de invite-modal. Voor
  schaal: één invul-veld per partner zodat nieuwe uitnodigingen die default
  meekrijgen.

- **Trial verlengen / pauzeren in admin.** Nu kan een admin alleen
  `trial_months` aanpassen. Praktisch wil je soms een trial verlengen na
  klacht of pauzeren omdat een module nog niet werkt. Aparte
  trial-overrides per klant met start/end-datums zou dat netter dekken
  dan het huidige "X maanden vanaf mandaat" model.

- **Inbound mail parsing voor ticket-replies.** Vandaag werken we met "geen
  reply via mail" — de notificatiemails hebben geen `Reply-To` meer en de body
  stuurt klanten expliciet naar het portaal. Reageren via mail kan dus niet.
  In de toekomst willen we dit wél kunnen ondersteunen: klant beantwoordt de
  mail vanaf z'n telefoon en het komt automatisch in het ticket terecht.
  Vereist:
  - Inbound-mail-provider (SendGrid Inbound Parse, Mailgun routes of Postmark)
    — Resend doet alleen outbound.
  - MX-records van `upsol.nl` (of een subdomein zoals `reply.upsol.nl`)
    routen naar die provider.
  - Webhook-endpoint dat de inkomende mail parset en als ticket-message
    opslaat. Threading via plus-addressing (`reply+<ticketId>@upsol.nl`) of
    via `Message-Id`/`In-Reply-To`-headers.
  - DKIM/SPF-verificatie zodat niemand een mail kan spoofen alsof 'ie van de
    klant komt en zo in z'n ticket kan injecteren.
  - Signature- en quote-stripping (mail bevat onderaan altijd de hele thread).
  - Attachment-handling (uploaden naar Supabase Storage, koppelen aan
    ticket-message).
