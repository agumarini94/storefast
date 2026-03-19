import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDashboard } from '../../context/DashboardContext';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DEFAULT_HOURS = DAY_LABELS.map((label, day) => ({
  day,
  label,
  open: day >= 1 && day <= 5,  // Lunes-Viernes por defecto
  from: '09:00',
  to:   '18:00',
}));

const DEFAULT_CONTACT = {
  whatsapp:         '',
  whatsapp_message: '',
  maps_url:         '',
  waze_url:         '',
  instagram:        '',
  phone:            '',
  fab_type:         'whatsapp',  // 'whatsapp' | 'call' | 'reserve' | ''
  fab_reserve_url:  '',
  hours:            DEFAULT_HOURS,
};

const FAB_OPTIONS = [
  { value: '',         label: 'Ninguno'   },
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'call',     label: '📞 Llamar'   },
  { value: 'reserve',  label: '📅 Reservar' },
];

export default function ContactEditor() {
  const { activeStore, authApi } = useDashboard();
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    if (activeStore?.contact && Object.keys(activeStore.contact).length > 0) {
      setContact(prev => ({
        ...DEFAULT_CONTACT,
        ...activeStore.contact,
        // Merge hours: keep saved hours or use defaults
        hours: activeStore.contact.hours ?? DEFAULT_HOURS,
      }));
    }
  }, [activeStore?.id]);

  const saveMutation = useMutation({
    mutationFn: () => authApi().patch(`/stores/${activeStore.id}/contact`, contact),
    onSuccess:  () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const set = (key, val) => setContact(c => ({ ...c, [key]: val }));

  const setHour = (day, field, value) => {
    setContact(c => ({
      ...c,
      hours: c.hours.map(h => h.day === day ? { ...h, [field]: value } : h),
    }));
  };

  const waPreview = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}${
        contact.whatsapp_message ? `?text=${encodeURIComponent(contact.whatsapp_message)}` : ''
      }`
    : null;

  const todayIdx = new Date().getDay();

  return (
    <div className="space-y-5 max-w-lg mx-auto px-4 py-6">
      <h2 className="text-lg font-bold text-gray-900">Datos de contacto</h2>

      {/* ── WhatsApp ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h3 className="font-semibold text-gray-800 text-sm">WhatsApp</h3>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Número (con código de país, sin +)
          </label>
          <input type="tel" placeholder="5491112345678" value={contact.whatsapp}
            onChange={e => set('whatsapp', e.target.value.replace(/\D/g, ''))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <p className="text-xs text-gray-400 mt-1">Israel: 972 + número sin el 0</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Mensaje pre-armado (opcional)</label>
          <textarea rows={3} placeholder="Hola! Vi tu catálogo y quiero consultar sobre..."
            value={contact.whatsapp_message}
            onChange={e => set('whatsapp_message', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
        {waPreview && (
          <a href={waPreview} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold">
            💬 Vista previa — Hablar con la tienda
          </a>
        )}
      </div>

      {/* ── Teléfono ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📞</span>
          <h3 className="font-semibold text-gray-800 text-sm">Teléfono</h3>
        </div>
        <input type="tel" placeholder="Ej: +97250000000"
          value={contact.phone}
          onChange={e => set('phone', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <p className="text-xs text-gray-400">Se usa para el botón flotante "Llamar"</p>
      </div>

      {/* ── Ubicación ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📍</span>
          <h3 className="font-semibold text-gray-800 text-sm">Ubicación</h3>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Google Maps</label>
          <input type="url" placeholder="https://maps.app.goo.gl/..."
            value={contact.maps_url}
            onChange={e => set('maps_url', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <p className="text-xs text-gray-400 mt-1">Google Maps → Compartir → Copiar enlace</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Waze (opcional)</label>
          <input type="url" placeholder="https://waze.com/ul?ll=..."
            value={contact.waze_url}
            onChange={e => set('waze_url', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <p className="text-xs text-gray-400 mt-1">Waze → Compartir ubicación → Copiar enlace</p>
        </div>
        {contact.maps_url && (
          <a href={contact.maps_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold">
            📍 Ver en Google Maps
          </a>
        )}
      </div>

      {/* ── Instagram ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📸</span>
          <h3 className="font-semibold text-gray-800 text-sm">Instagram (opcional)</h3>
        </div>
        <input type="text" placeholder="@mitienda"
          value={contact.instagram}
          onChange={e => set('instagram', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      {/* ── Botón flotante (FAB) ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Botón flotante (FAB)</h3>
            <p className="text-xs text-gray-400">Botón de acción rápida que flota sobre el catálogo</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {FAB_OPTIONS.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => set('fab_type', opt.value)}
              className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                contact.fab_type === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-600'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        {contact.fab_type === 'reserve' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">URL de reserva</label>
            <input type="url" placeholder="https://calendly.com/..."
              value={contact.fab_reserve_url}
              onChange={e => set('fab_reserve_url', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        )}
      </div>

      {/* ── Horarios ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕐</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Horarios de atención</h3>
            <p className="text-xs text-gray-400">El indicador Abierto/Cerrado se basa en esto</p>
          </div>
        </div>

        <div className="space-y-2">
          {contact.hours.map(h => (
            <div key={h.day}
              className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-colors ${
                h.day === todayIdx ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-gray-50'
              }`}>
              {/* Toggle abierto/cerrado */}
              <button type="button"
                onClick={() => setHour(h.day, 'open', !h.open)}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${h.open ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.open ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>

              {/* Día */}
              <span className={`w-24 text-sm shrink-0 ${h.day === todayIdx ? 'font-bold text-primary' : 'text-gray-700'}`}>
                {h.label} {h.day === todayIdx && '← hoy'}
              </span>

              {/* Horario */}
              {h.open ? (
                <div className="flex items-center gap-1 flex-1">
                  <input type="time" value={h.from}
                    onChange={e => setHour(h.day, 'from', e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
                  <span className="text-gray-400 text-xs">—</span>
                  <input type="time" value={h.to}
                    onChange={e => setHour(h.day, 'to', e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
                </div>
              ) : (
                <span className="text-xs text-gray-400 flex-1">Cerrado</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold transition-opacity disabled:opacity-60">
        {saved ? '✅ Guardado!' : saveMutation.isPending ? 'Guardando...' : 'Guardar contacto'}
      </button>
    </div>
  );
}
