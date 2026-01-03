import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Resources from "./pages/Resources";
import TimeTracking from "./pages/TimeTracking";
import Alerts from "./pages/Alerts";
import ResourceAllocation from "./pages/ResourceAllocation";
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import UserManual from "./pages/UserManual";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Auth} />
      <Route path="/dashboard">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path="/projects">
        <DashboardLayout>
          <Projects />
        </DashboardLayout>
      </Route>
      <Route path="/resources">
        <DashboardLayout>
          <Resources />
        </DashboardLayout>
      </Route>
      <Route path="/time-tracking">
        <DashboardLayout>
          <TimeTracking />
        </DashboardLayout>
      </Route>
      <Route path="/alerts">
        <DashboardLayout>
          <Alerts />
        </DashboardLayout>
      </Route>
      <Route path="/resource-allocation">
        <DashboardLayout>
          <ResourceAllocation />
        </DashboardLayout>
      </Route>
      <Route path="/calendar">
        <DashboardLayout>
          <Calendar />
        </DashboardLayout>
      </Route>
      <Route path="/reports">
        <DashboardLayout>
          <Reports />
        </DashboardLayout>
      </Route>
      <Route path="/profile">
        <DashboardLayout>
          <Profile />
        </DashboardLayout>
      </Route>
      <Route path="/user-manual">
        <DashboardLayout>
          <UserManual />
        </DashboardLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
