import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Bell, CheckCircle } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditCalendarProps {
  templates: any[];
  reports: any[];
}

export function AuditCalendar({ templates, reports }: AuditCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate scheduled report dates based on templates
  const getScheduledDates = () => {
    const dates: { date: Date; type: string; template: string; sector: string }[] = [];
    
    templates.forEach((template) => {
      if (template.frequency === 'monthly') {
        // 1st of each month
        dates.push({
          date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
          type: 'monthly',
          template: template.template_name,
          sector: template.sector_key,
        });
      } else if (template.frequency === 'biweekly') {
        // 1st and 15th of each month
        dates.push({
          date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
          type: 'biweekly',
          template: template.template_name,
          sector: template.sector_key,
        });
        dates.push({
          date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15),
          type: 'biweekly',
          template: template.template_name,
          sector: template.sector_key,
        });
      } else if (template.frequency === 'quarterly') {
        // First day of quarter
        const quarterStartMonth = Math.floor(currentMonth.getMonth() / 3) * 3;
        if (currentMonth.getMonth() === quarterStartMonth) {
          dates.push({
            date: new Date(currentMonth.getFullYear(), quarterStartMonth, 1),
            type: 'quarterly',
            template: template.template_name,
            sector: template.sector_key,
          });
        }
      }
    });

    return dates;
  };

  const scheduledDates = getScheduledDates();

  // Check if a day has scheduled reports
  const getEventsForDay = (day: Date) => {
    const scheduled = scheduledDates.filter(s => isSameDay(s.date, day));
    const generated = reports.filter(r => isSameDay(new Date(r.generated_at), day));
    return { scheduled, generated };
  };

  // Reminder dates (3 days before scheduled reports)
  const reminderDates = scheduledDates.map(s => ({
    ...s,
    reminderDate: addDays(s.date, -3),
  }));

  const sectorColors: Record<string, string> = {
    banking: 'bg-blue-500',
    health: 'bg-green-500',
    industry: 'bg-amber-500',
    retail: 'bg-purple-500',
    technology: 'bg-cyan-500',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Calendario de Auditorías</CardTitle>
            <CardDescription>
              Informes programados y recordatorios
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[150px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-7 bg-muted">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {/* Empty cells for days before month start */}
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 min-h-[80px] border-t bg-muted/30" />
              ))}

              {days.map((day) => {
                const { scheduled, generated } = getEventsForDay(day);
                const hasReminder = reminderDates.some(r => isSameDay(r.reminderDate, day));
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`p-2 min-h-[80px] border-t ${
                      isCurrentDay ? 'bg-primary/5 ring-2 ring-primary ring-inset' : ''
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {scheduled.map((event, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-1 rounded ${sectorColors[event.sector]} text-white truncate`}
                          title={event.template}
                        >
                          <FileText className="h-3 w-3 inline mr-1" />
                          {event.sector.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {generated.map((report, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 truncate"
                          title={`Generado: ${report.compliance_score}/100`}
                        >
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          {report.compliance_score}
                        </div>
                      ))}
                      {hasReminder && scheduled.length === 0 && (
                        <div className="text-xs p-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          <Bell className="h-3 w-3 inline mr-1" />
                          Preparar
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground">Leyenda:</span>
            {Object.entries(sectorColors).map(([sector, color]) => (
              <div key={sector} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="capitalize">{sector}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Generado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span>Recordatorio</span>
            </div>
          </div>

          {/* Upcoming Reports */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximos Informes Programados
            </h4>
            <div className="space-y-2">
              {scheduledDates
                .filter(s => s.date >= new Date())
                .slice(0, 5)
                .map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${sectorColors[event.sector]}`} />
                      <span className="text-sm">{event.template}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(event.date, 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                ))}
              {scheduledDates.filter(s => s.date >= new Date()).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay informes programados para este mes
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
