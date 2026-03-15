import { useState } from 'react';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import { useTenant } from '../../context/TenantContext';

export default function ProductCard({ product, columns = 2 }) {
  const store    = useTenant();
  const [expanded, setExpanded] = useState(false);

  const waLink = buildWhatsAppLink({
    phone:       store?.contact?.whatsapp,
    storeName:   store?.name,
    productName: product.name,
    price:       product.price,
  });

  // Compacto en 3+ columnas
  const compact = columns >= 3;

  return (
    <div className="bg-white rounded-xl overflow-hidden flex flex-col group transition-shadow hover:shadow-md border border-gray-100">

      {/* ── Imagen ─────────────────────────────────────────── */}
      <div className={`relative w-full shrink-0 bg-gray-50 overflow-hidden ${compact ? 'h-28' : 'h-48'}`}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl">
            🛍️
          </div>
        )}

        {/* Overlay sin stock */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1 rounded-full shadow">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* ── Contenido ──────────────────────────────────────── */}
      <div className={`flex flex-col flex-1 ${compact ? 'p-2 gap-1' : 'p-3 gap-1.5'}`}>

        {/* Categoría */}
        {product.category && (
          <span className="text-gray-400 uppercase tracking-wider font-medium"
            style={{ fontSize: compact ? '9px' : '10px' }}>
            {product.category}
          </span>
        )}

        {/* Nombre */}
        <h3 className={`font-bold text-gray-900 leading-snug ${compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-2'}`}>
          {product.name}
        </h3>

        {/* Descripción — solo en vista normal */}
        {!compact && product.description && (
          <div>
            <p className={`text-gray-500 text-xs leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {product.description}
            </p>
            {product.description.length > 70 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-xs font-medium mt-0.5"
                style={{ color: 'var(--color-primary, #3B82F6)' }}
              >
                {expanded ? 'Ver menos ▲' : 'Ver más ▼'}
              </button>
            )}
          </div>
        )}

        {/* Precio + CTA */}
        <div className={`mt-auto flex items-center justify-between gap-1 ${compact ? 'pt-1' : 'pt-2'}`}>
          {/* Precio estilo Amazon — naranja */}
          <div className="leading-none">
            <span className={`font-extrabold text-orange-500 ${compact ? 'text-sm' : 'text-xl'}`}>
              ${Number(product.price).toLocaleString('es-AR')}
            </span>
          </div>

          {product.in_stock ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`shrink-0 font-semibold rounded-lg text-white transition-opacity active:opacity-75 ${
                compact ? 'text-xs px-2 py-1' : 'text-xs px-3 py-2'
              }`}
              style={{ backgroundColor: 'var(--color-primary, #3B82F6)' }}
            >
              Consultar
            </a>
          ) : (
            <span className="text-xs text-gray-400 font-medium">Sin stock</span>
          )}
        </div>
      </div>
    </div>
  );
}
