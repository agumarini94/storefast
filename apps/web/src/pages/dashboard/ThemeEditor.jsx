import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDashboard } from '../../context/DashboardContext';
import ImageUpload from '../../components/ImageUpload';

const FONTS = ['Inter', 'Roboto', 'Poppins', 'Merriweather', 'Playfair Display'];

export default function ThemeEditor() {
  const { activeStore, authApi } = useDashboard();

  const [theme, setTheme] = useState({
    primary_color:   '#3B82F6',
    secondary_color: '#F9FAFB',
    font:            'Inter',
    logo_url:        '',
  });
  const [saved, setSaved] = useState(false);

  // Cargar el theme guardado de la tienda activa
  useEffect(() => {
    if (activeStore?.theme && Object.keys(activeStore.theme).length > 0) {
      setTheme(prev => ({ ...prev, ...activeStore.theme }));
    }
  }, [activeStore?.id]);

  const saveMutation = useMutation({
    mutationFn: () => authApi().patch(`/stores/${activeStore.id}/theme`, theme),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleChange = (key, value) => {
    const updated = { ...theme, [key]: value };
    setTheme(updated);

    // Preview en tiempo real
    const root = document.documentElement;
    if (key === 'primary_color')   root.style.setProperty('--color-primary',   value);
    if (key === 'secondary_color') root.style.setProperty('--color-secondary', value);
    if (key === 'font')            root.style.setProperty('--font-main',        value);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Apariencia de tu tienda</h2>

      <div className="bg-white rounded-xl p-4 space-y-5 shadow-sm">
        {/* Logo */}
        <ImageUpload
          label="Logo de la tienda"
          value={theme.logo_url}
          onChange={url => setTheme(t => ({ ...t, logo_url: url }))}
        />

        {/* Color principal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color principal</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.primary_color}
              onChange={e => handleChange('primary_color', e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
            />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: theme.primary_color }}>
                Vista previa del color
              </p>
              <p className="text-xs text-gray-400">{theme.primary_color}</p>
            </div>
          </div>
        </div>

        {/* Color de fondo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color de fondo</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.secondary_color}
              onChange={e => handleChange('secondary_color', e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
            />
            <div
              className="flex-1 rounded-lg py-2 px-3 text-sm font-medium border border-gray-100"
              style={{ backgroundColor: theme.secondary_color }}
            >
              Fondo del catálogo
            </div>
          </div>
        </div>

        {/* Tipografía */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipografía</label>
          <div className="grid grid-cols-2 gap-2">
            {FONTS.map(font => (
              <button
                key={font}
                onClick={() => handleChange('font', font)}
                className={`py-2.5 px-3 rounded-lg text-sm border transition-colors ${
                  theme.font === font
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
                style={{ fontFamily: font }}
              >
                {font}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview del botón con los colores elegidos */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Vista previa del catálogo</p>
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ backgroundColor: theme.secondary_color, fontFamily: theme.font }}
        >
          <p className="font-bold text-gray-900">Nombre del producto</p>
          <p className="text-gray-500 text-sm">Descripción breve del producto aquí.</p>
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-gray-900">$1.500</span>
            <button
              className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: theme.primary_color }}
            >
              Consultar
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold transition-opacity disabled:opacity-60"
      >
        {saved ? '✅ Guardado!' : saveMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}
