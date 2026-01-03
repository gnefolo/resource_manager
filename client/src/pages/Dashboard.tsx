import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Archive
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = trpc.dashboard.kpis.useQuery();
  const { data: utilization, isLoading: utilizationLoading } = trpc.dashboard.resourceUtilization.useQuery();
  const { data: alerts } = trpc.alerts.unread.useQuery();

  if (kpisLoading || utilizationLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento dashboard...</p>
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Panoramica generale delle commesse e delle risorse
        </p>
      </div>

      {/* Alert Banner */}
      {alerts && alerts.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-base">Alert Attivi</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="text-sm">
                  <Badge variant={alert.severity === "high" ? "destructive" : "secondary"} className="mr-2">
                    {alert.severity}
                  </Badge>
                  {alert.message}
                </div>
              ))}
            </div>
            <Link href="/alerts">
              <Button variant="link" className="mt-2 p-0 h-auto text-destructive">
                Vedi tutti gli alert <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commesse Attive</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Progetti in gestione
            </p>
          </CardContent>
        </Card>

        {/* Completed Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commesse Concluse</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalCompletedProjects || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Progetti terminati
            </p>
          </CardContent>
        </Card>

        {/* Total Allocated Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ore Allocate</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalAllocatedHours || 0}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pianificate a calendario
            </p>
          </CardContent>
        </Card>

        {/* Total Actual Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ore Effettive</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalActualHours || 0}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Consuntivate totali
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valore Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis?.totalProjectValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valore commesse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margine Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis?.totalMargin || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margine previsto
            </p>
          </CardContent>
        </Card>

        {/* Real Margin KPI */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margine Reale</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(kpis?.totalRealMargin || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(kpis?.totalRealMargin || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Basato su ore lavorate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risorse Attive</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalResources || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Membri del team
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Commesse in Corso</CardTitle>
          <CardDescription>
            Stato di avanzamento e marginalità delle commesse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {kpis?.projects && kpis.projects.length > 0 ? (
              kpis.projects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {project.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {project.client} • {project.projectId}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">
                        {formatCurrency(project.budgetResidual)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Budget residuo
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Avanzamento</span>
                      <span className="font-medium">{formatPercentage(project.progress)}</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Marginalità: </span>
                      <span className="font-medium text-green-600">
                        {formatPercentage(project.marginPercentage)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mesi residui: </span>
                      <span className="font-medium">{project.monthsRemaining}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Spesa max mensile: </span>
                      <span className="font-medium">{formatCurrency(project.maxMonthlySpend)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nessuna commessa trovata</p>
                <Link href="/projects">
                  <Button variant="link" className="mt-2">
                    Importa commesse da Excel
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resource Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Utilizzo Risorse</CardTitle>
          <CardDescription>
            Allocazione e saturazione delle risorse del team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {utilization && utilization.length > 0 ? (
              utilization.map((resource) => (
                <div key={resource.resourceId} className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{resource.resourceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {resource.projectCount} {resource.projectCount === 1 ? "commessa" : "commesse"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Allocato: <span className="font-medium text-foreground">{formatPercentage(resource.utilizationPercentage)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reale: <span className={`font-medium ${(resource.actualUtilizationPercentage || 0) > 100 ? "text-red-500" : "text-green-600"}`}>{formatPercentage(resource.actualUtilizationPercentage || 0)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {/* Planned */}
                    <Progress
                      value={Math.min(resource.utilizationPercentage, 100)}
                      className="h-1.5"
                    />
                    {/* Actual */}
                    <Progress
                      value={Math.min(resource.actualUtilizationPercentage || 0, 100)}
                      className="h-1.5 bg-green-100"
                      indicatorClassName={(resource.actualUtilizationPercentage || 0) > 100 ? "bg-red-500" : "bg-green-600"}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nessuna risorsa allocata</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
