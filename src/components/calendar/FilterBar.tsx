"use client"

interface FilterBarProps {
  show: boolean
  onToggle: () => void
  eventType: string
  onChangeEventType: (v: string) => void
  price: 'ALL' | 'FREE' | 'PAID'
  onChangePrice: (v: 'ALL' | 'FREE' | 'PAID') => void
  genres: Set<string>
  onChangeGenres: (next: Set<string>) => void
  boroughs: Set<string>
  onChangeBoroughs: (next: Set<string>) => void
}

export function FilterBar({ show, onToggle, eventType, onChangeEventType, price, onChangePrice, genres, onChangeGenres, boroughs, onChangeBoroughs }: FilterBarProps) {
  const toggleSet = (current: Set<string>, value: string, checked: boolean) => {
    const next = new Set(current)
    if (checked) next.add(value); else next.delete(value)
    return next
  }
  return (
    <div className="mb-6">
      <button className="text-sm text-gray-700 underline" onClick={onToggle} type="button">
        {show ? 'Hide filters' : 'Show filters'}
      </button>
      {show && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Event Type</label>
            <select
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
              value={eventType}
              onChange={(e) => onChangeEventType(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="CLASS">Class/Workshop</option>
              <option value="FUNDING">Funding Opportunities</option>
              <option value="AUDITION">Auditions</option>
              <option value="CREATIVE">Creative Opportunities</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
            <select
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
              value={price}
              onChange={(e) => onChangePrice(e.target.value as 'ALL' | 'FREE' | 'PAID')}
            >
              <option value="ALL">All</option>
              <option value="FREE">Free</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Genre</label>
            <div className="flex flex-wrap gap-2">
              {['Contemporary','Ballet','Hip-Hop','Jazz','Tap','Modern'].map(g => (
                <label key={g} className="inline-flex items-center gap-1 text-xs text-gray-700">
                  <input type="checkbox" checked={genres.has(g)} onChange={(e) => onChangeGenres(toggleSet(genres, g, e.target.checked))} />
                  {g}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Borough</label>
            <div className="flex flex-wrap gap-2">
              {['Manhattan','Brooklyn','Queens','Bronx','Staten Island'].map(b => (
                <label key={b} className="inline-flex items-center gap-1 text-xs text-gray-700">
                  <input type="checkbox" checked={boroughs.has(b)} onChange={(e) => onChangeBoroughs(toggleSet(boroughs, b, e.target.checked))} />
                  {b}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


