import { useState, useMemo, useRef, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type QuoteStatus = "Cotizado" | "Alquilado" | "Cancelado" | "Completado";

interface Contact {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
}

interface QuoteLine {
  id: string;
  category: string;
  rateWeek: number;
  rateMonth: number;
  rateDay: number;
  quantity: number;
  discount: number; // percentage 0-100
  weeks: number;
}

interface Quote {
  id: string;
  number: string;
  contactId: string;
  employee: string;
  createdAt: string;
  startDate: string;
  endDate: string;
  status: QuoteStatus;
  lines: QuoteLine[];
  notes: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const CONTACTS: Contact[] = [
  { id: "ct1", name: "Marco Vega", company: "Constructora Vega S.A.", phone: "+56 9 8812 3456", email: "m.vega@cvega.cl" },
  { id: "ct2", name: "Sofía Ramos", company: "Inmobiliaria del Norte", phone: "+56 9 7734 9901", email: "s.ramos@idn.cl" },
  { id: "ct3", name: "Roberto Cantera", company: "Ingeniería Cantera Ltda.", phone: "+56 9 6612 7743", email: "r.cantera@cantera.cl" },
  { id: "ct4", name: "Ana Fuentes", company: "Obras Civiles del Sur", phone: "+56 9 9934 2210", email: "a.fuentes@ocdsur.cl" },
  { id: "ct5", name: "Luis Merino", company: "Grupo Constructivo Merino", phone: "+56 9 5521 8867", email: "l.merino@gcm.cl" },
  { id: "ct6", name: "Clara Ibáñez", company: "Pavimentos y Rellenos S.A.", phone: "+56 9 4490 3312", email: "c.ibanez@pyrsa.cl" },
  { id: "ct7", name: "Héctor Pinto", company: "—", phone: "+56 9 3302 5590", email: "hpinto@gmail.com" },
];

const EMPLOYEES = ["Juan López", "Carla Muñoz", "Pedro Soto", "Valentina Ríos"];

const CATEGORY_RATES: Record<string, { week: number; month: number; day: number }> = {
  Andamio:    { week: 85000,  month: 280000,  day: 15000 },
  Plataforma: { week: 220000, month: 750000,  day: 45000 },
  Rodo:       { week: 60000,  month: 195000,  day: 12000 },
  Puntal:     { week: 18000,  month: 58000,   day: 4000  },
  Escalera:   { week: 22000,  month: 70000,   day: 5000  },
};

const makeLines = (defs: { cat: string; qty: number; disc: number; weeks: number }[]): QuoteLine[] =>
  defs.map((d, i) => ({
    id: `l${i}`,
    category: d.cat,
    rateWeek: CATEGORY_RATES[d.cat].week,
    rateMonth: CATEGORY_RATES[d.cat].month,
    rateDay: CATEGORY_RATES[d.cat].day,
    quantity: d.qty,
    discount: d.disc,
    weeks: d.weeks,
  }));

const QUOTES_INIT: Quote[] = [
  { id: "q1", number: "COT-0041", contactId: "ct1", employee: "Juan López",     createdAt: "2026-08-01", startDate: "2026-08-15", endDate: "2026-09-12", status: "Alquilado",  lines: makeLines([{ cat: "Andamio", qty: 4, disc: 5, weeks: 4 }, { cat: "Puntal", qty: 8, disc: 0, weeks: 4 }]), notes: "Requiere entrega en obra antes de las 8 AM." },
  { id: "q2", number: "COT-0042", contactId: "ct2", employee: "Carla Muñoz",    createdAt: "2026-08-05", startDate: "2026-08-20", endDate: "2026-09-03", status: "Cotizado",   lines: makeLines([{ cat: "Plataforma", qty: 1, disc: 0, weeks: 2 }]), notes: "" },
  { id: "q3", number: "COT-0043", contactId: "ct3", employee: "Juan López",     createdAt: "2026-08-07", startDate: "2026-09-01", endDate: "2026-09-29", status: "Cotizado",   lines: makeLines([{ cat: "Andamio", qty: 6, disc: 10, weeks: 4 }, { cat: "Rodo", qty: 2, disc: 5, weeks: 4 }]), notes: "Pide cotización alternativa con andamio de mayor altura." },
  { id: "q4", number: "COT-0044", contactId: "ct4", employee: "Pedro Soto",     createdAt: "2026-08-10", startDate: "2026-08-25", endDate: "2026-09-08", status: "Cancelado",  lines: makeLines([{ cat: "Puntal", qty: 12, disc: 0, weeks: 2 }]), notes: "Cliente canceló por ajuste de presupuesto." },
  { id: "q5", number: "COT-0045", contactId: "ct5", employee: "Valentina Ríos", createdAt: "2026-08-12", startDate: "2026-08-28", endDate: "2026-10-09", status: "Cotizado",   lines: makeLines([{ cat: "Andamio", qty: 8, disc: 15, weeks: 6 }, { cat: "Plataforma", qty: 2, disc: 10, weeks: 6 }]), notes: "" },
  { id: "q6", number: "COT-0038", contactId: "ct6", employee: "Carla Muñoz",    createdAt: "2026-07-18", startDate: "2026-07-25", endDate: "2026-08-22", status: "Completado", lines: makeLines([{ cat: "Rodo", qty: 4, disc: 0, weeks: 4 }, { cat: "Escalera", qty: 2, disc: 0, weeks: 4 }]), notes: "" },
  { id: "q7", number: "COT-0039", contactId: "ct7", employee: "Pedro Soto",     createdAt: "2026-07-22", startDate: "2026-08-01", endDate: "2026-08-15", status: "Completado", lines: makeLines([{ cat: "Plataforma", qty: 1, disc: 5, weeks: 2 }]), notes: "Particular, sin empresa." },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");
const fmtPct = (n: number) => n === 0 ? "—" : `${n}%`;

function lineSubtotal(line: QuoteLine): number {
  const gross = line.rateWeek * line.quantity * line.weeks;
  return gross * (1 - line.discount / 100);
}

function quoteTotal(lines: QuoteLine[]) {
  return lines.reduce((sum, l) => sum + lineSubtotal(l), 0);
}

function contact(id: string) {
  return CONTACTS.find((c) => c.id === id);
}

const STATUS_CFG: Record<QuoteStatus, { cls: string; dot: string; text: string }> = {
  Cotizado:   { cls: "bg-blue-100 text-blue-700",    dot: "bg-blue-500",    text: "Cotizado" },
  Alquilado:  { cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", text: "Alquilado" },
  Cancelado:  { cls: "bg-red-100 text-red-700",      dot: "bg-red-500",     text: "Cancelado" },
  Completado: { cls: "bg-gray-100 text-gray-600",    dot: "bg-gray-400",    text: "Completado" },
};

function StatusBadge({ status }: { status: QuoteStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.text}
    </span>
  );
}

// ── Shared UI ──────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, size = "lg" }: {
  title: string; onClose: () => void; children: React.ReactNode; size?: "lg" | "xl" | "full";
}) {
  const sizeMap = { lg: "max-w-xl", xl: "max-w-3xl", full: "max-w-5xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 md:p-6 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeMap[size]} my-4`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-[#102c4d] font-bold text-base" style={{ fontFamily: "Outfit, sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#102c4d] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#102c4d] focus:ring-2 focus:ring-[#102c4d]/10 transition-all bg-white";
const selectCls = inputCls;

// Searchable contact dropdown
function ContactSelect({
  value, onChange, contacts, onCreateNew,
}: {
  value: string; onChange: (id: string) => void; contacts: Contact[]; onCreateNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = contacts.find((c) => c.id === value);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filtered = contacts.filter(
    (c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.company.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputCls} text-left flex items-center justify-between`}
      >
        {selected ? (
          <span>
            <span className="font-medium">{selected.name}</span>
            <span className="text-gray-400 ml-2 text-xs">{selected.company}</span>
          </span>
        ) : (
          <span className="text-gray-400">Seleccionar contacto…</span>
        )}
        <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}>
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
              </span>
              <input
                autoFocus
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#102c4d]"
                placeholder="Buscar por nombre o empresa…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setOpen(false); setQ(""); }}
                className="w-full text-left px-4 py-3 hover:bg-[#102c4d]/5 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">{c.name}</div>
                <div className="text-xs text-gray-400">{c.company} · {c.phone}</div>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center py-6 text-sm text-gray-400">Sin resultados</p>}
          </div>
          <div className="p-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setOpen(false); onCreateNew(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#102c4d] hover:bg-[#ffbc07]/20 rounded-lg transition-colors"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#ffbc07]"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Crear nuevo contacto rápido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick contact creation
function QuickContactModal({ onClose, onCreate }: {
  onClose: () => void; onCreate: (c: Contact) => void;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  return (
    <Modal title="Crear Contacto Rápido" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nombre completo"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre Apellido" autoFocus /></Field>
        <Field label="Empresa (opcional)"><input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nombre de la empresa" /></Field>
        <Field label="Teléfono"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 xxxx xxxx" /></Field>
        <Field label="Email"><input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.cl" /></Field>
      </div>
      <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
        <button
          onClick={() => {
            if (!name) return;
            onCreate({ id: `ct${Date.now()}`, name, company: company || "—", phone, email });
          }}
          className="px-5 py-2 text-sm font-bold bg-[#102c4d] text-white rounded-lg hover:bg-[#1a3d6b] transition-colors"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Guardar contacto
        </button>
      </div>
    </Modal>
  );
}

// ── Wizard ─────────────────────────────────────────────────────────────────────

interface WizardProps {
  onClose: () => void;
  onSave: (q: Quote) => void;
  contacts: Contact[];
  onAddContact: (c: Contact) => void;
  initial?: Quote;
}

function newLine(id: string): QuoteLine {
  return { id, category: "Andamio", rateWeek: CATEGORY_RATES["Andamio"].week, rateMonth: CATEGORY_RATES["Andamio"].month, rateDay: CATEGORY_RATES["Andamio"].day, quantity: 1, discount: 0, weeks: 1 };
}

function QuoteWizard({ onClose, onSave, contacts, onAddContact, initial }: WizardProps) {
  const [step, setStep] = useState(1);
  const [showContactModal, setShowContactModal] = useState(false);

  // Step 1
  const [contactId, setContactId] = useState(initial?.contactId ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [employee, setEmployee] = useState(initial?.employee ?? EMPLOYEES[0]);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // Step 2
  const [lines, setLines] = useState<QuoteLine[]>(initial?.lines ?? [newLine("l0")]);

  const addLine = () => setLines((prev) => [...prev, newLine(`l${Date.now()}`)]);
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));
  const updateLine = (id: string, key: keyof QuoteLine, val: number | string) =>
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (key === "category") {
          const r = CATEGORY_RATES[val as string] ?? CATEGORY_RATES["Andamio"];
          return { ...l, category: val as string, rateWeek: r.week, rateMonth: r.month, rateDay: r.day };
        }
        return { ...l, [key]: val };
      })
    );

  const total = quoteTotal(lines);
  const step1Valid = contactId && startDate && endDate;

  // Days between dates for display
  const days = startDate && endDate
    ? Math.max(0, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;

  const handleSave = () => {
    const q: Quote = {
      id: initial?.id ?? `q${Date.now()}`,
      number: initial?.number ?? `COT-${String(Math.floor(Math.random() * 900 + 50)).padStart(4, "0")}`,
      contactId,
      employee,
      createdAt: initial?.createdAt ?? new Date().toISOString().slice(0, 10),
      startDate,
      endDate,
      status: initial?.status ?? "Cotizado",
      lines,
      notes,
    };
    onSave(q);
  };

  return (
    <>
      <Modal title={initial ? `Editar ${initial.number}` : "Nueva Cotización"} onClose={onClose} size="full">
        {/* Progress stepper */}
        <div className="flex items-center gap-0 mb-6">
          {[{ n: 1, label: "Datos generales" }, { n: 2, label: "Líneas de detalle" }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-0 flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s.n ? "bg-[#102c4d] text-white" : "bg-gray-200 text-gray-400"}`}
                  style={{ fontFamily: "Outfit, sans-serif" }}>
                  {step > s.n ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  ) : s.n}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${step === s.n ? "text-[#102c4d]" : "text-gray-400"}`} style={{ fontFamily: "Outfit, sans-serif" }}>{s.label}</span>
              </div>
              {i < 1 && <div className={`flex-1 h-0.5 mx-3 ${step > 1 ? "bg-[#102c4d]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="space-y-5">
            <Field label="Contacto">
              <ContactSelect
                value={contactId}
                onChange={setContactId}
                contacts={contacts}
                onCreateNew={() => setShowContactModal(true)}
              />
            </Field>

            {contactId && (() => {
              const ct = contacts.find((c) => c.id === contactId)!;
              return (
                <div className="flex items-center gap-3 bg-[#102c4d]/5 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#102c4d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ fontFamily: "Outfit, sans-serif" }}>
                    {ct.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-[#102c4d]">{ct.name}</div>
                    <div className="text-gray-500 text-xs">{ct.company} · {ct.email} · {ct.phone}</div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fecha inicio alquiler">
                <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="Fecha fin alquiler">
                <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
              </Field>
            </div>

            {days > 0 && (
              <div className="flex items-center gap-2 text-sm text-[#102c4d] bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-400 flex-shrink-0"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                Duración: <strong>{days} días</strong> ({Math.ceil(days / 7)} semanas aproximadas)
              </div>
            )}

            <Field label="Empleado responsable">
              <select className={selectCls} value={employee} onChange={(e) => setEmployee(e.target.value)}>
                {EMPLOYEES.map((e) => <option key={e}>{e}</option>)}
              </select>
            </Field>

            <Field label="Notas / Observaciones (opcional)">
              <textarea className={inputCls + " resize-none"} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones especiales, observaciones…" />
            </Field>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Summary chip */}
            {contactId && (
              <div className="flex flex-wrap items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-600">
                <span><strong className="text-gray-900">{contacts.find((c) => c.id === contactId)?.name}</strong></span>
                <span className="text-gray-300">|</span>
                <span>{startDate} → {endDate}</span>
                <span className="text-gray-300">|</span>
                <span>{employee}</span>
              </div>
            )}

            {/* Lines — desktop */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Categoría", "Tarifa/semana", "Cantidad", "Semanas", "Descuento %", "Subtotal", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line) => {
                    const sub = lineSubtotal(line);
                    return (
                      <tr key={line.id} className="hover:bg-gray-50/30">
                        <td className="px-3 py-2.5 min-w-[130px]">
                          <select
                            className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[#102c4d] w-full"
                            value={line.category}
                            onChange={(e) => updateLine(line.id, "category", e.target.value)}
                          >
                            {Object.keys(CATEGORY_RATES).map((c) => <option key={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1 bg-[#102c4d]/5 rounded-lg px-3 py-2 min-w-[100px]">
                            <span className="text-xs font-bold text-[#102c4d]">{fmt(line.rateWeek)}</span>
                            <span className="text-[10px] text-gray-400 ml-1">/ sem</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 min-w-[70px]">
                          <input
                            type="number" min={1}
                            className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-center w-16 focus:outline-none focus:border-[#102c4d]"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.id, "quantity", Math.max(1, +e.target.value))}
                          />
                        </td>
                        <td className="px-3 py-2.5 min-w-[70px]">
                          <input
                            type="number" min={1}
                            className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-center w-16 focus:outline-none focus:border-[#102c4d]"
                            value={line.weeks}
                            onChange={(e) => updateLine(line.id, "weeks", Math.max(1, +e.target.value))}
                          />
                        </td>
                        <td className="px-3 py-2.5 min-w-[80px]">
                          <div className="flex items-center gap-1">
                            <input
                              type="number" min={0} max={100}
                              className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-center w-16 focus:outline-none focus:border-[#102c4d]"
                              value={line.discount}
                              onChange={(e) => updateLine(line.id, "discount", Math.min(100, Math.max(0, +e.target.value)))}
                            />
                            <span className="text-gray-400 text-xs">%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 min-w-[110px]">
                          <div className="font-bold text-[#102c4d] text-sm">{fmt(sub)}</div>
                          {line.discount > 0 && (
                            <div className="text-[10px] text-gray-400 line-through">{fmt(line.rateWeek * line.quantity * line.weeks)}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => removeLine(line.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                            disabled={lines.length === 1}
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Lines — mobile */}
            <div className="md:hidden space-y-3">
              {lines.map((line, idx) => {
                const sub = lineSubtotal(line);
                return (
                  <div key={line.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Línea {idx + 1}</span>
                      <button onClick={() => removeLine(line.id)} disabled={lines.length === 1} className="p-1.5 rounded text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                    <Field label="Categoría">
                      <select className={selectCls} value={line.category} onChange={(e) => updateLine(line.id, "category", e.target.value)}>
                        {Object.keys(CATEGORY_RATES).map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <div className="flex items-center gap-2 bg-[#102c4d]/5 rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-500">Tarifa:</span>
                      <span className="text-sm font-bold text-[#102c4d]">{fmt(line.rateWeek)}/semana</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Cantidad">
                        <input type="number" min={1} className={inputCls + " text-center"} value={line.quantity} onChange={(e) => updateLine(line.id, "quantity", Math.max(1, +e.target.value))} />
                      </Field>
                      <Field label="Semanas">
                        <input type="number" min={1} className={inputCls + " text-center"} value={line.weeks} onChange={(e) => updateLine(line.id, "weeks", Math.max(1, +e.target.value))} />
                      </Field>
                      <Field label="Desc. %">
                        <input type="number" min={0} max={100} className={inputCls + " text-center"} value={line.discount} onChange={(e) => updateLine(line.id, "discount", Math.min(100, Math.max(0, +e.target.value)))} />
                      </Field>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Subtotal</span>
                      <div className="text-right">
                        <div className="font-bold text-[#102c4d]">{fmt(sub)}</div>
                        {line.discount > 0 && <div className="text-[10px] text-gray-400 line-through">{fmt(line.rateWeek * line.quantity * line.weeks)}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add line */}
            <button
              onClick={addLine}
              className="flex items-center gap-2 text-sm font-semibold text-[#102c4d] border-2 border-dashed border-gray-300 hover:border-[#102c4d] rounded-xl px-4 py-3 w-full justify-center transition-colors hover:bg-[#102c4d]/5"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#ffbc07]"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Agregar línea
            </button>

            {/* Total */}
            <div className="bg-[#102c4d] rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Total cotización</div>
                <div className="text-white text-2xl font-bold mt-0.5" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(total)}</div>
              </div>
              <div className="text-right">
                <div className="text-blue-300 text-xs">{lines.length} línea(s)</div>
                <div className="text-blue-300 text-xs mt-0.5">{lines.reduce((a, l) => a + l.quantity, 0)} equipos totales</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button onClick={step === 1 ? onClose : () => setStep(1)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            {step === 2 && <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>}
            {step === 1 ? "Cancelar" : "Paso anterior"}
          </button>
          {step === 1 ? (
            <button
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-[#102c4d] text-white rounded-lg hover:bg-[#1a3d6b] disabled:opacity-40 transition-colors"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Continuar
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-[#ffbc07] text-[#102c4d] rounded-lg hover:bg-[#e5a800] transition-colors shadow-md"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              {initial ? "Guardar cambios" : "Crear cotización"}
            </button>
          )}
        </div>
      </Modal>

      {showContactModal && (
        <QuickContactModal
          onClose={() => setShowContactModal(false)}
          onCreate={(c) => { onAddContact(c); setContactId(c.id); setShowContactModal(false); }}
        />
      )}
    </>
  );
}

// ── Quote Detail ───────────────────────────────────────────────────────────────

function QuoteDetail({ quote, contacts, onBack, onEdit, onCancel, onConvert }: {
  quote: Quote;
  contacts: Contact[];
  onBack: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onConvert: () => void;
}) {
  const ct = contact(quote.contactId) ?? contacts.find((c) => c.id === quote.contactId);
  const total = quoteTotal(quote.lines);
  const isCancelable = quote.status === "Cotizado";
  const isConvertible = quote.status === "Cotizado";

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <button onClick={onBack} className="self-start p-2 rounded-lg hover:bg-gray-200 text-[#102c4d] transition-colors flex-shrink-0">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-[#102c4d] font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>{quote.number}</h2>
            <StatusBadge status={quote.status} />
          </div>
          <p className="text-gray-400 text-sm mt-0.5">Creado el {quote.createdAt} · {quote.employee}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 self-start">
          {isCancelable && (
            <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              Cancelar
            </button>
          )}
          <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#102c4d] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
            Editar
          </button>
          {isConvertible && (
            <button
              onClick={onConvert}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#ffbc07] text-[#102c4d] rounded-lg hover:bg-[#e5a800] transition-colors shadow-sm"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2.038A2 2 0 0115 11.293V10h.5a.5.5 0 00.354-.854l-3-3A.5.5 0 0012.5 6H11V5a1 1 0 00-1-1H3z" /></svg>
              Convertir en Alquiler
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info cards */}
        <div className="space-y-4">
          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contacto</p>
            {ct ? (
              <div className="space-y-1">
                <div className="font-semibold text-gray-900">{ct.name}</div>
                <div className="text-sm text-gray-500">{ct.company}</div>
                <div className="text-xs text-gray-400 mt-2 space-y-0.5">
                  <div>{ct.email}</div>
                  <div>{ct.phone}</div>
                </div>
              </div>
            ) : <p className="text-sm text-gray-400">—</p>}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Período de alquiler</p>
            <div className="space-y-2">
              {[["Inicio", quote.startDate], ["Fin", quote.endDate], ["Duración", (() => {
                const d = Math.round((new Date(quote.endDate).getTime() - new Date(quote.startDate).getTime()) / 86400000);
                return `${d} días (${Math.ceil(d / 7)} semanas)`;
              })()]].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-xs text-gray-400">{k}</span>
                  <span className="text-xs font-semibold text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Observaciones</p>
              <p className="text-sm text-amber-900">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Lines table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[#102c4d] font-bold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Líneas de cotización</h3>
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Categoría", "Tarifa/sem.", "Cant.", "Semanas", "Desc.", "Subtotal"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quote.lines.map((line, i) => {
                    const sub = lineSubtotal(line);
                    return (
                      <tr key={line.id} className="hover:bg-gray-50/30">
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs bg-[#102c4d]/8 text-[#102c4d] px-2.5 py-1 rounded-full font-semibold">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                            {line.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600">{fmt(line.rateWeek)}</td>
                        <td className="px-4 py-3.5 font-semibold text-gray-900">{line.quantity}</td>
                        <td className="px-4 py-3.5 text-gray-600">{line.weeks}</td>
                        <td className="px-4 py-3.5">
                          {line.discount > 0 ? (
                            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{fmtPct(line.discount)}</span>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#102c4d]">{fmt(sub)}</div>
                          {line.discount > 0 && (
                            <div className="text-[10px] text-gray-400 line-through">{fmt(line.rateWeek * line.quantity * line.weeks)}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {quote.lines.map((line) => {
                const sub = lineSubtotal(line);
                return (
                  <div key={line.id} className="px-4 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs bg-[#102c4d]/8 text-[#102c4d] px-2.5 py-1 rounded-full font-semibold">{line.category}</span>
                      {line.discount > 0 && <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">-{line.discount}%</span>}
                    </div>
                    <div className="grid grid-cols-3 text-xs text-gray-500 gap-2">
                      <div><div>Tarifa</div><div className="font-semibold text-gray-800">{fmt(line.rateWeek)}/sem</div></div>
                      <div><div>Cantidad</div><div className="font-semibold text-gray-800">{line.quantity}</div></div>
                      <div><div>Semanas</div><div className="font-semibold text-gray-800">{line.weeks}</div></div>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                      <span className="text-xs text-gray-400">Subtotal</span>
                      <div className="text-right">
                        <div className="font-bold text-[#102c4d]">{fmt(sub)}</div>
                        {line.discount > 0 && <div className="text-[10px] text-gray-400 line-through">{fmt(line.rateWeek * line.quantity * line.weeks)}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total row */}
            <div className="bg-[#102c4d] px-5 py-4 flex items-center justify-between">
              <span className="text-blue-200 text-sm font-semibold" style={{ fontFamily: "Outfit, sans-serif" }}>
                Total — {quote.lines.reduce((a, l) => a + l.quantity, 0)} equipos
              </span>
              <span className="text-white text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(total)}</span>
            </div>
          </div>

          {/* Convert CTA (sticky on mobile) */}
          {isConvertible && (
            <div className="bg-gradient-to-r from-[#ffbc07]/20 to-[#ffbc07]/5 border border-[#ffbc07] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-[#102c4d]" style={{ fontFamily: "Outfit, sans-serif" }}>¿Lista para concretar?</p>
                <p className="text-xs text-gray-600 mt-0.5">Convierte esta cotización en un alquiler formal y asigna los activos físicos.</p>
              </div>
              <button
                onClick={onConvert}
                className="flex-shrink-0 flex items-center gap-2 bg-[#ffbc07] hover:bg-[#e5a800] text-[#102c4d] font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-md"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2.038A2 2 0 0115 11.293V10h.5a.5.5 0 00.354-.854l-3-3A.5.5 0 0012.5 6H11V5a1 1 0 00-1-1H3z" /></svg>
                Convertir en Alquiler
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Confirm modal ──────────────────────────────────────────────────────────────

function ConfirmModal({ title, message, confirmLabel, confirmCls, onConfirm, onClose }: {
  title: string; message: string; confirmLabel: string; confirmCls: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-gray-600">{message}</p>
      <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${confirmCls}`} style={{ fontFamily: "Outfit, sans-serif" }}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

// ── Quotes list ────────────────────────────────────────────────────────────────

export default function QuotesModule() {
  const [quotes, setQuotes] = useState<Quote[]>(QUOTES_INIT);
  const [contacts, setContacts] = useState<Contact[]>(CONTACTS);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [editQuote, setEditQuote] = useState<Quote | null>(null);
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Quote | null>(null);
  const [convertTarget, setConvertTarget] = useState<Quote | null>(null);

  const filtered = useMemo(() =>
    quotes.filter((q) => {
      if (filterStatus && q.status !== filterStatus) return false;
      if (filterFrom && q.createdAt < filterFrom) return false;
      if (filterTo && q.createdAt > filterTo) return false;
      return true;
    }), [quotes, filterStatus, filterFrom, filterTo]);

  const handleSave = (q: Quote) => {
    setQuotes((prev) => {
      const idx = prev.findIndex((x) => x.id === q.id);
      return idx >= 0 ? prev.map((x) => x.id === q.id ? q : x) : [q, ...prev];
    });
    setShowWizard(false);
    setEditQuote(null);
    if (detailQuote) setDetailQuote(q);
  };

  const cancelQuote = (id: string) => setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status: "Cancelado" } : q));

  if (detailQuote) {
    const live = quotes.find((q) => q.id === detailQuote.id) ?? detailQuote;
    return (
      <>
        <QuoteDetail
          quote={live}
          contacts={contacts}
          onBack={() => setDetailQuote(null)}
          onEdit={() => setEditQuote(live)}
          onCancel={() => setCancelTarget(live)}
          onConvert={() => setConvertTarget(live)}
        />
        {editQuote && (
          <QuoteWizard
            onClose={() => setEditQuote(null)}
            onSave={handleSave}
            contacts={contacts}
            onAddContact={(c) => setContacts((prev) => [...prev, c])}
            initial={editQuote}
          />
        )}
        {cancelTarget && (
          <ConfirmModal
            title="Cancelar cotización"
            message={`¿Confirmas que deseas cancelar la cotización ${cancelTarget.number}? Esta acción cambiará su estado a "Cancelado".`}
            confirmLabel="Sí, cancelar"
            confirmCls="bg-red-500 text-white hover:bg-red-600"
            onConfirm={() => { cancelQuote(cancelTarget.id); setDetailQuote((d) => d ? { ...d, status: "Cancelado" } : d); }}
            onClose={() => setCancelTarget(null)}
          />
        )}
        {convertTarget && (
          <ConfirmModal
            title="Convertir en Alquiler"
            message={`La cotización ${convertTarget.number} se convertirá en un alquiler formal. Podrás asignar los activos físicos en el módulo de Alquileres.`}
            confirmLabel="Convertir"
            confirmCls="bg-[#ffbc07] text-[#102c4d] hover:bg-[#e5a800]"
            onConfirm={() => {
              setQuotes((prev) => prev.map((q) => q.id === convertTarget.id ? { ...q, status: "Alquilado" } : q));
              setDetailQuote((d) => d ? { ...d, status: "Alquilado" } : d);
            }}
            onClose={() => setConvertTarget(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-[#102c4d] font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>Cotizaciones</h2>
          <p className="text-gray-400 text-sm">{quotes.length} cotizaciones · {quotes.filter((q) => q.status === "Cotizado").length} pendientes</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 bg-[#ffbc07] text-[#102c4d] font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-[#e5a800] transition-colors shadow-sm"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          Nueva Cotización
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium flex-shrink-0">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
            Filtros:
          </div>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#102c4d] bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            <option>Cotizado</option>
            <option>Alquilado</option>
            <option>Cancelado</option>
            <option>Completado</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">Creado entre</span>
            <input type="date" className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-[#102c4d]" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            <span className="text-gray-400 text-xs">y</span>
            <input type="date" className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-[#102c4d]" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </div>
          {(filterStatus || filterFrom || filterTo) && (
            <button onClick={() => { setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }} className="text-xs text-red-500 hover:text-red-700 font-medium">Limpiar</button>
          )}
        </div>
      </div>

      {/* Status pills summary */}
      <div className="flex flex-wrap gap-2">
        {(["Cotizado", "Alquilado", "Cancelado", "Completado"] as QuoteStatus[]).map((s) => {
          const count = quotes.filter((q) => q.status === s).length;
          const c = STATUS_CFG[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${filterStatus === s ? `${c.cls} ring-2 ring-offset-1 ring-current` : `${c.cls} opacity-70 hover:opacity-100`}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              {s} <span className="ml-0.5 font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["N° Cotización", "Contacto / Empresa", "Empleado", "Creación", "Período alquiler", "Total", "Estado", ""].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((q) => {
              const ct = contacts.find((c) => c.id === q.contactId);
              const total = quoteTotal(q.lines);
              return (
                <tr key={q.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setDetailQuote(q)}>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-bold text-[#102c4d] bg-blue-50 px-2 py-1 rounded">{q.number}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-gray-900 text-sm">{ct?.name ?? "—"}</div>
                    <div className="text-xs text-gray-400">{ct?.company}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{q.employee}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{q.createdAt}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                    {q.startDate} <span className="text-gray-300 mx-1">→</span> {q.endDate}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[#102c4d] whitespace-nowrap">{fmt(total)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={q.status} /></td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailQuote(q)} title="Ver detalle" className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-[#102c4d] transition-colors">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                      </button>
                      {q.status === "Cotizado" && (
                        <button onClick={() => { setEditQuote(q); }} title="Editar" className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-14 text-gray-400 text-sm">Sin cotizaciones para los filtros seleccionados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((q) => {
          const ct = contacts.find((c) => c.id === q.contactId);
          const total = quoteTotal(q.lines);
          return (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3" onClick={() => setDetailQuote(q)}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#102c4d] bg-blue-50 px-2 py-1 rounded">{q.number}</span>
                <StatusBadge status={q.status} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{ct?.name ?? "—"}</div>
                <div className="text-xs text-gray-400">{ct?.company}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div><div>Creado</div><div className="font-medium text-gray-700">{q.createdAt}</div></div>
                <div><div>Período</div><div className="font-medium text-gray-700">{q.startDate} → {q.endDate}</div></div>
                <div><div>Empleado</div><div className="font-medium text-gray-700">{q.employee}</div></div>
                <div><div>Total</div><div className="font-bold text-[#102c4d]">{fmt(total)}</div></div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border">Sin resultados.</div>
        )}
      </div>

      {showWizard && (
        <QuoteWizard
          onClose={() => setShowWizard(false)}
          onSave={handleSave}
          contacts={contacts}
          onAddContact={(c) => setContacts((prev) => [...prev, c])}
        />
      )}
      {editQuote && !detailQuote && (
        <QuoteWizard
          onClose={() => setEditQuote(null)}
          onSave={handleSave}
          contacts={contacts}
          onAddContact={(c) => setContacts((prev) => [...prev, c])}
          initial={editQuote}
        />
      )}
      {cancelTarget && (
        <ConfirmModal
          title="Cancelar cotización"
          message={`¿Confirmas cancelar la cotización ${cancelTarget.number}?`}
          confirmLabel="Sí, cancelar"
          confirmCls="bg-red-500 text-white hover:bg-red-600"
          onConfirm={() => cancelQuote(cancelTarget.id)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
