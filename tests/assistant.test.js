import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer } from '../js/assistant.js';
import { addDays, predict } from '../js/cycle.js';

const days = {};
for (let i = 0; i < 5; i++) days[addDays('2026-11-01', i)] = { flow: 3 };
const ctx = { pred: predict(days, { cycleLen: 28 }, '2026-11-12'), today: '2026-11-12', name: 'Ana' };
const intent = (q) => answer(q, ctx).intent;

test('entiende preguntas habituales', () => {
  assert.equal(intent('¿Cuándo me baja la regla?'), 'proxima');
  assert.equal(intent('estoy en dias fertiles?'), 'fertil');
  assert.equal(intent('se me rompió el condón'), 'embarazo');
  assert.equal(intent('puedo estar enbarazada'), 'embarazo'); // falta de ortografía
  assert.equal(intent('me pica mucho ahí abajo'), 'candidiasis');
  assert.equal(intent('me escuece al hacer pis'), 'cistitis');
  assert.equal(intent('me he ido de viaje y no me baja'), 'retraso');
  assert.equal(intent('tengo mucho dolor de regla'), 'dolor'); // no confundir «dolor» con «olor»
  assert.equal(intent('qué compresas me recomiendas'), 'productos');
  assert.equal(intent('cuándo tengo que ir al médico'), 'medico');
  assert.equal(intent('la pastilla del día después'), 'urgencia');
});

test('usa los datos del ciclo', () => {
  assert.match(answer('cuando me baja', ctx).html, /29 de noviembre/);
  assert.match(answer('estoy fertil', ctx).html, /ventana fértil/);
});

test('respuesta de reserva', () => {
  const r = answer('cuál es la capital de Francia', ctx);
  assert.equal(r.intent, null);
  assert.ok(r.suggestions.length);
});

test('fases del ciclo', () => {
  assert.equal(intent('explícame las fases de la menstruación'), 'fases');
  assert.equal(intent('quiero que me expliques las fases de mi ciclo'), 'fases');
  assert.equal(intent('qué es la fase lútea'), 'fases');
});

test('música y tono de colega', () => {
  assert.equal(intent('ponme música'), 'musica');
  assert.equal(intent('alguna playlist de spotify?'), 'musica');
  assert.match(answer('me pica', ctx).html, /Es decir/);
  assert.match(answer('cuáles son las fases del ciclo', ctx).html, /Es decir/);
});

test('temperatura y tests de ovulación', () => {
  assert.equal(intent('cómo me tomo la temperatura basal'), 'temperatura');
  assert.equal(intent('cuándo hago el test de ovulación'), 'temperatura');
});
