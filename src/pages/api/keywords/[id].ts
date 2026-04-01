import type { APIRoute } from 'astro';
import { updateKeyword, deleteKeyword } from '../../../lib/db';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const PATCH: APIRoute = async ({ request, locals, params }) => {
  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) return json({ error: 'ID inválido' }, 400);

    const body = await request.json();
    const allowed = ['text', 'type', 'silo_id', 'search_volume', 'difficulty', 'position'] as const;
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    const kw = updateKeyword(id, locals.user.userId, data as Parameters<typeof updateKeyword>[2]);
    if (!kw) return json({ error: 'Keyword não encontrada' }, 404);
    return json(kw);
  } catch {
    return json({ error: 'Erro interno' }, 500);
  }
};

export const DELETE: APIRoute = ({ locals, params }) => {
  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) return json({ error: 'ID inválido' }, 400);
    deleteKeyword(id, locals.user.userId);
    return json({ success: true });
  } catch {
    return json({ error: 'Erro interno' }, 500);
  }
};
