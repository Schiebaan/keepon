---
slug: hoe-incasso-werkt
title: Hoe incasso werkt — van machtiging tot afschrijving
category: Contracten & betalingen
sort_order: 20
excerpt: Hoe je klant machtigt via iDEAL, waarom dat veiliger is dan een ingetypt IBAN, en waar bankgegevens wél en niet worden opgeslagen.
---

## Het model: jij factureert, wij regelen de techniek

UPsol werkt volgens het **booking-model**, zoals Booking.com of Airbnb dat
doen. Concreet:

- De klant sluit een servicecontract met **jou**
- UPsol int het maandbedrag namens jou via Mollie
- Wij dragen de omzet aan jou af

Dat betekent dat jij géén eigen Mollie-account nodig hebt en niet hoeft te
wachten op goedkeuring van een betaalprovider. Je kunt vandaag beginnen.

## Zo machtigt je klant: via iDEAL

Op `/welkom/incasso` kiest je klant standaard voor **Machtigen via iDEAL**.

1. De klant kiest zijn eigen bank en logt daar in zoals hij gewend is
2. Wij schrijven **€0,01** af — puur om de rekening te bevestigen
3. De bank bevestigt daarmee het rekeningnummer **én** de tenaamstelling
4. Mollie maakt daar automatisch een geldig SEPA-mandaat van
5. Wij slaan alleen het **mandaat-ID** op (`mdt_xxxxx`), nooit het IBAN zelf

Die ene cent boeken we niet terug — een refund kost meer aan transactiekosten
dan het bedrag waard is.

### Waarom die omweg langs de bank?

Omdat een ingetypt IBAN nergens op gecontroleerd wordt. Een typefout levert een
mandaat op dat er geldig uitziet en pas weken later stukloopt op de eerste
incasso. En iemand kan het rekeningnummer van een ander invullen.

Het grootste verschil zit in de aansprakelijkheid. Bij SEPA Core kan een
consument tot **13 maanden** terug een afschrijving terugvorderen met de melding
"hier heb ik nooit toestemming voor gegeven". Kun je daar alleen een ingetypt
nummer tegenover zetten, dan sta je zwak. Een transactie waarbij de klant zich
bij zijn eigen bank heeft geïdentificeerd is aanzienlijk sterker bewijs.

De gewone 8-weken-terugboeking blijft gewoon bestaan — dat is het normale recht
van je klant en daar verandert dit niets aan.

### De handmatige route

Onder de iDEAL-knop staat *"Liever je IBAN zelf invullen?"*. Die route blijft
bestaan voor zakelijke rekeningen zonder iDEAL. De klant krijgt daar wel een
waarschuwing dat het nummer niet bij de bank geverifieerd kan worden.

Gebruik het als uitzondering, niet als standaard.

## Waar de gegevens staan

| Waar | Wat |
|---|---|
| Onze database | Alleen Mollie-tokens (`cst_xxx`, `mdt_xxx`) |
| Ons audit-log | Gemaskeerd IBAN (`NL91****4300`) voor traceerbaarheid |
| Mollie | Het echte IBAN, met alle bijbehorende compliance |

Zouden wij onze hele database verliezen, dan liggen er nog steeds geen
bankgegevens op straat. Ook de ruwe betalingsdata die we van Mollie
terugkrijgen wordt gefilterd voordat we 'm opslaan — IBAN, naam op de
rekening en BIC worden eruit gestript.

## Herinneringen als de klant het overslaat

Kiest de klant voor *"Doe ik later"*, of sluit hij het tabblad? Dan sturen
we automatisch:

- **Direct na akkoord**: een bevestigingsmail met de vraag om de incasso af te ronden
- **Na 3 dagen**: een vriendelijke herinnering
- **Na 10 dagen**: een laatste waarschuwing, met de melding dat er zonder
  incasso geen service geleverd kan worden

Daarna stopt het automatische traject. Vanaf dat moment is het aan jou om
te bellen.

## Incasseren

Zodra het mandaat actief is, kun je op de klantpagina op **Stuur factuur**
klikken. Wij berekenen automatisch het bedrag op basis van de geaccepteerde
modules en het gekozen termijn, en zetten de incasso klaar bij Mollie.

Zit de klant nog in een proefperiode? Dan blokkeert de knop met een uitleg —
je kunt dat overrulen als je écht wilt incasseren.

Alle afschrijvingen zie je terug onder **Betalingen** in de sidebar, met
status per transactie: betaald, onderweg, mislukt, gestorneerd.

## Wat NIET de bedoeling is

- **Incasseren zonder actief mandaat.** De knop blokkeert dat, maar voor de
  duidelijkheid: zonder mandaat is er geen machtiging en dus geen wettelijke
  grond om af te schrijven.
- **De klant om zijn IBAN vragen via mail of telefoon.** Laat 'm dat altijd
  zelf invullen in het portaal — dan heb je een digitaal ondertekend mandaat
  met tijdstempel als bewijs.

## Als incasso niet beschikbaar is

Krijgt je klant de melding *"Automatische incasso is op dit moment niet
beschikbaar"*, dan staat SEPA Direct Debit niet geactiveerd op het
Mollie-profiel. Dat is geen storing en niets wat de klant kan oplossen.

Direct Debit moet je bij Mollie apart aanvragen — je vindt het in het
Mollie-dashboard onder **Instellingen → Betaalmethodes**. Goedkeuring duurt
doorgaans een paar werkdagen.

Zolang dat niet rond is blokkeren we het afgeven van een machtiging bewust. Dat
lijkt streng, maar het alternatief is erger: Mollie maakt namelijk gewoon een
mandaat aan met status *geldig*, ook als je niet mag incasseren. Je zou dan een
map vol machtigingen opbouwen die er goed uitzien en pas bij de eerste echte
factuur allemaal tegelijk stuklopen.

Je klant kan de stap gewoon overslaan en later afronden. De herinneringsmails
lopen door.
