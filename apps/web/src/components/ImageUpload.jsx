import { useState, useRef } from 'react';
import { apiClient } from '../utils/apiClient';

/**
 * Image input with three modes: 📷 Camera | 🖼️ Gallery | 🔗 URL
 *
 * Props:
 *   value    → current image URL
 *   onChange → fn(url) called on every change (URL mode: live on paste/type)
 *   label    → label text
 */
export default function ImageUpload({ value, onChange, label = 'Foto del producto' }) {
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState('');
  const [showUrl,      setShowUrl]      = useState(false);
  const [urlDraft,     setUrlDraft]     = useState('');

  const cameraRef  = useRef(null);
  const galleryRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes.'); return; }
    if (file.size > 5 * 1024 * 1024)    { setError('La imagen no puede superar 5 MB.');  return; }

    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await apiClient.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      onChange(data.url);
      setShowUrl(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  // Apply URL immediately so the preview updates without clicking OK
  const handleUrlChange = (raw) => {
    setUrlDraft(raw);
    const v = raw.trim();
    if (v.startsWith('http')) onChange(v);
  };

  const commitUrl = () => {
    const v = urlDraft.trim();
    if (v) onChange(v);
    setShowUrl(false);
    setUrlDraft('');
  };

  const clearImage = () => { onChange(''); setShowUrl(false); setUrlDraft(''); };

  const handleDrop = (e) => { e.preventDefault(); uploadFile(e.dataTransfer.files[0]); };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Preview / drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="relative w-full h-36 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden"
      >
        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-primary bg-blue-50">
            <div className="text-3xl animate-bounce">⬆️</div>
            <p className="text-xs mt-2 font-medium">Subiendo...</p>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-xs font-semibold">Arrastrá para cambiar</p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
            <div className="text-3xl">🖼️</div>
            <p className="text-xs mt-2">Arrastrá aquí o usá las opciones</p>
          </div>
        )}
      </div>

      {/* 3-option button row */}
      {!uploading && (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button"
              onClick={() => { setShowUrl(false); cameraRef.current?.click(); }}
              className="flex flex-col items-center justify-center gap-0.5 border border-gray-200 rounded-xl py-2.5 text-xs font-medium text-gray-700 bg-white transition-colors hover:border-primary hover:text-primary active:bg-gray-50">
              <span className="text-base">📷</span>
              <span>Cámara</span>
            </button>

            <button type="button"
              onClick={() => { setShowUrl(false); galleryRef.current?.click(); }}
              className="flex flex-col items-center justify-center gap-0.5 border border-gray-200 rounded-xl py-2.5 text-xs font-medium text-gray-700 bg-white transition-colors hover:border-primary hover:text-primary active:bg-gray-50">
              <span className="text-base">🖼️</span>
              <span>Galería</span>
            </button>

            <button type="button"
              onClick={() => setShowUrl(v => !v)}
              className={`flex flex-col items-center justify-center gap-0.5 border rounded-xl py-2.5 text-xs font-medium transition-colors ${
                showUrl
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-700 bg-white hover:border-primary hover:text-primary'
              }`}>
              <span className="text-base">🔗</span>
              <span>URL</span>
            </button>
          </div>

          {/* URL input panel */}
          {showUrl && (
            <div className="flex gap-2 items-center">
              <input
                type="url"
                autoFocus
                placeholder="https://ejemplo.com/imagen.jpg"
                value={urlDraft}
                onChange={e => handleUrlChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitUrl(); } if (e.key === 'Escape') setShowUrl(false); }}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="button" onClick={commitUrl}
                className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold shrink-0">
                OK
              </button>
            </div>
          )}

          {/* Remove button */}
          {value && (
            <button type="button" onClick={clearImage}
              className="w-full text-xs text-red-400 border border-red-100 rounded-xl py-1.5 bg-white hover:bg-red-50 transition-colors">
              ✕ Quitar imagen
            </button>
          )}
        </>
      )}

      {error && <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-1.5">{error}</p>}

      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={e => uploadFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*"                       className="hidden" onChange={e => uploadFile(e.target.files[0])} />
    </div>
  );
}
