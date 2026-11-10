# Ficha de Google Play · Marea

Todo lo que pide Google Play Console, listo para copiar y pegar.

## Datos básicos
- **Nombre de la app** (máx. 30): `Marea: ciclo y salud íntima`
- **Idioma predeterminado:** Español (España) – es-ES
- **App o juego:** App · **Gratis o de pago:** Gratis
- **Categoría:** Salud y bienestar
- **Etiquetas:** Seguimiento de la regla, Salud de la mujer, Fertilidad
- **Email de contacto:** ⚠️ *pon el email que quieras que vean las usuarias*
- **Web:** https://carlotafernandez-byte.github.io/marea/
- **Política de privacidad:** https://carlotafernandez-byte.github.io/marea/privacidad.html
- **ID del paquete:** `io.github.carlotafernandezbyte.marea` (no se puede cambiar después de la primera subida)

## Descripción breve (máx. 80)
```
Tu regla, tus días fértiles y tus dudas. Gratis, privada y sin anuncios.
```

## Descripción completa (máx. 4000)
```
Marea es el calendario del ciclo que te explica las cosas como una amiga que sabe del tema: primero la explicación técnica y luego «es decir…», en cristiano.

🌊 TU CICLO, DE UN VISTAZO
• Cuántos días faltan para tu regla y en qué fase estás
• Tus días fértiles y tu ovulación, con el margen de error real
• Apuntar la regla, las relaciones o cómo te sientes te lleva un toque

😌 «TRANQUILA»
Si tu regla se retrasa, se adelanta o manchas, Marea te explica las causas posibles empezando por lo que apuntaste: un viaje, estrés, una gripe, la píldora del día después…

🤰 ¿PUEDO ESTAR EMBARAZADA?
Te dice el riesgo según el día del ciclo y el método, si aún llegas a tiempo de la píldora del día después o del DIU de cobre, y qué día hacerte el test.

🚦 ¿VOY AL MÉDICO?
Un semáforo claro: urgencias ya, pide cita o puedes cuidarte en casa. Y un informe con tus ciclos para enseñárselo a tu médica.

💧 TU CUERPO
• Qué flujo es normal en cada momento del ciclo y cuándo mirártelo
• Candidiasis, cistitis, vaginosis e ITS: síntomas y qué hacer
• Dolor de regla: qué es normal y qué no (endometriosis)
• Las 4 fases del ciclo y cómo se mueven tus hormonas

💊 TU ANTICONCEPTIVO
Píldora, anillo, parche, inyección, DIU o implante, con recordatorios para que no se te pase nada.

🌡️ TEMPERATURA Y TESTS DE OVULACIÓN
Apúntalos y Marea confirma cuándo has ovulado y afina tus predicciones.

💬 PREGUNTA LO QUE QUIERAS
Un asistente que entiende tus palabras y responde con tus datos, sin conexión.

🏷️ MARCAS SIN PUBLICIDAD
Qué compresas, tampones, bragas menstruales o tests comprar según análisis independientes como los de la OCU. Nadie paga por salir.

🎧 MÚSICA
Playlists de Spotify para cada fase y cada estado de ánimo.

🔒 PRIVADA DE VERDAD
• Tus datos se guardan solo en tu móvil, cifrados con tu contraseña
• Sin servidores, sin analítica y sin publicidad
• Modo discreto: cambia el nombre y el icono para que nadie sepa qué app es

Gratis para siempre, sin funciones de pago.

Marea ofrece información general y no sustituye a una consulta médica. Las predicciones del ciclo no son un método anticonceptivo.
```

## Recursos gráficos (carpeta `tiendas/capturas/`)
- **Icono 512×512:** `icono-512.png`
- **Imagen destacada 1024×500:** `imagen-destacada.png`
- **Capturas de teléfono (1080×1920), en este orden:** `1-hoy` · `2-hoy-cuerpo` · `3-calendario` · `4-fases` · `5-salud` · `6-flujo` · `7-pregunta` · `8-embarazo`

## Contenido de la app (Play Console › Política › Contenido de la app)

### Seguridad de los datos
- ¿Tu app recoge o comparte alguno de los tipos de datos de usuario obligatorios? → **No**
  (Todo se guarda solo en el dispositivo y no se envía a ningún sitio. Google considera que los datos que no salen del dispositivo no se «recogen».)
- ¿Todos los datos se cifran en tránsito? → No aplica (no se transmite nada)
- Puedes añadir en la descripción: «Datos cifrados en el dispositivo».

### Apps de salud
- Declarar que es una app de salud → **Sí**
- Categoría → **Salud menstrual y reproductiva** (y «Bienestar» si te lo ofrece)
- ¿Es un dispositivo médico regulado? → **No**

### Anuncios
- ¿Contiene anuncios? → **No**

### Público objetivo
- Franjas de edad → **13–15, 16–17 y 18 o más**
- ¿Puede atraer a niños? → **No**

### Clasificación de contenido (cuestionario IARC)
- Categoría → **Referencia, noticias o educativa**
- Contiene información sexual con fines educativos y de salud (anticoncepción, ITS, relaciones): responde **Sí** a «referencias sexuales» y explica que es educativo. No hay violencia, apuestas, drogas ni interacción entre usuarias.

### Otros
- Acceso a la app → **Todas las funciones están disponibles sin acceso especial** (la cuenta se crea en el propio móvil)
- Permisos: notificaciones (recordatorios). No usa alarmas exactas, ubicación, cámara ni contactos.

## Pasos para publicar
1. Crea la cuenta en https://play.google.com/console (25 $, un solo pago). Como cuenta personal, Google exige **probar la app con 12 personas durante 14 días** antes de publicarla en producción.
2. Crea la app con los datos de arriba.
3. Sube el archivo `.aab` (te lo genero yo) a **Prueba cerrada** e invita a las 12 testers.
4. Rellena «Contenido de la app» con las respuestas de arriba.
5. Pasados los 14 días, pide el acceso a producción y envíala a revisión.
