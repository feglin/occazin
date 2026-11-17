'use strict';
/* Occaz'In —annonces organisées par produit (code-barres). Données en localStorage. */

const CONDITIONS = [
  { id: 1, label: 'Neuf', factor: 1.0 },
  { id: 2, label: 'Comme neuf', factor: 0.9 },
  { id: 3, label: 'Très bon état', factor: 0.78 },
  { id: 4, label: 'Bon état', factor: 0.64 },
  { id: 5, label: 'À réparer / usé', factor: 0.4 },
];
const CATS = [
  ['Tous', ''], ['Informatique', '💻'], ['Téléphonie', '📱'], ['Jeux vidéo', '🎮'],
  ['Maison', '🏠'], ['Livres', '📚'], ['Sport', '🚲'], ['Audio / Photo', '🎧'], ['Autre', '📦'],
];
const CITIES = {
  'Paris': [48.8566, 2.3522], 'Lyon': [45.764, 4.8357], 'Marseille': [43.2965, 5.3698],
  'Toulouse': [43.6047, 1.4442], 'Nice': [43.7102, 7.262], 'Nantes': [47.2184, -1.5536],
  'Strasbourg': [48.5734, 7.7521], 'Montpellier': [43.6108, 3.8767], 'Bordeaux': [44.8378, -0.5792],
  'Lille': [50.6292, 3.0573], 'Rennes': [48.1173, -1.6778], 'Reims': [49.2583, 4.0317],
  'Grenoble': [45.1885, 5.7245], 'Dijon': [47.322, 5.0415], 'Angers': [47.4784, -0.5632],
  'Clermont-Ferrand': [45.7772, 3.087], 'Tours': [47.3941, 0.6848], 'Brest': [48.3904, -4.4861],
  'Limoges': [45.8336, 1.2611], 'Metz': [49.1193, 6.1757], 'Rouen': [49.4432, 1.0999],
};
const KEY = 'occazin.v1';

/* ---------- EAN ---------- */
function eanCheck(d12) {
  let s = 0;
  for (let i = 0; i < 12; i++) s += +d12[i] * (i % 2 ? 3 : 1);
  return (10 - (s % 10)) % 10;
}
const withCheck = d12 => d12 + eanCheck(d12);
function validEan(e) {
  return /^\d{13}$/.test(e) && eanCheck(e.slice(0, 12)) === +e[12];
}

/* ---------- Données ---------- */
function seed() {
  const P = (base, name, cat, ref) => ({ ean: withCheck(base), name, cat, ref });
  const products = [
    { ean: '3017620422003', name: 'Nutella 950 g (pot)', cat: 'Autre', ref: 5 },
    P('376000000001', 'Apple AirPods Pro (2e génération)', 'Audio / Photo', 279),
    P('376000000002', 'Nintendo Switch OLED – blanche', 'Jeux vidéo', 320),
    P('376000000003', 'Sony PlayStation 5 – édition standard', 'Jeux vidéo', 479),
    P('376000000004', 'Kindle Paperwhite 16 Go (2024)', 'Livres', 170),
    P('376000000005', 'Dyson V15 Detect – aspirateur balai', 'Maison', 650),
    P('376000000006', 'Apple iPhone 14 128 Go', 'Téléphonie', 859),
    P('376000000007', 'Logitech MX Master 3S – souris', 'Informatique', 109),
    P('376000000008', 'GoPro HERO12 Black', 'Audio / Photo', 399),
  ];
  const sellers = ['marie75', 'jeanLuc', 'sofia_b', 'tom.occaz', 'camille', 'nico34', 'lea_', 'vendeur42', 'Ahmed', 'ju_lien'];
  const cities = Object.keys(CITIES);
  const descs = ['Très peu servi, vendu avec boîte.', 'Fonctionne parfaitement, facture dispo.', 'Cause double emploi.',
    'Quelques traces d\'usage, rien de grave.', 'Jamais déballé, cadeau en double.', 'Remise en main propre uniquement.', 'Envoi possible, frais en sus.'];
  let n = 0;
  const rnd = () => { n = (n * 9301 + 49297) % 233280; return n / 233280; }; // déterministe
  n = 7;
  const ads = [];
  products.forEach(p => {
    const count = 4 + Math.floor(rnd() * 5);
    for (let i = 0; i < count; i++) {
      const c = CONDITIONS[Math.floor(rnd() * 5)];
      const price = Math.max(1, Math.round(p.ref * c.factor * (0.82 + rnd() * 0.3) * (p.ref < 20 ? 1 : 1)));
      ads.push({
        id: 'a' + ads.length, ean: p.ean, price, cond: c.id,
        city: cities[Math.floor(rnd() * cities.length)],
        seller: sellers[Math.floor(rnd() * sellers.length)],
        desc: descs[Math.floor(rnd() * descs.length)],
        date: Date.now() - Math.floor(rnd() * 25) * 864e5,
      });
    }
  });
  return { products, ads, myCity: '' };
}
let db = JSON.parse(localStorage.getItem(KEY) || 'null') || seed();
const save = () => localStorage.setItem(KEY, JSON.stringify(db));

/* ---------- Utils ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const cond = id => CONDITIONS.find(c => c.id === id);
const emoji = cat => (CATS.find(c => c[0] === cat) || [, '📦'])[1] || '📦';
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function km(a, b) {
  const A = CITIES[a], B = CITIES[b];
  if (!A || !B) return null;
  const r = x => x * Math.PI / 180, dLat = r(B[0] - A[0]), dLon = r(B[1] - A[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(A[0])) * Math.cos(r(B[0])) * Math.sin(dLon / 2) ** 2;
  return Math.round(12742 * Math.asin(Math.sqrt(h)));
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2500);
}
const adsOf = ean => db.ads.filter(a => a.ean === ean);
const median = arr => { const s = [...arr].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const effective = a => a.price / cond(a.cond).factor; // prix « corrigé de l'état » : plus bas = meilleure affaire

/* ---------- Vues ---------- */
const state = { cat: '', sort: 'value', maxPrice: '', maxCond: 5, maxKm: '' };

function productCard(p) {
  const ads = adsOf(p.ean), min = ads.length ? Math.min(...ads.map(a => a.price)) : null;
  return `<a class="pcard" href="#/p/${p.ean}">
    <span class="emoji">${emoji(p.cat)}</span><span class="name">${esc(p.name)}</span>
    <span class="ean">EAN ${p.ean}</span>
    <span class="mut">${ads.length} annonce${ads.length > 1 ? 's' : ''}</span>
    <span class="from">${min === null ? '—' : 'dès ' + eur(min)}</span></a>`;
}

function viewHome(query = '') {
  const q = norm(query.trim());
  let list = db.products.filter(p => (!state.cat || p.cat === state.cat) &&
    (!q || norm(p.name).includes(q) || p.ean.includes(q)));
  const exactEan = /^\d{8,13}$/.test(q) && db.products.find(p => p.ean === q);
  if (exactEan) { location.hash = '#/p/' + exactEan.ean; return; }
  list.sort((a, b) => adsOf(b.ean).length - adsOf(a.ean).length);
  let extra = '';
  if (q && !list.length) {
    extra = `<div class="empty"><p>Aucun produit trouvé pour « ${esc(query)} ».</p>
      <p><button class="cta" onclick="openSell('${/^\d{13}$/.test(q) ? q : ''}')">Être le premier à le vendre</button></p></div>`;
  }
  $('#view').innerHTML = `
    <h1>${q ? 'Résultats' : 'Trouvez un produit, comparez toutes les offres'}</h1>
    <p class="mut">${q ? list.length + ' produit(s) pour « ' + esc(query) + ' »' : 'Cherchez par nom ou scannez / saisissez le code-barres : toutes les annonces du même produit sont réunies sur une seule page.'}</p>
    <div class="cats">${CATS.map(([c]) => `<span class="chip ${state.cat === (c === 'Tous' ? '' : c) ? 'on' : ''}" data-cat="${c === 'Tous' ? '' : c}">${c}</span>`).join('')}</div>
    <div class="grid">${list.map(productCard).join('')}</div>${extra}`;
  document.querySelectorAll('.chip').forEach(c => c.onclick = () => { state.cat = c.dataset.cat; viewHome(query); });
}

function viewProduct(ean) {
  const p = db.products.find(x => x.ean === ean);
  if (!p) { $('#view').innerHTML = `<div class="empty"><h2>Produit introuvable</h2><a href="#/">Retour</a></div>`; return; }
  const all = adsOf(ean), med = all.length ? median(all.map(a => a.price)) : 0;
  const my = db.myCity;
  let ads = all.map(a => ({ ...a, dist: my ? km(my, a.city) : null }));
  ads = ads.filter(a => (!state.maxPrice || a.price <= +state.maxPrice) && a.cond <= +state.maxCond &&
    (!state.maxKm || a.dist === null || a.dist <= +state.maxKm));
  const sorters = {
    value: (a, b) => effective(a) - effective(b),
    price: (a, b) => a.price - b.price,
    cond: (a, b) => a.cond - b.cond || a.price - b.price,
    dist: (a, b) => (a.dist ?? 1e9) - (b.dist ?? 1e9),
    date: (a, b) => b.date - a.date,
  };
  ads.sort(sorters[state.sort]);
  const bestId = all.length ? [...all].sort(sorters.value)[0].id : null;
  const prices = all.map(a => a.price);

  $('#view').innerHTML = `
    <p><a href="#/">← Tous les produits</a></p>
    <div class="head"><span class="emoji">${emoji(p.cat)}</span>
      <div><h1>${esc(p.name)}</h1><span class="ean">EAN ${p.ean} · ${esc(p.cat)}</span></div>
      <div class="stats">
        <div class="stat"><b>${all.length}</b><small>annonces</small></div>
        <div class="stat"><b>${all.length ? eur(Math.min(...prices)) : '—'}</b><small>prix mini</small></div>
        <div class="stat"><b>${all.length ? eur(med) : '—'}</b><small>prix médian</small></div>
      </div></div>
    <div class="toolbar">
      <label>Trier par<select id="fSort">
        <option value="value">Meilleure affaire (prix ÷ état)</option><option value="price">Prix croissant</option>
        <option value="cond">État (meilleur d'abord)</option><option value="dist">Distance</option><option value="date">Plus récentes</option></select></label>
      <label>Prix max (€)<input id="fPrice" type="number" min="0" value="${state.maxPrice}"></label>
      <label>État minimum<select id="fCond">${CONDITIONS.map(c => `<option value="${c.id}">${c.id === 5 ? 'Tous les états' : 'Au moins « ' + c.label + ' »'}</option>`).join('')}</select></label>
      <label>Ma ville<select id="fCity"><option value="">— non renseignée —</option>${Object.keys(CITIES).sort().map(c => `<option ${c === my ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label>Distance max (km)<input id="fKm" type="number" min="0" value="${state.maxKm}" ${my ? '' : 'disabled'}></label>
    </div>
    ${ads.length ? ads.map(a => adHtml(a, med, a.id === bestId)).join('') :
      `<div class="empty"><p>${all.length ? 'Aucune annonce ne correspond à vos filtres.' : 'Aucune annonce pour ce produit pour le moment.'}</p>
       <button class="cta" onclick="openSell('${p.ean}')">Déposer une annonce</button></div>`}`;
  $('#fSort').value = state.sort; $('#fCond').value = state.maxCond;
  const bind = (id, k, ev = 'change') => $(id).addEventListener(ev, e => { state[k] = e.target.value; viewProduct(ean); });
  bind('#fSort', 'sort'); bind('#fCond', 'maxCond'); bind('#fPrice', 'maxPrice'); bind('#fKm', 'maxKm');
  $('#fCity').onchange = e => { db.myCity = e.target.value; if (db.myCity && state.sort !== 'dist') state.sort = 'dist'; save(); viewProduct(ean); };
}

function adHtml(a, med, best) {
  const c = cond(a.cond), diff = med ? Math.round((a.price - med) / med * 100) : 0;
  const cmp = diff === 0 ? 'prix médian' : (diff < 0 ? `${-diff} % sous le médian` : `${diff} % au-dessus du médian`);
  return `<div class="ad ${best ? 'best' : ''}">${best ? '<span class="badge">★ MEILLEURE AFFAIRE</span>' : ''}
    <div><div class="tags"><span class="cond c${c.id}">${c.label}</span>
      <span>📍 ${esc(a.city)}${a.dist !== null ? ' · ' + a.dist + ' km' : ''}</span>
      <span class="score">👤 ${esc(a.seller)} · ${new Date(a.date).toLocaleDateString('fr-FR')}</span></div></div>
    <div class="price">${eur(a.price)}<small class="${diff < 0 ? 'below' : diff > 0 ? 'above' : 'mut'}">${cmp}</small></div>
    <p class="desc">${esc(a.desc || '')}</p>
    <div></div><button class="contact ghost" onclick="toast('Message envoyé à ${esc(a.seller)} (démo)')">Contacter</button></div>`;
}

/* ---------- Dépôt d'annonce ---------- */
const dlg = $('#sellDialog'), f = $('#sellForm');
f.cond.innerHTML = CONDITIONS.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
f.pcat.innerHTML = CATS.slice(1).map(c => `<option>${c[0]}</option>`).join('');
$('#cities').innerHTML = Object.keys(CITIES).map(c => `<option value="${c}">`).join('');
function lookup() {
  const ean = f.ean.value.trim(), hint = $('#productHint');
  $('#newProduct').hidden = true; f.pname.required = false;
  if (!validEan(ean)) { hint.className = 'hint err'; hint.textContent = 'Code-barres EAN-13 invalide (13 chiffres, clé de contrôle incluse).'; return false; }
  const p = db.products.find(x => x.ean === ean);
  if (p) { hint.className = 'hint ok'; hint.textContent = '✔ Produit reconnu : ' + p.name; return true; }
  hint.className = 'hint'; hint.textContent = 'Nouveau produit : renseignez son nom pour le référencer.';
  $('#newProduct').hidden = false; f.pname.required = true; return true;
}
window.openSell = (ean = '') => { f.reset(); f.ean.value = ean; $('#newProduct').hidden = true;
  $('#productHint').className = 'hint'; $('#productHint').textContent = 'Saisissez le code-barres : le produit sera rattaché automatiquement.';
  f.city.value = db.myCity || ''; dlg.showModal(); if (ean) lookup(); };
$('#sellBtn').onclick = () => { const m = location.hash.match(/^#\/p\/(\d{13})/); openSell(m ? m[1] : ''); };
$('#cancelSell').onclick = () => dlg.close();
$('#lookupBtn').onclick = lookup;
f.ean.addEventListener('input', () => { if (f.ean.value.length === 13) lookup(); });
f.addEventListener('submit', e => {
  e.preventDefault();
  if (!lookup()) return;
  const ean = f.ean.value.trim();
  if (!db.products.find(p => p.ean === ean)) db.products.push({ ean, name: f.pname.value.trim(), cat: f.pcat.value, ref: +f.price.value });
  db.ads.push({ id: 'u' + Date.now(), ean, price: Math.round(+f.price.value), cond: +f.cond.value,
    city: f.city.value.trim(), seller: f.seller.value.trim(), desc: f.desc.value.trim(), date: Date.now() });
  save(); dlg.close(); toast('Annonce publiée ✔');
  if (location.hash === '#/p/' + ean) route(); else location.hash = '#/p/' + ean;
});

/* ---------- Routage ---------- */
function route() {
  const h = location.hash, m = h.match(/^#\/p\/(\d+)/), s = h.match(/^#\/s\/(.*)/);
  window.scrollTo(0, 0);
  if (m) viewProduct(m[1]);
  else viewHome(s ? decodeURIComponent(s[1]) : '');
}
$('#searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('#q').value.trim();
  if (!q) { location.hash = '#/'; return; }
  const hit = db.products.find(p => p.ean === q);
  location.hash = hit ? '#/p/' + hit.ean : '#/s/' + encodeURIComponent(q);
});
window.addEventListener('hashchange', route);
route();
