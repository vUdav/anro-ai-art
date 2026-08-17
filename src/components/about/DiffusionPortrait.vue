<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{ src: string; alt?: string }>()

const rootEl = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const neurons = ref<HTMLCanvasElement | null>(null)
const active = ref(false)

const reduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uProgress; // 0 — голо-призрак, 1 — собранное фото
uniform float uTime;

void main(){
  vec2 uv = vUv;
  vec4 texC = texture2D(uTex, uv);
  vec3 img = texC.rgb;

  // Фронт сканирования снизу вверх
  float e = 0.06;
  float front = uProgress * (1.0 + 2.0 * e) - e;
  float revealed = smoothstep(front + e, front - e, uv.y); // 1 внизу (собрано), 0 сверху

  // Тусклый неон-призрак там, где ещё не собрано
  vec3 holo = vec3(0.20, 0.80, 0.95);
  float luma = dot(img, vec3(0.299, 0.587, 0.114));
  vec3 ghost = mix(img * 0.22, holo * (luma * 1.3 + 0.1), 0.65);
  vec3 col = mix(ghost, img, revealed);

  // Яркая скан-линия на фронте — только пока идёт сборка
  float onScreen = step(0.0, front) * step(front, 1.0);
  float line = smoothstep(0.02, 0.0, abs(uv.y - front)) * onScreen;
  col += holo * line * 1.3;

  // Голографические сканлайны (всегда, слабо)
  col *= 0.94 + 0.06 * sin(uv.y * 780.0);
  // Лёгкий фликер
  col *= 0.975 + 0.025 * sin(uTime * 7.0 + uv.y * 24.0);

  // Альфа: силуэт; призрак чуть прозрачнее
  float a = texC.a * mix(0.5, 1.0, revealed);
  a = max(a, texC.a * line);
  a *= smoothstep(0.0, 0.08, uProgress + 0.06);

  gl_FragColor = vec4(col * a, a); // premultiplied
}
`

let gl: WebGLRenderingContext | null = null
let program: WebGLProgram | null = null
let tex: WebGLTexture | null = null
let raf = 0
let running = false
let texReady = false
let firstDrawn = false
let disposed = false

let uProgress = 0
let uProgressTarget = 0
let startTime = 0
let dpr = 1

const uni: Record<string, WebGLUniformLocation | null> = {}
let io: IntersectionObserver | null = null

let nctx: CanvasRenderingContext2D | null = null
type Node = { x: number; y: number; phx: number; phy: number; sx: number; sy: number; am: number }
const nodes: Node[] = []
const edges: Array<[number, number]> = []
const COLOR: [number, number, number] = [34, 211, 238]
const mouse = { px: -1, py: -1, a: 0, aTarget: 0 }

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function triangulate(pts: Node[]): number[][] {
  const n = pts.length
  if (n < 3) return []
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const p of pts) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const dmax = Math.max(maxX - minX, maxY - minY) || 1
  const midx = (minX + maxX) / 2,
    midy = (minY + maxY) / 2
  const v = pts.map((p) => ({ x: p.x, y: p.y }))
  v.push({ x: midx - 20 * dmax, y: midy - dmax })
  v.push({ x: midx, y: midy + 20 * dmax })
  v.push({ x: midx + 20 * dmax, y: midy - dmax })
  let tris: number[][] = [[n, n + 1, n + 2]]

  const inCircum = (t: number[], p: { x: number; y: number }) => {
    const ax = v[t[0]].x,
      ay = v[t[0]].y,
      bx = v[t[1]].x,
      by = v[t[1]].y,
      cx = v[t[2]].x,
      cy = v[t[2]].y
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
    if (Math.abs(d) < 1e-12) return false
    const a2 = ax * ax + ay * ay,
      b2 = bx * bx + by * by,
      c2 = cx * cx + cy * cy
    const ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d
    const uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d
    const r2 = (ax - ux) * (ax - ux) + (ay - uy) * (ay - uy)
    return (p.x - ux) * (p.x - ux) + (p.y - uy) * (p.y - uy) < r2 - 1e-12
  }

  for (let i = 0; i < n; i++) {
    const bad = tris.filter((t) => inCircum(t, v[i]))
    const count = new Map<string, number>()
    for (const t of bad) {
      for (const [a, b] of [
        [t[0], t[1]],
        [t[1], t[2]],
        [t[2], t[0]],
      ]) {
        const k = a < b ? `${a}_${b}` : `${b}_${a}`
        count.set(k, (count.get(k) || 0) + 1)
      }
    }
    tris = tris.filter((t) => !bad.includes(t))
    for (const t of bad) {
      for (const [a, b] of [
        [t[0], t[1]],
        [t[1], t[2]],
        [t[2], t[0]],
      ]) {
        const k = a < b ? `${a}_${b}` : `${b}_${a}`
        if (count.get(k) === 1) tris.push([a, b, i])
      }
    }
  }
  return tris.filter((t) => t[0] < n && t[1] < n && t[2] < n)
}

function buildNodesFromImage(img: HTMLImageElement) {
  nodes.length = 0
  edges.length = 0

  let alphaAt: (nx: number, ny: number) => number
  try {
    const S = 96
    const off = document.createElement('canvas')
    off.width = S
    off.height = S
    const octx = off.getContext('2d')!
    octx.drawImage(img, 0, 0, S, S)
    const data = octx.getImageData(0, 0, S, S).data
    alphaAt = (nx, ny) => {
      const px = Math.min(S - 1, Math.max(0, Math.floor(nx * S)))
      const py = Math.min(S - 1, Math.max(0, Math.floor(ny * S)))
      return data[(py * S + px) * 4 + 3] / 255
    }
  } catch {
    alphaAt = () => 1
  }

  const rnd = mulberry32((Math.random() * 4294967296) >>> 0)
  const G = 18
  const cell = 1 / G
  for (let gy = 0; gy < G; gy++) {
    for (let gx = 0; gx < G; gx++) {
      const nx = (gx + 0.5) * cell + (rnd() - 0.5) * cell * 0.35
      const ny = (gy + 0.5) * cell + (rnd() - 0.5) * cell * 0.35
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) continue
      if (alphaAt(nx, ny) > 0.45) {
        nodes.push({
          x: nx,
          y: ny,
          phx: rnd() * 6.2832,
          phy: rnd() * 6.2832,
          sx: 0.4 + rnd() * 0.8,
          sy: 0.4 + rnd() * 0.8,
          am: 0.6 + rnd() * 0.8,
        })
      }
    }
  }

  const maxLen = cell * 1.9
  const seen = new Set<string>()
  for (const t of triangulate(nodes)) {
    for (const [a, b] of [
      [t[0], t[1]],
      [t[1], t[2]],
      [t[2], t[0]],
    ]) {
      const k = a < b ? `${a}_${b}` : `${b}_${a}`
      if (seen.has(k)) continue
      seen.add(k)
      if (Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y) <= maxLen) edges.push([a, b])
    }
  }
}

function drawNeurons(w: number, h: number, time: number) {
  if (!nctx) return
  mouse.a += (mouse.aTarget - mouse.a) * 0.08
  nctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  nctx.clearRect(0, 0, w, h)
  if (mouse.a < 0.01) return

  const R = Math.min(w, h) * 0.32
  const [cr, cg, cb] = COLOR
  const AMP = 0.0035

  const px: number[] = []
  const py: number[] = []
  for (let i = 0; i < nodes.length; i++) {
    const nd = nodes[i]
    px[i] = (nd.x + Math.sin(time * nd.sx + nd.phx) * AMP * nd.am) * w
    py[i] = (nd.y + Math.cos(time * nd.sy + nd.phy) * AMP * nd.am) * h
  }

  nctx.lineCap = 'round'
  for (const [ai, bi] of edges) {
    const ax = px[ai],
      ay = py[ai]
    const bx = px[bi],
      by = py[bi]
    const mx = (ax + bx) / 2,
      my = (ay + by) / 2
    const inten = mouse.a * Math.max(0, 1 - Math.hypot(mx - mouse.px, my - mouse.py) / R)
    if (inten <= 0.001) continue
    nctx.strokeStyle = `rgba(${cr},${cg},${cb},${inten * 0.38})`
    nctx.lineWidth = 0.6 + inten * 1.0
    nctx.beginPath()
    nctx.moveTo(ax, ay)
    nctx.lineTo(bx, by)
    nctx.stroke()
  }

  for (let i = 0; i < nodes.length; i++) {
    const x = px[i],
      y = py[i]
    const inten = mouse.a * Math.max(0, 1 - Math.hypot(x - mouse.px, y - mouse.py) / R)
    if (inten <= 0.001) continue
    const rad = 2.4 + inten * 3.4
    const g = nctx.createRadialGradient(x, y, 0, x, y, rad)
    g.addColorStop(0, `rgba(${cr},${cg},${cb},${0.1 + inten * 0.6})`)
    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
    nctx.fillStyle = g
    nctx.beginPath()
    nctx.arc(x, y, rad, 0, Math.PI * 2)
    nctx.fill()
  }
}

function compile(g: WebGLRenderingContext, type: number, src: string) {
  const s = g.createShader(type)!
  g.shaderSource(s, src)
  g.compileShader(s)
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) {
    console.warn('shader', g.getShaderInfoLog(s))
    return null
  }
  return s
}

function initGL(): boolean {
  const cv = canvas.value
  if (!cv) return false
  gl = (cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true }) ||
    cv.getContext('experimental-webgl', { premultipliedAlpha: true })) as WebGLRenderingContext | null
  if (!gl) return false

  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return false
  program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false
  gl.useProgram(program)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  for (const name of ['uTex', 'uProgress', 'uTime']) uni[name] = gl.getUniformLocation(program, name)

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  const img = new Image()
  img.decoding = 'async'
  img.onload = () => {
    if (disposed || !gl || !tex) return
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    texReady = true
    buildNodesFromImage(img)
  }
  img.src = props.src
  return true
}

function resize() {
  const cv = canvas.value
  const nc = neurons.value
  if (!cv || !gl) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.round(cv.clientWidth * dpr)
  const h = Math.round(cv.clientHeight * dpr)
  if (w === 0 || h === 0) return
  if (cv.width !== w || cv.height !== h) {
    cv.width = w
    cv.height = h
    gl.viewport(0, 0, w, h)
  }
  if (nc && (nc.width !== w || nc.height !== h)) {
    nc.width = w
    nc.height = h
  }
}

function frame(now: number) {
  if (disposed || !gl || !program) return
  if (!startTime) startTime = now

  const el = rootEl.value
  if (el) {
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight || 1
    const center = r.top + r.height / 2
    uProgressTarget = Math.min(Math.max((vh * 0.85 - center) / (vh * 0.4), 0), 1)
  }
  uProgress += (uProgressTarget - uProgress) * 0.06

  resize()
  gl.uniform1i(uni.uTex!, 0)
  gl.uniform1f(uni.uProgress!, uProgress)
  gl.uniform1f(uni.uTime!, (now - startTime) / 1000)
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  if (texReady) {
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    if (!firstDrawn) {
      firstDrawn = true
      active.value = true
    }
  }

  const nc = neurons.value
  if (nc) drawNeurons(nc.clientWidth, nc.clientHeight, (now - startTime) / 1000)

  raf = requestAnimationFrame(frame)
}

function start() {
  if (running || disposed) return
  running = true
  raf = requestAnimationFrame(frame)
}
function stop() {
  running = false
  cancelAnimationFrame(raf)
}

function onMove(e: PointerEvent) {
  const el = rootEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  mouse.px = e.clientX - r.left
  mouse.py = e.clientY - r.top
  mouse.aTarget = 1
}
function onLeave() {
  mouse.aTarget = 0
}

onMounted(() => {
  if (reduced) return
  if (!initGL()) return
  const nc = neurons.value
  if (nc) nctx = nc.getContext('2d')

  const el = rootEl.value!
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerleave', onLeave)
  window.addEventListener('resize', resize)

  io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) en.isIntersecting ? start() : stop()
    },
    { threshold: 0 },
  )
  io.observe(el)
})

onBeforeUnmount(() => {
  disposed = true
  stop()
  io?.disconnect()
  const el = rootEl.value
  el?.removeEventListener('pointermove', onMove)
  el?.removeEventListener('pointerleave', onLeave)
  window.removeEventListener('resize', resize)
  if (gl) {
    if (tex) gl.deleteTexture(tex)
    if (program) gl.deleteProgram(program)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
})
</script>

<template>
  <div ref="rootEl" class="dp">
    <img
      class="dp__img"
      :class="{ 'dp__img--off': active }"
      :src="src"
      :alt="alt"
      loading="lazy"
      decoding="async"
    />
    <canvas ref="canvas" class="dp__canvas" :class="{ 'dp__canvas--on': active }" aria-hidden="true"></canvas>
    <canvas ref="neurons" class="dp__neurons" aria-hidden="true"></canvas>
  </div>
</template>

<style scoped lang="scss">
.dp {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;

  &__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center bottom;
    display: block;
    transition: opacity 0.4s ease;

    &--off {
      opacity: 0;
    }
  }

  &__canvas,
  &__neurons {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  &__canvas {
    opacity: 0;
    transition: opacity 0.5s ease;

    &--on {
      opacity: 1;
    }
  }

  &__neurons {
    z-index: 1;
  }
}
</style>
