import { c as createError, g as getServiceRoleClient, d as defineEventHandler, r as readBody } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
import { s as sundataSession, S as SUNDATA_BASE_URL } from '../../../_/sundata.mjs';
import Anthropic from '@anthropic-ai/sdk';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@supabase/functions-js';
import '@supabase/postgrest-js';
import '@supabase/realtime-js';
import '@supabase/storage-js';
import '@supabase/auth-js';
import '../../../_/connectors.mjs';

let _client = null;
function isAiAvailable() {
  return !!process.env.ANTHROPIC_API_KEY;
}
function getAnthropic() {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw createError({ statusCode: 503, message: "ANTHROPIC_API_KEY ontbreekt" });
    _client = new Anthropic({ apiKey });
  }
  return _client;
}
const AI_MODEL = "claude-haiku-4-5-20251001";
const AI_MAX_TOKENS = 1024;

const MODULE_ALIASES = {
  solar: "solar_panel",
  solar_panel: "solar_panel",
  zonnepanelen: "solar_panel",
  heat_pump: "heat_pump",
  warmtepomp: "heat_pump",
  ev_charger: "ev_charger",
  laadpaal: "ev_charger",
  battery: "battery",
  thuisbatterij: "battery"
};
function normalizeModule(m) {
  if (!m) return null;
  return MODULE_ALIASES[m.toLowerCase()] || null;
}
async function getCustomerProducts(event, customerId) {
  const supabase = getServiceRoleClient();
  const { data } = await supabase.from("customer_products").select("category, name, brand, model, integration_type, external_id, serial_number").eq("customer_id", customerId);
  return (data || []).map((p) => {
    const legacy = (p.serial_number || "").includes(":");
    const linked = !!p.integration_type || legacy;
    return {
      category: p.category,
      name: p.name,
      brand: p.brand,
      model: p.model,
      linked,
      linked_via: p.integration_type || (legacy ? String(p.serial_number).split(":")[0] : null)
    };
  });
}
async function getKbArticles(event, moduleType) {
  const supabase = getServiceRoleClient();
  let q = supabase.from("support_articles").select("slug, title, body_md, module_type").eq("audience", "customer").not("published_at", "is", null);
  if (moduleType) q = q.or(`module_type.eq.${moduleType},module_type.is.null`);
  const { data, error } = await q.order("sort_order", { ascending: true }).limit(12);
  if (error) {
    console.error("[ai-context] kennisbank niet beschikbaar:", error.message);
    return [];
  }
  return (data || []).map((a) => ({ slug: a.slug, title: a.title, body_md: a.body_md }));
}
async function getPastTickets(event, partnerId, moduleType, excludeCustomerId) {
  const supabase = getServiceRoleClient();
  let q = supabase.from("service_tickets").select("subject, description, response, module_type, status").eq("partner_id", partnerId).in("status", ["opgelost", "gesloten"]).not("response", "is", null).neq("customer_id", excludeCustomerId);
  if (moduleType) q = q.eq("module_type", moduleType);
  const { data } = await q.order("updated_at", { ascending: false }).limit(5);
  return (data || []).map((t) => ({
    subject: t.subject,
    description: t.description,
    resolution: t.response
  }));
}
function renderContext(ctx, live) {
  const delen = [];
  if (ctx.products.length) {
    delen.push(
      "## Producten van deze klant\n" + ctx.products.map(
        (p) => `- ${p.name || p.category}${p.brand ? ` (${p.brand}${p.model ? " " + p.model : ""})` : ""} \u2014 ${p.linked ? `gekoppeld via ${p.linked_via}` : "NIET gekoppeld, geen meetgegevens beschikbaar"}`
      ).join("\n")
    );
  } else {
    delen.push("## Producten van deze klant\nGeen producten geregistreerd.");
  }
  if (live.length) {
    delen.push("## Actuele meetgegevens\n" + live.map((d) => `- ${d.label}: ${d.value}`).join("\n"));
  }
  if (ctx.articles.length) {
    delen.push(
      "## Kennisbank\n" + ctx.articles.map((a) => `### ${a.title}
${a.body_md}`).join("\n\n")
    );
  }
  if (ctx.pastTickets.length) {
    delen.push(
      "## Hoe vergelijkbare klachten eerder zijn opgelost\nDit zijn geanonimiseerde eerdere meldingen bij dezelfde installateur. Gebruik ze als richting voor je vervolgvragen, niet als zekerheid over dit geval.\n\n" + ctx.pastTickets.map(
        (t) => `- Klacht: ${t.subject}${t.description ? ` \u2014 ${t.description.slice(0, 200)}` : ""}
  Oplossing: ${(t.resolution || "").slice(0, 300)}`
      ).join("\n")
    );
  }
  return delen.join("\n\n");
}

function matchesAny(text, keywords) {
  return keywords.some((kw) => text.includes(kw));
}
function formatKwh(wh) {
  if (wh === void 0 || wh === null) return "\u2014";
  const v = wh / 1e3;
  if (v >= 100) return `${v.toFixed(0)} kWh`;
  return `${v.toFixed(1)} kWh`;
}
async function fetchSolarContext(event, customerId, partnerId) {
  const supabase = getServiceRoleClient();
  const { data: products } = await supabase.from("customer_products").select("serial_number").eq("customer_id", customerId).eq("category", "solar_panel").order("created_at", { ascending: false });
  const link = (products || []).map((p) => p.serial_number || "").find((s) => s.startsWith("sundata:"));
  if (!link) return null;
  const [companyId, plantId, meterId] = link.slice("sundata:".length).split("/").map(Number);
  if (!companyId || !plantId || !meterId) return null;
  try {
    const { headers } = await sundataSession(event, partnerId);
    const now = /* @__PURE__ */ new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const today = `${yyyy}-${mm}-${dd}`;
    const monthStart = `${yyyy}-${mm}-01`;
    const [meter, monthData] = await Promise.all([
      $fetch(`${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}/meters/${meterId}`, { headers }).catch(() => null),
      $fetch(
        `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}/yield?start_date=${monthStart}&end_date=${today}&period_type=day&yield_type=actual-yield`,
        { headers }
      ).catch(() => null)
    ]);
    const days = (monthData == null ? void 0 : monthData.data) || [];
    const todayEntry = days.find((d) => (d.time || "").startsWith(today));
    const monthSum = days.reduce((s, d) => s + (d.yield_in_wh || 0), 0);
    const metOpbrengst = days.filter((d) => (d.yield_in_wh || 0) > 0);
    const laatsteProductie = metOpbrengst.length ? metOpbrengst[metOpbrengst.length - 1].time : null;
    return {
      peakInWatt: meter == null ? void 0 : meter.peak_in_watt,
      operationalSince: meter == null ? void 0 : meter.operational_since,
      todayWh: (todayEntry == null ? void 0 : todayEntry.yield_in_wh) || 0,
      monthWh: monthSum,
      hasData: metOpbrengst.length > 0,
      laatsteProductie
    };
  } catch {
    return null;
  }
}
function ruleBasedReply(msg, partnerName, solarCtx, hintedModule) {
  const basis = { systemCheck: false, dataPoints: [], shouldEscalate: false, source: "rules" };
  if (hintedModule === "solar" || matchesAny(msg, ["opbrengst", "productie", "panelen", "zonnepaneel", "zonnepanelen", "solar", "omvormer"])) {
    if (!solarCtx) {
      return {
        ...basis,
        content: `Ik kan nog geen meetgegevens van je zonnepanelen ophalen. Je installatie is mogelijk nog niet gekoppeld. Wil je dat ik dit doorstuur naar ${partnerName}?`,
        shouldEscalate: true,
        escalateReason: "Vraag over zonnepanelen maar koppeling ontbreekt"
      };
    }
    return {
      ...basis,
      content: `Vandaag is er ${formatKwh(solarCtx.todayWh)} opgewekt, deze maand ${formatKwh(solarCtx.monthWh)}. Klopt dat niet met wat je verwacht? Dan stuur ik het door naar ${partnerName}.`,
      systemCheck: true,
      dataPoints: [
        { label: "Vandaag", value: formatKwh(solarCtx.todayWh) },
        { label: "Deze maand", value: formatKwh(solarCtx.monthWh) }
      ]
    };
  }
  if (matchesAny(msg, ["opzeggen", "stoppen", "annuleren", "be\xEBindigen"])) {
    return {
      ...basis,
      content: `Een wijziging of opzegging van je servicecontract regel ik niet zelf. Ik stuur je vraag door naar ${partnerName}.`,
      shouldEscalate: true,
      escalateReason: "Klant wil servicecontract wijzigen/opzeggen"
    };
  }
  if (matchesAny(msg, ["bedankt", "dankjewel", "top", "opgelost", "helder", "duidelijk", "geholpen"])) {
    return { ...basis, content: "Graag gedaan! Als er nog iets is, stel gerust een nieuwe vraag." };
  }
  return {
    ...basis,
    content: `Bedankt voor je bericht. Ik stuur je vraag door naar ${partnerName}. Zij reageren doorgaans binnen 1 werkdag.`,
    shouldEscalate: true,
    escalateReason: "Vraag niet automatisch te beantwoorden"
  };
}
const SYSTEEMPROMPT = `Je bent de servicemedewerker van {{PARTNER}}, een installatiebedrijf. Je helpt {{KLANT}} via de chat in hun klantportaal.

## Je opdracht

Achterhaal w\xE1t er precies aan de hand is, voordat er een monteur bij gehaald wordt. Een monteur die langskomt met "zonnepanelen kapot" moet ter plekke nog alles uitzoeken. Jij zorgt dat er in plaats daarvan staat: sinds wanneer, welk symptoom, welke foutcode, wat de klant al geprobeerd heeft.

## Hoe je dat doet

Stel **\xE9\xE9n vraag tegelijk**. Een rijtje van vier vragen leest als een formulier en dan krijg je \xE9\xE9n antwoord op de laatste.

Begin bij het symptoom, niet bij de oorzaak. "Wat zie je precies?" komt v\xF3\xF3r "is de omvormer defect?".

Vraag door tot je weet: sinds wanneer, wat de klant waarneemt (lampjes, geluid, display, foutcode), of het steeds gebeurt of af en toe, en wat er eventueel veranderd is. Meestal ben je er in twee tot vier vragen.

Gebruik de meetgegevens die je krijgt. Zie je dat er sinds dinsdag geen productie meer is, benoem dat \u2014 dan hoeft de klant het niet zelf te ontdekken. Verzin nooit metingen die je niet hebt gekregen.

**Leg nooit uit wat een specifieke foutcode betekent.** Codes verschillen per merk: een E013 betekent bij het ene merk iets heel anders dan bij het andere. Noteer de code, zeg dat de monteur eraan genoeg heeft, en vraag door op wat de klant zelf kan waarnemen. Alleen als de kennisbank die code expliciet noemt mag je uitleggen wat 'ie betekent. Hetzelfde geldt voor de oorzaak: je stelt geen diagnose, je verzamelt waarnemingen.

Staat er in de kennisbank een stap die de klant zelf kan zetten, leg die dan uit en vraag of het hielp. Veel storingen zijn een gevallen zekering of een omvormer die opnieuw opgestart moet worden.

## Wanneer je doorstuurt

Roep \`escalate_to_installer\` aan zodra je genoeg weet, \xE9n in deze gevallen meteen:
- de klant vraagt erom, of is duidelijk klaar met vragen
- er is gevaar: brandlucht, rook, water bij elektra, een hete of gezwollen batterij
- het gaat over contract, opzegging, facturen of een afspraak
- na vier vragen ben je er nog niet uit

Schrijf de \`description\` alsof je 'm aan de monteur overdraagt: symptoom, sinds wanneer, waarneming van de klant, wat al geprobeerd is, en wat de meetgegevens laten zien. Vat samen wat de klant je vertelde \u2014 verzin niets bij.

Bij gevaar: zeg eerst wat de klant nu moet doen, en escaleer met urgency 'hoog'.

## Toon

Nederlands, je-vorm, warm en kort. Geen jargon zonder uitleg: zeg "de kast waar je zonnepanelen op aangesloten zijn" in plaats van "de omvormer", tenzij de klant dat woord zelf gebruikt. Geen opsommingen van drie regels als \xE9\xE9n zin volstaat. Beloof nooit een tijdstip of een prijs.

Je bent niet van UPsol en noemt UPsol niet. Je werkt namens {{PARTNER}}.`;
const aiAssist_post = defineEventHandler(async (event) => {
  var _a;
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const body = await readBody(event);
  const history = Array.isArray(body == null ? void 0 : body.messages) ? body.messages : [];
  const message = ((body == null ? void 0 : body.message) || ((_a = history[history.length - 1]) == null ? void 0 : _a.content) || "").toString().trim();
  const hintedModule = (body == null ? void 0 : body.moduleType) || null;
  const finalize = !!(body == null ? void 0 : body.finalize);
  if (!message) throw createError({ statusCode: 400, message: "Bericht is verplicht" });
  const { data: customer } = await supabase.from("customers").select("id, partner_id, full_name").eq("auth_user_id", user.id).single();
  const { data: partner } = (customer == null ? void 0 : customer.partner_id) ? await supabase.from("partners").select("name").eq("id", customer.partner_id).single() : { data: null };
  const partnerName = (partner == null ? void 0 : partner.name) || "je installateur";
  const msg = message.toLowerCase();
  const solarCtx = customer ? await fetchSolarContext(event, customer.id, customer.partner_id) : null;
  if (!isAiAvailable() || !customer) {
    return ruleBasedReply(msg, partnerName, solarCtx, hintedModule);
  }
  const moduleType = normalizeModule(hintedModule) || (matchesAny(msg, ["paneel", "panelen", "zonne", "omvormer", "opbrengst"]) ? "solar_panel" : matchesAny(msg, ["warmtepomp", "verwarming", "radiator", "vloerverwarming"]) ? "heat_pump" : matchesAny(msg, ["laadpaal", "laden", "laadpunt", "auto"]) ? "ev_charger" : matchesAny(msg, ["batterij", "accu", "thuisbatterij"]) ? "battery" : null);
  const [products, articles, pastTickets] = await Promise.all([
    getCustomerProducts(event, customer.id),
    getKbArticles(event, moduleType),
    getPastTickets(event, customer.partner_id, moduleType, customer.id)
  ]);
  const live = [];
  if (solarCtx) {
    live.push({ label: "Zonnepanelen vandaag", value: formatKwh(solarCtx.todayWh) });
    live.push({ label: "Zonnepanelen deze maand", value: formatKwh(solarCtx.monthWh) });
    if (solarCtx.peakInWatt) live.push({ label: "Vermogen installatie", value: `${(solarCtx.peakInWatt / 1e3).toFixed(1)} kWp` });
    live.push({
      label: "Laatste dag met productie",
      value: solarCtx.laatsteProductie ? String(solarCtx.laatsteProductie).slice(0, 10) : "geen productie deze maand"
    });
  }
  const systeem = SYSTEEMPROMPT.replaceAll("{{PARTNER}}", partnerName).replaceAll("{{KLANT}}", customer.full_name || "de klant") + "\n\n# Wat je over deze klant weet\n\n" + renderContext({ products, articles, pastTickets }, live);
  const messages = (history.length ? history : [{ role: "user", content: message }]).filter((m) => m && typeof m.content === "string" && m.content.trim()).slice(-12).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
  const finalizeInstructie = `

# De klant klikt nu op "stuur door"

Stel geen vragen meer. Roep escalate_to_installer aan met wat je nu weet.

Is dat weinig \u2014 bijvoorbeeld \xE9\xE9n zin zonder details \u2014 schrijf dat dan letterlijk in de description, zodat de monteur weet dat hij zelf moet uitvragen en waarnaar. Bijvoorbeeld: "Klant meldt alleen dat de zonnepanelen kapot zijn; symptoom, sinds wanneer en foutcode zijn nog niet bekend." Verzin niets bij.`;
  try {
    const response = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system: finalize ? systeem + finalizeInstructie : systeem,
      messages,
      ...finalize ? { tool_choice: { type: "tool", name: "escalate_to_installer" } } : {},
      tools: [{
        name: "escalate_to_installer",
        description: "Maak een serviceticket aan voor de installateur. Roep dit aan zodra je genoeg weet om de monteur op weg te helpen, of direct bij gevaar, contractvragen of als de klant erom vraagt.",
        input_schema: {
          type: "object",
          properties: {
            subject: { type: "string", description: 'Korte omschrijving van de klacht, max 80 tekens. Concreet: "Geen productie sinds 3 sept, omvormer knippert rood" \u2014 niet "Probleem met zonnepanelen".' },
            description: { type: "string", description: "Overdracht aan de monteur: symptoom, sinds wanneer, waarneming van de klant, wat al geprobeerd is, en wat de meetgegevens laten zien." },
            urgency: { type: "string", enum: ["laag", "normaal", "hoog"], description: "'hoog' bij gevaar of volledige uitval, 'laag' bij een vraag zonder storing." },
            module_type: { type: "string", enum: ["solar_panel", "heat_pump", "ev_charger", "battery", "other"] }
          },
          required: ["subject", "description", "urgency"]
        }
      }]
    });
    const tekst = response.content.filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
    const tool = response.content.find((c) => c.type === "tool_use");
    if ((tool == null ? void 0 : tool.name) === "escalate_to_installer") {
      const inp = tool.input || {};
      return {
        content: tekst || `Ik heb genoeg om je melding door te zetten naar ${partnerName}. Zal ik dat doen?`,
        systemCheck: !!solarCtx,
        dataPoints: live.slice(0, 3),
        shouldEscalate: true,
        escalateReason: inp.subject,
        ticketDraft: {
          subject: String(inp.subject || "Serviceverzoek").slice(0, 120),
          description: String(inp.description || ""),
          urgency: ["laag", "normaal", "hoog"].includes(inp.urgency) ? inp.urgency : "normaal",
          module_type: inp.module_type && inp.module_type !== "other" ? inp.module_type : moduleType
        },
        source: "ai"
      };
    }
    return {
      content: tekst || "Kun je dat iets uitgebreider omschrijven?",
      systemCheck: !!solarCtx,
      dataPoints: live.slice(0, 3),
      shouldEscalate: false,
      source: "ai"
    };
  } catch (e) {
    console.error("[ai-assist] Claude-aanroep mislukt:", e == null ? void 0 : e.message);
    return ruleBasedReply(msg, partnerName, solarCtx, hintedModule);
  }
});

export { aiAssist_post as default };
//# sourceMappingURL=ai-assist.post.mjs.map
