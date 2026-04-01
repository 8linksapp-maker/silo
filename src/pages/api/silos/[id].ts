import type { APIRoute } from 'astro';
import { updateSilo, deleteSilo } from '../../../lib/db';

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
    const { name, description = '' } = await request.json();
    if (!name?.trim()) return json({ error: 'Nome é obrigatório' }, 400);
    const silo = updateSilo(id, locals.user.userId, name.trim(), description.trim());
    if (!silo) return json({ error: 'SILO não encontrado' }, 404);
    return json(silo);
  } catch {
    return json({ error: 'Erro interno' }, 500);
  }
};

export const DELETE: APIRoute = ({ locals, params }) => {
  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) return json({ error: 'ID inválido' }, 400);
    deleteSilo(id, locals.user.userId);
    return json({ success: true });
  } catch {
    return json({ error: 'Erro interno' }, 500);
  }
};
