import React, { useEffect, useRef, useState } from 'react'
import { GENRES, TEMPLATES } from './templates.js'
import { MUSIC, previewMusic } from './lib/audio.js'
import { buildFilm, dims } from './lib/montage.js'

const uid = () => Math.random().toString(36).slice(2, 10)
const CAMERAS = { static: 'Estático', pan_right: 'Paneo a la derecha', zoom_in: 'Zoom in', dramatic_slow: 'Dramático lento' }
const DURS = [4, 6, 8, 10]
const newScene = (p = {}) => ({ id: uid(), title: '', description: '', narration: '', characters: [], duration: 6, camera: 'static', media: null, mediaType: null, voice: null, ...p })
const EMPTY = { version: 1, title: '', genre: GENRES[0], synopsis: '', format: '16:9', resolution: '720p', characters: [], scenes: [newScene({ title: 'Escena 1' })],
  voice: { name: '', rate: 1, pitch: 1, volume: 1 }, music: 'cinematic_ambient', musicVolume: 0.35, voiceVolume: 1 }
const TABS = [['guion', '📜', 'Guión & Historia'], ['personajes', '🎭', 'Personajes'], ['escenas', '🎬', 'Escenas'], ['audio', '🎙️', 'Voz & Audio'], ['montaje', '🎞️', 'Montaje final']]
const LS = 'pekacine-proyecto'

const readDataUrl = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file) })
const blobToDataUrl = readDataUrl

function Field({ label, children }) { return <label className="block"><span className="lbl">{label}</span>{children}</label> }

export default function App() {
  const [p, setP] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(LS)); if (s?.version) return { ...EMPTY, ...s } } catch {}
    return EMPTY
  })
  const [tab, setTab] = useState('guion')
  const [toast, setToast] = useState('')
  const up = (patch) => setP((o) => ({ ...o, ...patch }))
  const say = (t) => { setToast(t); setTimeout(() => setToast(''), 4000) }

  // Autoguardado de texto (los medios no caben en localStorage)
  useEffect(() => {
    const light = { ...p, characters: p.characters.map((c) => ({ ...c, portrait: null })), scenes: p.scenes.map((s) => ({ ...s, media: null, mediaType: null, voice: null })) }
    try { localStorage.setItem(LS, JSON.stringify(light)) } catch {}
  }, [p])

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-20 bg-neutral-950/90 backdrop-blur border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <div className="min-w-0">
            <h1 className="font-bold text-amber-400 leading-tight">PekaCine</h1>
            <p className="text-xs text-neutral-400 truncate">Estudio Creativo de Producción de Vídeo · {p.title || 'Sin título'}</p>
          </div>
        </div>
        <nav className="hidden md:flex max-w-5xl mx-auto px-4 gap-1">
          {TABS.map(([k, i, l]) => <button key={k} data-tab={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm border-b-2 ${tab === k ? 'border-amber-500 text-amber-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}>{i} {l}</button>)}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">
        {tab === 'guion' && <Guion p={p} up={up} setP={setP} say={say} />}
        {tab === 'personajes' && <Personajes p={p} up={up} />}
        {tab === 'escenas' && <Escenas p={p} up={up} />}
        {tab === 'audio' && <Audio p={p} up={up} say={say} />}
        {tab === 'montaje' && <Montaje p={p} />}
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-neutral-950/95 border-t border-neutral-800 grid grid-cols-5" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(([k, i, l]) => <button key={k} data-tab={k} onClick={() => setTab(k)} className={`py-2 text-[10px] flex flex-col items-center ${tab === k ? 'text-amber-400' : 'text-neutral-500'}`}><span className="text-lg">{i}</span>{l.split(' ')[0]}</button>)}
      </nav>
      {toast && <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-neutral-950 px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>}
    </div>
  )
}

function Guion({ p, up, setP, say }) {
  const fileRef = useRef()
  const applyTemplate = () => {
    const t = TEMPLATES[p.genre]
    if (p.scenes.some((s) => s.title || s.description) && !confirm('La plantilla sustituirá la sinopsis y las escenas actuales. ¿Continuar?')) return
    up({ synopsis: t.synopsis, music: t.music, scenes: t.scenes.map((s) => newScene(s)) })
    say('Plantilla aplicada: ' + p.genre)
  }
  const exportJson = () => {
    const json = JSON.stringify(p)
    const mb = json.length / 1e6
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = (p.title || 'proyecto').replace(/[^\w-]+/g, '_') + '.pekacine.json'; a.click()
    say(`Proyecto exportado (${mb.toFixed(1)} MB, medios incluidos en base64)${mb > 50 ? ' · Ojo: archivo grande' : ''}`)
  }
  const importJson = async (e) => {
    const f = e.target.files[0]; if (!f) return
    try { const d = JSON.parse(await f.text()); if (!Array.isArray(d.scenes)) throw 0; setP({ ...EMPTY, ...d }); say('Proyecto importado') } catch { say('El archivo no es un proyecto válido') }
    e.target.value = ''
  }
  return <>
    <section className="card space-y-4">
      <Field label="Título"><input className="inp" value={p.title} onChange={(e) => up({ title: e.target.value })} placeholder="Mi película" /></Field>
      <Field label="Género">
        <div className="flex flex-wrap gap-2">{GENRES.map((g) => <button key={g} onClick={() => up({ genre: g })} className={`chip ${p.genre === g ? 'border-amber-500 bg-amber-500/15 text-amber-300' : 'border-neutral-700 text-neutral-300'}`}>{g}</button>)}</div>
      </Field>
      <Field label="Sinopsis"><textarea className="inp min-h-[120px]" value={p.synopsis} onChange={(e) => up({ synopsis: e.target.value })} placeholder="¿De qué va tu historia?" /></Field>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-a" onClick={applyTemplate}>✨ Usar plantilla de {p.genre}</button>
        <span className="text-xs text-neutral-500">Rellena sinopsis, escenas y música con un punto de partida (sin IA de pago).</span>
      </div>
    </section>
    <section className="card grid sm:grid-cols-2 gap-4">
      <Field label="Formato"><div className="flex gap-2">{['16:9', '9:16'].map((f) => <button key={f} onClick={() => up({ format: f })} className={`chip flex-1 ${p.format === f ? 'border-amber-500 bg-amber-500/15 text-amber-300' : 'border-neutral-700'}`}>{f === '16:9' ? '▭ 16:9 horizontal' : '▯ 9:16 vertical'}</button>)}</div></Field>
      <Field label="Resolución"><div className="flex gap-2">{['720p', '360p'].map((r) => <button key={r} onClick={() => up({ resolution: r })} className={`chip flex-1 ${p.resolution === r ? 'border-amber-500 bg-amber-500/15 text-amber-300' : 'border-neutral-700'}`}>{r} ({dims(p.format, r).join('×')})</button>)}</div></Field>
    </section>
    <section className="card flex flex-wrap gap-3 items-center">
      <button className="btn" onClick={exportJson}>⬇️ Exportar proyecto .json</button>
      <button className="btn" onClick={() => fileRef.current.click()}>⬆️ Importar proyecto</button>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importJson} />
      <p className="text-xs text-neutral-500 w-full">El .json incluye retratos, imágenes, vídeos y locuciones en base64. El autoguardado del navegador solo guarda el texto.</p>
    </section>
  </>
}

function Upload({ accept, onFile, children, className = 'btn' }) {
  const r = useRef()
  return <><button className={className} onClick={() => r.current.click()}>{children}</button>
    <input ref={r} type="file" accept={accept} hidden onChange={async (e) => { const f = e.target.files[0]; if (f) onFile(f, await readDataUrl(f)); e.target.value = '' }} /></>
}

function Personajes({ p, up }) {
  const set = (id, patch) => up({ characters: p.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  return <>
    {p.characters.length === 0 && <p className="text-neutral-400 card">Aún no hay personajes. Añade el primero.</p>}
    <div className="grid md:grid-cols-2 gap-4">
      {p.characters.map((c) => <section key={c.id} className="card flex gap-4">
        <div className="w-24 shrink-0 space-y-2">
          <div className="w-24 h-32 rounded-lg bg-neutral-800 overflow-hidden flex items-center justify-center text-3xl">{c.portrait ? <img src={c.portrait} className="w-full h-full object-cover" alt="" /> : '👤'}</div>
          <Upload accept="image/*" className="btn w-full text-xs px-2" onFile={(_, d) => set(c.id, { portrait: d })}>Subir retrato</Upload>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <input className="inp" placeholder="Nombre" value={c.name} onChange={(e) => set(c.id, { name: e.target.value })} />
          <input className="inp" placeholder="Rol (protagonista, villano…)" value={c.role} onChange={(e) => set(c.id, { role: e.target.value })} />
          <textarea className="inp" placeholder="Aspecto" value={c.look} onChange={(e) => set(c.id, { look: e.target.value })} />
          <button className="text-xs text-red-400" onClick={() => up({ characters: p.characters.filter((x) => x.id !== c.id) })}>Eliminar</button>
        </div>
      </section>)}
    </div>
    <button className="btn-a" onClick={() => up({ characters: [...p.characters, { id: uid(), name: '', role: '', look: '', portrait: null }] })}>＋ Añadir personaje</button>
  </>
}

function Escenas({ p, up }) {
  const set = (id, patch) => up({ scenes: p.scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  const move = (i, d) => { const a = [...p.scenes]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; up({ scenes: a }) }
  const total = p.scenes.reduce((a, s) => a + s.duration, 0)
  return <>
    <p className="text-sm text-neutral-400">{p.scenes.length} escenas · {total} s en total. Si solo subes una imagen, el montaje crea el clip aplicando el movimiento de cámara (Ken Burns).</p>
    {p.scenes.map((s, i) => <section key={s.id} className="card space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-amber-400 font-bold">#{i + 1}</span>
        <input className="inp flex-1" placeholder="Título de la escena" value={s.title} onChange={(e) => set(s.id, { title: e.target.value })} />
        <button className="btn px-2" onClick={() => move(i, -1)} aria-label="Subir">↑</button>
        <button className="btn px-2" onClick={() => move(i, 1)} aria-label="Bajar">↓</button>
        <button className="btn px-2 text-red-400" onClick={() => up({ scenes: p.scenes.filter((x) => x.id !== s.id) })} aria-label="Eliminar">✕</button>
      </div>
      <div className="grid md:grid-cols-[1fr_240px] gap-3">
        <div className="space-y-2">
          <textarea className="inp" placeholder="Descripción visual" value={s.description} onChange={(e) => set(s.id, { description: e.target.value })} />
          <textarea className="inp" placeholder="Narración" value={s.narration} onChange={(e) => set(s.id, { narration: e.target.value })} />
          {p.characters.length > 0 && <div className="flex flex-wrap gap-2">{p.characters.map((c) => { const on = s.characters.includes(c.id); return <button key={c.id} onClick={() => set(s.id, { characters: on ? s.characters.filter((x) => x !== c.id) : [...s.characters, c.id] })} className={`chip text-xs ${on ? 'border-amber-500 text-amber-300 bg-amber-500/15' : 'border-neutral-700 text-neutral-400'}`}>{c.name || 'Sin nombre'}</button> })}</div>}
          <div className="flex flex-wrap gap-2 items-center"><span className="lbl mb-0">Duración</span>{DURS.map((d) => <button key={d} onClick={() => set(s.id, { duration: d })} className={`chip text-xs ${s.duration === d ? 'border-amber-500 text-amber-300' : 'border-neutral-700 text-neutral-400'}`}>{d} s</button>)}</div>
          <div className="flex flex-wrap gap-2 items-center"><span className="lbl mb-0">Cámara</span>{Object.entries(CAMERAS).map(([k, l]) => <button key={k} onClick={() => set(s.id, { camera: k })} className={`chip text-xs ${s.camera === k ? 'border-amber-500 text-amber-300' : 'border-neutral-700 text-neutral-400'}`}>{l}</button>)}</div>
        </div>
        <div className="space-y-2">
          <div className={`bg-neutral-950 rounded-lg overflow-hidden flex items-center justify-center text-neutral-600 border border-neutral-800 ${p.format === '9:16' ? 'aspect-[9/16] max-h-72 mx-auto' : 'aspect-video'}`}>
            {s.mediaType === 'image' && <img src={s.media} className="w-full h-full object-cover" alt="" />}
            {s.mediaType === 'video' && <video src={s.media} className="w-full h-full object-cover" controls playsInline muted />}
            {!s.media && <span className="text-sm">Sin imagen ni vídeo</span>}
          </div>
          <div className="flex gap-2">
            <Upload accept="image/*,video/*" className="btn flex-1 text-sm" onFile={(f, d) => set(s.id, { media: d, mediaType: f.type.startsWith('video') ? 'video' : 'image' })}>📁 Subir imagen/vídeo</Upload>
            {s.media && <button className="btn text-sm" onClick={() => set(s.id, { media: null, mediaType: null })}>Quitar</button>}
          </div>
        </div>
      </div>
    </section>)}
    <button className="btn-a" onClick={() => up({ scenes: [...p.scenes, newScene({ title: `Escena ${p.scenes.length + 1}` })] })}>＋ Añadir escena</button>
  </>
}

function useVoices() {
  const [v, setV] = useState([])
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const load = () => setV(speechSynthesis.getVoices())
    load(); speechSynthesis.addEventListener('voiceschanged', load)
    return () => speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])
  return v
}

function Recorder({ scene, onDone }) {
  const [rec, setRec] = useState(null)
  const [secs, setSecs] = useState(0)
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream); const chunks = []
      mr.ondataavailable = (e) => chunks.push(e.data)
      mr.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); onDone(await blobToDataUrl(new Blob(chunks, { type: mr.mimeType }))) }
      mr.start(); setRec(mr); setSecs(0)
      const t0 = Date.now(); mr._iv = setInterval(() => { const s = (Date.now() - t0) / 1000; setSecs(s); if (s >= scene.duration) { clearInterval(mr._iv); mr.stop(); setRec(null) } }, 100)
    } catch { alert('No se pudo acceder al micrófono') }
  }
  const stop = () => { clearInterval(rec._iv); rec.stop(); setRec(null) }
  return rec ? <button className="btn bg-red-600 hover:bg-red-500" onClick={stop}>⏹ {secs.toFixed(1)} / {scene.duration} s</button>
    : <button className="btn" onClick={start}>🔴 Grabar locución</button>
}

function Audio({ p, up, say }) {
  const voices = useVoices()
  const es = voices.filter((v) => v.lang?.toLowerCase().startsWith('es'))
  const list = es.length ? es : voices
  const chosen = voices.find((v) => v.name === p.voice.name) || voices.find((v) => v.lang === 'es-ES') || es[0]
  const [musicUrl, setMusicUrl] = useState(null)
  const setV = (patch) => up({ voice: { ...p.voice, ...patch } })
  const speak = (text) => {
    if (!('speechSynthesis' in window)) return say('Este navegador no tiene síntesis de voz')
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text || 'Esta es la voz del narrador.')
    if (chosen) u.voice = chosen; u.lang = chosen?.lang || 'es-ES'
    u.rate = p.voice.rate; u.pitch = p.voice.pitch; u.volume = p.voice.volume
    speechSynthesis.speak(u)
  }
  const setScene = (id, patch) => up({ scenes: p.scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  return <>
    <section className="card space-y-3">
      <h2 className="font-semibold text-amber-400">Voz del narrador (vista previa)</h2>
      <div className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-lg p-3">
        ⚠️ La voz del sistema (Web Speech API) solo sirve como <b>vista previa</b>: los navegadores no permiten guardarla en un archivo. Para que la narración salga en el vídeo final, <b>graba la locución</b> de cada escena con el micrófono (puedes leerla mientras suena la vista previa).
      </div>
      <Field label={`Voz (${voices.length} disponibles${es.length ? `, ${es.length} en español` : ''})`}>
        <select className="inp" value={chosen?.name || ''} onChange={(e) => setV({ name: e.target.value })}>
          {list.length === 0 && <option value="">Voz predeterminada</option>}
          {list.map((v) => <option key={v.name} value={v.name}>{v.name} · {v.lang}</option>)}
        </select>
      </Field>
      <div className="grid sm:grid-cols-3 gap-3">
        {[['rate', 'Velocidad', 0.5, 2], ['pitch', 'Tono', 0, 2], ['volume', 'Volumen', 0, 1]].map(([k, l, mn, mx]) => <Field key={k} label={`${l}: ${p.voice[k].toFixed(1)}`}><input type="range" className="w-full accent-amber-500" min={mn} max={mx} step="0.1" value={p.voice[k]} onChange={(e) => setV({ [k]: +e.target.value })} /></Field>)}
      </div>
      <button className="btn-a" onClick={() => speak(p.scenes.map((s) => s.narration).filter(Boolean).join('. '))}>▶️ Escuchar toda la narración</button>
    </section>
    <section className="card space-y-3">
      <h2 className="font-semibold text-amber-400">Locución por escena</h2>
      {p.scenes.map((s, i) => <div key={s.id} className="border-t border-neutral-800 pt-3 space-y-2">
        <p className="text-sm"><span className="text-amber-400">#{i + 1}</span> {s.title} <span className="text-neutral-500">· {s.duration} s</span></p>
        <p className="text-sm text-neutral-400 italic">{s.narration || 'Sin narración'}</p>
        <div className="flex flex-wrap gap-2 items-center">
          <button className="btn" onClick={() => speak(s.narration)}>🔊 Vista previa</button>
          <Recorder scene={s} onDone={(d) => { setScene(s.id, { voice: d }); say('Locución grabada') }} />
          {s.voice && <><audio src={s.voice} controls className="h-9 max-w-full" /><button className="text-xs text-red-400" onClick={() => setScene(s.id, { voice: null })}>Borrar</button></>}
        </div>
      </div>)}
    </section>
    <section className="card space-y-3">
      <h2 className="font-semibold text-amber-400">Música de fondo (sintetizada)</h2>
      <div className="flex flex-wrap gap-2">{Object.entries(MUSIC).map(([k, l]) => <button key={k} onClick={() => { up({ music: k }); setMusicUrl(null) }} className={`chip ${p.music === k ? 'border-amber-500 bg-amber-500/15 text-amber-300' : 'border-neutral-700'}`}>{l}</button>)}</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={`Volumen música: ${Math.round(p.musicVolume * 100)}%`}><input type="range" className="w-full accent-amber-500" min="0" max="1" step="0.05" value={p.musicVolume} onChange={(e) => up({ musicVolume: +e.target.value })} /></Field>
        <Field label={`Volumen locución: ${Math.round(p.voiceVolume * 100)}%`}><input type="range" className="w-full accent-amber-500" min="0" max="2" step="0.05" value={p.voiceVolume} onChange={(e) => up({ voiceVolume: +e.target.value })} /></Field>
      </div>
      {p.music !== 'none' && <div className="flex flex-wrap gap-2 items-center"><button className="btn" onClick={async () => setMusicUrl(await previewMusic(p.music))}>🎵 Generar vista previa (8 s)</button>{musicUrl && <audio src={musicUrl} controls autoPlay className="h-9" />}</div>}
    </section>
  </>
}

function Montaje({ p }) {
  const [prog, setProg] = useState(null)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState(null)
  const [err, setErr] = useState('')
  const [log, setLog] = useState('')
  const total = p.scenes.reduce((a, s) => a + s.duration, 0)
  const run = async () => {
    setErr(''); setUrl(null); setProg(0)
    try {
      const blob = await buildFilm(p, { onProgress: (v, l) => { setProg(v); setLabel(l) }, onLog: (m) => setLog(m) })
      setUrl(URL.createObjectURL(blob)); window.__pekacineResult = blob.size
    } catch (e) { setErr(String(e?.message || e)); window.__pekacineError = String(e) }
    setProg(null)
  }
  const [W, H] = dims(p.format, p.resolution)
  return <>
    <section className="card space-y-2">
      <h2 className="font-semibold text-amber-400">Resumen</h2>
      <ul className="text-sm text-neutral-300 space-y-1">
        <li>🎬 {p.scenes.length} escenas · {total} s · {p.format} · {W}×{H}</li>
        <li>🖼️ {p.scenes.filter((s) => s.mediaType === 'image').length} con imagen (Ken Burns) · 🎥 {p.scenes.filter((s) => s.mediaType === 'video').length} con vídeo · ⬛ {p.scenes.filter((s) => !s.media).length} sin medio (fondo negro)</li>
        <li>🎙️ {p.scenes.filter((s) => s.voice).length} locuciones grabadas · 🎵 {MUSIC[p.music]}</li>
      </ul>
      <p className="text-xs text-neutral-500">Todo se procesa en tu dispositivo con ffmpeg.wasm (≈32 MB la primera vez). En móvil puede tardar varios minutos; mantén la pantalla encendida.</p>
    </section>
    <section className="card space-y-3">
      <button className="btn-a w-full sm:w-auto" disabled={prog !== null || !p.scenes.length} onClick={run} id="render">🎞️ Montar película</button>
      {prog !== null && <div><div className="h-3 bg-neutral-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all" style={{ width: `${Math.round(prog * 100)}%` }} /></div>
        <p className="text-xs text-neutral-400 mt-1">{label} · {Math.round(prog * 100)}%</p><p className="text-[10px] text-neutral-600 truncate font-mono">{log}</p></div>}
      {err && <p className="text-sm text-red-400">Error: {err}</p>}
      {url && <div className="space-y-2"><video src={url} controls playsInline className={`rounded-lg bg-black ${p.format === '9:16' ? 'max-h-[70vh] mx-auto' : 'w-full'}`} />
        <a className="btn-a" href={url} download={(p.title || 'pelicula').replace(/[^\w-]+/g, '_') + '.mp4'} id="download">⬇️ Descargar MP4</a></div>}
    </section>
  </>
}
