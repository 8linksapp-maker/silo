export interface ScoreResult {
  score: number;
  label: string;
  textColor: string;
  strokeColor: string;
  bgClass: string;
}

interface KwType {
  type: 'primary' | 'secondary';
}

export function calculateScore(keywords: KwType[]): ScoreResult {
  const primary = keywords.filter(k => k.type === 'primary');
  const secondary = keywords.filter(k => k.type === 'secondary');

  let score = 0;

  // Primary keyword (25 pts — ideal: exactly 1)
  if (primary.length === 1) score += 25;
  else if (primary.length > 1) score += 5;

  // Secondary keywords (5 pts each, max 10 = 50 pts)
  score += Math.min(secondary.length * 5, 50);

  // Structure bonus (25 pts — needs 1 primary + 3–15 secondary)
  if (primary.length === 1 && secondary.length >= 3 && secondary.length <= 15) {
    score += 25;
  }

  score = Math.min(score, 100);

  if (score === 0)  return { score, label: 'Vazio',    textColor: 'text-slate-400',   strokeColor: '#cbd5e1', bgClass: 'bg-slate-100' };
  if (score <= 25)  return { score, label: 'Fraco',    textColor: 'text-red-500',     strokeColor: '#ef4444', bgClass: 'bg-red-50'    };
  if (score <= 50)  return { score, label: 'Regular',  textColor: 'text-orange-500',  strokeColor: '#f97316', bgClass: 'bg-orange-50' };
  if (score <= 75)  return { score, label: 'Bom',      textColor: 'text-yellow-600',  strokeColor: '#ca8a04', bgClass: 'bg-yellow-50' };
  if (score < 90)   return { score, label: 'Ótimo',    textColor: 'text-green-600',   strokeColor: '#16a34a', bgClass: 'bg-green-50'  };
  return             { score, label: 'Perfeito',  textColor: 'text-emerald-600', strokeColor: '#059669', bgClass: 'bg-emerald-50' };
}
