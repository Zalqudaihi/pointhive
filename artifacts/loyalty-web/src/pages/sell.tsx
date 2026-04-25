import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { 
  useCreateProduct,
  type NewProduct,
  getListProductsQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Hexagon, Image as ImageIcon, Package, Gift, Loader2, PlusCircle } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.string().min(2, "Category is required"),
  type: z.enum(["item", "coupon"]),
  pointPrice: z.coerce.number().int().min(1, "Price must be at least 1 point"),
  cashPriceCents: z.coerce.number().int().min(0).optional().or(z.literal("")),
  stock: z.coerce.number().int().min(1, "Stock must be at least 1"),
  couponCode: z.string().optional(),
  couponDiscountPct: z.coerce.number().int().min(1).max(100).optional().or(z.literal("")),
  couponExpiresAt: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.type === "coupon") {
    if (!data.couponCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Coupon code is required for coupons",
        path: ["couponCode"],
      });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

export default function Sell() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      category: "",
      type: "item",
      pointPrice: 100,
      cashPriceCents: "",
      stock: 1,
      couponCode: "",
      couponDiscountPct: "",
      couponExpiresAt: "",
    },
  });

  const type = form.watch("type");

  const createProduct = useCreateProduct();

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: NewProduct = {
        title: values.title,
        description: values.description,
        category: values.category,
        type: values.type,
        pointPrice: values.pointPrice,
        stock: values.stock,
      };

      if (values.imageUrl) payload.imageUrl = values.imageUrl;
      if (values.cashPriceCents) payload.cashPriceCents = values.cashPriceCents;

      if (values.type === "coupon") {
        payload.couponCode = values.couponCode;
        if (values.couponDiscountPct) payload.couponDiscountPct = values.couponDiscountPct;
        if (values.couponExpiresAt) payload.couponExpiresAt = new Date(values.couponExpiresAt).toISOString();
      }

      await createProduct.mutateAsync({ data: payload });

      toast({
        title: t("sell.successTitle"),
        description: t("sell.successDesc"),
      });

      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });

      setLocation("/inventory");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("sell.errorTitle");
      toast({
        variant: "destructive",
        title: t("sell.errorTitle"),
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight">{t("sell.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("sell.subtitle")}</p>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardContent className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm">1</span>
                  {t("sell.typeLabel")}
                </h3>
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <RadioGroupItem value="item" id="type-item" className="peer sr-only" />
                                <Label
                                  htmlFor="type-item"
                                  className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                >
                                  <Package className="mb-2 h-6 w-6" />
                                  <span className="font-semibold">{t("sell.item")}</span>
                                </Label>
                              </div>
                            </FormControl>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <RadioGroupItem value="coupon" id="type-coupon" className="peer sr-only" />
                                <Label
                                  htmlFor="type-coupon"
                                  className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                                >
                                  <Gift className="mb-2 h-6 w-6" />
                                  <span className="font-semibold">{t("sell.coupon")}</span>
                                </Label>
                              </div>
                            </FormControl>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm">2</span>
                  {t("common.item")}
                </h3>
                
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("sell.titleField")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("sell.titlePlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("sell.category")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("sell.categoryPlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("sell.stock")}</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("sell.description")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("sell.descriptionPlaceholder")}
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          {t("sell.imageUrl")}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder={t("sell.imageUrlPlaceholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {type === "coupon" && (
                <div className="space-y-4 p-4 bg-secondary/20 rounded-2xl border border-secondary/30">
                  <h3 className="font-bold flex items-center gap-2 text-secondary-foreground">
                    <Gift className="w-4 h-4" />
                    {t("sell.couponSection")}
                  </h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="couponCode"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>{t("sell.couponCode")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("sell.couponCodePlaceholder")} className="font-mono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="couponDiscountPct"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("sell.couponDiscount")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type="number" min="1" max="100" placeholder="20" {...field} />
                              <span className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="couponExpiresAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("sell.couponExpiry")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm">3</span>
                  {t("sell.price")}
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border border-border/50">
                  <FormField
                    control={form.control}
                    name="pointPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-bold">{t("sell.price")} *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hexagon className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 fill-primary text-primary" />
                            <Input 
                              type="number" 
                              min="1" 
                              className="pl-10 rtl:pl-3 rtl:pr-10 text-lg font-bold bg-background border-primary/50" 
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
                    name="cashPriceCents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">{t("sell.cashPrice")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              placeholder={t("sell.cashPricePlaceholder")}
                              className="pl-8 rtl:pl-3 rtl:pr-8 bg-background" 
                              value={field.value ? Number(field.value) / 100 : ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val ? Math.round(parseFloat(val) * 100) : "");
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>{t("sell.cashPrice")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full text-lg h-14 rounded-xl shadow-md hover-elevate font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2 rtl:mr-0 rtl:ml-2" />
                ) : (
                  <PlusCircle className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                )}
                {isSubmitting ? t("sell.submitting") : t("sell.submit")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
