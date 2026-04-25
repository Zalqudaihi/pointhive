import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetCurrentUser,
  useListProducts, 
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Hexagon, 
  Gift, 
  ShoppingBag, 
  MoreVertical,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  Loader2,
  Package
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Inventory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const { data: user } = useGetCurrentUser();
  
  const { data: products, isLoading } = useListProducts({
    sellerId: user?.id
  }, {
    query: {
      queryKey: getListProductsQueryKey({ sellerId: user?.id }),
      enabled: !!user?.id
    }
  });

  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'draft' : 'active';
      await updateProduct.mutateAsync({ 
        id, 
        data: { status: newStatus as any } 
      });
      
      toast({
        title: "Listing updated",
        description: `Your listing is now ${newStatus}.`,
      });
      
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: err?.message || "Could not update the listing.",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteProduct.mutateAsync({ id: deleteId });
      
      toast({
        title: "Listing deleted",
        description: "Your listing has been permanently removed.",
      });
      
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: err?.message || "Could not delete the listing.",
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Your Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your active listings and drafts.</p>
        </div>
        <Link href="/sell">
          <Button className="hover-elevate">Create Listing</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : products?.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-1">No listings yet</h3>
          <p className="text-muted-foreground mb-6">You haven't posted anything for sale.</p>
          <Link href="/sell">
            <Button>Create your first listing</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products?.map(product => (
            <Card key={product.id} className={`overflow-hidden transition-all ${product.status === 'draft' ? 'opacity-75 grayscale-[0.2]' : ''}`}>
              <div className="flex">
                <div className="w-1/3 aspect-square bg-muted relative shrink-0">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                      {product.type === 'coupon' ? <Gift className="w-8 h-8 text-muted-foreground" /> : <ShoppingBag className="w-8 h-8 text-muted-foreground" />}
                    </div>
                  )}
                  {product.status !== 'active' && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="secondary" className="font-bold uppercase tracking-wider">{product.status}</Badge>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-bold truncate" title={product.title}>{product.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 -mt-2 h-8 w-8 shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/marketplace/${product.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="w-4 h-4 mr-2" /> View Public
                          </DropdownMenuItem>
                        </Link>
                        {product.status !== 'sold' && (
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleToggleStatus(product.id, product.status)}
                          >
                            {product.status === 'active' ? (
                              <><EyeOff className="w-4 h-4 mr-2" /> Unpublish</>
                            ) : (
                              <><Eye className="w-4 h-4 mr-2" /> Publish</>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-auto">
                    Stock: {product.stock}
                  </div>
                  
                  <div className="mt-3 font-bold text-primary flex items-center gap-1">
                    <Hexagon className="w-4 h-4 fill-primary" />
                    {product.pointPrice.toLocaleString()} pts
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove your listing from the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}