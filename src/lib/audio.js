// Síntesis de música, mezcla y codificación WAV, todo en el navegador.
export const MUSIC = {
  none: 'Sin música',
  cinematic_ambient: 'Ambiente cinemático',
  cyber_pulse: 'Pulso cyber',
  epic_strings: 'Cuerdas épicas',
}
const SR = 44100
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12)

function pad(ctx, out, notes, t, dur, type, gain, detune = 0) {
  notes.forEach((n) => {
    ;[-detune, detune].forEach((dt) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = type; o.frequency.value = hz(n); o.detune.value = dt
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(gain, t + Math.min(1.5, dur / 3))
      g.gain.setValueAtTime(gain, t + dur * 0.7)
      g.gain.linearRampToValueAtTime(0, t + dur)
      o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05)
    })
  })
}

function schedule(ctx, style, total) {
  const master = ctx.createGain(); master.gain.value = 0.9
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'
  lp.connect(master).connect(ctx.destination)
  if (style === 'cinematic_ambient') {
    lp.frequency.value = 1800
    const prog = [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 55]]
    for (let t = 0, i = 0; t < total; t += 4, i++) pad(ctx, lp, prog[i % 4], t, 4.6, 'sine', 0.05, 6)
  } else if (style === 'epic_strings') {
    lp.frequency.value = 2600
    const prog = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]]
    for (let t = 0, i = 0; t < total; t += 2, i++) pad(ctx, lp, prog[Math.floor(i / 2) % 4], t, 2.2, 'sawtooth', 0.018, 12)
    for (let t = 0; t < total; t += 1) { // timbal
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.4)
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.55)
    }
  } else if (style === 'cyber_pulse') {
    lp.frequency.value = 1200; lp.Q.value = 8
    const bass = [33, 33, 45, 33, 36, 33, 43, 31]
    const step = 0.25 // 120 bpm corcheas
    for (let t = 0, i = 0; t < total; t += step, i++) {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sawtooth'; o.frequency.value = hz(bass[i % 8])
      g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + step * 0.9)
      o.connect(g).connect(lp); o.start(t); o.stop(t + step)
      if (i % 2 === 0) { // bombo
        const k = ctx.createOscillator(), kg = ctx.createGain()
        k.frequency.setValueAtTime(150, t); k.frequency.exponentialRampToValueAtTime(40, t + 0.15)
        kg.gain.setValueAtTime(0.5, t); kg.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
        k.connect(kg).connect(master); k.start(t); k.stop(t + 0.22)
      }
    }
    for (let t = 0, i = 0; t < total; t += 4, i++) pad(ctx, master, [57, 60, 64], t, 4, 'square', 0.012)
  }
  // fundido de salida
  master.gain.setValueAtTime(0.9, Math.max(0, total - 1.5))
  master.gain.linearRampToValueAtTime(0, total)
}

export async function renderMusic(style, seconds) {
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * seconds), SR)
  if (style !== 'none') schedule(ctx, style, seconds)
  return ctx.startRendering()
}

async function decodeDataUrl(dataUrl) {
  const buf = await (await fetch(dataUrl)).arrayBuffer()
  const ac = new (window.AudioContext || window.webkitAudioContext)()
  try { return await ac.decodeAudioData(buf) } finally { ac.close() }
}

// Mezcla: música de fondo + locuciones grabadas colocadas en el inicio de cada escena
export async function mixSoundtrack({ scenes, music, musicVolume, voiceVolume }) {
  const total = scenes.reduce((a, s) => a + s.duration, 0)
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * total), SR)
  if (music !== 'none') {
    const m = await renderMusic(music, total)
    const src = ctx.createBufferSource(), g = ctx.createGain()
    src.buffer = m; g.gain.value = musicVolume
    src.connect(g).connect(ctx.destination); src.start(0)
  }
  let t = 0
  for (const s of scenes) {
    if (s.voice) {
      const b = await decodeDataUrl(s.voice)
      const src = ctx.createBufferSource(), g = ctx.createGain()
      src.buffer = b; g.gain.value = voiceVolume
      src.connect(g).connect(ctx.destination); src.start(t); src.stop(t + s.duration)
    }
    t += s.duration
  }
  return ctx.startRendering()
}

export function toWav(buffer) {
  const ch = buffer.numberOfChannels, len = buffer.length, sr = buffer.sampleRate
  const out = new DataView(new ArrayBuffer(44 + len * ch * 2))
  const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)))
  w(0, 'RIFF'); out.setUint32(4, 36 + len * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ')
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true)
  out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true)
  out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, len * ch * 2, true)
  const data = [...Array(ch)].map((_, i) => buffer.getChannelData(i))
  let o = 44
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) {
    const v = Math.max(-1, Math.min(1, data[c][i])); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2
  }
  return new Uint8Array(out.buffer)
}

export async function previewMusic(style, seconds = 8) {
  const b = await renderMusic(style, seconds)
  return URL.createObjectURL(new Blob([toWav(b)], { type: 'audio/wav' }))
}
