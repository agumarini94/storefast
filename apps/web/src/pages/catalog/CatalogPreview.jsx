import { useMemo, useState } from 'react';

const TITLE_FONT_SIZE = { xs: '10px', sm: '11px', base: '13px', lg: '15px', xl: '17px' };
const STORE_TITLE_SIZES = { sm: '1rem', base: '1.25rem', lg: '1.5rem', xl: '1.875rem', '2xl': '2.25rem' };

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

function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return hex || 'transparent';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Tracks which zone is hovered for the blue ring effect in editor mode. */
function useHoverRing(active) {
  const [hovered, setHovered] = useState(null);

  const hoverProps = (key) => {
    if (!active) return {};
    return {
      onMouseEnter: () => setHovered(key),
      onMouseLeave: () => setHovered(null),
    };
  };

  const ringStyle = (key) => active ? {
    outline: hovered === key ? '2px solid rgba(59,130,246,0.6)' : '2px solid transparent',
    outlineOffset: '2px',
    transition: 'outline-color 0.15s',
  } : {};

  return { hoverProps, ringStyle };
}

/**
 * Vista previa reactiva del catálogo — completamente independiente del TenantContext.
 * Props: theme, store, products, onElementClick (optional — enables click-to-edit in ThemeEditor)
 */
export default function CatalogPreview({ theme = {}, store = {}, products = [], onElementClick }) {
  const headerBg      = theme.header_bg_color || theme.primary_color || '#3B82F6';
  const headerTxt     = theme.header_text_color || '#ffffff';
  const titleAlign    = theme.title_align || 'left';
  const storeTitleSize = STORE_TITLE_SIZES[theme.title_font_size || 'xl'] || '1.875rem';
  const isDark        = theme.dark_mode === true;
  const cols          = theme.catalog_columns ?? 2;
  const showTitle     = theme.show_title !== false;
  const showTitleBg   = theme.show_title_bg !== false;
  const headerOpacity = (theme.header_overlay_opacity ?? 100) / 100;
  const bannerPosY    = theme.banner_position_y ?? 50;
  const headerBgFinal = showTitleBg ? hexToRgba(headerBg, headerOpacity) : 'transparent';

  const { hoverProps, ringStyle } = useHoverRing(!!onElementClick);

  const priceStyle = theme.price_bg_color
    ? { backgroundColor: theme.price_bg_color, color: '#000', padding: '1px 5px', borderRadius: '5px', boxShadow: `0 0 6px ${theme.price_bg_color}`, fontWeight: 800, fontSize: '11px' }
    : { color: '#f97316', fontWeight: 800, fontSize: '11px' };

  const sections = useMemo(() => {
    const map = new Map();
    for (const p of products.slice(0, 10)) {
      const cat = p.category || 'General';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(p);
    }
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }, [products]);

  const categories = sections.map(s => s.name);

  return (
    <div style={{
      backgroundColor: isDark ? '#111827' : (theme.secondary_color || '#F9FAFB'),
      fontFamily: theme.font ? `'${theme.font}', system-ui, sans-serif` : undefined,
      minHeight: '100%',
    }}>
      {/* Header + Banner — integrated (banner is the background of the header) */}
      <div
        {...hoverProps('header')}
        onClick={() => onElementClick?.('header')}
        title={onElementClick ? 'Clic para editar el header' : undefined}
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '10px 12px',
          minHeight: theme.banner_url ? 72 : undefined,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          cursor: onElementClick ? 'pointer' : 'default',
          ...ringStyle('header'),
        }}
      >
        {/* Banner background image */}
        {theme.banner_url && (
          <img
            src={theme.banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: `center ${bannerPosY}%` }}
            draggable={false}
          />
        )}

        {/* Color overlay — independent of banner; opacity controls its transparency */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: showTitleBg ? headerBg : 'transparent',
            opacity: showTitleBg ? headerOpacity : 0,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          {theme.logo_type !== 'text' && theme.logo_url && (
            <img src={theme.logo_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30 shrink-0" />
          )}
          <div className="flex-1 min-w-0" style={{ textAlign: titleAlign }}>
            {/* Store title — separate click zone */}
            {showTitle && (
              <p
                className="font-bold leading-tight truncate"
                title={onElementClick ? 'Clic para editar el tamaño del nombre' : undefined}
                style={{ fontSize: storeTitleSize, color: headerTxt, ...getWordArtStyle(theme), cursor: onElementClick ? 'pointer' : 'default', borderRadius: '4px' }}
                onClick={(e) => { e.stopPropagation(); onElementClick?.('store-title'); }}
              >
                {store.name || 'Mi Tienda'}
              </p>
            )}
            {/* Subtitle — separate click zone */}
            {theme.subtitle && (
              <p
                className="truncate"
                title={onElementClick ? 'Clic para editar el subtítulo' : undefined}
                style={{ fontSize: 10, color: headerTxt + 'bb', marginTop: 1, cursor: onElementClick ? 'pointer' : 'default', borderRadius: '4px' }}
                onClick={(e) => { e.stopPropagation(); onElementClick?.('subtitle'); }}
              >
                {theme.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Edit badges */}
        {onElementClick && theme.banner_url && (
          <div
            className="absolute top-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full z-20 pointer-events-none"
            {...hoverProps('banner')}
            style={{ ...ringStyle('banner'), pointerEvents: 'none' }}
          >
            ✏️ Banner
          </div>
        )}
        {onElementClick && (
          <div style={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 8, padding: '2px 6px', borderRadius: 8, pointerEvents: 'none', zIndex: 20 }}>
            ✏️ Header
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">

        {/* Search placeholder */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 border"
          style={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderColor: isDark ? '#374151' : '#e5e7eb' }}>
          <span style={{ color: '#9ca3af', fontSize: 12 }}>🔍</span>
          <span style={{ color: '#9ca3af', fontSize: 11 }}>Buscar productos...</span>
        </div>

        {/* Category pills — clickable (maps to primary color) */}
        {categories.length > 1 && (
          <div
            {...hoverProps('primary-color')}
            onClick={() => onElementClick?.('primary-color')}
            title={onElementClick ? 'Clic para editar el color principal' : undefined}
            style={{ display: 'flex', gap: 6, overflow: 'hidden', cursor: onElementClick ? 'pointer' : 'default', borderRadius: 8, ...ringStyle('primary-color') }}
          >
            <span className="px-2.5 py-1 rounded-full text-white shrink-0" style={{ fontSize: 10, backgroundColor: theme.primary_color || '#3B82F6' }}>Todo</span>
            {categories.slice(0, 3).map(cat => (
              <span key={cat} className="px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap"
                style={{ fontSize: 10, color: isDark ? '#d1d5db' : '#6b7280', borderColor: isDark ? '#374151' : '#e5e7eb', backgroundColor: isDark ? '#1f2937' : '#fff' }}>
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Product sections — grid is clickable for columns */}
        {sections.length > 0 ? sections.map(section => (
          <div key={section.name}>
            <div className="flex items-center gap-2 mb-2">
              <p className="font-bold whitespace-nowrap" style={{ fontSize: 12, color: isDark ? '#f3f4f6' : '#111827' }}>{section.name}</p>
              <div className="flex-1 h-px" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }} />
            </div>
            <div
              {...hoverProps('columns')}
              onClick={() => onElementClick?.('columns')}
              title={onElementClick ? 'Clic para editar columnas' : undefined}
              style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, cursor: onElementClick ? 'pointer' : 'default', borderRadius: 8, ...ringStyle('columns') }}
            >
              {section.items.slice(0, cols * 2).map(p => {
                const cs = p.custom_styles || {};
                const imgs = Array.isArray(p.images) && p.images.filter(Boolean).length > 0
                  ? p.images.filter(Boolean) : p.image_url ? [p.image_url] : [];
                const compact = cols >= 3;
                const titleStyle = {
                  fontSize: TITLE_FONT_SIZE[cs.font_size || theme.title_size || 'base'],
                  fontFamily: cs.font_family || undefined,
                  color: theme.title_text_color || (isDark ? '#f3f4f6' : '#111827'),
                };
                const borderColor = cs.is_sale ? (cs.sale_color || '#ef4444') : (isDark ? '#374151' : '#f3f4f6');
                return (
                  <div key={p.id} className="rounded-xl overflow-hidden flex flex-col"
                    style={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: `2px solid ${borderColor}` }}>
                    <div className="relative" style={{ aspectRatio: '1/1', backgroundColor: isDark ? '#374151' : '#f9fafb' }}>
                      {imgs[0]
                        ? <img src={imgs[0]} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 20, color: '#d1d5db' }}>🛍️</div>
                      }
                      {cs.is_sale && (
                        <div className="absolute top-1 left-1 text-white font-bold px-1.5 py-0.5 rounded-full"
                          style={{ fontSize: 8, backgroundColor: cs.sale_color || '#ef4444' }}>SALE</div>
                      )}
                      {!p.in_stock && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                          <span className="bg-white font-bold px-2 py-0.5 rounded-full" style={{ fontSize: 9, color: '#374151' }}>Agotado</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: compact ? '5px' : '7px' }} className="flex flex-col flex-1 gap-0.5">
                      {/* Product title — clickable */}
                      <p
                        className="font-bold leading-snug line-clamp-1 cursor-pointer"
                        style={titleStyle}
                        title={onElementClick ? 'Clic para editar el tamaño del título' : undefined}
                        onClick={(e) => { e.stopPropagation(); onElementClick?.('product-title'); }}
                      >
                        {p.name}
                      </p>
                      {cs.rating > 0 && (
                        <div className="flex">
                          {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 9, color: i <= cs.rating ? '#fbbf24' : '#d1d5db' }}>★</span>)}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-1 mt-auto pt-1">
                        {/* Price — clickable */}
                        <div
                          title={onElementClick ? 'Clic para editar el color del precio' : undefined}
                          onClick={(e) => { e.stopPropagation(); onElementClick?.('product-price'); }}
                          style={{ cursor: onElementClick ? 'pointer' : 'default' }}
                        >
                          {cs.is_sale && cs.sale_price ? (
                            <div>
                              <span style={{ fontSize: 9, color: '#9ca3af', textDecoration: 'line-through' }}>₪{Number(p.price).toLocaleString('he-IL')}</span>
                              <span style={{ ...priceStyle, display: 'inline' }}> ₪{Number(cs.sale_price).toLocaleString('he-IL')}</span>
                            </div>
                          ) : (
                            <span style={priceStyle}>₪{Number(p.price).toLocaleString('he-IL')}</span>
                          )}
                        </div>
                        {p.in_stock && (
                          <span className="text-white rounded-lg shrink-0"
                            style={{ fontSize: 9, padding: '3px 7px', backgroundColor: theme.primary_color || '#3B82F6' }}>
                            Consultar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )) : (
          <div className="text-center py-8" style={{ color: '#9ca3af' }}>
            <div style={{ fontSize: 32 }}>📦</div>
            <p style={{ fontSize: 12, marginTop: 6 }}>Los productos aparecerán aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}
