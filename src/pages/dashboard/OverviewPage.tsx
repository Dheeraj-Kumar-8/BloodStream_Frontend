import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
type CountItem = { _id: string; count: number };
import {
  fetchOverview,
  fetchRecipientInsights,
  fetchDeliveryMetrics,
  fetchDonorPerformance,
} from '../../services/analytics';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAuthStore } from '../../store/authStore';

const OverviewPage = () => {
  const { user } = useAuthStore((state) => ({ user: state.user }));

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: fetchOverview,
  });

  const { data: donorPerformance } = useQuery({
    queryKey: ['analytics', 'donors'],
    queryFn: fetchDonorPerformance,
    enabled: user?.role !== 'delivery',
  });

  const { data: recipientInsights } = useQuery({
    queryKey: ['analytics', 'recipients'],
    queryFn: fetchRecipientInsights,
    enabled: user?.role !== 'delivery',
  });

  const { data: deliveryMetrics } = useQuery({
    queryKey: ['analytics', 'deliveries'],
    queryFn: fetchDeliveryMetrics,
    enabled: user?.role === 'delivery' || user?.role === 'admin',
  });

  const overviewCards = useMemo(() => {
    if (!overview) return [];
    const requestTotal = overview.requests.reduce(
      (sum: number, item: CountItem) => sum + item.count,
      0
    );
    const deliveryTotal = overview.deliveries.reduce(
      (sum: number, item: CountItem) => sum + item.count,
      0
    );
    const appointmentTotal = overview.appointments.reduce(
      (sum: number, item: CountItem) => sum + item.count,
      0
    );
    const userTotal = overview.users.reduce((sum: number, item: CountItem) => sum + item.count, 0);
    return [
      {
        title: 'Active users',
        value: userTotal,
        trend: overview.users.map((item: CountItem) => ({ name: item._id, value: item.count })),
      },
      {
        title: 'Requests this month',
        value: requestTotal,
        trend: overview.requests.map((item: CountItem) => ({ name: item._id, value: item.count })),
      },
      {
        title: 'Deliveries coordinated',
        value: deliveryTotal,
        trend: overview.deliveries.map((item: CountItem) => ({ name: item._id, value: item.count })),
      },
      {
        title: 'Appointments scheduled',
        value: appointmentTotal,
        trend: overview.appointments.map((item: CountItem) => ({ name: item._id, value: item.count })),
      },
    ];
  }, [overview]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Pulse overview</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track the real-time health of BloodStream operations across requests, donors, and logistics.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isOverviewLoading && (
          <div className="col-span-full grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
              />
            ))}
          </div>
        )}
        {!isOverviewLoading &&
          overviewCards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg"
            >
              <h3 className="text-sm font-medium text-slate-400">{card.title}</h3>
              <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
              <div className="mt-4 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={card.trend}>
                    <defs>
                      <linearGradient id={`trend-${card.title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill={`url(#trend-${card.title})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
          ))}
      </div>

      {donorPerformance && donorPerformance.topDonors.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Top donors</h2>
                <p className="text-sm text-slate-400">Recognizing our most reliable donors.</p>
              </div>
            </header>
            <div className="mt-4 space-y-3">
              {donorPerformance.topDonors.map((donor: (typeof donorPerformance)['topDonors'][number]) => (
                <article
                  key={donor.email ?? `${donor.firstName}-${donor.lastName}`}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {donor.firstName} {donor.lastName}
                      </h3>
                      <p className="text-xs text-slate-400">Blood type: {donor.bloodType ?? 'N/A'}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-primary">
                        {donor.donorProfile.totalDonations} donations
                      </p>
                      {donor.donorProfile.lastDonationDate && (
                        <p className="text-xs text-slate-500">
                          Last donation: {new Date(donor.donorProfile.lastDonationDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Availability snapshot</h2>
                <p className="text-sm text-slate-400">How many donors are ready to give right now.</p>
              </div>
            </header>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={donorPerformance.availability.map((item: (typeof donorPerformance)['availability'][number]) => ({
                    status: item._id ? 'Available' : 'Unavailable',
                    count: item.count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="status" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                  <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      {recipientInsights && recipientInsights.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recipient success rates</h2>
              <p className="text-sm text-slate-400">Monitoring how effectively requests are fulfilled.</p>
            </div>
          </header>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="px-4 py-2 font-medium">Recipient</th>
                  <th className="px-4 py-2 font-medium">Total requests</th>
                  <th className="px-4 py-2 font-medium">Completed</th>
                  <th className="px-4 py-2 font-medium">Success rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {recipientInsights.map((item: (typeof recipientInsights)[number]) => (
                  <tr key={item._id}>
                    <td className="px-4 py-3">
                      {item.recipient.firstName} {item.recipient.lastName}
                    </td>
                    <td className="px-4 py-3">{item.totalRequests}</td>
                    <td className="px-4 py-3">{item.completed}</td>
                    <td className="px-4 py-3">{Math.round(item.successRate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {deliveryMetrics && deliveryMetrics.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Delivery performance</h2>
              <p className="text-sm text-slate-400">How quickly blood units reach their destinations.</p>
            </div>
          </header>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deliveryMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="status" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                <Legend formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>} />
                <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} name="Deliveries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </section>
  );
};

export default OverviewPage;
