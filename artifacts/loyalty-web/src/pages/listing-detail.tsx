import { useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  useGetProduct, 
  useCreatePurchase,
  getGetProductQueryKey,
  getGetCurrentUserQueryKey,
  getListTransactionsQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hexagon, ArrowLeft, Gift, ShoppingBag, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ListingDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBuying, setIsBuying] = useState(false);

  const { data: product, isLoading, error } = useGetProduct(Number(id), {
    query: {
      queryKey: getGetProductQueryKey(Number(id)),
      enabled: !!id,
    }
  });

  const createPurchase = useCreatePurchase();

  const handlePurchase = async () => {
    if (!product) return;
    
    setIsBuying(true);
    try {
      await createPurchase.mutateAsync({ data: { productId: product.id } });
      
      toast({
        title: t("listingDetail.successTitle"),
        description: t("listingDetail.successDesc", { product: product.title, price: product.pointPrice.toLocaleString() }),
      });
      
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      
      setLocation("/transactions");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("listingDetail.notEnoughPts");
      toast({
        variant: "destructive",
        title: t("listingDetail.errorTitle"),
        description: message,
      });
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="w-24 h-10 rounded-lg" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">{t("listingDetail.notFound")}</h2>
        <p className="text-muted-foreground">{t("notFound.desc")}</p>
        <Link href="/marketplace">
          <Button variant="outline">{t("nav.marketplace")}</Button>
        </Link>
      </div>
    );
  }

  const isAvailable = product.status === 'active' && product.stock > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <Link href="/marketplace" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
        {t("nav.marketplace")}
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="aspect-[4/3] md:aspect-square w-full bg-muted rounded-3xl overflow-hidden relative shadow-sm border">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/20 text-secondary-foreground/30">
              {product.type === 'coupon' ? <Gift className="w-24 h-24 mb-4" /> : <ShoppingBag className="w-24 h-24 mb-4" />}
            </div>
          )}
          <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 flex gap-2">
            <Badge variant="secondary" className="backdrop-blur-md bg-background/90 text-foreground uppercase tracking-wider font-bold shadow-sm">
              {product.type === 'coupon' ? t("common.coupon") : t("common.item")}
            </Badge>
            {!isAvailable && (
              <Badge variant="destructive" className="uppercase tracking-wider font-bold shadow-sm">
                {product.status === 'sold' ? t("common.sold") : t("common.draft")}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-widest text-xs font-bold px-3 py-1">
              {product.category}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-foreground">
              {product.title}
            </h1>
            
            <div className="flex items-center gap-3 py-2">
              <Avatar className="w-8 h-8 border">
                <AvatarImage src={product.sellerAvatarUrl || ""} />
                <AvatarFallback>{product.sellerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground font-medium">
                {t("listingDetail.soldBy")} <span className="text-foreground font-bold">{product.sellerName}</span>
              </span>
            </div>
          </div>

          <div className="p-6 bg-muted/30 rounded-2xl border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("sell.price")}</span>
              <div className="flex items-baseline gap-4">
                <div className="flex items-center gap-2 font-black text-4xl text-primary">
                  <Hexagon className="w-8 h-8 fill-primary text-primary" />
                  {product.pointPrice.toLocaleString()}
                </div>
                {product.cashPriceCents && (
                  <div className="text-xl font-bold text-muted-foreground line-through decoration-muted-foreground/30">
                    ${(product.cashPriceCents / 100).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            
            {product.type === 'coupon' && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-6">
                {product.couponDiscountPct && (
                  <div>
                    <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("listingDetail.discount", { pct: "" }).replace(" ", "")}</span>
                    <span className="font-bold text-lg">{product.couponDiscountPct}% OFF</span>
                  </div>
                )}
                {product.couponExpiresAt && (
                  <div>
                    <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("listingDetail.expires", { date: "" }).replace(" ", "")}</span>
                    <span className="font-bold text-lg flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {format(new Date(product.couponExpiresAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">{t("sell.description")}</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          <div className="pt-6 border-t border-border">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg rounded-xl shadow-lg hover-elevate font-bold group"
              disabled={!isAvailable || isBuying}
              onClick={handlePurchase}
            >
              {isBuying ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2 rtl:mr-0 rtl:ml-2" />
              ) : !isAvailable ? (
                t("common.sold")
              ) : (
                <>
                  {t("listingDetail.buy")}
                  <Hexagon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2 fill-current opacity-70 group-hover:scale-110 transition-transform" />
                </>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {t("listingDetail.cashAlso")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
