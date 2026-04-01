import type { APIRoute } from 'astro';
import { getKeywordsByUser, createKeyword } from '../../../lib/db';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = ({ locals }) => {
  return json(getKeywordsByUser(locals.user.userId));
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { text, type = 'secondary', silo_id = null, search_volume = 0, difficulty = 0 } = body;
    if (!text?.trim()) return json({ error: 'Texto é obrigatório' }, 400);
    const kw = createKeyword(
      locals.user.userId,
      text.trim(),
      type,
      silo_id,
      Number(search_volume),
      Number(difficulty)
    );
    return json(kw, 201);
  } catch {
    return json({ error: 'Erro interno' }, 500);
  }
};
