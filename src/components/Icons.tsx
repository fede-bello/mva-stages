const base = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function WarnIcon({ size = 18 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} className="flex-none">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  )
}

export function InfoIcon() {
  return (
    <svg {...base} width={20} height={20} className="mt-px flex-none">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

export function ChevronLeft() {
  return (
    <svg {...base} width={16} height={16} className="flex-none">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function ExternalIcon() {
  return (
    <svg {...base} width={16} height={16} className="flex-none">
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  )
}

export function FilterIcon() {
  return (
    <svg {...base} width={16} height={16} className="flex-none">
      <path d="M3 5h18" />
      <path d="M6 12h12" />
      <path d="M10 19h4" />
    </svg>
  )
}
