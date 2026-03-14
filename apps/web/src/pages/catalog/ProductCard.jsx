import { buildWhatsAppLink } from '../../utils/whatsapp';
import { useTenant } from '../../context/TenantContext';

export default function ProductCard({ product }) {
  const store = useTenant();

  const waLink = buildWhatsAppLink({
    phone: store?.contact?.whatsapp,
    storeName: store?.name,
    productName: product.name,
    price: product.price,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-secondary flex items-center justify-center text-4xl">
          🛍️
        </div>
      )}

      <div className="p-4">
        {product.category && (
          <span className="text-xs text-primary font-semibold uppercase tracking-wide">
            {product.category}
          </span>
        )}
        <h3 className="font-semibold text-gray-900 mt-1 text-sm leading-tight">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-gray-900">
            ${Number(product.price).toLocaleString('es-AR')}
          </span>
          {product.in_stock ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
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
