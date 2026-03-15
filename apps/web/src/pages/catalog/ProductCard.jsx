import { useState } from 'react';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import { useTenant } from '../../context/TenantContext';
import { t } from '../../i18n/translations';

const TITLE_FONT_SIZE = { xs: '10px', sm: '11px', base: '13px', lg: '15px', xl: '17px' };

export default function ProductCard({ product, columns = 2 }) {
  const store   = useTenant();
  const [expanded, setExpanded] = useState(false);

  const theme   = store?.theme   || {};
  const lang    = theme.language || 'es';
  const compact = columns >= 3;

  const waLink = buildWhatsAppLink({
    phone:       store?.contact?.whatsapp,
    storeName:   store?.name,
    productName: product.name,
    price:       product.price,
  });

  const titleStyle = {
    fontSize: TITLE_FONT_SIZE[theme.title_size || 'base'],
    color:    theme.title_text_color || undefined,
    ...(theme.title_text_color && {
      textShadow: `0 0 8px ${theme.title_text_color}80`,
    }),
  };

  const priceStyle = theme.price_bg_color
    ? {
        backgroundColor: theme.price_bg_color,
        color:           '#000',
        padding:         '2px 8px',
        borderRadius:    '6px',
        boxShadow:       `0 0 10px ${theme.price_bg_color}`,
        fontWeight:      800,
      }
    : { color: '#f97316', fontWeight: 800 }; // naranja Amazon por defecto

  return (
    <div className={`bg-white rounded-xl overflow-hidden flex flex-col group transition-shadow hover:shadow-md border border-gray-100 dark:bg-gray-800 dark:border-gray-700`}>

      {/* ── Imagen con aspect-ratio uniforme ── */}
      <div className="relative w-full overflow-hidden bg-gray-50 dark:bg-gray-700"
        style={{ aspectRatio: '1 / 1' }}>
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

        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1 rounded-full shadow">
              {t(lang, 'outOfStock')}
            </span>
          </div>
        )}
      </div>

      {/* ── Contenido ── */}
      <div className={`flex flex-col flex-1 ${compact ? 'p-2 gap-1' : 'p-3 gap-1.5'}`}>

        {product.category && (
          <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium"
            style={{ fontSize: '9px' }}>
            {product.category}
          </span>
        )}

        <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2"
          style={titleStyle}>
          {product.name}
        </h3>

        {!compact && product.description && (
          <div>
            <p className={`text-gray-500 dark:text-gray-400 text-xs leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {product.description}
            </p>
            {product.description.length > 70 && (
              <button onClick={() => setExpanded(e => !e)}
                className="text-xs font-medium mt-0.5"
                style={{ color: theme.primary_color || '#3B82F6' }}>
                {expanded ? t(lang, 'seeLess') : t(lang, 'seeMore')}
              </button>
            )}
          </div>
        )}

        <div className={`mt-auto flex items-center justify-between gap-1 ${compact ? 'pt-1' : 'pt-2'}`}>
          <span className={compact ? 'text-sm' : 'text-xl'} style={priceStyle}>
            ${Number(product.price).toLocaleString('es-AR')}
          </span>

          {product.in_stock ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className={`shrink-0 font-semibold rounded-lg text-white transition-opacity active:opacity-75 ${
                compact ? 'text-xs px-2 py-1' : 'text-xs px-3 py-2'
              }`}
              style={{ backgroundColor: theme.primary_color || '#3B82F6' }}>
              {t(lang, 'consult')}
            </a>
          ) : (
            <span className="text-xs text-gray-400 font-medium">{t(lang, 'noStock')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
