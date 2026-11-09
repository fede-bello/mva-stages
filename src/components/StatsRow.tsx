import type { Stats } from '../lib/derive'

function StatTile({ label, value, urgent = false }: { label: string; value: string | number; urgent?: boolean }) {
  return (
    <div className="rounded-md border border-line bg-surface px-[14px] py-2">
      <dt className="label-mono">{label}</dt>
      <dd className={`m-0 text-[20px] font-semibold ${urgent ? 'text-urgent' : ''}`}>{value}</dd>
    </div>
  )
}

export default function StatsRow({ stats }: { stats: Stats | null }) {
  const v = (n: number | string | undefined) => (stats ? (n as number | string) : '...')
  return (
    <dl className="m-0 flex flex-wrap gap-2" aria-busy={stats ? undefined : true}>
      <StatTile label="Open" value={v(stats?.open)} />
      <StatTile label="Closing in 3 weeks" value={v(stats?.soon)} urgent />
      <StatTile label="Stipend stated" value={v(stats?.paid)} />
      <StatTile label="Last sweep" value={v(stats?.lastSweep)} />
    </dl>
  )
}
