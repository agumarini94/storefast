import { useState, useMemo } from 'react';

const NEW_CAT = '__new__';

/**
 * Select de categorías con opción de crear nueva.
 * Valida que la nueva categoría comience con mayúscula.
 *
 * Props:
 *   value      → categoría actual
 *   onChange   → fn(string) al cambiar
 *   products   → lista de productos para extraer categorías existentes
 */
export default function SmartCategorySelect({ value, onChange, products = [] }) {
  const [isNew,    setIsNew]    = useState(false);
  const [newInput, setNewInput] = useState('');
  const [error,    setError]    = useState('');

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return [...set].sort();
  }, [products]);

  const handleSelect = (e) => {
    if (e.target.value === NEW_CAT) {
      setIsNew(true);
      setNewInput('');
      setError('');
      onChange('');
    } else {
      setIsNew(false);
      onChange(e.target.value);
    }
  };

  const handleNewInput = (val) => {
    setNewInput(val);
    if (val && !/^[A-ZÁÉÍÓÚÑÜ]/.test(val)) {
      setError('La categoría debe comenzar con mayúscula');
    } else {
      setError('');
      onChange(val);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">Categoría</label>

      {!isNew ? (
        <select
          value={value || ''}
          onChange={handleSelect}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Sin categoría</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value={NEW_CAT}>➕ Nueva categoría...</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <input
              type="text"
              autoFocus
              placeholder="Ej: Golosinas, Bebidas..."
              value={newInput}
              onChange={e => handleNewInput(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                error ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
          <button
            type="button"
            onClick={() => { setIsNew(false); if (!newInput) onChange(''); }}
            className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            ← Volver
          </button>
        </div>
      )}
    </div>
  );
}
