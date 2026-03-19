import { useState, useEffect, useRef } from 'react';

const CITIES = [
  'Tel Aviv', 'Haifa', 'Jerusalem', 'Ashdod', 'Rishon LeZion',
  'Petah Tikva', 'Netanya', 'Be\'er Sheva', 'Ramat Gan', 'Holon',
];

const TIME_LABELS = [
  'hace 2 min', 'hace 5 min', 'hace 8 min', 'hace 12 min',
  'hace 15 min', 'hace 20 min', 'hace 30 min', 'hace 1 hora',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Shows random FOMO activity toasts bottom-left.
 * Props:
 *   products  → array of store products (uses real names for authenticity)
 *   primaryColor → store accent color
 */
export default function FomoToast({ products = [], primaryColor = '#3B82F6' }) {
  const [toast, setToast]   = useState(null);   // { city, product, time }
  const [visible, setVisible] = useState(false);
  const timerRef  = useRef(null);
  const hideRef   = useRef(null);

  const showNext = () => {
    if (!products.length) return;

    const product = pick(products);
    const city    = pick(CITIES);
    const time    = pick(TIME_LABELS);

    setToast({ city, product, time });
    setVisible(true);

    // Hide after 4.5s
    hideRef.current = setTimeout(() => {
      setVisible(false);
      // Schedule next after a random pause (10–20s)
      const delay = 10_000 + Math.random() * 10_000;
      timerRef.current = setTimeout(showNext, delay);
    }, 4500);
  };

  useEffect(() => {
    if (!products.length) return;
    // First toast after 6–12s
    const initial = 6_000 + Math.random() * 6_000;
    timerRef.current = setTimeout(showNext, initial);
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(hideRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 left-4 z-40 max-w-[260px] transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 flex items-center gap-3">
        {/* Avatar / product image */}
        <div className="shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
          {toast.product.image_url ? (
            <img src={toast.product.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
          )}
        </div>

        {/* Text */}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-snug">
            Alguien en{' '}
            <span style={{ color: primaryColor }}>{toast.city}</span>{' '}
            consultó por{' '}
            <span className="font-bold">{toast.product.name}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{toast.time}</p>
        </div>

        {/* Live dot */}
        <div className="shrink-0 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>
    </div>
  );
}
