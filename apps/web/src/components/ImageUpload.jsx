import { useState, useRef } from 'react';
import { apiClient } from '../utils/apiClient';

/**
 * Sube una imagen al backend (/api/upload).
 * En móvil muestra dos opciones: Cámara y Galería.
 * En desktop abre el selector de archivos estándar.
 *
 * Props:
 *   value    → URL actual de la imagen
 *   onChange → fn(url) cuando se sube/quita una imagen
 *   label    → texto del label
 */
export default function ImageUpload({ value, onChange, label = 'Foto del producto' }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  const cameraRef  = useRef(null); // capture="environment"
  const galleryRef = useRef(null); // sin capture

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes.'); return; }
    if (file.size > 5 * 1024 * 1024)    { setError('La imagen no puede superar 5 MB.'); return; }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      onChange(data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir la imagen. Intentá de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    uploadFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Zona de preview / drop (desktop) */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="relative w-full h-40 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden"
      >
        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-primary bg-blue-50">
            <div className="text-3xl animate-bounce">⬆️</div>
            <p className="text-xs mt-2 font-medium">Subiendo imagen...</p>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-xs font-semibold">Arrastrá para cambiar</p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
            <div className="text-3xl">🖼️</div>
            <p className="text-xs mt-2">Arrastrá una imagen aquí</p>
            <p className="text-xs">o usá los botones de abajo</p>
          </div>
        )}
      </div>

      {/* Botones de acción — diseñados para móvil */}
      {!uploading && (
        <div className="flex gap-2">
          {/* Cámara: abre directamente la cámara en móvil */}
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 bg-white active:bg-gray-50"
          >
            📷 Cámara
          </button>

          {/* Galería: abre el selector de fotos */}
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 bg-white active:bg-gray-50"
          >
            🖼️ Galería
          </button>

          {/* Quitar imagen */}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-3 border border-red-100 rounded-xl text-red-400 bg-white active:bg-red-50"
              title="Quitar imagen"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-1.5">{error}</p>
      )}

      {/* Input cámara — capture="environment" abre la cámara trasera */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => uploadFile(e.target.files[0])}
      />

      {/* Input galería — sin capture para mostrar el selector de fotos */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => uploadFile(e.target.files[0])}
      />
    </div>
  );
}
