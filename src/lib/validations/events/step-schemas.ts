import type { EventType } from '@/components/event-forms/event-wizard/EventTypeSelector'
import {
  performanceStep2Schema,
  auditionStep2Schema,
  creativeStep2Schema,
  classStep2Schema,
} from './index'
import type { z } from 'zod'
import type { EventFormData } from './index'

/**
 * Returns the appropriate step 2 validation schema based on event type
 * These schemas handle multi-flow forms (ORGANIZER vs PIECE, conditional fields, etc.)
 */
export function getStep2Schema(eventType: EventType): z.ZodType<Partial<EventFormData>> {
  switch (eventType) {
    case 'PERFORMANCE':
      return performanceStep2Schema
    case 'AUDITION':
      return auditionStep2Schema
    case 'CREATIVE':
      return creativeStep2Schema
    case 'CLASS':
      return classStep2Schema
    default:
      return performanceStep2Schema
  }
}
