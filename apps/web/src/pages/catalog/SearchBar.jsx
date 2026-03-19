import { useState, useRef, useMemo, useEffect } from 'react';

export default function SearchBar({ value, onChange, onSelect, products = [], placeholder }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Compute suggestions: at least 2 chars, max 6 results
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q))
      .slice(0, 6);
  }, [products, value]);

  const handleChange = (e) => {
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (product) => {
    onChange(product.name);
    onSelect?.(product);
    setOpen(false);
  };

  const showDropdown = open && suggestions.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || 'Buscar productos...'}
          className="w-full pl-9 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        {value && (
          <button
            onClick={() => { onChange(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-base leading-none"
            aria-label="Limpiar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {suggestions.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelect(product)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left border-b border-gray-50 dark:border-gray-700/50 last:border-0"
            >
              {/* Miniatura */}
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg shrink-0">
                  🛍️
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {product.name}
                </p>
                {product.category && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{product.category}</p>
                )}
              </div>

              {/* Precio */}
              <span className="text-sm font-bold text-orange-500 shrink-0">
                ₪{Number(product.price).toLocaleString('he-IL')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
