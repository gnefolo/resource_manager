import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Calendar as CalendarIcon, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function TimeTracking() {
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: resources } = trpc.resources.list.useQuery();
  const { data: timeEntries, refetch } = trpc.timeEntries.list.useQuery();
  const createMutation = trpc.timeEntries.create.useMutation();
  const deleteMutation = trpc.timeEntries.delete.useMutation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    projectId: "",
    resourceId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    hours: "",
    description: "",
  });

  const handleCreate = async () => {
    if (!formData.projectId || !formData.resourceId || !formData.hours) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    try {
      await createMutation.mutateAsync({
        projectId: Number(formData.projectId),
        resourceId: Number(formData.resourceId),
        date: new Date(formData.date),
        hours: Number(formData.hours),
        description: formData.description || undefined,
      });
      
      toast.success("Ore registrate con successo!");
      refetch();
      setShowCreateDialog(false);
      setFormData({
        projectId: "",
        resourceId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        hours: "",
        description: "",
      });
    } catch (error: any) {
      toast.error("Errore durante la registrazione", {
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questa registrazione?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Registrazione eliminata");
      refetch();
    } catch (error: any) {
      toast.error("Errore durante l'eliminazione", {
        description: error.message,
      });
    }
  };

  const getProjectName = (projectId: number) => {
    return projects?.find(p => p.id === projectId)?.name || "N/A";
  };

  const getResourceName = (resourceId: number) => {
    return resources?.find(r => r.id === resourceId)?.name || "N/A";
  };

  // Group time entries by project
  type TimeEntry = NonNullable<typeof timeEntries>[number];
  const entriesByProject = timeEntries?.reduce((acc: Record<number, TimeEntry[]>, entry: TimeEntry) => {
    const projectId = entry.projectId;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(entry);
    return acc;
  }, {} as Record<number, TimeEntry[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tracking Ore</h1>
          <p className="text-muted-foreground mt-1">
            Monitora le ore effettive vs pianificate per ogni commessa
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registra Ore
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Sistema di Tracking Attivo</p>
              <p className="text-sm text-muted-foreground mt-1">
                Registra le ore lavorate quotidianamente per ogni commessa. 
                Il sistema calcolerà automaticamente gli scostamenti rispetto alle ore pianificate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries by Project */}
      {entriesByProject && Object.keys(entriesByProject).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(entriesByProject).map(([projectId, entries]) => {
            const project = projects?.find(p => p.id === Number(projectId));
            const totalHours = (entries as TimeEntry[]).reduce((sum: number, entry: TimeEntry) => sum + Number(entry.hours), 0);

            return (
              <Card key={projectId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{project?.name || "Progetto sconosciuto"}</CardTitle>
                      <CardDescription>{project?.client}</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {totalHours}h totali
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(entries as TimeEntry[]).map((entry: TimeEntry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Data</p>
                            <p className="font-medium flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {format(new Date(entry.date), "dd MMM yyyy", { locale: it })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Risorsa</p>
                            <p className="font-medium">{getResourceName(entry.resourceId)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Ore</p>
                            <p className="font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {entry.hours}h
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Descrizione</p>
                            <p className="font-medium text-sm truncate">
                              {entry.description || "-"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna registrazione trovata</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Inizia a registrare le ore lavorate per tracciare l'avanzamento delle commesse
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registra Prime Ore
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra Ore</DialogTitle>
            <DialogDescription>
              Registra le ore lavorate per una commessa
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project">Commessa *</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona commessa" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name} - {project.client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource">Risorsa *</Label>
              <Select
                value={formData.resourceId}
                onValueChange={(value) => setFormData({ ...formData, resourceId: value })}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Ore Lavorate *</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="es. 8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="es. Sviluppo feature X"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Registrazione..." : "Registra Ore"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
