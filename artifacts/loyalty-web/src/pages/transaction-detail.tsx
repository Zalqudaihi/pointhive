import { useParams, Link } from "wouter";
import { useGetTransaction } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hexagon, ArrowLeft, ShoppingBag, Send, Activity, Clock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: tx, isLoading, error } = useGetTransaction(Number(id), {
    query: {
      enabled: !!id,
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="w-24 h-10 rounded-lg" />
        <Skeleton className="h-64 rounded-3xl w-full" />
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Transaction not found</h2>
        <p className="text-muted-foreground">This transaction doesn't exist or you don't have access.</p>
        <Link href="/transactions">
          <Button variant="outline">Back to Activity</Button>
        </Link>
      </div>
    );
  }

  const isPurchase = tx.type === 'purchase';
  const isTransfer = tx.type === 'transfer';
  const isExchange = tx.type === 'exchange';

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <Link href="/transactions" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to activity
      </Link>

      <Card className="overflow-hidden border-border/50 shadow-sm">
        <div className={`h-3 w-full ${
          isPurchase ? 'bg-primary' : 
          isTransfer ? 'bg-blue-500' : 
          'bg-orange-500'
        }`} />
        <CardContent className="p-8 sm:p-12 space-y-8">
          
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
              isPurchase ? 'bg-primary/20 text-primary' : 
              isTransfer ? 'bg-blue-500/20 text-blue-500' : 
              'bg-orange-500/20 text-orange-500'
            }`}>
              {isPurchase ? <ShoppingBag className="w-10 h-10" /> : 
               isTransfer ? <Send className="w-10 h-10" /> : 
               <Activity className="w-10 h-10" />}
            </div>
            
            <div>
              <Badge variant={
                tx.status === 'completed' ? 'secondary' : 
                tx.status === 'pending' ? 'outline' : 'destructive'
              } className="uppercase tracking-wider mb-2">
                {tx.status}
              </Badge>
              <h1 className="text-3xl font-black">
                {isPurchase ? 'Purchase Receipt' : 
                 isTransfer ? 'Points Transfer' : 
                 'System Exchange'}
              </h1>
              <p className="text-muted-foreground font-medium mt-1 flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4" />
                {format(new Date(tx.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          <div className="py-8 border-y border-dashed flex flex-col items-center justify-center">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Amount</div>
            <div className={`flex items-center gap-2 text-5xl font-black ${
              isPurchase ? 'text-destructive' : 'text-primary'
            }`}>
              <Hexagon className="w-10 h-10 fill-current" />
              {tx.pointsAmount.toLocaleString()}
            </div>
            {tx.cashCents && (
              <div className="text-lg font-medium text-muted-foreground mt-2">
                Value: ${(tx.cashCents / 100).toFixed(2)}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {isPurchase && (
              <div className="bg-muted/30 p-4 rounded-xl border flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg shrink-0 overflow-hidden">
                  {tx.productImageUrl ? (
                    <img src={tx.productImageUrl} alt={tx.productTitle || ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                      <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Item</div>
                  <div className="font-bold text-lg truncate">{tx.productTitle}</div>
                  {tx.productId && (
                    <Link href={`/marketplace/${tx.productId}`} className="text-primary text-sm font-medium hover:underline">
                      View Listing
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 bg-muted/20 p-4 rounded-xl border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">From</span>
                {tx.sellerName ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{tx.sellerName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold">{tx.sellerName}</span>
                  </div>
                ) : (
                  <span className="font-bold">System</span>
                )}
              </div>

              <div className="space-y-2 bg-muted/20 p-4 rounded-xl border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">To</span>
                {tx.buyerName ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{tx.buyerName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold">{tx.buyerName}</span>
                  </div>
                ) : (
                  <span className="font-bold">System</span>
                )}
              </div>
            </div>

            {tx.note && (
              <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
                <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">Note</span>
                <p className="text-foreground font-medium italic">"{tx.note}"</p>
              </div>
            )}
          </div>
          
          <div className="pt-6 text-center text-xs text-muted-foreground">
            Transaction ID: #{tx.id.toString().padStart(8, '0')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}