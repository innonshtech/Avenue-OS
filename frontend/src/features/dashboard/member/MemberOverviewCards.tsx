import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Zap, CheckCircle2, ShieldAlert, GitPullRequest } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

interface MemberOverviewCardsProps {
  overview: any;
  isLoading: boolean;
}

export default function MemberOverviewCards({ overview, isLoading }: MemberOverviewCardsProps) {
  const navigate = useNavigate();

  if (isLoading || !overview) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse bg-card shadow-soft h-[120px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* 1. Pending Tasks */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card 
          className="bg-card shadow-soft border-muted h-full hover:shadow-md hover:border-indigo-500/30 transition-all cursor-pointer"
          onClick={() => navigate('/dashboard/my-tasks?status=PENDING')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Pending Tasks</CardTitle>
            <Target className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.pendingTasks}</div>
            <div className="flex text-[10px] gap-2 mt-1 font-medium">
              <span className="text-amber-500">{overview.dueToday} Due Today</span>
              {overview.overdueTasks > 0 && <span className="text-rose-500">{overview.overdueTasks} Overdue</span>}
              {overview.urgentTasks > 0 && <span className="text-purple-500">{overview.urgentTasks} Urgent</span>}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2. Completed Work */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card 
          className="bg-card shadow-soft border-muted h-full hover:shadow-md hover:border-emerald-500/30 transition-all cursor-pointer"
          onClick={() => navigate('/dashboard/my-tasks?status=DONE')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Work</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.completedTasks}</div>
            <div className="flex text-[10px] gap-2 mt-1 font-medium text-muted-foreground">
              <span className="text-emerald-500">+{overview.completedThisSprint} This Sprint</span>
              <span>•</span>
              <span>{overview.storyPoints} SP Total</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. Active Sprint */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card 
          className="bg-card shadow-soft border-muted h-full hover:shadow-md hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden"
          onClick={() => navigate('/dashboard/boards')}
        >
          <div className="absolute inset-x-0 bottom-0 h-1 bg-muted">
            <div className="h-full bg-indigo-500" style={{ width: `${overview.sprintProgress}%` }} />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-truncate line-clamp-1 pr-2">
              {overview.activeSprint?.name || 'No Active Sprint'}
            </CardTitle>
            <Zap className="h-4 w-4 text-indigo-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold">{overview.sprintProgress}%</div>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">
                  Ends {overview.activeSprint ? new Date(overview.activeSprint.endDate).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 4. Blockers */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card 
          className={`bg-card shadow-soft h-full hover:shadow-md hover:border-rose-500/30 transition-all cursor-pointer ${overview.blockers > 0 ? 'border-rose-200 bg-rose-50/30' : 'border-muted'}`}
          onClick={() => navigate('/dashboard/my-tasks?blocked=true')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockers</CardTitle>
            <ShieldAlert className={`h-4 w-4 ${overview.blockers > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overview.blockers > 0 ? 'text-rose-600' : ''}`}>{overview.blockers}</div>
            <p className="text-[10px] mt-1 font-medium line-clamp-1 text-muted-foreground">
              {overview.activeBlocker ? overview.activeBlocker.description : 'All clear'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* 5. Review Queue */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card 
          className="bg-card shadow-soft border-muted h-full hover:shadow-md hover:border-sky-500/30 transition-all cursor-pointer"
          onClick={() => navigate('/dashboard/my-tasks?status=INTERNAL_REVIEW')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Queue</CardTitle>
            <GitPullRequest className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.reviewQueue}</div>
            <p className="text-[10px] mt-1 font-medium text-muted-foreground">
              Tasks waiting for review
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
