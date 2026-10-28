// Prueba headless: abre cada pestaña, comprueba que no hay errores de consola y hace un montaje real mínimo.
import { chromium } from 'playwright'
const URL_ = process.env.URL || 'http://localhost:4173/pekacine/'
const browser = await chromium.launch({ channel: process.env.CHANNEL || undefined, args: ['--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
page.on('dialog', (d) => d.accept())
// Imagen de prueba generada con canvas
const img = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 800; c.height = 600; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 800, 600); gr.addColorStop(0, '#f59e0b'); gr.addColorStop(1, '#1e1b4b'); g.fillStyle = gr; g.fillRect(0, 0, 800, 600); g.fillStyle = '#fff'; g.font = '80px sans-serif'; g.fillText('PekaCine', 220, 320); return c.toDataURL('image/png').split(',')[1] })
await page.goto(URL_)
for (const t of ['guion', 'personajes', 'escenas', 'audio', 'montaje']) { await page.click(`nav.grid [data-tab=${t}]`); await page.waitForTimeout(300) }
await page.click('nav.grid [data-tab=guion]')
await page.fill('input[placeholder="Mi película"]', 'Prueba')
await page.click('text=Usar plantilla')
await page.click('text=360p')
await page.click('nav.grid [data-tab=escenas]')
// dejar solo 1 escena con imagen y 4 s
while ((await page.locator('[aria-label=Eliminar]').count()) > 1) await page.locator('[aria-label=Eliminar]').last().click()
await page.click('text="4 s"')
await page.locator('input[type=file]').first().setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: Buffer.from(img, 'base64') })
await page.waitForSelector('main img')
await page.screenshot({ path: process.env.SHOT_ESC || '/workspace/pekacine-escenas.png', fullPage: true })
await page.click('nav.grid [data-tab=montaje]')
await page.click('#render')
await page.waitForFunction(() => window.__pekacineResult || window.__pekacineError, null, { timeout: 300000 })
const res = await page.evaluate(() => ({ size: window.__pekacineResult, err: window.__pekacineError }))
await page.waitForTimeout(500)
await page.screenshot({ path: process.env.SHOT || '/workspace/pekacine.png', fullPage: true })
console.log('RESULT', JSON.stringify(res), 'CONSOLE_ERRORS', JSON.stringify(errors))
await browser.close()
process.exit(res.size && !errors.length ? 0 : 1)
