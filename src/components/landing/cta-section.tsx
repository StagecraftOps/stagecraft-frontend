'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

export function CtaSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div
          className={`relative overflow-hidden rounded-3xl bg-zinc-900 px-8 py-16 lg:px-16 lg:py-24 transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Amber glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-3 text-sm font-code text-white/40 mb-6">
              <span className="w-8 h-px bg-white/20" />
              Get started today
            </span>
            <h2 className="font-serif-display text-4xl lg:text-6xl text-white tracking-tight mb-6">
              Stop tab-hopping.
              <br />
              <span className="text-amber-400">Start shipping.</span>
            </h2>
            <p className="text-lg text-white/55 leading-relaxed mb-10">
              Connect your GitHub org in under 2 minutes.
              No credit card, no AWS account required to start.
              The AI analysis needs Bedrock credentials — everything else works immediately.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/api/auth/github"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-8 h-14 text-base rounded-full font-medium transition-all group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                Connect with GitHub
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 h-14 px-8 text-base rounded-full border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-all font-medium"
              >
                View dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
