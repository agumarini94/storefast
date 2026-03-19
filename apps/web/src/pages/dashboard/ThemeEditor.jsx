import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDashboard } from '../../context/DashboardContext';
import ImageUpload from '../../components/ImageUpload';
import CatalogPreview from '../catalog/CatalogPreview';

const FONTS_PRO     = ['Inter', 'Montserrat', 'Poppins', 'Raleway', 'Lato', 'Roboto'];
const FONTS_DISPLAY = ['Playfair Display', 'Merriweather', 'Oswald', 'Roboto Slab'];
const FONTS_FUN     = ['Bangers', 'Luckiest Guy', 'Pacifico', 'Fredoka One', 'Righteous'];
const WORDART_FONTS = ['', ...FONTS_DISPLAY, ...FONTS_FUN];

const COLUMNS_OPTIONS = [
  { value: 1, label: '1 col'  },
  { value: 2, label: '2 cols' },
  { value: 3, label: '3 cols' },
  { value: 4, label: '4 cols' },
];

const NEON_PALETTE = [
  { name: 'Cyan',     value: '#00FFFF' },
  { name: 'Magenta',  value: '#FF00FF' },
  { name: 'Verde',    value: '#39FF14' },
  { name: 'Naranja',  value: '#FF6600' },
  { name: 'Azul',     value: '#0080FF' },
  { name: 'Amarillo', value: '#FFE600' },
  { name: 'Rojo',     value: '#FF0040' },
  { name: 'Violeta',  value: '#9400FF' },
  { name: 'Blanco',   value: '#FFFFFF' },
  { name: 'Sin color',value: ''        },
];

const TITLE_SIZES   = [
  { value: 'xs', label: 'XS' }, { value: 'sm', label: 'S' },
  { value: 'base', label: 'M' }, { value: 'lg', label: 'L' }, { value: 'xl', label: 'XL' },
];
const WORDART_EFFECTS = [
  { value: 'none',    label: 'Normal'      },
  { value: 'shadow',  label: '🌑 Sombra'  },
  { value: 'neon',    label: '⚡ Neón'     },
  { value: 'outline', label: '○ Contorno' },
  { value: '3d',      label: '🧊 3D'      },
];

const DEFAULT_THEME = {
  header_title:           '',        // '' = usar el storeName registrado
  primary_color:          '#3B82F6',
  secondary_color:        '#F9FAFB',
  font:                   'Inter',
  logo_url:               '',
  banner_url:             '',
  subtitle:               '',
  catalog_columns:        2,
  dark_mode:              false,
  language:               'es',
  title_size:             'base',
  title_text_color:       '',
  price_bg_color:         '',
  title_align:            'left',
  title_font_size:        'xl',
  header_bg_color:        '',
  header_text_color:      '#ffffff',
  show_title:             true,
  show_title_bg:          true,
  header_overlay_opacity: 100,
  banner_position_y:      50,
  logo_type:              'image',
  wordart_font:           '',
  wordart_effect:         'none',
  announcement_text:       '',
  announcement_dir:        'ltr',
  announcement_speed:      25,
  announcement_bg_color:   '',     // '' = hereda color del header
  announcement_text_color: '',     // '' = hereda texto del header
  announcement_neon:       false,
  announcement_separator:  'continuous',  // 'continuous' | 'spaced'
};

// Maps preview click zones → { section to open, input id to scroll into }
const ELEMENT_MAP = {
  banner:          { section: 'banner',   id: 'input-banner-url'        },
  header:          { section: 'header',   id: 'input-logo-type'         },
  announcement:    { section: 'marquee',  id: 'input-announcement-text' },
  'store-title':   { section: 'header',   id: 'input-header-title'      },
  subtitle:        { section: 'header',   id: 'input-subtitle'          },
  'primary-color': { section: 'catalogo', id: 'input-primary-color'     },
  columns:         { section: 'catalogo', id: 'input-catalog-columns'   },
  'product-title': { section: 'cards',    id: 'input-title-size'        },
  'product-price': { section: 'cards',    id: 'input-price-bg-color'    },
};

// ── Reusable sub-components ───────────────────────────────────────────────────

function Section({ id, title, icon, isOpen, onToggle, highlighted, children }) {
  return (
    <div
      id={`section-${id}`}
      className="rounded-xl border border-gray-200 overflow-hidden bg-white"
      style={highlighted ? { outline: '2px solid rgba(59,130,246,0.5)', outlineOffset: '2px', transition: 'outline 0.2s' } : {}}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
          <span>{icon}</span> {title}
        </span>
        <span className={`text-gray-400 text-xs transition-transform duration-200 inline-block ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-5 pt-3 space-y-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

function Toggle({ value, onChange, label, sub }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

const LBL = 'block text-xs font-semibold text-gray-500 mb-1';
const INP = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

// ── Main component ────────────────────────────────────────────────────────────

export default function ThemeEditor() {
  const { activeStore, authApi } = useDashboard();
  const [theme,            setTheme]           = useState(DEFAULT_THEME);
  const [saved,            setSaved]           = useState(false);
  const [openSections,     setOpenSections]    = useState(new Set(['header']));
  const [highlightId,      setHighlightId]     = useState(null);
  const [highlightSection, setHighlightSection]= useState(null);

  // Banner drag-to-reposition
  const bannerRef      = useRef(null);
  const bannerDragData = useRef(null);
  const [bannerDragging, setBannerDragging] = useState(false);

  const onBannerPointerDown = (e) => {
    setBannerDragging(true);
    bannerDragData.current = { y: e.clientY, pos: theme.banner_position_y ?? 50 };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const onBannerPointerMove = (e) => {
    if (!bannerDragData.current || !bannerRef.current) return;
    const deltaY   = e.clientY - bannerDragData.current.y;
    const height   = bannerRef.current.offsetHeight;
    const newPos   = Math.max(0, Math.min(100, bannerDragData.current.pos + (deltaY / height) * 100));
    setTheme(t => ({ ...t, banner_position_y: Math.round(newPos) }));
  };
  const onBannerPointerUp = () => { setBannerDragging(false); bannerDragData.current = null; };

  useEffect(() => {
    if (activeStore?.theme && Object.keys(activeStore.theme).length > 0) {
      setTheme({ ...DEFAULT_THEME, ...activeStore.theme });
    }
  }, [activeStore?.id]);

  const { data: previewProducts = [] } = useQuery({
    queryKey: ['preview-products', activeStore?.slug],
    queryFn: async () => {
      const { data } = await authApi().get(`/stores/${activeStore.slug}/products`);
      return data.slice(0, 8);
    },
    enabled: !!activeStore?.slug,
  });

  const saveMutation = useMutation({
    mutationFn: () => authApi().patch(`/stores/${activeStore.id}/theme`, theme),
    onSuccess:  () => { setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  const set = (key, value) => {
    setTheme(t => ({ ...t, [key]: value }));
    const root = document.documentElement;
    if (key === 'primary_color')   root.style.setProperty('--color-primary',   value);
    if (key === 'secondary_color') root.style.setProperty('--color-secondary', value);
    if (key === 'font')            root.style.setProperty('--font-main',        `'${value}'`);
  };

  const toggleSection = (id) => setOpenSections(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Click-to-scroll: opens section, scrolls to input, flashes highlight
  const handlePreviewClick = useCallback((elementKey) => {
    const target = ELEMENT_MAP[elementKey];
    if (!target) return;
    setOpenSections(prev => new Set([...prev, target.section]));
    setHighlightSection(target.section);
    setTimeout(() => setHighlightSection(null), 2000);
    setTimeout(() => {
      const el = document.getElementById(target.id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightId(target.id);
      setTimeout(() => setHighlightId(null), 2000);
    }, 120);
  }, []);

  const hlStyle = (id) => highlightId === id
    ? { outline: '2px solid #3B82F6', outlineOffset: '3px', borderRadius: '8px', transition: 'outline 0.2s' }
    : {};

  // Preview uses custom title if set
  const liveStore = {
    ...activeStore,
    name:    theme.header_title || activeStore?.name,
    theme,
    contact: activeStore?.contact || {},
  };

  const sec = (id) => ({
    id,
    isOpen:      openSections.has(id),
    onToggle:    () => toggleSection(id),
    highlighted: highlightSection === id,
  });

  return (
    <div className="flex h-full">

      {/* ── Controls panel ── */}
      <div className="w-full lg:w-[420px] lg:flex-shrink-0 flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden">

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Apariencia</h2>

          {/* ══════════════════════════════════════════════════════
              SECCIÓN: HEADER
          ══════════════════════════════════════════════════════ */}
          <Section {...sec('header')} title="Header" icon="🏷">

            {/* Título de la tienda */}
            <div id="input-header-title" style={hlStyle('input-header-title')}>
              <label className={LBL}>Título de la tienda</label>
              <input
                type="text"
                placeholder={activeStore?.name || 'Nombre de tu tienda'}
                value={theme.header_title || ''}
                onChange={e => set('header_title', e.target.value)}
                className={INP}
              />
              <p className="text-xs text-gray-400 mt-1">
                Vacío = usa el nombre registrado
                {activeStore?.name && <span className="font-mono text-gray-500"> ({activeStore.name})</span>}
              </p>
            </div>

            {/* Subtítulo */}
            <div id="input-subtitle" style={hlStyle('input-subtitle')}>
              <label className={LBL}>Subtítulo / Eslogan</label>
              <input
                type="text"
                placeholder="Ej: La mejor variedad del barrio"
                value={theme.subtitle || ''}
                onChange={e => set('subtitle', e.target.value)}
                className={INP}
              />
            </div>

            {/* Logo type */}
            <div id="input-logo-type" style={hlStyle('input-logo-type')}>
              <label className={LBL}>Tipo de logo</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[['image', '🖼️ Imagen'], ['text', '✍️ WordArt']].map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => set('logo_type', val)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                      theme.logo_type === val ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600'
                    }`}>
                    {lbl}
                  </button>
                ))}
              </div>
              {theme.logo_type !== 'text'
                ? <ImageUpload label="Imagen del logo" value={theme.logo_url} onChange={url => set('logo_url', url)} />
                : (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div>
                      <label className={LBL}>Fuente del nombre</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {WORDART_FONTS.map(f => (
                          <button key={f} type="button" onClick={() => set('wordart_font', f)}
                            style={{ fontFamily: f || undefined }}
                            className={`py-2 px-2 rounded-lg text-xs border transition-colors ${
                              theme.wordart_font === f ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-gray-200 text-gray-700'
                            }`}>
                            {f || 'Por defecto'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={LBL}>Efecto</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {WORDART_EFFECTS.map(e => (
                          <button key={e.value} type="button" onClick={() => set('wordart_effect', e.value)}
                            className={`py-2 rounded-lg text-xs border transition-colors ${
                              theme.wordart_effect === e.value ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-gray-200 text-gray-600'
                            }`}>
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              }
            </div>

            {/* Header colors */}
            <div className="grid grid-cols-2 gap-3">
              {/* Fondo — solo relevante cuando la franja de color está activa */}
              <div className={theme.show_title_bg === false ? 'opacity-40 pointer-events-none' : ''}>
                <label className={LBL}>
                  Fondo del header
                  {theme.show_title_bg === false && <span className="ml-1 text-gray-300">(franja oculta)</span>}
                </label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.header_bg_color || theme.primary_color}
                    onChange={e => set('header_bg_color', e.target.value)}
                    disabled={theme.show_title_bg === false}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 flex-shrink-0 disabled:cursor-not-allowed" />
                  <div className="min-w-0">
                    <span className="text-xs text-gray-400 font-mono block truncate">{theme.header_bg_color || '= principal'}</span>
                    {theme.header_bg_color && theme.show_title_bg !== false && (
                      <button type="button" onClick={() => set('header_bg_color', '')} className="text-xs text-gray-400 hover:text-red-400">✕ Reset</button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className={LBL}>Texto del header</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.header_text_color || '#ffffff'}
                    onChange={e => set('header_text_color', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 flex-shrink-0" />
                  <span className="text-xs text-gray-400 font-mono">{theme.header_text_color}</span>
                </div>
              </div>
            </div>

            {/* Title size + align */}
            <div id="input-title-font-size" style={hlStyle('input-title-font-size')} className="space-y-3">
              <div>
                <label className={LBL}>Tamaño del nombre</label>
                <div className="flex gap-1.5">
                  {[['sm','S'],['base','M'],['lg','L'],['xl','XL'],['2xl','2XL']].map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => set('title_font_size', val)}
                      className={`flex-1 py-2 rounded-lg border-2 font-bold text-xs transition-colors ${
                        theme.title_font_size === val ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600'
                      }`}>{lbl}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={LBL}>Alineación del nombre</label>
                <div className="flex gap-2">
                  {[['left','⬅ Izq'],['center','↔ Centro'],['right','Der ➡']].map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => set('title_align', val)}
                      className={`flex-1 py-2 text-xs rounded-lg border-2 transition-colors ${
                        theme.title_align === val ? 'border-primary bg-primary text-white font-bold' : 'border-gray-200 text-gray-600'
                      }`}>{lbl}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Show title / bg */}
            <div className="space-y-3">
              <Toggle value={theme.show_title !== false} onChange={v => set('show_title', v)}
                label="Mostrar Título sobre el Banner"
                sub="Desactivar oculta el texto del nombre" />
              <Toggle value={theme.show_title_bg !== false} onChange={v => set('show_title_bg', v)}
                label="Mostrar franja de color"
                sub={theme.show_title_bg !== false ? 'El título tiene fondo de color' : 'El título flota sobre el banner sin fondo'} />
            </div>

            {/* Mini header live preview */}
            <div className="rounded-xl overflow-hidden border border-gray-100 mt-1">
              <div className="relative px-3 py-3 flex items-center gap-2 overflow-hidden">
                {theme.banner_url && <img src={theme.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <div className="absolute inset-0" style={{
                  backgroundColor: theme.header_bg_color || theme.primary_color,
                  opacity: (theme.header_overlay_opacity ?? 100) / 100,
                }} />
                {theme.logo_type !== 'text' && theme.logo_url && (
                  <img src={theme.logo_url} alt="" className="relative z-10 w-8 h-8 rounded-full object-cover ring-2 ring-white/30 shrink-0" />
                )}
                <div className="relative z-10 flex-1 min-w-0" style={{ textAlign: theme.title_align || 'left' }}>
                  <p className="font-bold truncate" style={{ color: theme.header_text_color || '#ffffff', fontFamily: theme.wordart_font || undefined }}>
                    {theme.header_title || activeStore?.name || 'Mi Tienda'}
                  </p>
                  {theme.subtitle && (
                    <p className="text-xs truncate" style={{ color: (theme.header_text_color || '#ffffff') + 'bb' }}>{theme.subtitle}</p>
                  )}
                </div>
              </div>
            </div>

          </Section>

          {/* ══════════════════════════════════════════════════════
              SECCIÓN: BANNER
          ══════════════════════════════════════════════════════ */}
          <Section {...sec('banner')} title="Banner de portada" icon="🖼️">

            <div id="input-banner-url" style={hlStyle('input-banner-url')}>
              <ImageUpload label="Imagen del banner" value={theme.banner_url}
                onChange={url => set('banner_url', url)} />
            </div>

            {/* Opacity slider — visible whether or not banner exists, affects the color overlay */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={LBL}>Opacidad de la Imagen de Portada</label>
                <span className="text-xs font-mono text-primary">{theme.header_overlay_opacity ?? 100}%</span>
              </div>
              <input type="range" min={0} max={100} step={5}
                value={theme.header_overlay_opacity ?? 100}
                onChange={e => set('header_overlay_opacity', Number(e.target.value))}
                className="w-full accent-primary" />
              <p className="text-xs text-gray-400 mt-0.5">0% = más imagen visible · 100% = fondo sólido</p>
            </div>

            {theme.banner_url && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={LBL}>Posición Vertical de la Imagen</label>
                  <span className="text-xs text-gray-400 font-mono">{theme.banner_position_y ?? 50}%</span>
                </div>
                <div
                  ref={bannerRef}
                  className={`relative h-28 overflow-hidden rounded-xl select-none touch-none ${bannerDragging ? 'cursor-grabbing ring-2 ring-primary' : 'cursor-ns-resize'}`}
                  onPointerDown={onBannerPointerDown}
                  onPointerMove={onBannerPointerMove}
                  onPointerUp={onBannerPointerUp}
                  onPointerCancel={onBannerPointerUp}
                >
                  <img src={theme.banner_url}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{ objectPosition: `center ${theme.banner_position_y ?? 50}%` }}
                    draggable={false} alt="" />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none">
                    <span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
                      {bannerDragging ? 'Soltá para confirmar' : '↕ Arrastrá para reencuadrar'}
                    </span>
                  </div>
                </div>
                <input type="range" min={0} max={100} step={1}
                  value={theme.banner_position_y ?? 50}
                  onChange={e => set('banner_position_y', Number(e.target.value))}
                  className="w-full mt-2 accent-primary" />
              </div>
            )}

          </Section>

          {/* ══════════════════════════════════════════════════════
              SECCIÓN: MARQUESINA
          ══════════════════════════════════════════════════════ */}
          <Section {...sec('marquee')} title="Marquesina" icon="📢">

            <div>
              <label className={LBL}>Texto animado en el header</label>
              <p className="text-xs text-gray-400 mb-2">Viaja sobre la franja. Vacío = solo muestra el título.</p>
              <textarea
                id="input-announcement-text"
                style={hlStyle('input-announcement-text')}
                rows={2}
                placeholder="Ej: ✨ Envíos gratis  •  10% OFF primera compra  •  Nuevos modelos"
                value={theme.announcement_text}
                onChange={e => set('announcement_text', e.target.value)}
                className={`${INP} resize-none`}
              />
            </div>

            {theme.announcement_text && (
              <>
                {/* Direction */}
                <div>
                  <label className={LBL}>Dirección</label>
                  <div className="flex gap-2">
                    {[['ltr','← Der. a Izq.'],['rtl','Izq. a Der. →']].map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => set('announcement_dir', val)}
                        className={`flex-1 py-2 text-xs rounded-lg border-2 transition-colors ${
                          theme.announcement_dir === val ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-gray-200 text-gray-600'
                        }`}>{lbl}</button>
                    ))}
                  </div>
                </div>

                {/* Speed */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={LBL}>Velocidad</label>
                    <span className="text-xs font-mono text-primary">{theme.announcement_speed ?? 25}s/vuelta</span>
                  </div>
                  <input type="range" min={8} max={60} step={1}
                    value={theme.announcement_speed ?? 25}
                    onChange={e => set('announcement_speed', Number(e.target.value))}
                    className="w-full accent-primary" />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>Rápido</span><span>Lento</span></div>
                </div>

                {/* Separator mode */}
                <div>
                  <label className={LBL}>Estilo de separación</label>
                  <div className="flex gap-2">
                    {[
                      ['continuous', '→ Texto corrido',    'Todo junto, flujo continuo'],
                      ['spaced',     '•  Frases separadas','Espacios amplios entre •'],
                    ].map(([val, lbl, tip]) => (
                      <button key={val} type="button" title={tip} onClick={() => set('announcement_separator', val)}
                        className={`flex-1 py-2 text-xs rounded-lg border-2 transition-colors ${
                          (theme.announcement_separator || 'continuous') === val
                            ? 'border-primary bg-primary/10 text-primary font-bold'
                            : 'border-gray-200 text-gray-600'
                        }`}>{lbl}</button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LBL}>Fondo <span className="text-gray-400">(vacío = header)</span></label>
                    <div className="flex items-center gap-2">
                      <input type="color"
                        value={theme.announcement_bg_color || theme.header_bg_color || theme.primary_color}
                        onChange={e => set('announcement_bg_color', e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs text-gray-400 font-mono block truncate">{theme.announcement_bg_color || '= header'}</span>
                        {theme.announcement_bg_color && (
                          <button type="button" onClick={() => set('announcement_bg_color', '')} className="text-xs text-gray-400 hover:text-red-400">✕ Reset</button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={LBL}>Texto <span className="text-gray-400">(vacío = header)</span></label>
                    <div className="flex items-center gap-2">
                      <input type="color"
                        value={theme.announcement_text_color || theme.header_text_color || '#ffffff'}
                        onChange={e => set('announcement_text_color', e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs text-gray-400 font-mono block truncate">{theme.announcement_text_color || '= header'}</span>
                        {theme.announcement_text_color && (
                          <button type="button" onClick={() => set('announcement_text_color', '')} className="text-xs text-gray-400 hover:text-red-400">✕ Reset</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Neon mode */}
                <Toggle
                  value={theme.announcement_neon === true}
                  onChange={v => set('announcement_neon', v)}
                  label="⚡ Modo Neón"
                  sub="Efecto de resplandor sobre el texto"
                />

                {/* Live mini preview */}
                <div className="overflow-hidden rounded-lg py-2"
                  style={{ backgroundColor: theme.announcement_bg_color || theme.header_bg_color || theme.primary_color }}>
                  <span
                    className={`inline-block whitespace-nowrap text-xs font-semibold px-4 ${
                      theme.announcement_dir === 'rtl' ? 'animate-marquee-rtl' : 'animate-marquee'
                    }`}
                    style={{
                      color: theme.announcement_text_color || theme.header_text_color || '#ffffff',
                      ...(theme.announcement_neon ? { textShadow: '0 0 6px currentColor, 0 0 14px currentColor, 0 0 28px currentColor' } : {}),
                    }}
                  >
                    {theme.announcement_text}
                  </span>
                </div>
              </>
            )}

          </Section>

          {/* ══════════════════════════════════════════════════════
              SECCIÓN: CATÁLOGO
          ══════════════════════════════════════════════════════ */}
          <Section {...sec('catalogo')} title="Cuerpo del Catálogo" icon="🛍️">

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <div id="input-primary-color" style={hlStyle('input-primary-color')}>
                <label className={LBL}>Color principal</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.primary_color}
                    onChange={e => set('primary_color', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 flex-shrink-0" />
                  <span className="text-xs text-gray-400 font-mono truncate">{theme.primary_color}</span>
                </div>
              </div>
              <div id="input-secondary-color" style={hlStyle('input-secondary-color')}>
                <label className={LBL}>Fondo de la página</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.secondary_color}
                    onChange={e => set('secondary_color', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 flex-shrink-0" />
                  <span className="text-xs text-gray-400 font-mono truncate">{theme.secondary_color}</span>
                </div>
              </div>
            </div>

            {/* Font */}
            <div>
              <label className={LBL}>Tipografía</label>
              {[
                { label: 'Profesionales',    fonts: FONTS_PRO     },
                { label: 'Display/Editorial',fonts: FONTS_DISPLAY },
                { label: 'Divertidas',       fonts: FONTS_FUN     },
              ].map(group => (
                <div key={group.label} className="mb-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{group.label}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.fonts.map(font => (
                      <button key={font} type="button" onClick={() => set('font', font)}
                        className={`py-2.5 px-3 rounded-lg text-sm border transition-colors ${
                          theme.font === font ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-700'
                        }`}
                        style={{ fontFamily: `'${font}', sans-serif` }}>{font}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Columns */}
            <div id="input-catalog-columns" style={hlStyle('input-catalog-columns')}>
              <label className={LBL}>Productos por fila</label>
              <div className="grid grid-cols-4 gap-2">
                {COLUMNS_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => set('catalog_columns', opt.value)}
                    className={`flex flex-col items-center p-2 rounded-xl border-2 transition-colors gap-1 ${
                      theme.catalog_columns === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}>
                    <div className="flex gap-0.5 h-5 items-end">
                      {Array.from({ length: opt.value }).map((_, i) => (
                        <div key={i} className={`rounded-sm flex-1 ${theme.catalog_columns === opt.value ? 'bg-primary/50' : 'bg-gray-200'}`}
                          style={{ minWidth: 5 }} />
                      ))}
                    </div>
                    <span className={`text-xs font-bold ${theme.catalog_columns === opt.value ? 'text-primary' : 'text-gray-500'}`}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </Section>

          {/* ══════════════════════════════════════════════════════
              SECCIÓN: TARJETAS
          ══════════════════════════════════════════════════════ */}
          <Section {...sec('cards')} title="Tarjetas de productos" icon="🃏">

            <div id="input-title-size" style={hlStyle('input-title-size')}>
              <label className={LBL}>Tamaño del título del producto</label>
              <div className="flex gap-2">
                {TITLE_SIZES.map(s => (
                  <button key={s.value} type="button" onClick={() => set('title_size', s.value)}
                    className={`flex-1 py-2 rounded-lg border-2 font-bold transition-colors ${
                      theme.title_size === s.value ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600'
                    }`}
                    style={{ fontSize: { xs: 10, sm: 11, base: 13, lg: 15, xl: 17 }[s.value] }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {[
              {
                key: 'title_text_color',
                label: 'Color del nombre del producto',
                tip: 'Color neón sobre el título de cada tarjeta. Vacío = color por defecto.',
                preview: (v) => <span className="text-sm font-bold" style={{ color: v }}>Nombre producto</span>,
              },
              {
                key: 'price_bg_color',
                label: 'Color de fondo del precio',
                tip: 'Vacío = precio naranja por defecto.',
                preview: (v) => <span className="text-sm font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: v, color: '#000', boxShadow: `0 0 8px ${v}` }}>₪1.500</span>,
              },
            ].map(({ key, label, tip, preview }) => (
              <div key={key} id={`input-${key.replace(/_/g, '-')}`} style={hlStyle(`input-${key.replace(/_/g, '-')}`)}>
                <label className={LBL} title={tip}>{label} <span className="opacity-50 cursor-help">ⓘ</span></label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {NEON_PALETTE.map(color => (
                    <button key={color.value} type="button" onClick={() => set(key, color.value)}
                      title={color.name}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        theme[key] === color.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value || '#e5e7eb', boxShadow: color.value ? `0 0 8px ${color.value}80` : 'none' }} />
                  ))}
                  <input type="color" value={theme[key] || '#000000'}
                    onChange={e => set(key, e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer border-2 border-dashed border-gray-400 p-0"
                    title="Color personalizado" />
                </div>
                {theme[key] && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: key === 'price_bg_color' ? theme[key] : 'transparent', boxShadow: `0 0 10px ${theme[key]}60` }}>
                    {preview(theme[key])}
                  </div>
                )}
              </div>
            ))}

          </Section>
        </div>

        {/* ── Sticky save button ── */}
        <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60 transition-opacity shadow-sm"
          >
            {saved ? '✅ ¡Guardado!' : saveMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* ── Live Preview panel (right, desktop only) ── */}
      <div className="hidden lg:flex flex-1 bg-gray-200 items-start justify-center overflow-y-auto p-4">
        <div className="rounded-2xl shadow-2xl overflow-hidden bg-white" style={{ width: 480, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <div className="bg-gray-900 px-4 py-1.5 flex items-center justify-between">
            <span className="text-gray-400 text-xs font-mono">Vista previa en vivo</span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
          </div>
          <CatalogPreview theme={theme} store={liveStore} products={previewProducts} onElementClick={handlePreviewClick} />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <p className="text-xs text-gray-400 bg-white/80 px-3 py-1 rounded-full shadow-sm">
            ✏️ Clic en cualquier elemento para editarlo
          </p>
        </div>
      </div>

    </div>
  );
}
