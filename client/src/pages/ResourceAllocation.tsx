import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useDraggable,
  useDroppable
} from "@dnd-kit/core";
import { useState } from "react";
import { User, GripVertical, ArrowRight, Upload } from "lucide-react";
import { toast } from "sonner";
import { AllocationDialog } from "@/components/AllocationDialog";

interface AllocationWithDetails {
  id: number;
  projectId: number;
  resourceId: number;
  daysPerMonth: number;
  hoursPerMonth: number;
  monthlyCost: string;
  resourceName?: string;
  dailyCost?: string;
  // Flag to check if it's a real allocation or a "draggable resource"
  isResource?: boolean;
}

export default function ResourceAllocation() {
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const { data: resources } = trpc.resources.list.useQuery();
  const { data: allocations, refetch } = trpc.allocations.list.useQuery();
  const reallocateMutation = trpc.allocations.reallocate.useMutation();
  const utils = trpc.useUtils();

  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [draggedItem, setDraggedItem] = useState<AllocationWithDetails | null>(null);

  // Dialog State
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [pendingAllocation, setPendingAllocation] = useState<{ resourceId: number, projectId: number } | null>(null);

  // Enrich allocations with resource details
  const enrichedAllocations: AllocationWithDetails[] = (allocations || []).map(allocation => {
    const resource = resources?.find(r => r.id === allocation.resourceId);
    return {
      ...allocation,
      resourceName: resource?.name,
      dailyCost: resource?.dailyCost,
    };
  });

  // Prepare available resources (draggable items)
  // Logic: List all resources. You can allocate a resource multiple times.
  const draggableResources: AllocationWithDetails[] = (resources || []).map(r => ({
    id: -r.id, // Negative ID to distinguish from real allocations
    projectId: 0,
    resourceId: r.id,
    daysPerMonth: 0,
    hoursPerMonth: 0,
    monthlyCost: "0",
    resourceName: r.name,
    dailyCost: r.dailyCost,
    isResource: true,
  }));

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id;
    setActiveId(id);

    // Check if it's an existing allocation or a new resource
    if (typeof id === 'number' && id > 0) {
      const allocation = enrichedAllocations.find(a => a.id === id);
      setDraggedItem(allocation || null);
    } else {
      // It's a resource (negative id)
      const resourceId = -Number(id);
      const resource = draggableResources.find(r => r.resourceId === resourceId);
      setDraggedItem(resource || null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setDraggedItem(null);

    if (!over) return;

    const sourceId = Number(active.id);
    const newProjectId = Number(over.id);

    // 1. DRAG FROM AVAILABLE RESOURCES (New Allocation)
    if (sourceId < 0) {
      const resourceId = -sourceId;
      setPendingAllocation({ resourceId, projectId: newProjectId });
      setShowAllocationDialog(true);
      return;
    }

    // 2. DRAG EXISTING ALLOCATION (Reallocation)
    const allocationId = sourceId;
    const allocation = enrichedAllocations.find(a => a.id === allocationId);

    if (!allocation || allocation.projectId === newProjectId) return;

    const oldProject = projects?.find(p => p.id === allocation.projectId);
    const newProject = projects?.find(p => p.id === newProjectId);

    try {
      // Optimistic update
      utils.allocations.list.setData(undefined, (old) => {
        if (!old) return old;
        return old.map(a =>
          a.id === allocationId
            ? { ...a, projectId: newProjectId }
            : a
        );
      });

      await reallocateMutation.mutateAsync({
        allocationId,
        newProjectId,
      });

      toast.success("Risorsa riallocata!", {
        description: `${allocation.resourceName} spostato da "${oldProject?.name}" a "${newProject?.name}"`,
      });

      refetch();
      utils.dashboard.kpis.invalidate();
      utils.dashboard.resourceUtilization.invalidate();
    } catch (error: any) {
      // Rollback on error
      utils.allocations.list.invalidate();
      toast.error("Errore durante la riallocazione", {
        description: error.message,
      });
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

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  const selectedResourceForDialog = resources?.find(r => r.id === pendingAllocation?.resourceId);

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Riallocazione Risorse</h1>
        <p className="text-muted-foreground mt-1">
          Trascina le risorse dalle disponibili alle commesse, o sposta allocazioni esistenti.
        </p>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full min-h-0">
          {/* Available Resources Sidebar */}
          <Card className="w-64 flex-shrink-0 flex flex-col bg-muted/20">
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Risorse</CardTitle>
              <CardDescription>Trascina per allocare</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-2 pb-2">
              <div className="space-y-2">
                {draggableResources.map((resource) => (
                  <DraggableItem
                    key={resource.id}
                    item={resource}
                    formatCurrency={formatCurrency}
                    isSidebar
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Projects Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-8">
              {projects && projects.map((project) => {
                const projectAllocations = enrichedAllocations.filter(
                  a => a.projectId === project.id
                );
                const totalMonthlyCost = projectAllocations.reduce(
                  (sum, a) => sum + Number(a.monthlyCost),
                  0
                );

                return (
                  <ProjectColumn
                    key={project.id}
                    project={project}
                    allocations={projectAllocations}
                    totalMonthlyCost={totalMonthlyCost}
                    formatCurrency={formatCurrency}
                    isDragActive={activeId !== null}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <DragOverlay>
          {draggedItem && (
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-card shadow-lg opacity-90 w-64">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{draggedItem.resourceName}</p>
                  {!draggedItem.isResource && (
                    <p className="text-xs text-muted-foreground">
                      {draggedItem.daysPerMonth} gg/mese • {formatCurrency(draggedItem.monthlyCost)}/mese
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Allocation Dialog (triggered by drop) */}
      {pendingAllocation && selectedResourceForDialog && (
        <AllocationDialog
          open={showAllocationDialog}
          onOpenChange={(open) => {
            setShowAllocationDialog(open);
            if (!open) setPendingAllocation(null);
          }}
          resourceId={pendingAllocation.resourceId}
          resourceName={selectedResourceForDialog.name}
          dailyCost={Number(selectedResourceForDialog.dailyCost)}
          initialProjectId={pendingAllocation.projectId}
          onSuccess={() => {
            refetch();
            utils.dashboard.invalidate();
          }}
        />
      )}
    </div>
  );
}



interface DraggableItemProps {
  item: AllocationWithDetails;
  formatCurrency: (value: string | number) => string;
  isSidebar?: boolean;
}

function DraggableItem({ item, formatCurrency, isSidebar }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 rounded-lg border bg-card cursor-move hover:bg-accent/50 transition-colors shadow-sm ${isDragging ? 'opacity-30' : ''
        }`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-7 h-7 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.resourceName}</p>
          {!isSidebar && (
            <p className="text-[10px] text-muted-foreground">
              {item.daysPerMonth}gg • {formatCurrency(item.monthlyCost)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProjectColumnProps {
  project: any;
  allocations: AllocationWithDetails[];
  totalMonthlyCost: number;
  formatCurrency: (value: string | number) => string;
  isDragActive: boolean;
}

function ProjectColumn({
  project,
  allocations,
  totalMonthlyCost,
  formatCurrency,
  isDragActive
}: ProjectColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: project.id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={`transition-all ${isDragActive ? 'ring-2 ring-primary/20' : ''} ${isOver ? 'ring-4 ring-primary bg-primary/5' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">{project.name}</CardTitle>
          <CardDescription className="text-xs">{project.client}</CardDescription>
        </div>
        <Badge variant="secondary" className="w-fit mt-2">
          {project.projectId}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total Cost */}
        <div className="flex items-center justify-between text-sm pb-3 border-b">
          <span className="text-muted-foreground">Costo mensile totale</span>
          <span className="font-semibold">{formatCurrency(totalMonthlyCost)}</span>
        </div>

        {/* Allocations */}
        <div className="space-y-2 min-h-[100px]">
          {allocations.length > 0 ? (
            allocations.map((allocation) => (
              <DraggableAllocation
                key={allocation.id}
                allocation={allocation}
                formatCurrency={formatCurrency}
              />
            ))
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nessuna risorsa allocata
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface DraggableAllocationProps {
  allocation: AllocationWithDetails;
  formatCurrency: (value: string | number) => string;
}

function DraggableAllocation({ allocation, formatCurrency }: DraggableAllocationProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: allocation.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-3 rounded-lg border bg-card cursor-move hover:bg-accent/50 transition-colors ${isDragging ? 'opacity-30' : ''
        }`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{allocation.resourceName}</p>
          <p className="text-xs text-muted-foreground">
            {allocation.daysPerMonth} gg/mese • {formatCurrency(allocation.monthlyCost)}/mese
          </p>
        </div>
      </div>
    </div>
  );
}
