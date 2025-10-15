"use client"

export type EventType = 'PERFORMANCE' | 'CLASS' | 'OPPORTUNITY'
export type OpportunitySubtype = 'FUNDING' | 'AUDITION' | 'CREATIVE' | null

interface EventTypeSelectorProps {
  eventType: EventType | null
  onChangeType: (t: EventType) => void
  opportunitySubtype: OpportunitySubtype
  onChangeSubtype: (s: OpportunitySubtype) => void
}

export function EventTypeSelector({ eventType, onChangeType, opportunitySubtype, onChangeSubtype }: EventTypeSelectorProps) {
  const value = eventType === 'OPPORTUNITY' && opportunitySubtype
    ? `OPPORTUNITY:${opportunitySubtype}`
    : (eventType ?? '')

  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const v = e.target.value
    if (v === 'PERFORMANCE' || v === 'CLASS') {
      onChangeType(v)
      onChangeSubtype(null)
      return
    }
    if (v.startsWith('OPPORTUNITY:')) {
      const sub = v.split(':')[1] as OpportunitySubtype
      onChangeType('OPPORTUNITY')
      onChangeSubtype(sub)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">What type of event is this? <span className="text-red-500">*</span></label>
      <select
        className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={value}
        onChange={handleChange}
      >
        <option value="" disabled>Select event type</option>
        <option value="PERFORMANCE">Performance</option>
        <option value="CLASS">Class/Workshop</option>
        <optgroup label="Professional Opportunities">
          <option value="OPPORTUNITY:FUNDING">Funding Opportunities</option>
          <option value="OPPORTUNITY:AUDITION">Auditions</option>
          <option value="OPPORTUNITY:CREATIVE">Creative Opportunities</option>
        </optgroup>
      </select>
    </div>
  )
}


