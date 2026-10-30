import { useState } from "react";
import {
  Building2,
  Droplets,
  FileCheck,
  Hammer,
  HardHat,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Ruler,
  ShieldCheck,
  X,
} from "lucide-react";

/* ───────── Datos (edite aquí) ───────── */
const CONTACT = {
  phone: "+502 0000 0000", // TODO: número real
  whatsapp: "50200000000", // TODO: sin signos ni espacios
  email: "contacto@ateca.com.gt", // TODO: correo real
  address: "2da calle 2-92 zona 12, Cobán, Alta Verapaz",
};

const NAV = [
  ["Servicios", "#servicios"],
  ["Alquiler de equipo", "#alquiler"],
  ["Proyectos", "#proyectos"],
  ["Nosotros", "#nosotros"],
  ["Contacto", "#contacto"],
] as const;

const SERVICES = [
  {
    icon: Building2,
    title: "Construcción residencial",
    text: "Planificamos, diseñamos y construimos su vivienda, desde el estudio preliminar hasta la entrega final.",
  },
  {
    icon: FileCheck,
    title: "Licencias y trámites",
    text: "Gestionamos licencias y permisos ante MARN, CONRED, CONAP, MSPAS, DGAC, EMPAGUA, IDAEH y municipalidades.",
  },
  {
    icon: Ruler,
    title: "Topografía",
    text: "Rectificación de linderos, análisis predial, apertura de carreteras, drenajes, plataformas y rellenos.",
  },
  {
    icon: Hammer,
    title: "Diseño y remodelación",
    text: "Cocinas, baños, dormitorios, jardines y terrazas, pensados para cómo vive su familia.",
  },
  {
    icon: Droplets,
    title: "Saneamiento ambiental",
    text: "Pozos de absorción, fosas sépticas, biodigestores y plantas de tratamiento.",
  },
];

const EQUIPMENT = [
  ["Andamios certificados", "Estructuras modulares para trabajo en altura, con entrega inmediata a obra."],
  ["Puntales metálicos", "Apuntalamiento de losas y encofrados, en distintas alturas."],
  ["Plataformas de trabajo", "Acceso seguro y estable para fachadas, acabados y mantenimiento."],
  ["Rodos compactadores", "Compactación de suelos, rellenos y plataformas."],
  ["Mezcladoras y vibradores", "Equipo para fundiciones de concreto en obra."],
];

const PROJECTS = [
  { name: "Residencia Los Cedros", kind: "Vivienda · 2 niveles", span: "md:col-span-2 md:row-span-2", tone: "bg-navy text-sun" },
  { name: "Casa Campestre San Pedro", kind: "Vivienda", span: "", tone: "bg-sun text-navy" },
  { name: "Remodelación Cocina y Terraza", kind: "Remodelación", span: "", tone: "bg-fog text-navy" },
  { name: "Plataforma y drenajes Zona 12", kind: "Topografía", span: "", tone: "bg-navy text-white" },
  { name: "Planta de tratamiento Chamelco", kind: "Saneamiento", span: "md:col-span-2", tone: "bg-sun text-navy" },
];

const VALUES = [
  "Compromiso con el cliente y con los plazos establecidos.",
  "Calidad técnica y atención al detalle.",
  "Responsabilidad y seguridad en cada obra.",
  "Innovación y uso de tecnología en los procesos.",
  "Trabajo en equipo y mejora continua.",
];

/* ───────── Motivo gráfico: rayos de la paleta ───────── */
function Sun({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={-3}
          y={i % 2 ? -42 : -49}
          width={6}
          height={i % 2 ? 28 : 35}
          transform={`rotate(${i * 22.5})`}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="#inicio" className="flex items-center gap-2 font-black tracking-tight" aria-label="ATECA, inicio">
      <Sun className="h-8 w-8 text-sun" />
      <span className={`text-2xl ${light ? "text-white" : "text-navy"}`}>ATECA</span>
    </a>
  );
}

const btn =
  "inline-flex items-center justify-center gap-2 px-6 py-3 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun";

export default function App() {
  const [open, setOpen] = useState(false);
  const wa = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent("Hola, quisiera cotizar con ATECA.")}`;

  return (
    <div className="bg-white font-sans text-navy antialiased">
      {/* Navegación */}
      <header className="sticky top-0 z-50 border-b border-navy/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex" aria-label="Principal">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="hover:text-navy/60">
                {label}
              </a>
            ))}
            <a href={wa} className={`${btn} bg-sun py-2 text-navy hover:bg-navy hover:text-white`}>
              Cotizar
            </a>
          </nav>
          <button
            className="p-2 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="flex flex-col border-t border-navy/10 bg-white px-5 py-2 md:hidden" aria-label="Móvil">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="py-3 font-semibold">
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main>
        {/* Hero */}
        <section id="inicio" className="relative overflow-hidden bg-navy text-white">
          <Sun className="spin-slow pointer-events-none absolute -right-40 top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 text-sun md:-right-24" />
          <div className="relative mx-auto max-w-6xl px-5 py-24 md:py-36">
            <h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
              Construimos con plazos claros y obra segura.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              Planificación, diseño, construcción y alquiler de equipo en Cobán, Alta Verapaz. Un solo equipo
              desde el primer plano hasta la entrega.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={wa} className={`${btn} bg-sun text-navy hover:bg-white`}>
                Cotizar mi proyecto
              </a>
              <a href="#alquiler" className={`${btn} border-2 border-white/40 hover:border-sun hover:text-sun`}>
                Ver equipo en alquiler
              </a>
            </div>
          </div>
        </section>

        {/* Servicios */}
        <section id="servicios" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">Lo que hacemos</h2>
              <p className="mt-4 max-w-xs text-navy/70">
                Un portafolio completo para que no tenga que coordinar a varios proveedores.
              </p>
            </div>
            <ul className="divide-y divide-navy/15 border-y border-navy/15">
              {SERVICES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-5 py-6">
                  <Icon className="mt-1 h-7 w-7 shrink-0 text-navy" strokeWidth={1.75} />
                  <div>
                    <h3 className="text-xl font-extrabold">{title}</h3>
                    <p className="mt-1 max-w-xl text-navy/70">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Alquiler */}
        <section id="alquiler" className="bg-sun">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[2fr_3fr] md:py-28">
            <div>
              <HardHat className="h-10 w-10" strokeWidth={1.75} />
              <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">Alquiler de maquinaria y equipo</h2>
              <p className="mt-4 max-w-sm text-navy/80">
                Equipo propio, certificado y en óptimas condiciones. Lo entregamos directamente en su obra.
              </p>
              <a href={wa} className={`${btn} mt-8 bg-navy text-white hover:bg-white hover:text-navy`}>
                Consultar disponibilidad
              </a>
            </div>
            <dl className="divide-y divide-navy/25 border-y border-navy/25">
              {EQUIPMENT.map(([name, desc]) => (
                <div key={name} className="grid gap-1 py-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                  <dt className="text-lg font-extrabold">{name}</dt>
                  <dd className="text-navy/80">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Proyectos */}
        <section id="proyectos" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">Proyectos</h2>
          <p className="mt-4 max-w-md text-navy/70">
            Una muestra de nuestro trabajo reciente. {/* TODO: reemplazar por proyectos reales */}
          </p>
          <div className="mt-10 grid auto-rows-[14rem] gap-4 md:grid-cols-4">
            {PROJECTS.map((p) => (
              <article key={p.name} className={`relative flex flex-col justify-end overflow-hidden p-6 ${p.span} ${p.tone}`}>
                <Sun className="absolute -right-10 -top-10 h-44 w-44 opacity-20" />
                <p className="text-sm font-semibold opacity-80">{p.kind}</p>
                <h3 className="text-2xl font-black leading-tight">{p.name}</h3>
              </article>
            ))}
          </div>
        </section>

        {/* Nosotros */}
        <section id="nosotros" className="bg-fog">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Soluciones integrales de construcción, con la calidad y el cumplimiento que su obra necesita.
            </h2>
            <div className="mt-14 grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="text-xl font-extrabold">Misión</h3>
                <p className="mt-2 max-w-md text-navy/80">
                  Brindar soluciones integrales de construcción, diseño y gestión de proyectos en Alta Verapaz,
                  garantizando calidad, cumplimiento de plazos y atención personalizada en cada etapa, apoyándonos
                  en tecnología, personal capacitado y equipo propio en óptimas condiciones.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-extrabold">Visión</h3>
                <p className="mt-2 max-w-md text-navy/80">
                  Ser la constructora de referencia en la región, reconocida por la calidad técnica de sus
                  proyectos, la eficiencia en la gestión de sus recursos y la confianza que genera en sus clientes.
                </p>
              </div>
            </div>
            <h3 className="mt-14 text-xl font-extrabold">Valores</h3>
            <ul className="mt-4 grid gap-x-10 gap-y-3 md:grid-cols-2">
              {VALUES.map((v) => (
                <li key={v} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="bg-navy text-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
            <div>
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">Cuéntenos de su proyecto</h2>
              <p className="mt-4 max-w-sm text-white/75">
                Le respondemos con una propuesta y los tiempos estimados. Sin compromiso.
              </p>
              <a href={wa} className={`${btn} mt-8 bg-sun text-navy hover:bg-white`}>
                <MessageCircle className="h-5 w-5" /> Escribir por WhatsApp
              </a>
            </div>
            <ul className="space-y-5 self-center text-lg">
              <li className="flex gap-4">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-sun" />
                {CONTACT.address}
              </li>
              <li className="flex gap-4">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-sun" />
                <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="hover:text-sun">
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex gap-4">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-sun" />
                <a href={`mailto:${CONTACT.email}`} className="hover:text-sun">
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="bg-navy">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-white/15 px-5 py-6 text-sm text-white/60">
          <Logo light />
          <p>© {new Date().getFullYear()} Constructora ATECA · Constru-Servicios y Soluciones Integrales</p>
        </div>
      </footer>
    </div>
  );
}