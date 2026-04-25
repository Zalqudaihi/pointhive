import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ShoppingBag, Send, Activity, Store, CheckCircle2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleMarkRead = async (id: number) => {
    try {
      await markRead.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync({});
      toast({ title: "All notifications marked as read" });
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated on your hive activity.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card className="divide-y border-border/50">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </Card>
      ) : notifications?.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-1">You're all caught up!</h3>
          <p className="text-muted-foreground">No new notifications right now.</p>
        </div>
      ) : (
        <Card className="divide-y border-border/50 shadow-sm overflow-hidden">
          {notifications?.map(notification => (
            <div 
              key={notification.id} 
              className={`p-4 sm:p-6 flex items-start gap-4 transition-colors ${
                notification.read ? 'bg-background' : 'bg-primary/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                notification.type === 'purchase' ? 'bg-primary/20 text-primary' : 
                notification.type === 'transfer' ? 'bg-blue-500/20 text-blue-500' : 
                notification.type === 'marketplace' ? 'bg-green-500/20 text-green-500' :
                'bg-orange-500/20 text-orange-500'
              }`}>
                {notification.type === 'purchase' ? <ShoppingBag className="w-5 h-5" /> : 
                 notification.type === 'transfer' ? <Send className="w-5 h-5" /> : 
                 notification.type === 'marketplace' ? <Store className="w-5 h-5" /> : 
                 <Activity className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`text-base font-bold ${notification.read ? 'text-foreground' : 'text-primary'}`}>
                  {notification.title}
                </h4>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  {notification.body}
                </p>
                <div className="text-xs text-muted-foreground font-medium mt-2">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </div>
              </div>

              {!notification.read && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => handleMarkRead(notification.id)}
                  disabled={markRead.isPending}
                >
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}