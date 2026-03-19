import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Constants ─────────────────────────────────────────────────────────────────
const today       = new Date().toISOString().slice(0, 10);
const DEMO_BASE   = 'storesfast.com/tienda';
const PLAN_PRICE  = { basico: 0, premium: 25 };

// ── Mock: tiendas activas ─────────────────────────────────────────────────────
const MOCK_STORES = [
  { id: 1,  storeName: 'Accesorios Luna',    slug: 'accesorios-luna',   ownerEmail: 'luna@gmail.com',        status: 'online',        productCount: 48,  whatsapp: '541145678901', plan: 'premium', paymentDue: '2026-03-20', createdAt: today },
  { id: 2,  storeName: 'Ropa Moderna',       slug: 'ropa-moderna',      ownerEmail: 'modas@hotmail.com',     status: 'online',        productCount: 132, whatsapp: '541123456789', plan: 'premium', paymentDue: '2026-04-02', createdAt: today },
  { id: 3,  storeName: 'TechZone',           slug: 'techzone',          ownerEmail: 'tech@gmail.com',        status: 'offline',       productCount: 23,  whatsapp: '541199887766', plan: 'basico',  paymentDue: '2026-03-19', createdAt: '2026-03-15' },
  { id: 4,  storeName: 'Ferretería Norte',   slug: 'ferreteria-norte',  ownerEmail: 'ferretnorte@yahoo.com', status: 'mantenimiento', productCount: 87,  whatsapp: '',             plan: 'premium', paymentDue: '2026-04-10', createdAt: '2026-03-10' },
  { id: 5,  storeName: 'Librería del Sur',   slug: 'libreria-sur',      ownerEmail: 'libros@gmail.com',      status: 'online',        productCount: 215, whatsapp: '541155443322', plan: 'premium', paymentDue: '2026-03-22', createdAt: '2026-03-05' },
  { id: 6,  storeName: 'Calzados Pérez',     slug: 'calzados-perez',    ownerEmail: 'perez@gmail.com',       status: 'online',        productCount: 67,  whatsapp: '541166554433', plan: 'basico',  paymentDue: '2026-04-15', createdAt: '2026-02-28' },
  { id: 7,  storeName: 'Dietética Natural',  slug: 'dietetica-natural', ownerEmail: 'natural@outlook.com',   status: 'offline',       productCount: 0,   whatsapp: '',             plan: 'basico',  paymentDue: '2026-03-25', createdAt: '2026-02-20' },
  { id: 8,  storeName: 'Electro Hogar',      slug: 'electro-hogar',     ownerEmail: 'elechogar@gmail.com',   status: 'online',        productCount: 156, whatsapp: '541188776655', plan: 'premium', paymentDue: '2026-04-18', createdAt: today },
  { id: 9,  storeName: 'Joyería Éxodo',      slug: 'joyeria-exodo',     ownerEmail: 'exodo@icloud.com',      status: 'online',        productCount: 34,  whatsapp: '541177665544', plan: 'premium', paymentDue: '2026-03-21', createdAt: '2026-03-12' },
  { id: 10, storeName: 'Muebles Kraft',      slug: 'muebles-kraft',     ownerEmail: 'kraft@empresa.com',     status: 'mantenimiento', productCount: 52,  whatsapp: '541133221100', plan: 'basico',  paymentDue: '2026-04-05', createdAt: '2026-03-01' },
];

// ── Mock: prospectos (Google Maps) ────────────────────────────────────────────
const MOCK_LEADS = [
  { id: 1,  businessName: 'Fiambrería Don Alberto',  category: 'Fiambrería',  whatsapp: '541155667788', saleStatus: 'interesado',         demoSlug: 'demo-fiambreria'  },
  { id: 2,  businessName: 'Kiosco El Rincón',        category: 'Kiosco',      whatsapp: '541144332211', saleStatus: 'invitacion_enviada', demoSlug: 'demo-kiosco'      },
  { id: 3,  businessName: 'Carnicería Los Primos',   category: 'Carnicería',  whatsapp: '541177889900', saleStatus: 'no_contactado',      demoSlug: 'demo-carniceria'  },
  { id: 4,  businessName: 'Panadería La Espiga',     category: 'Panadería',   whatsapp: '541122334455', saleStatus: 'interesado',         demoSlug: 'demo-panaderia'   },
  { id: 5,  businessName: 'Verdulería El Huerto',    category: 'Verdulería',  whatsapp: '541199001122', saleStatus: 'no_contactado',      demoSlug: 'demo-verduleria'  },
  { id: 6,  businessName: 'Farmacia Central',        category: 'Farmacia',    whatsapp: '541166778899', saleStatus: 'invitacion_enviada', demoSlug: 'demo-farmacia'    },
  { id: 7,  businessName: 'Heladería La Crema',      category: 'Heladería',   whatsapp: '',             saleStatus: 'no_contactado',      demoSlug: 'demo-heladeria'   },
  { id: 8,  businessName: 'Pet Shop Mascotas Feliz', category: 'Veterinaria', whatsapp: '541133445566', saleStatus: 'interesado',         demoSlug: 'demo-petshop'     },
  { id: 9,  businessName: 'Relojería Swiss Look',    category: 'Relojería',   whatsapp: '541188990011', saleStatus: 'no_contactado',      demoSlug: 'demo-relojeria'   },
  { id: 10, businessName: 'Bazar Todo Hogar',        category: 'Bazar',       whatsapp: '541122110033', saleStatus: 'invitacion_enviada', demoSlug: 'demo-bazar'       },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysUntilDue(dateStr) {
  const due = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((due - now) / (1000 * 60 * 60 * 24));
}

function buildInviteLink(businessName, demoSlug, whatsapp) {
  const msg = encodeURIComponent(
    `Hola ${businessName}! Vi tu negocio en Google Maps y me encantó. ` +
    `Te armé un boceto rápido de cómo se vería tu catálogo online en StoresFast: ` +
    `${DEMO_BASE}/${demoSlug} ` +
    `¿Te gustaría probarlo gratis?`
  );
  return `https://wa.me/${whatsapp}?text=${msg}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const STORE_STATUS = {
  online:        { dot: 'bg-emerald-400', badge: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20', label: 'Online' },
  offline:       { dot: 'bg-red-400',     badge: 'bg-red-400/10     text-red-400     ring-red-400/20',     label: 'Offline' },
  mantenimiento: { dot: 'bg-yellow-400',  badge: 'bg-yellow-400/10  text-yellow-400  ring-yellow-400/20',  label: 'Mantenimiento' },
  pausado:       { dot: 'bg-orange-400',  badge: 'bg-orange-400/10  text-orange-400  ring-orange-400/20',  label: 'Pausado' },
};

const LEAD_STATUS = {
  no_contactado:      { dot: 'bg-gray-500',    badge: 'bg-gray-500/10    text-gray-400    ring-gray-500/20',    label: 'No contactado'     },
  invitacion_enviada: { dot: 'bg-blue-400',    badge: 'bg-blue-400/10    text-blue-400    ring-blue-400/20',    label: 'Invitación enviada' },
  interesado:         { dot: 'bg-emerald-400', badge: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20', label: 'Interesado 🔥'     },
};

const PLAN_BADGE = {
  premium: 'bg-purple-500/15 text-purple-300 ring-purple-500/25',
  basico:  'bg-gray-500/15   text-gray-400   ring-gray-500/25',
};

function Badge({ cfg, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {label || cfg.label}
    </span>
  );
}

function PlanBadge({ plan }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${PLAN_BADGE[plan]}`}>
      {plan === 'premium' ? '⭐ Premium' : 'Básico'}
    </span>
  );
}

function PaymentDueCell({ dateStr }) {
  const days = daysUntilDue(dateStr);
  if (days < 0) return (
    <span className="text-red-500 font-bold text-xs">Vencido</span>
  );
  if (days <= 5) return (
    <div>
      <span className="text-red-400 font-bold text-xs">{dateStr}</span>
      <p className="text-red-500 font-bold text-[10px]">⚠ {days === 0 ? 'Hoy' : `${days}d`}</p>
    </div>
  );
  return <span className="text-gray-400 text-xs">{dateStr}</span>;
}

function PauseSwitch({ paused, onChange }) {
  return (
    <button type="button" onClick={onChange}
      title={paused ? 'Reactivar tienda' : 'Pausar tienda'}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        paused ? 'bg-orange-500' : 'bg-gray-600 hover:bg-gray-500'
      }`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
        paused ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

function MetricCard({ label, value, sub, accent, icon }) {
  const glow = { blue: 'bg-blue-500', green: 'bg-emerald-500', purple: 'bg-purple-500', amber: 'bg-amber-500', rose: 'bg-rose-500' };
  const text = { blue: 'text-blue-400', green: 'text-emerald-400', purple: 'text-purple-400', amber: 'text-amber-400', rose: 'text-rose-400' };
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className={`absolute -top-5 -right-5 w-24 h-24 rounded-full blur-2xl opacity-15 ${glow[accent]}`} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
        {icon && <span className="text-lg opacity-60">{icon}</span>}
      </div>
      <p className={`text-3xl font-bold ${text[accent]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1.5">{sub}</p>}
    </div>
  );
}

const WA_ICON = (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const EXT_ICON = (
  <svg className="inline-block ml-1 w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

function SectionDivider({ title, count }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-gray-300">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
    </div>
  );
}

function TableShell({ headerLabel, countFiltered, countTotal, footer, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
        <h2 className="text-sm font-semibold text-gray-200">{headerLabel}</h2>
        <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-full">
          {countFiltered} / {countTotal}
        </span>
      </div>
      <div className="overflow-x-auto">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}

const TH = ({ children }) => (
  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
    {children}
  </th>
);

// ── Main component ────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [search,       setSearch]       = useState('');
  const [pausedIds,    setPausedIds]    = useState(new Set());
  const [leadStatuses, setLeadStatuses] = useState(
    () => Object.fromEntries(MOCK_LEADS.map(l => [l.id, l.saleStatus]))
  );
  const [lang, setLang] = useState('ES');

  // ── Actions ─────────────────────────────────────────────────────────────────
  const togglePause = (id) => setPausedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const sendInvite = (lead) => {
    if (!lead.whatsapp) return;
    window.open(buildInviteLink(lead.businessName, lead.demoSlug, lead.whatsapp), '_blank');
    if (leadStatuses[lead.id] === 'no_contactado') {
      setLeadStatuses(prev => ({ ...prev, [lead.id]: 'invitacion_enviada' }));
    }
  };

  const markInterested = (id) =>
    setLeadStatuses(prev => ({ ...prev, [id]: 'interesado' }));

  // ── Filtered (cross-table) ───────────────────────────────────────────────────
  const q = search.toLowerCase().trim();

  const filteredStores = useMemo(() => {
    if (!q) return MOCK_STORES;
    return MOCK_STORES.filter(s =>
      s.storeName.toLowerCase().includes(q) ||
      s.ownerEmail.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q)
    );
  }, [q]);

  const filteredLeads = useMemo(() => {
    if (!q) return MOCK_LEADS;
    return MOCK_LEADS.filter(l =>
      l.businessName.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q)
    );
  }, [q]);

  // ── Metrics ──────────────────────────────────────────────────────────────────
  const totalOnline    = MOCK_STORES.filter(s => !pausedIds.has(s.id) && s.status === 'online').length;
  const totalProducts  = MOCK_STORES.reduce((sum, s) => sum + s.productCount, 0);
  const hotLeads       = Object.values(leadStatuses).filter(st => st === 'interesado').length;
  const premiumCount   = MOCK_STORES.filter(s => s.plan === 'premium' && !pausedIds.has(s.id)).length;
  const estimatedMRR   = premiumCount * PLAN_PRICE.premium;
  const newToday       = MOCK_STORES.filter(s => s.createdAt === today).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-gray-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold select-none">
              S
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight">StoresFast</p>
              <p className="text-[10px] text-gray-400 leading-tight">Super Admin · Control Panel</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Filtrar tiendas y prospectos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs">
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigate('/admin/prospector-map')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-400 transition-colors">
              <span>📍</span>
              <span className="hidden sm:inline">Prospector Map</span>
            </button>
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none cursor-pointer">
              {['ES', 'EN', 'HE'].map(l => (
                <option key={l} value={l} className="bg-gray-900">{l}</option>
              ))}
            </select>
            <button onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" />
              </svg>
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page title */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Control</h1>
            <p className="text-sm text-gray-400 mt-1">
              {MOCK_STORES.length} tiendas · {MOCK_LEADS.length} prospectos · mock data
            </p>
          </div>
          <span className="hidden sm:inline-flex text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-full font-mono">
            DEV · MOCK ONLY
          </span>
        </div>

        {/* ── Metrics row 1 ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Total tiendas"     value={MOCK_STORES.length} sub={`${pausedIds.size} pausadas`}           accent="blue"   icon="🏪" />
          <MetricCard label="Tiendas online"    value={totalOnline}        sub={`de ${MOCK_STORES.length} registradas`} accent="green"  icon="🟢" />
          <MetricCard label="Total productos"   value={totalProducts.toLocaleString()} sub="en la plataforma"           accent="purple" icon="📦" />
          <MetricCard label="Nuevos hoy"        value={newToday}           sub={today}                                  accent="amber"  icon="🆕" />
          <MetricCard label="Leads calientes"   value={hotLeads}           sub="prospectos interesados"                 accent="rose"   icon="🔥" />
          <MetricCard label="Ingresos est. MRR" value={`$${estimatedMRR}`} sub={`${premiumCount} planes Premium`}       accent="amber"  icon="💰" />
        </div>

        {/* ══════════════════════════════════════════════════════
            TABLA 1: TIENDAS ACTIVAS
        ══════════════════════════════════════════════════════ */}
        <SectionDivider title="Tiendas activas" count={filteredStores.length} />

        <TableShell
          headerLabel={
            <>
              Gestión de tiendas
              {search && <span className="ml-2 text-xs font-normal text-gray-400">· "{search}"</span>}
            </>
          }
          countFiltered={filteredStores.length}
          countTotal={MOCK_STORES.length}
          footer={
            <>
              <span>{pausedIds.size > 0 ? `${pausedIds.size} tienda(s) pausada(s)` : 'Todos activos'}</span>
              <span className="text-yellow-500/70">mock · sin BD</span>
            </>
          }
        >
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="border-b border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <TH>Tienda</TH>
                <TH>Dueño</TH>
                <TH>Plan</TH>
                <TH>Vencimiento</TH>
                <TH>Estado</TH>
                <TH>Stock</TH>
                <TH>Contacto</TH>
                <TH>Pausar</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    <div className="text-3xl mb-2">🔍</div>
                    <p>Sin resultados para "{search}"</p>
                  </td>
                </tr>
              ) : filteredStores.map(store => {
                const paused = pausedIds.has(store.id);
                const status = paused ? 'pausado' : store.status;
                return (
                  <tr key={store.id}
                    className={`transition-colors hover:bg-white/[0.03] ${paused ? 'opacity-55' : ''}`}>

                    {/* Tienda */}
                    <td className="px-5 py-4 min-w-[180px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-xs font-bold text-blue-300 shrink-0">
                          {store.storeName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <a href={`/tienda/${store.slug}`} target="_blank" rel="noopener noreferrer"
                            className="font-semibold text-white hover:text-blue-400 transition-colors block truncate">
                            {store.storeName}{EXT_ICON}
                          </a>
                          <span className="text-[11px] text-gray-500 font-mono">/{store.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* Dueño */}
                    <td className="px-5 py-4">
                      <span className="text-gray-300 text-sm">{store.ownerEmail}</span>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-4">
                      <PlanBadge plan={store.plan} />
                    </td>

                    {/* Vencimiento */}
                    <td className="px-5 py-4">
                      <PaymentDueCell dateStr={store.paymentDue} />
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4">
                      <Badge cfg={STORE_STATUS[status]} />
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-4 text-center">
                      <span className={`font-semibold ${store.productCount === 0 ? 'text-gray-600' : 'text-gray-200'}`}>
                        {store.productCount}
                      </span>
                    </td>

                    {/* Contacto WA */}
                    <td className="px-5 py-4">
                      {store.whatsapp ? (
                        <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors">
                          {WA_ICON} WA
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600 italic">—</span>
                      )}
                    </td>

                    {/* Pausar */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <PauseSwitch paused={paused} onChange={() => togglePause(store.id)} />
                        {paused && <span className="text-xs text-orange-400 font-medium whitespace-nowrap">Pausada</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>

        {/* ══════════════════════════════════════════════════════
            TABLA 2: CRM PROSPECCIÓN (GOOGLE MAPS)
        ══════════════════════════════════════════════════════ */}
        <SectionDivider title="Prospección de Clientes (Google Maps)" count={filteredLeads.length} />

        <TableShell
          headerLabel={
            <>
              CRM · Prospectos
              {search && <span className="ml-2 text-xs font-normal text-gray-400">· "{search}"</span>}
            </>
          }
          countFiltered={filteredLeads.length}
          countTotal={MOCK_LEADS.length}
          footer={
            <>
              <span>
                {Object.values(leadStatuses).filter(s => s === 'interesado').length} interesados ·
                {' '}{Object.values(leadStatuses).filter(s => s === 'invitacion_enviada').length} invitados ·
                {' '}{Object.values(leadStatuses).filter(s => s === 'no_contactado').length} sin contactar
              </span>
              <span className="text-yellow-500/70">mock · sin BD</span>
            </>
          }
        >
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <TH>Negocio</TH>
                <TH>Rubro</TH>
                <TH>WhatsApp</TH>
                <TH>Estado de venta</TH>
                <TH>Invitación</TH>
                <TH>Acción rápida</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    <div className="text-3xl mb-2">🗺️</div>
                    <p>Sin prospectos para "{search}"</p>
                  </td>
                </tr>
              ) : filteredLeads.map(lead => {
                const status = leadStatuses[lead.id] || lead.saleStatus;
                const cfg    = LEAD_STATUS[status] || LEAD_STATUS.no_contactado;
                return (
                  <tr key={lead.id}
                    className={`transition-colors hover:bg-white/[0.03] ${status === 'interesado' ? 'bg-emerald-500/[0.03]' : ''}`}>

                    {/* Negocio */}
                    <td className="px-5 py-4 min-w-[180px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
                          {lead.businessName.charAt(0)}
                        </div>
                        <span className="font-semibold text-white">{lead.businessName}</span>
                      </div>
                    </td>

                    {/* Rubro */}
                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/8">
                        {lead.category}
                      </span>
                    </td>

                    {/* WhatsApp */}
                    <td className="px-5 py-4">
                      {lead.whatsapp
                        ? <span className="text-xs font-mono text-gray-400">+{lead.whatsapp}</span>
                        : <span className="text-xs text-gray-600 italic">Sin número</span>
                      }
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4">
                      <Badge cfg={cfg} />
                    </td>

                    {/* Enviar invitación WA */}
                    <td className="px-5 py-4">
                      {lead.whatsapp ? (
                        <button
                          type="button"
                          onClick={() => sendInvite(lead)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            status === 'interesado'
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/25'
                              : status === 'invitacion_enviada'
                              ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20'
                              : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                          }`}
                        >
                          {WA_ICON}
                          {status === 'invitacion_enviada' ? 'Reenviar' : status === 'interesado' ? 'Seguir' : 'Invitar'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600 italic">—</span>
                      )}
                    </td>

                    {/* Acción rápida: marcar como interesado */}
                    <td className="px-5 py-4">
                      {status !== 'interesado' ? (
                        <button
                          type="button"
                          onClick={() => markInterested(lead.id)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        >
                          🔥 Interesado
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-500 font-semibold">✓ Lead caliente</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>

      </main>
    </div>
  );
}
