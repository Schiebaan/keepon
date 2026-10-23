const TUSSENVOEGSELS = /* @__PURE__ */ new Set([
  "de",
  "den",
  "der",
  "van",
  "von",
  "het",
  "'t",
  "t",
  "ter",
  "te",
  "ten",
  "in",
  "op",
  "aan",
  "v.",
  "v.d.",
  "vd",
  "d'",
  "la",
  "le",
  "du",
  "da",
  "di"
]);
function isVoorletter(w) {
  return /^([A-Za-zÀ-ÿ]\.)+$/.test(w);
}
function hoofdletter(w) {
  return w ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}
function aanspreeknaam(volledigeNaam) {
  let naam = (volledigeNaam || "").trim().replace(/\s+/g, " ");
  if (!naam || naam.includes("@")) return null;
  let familie = false;
  const zonderFamilie = naam.replace(/^(familie|fam\.?)\s+/i, () => {
    familie = true;
    return "";
  }).replace(/\s+(familie|fam\.?)$/i, () => {
    familie = true;
    return "";
  }).trim();
  naam = zonderFamilie || naam;
  if (/\d/.test(naam)) return null;
  const woorden = naam.split(" ");
  const eerste = woorden[0];
  const geenVoornaam = familie || woorden.length === 1 || TUSSENVOEGSELS.has(eerste.toLowerCase()) || isVoorletter(eerste);
  if (geenVoornaam) {
    const achternaam = woorden.filter((w) => !isVoorletter(w));
    if (!achternaam.length) return null;
    achternaam[0] = hoofdletter(achternaam[0]);
    return `familie ${achternaam.join(" ")}`;
  }
  return hoofdletter(eerste).replace(/\s*&\s*/g, " en ");
}
function groet(volledigeNaam, woord = "Hoi") {
  const naam = aanspreeknaam(volledigeNaam);
  return naam ? `${woord} ${naam}` : "Hallo";
}

export { aanspreeknaam as a, groet as g };
//# sourceMappingURL=aanhef.mjs.map
