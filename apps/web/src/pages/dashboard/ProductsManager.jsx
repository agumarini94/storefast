import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '../../context/DashboardContext';
import ImageUpload from '../../components/ImageUpload';
import MiniImageUpload from '../../components/MiniImageUpload';
import SmartCategorySelect from '../../components/SmartCategorySelect';

const FONTS = ['Inter', 'Roboto', 'Poppins', 'Merriweather', 'Playfair Display'];
const ANIMATIONS = [
  { value: 'none',   label: 'Ninguna' },
  { value: 'scale',  label: '🔍 Zoom' },
  { value: 'glow',   label: '✨ Sombra' },
  { value: 'bounce', label: '↑ Flota' },
  { value: 'pulse',  label: '💫 Destello' },
];
const TITLE_SIZES = [
  { value: 'xs', label: 'XS' }, { value: 'sm', label: 'S' },
  { value: 'base', label: 'M' }, { value: 'lg', label: 'L' }, { value: 'xl', label: 'XL' },
];

const defaultStyles = {
  font_family:    '',
  font_size:      'base',
  title_position: 'left',
  bg_type:        'none',
  bg_value:       '',
  animation:      'none',
  rating:         0,
  is_sale:        false,
  sale_price:     '',
  sale_color:     '#ef4444',
  badge:          '',
  button_color:   '',
};

const BADGES = [
  { value: '',       label: 'Sin badge' },
  { value: 'SALE',   label: '🏷 SALE'   },
  { value: 'NUEVO',  label: '✨ NUEVO'  },
  { value: 'ÚLTIMO', label: '⚡ ÚLTIMO' },
  { value: 'OFERTA', label: '🔥 OFERTA' },
];

const emptyForm = {
  name: '', price: '', category: '', description: '',
  image_url: '', in_stock: true, stock: '',
  variants: [],
  images: ['', '', ''],
  custom_styles: { ...defaultStyles },
};

const PAGE_SIZE  = 10;
const TITLE_FS   = { xs: 10, sm: 11, base: 13, lg: 15, xl: 17 };

// ── Mini preview card ─────────────────────────────────────────────────────────
function MiniCardPreview({ form }) {
  const cs = form.custom_styles || {};
  const images     = (form.images || []).filter(Boolean);
  const saleColor  = cs.sale_color || '#ef4444';
  const titleAlign = cs.title_position === 'center' ? 'center'
                   : cs.title_position === 'right'  ? 'right' : 'left';

  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-dashed border-gray-300">
      <p className="text-xs font-medium text-gray-400 mb-2 text-center tracking-wide uppercase">Vista previa en vivo</p>
      <div className="mx-auto bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm" style={{ maxWidth: 180 }}>

        {/* Imagen */}
        <div className="relative bg-gray-100" style={{ aspectRatio: '1/1' }}>
          {images[0]
            ? <img src={images[0]} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🛍️</div>
          }
          {(cs.badge || cs.is_sale) && (
            <div className="absolute top-1.5 left-1.5 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow"
              style={{ backgroundColor: cs.badge ? (cs.is_sale ? saleColor : '#1f2937') : saleColor }}>
              {cs.badge || 'SALE'}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-2 space-y-1">
          {cs.rating > 0 && (
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ fontSize: 11, color: i <= cs.rating ? '#fbbf24' : '#e5e7eb' }}>★</span>
              ))}
            </div>
          )}
          <h3 className="font-bold text-gray-900 leading-snug line-clamp-2"
            style={{ fontSize: TITLE_FS[cs.font_size || 'base'], fontFamily: cs.font_family || undefined, textAlign: titleAlign }}>
            {form.name || 'Nombre del producto'}
          </h3>
          <div className="flex items-center justify-between gap-1 pt-1">
            <div>
              {cs.is_sale && cs.sale_price ? (
                <div>
                  <div className="text-xs text-gray-400 line-through">
                    ₪{Number(form.price || 0).toLocaleString('he-IL')}
                  </div>
                  <div style={{ color: '#f97316', fontWeight: 800, fontSize: 14 }}>
                    ₪{Number(cs.sale_price).toLocaleString('he-IL')}
                  </div>
                </div>
              ) : (
                <span style={{ color: '#f97316', fontWeight: 800, fontSize: 14 }}>
                  ₪{Number(form.price || 0).toLocaleString('he-IL')}
                </span>
              )}
            </div>
            <span className="text-xs px-2 py-1 rounded-lg text-white font-semibold shrink-0"
              style={{ backgroundColor: cs.button_color || '#3B82F6' }}>
              Consultar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProductsManager() {
  const { activeStore, authApi } = useDashboard();
  const queryClient = useQueryClient();

  const [form,          setForm]          = useState(emptyForm);
  const [editing,       setEditing]       = useState(null);
  const [open,          setOpen]          = useState(false);
  const [styleOpen,     setStyleOpen]     = useState(false);
  const [variantInput,  setVariantInput]  = useState('');
  const keepOpenRef = useRef(false);

  // List controls
  const [search,    setSearch]    = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [page,      setPage]      = useState(1);

  const slug = activeStore?.slug;

  const { data: products = [] } = useQuery({
    queryKey: ['dashboard-products', slug],
    queryFn: async () => {
      const { data } = await authApi().get(`/stores/${slug}/products`);
      return data;
    },
    enabled: !!slug,
  });

  const categories = useMemo(() => (
    [...new Set(products.map(p => p.category).filter(Boolean))]
  ), [products]);

  const filtered = useMemo(() => {
    let res = products;
    if (search.trim()) res = res.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (filterCat)     res = res.filter(p => p.category === filterCat);
    return res;
  }, [products, search, filterCat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, filterCat]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const images = (data.images || []).filter(Boolean);
      const stockVal = data.stock !== '' && data.stock != null ? Number(data.stock) : null;
      const payload = { ...data, images, image_url: images[0] || data.image_url || '', stock: stockVal };
      return editing
        ? authApi().patch(`/stores/${slug}/products/${editing}`, payload)
        : authApi().post(`/stores/${slug}/products`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-products', slug] });
      if (keepOpenRef.current) {
        // "Guardar y crear otro": reset solo name/price/description, mantener cat+imagen+estilos
        keepOpenRef.current = false;
        setEditing(null);
        setForm(f => ({
          ...emptyForm,
          category:      f.category,
          images:        f.images,
          image_url:     f.images.filter(Boolean)[0] || '',
          custom_styles: f.custom_styles,
        }));
      } else {
        setForm(emptyForm);
        setEditing(null);
        setOpen(false);
        setStyleOpen(false);
      }
    },
  });

  const toggleStock = useMutation({
    mutationFn: ({ id, in_stock }) =>
      authApi().patch(`/stores/${slug}/products/${id}`, { in_stock: !in_stock }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard-products', slug] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => authApi().delete(`/stores/${slug}/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard-products', slug] }),
  });

  const openEdit = (product) => {
    const imgs = Array.isArray(product.images) && product.images.length > 0
      ? [...product.images, '', ''].slice(0, 3)
      : [product.image_url || '', '', ''];
    setForm({
      name:          product.name,
      price:         product.price,
      category:      product.category    || '',
      description:   product.description || '',
      image_url:     product.image_url   || '',
      in_stock:      product.in_stock,
      stock:         product.stock != null ? String(product.stock) : '',
      variants:      Array.isArray(product.variants) ? product.variants : [],
      images:        imgs,
      custom_styles: { ...defaultStyles, ...(product.custom_styles || {}) },
    });
    setEditing(product.id);
    setOpen(true);
    setStyleOpen(false);
  };

  const openDuplicate = (product) => {
    const imgs = Array.isArray(product.images) && product.images.length > 0
      ? [...product.images, '', ''].slice(0, 3)
      : [product.image_url || '', '', ''];
    setForm({
      name:          `${product.name} (copia)`,
      price:         product.price,
      category:      product.category    || '',
      description:   product.description || '',
      image_url:     product.image_url   || '',
      in_stock:      product.in_stock,
      stock:         product.stock != null ? String(product.stock) : '',
      variants:      Array.isArray(product.variants) ? product.variants : [],
      images:        imgs,
      custom_styles: { ...defaultStyles, ...(product.custom_styles || {}) },
    });
    setEditing(null);   // sin ID → crea nuevo
    setOpen(true);
    setStyleOpen(false);
  };

  const closeModal = () => {
    setOpen(false);
    setForm(emptyForm);
    setEditing(null);
    setStyleOpen(false);
    setVariantInput('');
  };

  const addVariant = () => {
    const v = variantInput.trim();
    if (!v || form.variants.includes(v)) return;
    setForm(f => ({ ...f, variants: [...f.variants, v] }));
    setVariantInput('');
  };

  const removeVariant = (v) =>
    setForm(f => ({ ...f, variants: f.variants.filter(x => x !== v) }));

  const setImage = (i, url) => {
    const imgs = [...form.images];
    imgs[i] = url;
    setForm(f => ({ ...f, images: imgs }));
  };

  const setCs = (key, val) => setForm(f => ({
    ...f,
    custom_styles: { ...f.custom_styles, [key]: val },
  }));

  const cs = form.custom_styles;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Mis Productos</h2>
        <button
          onClick={() => { setForm(emptyForm); setEditing(null); setOpen(true); }}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          + Agregar
        </button>
      </div>

      {/* ── Búsqueda y filtros ── */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {categories.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setFilterCat('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                !filterCat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat === filterCat ? '' : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  filterCat === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        {(search || filterCat) && (
          <p className="text-xs text-gray-400">
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Lista paginada ── */}
      <div className="space-y-2">
        {paginated.map(p => (
          <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
            {p.image_url
              ? <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">📦</div>
            }
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
              <p className="text-xs text-gray-500">
                {p.category} · ₪{Number(p.price).toLocaleString('he-IL')}
                {p.stock != null && ` · stock: ${p.stock}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleStock.mutate(p)}
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  p.in_stock ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {p.in_stock ? 'Con stock' : 'Sin stock'}
              </button>
              <button onClick={() => openDuplicate(p)} className="text-gray-400 hover:text-blue-500" title="Duplicar">⧉</button>
              <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-gray-700" title="Editar">✏️</button>
              <button onClick={() => deleteMutation.mutate(p.id)} className="text-gray-400 hover:text-red-500" title="Eliminar">🗑️</button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-2">{search || filterCat ? '🔍' : '📦'}</div>
            <p className="text-sm">
              {search || filterCat ? 'No se encontraron productos' : 'Todavía no tenés productos'}
            </p>
          </div>
        )}
      </div>

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ‹
          </button>
          <span className="text-sm text-gray-500 font-medium">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ›
          </button>
        </div>
      )}

      {/* ── Modal Agregar/Editar ── */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={closeModal}>
          <div
            className="bg-white w-full rounded-t-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button onClick={closeModal} className="text-gray-400 text-xl leading-none">×</button>
            </div>

            {/* Fotos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotos del producto <span className="text-gray-400 font-normal">(hasta 3)</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map(i => (
                  <MiniImageUpload
                    key={i}
                    slot={i + 1}
                    value={form.images[i] || ''}
                    onChange={url => setImage(i, url)}
                  />
                ))}
              </div>
            </div>

            {/* Campos básicos */}
            {[
              { key: 'name',        label: 'Nombre',      type: 'text'   },
              { key: 'price',       label: 'Precio (₪)',  type: 'number' },
              { key: 'description', label: 'Descripción', type: 'text'   },
            ].map(({ key, label, type }) => (
              <input
                key={key}
                type={type}
                placeholder={label}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ))}

            <SmartCategorySelect
              value={form.category}
              onChange={val => setForm(f => ({ ...f, category: val }))}
              products={products}
            />

            {/* Variantes (talles / colores) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Variantes <span className="text-gray-400 font-normal">(talles, colores…)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: S, M, L, Rojo, Azul…"
                  value={variantInput}
                  onChange={e => setVariantInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariant())}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={addVariant}
                  className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold"
                >+</button>
              </div>
              {form.variants.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.variants.map(v => (
                    <span key={v} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                      {v}
                      <button type="button" onClick={() => removeVariant(v)} className="hover:text-red-500 leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <div
                  onClick={() => setForm(f => ({ ...f, in_stock: !f.in_stock }))}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form.in_stock ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.in_stock ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-gray-700">{form.in_stock ? 'Con stock' : 'Sin stock'}</span>
              </label>
              <div className="flex items-center gap-1.5 shrink-0">
                <label className="text-xs text-gray-500 whitespace-nowrap">Cantidad:</label>
                <input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 -mt-2">
              Dejá vacío si no controlás stock. Si ponés un número, se mostrará "¡Últimas unidades!" cuando queden menos de 3.
            </p>

            {/* Estilo personalizado */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setStyleOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50"
              >
                <span>🎨 Estilo de tarjeta</span>
                <span className="text-gray-400">{styleOpen ? '▲' : '▼'}</span>
              </button>

              {styleOpen && (
                <div className="p-4 space-y-4">

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Tipografía del título</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['', ...FONTS].map(f => (
                        <button key={f} type="button"
                          onClick={() => setCs('font_family', f)}
                          style={{ fontFamily: f || undefined }}
                          className={`py-2 px-2 rounded-lg text-xs border transition-colors ${
                            cs.font_family === f ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-gray-200 text-gray-700'
                          }`}>
                          {f || 'Por defecto'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Tamaño del título</label>
                    <div className="flex gap-1.5">
                      {TITLE_SIZES.map(s => (
                        <button key={s.value} type="button"
                          onClick={() => setCs('font_size', s.value)}
                          className={`flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-colors ${
                            cs.font_size === s.value ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600'
                          }`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Alineación del título</label>
                    <div className="flex gap-2">
                      {[['left', '⬅ Izq'], ['center', '↔ Centro'], ['right', 'Der ➡']].map(([val, lbl]) => (
                        <button key={val} type="button"
                          onClick={() => setCs('title_position', val)}
                          className={`flex-1 py-2 text-xs rounded-lg border-2 transition-colors ${
                            cs.title_position === val ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-gray-200 text-gray-600'
                          }`}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Fondo de la tarjeta</label>
                    <div className="flex gap-2 mb-2">
                      {[['none', 'Sin fondo'], ['color', 'Color sólido'], ['image', 'Imagen']].map(([val, lbl]) => (
                        <button key={val} type="button"
                          onClick={() => setCs('bg_type', val)}
                          className={`flex-1 py-2 text-xs rounded-lg border-2 transition-colors ${
                            cs.bg_type === val ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-gray-200 text-gray-600'
                          }`}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                    {cs.bg_type === 'color' && (
                      <div className="flex items-center gap-3">
                        <input type="color" value={cs.bg_value || '#ffffff'}
                          onChange={e => setCs('bg_value', e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                        <span className="text-xs text-gray-400 font-mono">{cs.bg_value || '#ffffff'}</span>
                      </div>
                    )}
                    {cs.bg_type === 'image' && (
                      <ImageUpload
                        label="Imagen de fondo"
                        value={cs.bg_value || ''}
                        onChange={url => setCs('bg_value', url)}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Animación al pasar el cursor</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {ANIMATIONS.map(a => (
                        <button key={a.value} type="button"
                          onClick={() => setCs('animation', a.value)}
                          className={`py-2 text-xs rounded-lg border-2 transition-colors ${
                            cs.animation === a.value ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-gray-200 text-gray-600'
                          }`}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Badge sobre la imagen</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {BADGES.map(b => (
                        <button key={b.value} type="button"
                          onClick={() => setCs('badge', b.value)}
                          className={`py-2 text-xs rounded-lg border-2 transition-colors ${
                            cs.badge === b.value ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-gray-200 text-gray-600'
                          }`}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Color del botón <span className="text-gray-400">(vacío = color principal)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={cs.button_color || '#3B82F6'}
                        onChange={e => setCs('button_color', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                      <span className="text-xs text-gray-400 font-mono">{cs.button_color || 'color principal'}</span>
                      {cs.button_color && (
                        <button type="button" onClick={() => setCs('button_color', '')}
                          className="text-xs text-gray-400 hover:text-red-400">✕ Resetear</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Calificación (estrellas)</label>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setCs('rating', 0)}
                        className={`text-xs px-2 py-1 rounded-lg border-2 transition-colors ${cs.rating === 0 ? 'border-primary text-primary bg-primary/10' : 'border-gray-200 text-gray-500'}`}>
                        Ninguna
                      </button>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setCs('rating', n)}
                          className="text-2xl transition-transform hover:scale-110"
                          style={{ color: n <= cs.rating ? '#fbbf24' : '#e5e7eb' }}>
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div onClick={() => setCs('is_sale', !cs.is_sale)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${cs.is_sale ? 'bg-red-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${cs.is_sale ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">🏷 Producto en oferta</span>
                    </label>
                    {cs.is_sale && (
                      <div className="space-y-2 pl-2">
                        <input type="number" placeholder="Precio de oferta (₪)"
                          value={cs.sale_price || ''}
                          onChange={e => setCs('sale_price', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Color del badge Sale</label>
                          <div className="flex items-center gap-3">
                            <input type="color" value={cs.sale_color || '#ef4444'}
                              onChange={e => setCs('sale_color', e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
                            <span className="text-xs font-mono text-gray-400">{cs.sale_color || '#ef4444'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mini preview */}
            <MiniCardPreview form={form} />

            <div className="flex gap-2">
              <button
                onClick={() => { keepOpenRef.current = false; saveMutation.mutate(form); }}
                disabled={saveMutation.isPending || !form.name || !form.price}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-60"
              >
                {saveMutation.isPending && !keepOpenRef.current ? 'Guardando...' : 'Guardar'}
              </button>
              {!editing && (
                <button
                  onClick={() => { keepOpenRef.current = true; saveMutation.mutate(form); }}
                  disabled={saveMutation.isPending || !form.name || !form.price}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold disabled:opacity-60 text-sm hover:bg-gray-200 transition-colors"
                  title="Guarda y deja el formulario abierto para agregar otro"
                >
                  {saveMutation.isPending && keepOpenRef.current ? 'Guardando...' : '+ Crear otro'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
