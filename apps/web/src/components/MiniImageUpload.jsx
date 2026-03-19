import { useState, useRef } from 'react';
import { apiClient } from '../utils/apiClient';

/**
 * Upload compacto para slots de carrusel (hasta 3 fotos por producto).
 * Props:
 *   value    → URL actual
 *   onChange → fn(url)
 *   slot     → número de slot (1, 2, 3) para label
 */
export default function MiniImageUpload({ value, onChange, slot = 1 }) {
  const [uploading, setUploading] = useState(false);
  const [showUrl,   setShowUrl]   = useState(false);
  const [urlDraft,  setUrlDraft]  = useState('');
  const cameraRef  = useRef(null);
  const galleryRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
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
      setShowUrl(false);
    } finally {
      setUploading(false);
    }
  };

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

  return (
    <div className="flex flex-col gap-1">
      {/* Preview square */}
      <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50"
        style={{ aspectRatio: '1/1' }}>
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50">
            <span className="text-2xl animate-bounce">⬆️</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => { onChange(''); setShowUrl(false); setUrlDraft(''); }}
              className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white text-xs flex items-center justify-center leading-none"
            >✕</button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
            <span className="text-2xl">+</span>
            <span className="text-xs">Foto {slot}</span>
          </div>
        )}
      </div>

      {/* Buttons: Camera / Gallery / URL */}
      {!uploading && (
        <>
          <div className="flex gap-1">
            <button type="button"
              onClick={() => { setShowUrl(false); cameraRef.current?.click(); }}
              className="flex-1 text-xs py-1 border border-gray-200 rounded-lg text-gray-600 bg-white active:bg-gray-50">
              📷
            </button>
            <button type="button"
              onClick={() => { setShowUrl(false); galleryRef.current?.click(); }}
              className="flex-1 text-xs py-1 border border-gray-200 rounded-lg text-gray-600 bg-white active:bg-gray-50">
              🖼️
            </button>
            <button type="button"
              onClick={() => setShowUrl(v => !v)}
              className={`flex-1 text-xs py-1 border rounded-lg transition-colors ${
                showUrl
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-600 bg-white active:bg-gray-50'
              }`}>
              🔗
            </button>
          </div>

          {showUrl && (
            <div className="flex gap-1">
              <input
                type="url"
                autoFocus
                placeholder="https://..."
                value={urlDraft}
                onChange={e => handleUrlChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitUrl(); }
                  if (e.key === 'Escape') setShowUrl(false);
                }}
                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="button" onClick={commitUrl}
                className="shrink-0 px-2 py-1 bg-primary text-white rounded-lg text-xs font-semibold">
                OK
              </button>
            </div>
          )}
        </>
      )}

      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => uploadFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden"
        onChange={e => uploadFile(e.target.files[0])} />
    </div>
  );
}
