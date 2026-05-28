import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSecurityMetrics } from '../hooks/useAdmin';
import { Shield, ShieldAlert, Users, Key, AlertTriangle, Terminal, Globe, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

export const SecurityMonitoringPanel = () => {
  const { data: securityData, isLoading, error } = useSecurityMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-28 animate-pulse bg-slate-800/40 rounded-xl" />
          <div className="h-28 animate-pulse bg-slate-800/40 rounded-xl" />
        </div>
        <div className="h-64 animate-pulse bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  if (error || !securityData) {
    return (
      <Card className="bg-slate-900/60 border-red-500/20 backdrop-blur-xl">
        <CardContent className="py-8 text-center text-red-400">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">Security Layer Unavailable</p>
          <p className="text-xs text-slate-500 mt-1">Ensure the backend server is running and database connection is active.</p>
        </CardContent>
      </Card>
    );
  }

  const { failedAttempts = 0, activeSessions = 0, securityAlerts = [], recentLogs = [] } = securityData;

  return (
    <div className="space-y-8">
      {/* Security KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl hover:border-slate-700 transition-all">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Secure Sessions</span>
              <p className="text-3xl font-extrabold text-white">{activeSessions}</p>
            </div>
            <div className="bg-indigo-500/10 p-3.5 rounded-xl border border-indigo-500/20">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl hover:border-slate-700 transition-all">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Blocklist & Failed Attempts</span>
              <p className="text-3xl font-extrabold text-red-500">{failedAttempts}</p>
            </div>
            <div className={`p-3.5 rounded-xl border ${failedAttempts > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
              <Key className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security Audit Feed */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-400" />
                Security Audit Log
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">Real-time threat and operation monitoring feed.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {securityAlerts.map((alert: any, i: number) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-lg border flex gap-3 text-xs ${
                    alert.severity === 'HIGH' 
                      ? 'bg-red-500/10 border-red-500/20' 
                      : alert.severity === 'MEDIUM' 
                      ? 'bg-amber-500/10 border-amber-500/20' 
                      : 'bg-slate-800/40 border-slate-800'
                  }`}
                >
                  <Terminal className={`h-4 w-4 mt-0.5 shrink-0 ${
                    alert.severity === 'HIGH' ? 'text-red-400' : alert.severity === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold uppercase tracking-wider text-slate-300">{alert.action}</span>
                      <span className="text-[10px] text-slate-500">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                    </div>
                    {alert.metadata?.message && <p className="text-slate-400 leading-relaxed">{alert.metadata.message}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                      {alert.ipAddress && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {alert.ipAddress}</span>}
                      {alert.userAgent && <span className="flex items-center gap-1 max-w-[150px] truncate"><Monitor className="h-3 w-3" /> {alert.userAgent}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
              {securityAlerts.length === 0 && (
                <div className="text-center text-slate-500 py-12 text-sm">
                  No security alerts logged. Platform is secure.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Login History Feed */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                Access Log Timeline
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">Audit timeline of authentication attempts.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {recentLogs.map((log: any, i: number) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg border bg-slate-800/20 border-slate-800/80 flex justify-between items-start gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-200">{log.email}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                      <span>{log.deviceName || 'Unknown Device'}</span>
                      <span>•</span>
                      <span>{log.ipAddress || 'Unknown IP'}</span>
                    </p>
                    {log.failureReason && (
                      <p className="text-[10px] text-red-400/90 font-medium">Reason: {log.failureReason}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1.5">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      log.status === 'SUCCESS' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : log.status === 'LOCKED'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {log.status}
                    </span>
                    <p className="text-[9px] text-slate-500">{new Date(log.loggedInAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                </motion.div>
              ))}
              {recentLogs.length === 0 && (
                <div className="text-center text-slate-500 py-12 text-sm">
                  No login history logged yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
