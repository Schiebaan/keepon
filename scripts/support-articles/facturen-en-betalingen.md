---
slug: facturen-en-betalingen
title: Facturen versturen en betalingen volgen
category: Contracten & betalingen
sort_order: 22
excerpt: Hoe je een maandbedrag incasseert, waar je alle transacties terugvindt, en wat je doet als een incasso mislukt.
---

## Een factuur versturen

Ga naar de klantpagina en klik op **Stuur factuur** in de actiebalk bovenaan.

> 📷 **Screenshot: Klantpagina met de knop Stuur factuur**

Je krijgt eerst een bevestigingsvraag. Daarna:

1. Wij berekenen het bedrag op basis van de geaccepteerde modules en het
   gekozen termijn (maand of jaar)
2. Wij zetten de incasso klaar bij Mollie met het opgeslagen SEPA-mandaat
3. Je krijgt een groene melding met het bedrag en de status
4. De transactie verschijnt onder **Betalingen**

De knop is grijs wanneer:
- De klant nog geen incasso heeft ingesteld
- De klant nog in zijn proefperiode zit (met de datum tot wanneer)

## Waar zie je alles terug

**Betalingen** in de sidebar geeft je het complete overzicht:

- **Bovenaan drie tegels**: totaal betaald, onderweg, mislukt
- **Filters**: alle / betaald / open / mislukt
- **Zoeken** op Mollie-ID of omschrijving
- **Per regel**: klant (klikbaar naar de klantpagina), bedrag, status, periode,
  aanmaakdatum en het Mollie-transactienummer

> 📷 **Screenshot: Betalingen-overzicht met de totalen-tegels**

## Wat de statussen betekenen

| Status | Wat het betekent | Wat je doet |
|---|---|---|
| **Onderweg** | Mollie heeft de opdracht, de bank verwerkt 'm | Niets, wachten |
| **Betaald** | Geld is binnen | Niets |
| **Mislukt** | Bank weigerde — meestal saldo of geblokkeerde rekening | Klant bellen |
| **Verlopen** | Opdracht is verlopen zonder resultaat | Opnieuw proberen |
| **Storno** | Klant heeft de afschrijving teruggeboekt | Klant bellen, direct |

Bij SEPA-incasso heeft een consument **acht weken** het recht om zonder opgaaf
van reden te storneren. Daarna nog dertien maanden bij een onterechte
afschrijving. Houd daar rekening mee in je administratie.

## Wat de klant ziet

Je klant heeft een eigen **Facturen**-pagina in zijn portaal met dezelfde
transacties, in klanttaal:

- Status als *"Betaald"*, *"In behandeling"* of *"Mislukt"*
- Bedrag, periode, datum van afschrijving
- Een banner bovenaan als zijn incasso nog niet actief is

## Nu nog handmatig

Op dit moment moet je elke maand zelf op **Stuur factuur** klikken, per klant.
Voor twee klanten prima; voor dertig een crime. Automatische maandelijkse
facturatie staat op de planning — een dagelijkse taak die per klant kijkt of
er een nieuwe periode is begonnen en dan zelf de incasso klaarzet.

Tot die tijd: zet een terugkerende afspraak in je agenda voor de eerste van de
maand.

## Wat NIET de bedoeling is

- **Twee keer op Stuur factuur klikken in dezelfde maand.** Het systeem
  controleert dat nog niet automatisch, dus je klant krijgt dan écht twee
  afschrijvingen. Check bij twijfel eerst het Betalingen-overzicht.
- **Een mislukte incasso negeren.** Mollie probeert niet automatisch opnieuw.
  Bel de klant, los de oorzaak op, en klik dan opnieuw op Stuur factuur.
