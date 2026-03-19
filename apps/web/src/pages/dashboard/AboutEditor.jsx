import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '../../context/DashboardContext';
import MiniImageUpload from '../../components/MiniImageUpload';

const EMPTY_ABOUT = {
  description:     '',
  images:          ['', '', '', ''],
  customer_photos: ['', '', '', '', '', ''],
};

export default function AboutEditor() {
  const { activeStore, authApi } = useDashboard();
  const queryClient = useQueryClient();
  const [about, setAbout] = useState(EMPTY_ABOUT);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (!activeStore) return;
    const a = activeStore.about;
    if (a && Object.keys(a).length > 0) {
      setAbout({
        description:     a.description || '',
        images:          [...(a.images          || []), '', '', '', ''].slice(0, 4),
        customer_photos: [...(a.customer_photos || []), '', '', '', '', '', ''].slice(0, 6),
      });
    }
  }, [activeStore?.id]);

  const saveMutation = useMutation({
    mutationFn: () =>
      authApi().patch(`/stores/${activeStore.id}/about`, {
        description:     about.description,
        images:          about.images.filter(Boolean),
        customer_photos: about.customer_photos.filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-stores'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const setImage = (i, url) =>
    setAbout(a => {
      const imgs = [...a.images];
      imgs[i] = url;
      return { ...a, images: imgs };
    });

  const setCustomerPhoto = (i, url) =>
    setAbout(a => {
      const photos = [...a.customer_photos];
      photos[i] = url;
      return { ...a, customer_photos: photos };
    });

  return (
    <div className="space-y-5 max-w-lg mx-auto px-4 py-6">
      <h2 className="text-lg font-bold text-gray-900">Sobre la tienda</h2>
      <p className="text-sm text-gray-500 -mt-3">
        Esta información aparece en la pestaña "Nosotros" de tu tienda pública.
      </p>

      {/* Descripción */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📝</span>
          <h3 className="font-semibold text-gray-800 text-sm">Descripción</h3>
        </div>
        <textarea
          rows={6}
          placeholder="Contá la historia de tu tienda, tus valores, qué te diferencia, horarios especiales..."
          value={about.description}
          onChange={e => setAbout(a => ({ ...a, description: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="text-xs text-gray-400">{about.description.length} caracteres</p>
      </div>

      {/* Galería de fotos */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🖼️</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Fotos de la tienda</h3>
            <p className="text-xs text-gray-400">Hasta 4 fotos (local, equipo, productos destacados…)</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(i => (
            <MiniImageUpload
              key={i}
              slot={i + 1}
              value={about.images[i] || ''}
              onChange={url => setImage(i, url)}
            />
          ))}
        </div>
      </div>

      {/* Galería Nuestros Clientes */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐾</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Nuestros Clientes</h3>
            <p className="text-xs text-gray-400">Fotos de clientes usando tus productos (hasta 6). Aparecen en la pestaña "Nosotros".</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <MiniImageUpload
              key={i}
              slot={i + 1}
              value={about.customer_photos[i] || ''}
              onChange={url => setCustomerPhoto(i, url)}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold transition-opacity disabled:opacity-60"
      >
        {saved ? '✅ Guardado!' : saveMutation.isPending ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
}
