import StageCalendar from '@/features/calendar/StageCalendar';

export default function CalendarPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stage Schedule</h1>
        <p className="text-muted-foreground">
          Visual timeline of active stages, task deadlines, and RFI resolutions.
        </p>
      </div>
      
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <StageCalendar />
      </div>
    </div>
  );
}
