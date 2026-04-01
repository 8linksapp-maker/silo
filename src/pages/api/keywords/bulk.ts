import type { APIRoute } from 'astro';
import { createKeywordsBulk } from '../../../lib/db';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { keywords } = await request.json();

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return json({ error: 'Lista de keywords inválida' }, 400);
    }

    // Sanitize and validate each entry
    const items = keywords
      .filter((k: unknown) => k && typeof (k as Record<string, unknown>).text === 'string')
      .map((k: Record<string, unknown>) => ({
        text:          String(k.text).trim().slice(0, 500),
        type:          k.type === 'primary' ? 'primary' : 'secondary' as 'primary' | 'secondary',
        search_volume: Math.max(0, parseInt(String(k.search_volume ?? 0)) || 0),
        difficulty:    Math.min(100, Math.max(0, parseInt(String(k.difficulty ?? 0)) || 0)),
      }))
      .filter(k => k.text.length > 0);

    if (items.length === 0) return json({ error: 'Nenhuma keyword válida encontrada' }, 400);

    const created = createKeywordsBulk(locals.user.userId, items);
    return json({ created: created.length, keywords: created }, 201);
  } catch {
    return json({ error: 'Erro interno' }, 500);
  }
};
