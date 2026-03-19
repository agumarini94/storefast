import { useState } from 'react';

/**
 * Sección "Nosotros" para la vista pública de la tienda.
 * Props:
 *   about   → { description: string, images: string[] }
 *   theme   → tema de la tienda (para colores y fuentes)
 *   store   → datos de la tienda (name, contact…)
 */
export default function AboutSection({ about = {}, theme = {}, store = {} }) {
  const [lightboxIdx,    setLightboxIdx]    = useState(null);
  const [ugcLightboxIdx, setUgcLightboxIdx] = useState(null);
  const images         = (about.images          || []).filter(Boolean);
  const customerPhotos = (about.customer_photos || []).filter(Boolean);
  const primaryColor   = theme.primary_color || '#3B82F6';

  const hasContent = about.description || images.length > 0 || customerPhotos.length > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-3">🏪</span>
        <p className="text-sm">El dueño de la tienda aún no agregó información.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">

      {/* ── Encabezado con nombre de tienda ── */}
      <div className="flex items-center gap-3">
        {theme.logo_url && (
          <img src={theme.logo_url} alt={store.name}
            className="w-14 h-14 rounded-2xl object-cover shadow-md shrink-0" />
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100"
            style={{ fontFamily: theme.wordart_font || undefined }}>
            {store.name}
          </h2>
          {theme.subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{theme.subtitle}</p>
          )}
        </div>
      </div>

      {/* ── Descripción ── */}
      {about.description && (
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
          style={{ borderLeft: `4px solid ${primaryColor}` }}
        >
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {about.description}
          </p>
        </div>
      )}

      {/* ── Galería de fotos ── */}
      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
            Galería
          </h3>
          <div className={`grid gap-3 ${
            images.length === 1 ? 'grid-cols-1' :
            images.length === 2 ? 'grid-cols-2' :
            images.length === 3 ? 'grid-cols-2' :
            'grid-cols-2'
          }`}>
            {images.map((url, i) => (
              <button
                key={i}
                onClick={() => setLightboxIdx(i)}
                className={`relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-zoom-in ${
                  images.length === 3 && i === 0 ? 'col-span-2' : ''
                }`}
                style={{ aspectRatio: images.length === 3 && i === 0 ? '16/7' : '1/1' }}
              >
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Datos de contacto rápidos ── */}
      {(store.contact?.whatsapp || store.contact?.instagram || store.contact?.maps_url) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Encontranos</h3>
          <div className="flex flex-wrap gap-2">
            {store.contact?.whatsapp && (
              <a
                href={`https://wa.me/${store.contact.whatsapp}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                💬 WhatsApp
              </a>
            )}
            {store.contact?.instagram && (
              <a
                href={`https://instagram.com/${store.contact.instagram.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
              >
                📸 Instagram
              </a>
            )}
            {store.contact?.maps_url && (
              <a
                href={store.contact.maps_url}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              >
                📍 Ver ubicación
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Nuestros Clientes ── */}
      {customerPhotos.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
            🐾 Nuestros Clientes
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {customerPhotos.map((url, i) => (
              <button
                key={i}
                onClick={() => setUgcLightboxIdx(i)}
                className="relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-zoom-in aspect-square"
              >
                <img
                  src={url}
                  alt={`Cliente ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Lightbox simple ── */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <img
            src={images[lightboxIdx]}
            alt=""
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          {/* Flechas */}
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + images.length) % images.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white text-2xl flex items-center justify-center hover:bg-white/30"
              >‹</button>
              <button
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % images.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white text-2xl flex items-center justify-center hover:bg-white/30"
              >›</button>
            </>
          )}
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/30"
          >✕</button>
        </div>
      )}

      {/* ── Lightbox clientes ── */}
      {ugcLightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setUgcLightboxIdx(null)}
        >
          <img
            src={customerPhotos[ugcLightboxIdx]}
            alt=""
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          {customerPhotos.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setUgcLightboxIdx(i => (i - 1 + customerPhotos.length) % customerPhotos.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white text-2xl flex items-center justify-center hover:bg-white/30"
              >‹</button>
              <button
                onClick={e => { e.stopPropagation(); setUgcLightboxIdx(i => (i + 1) % customerPhotos.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white text-2xl flex items-center justify-center hover:bg-white/30"
              >›</button>
            </>
          )}
          <button
            onClick={() => setUgcLightboxIdx(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/30"
          >✕</button>
        </div>
      )}
    </div>
  );
}
