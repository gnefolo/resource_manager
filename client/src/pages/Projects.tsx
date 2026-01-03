import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function Projects() {
  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const importMutation = trpc.projects.importFromExcel.useMutation();
  const deleteMutation = trpc.projects.delete.useMutation();
  const createMutation = trpc.projects.create.useMutation();
  const updateMutation = trpc.projects.update.useMutation();

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    projectId: "",
    name: "",
    client: "",
    projectValue: "",
    margin: "",
    budgetResidual: "",
    monthsRemaining: 0,
    maxMonthlySpend: "",
    progress: "0",
  });

  const handleImportExcel = async () => {
    try {
      // Load the pre-parsed Excel data
      const response = await fetch("/projects_data.json");
      const data = await response.json();

      // Transform data for import
      const projectsToImport = Object.values(data).map((p: any) => ({
        projectId: p.project_id,
        name: p.name,
        client: p.client,
        projectValue: p.project_value,
        margin: p.margin,
        budgetResidual: p.budget_residual,
        monthsRemaining: p.months_remaining,
        maxMonthlySpend: p.max_monthly_spend,
        progress: p.progress || 0,
        resources: p.resources.map((r: any) => ({
          name: r.name,
          dailyCost: r.daily_cost,
          daysPerMonth: r.days_per_month,
          hoursPerMonth: r.hours_per_month,
          monthlyCost: r.monthly_cost,
        })),
      }));

      await importMutation.mutateAsync({ projects: projectsToImport });

      toast.success("Dati importati con successo!", {
        description: `${projectsToImport.length} commesse e relative risorse importate`,
      });

      refetch();
      setShowImportDialog(false);
    } catch (error: any) {
      toast.error("Errore durante l'importazione", {
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Sei sicuro di voler eliminare la commessa "${name}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Commessa eliminata");
      refetch();
    } catch (error: any) {
      toast.error("Errore durante l'eliminazione", {
        description: error.message,
      });
    }
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        ...formData,
        monthsRemaining: Number(formData.monthsRemaining),
      });

      toast.success("Commessa creata con successo!");
      refetch();
      setShowCreateDialog(false);
      setFormData({
        projectId: "",
        name: "",
        client: "",
        projectValue: "",
        margin: "",
        budgetResidual: "",
        monthsRemaining: 0,
        maxMonthlySpend: "",
        progress: "0",
      });
    } catch (error: any) {
      toast.error("Errore durante la creazione", {
        description: error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedProject) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedProject.id,
        ...formData,
        monthsRemaining: Number(formData.monthsRemaining),
      });

      toast.success("Commessa aggiornata con successo!");
      refetch();
      setShowEditDialog(false);
      setSelectedProject(null);
    } catch (error: any) {
      toast.error("Errore durante l'aggiornamento", {
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

  const formatPercentage = (value: string | number) => {
    return `${Number(value).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commesse</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci le commesse aziendali e monitora l'avanzamento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importa da Excel
          </Button>
          <Button onClick={() => {
            setFormData({
              projectId: "",
              name: "",
              client: "",
              projectValue: "",
              margin: "",
              budgetResidual: "",
              monthsRemaining: 0,
              maxMonthlySpend: "",
              progress: "0",
            });
            setShowCreateDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuova Commessa
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
      ) : projects && projects.length > 0 ? (
        <div className="grid gap-4">
          {projects.map((project) => {
            const projectValue = Number(project.projectValue);
            const margin = Number(project.margin);
            const progressValue = Number(project.progress || 0);
            const marginPercentage = projectValue > 0 ? (margin / projectValue) * 100 : 0;

            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <CardDescription>{project.client}</CardDescription>
                      <Badge variant="outline" className="mt-2">
                        {project.projectId}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedProject(project);
                          setFormData({
                            projectId: project.projectId,
                            name: project.name,
                            client: project.client,
                            projectValue: project.projectValue,
                            margin: project.margin,
                            budgetResidual: project.budgetResidual,
                            monthsRemaining: project.monthsRemaining,
                            maxMonthlySpend: project.maxMonthlySpend,
                            progress: project.progress || "0",
                          });
                          setShowEditDialog(true);
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(project.id, project.name)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avanzamento</span>
                      <span className="font-medium">{formatPercentage(progressValue)}</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <DollarSign className="h-3 w-3" />
                        Valore Progetto
                      </div>
                      <div className="text-lg font-semibold">{formatCurrency(project.projectValue)}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <TrendingUp className="h-3 w-3" />
                        Margine
                      </div>
                      <div className={`text-lg font-semibold ${marginPercentage >= 30 ? "text-green-600" : marginPercentage >= 20 ? "text-yellow-600" : "text-red-600"}`}>
                        {formatCurrency(project.margin)} ({formatPercentage(marginPercentage)})
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <DollarSign className="h-3 w-3" />
                        Budget Residuo
                      </div>
                      <div className="text-lg font-semibold">{formatCurrency(project.budgetResidual)}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Calendar className="h-3 w-3" />
                        Mesi Residui
                      </div>
                      <div className="text-lg font-semibold">{project.monthsRemaining}</div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Spesa mensile massima</span>
                    <span className="text-sm font-medium">{formatCurrency(project.maxMonthlySpend)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center text-muted-foreground">
              <p>Nessuna commessa trovata</p>
              <p className="text-sm mt-2">Importa i dati da Excel o crea una nuova commessa</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importa da Excel</DialogTitle>
            <DialogDescription>
              Importa le commesse e le risorse dal file Excel caricato
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Questa operazione importerà tutte le commesse e le relative risorse dal file Excel.
              I dati esistenti non verranno sovrascritti.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Annulla
              </Button>
              <Button onClick={handleImportExcel} disabled={importMutation.isPending}>
                {importMutation.isPending ? "Importazione..." : "Importa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuova Commessa</DialogTitle>
            <DialogDescription>
              Crea una nuova commessa inserendo tutti i dettagli
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Codice Progetto</Label>
                <Input
                  id="projectId"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  placeholder="es. PROJ001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome Commessa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Progetto Alpha"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                placeholder="es. Acme Corporation"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectValue">Valore Progetto (€)</Label>
                <Input
                  id="projectValue"
                  type="number"
                  value={formData.projectValue}
                  onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })}
                  placeholder="es. 100000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="margin">Margine (€)</Label>
                <Input
                  id="margin"
                  type="number"
                  value={formData.margin}
                  onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                  placeholder="es. 30000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetResidual">Budget Residuo (€)</Label>
                <Input
                  id="budgetResidual"
                  type="number"
                  value={formData.budgetResidual}
                  onChange={(e) => setFormData({ ...formData, budgetResidual: e.target.value })}
                  placeholder="es. 50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthsRemaining">Mesi Residui</Label>
                <Input
                  id="monthsRemaining"
                  type="number"
                  value={formData.monthsRemaining}
                  onChange={(e) => setFormData({ ...formData, monthsRemaining: Number(e.target.value) })}
                  placeholder="es. 6"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxMonthlySpend">Spesa Mensile Massima (€)</Label>
                <Input
                  id="maxMonthlySpend"
                  type="number"
                  value={formData.maxMonthlySpend}
                  onChange={(e) => setFormData({ ...formData, maxMonthlySpend: e.target.value })}
                  placeholder="es. 8000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">Avanzamento (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                  placeholder="es. 25"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creazione..." : "Crea Commessa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Commessa</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della commessa
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-projectId">Codice Progetto</Label>
                <Input
                  id="edit-projectId"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Commessa</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-client">Cliente</Label>
              <Input
                id="edit-client"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-projectValue">Valore Progetto (€)</Label>
                <Input
                  id="edit-projectValue"
                  type="number"
                  value={formData.projectValue}
                  onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-margin">Margine (€)</Label>
                <Input
                  id="edit-margin"
                  type="number"
                  value={formData.margin}
                  onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-budgetResidual">Budget Residuo (€)</Label>
                <Input
                  id="edit-budgetResidual"
                  type="number"
                  value={formData.budgetResidual}
                  onChange={(e) => setFormData({ ...formData, budgetResidual: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-monthsRemaining">Mesi Residui</Label>
                <Input
                  id="edit-monthsRemaining"
                  type="number"
                  value={formData.monthsRemaining}
                  onChange={(e) => setFormData({ ...formData, monthsRemaining: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-maxMonthlySpend">Spesa Mensile Massima (€)</Label>
                <Input
                  id="edit-maxMonthlySpend"
                  type="number"
                  value={formData.maxMonthlySpend}
                  onChange={(e) => setFormData({ ...formData, maxMonthlySpend: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-progress">Avanzamento (%)</Label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
