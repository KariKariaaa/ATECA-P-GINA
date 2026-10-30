import { useState, useMemo, useRef, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type RentalStatus = "Iniciado" | "Parcial" | "Completado" | "Cancelado";
type ReturnState = "Bien" | "Dañado";
type LineReturnStatus = "Pendiente" | "Devuelto" | "Dañado";

interface Contact {
  id: string;
  name: string;
  company: string;
  phone: string;
}

interface PhysicalAsset {
  id: string;
  code: string;
  name: string;
  category: string;
  status: "Disponible" | "Alquilado" | "En Mantenimiento";
}

interface RentalLine {
  id: string;
  assetId: string;
  category: string;
  rateWeek: number;
  quantity: number;
  weeks: number;
  returnDueDate: string;
  returnedDate: string | null;
  returnStatus: LineReturnStatus;
  damageDesc: string;
  damageCost: number;
}

interface Rental {
  id: string;
  number: string;
  quoteRef: string | null;
  contactId: string;
  employee: string;
  startDate: string;
  endDateEstimated: string;
  endDateReal: string | null;
  status: RentalStatus;
  lines: RentalLine[];
  notes: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const CONTACTS: Contact[] = [
  { id: "ct1", name: "Marco Vega",     company: "Constructora Vega S.A.",      phone: "+56 9 8812 3456" },
  { id: "ct2", name: "Sofía Ramos",    company: "Inmobiliaria del Norte",       phone: "+56 9 7734 9901" },
  { id: "ct3", name: "Roberto Cantera",company: "Ingeniería Cantera Ltda.",     phone: "+56 9 6612 7743" },
  { id: "ct4", name: "Ana Fuentes",    company: "Obras Civiles del Sur",        phone: "+56 9 9934 2210" },
  { id: "ct5", name: "Luis Merino",    company: "Grupo Constructivo Merino",    phone: "+56 9 5521 8867" },
  { id: "ct6", name: "Clara Ibáñez",  company: "Pavimentos y Rellenos S.A.",   phone: "+56 9 4490 3312" },
];

const ASSETS: PhysicalAsset[] = [
  { id: "a1",  code: "AND-0034", name: "Andamio Tubular 48mm",      category: "Andamio",    status: "Disponible" },
  { id: "a2",  code: "AND-0035", name: "Andamio Colgante Mono",     category: "Andamio",    status: "Alquilado"  },
  { id: "a3",  code: "AND-0041", name: "Andamio Fachada Euro",      category: "Andamio",    status: "Disponible" },
  { id: "a4",  code: "PLT-0007", name: "Plataforma Tijera 6m",      category: "Plataforma", status: "En Mantenimiento" },
  { id: "a5",  code: "PLT-0009", name: "Plataforma Articulada 10m", category: "Plataforma", status: "Disponible" },
  { id: "a6",  code: "PLT-0012", name: "Plataforma Vertical 4m",    category: "Plataforma", status: "Alquilado"  },
  { id: "a7",  code: "ROD-0011", name: "Jgo. Rodos Industriales",   category: "Rodo",       status: "Disponible" },
  { id: "a8",  code: "PUN-0028", name: "Puntal Metálico 3m",        category: "Puntal",     status: "Alquilado"  },
  { id: "a9",  code: "PUN-0031", name: "Puntal Metálico 2.5m",      category: "Puntal",     status: "Disponible" },
  { id: "a10", code: "AND-0044", name: "Andamio Marco 1.5m",        category: "Andamio",    status: "Disponible" },
];

const CATEGORY_RATES: Record<string, number> = {
  Andamio: 85000, Plataforma: 220000, Rodo: 60000, Puntal: 18000,
};

const QUOTES_AVAILABLE = [
  { id: "q2", number: "COT-0042", contactId: "ct2", lines: [{ category: "Plataforma", quantity: 1, weeks: 2 }] },
  { id: "q3", number: "COT-0043", contactId: "ct3", lines: [{ category: "Andamio", quantity: 6, weeks: 4 }, { category: "Rodo", quantity: 2, weeks: 4 }] },
  { id: "q5", number: "COT-0045", contactId: "ct5", lines: [{ category: "Andamio", quantity: 8, weeks: 6 }, { category: "Plataforma", quantity: 2, weeks: 6 }] },
];

const EMPLOYEES = ["Juan López", "Carla Muñoz", "Pedro Soto", "Valentina Ríos"];

const RENTALS_INIT: Rental[] = [
  {
    id: "r1", number: "ALQ-0091", quoteRef: "COT-0041", contactId: "ct1", employee: "Juan López",
    startDate: "2026-08-01", endDateEstimated: "2026-08-29", endDateReal: null, status: "Iniciado", notes: "Entrega antes de 8 AM.",
    lines: [
      { id: "l1", assetId: "a2", category: "Andamio",    rateWeek: 85000,  quantity: 1, weeks: 4, returnDueDate: "2026-08-28", returnedDate: null, returnStatus: "Pendiente", damageDesc: "", damageCost: 0 },
      { id: "l2", assetId: "a8", category: "Puntal",     rateWeek: 18000,  quantity: 1, weeks: 4, returnDueDate: "2026-08-29", returnedDate: null, returnStatus: "Pendiente", damageDesc: "", damageCost: 0 },
    ],
  },
  {
    id: "r2", number: "ALQ-0087", quoteRef: "COT-0042", contactId: "ct2", employee: "Carla Muñoz",
    startDate: "2026-07-20", endDateEstimated: "2026-08-17", endDateReal: null, status: "Parcial", notes: "",
    lines: [
      { id: "l3", assetId: "a5", category: "Plataforma", rateWeek: 220000, quantity: 1, weeks: 4, returnDueDate: "2026-08-17", returnedDate: "2026-08-15", returnStatus: "Devuelto", damageDesc: "", damageCost: 0 },
      { id: "l4", assetId: "a6", category: "Plataforma", rateWeek: 220000, quantity: 1, weeks: 4, returnDueDate: "2026-08-22", returnedDate: null,         returnStatus: "Pendiente", damageDesc: "", damageCost: 0 },
    ],
  },
  {
    id: "r3", number: "ALQ-0083", quoteRef: null, contactId: "ct3", employee: "Pedro Soto",
    startDate: "2026-07-10", endDateEstimated: "2026-08-07", endDateReal: "2026-08-09", status: "Completado", notes: "",
    lines: [
      { id: "l5", assetId: "a7", category: "Rodo",       rateWeek: 60000,  quantity: 1, weeks: 4, returnDueDate: "2026-08-07", returnedDate: "2026-08-09", returnStatus: "Dañado",   damageDesc: "Rodamiento izq. fisurado.", damageCost: 38000 },
      { id: "l6", assetId: "a9", category: "Puntal",     rateWeek: 18000,  quantity: 1, weeks: 4, returnDueDate: "2026-08-07", returnedDate: "2026-08-07", returnStatus: "Devuelto", damageDesc: "", damageCost: 0 },
    ],
  },
  {
    id: "r4", number: "ALQ-0079", quoteRef: "COT-0038", contactId: "ct4", employee: "Valentina Ríos",
    startDate: "2026-06-15", endDateEstimated: "2026-07-13", endDateReal: null, status: "Cancelado", notes: "Cliente solicitó cancelación por retraso de obra.",
    lines: [
      { id: "l7", assetId: "a3", category: "Andamio",    rateWeek: 85000,  quantity: 1, weeks: 4, returnDueDate: "2026-07-13", returnedDate: null, returnStatus: "Pendiente", damageDesc: "", damageCost: 0 },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

function lineTotal(l: RentalLine) { return l.rateWeek * l.quantity * l.weeks; }
function rentalEstimatedTotal(r: Rental) { return r.lines.reduce((s, l) => s + lineTotal(l), 0); }
function rentalRealTotal(r: Rental) {
  const returned = r.lines.filter((l) => l.returnStatus !== "Pendiente");
  if (returned.length === 0) return null;
  return returned.reduce((s, l) => s + lineTotal(l) + l.damageCost, 0);
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function accruedCost(asset: PhysicalAsset, rental?: Rental): number | null {
  if (!rental) return null;
  const line = rental.lines.find((l) => l.assetId === asset.id);
  if (!line) return null;
  const days = daysBetween(rental.startDate, new Date().toISOString().slice(0, 10));
  const dailyRate = line.rateWeek / 7;
  return Math.round(dailyRate * line.quantity * days);
}

const STATUS_CFG: Record<RentalStatus, { cls: string; dot: string }> = {
  Iniciado:   { cls: "bg-blue-100 text-blue-700",      dot: "bg-blue-500"    },
  Parcial:    { cls: "bg-amber-100 text-amber-700",    dot: "bg-amber-500"   },
  Completado: { cls: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500" },
  Cancelado:  { cls: "bg-red-100 text-red-700",        dot: "bg-red-500"     },
};

const LINE_STATUS_CFG: Record<LineReturnStatus, { cls: string }> = {
  Pendiente: { cls: "bg-gray-100 text-gray-500"         },
  Devuelto:  { cls: "bg-emerald-100 text-emerald-700"   },
  Dañado:    { cls: "bg-red-100 text-red-700"           },
};

function RentalBadge({ status }: { status: RentalStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function LineBadge({ status }: { status: LineReturnStatus }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${LINE_STATUS_CFG[status].cls}`}>
      {status}
    </span>
  );
}

function assetById(id: string) { return ASSETS.find((a) => a.id === id); }
function contactById(id: string) { return CONTACTS.find((c) => c.id === id); }

// ── Shared UI ──────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, size = "lg" }: {
  title: string; onClose: () => void; children: React.ReactNode; size?: "lg" | "xl" | "full";
}) {
  const sizeMap = { lg: "max-w-lg", xl: "max-w-2xl", full: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 md:p-6 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeMap[size]} my-4`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-[#102c4d] font-bold text-base" style={{ fontFamily: "Outfit, sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#102c4d] focus:ring-2 focus:ring-[#102c4d]/10 transition-all bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#102c4d] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ── Return Modal ───────────────────────────────────────────────────────────────

function ReturnModal({ line, rental, onClose, onSave }: {
  line: RentalLine;
  rental: Rental;
  onClose: () => void;
  onSave: (lineId: string, date: string, state: ReturnState, desc: string, cost: number) => void;
}) {
  const asset = assetById(line.assetId);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [state, setState] = useState<ReturnState>("Bien");
  const [desc, setDesc] = useState("");
  const [cost, setCost] = useState("");

  const lateBy = daysBetween(line.returnDueDate, date);
  const isLate = lateBy > 0;

  return (
    <Modal title="Registrar Devolución" onClose={onClose}>
      {/* Asset info */}
      <div className="flex items-center gap-3 bg-[#102c4d]/5 rounded-xl p-4 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#102c4d] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#ffbc07]">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v1H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-[#102c4d] text-sm">{asset?.name}</div>
          <div className="text-xs text-gray-500">{asset?.code} · {line.category} · Devol. estimada: {line.returnDueDate}</div>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Fecha de devolución">
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        {isLate && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-500 flex-shrink-0"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <span className="text-amber-800 font-medium">Devolución tardía — <strong>{lateBy} día(s)</strong> fuera de plazo estimado.</span>
          </div>
        )}

        {/* Return condition */}
        <Field label="Estado del activo al devolver">
          <div className="grid grid-cols-2 gap-3 mt-1">
            {(["Bien", "Dañado"] as ReturnState[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setState(opt)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${state === opt
                  ? opt === "Bien"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${state === opt
                  ? opt === "Bien" ? "border-emerald-500 bg-emerald-500" : "border-red-500 bg-red-500"
                  : "border-gray-300"}`}>
                  {state === opt && <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </span>
                {opt === "Bien" ? "✓ En buen estado" : "⚠ Con daños"}
              </button>
            ))}
          </div>
        </Field>

        {/* Damage fields — appear dynamically */}
        {state === "Dañado" && (
          <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Detalle del daño</p>
            <Field label="Descripción del daño">
              <textarea
                className={inputCls + " resize-none border-red-200 focus:border-red-400 focus:ring-red-100"}
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe el tipo y extensión del daño…"
                autoFocus
              />
            </Field>
            <Field label="Costo del daño (CLP)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  className={inputCls + " pl-7 border-red-200 focus:border-red-400 focus:ring-red-100"}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0"
                />
              </div>
            </Field>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
        <button
          onClick={() => onSave(line.id, date, state, desc, state === "Dañado" ? +cost : 0)}
          className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${state === "Dañado" ? "bg-red-500 text-white hover:bg-red-600" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {state === "Bien" ? "✓ Confirmar devolución" : "⚠ Registrar con daño"}
        </button>
      </div>
    </Modal>
  );
}

// ── Rental Detail ──────────────────────────────────────────────────────────────

function RentalDetail({ rental: initialRental, onBack }: { rental: Rental; onBack: () => void }) {
  const [rental, setRental] = useState<Rental>(initialRental);
  const [returnLine, setReturnLine] = useState<RentalLine | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  const ct = contactById(rental.contactId);
  const estimated = rentalEstimatedTotal(rental);
  const realTotal = rentalRealTotal(rental);

  const handleReturn = (lineId: string, date: string, state: ReturnState, desc: string, cost: number) => {
    setRental((prev) => {
      const newLines = prev.lines.map((l) =>
        l.id === lineId
          ? { ...l, returnedDate: date, returnStatus: state === "Bien" ? "Devuelto" : "Dañado" as LineReturnStatus, damageDesc: desc, damageCost: cost }
          : l
      );
      const allDone = newLines.every((l) => l.returnStatus !== "Pendiente");
      const anyDone = newLines.some((l) => l.returnStatus !== "Pendiente");
      const newStatus: RentalStatus = allDone ? "Completado" : anyDone ? "Parcial" : "Iniciado";
      if (allDone) setJustCompleted(true);
      return { ...prev, lines: newLines, status: newStatus, endDateReal: allDone ? date : prev.endDateReal };
    });
    setReturnLine(null);
  };

  const pendingCount = rental.lines.filter((l) => l.returnStatus === "Pendiente").length;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <button onClick={onBack} className="self-start p-2 rounded-lg hover:bg-gray-200 text-[#102c4d] transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-[#102c4d] font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>{rental.number}</h2>
            <RentalBadge status={rental.status} />
            {rental.quoteRef && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-mono">Origen: {rental.quoteRef}</span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-0.5">{rental.employee} · Iniciado {rental.startDate}</p>
        </div>
      </div>

      {/* Completion banner */}
      {justCompleted && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          </div>
          <div>
            <p className="font-bold text-emerald-800" style={{ fontFamily: "Outfit, sans-serif" }}>¡Alquiler completado!</p>
            <p className="text-sm text-emerald-700">Todos los activos han sido devueltos. El estado se actualizó a <strong>Completado</strong>.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Side info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contacto</p>
            <div className="font-semibold text-gray-900">{ct?.name}</div>
            <div className="text-sm text-gray-500">{ct?.company}</div>
            <div className="text-xs text-gray-400 mt-1">{ct?.phone}</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fechas</p>
            {[
              ["Inicio", rental.startDate],
              ["Fin estimado", rental.endDateEstimated],
              ["Fin real", rental.endDateReal ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{k}</span>
                <span className="text-xs font-semibold text-gray-900">{v}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Totales</p>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Estimado</span>
              <span className="text-sm font-bold text-[#102c4d]">{fmt(estimated)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Real (devueltos)</span>
              <span className="text-sm font-bold text-emerald-700">{realTotal !== null ? fmt(realTotal) : "—"}</span>
            </div>
            {rental.lines.some((l) => l.damageCost > 0) && (
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-red-500 font-medium">Cargos por daños</span>
                <span className="text-sm font-bold text-red-600">{fmt(rental.lines.reduce((s, l) => s + l.damageCost, 0))}</span>
              </div>
            )}
          </div>

          {rental.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Notas</p>
              <p className="text-sm text-amber-900">{rental.notes}</p>
            </div>
          )}

          {pendingCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500 flex-shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
              <p className="text-xs text-blue-800 font-medium"><strong>{pendingCount}</strong> activo(s) pendientes de devolución</p>
            </div>
          )}
        </div>

        {/* Lines */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[#102c4d] font-bold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Líneas del alquiler</h3>
              <span className="text-xs text-gray-400">{rental.lines.length} equipo(s)</span>
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Activo", "Categoría", "Tarifa/sem.", "Devol. estimada", "Devol. real", "Subtotal", "Estado", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rental.lines.map((line) => {
                    const asset = assetById(line.assetId);
                    const sub = lineTotal(line) + line.damageCost;
                    return (
                      <tr key={line.id} className={`transition-colors ${line.returnStatus === "Pendiente" ? "hover:bg-blue-50/30" : "hover:bg-gray-50/30"}`}>
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-xs font-semibold text-[#102c4d] bg-blue-50 px-2 py-0.5 rounded inline-block">{asset?.code}</div>
                          <div className="text-xs text-gray-500 mt-0.5 max-w-[120px] truncate">{asset?.name}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs bg-[#102c4d]/8 text-[#102c4d] px-2 py-0.5 rounded-full font-semibold">{line.category}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600">{fmt(line.rateWeek)}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{line.returnDueDate}</td>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                          {line.returnedDate
                            ? <span className={line.returnStatus === "Dañado" ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}>{line.returnedDate}</span>
                            : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#102c4d] text-sm">{fmt(sub)}</div>
                          {line.damageCost > 0 && <div className="text-[10px] text-red-500">+{fmt(line.damageCost)} daño</div>}
                        </td>
                        <td className="px-4 py-3.5"><LineBadge status={line.returnStatus} /></td>
                        <td className="px-4 py-3.5">
                          {line.returnStatus === "Pendiente" && (
                            <button
                              onClick={() => setReturnLine(line)}
                              className="flex items-center gap-1.5 text-xs font-semibold bg-[#102c4d] text-white px-3 py-1.5 rounded-lg hover:bg-[#1a3d6b] transition-colors whitespace-nowrap"
                              style={{ fontFamily: "Outfit, sans-serif" }}
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              Registrar
                            </button>
                          )}
                          {line.returnStatus === "Dañado" && line.damageDesc && (
                            <div className="text-[10px] text-red-500 max-w-[120px] leading-tight" title={line.damageDesc}>{line.damageDesc.slice(0, 40)}{line.damageDesc.length > 40 ? "…" : ""}</div>
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
              {rental.lines.map((line) => {
                const asset = assetById(line.assetId);
                return (
                  <div key={line.id} className="px-4 py-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-semibold text-[#102c4d] bg-blue-50 px-2 py-0.5 rounded">{asset?.code}</span>
                        <div className="text-sm font-medium text-gray-900 mt-1">{asset?.name}</div>
                        <div className="text-xs text-gray-400">{line.category} · {fmt(line.rateWeek)}/sem</div>
                      </div>
                      <LineBadge status={line.returnStatus} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-400">Devol. estimada</span><div className="font-semibold text-gray-700">{line.returnDueDate}</div></div>
                      <div><span className="text-gray-400">Devol. real</span><div className={`font-semibold ${line.returnedDate ? (line.returnStatus === "Dañado" ? "text-red-600" : "text-emerald-600") : "text-gray-400"}`}>{line.returnedDate ?? "—"}</div></div>
                    </div>
                    {line.returnStatus === "Dañado" && line.damageDesc && (
                      <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{line.damageDesc}</div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="font-bold text-[#102c4d]">{fmt(lineTotal(line) + line.damageCost)}</div>
                      {line.returnStatus === "Pendiente" && (
                        <button
                          onClick={() => setReturnLine(line)}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-[#102c4d] text-white px-3 py-1.5 rounded-lg hover:bg-[#1a3d6b] transition-colors"
                          style={{ fontFamily: "Outfit, sans-serif" }}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Registrar devolución
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="bg-[#102c4d] px-5 py-4 flex items-center justify-between">
              <span className="text-blue-200 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
                Total estimado / real
              </span>
              <div className="text-right">
                <span className="text-white font-bold text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(estimated)}</span>
                {realTotal !== null && <span className="text-blue-300 text-sm ml-2">/ {fmt(realTotal)}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {returnLine && (
        <ReturnModal
          line={returnLine}
          rental={rental}
          onClose={() => setReturnLine(null)}
          onSave={handleReturn}
        />
      )}
    </div>
  );
}

// ── Create Rental Wizard ───────────────────────────────────────────────────────

interface WizardLine {
  id: string;
  category: string;
  assetId: string;
  quantity: number;
  weeks: number;
  returnDueDate: string;
}

function newWizardLine(id: string): WizardLine {
  return { id, category: "Andamio", assetId: "", quantity: 1, weeks: 1, returnDueDate: "" };
}

function CreateRentalWizard({ onClose, onSave }: { onClose: () => void; onSave: (r: Rental) => void }) {
  const [origin, setOrigin] = useState<"quote" | "direct" | null>(null);
  const [step, setStep] = useState(1); // 1=origin+general, 2=lines+assets
  const [quoteId, setQuoteId] = useState("");
  const [contactId, setContactId] = useState("");
  const [employee, setEmployee] = useState(EMPLOYEES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<WizardLine[]>([newWizardLine("wl0")]);

  // Load from quote
  useEffect(() => {
    if (origin === "quote" && quoteId) {
      const q = QUOTES_AVAILABLE.find((x) => x.id === quoteId);
      if (q) {
        setContactId(q.contactId);
        setLines(q.lines.map((l, i) => ({ id: `wl${i}`, category: l.category, assetId: "", quantity: l.quantity, weeks: l.weeks, returnDueDate: "" })));
      }
    }
  }, [quoteId, origin]);

  const updateLine = (id: string, key: keyof WizardLine, val: string | number) =>
    setLines((prev) => prev.map((l) => l.id === id ? { ...l, [key]: val } : l));

  const addLine = () => setLines((prev) => [...prev, newWizardLine(`wl${Date.now()}`)]);
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));

  const availableAssets = (cat: string) => ASSETS.filter((a) => a.category === cat && a.status === "Disponible");

  const step1Valid = origin && startDate && endDate && (origin === "direct" ? contactId : quoteId);
  const step2Valid = lines.every((l) => l.assetId && l.returnDueDate);

  const quoteRef = QUOTES_AVAILABLE.find((q) => q.id === quoteId);
  const ct = contactById(contactId);

  const handleSave = () => {
    const rental: Rental = {
      id: `r${Date.now()}`,
      number: `ALQ-${String(Math.floor(Math.random() * 900 + 100)).padStart(4, "0")}`,
      quoteRef: origin === "quote" ? quoteRef?.number ?? null : null,
      contactId,
      employee,
      startDate,
      endDateEstimated: endDate,
      endDateReal: null,
      status: "Iniciado",
      notes,
      lines: lines.map((wl, i) => ({
        id: `l${i}`,
        assetId: wl.assetId,
        category: wl.category,
        rateWeek: CATEGORY_RATES[wl.category] ?? 85000,
        quantity: wl.quantity,
        weeks: wl.weeks,
        returnDueDate: wl.returnDueDate,
        returnedDate: null,
        returnStatus: "Pendiente",
        damageDesc: "",
        damageCost: 0,
      })),
    };
    onSave(rental);
  };

  return (
    <Modal title="Nuevo Alquiler" onClose={onClose} size="full">
      {/* Stepper */}
      <div className="flex items-center gap-0 mb-6">
        {[{ n: 1, label: "Origen y datos" }, { n: 2, label: "Activos físicos" }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-0 flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.n ? "bg-[#102c4d] text-white" : "bg-gray-200 text-gray-400"}`} style={{ fontFamily: "Outfit, sans-serif" }}>
                {step > s.n ? <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : s.n}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${step === s.n ? "text-[#102c4d]" : "text-gray-400"}`} style={{ fontFamily: "Outfit, sans-serif" }}>{s.label}</span>
            </div>
            {i < 1 && <div className={`flex-1 h-0.5 mx-3 ${step > 1 ? "bg-[#102c4d]" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Origin */}
          <Field label="Origen del alquiler">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { val: "quote", label: "Desde cotización", sub: "Precarga contacto y líneas", icon: "M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" },
                { val: "direct", label: "Alquiler directo", sub: "Sin cotización previa", icon: "M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2.038A2 2 0 0115 11.293V10h.5a.5.5 0 00.354-.854l-3-3A.5.5 0 0012.5 6H11V5a1 1 0 00-1-1H3z" },
              ] as const).map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => { setOrigin(opt.val); setLines([newWizardLine("wl0")]); setQuoteId(""); setContactId(""); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${origin === opt.val ? "border-[#102c4d] bg-[#102c4d]/5" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${origin === opt.val ? "bg-[#102c4d]" : "bg-gray-100"}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${origin === opt.val ? "text-[#ffbc07]" : "text-gray-400"}`}><path fillRule="evenodd" d={opt.icon} clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${origin === opt.val ? "text-[#102c4d]" : "text-gray-700"}`} style={{ fontFamily: "Outfit, sans-serif" }}>{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.sub}</div>
                  </div>
                  {origin === opt.val && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-[#102c4d] flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 20 20" fill="white" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Field>

          {origin === "quote" && (
            <Field label="Cotización de origen">
              <select className={inputCls} value={quoteId} onChange={(e) => setQuoteId(e.target.value)}>
                <option value="">Seleccionar cotización…</option>
                {QUOTES_AVAILABLE.map((q) => (
                  <option key={q.id} value={q.id}>{q.number} — {contactById(q.contactId)?.name} ({contactById(q.contactId)?.company})</option>
                ))}
              </select>
              {quoteRef && (
                <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800">
                  <strong>{quoteRef.lines.length} línea(s)</strong> precargadas · Contacto: <strong>{contactById(quoteRef.contactId)?.name}</strong>
                </div>
              )}
            </Field>
          )}

          {origin === "direct" && (
            <Field label="Contacto">
              <select className={inputCls} value={contactId} onChange={(e) => setContactId(e.target.value)}>
                <option value="">Seleccionar contacto…</option>
                {CONTACTS.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
              </select>
            </Field>
          )}

          {ct && (
            <div className="flex items-center gap-3 bg-[#102c4d]/5 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-[#102c4d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{ct.name.slice(0, 2).toUpperCase()}</div>
              <div className="text-sm"><div className="font-semibold text-[#102c4d]">{ct.name}</div><div className="text-gray-500 text-xs">{ct.company} · {ct.phone}</div></div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fecha inicio"><input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
            <Field label="Fecha fin estimada"><input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} /></Field>
          </div>

          <Field label="Empleado responsable">
            <select className={inputCls} value={employee} onChange={(e) => setEmployee(e.target.value)}>
              {EMPLOYEES.map((e) => <option key={e}>{e}</option>)}
            </select>
          </Field>

          <Field label="Notas (opcional)">
            <textarea className={inputCls + " resize-none"} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones especiales…" />
          </Field>
        </div>
      )}

      {/* Step 2 — Assign physical assets */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Context chip */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-600 flex flex-wrap gap-3">
            <span><strong className="text-gray-900">{ct?.name}</strong> · {ct?.company}</span>
            <span className="text-gray-300">|</span>
            <span>{startDate} → {endDate}</span>
            {quoteRef && <><span className="text-gray-300">|</span><span className="font-mono text-[#102c4d]">{quoteRef.number}</span></>}
          </div>

          <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            Asigna el <strong>activo físico específico</strong> y la <strong>fecha de devolución individual</strong> a cada línea.
            Solo se muestran activos disponibles de la categoría seleccionada.
          </p>

          <div className="space-y-3">
            {lines.map((wl, idx) => {
              const available = availableAssets(wl.category);
              const selected = ASSETS.find((a) => a.id === wl.assetId);
              return (
                <div key={wl.id} className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                  {/* Line header */}
                  <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Línea {idx + 1}</span>
                    {origin === "direct" && (
                      <button onClick={() => removeLine(wl.id)} disabled={lines.length === 1} className="p-1 rounded text-gray-300 hover:text-red-500 disabled:opacity-30">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    )}
                  </div>

                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Category */}
                    <Field label="Categoría">
                      {origin === "quote" ? (
                        <div className="flex items-center gap-2 bg-[#102c4d]/5 rounded-lg px-3 py-2.5">
                          <span className="text-xs font-bold text-[#102c4d]">{wl.category}</span>
                          <span className="text-[10px] text-gray-400 ml-auto">Precargado</span>
                        </div>
                      ) : (
                        <select className={inputCls} value={wl.category} onChange={(e) => { updateLine(wl.id, "category", e.target.value); updateLine(wl.id, "assetId", ""); }}>
                          {Object.keys(CATEGORY_RATES).map((c) => <option key={c}>{c}</option>)}
                        </select>
                      )}
                    </Field>

                    {/* Asset */}
                    <Field label="Activo físico">
                      <select
                        className={`${inputCls} ${!wl.assetId ? "border-amber-300" : "border-emerald-300"}`}
                        value={wl.assetId}
                        onChange={(e) => updateLine(wl.id, "assetId", e.target.value)}
                      >
                        <option value="">— Seleccionar —</option>
                        {available.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                        {available.length === 0 && <option disabled>Sin disponibles</option>}
                      </select>
                      {selected && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          {selected.code} asignado
                        </div>
                      )}
                      {available.length === 0 && <p className="text-[10px] text-red-500 mt-1">No hay activos disponibles en esta categoría.</p>}
                    </Field>

                    {/* Quantity & weeks */}
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Cant.">
                        {origin === "quote"
                          ? <div className="flex items-center gap-1 bg-[#102c4d]/5 rounded-lg px-3 py-2.5"><span className="text-xs font-bold text-[#102c4d]">{wl.quantity}</span></div>
                          : <input type="number" min={1} className={inputCls + " text-center"} value={wl.quantity} onChange={(e) => updateLine(wl.id, "quantity", +e.target.value)} />
                        }
                      </Field>
                      <Field label="Semanas">
                        {origin === "quote"
                          ? <div className="flex items-center gap-1 bg-[#102c4d]/5 rounded-lg px-3 py-2.5"><span className="text-xs font-bold text-[#102c4d]">{wl.weeks}</span></div>
                          : <input type="number" min={1} className={inputCls + " text-center"} value={wl.weeks} onChange={(e) => updateLine(wl.id, "weeks", +e.target.value)} />
                        }
                      </Field>
                    </div>

                    {/* Return due date */}
                    <Field label="Devol. estimada">
                      <input type="date" className={`${inputCls} ${!wl.returnDueDate ? "border-amber-300" : ""}`} value={wl.returnDueDate} onChange={(e) => updateLine(wl.id, "returnDueDate", e.target.value)} min={startDate} />
                    </Field>
                  </div>

                  {/* Rate display */}
                  <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between bg-white/50">
                    <span className="text-xs text-gray-400">Tarifa: <strong className="text-[#102c4d]">{fmt(CATEGORY_RATES[wl.category] ?? 0)}/semana</strong></span>
                    <span className="text-xs font-bold text-[#102c4d]">Subtotal: {fmt((CATEGORY_RATES[wl.category] ?? 0) * wl.quantity * wl.weeks)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {origin === "direct" && (
            <button onClick={addLine} className="flex items-center gap-2 text-sm font-semibold text-[#102c4d] border-2 border-dashed border-gray-300 hover:border-[#102c4d] rounded-xl px-4 py-3 w-full justify-center transition-colors hover:bg-[#102c4d]/5" style={{ fontFamily: "Outfit, sans-serif" }}>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#ffbc07]"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Agregar activo
            </button>
          )}

          {/* Total */}
          <div className="bg-[#102c4d] rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-blue-300 text-xs uppercase tracking-wider">Total estimado</div>
              <div className="text-white text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                {fmt(lines.reduce((s, wl) => s + (CATEGORY_RATES[wl.category] ?? 0) * wl.quantity * wl.weeks, 0))}
              </div>
            </div>
            <div className="text-right text-blue-300 text-xs">
              <div>{lines.length} línea(s)</div>
              <div>{lines.reduce((s, wl) => s + wl.quantity, 0)} equipos</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <button onClick={step === 1 ? onClose : () => setStep(1)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          {step === 2 && <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>}
          {step === 1 ? "Cancelar" : "Anterior"}
        </button>
        {step === 1 ? (
          <button disabled={!step1Valid} onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-[#102c4d] text-white rounded-lg hover:bg-[#1a3d6b] disabled:opacity-40 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
            Continuar
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        ) : (
          <button disabled={!step2Valid} onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-[#ffbc07] text-[#102c4d] rounded-lg hover:bg-[#e5a800] disabled:opacity-40 transition-colors shadow-md" style={{ fontFamily: "Outfit, sans-serif" }}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Crear Alquiler
          </button>
        )}
      </div>
    </Modal>
  );
}

// ── QR Scanner View ────────────────────────────────────────────────────────────

function QRScannerView() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<PhysicalAsset | null>(null);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = (q: string) => {
    const trimmed = q.trim().toUpperCase();
    const asset = ASSETS.find((a) => a.code === trimmed || a.code.includes(trimmed));
    if (asset) { setResult(asset); setNotFound(false); }
    else { setResult(null); setNotFound(true); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") search(code); };

  const activeRental = result
    ? RENTALS_INIT.find((r) => r.status === "Iniciado" && r.lines.some((l) => l.assetId === result.id))
    : null;

  const accrued = result && activeRental ? accruedCost(result, activeRental) : null;
  const ct = activeRental ? contactById(activeRental.contactId) : null;

  const statusColor: Record<string, string> = {
    Disponible: "bg-emerald-100 border-emerald-300 text-emerald-800",
    Alquilado: "bg-amber-100 border-amber-300 text-amber-800",
    "En Mantenimiento": "bg-red-100 border-red-300 text-red-800",
  };

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#102c4d] flex items-center justify-center mx-auto mb-3">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-[#ffbc07]">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zm-2 7a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zm8-12a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1zM9 9a1 1 0 000 2h1a1 1 0 100-2H9zm7 0a1 1 0 10-2 0v1h1a1 1 0 001-1zm-1 4a1 1 0 10-2 0 1 1 0 002 0zm-5 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-[#102c4d] font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>Consulta de Activo por QR</h2>
        <p className="text-gray-400 text-sm mt-1">Escanea o ingresa el código del activo para ver su estado en tiempo real</p>
      </div>

      {/* Scan area */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-6 space-y-4">
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            ref={inputRef}
            className="w-full pl-9 pr-24 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#102c4d] focus:ring-2 focus:ring-[#102c4d]/10 uppercase"
            placeholder="AND-0034 ó PLT-0007…"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setNotFound(false); }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            onClick={() => search(code)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#102c4d] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#1a3d6b] transition-colors"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Buscar
          </button>
        </div>

        {/* Quick codes */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Prueba con:</p>
          <div className="flex flex-wrap gap-2">
            {ASSETS.slice(0, 5).map((a) => (
              <button
                key={a.id}
                onClick={() => { setCode(a.code); search(a.code); }}
                className="text-xs font-mono bg-gray-100 hover:bg-[#102c4d] hover:text-white text-gray-700 px-2.5 py-1 rounded-lg transition-colors"
              >
                {a.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Not found */}
      {notFound && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-center">
          <p className="text-red-700 font-semibold text-sm">No se encontró ningún activo con el código <span className="font-mono">{code}</span>.</p>
          <p className="text-red-500 text-xs mt-1">Verifica que el código sea correcto e intenta nuevamente.</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Asset card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
            <div className="bg-[#102c4d] px-5 py-4 flex items-center justify-between">
              <div>
                <div className="font-mono text-[#ffbc07] font-bold text-lg">{result.code}</div>
                <div className="text-blue-200 text-sm">{result.name}</div>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColor[result.status]}`}>
                {result.status}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[["Categoría", result.category], ["Estado actual", result.status]].map(([k, v]) => (
                  <div key={k}><div className="text-xs text-gray-400">{k}</div><div className="text-sm font-semibold text-gray-900 mt-0.5">{v}</div></div>
                ))}
              </div>

              {/* Active rental info */}
              {activeRental && ct && (
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-500"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Actualmente alquilado</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500 text-xs">Alquiler</span><span className="font-mono text-xs font-bold text-[#102c4d]">{activeRental.number}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 text-xs">Cliente</span><span className="text-xs font-semibold">{ct.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 text-xs">Empresa</span><span className="text-xs text-gray-700">{ct.company}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 text-xs">Inicio</span><span className="text-xs font-semibold">{activeRental.startDate}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 text-xs">Devol. est.</span><span className="text-xs font-semibold">{activeRental.endDateEstimated}</span></div>
                  </div>

                  {/* Accrued cost */}
                  {accrued !== null && (
                    <div className="bg-white border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between mt-2">
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Costo acumulado</div>
                        <div className="text-xs text-gray-400">desde {activeRental.startDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#102c4d]" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(accrued)}</div>
                        <div className="text-[10px] text-gray-400">{daysBetween(activeRental.startDate, new Date().toISOString().slice(0, 10))} días</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.status === "Disponible" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span className="text-sm text-emerald-800 font-medium">Activo disponible para alquiler</span>
                </div>
              )}

              {result.status === "En Mantenimiento" && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                  <span className="text-sm text-red-800 font-medium">Activo en mantenimiento — no disponible</span>
                </div>
              )}
            </div>
          </div>

          <button onClick={() => { setResult(null); setCode(""); setNotFound(false); inputRef.current?.focus(); }} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2">
            ← Consultar otro activo
          </button>
        </div>
      )}
    </div>
  );
}

// ── Module root ────────────────────────────────────────────────────────────────

type RentalTab = "list" | "scanner";

export default function RentalsModule() {
  const [tab, setTab] = useState<RentalTab>("list");
  const [rentals, setRentals] = useState<Rental[]>(RENTALS_INIT);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [detailRental, setDetailRental] = useState<Rental | null>(null);

  const filtered = useMemo(() =>
    rentals.filter((r) => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterFrom && r.startDate < filterFrom) return false;
      if (filterTo && r.startDate > filterTo) return false;
      return true;
    }), [rentals, filterStatus, filterFrom, filterTo]);

  const handleSave = (r: Rental) => {
    setRentals((prev) => [r, ...prev]);
    setShowCreate(false);
  };

  if (detailRental) {
    const live = rentals.find((r) => r.id === detailRental.id) ?? detailRental;
    return <RentalDetail rental={live} onBack={() => setDetailRental(null)} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-nav */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6">
        <div className="flex gap-1">
          {([{ id: "list", label: "Alquileres" }, { id: "scanner", label: "Consulta QR" }] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-shrink-0 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors ${tab === t.id ? "border-[#ffbc07] text-[#102c4d]" : "border-transparent text-gray-400 hover:text-gray-600"}`} style={{ fontFamily: "Outfit, sans-serif" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "scanner" && <QRScannerView />}
        {tab === "list" && (
          <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <h2 className="text-[#102c4d] font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>Alquileres</h2>
                <p className="text-gray-400 text-sm">{rentals.length} registros · {rentals.filter((r) => r.status === "Iniciado" || r.status === "Parcial").length} activos</p>
              </div>
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-[#ffbc07] text-[#102c4d] font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-[#e5a800] transition-colors shadow-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Nuevo Alquiler
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium flex-shrink-0">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                  Filtros:
                </div>
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#102c4d]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">Todos los estados</option>
                  {(["Iniciado", "Parcial", "Completado", "Cancelado"] as RentalStatus[]).map((s) => <option key={s}>{s}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">Inicio entre</span>
                  <input type="date" className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-[#102c4d]" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
                  <span className="text-gray-400 text-xs">y</span>
                  <input type="date" className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-[#102c4d]" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
                </div>
                {(filterStatus || filterFrom || filterTo) && <button onClick={() => { setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }} className="text-xs text-red-500 font-medium">Limpiar</button>}
              </div>
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
              {(["Iniciado", "Parcial", "Completado", "Cancelado"] as RentalStatus[]).map((s) => {
                const count = rentals.filter((r) => r.status === s).length;
                const c = STATUS_CFG[s];
                return (
                  <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "" : s)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${filterStatus === s ? `${c.cls} ring-2 ring-offset-1 ring-current` : `${c.cls} opacity-70 hover:opacity-100`}`}>
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
                    {["N° Alquiler", "Contacto", "Inicio", "Fin estimado", "Fin real", "Total est.", "Total real", "Estado", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((r) => {
                    const ct = contactById(r.contactId);
                    const est = rentalEstimatedTotal(r);
                    const real = rentalRealTotal(r);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setDetailRental(r)}>
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-xs font-bold text-[#102c4d] bg-blue-50 px-2 py-1 rounded inline-block">{r.number}</div>
                          {r.quoteRef && <div className="text-[10px] text-gray-400 mt-0.5">← {r.quoteRef}</div>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-gray-900 text-sm">{ct?.name}</div>
                          <div className="text-xs text-gray-400">{ct?.company}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{r.startDate}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{r.endDateEstimated}</td>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                          {r.endDateReal ? <span className="text-emerald-600 font-semibold">{r.endDateReal}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-900 whitespace-nowrap">{fmt(est)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {real !== null ? <span className="font-bold text-emerald-700">{fmt(real)}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3.5"><RentalBadge status={r.status} /></td>
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setDetailRental(r)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-[#102c4d]">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-14 text-gray-400 text-sm">Sin alquileres para los filtros seleccionados.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((r) => {
                const ct = contactById(r.contactId);
                const est = rentalEstimatedTotal(r);
                const real = rentalRealTotal(r);
                return (
                  <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3" onClick={() => setDetailRental(r)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#102c4d] bg-blue-50 px-2 py-1 rounded">{r.number}</span>
                        {r.quoteRef && <span className="ml-2 text-[10px] text-gray-400 font-mono">← {r.quoteRef}</span>}
                      </div>
                      <RentalBadge status={r.status} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{ct?.name}</div>
                      <div className="text-xs text-gray-400">{ct?.company}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><div className="text-gray-400">Inicio</div><div className="font-semibold text-gray-700">{r.startDate}</div></div>
                      <div><div className="text-gray-400">Fin est.</div><div className="font-semibold text-gray-700">{r.endDateEstimated}</div></div>
                      <div><div className="text-gray-400">Total est.</div><div className="font-bold text-[#102c4d]">{fmt(est)}</div></div>
                      <div><div className="text-gray-400">Total real</div><div className={`font-bold ${real !== null ? "text-emerald-700" : "text-gray-400"}`}>{real !== null ? fmt(real) : "—"}</div></div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border">Sin resultados.</div>}
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateRentalWizard onClose={() => setShowCreate(false)} onSave={handleSave} />}
    </div>
  );
}
