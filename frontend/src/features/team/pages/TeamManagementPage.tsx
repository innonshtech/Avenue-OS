import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ROLE_COLORS } from '@/constants/teamMembers';
import api from '@/lib/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/components/ui/button';
import OnboardEmployeeModal from '../components/OnboardEmployeeModal';

export default function TeamManagementPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const { user } = useAuthStore();
  const isPM = user?.role === 'PRODUCT_MANAGER';

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.get('/team');
        setTeam(res.data);
      } catch (error) {
        console.error('Failed to fetch team data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading team center...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Control Center</h1>
          <p className="text-muted-foreground mt-2">Manage team workload, utilization, and assignments.</p>
        </div>
        {isPM && (
          <Button onClick={() => setOnboardModalOpen(true)}>
            Onboard Employee
          </Button>
        )}
      </div>

      <OnboardEmployeeModal open={onboardModalOpen} onOpenChange={setOnboardModalOpen} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {team.map(member => (
          <Card key={member.id} className="relative overflow-hidden group hover:shadow-md transition-all">
            {/* Online Status Indicator */}
            <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${member.isOnline ? 'bg-emerald-500' : 'bg-muted'} ring-2 ring-background`} />
            
            <CardHeader className="text-center pb-2 pt-6">
              <CardTitle className="text-lg">{member.name}</CardTitle>
              <CardDescription className="flex justify-center items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider border ${ROLE_COLORS[member.role] || ''}`}>
                  {member.role?.replace('_', ' ')}
                </span>
                <span className="text-[11px] uppercase tracking-wider">{member.department}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-center text-sm border-y py-3">
                <div>
                  <p className="text-muted-foreground mb-1">Tasks</p>
                  <p className="font-semibold">{member.assignedTasks}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Blockers</p>
                  <p className="font-semibold text-rose-600">{member.blockersCount}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground font-medium">Utilization</span>
                  <span className="font-semibold">{member.utilizationPercent}%</span>
                </div>
                <Progress 
                  value={member.utilizationPercent} 
                  className="h-2" 
                  indicatorClassName={
                    member.utilizationPercent > 80 ? 'bg-rose-500' : 
                    member.utilizationPercent < 30 ? 'bg-emerald-500' : 'bg-indigo-500'
                  } 
                />
              </div>

              {member.activeSprint && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Active Sprint</p>
                  <div className="bg-muted px-3 py-1.5 rounded-md text-sm font-medium truncate">
                    {member.activeSprint}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
