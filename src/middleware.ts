import { defineMiddleware } from 'astro:middleware';
import { verifyToken } from './lib/auth';

const PUBLIC = new Set(['/', '/login']);
const PUBLIC_PREFIX = '/api/auth/';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;

  if (PUBLIC.has(pathname) || pathname.startsWith(PUBLIC_PREFIX)) {
    return next();
  }

  const token = ctx.cookies.get('auth_token')?.value;
  if (!token) return ctx.redirect('/login');

  const payload = await verifyToken(token);
  if (!payload) {
    ctx.cookies.delete('auth_token', { path: '/' });
    return ctx.redirect('/login');
  }

  ctx.locals.user = { userId: payload.userId, username: payload.username };
  return next();
});
