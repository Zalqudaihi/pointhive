import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetCurrentUser, 
  useUpdateCurrentUser, 
  getGetCurrentUserQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Hexagon, Save, Loader2, Camera, UserCircle } from "lucide-react";
import { format } from "date-fns";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(160, "Bio must be under 160 characters").optional().or(z.literal("")),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: user, isLoading } = useGetCurrentUser();
  const updateProfile = useUpdateCurrentUser();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      bio: "",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, form]);

  const onSubmit = async (values: ProfileValues) => {
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        data: {
          name: values.name,
          bio: values.bio || null,
          avatarUrl: values.avatarUrl || null,
        },
      });

      toast({
        title: "Profile updated",
        description: "Your profile changes have been saved.",
      });

      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error?.message || "Could not save your profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentAvatarUrl = form.watch("avatarUrl");
  const currentName = form.watch("name");

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your public identity on the hive.</p>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary/40 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
        </div>
        <CardContent className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 mb-8">
            <Avatar className="w-24 h-24 border-4 border-background shadow-md">
              <AvatarImage src={currentAvatarUrl || ""} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {currentName ? currentName.charAt(0).toUpperCase() : <UserCircle className="w-10 h-10" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-2">
              <h2 className="text-2xl font-bold leading-none mb-1">{user.name}</h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
            
            <div className="pb-2 shrink-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold">
                <Hexagon className="w-5 h-5 fill-primary" />
                <span className="text-lg">{user.pointsBalance.toLocaleString()} pts</span>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell the hive a bit about yourself..." 
                          className="resize-none"
                          maxLength={160}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="flex justify-between">
                        <span>A short description for your public profile.</span>
                        <span>{field.value?.length || 0}/160</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-muted-foreground" />
                        Avatar URL
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-border/50">
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto h-12 px-8 rounded-xl shadow-md hover-elevate font-bold"
                  disabled={isSaving || !form.formState.isDirty}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                
                <div className="text-xs text-muted-foreground ml-auto">
                  Member since {format(new Date(user.createdAt), "MMMM yyyy")}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}