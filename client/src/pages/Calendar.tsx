import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend, getDay, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
  "bg-red-500",
];

// --- Draggable Allocation Component ---
interface DraggableAllocationProps {
  id: number;
  color: string;
  hours: number;
  projectName: string;
}

function DraggableAllocation({ id, color, hours, projectName }: DraggableAllocationProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `alloc-${id}`,
    data: { id, hours, color, projectName }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`${color} text-white text-[10px] px-1 py-0.5 rounded truncate opacity-50`}
      >
        {hours}h
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${color} text-white text-[10px] px-1 py-0.5 rounded truncate cursor-grab active:cursor-grabbing hover:opacity-90`}
      title={`${projectName} - ${hours}h`}
    >
      {hours}h
    </div>
  );
}

// --- Droppable Day Component ---
interface DroppableDayProps {
  date: Date;
  children: React.ReactNode;
  isCurrentMonth: boolean;
  isWeekendDay: boolean;
  hasAllocations: boolean;
}

function DroppableDay({ date, children, isCurrentMonth, isWeekendDay, hasAllocations }: DroppableDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: date.toISOString(), // Use ISO string as ID for the date
    data: { date }
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative aspect-square border rounded-lg p-2 transition-colors ${!isCurrentMonth ? "opacity-30" : ""
        } ${isWeekendDay ? "bg-muted/30" : "bg-card"} ${isOver ? "bg-primary/10 ring-2 ring-primary" : (hasAllocations ? "ring-2 ring-primary/20" : "")
        }`}
    >
      <div className="text-xs font-medium mb-1">
        {format(date, "d")}
      </div>
      <div className="space-y-1 overflow-y-auto max-h-[calc(100%-20px)] hide-scrollbar">
        {children}
      </div>
    </div>
  );
}

// --- Trash Zone Component ---
function TrashZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: "trash-zone",
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        mt-6 p-8 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors
        ${isOver ? "border-red-500 bg-red-500/10 text-red-500" : "border-muted-foreground/20 text-muted-foreground"}
      `}
    >
      <div className="flex flex-col items-center gap-2">
        <CalendarIcon className="h-8 w-8 opacity-50" /> {/* Reusing icon for now, ideally Trash icon */}
        <p className="font-medium text-sm">Trascina qui per eliminare</p>
      </div>
    </div>
  );
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: resources } = trpc.resources.list.useQuery();
  const { data: allocations } = trpc.allocations.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData, refetch } = trpc.calendar.byResource.useQuery(
    {
      resourceId: selectedResourceId!,
      year,
      month,
    },
    {
      enabled: selectedResourceId !== null,
    }
  );

  const dailyAllocations = calendarData?.dailyAllocations;
  const timeEntries = calendarData?.timeEntries;


  const generateMutation = trpc.calendar.generate.useMutation();
  const updateDateMutation = trpc.calendar.updateDate.useMutation();
  const deleteMutation = trpc.calendar.delete.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Get project color mapping
  const projectColors = new Map<number, string>();
  projects?.forEach((project, index) => {
    projectColors.set(project.id, COLORS[index % COLORS.length]);
  });

  // Get days in current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group days by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  const firstDayOfWeek = getDay(monthStart);
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(new Date(0));
  }

  daysInMonth.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(0));
    }
    weeks.push(currentWeek);
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const [allocationStartDate, setAllocationStartDate] = useState<Date | undefined>(undefined);
  const [allocationEndDate, setAllocationEndDate] = useState<Date | undefined>(undefined);
  const [activeDragItem, setActiveDragItem] = useState<any>(null);

  const handleGenerateAllocations = async () => {
    if (!selectedResourceId) {
      toast.error("Seleziona una risorsa");
      return;
    }

    const resourceAllocations = allocations?.filter(a => a.resourceId === selectedResourceId);
    if (!resourceAllocations || resourceAllocations.length === 0) {
      toast.error("Nessuna allocazione trovata per questa risorsa");
      return;
    }

    try {
      for (const allocation of resourceAllocations) {
        await generateMutation.mutateAsync({
          allocationId: allocation.id,
          year,
          month,
          startDate: allocationStartDate,
          endDate: allocationEndDate
        });
      }

      toast.success("Allocazioni generate con successo!");
      refetch();
    } catch (error: any) {
      toast.error("Errore durante la generazione", { description: error.message });
    }
  };

  const handleDragStart = (event: any) => {
    setActiveDragItem(event.active.data.current);
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    setIsDragging(false);

    if (!active) return;

    // Extract allocation ID (remove 'alloc-' prefix)
    const allocationId = Number(active.id.toString().replace('alloc-', ''));

    // Case 1: Dropped in Trash Zone
    if (over && over.id === "trash-zone") {
      try {
        await deleteMutation.mutateAsync({ id: allocationId });
        toast.success("Allocazione eliminata");
        refetch();
      } catch (error) {
        toast.error("Errore durante l'eliminazione");
      }
      return;
    }

    // Case 2: Dropped outside (no over) - Optional: keep existing behavior or disable it
    if (!over) {
      // Only allow deletion via trash zone to be explicit?
      // For now, let's DISABLE implicit delete to avoid confusion, or keep it as backup.
      // User complained "it doesn't delete if I drag outside".
      // Let's assume they want explicit delete.
      return;
    }

    // Case 3: Dropped on a Day
    const newDateStr = over.id as string;
    // Check if it's a date string (trash-zone is not a date)
    if (newDateStr === "trash-zone") return; // Should be handled above, but safety check

    const newDate = new Date(newDateStr);

    try {
      await updateDateMutation.mutateAsync({
        id: allocationId,
        date: newDate
      });
      // Optimistic update or fast refetch would be nice, simply refetch for now
      refetch();
    } catch (error) {
      toast.error("Impossibile spostare l'allocazione");
    }
  };



  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value));
  };

  const selectedResource = resources?.find(r => r.id === selectedResourceId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header and Info Card (Unchanged mostly) */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario Risorse</h1>
          <p className="text-muted-foreground mt-1">
            Visualizza i giorni allocati per ogni risorsa. Trascina per spostare o eliminare.
          </p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Gestione Interattiva</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seleziona una risorsa. Genera le allocazioni automaticamente o trascinale manualmente tra i giorni.
                  Trascina un'allocazione fuori dal calendario per cancellarla.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={selectedResourceId?.toString() || ""}
              onValueChange={(value) => setSelectedResourceId(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Seleziona risorsa" />
              </SelectTrigger>
              <SelectContent>
                {resources?.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id.toString()}>
                    {resource.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedResourceId && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Dal</label>
                  <input
                    type="date"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    value={allocationStartDate ? format(allocationStartDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setAllocationStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Al</label>
                  <input
                    type="date"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    value={allocationEndDate ? format(allocationEndDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setAllocationEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
                <Button
                  onClick={handleGenerateAllocations}
                  variant="outline"
                  size="sm"
                  className="mt-auto"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? "Genera" : "Genera"}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[140px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: it })}
            </div>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        {selectedResourceId ? (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-2">
                    {week.map((day, dayIndex) => {
                      const isPlaceholder = day.getTime() === 0;
                      if (isPlaceholder) {
                        return <div key={`placeholder-${dayIndex}`} className="aspect-square" />;
                      }

                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isWeekendDay = isWeekend(day);

                      const dayAllocations = dailyAllocations?.filter(da => isSameDay(new Date(da.date), day)) || [];
                      const dayTimeEntries = timeEntries?.filter(te => isSameDay(new Date(te.date), day)) || [];

                      const hasAllocations = dayAllocations.length > 0;

                      return (
                        <DroppableDay
                          key={day.toISOString()}
                          date={day}
                          isCurrentMonth={isCurrentMonth}
                          isWeekendDay={isWeekendDay}
                          hasAllocations={hasAllocations}
                        >
                          {dayAllocations.map((da) => (
                            <DraggableAllocation
                              key={da.id}
                              id={da.id}
                              color={projectColors.get(da.projectId) || "bg-gray-500"}
                              hours={da.hours}
                              projectName={da.projectName}
                            />
                          ))}

                          {dayTimeEntries.map((te) => (
                            <div
                              key={`entry-${te.id}`}
                              className="border border-green-600/50 bg-green-100/50 text-green-900 text-[10px] px-1 py-0.5 rounded truncate flex items-center justify-between mt-0.5"
                              title={`Lavorato: ${te.projectName || 'N/A'} - ${te.hours}h`}
                            >
                              <span className="truncate">{te.description || "Lavoro"}</span>
                              <span className="font-bold ml-1">{te.hours}h</span>
                            </div>
                          ))}
                        </DroppableDay>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Seleziona una risorsa per visualizzare il calendario</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trash Zone - Visible only when dragging? Or always? Better always or when selected resource */}
        {selectedResourceId && (
          <TrashZone />
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem ? (
            <div className={`${activeDragItem.color} text-white text-[10px] px-1 py-0.5 rounded truncate shadow-lg w-fit`}>
              {activeDragItem.hours}h
            </div>
          ) : null}
        </DragOverlay>

        {/* Legend */}
        {selectedResourceId && projects && projects.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Legenda Commesse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {projects.map((project, index) => {
                  const color = COLORS[index % COLORS.length];
                  return (
                    <div key={project.id} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${color}`} />
                      <span className="text-sm truncate">{project.name}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DndContext>
  );
}
