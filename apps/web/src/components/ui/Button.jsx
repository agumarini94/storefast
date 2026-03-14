export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'px-4 py-2 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-60';
  const variants = {
    primary: 'bg-primary text-white hover:opacity-90',
    outline: 'border border-primary text-primary hover:bg-primary hover:text-white',
    ghost:   'text-gray-600 hover:bg-gray-100',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
