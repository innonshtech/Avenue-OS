import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, AlertTriangle, LayoutDashboard, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface KPIsProps {
  activeProjects: number;
  totalActiveTasks: number;
  globalBlockers: number;
  weeklyManHours: number;
  isLoading?: boolean;
}

export default function DashboardKPIs({ activeProjects, totalActiveTasks, globalBlockers, weeklyManHours, isLoading }: KPIsProps) {
  const navigate = useNavigate();
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card 
          className="bg-card shadow-soft border-muted hover:border-indigo-500/30 transition-all cursor-pointer group hover:shadow-md"
          onClick={() => navigate('/dashboard/projects')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Active Projects</CardTitle>
            <div className="bg-indigo-500/10 p-2 rounded-md group-hover:bg-indigo-500/20 transition-colors">
              <LayoutDashboard className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded-md mt-1"></div>
            ) : (
              <div className="text-2xl font-bold">{activeProjects}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Across all teams</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card 
          className="bg-card shadow-soft border-muted hover:border-indigo-500/30 transition-all cursor-pointer group hover:shadow-md"
          onClick={() => navigate('/dashboard/tasks')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Active Tasks</CardTitle>
            <div className="bg-indigo-500/10 p-2 rounded-md group-hover:bg-indigo-500/20 transition-colors">
              <Zap className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded-md mt-1"></div>
            ) : (
              <div className="text-2xl font-bold">{totalActiveTasks}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">In progress globally</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card 
          className="bg-card shadow-soft border-muted hover:border-red-500/50 transition-all cursor-pointer group hover:shadow-md"
          onClick={() => navigate('/dashboard/tasks?blocked=true')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-500">Global Blockers</CardTitle>
            <div className="bg-red-500/10 p-2 rounded-md group-hover:bg-red-500/20 transition-colors">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 bg-red-500/20 animate-pulse rounded-md mt-1"></div>
            ) : (
              <div className="text-2xl font-bold text-red-500">{globalBlockers}</div>
            )}
            <p className="text-xs text-red-500/70 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card 
          className="bg-card shadow-soft border-muted hover:border-emerald-500/30 transition-all cursor-pointer group hover:shadow-md"
          onClick={() => navigate('/dashboard/reports')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Weekly Man-Hours</CardTitle>
            <div className="bg-emerald-500/10 p-2 rounded-md group-hover:bg-emerald-500/20 transition-colors">
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded-md mt-1"></div>
            ) : (
              <div className="text-2xl font-bold">{weeklyManHours} hrs</div>
            )}
            <p className="text-xs text-emerald-500 mt-1 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Trending upward
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
