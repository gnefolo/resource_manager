import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Shield, Calendar, Clock, Lock, Briefcase, Camera } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
    const { data: user, isLoading, refetch } = trpc.auth.me.useQuery();
    const updateProfileMutation = trpc.auth.updateProfile.useMutation();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        jobTitle: "",
        avatarUrl: "",
        currentPassword: "",
        newPassword: "",
    });

    const handleOpenDialog = () => {
        if (user) {
            setFormData({
                name: user.name || "",
                jobTitle: user.jobTitle || "",
                avatarUrl: user.avatarUrl || "",
                currentPassword: "",
                newPassword: "",
            });
            setIsDialogOpen(true);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfileMutation.mutateAsync({
                name: formData.name,
                jobTitle: formData.jobTitle,
                avatarUrl: formData.avatarUrl,
                currentPassword: formData.newPassword ? formData.currentPassword : undefined,
                newPassword: formData.newPassword || undefined,
            });
            toast.success("Profilo aggiornato con successo");
            setIsDialogOpen(false);
            refetch();
        } catch (error: any) {
            toast.error("Errore durante l'aggiornamento", { description: error.message });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Caricamento profilo...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Utente non trovato</h2>
                <p className="text-muted-foreground">Effettua il login per visualizzare il profilo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Il mio profilo</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci le tue informazioni personali e impostazioni
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenDialog}>Modifica Profilo</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Modifica Profilo</DialogTitle>
                            <DialogDescription>
                                Aggiorna le tue informazioni qui. Clicca su salva quando hai finito.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Nome
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="jobTitle" className="text-right">
                                    Qualifica
                                </Label>
                                <Input
                                    id="jobTitle"
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Es. Senior Developer"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="avatarUrl" className="text-right">
                                    Foto URL
                                </Label>
                                <Input
                                    id="avatarUrl"
                                    value={formData.avatarUrl}
                                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                    className="col-span-3"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Sicurezza</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="newPassword" className="text-right">
                                    Nuova Password
                                </Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className="col-span-3"
                                    placeholder="(Lascia vuoto per non cambiare)"
                                />
                            </div>
                            {formData.newPassword && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="currentPassword" className="text-right">
                                        Password Attuale
                                    </Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="submit" disabled={updateProfileMutation.isPending}>
                                    {updateProfileMutation.isPending ? "Salvataggio..." : "Salva modifiche"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Profile Card */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Utente</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center text-center space-y-4">
                        <Avatar className="h-32 w-32 border-4 border-muted">
                            <AvatarImage src={user.avatarUrl || ""} />
                            <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                {user.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-semibold">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.jobTitle && (
                                <p className="text-sm font-medium text-primary">{user.jobTitle}</p>
                            )}
                        </div>
                        <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="mt-2">
                            {user.role === 'admin' ? 'Amministratore' : 'Utente Standard'}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Details Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Dettagli Account</CardTitle>
                        <CardDescription>Informazioni dettagliate sul tuo account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    Nome Completo
                                </div>
                                <div className="font-medium">{user.name}</div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </div>
                                <div className="font-medium">{user.email}</div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Briefcase className="h-4 w-4" />
                                    Qualifica
                                </div>
                                <div className="font-medium">{user.jobTitle || "-"}</div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Shield className="h-4 w-4" />
                                    Ruolo
                                </div>
                                <div className="font-medium capitalize">{user.role}</div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    Membro dal
                                </div>
                                <div className="font-medium">
                                    {user.createdAt ? format(new Date(user.createdAt), "d MMMM yyyy", { locale: it }) : "-"}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    Ultimo accesso
                                </div>
                                <div className="font-medium">
                                    {user.lastSignedIn ? format(new Date(user.lastSignedIn), "d MMMM yyyy, HH:mm", { locale: it }) : "-"}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Lock className="h-4 w-4" />
                                    Metodo Login
                                </div>
                                <div className="font-medium capitalize">
                                    {user.loginMethod || "Sconosciuto"}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
