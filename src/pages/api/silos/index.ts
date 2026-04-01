import type { APIRoute } from 'astro';
import { getSilosByUser, createSilo } from '../../../lib/db';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = ({ locals }) => {
  return json(getSilosByUser(locals.user.userId));
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { name, description = '' } = await request.json();
    if (!name?.trim()) return json({ error: 'Nome é obrigatório' }, 400);
    const silo = createSilo(name.trim(), description.trim(), locals.user.userId);
    return json(silo, 201);
  } catch {
    return json({ error: 'Erro interno' }, 500);
  }
};
