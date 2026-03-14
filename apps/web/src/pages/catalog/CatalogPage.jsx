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
  const [search, setSearch]     = useState('');
  const [activeCategory, setActiveCategory] = useState(null); // null = todas las secciones

  const { data: products = [] } = useQuery({
    queryKey: ['products', slug],
    queryFn: () => fetchProducts(slug),
    enabled: !!slug,
  });

  // Agrupar por categoría manteniendo el orden de aparición
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

  // Filtrado por búsqueda y/o categoría activa
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

  const totalVisible = visibleSections.reduce((n, s) => n + s.items.length, 0);

  const waLink = store?.contact?.whatsapp
    ? `https://wa.me/${store.contact.whatsapp}${
        store.contact.whatsapp_message
          ? `?text=${encodeURIComponent(store.contact.whatsapp_message)}`
          : ''
      }`
    : null;

  return (
    <div className="min-h-screen bg-secondary font-main">
      {/* Header */}
      <header className="bg-primary text-white px-4 py-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {store?.theme?.logo_url && (
            <img
              src={store.theme.logo_url}
              alt={store.name}
              className="w-10 h-10 rounded-full object-cover bg-white/20 shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight truncate">{store?.name}</h1>
            <p className="text-xs opacity-75 mt-0.5">{products.length} productos</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <SearchBar value={search} onChange={setSearch} />

        {/* Filtros de categoría (scroll horizontal) */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                !activeCategory
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Todo
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                  activeCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Secciones por categoría */}
        {visibleSections.length > 0 ? (
          <div className="space-y-6">
            {visibleSections.map(section => (
              <div key={section.name}>
                {/* Header de sección */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-base font-bold text-gray-900">{section.name}</h2>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 shrink-0">{section.items.length} items</span>
                </div>

                {/* Grid de productos */}
                <div className="grid grid-cols-2 gap-3">
                  {section.items.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">📦</div>
            <p>{search ? 'No hay productos que coincidan' : 'No hay productos disponibles'}</p>
          </div>
        )}

        {/* Botones de contacto */}
        <div className="space-y-2 pt-2 pb-8">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-3 rounded-xl font-semibold text-sm"
            >
              💬 Hablar con la tienda
            </a>
          )}
          {store?.contact?.maps_url && (
            <a
              href={store.contact.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-gray-200 bg-white text-gray-700 py-3 rounded-xl font-semibold text-sm"
            >
              📍 Cómo llegar
            </a>
          )}
          {store?.contact?.instagram && (
            <a
              href={`https://instagram.com/${store.contact.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-gray-200 bg-white text-gray-700 py-3 rounded-xl font-semibold text-sm"
            >
              📸 {store.contact.instagram}
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
