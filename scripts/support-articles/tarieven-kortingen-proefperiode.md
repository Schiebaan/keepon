---
slug: tarieven-kortingen-proefperiode
title: Tarieven, kortingen en proefperiodes
category: Contracten & betalingen
sort_order: 21
excerpt: Standaardtarief per module, jaarkorting, gratis proefperiode en afwijkende prijzen per klant. Wat kan waar, en hoe werken ze samen?
---

Er zijn vier knoppen waarmee je aan de prijs kunt draaien. Ze stapelen op
elkaar, dus het loont om te weten welke wat doet.

## 1. Standaardtarief per module (Instellingen)

Ga naar **Instellingen → Module prijzen**. Per module vul je in wat het
servicecontract per maand kost. Dit geldt voor élke klant die je vanaf dat
moment uitnodigt.

> 📷 **Screenshot: Instellingen → Module prijzen**

Let op: wijzig je hier later het tarief, dan geldt dat alleen voor nieuwe
klanten. Bestaande contracten houden de prijs die gold toen ze akkoord gaven.
Dat is bewust — je wilt niet dat een klant volgende maand ineens meer betaalt
zonder dat hij daarvoor getekend heeft.

## 2. Jaarbetaling met korting

Bied je klanten de keuze tussen maandelijks en jaarlijks? Vul dan bij het
uitnodigen (onder **Speciale voorwaarden**) in hoeveel maanden korting je
geeft.

- `1` = de klant betaalt 11 maanden in plaats van 12
- `2` = 10 maanden in plaats van 12
- `0` of leeg = geen jaaroptie, klant ziet alleen het maandbedrag

De klant kiest zelf op de akkoordpagina welke termijn hij wil. Als er korting
is, ziet hij twee knoppen met daarbij hoeveel hij bespaart.

## 3. Proefperiode

Wil je een klant de eerste maanden gratis geven? Vul bij **Speciale
voorwaarden** het aantal maanden in.

De proefperiode start **op het moment dat de klant zijn IBAN afgeeft**, niet
bij het akkoord. Dat is bewust: anders kan iemand akkoord geven, nooit een
mandaat afgeven, en toch drie maanden gratis service krijgen.

Zolang de proefperiode loopt:
- De klant ziet op zijn contracten-pagina een groene banner met de datum van
  de eerste afschrijving
- De **Stuur factuur**-knop in je admin blokkeert, met de uitleg tot wanneer
  de proefperiode loopt

## 4. Afwijkend tarief per module, per klant

Krijgt een specifieke klant korting? Bij **Speciale voorwaarden** kun je per
module een ander bedrag invullen, met optioneel een interne reden
("buurman-korting", "actie zomer 2026"). Die reden is alleen voor jou
zichtbaar, niet voor de klant.

De klant ziet in zijn portaal wel een klein label *"Persoonlijk tarief"* naast
die module — zonder te tonen wat het standaardtarief was. Dat is een
verkoopgesprek, geen portaal-informatie.

## Achteraf wijzigen

Alle bovenstaande instellingen kun je ook ná het uitnodigen aanpassen. Ga naar
de klantpagina en zoek de kaart **Tarief**. Daar zie je de actuele situatie
(termijn, totaalbedrag per maand én per jaar, proefperiode-status, prijs per
module) en een knop **Aanpassen**.

> 📷 **Screenshot: Klantpagina, kaart Tarief in de weergavemodus**

## Hoe het bedrag wordt berekend

Bij het incasseren rekent het systeem als volgt:

```
per module:  afwijkend tarief (indien gezet)  óf  standaardtarief partner
maandtotaal: som van alle geaccepteerde modules

bij maandtermijn:  maandtotaal
bij jaartermijn:   maandtotaal × (12 − kortingsmaanden)

loopt de proefperiode nog?  → geen incasso
```

Deze berekening zit op één plek in de code, en zowel je admin als het
klantportaal gebruiken exact dezelfde uitkomst. Ze kunnen dus niet uit elkaar
lopen.
