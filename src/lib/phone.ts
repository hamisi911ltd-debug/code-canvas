// Accepts 07XXXXXXXX, 7XXXXXXXX, +254XXXXXXXXX or 254XXXXXXXXX and returns 254XXXXXXXXX
export function normalizeKenyanPhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) return `254${digits}`
  throw new Error('Enter a valid Safaricom number, e.g. 0712345678')
}
