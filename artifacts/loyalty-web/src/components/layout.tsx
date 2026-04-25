import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  useListUsers,
  useListNotifications,
  getGetCurrentUserQueryKey,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Hexagon,
  Bell,
  Menu,
  Store,
  PlusCircle,
  Package,
  Send,
  History,
  Shield,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: user } = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    },
  });

  const { data: users } = useListUsers();
  const { data: notifications } = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      enabled: !!user,
    }
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleSwitchUser = (userId: number) => {
    localStorage.setItem("pointhive.userId", String(userId));
    queryClient.invalidateQueries();
    window.location.reload();
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: <Hexagon className="w-4 h-4" /> },
    { href: "/marketplace", label: "Marketplace", icon: <Store className="w-4 h-4" /> },
    { href: "/sell", label: "Sell", icon: <PlusCircle className="w-4 h-4" /> },
    { href: "/inventory", label: "Inventory", icon: <Package className="w-4 h-4" /> },
    { href: "/transfer", label: "Transfer", icon: <Send className="w-4 h-4" /> },
    { href: "/transactions", label: "Activity", icon: <History className="w-4 h-4" /> },
  ];

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <Hexagon className="w-8 h-8 fill-primary text-primary" />
              <span className="text-xl font-bold tracking-tight hidden sm:inline-block">PointHive</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location === link.href
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold">
              <Hexagon className="w-4 h-4 fill-primary" />
              {user.pointsBalance.toLocaleString()} pts
            </div>

            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1.5 min-w-5 h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar className="w-9 h-9 border-2 border-background shadow-sm hover-elevate">
                    <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 sm:hidden">
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-primary/10 text-primary font-bold text-sm">
                    <span>Balance</span>
                    <span className="flex items-center gap-1">
                      <Hexagon className="w-3 h-3 fill-primary" />
                      {user.pointsBalance.toLocaleString()} pts
                    </span>
                  </div>
                </div>
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer">
                      <Shield className="w-4 h-4 mr-2 text-primary" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">Switch Demo User</DropdownMenuLabel>
                {users?.map(u => (
                  <DropdownMenuItem 
                    key={u.id} 
                    onClick={() => handleSwitchUser(u.id)}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={u.avatarUrl || ""} />
                        <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className={u.id === user.id ? "font-bold text-primary" : ""}>{u.name}</span>
                    </div>
                    {u.id === user.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex items-center gap-2 mb-8 text-primary">
                  <Hexagon className="w-6 h-6 fill-primary text-primary" />
                  <span className="text-lg font-bold tracking-tight">PointHive</span>
                </div>
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        location === link.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
