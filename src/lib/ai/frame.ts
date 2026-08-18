/**
 * What the synthesis is allowed to know about the person.
 *
 * Deliberately its own module with no imports: the engine must never reach the
 * database or the environment, or its tests cannot run without one.
 */
export type PersonalFrame = {
  energises: string | null
  drains: string | null
  aspiration: string | null
}

export const EMPTY_FRAME: PersonalFrame = {
  energises: null,
  drains: null,
  aspiration: null,
}
