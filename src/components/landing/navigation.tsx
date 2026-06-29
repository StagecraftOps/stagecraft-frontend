'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'How it works', href: '#how-it-works' },
  { name: 'Runs', href: '#runs' },
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled ? 'top-3 left-3 right-3' : 'top-0 left-0 right-0'
      }`}
    >
      <nav
        className={`mx-auto transition-all duration-500 ${
          isScrolled || mobileOpen
            ? 'bg-white/80 backdrop-blur-xl border border-zinc-200 rounded-2xl shadow-lg max-w-5xl'
            : 'bg-transparent max-w-7xl'
        }`}
      >
        <div
          className={`flex items-center justify-between px-6 lg:px-8 transition-all duration-500 ${
            isScrolled ? 'h-14' : 'h-20'
          }`}
        >
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span
              className={`font-serif-display tracking-tight text-zinc-900 transition-all duration-500 ${
                isScrolled ? 'text-xl' : 'text-2xl'
              }`}
            >
              Stagecraft
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-zinc-900 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="/api/auth/github"
              className={`text-zinc-500 hover:text-zinc-900 transition-colors ${
                isScrolled ? 'text-xs' : 'text-sm'
              }`}
            >
              Sign in
            </a>
            <a
              href="/api/auth/github"
              className={`bg-zinc-900 hover:bg-zinc-700 text-white rounded-full font-medium transition-all duration-300 ${
                isScrolled ? 'px-4 py-1.5 text-xs' : 'px-5 py-2 text-sm'
              }`}
            >
              Connect GitHub
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            className="md:hidden p-2 text-zinc-600 hover:text-zinc-900"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden px-6 pb-6 pt-2 border-t border-zinc-100">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-zinc-700 hover:text-zinc-900 py-1"
                >
                  {link.name}
                </a>
              ))}
              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <a
                  href="/api/auth/github"
                  className="flex-1 text-center border border-zinc-200 rounded-full py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Sign in
                </a>
                <a
                  href="/api/auth/github"
                  className="flex-1 text-center bg-zinc-900 text-white rounded-full py-2.5 text-sm font-medium"
                >
                  Connect GitHub
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
