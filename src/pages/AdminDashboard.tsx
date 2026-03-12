import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { decryptAllShards, getAllShards, DecryptedShard } from '@/lib/adminStorage';
import { getAuditLog, verifyAuditChain, AuditEntry } from '@/lib/auditLog';
import { appendAuditEntry } from '@/lib/auditLog';
import { sha256Hex } from '@/lib/crypto';
import { Trip } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  LogOut,
  Users,
  MapPin,
  BarChart3,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  FileDown,
  Clock,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  ADMIN:       'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  SCIENTIST:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const TRAVEL_MODE_LABELS: Record<string, string> = {
  walk: 'Walk', bicycle: 'Bicycle', motorcycle: 'Motorcycle',
  auto_rickshaw: 'Auto Rickshaw', bus: 'Bus', train: 'Train',
  metro: 'Metro', car: 'Car', taxi: 'Taxi', other: 'Other',
};

function formatDuration(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { session, isAuthenticated, logout } = useAdminAuth();
  const [shards, setShards] = useState<DecryptedShard[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditValid, setAuditValid] = useState<boolean | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [totalUnencryptedParticipants] = useState(() => Object.keys(getAllShards()).length);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  const loadData = useCallback(async () => {
    if (!session?.govMasterKey) {
      setDecryptError('Government access key not in memory. Please log in again.');
      return;
    }
    setIsDecrypting(true);
    setDecryptError(null);
    try {
      const result = await decryptAllShards(session.govMasterKey);
      setShards(result);

      const hashedUser = await sha256Hex(session.adminId);
      await appendAuditEntry({
        adminId: hashedUser,
        role: session.role,
        action: 'DATA_VIEW',
        details: `Loaded ${result.length} participant shards`,
      });
    } catch (e) {
      setDecryptError('Decryption failed. The government key may be incorrect.');
    } finally {
      setIsDecrypting(false);
    }

    // Load audit log
    const logs = getAuditLog();
    setAuditLog([...logs].reverse());

    // Verify chain
    const { valid } = await verifyAuditChain();
    setAuditValid(valid);
  }, [session]);

  useEffect(() => {
    if (isAuthenticated && session?.govMasterKey) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  // Aggregate stats across all shards
  const allTrips: (Trip & { participantAlias: string })[] = shards.flatMap((s) =>
    s.trips.map((t) => ({ ...t, participantAlias: s.participantAlias }))
  );

  const totalDistance = allTrips.reduce((a, t) => a + t.distance, 0);
  const totalCost = allTrips.reduce((a, t) => a + t.cost, 0);

  const modeCounts = allTrips.reduce<Record<string, number>>((acc, t) => {
    acc[t.mode] = (acc[t.mode] || 0) + 1;
    return acc;
  }, {});

  const purposeCounts = allTrips.reduce<Record<string, number>>((acc, t) => {
    acc[t.purpose] = (acc[t.purpose] || 0) + 1;
    return acc;
  }, {});

  // Export functions
  const exportJSON = async () => {
    if (session?.role === 'SCIENTIST') {
      // Anonymised export
      const data = shards.map((s) => ({
        participantAlias: s.participantAlias,
        tripCount: s.trips.length,
        trips: s.trips.map((t) => ({ ...t, id: undefined })),
      }));
      download(JSON.stringify(data, null, 2), 'natpac-anonymised', 'json');
    } else {
      const data = shards;
      download(JSON.stringify(data, null, 2), 'natpac-all-data', 'json');
    }
    const hashedUser = await sha256Hex(session!.adminId);
    await appendAuditEntry({ adminId: hashedUser, role: session!.role, action: 'DATA_EXPORT_JSON' });
    toast.success('JSON export complete');
  };

  const exportCSV = async () => {
    const headers = ['Participant','TripNo','Date','Mode','Purpose','DistanceKm','CostINR','Companions','Frequency','Origin_Lat','Origin_Lng','Dest_Lat','Dest_Lng'];
    const rows = allTrips.map((t) => [
      session?.role === 'SCIENTIST' ? t.participantAlias : t.participantAlias, // scientist sees alias either way
      t.tripNumber,
      t.createdAt.slice(0, 10),
      t.mode,
      t.purpose,
      t.distance.toFixed(2),
      t.cost.toFixed(2),
      t.companions,
      t.frequency,
      t.origin.lat,
      t.origin.lng,
      t.destination.lat,
      t.destination.lng,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    download(csv, 'natpac-trips', 'csv');

    const hashedUser = await sha256Hex(session!.adminId);
    await appendAuditEntry({ adminId: hashedUser, role: session!.role, action: 'DATA_EXPORT_CSV' });
    toast.success('CSV export complete');
  };

  function download(content: string, name: string, ext: string) {
    const blob = new Blob([content], { type: ext === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-yellow-400" />
          <span className="font-bold text-sm">NATPAC Admin Portal</span>
          <Badge className={`text-xs ${ROLE_COLORS[session.role]}`}>{session.role}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:block">{session.adminId}</span>
          <Button size="sm" variant="ghost" onClick={handleLogout} className="text-slate-300 hover:text-white h-8">
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Session info banner */}
        <Alert className="border-green-500/30 bg-green-50/50 dark:bg-green-900/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-xs text-green-800 dark:text-green-300">
            Authenticated as <strong>{session.adminId}</strong> ·
            Session expires at <strong>{new Date(session.expiresAt).toLocaleTimeString()}</strong> ·
            All actions are audit-logged
            {session.role === 'SCIENTIST' && ' · Viewing anonymised data only'}
          </AlertDescription>
        </Alert>

        {decryptError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{decryptError}</AlertDescription>
          </Alert>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Participants', value: totalUnencryptedParticipants, sub: `${shards.length} decrypted` },
            { icon: MapPin, label: 'Total Trips', value: allTrips.length, sub: 'all participants' },
            { icon: Activity, label: 'Total Distance', value: `${(totalDistance / 1000).toFixed(1)} km`, sub: 'combined' },
            { icon: BarChart3, label: 'Total Cost', value: `₹${totalCost.toFixed(0)}`, sub: 'all modes' },
          ].map(({ icon: Icon, label, value, sub }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                </div>
                {isDecrypting
                  ? <Skeleton className="h-7 w-24 mt-1" />
                  : <p className="text-2xl font-bold">{value}</p>
                }
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="participants">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <TabsList className="bg-white dark:bg-slate-800 border">
              <TabsTrigger value="participants" className="text-xs gap-1.5">
                <Users className="h-3.5 w-3.5" /> Participants
              </TabsTrigger>
              <TabsTrigger value="trips" className="text-xs gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> All Trips
              </TabsTrigger>
              <TabsTrigger value="audit" className="text-xs gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Audit Log
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadData} className="h-8 text-xs gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={exportCSV} className="h-8 text-xs gap-1.5">
                <FileDown className="h-3.5 w-3.5" /> CSV
              </Button>
              {session.role !== 'SCIENTIST' && (
                <Button size="sm" variant="outline" onClick={exportJSON} className="h-8 text-xs gap-1.5">
                  <Download className="h-3.5 w-3.5" /> JSON
                </Button>
              )}
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-slate-900"
                onClick={() => navigate('/admin/analytics')}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Analytics
              </Button>
            </div>
          </div>

          {/* ── PARTICIPANTS TAB ── */}
          <TabsContent value="participants" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4 text-yellow-500" />
                  Participant Data (Encrypted at Rest)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[420px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="text-xs">Alias</TableHead>
                        <TableHead className="text-xs">Shard ID (SHA-256)</TableHead>
                        <TableHead className="text-xs text-right">Trips</TableHead>
                        <TableHead className="text-xs text-right">Distance</TableHead>
                        <TableHead className="text-xs text-right">Cost</TableHead>
                        <TableHead className="text-xs">Last Updated</TableHead>
                        <TableHead className="text-xs">Top Mode</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isDecrypting ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 7 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : shards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground text-sm py-10">
                            No participant data found. Participants must log at least one trip first.
                          </TableCell>
                        </TableRow>
                      ) : (
                        shards.map((shard) => {
                          const dist = shard.trips.reduce((a, t) => a + t.distance, 0);
                          const cost = shard.trips.reduce((a, t) => a + t.cost, 0);
                          const modes = shard.trips.reduce<Record<string, number>>((a, t) => {
                            a[t.mode] = (a[t.mode] || 0) + 1; return a;
                          }, {});
                          const topMode = Object.entries(modes).sort((a, b) => b[1] - a[1])[0]?.[0];
                          return (
                            <TableRow key={shard.hashedId} className="hover:bg-slate-50">
                              <TableCell className="font-mono text-xs font-medium">{shard.participantAlias}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {shard.hashedId.slice(0, 16)}…
                              </TableCell>
                              <TableCell className="text-right text-xs">{shard.trips.length}</TableCell>
                              <TableCell className="text-right text-xs">{(dist / 1000).toFixed(2)} km</TableCell>
                              <TableCell className="text-right text-xs">₹{cost.toFixed(0)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(shard.lastUpdated).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-xs">
                                {topMode ? (
                                  <Badge variant="secondary" className="text-xs">{TRAVEL_MODE_LABELS[topMode] ?? topMode}</Badge>
                                ) : '—'}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ALL TRIPS TAB ── */}
          <TabsContent value="trips" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">All Trip Records — Decrypted View</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[420px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Participant</TableHead>
                        <TableHead className="text-xs">#</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Mode</TableHead>
                        <TableHead className="text-xs">Purpose</TableHead>
                        <TableHead className="text-xs text-right">Dist (m)</TableHead>
                        <TableHead className="text-xs text-right">Cost ₹</TableHead>
                        <TableHead className="text-xs">Duration</TableHead>
                        <TableHead className="text-xs text-right">Companions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isDecrypting ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 9 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : allTrips.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground text-sm py-10">
                            No trip data available.
                          </TableCell>
                        </TableRow>
                      ) : (
                        allTrips.map((t, i) => (
                          <TableRow key={`${t.id}-${i}`} className="hover:bg-slate-50 text-xs">
                            <TableCell className="font-mono font-medium">{t.participantAlias}</TableCell>
                            <TableCell>{t.tripNumber}</TableCell>
                            <TableCell>{t.createdAt.slice(0, 10)}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{TRAVEL_MODE_LABELS[t.mode] ?? t.mode}</Badge></TableCell>
                            <TableCell className="capitalize">{t.purpose.replace('_', ' ')}</TableCell>
                            <TableCell className="text-right">{t.distance}</TableCell>
                            <TableCell className="text-right">₹{t.cost}</TableCell>
                            <TableCell>{formatDuration(t.startTime, t.endTime)}</TableCell>
                            <TableCell className="text-right">{t.companions}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── AUDIT LOG TAB ── */}
          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  Tamper-Evident Audit Log
                  {auditValid === true && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Chain Intact
                    </Badge>
                  )}
                  {auditValid === false && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Chain Broken!
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[420px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Timestamp</TableHead>
                        <TableHead className="text-xs">Admin (Hashed)</TableHead>
                        <TableHead className="text-xs">Role</TableHead>
                        <TableHead className="text-xs">Action</TableHead>
                        <TableHead className="text-xs">Details</TableHead>
                        <TableHead className="text-xs">Chain Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLog.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">
                            No audit entries yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLog.map((entry) => (
                          <TableRow key={entry.id} className="text-xs hover:bg-slate-50">
                            <TableCell className="text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono">{entry.adminId.slice(0, 12)}…</TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${ROLE_COLORS[entry.role] ?? ''}`}>{entry.role}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{entry.action}</TableCell>
                            <TableCell className="text-muted-foreground">{entry.details ?? '—'}</TableCell>
                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                              {entry.chainHash.slice(0, 12)}…
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mode/Purpose quick breakdown */}
        {!isDecrypting && allTrips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Travel Mode Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(modeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([mode, count]) => (
                      <div key={mode} className="flex items-center gap-3">
                        <span className="text-xs w-28 capitalize">{TRAVEL_MODE_LABELS[mode] ?? mode}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-700 rounded-full"
                            style={{ width: `${(count / allTrips.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Trip Purpose Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(purposeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([purpose, count]) => (
                      <div key={purpose} className="flex items-center gap-3">
                        <span className="text-xs w-28 capitalize">{purpose.replace('_', ' ')}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(count / allTrips.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
