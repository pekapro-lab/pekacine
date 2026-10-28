# PekaCine · Estudio Creativo de Producción de Vídeo

Versión web gratuita (sin APIs de pago ni claves) del estudio de vídeo de Peka. Vite + React + Tailwind; todo se procesa en el navegador con ffmpeg.wasm (@ffmpeg/core 0.12.6 single-thread, sin COOP/COEP).

Demo: https://pekapro-lab.github.io/pekacine/

Pestañas: Guión & Historia (plantillas por género, export/import .json con medios en base64), Personajes, Escenas (Ken Burns para imágenes), Voz & Audio (Web Speech solo vista previa; locución grabada con MediaRecorder; música sintetizada con OfflineAudioContext), Montaje final (MP4 descargable).

`npm ci && npm run dev` · prueba: `npm run build && npx vite preview & npm run test:e2e`

Licencia: AGPL-3.0.
