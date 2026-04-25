import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListVouchers,
  useCreateVoucher,
  useRedeemVoucher,
  useTransferVoucher,
  useListBeneficiaries,
  useGetCurrentUser,
  getListVouchersQueryKey,
  getGetCurrentUserQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PhoneGate } from "@/components/phone-gate";
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Loader2,
  Send,
  ArrowDownToLine,
  Hexagon,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    active: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
    redeemed: "bg-muted text-muted-foreground border-border/50",
    transferred: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    expired: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  };
  const label = t(`vouchers.${status}`, status);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? map.active}`}
    >
      {label}
    </span>
  );
}

export default function Vouchers() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [createPts, setCreatePts] = useState("100");
  const [createNote, setCreateNote] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [transferRecipient, setTransferRecipient] = useState<number | null>(null);

  const { data: currentUser } = useGetCurrentUser();
  const { data: vouchers, isLoading } = useListVouchers();
  const { data: beneficiaries } = useListBeneficiaries();

  const createVoucher = useCreateVoucher();
  const redeemVoucher = useRedeemVoucher();
  const transferVoucher = useTransferVoucher();

  const myVouchers = vouchers?.filter((v) => v.issuerUserId === currentUser?.id) ?? [];
  const receivedVouchers =
    vouchers?.filter((v) => v.holderUserId === currentUser?.id && v.issuerUserId !== currentUser?.id) ?? [];

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreate = async () => {
    const pts = Number(createPts);
    if (!pts || pts < 1) return;
    try {
      const created = await createVoucher.mutateAsync({
        data: { pointsValue: pts, note: createNote || undefined },
      });
      queryClient.invalidateQueries({ queryKey: getListVouchersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      toast({
        title: t("vouchers.successCreate"),
        description: t("vouchers.successCreateDesc", {
          code: created.code,
          pts: created.pointsValue,
        }),
      });
      setCreateOpen(false);
      setCreatePts("100");
      setCreateNote("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("vouchers.errorCreate"),
        description: err instanceof Error ? err.message : "Error",
      });
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    try {
      const result = await redeemVoucher.mutateAsync({
        data: { code: redeemCode.trim().toUpperCase() },
      });
      queryClient.invalidateQueries({ queryKey: getListVouchersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      toast({
        title: t("vouchers.successRedeem"),
        description: t("vouchers.successRedeemDesc", { pts: result.pointsValue }),
      });
      setRedeemOpen(false);
      setRedeemCode("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("vouchers.errorRedeem"),
        description: err instanceof Error ? err.message : "Error",
      });
    }
  };

  const handleTransfer = async (voucherId: number) => {
    if (!transferRecipient) return;
    try {
      await transferVoucher.mutateAsync({ id: voucherId, data: { recipientId: transferRecipient } });
      queryClient.invalidateQueries({ queryKey: getListVouchersQueryKey() });
      toast({ title: t("vouchers.successTransfer") });
      setTransferOpen(null);
      setTransferRecipient(null);
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("vouchers.errorTransfer"),
        description: err instanceof Error ? err.message : "Error",
      });
    }
  };

  const VoucherCard = ({ v }: { v: NonNullable<typeof vouchers>[number] }) => {
    const isHolder = v.holderUserId === currentUser?.id;
    const isIssuer = v.issuerUserId === currentUser?.id;
    const canTransfer = isHolder && v.status === "active";

    return (
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div
          className={`h-1.5 w-full ${
            v.status === "active"
              ? "bg-gradient-to-r from-primary to-amber-400"
              : "bg-muted"
          }`}
        />
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="font-mono text-sm font-bold tracking-widest text-foreground/80 flex items-center gap-2 flex-wrap">
                <span>{v.code}</span>
                {v.status === "active" && (
                  <button
                    type="button"
                    onClick={() => copyCode(v.code)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedCode === v.code ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-2xl font-black text-primary">
                <Hexagon className="w-5 h-5 fill-primary" />
                {v.pointsValue.toLocaleString()}
                <span className="text-base font-medium text-muted-foreground ml-0.5">
                  {t("vouchers.pts")}
                </span>
              </div>
            </div>
            <StatusBadge status={v.status} />
          </div>

          {v.note && (
            <p className="text-sm text-muted-foreground italic">"{v.note}"</p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isIssuer && !isHolder
                ? t("vouchers.holder", { name: v.holderName })
                : isIssuer
                  ? t("vouchers.createdByYou")
                  : t("vouchers.receivedFrom", { name: v.issuerName })}
            </span>
            <span>{new Date(v.createdAt).toLocaleDateString()}</span>
          </div>

          {canTransfer && (beneficiaries?.length ?? 0) > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setTransferOpen(v.id)}
            >
              <Send className="w-4 h-4 mr-1.5" />
              {t("vouchers.transfer")}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Ticket className="w-7 h-7 text-primary" />
            {t("vouchers.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("vouchers.subtitle")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setRedeemOpen(true)}>
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            {t("vouchers.redeem")}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("vouchers.create")}
          </Button>
        </div>
      </div>

      <PhoneGate hasPhone={!!currentUser?.phone}>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="mine">
            <TabsList className="mb-6">
              <TabsTrigger value="mine">
                {t("vouchers.myVouchers")}
                {myVouchers.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {myVouchers.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="received">
                {t("vouchers.received")}
                {receivedVouchers.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {receivedVouchers.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mine">
              {myVouchers.length === 0 ? (
                <Card className="border-dashed border-2 border-border/50">
                  <CardContent className="py-16 text-center space-y-3">
                    <Ticket className="w-12 h-12 mx-auto text-muted-foreground/40" />
                    <p className="font-bold text-lg text-muted-foreground">
                      {t("vouchers.noVouchers")}
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      {t("vouchers.noVouchersDesc")}
                    </p>
                    <Button onClick={() => setCreateOpen(true)} className="mt-2">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("vouchers.create")}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {myVouchers.map((v) => (
                    <VoucherCard key={v.id} v={v} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="received">
              {receivedVouchers.length === 0 ? (
                <Card className="border-dashed border-2 border-border/50">
                  <CardContent className="py-16 text-center space-y-3">
                    <Ticket className="w-12 h-12 mx-auto text-muted-foreground/40" />
                    <p className="font-bold text-lg text-muted-foreground">
                      {t("vouchers.noVouchers")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {receivedVouchers.map((v) => (
                    <VoucherCard key={v.id} v={v} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </PhoneGate>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("vouchers.createTitle")}</DialogTitle>
            <DialogDescription>{t("vouchers.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("vouchers.amount")}</Label>
              <div className="relative">
                <Hexagon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 fill-primary text-primary rtl:left-auto rtl:right-3" />
                <Input
                  type="number"
                  min="1"
                  className="pl-10 rtl:pl-3 rtl:pr-10"
                  placeholder={t("vouchers.amountPlaceholder")}
                  value={createPts}
                  onChange={(e) => setCreatePts(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("layout.balance")}: {currentUser?.pointsBalance.toLocaleString()} pts
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{t("vouchers.note")}</Label>
              <Textarea
                placeholder={t("vouchers.notePlaceholder")}
                className="resize-none"
                rows={2}
                value={createNote}
                onChange={(e) => setCreateNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={createVoucher.isPending}>
              {createVoucher.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("vouchers.generating")}
                </>
              ) : (
                t("vouchers.generate")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("vouchers.redeemTitle")}</DialogTitle>
            <DialogDescription>{t("vouchers.redeemDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("vouchers.code")}</Label>
              <Input
                placeholder={t("vouchers.codePlaceholder")}
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                className="font-mono tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedeemOpen(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button onClick={handleRedeem} disabled={redeemVoucher.isPending || !redeemCode}>
              {redeemVoucher.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("vouchers.redeeming")}
                </>
              ) : (
                t("vouchers.redeemBtn")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={transferOpen !== null}
        onOpenChange={(o) => {
          if (!o) {
            setTransferOpen(null);
            setTransferRecipient(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("vouchers.transferTitle")}</DialogTitle>
            <DialogDescription>{t("vouchers.transferTo")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(beneficiaries ?? []).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setTransferRecipient(b.beneficiaryId)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                  transferRecipient === b.beneficiaryId
                    ? "bg-primary/20 border border-primary/50"
                    : "hover:bg-muted border border-transparent"
                }`}
              >
                <Avatar className="w-9 h-9 border">
                  <AvatarImage src={b.beneficiaryAvatarUrl ?? ""} />
                  <AvatarFallback>{b.beneficiaryName?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-sm">{b.beneficiaryName}</div>
                  {b.nickname && (
                    <div className="text-xs text-muted-foreground">{b.nickname}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTransferOpen(null);
                setTransferRecipient(null);
              }}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={() => transferOpen && handleTransfer(transferOpen)}
              disabled={!transferRecipient || transferVoucher.isPending}
            >
              {transferVoucher.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("vouchers.transferring")}
                </>
              ) : (
                t("vouchers.transferBtn")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
