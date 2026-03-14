import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDashboard } from '../../context/DashboardContext';

export default function ContactEditor() {
  const { activeStore, authApi } = useDashboard();

  const [contact, setContact] = useState({
    whatsapp:          '',
    whatsapp_message:  '',
    maps_url:          '',
    instagram:         '',
  });
  const [saved, setSaved] = useState(false);

  // Cargar datos actuales de la tienda
  useEffect(() => {
    if (activeStore?.contact && Object.keys(activeStore.contact).length > 0) {
      setContact(prev => ({ ...prev, ...activeStore.contact }));
    }
  }, [activeStore?.id]);

  const saveMutation = useMutation({
    mutationFn: () => authApi().patch(`/stores/${activeStore.id}/contact`, contact),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const set = (key, val) => setContact(c => ({ ...c, [key]: val }));

  // Preview del link de WA
  const waPreview = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}${
        contact.whatsapp_message
          ? `?text=${encodeURIComponent(contact.whatsapp_message)}`
          : ''
      }`
    : null;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-gray-900">Datos de contacto</h2>

      {/* WhatsApp */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h3 className="font-semibold text-gray-800 text-sm">WhatsApp</h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Número (con código de país, sin +)
          </label>
          <input
            type="tel"
            placeholder="5491112345678"
            value={contact.whatsapp}
            onChange={e => set('whatsapp', e.target.value.replace(/\D/g, ''))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-gray-400 mt-1">Argentina: 54 + 9 + código de área + número</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Mensaje pre-armado (opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Hola! Vi tu catálogo y quiero consultar sobre..."
            value={contact.whatsapp_message}
            onChange={e => set('whatsapp_message', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Preview del botón */}
        {waPreview && (
          <a
            href={waPreview}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold"
          >
            💬 Vista previa — Hablar con la tienda
          </a>
        )}
      </div>

      {/* Google Maps */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📍</span>
          <h3 className="font-semibold text-gray-800 text-sm">Ubicación</h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Link de Google Maps
          </label>
          <input
            type="url"
            placeholder="https://maps.app.goo.gl/..."
            value={contact.maps_url}
            onChange={e => set('maps_url', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-gray-400 mt-1">
            En Google Maps → Compartir → Copiar enlace
          </p>
        </div>

        {contact.maps_url && (
          <a
            href={contact.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold"
          >
            📍 Ver en Google Maps
          </a>
        )}
      </div>

      {/* Instagram */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📸</span>
          <h3 className="font-semibold text-gray-800 text-sm">Instagram (opcional)</h3>
        </div>
        <input
          type="text"
          placeholder="@mitienda"
          value={contact.instagram}
          onChange={e => set('instagram', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold transition-opacity disabled:opacity-60"
      >
        {saved ? '✅ Guardado!' : saveMutation.isPending ? 'Guardando...' : 'Guardar contacto'}
      </button>
    </div>
  );
}
