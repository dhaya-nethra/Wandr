import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  appendAdminAudit,
  fetchAdminAuditLog,
  fetchAdminParticipants,
  fetchAdminUsers,
  ManagedAdminUser,
  removeAdminUser,
  saveAdminUser,
  ServerParticipant,
  AdminAuditEntry,
} from '@/lib/backendApi';
import { sha256Hex } from '@/lib/crypto';
import { Trip } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
  Filter,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { TRAVEL_MODES, TRIP_PURPOSES } from '@/types/trip';
import { TravelModeIcon } from '@/components/trips/TravelModeIcon';

const ROLE_COLORS: Record<string, string> = {
  ADMIN:       'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  SCIENTIST:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const TRAVEL_MODE_LABELS: Record<string, string> = {
  walk: 'Walking', bicycle: 'Bicycle', motorcycle: 'Motorcycle',
  auto_rickshaw: 'Auto Rickshaw', bus: 'Bus', train: 'Train',
  metro: 'Metro', car: 'Car', taxi: 'Taxi/Cab', other: 'Other',
};

const MANAGED_ADMIN_ROLES = ['ADMIN', 'SCIENTIST'] as const;

type ManagedAdminRole = (typeof MANAGED_ADMIN_ROLES)[number];

function formatDuration(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { session, isAuthenticated, logout } = useAdminAuth();
  const [participants, setParticipants] = useState<ServerParticipant[]>([]);
  const [auditLog, setAuditLog] = useState<AdminAuditEntry[]>([]);
  const [auditValid, setAuditValid] = useState<boolean | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter state for All Trips tab
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterPurpose, setFilterPurpose] = useState<string>('all');
  const [filterParticipant, setFilterParticipant] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const hasFilters = filterMode !== 'all' || filterPurpose !== 'all' || filterParticipant || filterDateFrom || filterDateTo;
  const isResearcher = session?.role === 'SCIENTIST';
  const canViewParticipantIds = !isResearcher;
  const canManageAdmins = !isResearcher;
  const canViewAudit = !isResearcher;

  const [managedUsers, setManagedUsers] = useState<ManagedAdminUser[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<ManagedAdminRole>('SCIENTIST');

  const verifyAuditChain = useCallback(async (entries: AdminAuditEntry[]): Promise<boolean> => {
    let prevHash = '0'.repeat(64);
    for (const entry of [...entries].reverse()) {
      const chainInput = `${prevHash}|${entry.id}|${entry.timestamp}|${entry.adminId}|${entry.action}|`;
      const expected = await sha256Hex(chainInput);
      if (expected !== entry.chainHash) return false;
      prevHash = entry.chainHash;
    }
    return true;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  const loadData = useCallback(async () => {
    if (!session) return;
    setIsLoadingData(true);
    setLoadError(null);
    try {
      const loadedParticipants = await fetchAdminParticipants();
      setParticipants(loadedParticipants);

      const logs = await fetchAdminAuditLog();
      setAuditLog(logs);
      setAuditValid(await verifyAuditChain(logs));

      const hashedUser = await sha256Hex(session.adminId);
      await appendAdminAudit({
        adminId: hashedUser,
        role: session.role,
        action: 'DATA_VIEW',
        details: `Loaded ${loadedParticipants.length} participant records`,
      });
    } catch (e) {
      setLoadError('Failed to load backend data. Ensure the server is running.');
    } finally {
      setIsLoadingData(false);
    }
  }, [session, verifyAuditChain]);

  useEffect(() => {
    if (isAuthenticated && session?.govMasterKey) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    if (!canManageAdmins) return;
    fetchAdminUsers()
      .then((users) => setManagedUsers(users as ManagedAdminUser[]))
      .catch(() => setManagedUsers([]));
  }, [canManageAdmins]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleAddManagedUser = async () => {
    const username = newAdminUsername.trim();
    const password = newAdminPassword.trim();

    if (!username || !password || !session) {
      toast.error('Username and password are required');
      return;
    }

    try {
      await saveAdminUser({
        username,
        password,
        role: newAdminRole,
        addedAt: new Date().toISOString(),
        addedBy: session.adminId,
      });
      const users = await fetchAdminUsers();
      setManagedUsers(users as ManagedAdminUser[]);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminRole('SCIENTIST');
      toast.success('Admin account saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save admin account');
    }
  };

  const handleRemoveManagedUser = async (username: string) => {
    try {
      await removeAdminUser(username);
      const users = await fetchAdminUsers();
      setManagedUsers(users as ManagedAdminUser[]);
      toast.success('Admin account removed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove admin account');
    }
  };

  // Aggregate stats across all backend participant records
  const allTrips: (Trip & { participantAlias: string })[] = participants.flatMap((s) =>
    s.trips.map((t) => ({
      ...t,
      participantAlias: canViewParticipantIds ? s.participantId : s.participantAlias,
    }))
  );

  // Apply admin filters
  const filteredTrips = allTrips.filter((t) => {
    if (filterMode !== 'all' && t.mode !== filterMode) return false;
    if (filterPurpose !== 'all' && t.purpose !== filterPurpose) return false;
    if (filterParticipant && !t.participantAlias.toLowerCase().includes(filterParticipant.toLowerCase())) return false;
    if (filterDateFrom && t.createdAt.slice(0, 10) < filterDateFrom) return false;
    if (filterDateTo && t.createdAt.slice(0, 10) > filterDateTo) return false;
    return true;
  });

  const totalDistance = allTrips.reduce((a, t) => a + t.distance, 0);
  const totalCost = allTrips.reduce((a, t) => a + t.cost, 0);

  const modeCounts = allTrips.reduce<Record<string, number>>((acc, t) => {
    acc[t.mode] = (acc[t.mode] || 0) + 1;
    return acc;
  }, {});

  const topModes = Object.entries(modeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const purposeCounts = allTrips.reduce<Record<string, number>>((acc, t) => {
    acc[t.purpose] = (acc[t.purpose] || 0) + 1;
    return acc;
  }, {});

  // Export functions
  const exportJSON = async () => {
    if (session?.role === 'SCIENTIST') {
      // Anonymised export
      const data = participants.map((s) => ({
        participantAlias: s.participantAlias,
        tripCount: s.trips.length,
        trips: s.trips.map((t) => ({ ...t, id: undefined })),
      }));
      download(JSON.stringify(data, null, 2), 'natpac-anonymised', 'json');
    } else {
      const data = participants;
      download(JSON.stringify(data, null, 2), 'natpac-all-data', 'json');
    }
    const hashedUser = await sha256Hex(session!.adminId);
    await appendAdminAudit({ adminId: hashedUser, role: session!.role, action: 'DATA_EXPORT_JSON' });
    toast.success('JSON export complete');
  };

  const exportCSV = async () => {
    const headers = ['Participant','TripNo','Date','Mode','Purpose','DistanceKm','CostINR','Companions','Frequency','Origin_Lat','Origin_Lng','Dest_Lat','Dest_Lng'];
    const rows = allTrips.map((t) => [
      t.participantAlias,
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
    await appendAdminAudit({ adminId: hashedUser, role: session!.role, action: 'DATA_EXPORT_CSV' });
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
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Alert>
          <AlertDescription className="text-xs">
            {!isResearcher && 'Admin mode: full data, audit visibility, and admin account management enabled.'}
            {isResearcher && 'Researcher mode: anonymised and aggregated views only; raw participant identity and privileged controls are hidden.'}
          </AlertDescription>
        </Alert>

        {loadError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Participants', value: participants.length, sub: 'from backend' },
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
                {isLoadingData
                  ? <Skeleton className="h-7 w-24 mt-1" />
                  : <p className="text-2xl font-bold">{value}</p>
                }
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main tabs */}
        <Tabs defaultValue={isResearcher ? 'trips' : 'participants'}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <TabsList className="bg-white dark:bg-slate-800 border">
              {!isResearcher && (
                <TabsTrigger value="participants" className="text-xs gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Participants
                </TabsTrigger>
              )}
              <TabsTrigger value="trips" className="text-xs gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> All Trips
              </TabsTrigger>
              {canViewAudit && (
                <TabsTrigger value="audit" className="text-xs gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Audit Log
                </TabsTrigger>
              )}
              {canManageAdmins && (
                <TabsTrigger value="admins" className="text-xs gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Admin Users
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadData} className="h-8 text-xs gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={exportCSV} className="h-8 text-xs gap-1.5">
                <FileDown className="h-3.5 w-3.5" /> {isResearcher ? 'CSV (Anonymised)' : 'CSV'}
              </Button>
              {!isResearcher && (
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
          {!isResearcher && (
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
                        {canViewParticipantIds && <TableHead className="text-xs">Participant ID</TableHead>}
                        <TableHead className="text-xs">Shard ID (SHA-256)</TableHead>
                        <TableHead className="text-xs text-right">Trips</TableHead>
                        <TableHead className="text-xs text-right">Distance</TableHead>
                        <TableHead className="text-xs text-right">Cost</TableHead>
                        <TableHead className="text-xs">Last Updated</TableHead>
                        <TableHead className="text-xs">Top Mode</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingData ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: canViewParticipantIds ? 8 : 7 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : participants.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={canViewParticipantIds ? 8 : 7} className="text-center text-muted-foreground text-sm py-10">
                            No participant data found yet. Ask a participant to sign in or record a trip first.
                          </TableCell>
                        </TableRow>
                      ) : (
                        participants.map((shard) => {
                          const dist = shard.trips.reduce((a, t) => a + t.distance, 0);
                          const cost = shard.trips.reduce((a, t) => a + t.cost, 0);
                          const modes = shard.trips.reduce<Record<string, number>>((a, t) => {
                            a[t.mode] = (a[t.mode] || 0) + 1; return a;
                          }, {});
                          const topMode = Object.entries(modes).sort((a, b) => b[1] - a[1])[0]?.[0];
                          return (
                            <TableRow key={shard.hashedId} className="hover:bg-slate-50">
                              <TableCell className="font-mono text-xs font-medium">{shard.participantAlias}</TableCell>
                              {canViewParticipantIds && (
                                <TableCell className="font-medium text-xs">{shard.participantId}</TableCell>
                              )}
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
          )}

          {/* ── ALL TRIPS TAB ── */}
          <TabsContent value="trips" className="mt-4">
            <Card>
              <CardHeader className="pb-2 space-y-3">
                <CardTitle className="text-sm">All Trip Records — Decrypted View</CardTitle>
                {/* Filter controls */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Select value={filterMode} onValueChange={setFilterMode}>
                      <SelectTrigger className="h-7 text-xs w-36">
                        <SelectValue placeholder="All Modes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <span>All Modes</span>
                          </div>
                        </SelectItem>
                        {TRAVEL_MODES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            <div className="flex items-center gap-2">
                              <TravelModeIcon mode={m.value} className="h-3.5 w-3.5 text-primary" />
                              <span>{m.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterPurpose} onValueChange={setFilterPurpose}>
                      <SelectTrigger className="h-7 text-xs w-40">
                        <SelectValue placeholder="All Purposes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Purposes</SelectItem>
                        {TRIP_PURPOSES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-7 text-xs w-32"
                      placeholder="Participant…"
                      value={filterParticipant}
                      onChange={(e) => setFilterParticipant(e.target.value)}
                    />
                    <Input type="date" className="h-7 text-xs w-36" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                    <span className="text-xs text-muted-foreground">–</span>
                    <Input type="date" className="h-7 text-xs w-36" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                    {hasFilters && (
                      <Button
                        variant="ghost" size="sm" className="h-7 w-7 p-0"
                        onClick={() => { setFilterMode('all'); setFilterPurpose('all'); setFilterParticipant(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {hasFilters && (
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredTrips.length} of {allTrips.length} trips
                    </p>
                  )}

                  {!isLoadingData && topModes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-muted-foreground mr-1">Top modes:</span>
                      {topModes.map(([mode, count]) => {
                        const selected = filterMode === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setFilterMode(selected ? 'all' : mode)}
                            className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] transition-colors ${
                              selected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-white text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <TravelModeIcon mode={mode as Trip['mode']} className="h-3.5 w-3.5" />
                            <span>{TRAVEL_MODE_LABELS[mode] ?? mode}</span>
                            <span className="text-[10px] opacity-70">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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
                        <TableHead className="text-xs text-right">Dist (km)</TableHead>
                        <TableHead className="text-xs text-right">Cost ₹</TableHead>
                        <TableHead className="text-xs">Duration</TableHead>
                        <TableHead className="text-xs text-right">Companions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingData ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 9 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : filteredTrips.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground text-sm py-10">
                            {hasFilters ? 'No trips match the current filters.' : 'No trip data available.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTrips.map((t, i) => (
                          <TableRow key={`${t.id}-${i}`} className="hover:bg-slate-50 text-xs">
                            <TableCell className="font-mono font-medium">{t.participantAlias}</TableCell>
                            <TableCell>{t.tripNumber}</TableCell>
                            <TableCell>{t.createdAt.slice(0, 10)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs inline-flex items-center gap-1.5">
                                <TravelModeIcon mode={t.mode} className="h-3.5 w-3.5 text-primary" />
                                {TRAVEL_MODE_LABELS[t.mode] ?? t.mode}
                              </Badge>
                            </TableCell>
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
          {canViewAudit && (
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
          )}

          {canManageAdmins && (
          <TabsContent value="admins" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Create / Update Admin Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Username"
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                  />
                  <Select value={newAdminRole} onValueChange={(value) => setNewAdminRole(value as ManagedAdminRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {MANAGED_ADMIN_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddManagedUser} className="h-8 text-xs">Save Admin Account</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Managed Admin Accounts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Username</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">Added By</TableHead>
                      <TableHead className="text-xs">Added At</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {managedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                          No managed admin accounts yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      managedUsers.map((user) => (
                        <TableRow key={user.username}>
                          <TableCell className="text-xs font-medium">{user.username}</TableCell>
                          <TableCell className="text-xs">{user.role}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{user.addedBy}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(user.addedAt).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleRemoveManagedUser(user.username)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>

        {/* Mode/Purpose quick breakdown */}
        {!isLoadingData && allTrips.length > 0 && (
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
                        <span className="text-xs w-36 inline-flex items-center gap-2">
                          <TravelModeIcon mode={mode as Trip['mode']} className="h-3.5 w-3.5 text-primary" />
                          {TRAVEL_MODE_LABELS[mode] ?? mode}
                        </span>
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
    </AdminLayout>
  );
}
