import { useState } from 'react';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import { useTenant } from '../../context/TenantContext';

export default function ProductCard({ product, columns = 2 }) {
  const store = useTenant();
  const [expanded, setExpanded] = useState(false);

  const waLink = buildWhatsAppLink({
    phone:       store?.contact?.whatsapp,
    storeName:   store?.name,
    productName: product.name,
    price:       product.price,
  });

  const isCompact = columns >= 3;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* Imagen */}
      <div className={`relative w-full overflow-hidden bg-gray-50 ${isCompact ? 'h-28' : 'h-44'}`}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
            🛍️
          </div>
        )}
        {/* Badge sin stock */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
              Sin stock
            </span>
          </div>
        )}
        {/* Badge categoría */}
        {product.category && !isCompact && (
          <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {product.category}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className={`flex flex-col flex-1 ${isCompact ? 'p-2' : 'p-3'}`}>
        <h3 className={`font-semibold text-gray-900 leading-tight ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {product.name}
        </h3>

        {/* Descripción — expandible en móvil, solo en vista normal */}
        {product.description && !isCompact && (
          <div className="mt-1">
            <p className={`text-gray-500 text-xs leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {product.description}
            </p>
            {product.description.length > 60 && (
              <button onClick={() => setExpanded(e => !e)}
                className="text-primary text-xs font-medium mt-0.5">
                {expanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between gap-1">
          {/* Precio */}
          <div>
            <span className={`font-bold text-gray-900 ${isCompact ? 'text-sm' : 'text-lg'}`}>
              ${Number(product.price).toLocaleString('es-AR')}
            </span>
          </div>

          {/* Botón consultar */}
          {product.in_stock ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className={`bg-primary text-white font-semibold rounded-lg shrink-0 transition-opacity active:opacity-75 ${
                isCompact ? 'text-xs px-2 py-1' : 'text-xs px-3 py-1.5'
              }`}>
              Consultar
            </a>
          ) : (
            <span className="text-xs text-gray-400">Agotado</span>
          )}
        </div>
      </div>
    </div>
  );
}
