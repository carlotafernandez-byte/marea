// Contenido de salud. Información general basada en guías clínicas habituales (SEGO, OMS, NHS, CDC).
// No sustituye a una consulta médica: la app lo recuerda en cada sección.

export const PHASES = {
  menstrual: {
    name: 'Regla',
    plain: 'Estás en modo batería baja. Te va a doler la tripa, vas a querer sofá, manta y chocolate, y no te apetece ver a nadie. Normal: date permiso para ir a medio gas.',
    emoji: '🌊',
    text: 'El útero suelta su capa interna. Es normal tener calambres, cansancio y menos energía. El calor en la tripa y el ibuprofeno ayudan con el dolor.',
  },
  folicular: {
    name: 'Fase folicular',
    plain: 'Estás on fire. Más energía, te ves mejor en el espejo y te apetece hacer planes. Aprovecha para lo difícil.',
    emoji: '🌱',
    text: 'Sube el estrógeno: suele venir más energía, mejor humor y mejor piel. Tu cuerpo prepara un óvulo.',
  },
  fertil: {
    name: 'Ventana fértil',
    plain: 'Estás en tu momento: te ves guapa, con ganas de todo (sí, también de eso) y es cuando más fácil es quedarse embarazada. Ojo con el condón.',
    emoji: '✨',
    text: 'Estás en tus días fértiles. El flujo se vuelve más elástico y transparente (tipo clara de huevo) y puede subir la libido.',
  },
  lutea: {
    name: 'Fase lútea',
    emoji: '🌙',
    plain: 'Se viene el bajón: hinchada, con hambre de comerte la nevera, sensible y con la mecha corta. No eres tú, son las hormonas.',
    text: 'Manda la progesterona. En los últimos días pueden aparecer hinchazón, pechos sensibles, antojos o cambios de humor (síndrome premenstrual).',
  },
  retraso: {
    name: 'Retraso',
    plain: 'Tu regla llega tarde, pero casi siempre hay una explicación tonta: estrés, un viaje, dormir mal. Respira y mira las causas antes de agobiarte.',
    emoji: '⏳',
    text: 'Tu regla llega más tarde de lo esperado. Un retraso de unos días es muy habitual; abajo te contamos por qué puede pasar.',
  },
};

export const FLOWS = [
  { v: 1, label: 'Manchado', dots: 1 },
  { v: 2, label: 'Ligero', dots: 2 },
  { v: 3, label: 'Medio', dots: 3 },
  { v: 4, label: 'Abundante', dots: 4 },
];

export const SYMPTOMS = [
  ['calambres', 'Calambres'], ['cabeza', 'Dolor de cabeza'], ['pechos', 'Pechos sensibles'],
  ['hinchazon', 'Hinchazón'], ['acne', 'Granitos'], ['cansancio', 'Cansancio'],
  ['nauseas', 'Náuseas'], ['antojos', 'Antojos'], ['espalda', 'Dolor de espalda'],
  ['insomnio', 'Insomnio'], ['picor', 'Picor íntimo'], ['escozor', 'Escozor al orinar'],
];

export const MOODS = [
  ['feliz', '😊 Bien'], ['tranqui', '😌 Tranqui'], ['sensible', '🥺 Sensible'],
  ['irritable', '😤 Irritable'], ['ansiosa', '😰 Ansiosa'], ['triste', '😢 Triste'], ['ganas', '🔥 Con ganas'],
];

export const DISCHARGE = [
  ['seco', 'Seco o casi nada'], ['pegajoso', 'Pegajoso'], ['cremoso', 'Cremoso blanco'],
  ['clara', 'Clara de huevo'], ['marron', 'Marrón'], ['grumoso', 'Grumoso (requesón)'],
  ['gris', 'Gris o con olor a pescado'], ['verde', 'Amarillo-verdoso o espumoso'],
];
// Tipos que nunca son «normales» y merecen mirarse. «raro» es de versiones anteriores.
export const DISCHARGE_WARN = ['grumoso', 'gris', 'verde', 'raro'];
export const dischargeLabel = (v) => (DISCHARGE.find((d) => d[0] === v) || [v, v === 'raro' ? 'Raro (color/olor)' : v])[1];

export const METHODS = [
  ['nada', 'Sin protección'],
  ['condon_roto', 'El condón se rompió o se salió'],
  ['marcha_atras', 'Marcha atrás'],
  ['pastilla_olvidada', 'Olvidé la píldora / el parche / el anillo'],
  ['condon_ok', 'Condón bien puesto todo el rato'],
  ['hormonal_ok', 'Píldora, parche o anillo bien usados'],
  ['diu', 'DIU o implante'],
];

export const RISK_TEXT = {
  muy_baja: {
    title: 'Riesgo muy bajo',
    plain: 'Tranqui, lo has hecho bien. Si te retrasas mucho, test y a dormir tranquila.',
    tone: 'ok',
    text: 'Con el método bien usado, la probabilidad de embarazo es muy baja. Si aun así te retrasas más de una semana, hazte un test para quedarte tranquila.',
  },
  baja: {
    title: 'Riesgo bajo, pero no cero',
    plain: 'Pinta bien, pero el cuerpo no es un reloj suizo. Si quieres dormir tranquila, píldora del día después.',
    tone: 'mid',
    text: 'Según tus datos, la relación fue fuera de tus días más fértiles. Ojo: la ovulación puede adelantarse o retrasarse, así que no hay días 100 % seguros.',
  },
  media: {
    title: 'Hay riesgo',
    plain: 'Hay papeletas. Si no quieres un bebé, pásate hoy por la farmacia.',
    tone: 'warn',
    text: 'Fue en tu ventana fértil, o no tenemos datos suficientes para saberlo. Plantéate la anticoncepción de urgencia si estás a tiempo.',
  },
  alta: {
    title: 'Riesgo alto',
    plain: 'Era tu día más fértil. Farmacia ya, sin pensarlo mucho.',
    tone: 'bad',
    text: 'Fue en tus días más fértiles (alrededor de la ovulación). Si no buscas embarazo, la anticoncepción de urgencia es lo más recomendable, y cuanto antes mejor.',
  },
};

export const PREGNANCY_FAQ = [
  ['¿Me puedo quedar embarazada con la regla?', 'Es poco probable, pero posible, sobre todo con ciclos cortos: los espermatozoides sobreviven hasta 5 días y la ovulación puede llegar pronto.'],
  ['¿Y con el líquido preseminal?', 'Puede contener espermatozoides. La marcha atrás falla en torno a 1 de cada 5 parejas al año con uso típico.'],
  ['¿Cuándo me hago el test?', 'Los test de orina son fiables desde el día que te tocaba la regla, o 21 días después de la relación de riesgo. Mejor con la primera orina de la mañana. Si sale negativo y la regla no llega, repítelo a los 3–5 días.'],
  ['¿La píldora del día después es un aborto?', 'No. Retrasa la ovulación; si ya hay embarazo, no lo interrumpe ni lo daña. Se compra en farmacias sin receta y no hace falta ser mayor de edad.'],
  ['¿Sangrar un poco significa que no estoy embarazada?', 'No siempre. Puede haber un pequeño sangrado de implantación (manchado rosado o marrón, 1–2 días) alrededor de cuando tocaba la regla.'],
  ['Síntomas tempranos de embarazo', 'Retraso, pechos sensibles, náuseas, cansancio, ganas de orinar más a menudo. Se parecen mucho al síndrome premenstrual: solo el test lo confirma.'],
];

export const LATE_CAUSES = [
  ['🤰', 'Embarazo', 'La causa más frecuente si has tenido relaciones sin protección (o con un fallo del método). Descártalo con un test.'],
  ['😵‍💫', 'Estrés', 'Exámenes, trabajo, un disgusto… El estrés puede retrasar la ovulación y, con ella, la regla.'],
  ['⚖️', 'Cambios de peso', 'Bajar o subir mucho de peso, o comer poco, altera las hormonas que regulan el ciclo.'],
  ['🏃‍♀️', 'Ejercicio intenso', 'Entrenar muy fuerte sin comer suficiente puede hacer que la regla se retrase o desaparezca.'],
  ['💊', 'Anticonceptivos', 'Al empezar, cambiar o dejar la píldora, el DIU hormonal o el implante, la regla puede cambiar mucho o desaparecer. La píldora del día después también puede adelantarla o retrasarla.'],
  ['✈️', 'Viajes y horarios', 'Cambios de huso horario, turnos de noche o dormir poco.'],
  ['🤒', 'Enfermedad', 'Una gripe, una infección o cualquier enfermedad reciente pueden mover la ovulación.'],
  ['🫧', 'Síndrome de ovario poliquístico (SOP)', 'Causa ciclos irregulares o muy largos. Suele acompañarse de acné, exceso de vello o dificultad para bajar de peso.'],
  ['🦋', 'Tiroides', 'Tanto el hipotiroidismo como el hipertiroidismo alteran el ciclo. Se mira con un análisis de sangre.'],
  ['🍼', 'Lactancia', 'Dar el pecho puede frenar la regla durante meses (pero no es un anticonceptivo fiable).'],
  ['🌗', 'Perimenopausia', 'A partir de los 40, los ciclos se vuelven irregulares antes de la menopausia.'],
  ['🧪', 'Medicamentos', 'Algunos antidepresivos, antipsicóticos, corticoides o tratamientos de quimioterapia.'],
];

export const LATE_DOCTOR = [
  'No te baja durante 3 meses seguidos (o 6 si siempre has sido irregular).',
  'Tienes 15 años o más y nunca te ha bajado la regla.',
  'El test es positivo (para empezar el control, o para informarte de tus opciones).',
  'Te duele mucho la tripa, sobre todo de un lado, o sangras de forma rara con un test positivo: ve a urgencias.',
  'Tus ciclos cambian de golpe y se quedan así, o duran menos de 21 días o más de 35 habitualmente.',
];

// Infecciones: los síntomas llevan peso para el comprobador.
export const INFECTIONS = [
  {
    id: 'candidiasis',
    name: 'Candidiasis',
    plain: 'Hongos. Pica muchísimo, el flujo parece requesón y no huele raro. Es supercomún y no tiene nada que ver con ser poco limpia: en la farmacia te lo solucionan sin receta.',
    emoji: '🍄',
    summary: 'Infección por hongos (Candida). Muy frecuente: 3 de cada 4 mujeres la tendrán alguna vez. No es una ITS.',
    symptoms: { picor: 3, flujo_blanco_grumoso: 3, enrojecimiento: 2, escozor_vulva: 2, dolor_sexo: 1, escozor_orinar: 1 },
    causes: 'Antibióticos, embarazo, diabetes mal controlada, humedad (bañador mojado, ropa sintética), defensas bajas.',
    treatment: [
      'Clotrimazol vaginal (óvulo o crema): en España se vende en farmacia sin receta.',
      'Crema antifúngica por fuera para el picor de la vulva.',
      'El fluconazol oral necesita receta.',
      'No hace falta tratar a la pareja si no tiene síntomas.',
    ],
    products: ['Óvulo vaginal de clotrimazol', 'Crema de clotrimazol', 'Ropa interior de algodón', 'Gel íntimo sin perfume'],
    doctor: 'Si es la primera vez, si estás embarazada, si tienes 4 o más al año, si no mejora en una semana o si tienes fiebre o dolor en la tripa.',
  },
  {
    id: 'vaginosis',
    name: 'Vaginosis bacteriana',
    plain: 'Tus bacterias buenas se han desequilibrado. La pista es el olor a pescado, sobre todo después del sexo. No se va sola: necesitas que te lo receten.',
    emoji: '🐟',
    summary: 'Desequilibrio de las bacterias de la vagina. Es la causa más común de flujo anormal. No es una ITS, aunque se relaciona con el sexo.',
    symptoms: { olor_pescado: 3, flujo_gris_fino: 3, olor_tras_sexo: 2, picor: 1 },
    causes: 'Duchas vaginales, jabones agresivos, pareja sexual nueva, DIU de cobre, tabaco.',
    treatment: [
      'Necesita antibiótico con receta (metronidazol o clindamicina): pide cita con tu médica o enfermera.',
      'Los geles de ácido láctico y algunos probióticos vaginales sin receta pueden ayudar a recuperar el pH, pero no sustituyen al tratamiento.',
      'Sin tratar puede volver o complicar un embarazo.',
    ],
    products: ['Gel vaginal de ácido láctico (pH)', 'Probióticos vaginales con lactobacilos', 'Preservativo'],
    doctor: 'Siempre para confirmarla y tratarla. Con urgencia si estás embarazada.',
  },
  {
    id: 'cistitis',
    name: 'Cistitis (infección de orina)',
    plain: 'Infección de orina. Te escuece al hacer pis, vas al baño cada cinco minutos y salen cuatro gotas. Agua a litros y al médico, que con un sobre suele quedar arreglado.',
    emoji: '🚽',
    summary: 'Infección de la vejiga, casi siempre por bacterias del intestino. Muy común tras el sexo.',
    symptoms: { escozor_orinar: 3, ganas_orinar: 3, poca_orina: 2, dolor_bajo_vientre: 2, orina_turbia: 2, sangre_orina: 2 },
    causes: 'Sexo (empuja bacterias hacia la uretra), aguantar las ganas de orinar, beber poco, limpiarse de atrás hacia delante, espermicidas.',
    treatment: [
      'Bebe mucha agua y no aguantes las ganas de orinar.',
      'Ibuprofeno o paracetamol para el dolor.',
      'Normalmente necesita antibiótico con receta (por ejemplo, fosfomicina en dosis única). Tu centro de salud lo resuelve rápido.',
      'Arándano rojo y D-manosa: la evidencia es limitada; pueden ayudar a prevenir, no a curar.',
    ],
    products: ['Agua, mucha', 'Bolsa de calor para la tripa', 'Suplemento de arándano rojo o D-manosa (prevención)'],
    doctor: 'Si no mejora en 48 h, si estás embarazada o si se repite. Ve a urgencias si tienes fiebre, escalofríos, dolor en la zona lumbar o vómitos: puede haber llegado al riñón.',
  },
  {
    id: 'tricomoniasis',
    name: 'Tricomoniasis',
    plain: 'Una ITS que se pasa en el sexo. Flujo verdoso, con espuma y mal olor. Os tenéis que tratar los dos, o os la vais pasando como una pelota.',
    emoji: '🦠',
    summary: 'Infección de transmisión sexual causada por un parásito. Muchas veces no da síntomas.',
    symptoms: { flujo_verde_espumoso: 3, olor_fuerte: 2, picor: 2, escozor_orinar: 1, dolor_sexo: 1 },
    causes: 'Relaciones sexuales sin preservativo.',
    treatment: [
      'Antibiótico con receta (metronidazol).',
      'Hay que tratar también a la pareja, y no tener relaciones hasta terminar el tratamiento.',
    ],
    products: ['Preservativo'],
    doctor: 'Siempre. Aprovecha para hacerte también las pruebas de otras ITS.',
  },
  {
    id: 'clamidia',
    name: 'Clamidia o gonorrea',
    plain: 'Las ITS más silenciosas: muchas veces no notas nada. Si te has acostado sin condón con alguien nuevo, hazte la prueba aunque estés perfecta.',
    emoji: '🔬',
    summary: 'Las ITS bacterianas más frecuentes. Hasta 7 de cada 10 veces no dan ningún síntoma, por eso conviene hacerse pruebas.',
    symptoms: { sangrado_entre_reglas: 3, sangrado_tras_sexo: 3, flujo_amarillo: 2, dolor_bajo_vientre: 1, dolor_sexo: 2, escozor_orinar: 1 },
    causes: 'Relaciones (vaginales, anales u orales) sin preservativo.',
    treatment: [
      'Antibiótico con receta. Se curan bien si se tratan pronto.',
      'Sin tratar pueden causar enfermedad inflamatoria pélvica e infertilidad.',
      'Avisa a tus parejas sexuales recientes.',
    ],
    products: ['Preservativo', 'Prueba de ITS (centro de salud o centro de ITS, gratis)'],
    doctor: 'Siempre. Si tienes pareja nueva o varias, hazte pruebas aunque no tengas síntomas.',
  },
  {
    id: 'herpes',
    name: 'Herpes genital',
    plain: 'Un virus que da llagas o ampollitas que duelen y que va y viene. No es el fin del mundo, pero que te lo mire alguien para confirmarlo.',
    emoji: '🔥',
    summary: 'ITS causada por un virus. Da brotes que van y vienen.',
    symptoms: { llagas: 3, ampollas: 3, escozor_vulva: 1, dolor_sexo: 1 },
    causes: 'Contacto piel con piel, incluido sexo oral con alguien que tiene herpes labial.',
    treatment: [
      'Antivirales con receta: acortan los brotes si se toman pronto.',
      'Lavar con agua y secar bien; ropa holgada.',
    ],
    products: ['Preservativo / barrera de látex', 'Ropa interior de algodón'],
    doctor: 'Siempre que veas llagas o ampollas, para confirmarlo.',
  },
];

export const INFECTION_SYMPTOMS = [
  ['picor', 'Picor en la vulva o la vagina'],
  ['escozor_vulva', 'Escozor o irritación por fuera'],
  ['enrojecimiento', 'Enrojecimiento o hinchazón'],
  ['flujo_blanco_grumoso', 'Flujo blanco y grumoso (tipo requesón)'],
  ['flujo_gris_fino', 'Flujo grisáceo y líquido'],
  ['flujo_verde_espumoso', 'Flujo verde-amarillento y espumoso'],
  ['flujo_amarillo', 'Flujo amarillento o diferente al habitual'],
  ['olor_pescado', 'Olor a pescado'],
  ['olor_tras_sexo', 'El olor empeora después del sexo'],
  ['olor_fuerte', 'Olor fuerte o desagradable'],
  ['escozor_orinar', 'Escozor al orinar'],
  ['ganas_orinar', 'Ganas de orinar todo el rato'],
  ['poca_orina', 'Orinas poquito cada vez'],
  ['orina_turbia', 'Orina turbia o con mal olor'],
  ['sangre_orina', 'Sangre en la orina'],
  ['dolor_bajo_vientre', 'Dolor en la parte baja de la tripa'],
  ['dolor_sexo', 'Dolor durante el sexo'],
  ['sangrado_entre_reglas', 'Sangrado entre reglas'],
  ['sangrado_tras_sexo', 'Sangrado después del sexo'],
  ['llagas', 'Llagas o heridas'],
  ['ampollas', 'Ampollitas'],
];

export const RED_FLAGS = [
  'Fiebre, escalofríos o dolor en la zona lumbar',
  'Dolor fuerte en la tripa',
  'Estás embarazada',
];

/** Devuelve las infecciones ordenadas por encaje con los síntomas marcados. */
export function matchInfections(selected) {
  if (!selected.length) return [];
  return INFECTIONS.map((inf) => {
    const total = Object.values(inf.symptoms).reduce((a, b) => a + b, 0);
    const got = selected.reduce((s, k) => s + (inf.symptoms[k] || 0), 0);
    return { inf, score: got / total, got };
  })
    .filter((r) => r.got > 0)
    .sort((a, b) => b.score - a.score);
}

export const HYGIENE = [
  ['💧', 'Solo por fuera', 'La vagina se limpia sola. Lava solo la vulva con agua o un gel suave sin perfume, una vez al día basta.'],
  ['🚫', 'Nada de duchas vaginales', 'Alteran el pH y aumentan el riesgo de vaginosis y candidiasis.'],
  ['➡️', 'De delante hacia atrás', 'Al limpiarte después de ir al baño, para no llevar bacterias del ano a la vagina o la uretra.'],
  ['🩲', 'Algodón y transpirable', 'Ropa interior de algodón, quítate pronto el bañador mojado o la ropa de deporte sudada.'],
  ['🚽', 'Pis después del sexo', 'Orinar después de las relaciones reduce las cistitis.'],
  ['🧴', 'Ojo con los perfumes', 'Toallitas perfumadas, desodorantes íntimos y salvaslips perfumados irritan.'],
  ['🌿', 'El vello protege', 'Depilarte o no es cosa tuya; si lo haces, exfolia y vigila los pelos enquistados.'],
  ['🎈', 'Preservativo', 'Es el único método que protege de las ITS. Si cambias de pareja, hazte pruebas.'],
];

export const PRODUCTS = [
  {
    name: 'Compresa',
    emoji: '🩹',
    time: 'Cambiar cada 4–6 h',
    pros: 'Fácil, sin meter nada dentro.',
    cons: 'Se nota más, genera residuos, puede rozar.',
  },
  {
    name: 'Tampón',
    emoji: '🧷',
    time: 'Máximo 8 h',
    pros: 'Discreto, sirve para hacer deporte o bañarte.',
    cons: 'Usa la absorción más baja que necesites. Riesgo (raro) de síndrome de shock tóxico.',
  },
  {
    name: 'Copa menstrual',
    emoji: '🏆',
    time: 'Hasta 8–12 h',
    pros: 'Dura años, ahorras mucho dinero y residuos.',
    cons: 'Cuesta pillarle el truco. Hiérvela entre ciclos.',
  },
  {
    name: 'Braga menstrual',
    emoji: '🩲',
    time: 'Hasta 12 h según absorción',
    pros: 'Comodísima, reutilizable, genial para la noche.',
    cons: 'Inversión inicial, hay que lavarla a mano o en frío.',
  },
  {
    name: 'Disco menstrual',
    emoji: '💿',
    time: 'Hasta 12 h',
    pros: 'Mucha capacidad, se puede tener sexo con él puesto (los desechables).',
    cons: 'Sacarlo puede ser un poco aparatoso al principio.',
  },
];

export const TSS =
  'Síndrome de shock tóxico: si llevas tampón o copa y te da fiebre alta de golpe, vómitos, diarrea, mareo o una erupción tipo quemadura solar, quítatelo y ve a urgencias.';

// ---------- Síntomas habituales: consejos personalizados ----------
export const SYMPTOM_TIPS = {
  calambres: 'Toma ibuprofeno en cuanto empiecen (funciona mejor si no esperas a que duela mucho), calor en la tripa y movimiento suave: caminar o estiramientos.',
  cabeza: 'Bebe agua, duerme tus horas y no te saltes comidas. Si es siempre justo antes de la regla puede ser migraña menstrual: coméntalo con tu médica.',
  pechos: 'Un sujetador cómodo y con sujeción, y menos sal y cafeína esos días.',
  hinchazon: 'Menos sal y ultraprocesados, más agua y fibra. Moverte ayuda a deshincharte.',
  acne: 'Limpieza suave y no tocar los granitos. El acné que sale siempre antes de la regla es hormonal y tiene tratamiento.',
  cansancio: 'Prioriza dormir, ejercicio suave y alimentos con hierro (legumbres, carne, espinacas) si tus reglas son abundantes.',
  nauseas: 'Comidas pequeñas y frecuentes, jengibre, evitar fritos. El ibuprofeno con comida para no empeorarlas.',
  antojos: 'Normal: la progesterona sube el apetito. Ten a mano algo dulce que te guste y no te castigues.',
  espalda: 'Calor en la zona lumbar, estiramientos de gato-vaca y el mismo antiinflamatorio que para los calambres.',
  insomnio: 'Habitación fresca, menos pantallas y cafeína por la tarde. La temperatura corporal sube en la fase lútea.',
  picor: 'Si se repite cada ciclo puede ser irritación por compresas o candidiasis cíclica: mira la sección de Cuidado.',
  escozor: 'Bebe mucha agua. Si va con ganas de orinar todo el rato, puede ser cistitis.',
};

// ---------- Factores que alteran el ciclo (para tranquilizar) ----------
export const FACTORS = [
  ['viaje', '✈️ Viaje', 'Los viajes, sobre todo con cambio de horario, alteran el reloj interno y pueden mover la ovulación (y la regla) varios días. Suele normalizarse en el siguiente ciclo.'],
  ['estres', '😵‍💫 Estrés', 'El estrés eleva el cortisol, que puede frenar la ovulación. Una época de exámenes o un disgusto bastan para retrasarte una o dos semanas.'],
  ['enfermedad', '🤒 Enfermedad', 'Una gripe, un COVID o cualquier infección con fiebre pueden retrasar la ovulación este ciclo.'],
  ['dormir', '🌙 Dormir mal', 'Dormir poco o a deshoras (turnos, noches de fiesta) desajusta las hormonas que controlan el ciclo.'],
  ['deporte', '🏃‍♀️ Mucho deporte', 'Entrenar más de lo habitual, sobre todo si comes poco, puede retrasar o adelantar la regla.'],
  ['alcohol', '🍷 Alcohol / fiesta', 'El alcohol en cantidad altera los niveles de estrógeno y puede mover un poco el ciclo.'],
  ['dieta', '🥗 Cambio de dieta', 'Comer mucho menos de lo normal o bajar de peso rápido es una de las causas más comunes de retraso.'],
  ['urgencia', '💊 Píldora del día después', 'Es normal que la siguiente regla se adelante o se retrase hasta una semana. Si se retrasa más de 7 días, hazte un test.'],
  ['anticonceptivo', '🔄 Cambio de anticonceptivo', 'Empezar, cambiar o dejar la píldora, el anillo, el DIU o el implante cambia el patrón de sangrado durante 3–6 meses.'],
  ['medicacion', '🧪 Medicación nueva', 'Algunos medicamentos (antidepresivos, corticoides, antipsicóticos…) pueden alterar el ciclo.'],
];

export const CALM_BY_ISSUE = {
  late: {
    title: (n) => `Tu regla va ${n === 1 ? '1 día' : n + ' días'} tarde`,
    text: 'Que se retrase unos días es muy habitual: casi ninguna mujer tiene ciclos exactos. Estas son las causas más comunes:',
  },
  early: {
    title: (n) => `Esta vez te ha bajado ${n} días antes`,
    text: 'Adelantarse de vez en cuando es normal. Lo más habitual es que la ovulación llegara antes por alguno de estos motivos:',
  },
  late_past: {
    title: (n) => `Tu último ciclo duró ${n} días más de lo normal`,
    text: 'Un ciclo más largo de vez en cuando no es preocupante. Suele deberse a una ovulación más tardía por:',
  },
  spotting: {
    title: () => 'Has manchado fuera de la regla',
    text: 'Manchar un poco entre reglas es frecuente y casi siempre benigno. Puede deberse a:',
    reasons: ['La ovulación (manchado leve a mitad de ciclo)', 'Empezar o cambiar de anticonceptivo, u olvidar alguna pastilla', 'Sangrado de implantación si hubo relaciones sin protección', 'Roce durante el sexo o una revisión ginecológica', 'Estrés o cambios hormonales'],
  },
  long_period: {
    title: (n) => `Tu regla ha durado ${n} días`,
    text: 'A veces una regla se alarga sin que pase nada. Puede deberse a:',
    reasons: ['Un ciclo sin ovulación (más frecuente con estrés o en la adolescencia y después de los 40)', 'Cambios en el anticonceptivo o DIU recién puesto', 'Pólipos o miomas (si se repite, se miran con una ecografía)'],
  },
};

export const GENERAL_REASONS = ['Estrés o un cambio de rutina', 'Viajes y cambios de horario', 'Haber estado enferma', 'Cambios en la alimentación, el peso o el ejercicio', 'Dormir poco o mal'];

// ---------- ¿Voy al médico? ----------
export const TRIAGE = [
  {
    level: 'urgente',
    title: 'Ve a urgencias o llama al 112',
    plain: 'No esperes a mañana ni se lo preguntes a Google: urgencias.',
    icon: '🔴',
    items: [
      'Dolor muy fuerte en la tripa, sobre todo de un lado, con test de embarazo positivo o retraso (posible embarazo ectópico)',
      'Sangrado tan abundante que empapas una compresa o tampón cada hora durante 2 horas seguidas',
      'Mareo, desmayo, palidez o el corazón muy acelerado con sangrado',
      'Fiebre alta con tampón o copa puestos, vómitos o erupción (posible shock tóxico)',
      'Infección de orina con fiebre, escalofríos o dolor en la zona lumbar',
      'Sangrado o dolor fuerte estando embarazada',
      'Después de una agresión sexual (también para anticoncepción de urgencia y profilaxis de ITS)',
    ],
  },
  {
    level: 'cita',
    title: 'Pide cita en los próximos días',
    plain: 'No es una emergencia, pero no lo dejes pasar. Pide cita esta semana.',
    icon: '🟡',
    items: [
      'Tres meses sin regla (sin estar embarazada)',
      'Sangrado entre reglas o después del sexo que se repite',
      'Dolor de regla que no se calma con ibuprofeno o que te hace faltar a clase o al trabajo',
      'Dolor durante el sexo',
      'Flujo con olor fuerte, color verde o gris, o picor que no mejora con el tratamiento sin receta',
      'Llagas, ampollas o bultos en la zona genital',
      'Candidiasis o cistitis 4 o más veces al año',
      'Reglas que duran más de 7 días o ciclos de menos de 21 días de forma habitual',
      'Test de embarazo positivo (para iniciar el control o informarte de tus opciones)',
    ],
  },
  {
    level: 'casa',
    title: 'Normalmente puedes cuidarte en casa',
    plain: 'Es tu cuerpo haciendo cosas de cuerpo. Mantita, ibuprofeno si hace falta, y a vigilar.',
    icon: '🟢',
    items: [
      'Un retraso de menos de una semana con test negativo',
      'Dolor de regla que se calma con ibuprofeno y calor',
      'Cambios de humor, hinchazón o antojos antes de la regla',
      'Manchar un poco a mitad de ciclo de forma puntual',
      'Una candidiasis con síntomas típicos que ya has tenido antes (con clotrimazol de farmacia)',
      'Flujo transparente y elástico a mitad de ciclo: es la ovulación',
    ],
  },
];

export const CHECKUPS = [
  ['🔬', 'Citología', 'En España: de los 25 a los 34 años, cada 3 años. De los 35 a los 65, prueba de VPH cada 5 años.'],
  ['🧪', 'Pruebas de ITS', 'Cada vez que tengas una pareja nueva o varias. Son gratis en tu centro de salud y en los centros de ITS.'],
  ['💉', 'Vacuna del VPH', 'Si no te la pusieron de niña, pregunta: en muchas comunidades está financiada hasta cierta edad.'],
  ['🩺', 'Revisión de anticonceptivo', 'Una vez al año si tomas píldora (tensión arterial) y para revisar el DIU o implante según caducidad.'],
];

// ---------- Dolor de regla ----------
export const PAIN = {
  plain: 'Que te duela un poco es normal; que te deje KO en la cama, no. Si es tu caso, no te conformes con un «es que eres muy quejica».',
  normal: ['Empieza poco antes o el primer día y dura 1–3 días', 'Se nota en la parte baja de la tripa, a veces en la espalda o los muslos', 'Mejora con ibuprofeno, calor o ejercicio suave'],
  notNormal: ['No se calma con analgésicos o te obliga a quedarte en la cama', 'Duele también fuera de la regla, al tener relaciones o al ir al baño', 'Ha empeorado mucho con los años', 'Te cuesta quedarte embarazada'],
  endo: 'Si te reconoces en la segunda lista, puede ser endometriosis o adenomiosis. Afecta a 1 de cada 10 mujeres y se tarda de media 8 años en diagnosticarla: no es normal que la regla te tumbe, pide cita y llévate tu informe de Marea.',
  remedies: [
    ['💊', 'Ibuprofeno o naproxeno', 'Tómalo al primer síntoma y con comida. Son mejores que el paracetamol para el dolor de regla porque frenan las prostaglandinas.'],
    ['♨️', 'Calor', 'Una bolsa de agua caliente o un parche térmico funcionan casi como un analgésico.'],
    ['🧘‍♀️', 'Moverte', 'Caminar, yoga o estiramientos suaves mejoran el riego y relajan el útero.'],
    ['🔄', 'Anticonceptivos hormonales', 'La píldora, el anillo o el DIU hormonal reducen mucho el dolor. Coméntalo con tu médica si el dolor es habitual.'],
  ],
};

// ---------- Marcas recomendadas ----------
// Solo marcas con datos: análisis independientes (OCU) o fuentes clínicas. Nadie paga por aparecer.
export const BRANDS_UPDATED = 'noviembre 2026';
export const BRANDS = [
  {
    cat: 'Compresas',
    icon: '▭',
    basis: 'OCU analizó 9 compresas con alas de absorción normal (seguridad química y funcionamiento). Ninguna tenía ftalatos, cloro ni alérgenos.',
    source: 'OCU, 2022',
    picks: [
      { name: 'Ausonia Normal', badge: 'Mejor del análisis', score: '87/100' },
      { name: 'Evax Cottonlike', badge: 'Muy buena', score: '84/100' },
      { name: 'Carrefour Ultra finas', badge: 'Mejor precio', score: '82/100' },
    ],
  },
  {
    cat: 'Tampones',
    icon: '▯',
    basis: 'OCU analizó 10 tampones de absorción normal. Algunos sueltan fibras al mojarse.',
    source: 'OCU, 2022',
    picks: [
      { name: 'O.B. Pro Comfort', badge: 'Mejor del análisis', score: '80/100' },
      { name: 'Carrefour Compact', badge: 'Mejor precio', score: '76/100' },
      { name: 'Tampax Pearl', badge: 'Muy bueno', score: '75/100' },
    ],
    avoid: 'Tampax Clásico fue el peor valorado (62/100).',
  },
  {
    cat: 'Bragas menstruales',
    icon: '◡',
    basis: 'OCU probó 6 bragas para flujo medio (de 13 a 35 €) en laboratorio y con usuarias. Todas aprobaron en absorción.',
    source: 'OCU, enero 2025',
    picks: [
      { name: 'Sloggi (braga menstrual)', badge: 'Mejor del análisis', score: 'La más absorbente y la mejor valorada por las usuarias' },
    ],
    avoid: 'Etam y Cocoro gustaron por diseño pero absorbieron menos: mejor para flujo ligero.',
  },
  {
    cat: 'Copa menstrual',
    icon: '◠',
    basis: 'OCU probó Mooncup con usuarias durante 3 ciclos: muy buena retención y sin olor; cuesta al principio. No hay comparativas independientes recientes entre marcas.',
    source: 'OCU, 2024',
    picks: [
      { name: 'Mooncup', badge: 'Probada por OCU', score: 'Sin fugas y cómoda una vez le pillas el truco' },
    ],
    tip: 'Empieza por una talla pequeña y espera 15–30 min antes de cortar el tallo.',
  },
  {
    cat: 'Preservativos',
    icon: '◯',
    basis: 'OCU analizó 12 cajas de preservativos estándar y finos: todos superaron las pruebas de resistencia e integridad.',
    source: 'OCU, 2021',
    picks: [
      { name: 'Cualquier marca con marcado CE', badge: 'Todas seguras', score: 'Durex, Control y las de supermercado funcionan igual: compra la más barata' },
    ],
    tip: 'Compra en farmacias o tiendas fiables: OCU ha alertado de Durex falsificados en la venta online.',
  },
  {
    cat: 'Test de embarazo',
    icon: '＋',
    basis: 'Todos los test de farmacia detectan la hormona hCG y son fiables desde el día que te toca la regla. En un estudio comparativo, el digital de Clearblue fue el más preciso.',
    source: 'Estudio comparativo publicado en PubMed (2008)',
    picks: [
      { name: 'Clearblue Digital', badge: 'El más preciso del estudio', score: 'Lee «Embarazada / No embarazada», sin dudas con las rayitas' },
      { name: 'Test de farmacia o supermercado', badge: 'Mejor precio', score: 'Igual de válidos si esperas al día de la falta' },
    ],
  },
  {
    cat: 'Gel íntimo',
    icon: '◇',
    basis: 'No hay análisis independientes entre marcas. Lo que importa: sin jabón, sin perfume y con pH ácido (3,8–5). Estos cumplen según sus fabricantes.',
    source: 'Fichas de los fabricantes',
    picks: [
      { name: 'ISDIN Woman Higiene Íntima', badge: 'Con ácido láctico', score: 'Sin jabón; apto en embarazo según el fabricante' },
      { name: 'Cumlaude Lab Higiene Íntima', badge: 'pH 3,8', score: 'Con ácido hialurónico' },
    ],
    tip: 'Con agua basta. Si usas gel, solo por fuera y una vez al día.',
  },
  {
    cat: 'Para la candidiasis',
    icon: '✚',
    basis: 'El clotrimazol vaginal es el tratamiento de primera línea sin receta en España.',
    source: 'Ficha técnica (AEMPS)',
    picks: [
      { name: 'Gine-Canesten (clotrimazol)', badge: 'Sin receta', score: 'Óvulo de dosis única o crema vaginal' },
    ],
    tip: 'Si es la primera vez o se repite mucho, mejor que te vea una profesional.',
  },
];

export const BRAND_SOURCES = [
  ['OCU · Compresas y tampones', 'https://www.ocu.org/salud/bienestar-prevencion/informe/compresas-y-tampones'],
  ['OCU · Bragas menstruales', 'https://www.ocu.org/salud/higiene-diaria/informe/bragas-menstruales'],
  ['OCU · Copa menstrual', 'https://www.ocu.org/salud/bienestar-prevencion/informe/copa-menstrual-recomendaciones'],
  ['OCU · Preservativos', 'https://www.ocu.org/organizacion/prensa/notas-de-prensa/2021/preservativos301121'],
  ['PubMed · Comparativa de test de embarazo', 'https://pubmed.ncbi.nlm.nih.gov/18457603/'],
];

// ---------- Guía de las fases del ciclo ----------
export const PHASE_GUIDE = [
  {
    id: 'menstrual',
    name: 'Menstruación',
    plain: 'Tu cuerpo ha hecho limpieza porque no hubo bebé. Vas a estar cansada, con la tripa revuelta y pocas ganas de nada. Plan perfecto: manta, peli e ibuprofeno.',
    days: 'Días 1–5 aprox.',
    color: 'p',
    what: 'Si en el ciclo anterior no hubo embarazo, el estrógeno y la progesterona caen al mínimo. El útero suelta la capa interna que había preparado (el endometrio) y sale en forma de regla.',
    hormones: 'Estrógeno y progesterona, en lo más bajo.',
    body: 'Sangrado de 2 a 7 días. Calambres por las prostaglandinas, que hacen que el útero se contraiga. Cansancio, a veces dolor de espalda o diarrea.',
    mood: 'Energía más baja. Es normal tener menos ganas de hacer planes.',
    fertility: 'Baja, pero no cero si tus ciclos son cortos.',
    tips: ['Calor en la tripa e ibuprofeno al primer síntoma', 'Ejercicio suave: caminar, yoga, estiramientos', 'Alimentos con hierro si sangras mucho (legumbres, carne, espinacas)'],
  },
  {
    id: 'folicular',
    name: 'Fase folicular',
    plain: 'Vuelves a ser tú. Más energía, mejor piel y mejor humor: te comes el mundo. Es el mejor momento para entrenar fuerte o meterte en algo nuevo.',
    days: 'Del día 1 hasta la ovulación',
    color: 'f',
    what: 'Empieza a la vez que la regla. El cerebro envía la hormona FSH, que hace crecer varios folículos en los ovarios (cada uno con un óvulo). Uno se convierte en el dominante y produce cada vez más estrógeno, que vuelve a engrosar el endometrio.',
    hormones: 'El estrógeno sube día a día.',
    body: 'Más energía y mejor piel. El flujo pasa de escaso a cremoso. Es la fase que más varía de duración: por eso unos ciclos son más largos que otros.',
    mood: 'Mejor humor, más ganas de socializar y de empezar cosas.',
    fertility: 'Sube según se acerca la ovulación.',
    tips: ['Buen momento para entrenar más fuerte', 'Aprovecha la energía para retos y planes', 'Si buscas embarazo, la ventana fértil empieza al final de esta fase'],
  },
  {
    id: 'fertil',
    name: 'Ovulación',
    plain: 'Es tu semana estrella: te sientes guapa, segura y con ganas de fiesta (y de sexo). También es cuando más fácil es quedarse embarazada, así que ojo.',
    days: 'Unos 14 días antes de la regla',
    color: 'o',
    what: 'El pico de estrógeno provoca un subidón de la hormona LH, y 24–36 h después el folículo libera el óvulo. El óvulo vive solo 12–24 h, pero los espermatozoides sobreviven hasta 5 días: por eso la ventana fértil son unos 6 días.',
    hormones: 'Pico de estrógeno y de LH. Los test de ovulación detectan ese pico de LH en la orina.',
    body: 'Flujo transparente y elástico, como clara de huevo. Algunas notan un pinchazo leve en un lado de la tripa o un poco de manchado. Tras ovular, la temperatura basal sube 0,3–0,5 °C.',
    mood: 'Más libido y más seguridad en ti misma.',
    fertility: 'Máxima: los 2 días antes de ovular y el mismo día.',
    tips: ['Si no buscas embarazo, son tus días de más riesgo: usa protección', 'Si lo buscas, relaciones cada 1–2 días en la ventana fértil'],
  },
  {
    id: 'lutea',
    name: 'Fase lútea',
    plain: 'Vas a estar de mal humor, con hambre e irascible. Hinchada, con granitos y llorando con los anuncios. No te pasa nada raro: son las hormonas preparando la regla.',
    days: 'De la ovulación a la siguiente regla (12–14 días)',
    color: 'l',
    what: 'El folículo vacío se convierte en el cuerpo lúteo, que fabrica progesterona para preparar el útero por si hay embarazo. Si no lo hay, a los 10–14 días el cuerpo lúteo se apaga, las hormonas caen y llega la regla.',
    hormones: 'Manda la progesterona; el estrógeno hace un segundo pico más pequeño.',
    body: 'Temperatura algo más alta y flujo más espeso. Al final pueden aparecer hinchazón, pechos sensibles, granitos o antojos: es el síndrome premenstrual.',
    mood: 'Más sensibilidad o irritabilidad en los últimos días. Si te afecta mucho a la vida diaria, consúltalo: tiene tratamiento.',
    fertility: 'Baja tras la ovulación.',
    tips: ['Menos sal y cafeína para la hinchazón', 'Dormir bien y comer a horas regulares', 'Su duración es bastante fija: por eso se puede predecir la regla contando 14 días desde la ovulación'],
  },
];

// ---------- Música para cada momento ----------
// Playlists oficiales de Spotify (comprobadas en noviembre de 2026). Solo son enlaces: la app no conecta con Spotify.
export const PLAYLISTS = {
  peacefulPiano: { id: '37i9dQZF1DX4sWSpwq3LiO', name: 'Peaceful Piano', desc: 'Piano suave para relajarte' },
  lofi: { id: '37i9dQZF1DWWQRwui0ExPn', name: 'lofi beats', desc: 'Ritmos tranquilos de fondo' },
  moodBooster: { id: '37i9dQZF1DX3rxVfibe1L0', name: 'Mood Booster', desc: 'Canciones para subir el ánimo' },
  beastMode: { id: '37i9dQZF1DX76Wlfdnj7AP', name: 'Beast Mode', desc: 'Para darlo todo en el gimnasio' },
  exitosEspana: { id: '37i9dQZF1DXaxEKcoCdWHD', name: 'Éxitos España', desc: 'Lo que más suena ahora' },
  confidence: { id: '37i9dQZF1DX4fpCWaHOned', name: 'Confidence Boost', desc: 'Para sentirte la reina' },
  lovePop: { id: '37i9dQZF1DX50QitC6Oqtn', name: 'Love Pop', desc: 'Pop romántico' },
  rnb: { id: '37i9dQZF1DWYmmr74INQlb', name: "I Love My '00s R&B", desc: 'R&B de los 2000, para un plan en pareja' },
  lifeSucks: { id: '37i9dQZF1DX3YSRoSdA634', name: 'Life Sucks', desc: 'Para llorar a gusto' },
  chillHits: { id: '37i9dQZF1DX4WYpdgoIcn6', name: 'Chill Hits', desc: 'Éxitos tranquilos' },
  sleep: { id: '37i9dQZF1DWZd79rJ6a7lp', name: 'Sleep', desc: 'Para dormirte' },
  deepFocus: { id: '37i9dQZF1DWZeKCadgRdKQ', name: 'Deep Focus', desc: 'Para concentrarte' },
};

export const MUSIC_BY_PHASE = {
  menstrual: { title: 'Modo sofá y mantita', lists: ['peacefulPiano', 'lofi', 'sleep'] },
  folicular: { title: 'A comerte el mundo', lists: ['moodBooster', 'beastMode', 'exitosEspana'] },
  fertil: { title: 'Te ves de diez', lists: ['confidence', 'lovePop', 'rnb'] },
  lutea: { title: 'Para el bajón premenstrual', lists: ['chillHits', 'lifeSucks', 'moodBooster'] },
  retraso: { title: 'Para no rayarte', lists: ['chillHits', 'peacefulPiano', 'deepFocus'] },
};

// Si hoy apuntaste un ánimo, la música se adapta a él antes que a la fase.
export const MUSIC_BY_MOOD = {
  triste: { title: 'Para cuando estás de bajón', lists: ['lifeSucks', 'moodBooster'] },
  ansiosa: { title: 'Para bajar revoluciones', lists: ['peacefulPiano', 'lofi'] },
  irritable: { title: 'Para sudar la mala leche', lists: ['beastMode', 'chillHits'] },
  sensible: { title: 'Para un día blandito', lists: ['chillHits', 'peacefulPiano'] },
  ganas: { title: 'Para un plan en pareja', lists: ['rnb', 'lovePop'] },
  feliz: { title: 'Para seguir arriba', lists: ['moodBooster', 'exitosEspana'] },
  tranqui: { title: 'Para seguir en calma', lists: ['lofi', 'chillHits'] },
};

export const MUSIC_MOMENTS = [
  ['Dolor de regla', ['peacefulPiano', 'lofi']],
  ['Entrenar', ['beastMode']],
  ['Subir el ánimo', ['moodBooster', 'confidence']],
  ['Llorar a gusto', ['lifeSucks']],
  ['Plan en pareja', ['rnb', 'lovePop']],
  ['No puedo dormir', ['sleep']],
  ['Estudiar o trabajar', ['deepFocus']],
];

// ---------- Guía del flujo según el momento del ciclo ----------
export const FLOW_STAGES = {
  menstrual: {
    name: 'Durante la regla',
    normal: 'Sangre roja los primeros días; al final, más oscura o marrón (es sangre «vieja», tarda más en salir).',
    expected: ['marron'],
    plain: 'Rojo al principio y marrón al final. Si sale marrón, no te asustes: es sangre que ha tardado en salir.',
    check: 'Coágulos más grandes que una moneda de 2 €, empapar una compresa cada hora o que dure más de 7 días.',
  },
  post: {
    name: 'Justo después de la regla',
    normal: 'Poco flujo o casi nada: sensación seca o un flujo pegajoso y blanquecino. Puede quedar algo marrón un día o dos.',
    expected: ['seco', 'pegajoso', 'marron'],
    plain: 'Días de sequía. Casi no manchas la braga, y es normal.',
    check: 'Si sigues manchando marrón o rojo más de 3–4 días después de acabar la regla.',
  },
  cremoso: {
    name: 'Acercándote a la ovulación',
    normal: 'Aumenta la cantidad y se vuelve cremoso, blanco o amarillo muy claro, tipo crema hidratante.',
    expected: ['cremoso', 'pegajoso'],
    plain: 'Empiezas a notar la braga más húmeda, con un flujo tipo crema. Señal de que se acerca tu momento fértil.',
    check: 'Si pica, huele fuerte o tiene grumos.',
  },
  ovulacion: {
    name: 'Ovulación',
    normal: 'Transparente, resbaladizo y elástico, como clara de huevo cruda: se estira entre los dedos. Es el flujo más abundante del ciclo. Puede tener algún hilillo rosado.',
    expected: ['clara', 'cremoso'],
    plain: 'Flujo tipo clara de huevo que se estira. Es tu cuerpo diciendo «estoy fértil». Totalmente normal, aunque sea mucho.',
    check: 'Si es verdoso, espumoso o huele mal: eso no es la ovulación.',
  },
  lutea: {
    name: 'Después de ovular',
    normal: 'Vuelve a ser más espeso, pegajoso y blanquecino, y en menor cantidad.',
    expected: ['pegajoso', 'cremoso', 'seco'],
    plain: 'Se acaba la fiesta: el flujo se espesa y hay menos. Lo normal.',
    check: 'Si aparece picor, grumos blancos tipo requesón u olor fuerte.',
  },
  premenstrual: {
    name: 'Los días antes de la regla',
    normal: 'Más cremoso y blanco, a veces con algo de manchado marrón justo el día antes de que baje.',
    expected: ['cremoso', 'pegajoso', 'marron'],
    plain: 'Flujo blanco y cremoso, y quizá un poco marrón el día antes. Aviso de que la regla está al caer.',
    check: 'Si manchas varios días antes de cada regla de forma habitual, coméntalo en tu próxima consulta.',
  },
};

export const FLOW_ALERTS = [
  { type: 'grumoso', title: 'Blanco y grumoso, tipo requesón, con picor', maybe: 'Suele ser candidiasis (hongos).', infection: 'candidiasis' },
  { type: 'gris', title: 'Gris o blanco fino, con olor a pescado', maybe: 'Suele ser vaginosis bacteriana.', infection: 'vaginosis' },
  { type: 'verde', title: 'Amarillo-verdoso o espumoso, con mal olor', maybe: 'Puede ser tricomoniasis u otra ITS.', infection: 'tricomoniasis' },
  { type: 'amarillo', title: 'Amarillo o distinto al habitual, con sangrado tras el sexo o dolor', maybe: 'Puede ser clamidia o gonorrea.', infection: 'clamidia' },
  { type: 'sangre', title: 'Sangre entre reglas que se repite, o después del sexo', maybe: 'Hay que mirar por qué: pide cita.', infection: null },
];
export const FLOW_ALERTS_PLAIN = 'El flujo cambia mucho durante el mes y casi siempre está bien. Lo que no es normal: que pique, que huela fuerte o raro, que tenga grumos o que cambie a gris o verde.';
