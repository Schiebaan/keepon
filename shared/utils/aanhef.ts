/**
 * Hoe spreken we een klant aan in mails en in het portaal?
 *
 * Voorheen was dat simpelweg het eerste woord van de naam. Dat gaat goed bij
 * "Jan van der Horst", maar installateurs voeren vaak alleen een achternaam in.
 * Dan kreeg de klant "Hoi de," (de Graaf), "Hoi van," (van der Maarel),
 * "Hoi B.," (B. van Leeuwen) of "Hoi Adriaans," — een achternaam als voornaam.
 *
 * Regels:
 *   - staat er een herkenbare voornaam vooraan  → die voornaam
 *   - alleen een achternaam, of beginnend met een tussenvoegsel of voorletter
 *                                              → "familie De Graaf"
 *   - cijfers in de naam (bedrijf of adres ingevuld als naam) → geen naam
 */

const TUSSENVOEGSELS = new Set([
  'de', 'den', 'der', 'van', 'von', 'het', "'t", 't', 'ter', 'te', 'ten',
  'in', 'op', 'aan', 'v.', 'v.d.', 'vd', "d'", 'la', 'le', 'du', 'da', 'di',
])

function isVoorletter(w: string): boolean {
  // "B." of "A.B." of "J.P.M."
  return /^([A-Za-zÀ-ÿ]\.)+$/.test(w)
}

function hoofdletter(w: string): string {
  return w ? w.charAt(0).toUpperCase() + w.slice(1) : w
}

/** "Jan", "familie De Graaf", of null als er geen bruikbare naam is. */
export function aanspreeknaam(volledigeNaam: string | null | undefined): string | null {
  let naam = (volledigeNaam || '').trim().replace(/\s+/g, ' ')
  if (!naam || naam.includes('@')) return null

  // "Hofstede Familie", "Fam. Jansen", "familie de Vries"
  let familie = false
  const zonderFamilie = naam
    .replace(/^(familie|fam\.?)\s+/i, () => { familie = true; return '' })
    .replace(/\s+(familie|fam\.?)$/i, () => { familie = true; return '' })
    .trim()
  naam = zonderFamilie || naam

  // Bedrijfsnaam of adres als naam ingevuld ("volt4u", "Remus 106")
  if (/\d/.test(naam)) return null

  const woorden = naam.split(' ')
  const eerste = woorden[0]
  const geenVoornaam =
    familie
    || woorden.length === 1
    || TUSSENVOEGSELS.has(eerste.toLowerCase())
    || isVoorletter(eerste)

  if (geenVoornaam) {
    // Voorletters weglaten; de achternaam begint met een hoofdletter omdat er
    // geen voornaam voor staat: "familie De Graaf", "familie Van der Maarel".
    const achternaam = woorden.filter(w => !isVoorletter(w))
    if (!achternaam.length) return null
    achternaam[0] = hoofdletter(achternaam[0])
    return `familie ${achternaam.join(' ')}`
  }

  // "Olaf&Esther" → "Olaf en Esther"
  return hoofdletter(eerste).replace(/\s*&\s*/g, ' en ')
}

/** "Hoi Jan", "Hoi familie De Graaf", of alleen "Hallo" zonder bruikbare naam. */
export function groet(volledigeNaam: string | null | undefined, woord = 'Hoi'): string {
  const naam = aanspreeknaam(volledigeNaam)
  return naam ? `${woord} ${naam}` : 'Hallo'
}
