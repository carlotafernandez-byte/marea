// Asistente de Marea: entiende preguntas en lenguaje natural y responde con el contenido de la app
// y con TUS datos del ciclo. Funciona sin internet: tus preguntas no salen del móvil.

import { fromKey, fertilityOn, phaseOf } from './cycle.js';
import * as C from './content.js';

export const normalize = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim();

// Distancia de edición pequeña para tolerar faltas de ortografía ("enbarazada", "cistitis").
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

function hits(text, words, keyword) {
  const k = normalize(keyword);
  if (k.includes(' ')) return text.includes(k) ? 2 : 0; // frases: más peso
  if (words.some((w) => w.startsWith(k))) return 1; // inicio de palabra: «olor» no debe casar con «dolor»
  if (k.length >= 6 && words.some((w) => w.length >= 5 && lev(w.slice(0, k.length), k) <= 1)) return 0.8;
  return 0;
}

const fmt = (k) => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(fromKey(k));
const list = (arr) => `<ul>${arr.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const infById = (id) => C.INFECTIONS.find((i) => i.id === id);
const infAnswer = (id) => {
  const i = infById(id);
  return {
    html: `<b>${i.name}</b>. ${i.summary}<br><br><b>Es decir:</b> ${i.plain}<br><br><b>Qué hacer:</b>${list(i.treatment)}<b>Consulta</b> ${i.doctor.charAt(0).toLowerCase() + i.doctor.slice(1)}`,
    actions: [{ label: 'Comprobar mis síntomas', action: 'goto', value: 'cuidado:infecciones' }],
  };
};
const noData = {
  html: 'Todavía no tengo datos de tu ciclo. Apunta el primer día de tu última regla en <b>Hoy</b> y te lo digo.',
  actions: [{ label: 'Ir a Hoy', action: 'goto', value: 'hoy' }],
};

const INTENTS = [
  {
    id: 'saludo',
    kw: ['hola', 'buenas', 'hey', 'que tal'],
    answer: (c) => ({ html: `¡Hola${c.name ? ', ' + c.name : ''}! Aquí tu colega para todo lo de ahí abajo 💙 Pregúntame sin vergüenza: cuándo te toca, si puedes estar embarazada, qué te pica, si toca médico…` }),
  },
  { id: 'gracias', kw: ['gracias', 'genial', 'perfecto', 'vale guay'], answer: () => ({ html: 'De nada 💙 Aquí estoy para lo que necesites.' }) },
  {
    id: 'proxima',
    kw: ['cuando me baja', 'cuando me viene', 'proxima regla', 'cuanto falta', 'cuando me toca', 'siguiente regla', 'me toca la regla', 'cuando llega'],
    answer: ({ pred }) => {
      if (!pred.hasData) return noData;
      if (pred.inPeriod) return { html: `Ahora mismo estás en el día ${pred.cycleDay} de tu regla. La siguiente se espera hacia el <b>${fmt(pred.nextStart)}</b>.` };
      if (pred.lateDays > 0) return { html: `Te tocaba el ${fmt(pred.nextStart)}: llevas <b>${pred.lateDays} ${pred.lateDays === 1 ? 'día' : 'días'} de retraso</b>.`, actions: [{ label: '¿Por qué no me baja?', action: 'goto', value: 'dudas:retraso' }] };
      return { html: `Tu próxima regla debería llegar el <b>${fmt(pred.nextStart)}</b> (dentro de ${pred.daysUntil} ${pred.daysUntil === 1 ? 'día' : 'días'})${pred.stats.confidence !== 'alta' ? '. Es una estimación: mejorará cuando apuntes más ciclos' : `, con un margen de ±${pred.stats.variability} días`}.` };
    },
  },
  {
    id: 'fertil',
    kw: ['fertil', 'ovulo', 'ovulacion', 'ovulando', 'dias fertiles', 'cuando chingar', 'cuando follar', 'buscar bebe', 'quedarme embarazada', 'mejor dia'],
    answer: ({ pred, today }) => {
      if (!pred.hasData) return noData;
      const f = fertilityOn(today, pred);
      const now = { alta: 'Hoy estás en uno de tus <b>días más fértiles</b>.', media: 'Hoy estás <b>dentro de tu ventana fértil</b>.', baja: 'Hoy tu fertilidad es <b>baja</b>.' }[f];
      return { html: `${now} Tu ventana fértil va del <b>${fmt(pred.fertileStart)}</b> al <b>${fmt(pred.fertileEnd)}</b>, y la ovulación sería hacia el ${fmt(pred.ovulation)}. Los mejores días para buscar embarazo son los 2 anteriores a la ovulación y el mismo día.<br><br>Recuerda: ningún día es 100 % seguro para evitar embarazo.` };
    },
  },
  {
    id: 'retraso',
    kw: ['no me baja', 'no me viene', 'retraso', 'retrasada', 'se me ha retrasado', 'no me ha bajado', 'llega tarde', 'viaje', 'viajar', 'se me ha alterado', 'alterado', 'irregular', 'se adelanto', 'adelantado'],
    answer: ({ pred }) => {
      const intro = pred.hasData && pred.lateDays > 0 ? `Llevas ${pred.lateDays} ${pred.lateDays === 1 ? 'día' : 'días'} de retraso. ` : '';
      return {
        html: `${intro}Tranquila: los ciclos se mueven más de lo que parece. Las causas más comunes son:${list(['Estrés', 'Viajes y cambios de horario', 'Haber estado enferma', 'Cambios de peso, dieta o ejercicio', 'Anticonceptivos o la píldora del día después', 'Embarazo, si hubo relaciones sin protección'])}Si hubo riesgo, hazte un test. Si pasan 3 meses sin regla, consulta.`,
        actions: [{ label: 'Ver todas las causas', action: 'goto', value: 'dudas:retraso' }],
      };
    },
  },
  {
    id: 'embarazo',
    kw: ['embarazada', 'embarazo', 'condon', 'rompio', 'sin condon', 'sin proteccion', 'se rompio', 'condon roto', 'marcha atras', 'preservativo roto', 'se salio el condon', 'me corri dentro', 'preseminal'],
    answer: () => ({
      html: 'Depende de en qué día del ciclo fue y del método. Te lo calculo en un momento con tus datos: riesgo, si llegas a tiempo de la píldora del día después y qué día hacerte el test.',
      actions: [{ label: 'Calcular mi riesgo', action: 'goto', value: 'dudas:embarazo' }],
    }),
  },
  {
    id: 'urgencia',
    kw: ['dia despues', 'pastilla del dia', 'pildora del dia', 'anticoncepcion de urgencia', 'ellaone', 'postinor', 'norlevo'],
    answer: () => ({
      html: `Hay tres opciones, y cuanto antes, mejor:${list(['<b>Levonorgestrel</b>: hasta 72 h. En farmacia, sin receta.', '<b>Ulipristal (ellaOne)</b>: hasta 120 h (5 días). Más eficaz. Sin receta.', '<b>DIU de cobre</b>: hasta 5 días. El más eficaz (>99 %); pide cita urgente.'])}No es abortiva: retrasa la ovulación. Puede adelantar o retrasar tu siguiente regla.`,
      actions: [{ label: 'Calcular mi riesgo', action: 'goto', value: 'dudas:embarazo' }],
    }),
  },
  {
    id: 'test',
    kw: ['test', 'prueba de embarazo', 'predictor', 'clearblue', 'cuando me hago', 'falso negativo'],
    answer: () => ({ html: 'El test de orina es fiable <b>desde el día que te tocaba la regla</b> o 21 días después de la relación de riesgo. Mejor con la primera orina de la mañana. Si da negativo y sigue sin bajarte, repítelo a los 3–5 días.', actions: [{ label: 'Qué test comprar', action: 'goto', value: 'cuidado:marcas' }] }),
  },
  {
    id: 'regla_sexo',
    kw: ['con la regla', 'durante la regla', 'estando con la regla'],
    answer: () => ({ html: 'Quedarse embarazada con la regla es poco probable, pero posible, sobre todo si tus ciclos son cortos: los espermatozoides sobreviven hasta 5 días. Y las ITS se transmiten igual: el preservativo sigue siendo importante.' }),
  },
  { id: 'candidiasis', kw: ['candidiasis', 'candida', 'hongos', 'requeson', 'picor', 'pica', 'me pica'], answer: () => infAnswer('candidiasis') },
  { id: 'cistitis', kw: ['cistitis', 'infeccion de orina', 'escozor al orinar', 'me escuece al hacer pis', 'ganas de orinar', 'escuece', 'orinar'], answer: () => infAnswer('cistitis') },
  { id: 'vaginosis', kw: ['vaginosis', 'olor a pescado', 'huele mal', 'mal olor', 'olor'], answer: () => infAnswer('vaginosis') },
  {
    id: 'its',
    kw: ['its', 'ets', 'clamidia', 'gonorrea', 'herpes', 'transmision sexual', 'sifilis', 'vph', 'llagas', 'tricomonas'],
    answer: () => ({ html: 'Muchas ITS no dan síntomas, por eso conviene hacerse pruebas con cada pareja nueva. Son gratis en tu centro de salud o en los centros de ITS. Señales para consultar: flujo distinto, sangrado tras el sexo, dolor, llagas o ampollas.', actions: [{ label: 'Ver infecciones', action: 'goto', value: 'cuidado:infecciones' }] }),
  },
  {
    id: 'flujo',
    kw: ['flujo', 'clara de huevo', 'moco', 'secrecion'],
    answer: () => ({ html: `El flujo cambia con el ciclo y es normal:${list(['Tras la regla: escaso o pegajoso', 'Cerca de la ovulación: transparente y elástico, como clara de huevo', 'Antes de la regla: más cremoso y blanquecino'])}Consulta si cambia de color (verde, gris, amarillo), huele fuerte o pica.` }),
  },
  {
    id: 'dolor',
    kw: ['dolor', 'duele', 'calambres', 'colico', 'regla dolorosa', 'endometriosis', 'ibuprofeno', 'dolor de regla'],
    answer: () => ({ html: `Para el dolor de regla:${list(C.PAIN.remedies.map(([, t, d]) => `<b>${t}</b>: ${d}`))}No es normal que el dolor te tumbe o no se calme con analgésicos: puede ser endometriosis. Consúltalo.`, actions: [{ label: 'Guía de dolor', action: 'goto', value: 'cuidado:dolor' }] }),
  },
  {
    id: 'abundante',
    kw: ['abundante', 'mucho sangrado', 'sangro mucho', 'coagulos', 'empapo', 'hemorragia'],
    answer: () => ({ html: 'Una regla abundante es la que te obliga a cambiarte cada 1–2 horas, dura más de 7 días o tiene coágulos más grandes que una moneda de 2 €. Si es lo habitual, pide cita (puede causar anemia). <b>Si empapas una compresa cada hora durante 2 horas o te mareas, ve a urgencias.</b>', actions: [{ label: '¿Voy al médico?', action: 'goto', value: 'dudas:medico' }] }),
  },
  {
    id: 'manchado',
    kw: ['manchado', 'manchar', 'manche', 'mancho', 'sangrado entre', 'sangro sin', 'implantacion', 'marron'],
    answer: () => ({ html: `Manchar entre reglas suele ser benigno:${list(C.CALM_BY_ISSUE.spotting.reasons)}Si se repite o pasa después del sexo, coméntalo con tu médica.` }),
  },
  {
    id: 'spm',
    kw: ['premenstrual', 'spm', 'humor', 'antojos', 'hinchada', 'irritable', 'triste antes', 'sensible'],
    answer: () => ({ html: 'Los días antes de la regla baja la progesterona y pueden aparecer hinchazón, pechos sensibles, antojos o cambios de humor. Ayudan: dormir bien, moverte, menos sal y cafeína. Si te afecta mucho a la vida diaria, puede ser trastorno disfórico premenstrual y tiene tratamiento.' }),
  },
  {
    id: 'medico',
    kw: ['medico', 'medica', 'urgencias', 'ginecologo', 'ginecologa', 'cuando ir', 'es grave', 'preocupante', 'me preocupa'],
    answer: () => ({ html: `<b>Urgencias ya</b> si tienes: dolor muy fuerte en la tripa con retraso o test positivo, sangrado que empapa una compresa cada hora, fiebre con tampón puesto o infección de orina con fiebre y dolor lumbar.<br><br>Para todo lo demás, mira la guía semáforo.`, actions: [{ label: '¿Voy al médico?', action: 'goto', value: 'dudas:medico' }] }),
  },
  {
    id: 'productos',
    kw: ['copa', 'tampon', 'tampones', 'compresa', 'compresas', 'braga menstrual', 'bragas menstruales', 'marca', 'marcas', 'recomiendas', 'producto', 'que compro', 'preservativo', 'condones'],
    answer: () => ({ html: `Según los análisis independientes de la OCU:${list(['<b>Compresas</b>: Ausonia Normal (87/100); Carrefour Ultra finas, la mejor en precio', '<b>Tampones</b>: O.B. Pro Comfort (80/100); Carrefour Compact, la mejor en precio', '<b>Bragas menstruales</b>: Sloggi, la más absorbente', '<b>Preservativos</b>: todas las marcas con marcado CE son seguras'])}`, actions: [{ label: 'Ver todas las marcas', action: 'goto', value: 'cuidado:marcas' }] }),
  },
  {
    id: 'higiene',
    kw: ['lavar', 'lavarme', 'higiene', 'jabon', 'gel intimo', 'ducha vaginal', 'limpiar'],
    answer: () => ({ html: 'La vagina se limpia sola: lava solo la vulva, por fuera, con agua o un gel suave sin perfume y con pH ácido, una vez al día. Nada de duchas vaginales ni toallitas perfumadas.', actions: [{ label: 'Guía de higiene', action: 'goto', value: 'cuidado:higiene' }] }),
  },
  {
    id: 'anticonceptivos',
    kw: ['anticonceptivo', 'anticonceptivos', 'pildora', 'diu', 'implante', 'anillo', 'parche', 'olvide la pastilla'],
    answer: () => ({ html: 'Si olvidaste una píldora, tómala en cuanto te acuerdes y sigue normal; si fueron 2 o más, o te salió el anillo más de 48 h, usa preservativo 7 días y valora la píldora del día después si hubo relaciones. El prospecto de tu marca manda. Para elegir método, tu centro de salud o de planificación familiar te asesora gratis.<br><br><b>Es decir:</b> ¿se te ha pasado? Tómatela ya y no te agobies. Y si fueron varias, condón una semana.', actions: [{ label: 'Configurar avisos de mi anticonceptivo', action: 'goto', value: 'salud:anticonceptivo' }] }),
  },
  {
    id: 'musica',
    kw: ['musica', 'playlist', 'playlists', 'spotify', 'cancion', 'canciones', 'que escucho', 'escuchar'],
    answer: ({ pred }) => {
      const m = C.MUSIC_BY_PHASE[pred.hasData ? phaseOf(pred) : 'folicular'];
      return {
        html: `Ahora mismo te pega esto, <b>${m.title.toLowerCase()}</b>: ${m.lists.map((k) => `<a href="https://open.spotify.com/playlist/${C.PLAYLISTS[k].id}" target="_blank" rel="noopener noreferrer">${C.PLAYLISTS[k].name}</a>`).join(', ')}. Dale al play 🎧`,
        actions: [{ label: 'Más música para cada momento', action: 'goto', value: 'musica' }],
      };
    },
  },
  {
    id: 'fases',
    kw: ['fase', 'fases del ciclo', 'fases de mi ciclo', 'fases de la menstruacion', 'fases de la regla', 'folicular', 'lutea', 'luteal', 'ovulacion que es', 'que pasa en mi cuerpo', 'hormonas', 'ciclo menstrual'],
    answer: ({ pred }) => ({
      html: `El ciclo tiene 4 fases:${list(C.PHASE_GUIDE.map((p) => `<b>${p.name}</b> (${p.days.toLowerCase()}): ${p.what.split('. ')[0]}.<br><i>Es decir:</i> ${p.plain}`))}${pred.hasData ? 'En la guía te digo en qué fase estás y las fechas de cada una.' : ''}`,
      actions: [{ label: 'Ver la guía de las fases', action: 'goto', value: 'fases' }],
    }),
  },
  {
    id: 'temperatura',
    kw: ['temperatura', 'basal', 'test de ovulacion', 'tests de ovulacion', 'lh', 'confirmar ovulacion', 'cuando ovulo'],
    answer: () => ({
      html: 'Hay dos formas de confirmar cuándo ovulas: la <b>temperatura basal</b> (sube 0,2–0,5 °C después de ovular) y los <b>tests de ovulación</b> (detectan la hormona LH 24–36 h antes). Apúntalos con el botón ＋ y Marea afina tus predicciones.<br><br><b>Es decir:</b> el termómetro te dice «ya has ovulado» y el test te dice «vas a ovular».',
      actions: [{ label: 'Ver cómo hacerlo', action: 'goto', value: 'salud:fertilidad' }],
    }),
  },
  {
    id: 'ciclo',
    kw: ['cuanto dura mi ciclo', 'duracion', 'mi ciclo', 'es normal mi ciclo', 'cuantos dias'],
    answer: ({ pred }) => {
      if (!pred.hasData) return noData;
      const s = pred.stats;
      return { html: `Tu ciclo medio es de <b>${s.cycleLen} días</b> y tu regla dura unos <b>${s.periodLen}</b>. Lo normal es entre 21 y 35 días de ciclo y de 2 a 7 de regla.${s.irregular ? ` Tus ciclos varían ${s.range} días entre sí, algo más de lo habitual.` : ''}` };
    },
  },
];

export const SUGGESTIONS = ['¿Cuándo me baja?', 'Explícame las fases del ciclo', 'Ponme música', '¿Estoy en días fértiles?', 'Se me rompió el condón', 'Me pica ahí abajo', 'Me he ido de viaje y no me baja', '¿Cuándo voy al médico?'];

/** Responde a una pregunta. ctx = { pred, today, name } */
export function answer(question, ctx) {
  const text = normalize(question);
  const words = text.split(' ');
  if (!text) return { html: '¿Qué quieres saber?' };
  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const score = intent.kw.reduce((s, k) => s + hits(text, words, k), 0);
    if (score > bestScore) { best = intent; bestScore = score; }
  }
  if (!best) {
    return {
      html: 'Uy, eso no lo sé responder todavía. Prueba a preguntarlo de otra forma o con alguna de estas ideas. Si es algo urgente o te encuentras mal, llama al <b>112</b>.',
      suggestions: SUGGESTIONS.slice(0, 4),
      intent: null,
    };
  }
  return { ...best.answer(ctx), intent: best.id };
}
