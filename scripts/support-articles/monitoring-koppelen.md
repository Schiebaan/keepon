---
slug: monitoring-koppelen
title: Monitoring koppelen — Sundata, Weheat en Easee
category: Koppelingen
sort_order: 40
excerpt: Zonder koppeling ziet je klant een leeg kaartje. Zo verbind je per leverancier je installateursaccount, en zo koppel je een apparaat aan de juiste klant.
---

Het portaal toont live data van de installaties van je klant. Daarvoor moeten
twee dingen kloppen: je **account-koppeling** per leverancier, en de
**apparaat-koppeling** per klant.

## Stap 1: je account koppelen (eenmalig)

Ga naar **Instellingen → Monitoring integraties**. Per leverancier zie je of
de koppeling actief is.

> 📷 **Screenshot: Instellingen → Monitoring integraties**

### Sundata (zonnepanelen)
Vul je Sundata-installateursaccount in. Wij gebruiken dat om de plants en
meters van je klanten uit te lezen.

### Weheat (warmtepompen)
Klik op **Verbinden via Weheat**. Je wordt doorgestuurd naar Weheat om in te
loggen, en komt daarna terug. Wij bewaren een token waarmee we periodiek de
status van je warmtepompen ophalen.

Let op: Weheat's tokens verlopen relatief snel. Wij verlengen ze automatisch,
maar zie je ooit de melding *"Weheat-verbinding verlopen"*, klik dan hier
opnieuw op verbinden.

### Easee (laadpalen)
Vul je Easee-accountgegevens in — hetzelfde account waarmee je in de Easee-app
inlogt.

## Stap 2: een apparaat aan een klant koppelen

De account-koppeling geeft ons toegang tot **al** je apparaten. Vervolgens moet
per klant duidelijk zijn wélk apparaat van hem is.

Ga naar de klantpagina, tabblad **Producten**. Bij elke module staat een knop
om te koppelen.

> 📷 **Screenshot: Klantpagina, tabblad Producten met koppelknoppen**

- **Zonnepanelen** → opent de Sundata-wizard. Je zoekt de installatie op naam
  of adres en bevestigt.
- **Warmtepomp** → opent de Weheat-wizard. Je kiest de warmtepomp uit de lijst,
  herkenbaar aan het serienummer.
- **Laadpaal** → opent de Easee-wizard. Je kiest de laadpaal uit de lijst,
  herkenbaar aan het laadpaal-ID. Heeft de laadpaal in Easee geen naam
  gekregen, dan tonen we het ID — dat is uniek per paal.

Zodra gekoppeld verschijnt er een groen label *"Gekoppeld"* bij het product,
en ziet je klant vanaf dat moment live data in zijn portaal.

## Wat de klant ziet na koppeling

- **Zonnepanelen** — opbrengst vandaag, deze maand, dit jaar, plus een grafiek
- **Warmtepomp** — temperaturen, verbruik, status
- **Laadpaal** — laadsessies, verbruik per maand, of er nu geladen wordt

Zonder koppeling ziet de klant het modulekaartje wél, maar zonder cijfers.

## Waar het in de praktijk misgaat

**"De leverancier toont wel apparaten die ik hier niet zie."**
Wij tonen exact wat de API van de leverancier ons geeft. Zie je in de Easee-
of Weheat-portal meer apparaten dan bij ons? Dan zijn die niet aan jouw
API-account gekoppeld, maar bijvoorbeeld aan een collega-account. Dat los je
bij de leverancier op, niet bij ons.

**"Ik zie geen klantgegevens bij de apparaten."**
Klopt. Leveranciers geven via hun API alleen apparaatgegevens (serienummer,
model, installatiedatum) — geen namen of adressen van eindklanten. Dat is hun
privacybeleid. Je moet dus zelf weten welk serienummer bij welke klant hoort,
bijvoorbeeld via je projectadministratie.

**"De data loopt achter."**
Wij halen periodiek op, niet continu. Verwacht een vertraging van maximaal een
uur. Zonnepaneel-opbrengst van vandaag komt bij de meeste systemen pas 's
avonds binnen — dat is de leverancier, niet ons.
