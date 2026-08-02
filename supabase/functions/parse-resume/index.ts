// Extracts text from an uploaded resume file.
// DOCX/DOC: unzips and strips XML from word/document.xml via JSZip.
// PDF/images: uses Gemini native document understanding.
// Plain text: decodes base64 directly.

import JSZip from 'https://esm.sh/jszip@3.10.1';

const GEMINI_API_KEYS: string[] = (
  Deno.env.get('GEMINI_API_KEY') ?? ''
).split(',').map((k) => k.trim()).filter(Boolean);
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const GEMINI_SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif',
]);

function normalizeMimeType(mimeType: string, fileName: string): string {
  // Resolve iOS UTIs and non-standard aliases to canonical MIME types.
  const aliases: Record<string, string> = {
    'com.adobe.pdf':   'application/pdf',
    'application/x-pdf': 'application/pdf',
    'public.plain-text': 'text/plain',
    'public.utf8-plain-text': 'text/plain',
    'org.openxmlformats.wordprocessingml.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'com.microsoft.word.doc': 'application/msword',
  };
  if (aliases[mimeType]) return aliases[mimeType];
  if (mimeType !== 'application/octet-stream') return mimeType;
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf:  'application/pdf',
    txt:  'text/plain',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc:  'application/msword',
  };
  return map[ext] ?? mimeType;
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function isDocx(mimeType: string, fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return ext === 'docx' || ext === 'doc'
    || mimeType.includes('wordprocessingml')
    || mimeType.includes('msword');
}

async function extractDocxText(base64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const zip   = await JSZip.loadAsync(bytes);
  const xml   = await zip.file('word/document.xml')?.async('text');
  if (!xml) throw new Error('word/document.xml not found in archive');
  // Strip XML tags, collapse whitespace
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'INVALID_JSON' }, 400); }

  const { file_data, mime_type, file_name = '' } = body;
  if (!file_data || !mime_type) return json({ error: 'MISSING_FIELDS' }, 400);

  // Resolve application/octet-stream to a real MIME type from the file extension.
  const effectiveMime = normalizeMimeType(mime_type, file_name);

  // Google Workspace native formats cannot be decoded — reject immediately.
  if (effectiveMime.startsWith('application/vnd.google-apps.')) {
    return json({ error: 'UNSUPPORTED_FORMAT' }, 400);
  }

  // Plain text
  if (effectiveMime === 'text/plain' || effectiveMime.startsWith('text/')) {
    try {
      const text = new TextDecoder().decode(Uint8Array.from(atob(file_data), (c) => c.charCodeAt(0)));
      return json({ text: text.trim() });
    } catch {
      return json({ error: 'DECODE_FAILED' }, 400);
    }
  }

  // DOCX / DOC
  if (isDocx(effectiveMime, file_name)) {
    try {
      const text = await extractDocxText(file_data);
      if (!text) return json({ error: 'EMPTY_EXTRACTION' }, 500);
      return json({ text });
    } catch (e) {
      console.error('docx parse error', e);
      return json({ error: 'DOCX_PARSE_FAILED' }, 500);
    }
  }

  // Reject MIME types Gemini cannot process before making the API call.
  if (!GEMINI_SUPPORTED_MIME_TYPES.has(effectiveMime)) {
    return json({ error: 'UNSUPPORTED_FORMAT' }, 400);
  }

  // PDF / image — send to Gemini, rotating through keys on 429.
  const geminiPayload = JSON.stringify({
    contents: [{
      parts: [
        { inlineData: { mimeType: effectiveMime, data: file_data } },
        { text: 'This is a student resume. Extract every piece of text exactly as written. Preserve all sections: contact info, education, GPA, work experience, projects, skills, activities, awards. Output only the extracted text with clear section labels - no commentary, no summarizing.' },
      ],
    }],
    generationConfig: { temperature: 0, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
  });

  let res!: Response;
  for (const apiKey of GEMINI_API_KEYS) {
    res = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: geminiPayload,
    });
    if (res.status !== 429) break;
    await res.body?.cancel();
    console.warn('API key quota hit, trying next key...');
  }

  const data = await res.json();
  if (!res.ok) { console.error('gemini error', data); return json({ error: 'GEMINI_ERROR' }, 500); }

  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text || '').join('').trim();

  if (!text) return json({ error: 'EMPTY_EXTRACTION' }, 500);
  return json({ text });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
