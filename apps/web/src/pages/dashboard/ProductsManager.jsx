import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '../../context/DashboardContext';
import ImageUpload from '../../components/ImageUpload';

const emptyForm = { name: '', price: '', category: '', description: '', image_url: '', in_stock: true };

export default function ProductsManager() {
  const { activeStore, authApi } = useDashboard();
  const queryClient = useQueryClient();

  const [form,    setForm]    = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [open,    setOpen]    = useState(false);

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
    mutationFn: (data) => editing
      ? authApi().patch(`/stores/${slug}/products/${editing}`, data)
      : authApi().post(`/stores/${slug}/products`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard-products', slug]);
      setForm(emptyForm);
      setEditing(null);
      setOpen(false);
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
    setForm({
      name:        product.name,
      price:       product.price,
      category:    product.category    || '',
      description: product.description || '',
      image_url:   product.image_url   || '',
      in_stock:    product.in_stock,
    });
    setEditing(product.id);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setForm(emptyForm);
    setEditing(null);
  };

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
            {/* Thumbnail */}
            {p.image_url
              ? <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">📦</div>
            }

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
              <p className="text-xs text-gray-500">{p.category} · ${Number(p.price).toLocaleString('es-AR')}</p>
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
            className="bg-white w-full rounded-t-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button onClick={closeModal} className="text-gray-400 text-xl leading-none">×</button>
            </div>

            <ImageUpload
              value={form.image_url}
              onChange={url => setForm(f => ({ ...f, image_url: url }))}
            />

            {[
              { key: 'name',        label: 'Nombre',      type: 'text' },
              { key: 'price',       label: 'Precio',      type: 'number' },
              { key: 'category',    label: 'Categoría',   type: 'text' },
              { key: 'description', label: 'Descripción', type: 'text' },
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

            {/* Toggle stock */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, in_stock: !f.in_stock }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.in_stock ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.in_stock ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-gray-700">
                {form.in_stock ? 'Con stock' : 'Sin stock'}
              </span>
            </label>

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
