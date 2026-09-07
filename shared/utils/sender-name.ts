/**
 * Hoe noemen we degene die namens de installateur reageert?
 *
 * De bedoeling is "Rik van Volt4U": persoonlijker dan alleen een bedrijfsnaam.
 * Maar veel installateurs werken vanaf één gedeeld account, en dat account
 * heet dan gewoon naar het bedrijf. Zonder controle levert dat
 * "Volt4u van Volt4U" op — het account heet "Volt4u", de partner "Volt4U",
 * één hoofdletter verschil. Dat oogt slordig, en terecht.
 *
 * Dus: is de accountnaam feitelijk de bedrijfsnaam, dan laten we hem weg.
 */

/** Kleine letters, alleen letters en cijfers — zodat "Volt4u" en "Volt4U B.V." matchen. */
function normaliseer(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Geeft de persoonsnaam terug, of null als die niets toevoegt naast de
 * bedrijfsnaam. Null betekent: noem alleen het bedrijf.
 */
export function personalSenderName(
  authorName: string | null | undefined,
  partnerName: string | null | undefined,
): string | null {
  const author = (authorName || '').trim()
  if (!author) return null

  const a = normaliseer(author)
  const p = normaliseer(partnerName || '')
  if (!a) return null
  if (!p) return author

  // Identiek, of de een zit in de ander ("Volt4U" in "Volt4U Support").
  if (a === p || a.includes(p) || p.includes(a)) return null

  // Generieke postbusnamen zeggen ook niets over wie er antwoordde.
  const generiek = ['info', 'support', 'service', 'admin', 'contact', 'helpdesk', 'noreply', 'team']
  if (generiek.includes(a)) return null

  return author
}

/** "Rik van Volt4U" of, als de naam niets toevoegt, "Volt4U". */
export function senderLabel(
  authorName: string | null | undefined,
  partnerName: string | null | undefined,
): string {
  const partner = (partnerName || '').trim() || 'je installateur'
  const person = personalSenderName(authorName, partnerName)
  return person ? `${person} van ${partner}` : partner
}
