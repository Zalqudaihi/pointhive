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
import Friends from "@/pages/friends";
import Vouchers from "@/pages/vouchers";

const queryClient = new QueryClient();

function Router() {
  const userId = typeof window !== "undefined" ? localStorage.getItem("pointhive.userId") : null;
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const loginUrl = `${basePath}/login`;

  if (!userId && path !== loginUrl && !path.endsWith("/login")) {
    window.location.href = loginUrl;
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
      <Route path="/friends">
        <Layout><Friends /></Layout>
      </Route>
      <Route path="/vouchers">
        <Layout><Vouchers /></Layout>
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
