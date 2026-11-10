// Seguimiento del anticonceptivo: qué toca hoy y avisos si se te olvida algo.
// Lógica pura (sin DOM) para poder testearla.

import { addDays, diffDays } from './cycle.js';

export const METHODS = {
  ninguno: { name: 'No uso', hormonal: false },
  pildora: { name: 'Píldora', hormonal: true, daily: true },
  anillo: { name: 'Anillo vaginal', hormonal: true },
  parche: { name: 'Parche', hormonal: true },
  inyeccion: { name: 'Inyección trimestral', hormonal: true },
  implante: { name: 'Implante', hormonal: true, device: true, years: 3 },
  diu_hormonal: { name: 'DIU hormonal', hormonal: true, device: true, years: 5 },
  diu_cobre: { name: 'DIU de cobre', hormonal: false, device: true, years: 10 },
  preservativo: { name: 'Preservativo', hormonal: false },
};

export const isHormonal = (cfg) => !!(cfg && METHODS[cfg.method]?.hormonal);

const fmtLeft = (n) => (n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`);

/**
 * Estado del anticonceptivo para hoy.
 * cfg = { method, start (YYYY-MM-DD), pillType: '21' | '28', hour: 0-23, years }
 * days = registros diarios (day.pill = true cuando se marca la píldora como tomada)
 * Devuelve { tone: 'ok' | 'todo' | 'warn' | 'info', title, detail, canMark, marked }
 */
export function contraStatus(cfg, days, today, nowHour = 12) {
  if (!cfg || !cfg.method || cfg.method === 'ninguno' || cfg.method === 'preservativo') return null;
  const m = METHODS[cfg.method];
  if (!cfg.start) return { tone: 'info', title: m.name, detail: 'Añade la fecha de inicio para que te avise de lo que toca.', needsSetup: true };
  const since = diffDays(cfg.start, today);
  if (since < 0) return { tone: 'info', title: m.name, detail: 'Empiezas el ' + cfg.start.split('-').reverse().join('/') + '.' };

  if (cfg.method === 'pildora') {
    const packDay = (since % 28) + 1;
    const rest = cfg.pillType !== '28' && packDay > 21;
    if (rest) {
      const left = 29 - packDay;
      return { tone: 'info', title: 'Semana de descanso', detail: `Hoy no toca pastilla. Empiezas el siguiente blíster ${fmtLeft(left)}. Es normal que te baje el sangrado estos días.` };
    }
    const taken = !!days[today]?.pill;
    const yesterday = addDays(today, -1);
    const yPackDay = ((since - 1) % 28) + 1;
    const yNeeded = since >= 1 && !(cfg.pillType !== '28' && yPackDay > 21);
    const missedYesterday = yNeeded && !days[yesterday]?.pill;
    if (taken) return { tone: 'ok', title: `Píldora tomada · día ${packDay} del blíster`, detail: '¡Bien! Mañana a la misma hora.', canMark: true, marked: true };
    if (missedYesterday) {
      return {
        tone: 'warn',
        title: 'No marcaste la píldora de ayer',
        detail: 'Si se te olvidó, tómala en cuanto te acuerdes (aunque hoy tomes dos) y sigue normal. Si han pasado más de 24 h de tu hora habitual, usa preservativo los próximos 7 días y, si tuviste relaciones sin protección, mira si necesitas la píldora del día después.',
        canMark: true,
        marked: false,
        missed: true,
      };
    }
    const late = nowHour >= (cfg.hour ?? 22);
    return {
      tone: late ? 'warn' : 'todo',
      title: late ? '¡Que no se te pase la píldora!' : `Hoy toca la píldora · día ${packDay} del blíster`,
      detail: late ? 'Ya es tu hora y aún no la has marcado como tomada.' : `Tu hora: las ${cfg.hour ?? 22}:00.`,
      canMark: true,
      marked: false,
    };
  }

  if (cfg.method === 'anillo' || cfg.method === 'parche') {
    const cycleDay = (since % 28) + 1;
    if (cfg.method === 'anillo') {
      if (cycleDay <= 21) {
        const left = 22 - cycleDay;
        return { tone: left <= 1 ? 'todo' : 'ok', title: 'Anillo puesto', detail: `Te lo quitas ${fmtLeft(left)} (al cumplir 3 semanas).` };
      }
      const left = 29 - cycleDay;
      return { tone: left <= 1 ? 'todo' : 'info', title: 'Semana sin anillo', detail: `Ponte uno nuevo ${fmtLeft(left)}. No alargues la semana de descanso más de 7 días.` };
    }
    if (cycleDay <= 21) {
      const left = 7 - ((cycleDay - 1) % 7);
      const change = left === 7 ? 0 : left;
      return { tone: change <= 1 ? 'todo' : 'ok', title: `Parche ${Math.ceil(cycleDay / 7)} de 3`, detail: change === 0 ? 'Hoy toca poner un parche nuevo.' : `Cambia el parche ${fmtLeft(change)}.` };
    }
    const left = 29 - cycleDay;
    return { tone: left <= 1 ? 'todo' : 'info', title: 'Semana sin parche', detail: `Ponte uno nuevo ${fmtLeft(left)}.` };
  }

  if (cfg.method === 'inyeccion') {
    const next = addDays(cfg.start, 84 * (Math.floor(since / 84) + 1));
    const left = diffDays(today, next);
    return { tone: left <= 7 ? 'todo' : 'ok', title: 'Inyección trimestral', detail: `La siguiente toca ${fmtLeft(left)}. Pide cita con tiempo.` };
  }

  if (m.device) {
    const years = Number(cfg.years) || m.years;
    const expires = addDays(cfg.start, Math.round(years * 365.25));
    const left = diffDays(today, expires);
    if (left < 0) return { tone: 'warn', title: `Tu ${m.name.toLowerCase()} ha caducado`, detail: 'Ya no protege igual. Pide cita para cambiarlo y usa preservativo mientras tanto.' };
    const months = Math.floor(left / 30.4);
    return {
      tone: left <= 60 ? 'todo' : 'ok',
      title: m.name,
      detail: left <= 60 ? `Caduca ${fmtLeft(left)}: pide cita para cambiarlo.` : `Protegida hasta ${expires.split('-').reverse().join('/')} (unos ${months >= 24 ? Math.floor(months / 12) + ' años' : months + ' meses'}).`,
    };
  }
  return null;
}
