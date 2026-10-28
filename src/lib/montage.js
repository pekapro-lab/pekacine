import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { mixSoundtrack, toWav } from './audio.js'

let ff = null
export async function getFFmpeg(onLog) {
  if (ff) return ff
  const f = new FFmpeg()
  if (onLog) f.on('log', ({ message }) => onLog(message))
  const base = new URL(import.meta.env.BASE_URL + 'ffmpeg/', location.href).href
  // Núcleo single-thread (0.12.6): no necesita SharedArrayBuffer ni COOP/COEP.
  await f.load({ coreURL: base + 'ffmpeg-core.js', wasmURL: base + 'ffmpeg-core.wasm' })
  ff = f
  return f
}

export function dims(format, resolution) {
  const short = resolution === '360p' ? 360 : 720
  const long = resolution === '360p' ? 640 : 1280
  return format === '9:16' ? [short, long] : [long, short]
}

const FPS = 25
function kenBurns(cam, W, H, d) {
  const N = Math.round(d * FPS)
  // Escalamos al doble antes de zoompan para evitar temblores.
  const pre = `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2}`
  const out = `s=${W}x${H}:fps=${FPS}`
  switch (cam) {
    case 'zoom_in':
      return `${pre},zoompan=z='1+0.3*on/${N}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${N}:${out}`
    case 'pan_right':
      return `${pre},zoompan=z=1.25:x='(iw-iw/zoom)*on/${N}':y='ih/2-(ih/zoom/2)':d=${N}:${out}`
    case 'dramatic_slow':
      return `${pre},zoompan=z='1.35-0.25*on/${N}':x='(iw-iw/zoom)*(0.3+0.4*on/${N})':y='(ih-ih/zoom)*0.4':d=${N}:${out},eq=contrast=1.12:saturation=0.85`
    default:
      return `${pre},zoompan=z=1:d=${N}:${out}`
  }
}

const ext = (dataUrl) => (dataUrl.match(/^data:[^/]+\/([a-z0-9]+)/i)?.[1] || 'bin').replace('quicktime', 'mov').replace('jpeg', 'jpg')

export async function buildFilm(project, { onProgress, onLog }) {
  const scenes = project.scenes
  if (!scenes.length) throw new Error('No hay escenas')
  const [W, H] = dims(project.format, project.resolution)
  const steps = scenes.length + 3
  let done = 0
  const tick = (label, frac = 0) => onProgress?.((done + frac) / steps, label)
  tick('Cargando FFmpeg…')
  const f = await getFFmpeg(onLog)
  done++
  const x264 = ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-r', String(FPS)]
  const list = []
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i], d = s.duration, outName = `s${i}.mp4`
    const handler = ({ progress }) => tick(`Escena ${i + 1}/${scenes.length}`, Math.max(0, Math.min(1, progress)))
    f.on('progress', handler)
    tick(`Escena ${i + 1}/${scenes.length}`)
    if (s.mediaType === 'video' && s.media) {
      const n = `in${i}.${ext(s.media)}`
      await f.writeFile(n, await fetchFile(s.media))
      await f.exec(['-i', n, '-t', String(d), '-an', '-vf',
        `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=${FPS},tpad=stop_mode=clone:stop_duration=${d}`,
        '-t', String(d), ...x264, outName])
      await f.deleteFile(n)
    } else if (s.mediaType === 'image' && s.media) {
      const n = `in${i}.${ext(s.media)}`
      await f.writeFile(n, await fetchFile(s.media))
      await f.exec(['-i', n, '-vf', kenBurns(s.camera, W, H, d), '-frames:v', String(Math.round(d * FPS)), ...x264, outName])
      await f.deleteFile(n)
    } else {
      await f.exec(['-f', 'lavfi', '-i', `color=c=0x111111:s=${W}x${H}:d=${d}:r=${FPS}`, ...x264, outName])
    }
    f.off('progress', handler)
    list.push(`file '${outName}'`)
    done++
  }
  tick('Mezclando audio…')
  const buf = await mixSoundtrack({ scenes, music: project.music, musicVolume: project.musicVolume, voiceVolume: project.voiceVolume })
  await f.writeFile('mix.wav', toWav(buf))
  await f.writeFile('list.txt', list.join('\n'))
  await f.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'video.mp4'])
  done++
  tick('Multiplexando vídeo + audio…')
  await f.exec(['-i', 'video.mp4', '-i', 'mix.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', 'final.mp4'])
  const data = await f.readFile('final.mp4')
  for (const n of [...list.map((l) => l.slice(6, -1)), 'mix.wav', 'list.txt', 'video.mp4', 'final.mp4']) { try { await f.deleteFile(n) } catch {} }
  done = steps; tick('¡Listo!')
  if (!data.length) throw new Error('FFmpeg no produjo vídeo')
  return new Blob([data.buffer], { type: 'video/mp4' })
}
