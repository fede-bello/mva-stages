export function CardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-x-6 gap-y-4 rounded-lg border border-line bg-surface px-5 py-[18px]">
      <div className="flex min-w-0 flex-[999_1_380px] flex-col gap-3">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-5 w-4/5" />
        <div className="skeleton h-3 w-3/5" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-5 w-24 rounded-full" />
        </div>
      </div>
      <div className="flex flex-[1_1_180px] flex-col gap-3">
        <div className="skeleton h-5 w-16" />
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-4 w-24" />
      </div>
    </div>
  )
}

export function OfferSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-7">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-8 w-4/5" />
        <div className="skeleton h-4 w-3/5" />
        <div className="skeleton h-11 w-60" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-px overflow-hidden rounded-lg border border-line bg-line">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 bg-surface px-[18px] py-4">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}
