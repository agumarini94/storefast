import { useState } from 'react';
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
  font_family:     '',
  font_size:       'base',
  title_position:  'left',
  bg_type:         'none',
  bg_value:        '',
  animation:       'none',
};

const emptyForm = {
  name: '', price: '', category: '', description: '',
  image_url: '', in_stock: true,
  images: ['', '', ''],
  custom_styles: { ...defaultStyles },
};

export default function ProductsManager() {
  const { activeStore, authApi } = useDashboard();
  const queryClient = useQueryClient();

  const [form,        setForm]        = useState(emptyForm);
  const [editing,     setEditing]     = useState(null);
  const [open,        setOpen]        = useState(false);
  const [styleOpen,   setStyleOpen]   = useState(false);

  const slug = activeStore?.slug;

  const { data: products = [] } = useQuery({
    queryKey: ['dashboard-products', slug],
    queryFn: async () => {
      const { data } = await authApi().get(`/stores/${slug}/products`);
      return data;
    },
    enabled: !!slug,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      // Build clean payload
      const images = (data.images || []).filter(Boolean);
      const payload = {
        ...data,
        images,
        image_url: images[0] || data.image_url || '',
      };
      return editing
        ? authApi().patch(`/stores/${slug}/products/${editing}`, payload)
        : authApi().post(`/stores/${slug}/products`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard-products', slug]);
      setForm(emptyForm);
      setEditing(null);
      setOpen(false);
      setStyleOpen(false);
    },
  });

  const toggleStock = useMutation({
    mutationFn: ({ id, in_stock }) =>
      authApi().patch(`/stores/${slug}/products/${id}`, { in_stock: !in_stock }),
    onSuccess: () => queryClient.invalidateQueries(['dashboard-products', slug]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => authApi().delete(`/stores/${slug}/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['dashboard-products', slug]),
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
      images:        imgs,
      custom_styles: { ...defaultStyles, ...(product.custom_styles || {}) },
    });
    setEditing(product.id);
    setOpen(true);
    setStyleOpen(false);
  };

  const closeModal = () => {
    setOpen(false);
    setForm(emptyForm);
    setEditing(null);
    setStyleOpen(false);
  };

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

      {/* Lista */}
      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
            {p.image_url
              ? <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">📦</div>
            }

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
              <p className="text-xs text-gray-500">{p.category} · ₪{Number(p.price).toLocaleString('he-IL')}</p>
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
              <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-gray-700">✏️</button>
              <button onClick={() => deleteMutation.mutate(p.id)} className="text-gray-400 hover:text-red-500">🗑️</button>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-sm">Todavía no tenés productos</p>
          </div>
        )}
      </div>

      {/* Bottom Sheet Modal */}
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

            {/* ── Fotos (hasta 3) ── */}
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

            {/* ── Campos básicos ── */}
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

            {/* Toggle stock */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, in_stock: !f.in_stock }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.in_stock ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.in_stock ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-gray-700">{form.in_stock ? 'Con stock' : 'Sin stock'}</span>
            </label>

            {/* ── Estilo personalizado ── */}
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

                  {/* Fuente */}
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

                  {/* Tamaño título */}
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

                  {/* Alineación */}
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

                  {/* Fondo */}
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

                  {/* Animación */}
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
                </div>
              )}
            </div>

            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending || !form.name || !form.price}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-60"
            >
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
