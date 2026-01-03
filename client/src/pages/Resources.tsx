import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  User,
  DollarSign,
  Briefcase
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

import { AllocationDialog } from "@/components/AllocationDialog";

export default function Resources() {
  const { data: resources, isLoading, refetch } = trpc.resources.list.useQuery();
  const { data: utilization } = trpc.dashboard.resourceUtilization.useQuery();
  const deleteMutation = trpc.resources.delete.useMutation();
  const createMutation = trpc.resources.create.useMutation();
  const updateMutation = trpc.resources.update.useMutation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [resourceToAllocate, setResourceToAllocate] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    dailyCost: "",
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questa risorsa?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Risorsa eliminata");
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
        dailyCost: formData.dailyCost,
      });

      toast.success("Risorsa creata con successo!");
      refetch();
      setShowCreateDialog(false);
      setFormData({
        name: "",
        role: "",
        email: "",
        dailyCost: "",
      });
    } catch (error: any) {
      toast.error("Errore durante la creazione", {
        description: error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedResource) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedResource.id,
        ...formData,
        dailyCost: formData.dailyCost,
      });

      toast.success("Risorsa aggiornata con successo!");
      refetch();
      setShowEditDialog(false);
      setSelectedResource(null);
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  const getUtilizationForResource = (resourceId: number) => {
    return utilization?.find(u => u.resourceId === resourceId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento risorse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risorse</h1>
          <p className="text-muted-foreground mt-1">
            Gestisci il team e monitora l'allocazione delle risorse
          </p>
        </div>
        <Button onClick={() => {
          setFormData({
            name: "",
            role: "",
            email: "",
            dailyCost: "",
          });
          setShowCreateDialog(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Risorsa
        </Button>
      </div>

      {/* Resources Grid */}
      {resources && resources.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => {
            const resourceUtil = getUtilizationForResource(resource.id);
            const utilizationPercent = resourceUtil?.utilizationPercentage || 0;

            return (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {resource.name}
                      </CardTitle>
                      {resource.role && (
                        <CardDescription className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {resource.role}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setResourceToAllocate(resource);
                          setShowAllocationDialog(true);
                        }}>
                          <Plus className="mr-2 h-4 w-4" />
                          Alloca
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedResource(resource);
                          setFormData({
                            name: resource.name,
                            role: resource.role || "",
                            email: resource.email || "",
                            dailyCost: resource.dailyCost,
                          });
                          setShowEditDialog(true);
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(resource.id)}
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
                  {/* Cost Info */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Costo giornaliero
                    </div>
                    <div className="text-lg font-semibold">{formatCurrency(resource.dailyCost)}</div>
                  </div>

                  {/* Utilization */}
                  {resourceUtil && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-muted-foreground">Allocato</div>
                        <div className="font-medium">{utilizationPercent.toFixed(1)}%</div>
                      </div>
                      <Progress value={utilizationPercent} className="h-1.5" />

                      <div className="flex items-center justify-between text-sm">
                        <div className="text-muted-foreground">Reale</div>
                        <div className={`font-medium ${(resourceUtil.actualUtilizationPercentage || 0) > 100 ? "text-red-500" : "text-green-600"}`}>
                          {(resourceUtil.actualUtilizationPercentage || 0).toFixed(1)}%
                        </div>
                      </div>
                      <Progress
                        value={resourceUtil.actualUtilizationPercentage || 0}
                        className="h-1.5 bg-green-100"
                        indicatorClassName={(resourceUtil.actualUtilizationPercentage || 0) > 100 ? "bg-red-500" : "bg-green-600"}
                      />

                      <div className="grid grid-cols-2 gap-2 pt-2 text-sm border-t border-border mt-3">
                        <div>
                          <div className="text-muted-foreground">Commesse</div>
                          <div className="font-medium">{resourceUtil.projectCount}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Ore Reali</div>
                          <div className="font-medium">{resourceUtil.totalActualHours.toFixed(0)}h</div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <div className="text-muted-foreground text-sm">Costo mensile stimato</div>
                        <div className="text-lg font-semibold">{formatCurrency(resourceUtil.totalMonthlyCost)}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center text-muted-foreground space-y-4">
              <User className="h-16 w-16 mx-auto opacity-50" />
              <div>
                <p className="text-lg font-medium">Nessuna risorsa trovata</p>
                <p className="text-sm mt-2">
                  Aggiungi risorse al team o importa le commesse per vedere le risorse allocate
                </p>
              </div>
              <Button onClick={() => {
                setFormData({
                  name: "",
                  role: "",
                  email: "",
                  dailyCost: "",
                });
                setShowCreateDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Risorsa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocation Dialog */}
      {resourceToAllocate && (
        <AllocationDialog
          open={showAllocationDialog}
          onOpenChange={setShowAllocationDialog}
          resourceId={resourceToAllocate.id}
          resourceName={resourceToAllocate.name}
          dailyCost={Number(resourceToAllocate.dailyCost)}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Risorsa</DialogTitle>
            <DialogDescription>
              Aggiungi una nuova risorsa al team
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="es. Mario Rossi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Ruolo</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="es. Developer Senior"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="es. mario.rossi@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyCost">Costo Giornaliero (€) *</Label>
              <Input
                id="dailyCost"
                type="number"
                value={formData.dailyCost}
                onChange={(e) => setFormData({ ...formData, dailyCost: e.target.value })}
                placeholder="es. 500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creazione..." : "Crea Risorsa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Risorsa</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della risorsa
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Ruolo</Label>
              <Input
                id="edit-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dailyCost">Costo Giornaliero (€) *</Label>
              <Input
                id="edit-dailyCost"
                type="number"
                value={formData.dailyCost}
                onChange={(e) => setFormData({ ...formData, dailyCost: e.target.value })}
              />
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
