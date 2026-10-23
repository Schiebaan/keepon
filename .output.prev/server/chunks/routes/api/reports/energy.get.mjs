import { d as defineEventHandler, e as getQuery, s as setHeader } from '../../../nitro/nitro.mjs';
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

const energy_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const period = query.period || "month";
  const now = /* @__PURE__ */ new Date();
  const monthName = now.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
  const totalConsumption = period === "year" ? 3240 : 285;
  const totalProduction = period === "year" ? 4180 : 365;
  const totalGas = period === "year" ? 820 : 68;
  const netExport = totalProduction - totalConsumption;
  const co2Saved = Math.round(totalProduction * 0.4);
  const selfConsumption = Math.min(100, Math.round(Math.min(totalConsumption, totalProduction) / totalProduction * 100));
  const periodLabel = period === "year" ? `Jaaroverzicht ${now.getFullYear()}` : `Maandrapport ${monthName}`;
  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>${periodLabel} - UPsol Energierapport</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; margin: 0; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24px; margin: 0; }
    .header .date { color: #6b7280; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 30px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
    .card-label { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px; }
    .card-value { font-size: 28px; font-weight: 700; margin: 0; }
    .card-unit { font-size: 14px; color: #6b7280; font-weight: 400; }
    .positive { color: #059669; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 16px; margin: 0 0 12px; }
    .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .bar-label { width: 100px; font-size: 13px; color: #6b7280; text-align: right; }
    .bar-track { flex: 1; height: 20px; background: #f3f4f6; border-radius: 10px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 10px; }
    .bar-value { width: 70px; font-size: 13px; font-weight: 600; }
    .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
    .co2-banner { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px 20px; text-align: center; margin-bottom: 30px; }
    .co2-banner strong { color: #065f46; font-size: 20px; }
    .print-btn { position: fixed; bottom: 20px; right: 20px; background: #111827; color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; }
    .print-btn:hover { background: #374151; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${periodLabel}</h1>
      <p class="date">Gegenereerd op ${now.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</p>
    </div>
    <div style="font-size:24px;font-weight:700;">UPsol</div>
  </div>

  <div class="co2-banner">
    <p style="margin:0;color:#065f46;font-size:14px;">Jouw bijdrage aan een duurzame toekomst</p>
    <strong>${co2Saved} kg CO\u2082 bespaard</strong>
    <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">\u2248 ${Math.round(co2Saved / 22)} bomen die een jaar groeien</p>
  </div>

  <div class="grid">
    <div class="card">
      <p class="card-label">Verbruik</p>
      <p class="card-value">${totalConsumption.toLocaleString("nl-NL")} <span class="card-unit">kWh</span></p>
    </div>
    <div class="card">
      <p class="card-label">Opwek (zonnepanelen)</p>
      <p class="card-value positive">${totalProduction.toLocaleString("nl-NL")} <span class="card-unit">kWh</span></p>
    </div>
    <div class="card">
      <p class="card-label">${netExport > 0 ? "Netto teruglevering" : "Netto afname"}</p>
      <p class="card-value" style="color:${netExport > 0 ? "#059669" : "#dc2626"}">${Math.abs(netExport).toLocaleString("nl-NL")} <span class="card-unit">kWh</span></p>
    </div>
    <div class="card">
      <p class="card-label">Gasverbruik</p>
      <p class="card-value">${totalGas.toLocaleString("nl-NL")} <span class="card-unit">m\xB3</span></p>
    </div>
  </div>

  <div class="section">
    <h2>Eigen verbruik: ${selfConsumption}%</h2>
    <div class="bar-row">
      <span class="bar-label">Eigen gebruik</span>
      <div class="bar-track"><div class="bar-fill" style="width:${selfConsumption}%;background:#059669;"></div></div>
      <span class="bar-value">${selfConsumption}%</span>
    </div>
    <div class="bar-row">
      <span class="bar-label">Teruglevering</span>
      <div class="bar-track"><div class="bar-fill" style="width:${100 - selfConsumption}%;background:#f59e0b;"></div></div>
      <span class="bar-value">${100 - selfConsumption}%</span>
    </div>
  </div>

  <div class="footer">
    <p>Dit rapport is automatisch gegenereerd door UPsol \xB7 ${now.toLocaleDateString("nl-NL")}</p>
  </div>

  <button class="print-btn" onclick="window.print()">\u{1F4C4} Opslaan als PDF</button>
</body>
</html>`;
  setHeader(event, "content-type", "text/html");
  return html;
});

export { energy_get as default };
//# sourceMappingURL=energy.get.mjs.map
