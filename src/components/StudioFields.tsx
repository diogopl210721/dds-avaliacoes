import { ReactNode, useState } from 'react';
import { ChevronDown, ImagePlus, Upload, Trash2, Plus, ArrowUp, ArrowDown, Check } from 'lucide-react';

// Peças do formulário do estúdio.
export function Field({ label, value, onChange, placeholder = '', hint, max = 300, type = 'text', id }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; max?: number; type?: string; id?: string }) {
  return <label className="sf-field">{label}<input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={max} autoComplete="off" />{hint && <small>{hint}</small>}</label>;
}

export function Area({ label, value, onChange, placeholder = '', hint, max = 1800, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; max?: number; rows?: number }) {
  return <label className="sf-field">{label}<textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={max} />{hint && <small>{hint}</small>}</label>;
}

export function PhotoBox({ title, url, disabled, onFile, onRemove, contain = false }: { title: string; url: string; disabled: boolean; onFile: (f: File) => void; onRemove: () => void; contain?: boolean }) {
  return <div className="studio-photo-box"><h3>{title}</h3><label>{url ? <img src={url} alt={title} style={contain ? { objectFit: 'contain', background: '#fff' } : undefined} /> : <div><ImagePlus size={27} /><span>Escolher imagem</span></div>}
    <input aria-label={title} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value = ''; }} />
    <span className="studio-photo-edit"><Upload size={15} />{url ? 'Trocar foto' : 'Enviar foto'}</span></label>
    {url && <button className="studio-photo-remove" onClick={onRemove} aria-label={`Remover ${title}`}><Trash2 size={15} /></button>}</div>;
}

// Seção recolhível do passo "Conteúdo".
export function Section({ id, icon, title, hint, filled, open, onToggle, children }: { id: string; icon: ReactNode; title: string; hint: string; filled: boolean; open: boolean; onToggle: (id: string) => void; children: ReactNode }) {
  return <section className={`sf-section${open ? ' is-open' : ''}`}>
    <button className="sf-section-head" onClick={() => onToggle(id)} aria-expanded={open} aria-controls={`sf-${id}`}>
      <i>{icon}</i><span><strong>{title}</strong><small>{hint}</small></span>
      {filled && <em aria-label="Preenchido"><Check size={14} /></em>}<ChevronDown size={20} />
    </button>
    {open && <div className="sf-section-body" id={`sf-${id}`}>{children}</div>}
  </section>;
}

// Lista editável (benefícios, números, depoimentos, perguntas…).
export function ListEditor<T extends { id: string }>({ items, max, addLabel, empty, onChange, make, render }: {
  items: T[]; max: number; addLabel: string; empty: string; onChange: (items: T[]) => void; make: () => T; render: (item: T, set: (patch: Partial<T>) => void, index: number) => ReactNode;
}) {
  const move = (i: number, d: number) => { const next = [...items]; const [x] = next.splice(i, 1); next.splice(i + d, 0, x); onChange(next); };
  return <div className="sf-list">
    {items.length === 0 && <p className="sf-empty">{empty}</p>}
    {items.map((item, i) => <div className="sf-item" key={item.id}>
      <div className="sf-item-fields">{render(item, patch => onChange(items.map(x => x.id === item.id ? { ...x, ...patch } : x)), i)}</div>
      <div className="sf-item-tools">
        <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir"><ArrowUp size={16} /></button>
        <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Descer"><ArrowDown size={16} /></button>
        <button onClick={() => onChange(items.filter(x => x.id !== item.id))} aria-label="Remover"><Trash2 size={16} /></button>
      </div>
    </div>)}
    {items.length < max && <button className="studio-secondary sf-add" onClick={() => onChange([...items, make()])}><Plus size={16} /> {addLabel}</button>}
  </div>;
}

export function Chips({ options, value, onChange }: { options: { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return <div className="sf-chips">{options.map(o => <button key={o.id} aria-pressed={value.includes(o.id)} onClick={() => onChange(value.includes(o.id) ? value.filter(x => x !== o.id) : [...value, o.id])}>{value.includes(o.id) && <Check size={14} />}{o.label}</button>)}</div>;
}

export function useOpen(initial: string) {
  const [open, setOpen] = useState(initial);
  return { open, toggle: (id: string) => setOpen(old => old === id ? '' : id), setOpen };
}
