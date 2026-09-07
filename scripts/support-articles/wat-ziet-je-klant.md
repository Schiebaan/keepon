---
slug: wat-ziet-je-klant
title: Wat ziet je klant? — de onboarding van hun kant
category: Klanten
sort_order: 11
excerpt: Van welkomstmail tot actief portaal. Handig om te weten wanneer een klant belt met "ik snap het niet" — dan weet je precies op welk scherm hij vastzit.
---

Je hebt op **Verstuur uitnodiging** geklikt. Wat gebeurt er nu aan de andere
kant? Deze route doorloopt je klant.

## 1. De welkomstmail

De klant krijgt een mail met **jouw** logo, **jouw** bedrijfsnaam en **jouw**
kleuren. Afzender is `noreply@upsol.nl`, maar de naam die je klant ziet is die
van jouw bedrijf.

In die mail zit één knop. Die bevat een persoonlijke link die **30 dagen**
geldig blijft. Klikt de klant na 31 dagen? Dan komt hij op een pagina die
zegt dat de link verlopen is, met de mogelijkheid om een nieuwe aan te vragen.

## 2. Het voorstel (`/welkom/voorstel`)

De klant ziet welke modules jij hebt aangevinkt, met de prijs per maand.
Als je een jaarkorting hebt ingesteld ziet hij twee grote knoppen naast
elkaar: *"Per maand € X"* en *"Per jaar € Y (Bespaar € Z)"*. Hij kiest zelf.

> 📷 **Screenshot: /welkom/voorstel met de twee termijn-knoppen**

Heb je een proefperiode ingesteld? Dan staat er een groene melding:
*"Eerste 3 maanden gratis na het instellen van de incasso."*

De klant vinkt de servicevoorwaarden aan en klikt op **Activeer mijn service**.
Vanaf dat moment staat het akkoord vast — inclusief tijdstip, IP-adres en de
gekozen modules in ons audit-log. Dat is je juridische onderbouwing.

## 3. De incasso (`/welkom/incasso`)

Direct na het akkoord vraagt het portaal om een IBAN en de tenaamstelling.
Wij maken daarmee een SEPA-mandaat aan bij Mollie. Zie *Hoe incasso werkt*
voor de details.

Er staat ook een knop **"Doe ik later"**. Klikt de klant daarop, dan is het
contract gewoon geldig maar kun jij nog niet incasseren. Wij sturen dan
automatisch een herinnering na 3 dagen en een laatste na 10 dagen.

## 4. Het portaal

Daarna is de klant binnen. Wat hij ziet:

- **Mijn Huis** — dashboard met de modules die hij heeft
- **Zonnepanelen / Warmtepomp / Laadpaal** — per module een pagina met live
  data, mits jij de monitoring hebt gekoppeld
- **Service** — vragen stellen, tickets bekijken
- **Contracten** — zijn servicecontract, termijn, en incasso-status
- **Facturen** — alle afschrijvingen met status

## Waar klanten in de praktijk vastlopen

Uit de cijfers blijkt dat de meeste klanten stoppen tussen stap 2 en 3: ze
geven wel akkoord, maar sluiten daarna het tabblad zonder hun IBAN in te
vullen. Die klant heeft dan wél een contract maar jij kunt níet incasseren.

Wat helpt:
- De automatische herinneringen (dag 3 en dag 10) doen hun werk, maar niet
  bij iedereen
- Op het dashboard en de contracten-pagina staat een rode banner *"Incasso
  nog instellen"* met een directe knop
- Bel gerust zelf na twee weken — dat is nog steeds het effectiefst

## Zelf meekijken

Op de klantpagina in je admin staat de knop **Klantportaal openen**. Die
opent een nieuw tabblad met een inloglink van díe klant, zodat je precies
ziet wat hij ziet. Doe dit in een incognitovenster, anders raak je zelf
uitgelogd uit je admin.
