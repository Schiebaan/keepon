Welkom bij UPsol. In deze handleiding lopen we samen door hoe UPsol werkt en
wat je moet doen om je eerste klant online te krijgen. Neem er de tijd voor —
de eerste keer duurt het misschien vijftien minuten, daarna zit het in je
vingers en gaat het minutenwerk.

## Waarom UPsol bestaat

Als installateur lever je zonnepanelen, warmtepompen en laadpalen. Die
apparaten hebben elk hun eigen app: Sundata, Weheat, Easee. Voor jou is dat
te doen, voor je klant is dat een chaos. Vier accounts, vier logins, vier
verschillende plekken waar iets kapot kan zijn.

UPsol geeft je klant **één portaal**, met **jouw merk**, waar alles bij
elkaar komt: verbruik, storingen, meldingen, contract en facturen. Voor
jou is er een admin-portaal aan de achterkant waar je klanten beheert,
tickets afhandelt en betalingen ziet lopen.

Onder de motorkap:

- Wij tonen alleen data — de leveranciers (Weheat, Sundata, Easee) blijven
  de bron. Als hun API iets zegt, zeggen wij het ook. Zo blijft de data
  betrouwbaar en hoef jij niks synchroon te houden.
- De klant tekent bij ons een servicecontract dat **jij** hebt opgesteld.
  Wij regelen de incasso via Mollie, jij krijgt maandelijks je omzet
  overgemaakt.
- Alle communicatie loopt via het portaal (welkomstmails, ticket-updates,
  betalingsherinneringen). Jij en je klant hoeven geen losse e-mails meer
  bij te houden.

## Voordat je begint: zet je merk in

Voordat je iemand uitnodigt, wil je dat het portaal er als **jouw** portaal
uitziet. Anders wordt de klant verrast door een generieke UPsol-look.

Ga rechtsboven naar **Instellingen**. Je komt op een pagina met een linker
en rechter kolom. In de linkerkolom vind je:

> 📷 **Screenshot: Instellingenpagina — Branding-sectie**
> *(vervang deze regel door een echte screenshot via de "Screenshot invoegen"
> knop hierboven — kies bij voorkeur een crop waar het logo-upload-blok
> zichtbaar is)*

- **Partnerinformatie** — je bedrijfsnaam, e-mail, telefoon. Deze
  gegevens komen in mails onderaan en in de contact-sectie van het portaal
  te staan.
- **Branding** — je primaire kleur. Deze wordt gebruikt voor knoppen,
  koppen en accenten in het klantportaal. Kies iets dat past bij je huisstijl,
  liefst niet te licht (het moet leesbaar zijn op wit).
- **Logo** — upload een PNG of SVG. Snij witruimte weg voor je uploadt,
  anders lijkt je logo klein in de header. De tip-tekst onder het upload-veld
  legt uit welk formaat het beste werkt.

In de rechterkolom check je nog even:

- **Module prijzen** — voor elke module (zonnepanelen, warmtepomp, laadpaal)
  vul je het maandbedrag in dat jij als servicecontract wilt aanhouden.
  Klanten kunnen bij het uitnodigen een afwijkend tarief krijgen, maar dit
  is je default.
- **Monitoring integraties** — koppel Sundata, Weheat en Easee als je
  klanten met die apparaten hebt. Zonder koppeling zien klanten geen
  live data.

Zodra dit staat is je portaal klaar om z'n eerste bezoeker te ontvangen.

## Je eerste klant aanmelden — stap voor stap

Neem een echte klant in gedachten. Ik gebruik hieronder als voorbeeld
"Jan Jansen" met een zonnepanelen-installatie.

### 1. Naar het uitnodigingen-scherm

Klik in de sidebar op **Uitnodigingen**. Je ziet een overzicht van
klanten die nog geen akkoord hebben gegeven — nu waarschijnlijk leeg.

Rechtsboven zie je twee knoppen:

> 📷 **Screenshot: Uitnodigingen-pagina met de twee knoppen rechtsboven**
> *(Maak mailing-batch + Klant uitnodigen)*

- **Maak mailing-batch** — voor als je veel klanten tegelijk wilt
  uitnodigen via een Mailchimp-export. Skip dit voor je eerste klant.
- **Klant uitnodigen** — dit is wat je nu gebruikt.

### 2. De klant-uitnodigen-modal invullen

Er springt een modal open. Vul in:

- **Naam** — de volledige naam ("Jan Jansen"). Deze naam komt in mails
  te staan en op de klantpagina.
- **E-mail** — waar de welkomstmail heen gaat. **Zorg dat dit klopt** —
  bij een typo krijgt de klant nooit een uitnodiging.
- **Telefoon** en **adres** — optioneel, maar handig voor als je later
  belt of langs moet.

> 📷 **Screenshot: Klant-uitnodigen-modal, formulier ingevuld**

Scroll iets naar beneden. Je ziet drie module-tegels: **Zonnepanelen**,
**Warmtepomp**, **Laadpaal**. Klik op de module(s) die deze klant heeft.
Voor Jan klikken we alleen op Zonnepanelen — die kleurt op als aangevinkt.

> 📷 **Screenshot: Modules-sectie, Zonnepanelen aangevinkt**

**Belangrijk**: je moet minstens één module kiezen. Als je niks aanklikt
blijft de "Verstuur uitnodiging"-knop grijs. Reden: zonder module heeft de
klant niks te activeren in het portaal — dan is de welkomstmail een dood
spoor.

Wil je afwijkende voorwaarden voor deze klant? Klap dan **Speciale
voorwaarden** open:

- **Standaard termijn** (per maand / per jaar) — de klant kan dit later
  nog wisselen.
- **Korting bij jaarbetaling** — bv. 1 = klant betaalt bij jaartermijn
  11 maanden i.p.v. 12.
- **Proefperiode** — hoeveel maanden gratis vanaf mandaat-activatie.
- **Afwijkend tarief per module** — override op je standaard-prijs uit
  Instellingen, met optioneel een reden voor je eigen administratie.

Voor een eerste testklant laat je deze sectie dicht — dan gebruikt UPsol
je standaardtarieven.

### 3. Verstuur uitnodiging

Klik onderin op **Verstuur uitnodiging**. Er gebeurt drie dingen tegelijk:

1. UPsol maakt de klant aan in de database.
2. Er wordt een welkomstmail verstuurd naar het opgegeven adres.
3. De klant verschijnt in je uitnodigingen-overzicht met status *"Gemaild
   zojuist"*.

> 📷 **Screenshot: Bevestiging na uitnodigen — "Jan Jansen is uitgenodigd!"**

### 4. Check dat de mail is verstuurd

Klik in de uitnodigingen-lijst op Jan's rij. Je komt op zijn klantpagina.
Ga naar het tabblad **E-mails**.

> 📷 **Screenshot: Klantdetail-pagina, tabblad E-mails geopend**

Hier zie je live wat we naar deze klant gestuurd hebben. Een groen vinkje
betekent dat Resend (onze mailprovider) de mail heeft geaccepteerd — geen
garantie op aflevering, wel geen technisch probleem aan onze kant. Als je
klant niks in de inbox ziet, is de eerste vraag altijd: *"Check je
spamfolder."*

## Wat gebeurt er nu aan de klant-kant

De klant krijgt een mail met de naam en het logo van jouw bedrijf. In die
mail zit een knop *"Activeer je portaal"* die 30 dagen geldig blijft. Als
ze klikken:

1. Ze komen op /welkom/voorstel — een pagina waar ze zien welke modules
   ze krijgen, tegen welke prijs, en welke termijn (maand of jaar).
2. Ze vinken de servicevoorwaarden aan en klikken **Ik ga akkoord**.
3. Direct daarna komt /welkom/incasso — hier vullen ze hun IBAN in.
   Onder de motorkap maken we een SEPA-mandaat aan bij Mollie zodat we
   het maandbedrag kunnen incasseren.
4. Ze komen op hun portaal en zien de modules die jij hebt aangevinkt.

Als ze bij stap 3 op *"Doe ik later"* klikken, sturen we automatisch een
herinnering na 3 dagen en een laatste na 10 dagen. Na dag 10 mag je zelf
bellen of langs — daar zijn wij niet meer.

## Wat NIET de bedoeling is

- **Klanten zonder modules aanmaken** — de UI blokkeert dit sinds kort,
  maar via oude scripts of curl-calls kan het theoretisch nog. Doe het
  niet. Zonder module heeft de klant niks in het portaal.
- **Klanten zelf modules laten kiezen in het portaal** — dat leidt tot
  chaos ("ik heb ook een laadpaal van AutoElectric van 3 jaar geleden…"
  → nee dank je). Jij als installateur weet wat er ligt.
- **Reageren op ticket-mails vanuit je eigen mailbox** — die worden
  **niet** automatisch in het ticket opgenomen. De notificatiemail zegt
  dat ook expliciet. Klik altijd op "Open je ticket en reageer" — dan
  loopt de conversatie netjes via het portaal.

## Waar vind ik wat in het admin-portaal?

- **Dashboard** — één-scherms-overzicht van je hele bedrijf.
- **Klanten** — alle actieve klanten (die akkoord hebben gegeven).
- **Uitnodigingen** — klanten die nog geen akkoord hebben gegeven +
  bulk-uitnodigen via Mailchimp-export.
- **Betalingen** — alle Mollie-transacties met status, filter op periode.
- **Service** — tickets, met filter op status en labels.
- **Communicatie** — mail-templates aanpassen (welkomstmail, ticket-reacties).
- **Gebruikers** — extra collega's toegang geven tot dit admin-portaal.
- **Instellingen** — branding, tarieven, ticket-labels, servicevoorwaarden.

## Als er iets niet werkt

- Check eerst de **E-mails**-tab van de klant — is de mail wel verzonden?
- Check daarna in je eigen mail (afzender: noreply@upsol.nl) of er
  bounce-meldingen zijn.
- Werkt monitoring niet? Ga naar Instellingen → **Monitoring integraties**
  en check of de koppeling groen staat. Zo niet: opnieuw verbinden.
- Nog steeds vast? Mail info@upsol.nl met de klantnaam en een korte
  beschrijving. Dan pak ik het op.

Veel succes met je eerste klant. Zodra Jan Jansen z'n IBAN heeft afgegeven,
loopt de rest vanzelf.
