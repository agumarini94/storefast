import { useQuery } from '@tanstack/react-query';
import { useDashboard } from '../../context/DashboardContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function MetricCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col gap-1">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value ?? '—'}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { activeStore, authApi } = useDashboard();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics', activeStore?.id],
    queryFn: () =>
      authApi()
        .get(`/stores/${activeStore.slug}/analytics`)
        .then(r => r.data),
    enabled: !!activeStore,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">Cargando estadísticas...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-400 text-sm">No se pudieron cargar las estadísticas.</p>
      </div>
    );
  }

  // Fill missing days in the 7-day window
  const today = new Date();
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const found = data.daily.find(r => r.date?.slice(0, 10) === iso);
    const label = d.toLocaleDateString('es', { weekday: 'short', day: 'numeric' });
    return { label, count: found ? Number(found.count) : 0 };
  });

  return (
    <div className="space-y-5 max-w-lg mx-auto px-4 py-6">
      <h2 className="text-lg font-bold text-gray-900">📊 Estadísticas</h2>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Esta semana" value={data.weekTotal} sub="consultas" />
        <MetricCard
          label="Más consultado"
          value={data.topProduct?.name ?? '—'}
          sub={data.topProduct ? `${data.topProduct.clicks} clicks` : undefined}
        />
        <MetricCard
          label="Categoría top"
          value={data.topCategory?.category ?? '—'}
          sub={data.topCategory ? `${data.topCategory.clicks} clicks` : undefined}
        />
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">Consultas — últimos 7 días</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v) => [v, 'Consultas']}
            />
            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 products table */}
      {data.topProducts?.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Top productos (30 días)</p>
          <div className="space-y-2">
            {data.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-gray-400">{i + 1}</span>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name}
                    className="w-8 h-8 rounded-lg object-cover shrink-0 bg-gray-100" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base shrink-0">
                    🛍️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  {p.category && (
                    <p className="text-xs text-gray-400">{p.category}</p>
                  )}
                </div>
                <span className="text-sm font-bold text-blue-600 shrink-0">{p.clicks}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
