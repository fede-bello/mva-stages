import type { Tone } from '../lib/derive'

const TONES: Record<Tone, string> = {
  ok: 'text-ok-ink bg-ok-bg',
  warn: 'text-warn-ink bg-warn-bg',
  info: 'text-accent-strong bg-accent-soft',
  neutral: 'text-neutral-ink bg-neutral-bg',
}

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`inline-block rounded-xs px-2 py-[3px] text-[12px] leading-[1.45] font-semibold ${TONES[tone]}`}>{label}</span>
}

export function TopicTag({ topic }: { topic: string }) {
  return <span className="rounded-full bg-accent-soft px-[10px] py-[3px] text-[12px] leading-[1.45] text-accent">{topic}</span>
}

export function UnverifiedBadge() {
  return (
    <span className="rounded-xs bg-warn-bg px-[6px] py-[2px] text-[12px] font-medium text-warn-ink">
      Unverified · added by a student
    </span>
  )
}
