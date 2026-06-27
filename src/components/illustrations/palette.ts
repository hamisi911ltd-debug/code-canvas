// Small accent-color rotation so lessons within the same course don't all render
// the identical illustration — picked deterministically from the lesson's position.
const ACCENTS = ['#2dd4a8', '#60a5fa', '#f472b6', '#f59e0b', '#a78bfa', '#34d399']

export function accentFor(seed = 0): string {
  return ACCENTS[((seed % ACCENTS.length) + ACCENTS.length) % ACCENTS.length]
}
