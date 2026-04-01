import React, { useState } from 'react';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || 'Erro ao entrar');
      else window.location.href = '/dashboard';
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor="username">Usuário</label>
        <input
          id="username" name="username" type="text" required autoFocus
          placeholder="admin"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor="password">Senha</label>
        <input
          id="password" name="password" type="password" required
          placeholder="••••••••"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors"
        />
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full bg-violet-600 text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Entrando...
          </>
        ) : 'Entrar'}
      </button>
    </form>
  );
}
