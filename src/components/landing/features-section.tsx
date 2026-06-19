'use client'

import { useEffect, useRef, useState } from 'react'

const features = [
  {
    number: '01',
    title: 'Unified Runs View',
    description:
      'Every workflow run across every repo in your org — queued, running, succeeded, failed — in one live table. Filter by repo, status, or conclusion. No more clicking into each repository.',
    visual: 'table',
  },
  {
    number: '02',
    title: 'AI Root Cause Analysis',
    description:
      'When a run fails, AWS Bedrock reads the failure logs and pinpoints what went wrong. Not just "build failed" — a plain-English explanation of why, and where to look.',
    visual: 'ai',
  },
  {
    number: '03',
    title: 'Suggested YAML Fix',
    description:
      'Bedrock proposes a corrected workflow file. You see the full YAML diff before anything happens. Nothing is committed automatically — you are always in control.',
    visual: 'yaml',
  },
  {
    number: '04',
    title: 'One-Click PR',
    description:
      'Happy with the suggestion? Click "Raise PR" and aGorA creates the branch, commits the fix, and opens a pull request — using your own GitHub token, no write-scope stored on our side.',
    visual: 'pr',
  },
]

function TableVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-zinc-700">
      <rect x="20" y="20" width="160" height="120" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="20" y1="40" x2="180" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x="28" y={50 + i * 16} width="50" height="7" rx="2" fill="currentColor" opacity="0.12">
            <animate attributeName="opacity" values="0.12;0.35;0.12" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
          </rect>
          <rect x="86" y={50 + i * 16} width="36" height="7" rx="2" fill="currentColor" opacity="0.1">
            <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
          </rect>
          <circle cx="148" cy={54 + i * 16} r="5" fill={i === 2 ? '#f43f5e' : i === 0 ? '#10b981' : '#f59e0b'} opacity="0.7" />
          <rect x="158" y={50 + i * 16} width="16" height="7" rx="2" fill="currentColor" opacity="0.12" />
        </g>
      ))}
      <text x="28" y="35" fontSize="6" fill="currentColor" opacity="0.4" fontFamily="monospace">WORKFLOW</text>
      <text x="86" y="35" fontSize="6" fill="currentColor" opacity="0.4" fontFamily="monospace">REPO</text>
      <text x="138" y="35" fontSize="6" fill="currentColor" opacity="0.4" fontFamily="monospace">STATUS</text>
    </svg>
  )
}

function AIVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-zinc-700">
      <circle cx="100" cy="80" r="14" fill="currentColor">
        <animate attributeName="r" values="14;16;14" dur="2.5s" repeatCount="indefinite" />
      </circle>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * 60 * Math.PI) / 180
        const r = 52
        return (
          <g key={i}>
            <line
              x1="100" y1="80"
              x2={100 + Math.cos(angle) * r} y2={80 + Math.sin(angle) * r}
              stroke="currentColor" strokeWidth="1" opacity="0.2"
            >
              <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2s" begin={`${i * 0.33}s`} repeatCount="indefinite" />
            </line>
            <circle
              cx={100 + Math.cos(angle) * r} cy={80 + Math.sin(angle) * r}
              r="7" fill="none" stroke="currentColor" strokeWidth="1.5"
            >
              <animate attributeName="r" values="7;9;7" dur="2s" begin={`${i * 0.33}s`} repeatCount="indefinite" />
            </circle>
          </g>
        )
      })}
      <circle cx="100" cy="80" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0">
        <animate attributeName="r" values="20;65" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0" dur="2.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

function YamlVisual() {
  const lines = ['name: CI', 'on: [push]', 'jobs:', '  build:', '    runs-on:', '      ubuntu-latest']
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-zinc-700">
      <rect x="20" y="15" width="160" height="130" rx="3" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <rect x="20" y="15" width="160" height="18" rx="3" fill="currentColor" opacity="0.06" />
      <circle cx="32" cy="24" r="4" fill="currentColor" opacity="0.15" />
      <circle cx="44" cy="24" r="4" fill="currentColor" opacity="0.15" />
      <circle cx="56" cy="24" r="4" fill="currentColor" opacity="0.15" />
      {lines.map((line, i) => (
        <text key={i} x="28" y={46 + i * 16} fontSize="7.5" fill="currentColor" opacity="0.5" fontFamily="monospace">
          {line}
          {i === 1 && <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />}
        </text>
      ))}
      <rect x="20" y="70" width="160" height="1" fill="#f59e0b" opacity="0.5">
        <animate attributeName="y" values="38;135" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.7;0" dur="3s" repeatCount="indefinite" />
      </rect>
    </svg>
  )
}

function PRVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-zinc-700">
      <circle cx="55" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <circle cx="55" cy="110" r="12" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <line x1="55" y1="62" x2="55" y2="98" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <circle cx="145" cy="80" r="12" fill="none" stroke="currentColor" strokeWidth="2">
        <animate attributeName="stroke" values="currentColor;#10b981;currentColor" dur="2s" repeatCount="indefinite" />
      </circle>
      <path d="M 67 72 Q 106 72 133 80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3">
        <animate attributeName="stroke-dashoffset" values="0;-14" dur="0.8s" repeatCount="indefinite" />
      </path>
      <circle r="4" fill="#f59e0b">
        <animateMotion dur="1.6s" repeatCount="indefinite" path="M 67 72 Q 106 72 133 80" />
      </circle>
      <text x="43" y="54" fontSize="8" fill="currentColor" opacity="0.5" fontFamily="monospace">main</text>
      <text x="30" y="114" fontSize="8" fill="currentColor" opacity="0.5" fontFamily="monospace">fix/ai</text>
      <text x="125" y="84" fontSize="8" fill="currentColor" opacity="0.5" fontFamily="monospace">PR</text>
    </svg>
  )
}

function FeatureVisual({ type }: { type: string }) {
  switch (type) {
    case 'table': return <TableVisual />
    case 'ai': return <AIVisual />
    case 'yaml': return <YamlVisual />
    case 'pr': return <PRVisual />
    default: return <TableVisual />
  }
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`group transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 py-12 lg:py-16 border-b border-zinc-100">
        <div className="shrink-0 w-8">
          <span className="font-code text-xs text-zinc-400">{feature.number}</span>
        </div>
        <div className="flex-1 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="font-serif-display text-3xl lg:text-4xl mb-4 text-zinc-900 group-hover:translate-x-1.5 transition-transform duration-300">
              {feature.title}
            </h3>
            <p className="text-lg text-zinc-500 leading-relaxed">
              {feature.description}
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="w-44 h-36">
              <FeatureVisual type={feature.visual} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeaturesSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" ref={ref} className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-20">
          <span className="inline-flex items-center gap-3 text-sm font-code text-zinc-400 mb-6">
            <span className="w-8 h-px bg-zinc-300" />
            What it does
          </span>
          <h2
            className={`font-serif-display text-4xl lg:text-6xl tracking-tight text-zinc-900 transition-all duration-700 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Everything you need.
            <br />
            <span className="text-zinc-400">Nothing made up.</span>
          </h2>
        </div>
        <div>
          {features.map((f, i) => (
            <FeatureCard key={f.number} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
