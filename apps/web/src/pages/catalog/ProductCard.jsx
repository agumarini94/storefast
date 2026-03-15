import { useState, useMemo } from 'react';
import { buildWhatsAppLink } from '../../utils/whatsapp';
import { useTenant } from '../../context/TenantContext';
import { t } from '../../i18n/translations';

const TITLE_FONT_SIZE = { xs: '10px', sm: '11px', base: '13px', lg: '15px', xl: '17px' };

// Static map → Tailwind won't purge these classes
const ANIMATION_CLASSES = {
  none:   '',
  scale:  'hover:scale-105 transition-transform duration-300',
  glow:   'hover:shadow-xl transition-shadow duration-300',
  bounce: 'hover:-translate-y-1 transition-transform duration-300',
  pulse:  'hover:opacity-80 transition-opacity duration-300',
};

const TITLE_ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

export default function ProductCard({ product, columns = 2 }) {
  const store   = useTenant();
  const [imgIdx,    setImgIdx]    = useState(0);
  const [expanded,  setExpanded]  = useState(false);

  const theme   = store?.theme   || {};
  const lang    = theme.language || 'es';
  const compact = columns >= 3;

  const cs = product.custom_styles || {};

  // Build images array: custom images array first, fallback to image_url
  const images = useMemo(() => {
    const arr = Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : product.image_url ? [product.image_url] : [];
    return arr;
  }, [product.images, product.image_url]);

  const prevImg = (e) => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length); };
  const nextImg = (e) => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length); };

  const waLink = buildWhatsAppLink({
    phone:       store?.contact?.whatsapp,
    storeName:   store?.name,
    productName: product.name,
    price:       product.price,
  });

  // --- Styles from custom_styles ---
  const animClass = ANIMATION_CLASSES[cs.animation || 'none'];
  const titleAlignClass = TITLE_ALIGN[cs.title_position || 'left'];

  const titleStyle = {
    fontSize:   TITLE_FONT_SIZE[cs.font_size || theme.title_size || 'base'],
    fontFamily: cs.font_family || undefined,
    color:      theme.title_text_color || undefined,
    ...(theme.title_text_color && { textShadow: `0 0 8px ${theme.title_text_color}80` }),
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
    : { color: '#f97316', fontWeight: 800 };

  // Card body background (custom per product)
  const bodyStyle = {};
  if (cs.bg_type === 'color' && cs.bg_value) {
    bodyStyle.backgroundColor = cs.bg_value;
  } else if (cs.bg_type === 'image' && cs.bg_value) {
    bodyStyle.backgroundImage    = `url(${cs.bg_value})`;
    bodyStyle.backgroundSize     = 'cover';
    bodyStyle.backgroundPosition = 'center';
  }
  const hasCustomBg = cs.bg_type === 'image' && cs.bg_value;

  return (
    <div className={`bg-white rounded-xl overflow-hidden flex flex-col group border border-gray-100 dark:bg-gray-800 dark:border-gray-700 ${animClass}`}>

      {/* ── Imagen / Carrusel ── */}
      <div className="relative w-full overflow-hidden bg-gray-50 dark:bg-gray-700"
        style={{ aspectRatio: '1 / 1' }}>
        {images.length > 0 ? (
          <img
            src={images[imgIdx]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl">
            🛍️
          </div>
        )}

        {/* Flechas del carrusel */}
        {images.length > 1 && (
          <>
            <button onClick={prevImg}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white text-xs flex items-center justify-center z-10">
              ‹
            </button>
            <button onClick={nextImg}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white text-xs flex items-center justify-center z-10">
              ›
            </button>
            {/* Dots */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
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
      <div
        className={`flex flex-col flex-1 ${compact ? 'p-2 gap-1' : 'p-3 gap-1.5'} ${hasCustomBg ? 'bg-white/85 backdrop-blur-sm' : ''}`}
        style={!hasCustomBg ? bodyStyle : {}}
      >
        {/* Fondo de imagen: wrapper con overlay */}
        {hasCustomBg && (
          <div className="absolute inset-0 pointer-events-none" style={bodyStyle} />
        )}

        {product.category && (
          <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium"
            style={{ fontSize: '9px' }}>
            {product.category}
          </span>
        )}

        <h3 className={`font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 ${titleAlignClass}`}
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
            ₪{Number(product.price).toLocaleString('he-IL')}
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
