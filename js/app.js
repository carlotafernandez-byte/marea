import {
  addDays, diffDays, todayKey, fromKey, predict, phaseOf, fertilityOn, dayMarks, pregnancyRisk, getAnomaly, getPeriods, dischargeStage,
} from './cycle.js';
import * as store from './store.js';
import * as C from './content.js';
import { answer, SUGGESTIONS } from './assistant.js';
import { contraStatus, METHODS as CONTRA, isHormonal } from './contraception.js';

// ---------- Estado ----------
let state = store.fresh();
const today = () => todayKey();
const ui = {
  screen: 'loading', // loading | onboarding | login | app
  tab: 'hoy',
  month: today().slice(0, 7),
  ciclo: 'calendario', // calendario | fases | resumen
  page: null, // subpágina de Salud (embarazo, retraso, medico, flujo…)
  symptoms: new Set(),
  preg: { date: today(), method: null, done: false },
  openInf: null,
  sheet: null, // { type: 'day', key } | { type: 'settings' }
  onbStep: 0,
  onb: { name: '', email: '', password: '', remember: true, last: '', cycleLen: 28, periodLen: 5, usual: [], goal: 'controlar', imported: null, error: '' },
  login: { email: '', remember: true, error: '', busy: false },
  chat: [],
  chatDraft: '',
};

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const dtf = (o) => new Intl.DateTimeFormat('es-ES', { ...o, timeZone: 'UTC' });
const fShort = (k) => dtf({ day: 'numeric', month: 'short' }).format(fromKey(k)).replace('.', '');
const fLong = (k) => dtf({ weekday: 'long', day: 'numeric', month: 'long' }).format(fromKey(k));
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const fMonth = (ym) => cap(dtf({ month: 'long', year: 'numeric' }).format(fromKey(ym + '-01')));
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
const pred = () => predict(state.days, state.settings, today());
const day = (k) => (state.days[k] ||= {});
const persist = () => store.save(state);
const firstName = () => (store.getAccount()?.name || '').split(' ')[0];

// ---------- Modo discreto ----------
// Se guarda fuera de la bóveda cifrada porque hace falta antes de iniciar sesión.
const DISCREET_KEY = 'marea:discreet';
const isDiscreet = () => { try { return localStorage.getItem(DISCREET_KEY) === '1'; } catch { return false; } };
const brandName = () => (isDiscreet() ? 'Diario' : 'Marea');
function applyDiscreet() {
  const on = isDiscreet();
  document.title = brandName();
  document.querySelector('.brand-name').textContent = brandName();
  document.querySelector('link[rel=manifest]').href = on ? 'manifest-discreto.webmanifest' : 'manifest.webmanifest';
  document.querySelector('link[rel=apple-touch-icon]').href = on ? 'icons/discreto-192.png' : 'icons/icon-192.png';
  document.querySelector('link[rel=icon]').href = on ? 'icons/discreto.svg' : 'icons/icon.svg';
  document.querySelector('meta[name=apple-mobile-web-app-title]').content = brandName();
  document.body.classList.toggle('discreet', on);
}

// ---------- Iconos ----------
const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  send: '<path d="M4 12l16-8-6 16-2-7z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
  doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7M14 3v5h5"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

// ---------- Componentes ----------
const chip = (action, value, label, on, extra = '') =>
  `<button class="chip ${on ? 'on' : ''}" data-action="${action}" data-value="${esc(value)}" aria-pressed="${!!on}" ${extra}>${label}</button>`;
const seg = (action, current, opts) =>
  `<div class="seg" role="tablist">${opts.map(([v, l]) => `<button role="tab" aria-selected="${v === current}" class="${v === current ? 'on' : ''}" data-action="${action}" data-value="${v}">${l}</button>`).join('')}</div>`;
const disclaimer = (t = 'Información general. No sustituye a tu médica, enfermera o farmacéutica.') => `<p class="disclaimer">${t}</p>`;
const flowLabel = (f) => `<i class="drops d${f.v}"></i><span>${f.label}</span>`;
const stepper = (key, v, action) =>
  `<div class="stepper"><button data-action="${action}" data-key="${key}" data-value="-1" aria-label="Menos">−</button><b>${v}</b><button data-action="${action}" data-key="${key}" data-value="1" aria-label="Más">+</button></div>`;
const plain = (t) => (t ? `<p class="plain"><span>Es decir</span>${t}</p>` : '');
const spotifyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1ed760"/><path d="M6.5 9.5c3.8-1.2 7.8-.9 11 1M7.2 12.6c3-.9 6.3-.6 9 .9M7.9 15.4c2.4-.7 4.8-.5 7 .7" stroke="#0b1b36" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>';
const playlistLink = (key) => {
  const pl = C.PLAYLISTS[key];
  return `<a class="playlist" href="https://open.spotify.com/playlist/${pl.id}" target="_blank" rel="noopener noreferrer">${spotifyIcon}<span><b>${pl.name}</b><span class="muted small">${pl.desc}</span></span><span class="open">Abrir</span></a>`;
};
const rowCard = (e, t, d) => `<section class="card row-card"><span class="row-ic">${e}</span><span><b>${t}</b><span class="muted small">${d}</span></span></section>`;

/** La "marea": una ola que sube hacia la ovulación y baja hacia la regla. */
function tide(p) {
  const N = Math.max(p.stats.cycleLen, p.cycleDay);
  const W = 340, H = 132, x0 = 12, x1 = W - 12, mid = 66, amp = 30;
  const rel = (k) => diffDays(p.last.start, k) + 1;
  const ov = rel(p.ovulation);
  const X = (d) => x0 + ((d - 1) / (N - 1)) * (x1 - x0);
  const Y = (d) => mid - amp * Math.cos((2 * Math.PI * (d - ov)) / N);
  let line = '';
  for (let d = 1; d <= N; d += 0.25) line += `${line ? 'L' : 'M'}${X(d).toFixed(1)},${Y(d).toFixed(1)}`;
  const area = `${line}L${x1},${H}L${x0},${H}Z`;
  const fs = rel(p.fertileStart), fe = rel(p.fertileEnd);
  const pe = p.inPeriod ? Math.max(rel(p.last.end), p.stats.periodLen) : p.last.length;
  const cd = Math.min(p.cycleDay, N);
  return `
  <svg viewBox="0 0 ${W} ${H + 18}" class="tide" aria-hidden="true">
    <defs>
      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd4e6" stop-opacity=".5"/><stop offset="1" stop-color="#5fd4e6" stop-opacity="0"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    ${p.lateDays ? '' : `<rect x="${X(fs) - 4}" y="0" width="${X(fe) - X(fs) + 8}" height="${H}" rx="10" class="t-fert"/>`}
    <path d="${area}" fill="url(#tg)"/>
    <path d="${line}" class="t-line"/>
    <line x1="${X(1)}" y1="${H + 8}" x2="${X(Math.max(1.6, pe))}" y2="${H + 8}" class="t-period"/>
    ${p.lateDays ? '' : `<circle cx="${X(ov)}" cy="${Y(ov)}" r="5.5" class="t-ov"/>`}
    <line x1="${X(cd)}" y1="${Y(cd)}" x2="${X(cd)}" y2="${H}" class="t-stem"/>
    <circle cx="${X(cd)}" cy="${Y(cd)}" r="11" class="t-halo" filter="url(#glow)"/>
    <circle cx="${X(cd)}" cy="${Y(cd)}" r="6.5" class="t-today"/>
  </svg>`;
}
const tideArt = () => `<svg viewBox="0 0 200 90" aria-hidden="true"><circle cx="150" cy="26" r="14" class="moon"/><path d="M0 52 C25 36 50 36 75 52 S125 68 150 52 175 36 200 52 V90 H0Z" class="w1"/><path d="M0 64 C25 50 50 50 75 64 S125 78 150 64 175 50 200 64 V90 H0Z" class="w2"/></svg>`;

// ---------- Hoy ----------
function heroText(p) {
  if (p.inPeriod) return [`Día ${p.cycleDay}`, 'de tu regla'];
  if (p.lateDays > 0) return [plural(p.lateDays, 'día', 'días'), 'de retraso'];
  if (p.daysUntil === 0) return ['Hoy', 'te toca la regla'];
  return [plural(p.daysUntil, 'día', 'días'), 'para tu próxima regla'];
}

/** Tarjeta "Tranquila": siempre que el ciclo se salga de lo normal, explica las razones posibles. */
function calmCard(p) {
  const a = getAnomaly(state.days, p);
  if (!a) return '';
  const main = a.issues[0];
  const info = C.CALM_BY_ISSUE[main.type];
  const logged = [...new Map(a.factors.map((f) => [f.factor, f])).values()];
  const reasons = info.reasons || C.GENERAL_REASONS;
  return `
    <section class="card calm">
      <p class="eyebrow">Tranquila</p>
      <h3>${info.title(main.n)}</h3>
      ${plain('No te rayes todavía: casi siempre es algo tan normal como estrés, un viaje o haber dormido mal.')}
      ${logged.length ? `<p>Puede tener que ver con lo que apuntaste:</p>
        <ul class="factor-list">${logged.map((f) => { const fi = C.FACTORS.find((x) => x[0] === f.factor); return fi ? `<li><b>${fi[1]}</b> <span class="muted small">· ${fShort(f.date)}</span><p>${fi[2]}</p></li>` : ''; }).join('')}</ul>
        <p class="small muted">Otras causas frecuentes: ${reasons.join(', ').toLowerCase()}.</p>`
      : `<p>${info.text}</p><ul class="bullets">${reasons.map((r) => `<li>${r}</li>`).join('')}</ul>`}
      <div class="row-actions">
        ${main.type === 'late' ? '<button class="link" data-action="goto" data-value="salud:retraso">Ver todas las causas</button>' : ''}
        <button class="link" data-action="goto" data-value="salud:medico">¿Cuándo preocuparse?</button>
      </div>
    </section>`;
}

function musicCard(p, d) {
  const mood = (d.mood || []).map((m) => C.MUSIC_BY_MOOD[m]).find(Boolean);
  const m = mood || C.MUSIC_BY_PHASE[phaseOf(p)];
  if (!m) return '';
  return `
    <section class="card music">
      <p class="eyebrow">Tu banda sonora de hoy</p>
      <h3>${m.title}</h3>
      <div class="playlists">${m.lists.slice(0, 2).map(playlistLink).join('')}</div>
      <button class="link left" data-action="goto" data-value="salud:musica">Más música para cada momento →</button>
    </section>`;
}

function viewMusica() {
  const p = pred();
  const cur = p.hasData ? phaseOf(p) : null;
  const order = ['menstrual', 'folicular', 'fertil', 'lutea'];
  return `
    <p class="intro">Playlists de Spotify según tu fase y cómo te sientas. Se abren en la app de Spotify.</p>
    ${order.map((id) => `
      <section class="card music ${id === cur ? 'current' : ''}">
        <div class="row-between"><p class="eyebrow">${C.PHASE_GUIDE.find((g) => g.id === id).name}</p>${id === cur ? '<span class="here">Estás aquí</span>' : ''}</div>
        <h3>${C.MUSIC_BY_PHASE[id].title}</h3>
        <div class="playlists">${C.MUSIC_BY_PHASE[id].lists.map(playlistLink).join('')}</div>
      </section>`).join('')}
    <h3 class="section-title">Para momentos concretos</h3>
    ${C.MUSIC_MOMENTS.map(([t, lists]) => `<section class="card music"><h3>${t}</h3><div class="playlists">${lists.map(playlistLink).join('')}</div></section>`).join('')}
    <p class="disclaimer">Marea no está conectada a Spotify ni sabe qué escuchas: solo te da el enlace.</p>`;
}

function viewHoy() {
  const p = pred();
  const t = today();
  const d = state.days[t] || {};
  const name = firstName();
  const h = new Date().getHours();
  const greet = `<p class="greet">${h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'}${name ? ', ' + esc(name) : ''}</p>`;
  if (!p.hasData) {
    return `${greet}
      <section class="hero empty">
        <h2 class="display">Empecemos por aquí</h2>
        <p>Dinos cuándo empezó tu última regla y Marea calcula el resto.</p>
        <button class="btn light" data-action="period-today">Me ha bajado hoy</button>
        <button class="btn ghost-light" data-action="goto" data-value="cal">Me bajó otro día</button>
      </section>`;
  }
  const [big, small] = heroText(p);
  const fert = fertilityOn(t, p);
  const fertLabel = { alta: 'Fertilidad alta', media: 'Fertilidad media', baja: 'Fertilidad baja' }[fert];
  const s = p.stats;
  const goalCard = (() => {
    if (p.lateDays > 0 || isHormonal(state.settings.contra)) return '';
    const range = `${fShort(p.fertileStart)} – ${fShort(p.fertileEnd)}`;
    if (state.settings.goal === 'buscar')
      return `<section class="card goal"><p class="eyebrow">Buscando embarazo</p><h3>Tus mejores días: ${fShort(addDays(p.ovulation, -2))} – ${fShort(p.ovulation)}</h3>
        <p class="small muted">Ventana fértil completa: ${range}. Relaciones cada 1–2 días en esa ventana. Si llevas 12 meses buscando (6 si tienes más de 35), consulta.</p></section>`;
    if (state.settings.goal === 'evitar')
      return `<section class="card goal warn"><p class="eyebrow">Evitando embarazo</p><h3>Más riesgo del ${range}</h3>
        <p class="small muted">Usa siempre protección. Contar días no es un anticonceptivo fiable: ningún día es 100 % seguro.</p></section>`;
    return '';
  })();

  const hormonal = isHormonal(state.settings.contra);
  const periodBlock = p.inPeriod
    ? `<section class="card"><h3>¿Cómo va hoy?</h3>
         <div class="chips wrap">${C.FLOWS.map((f) => chip('flow-today', f.v, flowLabel(f), d.flow === f.v)).join('')}${chip('flow-today', 0, 'Ya no', d.flow === 0)}</div></section>`
    : '<button class="btn primary big" data-action="period-today">Me ha bajado hoy</button>';

  const logged = [
    d.flow > 0 && C.FLOWS.find((f) => f.v === d.flow)?.label,
    d.sex && (d.sex === 'sin' ? 'Relaciones sin protección' : 'Relaciones con protección'),
    d.symptoms?.length && plural(d.symptoms.length, 'síntoma', 'síntomas'),
    d.mood?.length && d.mood.map((m) => C.MOODS.find((x) => x[0] === m)?.[1].split(' ')[0]).join(''),
    d.discharge && `Flujo: ${C.dischargeLabel(d.discharge).toLowerCase()}`,
    d.factors?.length && d.factors.map((f) => C.FACTORS.find((x) => x[0] === f)?.[1]).join(' '),
    d.test && `Test ${d.test}`,
  ].filter(Boolean);

  return `
    ${greet}
    <section class="hero">
      <div class="hero-top">
        <div><div class="display big">${big}</div><div class="hero-sub">${small}</div></div>
        <div class="hero-day"><b>${p.cycleDay}</b><span>día del ciclo</span></div>
      </div>
      ${tide(p)}
      <div class="tide-legend"><span><i class="lg-p"></i>Regla</span><span><i class="lg-f"></i>Fértil</span><span><i class="lg-o"></i>Ovulación</span><span><i class="lg-t"></i>Hoy</span></div>
      <div class="hero-foot">
        ${hormonal ? `<span class="pill">Con ${CONTRA[state.settings.contra.method].name.toLowerCase()}</span>` : p.lateDays ? '' : `<span class="pill ${fert}">${fertLabel}</span>`}
        ${p.ovulationSource ? `<span class="pill confirmed">Ovulación confirmada (${p.ovulationSource === 'lh' ? 'test' : 'temperatura'})</span>` : ''}
        ${!p.inPeriod && !p.lateDays ? `<span>Próxima: ${fShort(p.nextStart)}${s.confidence !== 'alta' ? ' (aprox.)' : ` ±${s.variability}`}</span>` : ''}
      </div>
    </section>
    ${contraCard()}
    ${calmCard(p)}
    ${periodBlock}
    <div class="quick">
      ${chip('quick-sex', 'protegido', 'Relaciones con protección', d.sex === 'protegido')}
      ${chip('quick-sex', 'sin', 'Relaciones sin protección', d.sex === 'sin')}
    </div>
    ${logged.length ? `<button class="logged" data-action="open-day" data-value="${t}"><span><b>Hoy has apuntado:</b> ${logged.join(' · ')}</span><span class="link">Editar</span></button>`
      : '<p class="hint">Toca <b>＋</b> abajo para apuntar síntomas, ánimo, flujo o lo que quieras.</p>'}
    ${bodyCard(p)}
    ${goalCard}
    ${musicCard(p, d)}`;
}

function contraCard() {
  const st = contraStatus(state.settings.contra, state.days, today(), new Date().getHours());
  if (!st) return '';
  return `
    <section class="card contra ${st.tone}">
      <p class="eyebrow">Tu anticonceptivo</p>
      <h3>${st.title}</h3>
      <p class="small">${st.detail}</p>
      <div class="row-actions">
        ${st.canMark ? `<button class="btn ${st.marked ? 'soft' : 'primary'} small inline" data-action="pill-taken">${st.marked ? 'Desmarcar' : 'Ya me la he tomado'}</button>` : ''}
        ${st.missed ? '<button class="link" data-action="goto" data-value="salud:embarazo">¿Necesito la píldora del día después?</button>' : ''}
        ${st.needsSetup ? '<button class="link" data-action="goto" data-value="salud:anticonceptivo">Configurar</button>' : ''}
      </div>
    </section>`;
}

/** «Hoy en tu cuerpo»: fase, flujo esperado y tus síntomas habituales, todo en una tarjeta. */
function bodyCard(p) {
  const phase = C.PHASES[phaseOf(p)];
  const stage = C.FLOW_STAGES[dischargeStage(p)];
  const usual = state.settings.usual || [];
  const soon = usual.length && (p.inPeriod || (p.lateDays === 0 && p.daysUntil <= 4));
  const name = (k) => C.SYMPTOMS.find((x) => x[0] === k)?.[1];
  return `
    <section class="card body-card">
      <p class="eyebrow">Hoy en tu cuerpo</p>
      <h3>${phase.name}</h3>
      <p>${phase.text}</p>
      ${plain(phase.plain)}
      ${isHormonal(state.settings.contra) ? '<p class="note">Con tu anticonceptivo hormonal normalmente no ovulas: el sangrado es «de privación» y los días fértiles calculados no aplican.</p>' : ''}
      <div class="mini-row" data-action="goto" data-value="salud:flujo" role="button" tabindex="0">
        <span class="mini-ic">💧</span>
        <span><b>Flujo normal ahora</b><span class="muted small">${stage.normal}</span></span>
        <span class="chev">›</span>
      </div>
      ${soon ? `<div class="mini-row static">
        <span class="mini-ic">📌</span>
        <span><b>${p.inPeriod ? 'Estos días' : 'Se acerca tu regla'}: sueles tener ${usual.map(name).filter(Boolean).join(', ').toLowerCase()}</b>
        ${usual.filter((k) => C.SYMPTOM_TIPS[k]).slice(0, 2).map((k) => `<span class="muted small">${name(k)}: ${C.SYMPTOM_TIPS[k]}</span>`).join('')}</span>
      </div>` : ''}
      <button class="link left" data-action="goto" data-value="ciclo:fases">Entender las 4 fases de tu ciclo →</button>
    </section>`;
}

// ---------- Calendario ----------
function viewCal() {
  const p = pred();
  const [y, m] = ui.month.split('-').map(Number);
  const offset = (fromKey(`${ui.month}-01`).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const t = today();
  let cells = '';
  for (let i = 0; i < offset; i++) cells += '<div></div>';
  for (let i = 1; i <= daysInMonth; i++) {
    const k = `${ui.month}-${String(i).padStart(2, '0')}`;
    const mk = dayMarks(k, state.days, p);
    const cls = [mk.period && 'period', mk.spotting && 'spot', mk.predictedPeriod && 'pred', mk.fertile && 'fertile', mk.ovulation && 'ov', k === t && 'today', k > t && 'future'].filter(Boolean).join(' ');
    const dots = [mk.sex && `<i class="dot ${mk.sex === 'sin' ? 'sex' : 'safe'}"></i>`, mk.test === 'positivo' && '<i class="dot test"></i>', mk.hasLog && '<i class="dot log"></i>'].filter(Boolean).join('');
    cells += `<button class="cell ${cls}" data-action="open-day" data-value="${k}" aria-label="${fLong(k)}"><span>${i}</span><em>${dots}</em></button>`;
  }
  return `
    <section class="card cal">
      <div class="row-between cal-head">
        <button class="icon-btn" data-action="month" data-value="-1" aria-label="Mes anterior">‹</button>
        <h2 class="display">${fMonth(ui.month)}</h2>
        <button class="icon-btn" data-action="month" data-value="1" aria-label="Mes siguiente">›</button>
      </div>
      <div class="grid wd">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x) => `<div>${x}</div>`).join('')}</div>
      <div class="grid days">${cells}</div>
      ${ui.month !== t.slice(0, 7) ? '<button class="btn soft small" data-action="month-today">Volver a hoy</button>' : ''}
    </section>
    <div class="legend">
      <span><i class="lg period"></i>Regla</span><span><i class="lg pred"></i>Prevista</span><span><i class="lg fertile"></i>Fértil</span>
      <span><i class="lg ov"></i>Ovulación</span><span><i class="dot sex"></i>Sin protección</span><span><i class="dot safe"></i>Con protección</span>
    </div>
    <p class="muted small center">Toca un día para apuntar o corregir.</p>`;
}

// ---------- Pregunta (asistente) ----------
function viewPregunta() {
  const msgs = ui.chat.length
    ? ui.chat.map((m) => m.from === 'me'
      ? `<div class="msg me">${esc(m.text)}</div>`
      : `<div class="msg bot">${m.typing ? '<span class="typing"><i></i><i></i><i></i></span>' : m.html}
          ${m.actions?.length ? `<div class="msg-actions">${m.actions.map((a) => `<button class="chip small" data-action="${a.action}" data-value="${esc(a.value)}">${a.label} →</button>`).join('')}</div>` : ''}
          ${m.suggestions?.length ? `<div class="msg-actions">${m.suggestions.map((q) => `<button class="chip small" data-action="ask" data-value="${esc(q)}">${q}</button>`).join('')}</div>` : ''}
        </div>`).join('')
    : `<div class="chat-empty">
        <div class="orb"></div>
        <h2 class="display">Pregúntame lo que quieras</h2>
        <p class="muted">Sobre tu ciclo, sexo, embarazo, infecciones o cuándo ir al médico. Sin juicios.</p>
        <div class="chips wrap center">${SUGGESTIONS.map((q) => chip('ask', q, q, false)).join('')}</div>
      </div>`;
  return `
    <div class="chat">${msgs}</div>
    <form class="composer" data-submit="ask">
      <input id="ask-input" type="text" autocomplete="off" placeholder="Escribe tu pregunta…" value="${esc(ui.chatDraft)}" aria-label="Tu pregunta" />
      <button type="submit" class="send" aria-label="Enviar">${icon('send')}</button>
    </form>
    <p class="disclaimer">Marea responde con información general y con tus datos, sin conexión: tus preguntas no salen del móvil. No sustituye a una consulta médica.</p>`;
}

const scrollChat = () => requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

function ask(text) {
  text = String(text || '').trim();
  if (!text) return;
  ui.chat.push({ from: 'me', text });
  const bot = { from: 'bot', typing: true };
  ui.chat.push(bot);
  ui.chatDraft = '';
  render();
  scrollChat();
  const r = answer(text, { pred: pred(), today: today(), name: firstName() });
  setTimeout(() => {
    Object.assign(bot, { typing: false, html: r.html, actions: r.actions, suggestions: r.suggestions });
    if (ui.tab === 'pregunta') { render(); scrollChat(); }
  }, 450 + Math.min(600, text.length * 10));
}

// ---------- Mi ciclo ----------
function viewCiclo() {
  const body = { calendario: viewCal, fases: viewFases, resumen: viewResumen }[ui.ciclo]();
  return `<h2 class="display page-title">Mi ciclo</h2>${seg('ciclo-tab', ui.ciclo, [['calendario', 'Calendario'], ['fases', 'Fases'], ['resumen', 'Resumen']])}${body}`;
}

function viewResumen() {
  const p = pred();
  if (!p.hasData) return '<p class="note">Cuando apuntes tu primera regla verás aquí tus medias, tus próximas reglas y el informe para tu médica.</p>';
  const s = p.stats;
  return `
    <section class="card stats">
      <div><b>${s.cycleLen}</b><span>días de ciclo</span></div>
      <div><b>${s.periodLen}</b><span>días de regla</span></div>
      <div><b>${s.periods.length}</b><span>reglas apuntadas</span></div>
    </section>
    ${s.irregular ? `<p class="note">Tus ciclos varían ${s.range} días entre sí, así que las predicciones serán menos exactas. Si es algo nuevo, coméntalo en tu próxima consulta.</p>` : ''}
    ${s.confidence === 'baja' ? '<p class="note">Las predicciones mejoran a partir de 2 o 3 reglas apuntadas.</p>' : ''}
    ${p.cycles.length ? `<section class="card"><h3>Próximas reglas</h3><ul class="list">${p.cycles.slice(0, 3).map((c) => `<li><span>${cap(fLong(c.periodStart))}</span><span class="muted">fértil ${fShort(c.fertileStart)}–${fShort(c.fertileEnd)}</span></li>`).join('')}</ul></section>` : ''}
    ${viewInforme()}`;
}

// ---------- Salud: un índice claro y una página para cada tema ----------
const SALUD = [
  { group: 'Tengo una duda', items: [
    ['embarazo', '🤰', '¿Puedo estar embarazada?', 'Riesgo, píldora del día después y test'],
    ['retraso', '⏳', 'No me baja la regla', 'Por qué pasa y qué hacer'],
    ['medico', '🚦', '¿Voy al médico?', 'Urgencias, cita o casa'],
  ] },
  { group: 'Mi cuerpo', items: [
    ['flujo', '💧', 'Tu flujo', 'Qué es normal en cada momento'],
    ['dolor', '♨️', 'Dolor de regla', 'Qué es normal y qué funciona'],
    ['infecciones', '🔬', 'Infecciones', 'Candidiasis, cistitis, ITS…'],
  ] },
  { group: 'Anticoncepción y fertilidad', items: [
    ['anticonceptivo', '💊', 'Mi anticonceptivo', 'Píldora, anillo, DIU… y avisos'],
    ['fertilidad', '🌡️', 'Temperatura y tests', 'Confirma cuándo ovulas'],
  ] },
  { group: 'Cuidarme', items: [
    ['higiene', '🧼', 'Higiene íntima', 'Consejos y productos para la regla'],
    ['marcas', '🏷️', 'Qué marcas comprar', 'Según análisis independientes'],
    ['musica', '🎧', 'Música', 'Playlists para cada momento'],
  ] },
];
const SALUD_PAGES = {
  embarazo: () => viewEmbarazo(), retraso: () => viewRetraso(), medico: () => viewMedico(), flujo: () => viewFlujo(),
  anticonceptivo: () => viewAnticonceptivo(), fertilidad: () => viewFertilidad(),
  dolor: () => viewDolor(), infecciones: () => viewInfecciones(), higiene: () => viewHigiene(), marcas: () => viewMarcas(), musica: () => viewMusica(),
};

function viewSalud() {
  if (ui.page && SALUD_PAGES[ui.page]) {
    const item = SALUD.flatMap((g) => g.items).find((i) => i[0] === ui.page);
    return `
      <div class="report-head"><button class="icon-btn" data-action="salud-home" aria-label="Volver a Salud">${icon('back')}</button><h2 class="display">${item[2]}</h2></div>
      ${SALUD_PAGES[ui.page]()}`;
  }
  return `
    <h2 class="display page-title">Salud</h2>
    <p class="intro">Todo lo que te puede preocupar, ordenado. Toca un tema.</p>
    ${SALUD.map((g) => `
      <h3 class="group-title">${g.group}</h3>
      <div class="tiles">${g.items.map(([id, e, t, d]) => `<button class="tile" data-action="goto" data-value="salud:${id}"><span class="tile-e">${e}</span><b>${t}</b><span class="muted small">${d}</span></button>`).join('')}</div>`).join('')}
    <button class="card ask" data-action="goto" data-value="pregunta">
      <span class="ask-ic">${icon('chat')}</span>
      <span><b>¿No encuentras lo que buscas?</b><span class="muted small">Pregúntaselo a Marea con tus palabras.</span></span>
    </button>`;
}

const CONTRA_START = {
  pildora: 'Primer día del blíster actual', anillo: 'Día que te pusiste el anillo actual', parche: 'Día que te pusiste el primer parche del ciclo',
  inyeccion: 'Fecha de la última inyección', implante: 'Fecha en que te lo pusieron', diu_hormonal: 'Fecha en que te lo pusieron', diu_cobre: 'Fecha en que te lo pusieron',
};

function viewAnticonceptivo() {
  const c = state.settings.contra || { method: 'ninguno' };
  const m = CONTRA[c.method];
  const st = contraStatus(c, state.days, today(), new Date().getHours());
  return `
    ${st ? contraCard() : ''}
    <section class="card">
      <h3>¿Qué usas?</h3>
      <div class="radios">${Object.entries(CONTRA).map(([v, x]) => `<label class="radio ${c.method === v ? 'on' : ''}"><input type="radio" name="contra" value="${v}" ${c.method === v ? 'checked' : ''} data-change="contra-method"/>${x.name}</label>`).join('')}</div>
      ${CONTRA_START[c.method] ? `
        <label class="label" for="contra-start">${CONTRA_START[c.method]}</label>
        <input type="date" id="contra-start" value="${c.start || ''}" max="${today()}" data-change="contra-start" />` : ''}
      ${c.method === 'pildora' ? `
        <p class="label">Tipo de blíster</p>
        <div class="chips">${chip('contra-set', '21', '21 pastillas + 7 de descanso', c.pillType !== '28', 'data-key="pillType"')}${chip('contra-set', '28', '28 pastillas seguidas', c.pillType === '28', 'data-key="pillType"')}</div>
        <p class="label">¿A qué hora te la tomas?</p>
        <div class="stepper-row"><span>${c.hour ?? 22}:00</span>${stepper('hour', c.hour ?? 22, 'contra-hour')}</div>` : ''}
      ${m.device ? `
        <p class="label">¿Cuántos años dura el tuyo?</p>
        <div class="stepper-row"><span>${Number(c.years) || m.years} años</span>${stepper('years', Number(c.years) || m.years, 'contra-years')}</div>
        <p class="small muted">Míralo en tu informe o pregunta en tu centro de salud: depende del modelo.</p>` : ''}
    </section>
    ${m.hormonal ? `<section class="card"><h3>Ojo con las predicciones</h3><p>Los anticonceptivos hormonales suelen impedir la ovulación, así que el sangrado que tienes no es una regla de verdad (es un sangrado «de privación») y los días fértiles calculados no aplican.</p>${plain('Mientras lo uses bien, Marea te sirve para apuntar y para los avisos, pero no para saber cuándo eres fértil.')}</section>` : ''}
    <p class="note">Marea te avisa cuando abres la app. Para no olvidarte nunca de la píldora, ponte también una alarma diaria en el móvil.</p>
    ${disclaimer('Sigue siempre el prospecto de tu método: manda sobre cualquier consejo general.')}`;
}

/** Gráfico de temperatura basal del ciclo en curso. */
function tempChart(p) {
  const pts = Object.keys(state.days).filter((k) => k >= p.last.start && typeof state.days[k].temp === 'number').sort().map((k) => [diffDays(p.last.start, k) + 1, state.days[k].temp]);
  if (pts.length < 2) return '<p class="muted small">Cuando apuntes al menos dos temperaturas verás aquí tu gráfica.</p>';
  const N = Math.max(p.stats.cycleLen, pts[pts.length - 1][0]);
  const vals = pts.map((x) => x[1]);
  const lo = Math.min(...vals) - 0.1, hi = Math.max(...vals) + 0.1;
  const X = (d) => 44 + ((d - 1) / (N - 1)) * 268;
  const Y = (v) => 100 - ((v - lo) / (hi - lo || 1)) * 86;
  const ov = p.ovulationSource ? diffDays(p.last.start, p.ovulation) + 1 : null;
  return `<svg viewBox="0 0 320 118" class="temp-chart" role="img" aria-label="Gráfica de temperatura basal">
    ${ov ? `<line x1="${X(ov)}" x2="${X(ov)}" y1="6" y2="104" class="tc-ov"/>` : ''}
    <polyline points="${pts.map(([d, v]) => `${X(d)},${Y(v)}`).join(' ')}" class="tc-line"/>
    ${pts.map(([d, v]) => `<circle cx="${X(d)}" cy="${Y(v)}" r="3.5" class="tc-dot"/>`).join('')}
    <text x="2" y="10" class="hx hx-l">${hi.toFixed(1).replace('.', ',')} °C</text><text x="2" y="114" class="hx hx-l">${lo.toFixed(1).replace('.', ',')} °C</text>
  </svg>`;
}

function viewFertilidad() {
  const p = pred();
  const status = !p.hasData ? '' : p.ovulationSource
    ? `<section class="card result ok"><p class="eyebrow">Este ciclo</p><h3>Ovulación confirmada hacia el ${fShort(p.ovulation)}</h3><p>Detectada por ${p.ovulationSource === 'lh' ? 'tu test de ovulación positivo' : 'la subida de tu temperatura'}. Con esto, tu próxima regla debería llegar hacia el <b>${fShort(p.nextStart)}</b>.</p>${plain('Ya no es una estimación: tu cuerpo te ha dicho cuándo ovulaste. Las predicciones de este ciclo son mucho más fiables.')}</section>`
    : `<section class="card"><p class="eyebrow">Este ciclo</p><h3>Aún no se ha detectado la ovulación</h3><p class="small muted">Ahora mismo es una estimación (hacia el ${fShort(p.ovulation)}). Apunta temperaturas o tests y Marea la confirmará.</p></section>`;
  return `
    <p class="intro">El calendario solo estima cuándo ovulas. Con la temperatura basal o los tests de ovulación, Marea lo confirma y afina tus predicciones.</p>
    ${status}
    ${p.hasData ? `<section class="card"><h3>Tu temperatura este ciclo</h3>${tempChart(p)}<button class="btn soft small" data-action="log-today">Apuntar la de hoy</button></section>` : ''}
    <section class="card"><h3>🌡️ Temperatura basal</h3>
      <p>Después de ovular, la progesterona sube tu temperatura en reposo unos 0,2–0,5 °C y se queda alta hasta la regla. Cuando hay 3 días seguidos por encima de los 6 anteriores, se da por confirmada la ovulación.</p>
      ${plain('Si te tomas la temperatura cada mañana, verás un escalón hacia arriba: ese escalón es la prueba de que ya has ovulado.')}
      <ul class="bullets"><li>Al despertar, antes de levantarte, hablar o beber nada</li><li>Siempre a la misma hora y con el mismo termómetro (mejor uno basal, con dos decimales)</li><li>Fiebre, alcohol o dormir menos de 3 h la falsean: apúntalo en notas</li></ul></section>
    <section class="card"><h3>🧪 Tests de ovulación</h3>
      <p>Detectan el pico de la hormona LH en la orina, que ocurre 24–36 h antes de ovular. Por eso avisan <b>antes</b>, a diferencia de la temperatura.</p>
      ${plain('Es como un test de embarazo pero para saber cuándo vas a ovular. Si sale positivo, tus próximos 2 días son los más fértiles.')}
      <ul class="bullets"><li>Empieza unos 17 días antes de tu próxima regla${p.hasData ? ` (en tu caso, hacia el ${fShort(addDays(p.nextStart, -17))})` : ''}</li><li>Mejor por la tarde y sin beber mucho líquido las 2 h anteriores</li><li>Positivo = la línea del test es igual o más oscura que la de control</li></ul></section>
    <p class="note">Ni la temperatura ni los tests de ovulación son anticonceptivos. Sirven sobre todo si buscas embarazo o quieres conocer mejor tu ciclo.</p>
    ${disclaimer()}`;
}

function viewFlujo() {
  const p = pred();
  const cur = dischargeStage(p);
  const order = ['menstrual', 'post', 'cremoso', 'ovulacion', 'lutea', 'premenstrual'];
  return `
    <p class="intro">El flujo cambia a lo largo del ciclo y casi siempre es señal de que todo va bien. Esto es lo normal en cada momento.</p>
    ${cur ? `<section class="card result mid"><p class="eyebrow">Ahora mismo · ${C.FLOW_STAGES[cur].name}</p><h3>Lo normal hoy</h3><p>${C.FLOW_STAGES[cur].normal}</p>${plain(C.FLOW_STAGES[cur].plain)}<p class="small"><b>Míratelo si:</b> ${C.FLOW_STAGES[cur].check}</p></section>` : ''}
    <h3 class="section-title">A lo largo del ciclo</h3>
    ${order.map((id) => { const st = C.FLOW_STAGES[id]; return `
      <article class="card flow-stage ${id === cur ? 'current' : ''}">
        <div class="row-between"><h3>${st.name}</h3>${id === cur ? '<span class="here">Estás aquí</span>' : ''}</div>
        <p>${st.normal}</p>
        <p class="small muted"><b>Míratelo si:</b> ${st.check}</p>
      </article>`; }).join('')}
    <h3 class="section-title">Cuándo no es normal</h3>
    ${plain(C.FLOW_ALERTS_PLAIN)}
    ${C.FLOW_ALERTS.map((a) => `
      <section class="card row-card alert-row">
        <span class="row-ic">⚠️</span>
        <span><b>${a.title}</b><span class="muted small">${a.maybe}</span>
        ${a.infection ? `<button class="link left" data-action="open-inf" data-value="${a.infection}">Ver qué hacer →</button>` : '<button class="link left" data-action="goto" data-value="salud:medico">¿Voy al médico? →</button>'}</span>
      </section>`).join('')}
    ${disclaimer()}`;
}

function viewEmbarazo() {
  const p = pred();
  const t = today();
  const recent = Object.keys(state.days).filter((k) => state.days[k].sex === 'sin' && diffDays(k, t) >= 0 && diffDays(k, t) <= 30).sort().reverse();
  const q = ui.preg;
  let result = '';
  if (q.done && q.method) {
    const r = pregnancyRisk({ sexDate: q.date, method: q.method }, p);
    const rt = C.RISK_TEXT[r.level];
    const status = (ok, label, detail) => `<li class="${ok ? 'ok' : 'off'}"><b>${ok ? 'A tiempo' : 'Fuera de plazo'} · ${label}</b><span>${detail}</span></li>`;
    result = `
      <section class="card result ${rt.tone}"><p class="eyebrow">Resultado</p><h3>${rt.title}</h3><p>${rt.text}</p>${plain(rt.plain)}
        ${r.fertility !== 'desconocida' && r.level !== 'muy_baja' ? `<p class="small muted">Ese día tu fertilidad estimada era <b>${r.fertility}</b>.</p>` : ''}</section>
      ${r.needsEmergency ? `
      <section class="card"><h3>Anticoncepción de urgencia</h3>
        <p class="small muted">Han pasado unas ${r.hoursSince} h. Cuanto antes, más eficaz.</p>
        <ul class="ec">
          ${status(r.pillLevonorgestrel, 'Píldora de levonorgestrel', 'Hasta 72 h. En farmacia, sin receta.')}
          ${status(r.pillUlipristal, 'Píldora de ulipristal (ellaOne)', 'Hasta 120 h (5 días). Más eficaz que la anterior. Sin receta.')}
          ${status(r.iud, 'DIU de cobre', 'Hasta 5 días. El método más eficaz (>99 %). Pide cita urgente en tu centro de salud o de planificación familiar.')}
        </ul>
        ${!r.pillUlipristal ? '<p class="small">Ya no estás en plazo para la urgencia: hazte un test en la fecha de abajo.</p>' : ''}
        <p class="small muted">Si vomitas en las 3 h siguientes a tomarla, necesitas otra dosis. Si pesas más de 85 kg, el levonorgestrel puede ser menos eficaz: pregunta en la farmacia.</p>
      </section>` : ''}
      <section class="card"><h3>Cuándo hacerte el test</h3>
        <p>A partir del <b>${fLong(r.testDate)}</b>${r.testDate !== r.testFrom21 ? ` (el día que te toca la regla). Si sale negativo y sigue sin bajarte, repítelo el ${fShort(r.testFrom21)}` : ' (21 días después de la relación)'}.</p>
        <button class="btn soft small" data-action="open-day" data-value="${t}">Apuntar el resultado de un test</button>
        <button class="btn soft small" data-action="goto" data-value="salud:marcas">Qué test comprar</button>
      </section>`;
  }
  return `
    <section class="card">
      <h3>¿Puedo estar embarazada?</h3>
      <p class="muted small">Dos preguntas y te decimos el riesgo, si llegas a tiempo de la píldora del día después y cuándo hacerte el test.</p>
      ${recent.length ? `<p class="label">Relaciones sin protección que apuntaste</p><div class="chips">${recent.map((k) => chip('preg-date', k, fShort(k), q.date === k)).join('')}</div>` : ''}
      <label class="label" for="preg-date">¿Cuándo fue?</label>
      <input type="date" id="preg-date" value="${q.date}" max="${t}" data-change="preg-date" />
      <p class="label">¿Qué pasó?</p>
      <div class="radios">${C.METHODS.map(([v, l]) => `<label class="radio ${q.method === v ? 'on' : ''}"><input type="radio" name="m" value="${v}" ${q.method === v ? 'checked' : ''} data-change="preg-method"/>${l}</label>`).join('')}</div>
      <button class="btn primary" data-action="preg-go" ${q.method ? '' : 'disabled'}>Ver resultado</button>
    </section>
    ${result}
    <section class="card"><h3>Dudas frecuentes</h3>${C.PREGNANCY_FAQ.map(([qq, a]) => `<details><summary>${qq}</summary><p>${a}</p></details>`).join('')}</section>
    ${disclaimer()}`;
}

function viewRetraso() {
  const p = pred();
  let header = '';
  if (p.hasData && p.lateDays > 0) {
    const unprotected = Object.keys(state.days).filter((k) => state.days[k].sex === 'sin' && k >= addDays(p.last.start, -5));
    const neg = Object.keys(state.days).find((k) => state.days[k].test === 'negativo' && k > p.nextStart);
    header = `<section class="card result warn"><p class="eyebrow">Tu caso</p>
      <h3>${plural(p.lateDays, 'día', 'días')} de retraso</h3>
      <p>Te tocaba el ${fShort(p.nextStart)}.${p.stats.variability > 2 ? ` Tus ciclos suelen variar ±${p.stats.variability} días.` : ''}</p>
      ${unprotected.length ? `<p><b>Apuntaste relaciones sin protección este ciclo (${unprotected.map(fShort).join(', ')}).</b> Lo primero: hazte un test de embarazo.</p>` : ''}
      ${neg ? `<p>Tu test del ${fShort(neg)} salió negativo. Si sigue sin bajarte, repítelo en 3–5 días.</p>` : ''}
    </section>`;
  } else if (p.hasData) {
    header = `<p class="note">Ahora mismo no tienes retraso${p.inPeriod ? '' : `: tu regla se espera el ${fShort(p.nextStart)}`}.</p>`;
  }
  return `
    ${header}
    ${calmCard(p)}
    <section class="card"><h3>Causas más frecuentes</h3>
      <p class="muted small">Un ciclo normal dura entre 21 y 35 días, y variar unos días de un mes a otro es lo habitual.</p>
      ${C.LATE_CAUSES.map(([e, t, d]) => `<details><summary>${e} ${t}</summary><p>${d}</p></details>`).join('')}</section>
    <section class="card"><h3>¿Te has ido de viaje o has tenido estrés?</h3>
      <p class="muted small">Apúntalo en el día («¿Algo diferente estos días?») y Marea te lo recordará si tu regla se mueve.</p>
      ${C.FACTORS.slice(0, 5).map(([, l, d]) => `<details><summary>${l}</summary><p>${d}</p></details>`).join('')}</section>
    <section class="card result warn"><h3>Pide cita si…</h3><ul class="bullets">${C.LATE_DOCTOR.map((x) => `<li>${x}</li>`).join('')}</ul></section>
    ${disclaimer()}`;
}

function viewMedico() {
  return `
    <p class="intro">¿Esto es para ir al médico o se pasa solo? Busca tu caso en el semáforo.</p>
    ${C.TRIAGE.map((g) => `
      <section class="card triage ${g.level}">
        <h3><span class="light"></span>${g.title}</h3>
        ${plain(g.plain)}
        <ul class="bullets">${g.items.map((i) => `<li>${i}</li>`).join('')}</ul>
        ${g.level === 'urgente' ? '<a class="btn danger small" href="tel:112">Llamar al 112</a>' : ''}
      </section>`).join('')}
    <h3 class="section-title">Revisiones que te tocan</h3>
    ${C.CHECKUPS.map(([e, t, d]) => rowCard(e, t, d)).join('')}
    <button class="btn soft" data-action="goto" data-value="ciclo:resumen">Preparar informe para la consulta</button>
    ${disclaimer('Ante la duda, consulta. Teléfono de urgencias: 112.')}`;
}


function infCard(inf, score) {
  const open = ui.openInf === inf.id;
  return `
    <article class="card inf ${open ? 'open' : ''}">
      <button class="inf-head" data-action="toggle-inf" data-value="${inf.id}" aria-expanded="${open}">
        <span class="inf-emoji">${inf.emoji}</span>
        <span class="inf-title"><b>${inf.name}</b>${score != null ? `<span class="bar"><i style="width:${Math.round(score * 100)}%"></i></span><span class="muted small">Encaje ${Math.round(score * 100)} %</span>` : `<span class="muted small">${inf.summary.split('.')[0]}.</span>`}</span>
        <span class="chev">${open ? '−' : '+'}</span>
      </button>
      ${open ? `<div class="inf-body">
          <p>${inf.summary}</p>
          ${plain(inf.plain)}
          <p class="label">Síntomas típicos</p><ul class="bullets">${Object.keys(inf.symptoms).map((k) => `<li>${C.INFECTION_SYMPTOMS.find((x) => x[0] === k)?.[1]}</li>`).join('')}</ul>
          <p class="label">Por qué aparece</p><p>${inf.causes}</p>
          <p class="label">Qué hacer</p><ul class="bullets">${inf.treatment.map((x) => `<li>${x}</li>`).join('')}</ul>
          <p class="label">Productos útiles</p><div class="tags">${inf.products.map((x) => `<span class="tag">${x}</span>`).join('')}</div>
          <p class="doctor"><b>Consulta:</b> ${inf.doctor}</p>
        </div>` : ''}
    </article>`;
}

function viewInfecciones() {
  const sel = [...ui.symptoms];
  const matches = C.matchInfections(sel);
  return `
    <section class="card"><h3>¿Qué me pasa ahí abajo?</h3>
      <p class="muted small">Marca lo que notas y te decimos con qué encaja.</p>
      <div class="chips wrap">${C.INFECTION_SYMPTOMS.map(([k, l]) => chip('sym', k, l, ui.symptoms.has(k))).join('')}</div>
      ${sel.length ? '<button class="btn soft small" data-action="sym-clear">Borrar selección</button>' : ''}
    </section>
    ${sel.length ? `
      <div class="redflags">Ve a urgencias o pide cita hoy si además tienes: ${C.RED_FLAGS.join(' · ').toLowerCase()}.</div>
      <h3 class="section-title">Encaja con</h3>
      ${matches.length ? matches.map((m) => infCard(m.inf, m.score)).join('') : '<p class="note">Con esos síntomas no encontramos coincidencias claras. Si algo te preocupa, consulta.</p>'}
      ${disclaimer('Orientativo, no es un diagnóstico. Varias infecciones se parecen y solo una exploración o un análisis lo confirman.')}`
    : `<h3 class="section-title">Todas las infecciones</h3>${C.INFECTIONS.map((i) => infCard(i)).join('')}${disclaimer()}`}`;
}

function viewDolor() {
  return `
    <section class="card"><h3>¿Es normal mi dolor?</h3>
      <p class="label">Normal</p><ul class="bullets">${C.PAIN.normal.map((x) => `<li>${x}</li>`).join('')}</ul>
      <p class="label">No es normal</p><ul class="bullets">${C.PAIN.notNormal.map((x) => `<li>${x}</li>`).join('')}</ul>
      <p class="doctor">${C.PAIN.endo}</p>
      ${plain(C.PAIN.plain)}
    </section>
    <h3 class="section-title">Qué funciona</h3>
    ${C.PAIN.remedies.map(([e, t, d]) => rowCard(e, t, d)).join('')}
    ${disclaimer()}`;
}

function viewHigiene() {
  return `
    <section class="tips">${C.HYGIENE.map(([e, t, d]) => `<div class="card tip"><div class="tip-e">${e}</div><b>${t}</b><p>${d}</p></div>`).join('')}</section>
    <h3 class="section-title">Productos para la regla</h3>
    ${C.PRODUCTS.map((p) => `<article class="card product"><div class="row-between"><h3>${p.name}</h3><span class="pill">${p.time}</span></div><p>${p.pros}</p><p class="muted">${p.cons}</p></article>`).join('')}
    <div class="redflags">${C.TSS}</div>
    <button class="btn soft" data-action="goto" data-value="salud:marcas">Ver qué marcas comprar</button>
    ${disclaimer()}`;
}

function viewMarcas() {
  return `
    <p class="intro">Elegidas por <b>análisis independientes</b> (sobre todo OCU), no por publicidad. Ninguna marca paga por salir aquí.</p>
    ${C.BRANDS.map((b) => `
      <article class="card brand">
        <div class="row-between"><h3>${b.cat}</h3><span class="src">${b.source}</span></div>
        <ul class="picks">${b.picks.map((pk, i) => `<li><span class="rank">${i + 1}</span><span><b>${pk.name}</b><span class="badge">${pk.badge}</span><span class="muted small">${pk.score}</span></span></li>`).join('')}</ul>
        <p class="small muted">${b.basis}</p>
        ${b.avoid ? `<p class="small"><b>Peor resultado:</b> ${b.avoid}</p>` : ''}
        ${b.tip ? `<p class="small"><b>Consejo:</b> ${b.tip}</p>` : ''}
      </article>`).join('')}
    <section class="card"><h3>Fuentes</h3><ul class="list">${C.BRAND_SOURCES.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a></li>`).join('')}</ul>
      <p class="small muted">Revisado en ${C.BRANDS_UPDATED}. Los modelos y precios cambian: comprueba la versión actual.</p></section>
    ${disclaimer()}`;
}

// ---------- Informe para el médico ----------
function viewInforme() {
  const p = pred();
  const periods = getPeriods(state.days).slice(-8);
  const rows = periods.map((per, i) => {
    const next = periods[i + 1];
    return `<tr><td>${fShort(per.start)}</td><td>${per.length} d</td><td>${next ? diffDays(per.start, next.start) + ' d' : '—'}</td></tr>`;
  }).join('');
  const since = addDays(today(), -180);
  const counts = {};
  for (const [k, d] of Object.entries(state.days)) if (k >= since) for (const s of d.symptoms || []) counts[s] = (counts[s] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const notes = Object.entries(state.days).filter(([k, d]) => k >= since && d.notes).sort().slice(-5);
  const symName = (k) => C.SYMPTOMS.find((s) => s[0] === k)?.[1] || k;
  return `
    <h3 class="section-title">Informe para tu médica</h3>
    <section class="card report">
      <p class="muted small">${esc(store.getAccount()?.name || '')} · generado el ${fLong(today())}</p>
      ${p.hasData ? `
      <div class="stats"><div><b>${p.stats.cycleLen}</b><span>ciclo medio (días)</span></div><div><b>${p.stats.periodLen}</b><span>regla media (días)</span></div><div><b>±${p.stats.variability}</b><span>variación</span></div></div>
      <p class="label">Últimas reglas</p>
      <table><thead><tr><th>Inicio</th><th>Duración</th><th>Ciclo</th></tr></thead><tbody>${rows}</tbody></table>
      ${p.lateDays ? `<p><b>Retraso actual:</b> ${plural(p.lateDays, 'día', 'días')}.</p>` : ''}` : '<p>Aún no hay reglas apuntadas.</p>'}
      <p class="label">Síntomas más frecuentes (6 meses)</p>
      <p>${top.length ? top.map(([k, n]) => `${symName(k)} (${n})`).join(', ') : 'Ninguno apuntado'}</p>
      ${state.settings.usual?.length ? `<p class="label">Síntomas habituales</p><p>${state.settings.usual.map(symName).join(', ')}</p>` : ''}
      ${notes.length ? `<p class="label">Notas recientes</p><ul class="bullets">${notes.map(([k, d]) => `<li>${fShort(k)}: ${esc(d.notes)}</li>`).join('')}</ul>` : ''}
    </section>
    <button class="btn primary" data-action="print">Imprimir o guardar en PDF</button>`;
}

// ---------- Fases del ciclo ----------
/** Curvas orientativas de las hormonas en un ciclo de 28 días. */
function hormoneChart() {
  const g = (d, mu, sd) => Math.exp(-((d - mu) ** 2) / (2 * sd * sd));
  const curves = {
    est: (d) => 0.12 + 0.78 * g(d, 13, 2.6) + 0.36 * g(d, 21, 3.4),
    prog: (d) => 0.06 + 0.82 * g(d, 21, 3.4),
    lh: (d) => 0.06 + 0.9 * g(d, 14, 0.8),
  };
  const X = (d) => 18 + ((d - 1) / 27) * 284;
  const Y = (v) => 104 - v * 88;
  const path = (f) => { let s = ''; for (let d = 1; d <= 28; d += 0.25) s += `${s ? 'L' : 'M'}${X(d).toFixed(1)},${Y(f(d)).toFixed(1)}`; return s; };
  return `
    <svg viewBox="0 0 320 126" class="hormones" role="img" aria-label="Gráfico: el estrógeno sube hasta la ovulación, la LH tiene un pico el día 14 y la progesterona domina la segunda mitad del ciclo">
      <rect x="${X(1)}" y="8" width="${X(5.5) - X(1)}" height="98" class="hb-p" rx="6"/>
      <rect x="${X(9)}" y="8" width="${X(15.5) - X(9)}" height="98" class="hb-f" rx="6"/>
      <path d="${path(curves.est)}" class="hc-est"/>
      <path d="${path(curves.prog)}" class="hc-prog"/>
      <path d="${path(curves.lh)}" class="hc-lh"/>
      ${[1, 7, 14, 21, 28].map((d) => `<text x="${X(d)}" y="121" class="hx">día ${d}</text>`).join('')}
    </svg>
    <div class="h-legend"><span><i class="hl-est"></i>Estrógeno</span><span><i class="hl-lh"></i>LH</span><span><i class="hl-prog"></i>Progesterona</span></div>`;
}

function viewFases() {
  const p = pred();
  const cur = p.hasData ? ({ retraso: 'lutea' }[phaseOf(p)] || phaseOf(p)) : null;
  let ranges = {}, bar = '';
  if (p.hasData) {
    const pl = Math.max(p.stats.periodLen, p.inPeriod ? p.last.length : 0);
    const periodEnd = addDays(p.last.start, pl - 1);
    const nextEnd = addDays(p.nextStart, -1);
    ranges = {
      menstrual: `Tu regla: ${fShort(p.last.start)} – ${fShort(periodEnd)}`,
      folicular: `${fShort(p.last.start)} – ${fShort(addDays(p.ovulation, -1))} (hasta que ovulas)`,
      fertil: `Hacia el ${fShort(p.ovulation)} · días fértiles: ${fShort(p.fertileStart)} – ${fShort(p.fertileEnd)}`,
      lutea: p.lateDays ? `Desde el ${fShort(addDays(p.ovulation, 1))}; tu regla va con retraso` : `${fShort(addDays(p.ovulation, 1))} – ${fShort(nextEnd)}`,
    };
    const N = Math.max(p.stats.cycleLen, p.cycleDay);
    const rel = (k) => diffDays(p.last.start, k) + 1;
    const segs = [
      ['menstrual', 1, pl, 'Regla'],
      ['folicular', pl + 1, rel(p.fertileStart) - 1, 'Folicular'],
      ['fertil', rel(p.fertileStart), rel(p.fertileEnd), 'Fértil'],
      ['lutea', rel(p.fertileEnd) + 1, N, 'Lútea'],
    ].filter(([, a, b]) => b >= a);
    bar = `
      <section class="card">
        <p class="eyebrow">Tu ciclo de ${p.stats.cycleLen} días</p>
        <div class="phase-bar">${segs.map(([id, a, b, l]) => `<div class="pb ${id} ${id === cur ? 'on' : ''}" style="flex:${b - a + 1}"><span>${l}</span></div>`).join('')}
          <i class="pb-today" style="left:${((Math.min(p.cycleDay, N) - 0.5) / N) * 100}%"></i></div>
        <p class="small muted">Hoy es el día ${p.cycleDay}: estás en <b>${{ menstrual: 'la regla', folicular: 'la fase folicular', fertil: 'la ovulación (días fértiles)', lutea: 'la fase lútea' }[cur]}</b>.</p>
      </section>`;
  }
  return `
    <p class="intro">Tu ciclo empieza el primer día de regla y termina el día antes de la siguiente. Por el camino, cuatro hormonas van cambiando y eso se nota en tu cuerpo, tu energía y tu humor.</p>
    ${bar}
    <section class="card"><h3>Cómo se mueven tus hormonas</h3>${hormoneChart()}</section>
    ${C.PHASE_GUIDE.map((g, i) => `
      <article class="card phase-card ${g.color} ${g.id === cur ? 'current' : ''}">
        <div class="row-between"><p class="eyebrow">Fase ${i + 1}</p>${g.id === cur ? '<span class="here">Estás aquí</span>' : ''}</div>
        <h3 class="display phase-name">${g.name}</h3>
        <p class="small muted">${ranges[g.id] || g.days}</p>
        <p>${g.what}</p>
        ${plain(g.plain)}
        <dl class="facts">
          <dt>Hormonas</dt><dd>${g.hormones}</dd>
          <dt>Tu cuerpo</dt><dd>${g.body}</dd>
          <dt>Energía y ánimo</dt><dd>${g.mood}</dd>
          <dt>Fertilidad</dt><dd>${g.fertility}</dd>
        </dl>
        <p class="label">Qué te ayuda</p>
        <ul class="bullets">${g.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
        <p class="label">Para escuchar · ${C.MUSIC_BY_PHASE[g.id].title}</p>
        <div class="playlists">${C.MUSIC_BY_PHASE[g.id].lists.slice(0, 2).map(playlistLink).join('')}</div>
      </article>`).join('')}
    <p class="note">¿Tu ciclo no dura 28 días? Es normal: lo que cambia casi siempre es la fase folicular (cuándo ovulas). La fase lútea dura casi siempre 12–14 días.</p>
    ${disclaimer()}`;
}

// ---------- Hojas ----------
function dischargeFeedback(k, v) {
  if (!v) return '';
  if (C.DISCHARGE_WARN.includes(v)) {
    const a = C.FLOW_ALERTS.find((x) => x.type === v);
    return `<div class="feedback warn"><b>Esto no es un flujo típico.</b> ${a ? a.maybe : 'Si pica o huele fuerte, consulta.'} <button class="link left" data-action="goto" data-value="salud:flujo">Ver la guía del flujo →</button></div>`;
  }
  const stage = dischargeStage(predict(state.days, state.settings, k));
  if (!stage) return '';
  const st = C.FLOW_STAGES[stage];
  return st.expected.includes(v)
    ? `<div class="feedback ok"><b>Normal en este momento</b> (${st.name.toLowerCase()}).</div>`
    : `<div class="feedback"><b>No es lo más típico ahora</b> (${st.name.toLowerCase()}), pero suele ser normal si no pica ni huele. Si se repite, coméntalo en tu próxima consulta.</div>`;
}

function sheetDay(k) {
  const d = state.days[k] || {};
  const group = (title, html) => `<div class="group"><p class="label">${title}</p>${html}</div>`;
  const multi = (field, list) => `<div class="chips wrap">${list.map(([v, l]) => chip('toggle', v, l, d[field]?.includes(v), `data-field="${field}"`)).join('')}</div>`;
  const usual = state.settings.usual || [];
  const symptoms = [...C.SYMPTOMS].sort((a, b) => usual.includes(b[0]) - usual.includes(a[0]));
  const selFactors = (d.factors || []).map((f) => C.FACTORS.find((x) => x[0] === f)).filter(Boolean);
  return `
    <div class="sheet-head"><h2 class="display">${k === today() ? 'Hoy' : cap(fLong(k))}</h2><button class="icon-btn" data-action="close-sheet" aria-label="Cerrar">✕</button></div>
    ${group('Regla', `<div class="chips">${chip('set', 0, 'Nada', d.flow === 0, 'data-field="flow"')}${C.FLOWS.map((f) => chip('set', f.v, flowLabel(f), d.flow === f.v, 'data-field="flow"')).join('')}</div>`)}
    ${group('Relaciones', `<div class="chips">${chip('set', '', 'No', !d.sex, 'data-field="sex"')}${chip('set', 'protegido', 'Con protección', d.sex === 'protegido', 'data-field="sex"')}${chip('set', 'sin', 'Sin protección', d.sex === 'sin', 'data-field="sex"')}</div>`)}
    ${group('Síntomas', multi('symptoms', symptoms))}
    ${group('Ánimo', multi('mood', C.MOODS))}
    ${group('¿Algo diferente estos días?', multi('factors', C.FACTORS) + (selFactors.length ? `<div class="calm-inline">${selFactors.map((f) => `<p><b>${f[1]}:</b> ${f[2]}</p>`).join('')}</div>` : ''))}
    ${group('Flujo vaginal', `<div class="chips wrap">${C.DISCHARGE.map(([v, l]) => chip('set', v, l, d.discharge === v, 'data-field="discharge"')).join('')}</div>${dischargeFeedback(k, d.discharge)}`)}
    ${state.settings.contra?.method === 'pildora' ? group('Píldora', chip('pill-day', '1', d.pill ? 'Tomada ✓' : 'Marcar como tomada', !!d.pill)) : ''}
    ${group('Temperatura basal', `<div class="temp-row"><input type="text" inputmode="decimal" autocomplete="off" placeholder="36,50" value="${d.temp != null ? String(d.temp).replace('.', ',') : ''}" data-change="temp" aria-label="Temperatura basal en grados"><span>°C</span></div>`)}
    ${group('Test de ovulación', `<div class="chips">${chip('set', '', 'No', !d.ovTest, 'data-field="ovTest"')}${chip('set', 'negativo', 'Negativo', d.ovTest === 'negativo', 'data-field="ovTest"')}${chip('set', 'positivo', 'Positivo', d.ovTest === 'positivo', 'data-field="ovTest"')}</div>`)}
    ${group('Test de embarazo', `<div class="chips">${chip('set', '', 'No', !d.test, 'data-field="test"')}${chip('set', 'negativo', 'Negativo', d.test === 'negativo', 'data-field="test"')}${chip('set', 'positivo', 'Positivo', d.test === 'positivo', 'data-field="test"')}</div>`)}
    ${group('Notas', `<textarea rows="2" placeholder="Lo que quieras apuntar…" data-change="notes">${esc(d.notes)}</textarea>`)}
    ${d.sex === 'sin' ? `<button class="btn soft" data-action="preg-from" data-value="${k}">¿Puedo estar embarazada? →</button>` : ''}
    ${C.DISCHARGE_WARN.includes(d.discharge) || d.symptoms?.includes('picor') || d.symptoms?.includes('escozor') ? '<button class="btn soft" data-action="goto" data-value="salud:infecciones">¿Picor, escozor o flujo raro? Mira qué puede ser →</button>' : ''}
    ${d.test === 'positivo' ? '<p class="note">Si quieres seguir adelante, pide cita en tu centro de salud para empezar el control. Si no, allí o en un centro de planificación familiar te informan de tus opciones, de forma gratuita y confidencial.</p>' : ''}
    <button class="btn primary" data-action="close-sheet">Listo</button>`;
}

function sheetSettings() {
  const s = state.settings;
  const acc = store.getAccount();
  return `
    <div class="sheet-head"><h2 class="display">Tu cuenta</h2><button class="icon-btn" data-action="close-sheet" aria-label="Cerrar">✕</button></div>
    <div class="account"><span class="avatar">${esc((acc?.name || '?').charAt(0).toUpperCase())}</span><span><b>${esc(acc?.name)}</b><span class="muted small">${esc(acc?.email)}</span></span></div>
    <div class="group"><p class="label">¿Para qué usas Marea?</p>
      <div class="chips wrap">${[['controlar', 'Controlar mi ciclo'], ['buscar', 'Busco embarazo'], ['evitar', 'Evitar embarazo']].map(([v, l]) => chip('goal', v, l, s.goal === v)).join('')}</div></div>
    <div class="group"><p class="label">Síntomas que sueles tener</p>
      <div class="chips wrap">${C.SYMPTOMS.map(([v, l]) => chip('usual', v, l, s.usual?.includes(v))).join('')}</div></div>
    <div class="group"><p class="label">Valores por defecto (hasta tener datos tuyos)</p>
      <div class="stepper-row"><span>Duración del ciclo</span>${stepper('cycleLen', s.cycleLen, 'set-default')}</div>
      <div class="stepper-row"><span>Duración de la regla</span>${stepper('periodLen', s.periodLen, 'set-default')}</div></div>
    <div class="group"><p class="label">Anticonceptivo</p>
      <button class="btn soft" data-action="goto" data-value="salud:anticonceptivo">${s.contra?.method && s.contra.method !== 'ninguno' ? CONTRA[s.contra.method].name + ' · cambiar' : 'Configurar mi anticonceptivo'}</button></div>
    <div class="group"><p class="label">Modo discreto</p>
      <label class="switch-row"><span><b>Ocultar que es una app de salud</b><span class="muted small">El nombre pasa a «Diario» con un icono neutro.</span></span><input type="checkbox" class="switch" ${isDiscreet() ? 'checked' : ''} data-change="discreet"></label></div>
    <div class="group"><p class="label">Privacidad</p>
      <p class="small muted">Tus datos están cifrados con tu contraseña y guardados solo en este dispositivo. Sin anuncios y sin compartir nada con nadie.</p>
      <button class="btn soft" data-action="change-pw">Cambiar contraseña</button>
      <button class="btn soft" data-action="logout">Cerrar sesión</button></div>
    <div class="group"><p class="label">Tus datos</p>
      <button class="btn soft" data-action="export">Descargar copia de seguridad</button>
      <label class="btn soft file">Restaurar una copia<input type="file" accept="application/json" data-change="import" hidden></label>
      <button class="btn danger" data-action="delete-account">Borrar mi cuenta y mis datos</button></div>
    <p class="small muted center">${brandName()} · gratis para siempre</p>`;
}

// ---------- Onboarding y login ----------
const ONB_STEPS = ['welcome', 'account', 'last', 'durations', 'usual', 'goal'];
const GOALS = [['controlar', 'Controlar mi ciclo'], ['buscar', 'Busco embarazo'], ['evitar', 'Evitar embarazo']];

function viewOnboarding() {
  const o = ui.onb;
  const step = ONB_STEPS[ui.onbStep];
  const err = o.error ? `<p class="form-error" role="alert">${o.error}</p>` : '';
  const screens = {
    welcome: () => `
      <div class="welcome-art">${tideArt()}</div>
      <h1 class="display">${brandName()}</h1>
      <p class="lead">Entiende tu ciclo, resuelve tus dudas y sabe cuándo preocuparte (y cuándo no).</p>
      <ul class="onb-points"><li><b>Privada.</b> Tus datos, cifrados y solo en tu móvil.</li><li><b>Gratis.</b> Sin anuncios y sin funciones de pago.</li><li><b>Sencilla.</b> Apuntar algo te lleva un toque.</li></ul>
      <button class="btn primary big" data-action="onb-next">Crear mi cuenta</button>
      ${store.getAccount() ? '<button class="btn soft" data-action="to-login">Ya tengo cuenta</button>' : ''}
      <label class="link file">Tengo una copia de seguridad<input type="file" accept="application/json" data-change="onb-import" hidden></label>`,
    account: () => `
      <h2 class="display">Crea tu cuenta</h2>
      <p class="muted">${o.imported ? `Copia cargada: ${Object.keys(o.imported.days).length} días. ` : ''}Tu contraseña cifra tus datos: nadie más puede leerlos.</p>
      <form class="form" data-submit="onb-account" novalidate>
        <label>Nombre<input name="name" autocomplete="given-name" value="${esc(o.name)}"></label>
        <label>Email<input name="email" type="email" autocomplete="email" value="${esc(o.email)}"></label>
        <label>Contraseña<input name="password" type="password" autocomplete="new-password" value="${esc(o.password)}" placeholder="Mínimo 8 caracteres"></label>
        <label class="check"><input type="checkbox" name="remember" ${o.remember ? 'checked' : ''}> Mantener la sesión iniciada en este móvil</label>
        ${err}
        <p class="small muted">Si olvidas la contraseña no se pueden recuperar tus datos. Guarda una copia de seguridad de vez en cuando.</p>
        <button class="btn primary big" type="submit">${o.imported ? 'Entrar' : 'Siguiente'}</button>
      </form>`,
    last: () => `
      <h2 class="display">¿Cuándo empezó tu última regla?</h2>
      <input type="date" value="${o.last}" max="${today()}" data-change="onb-last" aria-label="Fecha de inicio de la última regla" />
      <button class="btn primary big" data-action="onb-next" ${o.last ? '' : 'disabled'}>Siguiente</button>
      <button class="btn soft" data-action="onb-skip-last">No me acuerdo</button>`,
    durations: () => `
      <h2 class="display">¿Cuánto te suele durar?</h2>
      <div class="stepper-row"><span>Ciclo (de una regla a otra)</span>${stepper('cycleLen', o.cycleLen, 'onb-step')}</div>
      <div class="stepper-row"><span>Regla</span>${stepper('periodLen', o.periodLen, 'onb-step')}</div>
      <p class="muted small">¿No lo sabes? Déjalo así: lo aprenderemos de lo que apuntes.</p>
      <button class="btn primary big" data-action="onb-next">Siguiente</button>`,
    usual: () => `
      <h2 class="display">¿Qué síntomas sueles tener?</h2>
      <p class="muted">Te avisaremos antes de la regla con consejos para cada uno.</p>
      <div class="chips wrap center">${C.SYMPTOMS.map(([v, l]) => chip('onb-usual', v, l, o.usual.includes(v))).join('')}</div>
      <button class="btn primary big" data-action="onb-next">${o.usual.length ? 'Siguiente' : 'Ninguno, siguiente'}</button>`,
    goal: () => `
      <h2 class="display">¿Para qué vas a usar Marea?</h2>
      <div class="radios">${GOALS.map(([v, l]) => `<label class="radio ${o.goal === v ? 'on' : ''}"><input type="radio" name="g" value="${v}" ${o.goal === v ? 'checked' : ''} data-change="onb-goal"/>${l}</label>`).join('')}</div>
      <p class="muted small">Puedes cambiarlo cuando quieras.</p>
      ${err}
      <button class="btn primary big" data-action="onb-finish">Empezar</button>`,
  };
  const total = ONB_STEPS.length - 1;
  return `
    <div class="onb">
      <div class="onb-bar">
        ${ui.onbStep > 0 ? `<button class="icon-btn" data-action="onb-back" aria-label="Volver">${icon('back')}</button>
          <div class="progress"><i style="width:${(ui.onbStep / total) * 100}%"></i></div><span class="muted small">${ui.onbStep}/${total}</span>` : ''}
      </div>
      <div class="onb-body">${screens[step]()}</div>
    </div>`;
}

function viewLogin() {
  const l = ui.login;
  const acc = store.getAccount();
  return `
    <div class="onb">
      <div class="onb-bar"><button class="icon-btn" data-action="login-back" aria-label="Volver">${icon('back')}</button></div>
      <div class="onb-body">
        <div class="welcome-art small">${tideArt()}</div>
        <h2 class="display">Hola de nuevo${acc?.name ? ', ' + esc(acc.name.split(' ')[0]) : ''}</h2>
        <form class="form" data-submit="login" novalidate>
          <label>Email<input name="email" type="email" autocomplete="email" value="${esc(l.email || acc?.email || '')}"></label>
          <label>Contraseña<input name="password" type="password" autocomplete="current-password"></label>
          <label class="check"><input type="checkbox" name="remember" ${l.remember ? 'checked' : ''}> Mantener la sesión iniciada</label>
          ${l.error ? `<p class="form-error" role="alert">${l.error}</p>` : ''}
          <button class="btn primary big" type="submit" ${l.busy ? 'disabled' : ''}>${l.busy ? 'Entrando…' : 'Entrar'}</button>
        </form>
        <button class="link" data-action="forgot">He olvidado la contraseña</button>
      </div>
    </div>`;
}

// ---------- Render ----------
const VIEWS = { hoy: viewHoy, ciclo: viewCiclo, salud: viewSalud, pregunta: viewPregunta };

function render() {
  const app = $('#app');
  const full = ui.screen === 'loading' ? `<div class="onb"><div class="onb-body center"><div class="welcome-art">${tideArt()}</div></div></div>`
    : ui.screen === 'onboarding' ? viewOnboarding() : ui.screen === 'login' ? viewLogin() : null;
  document.body.classList.toggle('fullscreen', !!full);
  document.body.dataset.tab = ui.tab;
  if (full) {
    app.innerHTML = full;
    $('#sheet').innerHTML = '';
    $('#sheet').classList.remove('open');
    return;
  }
  const focused = document.activeElement?.id;
  app.innerHTML = VIEWS[ui.tab]();
  document.querySelectorAll('nav [data-tab]').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === ui.tab ? 'page' : 'false'));
  if (focused === 'ask-input') $('#ask-input')?.focus();
  renderSheet();
}

function renderSheet() {
  const sheet = $('#sheet');
  const html = ui.sheet?.type === 'settings' ? sheetSettings() : ui.sheet?.type === 'day' ? sheetDay(ui.sheet.key) : '';
  const scroll = sheet.querySelector('.sheet-body')?.scrollTop || 0;
  if (!html) { sheet.classList.remove('open'); sheet.innerHTML = ''; return; }
  sheet.innerHTML = `<div class="backdrop" data-action="close-sheet"></div><div class="sheet-body" role="dialog" aria-modal="true">${html}</div>`;
  sheet.classList.add('open');
  sheet.querySelector('.sheet-body').scrollTop = scroll;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}

// Destinos antiguos (asistente, enlaces) traducidos a la navegación nueva.
const ALIASES = { cal: 'ciclo:calendario', fases: 'ciclo:fases', informe: 'ciclo:resumen', musica: 'salud:musica' };
function go(target) {
  target = ALIASES[target] || target.replace(/^(dudas|cuidado):/, 'salud:');
  const [tab, sub] = target.split(':');
  ui.tab = tab;
  if (tab === 'ciclo' && sub) ui.ciclo = sub;
  if (tab === 'salud') ui.page = sub || null;
  ui.sheet = null;
  render();
  if (tab === 'pregunta') scrollChat(); else window.scrollTo({ top: 0 });
}

const clamp = (k, v) => { const [min, max] = k === 'cycleLen' ? [20, 45] : [2, 10]; return Math.min(max, Math.max(min, v)); };
const toggleIn = (arr, v) => { const s = new Set(arr || []); s.has(v) ? s.delete(v) : s.add(v); return [...s]; };

function enterApp(data) {
  state = data;
  ui.screen = 'app';
  ui.tab = 'hoy';
  render();
}

function resetToOnboarding() {
  state = store.fresh();
  ui.sheet = null;
  ui.chat = [];
  ui.onbStep = 0;
  ui.onb = { ...ui.onb, imported: null, error: '', password: '' };
  ui.screen = 'onboarding';
  render();
}

// ---------- Acciones ----------
const ACTIONS = {
  goto: (v) => go(v),
  'period-today'() { day(today()).flow = 3; persist(); toast('Apuntado. Cuéntanos cómo va estos días'); render(); },
  'flow-today'(v) { day(today()).flow = Number(v); persist(); render(); },
  'quick-sex'(v) {
    const d = day(today());
    d.sex = d.sex === v ? undefined : v;
    persist();
    if (d.sex === 'sin' && state.settings.goal !== 'buscar') toast('Apuntado. En Salud › ¿Puedo estar embarazada? ves el riesgo');
    render();
  },
  'open-day'(k) {
    if (k > today()) return toast('Solo puedes apuntar hasta hoy');
    ui.sheet = { type: 'day', key: k };
    renderSheet();
  },
  'close-sheet'() { ui.sheet = null; render(); },
  set(v, el) {
    const f = el.dataset.field;
    const d = day(ui.sheet.key);
    if (f === 'flow') d.flow = Number(v); // 0 = «nada» explícito (sirve para cerrar la regla)
    else d[f] = !v || d[f] === v ? undefined : v;
    persist();
    renderSheet();
  },
  toggle(v, el) {
    const f = el.dataset.field;
    const d = day(ui.sheet.key);
    d[f] = toggleIn(d[f], v);
    persist();
    renderSheet();
  },
  month(v) {
    const [y, m] = ui.month.split('-').map(Number);
    ui.month = new Date(Date.UTC(y, m - 1 + Number(v), 1)).toISOString().slice(0, 7);
    render();
  },
  'month-today'() { ui.month = today().slice(0, 7); render(); },
  'ciclo-tab'(v) { ui.ciclo = v; render(); },
  'pill-taken'() { const d = day(today()); d.pill = d.pill ? undefined : true; persist(); render(); if (d.pill) toast('Apuntada 💊'); },
  'pill-day'() { const d = day(ui.sheet.key); d.pill = d.pill ? undefined : true; persist(); render(); },
  'contra-set'(v, el) { state.settings.contra = { ...state.settings.contra, [el.dataset.key]: v }; persist(); render(); },
  'contra-hour'(v) { const c = state.settings.contra; c.hour = Math.min(23, Math.max(0, (c.hour ?? 22) + Number(v))); persist(); render(); },
  'contra-years'(v) { const c = state.settings.contra; const base = Number(c.years) || CONTRA[c.method].years; c.years = Math.min(12, Math.max(1, base + Number(v))); persist(); render(); },
  'salud-home'() { go('salud'); },
  'log-today'() { ACTIONS['open-day'](today()); },
  'open-inf'(v) { ui.openInf = v; ui.symptoms.clear(); go('salud:infecciones'); },
  'preg-date'(v) { ui.preg.date = v; ui.preg.done = false; render(); },
  'preg-go'() {
    ui.preg.done = true;
    render();
    requestAnimationFrame(() => document.querySelector('.result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  },
  'preg-from'(k) { ui.preg = { date: k, method: 'nada', done: false }; go('salud:embarazo'); },
  sym(v) { ui.symptoms.has(v) ? ui.symptoms.delete(v) : ui.symptoms.add(v); ui.openInf = null; render(); },
  'sym-clear'() { ui.symptoms.clear(); render(); },
  'toggle-inf'(v) { ui.openInf = ui.openInf === v ? null : v; render(); },
  ask(v) { if (ui.tab !== 'pregunta') go('pregunta'); ask(v); },
  print() { window.print(); },
  settings() { ui.sheet = { type: 'settings' }; renderSheet(); },
  goal(v) { state.settings.goal = v; persist(); render(); },
  usual(v) { state.settings.usual = toggleIn(state.settings.usual, v); persist(); render(); },
  'set-default'(v, el) { const k = el.dataset.key; state.settings[k] = clamp(k, state.settings[k] + Number(v)); persist(); render(); },
  export() {
    if (!confirm('La copia se descarga SIN cifrar para que puedas restaurarla. Guárdala en un sitio seguro. ¿Continuar?')) return;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${brandName().toLowerCase()}-copia-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  async 'change-pw'() {
    const old = prompt('Contraseña actual');
    if (old == null) return;
    const nw = prompt('Nueva contraseña (mínimo 8 caracteres)');
    if (nw == null) return;
    if (nw.length < 8) return toast('Mínimo 8 caracteres');
    try { await store.changePassword(old, nw, state); toast('Contraseña cambiada'); } catch { toast('La contraseña actual no es correcta'); }
  },
  logout() {
    store.logout();
    state = store.fresh();
    ui.sheet = null;
    ui.chat = [];
    ui.login = { email: store.getAccount()?.email || '', remember: true, error: '', busy: false };
    ui.screen = 'login';
    render();
  },
  'delete-account'() {
    if (!confirm('Se borrarán tu cuenta y todo lo que has apuntado en este dispositivo. No se puede deshacer. ¿Seguro?')) return;
    store.deleteAccount();
    resetToOnboarding();
  },
  'to-login'() { ui.screen = 'login'; render(); },
  'login-back'() { ui.screen = 'onboarding'; ui.onbStep = 0; render(); },
  forgot() {
    alert('Tus datos están cifrados con tu contraseña y solo existen en este móvil, así que nadie puede recuperarlos sin ella.\n\nSi tienes una copia de seguridad, puedes crear una cuenta nueva y restaurarla desde la pantalla de bienvenida.');
    if (confirm('¿Quieres borrar la cuenta de este móvil y empezar de cero?')) { store.deleteAccount(); resetToOnboarding(); }
  },
  'onb-next'() { ui.onb.error = ''; ui.onbStep = Math.min(ONB_STEPS.length - 1, ui.onbStep + 1); render(); },
  'onb-back'() { ui.onb.error = ''; ui.onbStep = Math.max(0, ui.onbStep - 1); render(); },
  'onb-skip-last'() { ui.onb.last = ''; ui.onbStep++; render(); },
  'onb-step'(v, el) { const k = el.dataset.key; ui.onb[k] = clamp(k, ui.onb[k] + Number(v)); render(); },
  'onb-usual'(v) { ui.onb.usual = toggleIn(ui.onb.usual, v); render(); },
  async 'onb-finish'() {
    const o = ui.onb;
    if (store.getAccount() && !confirm('Ya hay una cuenta en este móvil. Si continúas se sustituirá y se perderán sus datos. ¿Seguir?')) return;
    let data;
    if (o.imported) {
      data = o.imported;
      data.settings.onboarded = true;
    } else {
      data = store.fresh();
      Object.assign(data.settings, { cycleLen: o.cycleLen, periodLen: o.periodLen, goal: o.goal, usual: o.usual, onboarded: true });
      if (o.last) for (let i = 0; i < o.periodLen; i++) { const k = addDays(o.last, i); if (k <= today()) (data.days[k] ||= {}).flow = 3; }
    }
    try {
      await store.createAccount({ name: o.name, email: o.email, password: o.password, remember: o.remember }, data);
    } catch {
      o.error = 'No se ha podido crear la cuenta en este navegador. Prueba a abrir Marea en Safari o Chrome, sin modo privado.';
      return render();
    }
    const name = o.name.split(' ')[0];
    ui.onb = { ...ui.onb, password: '', imported: null };
    enterApp(data);
    toast(`¡Bienvenida, ${name}!`);
  },
};

const SUBMITS = {
  ask(form) { ask(form.querySelector('input').value); },
  'onb-account'(form) {
    const f = new FormData(form);
    const o = ui.onb;
    Object.assign(o, { name: String(f.get('name')).trim(), email: String(f.get('email')).trim(), password: String(f.get('password')), remember: f.get('remember') === 'on' });
    o.error = !o.name ? 'Dinos cómo te llamas.'
      : !/^\S+@\S+\.\S+$/.test(o.email) ? 'Ese email no parece válido.'
      : o.password.length < 8 ? 'La contraseña necesita al menos 8 caracteres.' : '';
    if (o.error) return render();
    if (o.imported) return ACTIONS['onb-finish']();
    ACTIONS['onb-next']();
  },
  async login(form) {
    const f = new FormData(form);
    const l = ui.login;
    Object.assign(l, { email: String(f.get('email')), remember: f.get('remember') === 'on', busy: true, error: '' });
    render();
    try {
      const data = await store.login(l.email, String(f.get('password')), l.remember);
      l.busy = false;
      enterApp(data);
    } catch (e) {
      l.busy = false;
      l.error = e.code === 'email' ? 'No hay ninguna cuenta con ese email en este dispositivo.' : 'Contraseña incorrecta.';
      render();
    }
  },
};

const readBackup = (file) => file.text().then((txt) => {
  const data = store.normalize(JSON.parse(txt));
  if (!Object.keys(data.days).length && !data.settings.onboarded) throw new Error('vacía');
  return data;
});

const CHANGES = {
  'preg-date'(el) { if (el.value) { ui.preg.date = el.value; ui.preg.done = false; render(); } },
  'preg-method'(el) { ui.preg.method = el.value; ui.preg.done = false; render(); },
  notes(el) { day(ui.sheet.key).notes = el.value.slice(0, 500); persist(); },
  temp(el) {
    const v = parseFloat(String(el.value).replace(',', '.'));
    const d = day(ui.sheet.key);
    if (!el.value) d.temp = undefined;
    else if (v >= 35 && v <= 38.5) d.temp = Math.round(v * 100) / 100;
    else return toast('La temperatura basal suele estar entre 35 y 38,5 °C');
    persist();
    renderSheet();
  },
  'contra-method'(el) { state.settings.contra = { ...(state.settings.contra || {}), method: el.value }; persist(); render(); },
  'contra-start'(el) { state.settings.contra = { ...state.settings.contra, start: el.value || undefined }; persist(); render(); },
  discreet(el) {
    try { el.checked ? localStorage.setItem(DISCREET_KEY, '1') : localStorage.removeItem(DISCREET_KEY); } catch {}
    applyDiscreet();
    render();
    toast(el.checked ? 'Modo discreto activado. Si ya la tenías instalada, bórrala y vuelve a añadirla para cambiar el icono' : 'Modo discreto desactivado');
  },
  'onb-last'(el) { ui.onb.last = el.value; render(); },
  'onb-goal'(el) { ui.onb.goal = el.value; render(); },
  'onb-import'(el) {
    const file = el.files?.[0];
    if (!file) return;
    readBackup(file).then((data) => { ui.onb.imported = data; ui.onbStep = 1; render(); toast('Copia cargada: ahora crea tu cuenta'); })
      .catch(() => toast('Ese archivo no es una copia válida'));
  },
  import(el) {
    const file = el.files?.[0];
    if (!file) return;
    readBackup(file).then((data) => {
      if (!confirm(`Se cargarán ${Object.keys(data.days).length} días y se sustituirá lo que tienes ahora. ¿Seguimos?`)) return;
      state = data;
      state.settings.onboarded = true;
      persist();
      ui.sheet = null;
      toast('Copia restaurada');
      render();
    }).catch(() => toast('Ese archivo no es una copia válida'));
  },
};

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('nav [data-tab]');
  if (tabBtn) return go(tabBtn.dataset.tab);
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.action];
  if (fn) fn(el.dataset.value, el);
});
document.addEventListener('change', (e) => { const fn = CHANGES[e.target.dataset?.change]; if (fn) fn(e.target); });
document.addEventListener('input', (e) => { if (e.target.id === 'ask-input') ui.chatDraft = e.target.value; });
document.addEventListener('submit', (e) => {
  const fn = SUBMITS[e.target.dataset?.submit];
  if (!fn) return;
  e.preventDefault();
  fn(e.target);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.sheet) ACTIONS['close-sheet'](); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && ui.screen === 'app') render(); });

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});

// ---------- Arranque ----------
(async () => {
  applyDiscreet();
  render();
  if (!store.getAccount()) { ui.screen = 'onboarding'; return render(); }
  const data = await store.restoreSession();
  if (data) return enterApp(data);
  ui.screen = 'login';
  render();
})();
