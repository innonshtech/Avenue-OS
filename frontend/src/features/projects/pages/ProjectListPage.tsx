import { useState } from 'react';
import { useProjects } from '../api/projectApi';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, LayoutGrid, List, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectListPage() {
  const { data: projects = [], isLoading } = useProjects();
  const { user } = useAuthStore();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('ACTIVE');
  const isSaket = user?.role === 'PRODUCT_MANAGER';

  const isOverdue = (deadline: string | null, status: string) => {
    if (!deadline || status === 'COMPLETED') return false;
    return new Date(deadline).getTime() < new Date().getTime();
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.key.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'ALL' || p.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage and track all engineering initiatives.</p>
        </div>
        
        {isSaket && (
          <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-card p-3 rounded-lg border border-border shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
          <Button 
            variant={view === 'grid' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8 px-2"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={view === 'list' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8 px-2"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ALL">All Projects</TabsTrigger>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="PLANNING">Planning</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center p-10">Loading projects...</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const projectIsOverdue = isOverdue(project.deadline, project.status);
            return (
            <Link key={project.id} to={`/dashboard/projects/${project.id}`} className="group outline-none">
              <Card className={`h-full bg-card shadow-soft hover:shadow-md transition-all duration-200 border ${projectIsOverdue ? 'border-red-500/50 hover:border-red-500 ring-red-500' : 'border-muted hover:border-indigo-500/30 ring-indigo-500'} group-focus-visible:ring-2`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">{project.key}</Badge>
                      {projectIsOverdue && (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20 text-[10px] px-1.5 py-0">
                          <AlertCircle className="w-3 h-3 mr-1" /> Overdue
                        </Badge>
                      )}
                    </div>
                    <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'} className={project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20' : ''}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex -space-x-2 overflow-hidden">
                      {project.members.slice(0, 3).map((member, i) => (
                        <div key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-xs font-medium">
                          {i}
                        </div>
                      ))}
                      {project.members.length > 3 && (
                        <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-xs font-medium">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-medium ${projectIsOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {project.deadline ? `Deadline: ${new Date(project.deadline).toLocaleDateString()}` : 'No deadline'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )})}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Key</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Members</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(project => (
                  <tr key={project.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <Link to={`/dashboard/projects/${project.id}`} className="hover:text-indigo-600 transition-colors">{project.name}</Link>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{project.key}</td>
                    <td className="px-6 py-4">
                      <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'} className={project.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20' : ''}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 3).map((member, i) => (
                          <div key={member.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-medium">
                            {i}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/dashboard/projects/${project.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {filteredProjects.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-lg border border-dashed border-border">
          <LayoutGrid className="w-10 h-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="text-muted-foreground max-w-sm mt-1">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      )}

      <CreateProjectModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
