import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import avatarImg from './assets/avatar.png'
import {
  ArrowUpRight,
  Sparkles,
  Globe,
} from 'lucide-react'

/* brand SVG icons (lucide deprecated brand icons) */
const LinkedinSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const GithubSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

/* ═══════════════════════════════════════════
   NEURAL MESH — canvas background animation
   ═══════════════════════════════════════════ */

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  pulseOffset: number
}

function NeuralMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const animRef = useRef<number>(0)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const sizeRef = useRef({ w: 0, h: 0 })

  const NODE_COUNT = 80
  const CONNECTION_DIST = 180
  const MOUSE_RADIUS = 250

  const initNodes = useCallback((w: number, h: number) => {
    const nodes: Node[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        pulseOffset: Math.random() * Math.PI * 2,
      })
    }
    nodesRef.current = nodes
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.scale(dpr, dpr)
      sizeRef.current = { w, h }
      if (nodesRef.current.length === 0) initNodes(w, h)
    }

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouse)

    let time = 0
    const draw = () => {
      time += 0.004
      const { w, h } = sizeRef.current
      const nodes = nodesRef.current
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      ctx.clearRect(0, 0, w, h)

      // update positions
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy

        // wrap around edges
        if (n.x < -20) n.x = w + 20
        if (n.x > w + 20) n.x = -20
        if (n.y < -20) n.y = h + 20
        if (n.y > h + 20) n.y = -20

        // subtle mouse repulsion
        const dmx = n.x - mx
        const dmy = n.y - my
        const distMouse = Math.sqrt(dmx * dmx + dmy * dmy)
        if (distMouse < MOUSE_RADIUS && distMouse > 0) {
          const force = (1 - distMouse / MOUSE_RADIUS) * 0.015
          n.vx += (dmx / distMouse) * force
          n.vy += (dmy / distMouse) * force
        }

        // dampen velocity
        n.vx *= 0.999
        n.vy *= 0.999

        // clamp speed
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy)
        if (speed > 0.5) {
          n.vx = (n.vx / speed) * 0.5
          n.vy = (n.vy / speed) * 0.5
        }
      }

      // draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.08
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // draw nodes
      for (const n of nodes) {
        const pulse = Math.sin(time * 2 + n.pulseOffset) * 0.5 + 0.5
        const alpha = n.opacity * (0.7 + pulse * 0.3)
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      }

      // draw faint mouse glow
      if (mx > 0 && my > 0) {
        const gradient = ctx.createRadialGradient(mx, my, 0, mx, my, 200)
        gradient.addColorStop(0, 'rgba(120,140,255,0.015)')
        gradient.addColorStop(1, 'rgba(120,140,255,0)')
        ctx.fillStyle = gradient
        ctx.fillRect(mx - 200, my - 200, 400, 400)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [initNodes])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.85 }}
    />
  )
}

/* ═══════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════ */

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, delay: 0.2, ease } },
}

/* ═══════════════════════════════════════════
   INLINE GLASS STYLES
   ═══════════════════════════════════════════ */

const glass = {
  outer: {
    background: 'rgba(255,255,255,0.045)',
    backdropFilter: 'blur(80px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(80px) saturate(1.4)',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 0 120px rgba(0,0,0,0.5), 0 0 60px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(255,255,255,0.02)',
  },
  card: {
    background: 'rgba(255,255,255,0.025)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.055)',
  },
  cardHover: {
    background: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.10)',
  },
  badge: {
    background: 'rgba(255,255,255,0.045)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  profile: {
    background: 'rgba(255,255,255,0.035)',
    backdropFilter: 'blur(64px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(64px) saturate(1.2)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 8px 64px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  social: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.055)',
  },
  socialHover: {
    background: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.11)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  iconCircle: {
    background: 'rgba(255,255,255,0.055)',
    border: '1px solid rgba(255,255,255,0.065)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  avatar: {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 100%)',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
  },
} as const

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const infoCards = [
  {
    label: 'Qué construyo',
    text: 'Sistemas autónomos con IA que ejecutan procesos de negocio end-to-end. Conectados a AFIP/ARCA, banking, ERPs, CRMs y APIs internas en arquitecturas event-driven.',
  },
  {
    label: 'Enfoque actual',
    text: 'Sistemas multi-agente en producción, MCP, RAG avanzado, orquestación con n8n, y arquitecturas serverless sobre AWS y Supabase.',
  },
  {
    label: 'Disponibilidad',
    text: 'Abierto a consulting estratégico en automatización e IA. Acompañamiento a empresas para implementar IA correctamente.',
  },
]

const socials = [
  { icon: <LinkedinSvg className="w-4 h-4" />, name: 'LinkedIn', handle: '/in/myommi', href: 'https://www.linkedin.com/in/myommi/' },
  { icon: <GithubSvg className="w-4 h-4" />, name: 'GitHub', handle: '@maxiyommi', href: 'https://github.com/maxiyommi' },
  { icon: <Globe className="w-4 h-4" />, name: 'Cumbre IA', handle: 'cumbre.cloud', href: 'https://cumbre.cloud/' },
]

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */

export default function App() {
  return (
    <div className="relative min-h-screen flex flex-col md:h-screen md:max-h-screen">

      {/* ── background layers ── */}
      <NeuralMesh />
      <div className="atmosphere fixed inset-0 z-[1] pointer-events-none" />

      {/* subtle radial glow anchors */}
      <div className="fixed top-[5%] left-[10%] w-[600px] h-[600px] rounded-full bg-blue-500/[0.03] blur-[200px] z-[2] pointer-events-none" />
      <div className="fixed bottom-[5%] right-[8%] w-[500px] h-[500px] rounded-full bg-indigo-400/[0.025] blur-[180px] z-[2] pointer-events-none" />

      {/* ══════════════════════════════════════════
          HERO — single card, vertically centered
          ══════════════════════════════════════════ */}
      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center px-4 sm:px-6 md:px-5 lg:px-8 py-14 sm:py-16 md:py-2 md:overflow-hidden" role="main">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="w-full max-w-[1100px] md:max-h-full"
        >
          {/* outer glass shell */}
          <div className="relative rounded-[28px] sm:rounded-[32px] md:rounded-[20px] overflow-hidden" style={glass.outer}>
            {/* top edge highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            {/* bottom subtle edge */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />
            {/* diagonal sheen — stronger */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-white/[0.008] to-transparent pointer-events-none" />
            {/* corner accent glow */}
            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-white/[0.03] rounded-full blur-[80px] -translate-x-1/3 -translate-y-1/3 pointer-events-none" />

            {/* padded content */}
            <div className="relative z-10 p-6 sm:p-8 md:p-5 lg:p-6 xl:p-10">
              <div className="grid md:grid-cols-[1fr_220px] lg:grid-cols-[1fr_250px] xl:grid-cols-[1fr_340px] gap-10 md:gap-5 lg:gap-7 xl:gap-14 items-center">

                {/* ── LEFT COLUMN ── */}
                <div className="flex flex-col gap-8 sm:gap-10 md:gap-2.5 lg:gap-3 xl:gap-5">

                  {/* badge */}
                  <motion.div variants={fadeUp} custom={0}>
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 md:px-3 md:py-1 rounded-full text-[10px] sm:text-[11px] md:text-[8px] lg:text-[9px] xl:text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50"
                      style={glass.badge}
                    >
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-2.5 md:h-2.5 text-white/35" />
                      Portfolio Insight
                    </span>
                  </motion.div>

                  {/* heading + bio */}
                  <motion.div variants={fadeUp} custom={1} className="flex flex-col gap-5 sm:gap-6 md:gap-1.5 lg:gap-2 xl:gap-3">
                    <h1 className="text-[1.75rem] sm:text-[2.25rem] md:text-[1.25rem] lg:text-[1.5rem] xl:text-[2.2rem] font-semibold tracking-[-0.035em] leading-[1.1]">
                      Maximiliano Yommi,{' '}
                      <span className="text-white/40">
                        CEO &amp; Co-Founder en Cumbre IA
                      </span>
                    </h1>
                    <p className="text-[14px] sm:text-[15px] md:text-[11px] lg:text-[12px] xl:text-[14px] leading-[1.6] text-white/40 max-w-[500px]">
                      Construyo sistemas autónomos con IA que ejecutan procesos
                      de negocio de punta a punta. No prototipos —
                      infraestructura operativa real. Ingeniero, docente
                      universitario y asesor de empresas.
                    </p>
                  </motion.div>

                  {/* info cards */}
                  <motion.div variants={fadeUp} custom={2} className="flex flex-col gap-3 md:gap-1 lg:gap-1.5 xl:gap-2">
                    {infoCards.map((item) => (
                      <div
                        key={item.label}
                        className="group/card relative rounded-[16px] sm:rounded-[18px] md:rounded-[10px] px-5 py-4 sm:px-6 sm:py-5 md:px-3.5 md:py-2 lg:py-2.5 transition-all duration-300"
                        style={glass.card}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, glass.cardHover)}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = glass.card.background
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.055)'
                        }}
                      >
                        <div className="absolute inset-0 rounded-[16px] sm:rounded-[18px] md:rounded-[10px] bg-gradient-to-br from-white/[0.025] via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <div className="relative flex flex-col gap-1 md:gap-0">
                          <span className="text-[9px] sm:text-[10px] md:text-[7px] lg:text-[8px] xl:text-[9px] font-semibold uppercase tracking-[0.32em] text-white/28">
                            {item.label}
                          </span>
                          <span className="text-[13px] sm:text-[14px] md:text-[10px] lg:text-[11px] xl:text-[13px] text-white/50 leading-[1.5]">
                            {item.text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>

                  {/* CTA */}
                  <motion.div variants={fadeUp} custom={3}>
                    <motion.a
                      href="https://cumbre.cloud/"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full flex items-center justify-center gap-3 h-12 sm:h-14 md:h-9 lg:h-10 xl:h-11 rounded-xl sm:rounded-2xl md:rounded-lg bg-white text-black/85 text-[12px] sm:text-[13px] md:text-[10px] lg:text-[11px] xl:text-[12px] font-semibold uppercase tracking-[0.22em] cursor-pointer transition-all duration-300 hover:shadow-[0_4px_32px_rgba(255,255,255,0.08)]"
                    >
                      Conocé Cumbre IA
                      <ArrowUpRight className="w-4 h-4 md:w-3.5 md:h-3.5 opacity-50" />
                    </motion.a>
                  </motion.div>
                </div>

                {/* ── RIGHT COLUMN: Profile ── */}
                <motion.div variants={scaleIn} className="flex justify-center md:justify-end order-first md:order-last">
                  <div className="relative w-full max-w-[320px] md:max-w-none xl:max-w-[340px]">
                    {/* ambient glow */}
                    <div className="absolute -inset-14 md:-inset-6 bg-gradient-to-b from-blue-400/[0.04] via-indigo-400/[0.02] to-transparent rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative rounded-[24px] sm:rounded-[26px] md:rounded-[14px] lg:rounded-[16px] xl:rounded-[22px] overflow-hidden" style={glass.profile}>
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none rounded-[24px] sm:rounded-[26px] md:rounded-[14px]" />

                      <div className="relative z-10 px-5 py-7 sm:px-7 sm:py-8 md:px-3.5 md:py-3 lg:px-4 lg:py-4 xl:px-6 xl:py-5 flex flex-col items-center gap-5 sm:gap-6 md:gap-2 lg:gap-2.5 xl:gap-3">

                        {/* avatar */}
                        <div className="relative">
                          <div className="absolute -inset-8 md:-inset-3 bg-blue-400/[0.06] rounded-full blur-2xl pointer-events-none" />
                          <img
                            src={avatarImg}
                            alt="Maximiliano Yommi"
                            className="relative w-28 h-28 sm:w-[130px] sm:h-[130px] md:w-[56px] md:h-[56px] lg:w-[68px] lg:h-[68px] xl:w-[90px] xl:h-[90px] rounded-full object-cover select-none"
                            style={glass.avatar}
                          />
                        </div>

                        {/* name & role */}
                        <div className="text-center flex flex-col gap-1.5 sm:gap-2 md:gap-0.5">
                          <h3 className="text-[17px] sm:text-[19px] md:text-[13px] lg:text-[14px] xl:text-[17px] font-semibold tracking-[-0.02em]">
                            Maximiliano Yommi
                          </h3>
                          <p className="text-[9px] sm:text-[10px] md:text-[7px] lg:text-[8px] xl:text-[9px] font-semibold uppercase tracking-[0.32em] text-white/32">
                            CEO &amp; Co-Founder · Cumbre IA
                          </p>
                          <p className="text-[12px] sm:text-[13px] md:text-[10px] lg:text-[11px] xl:text-[12px] text-white/35 leading-[1.5] mt-0.5 md:mt-0 max-w-[240px] mx-auto">
                            La automatización no reemplaza el criterio — lo amplifica.
                          </p>
                        </div>

                        {/* social links */}
                        <div className="w-full flex flex-col gap-2 sm:gap-2.5 md:gap-0.5 lg:gap-1 xl:gap-1.5 pt-1 md:pt-0">
                          {socials.map((s) => (
                            <a
                              key={s.name}
                              href={s.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Visitar ${s.name} de Maximiliano Yommi`}
                              className="group/link flex items-center gap-3 md:gap-2 rounded-[12px] sm:rounded-[14px] md:rounded-[8px] lg:rounded-[10px] px-3.5 py-2.5 sm:px-4 sm:py-3 md:px-2.5 md:py-1.5 lg:px-3 transition-all duration-200 hover:-translate-y-px"
                              style={glass.social}
                              onMouseEnter={(e) => Object.assign(e.currentTarget.style, glass.socialHover)}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = glass.social.background
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.055)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            >
                              <span
                                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded-full shrink-0"
                                style={glass.iconCircle}
                              >
                                {s.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] sm:text-[13px] md:text-[10px] lg:text-[11px] xl:text-[12px] font-medium text-white/70 group-hover/link:text-white/90 transition-colors leading-tight">
                                  {s.name}
                                </p>
                                <p className="text-[10px] sm:text-[11px] md:text-[8px] lg:text-[9px] xl:text-[10px] text-white/25 truncate leading-tight mt-0.5 md:mt-0">
                                  {s.handle}
                                </p>
                              </div>
                              <ArrowUpRight className="w-3.5 h-3.5 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 text-white/18 transition-all duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 group-hover/link:text-white/40 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 pr-4 sm:pr-6 md:pr-6 pb-3 md:pb-2 shrink-0 text-right" role="contentinfo">
        <small className="text-[11px] sm:text-[12px] text-white/22 tracking-[0.02em]">
          © 2026 Maximiliano Yommi
        </small>
      </footer>
    </div>
  )
}
