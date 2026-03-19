import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEMO_BASE      = 'storesfast.com/tienda';
const LS_CONTACTS    = 'sf_prospector_contacts';
const LS_APIKEY      = 'sf_gmaps_key';

// ── Google Maps dark style ────────────────────────────────────────────────────
const DARK_MAP_STYLE = [
  { elementType: 'geometry',                                      stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill',                              stylers: [{ color: '#8a8a9a' }] },
  { elementType: 'labels.text.stroke',                            stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'administrative',  elementType: 'geometry',      stylers: [{ color: '#2a2a4a' }] },
  { featureType: 'road',            elementType: 'geometry',      stylers: [{ color: '#2d2d4a' }] },
  { featureType: 'road.highway',    elementType: 'geometry',      stylers: [{ color: '#3a3a5a' }] },
  { featureType: 'road',            elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'water',           elementType: 'geometry',      stylers: [{ color: '#0d1117' }] },
  { featureType: 'poi',             elementType: 'geometry',      stylers: [{ color: '#1f2640' }] },
  { featureType: 'poi',             elementType: 'labels',        stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',                                        stylers: [{ visibility: 'off' }] },
];

// ── Type → Rubro label ────────────────────────────────────────────────────────
const TYPE_LABELS = {
  restaurant: 'Restaurante', cafe: 'Cafetería', bar: 'Bar', bakery: 'Panadería',
  meal_takeaway: 'Para llevar', food: 'Comida', clothing_store: 'Ropa',
  shoe_store: 'Calzado', jewelry_store: 'Joyería', furniture_store: 'Muebles',
  hardware_store: 'Ferretería', book_store: 'Librería', pet_store: 'Mascotas',
  pharmacy: 'Farmacia', convenience_store: 'Almacén', supermarket: 'Supermercado',
  beauty_salon: 'Estética', hair_care: 'Peluquería', gym: 'Gimnasio',
  florist: 'Florería', electronics_store: 'Electrónica', home_goods_store: 'Hogar',
  car_repair: 'Mecánica', laundry: 'Lavandería', bicycle_store: 'Bicicletas',
  liquor_store: 'Licorería', night_club: 'Club nocturno', store: 'Comercio',
};

function getRubro(types = []) {
  for (const t of types) {
    if (TYPE_LABELS[t]) return TYPE_LABELS[t];
  }
  return 'Comercio';
}

// ── Phone: Israeli local → international WA format ────────────────────────────
// Input examples: "054-123-4567", "(02) 123-4567", "+972541234567"
// Output: "972541234567"
function toIsraeliWA(raw = '') {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('972'))  return digits;
  if (digits.startsWith('00972')) return digits.slice(2);
  if (digits.startsWith('0'))    return '972' + digits.slice(1);
  return '972' + digits;
}

// ── Slug generator (handles Hebrew names gracefully) ─────────────────────────
function toSlug(name = '') {
  const latin = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 40);
  return latin.length > 2 ? latin : 'demo-' + Math.random().toString(36).slice(2, 7);
}

// ── WhatsApp invite — Hebrew message ─────────────────────────────────────────
function buildWAInvite(businessName, phone) {
  const slug = toSlug(businessName);
  const msg  =
    `שלום ${businessName}, ` +
    `ראיתי אתכם בגוגל מפות אבל שמתי לב שאין לכם אתר או קטלוג. ` +
    `בניתי לכם סקיצה ב-StoresFast כדי שתוכלו לקבל הזמנות בוואטסאפ: ` +
    `${DEMO_BASE}/${slug}`;
  const wa = toIsraeliWA(phone);
  if (!wa) return null;
  return `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
}

// ── Map info window HTML (vanilla — no React) ─────────────────────────────────
function infoHtml(place) {
  return `
    <div style="background:#1e1e2e;color:#e2e8f0;padding:14px 16px;border-radius:10px;min-width:210px;font-family:system-ui,sans-serif;border:1px solid rgba(255,255,255,0.1);">
      <p style="font-weight:700;font-size:14px;margin:0 0 3px;">${place.name}</p>
      <p style="font-size:11px;color:#6b7280;background:rgba(255,255,255,0.06);display:inline-block;padding:2px 8px;border-radius:99px;margin:0 0 6px;">${place.rubro}</p>
      <p style="font-size:11px;color:#9ca3af;margin:0 0 4px;line-height:1.4;">${place.address}</p>
      ${place.phone ? `<p style="font-size:12px;color:#34d399;margin:4px 0 0;">📞 ${place.phone}</p>` : ''}
      <p style="font-size:10px;color:#ef4444;margin:6px 0 0;font-weight:600;">✓ Sin web detectada</p>
    </div>`;
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const WA_ICON = (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function ProspectorMap() {
  const navigate = useNavigate();

  // ── Persistent state
  const [apiKey,     setApiKey]     = useState(() => localStorage.getItem(LS_APIKEY) || '');
  const [contacted,  setContacted]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_CONTACTS) || '[]'); } catch { return []; }
  });

  // ── UI state
  const [query,           setQuery]           = useState('');
  const [tab,             setTab]             = useState('results');   // 'results' | 'followed'
  const [results,         setResults]         = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [progress,        setProgress]        = useState({ current: 0, total: 0 });
  const [filteredOut,     setFilteredOut]     = useState(0);           // how many had a website
  const [error,           setError]           = useState('');
  const [scriptLoaded,    setScriptLoaded]    = useState(false);
  const [mapReady,        setMapReady]        = useState(false);
  const [showKeyInput,    setShowKeyInput]    = useState(!apiKey);
  const [keyDraft,        setKeyDraft]        = useState(apiKey);

  // ── Refs
  const mapDivRef      = useRef(null);
  const mapInstance    = useRef(null);
  const markersRef     = useRef([]);
  const infoWindowRef  = useRef(null);

  // ── Persist contacts to localStorage
  useEffect(() => {
    localStorage.setItem(LS_CONTACTS, JSON.stringify(contacted));
  }, [contacted]);

  // ── Load Google Maps API script
  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps?.places) { setScriptLoaded(true); return; }
    if (document.querySelector('[data-sf-gmaps]')) return; // already injected

    const script = document.createElement('script');
    script.setAttribute('data-sf-gmaps', '1');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload  = () => setScriptLoaded(true);
    script.onerror = () => setError('❌ Error cargando Google Maps. Verificá que la API key sea válida y tenga Maps JS + Places habilitados.');
    document.head.appendChild(script);
  }, [apiKey]);

  // ── Initialize map when script ready and div mounted
  useEffect(() => {
    if (!scriptLoaded || !mapDivRef.current || mapInstance.current) return;
    mapInstance.current = new window.google.maps.Map(mapDivRef.current, {
      center:             { lat: 32.0853, lng: 34.7818 }, // Tel Aviv
      zoom:               13,
      styles:             DARK_MAP_STYLE,
      mapTypeControl:     false,
      streetViewControl:  false,
      fullscreenControl:  true,
      zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
    });
    setMapReady(true);
  }, [scriptLoaded]);

  // ── Save API key
  const saveKey = () => {
    const k = keyDraft.trim();
    if (!k) return;
    localStorage.setItem(LS_APIKEY, k);
    setApiKey(k);
    setShowKeyInput(false);
  };

  // ── Clear markers from map
  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (infoWindowRef.current) { infoWindowRef.current.close(); infoWindowRef.current = null; }
  };

  // ── Main search ───────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!mapReady || !query.trim()) return;

    setLoading(true);
    setResults([]);
    setError('');
    setFilteredOut(0);
    setProgress({ current: 0, total: 0 });
    clearMarkers();

    const G       = window.google.maps;
    const service = new G.places.PlacesService(mapInstance.current);

    service.textSearch({ query: query.trim() }, async (places, status) => {
      if (status !== G.places.PlacesServiceStatus.OK || !places?.length) {
        setLoading(false);
        setError('No se encontraron resultados. Probá con otro término (ej: מסעדה, fiambrería, kiosco).');
        return;
      }

      const total = places.length;
      setProgress({ current: 0, total });

      // Fetch details in batches of 5 to avoid hitting rate limits
      const allDetails = [];
      const BATCH = 5;
      for (let i = 0; i < places.length; i += BATCH) {
        const batch = places.slice(i, i + BATCH);
        const batchResults = await Promise.all(
          batch.map(p => new Promise(resolve => {
            service.getDetails(
              { placeId: p.place_id, fields: ['name', 'website', 'formatted_phone_number', 'geometry', 'types', 'formatted_address', 'url', 'place_id'] },
              (detail, s) => resolve(s === G.places.PlacesServiceStatus.OK ? detail : null)
            );
          }))
        );
        allDetails.push(...batchResults);
        setProgress({ current: Math.min(i + BATCH, total), total });
      }

      // ── STRICT FILTER: only keep places WITHOUT a website ──────────────────
      const valid = allDetails.filter(Boolean);
      const withWeb    = valid.filter(d => d.website);
      const withoutWeb = valid.filter(d => !d.website);

      setFilteredOut(withWeb.length);

      const mapped = withoutWeb.map(d => ({
        id:       d.place_id,
        name:     d.name || 'Sin nombre',
        address:  d.formatted_address || '',
        phone:    d.formatted_phone_number || '',
        rubro:    getRubro(d.types || []),
        lat:      d.geometry.location.lat(),
        lng:      d.geometry.location.lng(),
        mapsUrl:  d.url || `https://maps.google.com/?q=${d.geometry.location.lat()},${d.geometry.location.lng()}`,
      }));

      setResults(mapped);

      // ── Drop red markers for each valid result ─────────────────────────────
      const bounds = new G.LatLngBounds();
      mapped.forEach((place, idx) => {
        const marker = new G.Marker({
          position:  { lat: place.lat, lng: place.lng },
          map:       mapInstance.current,
          title:     place.name,
          animation: G.Animation.DROP,
          icon: {
            path:          G.SymbolPath.CIRCLE,
            scale:         10,
            fillColor:     '#ef4444',
            fillOpacity:   1,
            strokeColor:   '#fff',
            strokeWeight:  2,
          },
          zIndex: idx,
        });

        const iw = new G.InfoWindow({ content: infoHtml(place) });
        marker.addListener('click', () => {
          infoWindowRef.current?.close();
          iw.open(mapInstance.current, marker);
          infoWindowRef.current = iw;
        });

        markersRef.current.push(marker);
        bounds.extend({ lat: place.lat, lng: place.lng });
      });

      if (mapped.length > 0) mapInstance.current.fitBounds(bounds);

      setLoading(false);
      setProgress({ current: 0, total: 0 });
      setTab('results');
    });
  }, [mapReady, query]);

  // ── Register as contacted (removes from results, adds to followed) ─────────
  const registerContact = (place) => {
    setContacted(prev => {
      if (prev.find(c => c.id === place.id)) return prev;
      return [{ ...place, contactedAt: new Date().toISOString() }, ...prev];
    });
    setResults(prev => prev.filter(r => r.id !== place.id));
    // Remove marker
    const idx = results.findIndex(r => r.id === place.id);
    if (idx !== -1 && markersRef.current[idx]) {
      markersRef.current[idx].setMap(null);
    }
  };

  const removeContact = (id) => setContacted(prev => prev.filter(c => c.id !== id));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden">

      {/* ── Top bar ── */}
      <header className="shrink-0 h-14 border-b border-white/5 bg-gray-950/95 backdrop-blur-md flex items-center px-4 gap-3 z-20">
        {/* Brand + back */}
        <button onClick={() => navigate('/admin/super-control')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mr-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
          📍
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold leading-tight">Prospector Map</p>
          <p className="text-[10px] text-gray-400 leading-tight">Negocios sin web · Google Maps</p>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-lg flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="מסעדה, fiambrería, kiosco, ropa..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              disabled={!mapReady}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-40 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!mapReady || loading || !query.trim()}
            className="shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </div>

        {/* API key config */}
        <button
          onClick={() => setShowKeyInput(v => !v)}
          title="Configurar API key de Google Maps"
          className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
            apiKey ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
          }`}
        >
          🔑 {apiKey ? 'Key ✓' : 'Sin key'}
        </button>
      </header>

      {/* ── API key setup panel ── */}
      {showKeyInput && (
        <div className="shrink-0 border-b border-white/5 bg-yellow-500/5 px-4 py-3 flex flex-wrap items-start gap-3 z-10">
          <div className="flex-1 min-w-64 space-y-1">
            <p className="text-xs font-semibold text-yellow-300">Google Maps API Key</p>
            <p className="text-[11px] text-gray-400">
              Necesitás <strong>Maps JavaScript API</strong> + <strong>Places API</strong> habilitadas en tu proyecto de Google Cloud.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="password"
              placeholder="AIza..."
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 w-64"
            />
            <button onClick={saveKey}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg transition-colors">
              Guardar
            </button>
            {apiKey && (
              <button onClick={() => setShowKeyInput(false)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg border border-white/10 transition-colors">
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Main split view ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left panel ── */}
        <aside className="w-80 lg:w-96 shrink-0 flex flex-col border-r border-white/5 overflow-hidden bg-gray-950">

          {/* Progress bar */}
          {loading && progress.total > 0 && (
            <div className="shrink-0 px-4 py-3 border-b border-white/5 bg-blue-500/5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-blue-300 font-medium">Verificando webs...</span>
                <span className="text-xs text-gray-400 font-mono">{progress.current}/{progress.total}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Filtrando negocios con página web existente...</p>
            </div>
          )}

          {/* Stats bar */}
          {!loading && (results.length > 0 || filteredOut > 0) && (
            <div className="shrink-0 px-4 py-2.5 border-b border-white/5 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {results.length} sin web
              </span>
              {filteredOut > 0 && (
                <span className="flex items-center gap-1.5 text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-gray-600" />
                  {filteredOut} con web (ignorados)
                </span>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="shrink-0 flex border-b border-white/5">
            {[
              { key: 'results',  label: 'Resultados',  count: results.length  },
              { key: 'followed', label: 'Seguimiento', count: contacted.length },
            ].map(t => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative ${
                  tab === t.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}>
                {t.label}
                {t.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    tab === t.key ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-500'
                  }`}>{t.count}</span>
                )}
                {tab === t.key && (
                  <span className="absolute bottom-0 inset-x-4 h-0.5 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto">

            {/* ── RESULTS TAB ── */}
            {tab === 'results' && (
              <>
                {!apiKey && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 text-gray-500">
                    <span className="text-4xl mb-3">🔑</span>
                    <p className="text-sm font-semibold text-gray-300 mb-1">Configurá tu API Key</p>
                    <p className="text-xs">Hacé clic en "Sin key" arriba para agregar tu clave de Google Maps.</p>
                  </div>
                )}
                {apiKey && !mapReady && !loading && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
                    <p className="text-xs">Cargando Google Maps...</p>
                  </div>
                )}
                {mapReady && !loading && results.length === 0 && !error && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 text-gray-500">
                    <span className="text-4xl mb-3">🗺️</span>
                    <p className="text-sm font-semibold text-gray-300 mb-1">Listo para prospectar</p>
                    <p className="text-xs">Escribí el rubro que querés buscar y presioná Buscar.</p>
                    <div className="mt-4 text-left space-y-1">
                      {['מסעדה (restaurante)', 'חנות בגדים (ropa)', 'kiosco', 'fiambrería', 'peluquería'].map(s => (
                        <button key={s} type="button" onClick={() => { setQuery(s.split(' ')[0]); }}
                          className="block w-full text-left px-3 py-1.5 rounded-lg bg-white/3 hover:bg-white/6 text-gray-400 hover:text-gray-200 text-xs transition-colors border border-white/5">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {error && (
                  <div className="p-4">
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
                      {error}
                    </div>
                  </div>
                )}
                {loading && progress.total === 0 && (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                  </div>
                )}

                {results.map(place => {
                  const waLink = buildWAInvite(place.name, place.phone);
                  return (
                    <div key={place.id}
                      className="px-4 py-3.5 border-b border-white/4 hover:bg-white/[0.025] transition-colors group">
                      <div className="flex items-start gap-2.5 mb-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white text-sm leading-tight truncate">{place.name}</p>
                          <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/8">
                            {place.rubro}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-1.5 ml-4.5 line-clamp-2 leading-relaxed">{place.address}</p>
                      {place.phone && (
                        <p className="text-xs text-emerald-400 mb-2 ml-4.5 font-mono">
                          {place.phone}
                          <span className="text-gray-600 ml-2">→ {toIsraeliWA(place.phone)}</span>
                        </p>
                      )}
                      <div className="flex gap-1.5 ml-4.5">
                        {waLink ? (
                          <a href={waLink} target="_blank" rel="noopener noreferrer"
                            onClick={() => registerContact(place)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20 transition-colors">
                            {WA_ICON} Enviar invitación
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-600 italic px-2.5 py-1.5">Sin teléfono</span>
                        )}
                        <button type="button" onClick={() => registerContact(place)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-[11px] border border-white/8 transition-colors">
                          + Seguimiento
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* ── FOLLOWED TAB ── */}
            {tab === 'followed' && (
              <>
                {contacted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 text-gray-500">
                    <span className="text-4xl mb-3">📋</span>
                    <p className="text-sm font-semibold text-gray-300 mb-1">Lista vacía</p>
                    <p className="text-xs">Los negocios que registres aparecerán aquí para hacerles seguimiento.</p>
                  </div>
                ) : contacted.map(place => (
                  <div key={place.id}
                    className="px-4 py-3.5 border-b border-white/4 hover:bg-white/[0.025] transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{place.name}</p>
                        <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/8">
                          {place.rubro}
                        </span>
                      </div>
                      <button type="button" onClick={() => removeContact(place.id)}
                        className="shrink-0 w-5 h-5 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 text-xs flex items-center justify-center transition-colors">
                        ✕
                      </button>
                    </div>
                    <a
                      href={place.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-semibold border border-blue-500/20 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                      </svg>
                      Ver en Maps
                    </a>
                    {place.contactedAt && (
                      <p className="text-[10px] text-gray-600 mt-1.5">
                        Registrado: {new Date(place.contactedAt).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* ── Map ── */}
        <div className="flex-1 relative">
          <div ref={mapDivRef} className="absolute inset-0" />

          {/* Map overlay — shown before API key is configured */}
          {!apiKey && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 z-10">
              <span className="text-6xl mb-4">🗺️</span>
              <h2 className="text-xl font-bold text-white mb-2">Prospector Map</h2>
              <p className="text-gray-400 text-sm mb-6 text-center max-w-sm px-4">
                Encontrá negocios sin página web en Google Maps y enviá invitaciones directas por WhatsApp.
              </p>
              <button onClick={() => setShowKeyInput(true)}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors">
                Configurar API Key →
              </button>
              <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs text-gray-500 max-w-xs">
                {[['🔍', 'Buscá por rubro'], ['🚫', 'Filtra los que tienen web'], ['📲', 'Invitá por WhatsApp']].map(([icon, text]) => (
                  <div key={text}><div className="text-2xl mb-1">{icon}</div>{text}</div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          {mapReady && (
            <div className="absolute bottom-6 left-4 bg-gray-900/90 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-xs z-10">
              <p className="font-semibold text-gray-300 mb-2">Leyenda</p>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shrink-0" />
                Negocio sin web detectada
              </div>
              {filteredOut > 0 && (
                <p className="text-gray-600 mt-1.5 text-[10px]">{filteredOut} ocultados por tener web</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
