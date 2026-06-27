import TurndownService from 'turndown'

const TABLE_RE = /(<table[^>]*>[\s\S]*?<\/table>)/g
const CELL_RE = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g

function extractCells(tableHtml: string): string[] {
  const cells: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(CELL_RE)
  while ((m = re.exec(tableHtml))) cells.push(m[1].trim())
  return cells
}

let turndownService: TurndownService | null = null
function getTurndown(): TurndownService {
  if (turndownService) return turndownService
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' })
  // NoteRenderer is a small hand-rolled markdown reader, not a full CommonMark
  // parser — it never unescapes backslashes, so turndown's default escaping
  // (e.g. "1." -> "1\.") would otherwise show up literally in the lesson.
  td.escape = (s: string) => s
  turndownService = td
  return td
}

function cellToMarkdown(cellHtml: string): string {
  const md = getTurndown()
    .turndown(cellHtml)
    .replace(/\|/g, '\\|')
    .replace(/\s*\n\s*/g, ' ')
    .trim()
  return md || ' '
}

function rowsToMarkdownTable(rows: string[][]): string {
  const header = rows[0].map(cellToMarkdown)
  const body = rows.slice(1).map((r) => r.map(cellToMarkdown))
  const sep = header.map(() => '---')
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`
  return [line(header), line(sep), ...body.map(line)].join('\n')
}

/**
 * Docx authoring tools (incl. the ones used for the VIBELEARN curriculum) often
 * emit one standalone <table> per logical table *row*, and use a single-cell
 * <table> purely as a styled callout box. Neither survives a literal HTML->MD
 * conversion well, so both get normalized before handing off to turndown:
 *   - lone 1x1 table  -> blockquote (renders as a callout in NoteRenderer)
 *   - a run of adjacent 1x2 tables -> one GFM markdown table (first row = header)
 *
 * The reconstructed table is built as final markdown text (not HTML) and
 * dropped in as a placeholder, because turndown's table support depends on
 * browser DOM APIs (real `nodeName`/`HTMLTableElement`) that aren't reliably
 * available when this runs server-side under plain Node.
 */
function normalizeDocxTables(html: string): { html: string; tables: string[] } {
  const parts = html.split(TABLE_RE)
  const out: string[] = []
  const tables: string[] = []
  let i = 0
  while (i < parts.length) {
    const part = parts[i]
    if (!part.startsWith('<table')) {
      out.push(part)
      i++
      continue
    }
    const cells = extractCells(part)
    if (cells.length === 1) {
      out.push(`<blockquote>${cells[0]}</blockquote>`)
      i++
      continue
    }
    if (cells.length === 2) {
      const rows: string[][] = [cells]
      // Look past whitespace-only gaps (split() alternates capture/non-capture
      // even when the gap between two adjacent <table> matches is empty) to find
      // the next real table; stop as soon as it isn't a matching 1x2 table.
      let j = i + 1
      while (true) {
        let k = j
        while (k < parts.length && !parts[k].startsWith('<table') && parts[k].trim() === '') k++
        if (k >= parts.length || !parts[k].startsWith('<table')) break
        const nextCells = extractCells(parts[k])
        if (nextCells.length !== 2) break
        rows.push(nextCells)
        j = k + 1
      }
      const placeholder = `@@TABLE_${tables.length}@@`
      tables.push(rowsToMarkdownTable(rows))
      out.push(placeholder)
      i = j
      continue
    }
    // Already a normal multi-cell table — leave as-is (rare in this content).
    out.push(part)
    i++
  }
  return { html: out.join(''), tables }
}

/** Unwraps a heading line that's entirely bolded ("## **Title**" -> "## Title") —
 *  redundant since headings render bold already, and NoteRenderer doesn't apply
 *  inline formatting to heading text. */
function unwrapBoldHeadings(md: string): string {
  return md
    .split('\n')
    .map((line) => {
      const m = line.match(/^(#{1,6} )\*\*(.+)\*\*$/)
      return m ? `${m[1]}${m[2]}` : line
    })
    .join('\n')
}

/** Some source docs hand-typed "1. Do the thing" as the text of an already-numbered
 *  list item, so turndown's own "1. " prefix doubles it up ("1. 1. Do the thing"). */
function dedupeOrderedListNumbering(md: string): string {
  return md
    .split('\n')
    .map((line) => line.replace(/^(\d+\.\s+)\d+\.\s+/, '$1'))
    .join('\n')
}

/** Converts mammoth's docx->HTML output into the Markdown dialect NoteRenderer understands. */
export function docxHtmlToMarkdown(html: string): string {
  const { html: withoutTables, tables } = normalizeDocxTables(html)
  let md = getTurndown().turndown(withoutTables)
  tables.forEach((table, idx) => { md = md.replace(`@@TABLE_${idx}@@`, `\n\n${table}\n\n`) })
  return dedupeOrderedListNumbering(unwrapBoldHeadings(md.replace(/\n{3,}/g, '\n\n'))).trim()
}
