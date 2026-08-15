<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHero } from '../../composables/usePages'
import { HEADER_H } from '../../constants/layout'

const { t } = useI18n()
const hero = useHero()

// Клик по шеврону — плавный скролл к первому блоку «Обо мне» (с учётом шапки)
function scrollToAbout() {
  const el = document.getElementById('about')
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - HEADER_H
  window.scrollTo({ top: y, behavior: 'smooth' })
}
const canvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)
const shown = ref(false) // мягкое появление всего экрана (opacity 0 → 1)

// ── Пасхалка «1369» ──
const EGG_CODE = [1, 3, 6, 9] // TL, TR, BL, BR
const counts = reactive([0, 0, 0, 0])
const spins = reactive([0, 0, 0, 0]) // накопленный поворот крестика (полные обороты)
const glow = reactive([0, 0, 0, 0]) // свечение по близости курсора (0..1)
const eggReady = ref(false) // ввод доступен только когда собрано ANRO
const isTouchDevice = ref(false) // на тач-экранах пасхалку не показываем
const playing = ref(false) // сердце проигрывается → прячем цифры и подпись
let heartFn: (() => void) | null = null // назначается внутри onMounted
let idleTimer: number | undefined // сброс пароля при бездействии

function resetEgg() {
  for (let i = 0; i < 4; i++) {
    counts[i] = 0
    spins[i] = 0
  }
}

function onCross(i: number) {
  if (!eggReady.value) return
  counts[i] = counts[i] >= 9 ? 0 : counts[i] + 1
  spins[i] += 360
  window.clearTimeout(idleTimer)
  if (EGG_CODE.every((v, k) => counts[k] === v)) {
    heartFn?.() // разгадано — сброс сделает таймлайн сердца
  } else {
    idleTimer = window.setTimeout(resetEgg, 10000) // 10 с бездействия → сброс
  }
}

const NET_NAMES = [
  'Midjourney',
  'Sora',
  'CharGPT',
  'Kling',
  'Runway',
  'Seedream',
  'Seedance',
  'Nano Banana',
  'WAN',
  'Luma',
  'Veo',
  'Ideogram',
  'Grok',
  'Elevenlabs',
  'Suno',
  'Magnific',
]

interface Particle {
  tx: number // цель (буква ANRO)
  ty: number
  ix: number // intro-позиция
  iy: number
  ox: number // смещение от цели (затухает к 0 при сборке)
  oy: number
  seed: number
  col: string // текущий цвет (меняется при морфинге в сердце)
  colAnro: string
  colHeart: string
  colDim: string
  isName: boolean
}

let raf = 0
let running = false // активен ли rAF-цикл (пауза вне вьюпорта / при document.hidden)
let cleanup: (() => void) | null = null

function colorFor(t: number, alpha = 0.9): string {
  const stops = [
    [34, 211, 238],
    [77, 124, 255],
    [139, 92, 246],
    [236, 72, 153],
  ]
  const seg = t * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(seg))
  const f = seg - i
  const a = stops[i]
  const b = stops[i + 1]
  return `rgba(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(
    a[1] + (b[1] - a[1]) * f,
  )},${Math.round(a[2] + (b[2] - a[2]) * f)},${alpha})`
}

// Тёплая розово-красная гамма для сердца
function heartColorFor(t: number, alpha = 0.92): string {
  const stops = [
    [255, 60, 90],
    [255, 110, 140],
    [255, 170, 190],
    [255, 220, 230],
  ]
  const seg = t * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(seg))
  const f = seg - i
  const a = stops[i]
  const b = stops[i + 1]
  return `rgba(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(
    a[1] + (b[1] - a[1]) * f,
  )},${Math.round(a[2] + (b[2] - a[2]) * f)},${alpha})`
}

onMounted(async () => {
  const cv = canvas.value
  if (!cv) return
  const ctx = cv.getContext('2d')
  if (!ctx) return

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = window.innerWidth < 768
  const MAXP = isMobile ? 4500 : 11000
  const STEP = isMobile ? 5 : 4
  const word = (hero.value.name || 'Anro').toUpperCase()

  const INTRO_DELAY = 1500 // мс: показываем шум + названия нейросетей
  const INTRO_DELAY_NONAMES = 700 // мс: короткая пауза, когда названий нет
  const DECAY = 0.949 // затухание смещения к цели (без пружины/отскока) — сборка вдвое медленнее
  // Волна-рябь по клику (сила зависит от размера экрана; на тач-устройствах скромнее)
  const isTouch =
    window.matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints || 0) > 0
  isTouchDevice.value = isTouch // пасхалка недоступна на тач-экранах
  const WAVE_SPEED = 950 // px/с — скорость расхождения кольца
  // На тач-устройствах ограничиваем «эффективную ширину», чтобы волна не росла слишком сильно
  const scaleW = isTouch ? Math.min(window.innerWidth, 480) : window.innerWidth
  const WAVE_SCALE = Math.min(1, scaleW / 1200)
  const WAVE_BAND = 90 * (0.6 + 0.4 * WAVE_SCALE) // ширина гребня волны
  const WAVE_PUSH = 11 * WAVE_SCALE // сила отклонения частиц на гребне

  const BLOOM = isMobile ? 5 : 9 // радиус свечения (px)

  // Offscreen-буфер: частицы рисуем в него, а на экран — с bloom (размытая копия)
  const buf = document.createElement('canvas')
  const bctx = buf.getContext('2d')!

  let W = 0
  let H = 0
  let cx = 0
  let cy = 0
  let dpr = 1
  let particles: Particle[] = []
  let mode: 'intro' | 'resolved' = 'intro'
  let namesShown = false
  let t0 = 0
  let pausedAt = 0 // момент паузы rAF — чтобы не «съесть» интро реальным временем на паузе
  let revertTimer: number | undefined // таймер возврата ANRO после сердца
  let readyTimer: number | undefined // таймер готовности интро (ready/eggReady)
  // Пасхалка-сердце
  let anroPtsStored: { x: number; y: number }[] = []
  let heartPts: { x: number; y: number }[] | null = null
  let heartMode = false
  const heartCenter = { x: 0, y: 0 }
  const mouse = { x: -9999, y: -9999, active: false }
  const waves: { x: number; y: number; t: number; c: [number, number, number] }[] = []
  // Неоновая палитра колец — каждый клик берёт следующий цвет по циклу
  const WAVE_COLORS: [number, number, number][] = [
    [120, 220, 255], // cyan
    [77, 124, 255], // blue
    [139, 92, 246], // violet
    [236, 72, 153], // pink
  ]
  let waveColorIdx = 0
  let touchMode = false // на тач-экранах hover-отталкивание отключаем

  function fit() {
    W = cv!.clientWidth
    H = cv!.clientHeight
    cx = W / 2
    cy = H * 0.46
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv!.width = Math.floor(W * dpr)
    cv!.height = Math.floor(H * dpr)
    buf.width = cv!.width
    buf.height = cv!.height
    ctx!.setTransform(1, 0, 0, 1, 0, 0) // экран — только композитинг буфера
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0) // в буфер рисуем в CSS-координатах
  }

  // Композит буфера на экран: резкий слой + размытый (bloom)
  function composite() {
    ctx!.setTransform(1, 0, 0, 1, 0, 0)
    ctx!.globalCompositeOperation = 'source-over'
    ctx!.filter = 'none'
    ctx!.clearRect(0, 0, cv!.width, cv!.height)
    ctx!.drawImage(buf, 0, 0)
    ctx!.globalCompositeOperation = 'lighter'
    ctx!.filter = `blur(${BLOOM * dpr}px)`
    ctx!.drawImage(buf, 0, 0)
    ctx!.filter = 'none'
  }

  function shuffle<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
  }

  // Точки из текста ANRO (крупно, по центру)
  function anroTargets(): { x: number; y: number }[] {
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const o = off.getContext('2d')!
    o.textBaseline = 'middle'
    o.textAlign = 'center'
    let fs = Math.min(H * 0.42, 460)
    const maxW = Math.min(W * 0.86, 1100)
    o.font = `700 ${fs}px 'Sora', sans-serif`
    while (o.measureText(word).width > maxW && fs > 40) {
      fs -= 6
      o.font = `700 ${fs}px 'Sora', sans-serif`
    }
    o.fillStyle = '#fff'
    o.fillText(word, cx, cy)
    const data = o.getImageData(0, 0, W, H).data
    const pts: { x: number; y: number }[] = []
    for (let y = 0; y < H; y += STEP) {
      for (let x = 0; x < W; x += STEP) {
        if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x, y })
      }
    }
    shuffle(pts)
    return pts.slice(0, MAXP)
  }

  // Названия нейросетей — по сетке (без наложений), крупно и плотно
  function nameTargets(): { x: number; y: number }[] {
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const o = off.getContext('2d')!
    o.textBaseline = 'middle'
    o.textAlign = 'center'
    o.fillStyle = '#fff'

    const cols = isMobile ? 2 : 3
    const rows = 4
    const cellW = W / cols
    const top = H * 0.1
    const cellH = (H * 0.8) / rows
    const cells: { r: number; c: number }[] = []
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ r, c })
    shuffle(cells)
    const names = [...NET_NAMES]
    shuffle(names)
    const count = Math.min(cells.length, isMobile ? 6 : 9, names.length)

    for (let i = 0; i < count; i++) {
      const { r, c } = cells[i]
      const name = names[i]
      // Разброс размеров: часть названий крупные, часть мелкие
      let fs = (isMobile ? 15 : 30) + Math.random() * (isMobile ? 22 : 68)
      o.font = `300 ${fs}px 'Sora', sans-serif`
      const maxW = cellW * 0.86
      while (o.measureText(name).width > maxW && fs > 12) {
        fs -= 2
        o.font = `600 ${fs}px 'Sora', sans-serif`
      }
      const jx = (Math.random() - 0.5) * cellW * 0.2
      const jy = (Math.random() - 0.5) * cellH * 0.3
      const px = c * cellW + cellW / 2 + jx
      const py = top + r * cellH + cellH / 2 + jy
      o.fillText(name, px, py)
    }

    const data = o.getImageData(0, 0, W, H).data
    const pts: { x: number; y: number }[] = []
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x, y })
      }
    }
    shuffle(pts)
    return pts
  }

  function build() {
    const anro = anroTargets()
    anroPtsStored = anro
    heartPts = null // пересоберётся под текущий размер при первом вызове
    const names = nameTargets()
    const N = anro.length
    // Бюджет частиц под названия. Если частиц меньше, чем нужно для читаемой
    // отрисовки, — названия не показываем вовсе, оставляем только шум.
    const budget = Math.floor(N * 0.6)
    const need = Math.min(names.length, 2500)
    const showNames = names.length > 0 && budget >= need
    namesShown = showNames
    const nameCount = showNames ? Math.min(names.length, budget) : 0
    particles = new Array(N)
    for (let i = 0; i < N; i++) {
      const a = anro[i]
      const isName = i < nameCount
      const ix = isName ? names[i].x : Math.random() * W
      const iy = isName ? names[i].y : Math.random() * H
      const cA = colorFor(a.x / W)
      particles[i] = {
        tx: a.x,
        ty: a.y,
        ix,
        iy,
        ox: ix - a.x,
        oy: iy - a.y,
        seed: Math.random() * Math.PI * 2,
        col: cA,
        colAnro: cA,
        colHeart: heartColorFor(Math.random()),
        colDim: colorFor(a.x / W, 0.32),
        isName,
      }
    }
  }

  // Переход к ANRO: лёгкий «выброс» из центра, затем плавная сборка (затухание смещения)
  function startResolve() {
    mode = 'resolved'
    for (const p of particles) {
      const dx = p.ix - cx
      const dy = p.iy - cy
      const d = Math.hypot(dx, dy) || 1
      const mag = 60 + Math.random() * 120
      p.ox = p.ix - p.tx + (dx / d) * mag
      p.oy = p.iy - p.ty + (dy / d) * mag
    }
  }

  // Нормализация набора точек ровно к n (срез/добивка джиттером)
  function toExact(pts: { x: number; y: number }[], n: number) {
    shuffle(pts)
    if (pts.length >= n) return pts.slice(0, n)
    const out = pts.slice()
    while (out.length < n && pts.length) {
      const p = pts[Math.floor(Math.random() * pts.length)]
      out.push({ x: p.x + (Math.random() - 0.5) * 2, y: p.y + (Math.random() - 0.5) * 2 })
    }
    return out
  }

  // Цели: сердце + надпись «Кахаю цябе».
  // Сердце и текст сэмплим РАЗДЕЛЬНО и делим частицы так, чтобы тексту досталась
  // заметная доля — иначе тонкие штрихи букв остаются рыхлыми и нечитаемыми
  // (у заливки-сердца площадь в разы больше, и при общем пуле оно «съедает» частицы).
  function buildHeartTargets() {
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const o = off.getContext('2d')!
    const s = Math.min(W, H) * 0.34
    const k = s / 34
    const hx = W / 2
    const hy = H * 0.4
    heartCenter.x = hx
    heartCenter.y = hy

    // — Сердце (заливка), шаг сэмпла 2 —
    o.fillStyle = '#fff'
    o.beginPath()
    for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.02) {
      const px = 16 * Math.pow(Math.sin(a), 3)
      const py = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)
      const x = hx + px * k
      const y = hy - py * k
      if (a === 0) o.moveTo(x, y)
      else o.lineTo(x, y)
    }
    o.closePath()
    o.fill()
    const heartPtsRaw: { x: number; y: number }[] = []
    let d = o.getImageData(0, 0, W, H).data
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        if (d[(y * W + x) * 4 + 3] > 128) heartPtsRaw.push({ x, y })
      }
    }

    // — Текст: жирнее (500) и шаг сэмпла 1 → плотное, читаемое покрытие штрихов —
    o.clearRect(0, 0, W, H)
    o.fillStyle = '#fff'
    o.textAlign = 'center'
    o.textBaseline = 'middle'
    const fs = Math.min(W * 0.085, 58)
    o.font = `300 ${fs}px 'Sora', sans-serif`
    o.fillText('Кахаю цябе', hx, hy + s * 0.62)
    const textPtsRaw: { x: number; y: number }[] = []
    d = o.getImageData(0, 0, W, H).data
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        if (d[(y * W + x) * 4 + 3] > 128) textPtsRaw.push({ x, y })
      }
    }

    // Тексту — гарантированная доля частиц (~32%), остальное сердцу
    const total = particles.length
    const textCount = Math.round(total * 0.32)
    const heartCount = total - textCount
    const out = toExact(heartPtsRaw, heartCount).concat(toExact(textPtsRaw, textCount))
    shuffle(out) // перемешиваем, чтобы индексы частиц распределялись по обеим группам
    return out
  }

  // Морфинг всех частиц к новому набору целей (с выбросом из центра, без пружины)
  function morphTo(pts: { x: number; y: number }[], heart: boolean, mag: number) {
    mode = 'resolved'
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const curX = p.tx + p.ox
      const curY = p.ty + p.oy
      const tgt = pts[i] || pts[i % pts.length]
      p.tx = tgt.x
      p.ty = tgt.y
      const dx = curX - cx
      const dy = curY - cy
      const d = Math.hypot(dx, dy) || 1
      const m = mag * (0.5 + Math.random())
      p.ox = curX - p.tx + (dx / d) * m
      p.oy = curY - p.ty + (dy / d) * m
      p.col = heart ? p.colHeart : p.colAnro
    }
  }

  function triggerHeart() {
    if (heartMode) return
    if (!heartPts) heartPts = buildHeartTargets()
    heartMode = true
    playing.value = true // прячем цифры крестиков и подпись «AI Creator»
    eggReady.value = false
    morphTo(heartPts, true, 150) // усиленный выброс = «всплеск-искры»
    revertTimer = window.setTimeout(() => {
      heartMode = false
      playing.value = false
      morphTo(anroPtsStored, false, 70)
      for (let i = 0; i < 4; i++) {
        counts[i] = 0
        spins[i] = 0
      }
      eggReady.value = true
    }, 5000)
  }

  function clearTrail() {
    // Полная очистка буфера — без «шлейфа» от частиц
    bctx.globalCompositeOperation = 'source-over'
    bctx.clearRect(0, 0, W, H)
    bctx.globalCompositeOperation = 'lighter'
  }

  function frame(now: number) {
    if (!running) return // цикл поставлен на паузу (вне вьюпорта / вкладка скрыта)
    const time = now * 0.001
    clearTrail()

    if (mode === 'intro') {
      // Нет названий — короткая пауза вместо полной
      if (now - t0 >= (namesShown ? INTRO_DELAY : INTRO_DELAY_NONAMES)) {
        startResolve()
      } else {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]
          if (p.isName) {
            // почти без дрожания — чтобы названия читались
            bctx.fillStyle = p.col
            bctx.fillRect(p.ix + Math.sin(time + p.seed) * 0.5, p.iy, 2, 2)
          } else {
            const x = p.ix + Math.sin(time * 1.1 + p.seed) * 4
            const y = p.iy + Math.cos(time * 0.9 + p.seed * 1.3) * 4
            bctx.fillStyle = p.colDim
            bctx.fillRect(x, y, 1.3, 1.3)
          }
        }
        composite()
        raf = requestAnimationFrame(frame)
        return
      }
    }

    // mode === 'resolved' — смещение затухает к нулю (плавная сборка без пружины)
    // Предрасчёт радиусов волн и их затухания (волна слабеет по мере расхождения)
    const reach = Math.hypot(W, H) * 0.55 // дистанция, на которой волна гаснет
    const waveR = waves.map((w) => ((now - w.t) / 1000) * WAVE_SPEED)
    const waveAtt = waveR.map((r) => Math.max(0, 1 - r / reach))

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.ox *= DECAY
      p.oy *= DECAY
      const x = p.tx + p.ox
      const y = p.ty + p.oy

      if (mouse.active) {
        const dx = x - mouse.x
        const dy = y - mouse.y
        const d2 = dx * dx + dy * dy
        if (d2 < 120 * 120) {
          const d = Math.sqrt(d2) || 1
          const f = (1 - d / 120) * 8
          p.ox += (dx / d) * f
          p.oy += (dy / d) * f
        }
      }

      // Волны: частицы на гребне кольца мягко отклоняются наружу
      for (let w = 0; w < waves.length; w++) {
        const dx = x - waves[w].x
        const dy = y - waves[w].y
        const dist = Math.hypot(dx, dy) || 1
        const diff = dist - waveR[w]
        if (Math.abs(diff) < WAVE_BAND && waveAtt[w] > 0) {
          const k = 1 - Math.abs(diff) / WAVE_BAND
          const f = k * k * WAVE_PUSH * waveAtt[w]
          p.ox += (dx / dist) * f
          p.oy += (dy / dist) * f
        }
      }

      // Постоянная жизнь: редкие «искры» отрываются и возвращаются (через затухание)
      if (Math.random() < 0.0004) {
        p.ox += (Math.random() - 0.5) * 46
        p.oy += (Math.random() - 0.5) * 46
      }

      // Медленный дрейф — слово «дышит», не выглядит статичным
      let sx = x + Math.sin(time * 0.7 + p.seed) * 1.5
      let sy = y + Math.cos(time * 0.6 + p.seed * 1.2) * 1.5
      // Пульс сердца
      if (heartMode) {
        const beat = 1 + 0.05 * Math.sin(time * 3.2)
        sx = heartCenter.x + (sx - heartCenter.x) * beat
        sy = heartCenter.y + (sy - heartCenter.y) * beat
      }
      bctx.fillStyle = p.col
      bctx.fillRect(sx, sy, 1.8, 1.8)
    }

    // Видимое кольцо: неоновый гребень расходится и гаснет (bloom добавляет свечение)
    for (let w = 0; w < waves.length; w++) {
      if (waveAtt[w] <= 0 || waveR[w] < 2) continue
      const a = waveAtt[w] * waveAtt[w] // мягче гаснет к краю
      const [cr, cg, cb] = waves[w].c
      // мягкий широкий ореол
      bctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${0.07 * a})`
      bctx.lineWidth = 9 * (0.6 + 0.4 * WAVE_SCALE)
      bctx.beginPath()
      bctx.arc(waves[w].x, waves[w].y, waveR[w], 0, Math.PI * 2)
      bctx.stroke()
      // тонкий яркий контур сверху
      bctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${0.15 * a})`
      bctx.lineWidth = 2
      bctx.beginPath()
      bctx.arc(waves[w].x, waves[w].y, waveR[w], 0, Math.PI * 2)
      bctx.stroke()
    }

    // Удаляем волны, которые уже погасли
    for (let w = waves.length - 1; w >= 0; w--) {
      if (waveR[w] > reach) waves.splice(w, 1)
    }

    composite()
    raf = requestAnimationFrame(frame)
  }

  fit()
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
  } catch {
    /* no-op */
  }
  build()
  heartFn = triggerHeart
  // Первый кадр отрисован — плавно проявляем весь экран
  requestAnimationFrame(() => {
    shown.value = true
  })

  if (reduce) {
    mode = 'resolved'
    bctx.globalCompositeOperation = 'source-over'
    bctx.fillStyle = '#05060f'
    bctx.fillRect(0, 0, W, H)
    bctx.globalCompositeOperation = 'lighter'
    for (const p of particles) {
      bctx.fillStyle = p.col
      bctx.fillRect(p.tx, p.ty, 1.8, 1.8)
    }
    composite()
    ready.value = true
    return
  }

  // Запуск/пауза rAF-цикла. start() защищён от двойного планирования кадра.
  function start() {
    if (running) return
    // Сдвигаем t0 на длительность паузы, иначе интро «прокрутится» реальным
    // временем, пока цикл стоял вне вьюпорта, и сборка ANRO будет пропущена.
    if (pausedAt) {
      t0 += performance.now() - pausedAt
      pausedAt = 0
    }
    running = true
    raf = requestAnimationFrame(frame)
  }
  function stop() {
    if (running) pausedAt = performance.now()
    running = false
    cancelAnimationFrame(raf)
  }

  t0 = performance.now()
  start()
  readyTimer = window.setTimeout(
    () => {
      ready.value = true
      eggReady.value = true
    },
    (namesShown ? INTRO_DELAY : INTRO_DELAY_NONAMES) + 1200,
  )

  function onMove(e: MouseEvent) {
    if (touchMode) return // на тач-устройствах hover не используем
    const r = cv!.getBoundingClientRect()
    mouse.x = e.clientX - r.left
    mouse.y = e.clientY - r.top
    mouse.active = true
  }
  function onLeave() {
    mouse.active = false
  }
  // Свечение крестиков-пасхалки при приближении курсора
  function onGlow(e: MouseEvent) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const inset = 46
    const pts = [
      [inset, inset],
      [vw - inset, inset],
      [inset, vh - inset],
      [vw - inset, vh - inset],
    ]
    for (let i = 0; i < 4; i++) {
      const d = Math.hypot(e.clientX - pts[i][0], e.clientY - pts[i][1])
      glow[i] = Math.max(0, 1 - d / 150)
    }
  }
  function addWave(x: number, y: number) {
    if (mode !== 'resolved') return
    const c = WAVE_COLORS[waveColorIdx % WAVE_COLORS.length]
    waveColorIdx++
    waves.push({ x, y, t: performance.now(), c })
    if (waves.length > 4) waves.shift()
  }
  function onClick(e: MouseEvent) {
    const r = cv!.getBoundingClientRect()
    addWave(e.clientX - r.left, e.clientY - r.top)
  }
  function onTouch(e: TouchEvent) {
    touchMode = true
    mouse.active = false // убираем возможную «дырку» от синтетического hover
    const t = e.touches[0]
    if (!t) return
    const r = cv!.getBoundingClientRect()
    addWave(t.clientX - r.left, t.clientY - r.top)
  }
  let rt = 0
  function onResize() {
    window.clearTimeout(rt)
    rt = window.setTimeout(() => {
      const wasResolved = mode === 'resolved'
      fit()
      build()
      window.clearTimeout(revertTimer) // отменяем висящий возврат сердца
      heartMode = false
      playing.value = false
      for (let i = 0; i < 4; i++) {
        counts[i] = 0
        spins[i] = 0
      }
      if (wasResolved) {
        mode = 'resolved'
        for (const p of particles) {
          p.ox = 0
          p.oy = 0
        }
        eggReady.value = true
      }
    }, 200)
  }

  window.addEventListener('mousemove', onMove, { passive: true })
  window.addEventListener('mousemove', onGlow, { passive: true })
  window.addEventListener('mouseout', onLeave)
  window.addEventListener('pointerdown', onClick)
  window.addEventListener('touchstart', onTouch, { passive: true })
  window.addEventListener('resize', onResize)

  // Пауза тяжёлого rAF-цикла, когда hero прокручен прочь или вкладка скрыта.
  let sectionVisible = true
  const heroEl = cv!.closest('.hero')
  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0]
      if (!e) return
      sectionVisible = e.isIntersecting
      if (sectionVisible) {
        if (!document.hidden) start()
      } else {
        stop()
      }
    },
    { threshold: 0 },
  )
  if (heroEl) io.observe(heroEl)

  function onVisibility() {
    if (document.hidden) stop()
    else if (sectionVisible) start()
  }
  document.addEventListener('visibilitychange', onVisibility)

  cleanup = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mousemove', onGlow)
    window.removeEventListener('mouseout', onLeave)
    window.removeEventListener('pointerdown', onClick)
    window.removeEventListener('touchstart', onTouch)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibility)
    io.disconnect()
    window.clearTimeout(rt)
    window.clearTimeout(revertTimer)
    window.clearTimeout(readyTimer)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.clearTimeout(idleTimer)
  cleanup?.()
})
</script>

<template>
  <section class="hero" :class="{ 'is-visible': shown }">
    <canvas ref="canvas" class="hero__canvas" aria-hidden="true"></canvas>

    <h1 class="sr-only">{{ hero.name }} — {{ hero.role }}</h1>

    <div class="hero__overlay" :class="{ 'is-ready': ready && !playing }" aria-hidden="true">
      <p class="hero__subtitle">{{ hero.role }}</p>
    </div>

    <!-- Шеврон-подсказка «листайте вниз» — у нижней кромки экрана -->
    <button
      class="hero__scroll"
      :class="{ 'is-ready': ready && !playing }"
      type="button"
      :aria-label="t('a11y.scrollDown')"
      :tabindex="ready && !playing ? 0 : -1"
      @click="scrollToAbout"
    >
      <svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <!-- Пасхалка: скрытые крестики-пароль по углам (недоступна на тач-экранах) -->
    <button
      v-for="(pos, i) in isTouchDevice ? [] : ['tl', 'tr', 'bl', 'br']"
      :key="pos"
      class="egg"
      :class="`egg--${pos}`"
      :style="{ opacity: playing ? 0 : Math.max(glow[i], counts[i] ? 0.95 : 0) }"
      type="button"
      tabindex="-1"
      aria-hidden="true"
      @click="onCross(i)"
    >
      <span class="egg__mark" :style="{ transform: `rotate(${spins[i]}deg)` }">{{
        counts[i] === 0 ? '+' : counts[i]
      }}</span>
    </button>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  background: radial-gradient(60% 60% at 50% 45%, #0b0d1c, #05060f 75%);
  /* Низ героя растворяется в глобальном mesh-фоне — без резкого шва на стыке с «Обо мне» */
  -webkit-mask-image: linear-gradient(180deg, #000 90%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 90%, transparent 100%);
  opacity: 0;
  transition: opacity 1.4s var(--ease-out);
}

.hero.is-visible {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .hero {
    transition: none;
  }
}

.hero__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.hero__overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: clamp(12%, 18vh, 22%);
  display: flex;
  justify-content: center;
  pointer-events: none;
}

/* Шеврон-подсказка «листайте вниз» — у нижней кромки, но выше mask-растворения
   низа героя (нижние 10% гаснут), появляется вместе с подписью, того же цвета */
.hero__scroll {
  position: absolute;
  left: 50%;
  bottom: 11%;
  transform: translateX(-50%);
  z-index: 4;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-200);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 1.2s var(--ease-out),
    color 0.25s var(--ease-out);
  pointer-events: none; /* до появления не кликается */
}

.hero__scroll.is-ready {
  opacity: 0.8;
  pointer-events: auto;
  animation: hero-chevron 2s var(--ease-out) infinite;
}

.hero__scroll:hover,
.hero__scroll:focus-visible {
  color: var(--text-100);
  opacity: 1;
}

@keyframes hero-chevron {
  0%,
  100% {
    transform: translate(-50%, 0);
  }
  50% {
    transform: translate(-50%, 7px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__scroll {
    transition: none;
  }
  .hero__scroll.is-ready {
    animation: none;
    opacity: 0.8;
    pointer-events: auto;
  }
}

.hero__subtitle {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(0.85rem, 2.2vw, 1.4rem);
  letter-spacing: 0.55em;
  text-transform: uppercase;
  text-indent: 0.55em;
  color: var(--text-200);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 1.2s var(--ease-out), transform 1.2s var(--ease-out);
}

.hero__overlay.is-ready .hero__subtitle {
  opacity: 1;
  transform: translateY(0);
}

/* Пасхалка: крестики по углам */
.egg {
  position: absolute;
  z-index: 5;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: default;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.egg--tl {
  top: 22px;
  left: 22px;
}
.egg--tr {
  top: 22px;
  right: 22px;
}
.egg--bl {
  bottom: 22px;
  left: 22px;
}
.egg--br {
  bottom: 22px;
  right: 22px;
}

.egg__mark {
  font-family: var(--font-display);
  font-weight: 100;
  font-size: 44px;
  line-height: 1;
  color: #fff;
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.7);
  transition: transform 0.55s var(--ease-out);
  user-select: none;
}
</style>
