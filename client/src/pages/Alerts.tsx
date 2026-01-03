import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  AlertTriangle,
  CheckCircle,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function Alerts() {
  const { data: alerts, isLoading, refetch } = trpc.alerts.all.useQuery();
  const markAsReadMutation = trpc.alerts.markAsRead.useMutation();
  const deleteMutation = trpc.alerts.delete.useMutation();

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsReadMutation.mutateAsync({ id });
      toast.success("Alert segnato come letto");
      refetch();
    } catch (error: any) {
      toast.error("Errore", { description: error.message });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Alert eliminato");
      refetch();
    } catch (error: any) {
      toast.error("Errore", { description: error.message });
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "medium":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento alert...</p>
        </div>
      </div>
    );
  }

  const unreadAlerts = alerts?.filter(a => !a.isRead) || [];
  const readAlerts = alerts?.filter(a => a.isRead) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alert e Notifiche</h1>
        <p className="text-muted-foreground mt-1">
          Monitora gli alert di budget, scadenze e sovraccarico risorse
        </p>
      </div>

      {/* Unread Alerts */}
      {unreadAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alert Non Letti ({unreadAlerts.length})</CardTitle>
            <CardDescription>
              Richiede la tua attenzione
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {unreadAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5">
                  {getAlertIcon(alert.severity)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityVariant(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">
                          {alert.type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString("it-IT")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMarkAsRead(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Read Alerts */}
      {readAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alert Letti ({readAlerts.length})</CardTitle>
            <CardDescription>
              Storico degli alert gestiti
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {readAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-4 rounded-lg border border-border opacity-60"
              >
                <div className="mt-0.5">
                  {getAlertIcon(alert.severity)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityVariant(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">
                          {alert.type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString("it-IT")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {alerts && alerts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun Alert Attivo</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Ottimo lavoro! Non ci sono alert che richiedono la tua attenzione al momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
