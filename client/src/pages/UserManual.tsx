import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function UserManual() {
    return (
        <div className="container mx-auto py-6 space-y-8 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manuale Utente</h1>
                <p className="text-muted-foreground mt-2">
                    Guida completa all'utilizzo della piattaforma Resource Manager.
                </p>
            </div>

            <Tabs defaultValue="auth" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="auth">Accesso</TabsTrigger>
                    <TabsTrigger value="profile">Profilo</TabsTrigger>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="features">Funzionalità</TabsTrigger>
                </TabsList>

                <TabsContent value="auth" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Autenticazione e Registrazione</CardTitle>
                            <CardDescription>Come accedere e creare un nuovo account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6 items-start">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Registrazione</h3>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                        <li>Vai alla scheda <strong>Registrati</strong> nella pagina di login.</li>
                                        <li>Inserisci il tuo <strong>Nome Completo</strong>.</li>
                                        <li>Inserisci una <strong>Email</strong> valida.</li>
                                        <li>Scegli una <strong>Password</strong> sicura (min. 6 caratteri).</li>
                                        <li>Clicca su <strong>Crea Account</strong>.</li>
                                    </ol>
                                    <p className="text-sm">
                                        Verrai reindirizzato automaticamente alla Dashboard dopo la registrazione.
                                    </p>

                                    <h3 className="text-lg font-semibold pt-4">Login</h3>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                        <li>Inserisci la tua email e password nella scheda <strong>Accedi</strong>.</li>
                                        <li>Puoi anche utilizzare Google o Apple per accedere velocemente.</li>
                                    </ol>
                                </div>
                                <div className="border rounded-lg overflow-hidden shadow-sm">
                                    <img
                                        src="/manual_screenshots/manual_auth_1767383124262.png"
                                        alt="Schermata di Login"
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="profile" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestione Profilo</CardTitle>
                            <CardDescription>Modifica le tue informazioni personali e la password.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6 items-start">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Visualizzazione e Modifica</h3>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                        <li>Clicca sul tuo <strong>avatar</strong> in basso a sinistra e seleziona <strong>Profilo</strong>.</li>
                                        <li>Qui puoi vedere il riepilogo delle tue attività.</li>
                                        <li>Clicca su <strong>Modifica Profilo</strong> per cambiare:
                                            <ul className="pl-6 list-disc mt-1">
                                                <li>Nome e Qualifica</li>
                                                <li>Foto Profilo (tramite URL)</li>
                                                <li>Password (richiede la password attuale)</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                                <div className="border rounded-lg overflow-hidden shadow-sm">
                                    <img
                                        src="/manual_screenshots/manual_profile_1767383021679.png"
                                        alt="Schermata Profilo"
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="dashboard" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>La Dashboard</CardTitle>
                            <CardDescription>Panoramica delle attività e KPI principali.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <p className="text-sm text-muted-foreground">
                                    La Dashboard offre una visione immediata dello stato dei progetti e delle risorse.
                                    Monitora le ore allocate vs reali e lo stato di avanzamento delle commesse.
                                </p>
                                <div className="border rounded-lg overflow-hidden shadow-sm">
                                    <img
                                        src="/manual_screenshots/manual_dashboard_1767382878614.png"
                                        alt="Schermata Dashboard"
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="features" className="space-y-4 mt-6">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Commesse (Projects)</CardTitle>
                                <CardDescription>Gestione completa dei progetti.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6 items-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Visualizza la lista delle commesse attive, il budget residuo, i margini e l'avanzamento.
                                            Puoi filtrare per cliente o stato.
                                        </p>
                                    </div>
                                    <div className="border rounded-lg overflow-hidden shadow-sm">
                                        <img
                                            src="/manual_screenshots/manual_projects_1767382902547.png"
                                            alt="Schermata Commesse"
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Risorse e Allocazione</CardTitle>
                                <CardDescription>Gestione del team e pianificazione.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6 items-center">
                                    <div className="border rounded-lg overflow-hidden shadow-sm order-2 md:order-1">
                                        <img
                                            src="/manual_screenshots/manual_resources_1767382928781.png"
                                            alt="Schermata Risorse"
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                    <div className="order-1 md:order-2">
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Monitora il carico di lavoro di ogni risorsa.
                                            Le barre colorate indicano l'utilizzo pianificato (blu) e quello reale (verde/rosso).
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Reportistica</CardTitle>
                                <CardDescription>Analisi dettagliate e grafici.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6 items-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Grafici avanzati per confrontare Ore Allocate vs Reali e analizzare i margini di profitto per progetto.
                                        </p>
                                    </div>
                                    <div className="border rounded-lg overflow-hidden shadow-sm">
                                        <img
                                            src="/manual_screenshots/manual_reports_1767382956664.png"
                                            alt="Schermata Reportistica"
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
