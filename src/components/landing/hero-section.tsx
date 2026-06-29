'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

const rotatingWords = ['monitor', 'analyse', 'remediate', 'unify']

export function HeroSection() {
  const [visible, setVisible] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    setVisible(true)
    const interval = setInterval(() => setWordIndex((i) => (i + 1) % rotatingWords.length), 2800)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-zinc-50 noise-overlay">
      {/* Subtle grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-zinc-900/5"
            style={{ top: `${12.5 * (i + 1)}%`, left: 0, right: 0 }}
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-zinc-900/5"
            style={{ left: `${10 * (i + 1)}%`, top: 0, bottom: 0 }}
          />
        ))}
      </div>

      {/* Amber gradient orb */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] pointer-events-none opacity-30">
        <div className="w-full h-full rounded-full bg-gradient-radial from-amber-300 via-amber-200 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-32 lg:py-40">
        {/* Eyebrow */}
        <div
          className={`mb-8 transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-code text-zinc-400">
            <span className="w-8 h-px bg-zinc-300" />
            GitHub Actions Intelligence
          </span>
        </div>

        {/* Headline */}
        <div className="mb-12">
          <h1
            className={`font-serif-display leading-[0.92] tracking-tight transition-all duration-1000 text-zinc-900 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ fontSize: 'clamp(3rem, 10vw, 8rem)' }}
          >
            <span className="block">Your pipelines.</span>
            <span className="block">
              One place to{' '}
              <span className="relative inline-block text-amber-500">
                <span key={wordIndex} className="inline-flex overflow-hidden">
                  {rotatingWords[wordIndex].split('').map((char, i) => (
                    <span
                      key={`${wordIndex}-${i}`}
                      className="inline-block animate-char-in"
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-2 bg-amber-200/50 -z-10 rounded" />
              </span>
              .
            </span>
          </h1>
        </div>

        {/* Description + CTAs */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
          <p
            className={`text-xl lg:text-2xl text-zinc-500 leading-relaxed max-w-xl transition-all duration-700 delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Stop switching between GitHub tabs to find failing runs.
            Stagecraft shows every workflow run across every repo in one live view —
            and when something breaks, AI reads the logs and suggests the fix.
          </p>

          <div
            className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <a
              href="/api/auth/github"
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white px-8 h-14 text-base rounded-full font-medium transition-all group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Connect with GitHub
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 h-14 px-8 text-base rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 transition-all font-medium"
            >
              View dashboard
            </a>
          </div>
        </div>

        {/* Live stats strip */}
        <div
          className={`mt-20 pt-8 border-t border-zinc-200 transition-all duration-700 delay-500 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex flex-wrap items-center gap-8 text-sm text-zinc-400">
            {[
              'All GitHub webhook events',
              'Real-time WebSocket updates',
              'AI root cause analysis',
              'Human-in-the-loop PRs',
              'Multi-org support',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
