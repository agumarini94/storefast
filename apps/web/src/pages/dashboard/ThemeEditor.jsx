import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDashboard } from '../../context/DashboardContext';
import ImageUpload from '../../components/ImageUpload';

const FONTS = ['Inter', 'Roboto', 'Poppins', 'Merriweather', 'Playfair Display'];
const COLUMNS_OPTIONS = [
  { value: 1, label: '1 columna',  desc: 'Tarjetas grandes' },
  { value: 2, label: '2 columnas', desc: 'Recomendado móvil' },
  { value: 3, label: '3 columnas', desc: 'Más productos visibles' },
];

const DEFAULT_THEME = {
  primary_color:   '#3B82F6',
  secondary_color: '#F9FAFB',
  font:            'Inter',
  logo_url:        '',
  banner_url:      '',
  subtitle:        '',
  catalog_columns: 2,
};

export default function ThemeEditor() {
  const { activeStore, authApi } = useDashboard();
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [saved, setSaved] = useState(false);
  const [tab, setTab]     = useState('visual'); // 'visual' | 'layout' | 'texts'

  useEffect(() => {
    if (activeStore?.theme && Object.keys(activeStore.theme).length > 0) {
      setTheme(prev => ({ ...DEFAULT_THEME, ...prev, ...activeStore.theme }));
    }
  }, [activeStore?.id]);

  const saveMutation = useMutation({
    mutationFn: () => authApi().patch(`/stores/${activeStore.id}/theme`, theme),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const set = (key, value) => {
    setTheme(t => ({ ...t, [key]: value }));
    // CSS vars en tiempo real
    const root = document.documentElement;
    if (key === 'primary_color')   root.style.setProperty('--color-primary',   value);
    if (key === 'secondary_color') root.style.setProperty('--color-secondary', value);
    if (key === 'font')            root.style.setProperty('--font-main',        value);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Apariencia de tu tienda</h2>

      {/* Tabs */}
      <div className="flex border border-gray-200 rounded-xl p-1 gap-1 bg-gray-50">
        {[
          { id: 'visual', label: '🎨 Colores' },
          { id: 'layout', label: '⊞ Layout' },
          { id: 'texts',  label: '✏️ Textos' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* ── TAB: VISUAL ─────────────────────────────────────────────── */}
      {tab === 'visual' && (
        <div className="bg-white rounded-xl p-4 space-y-5 shadow-sm">
          <ImageUpload label="Logo de la tienda" value={theme.logo_url}
            onChange={url => set('logo_url', url)} />

          <ImageUpload label="Banner de portada" value={theme.banner_url}
            onChange={url => set('banner_url', url)} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color principal</label>
            <div className="flex items-center gap-3">
              <input type="color" value={theme.primary_color}
                onChange={e => set('primary_color', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: theme.primary_color }}>
                  Vista previa
                </p>
                <p className="text-xs text-gray-400">{theme.primary_color}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color de fondo</label>
            <div className="flex items-center gap-3">
              <input type="color" value={theme.secondary_color}
                onChange={e => set('secondary_color', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
              <div className="flex-1 rounded-lg py-2 px-3 text-sm font-medium border border-gray-100"
                style={{ backgroundColor: theme.secondary_color }}>
                Fondo del catálogo
              </div>
            </div>
          </div>

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

      {/* ── TAB: LAYOUT ─────────────────────────────────────────────── */}
      {tab === 'layout' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Columnas de productos
            </label>
            <div className="space-y-2">
              {COLUMNS_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => set('catalog_columns', opt.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${
                    theme.catalog_columns === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200'
                  }`}>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${theme.catalog_columns === opt.value ? 'text-primary' : 'text-gray-800'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                  {/* Mini preview de grilla */}
                  <div className="flex gap-1">
                    {Array.from({ length: opt.value }).map((_, i) => (
                      <div key={i} className={`h-8 rounded ${
                        theme.catalog_columns === opt.value ? 'bg-primary/30' : 'bg-gray-200'
                      }`} style={{ width: opt.value === 1 ? 48 : opt.value === 2 ? 24 : 16 }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview de cómo se ve */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
              Vista previa
            </p>
            <div className={`grid gap-2`}
              style={{ gridTemplateColumns: `repeat(${theme.catalog_columns}, 1fr)` }}>
              {Array.from({ length: theme.catalog_columns * 2 }).map((_, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-gray-100">
                  <div className="h-16 bg-gray-100" />
                  <div className="p-2 space-y-1">
                    <div className="h-2 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-primary/30 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: TEXTOS ─────────────────────────────────────────────── */}
      {tab === 'texts' && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtítulo / Eslogan
            </label>
            <input type="text"
              placeholder="Ej: La mejor variedad del barrio"
              value={theme.subtitle || ''}
              onChange={e => set('subtitle', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <p className="text-xs text-gray-400 mt-1">
              Aparece debajo del nombre de la tienda
            </p>
          </div>

          {/* Preview del header */}
          <div className="rounded-xl overflow-hidden border border-gray-100">
            {theme.banner_url && (
              <div className="relative h-28">
                <img src={theme.banner_url} alt="banner"
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            )}
            <div className="p-3 flex items-center gap-3"
              style={{ backgroundColor: theme.primary_color }}>
              {theme.logo_url && (
                <img src={theme.logo_url} alt="logo"
                  className="w-10 h-10 rounded-full object-cover bg-white/20 shrink-0" />
              )}
              <div>
                <p className="text-white font-bold text-base">{activeStore?.name}</p>
                {theme.subtitle && (
                  <p className="text-white/75 text-xs mt-0.5">{theme.subtitle}</p>
                )}
              </div>
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
