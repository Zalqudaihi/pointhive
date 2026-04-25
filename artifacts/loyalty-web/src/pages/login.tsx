import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hexagon, ArrowRight, Loader2 } from "lucide-react";
import loginBg from "@/assets/images/login-bg.png";

type DemoIdentity = {
  id: number;
  name: string;
  role: "user" | "admin";
  avatarUrl: string;
  tagline: string;
};

// Demo identities mirror the seeded users. This page does NOT call the API
// because the API requires an authenticated identity and login is the only
// place where the user has not yet picked one. Real auth (Clerk/OIDC) would
// replace this list with a hosted sign-in page.
const DEMO_IDENTITIES: DemoIdentity[] = [
  { id: 1, name: "Zoe Tanaka", role: "admin", avatarUrl: "/seed/avatar1.png", tagline: "Hive admin" },
  { id: 2, name: "Marcus Reyes", role: "user", avatarUrl: "/seed/avatar2.png", tagline: "Vintage seller" },
  { id: 3, name: "Priya Bennett", role: "user", avatarUrl: "/seed/avatar3.png", tagline: "Plant parent" },
  { id: 4, name: "Sam Okafor", role: "user", avatarUrl: "/seed/avatar4.png", tagline: "Coupon collector" },
];

export default function Login() {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleSelectUser = (id: number) => {
    setLoadingId(id);
    localStorage.setItem("pointhive.userId", String(id));
    setTimeout(() => {
      window.location.href = import.meta.env.BASE_URL;
    }, 300);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      <div 
        className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between hidden md:flex relative overflow-hidden"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/20" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <Hexagon className="w-8 h-8 fill-primary text-primary" />
          </div>
          <span className="text-2xl font-bold text-foreground">PointHive</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-black mb-6 leading-tight text-foreground">
            Make your loyalty mean more.
          </h1>
          <p className="text-lg text-foreground/80 font-medium">
            Trade points, discover unique items, and join a community that actually rewards you.
          </p>
        </div>
      </div>
      
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2 md:hidden">
            <div className="flex justify-center mb-4">
              <Hexagon className="w-12 h-12 fill-primary text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Welcome to PointHive</h1>
            <p className="text-muted-foreground">Pick an identity to continue.</p>
          </div>
          
          <div className="hidden md:block space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Who are you today?</h2>
            <p className="text-muted-foreground">Select a demo identity to explore the app.</p>
          </div>

          <div className="grid gap-4">
            {DEMO_IDENTITIES.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelectUser(u.id)}
                disabled={loadingId !== null}
                className={`group relative flex items-center gap-4 p-4 rounded-2xl border bg-card text-left transition-all duration-300 hover:shadow-md hover:border-primary/50 disabled:opacity-70 disabled:cursor-not-allowed
                  ${loadingId === u.id ? 'ring-2 ring-primary scale-[0.98]' : 'hover:-translate-y-1'}`}
              >
                <Avatar className="w-14 h-14 border-2 border-background shadow-sm">
                  <AvatarImage src={u.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {u.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">{u.name}</h3>
                    {u.role === 'admin' && (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-primary/20 text-primary rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{u.tagline}</p>
                </div>

                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {loadingId === u.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}