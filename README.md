# Marea

Calendario del ciclo **gratis, privado y sin anuncios**. Es una web app instalable (PWA): se abre en el navegador del móvil, se añade a la pantalla de inicio y funciona sin conexión.

## Qué hace
La barra de abajo tiene 5 botones:

- **Hoy**: la «marea» del ciclo, avisos «Tranquila» cuando algo se sale de lo normal (con las causas posibles), registro rápido de relaciones, «Hoy en tu cuerpo» (fase, flujo esperado y tus síntomas habituales) y la playlist del día.
- **Mi ciclo**: Calendario · Fases (explicación técnica + «Es decir» en plan colega, gráfico de hormonas) · Resumen (medias, próximas reglas e informe imprimible para tu médica).
- **＋ Apuntar**: regla, relaciones, síntomas, ánimo, viajes/estrés, flujo (te dice si es normal en tu momento del ciclo), test de embarazo y notas.
- **Salud**: índice por temas. *Tengo una duda* (¿embarazada?, no me baja, ¿voy al médico?), *Mi cuerpo* (flujo, dolor, infecciones) y *Cuidarme* (higiene, marcas según OCU, música de Spotify).
- **Mi anticonceptivo** (en Salud): píldora, anillo, parche, inyección, DIU o implante, con aviso al abrir la app si se te olvida la píldora o te toca cambiar algo.
- **Temperatura y tests de ovulación**: al apuntarlos, Marea confirma la ovulación (test LH positivo o regla de «3 sobre 6» en temperatura) y recalcula la próxima regla.
- **Modo discreto** (en tu cuenta): la app pasa a llamarse «Diario» con un icono neutro.
- **Pregunta**: asistente que responde en lenguaje natural con tus datos, sin conexión.

Cuenta con inicio de sesión: los datos se guardan cifrados (AES-GCM) con tu contraseña y solo en el dispositivo. Onboarding con botón de volver en todos los pasos.

## Desarrollo
Sin dependencias ni paso de compilación.

```sh
npm start   # http://localhost:5173
npm test    # tests de la lógica del ciclo y del asistente
```

`js/cycle.js` predicciones y anomalías · `js/assistant.js` asistente · `js/content.js` contenido de salud y marcas · `js/store.js` cuenta y cifrado · `js/app.js` interfaz · `sw.js` modo sin conexión.

Para publicarla gratis basta con subir la carpeta a un hosting estático con HTTPS (GitHub Pages, Netlify, Cloudflare Pages).

> El contenido de salud es información general y no sustituye a una consulta médica. Las predicciones por calendario no son un método anticonceptivo.

## App de Android
```sh
npm run android:build
```
- Archivo para Google Play: `android/app/build/outputs/bundle/release/app-release.aab`
- APK para probar en un móvil: `android/app/build/outputs/apk/debug/app-debug.apk`
- La clave de firma está en `~/marea-firma/` (fuera del repositorio). **Haz copia de seguridad**: sin ella no se pueden publicar actualizaciones con la misma clave de subida.
- Antes de cada versión nueva, sube `versionCode` en `android/app/build.gradle`.
- La ficha de la tienda y sus imágenes están en `tiendas/`.
