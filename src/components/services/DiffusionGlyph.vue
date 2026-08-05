<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

// Живое диффузионное поле карточки услуги: глиф (кадр для image, ▶ для video)
// собирается из шума в верхней зоне, вокруг — приглушённое поле-«шум» на всю
// карточку. Курсор локально расталкивает частицы (они возвращаются — «раз/до-
// проявление»); при наведении неон-скан-линия проходит сверху вниз.
const props = defineProps<{ kind: 'image' | 'video' }>()

const rootEl = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

interface P {
  tx: number // цель
  ty: number
  ox: number // смещение (затухает к 0)
  oy: number
  seed: number
  col: string
  alpha: number
  size: number
  glyph: boolean
}

let raf = 0
let cleanup: (() => void) | null = null

// Наружу — императивный указатель/ховер (события ловит карточка-родитель)
const mouse = { x: -9999, y: -9999, active: false }
let scanStart = 0 // 0 — нет скана; -1 — начать на след. кадре; >0 — timestamp
defineExpose({
  onPointer(x: number, y: number) {
    mouse.x = x
    mouse.y = y
    mouse.active = true
  },
  onEnter() {
    scanStart = -1 // одноразовый скан сверху вниз
  },
  onLeave() {
    mouse.active = false
  },
})

// Неон-палитра (cyan → blue → violet → pink), как в герое
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

onMounted(() => {
  const cv = canvas.value
  const root = rootEl.value
  if (!cv || !root) return
  const ctx = cv.getContext('2d')
  if (!ctx) return

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = window.innerWidth < 768
  const GLYPH_BUDGET = isMobile ? 360 : 540
  const AMBIENT = isMobile ? 42 : 72
  const DECAY = 0.9 // затухание смещения к цели
  const BLOOM = isMobile ? 3 : 5
  const REPEL_R = 84
  const SCAN_MS = 820

  const buf = document.createElement('canvas')
  const bctx = buf.getContext('2d')!

  let W = 0
  let H = 0
  let dpr = 1
  let particles: P[] = []
  let mode: 'noise' | 'resolved' = 'noise'
  let started = false
  let visible = false

  function fit() {
    W = cv!.clientWidth
    H = cv!.clientHeight
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv!.width = Math.floor(W * dpr)
    cv!.height = Math.floor(H * dpr)
    buf.width = cv!.width
    buf.height = cv!.height
    ctx!.setTransform(1, 0, 0, 1, 0, 0)
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function roundRect(o: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    o.beginPath()
    o.moveTo(x + r, y)
    o.arcTo(x + w, y, x + w, y + h, r)
    o.arcTo(x + w, y + h, x, y + h, r)
    o.arcTo(x, y + h, x, y, r)
    o.arcTo(x, y, x + w, y, r)
    o.closePath()
  }

  // Силуэт глифа (белым по прозрачному) для сэмпла точек
  function drawGlyph(o: CanvasRenderingContext2D, s: number, ox: number, oy: number) {
    o.fillStyle = '#fff'
    o.strokeStyle = '#fff'
    o.lineJoin = 'round'
    o.lineCap = 'round'
    const lw = s * 0.075
    o.lineWidth = lw
    roundRect(o, ox + lw / 2, oy + lw / 2, s - lw, s - lw, s * 0.16)
    o.stroke()

    if (props.kind === 'image') {
      o.beginPath()
      o.arc(ox + s * 0.34, oy + s * 0.32, s * 0.08, 0, Math.PI * 2)
      o.fill()
      o.beginPath()
      o.moveTo(ox + s * 0.14, oy + s * 0.82)
      o.lineTo(ox + s * 0.42, oy + s * 0.5)
      o.lineTo(ox + s * 0.6, oy + s * 0.68)
      o.lineTo(ox + s * 0.74, oy + s * 0.54)
      o.lineTo(ox + s * 0.88, oy + s * 0.82)
      o.closePath()
      o.fill()
    } else {
      o.beginPath()
      o.moveTo(ox + s * 0.4, oy + s * 0.32)
      o.lineTo(ox + s * 0.4, oy + s * 0.68)
      o.lineTo(ox + s * 0.7, oy + s * 0.5)
      o.closePath()
      o.fill()
    }
  }

  function glyphTargets(): { x: number; y: number }[] {
    const s = Math.min(W * 0.46, 150)
    const band = Math.min(H * 0.44, 190) // верхняя зона под глиф
    const gx = (W - s) / 2
    const gy = Math.max(14, (band - s) / 2 + 8)
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const o = off.getContext('2d')!
    drawGlyph(o, s, gx, gy)
    const data = o.getImageData(0, 0, W, H).data
    const pts: { x: number; y: number }[] = []
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x, y })
      }
    }
    for (let i = pts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pts[i], pts[j]] = [pts[j], pts[i]]
    }
    return pts.slice(0, GLYPH_BUDGET)
  }

  function build() {
    const g = glyphTargets()
    particles = []
    // Глиф — ярче, в верхней зоне
    for (const t of g) {
      particles.push({
        tx: t.x,
        ty: t.y,
        ox: Math.random() * W - t.x,
        oy: Math.random() * H - t.y,
        seed: Math.random() * Math.PI * 2,
        col: colorFor(t.x / W, 0.85),
        alpha: 0.85,
        size: 1.5,
        glyph: true,
      })
    }
    // Приглушённое поле-шум на всю карточку (под текстом)
    for (let i = 0; i < AMBIENT; i++) {
      const hx = Math.random() * W
      const hy = Math.random() * H
      particles.push({
        tx: hx,
        ty: hy,
        ox: Math.random() * W - hx,
        oy: Math.random() * H - hy,
        seed: Math.random() * Math.PI * 2,
        col: colorFor(hx / W, 0.16),
        alpha: 0.16,
        size: 1.2,
        glyph: false,
      })
    }
  }

  // Начать сборку: лёгкий выброс, затем стягивание к целям
  function startResolve() {
    mode = 'resolved'
    for (const p of particles) {
      const cx = p.tx + p.ox
      const cy = p.ty + p.oy
      const dx = cx - W / 2
      const dy = cy - H / 2
      const d = Math.hypot(dx, dy) || 1
      const mag = 12 + Math.random() * 24
      p.ox = cx - p.tx + (dx / d) * mag
      p.oy = cy - p.ty + (dy / d) * mag
    }
  }

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

  function render(now: number) {
    const time = now * 0.001
    bctx.globalCompositeOperation = 'source-over'
    bctx.clearRect(0, 0, W, H)
    bctx.globalCompositeOperation = 'lighter'

    // Скан-фронт (одноразовый при наведении)
    let scanY = -1
    let scanA = 0
    if (scanStart === -1) scanStart = now
    if (scanStart > 0) {
      const st = (now - scanStart) / SCAN_MS
      if (st >= 1) {
        scanStart = 0
      } else {
        scanY = st * H
        scanA = Math.sin(st * Math.PI) // плавно ярче к середине
      }
    }

    for (const p of particles) {
      if (mode === 'resolved') {
        p.ox *= DECAY
        p.oy *= DECAY
      }
      let x = p.tx + p.ox
      let y = p.ty + p.oy

      // Курсор локально расталкивает; частицы вернутся через затухание
      if (mouse.active) {
        const dx = x - mouse.x
        const dy = y - mouse.y
        const d2 = dx * dx + dy * dy
        if (d2 < REPEL_R * REPEL_R) {
          const d = Math.sqrt(d2) || 1
          const f = (1 - d / REPEL_R) * 9
          p.ox += (dx / d) * f
          p.oy += (dy / d) * f
        }
      }

      // Тихий дрейф — поле «дышит»
      const drift = mode === 'noise' ? 3 : p.glyph ? 1.1 : 1.6
      x += Math.sin(time * 0.7 + p.seed) * drift
      y += Math.cos(time * 0.6 + p.seed * 1.2) * drift

      // Подсветка на проходе скан-фронта
      let a = p.alpha
      let sz = p.size
      if (scanY >= 0) {
        const near = 1 - Math.min(1, Math.abs(y - scanY) / 46)
        if (near > 0) {
          a = Math.min(1, a + near * scanA * 0.75)
          sz = p.size + near * scanA * 1.1
        }
      }
      bctx.fillStyle = a === p.alpha ? p.col : colorFor(p.tx / W, a)
      bctx.fillRect(x, y, sz, sz)
    }

    // Видимая скан-линия: неон-градиент + мягкая полоса (bloom добавит свечение)
    if (scanY >= 0) {
      bctx.fillStyle = `rgba(120,180,255,${0.05 * scanA})`
      bctx.fillRect(0, scanY - 13, W, 26)
      const grd = bctx.createLinearGradient(0, 0, W, 0)
      grd.addColorStop(0, `rgba(34,211,238,${0.65 * scanA})`)
      grd.addColorStop(0.55, `rgba(139,92,246,${0.65 * scanA})`)
      grd.addColorStop(1, `rgba(236,72,153,${0.65 * scanA})`)
      bctx.strokeStyle = grd
      bctx.lineWidth = 2
      bctx.beginPath()
      bctx.moveTo(0, scanY)
      bctx.lineTo(W, scanY)
      bctx.stroke()
    }

    composite()
  }

  function frame(now: number) {
    render(now)
    if (visible) raf = requestAnimationFrame(frame)
    else raf = 0
  }

  function startLoop() {
    if (raf) return
    raf = requestAnimationFrame(frame)
  }

  fit()
  build()

  if (reduce) {
    // Статичное собранное поле — без анимации
    mode = 'resolved'
    for (const p of particles) {
      p.ox = 0
      p.oy = 0
    }
    render(0)
    return
  }

  render(0) // первый кадр — шум до попадания во вьюпорт

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting
      if (visible) {
        if (!started) {
          started = true
          startResolve()
        }
        startLoop()
      }
    },
    { threshold: 0.25 },
  )
  io.observe(root)

  let rt = 0
  function onResize() {
    window.clearTimeout(rt)
    rt = window.setTimeout(() => {
      const wasResolved = mode === 'resolved'
      fit()
      build()
      if (wasResolved) {
        mode = 'resolved'
        for (const p of particles) {
          p.ox = 0
          p.oy = 0
        }
      }
      render(0)
      if (visible) startLoop()
    }, 200)
  }
  window.addEventListener('resize', onResize)

  cleanup = () => {
    io.disconnect()
    window.removeEventListener('resize', onResize)
    window.clearTimeout(rt)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  cleanup?.()
})
</script>

<template>
  <div ref="rootEl" class="field">
    <canvas ref="canvas" class="field__canvas" aria-hidden="true"></canvas>
  </div>
</template>

<style scoped>
.field {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.field__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
