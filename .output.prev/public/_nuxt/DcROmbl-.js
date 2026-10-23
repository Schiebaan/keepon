import{_ as E}from"./Djn9AbL2.js";import{f as V,L as N,ab as K,k as i,c as o,a as r,b as j,w as x,p as w,t as m,F as p,r as k,q as M,o as s,d as u,A as v,_ as F}from"./BTGjCIGW.js";import{u as U}from"./BxTiX_ru.js";function z(f,c){return f.replace(/\{\{(\w+)\}\}/g,(_,g)=>c[g]||`[${g}]`)}const $={key:0,class:"terms-page"},I={class:"terms-container"},P={class:"terms-error"},R={key:1,class:"terms-page"},H={class:"terms-container"},O={class:"terms-header"},W={class:"terms-header__brand"},q=["src","alt"],J={class:"terms-header__name"},Q={class:"terms-body"},Z={key:0,class:"terms-line terms-line--bold"},G={key:1,class:"terms-line"},X=["id"],Y={class:"terms-appendix__label"},ee={class:"terms-appendix__title"},te={class:"terms-body"},re={key:0,class:"terms-line terms-line--bold"},ae={key:1,class:"terms-line"},ne={class:"terms-footer"},oe=`Servicevoorwaarden {{bedrijfsnaam}}

Laatst bijgewerkt: maart 2026

1. Algemeen

Deze servicevoorwaarden zijn van toepassing op alle servicecontracten afgesloten bij {{bedrijfsnaam}}, gevestigd te {{adres}}, ingeschreven bij de Kamer van Koophandel onder nummer {{kvk}}.

2. Definities

Serviceprovider: {{bedrijfsnaam}}, bereikbaar via {{email}} en {{telefoon}}.
Klant: de natuurlijke persoon die een servicecontract heeft afgesloten.
Installatie: het energiesysteem (zonnepanelen, warmtepomp en/of laadpaal) waarop het servicecontract betrekking heeft.

3. Servicecontract

3.1 Het servicecontract omvat monitoring, storingsanalyse en indien van toepassing proactief onderhoud van de installatie.
3.2 De exacte diensten zijn afhankelijk van het gekozen servicepakket (Start, Slim of Max).
3.3 {{bedrijfsnaam}} spant zich in om storingen binnen de afgesproken termijn te analyseren en op te lossen.

4. Tarieven buiten het contract

4.1 Werkzaamheden die buiten het servicecontract vallen worden gefactureerd tegen het geldende uurtarief van € {{uurtarief}} per uur (excl. btw).
4.2 Voor het bezoek aan locatie worden voorrijkosten berekend van € {{voorrijkosten}} (excl. btw).

5. Productvoorwaarden

Voor specifieke voorwaarden per product gelden de bijlagen hieronder (indien van toepassing op jouw installatie).

6. Looptijd en opzegging

6.1 Het servicecontract heeft een minimale looptijd zoals vermeld bij het afsluiten van het contract.
6.2 Na afloop van de minimale looptijd is het contract maandelijks opzegbaar met een opzegtermijn van 1 maand.
6.3 Opzegging kan via het klantportaal of per e-mail naar {{email}}.

7. Betaling

7.1 Betaling geschiedt maandelijks via automatische incasso.
7.2 Bij het uitblijven van betaling wordt de klant per e-mail herinnerd.

8. Contact

Voor vragen over deze voorwaarden:
{{bedrijfsnaam}} · {{adres}} · {{email}} · {{telefoon}} · KvK: {{kvk}}`,se=V({__name:"[slug]",async setup(f){let c,_;const L=N().params.slug,{data:n,error:T}=([c,_]=K(()=>U(`/api/voorwaarden/${L}`,"$bQsLyCJ1DS")),c=await c,_(),c),b=v(()=>{var e,l,t,d;const a=((e=n.value)==null?void 0:e.terms_placeholders)||{};return{bedrijfsnaam:a.bedrijfsnaam||((l=n.value)==null?void 0:l.name)||"",kvk:a.kvk||"",adres:a.adres||"",email:a.email||((t=n.value)==null?void 0:t.support_email)||"",telefoon:a.telefoon||((d=n.value)==null?void 0:d.support_phone)||"",uurtarief:a.uurtarief||"—",voorrijkosten:a.voorrijkosten||"—"}}),C=v(()=>{if(!n.value)return"";const a=n.value.terms_content||oe;return z(a,b.value)}),S=[{key:"solar",label:"Zonnepanelen",appendix:"A"},{key:"heat_pump",label:"Warmtepomp",appendix:"B"},{key:"ev_charger",label:"Laadpaal",appendix:"C"},{key:"battery",label:"Batterij",appendix:"D"}],h=v(()=>{var e,l;const a=((l=(e=n.value)==null?void 0:e.terms_placeholders)==null?void 0:l.module_terms)||{};return S.map(t=>({...t,content:(a[t.key]||"").trim()})).filter(t=>t.content).map(t=>({...t,rendered:z(t.content,b.value)}))});function y(a){return a.split(`
`).map(e=>({text:e,bold:/^\d+\./.test(e.trim())}))}const A=v(()=>y(C.value)),B=v(()=>{var a,e;return((e=(a=n.value)==null?void 0:a.name)==null?void 0:e.charAt(0).toUpperCase())||""});return(a,e)=>{const l=E;return i(T)||!i(n)?(s(),o("div",$,[r("div",I,[r("div",P,[e[1]||(e[1]=r("div",{class:"terms-error__icon"},"?",-1)),e[2]||(e[2]=r("h1",{class:"terms-error__title"},"Pagina niet gevonden",-1)),e[3]||(e[3]=r("p",{class:"terms-error__text"}," De voorwaardenpagina voor deze partner kon niet worden gevonden. Controleer of de URL correct is. ",-1)),j(l,{to:"/",class:"terms-error__link"},{default:x(()=>[...e[0]||(e[0]=[u("Terug naar de homepage",-1)])]),_:1})])])])):(s(),o("div",R,[r("div",H,[r("header",O,[r("div",W,[i(n).logo_url?(s(),o("img",{key:0,src:i(n).logo_url,alt:i(n).name,class:"terms-header__logo"},null,8,q)):(s(),o("div",{key:1,class:"terms-header__initial",style:w({backgroundColor:i(n).primary_color})},m(i(B)),5)),r("span",J,m(i(n).name),1)])]),e[10]||(e[10]=r("h1",{class:"terms-title"},"Servicevoorwaarden",-1)),r("div",Q,[(s(!0),o(p,null,k(i(A),(t,d)=>(s(),o(p,{key:d},[t.bold?(s(),o("span",Z,[u(m(t.text),1),e[4]||(e[4]=r("br",null,null,-1))])):(s(),o("span",G,[u(m(t.text),1),e[5]||(e[5]=r("br",null,null,-1))]))],64))),128))]),i(h).length?(s(),o(p,{key:0},[e[8]||(e[8]=r("hr",{class:"terms-divider"},null,-1)),(s(!0),o(p,null,k(i(h),t=>(s(),o("section",{key:t.key,id:`bijlage-${t.key}`,class:"terms-appendix"},[r("p",Y,"Bijlage "+m(t.appendix),1),r("h2",ee,"Aanvullende voorwaarden — "+m(t.label),1),r("div",te,[(s(!0),o(p,null,k(y(t.rendered),(d,D)=>(s(),o(p,{key:D},[d.bold?(s(),o("span",re,[u(m(d.text),1),e[6]||(e[6]=r("br",null,null,-1))])):(s(),o("span",ae,[u(m(d.text),1),e[7]||(e[7]=r("br",null,null,-1))]))],64))),128))])],8,X))),128))],64)):M("",!0),r("footer",ne,[j(l,{to:"/klant",class:"terms-footer__link",style:w({color:i(n).primary_color})},{default:x(()=>[...e[9]||(e[9]=[u(" ← Terug naar portaal ",-1)])]),_:1},8,["style"])])])]))}}}),me=F(se,[["__scopeId","data-v-5d9d9eb9"]]);export{me as default};
