// One-time importer: parses the 6 VIBELEARN CURRICULUM .docx files and turns
// each into a course module + a sequence of lessons (split on H2 headings),
// then emits a SQL file that replaces that course's existing lessons/modules.
// Run: node scripts/seed-curriculum.mjs
// Then apply with: wrangler d1 execute vibelearn --local -y --file=scripts/curriculum-import.sql
import mammoth from 'mammoth'
import { writeFileSync } from 'fs'
import { docxHtmlToMarkdown } from '../src/lib/docx-to-markdown.ts'

const CURRICULUM_DIR = '../VIBELEARN CURRICULUM'

const FILES = [
  { file: 'Module1_Vibecoding101-1.docx', courseId: 'course-vibecoding-101' },
  { file: 'Module2_React_TypeScript.docx', courseId: 'course-react-typescript-mastery' },
  { file: 'Module3_Backend_APIs_Node_D1.docx', courseId: 'course-backend-apis-node-d1' },
  { file: 'Module4_AI_Into_Real_Products-1.docx', courseId: 'course-ai-integration' },
  { file: 'Module5_Deploy_Scale_Cloudflare-1.docx', courseId: 'course-devops-cloudflare' },
  { file: 'Module6_Design_Systems_Figma.docx', courseId: 'course-ui-design-figma' },
]

function newId() {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('')
}

function sqlStr(s) {
  return `'${String(s).replace(/'/g, "''")}'`
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
}

function extractTitleBlock(html) {
  const m = html.match(/^<table[^>]*>[\s\S]*?<\/table>/)
  if (!m) return { title: '', subtitle: '', rest: html }
  const paragraphs = [...m[0].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((p) => stripTags(p[1])).filter(Boolean)
  // Shape is consistently: [MODULE N, emoji, Title, Subtitle]
  const title = paragraphs[2] ?? paragraphs[paragraphs.length - 2] ?? ''
  const subtitle = paragraphs[3] ?? paragraphs[paragraphs.length - 1] ?? ''
  return { title, subtitle, rest: html.slice(m[0].length) }
}

function splitIntoLessons(markdown) {
  const lines = markdown.split('\n')
  const sections = []
  let current = { heading: null, lines: [] }
  for (const line of lines) {
    if (/^## /.test(line)) {
      if (current.lines.some((l) => l.trim())) sections.push(current)
      current = { heading: line.replace(/^## /, '').trim(), lines: [] }
    } else {
      current.lines.push(line)
    }
  }
  if (current.lines.some((l) => l.trim())) sections.push(current)

  // Intro content before the first H2 (callout/definition) reads better folded
  // into lesson 1 than as its own near-empty lesson.
  if (sections.length > 1 && sections[0].heading === null) {
    const intro = sections.shift()
    sections[0].lines = [...intro.lines, '', ...sections[0].lines]
  }

  return sections.map((s, i) => {
    const body = (s.heading ? `## ${s.heading}\n` : '') + s.lines.join('\n')
    const title = s.heading ? s.heading.replace(/^[^\w]*\s*/u, '').trim() || s.heading : `Overview`
    const wordCount = body.split(/\s+/).filter(Boolean).length
    return {
      position: i + 1,
      title,
      content: body.trim(),
      duration_minutes: Math.max(3, Math.round(wordCount / 130)),
    }
  })
}

const statements = []
const summary = []

for (const { file, courseId } of FILES) {
  const path = `${CURRICULUM_DIR}/${file}`
  const { value: rawHtml } = await mammoth.convertToHtml({ path })
  const { title, subtitle, rest } = extractTitleBlock(rawHtml)
  const bodyMarkdown = docxHtmlToMarkdown(rest)
  const lessons = splitIntoLessons(bodyMarkdown)

  const moduleId = newId()
  statements.push(`DELETE FROM lessons WHERE course_id = ${sqlStr(courseId)};`)
  statements.push(`DELETE FROM module_tests WHERE module_id IN (SELECT id FROM modules WHERE course_id = ${sqlStr(courseId)});`)
  statements.push(`DELETE FROM modules WHERE course_id = ${sqlStr(courseId)};`)
  statements.push(
    `INSERT INTO modules (id, course_id, title, description, position, token_cost) VALUES (${sqlStr(moduleId)}, ${sqlStr(courseId)}, ${sqlStr(title || file)}, ${sqlStr(subtitle)}, 1, 1);`,
  )

  for (const lesson of lessons) {
    const lessonId = newId()
    statements.push(
      `INSERT INTO lessons (id, course_id, module_id, title, description, content, position, duration_minutes) VALUES (${sqlStr(lessonId)}, ${sqlStr(courseId)}, ${sqlStr(moduleId)}, ${sqlStr(lesson.title)}, ${sqlStr(subtitle)}, ${sqlStr(lesson.content)}, ${lesson.position}, ${lesson.duration_minutes});`,
    )
  }

  summary.push({ file, courseId, title, subtitle, lessonCount: lessons.length, lessonTitles: lessons.map((l) => l.title) })
}

writeFileSync(new URL('./curriculum-import.sql', import.meta.url), statements.join('\n') + '\n')
console.log(JSON.stringify(summary, null, 2))
console.log(`\nWrote ${statements.length} statements to scripts/curriculum-import.sql`)
