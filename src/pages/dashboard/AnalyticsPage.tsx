import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchOverview,
  fetchDonorPerformance,
  fetchRecipientInsights,
  fetchDeliveryMetrics,
} from '../../services/analytics';
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useAuthStore } from '../../store/authStore';

const AnalyticsPage = () => {
  const { user } = useAuthStore((state) => ({ user: state.user }));

  const isAdmin = user?.role === 'admin';

  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: fetchOverview,
  });

  const { data: donors } = useQuery({
    queryKey: ['analytics', 'donor-performance'],
    queryFn: fetchDonorPerformance,
  });

  const { data: recipients } = useQuery({
    queryKey: ['analytics', 'recipient-insights'],
    queryFn: fetchRecipientInsights,
  });

  const { data: deliveries } = useQuery({
    queryKey: ['analytics', 'delivery-metrics'],
    queryFn: fetchDeliveryMetrics,
  });

  const requestTrend = useMemo(() => {
    if (!overview) return [] as Array<{ label: string; count: number }>;
    return overview.requests.map((item: { _id: string; count: number }) => ({
      label: item._id,
      count: item.count,
    }));
  }, [overview]);

  const donorRadar = useMemo(() => {
    if (!donors) return [] as Array<{ donor: string; donations: number; lastDonation: number }>;
    return donors.topDonors.slice(0, 5).map((donor: (typeof donors)['topDonors'][number]) => ({
      donor: `${donor.firstName} ${donor.lastName}`,
      donations: donor.donorProfile.totalDonations,
      lastDonation: donor.donorProfile.lastDonationDate
        ? new Date(donor.donorProfile.lastDonationDate).getTime()
        : 0,
    }));
  }, [donors]);

  const recipientSuccess = useMemo(() => {
    if (!recipients) return [] as Array<{ name: string; successRate: number }>;
    return recipients.map((item: (typeof recipients)[number]) => ({
      name: `${item.recipient.firstName} ${item.recipient.lastName}`,
      successRate: Math.round(item.successRate * 100),
    }));
  }, [recipients]);

  if (!isAdmin) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        Analytics are reserved for administrators. Reach out to your coordinator for access.
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Intelligence dashboards</h1>
        <p className="text-sm text-slate-400">
          Forecast demand, monitor donor engagement, and identify bottlenecks across the supply chain.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white">Request volume trend</h2>
          <p className="text-sm text-slate-400">Last 30 days by urgency tier.</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={requestTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} hide />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white">Donor engagement</h2>
          <p className="text-sm text-slate-400">Volume and recency of top donors.</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={donorRadar} outerRadius="80%">
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="donor" stroke="#94a3b8" />
                <PolarRadiusAxis stroke="#94a3b8" />
                <Radar name="Donations" dataKey="donations" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Recipient fulfillment success</h2>
        <p className="text-sm text-slate-400">
          Compare which facilities consistently secure blood units on time.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recipientSuccess.map((recipient) => (
            <article
              key={recipient.name}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <h3 className="text-sm font-semibold text-white">{recipient.name}</h3>
              <p className="mt-2 text-3xl font-semibold text-primary">{recipient.successRate}%</p>
              <p className="text-xs text-slate-400">fulfilled requests</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Delivery service levels</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {deliveries?.map((metric: (typeof deliveries)[number]) => (
            <article
              key={metric.status}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <h3 className="text-sm font-semibold text-white capitalize">
                {metric.status.replace('_', ' ')}
              </h3>
              <p className="mt-2 text-2xl font-semibold text-primary">{metric.count}</p>
              <p className="text-xs text-slate-400">
                Avg. duration: {metric.avgDurationMinutes ? `${metric.avgDurationMinutes.toFixed(1)} min` : 'n/a'}
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

export default AnalyticsPage;
