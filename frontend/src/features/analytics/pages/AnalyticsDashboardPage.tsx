import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import api from '@/lib/api';
import { useTargets } from '@/features/targets/api/targetApi';

export default function AnalyticsDashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [targetsData, setTargetsData] = useState<any[]>([]);
  const [workloadData, setWorkloadData] = useState<any[]>([]);
  const [blockersData, setBlockersData] = useState<any[]>([]);
  const [productivityData, setProductivityData] = useState<any[]>([]);
  const [burndownData, setBurndownData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { data: targets = [] } = useTargets();
  const [targetFilter, setTargetFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query = targetFilter ? `?targetId=${targetFilter}` : '';
        const results = await Promise.allSettled([
          api.get(`/analytics/overview${query}`),
          api.get(`/analytics/sprints`), // Velocity across targets
          api.get(`/analytics/team-workload${query}`),
          api.get(`/analytics/blockers${query}`),
          api.get(`/analytics/productivity${query}`),
          api.get(`/analytics/burndown${query}`),
        ]);
        
        if (results[0].status === 'fulfilled') setOverview(results[0].value.data);
        if (results[1].status === 'fulfilled') setTargetsData(results[1].value.data);
        if (results[2].status === 'fulfilled') setWorkloadData(results[2].value.data);
        if (results[3].status === 'fulfilled') setBlockersData(results[3].value.data);
        if (results[4].status === 'fulfilled') setProductivityData(results[4].value.data);
        if (results[5].status === 'fulfilled') setBurndownData(results[5].value.data);
        
        results.forEach((r, i) => {
          if (r.status === 'rejected') {
            console.error(`Failed to fetch analytics endpoint index ${i}`, r.reason);
          }
        });
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [targetFilter]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ef4444'];

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading enterprise analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Analytics</h1>
          <p className="text-muted-foreground mt-2">Engineering visibility, performance metrics, and productivity insights.</p>
        </div>
        <select 
          className="bg-background border border-border rounded-md text-sm px-3 py-2 w-64 shadow-sm" 
          value={targetFilter || ''} 
          onChange={e => setTargetFilter(e.target.value || null)}
        >
          <option value="">All Targets (Historical Data)</option>
          {targets.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.status === 'COMPLETED' ? '(Completed)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{overview.totalActiveTasks}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Target Completion %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{(overview.sprintCompletionRate || 0).toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delayed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">{overview.delayedTasks}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">RFIs Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{overview.blockersCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Man-Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.weeklyManHours || overview.teamVelocity || 0} hrs</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Completion Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.avgCompletionTime} hrs</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.activeProjects}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Team Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.teamUtilization}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Target Burndown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Active Target Burndown</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burndownData}>
                <defs>
                  <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="remaining" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRemaining)" name="Actual Remaining" />
                <Line type="monotone" dataKey="ideal" stroke="#10b981" strokeDasharray="5 5" strokeWidth={2} name="Ideal Progress" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Workload Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="member" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="pending" fill="#6366f1" radius={[4, 4, 0, 0]} name="Pending Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Blocker Trends */}
        <Card>
          <CardHeader>
            <CardTitle>RFIs by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={blockersData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category"
                  label={({ category, count }: any) => `${category} (${count})`}
                >
                  {blockersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Productivity Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Productivity Timeline</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" name="Completed Tasks" />
                <Line type="monotone" dataKey="standups" stroke="#f59e0b" strokeWidth={2} name="Daily Reports" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
