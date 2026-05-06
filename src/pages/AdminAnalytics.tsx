import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { appendAdminAudit, fetchAdminParticipants, ServerParticipant } from '@/lib/backendApi';
import { sha256Hex } from '@/lib/crypto';
import { Trip } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  ShieldCheck,
  ArrowLeft,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Users,
} from 'lucide-react';

const PIE_COLORS = ['#0f172a', '#1e40af', '#0369a1', '#0891b2', '#0d9488', '#16a34a', '#65a30d', '#ca8a04', '#ea580c', '#dc2626'];

const TRAVEL_MODE_LABELS: Record<string, string> = {
  walk: 'Walk', bicycle: 'Bicycle', motorcycle: 'Motorcycle',
  auto_rickshaw: 'Auto', bus: 'Bus', train: 'Train',
  metro: 'Metro', car: 'Car', taxi: 'Taxi', other: 'Other',
};

const PURPOSE_LABELS: Record<string, string> = {
  work: 'Work', education: 'Education', shopping: 'Shopping',
  recreation: 'Recreation', medical: 'Medical', social: 'Social',
  religious: 'Religious', personal_business: 'Business', other: 'Other',
};

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useAdminAuth();
  const [participants, setParticipants] = useState<ServerParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const isResearcher = session?.role === 'RESEARCHER';

  useEffect(() => {
    if (!isAuthenticated) navigate('/admin/login');
  }, [isAuthenticated, navigate]);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await fetchAdminParticipants();
      setParticipants(result);
      const hashedUser = await sha256Hex(session.adminId);
      await appendAdminAudit({ adminId: hashedUser, role: session.role, action: 'ANALYTICS_VIEW' });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allTrips: Trip[] = participants.flatMap((s) => s.trips);

  // ── Chart data ────────────────────────────────────────────────
  const modeData = Object.entries(
    allTrips.reduce<Record<string, number>>((acc, t) => {
      const label = TRAVEL_MODE_LABELS[t.mode] ?? t.mode;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const purposeData = Object.entries(
    allTrips.reduce<Record<string, number>>((acc, t) => {
      const label = PURPOSE_LABELS[t.purpose] ?? t.purpose;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Trips per day (last 30 days)
  const tripsPerDay: Record<string, number> = {};
  allTrips.forEach((t) => {
    const day = t.createdAt.slice(0, 10);
    tripsPerDay[day] = (tripsPerDay[day] || 0) + 1;
  });
  const timelineData = Object.entries(tripsPerDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, count]) => ({ date: date.slice(5), count }));

  // Average distance per mode
  const distByMode = allTrips.reduce<Record<string, { total: number; count: number }>>((acc, t) => {
    const label = TRAVEL_MODE_LABELS[t.mode] ?? t.mode;
    if (!acc[label]) acc[label] = { total: 0, count: 0 };
    acc[label].total += t.distance;
    acc[label].count += 1;
    return acc;
  }, {});
  const avgDistData = Object.entries(distByMode)
    .map(([name, { total, count }]) => ({ name, avg: Math.round(total / count) }))
    .sort((a, b) => b.avg - a.avg);

  // Companions distribution
  const companionsData = allTrips.reduce<Record<number, number>>((acc, t) => {
    acc[t.companions] = (acc[t.companions] || 0) + 1;
    return acc;
  }, {});
  const companionsChart = Object.entries(companionsData)
    .map(([companions, count]) => ({ companions: `${companions} pax`, count }))
    .sort((a, b) => parseInt(a.companions) - parseInt(b.companions));

  // Cost per mode
  const costByMode = allTrips.reduce<Record<string, { total: number; count: number }>>((acc, t) => {
    const label = TRAVEL_MODE_LABELS[t.mode] ?? t.mode;
    if (!acc[label]) acc[label] = { total: 0, count: 0 };
    acc[label].total += t.cost;
    acc[label].count += 1;
    return acc;
  }, {});
  const costData = Object.entries(costByMode)
    .map(([name, { total, count }]) => ({ name, avg: Math.round(total / count) }))
    .sort((a, b) => b.avg - a.avg);

  if (!session) return null;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {!isResearcher && 'Admin analytics scope: full trip analytics for operational planning and reporting.'}
              {isResearcher && 'Researcher analytics scope: anonymised and aggregate-only analytics for transport research.'}
            </p>
          </CardContent>
        </Card>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: isResearcher ? 'Anonymised Cohorts' : 'Participants', value: participants.length },
            { icon: BarChart3, label: 'Total Trips', value: allTrips.length },
            { icon: TrendingUp, label: 'Avg Trips / Person', value: participants.length ? (allTrips.length / participants.length).toFixed(1) : 0 },
            {
              icon: PieIcon,
              label: 'Avg Distance',
              value: allTrips.length ? `${Math.round(allTrips.reduce((a, t) => a + t.distance, 0) / allTrips.length)} km` : '0 km',
            },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  {loading ? <Skeleton className="h-6 w-16" /> : <p className="text-xl font-bold">{value}</p>}
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : allTrips.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center text-muted-foreground">
              No trip data to analyse yet. Participants must log trips first.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mode distribution bar */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Trip Count by Travel Mode</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={modeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Purpose pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Trip Purpose Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={purposeData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={10}
                      >
                        {purposeData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trips over time */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Trips Recorded Over Time (last 30 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#1e40af" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Average distance per mode */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Average Trip Distance by Mode (km)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={avgDistData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                      <Tooltip />
                      <Bar dataKey="avg" fill="#0369a1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cost per mode */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Average Trip Cost by Mode (₹)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={costData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `₹${v}`} />
                      <Bar dataKey="avg" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Companions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Companions per Trip</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={companionsChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="companions" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Legend note */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  <strong>Privacy note:</strong> Charts show only aggregate statistics.
                  Individual participant identities are replaced with anonymised aliases (P-XXXXXXXX).
                  No personally identifiable information is displayed or exported by the analytics engine.
                  {session.role === 'RESEARCHER' && ' • Researcher role: raw participant records are not accessible.'}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
