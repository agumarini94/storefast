import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDashboard } from '../../context/DashboardContext';
import ImageUpload from '../../components/ImageUpload';

const FONTS = ['Inter', 'Roboto', 'Poppins', 'Merriweather', 'Playfair Display'];

const COLUMNS_OPTIONS = [
  { value: 1, label: '1 col',  desc: 'Tarjeta grande' },
  { value: 2, label: '2 cols', desc: 'Recomendado' },
  { value: 3, label: '3 cols', desc: 'Más productos' },
  { value: 4, label: '4 cols', desc: 'Vista densa' },
];

const NEON_PALETTE = [
  { name: 'Eléctrico Cyan',   value: '#00FFFF' },
  { name: 'Magenta Láser',    value: '#FF00FF' },
  { name: 'Verde Criptón',    value: '#39FF14' },
  { name: 'Naranja Plasma',   value: '#FF6600' },
  { name: 'Azul Eléctrico',   value: '#0080FF' },
  { name: 'Amarillo Neón',    value: '#FFE600' },
  { name: 'Rojo Láser',       value: '#FF0040' },
  { name: 'Violeta UV',       value: '#9400FF' },
  { name: 'Blanco',           value: '#FFFFFF' },
  { name: 'Sin color',        value: '' },
];

const TITLE_SIZES = [
  { value: 'xs',   label: 'XS' },
  { value: 'sm',   label: 'S'  },
  { value: 'base', label: 'M'  },
  { value: 'lg',   label: 'L'  },
  { value: 'xl',   label: 'XL' },
];

const LANGUAGES = [
  { code: 'es', label: 'Español',  flag: '🇦🇷' },
  { code: 'en', label: 'English',  flag: '🇺🇸' },
  { code: 'ru', label: 'Русский',  flag: '🇷🇺' },
  { code: 'he', label: 'עברית',    flag: '🇮🇱' },
];

const DEFAULT_THEME = {
  primary_color:    '#3B82F6',
  secondary_color:  '#F9FAFB',
  font:             'Inter',
  logo_url:         '',
  banner_url:       '',
  subtitle:         '',
  catalog_columns:  2,
  dark_mode:        false,
  language:         'es',
  title_size:       'base',
  title_text_color: '',
  price_bg_color:   '',
};

const TABS = [
  { id: 'visual',  label: '🎨 Colores' },
  { id: 'layout',  label: '⊞ Layout'  },
  { id: 'texts',   label: '✏️ Textos'  },
  { id: 'advanced',label: '⚡ Avanzado' },
];

export default function ThemeEditor() {
  const { activeStore, authApi } = useDashboard();
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [saved, setSaved] = useState(false);
  const [tab,   setTab]   = useState('visual');

  useEffect(() => {
    if (activeStore?.theme && Object.keys(activeStore.theme).length > 0) {
      setTheme({ ...DEFAULT_THEME, ...activeStore.theme });
    }
  }, [activeStore?.id]);

  const saveMutation = useMutation({
    mutationFn: () => authApi().patch(`/stores/${activeStore.id}/theme`, theme),
    onSuccess:  () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const set = (key, value) => {
    setTheme(t => ({ ...t, [key]: value }));
    const root = document.documentElement;
    if (key === 'primary_color')   root.style.setProperty('--color-primary',   value);
    if (key === 'secondary_color') root.style.setProperty('--color-secondary', value);
    if (key === 'font')            root.style.setProperty('--font-main',        value);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Apariencia de tu tienda</h2>

      {/* Tabs */}
      <div className="grid grid-cols-4 border border-gray-200 rounded-xl p-1 gap-1 bg-gray-50">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* ── VISUAL ───────────────────────────────────────── */}
      {tab === 'visual' && (
        <div className="bg-white rounded-xl p-4 space-y-5 shadow-sm">
          <ImageUpload label="Logo de la tienda" value={theme.logo_url}
            onChange={url => set('logo_url', url)} />
          <ImageUpload label="Banner de portada" value={theme.banner_url}
            onChange={url => set('banner_url', url)} />

          {[
            { key: 'primary_color',   label: 'Color principal' },
            { key: 'secondary_color', label: 'Color de fondo'  },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
              <div className="flex items-center gap-3">
                <input type="color" value={theme[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                <span className="text-xs text-gray-400 font-mono">{theme[key]}</span>
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipografía</label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(font => (
                <button key={font} onClick={() => set('font', font)}
                  className={`py-2.5 px-3 rounded-lg text-sm border transition-colors ${
                    theme.font === font
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 text-gray-700'
                  }`}
                  style={{ fontFamily: font }}>{font}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LAYOUT ───────────────────────────────────────── */}
      {tab === 'layout' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <label className="block text-sm font-medium text-gray-700">Productos por fila</label>
            <div className="grid grid-cols-4 gap-2">
              {COLUMNS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => set('catalog_columns', opt.value)}
                  className={`flex flex-col items-center p-2 rounded-xl border-2 transition-colors gap-1 ${
                    theme.catalog_columns === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200'
                  }`}>
                  {/* Mini preview */}
                  <div className="flex gap-0.5 h-6 items-end">
                    {Array.from({ length: opt.value }).map((_, i) => (
                      <div key={i} className={`rounded-sm flex-1 ${
                        theme.catalog_columns === opt.value ? 'bg-primary/50' : 'bg-gray-200'
                      }`} style={{ minWidth: 6 }} />
                    ))}
                  </div>
                  <span className={`text-xs font-bold ${
                    theme.catalog_columns === opt.value ? 'text-primary' : 'text-gray-500'
                  }`}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview del grid */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-3 uppercase font-semibold tracking-wide">Preview</p>
            <div className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${theme.catalog_columns}, 1fr)` }}>
              {Array.from({ length: theme.catalog_columns * 2 }).map((_, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-gray-100">
                  <div className="bg-gray-100" style={{ aspectRatio: '1/1' }} />
                  <div className="p-1.5 space-y-1">
                    <div className="h-2 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 rounded w-1/2" style={{ backgroundColor: theme.primary_color + '60' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TEXTOS ───────────────────────────────────────── */}
      {tab === 'texts' && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo / Eslogan</label>
            <input type="text" placeholder="Ej: La mejor variedad del barrio"
              value={theme.subtitle || ''}
              onChange={e => set('subtitle', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño del título del producto</label>
            <div className="flex gap-2">
              {TITLE_SIZES.map(s => (
                <button key={s.value} onClick={() => set('title_size', s.value)}
                  className={`flex-1 py-2 rounded-lg border-2 font-bold transition-colors ${
                    theme.title_size === s.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 text-gray-600'
                  }`}
                  style={{ fontSize: { xs: 10, sm: 11, base: 13, lg: 15, xl: 17 }[s.value] }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview header */}
          <div className="rounded-xl overflow-hidden border border-gray-100">
            {theme.banner_url && (
              <div className="relative h-24">
                <img src={theme.banner_url} alt="banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            )}
            <div className="p-3 flex items-center gap-3"
              style={{ backgroundColor: theme.primary_color }}>
              {theme.logo_url && (
                <img src={theme.logo_url} alt="logo"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30 shrink-0" />
              )}
              <div>
                <p className="text-white font-bold">Mi Tienda</p>
                {theme.subtitle && <p className="text-white/75 text-xs">{theme.subtitle}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AVANZADO ─────────────────────────────────────── */}
      {tab === 'advanced' && (
        <div className="space-y-4">

          {/* Paleta Neón */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800">⚡ Paleta Neón</h3>

            {[
              { key: 'title_text_color', label: 'Color del nombre del producto' },
              { key: 'price_bg_color',   label: 'Color de fondo del precio'     },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-2">{label}</label>
                <div className="flex flex-wrap gap-2">
                  {NEON_PALETTE.map(color => (
                    <button key={color.value} onClick={() => set(key, color.value)}
                      title={color.name}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        theme[key] === color.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{
                        backgroundColor: color.value || '#e5e7eb',
                        boxShadow: color.value ? `0 0 8px ${color.value}80` : 'none',
                      }} />
                  ))}
                  {/* Color personalizado */}
                  <div className="relative">
                    <input type="color" value={theme[key] || '#000000'}
                      onChange={e => set(key, e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer border-2 border-dashed border-gray-400 p-0"
                      title="Color personalizado" />
                  </div>
                </div>
                {/* Preview */}
                {theme[key] && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg"
                    style={{
                      backgroundColor: key === 'price_bg_color' ? theme[key] : 'transparent',
                      boxShadow: `0 0 12px ${theme[key]}80`,
                    }}>
                    <span className="text-sm font-bold"
                      style={{ color: key === 'title_text_color' ? theme[key] : 'inherit' }}>
                      {key === 'title_text_color' ? 'Nombre del producto' : '$1.500'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Modo Oscuro */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">🌙 Modo oscuro</p>
                <p className="text-xs text-gray-400 mt-0.5">El catálogo usará fondo oscuro</p>
              </div>
              <button onClick={() => set('dark_mode', !theme.dark_mode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  theme.dark_mode ? 'bg-indigo-600' : 'bg-gray-300'
                }`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  theme.dark_mode ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Idioma */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
            <p className="text-sm font-semibold text-gray-800">🌐 Idioma del catálogo</p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => set('language', lang.code)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    theme.language === lang.code
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200'
                  }`}>
                  <span className="text-xl">{lang.flag}</span>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${
                      theme.language === lang.code ? 'text-primary' : 'text-gray-700'
                    }`}>{lang.label}</p>
                    {lang.code === 'he' && (
                      <p className="text-xs text-gray-400">RTL</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-60">
        {saved ? '✅ Guardado!' : saveMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}
