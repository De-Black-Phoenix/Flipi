import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ItemCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-200">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-3">
        <Skeleton className="h-4 w-20 mb-1.5 rounded-full" />
        <Skeleton className="h-5 w-3/4 mb-1.5" />
        <Skeleton className="h-3 w-2/3 mb-2" />
        <Skeleton className="h-3 w-24 mb-1.5" />
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

