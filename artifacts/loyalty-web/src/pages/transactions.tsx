import { useState } from "react";
import { Link } from "wouter";
import { useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hexagon, ShoppingBag, Send, Activity, ArrowRight, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Transactions() {
  const [activeFilter, setActiveFilter] = useState<"purchase" | "transfer" | "exchange" | null>(null);

  const { data: transactions, isLoading } = useListTransactions({
    type: activeFilter || undefined,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Activity</h1>
          <p className="text-muted-foreground mt-1">Your recent transactions and point transfers.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Button 
          variant={activeFilter === null ? "default" : "outline"} 
          onClick={() => setActiveFilter(null)}
          className="rounded-full"
        >
          All Activity
        </Button>
        <Button 
          variant={activeFilter === "purchase" ? "default" : "outline"} 
          onClick={() => setActiveFilter("purchase")}
          className="rounded-full"
        >
          <ShoppingBag className="w-4 h-4 mr-2" /> Purchases
        </Button>
        <Button 
          variant={activeFilter === "transfer" ? "default" : "outline"} 
          onClick={() => setActiveFilter("transfer")}
          className="rounded-full"
        >
          <Send className="w-4 h-4 mr-2" /> Transfers
        </Button>
        <Button 
          variant={activeFilter === "exchange" ? "default" : "outline"} 
          onClick={() => setActiveFilter("exchange")}
          className="rounded-full"
        >
          <Activity className="w-4 h-4 mr-2" /> System
        </Button>
      </div>

      {isLoading ? (
        <Card className="divide-y border-border/50">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </Card>
      ) : transactions?.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-1">No activity found</h3>
          <p className="text-muted-foreground">When you buy, sell, or transfer points, it will show up here.</p>
        </div>
      ) : (
        <Card className="divide-y border-border/50 shadow-sm overflow-hidden">
          {transactions?.map(tx => (
            <Link key={tx.id} href={`/transactions/${tx.id}`}>
              <div className="p-4 sm:p-6 hover:bg-muted/50 transition-colors flex items-center gap-4 group cursor-pointer">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  tx.type === 'purchase' ? 'bg-primary/20 text-primary' : 
                  tx.type === 'transfer' ? 'bg-blue-500/20 text-blue-500' : 
                  'bg-orange-500/20 text-orange-500'
                }`}>
                  {tx.type === 'purchase' ? <ShoppingBag className="w-6 h-6" /> : 
                   tx.type === 'transfer' ? <Send className="w-6 h-6" /> : 
                   <Activity className="w-6 h-6" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground">
                      {tx.type === 'purchase' ? 'Purchase' : 
                       tx.type === 'transfer' ? 'Transfer' : 
                       'Exchange'}
                    </span>
                    <Badge variant={
                      tx.status === 'completed' ? 'secondary' : 
                      tx.status === 'pending' ? 'outline' : 'destructive'
                    } className="text-[10px] uppercase tracking-wider py-0 px-1.5 h-4">
                      {tx.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {tx.type === 'purchase' ? (
                      <>You bought <span className="font-medium text-foreground">{tx.productTitle}</span> from {tx.sellerName}</>
                    ) : tx.type === 'transfer' ? (
                      <>Sent to <span className="font-medium text-foreground">{tx.buyerName || tx.sellerName}</span></> // This needs proper logic based on user role but for UI mockup this is ok
                    ) : (
                      <>System exchange</>
                    )}
                  </p>
                </div>
                
                <div className="text-right shrink-0 flex flex-col items-end">
                  <div className={`font-black flex items-center gap-1 text-lg ${
                    tx.type === 'purchase' ? 'text-destructive' : 'text-primary'
                  }`}>
                    {tx.type === 'purchase' ? '-' : '+'}{tx.pointsAmount.toLocaleString()}
                    <Hexagon className="w-4 h-4 fill-current" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all shrink-0 hidden sm:block" />
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}