import {
  useGetAdminOverview,
  useGetAdminRecentActivity,
  useGetTopSellers,
  useGetCurrentUser,
  getGetAdminOverviewQueryKey,
  getGetAdminRecentActivityQueryKey,
  getGetTopSellersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hexagon, Users, Package, Activity, Award, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";

export default function Admin() {
  const { t } = useTranslation();
  const { data: user, isLoading: loadingUser } = useGetCurrentUser();
  const { data: overview, isLoading: loadingOverview } = useGetAdminOverview({
    query: { queryKey: getGetAdminOverviewQueryKey(), enabled: user?.role === 'admin' }
  });
  const { data: recentActivity, isLoading: loadingActivity } = useGetAdminRecentActivity({
    query: { queryKey: getGetAdminRecentActivityQueryKey(), enabled: user?.role === 'admin' }
  });
  const { data: topSellers, isLoading: loadingSellers } = useGetTopSellers({
    query: { queryKey: getGetTopSellersQueryKey(), enabled: user?.role === 'admin' }
  });

  if (loadingUser) {
    return <div className="p-8"><Skeleton className="h-8 w-32" /></div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">{t("admin.accessDenied")}</h2>
        <p className="text-muted-foreground">{t("admin.accessDeniedDesc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight">{t("admin.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("admin.subtitle")}</p>
      </div>

      {loadingOverview ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-elevate bg-primary/10 border-primary/20">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-primary font-bold text-sm">{t("admin.totalUsers")}</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-primary">{overview.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-primary/70 mt-1 font-medium">{t("admin.thisWeek", { n: overview.newUsers7d })}</p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-muted-foreground font-medium text-sm">{t("admin.pointsCirculating")}</CardTitle>
              <Hexagon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.pointsCirculated.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{t("admin.acrossWallets")}</p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-muted-foreground font-medium text-sm">{t("admin.activeListings")}</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.activeListings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{t("admin.totalListings")} {overview.totalListings}</p>
            </CardContent>
          </Card>

          <Card className="hover-elevate bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-blue-700 dark:text-blue-400 font-medium text-sm">{t("admin.transactions7d")}</CardTitle>
              <Activity className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{overview.transactions7d.toLocaleString()}</div>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">{t("admin.vs30d", { n: overview.transactions30d })}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold">{t("admin.recentActivity")}</h2>
          
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
              ) : recentActivity?.length ? (
                recentActivity.map(item => (
                  <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors flex items-start gap-4">
                    <Avatar className="w-10 h-10 border bg-background">
                      <AvatarImage src={item.actorAvatarUrl || ""} />
                      <AvatarFallback>
                        <Activity className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        <span className="font-bold">{item.actorName}</span> {item.subtitle.toLowerCase()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                        {item.pointsAmount && (
                          <>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-xs font-bold flex items-center gap-1 text-muted-foreground">
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
                <div className="p-8 text-center text-muted-foreground">{t("admin.noActivity")}</div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            {t("admin.topSellers")}
          </h2>
          
          <Card className="overflow-hidden">
            <div className="divide-y">
              {loadingSellers ? (
                [1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              ) : topSellers?.length ? (
                topSellers.map((seller, index) => (
                  <div key={seller.userId} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                    <div className="w-6 text-center font-black text-muted-foreground/50">
                      #{index + 1}
                    </div>
                    <Avatar className="w-8 h-8 border shadow-sm">
                      <AvatarImage src={seller.avatarUrl || ""} />
                      <AvatarFallback className="text-xs">{seller.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{seller.name}</div>
                      <div className="text-xs text-muted-foreground">{t("admin.sales", { n: seller.totalSales })}</div>
                    </div>
                    <div className="text-right rtl:text-left shrink-0">
                      <div className="text-sm font-bold text-primary flex items-center gap-1">
                        <Hexagon className="w-3 h-3 fill-primary" />
                        {seller.pointsEarned.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">{t("admin.noSellers")}</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
