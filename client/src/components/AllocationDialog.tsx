
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AllocationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resourceId: number;
    resourceName: string;
    dailyCost: number;
    onSuccess?: () => void;
    // Optional pre-selected project
    initialProjectId?: number;
}

export function AllocationDialog({
    open,
    onOpenChange,
    resourceId,
    resourceName,
    dailyCost,
    onSuccess,
    initialProjectId
}: AllocationDialogProps) {
    const [projectId, setProjectId] = useState<string>(initialProjectId?.toString() || "");
    const [daysPerMonth, setDaysPerMonth] = useState<string>("20");
    const [hoursPerMonth, setHoursPerMonth] = useState<string>("160");
    const [monthlyCost, setMonthlyCost] = useState<string>((dailyCost * 20).toString());

    const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
    const createAllocation = trpc.allocations.create.useMutation();
    const utils = trpc.useUtils();

    useEffect(() => {
        if (open) {
            if (initialProjectId) {
                setProjectId(initialProjectId.toString());
            }
            // Reset defaults or recalculate if dailyCost changes
            setMonthlyCost((dailyCost * Number(daysPerMonth || 0)).toString());
        }
    }, [open, dailyCost, initialProjectId]);

    const handleDaysChange = (value: string) => {
        setDaysPerMonth(value);
        const days = Number(value);
        if (!isNaN(days)) {
            setHoursPerMonth((days * 8).toString());
            setMonthlyCost((days * dailyCost).toString());
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) {
            toast.error("Seleziona una commessa");
            return;
        }

        try {
            await createAllocation.mutateAsync({
                projectId: Number(projectId),
                resourceId,
                daysPerMonth: Number(daysPerMonth),
                hoursPerMonth: Number(hoursPerMonth),
                monthlyCost: monthlyCost,
            });

            toast.success("Risorsa allocata correttamente");
            utils.allocations.list.invalidate();
            utils.dashboard.invalidate(); // Update KPIs
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Errore durante l'allocazione", {
                description: error.message
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Alloca Risorsa</DialogTitle>
                    <DialogDescription>
                        Alloca <strong>{resourceName}</strong> a una commessa.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">

                    <div className="grid gap-2">
                        <Label htmlFor="project">Commessa</Label>
                        <Select
                            value={projectId}
                            onValueChange={setProjectId}
                            disabled={!!initialProjectId} // Disable if pre-selected (e.g. dropped on a project)
                        >
                            <SelectTrigger id="project">
                                <SelectValue placeholder="Seleziona commessa" />
                            </SelectTrigger>
                            <SelectContent>
                                {projectsLoading ? (
                                    <div className="flex items-center justify-center p-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    projects?.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.name} ({p.projectId})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="days">Giorni/Mese</Label>
                            <Input
                                id="days"
                                type="number"
                                value={daysPerMonth}
                                onChange={(e) => handleDaysChange(e.target.value)}
                                min="0"
                                max="31"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="hours">Ore/Mese</Label>
                            <Input
                                id="hours"
                                type="number"
                                value={hoursPerMonth}
                                onChange={(e) => setHoursPerMonth(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="cost">Costo Mensile (€)</Label>
                        <Input
                            id="cost"
                            type="number"
                            value={monthlyCost}
                            onChange={(e) => setMonthlyCost(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Calcolato: {dailyCost}€/gg × {daysPerMonth} gg
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annulla
                        </Button>
                        <Button type="submit" disabled={createAllocation.isPending}>
                            {createAllocation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Alloca
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
