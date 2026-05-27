import React from 'react';
import { useActivities } from '../api';
import { ActivityLogTable } from '../components/ActivityLogTable';
import { Loader2, ShieldCheck, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function OrganizationAuditLogPage() {
  const [selectedMember, setSelectedMember] = React.useState<string>('all');
  
  const { data: team = [] } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await api.get('/team');
      return res.data;
    }
  });

  const { data: activities, isLoading, error } = useActivities({ 
    memberId: selectedMember !== 'all' ? selectedMember : undefined 
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-rose-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Audit Log</h1>
          </div>
          <p className="text-muted-foreground">
            A comprehensive, tamper-proof history of all actions, updates, and events across the entire organization.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 bg-card p-1 rounded-lg border border-border">
          <Filter className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-full md:w-[250px] border-none shadow-none bg-transparent focus:ring-0">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">
                <div className="flex items-center font-medium">
                  All Members
                </div>
              </SelectItem>
              {team.map((member: any) => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center gap-2">
                    <span>{member.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500 bg-red-50 rounded-xl border border-red-200">
          Failed to load organization audit logs.
        </div>
      ) : (
        <ActivityLogTable activities={activities || []} showUser={true} />
      )}
    </div>
  );
}
