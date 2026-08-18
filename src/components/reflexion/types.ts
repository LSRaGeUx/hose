export type Mode = 'auto' | 'assist'

export type Exchange = {
  question: string
  answer: string | null
}

export type Verb = {
  verb: string
  solution: string
}

/**
 * Where the session is in the five-whys run.
 *
 * `synthesizing` is separate from `running` because it is the slowest step and
 * deserves its own message rather than a generic spinner.
 */
export type Status =
  | { kind: 'setup' }
  | { kind: 'starting' }
  | { kind: 'waiting-for-answer' }
  | { kind: 'thinking' }
  | { kind: 'synthesizing' }
  | { kind: 'saving' }
  | { kind: 'done' }
  | { kind: 'error'; message: string }
