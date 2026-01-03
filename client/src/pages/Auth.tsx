import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Auth() {
    const [location, setLocation] = useLocation();
    const loginMutation = trpc.auth.login.useMutation();
    const registerMutation = trpc.auth.register.useMutation();
    const { user, loading } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    if (!loading && user) {
        window.location.href = "/dashboard";
        return null;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await loginMutation.mutateAsync({
                email: formData.email,
                password: formData.password,
            });
            toast.success("Login effettuato");
            window.location.href = "/dashboard";
        } catch (error: any) {
            toast.error("Errore di login", { description: error.message });
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await registerMutation.mutateAsync(formData);
            toast.success("Registrazione completata", { description: "Benvenuto!" });
            window.location.href = "/dashboard";
        } catch (error: any) {
            toast.error("Errore di registrazione", { description: error.message });
        }
    };

    const handleSocialLogin = () => {
        window.location.href = getLoginUrl();
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <img src="/logo1.svg" alt="Resource Manager" className="h-12 w-auto" />
                    </div>
                    <CardTitle>Benvenuto</CardTitle>
                    <CardDescription>Accedi o crea un account per continuare</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Accedi</TabsTrigger>
                            <TabsTrigger value="register">Registrati</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">Email</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Password</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                                    {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="register-name">Nome Completo</Label>
                                    <Input
                                        id="register-name"
                                        placeholder="Mario Rossi"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-email">Email</Label>
                                    <Input
                                        id="register-email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-password">Password</Label>
                                    <Input
                                        id="register-password"
                                        type="password"
                                        minLength={6}
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                                    {registerMutation.isPending ? "Registrazione..." : "Crea Account"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={handleSocialLogin}>
                        Sign in with Google / Apple
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-center text-xs text-muted-foreground">
                    Resource Manager v1.0
                </CardFooter>
            </Card>
        </div>
    );
}
