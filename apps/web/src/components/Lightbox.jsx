import { useState, useEffect } from 'react';

/**
 * Lightbox modal para ver imágenes a pantalla completa.
 * Props:
 *   images       → array de URLs
 *   initialIndex → índice de la imagen a mostrar primero
 *   onClose      → fn() al cerrar
 */
export default function Lightbox({ images, initialIndex = 0, onClose }) {
  const [idx, setIdx] = useState(initialIndex);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length);
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    // Prevent body scroll while open
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [images.length, onClose]);

  const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); };
  const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full flex flex-col items-center gap-4"
        onClick={e => e.stopPropagation()}>

        {/* Image */}
        <img
          src={images[idx]}
          alt=""
          className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
        />

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 text-white text-xl flex items-center justify-center hover:bg-black/80 transition-colors">
              ‹
            </button>
            <button onClick={next}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 text-white text-xl flex items-center justify-center hover:bg-black/80 transition-colors">
              ›
            </button>
            {/* Dots */}
            <div className="flex gap-2">
              {images.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white text-lg flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        ✕
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
