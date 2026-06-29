export function FooterSection() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif-display text-xl text-zinc-900">Stagecraft</span>
          <p className="text-xs text-zinc-400 font-code text-center sm:text-left">
            GitHub Actions intelligence — unified runs view + AI-suggested fixes.
          </p>
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} Stagecraft
          </p>
        </div>
      </div>
    </footer>
  )
}
