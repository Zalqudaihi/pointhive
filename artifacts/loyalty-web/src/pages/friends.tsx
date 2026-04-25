import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListBeneficiaries,
  useAddBeneficiary,
  useRemoveBeneficiary,
  useListUsers,
  useGetCurrentUser,
  getListBeneficiariesQueryKey,
  getGetCurrentUserQueryKey,
  getListTransactionsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  Phone,
  Trash2,
  Send,
  Loader2,
  Search,
} from "lucide-react";
import { Link } from "wouter";

export default function Friends() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const { data: currentUser } = useGetCurrentUser();
  const { data: beneficiaries, isLoading } = useListBeneficiaries();
  const { data: users, isLoading: loadingUsers } = useListUsers({ search: search || undefined });

  const addBeneficiary = useAddBeneficiary();
  const removeBeneficiary = useRemoveBeneficiary();

  const filteredUsers = users?.filter(
    (u) =>
      u.id !== currentUser?.id &&
      !beneficiaries?.some((b) => b.beneficiaryId === u.id),
  ) ?? [];

  const handleAdd = async () => {
    if (!selectedUserId) return;
    try {
      await addBeneficiary.mutateAsync({
        data: { beneficiaryId: selectedUserId, nickname: nickname || undefined },
      });
      queryClient.invalidateQueries({ queryKey: getListBeneficiariesQueryKey() });
      toast({ title: t("friends.addedTitle"), description: t("friends.addedDesc") });
      setAddOpen(false);
      setSelectedUserId(null);
      setNickname("");
      setSearch("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("friends.addedTitle"),
        description: err instanceof Error ? err.message : "Failed to add friend",
      });
    }
  };

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    try {
      await removeBeneficiary.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListBeneficiariesQueryKey() });
      toast({ title: t("friends.removedTitle"), description: t("friends.removedDesc") });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("friends.removedTitle"),
        description: err instanceof Error ? err.message : "Failed to remove",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            {t("friends.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("friends.subtitle")}</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="shrink-0">
          <UserPlus className="w-4 h-4 mr-2" />
          {t("friends.addFriend")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !beneficiaries?.length ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="py-16 text-center space-y-3">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="font-bold text-lg text-muted-foreground">{t("friends.noFriends")}</p>
            <p className="text-sm text-muted-foreground/70">{t("friends.noFriendsDesc")}</p>
            <Button variant="outline" onClick={() => setAddOpen(true)} className="mt-2">
              <UserPlus className="w-4 h-4 mr-2" />
              {t("friends.addFriend")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {beneficiaries.map((b) => (
            <Card key={b.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-background shadow-sm shrink-0">
                  <AvatarImage src={b.beneficiaryAvatarUrl ?? ""} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                    {b.beneficiaryName?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold truncate">{b.beneficiaryName}</span>
                    {b.nickname && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {b.nickname}
                      </Badge>
                    )}
                  </div>
                  {b.beneficiaryPhone && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{b.beneficiaryPhone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/transfer?to=${b.beneficiaryId}`}>
                    <Button size="sm" variant="outline">
                      <Send className="w-4 h-4 mr-1.5" />
                      {t("friends.sendPoints")}
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleRemove(b.id)}
                    disabled={removingId === b.id}
                  >
                    {removingId === b.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("friends.addFriend")}</DialogTitle>
            <DialogDescription>{t("friends.noFriendsDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
              <Input
                placeholder={t("friends.searchPlaceholder")}
                className="pl-9 rtl:pl-3 rtl:pr-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="bg-muted/30 rounded-xl border border-border/50 h-56 overflow-y-auto p-2 space-y-1">
              {loadingUsers ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {t("friends.noFriends")}
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                      selectedUserId === u.id
                        ? "bg-primary/20 border border-primary/50"
                        : "hover:bg-muted border border-transparent"
                    }`}
                  >
                    <Avatar className="w-9 h-9 border">
                      <AvatarImage src={u.avatarUrl ?? ""} />
                      <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate text-sm">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("friends.nickname")}</Label>
              <Input
                placeholder={t("friends.nicknamePlaceholder")}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedUserId || addBeneficiary.isPending}
            >
              {addBeneficiary.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("friends.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
