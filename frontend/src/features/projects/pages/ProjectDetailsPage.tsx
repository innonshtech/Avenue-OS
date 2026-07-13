import { useParams, Link } from 'react-router-dom';
import { useProject } from '../api/projectApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Activity, CheckCircle2, LayoutDashboard, Target, Users, Settings } from 'lucide-react';
import { ProjectActionDropdown } from '../components/ProjectActionDropdown';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useEffect, useState } from 'react';
import { useSocket } from '@/features/realtime/SocketProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EditProjectModal } from '../components/EditProjectModal';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id!);
  const { user } = useAuthStore();
  const { joinProject, leaveProject } = useSocket();
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (id) {
      joinProject(id);
      return () => {
        leaveProject(id);
      };
    }
  }, [id, joinProject, leaveProject]);

  if (isLoading) return <div className="flex justify-center p-10">Loading project...</div>;
  if (!project) return <div>Project not found.</div>;

  const projectTargets = project.targets || [];
  const projectTasks = project.tasks || [];
  
  const completedTasks = projectTasks.filter(t => t.status === 'DONE').length;
  const totalTasks = projectTasks.length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const canEditProject = user?.permissions?.includes('EDIT_PROJECT');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/projects">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge variant="outline" className="font-mono text-xs">{project.key}</Badge>
              <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'} className={project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}>
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          </div>
        </div>
        
        {isPM && (
          <ProjectActionDropdown project={project} />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-card shadow-soft border-muted md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              {project.description || "No description provided."}
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Project Completion</span>
                <span className="font-bold text-indigo-500">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">{completedTasks} of {totalTasks} tasks completed</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card shadow-soft border-muted">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                <Users className="w-4 h-4 mr-2" />
                Team Members
              </CardTitle>
              {canEditProject && (
                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2" onClick={() => setIsEditOpen(true)}>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto pr-1">
                {project.members && project.members.length > 0 ? (
                  project.members.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{member.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium leading-none truncate">{member.user?.name}</span>
                        <span className="text-xs text-muted-foreground mt-1">{member.role?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No team members assigned.</div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card shadow-soft border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center text-muted-foreground">
                  <Target className="w-3 h-3 mr-1" />
                  Active Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectTargets.filter((s: any) => s.status === 'ACTIVE').length}</div>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-soft border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4">Targets</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projectTargets.map((target: any) => (
          <Link key={target.id} to={`/dashboard/targets/${target.id}`} className="group outline-none">
            <Card className="h-full bg-card shadow-soft hover:shadow-md transition-all duration-200 border-muted group-hover:border-indigo-500/30 group-focus-visible:ring-2 ring-indigo-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={target.status === 'ACTIVE' ? 'default' : 'secondary'} className={target.status === 'ACTIVE' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : ''}>
                    {target.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(target.endDate).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">{target.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{target.goal}</p>
                <div className="flex items-center gap-2 mt-4 text-xs font-medium text-foreground">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  View Target Dashboard
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {projectTargets.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-card rounded-lg border border-dashed border-border">
            <LayoutDashboard className="w-8 h-8 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium">No targets yet</h3>
          </div>
        )}
      </div>

      <EditProjectModal open={isEditOpen} onOpenChange={setIsEditOpen} project={project} />
    </div>
  );
}
