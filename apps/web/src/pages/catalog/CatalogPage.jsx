import { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../utils/apiClient';
import { useTenant } from '../../context/TenantContext';
import { t } from '../../i18n/translations';
import SearchBar from './SearchBar';
import ProductCard from './ProductCard';
import AboutSection from './AboutSection';
import FomoToast from '../../components/FomoToast';

/** Returns true/false/null (null = no schedule set) */
function getOpenStatus(hours) {
  if (!Array.isArray(hours) || hours.length === 0) return null;
  const now   = new Date();
  const today = hours[now.getDay()];
  if (!today?.open) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const [fh, fm] = (today.from || '00:00').split(':').map(Number);
  const [th, tm] = (today.to   || '23:59').split(':').map(Number);
  return cur >= fh * 60 + fm && cur < th * 60 + tm;
}

async function fetchProducts(slug) {
  const { data } = await apiClient.get(`/stores/${slug}/products`);
  return data;
}

const LANGS = [
  { code: 'es', flag: '🇦🇷', label: 'Español' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'he', flag: '🇮🇱', label: 'עברית'   },
];

const SORT_OPTIONS = [
  { value: 'default',    label: 'Relevancia'     },
  { value: 'price_asc',  label: '₪ Menor precio' },
  { value: 'price_desc', label: '₪ Mayor precio'  },
  { value: 'name_az',    label: 'Nombre (A–Z)'   },
  { value: 'newest',     label: 'Novedades'       },
];

const GRID_CLASS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
};

const STORE_TITLE_SIZES = {
  sm: '1rem', base: '1.25rem', lg: '1.5rem', xl: '1.875rem', '2xl': '2.25rem',
};

/** Convierte un color hex a rgba con alpha dado (0–1). */
function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return `rgba(0,0,0,${alpha})`;
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

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

// ── Carousel horizontal con loop infinito (vista "Todo") ─────────────────────
//
// Estrategia: triplicar los ítems → [clone_izq | reales | clone_der]
// El scroll se inicia al comienzo de la copia del medio (oneW).
// Cuando el usuario se aleja de esa zona, un salto silencioso lo devuelve
// a la posición equivalente dentro de la copia real — sin saltos visibles.
//
// oneW = N * (cardWidth + gap)  → garantiza que el salto aterrice en un snap‑point exacto.
//
function CategoryCarousel({ section, headerBg, onViewMore, lang }) {
  const scrollRef  = useRef(null);
  const isJumping  = useRef(false);   // bloquea el rebalance durante el salto
  const debounceId = useRef(null);

  const items    = section.items;
  const canLoop  = items.length >= 2; // 1 ítem no tiene sentido loopear
  // Tres copias: izq-clone | real | der-clone
  const displayed = canLoop ? [...items, ...items, ...items] : items;

  // Ancho de UNA copia: N * (cardWidth + gap-3)
  // Se mide en runtime para no hardcodear breakpoints.
  const getOneWidth = useCallback(() => {
    const el   = scrollRef.current;
    if (!el) return 0;
    const card = el.querySelector('[data-card]');
    if (!card) return el.scrollWidth / 3;
    // getBoundingClientRect().width incluye fracciones de píxel
    return items.length * (card.getBoundingClientRect().width + 12);
  }, [items.length]);

  // ── Posición inicial: primer ítem de la copia real ─────────────────────────
  // useLayoutEffect: antes del primer paint, evita flash de los clones
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !canLoop) return;
    // requestAnimationFrame asegura que el layout ya calculó scrollWidth
    const id = requestAnimationFrame(() => {
      el.scrollLeft = getOneWidth();
    });
    return () => cancelAnimationFrame(id);
  }, [canLoop, getOneWidth]);

  // ── Rebalanceo: normaliza scrollLeft al rango [oneW, 2·oneW) ──────────────
  // Usa aritmética modular para garantizar que el destino sea siempre un snap-point.
  const rebalance = useCallback(() => {
    const el   = scrollRef.current;
    if (!el || !canLoop || isJumping.current) return;

    const oneW   = getOneWidth();
    if (oneW <= 0) return;
    const sl     = el.scrollLeft;

    // offset = posición relativa dentro de cualquier copia (siempre ≥ 0)
    const offset   = ((sl % oneW) + oneW) % oneW;
    const target   = oneW + offset;  // siempre en [oneW, 2·oneW)

    if (Math.abs(target - sl) > 1) {
      isJumping.current = true;
      el.scrollLeft = target;        // salto instantáneo, sin animación
      requestAnimationFrame(() => { isJumping.current = false; });
    }
  }, [canLoop, getOneWidth]);

  // ── Debounce + scrollend (progressive enhancement) ────────────────────────
  const onScroll = useCallback(() => {
    if (isJumping.current) return;
    clearTimeout(debounceId.current);
    debounceId.current = setTimeout(rebalance, 100);
  }, [rebalance]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !canLoop) return;
    el.addEventListener('scroll',    onScroll,  { passive: true });
    el.addEventListener('scrollend', rebalance);   // Chrome 114+, FF 109+
    return () => {
      el.removeEventListener('scroll',    onScroll);
      el.removeEventListener('scrollend', rebalance);
      clearTimeout(debounceId.current);
    };
  }, [canLoop, onScroll, rebalance]);

  // ── Flechas: avanza/retrocede un card, loopea en los bordes ──────────────
  const scrollStep = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const card  = el.querySelector('[data-card]');
    const step  = card ? card.getBoundingClientRect().width + 12 : 175;
    const oneW  = getOneWidth();
    const after = el.scrollLeft + dir * step;

    if (after < oneW || after >= oneW * 2) {
      // Borde alcanzado: saltar a la copia opuesta y luego deslizar
      isJumping.current = true;
      el.scrollLeft = dir > 0 ? el.scrollLeft - oneW : el.scrollLeft + oneW;
      requestAnimationFrame(() => {
        isJumping.current = false;
        el.scrollBy({ left: dir * step, behavior: 'smooth' });
      });
    } else {
      el.scrollBy({ left: dir * step, behavior: 'smooth' });
    }
  }, [getOneWidth]);

  const CARD_W = 'w-[155px] sm:w-[175px] shrink-0';
  const ARROW  = `hidden md:flex absolute top-1/2 -translate-y-1/2 z-20
                  w-8 h-8 rounded-full shadow-lg
                  bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm
                  border border-gray-200 dark:border-gray-600
                  items-center justify-center text-gray-600 dark:text-gray-300
                  text-xl leading-none select-none
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  hover:bg-white dark:hover:bg-gray-700 active:scale-90`;

  return (
    <div className="space-y-2">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
            {section.name}
          </h2>
          <span className="text-xs text-gray-400 shrink-0">
            {items.length} {t(lang, 'items')}
          </span>
        </div>
        <button
          onClick={onViewMore}
          className="shrink-0 text-xs font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
          style={{ color: headerBg }}
        >
          Ver todos <span className="text-sm ml-0.5">›</span>
        </button>
      </div>

      {/* ── Track con flechas (hover del grupo) ── */}
      {/* overflow-hidden: evita que los ítems clonados expandan el ancho */}
      <div className="relative group overflow-hidden rounded-xl">
        {/* Flecha izquierda */}
        <button
          onClick={() => scrollStep(-1)}
          className={`${ARROW} left-1`}
          aria-label="Anterior"
        >‹</button>

        <div
          ref={scrollRef}
          className="hide-scrollbar flex gap-3 overflow-x-auto pb-2 overscroll-x-contain"
          style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}
        >
          {displayed.map((product, i) => (
            <div
              key={`${product.id}-${i}`}
              data-card
              className={CARD_W}
              style={{ scrollSnapAlign: 'start' }}
            >
              <ProductCard product={product} columns={2} />
            </div>
          ))}
        </div>

        {/* Flecha derecha */}
        <button
          onClick={() => scrollStep(1)}
          className={`${ARROW} right-1`}
          aria-label="Siguiente"
        >›</button>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const { slug } = useParams();
  const store    = useTenant();
  const [search,         setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTab,      setActiveTab]      = useState('products');
  const [sortBy,         setSortBy]         = useState('default');
  const [langOpen,       setLangOpen]       = useState(false);
  const [copied,         setCopied]         = useState(false);
  const langRef = useRef(null);
  // User-controlled overrides persisted in localStorage
  const [userLang,       setUserLang_]      = useState(null);
  const [userDark,       setUserDark_]      = useState(null);

  // Close language dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  // Load saved prefs for this store on mount
  useEffect(() => {
    if (!slug) return;
    try {
      const sl = localStorage.getItem(`sf_lang_${slug}`);
      const sd = localStorage.getItem(`sf_dark_${slug}`);
      if (sl) setUserLang_(sl);
      if (sd !== null) setUserDark_(sd === 'true');
    } catch {}
  }, [slug]);

  const setLang = (l) => {
    setUserLang_(l);
    try { localStorage.setItem(`sf_lang_${slug}`, l); } catch {}
  };
  const setDark = (d) => {
    setUserDark_(d);
    try { localStorage.setItem(`sf_dark_${slug}`, String(d)); } catch {}
  };

  const shareStore = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && navigator.canShare?.({ title: store?.name, url })) {
        await navigator.share({ title: store?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {}
  };

  const hasActiveFilters = !!(search || activeCategory || sortBy !== 'default');
  const clearFilters = () => { setSearch(''); setActiveCategory(null); setSortBy('default'); };

  const theme   = store?.theme   || {};
  const contact = store?.contact || {};
  // User override wins over store default
  const lang    = userLang ?? theme.language ?? 'es';
  const openStatus = getOpenStatus(contact.hours);
  const isRTL   = lang === 'he';
  const isDark  = userDark !== null ? userDark : (theme.dark_mode === true);
  const desktopCols = theme.catalog_columns ?? 2;
  const gridClass   = GRID_CLASS[desktopCols] ?? 'grid-cols-2';

  const headerBg        = theme.header_bg_color || theme.primary_color || '#3B82F6';
  const headerTextColor = theme.header_text_color || '#ffffff';
  const titleAlign      = theme.title_align || 'left';
  const titleFontSize   = STORE_TITLE_SIZES[theme.title_font_size || 'xl'] || '1.875rem';

  // Marquee-specific overrides
  const marqueeBg        = theme.announcement_bg_color  || null;
  const marqueeTextColor = theme.announcement_text_color || headerTextColor;
  const marqueeNeonStyle = theme.announcement_neon
    ? { textShadow: '0 0 6px currentColor, 0 0 14px currentColor, 0 0 28px currentColor' }
    : {};

  // Format marquee text: in 'spaced' mode, widen the gaps around bullet separators
  const fmtMarquee = (text) => {
    if (!text) return text;
    if (theme.announcement_separator === 'spaced') {
      return text.split('•').map(s => s.trim()).filter(Boolean).join('     •     ');
    }
    return text;
  };

  useEffect(() => {
    // Apply to body so Tailwind's .dark .dark:* descendant selectors work correctly
    isDark ? document.body.classList.add('dark') : document.body.classList.remove('dark');
    document.getElementById('catalog-root')?.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    return () => document.body.classList.remove('dark');
  }, [isDark, isRTL]);

  // ── SEO: dynamic meta tags ──────────────────────────────────────────────────
  useEffect(() => {
    if (!store) return;
    const title = store.name || 'Tienda';
    const desc  = store.theme?.subtitle || `Catálogo de productos de ${title}`;
    const image = store.theme?.banner_url || store.theme?.logo_url || '';

    document.title = title;

    const setMeta = (selector, content) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attr, val] = selector.replace(/[\[\]]/g, '').split('=');
        el.setAttribute(attr, val.replace(/"/g, ''));
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]',         desc);
    setMeta('meta[property="og:title"]',         title);
    setMeta('meta[property="og:description"]',   desc);
    setMeta('meta[property="og:type"]',          'website');
    if (image) setMeta('meta[property="og:image"]', image);
  }, [store]);

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
    if (sortBy !== 'default') {
      const cmp =
        sortBy === 'price_asc'  ? (a, b) => Number(a.price) - Number(b.price) :
        sortBy === 'price_desc' ? (a, b) => Number(b.price) - Number(a.price) :
        sortBy === 'name_az'    ? (a, b) => a.name.localeCompare(b.name)       :
        sortBy === 'newest'     ? (a, b) => (b.id || 0) - (a.id || 0)         : null;
      if (cmp) result = result.map(s => ({ ...s, items: [...s.items].sort(cmp) }));
    }
    return result;
  }, [sections, activeCategory, search, sortBy]);

  const waLink = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp}${
        contact.whatsapp_message
          ? `?text=${encodeURIComponent(contact.whatsapp_message)}`
          : ''
      }`
    : null;

  return (
    <div id="catalog-root"
      className="min-h-screen font-main transition-colors duration-300"
      style={{ backgroundColor: isDark ? 'var(--bg-color)' : (theme.secondary_color || '#F9FAFB') }}>

      {(() => {
        const showTitleBg     = theme.show_title_bg !== false;
        const overlayOpacity  = showTitleBg ? (theme.header_overlay_opacity ?? 100) / 100 : 0;
        // Text needs shadow when floating over a photo (no bg, or nearly transparent bg)
        const needsTextShadow = theme.banner_url && (!showTitleBg || overlayOpacity < 0.7);
        const waStyle = getWordArtStyle(theme);
        const titleTextStyle = {
          fontSize:   titleFontSize,
          color:      headerTextColor,
          ...waStyle,
          ...(needsTextShadow && !waStyle.textShadow && {
            textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.6)',
          }),
        };

        return theme.banner_url ? (
          <>
            {/* ── Banner: imagen de fondo + overlay de color configurable ── */}
            <div className="relative w-full overflow-hidden" style={{ height: 200 }}>
              {/* Capa 1: imagen — objectPosition controla el encuadre vertical */}
              <img src={theme.banner_url} alt="banner" className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: `center ${theme.banner_position_y ?? 50}%` }} />
              {/* Capa 2: overlay rgba — solo se renderiza si show_title_bg está activo */}
              {showTitleBg && overlayOpacity > 0 && (
                <div className="absolute inset-0" style={{ backgroundColor: hexToRgba(headerBg, overlayOpacity) }} />
              )}
              {/* Capa 3: título — solo si show_title no está desactivado */}
              {theme.show_title !== false && (
                <div className="absolute bottom-0 inset-x-0 px-4 pb-4 z-10">
                  <div className="max-w-5xl mx-auto flex items-end gap-3">
                    {theme.logo_type !== 'text' && theme.logo_url && (
                      <img src={theme.logo_url} alt={store?.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white/50 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0" style={{ textAlign: titleAlign }}>
                      <h1 className="font-bold leading-tight truncate" style={titleTextStyle}>
                        {store?.name}
                      </h1>
                      {theme.subtitle
                        ? <p className="text-xs mt-0.5 truncate" style={{ color: headerTextColor + 'bb', textShadow: needsTextShadow ? '0 1px 4px rgba(0,0,0,0.8)' : undefined }}>{theme.subtitle}</p>
                        : <p className="text-xs mt-0.5" style={{ color: headerTextColor + '99', textShadow: needsTextShadow ? '0 1px 4px rgba(0,0,0,0.8)' : undefined }}>{products.length} {t(lang, 'items')}</p>
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* ── Franja sticky — con marquesina si hay texto configurado ── */}
            <div
              className="sticky top-0 z-10 shadow-md overflow-hidden marquee-track"
              style={{
                backgroundColor: marqueeBg || (showTitleBg ? headerBg : 'rgba(0,0,0,0.55)'),
                backdropFilter:  (!marqueeBg && !showTitleBg) ? 'blur(8px)' : undefined,
                '--marquee-dur': `${theme.announcement_speed ?? 25}s`,
              }}
            >
              <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2">
                {theme.logo_type !== 'text' && theme.logo_url && (
                  <img src={theme.logo_url} alt={store?.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                )}

                {/* Centro: marquesina animada O nombre estático */}
                <div className="flex-1 overflow-hidden min-w-0">
                  {theme.announcement_text ? (
                    <span
                      className={`inline-block whitespace-nowrap text-sm font-semibold ${
                        theme.announcement_dir === 'rtl' ? 'animate-marquee-rtl' : 'animate-marquee'
                      }`}
                      style={{ color: marqueeTextColor, fontFamily: theme.wordart_font || undefined, ...marqueeNeonStyle }}
                    >
                      {fmtMarquee(theme.announcement_text)}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-sm truncate" style={{ color: headerTextColor, fontFamily: theme.wordart_font || undefined }}>
                        {store?.name}
                      </span>
                      <span className="text-xs shrink-0" style={{ color: headerTextColor + '80' }}>
                        {products.length} {t(lang, 'items')}
                      </span>
                    </div>
                  )}
                </div>

                <button onClick={shareStore} title="Compartir tienda"
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/20 active:scale-95"
                  style={{ color: headerTextColor }}>
                  🔗
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── Sin banner: header sólido sticky ── */
          <header
            className="sticky top-0 z-10 shadow-md overflow-hidden marquee-track"
            style={{ backgroundColor: headerBg, '--marquee-dur': `${theme.announcement_speed ?? 25}s` }}
          >
            {/* Fila principal: logo + nombre + share */}
            <div className="max-w-5xl mx-auto px-4 pt-3 pb-2 flex items-center gap-3">
              {theme.logo_type !== 'text' && theme.logo_url && (
                <img src={theme.logo_url} alt={store?.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white/30 shrink-0" />
              )}
              {theme.show_title !== false && (
                <div className="flex-1 min-w-0" style={{ textAlign: titleAlign }}>
                  <h1 className="font-bold leading-tight truncate" style={titleTextStyle}>
                    {store?.name}
                  </h1>
                  {theme.subtitle
                    ? <p className="text-xs mt-0.5 truncate" style={{ color: headerTextColor + 'bb' }}>{theme.subtitle}</p>
                    : <p className="text-xs mt-0.5" style={{ color: headerTextColor + '99' }}>{products.length} {t(lang, 'items')}</p>
                  }
                </div>
              )}
              <button onClick={shareStore} title="Compartir tienda"
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/20 active:scale-95"
                style={{ color: headerTextColor }}>
                🔗
              </button>
            </div>
            {/* Franja marquesina — solo si hay texto configurado */}
            {theme.announcement_text && (
              <div
                className="border-t pb-2 pt-1"
                style={{
                  borderColor: marqueeTextColor + '25',
                  ...(marqueeBg ? { backgroundColor: marqueeBg } : {}),
                }}
              >
                <span
                  className={`inline-block whitespace-nowrap text-xs font-semibold px-4 ${
                    theme.announcement_dir === 'rtl' ? 'animate-marquee-rtl' : 'animate-marquee'
                  }`}
                  style={{ color: marqueeBg ? marqueeTextColor : marqueeTextColor + 'cc', ...marqueeNeonStyle }}
                >
                  {fmtMarquee(theme.announcement_text)}
                </span>
              </div>
            )}
          </header>
        );
      })()}

      <div className="max-w-5xl mx-auto px-4 py-4">

        {/* ── Tab bar: Productos / Nosotros / Contacto ── */}
        <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 mb-4">
          {[
            ['products', `🏪 ${t(lang, 'products') || 'Productos'}`],
            ['about',    `✨ ${t(lang, 'about')    || 'Nosotros'}`],
            ['contact',  `📞 ${t(lang, 'contact')  || 'Contacto'}`],
          ].map(([key, label]) => (
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
            <SearchBar
              value={search}
              onChange={setSearch}
              products={products}
              placeholder={t(lang, 'search')}
            />

            {/* Sort + clear */}
            <div className="flex items-center gap-2 mt-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                style={{ focusRingColor: headerBg }}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors bg-white dark:bg-gray-800 dark:border-gray-700"
                >
                  ✕ Limpiar
                </button>
              )}
            </div>

            {/* Mobile: category pills */}
            {categories.length > 1 && (
              <div className="md:hidden flex gap-2 overflow-x-auto pb-1 mt-3 -mx-4 px-4">
                <button onClick={() => setActiveCategory(null)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors shadow-sm"
                  style={!activeCategory
                    ? { backgroundColor: theme.primary_color || '#3B82F6', color: '#fff' }
                    : { backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }
                  }>
                  {t(lang, 'all')}
                </button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors"
                    style={activeCategory === cat
                      ? { backgroundColor: theme.primary_color || '#3B82F6', color: '#fff' }
                      : { backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }
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
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                      <li>
                        <button onClick={() => setActiveCategory(null)}
                          className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors rounded-lg ${
                            !activeCategory
                              ? 'text-white'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-gray-100'
                          }`}
                          style={!activeCategory
                            ? { backgroundColor: headerBg }
                            : { borderLeft: `3px solid transparent` }
                          }>
                          <span className="flex items-center justify-between">
                            <span>{t(lang, 'all')}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${!activeCategory ? 'bg-white/25' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                              {products.length}
                            </span>
                          </span>
                        </button>
                      </li>
                      {categories.map(cat => {
                        const count = sections.find(s => s.name === cat)?.items.length ?? 0;
                        const isActive = activeCategory === cat;
                        return (
                          <li key={cat}>
                            <button onClick={() => setActiveCategory(isActive ? null : cat)}
                              className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-all rounded-lg ${
                                isActive
                                  ? 'text-white'
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-gray-100'
                              }`}
                              style={isActive
                                ? { backgroundColor: headerBg }
                                : { borderLeft: `3px solid transparent` }
                              }>
                              <span className="flex items-center justify-between">
                                <span className="truncate">{cat}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${isActive ? 'bg-white/25' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                  {count}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </aside>
              )}

              {/* Product sections:
                    - Sin categoría activa + sin búsqueda → carruseles por categoría (Netflix)
                    - Con categoría o búsqueda activa → grilla vertical normal              */}
              {/* min-w-0: previene que el 1fr del grid CSS expanda más allá de su columna */}
              <div className={`min-w-0 ${!activeCategory && !search.trim() ? 'space-y-8' : 'space-y-6'}`}>
                {visibleSections.length > 0 ? (
                  visibleSections.map(section =>
                    !activeCategory && !search.trim() ? (
                      /* ── Modo carrusel horizontal ── */
                      <CategoryCarousel
                        key={section.name}
                        section={section}
                        headerBg={headerBg}
                        lang={lang}
                        onViewMore={() => setActiveCategory(section.name)}
                      />
                    ) : (
                      /* ── Modo grilla vertical ── */
                      <div key={section.name}>
                        {!activeCategory && (
                          <div className="flex items-center gap-3 mb-3">
                            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {section.name}
                            </h2>
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                            <span className="text-xs text-gray-400 shrink-0">
                              {section.items.length} {t(lang, 'items')}
                            </span>
                          </div>
                        )}
                        {activeCategory && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                              {section.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {section.items.length} {t(lang, 'items')}
                            </span>
                          </div>
                        )}
                        <div className={`grid gap-3 ${gridClass}`}>
                          {section.items.map(product => (
                            <ProductCard key={product.id} product={product} columns={desktopCols} />
                          ))}
                        </div>
                      </div>
                    )
                  )
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

        {/* ── TAB: Nosotros ── */}
        {activeTab === 'about' && (
          <AboutSection
            about={store?.about || {}}
            theme={theme}
            store={{ name: store?.name, contact, ...store }}
          />
        )}

        {/* ── TAB: Contacto Pro ── */}
        {activeTab === 'contact' && (
          <div className="max-w-sm mx-auto space-y-4 py-4">

            {/* Open/Closed indicator + schedule */}
            {Array.isArray(contact.hours) && contact.hours.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${openStatus === true ? 'bg-green-500 animate-pulse' : openStatus === false ? 'bg-red-500' : 'bg-gray-400'}`} />
                    <span className={`font-bold text-base ${openStatus === true ? 'text-green-600' : openStatus === false ? 'text-red-500' : 'text-gray-500'}`}>
                      {openStatus === true ? 'Abierto ahora' : openStatus === false ? 'Cerrado ahora' : 'Sin horario'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">🕐 Horarios</span>
                </div>

                {/* Schedule table */}
                <div className="space-y-1">
                  {contact.hours.map(h => {
                    const isToday = h.day === new Date().getDay();
                    return (
                      <div key={h.day}
                        className={`flex items-center justify-between text-sm py-1 px-2 rounded-lg ${isToday ? 'bg-primary/5 font-semibold' : ''}`}>
                        <span className={isToday ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}>{h.label}</span>
                        {h.open
                          ? <span className={isToday ? 'text-primary' : 'text-gray-500'}>{h.from} — {h.to}</span>
                          : <span className="text-red-400 text-xs">Cerrado</span>
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WhatsApp */}
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 w-full bg-green-500 text-white p-4 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shrink-0">💬</div>
                <div>
                  <p className="font-bold text-sm">{t(lang, 'talkToStore')}</p>
                  {contact.whatsapp && <p className="text-white/70 text-xs">+{contact.whatsapp}</p>}
                </div>
              </a>
            )}

            {/* Phone */}
            {contact.phone && (
              <a href={`tel:${contact.phone}`}
                className="flex items-center gap-4 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 p-4 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl shrink-0">📞</div>
                <div>
                  <p className="font-bold text-sm">Llamar</p>
                  <p className="text-gray-400 text-xs">{contact.phone}</p>
                </div>
              </a>
            )}

            {/* Google Maps */}
            {contact.maps_url && (
              <a href={contact.maps_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 p-4 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xl shrink-0">📍</div>
                <div>
                  <p className="font-bold text-sm">{t(lang, 'howToGet')}</p>
                  <p className="text-gray-400 text-xs">Google Maps</p>
                </div>
              </a>
            )}

            {/* Waze */}
            {contact.waze_url && (
              <a href={contact.waze_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 p-4 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-xl shrink-0">🚗</div>
                <div>
                  <p className="font-bold text-sm">Waze</p>
                  <p className="text-gray-400 text-xs">Abrir en Waze</p>
                </div>
              </a>
            )}

            {/* Instagram */}
            {contact.instagram && (
              <a href={`https://instagram.com/${contact.instagram.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 p-4 rounded-2xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-xl shrink-0">📸</div>
                <div>
                  <p className="font-bold text-sm">Instagram</p>
                  <p className="text-gray-400 text-xs">{contact.instagram}</p>
                </div>
              </a>
            )}
          </div>
        )}

        <div className="pb-24" />
      </div>

      {/* ── Toast: enlace copiado ── */}
      {copied && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in">
          <span>✅</span> ¡Enlace copiado!
        </div>
      )}

      {/* ── Controles: Modo Oscuro + Idioma — esquina superior derecha ── */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2">

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(!isDark)}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md border border-gray-200 dark:border-gray-700 text-base transition-all hover:scale-110 active:scale-95"
        >
          {isDark ? '🌙' : '☀️'}
        </button>

        {/* Language picker */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(o => !o)}
            title="Cambiar idioma"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md border border-gray-200 dark:border-gray-700 text-base transition-all hover:scale-110 active:scale-95"
          >
            {LANGS.find(l => l.code === lang)?.flag ?? '🌐'}
          </button>
          {langOpen && (
            <div className="absolute top-full right-0 mt-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden w-36">
              {LANGS.map(l => (
                <button key={l.code}
                  onClick={() => { setLang(l.code); setLangOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    lang === l.code
                      ? 'font-bold text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  style={lang === l.code ? { backgroundColor: headerBg } : {}}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FOMO Toast ── */}
      <FomoToast products={products} primaryColor={headerBg} />

      {/* ── FAB flotante ── */}
      {contact.fab_type && (() => {
        const fabHref =
          contact.fab_type === 'whatsapp' ? (waLink || '#') :
          contact.fab_type === 'call'     ? `tel:${contact.phone}` :
          contact.fab_type === 'reserve'  ? (contact.fab_reserve_url || '#') : null;
        const fabIcon =
          contact.fab_type === 'whatsapp' ? '💬' :
          contact.fab_type === 'call'     ? '📞' :
          contact.fab_type === 'reserve'  ? '📅' : null;
        const fabLabel =
          contact.fab_type === 'whatsapp' ? t(lang, 'talkToStore') :
          contact.fab_type === 'call'     ? 'Llamar' : 'Reservar';

        if (!fabHref || !fabIcon) return null;
        return (
          <a href={fabHref} target="_blank" rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl text-white font-semibold text-sm transition-transform active:scale-95 hover:scale-105"
            style={{ backgroundColor: headerBg }}>
            <span className="text-lg leading-none">{fabIcon}</span>
            <span>{fabLabel}</span>
          </a>
        );
      })()}
    </div>
  );
}
