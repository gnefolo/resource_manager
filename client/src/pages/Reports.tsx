import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { Download, Filter } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Reports() {
    const { data: kpis, isLoading: kpisLoading } = trpc.dashboard.kpis.useQuery();
    const { data: utilization, isLoading: utilizationLoading } = trpc.dashboard.resourceUtilization.useQuery();

    const [filterProject, setFilterProject] = useState<string>("all");

    if (kpisLoading || utilizationLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Caricamento report...</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleExportCSV = () => {
        // Generate CSV content depending on the active view or both
        // For simplicity, let's export Projects data
        const projects = kpis?.projects || [];

        const headers = ["Project ID", "Nome", "Cliente", "Valore", "Margine", "% Margine", "Budget Residuo", "Avanzamento"];
        const rows = projects.map(p => [
            p.projectId,
            `"${p.name}"`,
            `"${p.client}"`,
            p.projectValue,
            p.margin,
            p.marginPercentage.toFixed(2),
            p.budgetResidual,
            (p.progress * 100).toFixed(1)
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "report_commesse.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter Data
    const filteredProjects = filterProject === "all"
        ? kpis?.projects
        : kpis?.projects?.filter(p => p.id.toString() === filterProject);

    const marginData = filteredProjects?.map(p => ({
        name: p.name,
        Valore: p.projectValue,
        Margine: p.margin,
        Costo: p.projectValue - p.margin
    }));

    const utilizationData = utilization?.map(u => ({
        name: u.resourceName,
        allocato: u.utilizationPercentage,
        reale: u.actualUtilizationPercentage || 0
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reportistica</h1>
                    <p className="text-muted-foreground mt-1">
                        Analisi avanzata e dati di performance
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filterProject} onValueChange={setFilterProject}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filtra per Progetto" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tutti i progetti</SelectItem>
                            {kpis?.projects?.map(p => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Esporta CSV
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="margins" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="margins">Analisi Marginalità</TabsTrigger>
                    <TabsTrigger value="utilization">Utilizzo Risorse</TabsTrigger>
                </TabsList>

                <TabsContent value="margins" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                        {/* Planned vs Actual Cost */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Pianificato vs Reale</CardTitle>
                                <CardDescription>Confronto tra valore commessa (Budget) e costo effettivo risorse (Consuntivo)</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filteredProjects}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={(val) => `€${val}`} />
                                        <Tooltip
                                            formatter={(value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)}
                                        />
                                        <Legend />
                                        <Bar dataKey="projectValue" name="Budget Commessa" fill="#3b82f6" />
                                        <Bar dataKey="actualCost" name="Costo Reale (Consuntivo)" fill="#e11d48" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Marginalità per Commessa</CardTitle>
                                <CardDescription>
                                    Analisi della marginalità prevista (%)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filteredProjects} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" unit="%" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="marginPercentage" name="Margine %" fill="#22c55e" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Dettaglio Marginalità</CardTitle>
                                <CardDescription>Confronto tra valore totale, costi e margine</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={marginData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Legend />
                                        <Bar dataKey="Valore" fill="#8884d8" />
                                        <Bar dataKey="Costo" fill="#ff8042" />
                                        <Bar dataKey="Margine" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="utilization" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Saturazione Risorse</CardTitle>
                            <CardDescription>Confronto Allocato (Pianificato) vs Reale (Consuntivo)</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={utilizationData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis dataKey="name" type="category" width={150} />
                                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                                    <Legend />
                                    <Bar dataKey="allocato" name="Allocato %" fill="#2563eb" barSize={15} />
                                    <Bar dataKey="reale" name="Reale % (Consuntivo)" fill="#16a34a" barSize={15}>
                                        {utilizationData?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.reale > 100 ? '#dc2626' : '#16a34a'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
