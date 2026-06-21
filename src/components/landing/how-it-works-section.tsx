'use client'

import { useEffect, useRef, useState } from 'react'

const steps = [
  {
    number: 'I',
    title: 'Connect your org',
    description:
      'Sign in with GitHub OAuth and connect your organisation. aGorA installs a webhook that streams every workflow_run event — queued, running, completed — directly to your dashboard.',
    code: `# 1. Authenticate via GitHub OAuth
# 2. Connect your org in Settings
# 3. aGorA installs a webhook:

POST /orgs/{org}/hooks
{
  "events": ["workflow_run"],
  "config": {
    "url": "https://agora.app/webhooks/github"
  }
}

# Backfill of historical runs starts immediately`,
  },
  {
    number: 'II',
    title: 'See every run, live',
    description:
      'The unified /runs view shows every workflow run across every repo — filtered by repo, status, or conclusion. WebSocket pushes real-time updates as runs transition from queued → running → done.',
    code: `# GET /api/v1/runs/
# ?org_login=myorg
# &repo_name=api-service
# &status=in_progress

{
  "runs": [
    {
      "workflow_name": "CI",
      "repo_name": "api-service",
      "status": "in_progress",
      "branch": "main",
      "conclusion": null
    }
  ],
  "total": 14
}`,
  },
  {
    number: 'III',
    title: 'AI suggests the fix',
    description:
      'When a run fails, AWS Bedrock (Amazon Nova) reads the failure logs and the workflow YAML. It identifies the root cause and produces a corrected YAML file. You review the suggestion — nothing is committed without your approval.',
    code: `# POST /api/v1/remediations/{id}/raise-pr
# Only called when YOU click "Raise PR"

# Bedrock's analysis (stored, not auto-committed):
{
  "root_cause": "Node version mismatch — workflow
    specifies 16 but lock file requires >=18",
  "suggested_yaml": "name: CI\\non: [push]\\n..."
}

# On your click: branch created, YAML committed,
# PR opened — with your GitHub token, in your repo`,
  },
]

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)
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

  useEffect(() => {
    const interval = setInterval(() => setActiveStep((p) => (p + 1) % steps.length), 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="how-it-works" ref={ref} className="relative py-24 lg:py-32 bg-zinc-900 text-white overflow-hidden">
      {/* Diagonal lines */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, transparent, transparent 40px, white 40px, white 41px)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-20">
          <span className="inline-flex items-center gap-3 text-sm font-code text-white/40 mb-6">
            <span className="w-8 h-px bg-white/20" />
            How it works
          </span>
          <h2
            className={`font-serif-display text-4xl lg:text-6xl tracking-tight transition-all duration-700 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Three steps.
            <br />
            <span className="text-white/40">No magic, no black boxes.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Step list */}
          <div className="space-y-0">
            {steps.map((step, i) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(i)}
                className={`w-full text-left py-8 border-b border-white/10 transition-all duration-500 group ${
                  activeStep === i ? 'opacity-100' : 'opacity-35 hover:opacity-60'
                }`}
              >
                <div className="flex items-start gap-6">
                  <span className="font-serif-display text-3xl text-white/25">{step.number}</span>
                  <div className="flex-1">
                    <h3 className="font-serif-display text-2xl lg:text-3xl mb-3 group-hover:translate-x-1.5 transition-transform duration-300">
                      {step.title}
                    </h3>
                    <p className="text-white/55 leading-relaxed text-sm lg:text-base">
                      {step.description}
                    </p>
                    {activeStep === i && (
                      <div className="mt-4 h-px bg-white/15 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 w-0"
                          style={{ animation: 'progress 5s linear forwards' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Code display */}
          <div className="lg:sticky lg:top-32 self-start">
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/15" />
                  <div className="w-3 h-3 rounded-full bg-white/15" />
                  <div className="w-3 h-3 rounded-full bg-white/15" />
                </div>
                <span className="text-xs font-code text-white/35">example.json</span>
              </div>
              <div className="p-6 font-code text-sm min-h-[320px] overflow-x-auto">
                <pre className="text-white/65 whitespace-pre-wrap leading-relaxed">
                  {steps[activeStep].code.split('\n').map((line, li) => (
                    <div
                      key={`${activeStep}-${li}`}
                      className="code-line-reveal leading-loose"
                      style={{ animationDelay: `${li * 60}ms` }}
                    >
                      <span className="text-white/20 select-none w-6 inline-block text-right mr-3">
                        {li + 1}
                      </span>
                      <span
                        className={
                          line.trim().startsWith('#') ? 'text-amber-400/70' : ''
                        }
                      >
                        {line || ' '}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
              <div className="px-5 py-3.5 border-t border-white/10 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-code text-white/35">aGorA ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress { from { width: 0% } to { width: 100% } }
      `}</style>
    </section>
  )
}
