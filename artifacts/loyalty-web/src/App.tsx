import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Marketplace from "@/pages/marketplace";
import ListingDetail from "@/pages/listing-detail";
import Sell from "@/pages/sell";
import Inventory from "@/pages/inventory";
import Transfer from "@/pages/transfer";
import Transactions from "@/pages/transactions";
import TransactionDetail from "@/pages/transaction-detail";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function Router() {
  const userId = typeof window !== "undefined" ? localStorage.getItem("pointhive.userId") : null;

  if (!userId && window.location.pathname !== "/login") {
    // Default to admin user for demo purposes if nothing set
    localStorage.setItem("pointhive.userId", "1");
    window.location.reload();
    return null;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/marketplace">
        <Layout><Marketplace /></Layout>
      </Route>
      <Route path="/marketplace/:id">
        <Layout><ListingDetail /></Layout>
      </Route>
      <Route path="/sell">
        <Layout><Sell /></Layout>
      </Route>
      <Route path="/inventory">
        <Layout><Inventory /></Layout>
      </Route>
      <Route path="/transfer">
        <Layout><Transfer /></Layout>
      </Route>
      <Route path="/transactions">
        <Layout><Transactions /></Layout>
      </Route>
      <Route path="/transactions/:id">
        <Layout><TransactionDetail /></Layout>
      </Route>
      <Route path="/notifications">
        <Layout><Notifications /></Layout>
      </Route>
      <Route path="/profile">
        <Layout><Profile /></Layout>
      </Route>
      <Route path="/admin">
        <Layout><Admin /></Layout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
