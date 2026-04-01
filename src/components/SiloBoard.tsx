import React, { useState, useMemo, useCallback } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Trash2, Pencil, GripVertical, X, Check,
  Star, Hash, TrendingUp, AlertCircle, Layers,
  Upload, FileText, ChevronDown, Download,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface Keyword {
  id: number;
  text: string;
  type: 'primary' | 'secondary';
  status: 'pendente' | 'feito';
  silo_id: number | null;
  search_volume: number;
  difficulty: number;
}

interface Silo {
  id: number;
  name: string;
  description: string;
}

interface Props {
  initialSilos: Silo[];
  initialKeywords: Keyword[];
  username: string;
}

// ── Score ───────────────────────────────────────────────────────────────────

function score(kws: Keyword[]) {
  const pri = kws.filter(k => k.type === 'primary');
  const sec = kws.filter(k => k.type === 'secondary');
  let s = 0;
  if (pri.length === 1) s += 25;
  else if (pri.length > 1) s += 5;
  s += Math.min(sec.length * 5, 50);
  if (pri.length === 1 && sec.length >= 3 && sec.length <= 15) s += 25;
  s = Math.min(s, 100);

  if (s === 0)  return { s, label: 'Vazio',   stroke: '#cbd5e1', text: 'text-slate-400'   };
  if (s <= 25)  return { s, label: 'Fraco',   stroke: '#ef4444', text: 'text-red-500'     };
  if (s <= 50)  return { s, label: 'Regular', stroke: '#f97316', text: 'text-orange-500'  };
  if (s <= 75)  return { s, label: 'Bom',     stroke: '#ca8a04', text: 'text-yellow-600'  };
  if (s < 90)   return { s, label: 'Ótimo',   stroke: '#16a34a', text: 'text-green-600'   };
  return              { s, label: 'Perfeito', stroke: '#059669', text: 'text-emerald-600' };
}

// ── cn helper ───────────────────────────────────────────────────────────────

function cn(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(' '); }

// ── API helpers ─────────────────────────────────────────────────────────────

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ── ScoreRing ───────────────────────────────────────────────────────────────

function ScoreRing({ kws }: { kws: Keyword[] }) {
  const { s, label, stroke, text } = score(kws);
  const r = 18; const circ = 2 * Math.PI * r;
  const offset = circ - (s / 100) * circ;
  return (
    <div className="flex items-center gap-1.5">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={stroke} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 22 22)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="22" y="27" textAnchor="middle" fontSize="11" fontWeight="700" fill={stroke}>{s}</text>
      </svg>
      <span className={cn('text-xs font-semibold', text)}>{label}</span>
    </div>
  );
}

// ── KeywordCard ─────────────────────────────────────────────────────────────

interface CardProps {
  kw: Keyword;
  inSilo?: boolean;
  isOverlay?: boolean;
  onDelete: (id: number) => void;
  onToggleType: (id: number) => void;
  onRemoveFromSilo: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

function KeywordCard({ kw, inSilo, isOverlay, onDelete, onToggleType, onRemoveFromSilo, onToggleStatus }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: kw.id });
  const style = { transform: CSS.Translate.toString(transform) };
  const done = kw.status === 'feito';

  return (
    <div
      ref={setNodeRef} style={isOverlay ? undefined : style}
      className={cn(
        'group flex items-start gap-2 border rounded-lg px-2.5 py-2 text-sm select-none transition-colors',
        done
          ? 'bg-green-50 border-green-200'
          : kw.type === 'primary'
            ? 'bg-white border-blue-200 ring-1 ring-blue-100'
            : 'bg-white border-slate-200',
        isDragging && 'opacity-30',
        isOverlay && 'shadow-xl rotate-1 opacity-95',
      )}
    >
      {/* Status toggle — sempre visível */}
      {!isOverlay && (
        <button
          onClick={() => onToggleStatus(kw.id)}
          title={done ? 'Marcar como pendente' : 'Marcar como feito'}
          className={cn(
            'mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
            done
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-slate-300 hover:border-green-400',
          )}
        >
          {done && <Check className="w-2.5 h-2.5" />}
        </button>
      )}

      {/* Drag handle */}
      <button
        {...attributes} {...listeners}
        className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn('font-medium truncate', done ? 'text-green-700 line-through decoration-green-400' : 'text-slate-800')}>
            {kw.text}
          </span>
          {kw.type === 'primary' && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 shrink-0">
              <Star className="w-2.5 h-2.5" /> PRINCIPAL
            </span>
          )}
          {done && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 shrink-0">
              FEITO
            </span>
          )}
        </div>
        {(kw.search_volume > 0 || kw.difficulty > 0) && (
          <div className="flex items-center gap-2 mt-1">
            {kw.search_volume > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                <TrendingUp className="w-3 h-3" />{kw.search_volume.toLocaleString()}
              </span>
            )}
            {kw.difficulty > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                <Hash className="w-3 h-3" />KD {kw.difficulty}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions on hover */}
      {!isOverlay && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {inSilo && (
            <button onClick={() => onToggleType(kw.id)} title="Alternar tipo"
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-violet-600 transition-colors">
              <Star className="w-3 h-3" />
            </button>
          )}
          {inSilo && (
            <button onClick={() => onRemoveFromSilo(kw.id)} title="Remover do SILO"
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-orange-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
          <button onClick={() => onDelete(kw.id)} title="Excluir keyword"
            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── PrimarySlot ─────────────────────────────────────────────────────────────

type CardHandlers = Omit<CardProps, 'kw' | 'inSilo' | 'isOverlay'>;

function PrimarySlot({ siloId, kw, ...handlers }: {
  siloId: number; kw?: Keyword;
} & CardHandlers) {
  const { setNodeRef, isOver } = useDroppable({ id: `pri-${siloId}` });

  return (
    <div ref={setNodeRef}
      className={cn(
        'rounded-lg border-2 border-dashed transition-colors min-h-[52px] p-1',
        isOver ? 'border-blue-400 bg-blue-50' : kw ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-slate-50',
      )}
    >
      {kw ? (
        <KeywordCard kw={kw} inSilo {...handlers} />
      ) : (
        <div className="flex items-center justify-center h-10 gap-1.5 text-xs text-slate-400">
          <Star className="w-3.5 h-3.5" />
          <span>Arraste a palavra principal</span>
        </div>
      )}
    </div>
  );
}

// ── SecondaryArea ────────────────────────────────────────────────────────────

function SecondaryArea({ siloId, kws, ...handlers }: {
  siloId: number; kws: Keyword[];
} & CardHandlers) {
  const { setNodeRef, isOver } = useDroppable({ id: `sec-${siloId}` });

  return (
    <div ref={setNodeRef}
      className={cn(
        'rounded-lg border-2 border-dashed min-h-[60px] p-1 transition-colors flex flex-col gap-1',
        isOver ? 'border-violet-400 bg-violet-50' : 'border-slate-200',
      )}
    >
      {kws.length > 0
        ? kws.map(k => <KeywordCard key={k.id} kw={k} inSilo {...handlers} />)
        : (
          <div className="flex items-center justify-center h-12 gap-1.5 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5" />
            <span>Arraste palavras secundárias</span>
          </div>
        )}
    </div>
  );
}

// ── SiloColumn ───────────────────────────────────────────────────────────────

interface ColProps {
  silo: Silo;
  kws: Keyword[];
  onDeleteSilo: (id: number) => void;
  onRenameSilo: (id: number, name: string) => void;
  onDeleteKw: (id: number) => void;
  onToggleType: (id: number) => void;
  onRemoveFromSilo: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

function SiloColumn({ silo, kws, onDeleteSilo, onRenameSilo, onDeleteKw, onToggleType, onRemoveFromSilo, onToggleStatus }: ColProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(silo.name);

  function saveRename() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== silo.name) onRenameSilo(silo.id, trimmed);
    else setEditName(silo.name);
    setEditing(false);
  }

  const { s } = score(kws);
  const primaryKw = kws.find(k => k.type === 'primary');
  const secondaryKws = kws.filter(k => k.type === 'secondary');
  const cardHandlers = { onDelete: onDeleteKw, onToggleType, onRemoveFromSilo, onToggleStatus };

  return (
    <div className="w-72 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-slate-100">
        <ScoreRing kws={kws} />
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-1">
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') { setEditName(silo.name); setEditing(false); } }}
                className="flex-1 min-w-0 text-sm font-semibold border border-violet-400 rounded px-1.5 py-0.5 outline-none focus:ring-1 ring-violet-300"
              />
              <button onClick={saveRename} className="text-green-600 hover:text-green-700 p-0.5"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setEditName(silo.name); setEditing(false); }} className="text-slate-400 hover:text-slate-600 p-0.5"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1 group/title">
              <span className="text-sm font-semibold text-slate-800 truncate">{silo.name}</span>
              <button onClick={() => setEditing(true)} className="opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-violet-600 transition-opacity p-0.5">
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}
          <span className={cn('text-xs', s >= 90 ? 'text-emerald-600' : s >= 75 ? 'text-green-600' : 'text-slate-400')}>
            {kws.length} keyword{kws.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button onClick={() => onDeleteSilo(silo.id)}
          className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-3 flex-1 overflow-y-auto max-h-[460px]">
        <div>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Star className="w-3 h-3" /> Palavra Principal
          </p>
          <PrimarySlot siloId={silo.id} kw={primaryKw} {...cardHandlers} />
        </div>

        <div>
          <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Palavras Secundárias
            <span className="ml-auto font-normal text-slate-400 normal-case">{secondaryKws.length}</span>
          </p>
          <SecondaryArea siloId={silo.id} kws={secondaryKws} {...cardHandlers} />
        </div>
      </div>
    </div>
  );
}

// ── KeywordPool ──────────────────────────────────────────────────────────────

function KeywordPool({ kws, onDelete, onToggleType, onRemoveFromSilo, onToggleStatus }: {
  kws: Keyword[];
  onDelete: (id: number) => void;
  onToggleType: (id: number) => void;
  onRemoveFromSilo: (id: number) => void;
  onToggleStatus: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' });

  return (
    <div className="shrink-0 border-t border-slate-200 bg-slate-50" style={{ maxHeight: '220px' }}>
      <div className="flex flex-col h-full px-6 pt-3 pb-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 shrink-0">
          <Hash className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-600">Pool de Keywords</span>
          <span className="text-xs text-slate-400">— arraste para um SILO</span>
          <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{kws.length}</span>
        </div>

        {/* Drop zone — scrolls internally */}
        <div
          ref={setNodeRef}
          className={cn(
            'flex-1 overflow-y-auto min-h-0 rounded-xl border-2 border-dashed transition-colors p-2',
            isOver ? 'border-violet-400 bg-violet-50' : 'border-slate-200',
          )}
        >
          {kws.length === 0 ? (
            <div className="flex items-center justify-center gap-2 h-10 text-sm text-slate-400">
              <AlertCircle className="w-4 h-4" />
              Todas as keywords estão nos SILOs
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {kws.map(k => (
                <KeywordCard key={k.id} kw={k} onDelete={onDelete} onToggleType={onToggleType} onRemoveFromSilo={onRemoveFromSilo} onToggleStatus={onToggleStatus} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modals ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function inputCls() {
  return 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-colors';
}

function AddSiloModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, desc: string) => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  return (
    <Modal title="Novo SILO" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome *</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onCreate(name.trim(), desc.trim())}
            placeholder="ex: Marketing Digital" className={inputCls()} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Descrição</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Opcional" className={inputCls()} />
        </div>
        <button
          onClick={() => name.trim() && onCreate(name.trim(), desc.trim())}
          disabled={!name.trim()}
          className="w-full bg-violet-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 transition-colors"
        >
          Criar SILO
        </button>
      </div>
    </Modal>
  );
}

function AddKeywordModal({ onClose, onCreate }: { onClose: () => void; onCreate: (text: string, type: 'primary' | 'secondary', vol: number, diff: number) => void }) {
  const [text, setText] = useState('');
  const [type, setType] = useState<'primary' | 'secondary'>('secondary');
  const [vol, setVol] = useState('');
  const [diff, setDiff] = useState('');
  return (
    <Modal title="Nova Keyword" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Keyword *</label>
          <input autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="ex: marketing digital" className={inputCls()} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Tipo</label>
          <div className="flex gap-2">
            {(['secondary', 'primary'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={cn(
                  'flex-1 py-2 text-sm rounded-lg border font-medium transition-colors',
                  type === t ? (t === 'primary' ? 'bg-blue-600 text-white border-blue-600' : 'bg-violet-600 text-white border-violet-600') : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}>
                {t === 'primary' ? '⭐ Principal' : '# Secundária'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Volume</label>
            <input type="number" min="0" value={vol} onChange={e => setVol(e.target.value)} placeholder="0" className={inputCls()} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">KD (0–100)</label>
            <input type="number" min="0" max="100" value={diff} onChange={e => setDiff(e.target.value)} placeholder="0" className={inputCls()} />
          </div>
        </div>
        <button
          onClick={() => text.trim() && onCreate(text.trim(), type, Number(vol) || 0, Number(diff) || 0)}
          disabled={!text.trim()}
          className="w-full bg-violet-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 transition-colors"
        >
          Adicionar Keyword
        </button>
      </div>
    </Modal>
  );
}

// ── CSV Upload Modal ─────────────────────────────────────────────────────────

interface ParsedRow {
  text: string;
  type: 'primary' | 'secondary';
  search_volume: number;
  difficulty: number;
}

const SAMPLE_CSV = `keyword,tipo,volume,dificuldade
marketing digital,primary,5000,45
estratégia de marketing,secondary,3200,38
marketing para pequenas empresas,secondary,1800,42
marketing online,secondary,2500,35
agência de marketing,secondary,1200,55
seo,primary,8000,68
otimização para mecanismos de busca,secondary,4500,52
posicionamento no google,secondary,2800,48
seo local,secondary,1900,32
link building,secondary,2100,58
criação de conteúdo,primary,6200,41
blog para empresas,secondary,2900,36
redação seo,secondary,1500,44
marketing de conteúdo,secondary,3800,40
copywriting,secondary,2200,39
redes sociais,primary,12000,72
instagram para negócios,secondary,5500,60
facebook ads,secondary,4800,65
gestão de redes sociais,secondary,3100,55
tráfego pago,secondary,4200,62
`;

function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'modelo-keywords-silo.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(raw: string): ParsedRow[] {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const sep = lines[0].includes(';') ? ';' : ',';
  const firstLower = lines[0].toLowerCase();
  const isHeader = /keyword|palavra|type|tipo|volume|dificul/.test(firstLower);
  const data = isHeader ? lines.slice(1) : lines;

  return data.map(line => {
    const parts = line.split(sep).map(p => p.trim().replace(/^["']|["']$/g, ''));
    const text = parts[0] ?? '';
    const typeRaw = (parts[1] ?? '').toLowerCase();
    const type: 'primary' | 'secondary' =
      typeRaw === 'primary' || typeRaw === 'principal' || typeRaw === 'p' || typeRaw === 'pri'
        ? 'primary' : 'secondary';
    const search_volume = Math.max(0, parseInt(parts[2] ?? '') || 0);
    const difficulty    = Math.min(100, Math.max(0, parseInt(parts[3] ?? '') || 0));
    return { text, type, search_volume, difficulty };
  }).filter(r => r.text.length > 0 && r.text.length <= 500);
}

function CsvUploadModal({ onClose, onImport }: {
  onClose: () => void;
  onImport: (rows: ParsedRow[]) => Promise<void>;
}) {
  const [rows, setRows]       = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showAll, setShowAll] = useState(false);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => setRows(parseCSV(e.target?.result as string ?? ''));
    reader.readAsText(file, 'utf-8');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handlePaste(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setRows(parseCSV(e.target.value));
  }

  function toggleType(idx: number) {
    setRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, type: r.type === 'primary' ? 'secondary' : 'primary' } : r
    ));
  }

  async function doImport() {
    setLoading(true);
    await onImport(rows);
    setLoading(false);
  }

  const preview = showAll ? rows : rows.slice(0, 8);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" />
            <h3 className="font-semibold text-slate-800">Importar CSV</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Format hint + download sample */}
          <div className="bg-violet-50 border border-violet-100 rounded-lg px-4 py-3 text-xs text-violet-700 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold">Formato aceito (CSV ou texto):</p>
                <p className="font-mono">keyword, tipo, volume, dificuldade</p>
                <p className="font-mono text-violet-500">marketing digital, primary, 5000, 45</p>
                <p className="font-mono text-violet-500">seo local, secondary, 2000, 30</p>
                <p className="mt-1 text-violet-600">• Separador: vírgula <strong>,</strong> ou ponto-e-vírgula <strong>;</strong></p>
                <p>• Tipo: <strong>primary / p / principal</strong> → Principal; qualquer outro → Secundária</p>
                <p>• Volume e dificuldade são opcionais. Uma keyword por linha também funciona.</p>
              </div>
              <button
                onClick={downloadSampleCSV}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white border border-violet-200 text-violet-700 rounded-lg text-xs font-semibold hover:bg-violet-100 transition-colors whitespace-nowrap shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar modelo
              </button>
            </div>
          </div>

          {/* Drop zone */}
          {rows.length === 0 && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                dragOver ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300',
              )}
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Arraste o arquivo CSV ou clique para selecionar</p>
              <p className="text-xs text-slate-400 mt-1">.csv, .txt — UTF-8</p>
              <input
                id="csv-file-input" type="file" accept=".csv,.txt" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}

          {/* Textarea paste */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              {rows.length > 0 ? 'Editar / colar novamente:' : 'Ou cole o conteúdo diretamente:'}
            </label>
            <textarea
              rows={4}
              onChange={handlePaste}
              placeholder={"marketing digital, primary, 5000, 45\nseo local, secondary, 2000, 30\n..."}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none"
            />
          </div>

          {/* Preview */}
          {rows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600">
                  Preview — {rows.length} keyword{rows.length !== 1 ? 's' : ''} detectada{rows.length !== 1 ? 's' : ''}
                </p>
                <span className="text-xs text-slate-400">
                  {rows.filter(r => r.type === 'primary').length} principal · {rows.filter(r => r.type === 'secondary').length} secundária
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">#</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Keyword</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Tipo</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Volume</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">KD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-800 max-w-[200px] truncate">{r.text}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => toggleType(i)}
                            className={cn(
                              'px-2 py-0.5 rounded-full font-bold text-[10px] transition-colors cursor-pointer',
                              r.type === 'primary'
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-violet-100 text-violet-700 hover:bg-violet-200',
                            )}
                          >
                            {r.type === 'primary' ? '⭐ Principal' : '# Sec.'}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{r.search_volume > 0 ? r.search_volume.toLocaleString() : '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{r.difficulty > 0 ? r.difficulty : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 8 && (
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 border-t border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showAll && 'rotate-180')} />
                    {showAll ? 'Mostrar menos' : `Ver mais ${rows.length - 8} keywords`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors">
            Cancelar
          </button>
          <button
            onClick={doImport}
            disabled={rows.length === 0 || loading}
            className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importar {rows.length > 0 ? `${rows.length} keyword${rows.length !== 1 ? 's' : ''}` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={cn(
      'fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white z-[100] animate-pulse',
      type === 'success' ? 'bg-green-600' : 'bg-red-500',
    )}>
      {msg}
    </div>
  );
}

// ── SiloBoard (main) ─────────────────────────────────────────────────────────

export default function SiloBoard({ initialSilos, initialKeywords }: Props) {
  const [silos, setSilos] = useState<Silo[]>(initialSilos);
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords);
  const [activeKw, setActiveKw] = useState<Keyword | null>(null);
  const [modal, setModal] = useState<'silo' | 'keyword' | 'csv' | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function notify(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  // Derived
  const poolKws = useMemo(() => keywords.filter(k => !k.silo_id), [keywords]);
  const kwsBySilo = useMemo(() => {
    const m: Record<number, Keyword[]> = {};
    silos.forEach(s => { m[s.id] = []; });
    keywords.filter(k => k.silo_id).forEach(k => { if (m[k.silo_id!]) m[k.silo_id!].push(k); });
    return m;
  }, [keywords, silos]);

  const avgScore = useMemo(() => {
    if (!silos.length) return 0;
    const total = silos.reduce((acc, s) => acc + score(kwsBySilo[s.id] ?? []).s, 0);
    return Math.round(total / silos.length);
  }, [silos, kwsBySilo]);

  // ── Keyword mutations ────────────────────────────────────────────────────

  function updateKwLocal(id: number, patch: Partial<Keyword>) {
    setKeywords(prev => prev.map(k => k.id === id ? { ...k, ...patch } : k));
  }

  async function applyKwPatch(id: number, patch: Partial<Keyword>) {
    updateKwLocal(id, patch);
    await api(`/api/keywords/${id}`, 'PATCH', patch);
  }

  async function handleDeleteKw(id: number) {
    setKeywords(prev => prev.filter(k => k.id !== id));
    await api(`/api/keywords/${id}`, 'DELETE');
    notify('Keyword removida');
  }

  async function handleToggleType(id: number) {
    const kw = keywords.find(k => k.id === id);
    if (!kw || !kw.silo_id) return;
    const newType = kw.type === 'primary' ? 'secondary' : 'primary';
    if (newType === 'primary') {
      const existing = keywords.find(k => k.silo_id === kw.silo_id && k.type === 'primary' && k.id !== id);
      if (existing) await applyKwPatch(existing.id, { type: 'secondary' });
    }
    await applyKwPatch(id, { type: newType });
  }

  async function handleRemoveFromSilo(id: number) {
    await applyKwPatch(id, { silo_id: null });
  }

  async function handleToggleStatus(id: number) {
    const kw = keywords.find(k => k.id === id);
    if (!kw) return;
    const newStatus = kw.status === 'feito' ? 'pendente' : 'feito';
    await applyKwPatch(id, { status: newStatus });
  }

  async function handleAddKeyword(text: string, type: 'primary' | 'secondary', vol: number, diff: number) {
    const data = await api('/api/keywords', 'POST', { text, type, silo_id: null, search_volume: vol, difficulty: diff });
    if (data.id) {
      setKeywords(prev => [...prev, data as Keyword]);
      notify('Keyword adicionada!');
    }
    setModal(null);
  }

  async function handleBulkImport(rows: ParsedRow[]) {
    const res = await api('/api/keywords/bulk', 'POST', { keywords: rows });
    if (res.keywords) {
      setKeywords(prev => [...prev, ...(res.keywords as Keyword[])]);
      notify(`${res.created} keyword${res.created !== 1 ? 's' : ''} importada${res.created !== 1 ? 's' : ''}!`);
      setModal(null);
    } else {
      notify(res.error ?? 'Erro ao importar', 'error');
    }
  }

  // ── Silo mutations ───────────────────────────────────────────────────────

  async function handleAddSilo(name: string, desc: string) {
    const data = await api('/api/silos', 'POST', { name, description: desc });
    if (data.id) {
      setSilos(prev => [...prev, data as Silo]);
      notify('SILO criado!');
    }
    setModal(null);
  }

  async function handleDeleteSilo(id: number) {
    setSilos(prev => prev.filter(s => s.id !== id));
    setKeywords(prev => prev.map(k => k.silo_id === id ? { ...k, silo_id: null } : k));
    await api(`/api/silos/${id}`, 'DELETE');
    notify('SILO excluído');
  }

  async function handleRenameSilo(id: number, name: string) {
    setSilos(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    await api(`/api/silos/${id}`, 'PATCH', { name, description: silos.find(s => s.id === id)?.description ?? '' });
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  function handleDragStart({ active }: DragStartEvent) {
    const kw = keywords.find(k => k.id === active.id);
    setActiveKw(kw ?? null);
  }

  const handleDragEnd = useCallback(async ({ active, over }: DragEndEvent) => {
    setActiveKw(null);
    if (!over) return;

    const kwId = active.id as number;
    const target = over.id as string;
    const kw = keywords.find(k => k.id === kwId);
    if (!kw) return;

    if (target === 'pool') {
      if (kw.silo_id !== null) await applyKwPatch(kwId, { silo_id: null });
      return;
    }

    if (target.startsWith('pri-')) {
      const siloId = parseInt(target.replace('pri-', ''));
      const existing = keywords.find(k => k.silo_id === siloId && k.type === 'primary' && k.id !== kwId);
      if (existing) await applyKwPatch(existing.id, { type: 'secondary' });
      await applyKwPatch(kwId, { silo_id: siloId, type: 'primary' });
      return;
    }

    if (target.startsWith('sec-')) {
      const siloId = parseInt(target.replace('sec-', ''));
      await applyKwPatch(kwId, { silo_id: siloId, type: 'secondary' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywords]);

  const cardHandlers = { onDelete: handleDeleteKw, onToggleType: handleToggleType, onRemoveFromSilo: handleRemoveFromSilo, onToggleStatus: handleToggleStatus };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">

        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Meus SILOs</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {silos.length} silo{silos.length !== 1 ? 's' : ''} · {keywords.length} keyword{keywords.length !== 1 ? 's' : ''} · Score médio: <span className="font-semibold text-violet-600">{avgScore}</span>
              {keywords.length > 0 && (
                <> · <span className="font-semibold text-green-600">{keywords.filter(k => k.status === 'feito').length}</span>/{keywords.length} artigos feitos</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setModal('csv')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <Upload className="w-4 h-4" /> Importar CSV
            </button>
            <button onClick={() => setModal('keyword')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Nova Keyword
            </button>
            <button onClick={() => setModal('silo')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Novo SILO
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-6 h-full">
            {silos.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center gap-3">
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center">
                  <Layers className="w-8 h-8 text-violet-500" />
                </div>
                <p className="text-lg font-semibold text-slate-700">Nenhum SILO ainda</p>
                <p className="text-sm text-slate-400">Crie seu primeiro SILO para organizar suas keywords</p>
                <button onClick={() => setModal('silo')}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors mt-2">
                  <Plus className="w-4 h-4" /> Criar primeiro SILO
                </button>
              </div>
            ) : (
              silos.map(silo => (
                <SiloColumn
                  key={silo.id}
                  silo={silo}
                  kws={kwsBySilo[silo.id] ?? []}
                  onDeleteSilo={handleDeleteSilo}
                  onRenameSilo={handleRenameSilo}
                  onDeleteKw={handleDeleteKw}
                  onToggleType={handleToggleType}
                  onRemoveFromSilo={handleRemoveFromSilo}
                  onToggleStatus={handleToggleStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* Keyword pool */}
        <KeywordPool kws={poolKws} onDelete={handleDeleteKw} onToggleType={handleToggleType} onRemoveFromSilo={handleRemoveFromSilo} onToggleStatus={handleToggleStatus} />
      </div>

      {/* DnD overlay */}
      <DragOverlay>
        {activeKw && <KeywordCard kw={activeKw} isOverlay onDelete={() => {}} onToggleType={() => {}} onRemoveFromSilo={() => {}} />}
      </DragOverlay>

      {/* Modals */}
      {modal === 'silo'    && <AddSiloModal    onClose={() => setModal(null)} onCreate={handleAddSilo}       />}
      {modal === 'keyword' && <AddKeywordModal onClose={() => setModal(null)} onCreate={handleAddKeyword}   />}
      {modal === 'csv'     && <CsvUploadModal  onClose={() => setModal(null)} onImport={handleBulkImport}   />}

      {/* Toast */}
      {toast && <Toast {...toast} />}
    </DndContext>
  );
}
