import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ItemDetailSkeleton() {
  return (
    <div className="min-h-screen px-4 py-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Skeleton className="h-6 w-32" />
      <div className="grid md:grid-cols-2 gap-6">
        {/* Image Gallery */}
        <div className="space-y-3">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-4">
          <div>
            <Skeleton className="h-9 w-3/4 mb-3" />
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          
          {/* Owner Card */}
          <Card className="bg-blue-50/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Description */}
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-3.5 w-full mb-1.5" />
            <Skeleton className="h-3.5 w-full mb-1.5" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
          
          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          
          {/* Location */}
          <Skeleton className="h-16 rounded-lg" />
          
          {/* CTA */}
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

