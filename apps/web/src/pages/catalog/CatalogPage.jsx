import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../utils/apiClient';
import { useTenant } from '../../context/TenantContext';
import { t } from '../../i18n/translations';
import SearchBar from './SearchBar';
import ProductCard from './ProductCard';

async function fetchProducts(slug) {
  const { data } = await apiClient.get(`/stores/${slug}/products`);
  return data;
}

const GRID_CLASS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
};

const STORE_TITLE_SIZES = {
  sm: '1rem', base: '1.25rem', lg: '1.5rem', xl: '1.875rem', '2xl': '2.25rem',
};

function getWordArtStyle(theme) {
  const c = theme.header_text_color || '#ffffff';
  const effects = {
    none:    {},
    shadow:  { textShadow: '2px 2px 6px rgba(0,0,0,0.7)' },
    neon:    { textShadow: `0 0 8px ${c}, 0 0 18px ${c}, 0 0 35px ${c}` },
    outline: { WebkitTextStroke: '1px rgba(255,255,255,0.8)', color: 'transparent' },
    '3d':    { textShadow: '1px 1px 0 rgba(0,0,0,0.35), 2px 2px 0 rgba(0,0,0,0.2), 3px 3px 5px rgba(0,0,0,0.15)' },
  };
  return {
    fontFamily: theme.wordart_font || undefined,
    ...(effects[theme.wordart_effect || 'none']),
  };
}

export default function CatalogPage() {
  const { slug } = useParams();
  const store    = useTenant();
  const [search,         setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTab,      setActiveTab]      = useState('products');

  const theme   = store?.theme   || {};
  const contact = store?.contact || {};
  const lang    = theme.language || 'es';
  const isRTL   = lang === 'he';
  const isDark  = theme.dark_mode === true;
  const desktopCols = theme.catalog_columns ?? 2;
  const gridClass   = GRID_CLASS[desktopCols] ?? 'grid-cols-2';

  const headerBg        = theme.header_bg_color || theme.primary_color || '#3B82F6';
  const headerTextColor = theme.header_text_color || '#ffffff';
  const titleAlign      = theme.title_align || 'left';
  const titleFontSize   = STORE_TITLE_SIZES[theme.title_font_size || 'xl'] || '1.875rem';

  useEffect(() => {
    const el = document.getElementById('catalog-root');
    if (!el) return;
    isDark ? el.classList.add('dark') : el.classList.remove('dark');
    el.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  }, [isDark, isRTL]);

  const { data: products = [] } = useQuery({
    queryKey: ['products', slug],
    queryFn:  () => fetchProducts(slug),
    enabled:  !!slug,
  });

  const sections = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const cat = p.category || 'Sin categoría';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(p);
    }
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }, [products]);

  const categories = useMemo(() => sections.map(s => s.name), [sections]);

  const visibleSections = useMemo(() => {
    let result = activeCategory
      ? sections.filter(s => s.name === activeCategory)
      : sections;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result
        .map(s => ({ ...s, items: s.items.filter(p => p.name.toLowerCase().includes(q)) }))
        .filter(s => s.items.length > 0);
    }
    return result;
  }, [sections, activeCategory, search]);

  const waLink = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp}${
        contact.whatsapp_message
          ? `?text=${encodeURIComponent(contact.whatsapp_message)}`
          : ''
      }`
    : null;

  return (
    <div id="catalog-root"
      className="min-h-screen font-main dark:bg-gray-900 transition-colors duration-300"
      style={{ backgroundColor: isDark ? undefined : (theme.secondary_color || '#F9FAFB') }}>

      {/* Banner — separado del header */}
      {theme.banner_url && (
        <div className="relative w-full h-40 overflow-hidden">
          <img src={theme.banner_url} alt="banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        </div>
      )}

      {/* Header — color y texto independientes del banner */}
      <header className="px-4 py-4 sticky top-0 z-10 shadow-md" style={{ backgroundColor: headerBg }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          {theme.logo_type !== 'text' && theme.logo_url && (
            <img src={theme.logo_url} alt={store?.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/30 shrink-0" />
          )}
          <div className="flex-1 min-w-0" style={{ textAlign: titleAlign }}>
            <h1 className="font-bold leading-tight truncate"
              style={{ fontSize: titleFontSize, color: headerTextColor, ...getWordArtStyle(theme) }}>
              {store?.name}
            </h1>
            {theme.subtitle
              ? <p className="text-xs mt-0.5 truncate" style={{ color: headerTextColor + 'bb' }}>{theme.subtitle}</p>
              : <p className="text-xs mt-0.5" style={{ color: headerTextColor + '99' }}>{products.length} {t(lang, 'items')}</p>
            }
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">

        {/* ── Tab bar: Productos / Contacto ── */}
        <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 mb-4">
          {[['products', `🏪 ${t(lang, 'products') || 'Productos'}`], ['contact', `📞 ${t(lang, 'contact') || 'Contacto'}`]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === key
                  ? 'border-current text-gray-900 dark:text-gray-100'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}
              style={activeTab === key ? { borderColor: headerBg, color: headerBg } : {}}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: Productos ── */}
        {activeTab === 'products' && (
          <>
            <SearchBar value={search} onChange={setSearch} placeholder={t(lang, 'search')} />

            {/* Mobile: category pills */}
            {categories.length > 1 && (
              <div className="md:hidden flex gap-2 overflow-x-auto pb-1 mt-3 -mx-4 px-4">
                <button onClick={() => setActiveCategory(null)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors text-white shadow-sm"
                  style={!activeCategory
                    ? { backgroundColor: theme.primary_color || '#3B82F6' }
                    : { backgroundColor: 'white', color: '#4b5563', border: '1px solid #e5e7eb' }
                  }>
                  {t(lang, 'all')}
                </button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors"
                    style={activeCategory === cat
                      ? { backgroundColor: theme.primary_color || '#3B82F6', color: 'white' }
                      : { backgroundColor: 'white', color: '#4b5563', border: '1px solid #e5e7eb' }
                    }>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Desktop: sidebar + products grid */}
            <div className="mt-4 md:grid md:grid-cols-[220px_1fr] md:gap-6 md:items-start">

              {/* Sidebar */}
              {categories.length > 1 && (
                <aside className="hidden md:block sticky top-[73px]">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                      Categorías
                    </p>
                    <ul className="space-y-0.5">
                      <li>
                        <button onClick={() => setActiveCategory(null)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            !activeCategory ? 'text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          style={!activeCategory ? { backgroundColor: headerBg } : {}}>
                          {t(lang, 'all')}
                          <span className="float-right text-xs opacity-60">{products.length}</span>
                        </button>
                      </li>
                      {categories.map(cat => {
                        const count = sections.find(s => s.name === cat)?.items.length ?? 0;
                        const isActive = activeCategory === cat;
                        return (
                          <li key={cat}>
                            <button onClick={() => setActiveCategory(isActive ? null : cat)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                              style={isActive ? { backgroundColor: headerBg } : {}}>
                              {cat}
                              <span className="float-right text-xs opacity-60">{count}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </aside>
              )}

              {/* Product sections */}
              <div className="space-y-6">
                {visibleSections.length > 0 ? (
                  visibleSections.map(section => (
                    <div key={section.name}>
                      <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {section.name}
                        </h2>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <span className="text-xs text-gray-400 shrink-0">
                          {section.items.length} {t(lang, 'items')}
                        </span>
                      </div>
                      <div className={`grid gap-3 ${gridClass}`}>
                        {section.items.map(product => (
                          <ProductCard key={product.id} product={product} columns={desktopCols} />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-gray-400">
                    <div className="text-4xl mb-2">📦</div>
                    <p>{search ? t(lang, 'noMatch') : t(lang, 'noProducts')}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── TAB: Contacto ── */}
        {activeTab === 'contact' && (
          <div className="max-w-sm mx-auto space-y-4 py-4">
            {waLink ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl shrink-0">💬</div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">WhatsApp</p>
                    <p className="text-sm text-gray-400">+{contact.whatsapp}</p>
                  </div>
                </div>
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-3 rounded-xl font-semibold text-sm">
                  💬 {t(lang, 'talkToStore')}
                </a>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-3 opacity-50">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl shrink-0">💬</div>
                <p className="text-sm text-gray-400">WhatsApp no configurado</p>
              </div>
            )}

            {contact.maps_url ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl shrink-0">📍</div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">Ubicación</p>
                    <p className="text-sm text-gray-400">Ver en Google Maps</p>
                  </div>
                </div>
                <a href={contact.maps_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold text-sm">
                  📍 {t(lang, 'howToGet')}
                </a>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-3 opacity-50">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl shrink-0">📍</div>
                <p className="text-sm text-gray-400">Ubicación no configurada</p>
              </div>
            )}

            {contact.instagram ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-2xl shrink-0">📸</div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">Instagram</p>
                    <p className="text-sm text-gray-400">{contact.instagram}</p>
                  </div>
                </div>
                <a href={`https://instagram.com/${contact.instagram.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold text-sm">
                  📸 {contact.instagram}
                </a>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-3 opacity-50">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl shrink-0">📸</div>
                <p className="text-sm text-gray-400">Instagram no configurado</p>
              </div>
            )}
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}
