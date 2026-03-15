import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../utils/apiClient';
import { useTenant } from '../../context/TenantContext';
import SearchBar from './SearchBar';
import ProductCard from './ProductCard';

async function fetchProducts(slug) {
  const { data } = await apiClient.get(`/stores/${slug}/products`);
  return data;
}

export default function CatalogPage() {
  const { slug }  = useParams();
  const store     = useTenant();
  const [search, setSearch]           = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const desktopCols = store?.theme?.catalog_columns ?? 2;

  // Tailwind necesita clases completas y estáticas — no interpoladas
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[desktopCols] ?? 'grid-cols-2';

  const { data: products = [] } = useQuery({
    queryKey: ['products', slug],
    queryFn: () => fetchProducts(slug),
    enabled: !!slug,
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

  const waLink = store?.contact?.whatsapp
    ? `https://wa.me/${store.contact.whatsapp}${
        store.contact.whatsapp_message
          ? `?text=${encodeURIComponent(store.contact.whatsapp_message)}`
          : ''
      }`
    : null;

  const theme   = store?.theme   || {};
  const contact = store?.contact || {};

  return (
    <div className="min-h-screen font-main" style={{ backgroundColor: theme.secondary_color || '#F9FAFB' }}>

      {/* Banner de portada */}
      {theme.banner_url && (
        <div className="relative w-full h-40 overflow-hidden">
          <img src={theme.banner_url} alt="banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        </div>
      )}

      {/* Header */}
      <header className={`px-4 py-4 sticky top-0 z-10 shadow-md ${theme.banner_url ? '' : ''}`}
        style={{ backgroundColor: theme.primary_color || '#3B82F6' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {theme.logo_url && (
            <img src={theme.logo_url} alt={store?.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/30 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white leading-tight truncate">
              {store?.name}
            </h1>
            {theme.subtitle ? (
              <p className="text-white/75 text-xs mt-0.5 truncate">{theme.subtitle}</p>
            ) : (
              <p className="text-white/60 text-xs mt-0.5">{products.length} productos</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <SearchBar value={search} onChange={setSearch} />

        {/* Filtros de categoría */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            <button onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                !activeCategory ? 'text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200'
              }`}
              style={!activeCategory ? { backgroundColor: theme.primary_color || '#3B82F6' } : {}}>
              Todo
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  activeCategory === cat ? 'text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200'
                }`}
                style={activeCategory === cat ? { backgroundColor: theme.primary_color || '#3B82F6' } : {}}>
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
                  <h2 className="text-base font-bold text-gray-900 whitespace-nowrap">
                    {section.name}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 shrink-0">
                    {section.items.length} items
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
            <p>{search ? 'No hay productos que coincidan' : 'Esta tienda no tiene productos aún'}</p>
          </div>
        )}

        {/* Botones de contacto */}
        <div className="space-y-2 pt-2 pb-8">
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-3 rounded-xl font-semibold text-sm active:opacity-90">
              💬 Hablar con la tienda
            </a>
          )}
          {contact.maps_url && (
            <a href={contact.maps_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-gray-200 bg-white text-gray-700 py-3 rounded-xl font-semibold text-sm">
              📍 Cómo llegar
            </a>
          )}
          {contact.instagram && (
            <a href={`https://instagram.com/${contact.instagram.replace('@', '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-gray-200 bg-white text-gray-700 py-3 rounded-xl font-semibold text-sm">
              📸 {contact.instagram}
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
