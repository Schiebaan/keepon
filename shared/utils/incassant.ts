/**
 * De partij die de incasso uitvoert en op het bankafschrift van de klant staat.
 *
 * Het Mollie-account staat op naam van Sundata B.V.; UPsol B.V. bestaat (nog)
 * niet. De klant moet op het incassoscherm en in het voorstel dezelfde naam
 * lezen als die straks op zijn afschrift staat. Een naam die hij nergens
 * herkent is de snelste weg naar een terugboeking.
 *
 * Gaat de incasso later via een ander Mollie-profiel, verander het dan hier —
 * en controleer de servicevoorwaarden en de partnerovereenkomst mee.
 */
export const INCASSANT = 'Sundata B.V.'
