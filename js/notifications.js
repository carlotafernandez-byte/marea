// Recordatorios: calcula qué notificaciones programar en los próximos días.
// Lógica pura: la app nativa (Capacitor) las programa en el móvil; en la web no se usan.

import { addDays, diffDays, fromKey } from './cycle.js';
import { METHODS, isHormonal } from './contraception.js';

export const NOTIFY_DEFAULTS = { period: true, fertile: true, pill: true, changes: true };
const HORIZON = 35; // días hacia delante
const MAX = 60; // iOS admite como mucho 64 notificaciones pendientes

/** Fecha local (no UTC) para un día "YYYY-MM-DD" a una hora concreta. */
const at = (key, hour, min = 0) => {
  const d = fromKey(key);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour, min, 0, 0);
};

/**
 * Lista de recordatorios { id, at: Date, title, body }.
 * prefs: qué tipos están activados. discreet: textos neutros que no revelan nada en la pantalla de bloqueo.
 */
export function buildReminders({ pred, settings, days }, now = new Date(), discreet = false) {
  const prefs = { ...NOTIFY_DEFAULTS, ...(settings.notify || {}) };
  const out = [];
  const add = (key, hour, title, body, neutral = 'Tienes un recordatorio') => {
    const when = at(key, hour);
    if (when <= now || diffDays(todayOf(now), key) > HORIZON) return;
    out.push({ at: when, title: discreet ? 'Diario' : title, body: discreet ? neutral : body });
  };
  const contra = settings.contra;
  const hormonal = isHormonal(contra);

  if (pred?.hasData && prefs.period && !pred.lateDays) {
    const starts = [pred.nextStart, ...pred.cycles.map((c) => c.periodStart)].filter((v, i, a) => a.indexOf(v) === i);
    for (const s of starts) {
      add(addDays(s, -2), 20, 'Tu regla llega en 2 días', 'Mete en el bolso lo que vayas a necesitar 💙');
      add(s, 9, 'Hoy podría bajarte la regla', 'Cuando llegue, apúntalo con un toque.');
    }
  }
  if (pred?.hasData && prefs.period && pred.lateDays > 0 && pred.lateDays < 7) {
    add(addDays(pred.today, 1), 10, '¿Te ha bajado ya?', 'Si llega, apúntalo. Si no, te contamos por qué puede ser.');
  }
  if (pred?.hasData && prefs.fertile && !hormonal && settings.goal !== 'controlar') {
    const windows = [pred.fertileStart, ...pred.cycles.map((c) => c.fertileStart)];
    for (const w of windows) {
      add(w, 9, settings.goal === 'buscar' ? 'Empiezan tus días fértiles' : 'Empiezan tus días de más riesgo',
        settings.goal === 'buscar' ? 'Son los mejores días para buscar embarazo.' : 'Estos días, protección siempre.');
    }
  }

  if (contra?.start && contra.method === 'pildora' && prefs.pill) {
    const hour = contra.hour ?? 22;
    const today = todayOf(now);
    for (let i = 0; i <= HORIZON; i++) {
      const k = addDays(today, i);
      const packDay = (diffDays(contra.start, k) % 28) + 1;
      if (diffDays(contra.start, k) < 0 || (contra.pillType !== '28' && packDay > 21)) continue;
      if (i === 0 && days[k]?.pill) continue; // ya tomada hoy
      add(k, hour, '¿Te has tomado la píldora?', 'Márcala en la app cuando la tomes.');
      if (contra.pillType !== '28' && packDay === 21) add(addDays(k, 7), 9, 'Hoy empiezas blíster nuevo', 'Se acabó la semana de descanso.');
    }
  }
  if (contra?.start && prefs.changes && (contra.method === 'anillo' || contra.method === 'parche')) {
    const since = diffDays(contra.start, todayOf(now));
    const cycleStart = addDays(contra.start, Math.floor(Math.max(0, since) / 28) * 28);
    for (const c of [0, 28]) {
      const base = addDays(cycleStart, c);
      if (contra.method === 'anillo') {
        add(addDays(base, 21), 20, 'Toca quitarte el anillo', 'Empieza tu semana de descanso.');
        add(addDays(base, 28), 20, 'Toca ponerte un anillo nuevo', 'No alargues el descanso más de 7 días.');
      } else {
        for (const d of [7, 14]) add(addDays(base, d), 20, 'Toca cambiar el parche', 'Pon uno nuevo hoy.');
        add(addDays(base, 21), 20, 'Toca quitarte el parche', 'Empieza tu semana sin parche.');
        add(addDays(base, 28), 20, 'Toca ponerte un parche nuevo', 'Empieza un ciclo nuevo.');
      }
    }
  }
  if (contra?.start && prefs.changes && contra.method === 'inyeccion') {
    const since = diffDays(contra.start, todayOf(now));
    const next = addDays(contra.start, 84 * (Math.floor(Math.max(0, since) / 84) + 1));
    add(addDays(next, -7), 10, 'Tu inyección toca en una semana', 'Pide cita si aún no la tienes.');
  }
  if (contra?.start && prefs.changes && METHODS[contra.method]?.device) {
    const years = Number(contra.years) || METHODS[contra.method].years;
    const expires = addDays(contra.start, Math.round(years * 365.25));
    add(addDays(expires, -30), 10, `Tu ${METHODS[contra.method].name.toLowerCase()} caduca en un mes`, 'Pide cita para cambiarlo.');
  }

  return out
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX)
    .map((n, i) => ({ ...n, id: 1000 + i }));
}

function todayOf(now) {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return d.toISOString().slice(0, 10);
}
