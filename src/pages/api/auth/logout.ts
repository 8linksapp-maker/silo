import type { APIRoute } from 'astro';

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete('auth_token', { path: '/' });
  return redirect('/login');
};
