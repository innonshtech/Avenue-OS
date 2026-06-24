import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import api from '@/lib/api';
import { exportToCSV, exportToPDF, type ExportColumn } from '@/utils/exportUtils';

export default function ReportsPage() {
  const [sprintReports, setSprintReports] = useState<any[]>([]);
  const [teamReports, setTeamReports] = useState<any[]>([]);
  const [projectReports, setProjectReports] = useState<any[]>([]);
  const [productivityReports, setProductivityReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sprints');

  const SPRINT_COLUMNS: ExportColumn[] = [
    { header: 'Sprint Name', key: 'sprint.name' },
    { header: 'Project', key: 'project.name' },
    { header: 'Success Rate (%)', key: 'successRate' },
    { header: 'Velocity (pts)', key: 'velocity' },
    { header: 'Completed Tasks', key: 'completedTasks' },
    { header: 'Blockers Encountered', key: 'blockerCount' },
    { header: 'Summary', key: 'summary' }
  ];

  const TEAM_COLUMNS: ExportColumn[] = [
    { header: 'Team Member', key: 'user.name' },
    { header: 'Sprint', key: 'sprint.name' },
    { header: 'Assigned Tasks', key: 'assignedTasks' },
    { header: 'Completed', key: 'completedTasks' },
    { header: 'Delayed', key: 'delayedTasks' },
    { header: 'Blockers Raised', key: 'blockersRaised' },
    { header: 'Standup Consistency (%)', key: 'standupConsistency' }
  ];

  const PROJECT_COLUMNS: ExportColumn[] = [
    { header: 'Project Name', key: 'name' },
    { header: 'Status', key: 'status' },
    { header: 'Completion (%)', key: 'completionPercentage' },
    { header: 'Total Tasks', key: 'totalTasks' },
    { header: 'Completed Tasks', key: 'completedTasks' },
    { header: 'Overdue Tasks', key: 'overdueTasks' }
  ];

  const PRODUCTIVITY_COLUMNS: ExportColumn[] = [
    { header: 'Overall Velocity', key: 'overallVelocity' },
    { header: 'Avg Completion Time (hrs)', key: 'averageCompletionTime' },
    { header: 'Active Blockers', key: 'activeBlockers' },
    { header: 'Standup Consistency (%)', key: 'standupConsistency' }
  ];

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [sr, tr, pr, prodR] = await Promise.all([
          api.get('/reports/sprints').then(res => res.data),
          api.get('/reports/team').then(res => res.data),
          api.get('/reports/projects').then(res => res.data),
          api.get('/reports/productivity').then(res => res.data),
        ]);
        setSprintReports(sr);
        setTeamReports(tr);
        setProjectReports(pr);
        setProductivityReports(prodR);
      } catch (error) {
        console.error('Failed to fetch reports', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    switch (activeTab) {
      case 'sprints': exportToCSV(sprintReports, 'Sprint_Reports', SPRINT_COLUMNS); break;
      case 'team': exportToCSV(teamReports, 'Team_Reports', TEAM_COLUMNS); break;
      case 'projects': exportToCSV(projectReports, 'Project_Reports', PROJECT_COLUMNS); break;
      case 'productivity': exportToCSV(productivityReports ? [productivityReports] : [], 'Productivity_Report', PRODUCTIVITY_COLUMNS); break;
    }
  };

  const handleExportPDF = () => {
    switch (activeTab) {
      case 'sprints': exportToPDF('Sprint Performance Reports', 'Sprint_Reports', SPRINT_COLUMNS, sprintReports); break;
      case 'team': exportToPDF('Team Performance Metrics', 'Team_Reports', TEAM_COLUMNS, teamReports); break;
      case 'projects': exportToPDF('Project Status Reports', 'Project_Reports', PROJECT_COLUMNS, projectReports); break;
      case 'productivity': exportToPDF('Overall Productivity Report', 'Productivity_Report', PRODUCTIVITY_COLUMNS, productivityReports ? [productivityReports] : []); break;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Management Reports</h1>
          <p className="text-muted-foreground mt-2">Comprehensive reports for sprints, team, and projects.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent">
          <TabsTrigger value="sprints" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent">Sprint Reports</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent">Team Reports</TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent">Project Reports</TabsTrigger>
          <TabsTrigger value="productivity" className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent">Productivity</TabsTrigger>
        </TabsList>

        <TabsContent value="sprints" className="py-6 space-y-4">
          {sprintReports.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No sprint reports available yet.</p>
            </div>
          ) : (
            sprintReports.map(report => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle>{report.sprint?.name || 'Unknown Sprint'}</CardTitle>
                  <CardDescription>Project: {report.project?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-xl font-semibold">{report.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Velocity</p>
                      <p className="text-xl font-semibold">{report.velocity} pts</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed Tasks</p>
                      <p className="text-xl font-semibold">{report.completedTasks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Blockers Encountered</p>
                      <p className="text-xl font-semibold">{report.blockerCount}</p>
                    </div>
                  </div>
                  {report.summary && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-md text-sm">
                      <strong>Summary:</strong> {report.summary}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="team" className="py-6 space-y-4">
          {teamReports.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No team performance metrics available yet.</p>
            </div>
          ) : (
            teamReports.map(report => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle>{report.user?.name}</CardTitle>
                  <CardDescription>Sprint: {report.sprint?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Tasks</p>
                      <p className="text-xl font-semibold">{report.assignedTasks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-xl font-semibold text-emerald-600">{report.completedTasks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Delayed</p>
                      <p className="text-xl font-semibold text-rose-600">{report.delayedTasks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Blockers Raised</p>
                      <p className="text-xl font-semibold text-amber-600">{report.blockersRaised}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Standup Consistency</p>
                      <p className="text-xl font-semibold">{report.standupConsistency}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="projects" className="py-6 space-y-4">
          {projectReports.length === 0 ? (
             <div className="text-center p-12 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No project reports available.</p>
            </div>
          ) : (
            projectReports.map(project => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>Status: {project.status}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Completion</p>
                      <p className="text-2xl font-bold text-indigo-600">{project.completionPercentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Total Tasks</p>
                      <p className="text-xl font-semibold">{project.totalTasks}</p>
                    </div>
                    <div className="p-4 bg-emerald-500/10 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Completed Tasks</p>
                      <p className="text-xl font-semibold text-emerald-600">{project.completedTasks}</p>
                    </div>
                    <div className="p-4 bg-rose-500/10 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Overdue Tasks</p>
                      <p className="text-xl font-semibold text-rose-600">{project.overdueTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="productivity" className="py-6">
          {productivityReports && (
            <Card>
              <CardHeader>
                <CardTitle>Overall Productivity Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-6 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Overall Velocity</p>
                    <p className="text-3xl font-bold text-indigo-600">{productivityReports.overallVelocity}</p>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Avg Completion Time</p>
                    <p className="text-3xl font-bold">{productivityReports.averageCompletionTime} hrs</p>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Active Blockers</p>
                    <p className="text-3xl font-bold text-rose-600">{productivityReports.activeBlockers}</p>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Standup Consistency</p>
                    <p className="text-3xl font-bold text-emerald-600">{productivityReports.standupConsistency}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
