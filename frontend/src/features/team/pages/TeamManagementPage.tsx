import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ROLE_COLORS } from '@/constants/teamMembers';
import type { UserRole } from '@/types/user';
import api from '@/lib/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Button } from '@/components/ui/button';
import OnboardEmployeeModal from '../components/OnboardEmployeeModal';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

export default function TeamManagementPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string, name: string } | null>(null);
  const { user } = useAuthStore();
  const isPM = user?.role === 'PROJECT_MANAGER';
  const { toast } = useToast();

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

  const handleDeleteClick = (id: string, name: string) => {
    setMemberToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await api.delete(`/team-members/${memberToDelete.id}`);
      toast({
        title: "Employee Removed",
        description: `${memberToDelete.name} has been successfully deactivated.`,
      });
      fetchTeam();
    } catch (error) {
      console.error('Failed to remove employee', error);
      toast({
        title: "Error",
        description: "Failed to remove employee.",
        variant: "destructive"
      });
    } finally {
      setMemberToDelete(null);
    }
  };

  useEffect(() => {
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

      <OnboardEmployeeModal open={onboardModalOpen} onOpenChange={setOnboardModalOpen} onSuccess={fetchTeam} />

      <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove Employee</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove <span className="font-semibold text-foreground">{memberToDelete?.name}</span> from the team? This action will deactivate their account.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {team.map(member => (
          <Card key={member.id} className="relative overflow-hidden group hover:shadow-md transition-all">
            {/* Online Status Indicator */}
            <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${member.isOnline ? 'bg-emerald-500' : 'bg-muted'} ring-2 ring-background`} />
            
            {/* Delete Button */}
            {isPM && member.id !== user?.id && (
              <button 
                onClick={() => handleDeleteClick(member.id, member.name)}
                className="absolute top-3.5 left-3.5 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md"
                title="Remove Employee"
                aria-label={`Remove ${member.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <CardHeader className="text-center pb-2 pt-6">
              <CardTitle className="text-lg">{member.name}</CardTitle>
              <CardDescription className="flex justify-center items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider border ${ROLE_COLORS[member.role as UserRole] || ''}`}>
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

              {member.activeStage && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Active Stage</p>
                  <div className="bg-muted px-3 py-1.5 rounded-md text-sm font-medium truncate">
                    {member.activeStage}
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
