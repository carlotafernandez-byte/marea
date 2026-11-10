import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays, diffDays, getPeriods, getStats, predict, fertilityOn, phaseOf, dayMarks, pregnancyRisk,
} from '../js/cycle.js';

const logPeriod = (days, start, len, flow = 3) => {
  for (let i = 0; i < len; i++) days[addDays(start, i)] = { flow };
  return days;
};

test('fechas', () => {
  assert.equal(addDays('2026-03-28', 2), '2026-03-30'); // cambio de hora en España
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(diffDays('2026-01-01', '2026-03-01'), 59);
});

test('agrupa reglas y tolera un día sin apuntar', () => {
  const days = logPeriod({}, '2026-01-01', 2);
  days['2026-01-04'] = { flow: 2 }; // hueco el día 3
  days['2026-01-20'] = { flow: 1 }; // manchado: no es regla
  const p = getPeriods(days);
  assert.equal(p.length, 1);
  assert.deepEqual(p[0], { start: '2026-01-01', end: '2026-01-04', length: 4 });
});

test('estadísticas con tres ciclos', () => {
  const days = {};
  logPeriod(days, '2026-01-01', 5);
  logPeriod(days, '2026-01-31', 4); // 30
  logPeriod(days, '2026-03-02', 5); // 30
  logPeriod(days, '2026-03-30', 5); // 28
  const s = getStats(days);
  assert.equal(s.cycleLen, 29);
  assert.equal(s.periodLen, 5);
  assert.equal(s.irregular, false);
  assert.equal(s.confidence, 'alta');
});

test('sin datos usa los ajustes', () => {
  const s = getStats({}, { cycleLen: 32, periodLen: 6 });
  assert.equal(s.cycleLen, 32);
  assert.equal(s.periodLen, 6);
  assert.equal(predict({}, {}).hasData, false);
});

test('predicción, ventana fértil y fases', () => {
  const days = logPeriod({}, '2026-11-01', 5);
  const p = predict(days, { cycleLen: 28 }, '2026-11-03');
  assert.equal(p.inPeriod, true);
  assert.equal(p.cycleDay, 3);
  assert.equal(p.nextStart, '2026-11-29');
  assert.equal(p.ovulation, '2026-11-15');
  assert.equal(p.fertileStart, '2026-11-10');
  assert.equal(p.fertileEnd, '2026-11-16');
  assert.equal(phaseOf(p), 'menstrual');
  assert.equal(fertilityOn('2026-11-14', p), 'alta');
  assert.equal(fertilityOn('2026-11-11', p), 'media');
  assert.equal(fertilityOn('2026-11-22', p), 'baja');

  const p2 = predict(days, { cycleLen: 28 }, '2026-11-12');
  assert.equal(phaseOf(p2), 'fertil');
  const p3 = predict(days, { cycleLen: 28 }, '2026-11-20');
  assert.equal(phaseOf(p3), 'lutea');
  assert.equal(p3.daysUntil, 9);
});

test('retraso', () => {
  const days = logPeriod({}, '2026-10-01', 5);
  const p = predict(days, { cycleLen: 28 }, '2026-11-02');
  assert.equal(p.lateDays, 4);
  assert.equal(phaseOf(p), 'retraso');
  assert.equal(p.cycles.length, 0);
});

test('marcas del calendario', () => {
  const days = logPeriod({}, '2026-11-01', 5);
  days['2026-11-14'] = { sex: 'sin' };
  const p = predict(days, { cycleLen: 28 }, '2026-11-03');
  assert.equal(dayMarks('2026-11-02', days, p).period, true);
  const m = dayMarks('2026-11-15', days, p);
  assert.equal(m.ovulation, true);
  assert.equal(m.fertile, true);
  assert.equal(dayMarks('2026-11-14', days, p).sex, 'sin');
  assert.equal(dayMarks('2026-11-30', days, p).predictedPeriod, true);
});

test('riesgo de embarazo', () => {
  const days = logPeriod({}, '2026-11-01', 5);
  const p = predict(days, { cycleLen: 28 }, '2026-11-15');
  const now = new Date(2026, 10, 15, 10);
  const r = pregnancyRisk({ sexDate: '2026-11-14', method: 'nada', now }, p);
  assert.equal(r.level, 'alta');
  assert.equal(r.needsEmergency, true);
  assert.equal(r.pillLevonorgestrel, true);
  assert.equal(r.testDate, '2026-11-29'); // día que tocaba la regla (antes que +21 días)

  const ok = pregnancyRisk({ sexDate: '2026-11-14', method: 'condon_ok', now }, p);
  assert.equal(ok.level, 'muy_baja');
  assert.equal(ok.needsEmergency, false);

  const late = pregnancyRisk({ sexDate: '2026-11-10', method: 'condon_roto', now: new Date(2026, 10, 15, 10) }, p);
  assert.equal(late.pillLevonorgestrel, false); // > 72 h
  assert.equal(late.pillUlipristal, false); // 5 días + 10 h > 120 h
});

test('«ya no» cierra la regla aunque dure menos de lo habitual', () => {
  const days = logPeriod({}, '2026-11-01', 2);
  assert.equal(predict(days, { periodLen: 5 }, '2026-11-03').inPeriod, true);
  days['2026-11-03'] = { flow: 0 };
  assert.equal(predict(days, { periodLen: 5 }, '2026-11-03').inPeriod, false);
});

import { getAnomaly } from '../js/cycle.js';

test('anomalías: retraso con viaje apuntado', () => {
  const days = logPeriod({}, '2026-10-01', 5);
  days['2026-10-20'] = { factors: ['viaje'] };
  const p = predict(days, { cycleLen: 28 }, '2026-11-02');
  const a = getAnomaly(days, p);
  assert.equal(a.issues[0].type, 'late');
  assert.deepEqual(a.factors, [{ factor: 'viaje', date: '2026-10-20' }]);
});

test('anomalías: regla adelantada', () => {
  const days = {};
  logPeriod(days, '2026-08-01', 5);
  logPeriod(days, '2026-08-29', 5); // 28
  logPeriod(days, '2026-09-26', 5); // 28
  logPeriod(days, '2026-10-16', 5); // 20 → 8 días antes
  const p = predict(days, {}, '2026-10-18');
  assert.deepEqual(getAnomaly(days, p).issues.map((i) => i.type), ['early']);
  assert.equal(getAnomaly(days, predict(days, {}, '2026-10-30')), null); // pasado el día 10 ya no se muestra
});

import { dischargeStage } from '../js/cycle.js';

test('flujo esperado según el momento', () => {
  const days = logPeriod({}, '2026-11-01', 5);
  const at = (t) => dischargeStage(predict(days, { cycleLen: 28 }, t));
  assert.equal(at('2026-11-03'), 'menstrual');
  assert.equal(at('2026-11-07'), 'post');
  assert.equal(at('2026-11-11'), 'cremoso');
  assert.equal(at('2026-11-14'), 'ovulacion');
  assert.equal(at('2026-11-20'), 'lutea');
  assert.equal(at('2026-11-27'), 'premenstrual');
});

import { detectOvulation } from '../js/cycle.js';
import { contraStatus } from '../js/contraception.js';

test('ovulación detectada por test LH y por temperatura', () => {
  const days = logPeriod({}, '2026-11-01', 5);
  days['2026-11-17'] = { ovTest: 'positivo' };
  const p = predict(days, { cycleLen: 28 }, '2026-11-19');
  assert.equal(p.ovulation, '2026-11-18');
  assert.equal(p.ovulationSource, 'lh');
  assert.equal(p.nextStart, '2026-12-02'); // 14 días después

  const t = logPeriod({}, '2026-11-01', 5);
  const temps = [36.4, 36.5, 36.4, 36.45, 36.5, 36.4, 36.45, 36.8, 36.85, 36.9];
  temps.forEach((v, i) => { (t[addDays('2026-11-08', i)] ||= {}).temp = v; });
  assert.deepEqual(detectOvulation(t, '2026-11-01', '2026-11-20'), { date: '2026-11-14', source: 'temp' });
  assert.equal(detectOvulation(logPeriod({}, '2026-11-01', 5), '2026-11-01', '2026-11-20'), null);
});

test('anticonceptivo: píldora, descanso, olvido, anillo y DIU', () => {
  const pill = { method: 'pildora', start: '2026-11-01', pillType: '21', hour: 22 };
  assert.equal(contraStatus(pill, {}, '2026-11-01', 10).tone, 'todo');
  assert.equal(contraStatus(pill, {}, '2026-11-01', 23).tone, 'warn');
  assert.equal(contraStatus(pill, { '2026-11-01': { pill: true } }, '2026-11-01').marked, true);
  assert.equal(contraStatus(pill, {}, '2026-11-02').missed, true);
  assert.equal(contraStatus(pill, {}, '2026-11-23').title, 'Semana de descanso');
  assert.equal(contraStatus({ ...pill, pillType: '28' }, { '2026-11-22': { pill: true } }, '2026-11-23', 10).title.startsWith('Hoy toca'), true);
  assert.match(contraStatus({ method: 'anillo', start: '2026-11-01' }, {}, '2026-11-21').detail, /mañana/);
  assert.match(contraStatus({ method: 'diu_cobre', start: '2016-12-01', years: 10 }, {}, '2026-11-10').detail, /Caduca en 22 días/);
  assert.equal(contraStatus({ method: 'implante', start: '2020-01-01' }, {}, '2026-11-10').tone, 'warn');
  assert.equal(contraStatus({ method: 'ninguno' }, {}, '2026-11-10'), null);
});
