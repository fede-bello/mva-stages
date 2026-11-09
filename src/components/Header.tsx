import { NavLink } from 'react-router'

export default function Header() {
  return (
    <header className="on-dark bg-ink text-paper">
      <div className="mx-auto flex max-w-board flex-wrap items-center justify-between gap-4 px-6 py-[14px]">
        <div className="flex items-baseline gap-3">
          <span className="text-[20px] font-bold tracking-[-0.01em]">MVA Stages</span>
          <span className="font-mono text-[12px] text-header-muted">internships 2027</span>
        </div>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `inline-flex min-h-[44px] items-center border-b-2 px-3 py-[10px] font-medium text-paper no-underline hover:text-surface hover:underline ${
                isActive ? 'border-paper' : 'border-transparent'
              }`
            }
          >
            Board
          </NavLink>
          <NavLink
            to="/submit"
            className="inline-flex min-h-[44px] items-center rounded-sm bg-paper px-4 py-[10px] font-semibold text-ink no-underline hover:bg-surface hover:text-ink aria-[current=page]:shadow-[inset_0_-3px_0_var(--color-accent)]"
          >
            + Add an offer
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
