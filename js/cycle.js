// Lógica pura del ciclo. Sin DOM, sin almacenamiento: fácil de testear.
// Las fechas se manejan como claves "YYYY-MM-DD" en UTC para evitar líos con el horario de verano.

export const DAY_MS = 86400000;

export const toKey = (d) => d.toISOString().slice(0, 10);
export const fromKey = (k) => new Date(k + 'T00:00:00Z');
export const addDays = (k, n) => toKey(new Date(fromKey(k).getTime() + n * DAY_MS));
/** Días desde a hasta b (b - a). */
export const diffDays = (a, b) => Math.round((fromKey(b) - fromKey(a)) / DAY_MS);
export const todayKey = (now = new Date()) =>
  toKey(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));

// Intensidad del sangrado: 1 = manchado, 2 = ligero, 3 = medio, 4 = abundante.
// El manchado solo no cuenta como regla (podría ser sangrado de implantación, ovulación, etc.).
export const PERIOD_MIN_FLOW = 2;

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const std = (a) => {
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
};

/** Agrupa los días con sangrado en reglas. Un hueco de 1 día sin apuntar no corta la regla. */
export function getPeriods(days) {
  const keys = Object.keys(days)
    .filter((k) => (days[k]?.flow ?? 0) >= PERIOD_MIN_FLOW)
    .sort();
  const periods = [];
  for (const k of keys) {
    const last = periods[periods.length - 1];
    if (last && diffDays(last.end, k) <= 2) last.end = k;
    else periods.push({ start: k, end: k });
  }
  return periods.map((p) => ({ ...p, length: diffDays(p.start, p.end) + 1 }));
}

/** Estadísticas del ciclo a partir de lo registrado (o de los valores por defecto si aún no hay datos). */
export function getStats(days, settings = {}) {
  const periods = getPeriods(days);
  const cycles = [];
  for (let i = 1; i < periods.length; i++) {
    const len = diffDays(periods[i - 1].start, periods[i].start);
    // Fuera de este rango casi seguro que falta apuntar una regla: no lo usamos para predecir.
    if (len >= 18 && len <= 60) cycles.push(len);
  }
  const recent = cycles.slice(-6);
  const cycleLen = recent.length ? Math.round(mean(recent)) : settings.cycleLen || 28;
  // La última regla puede estar en curso: solo promediamos las ya terminadas.
  const finished = periods.slice(0, -1).slice(-6);
  const periodLen = finished.length
    ? Math.round(mean(finished.map((p) => Math.min(p.length, 10))))
    : settings.periodLen || 5;
  const variability = recent.length >= 2 ? Math.max(1, Math.round(std(recent))) : 3;
  const range = recent.length ? Math.max(...recent) - Math.min(...recent) : 0;
  // Se considera ciclo irregular cuando la diferencia entre el más corto y el más largo supera ~7 días.
  const irregular = recent.length >= 3 && range > 7;
  const confidence = recent.length >= 3 ? 'alta' : recent.length >= 1 ? 'media' : 'baja';
  return { periods, cycles, cycleLen, periodLen, variability, irregular, confidence, range };
}

/**
 * Predicción del ciclo actual y los siguientes.
 * Modelo estándar: ovulación ≈ 14 días antes de la siguiente regla; ventana fértil = 5 días antes + día de ovulación + 1 día después
 * (los espermatozoides viven hasta 5 días; el óvulo, 12–24 h).
 */
export function predict(days, settings = {}, today = todayKey()) {
  const stats = getStats(days, settings);
  const last = stats.periods[stats.periods.length - 1];
  if (!last) return { stats, hasData: false };

  const cycleDay = diffDays(last.start, today) + 1;
  // ¿Sigue la regla en curso? (apuntada hoy o ayer y aún dentro de la duración habitual)
  // Si hoy se marcó explícitamente «sin sangrado» (flow 0), la regla se da por terminada.
  const inPeriod =
    diffDays(last.end, today) <= 0 ||
    (diffDays(last.end, today) === 1 && cycleDay <= stats.periodLen && days[today]?.flow !== 0);

  // Si este ciclo hay un test de ovulación positivo o una subida de temperatura, la ovulación ya no se estima: se detecta.
  const detected = detectOvulation(days, last.start, today);
  const nextStart = detected ? addDays(detected.date, 14) : addDays(last.start, stats.cycleLen);
  const daysUntil = diffDays(today, nextStart);
  const lateDays = inPeriod ? 0 : Math.max(0, -daysUntil);
  const ovulation = detected ? detected.date : addDays(nextStart, -14);

  const cycles = [];
  // Ciclos futuros proyectados (para el calendario). Si hay retraso, no inventamos fechas pasadas.
  let start = lateDays > 0 ? null : nextStart;
  for (let i = 0; start && i < 6; i++) {
    const ov = addDays(start, -14);
    cycles.push({
      periodStart: start,
      periodEnd: addDays(start, stats.periodLen - 1),
      ovulation: ov,
      fertileStart: addDays(ov, -5),
      fertileEnd: addDays(ov, 1),
    });
    start = addDays(start, stats.cycleLen);
  }

  return {
    stats,
    hasData: true,
    last,
    today,
    cycleDay,
    inPeriod,
    nextStart,
    ovulationSource: detected ? detected.source : null,
    nextStartEarliest: addDays(nextStart, -stats.variability),
    nextStartLatest: addDays(nextStart, stats.variability),
    daysUntil,
    lateDays,
    ovulation,
    fertileStart: addDays(ovulation, -5),
    fertileEnd: addDays(ovulation, 1),
    cycles,
  };
}

/**
 * Probabilidad orientativa de embarazo según el día respecto a la ovulación.
 * 'alta' = 2 días antes + día de ovulación; 'media' = resto de la ventana; 'baja' = fuera.
 */
export function fertilityOn(key, pred) {
  if (!pred?.hasData) return 'desconocida';
  const ovs = [pred.ovulation, ...pred.cycles.map((c) => c.ovulation)];
  // También el ciclo anterior, para fechas pasadas.
  ovs.push(addDays(pred.ovulation, -pred.stats.cycleLen));
  let best = 'baja';
  for (const ov of ovs) {
    const d = diffDays(ov, key); // días respecto a la ovulación
    if (d >= -2 && d <= 0) return 'alta';
    if (d >= -5 && d <= 1) best = 'media';
  }
  return best;
}

/** Fase del ciclo (para explicar qué está pasando en el cuerpo). */
export function phaseOf(pred) {
  if (!pred?.hasData) return null;
  if (pred.inPeriod) return 'menstrual';
  if (pred.lateDays > 0) return 'retraso';
  const toOv = diffDays(pred.today, pred.ovulation);
  if (toOv > 5) return 'folicular';
  if (toOv >= -1) return 'fertil';
  return 'lutea';
}

/** Qué se pinta en un día del calendario. */
export function dayMarks(key, days, pred) {
  const d = days[key] || {};
  const marks = {
    period: (d.flow ?? 0) >= PERIOD_MIN_FLOW,
    spotting: d.flow === 1,
    sex: d.sex || null,
    test: d.test || null,
    hasLog: !!(d.symptoms?.length || d.mood?.length || d.factors?.length || d.discharge || d.notes),
    predictedPeriod: false,
    fertile: false,
    ovulation: false,
  };
  if (!pred?.hasData) return marks;
  const windows = [
    { fs: pred.fertileStart, fe: pred.fertileEnd, ov: pred.ovulation },
    ...pred.cycles.map((c) => ({ fs: c.fertileStart, fe: c.fertileEnd, ov: c.ovulation })),
  ];
  for (const w of windows) {
    if (key === w.ov) marks.ovulation = true;
    if (key >= w.fs && key <= w.fe) marks.fertile = true;
  }
  if (key > pred.today) {
    for (const c of pred.cycles) {
      if (key >= c.periodStart && key <= c.periodEnd) marks.predictedPeriod = true;
    }
  }
  // Las predicciones de fertilidad no tienen sentido sobre días de regla ya registrados.
  if (marks.period) marks.fertile = marks.ovulation = false;
  return marks;
}

/**
 * Evaluación de riesgo de embarazo tras una relación.
 * method: 'nada' | 'marcha_atras' | 'condon_roto' | 'pastilla_olvidada' | 'condon_ok' | 'hormonal_ok' | 'diu'
 */
export function pregnancyRisk({ sexDate, method, now = new Date() }, pred) {
  const reliable = ['condon_ok', 'hormonal_ok', 'diu'].includes(method);
  const fert = fertilityOn(sexDate, pred);
  let level;
  if (reliable) level = 'muy_baja';
  else if (method === 'marcha_atras') level = fert === 'alta' ? 'media' : 'baja';
  else level = fert === 'alta' ? 'alta' : fert === 'media' ? 'media' : fert === 'desconocida' ? 'media' : 'baja';

  const sexMs = fromKey(sexDate).getTime();
  const todayMs = fromKey(todayKey(now)).getTime();
  // Aproximación en horas (no sabemos la hora exacta de la relación).
  const hoursSince = Math.max(0, Math.round((todayMs - sexMs) / 3600000 + now.getHours()));

  const testFrom21 = addDays(sexDate, 21);
  let testDate = testFrom21;
  if (pred?.hasData && pred.nextStart > sexDate && pred.nextStart < testDate) testDate = pred.nextStart;

  return {
    level,
    fertility: fert,
    needsEmergency: !reliable,
    hoursSince,
    pillLevonorgestrel: hoursSince <= 72,
    pillUlipristal: hoursSince <= 120,
    iud: hoursSince <= 120,
    testDate,
    testFrom21,
  };
}

/**
 * Detecta cosas "raras" del ciclo para explicarlas con calma, junto con los factores
 * (viaje, estrés, enfermedad…) que la usuaria apuntó en ese periodo.
 */
export function getAnomaly(days, pred) {
  if (!pred?.hasData) return null;
  const { periods, cycleLen } = pred.stats;
  const last = pred.last;
  const issues = [];
  let since = addDays(last.start, -5);

  if (pred.lateDays > 0) issues.push({ type: 'late', n: pred.lateDays });

  // ¿El ciclo que acaba de terminar fue muy distinto a lo habitual? Solo lo contamos los primeros 10 días.
  if (periods.length >= 2 && pred.cycleDay <= 10) {
    const raw = periods.slice(1).map((p, i) => diffDays(periods[i].start, p.start));
    const lastLen = raw[raw.length - 1];
    const prev = raw.slice(0, -1).filter((x) => x >= 18 && x <= 60).slice(-6);
    const base = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : cycleLen;
    const delta = Math.round(lastLen - base);
    if (delta <= -5) issues.push({ type: 'early', n: -delta });
    if (delta >= 5) issues.push({ type: 'late_past', n: delta });
    if (delta <= -5 || delta >= 5) since = addDays(periods[periods.length - 2].start, -5);
  }

  if (last.length > 8) issues.push({ type: 'long_period', n: last.length });

  const recentSpot = Object.keys(days).some(
    (k) => days[k]?.flow === 1 && diffDays(k, pred.today) >= 0 && diffDays(k, pred.today) <= 7 && !(k >= last.start && k <= last.end),
  );
  if (recentSpot) issues.push({ type: 'spotting' });

  if (!issues.length) return null;
  const factors = Object.keys(days)
    .filter((k) => k >= since && k <= pred.today && days[k]?.factors?.length)
    .sort()
    .flatMap((k) => days[k].factors.map((f) => ({ factor: f, date: k })));
  return { issues, factors };
}

/** Momento del ciclo para saber qué flujo es esperable hoy. */
export function dischargeStage(pred) {
  if (!pred?.hasData) return null;
  if (pred.inPeriod) return 'menstrual';
  if (pred.lateDays > 0) return 'premenstrual';
  const toOv = diffDays(pred.today, pred.ovulation);
  if (pred.daysUntil <= 3) return 'premenstrual';
  if (toOv >= -1 && toOv <= 2) return 'ovulacion';
  if (toOv > 2 && toOv <= 6) return 'cremoso';
  if (toOv > 6) return 'post';
  return 'lutea';
}

/**
 * Detecta la ovulación del ciclo en curso:
 * - Test de ovulación (LH) positivo → la ovulación suele llegar 24–36 h después: el día siguiente.
 * - Temperatura basal: regla «3 sobre 6». Tres temperaturas seguidas al menos 0,2 °C por encima
 *   de la más alta de las 6 anteriores → la ovulación fue el día antes de la primera alta.
 */
export function detectOvulation(days, cycleStart, today) {
  const keys = Object.keys(days).filter((k) => k >= cycleStart && k <= today).sort();
  const minDay = addDays(cycleStart, 6); // antes del día 7 no tiene sentido
  const lh = keys.find((k) => days[k]?.ovTest === 'positivo' && k >= minDay);
  if (lh) return { date: addDays(lh, 1), source: 'lh' };
  const temps = keys.filter((k) => typeof days[k]?.temp === 'number').map((k) => [k, days[k].temp]);
  for (let i = 6; i + 2 < temps.length; i++) {
    const base = Math.max(...temps.slice(i - 6, i).map((t) => t[1]));
    if (temps.slice(i, i + 3).every((t) => t[1] >= base + 0.2) && temps[i][0] >= minDay) {
      return { date: addDays(temps[i][0], -1), source: 'temp' };
    }
  }
  return null;
}
