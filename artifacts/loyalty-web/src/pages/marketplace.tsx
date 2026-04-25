import { useState } from "react";
import { Link } from "wouter";
import { useListProducts, useListProductCategories } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Hexagon, Filter, Tag, Gift, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"item" | "coupon" | null>(null);

  const { data: categories, isLoading: loadingCategories } = useListProductCategories();
  
  const { data: products, isLoading: loadingProducts } = useListProducts({
    search: search || undefined,
    category: activeCategory || undefined,
    type: activeType || undefined,
    status: 'active'
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Discover items and coupons from the community.</p>
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search marketplace..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Type
            </h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveType(null)}
                className={`text-left px-3 py-2 text-sm rounded-lg transition-colors ${activeType === null ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-muted-foreground'}`}
              >
                All Types
              </button>
              <button 
                onClick={() => setActiveType('item')}
                className={`text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${activeType === 'item' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <div className="flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Items</div>
              </button>
              <button 
                onClick={() => setActiveType('coupon')}
                className={`text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${activeType === 'coupon' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <div className="flex items-center gap-2"><Gift className="w-4 h-4" /> Coupons</div>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              Categories
            </h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveCategory(null)}
                className={`text-left px-3 py-2 text-sm rounded-lg transition-colors ${activeCategory === null ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-muted-foreground'}`}
              >
                All Categories
              </button>
              
              {loadingCategories ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-lg" />
                ))
              ) : (
                categories?.map(c => (
                  <button 
                    key={c.category}
                    onClick={() => setActiveCategory(c.category)}
                    className={`text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${activeCategory === c.category ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-muted-foreground'}`}
                  >
                    <span className="truncate">{c.category}</span>
                    <Badge variant="secondary" className="font-normal bg-background/50">{c.count}</Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : products?.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-1">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
              {(search || activeCategory || activeType) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory(null);
                    setActiveType(null);
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products?.map((product) => (
                <Link key={product.id} href={`/marketplace/${product.id}`}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer group h-full flex flex-col border-border/50">
                    <div className="aspect-[4/3] w-full bg-muted relative overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/20 text-secondary-foreground/30">
                          {product.type === 'coupon' ? <Gift className="w-12 h-12" /> : <ShoppingBag className="w-12 h-12" />}
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 backdrop-blur-md text-xs font-bold rounded-full uppercase tracking-wider shadow-sm ${
                          product.type === 'coupon' 
                            ? 'bg-secondary/90 text-secondary-foreground' 
                            : 'bg-background/90 text-foreground'
                        }`}>
                          {product.type}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">{product.category}</div>
                      <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors leading-tight">{product.title}</h3>
                      
                      <div className="flex items-center gap-2 mt-3 mb-4">
                        <Avatar className="w-6 h-6 border">
                          <AvatarImage src={product.sellerAvatarUrl || ""} />
                          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">{product.sellerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate font-medium">{product.sellerName}</span>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-black text-xl text-foreground">
                          <Hexagon className="w-5 h-5 fill-primary text-primary" />
                          {product.pointPrice.toLocaleString()}
                        </div>
                        {product.cashPriceCents && (
                          <div className="text-sm font-medium text-muted-foreground">
                            ${(product.cashPriceCents / 100).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}