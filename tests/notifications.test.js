import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReminders } from '../js/notifications.js';
import { addDays, predict } from '../js/cycle.js';

const days = {};
for (let i = 0; i < 5; i++) days[addDays('2026-11-01', i)] = { flow: 3 };
const now = new Date(2026, 10, 10, 12); // 10 nov, 12:00 hora local

test('avisos de regla y días fértiles', () => {
  const settings = { goal: 'buscar' };
  const r = buildReminders({ pred: predict(days, { cycleLen: 28 }, '2026-11-10'), settings, days }, now);
  const titles = r.map((n) => `${n.at.getDate()}/${n.at.getMonth() + 1} ${n.title}`);
  assert.ok(titles.includes('27/11 Tu regla llega en 2 días'));
  assert.ok(titles.includes('29/11 Hoy podría bajarte la regla'));
  assert.ok(titles.includes('8/12 Empiezan tus días fértiles'));
  assert.ok(r.every((n) => n.at > now));
  assert.equal(new Set(r.map((n) => n.id)).size, r.length);
});

test('píldora: aviso diario sin la semana de descanso, y modo discreto', () => {
  const settings = { goal: 'controlar', contra: { method: 'pildora', start: '2026-11-01', pillType: '21', hour: 22 } };
  const r = buildReminders({ pred: predict(days, {}, '2026-11-10'), settings, days }, now, true);
  const pill = r.filter((n) => n.at.getHours() === 22);
  assert.ok(pill.length > 10);
  assert.ok(!pill.some((n) => n.at.getDate() === 25 && n.at.getMonth() === 10)); // 25 nov = día 25 del blíster, descanso
  assert.ok(r.every((n) => n.title === 'Diario' && !/regla|píldora/i.test(n.body)));
});

test('respeta las preferencias', () => {
  const settings = { goal: 'buscar', notify: { period: false, fertile: false } };
  assert.equal(buildReminders({ pred: predict(days, {}, '2026-11-10'), settings, days }, now).length, 0);
});
