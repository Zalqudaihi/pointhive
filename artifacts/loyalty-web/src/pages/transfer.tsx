import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useListUsers,
  useCreateTransfer,
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  getListTransactionsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Hexagon, Send, Loader2, Search } from "lucide-react";

const formSchema = z.object({
  recipientId: z.number().min(1, "Please select a recipient"),
  pointsAmount: z.coerce.number().int().min(1, "Must send at least 1 point"),
  note: z.string().optional(),
});

export default function Transfer() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: currentUser } = useGetCurrentUser();
  const { data: users, isLoading: loadingUsers } = useListUsers({ search: search || undefined });

  const createTransfer = useCreateTransfer();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientId: 0,
      pointsAmount: 10,
      note: "",
    },
  });

  const selectedRecipientId = form.watch("recipientId");
  const selectedRecipient = users?.find(u => u.id === selectedRecipientId);
  const filteredUsers = users?.filter(u => u.id !== currentUser?.id) || [];

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createTransfer.mutateAsync({ data: values });

      toast({
        title: t("transfer.successTitle"),
        description: t("transfer.successDesc", { amount: values.pointsAmount }),
      });

      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });

      setLocation("/transactions");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("transfer.errorTitle");
      toast({
        variant: "destructive",
        title: t("transfer.errorTitle"),
        description: message,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight">{t("transfer.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("transfer.subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold text-lg">{t("transfer.selectRecipient")}</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
            <Input
              placeholder={t("transfer.searchPlaceholder")}
              className="pl-9 bg-background rtl:pl-3 rtl:pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="bg-muted/30 rounded-xl border border-border/50 h-[400px] overflow-y-auto p-2 space-y-1">
            {loadingUsers ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {t("transfer.noUsers")}
              </div>
            ) : (
              filteredUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => form.setValue("recipientId", u.id, { shouldValidate: true })}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedRecipientId === u.id
                      ? "bg-primary/20 border border-primary/50"
                      : "hover:bg-muted border border-transparent"
                  }`}
                >
                  <Avatar className="w-10 h-10 border">
                    <AvatarImage src={u.avatarUrl || ""} />
                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <Card className="border-border/50 shadow-sm overflow-hidden sticky top-24">
            <div className="h-2 bg-primary w-full" />
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {selectedRecipient ? (
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border/50 mb-6">
                      <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                        <AvatarImage src={selectedRecipient.avatarUrl || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                          {selectedRecipient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                          {t("transfer.sendingTo")}
                        </div>
                        <div className="font-bold text-lg leading-none">{selectedRecipient.name}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border mb-6 text-center text-sm text-muted-foreground font-medium">
                      {t("transfer.selectFirst")}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="pointsAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-bold">{t("transfer.amountLabel")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hexagon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 fill-primary text-primary rtl:left-auto rtl:right-4" />
                            <Input
                              type="number"
                              min="1"
                              className="pl-12 h-14 text-2xl font-black bg-background border-primary/50 rtl:pl-3 rtl:pr-12"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("transfer.noteLabel")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("transfer.notePlaceholder")}
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-lg h-14 rounded-xl shadow-md hover-elevate font-bold"
                    disabled={!selectedRecipientId || createTransfer.isPending}
                  >
                    {createTransfer.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    {t("transfer.submit")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
