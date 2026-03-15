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

export default function CatalogPage() {
  const { slug } = useParams();
  const store    = useTenant();
  const [search, setSearch]               = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const theme   = store?.theme   || {};
  const contact = store?.contact || {};
  const lang    = theme.language || 'es';
  const isRTL   = lang === 'he';
  const isDark  = theme.dark_mode === true;
  const desktopCols = theme.catalog_columns ?? 2;
  const gridClass   = GRID_CLASS[desktopCols] ?? 'grid-cols-2';

  // Aplicar dark mode y RTL al contenedor raíz del catálogo
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

      {/* Banner */}
      {theme.banner_url && (
        <div className="relative w-full h-40 overflow-hidden">
          <img src={theme.banner_url} alt="banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        </div>
      )}

      {/* Header */}
      <header className="px-4 py-4 sticky top-0 z-10 shadow-md"
        style={{ backgroundColor: theme.primary_color || '#3B82F6' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {theme.logo_url && (
            <img src={theme.logo_url} alt={store?.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/30 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white leading-tight truncate">{store?.name}</h1>
            {theme.subtitle
              ? <p className="text-white/75 text-xs mt-0.5 truncate">{theme.subtitle}</p>
              : <p className="text-white/60 text-xs mt-0.5">{products.length} {t(lang, 'items')}</p>
            }
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <SearchBar value={search} onChange={setSearch} placeholder={t(lang, 'search')} />

        {/* Filtros categoría */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
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

        {/* Secciones */}
        {visibleSections.length > 0 ? (
          <div className="space-y-6">
            {visibleSections.map(section => (
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
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">📦</div>
            <p>{search ? t(lang, 'noMatch') : t(lang, 'noProducts')}</p>
          </div>
        )}

        {/* Botones de contacto */}
        <div className="space-y-2 pt-2 pb-8">
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-3 rounded-xl font-semibold text-sm">
              💬 {t(lang, 'talkToStore')}
            </a>
          )}
          {contact.maps_url && (
            <a href={contact.maps_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm">
              📍 {t(lang, 'howToGet')}
            </a>
          )}
          {contact.instagram && (
            <a href={`https://instagram.com/${contact.instagram.replace('@', '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm">
              📸 {contact.instagram}
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
