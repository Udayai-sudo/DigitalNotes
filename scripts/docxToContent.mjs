/**
 * Convert chapter .docx files in public/chapters into .content.json
 * (Q&A list used by the reader — 2 questions per page).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHAPTERS_DIR = path.join(ROOT, 'public', 'chapters');

const EXTRACT_PY = `
import zipfile, xml.etree.ElementTree as ET, json, re, sys
path = sys.argv[1]
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
with zipfile.ZipFile(path) as z:
    root = ET.fromstring(z.read("word/document.xml"))
paras = []
for p in root.iter(W + "p"):
    texts = [t.text or "" for t in p.iter(W + "t")]
    line = "".join(texts).strip()
    if line:
        paras.append(line)

def is_junk(s):
    if re.fullmatch(r"\\d+", s):
        return True
    if re.search(r"BTM Layout|Bengaluru|560076|8050749191", s, re.I):
        return True
    if re.match(r"^StringStack\\.ai", s, re.I):
        return True
    if re.fullmatch(r"Introduction to Java", s, re.I):
        return True
    return False

clean = [p for p in paras if not is_junk(p)]

def normalize_q(s):
    s = re.sub(r"^\\d*G\\.\\s*", "", s)
    s = re.sub(r"^\\d+\\.\\s*", "", s)
    return s.strip()

def is_question(s):
    s2 = normalize_q(s)
    if s2.endswith("?"):
        return True
    # Numbered lines (e.g. "27. When ...") can be questions without "?".
    # Do NOT treat bare "When/What ..." answer bodies as questions.
    if re.match(r"^\\d+[G]?\\.\\s*", s):
        return bool(re.match(r"^(What|Why|How|When|Where|Who|Explain|Describe|Define)\\b", s2, re.I))
    return False

items = []
i = 0
while i < len(clean):
    line = clean[i]
    if is_question(line):
        q = normalize_q(line)
        ans = []
        i += 1
        while i < len(clean) and not is_question(clean[i]):
            chunk = clean[i].strip()
            if not re.fullmatch(r"Answer\\s*:?", chunk, re.I):
                ans.append(chunk)
            i += 1
        answer = re.sub(r"\\s+", " ", " ".join(ans)).strip()
        answer = answer.replace("Network Without", "Network. Without")
        if answer:
            if not answer.lower().startswith("answer"):
                answer = f"Answer: {answer}"
            items.append({"question": q, "answer": answer})
    else:
        i += 1

print(json.dumps(items, ensure_ascii=True))
`;

function runPython(script, docxPath) {
  const bins = process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python'];
  let lastError;
  for (const bin of bins) {
    try {
      return execFileSync(bin, ['-c', script, docxPath], {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('Python is required to convert .docx chapters');
}

export function convertDocxChapters() {
  if (!fs.existsSync(CHAPTERS_DIR)) return [];

  const converted = [];
  const files = fs.readdirSync(CHAPTERS_DIR).filter((f) => f.toLowerCase().endsWith('.docx'));

  for (const filename of files) {
    const docxPath = path.join(CHAPTERS_DIR, filename);
    const base = filename.replace(/\.docx$/i, '');
    const outPath = path.join(CHAPTERS_DIR, `${base}.content.json`);

    let items;
    try {
      const raw = runPython(EXTRACT_PY, docxPath);
      items = JSON.parse(raw);
    } catch (err) {
      console.warn(`Skipping docx convert for ${filename}:`, err instanceof Error ? err.message : err);
      continue;
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.warn(`No Q&A items found in ${filename}`);
      continue;
    }

    const title = base
      .replace(/^\d+[-_.\s]+/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const payload = {
      title,
      itemsPerPage: 2,
      source: filename,
      items,
    };

    const next = `${JSON.stringify(payload, null, 2)}\n`;
    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    if (prev === next) continue;

    fs.writeFileSync(outPath, next, 'utf8');
    converted.push({ filename, outPath, count: items.length });
  }

  return converted;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const converted = convertDocxChapters();
  console.log(`Converted ${converted.length} docx chapter(s)`);
  for (const item of converted) {
    console.log(`  ${item.filename} → ${path.basename(item.outPath)} (${item.count} Q&As)`);
  }
}
