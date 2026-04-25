import { useTranslation } from "react-i18next";
import { useGetDashboardSummary, useGetDashboardActivity, useGetTrendingProducts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hexagon, TrendingUp, TrendingDown, Package, Gift, ShoppingBag, Bell, Activity, ArrowRight, Send } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: loadingActivity } = useGetDashboardActivity();
  const { data: trending, isLoading: loadingTrending } = useGetTrendingProducts();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {loadingSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground border-primary-border overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
              <Hexagon className="w-32 h-32 fill-current" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-primary-foreground/80 font-medium text-sm flex items-center gap-2">
                <Hexagon className="w-4 h-4 fill-current" />
                {t("dashboard.totalBalance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black">{summary.pointsBalance.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-muted-foreground font-medium text-sm">{t("dashboard.flow30d")}</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center text-sm font-bold text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{summary.pointsEarned30d.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("dashboard.earned")}</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <div className="flex items-center text-sm font-bold text-destructive">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -{summary.pointsSpent30d.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">{t("dashboard.spent")}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-muted-foreground font-medium text-sm">{t("dashboard.yourListings")}</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeListings}</div>
              <p className="text-xs text-muted-foreground mt-1">{t("dashboard.activeOnMarketplace")}</p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-muted-foreground font-medium text-sm">{t("dashboard.couponsAndPurchases")}</CardTitle>
              <Gift className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-2xl font-bold">{summary.couponsOwned}</div>
                  <div className="text-xs text-muted-foreground">{t("dashboard.coupons")}</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <div className="text-2xl font-bold">{summary.completedPurchases}</div>
                  <div className="text-xs text-muted-foreground">{t("dashboard.items")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{t("dashboard.trending")}</h2>
            <Link href="/marketplace">
              <Button variant="ghost" className="text-primary group">
                {t("dashboard.viewAll")} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform rtl:rotate-180" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loadingTrending ? (
              [1, 2].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)
            ) : trending?.length ? (
              trending.slice(0, 4).map(product => (
                <Link key={product.id} href={`/marketplace/${product.id}`}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer group h-full flex flex-col">
                    <div className="aspect-video w-full bg-muted relative overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/30 text-secondary-foreground/30">
                          {product.type === "coupon" ? <Gift className="w-12 h-12" /> : <ShoppingBag className="w-12 h-12" />}
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-background/90 backdrop-blur text-xs font-bold rounded-full uppercase tracking-wider">
                          {product.type}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{product.title}</h3>
                      <div className="flex items-center gap-2 mt-2 mb-4">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={product.sellerAvatarUrl || ""} />
                          <AvatarFallback className="text-[8px]">{product.sellerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">{product.sellerName}</span>
                      </div>
                      <div className="mt-auto pt-4 border-t flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-primary">
                          <Hexagon className="w-4 h-4 fill-primary" />
                          {product.pointPrice.toLocaleString()} {t("common.pts")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-2 py-12 text-center border-2 border-dashed rounded-2xl">
                <p className="text-muted-foreground">{t("dashboard.noTrending")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{t("dashboard.recentActivity")}</h2>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="text-muted-foreground">{t("dashboard.viewAll")}</Button>
            </Link>
          </div>

          <Card className="overflow-hidden">
            <div className="divide-y">
              {loadingActivity ? (
                [1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : activity?.length ? (
                activity.map(item => (
                  <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors flex items-start gap-4">
                    <Avatar className="w-10 h-10 border bg-background">
                      <AvatarImage src={item.actorAvatarUrl || ""} />
                      <AvatarFallback>
                        {item.type === "purchase" ? <ShoppingBag className="w-4 h-4" /> :
                         item.type === "transfer" ? <Send className="w-4 h-4" /> :
                         <Activity className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                        {item.pointsAmount && (
                          <>
                            <span className="text-muted-foreground/30">•</span>
                            <span className={`text-xs font-bold flex items-center gap-1 ${
                              item.type === "purchase" || item.type === "transfer" ? "text-primary" : "text-muted-foreground"
                            }`}>
                              <Hexagon className="w-3 h-3 fill-current" />
                              {item.pointsAmount.toLocaleString()} {t("common.pts")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">{t("dashboard.noRecentActivity")}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
