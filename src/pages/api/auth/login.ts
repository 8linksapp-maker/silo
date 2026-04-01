import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { getUserByUsername } from '../../../lib/db';
import { createToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();

    if (!username?.trim() || !password) {
      return json({ error: 'Usuário e senha são obrigatórios' }, 400);
    }

    const user = getUserByUsername(username.trim());
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return json({ error: 'Usuário ou senha inválidos' }, 401);
    }

    const token = await createToken(user.id, user.username);
    cookies.set('auth_token', token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return json({ success: true });
  } catch {
    return json({ error: 'Erro interno' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
