import React from 'react';
import { X, Check } from 'lucide-react';
import { TEAM_MEMBERS } from '@/constants/teamMembers';
import { Button } from '@/components/ui/button';

export interface FilterState {
  priorities: string[];
  statuses: string[];
  assigneeIds: string[];
  projectIds: string[];
  sprintIds: string[];
  isOverdue: boolean;
  isBlocked: boolean;
}

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  projects?: any[];
  sprints?: any[];
  isBoardView?: boolean;
}

export const initialFilterState: FilterState = {
  priorities: [],
  statuses: [],
  assigneeIds: [],
  projectIds: [],
  sprintIds: [],
  isOverdue: false,
  isBlocked: false,
};

const PRIORITIES = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];
const STATUSES = [
  'PENDING', 
  'IN_PROGRESS', 
  'INTERNAL_REVIEW', 
  'EXTERNAL_REVIEW', 
  'MODIFICATION_REQUIRED', 
  'APPROVED', 
  'DONE'
];

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  projects = [],
  sprints = [],
  isBoardView = false,
}) => {
  if (!isOpen) return null;

  const togglePriority = (priority: string) => {
    setFilters((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter((p) => p !== priority)
        : [...prev.priorities, priority],
    }));
  };

  const toggleStatus = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const toggleAssignee = (userId: string) => {
    setFilters((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter((id) => id !== userId)
        : [...prev.assigneeIds, userId],
    }));
  };

  const toggleProject = (projectId: string) => {
    setFilters((prev) => ({
      ...prev,
      projectIds: prev.projectIds.includes(projectId)
        ? prev.projectIds.filter((id) => id !== projectId)
        : [...prev.projectIds, projectId],
    }));
  };

  const toggleSprint = (sprintId: string) => {
    setFilters((prev) => ({
      ...prev,
      sprintIds: prev.sprintIds.includes(sprintId)
        ? prev.sprintIds.filter((id) => id !== sprintId)
        : [...prev.sprintIds, sprintId],
    }));
  };

  const clearAll = () => {
    setFilters(initialFilterState);
  };

  return (
    <div className="fixed inset-0 z-[999] flex justify-end">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/55 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Advanced Filters</h2>
            <p className="text-xs text-zinc-400">Refine task search conditions</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin select-none">
          {/* Priorities */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2.5">Priority</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((priority) => {
                const isSelected = filters.priorities.includes(priority);
                return (
                  <button
                    key={priority}
                    onClick={() => togglePriority(priority)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {priority}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Statuses (If not board view) */}
          {!isBoardView && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2.5">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((status) => {
                  const isSelected = filters.statuses.includes(status);
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span>{status.replace('_', ' ')}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assignees */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2.5">Assignee</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {TEAM_MEMBERS.map((member) => {
                const isSelected = filters.assigneeIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleAssignee(member.id)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={member.avatar} alt={member.name} className="w-5 h-5 rounded-full border border-zinc-800" />
                      <span>{member.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Projects (optional) */}
          {projects.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2.5">Project</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {projects.map((proj) => {
                  const isSelected = filters.projectIds.includes(proj.id);
                  return (
                    <button
                      key={proj.id}
                      onClick={() => toggleProject(proj.id)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span>{proj.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sprints (optional) */}
          {sprints.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2.5">Sprint</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {sprints.map((sprint) => {
                  const isSelected = filters.sprintIds.includes(sprint.id);
                  return (
                    <button
                      key={sprint.id}
                      onClick={() => toggleSprint(sprint.id)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span>{sprint.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Flags / Boolean Switches */}
          <div className="border-t border-zinc-800 pt-4 space-y-4">
            {/* Overdue Switch */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-200">Overdue Tasks</p>
                <p className="text-[10px] text-zinc-500">Show only tasks past their due date</p>
              </div>
              <button
                onClick={() => setFilters(prev => ({ ...prev, isOverdue: !prev.isOverdue }))}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  filters.isOverdue ? 'bg-indigo-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    filters.isOverdue ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Blocked Switch */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-200">Blocked Tasks</p>
                <p className="text-[10px] text-zinc-500">Show only tasks with active blockers</p>
              </div>
              <button
                onClick={() => setFilters(prev => ({ ...prev, isBlocked: !prev.isBlocked }))}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  filters.isBlocked ? 'bg-indigo-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    filters.isBlocked ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-zinc-800 pt-4 mt-6 flex justify-between shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-400 hover:text-white"
            onClick={clearAll}
          >
            Clear All
          </Button>
          <Button 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            onClick={onClose}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};
