"use client";

import { useState, useRef, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Gift, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    description?: string;
    category: string;
    images?: string[];
    town: string;
    region: string;
    condition: string;
    status: string;
    created_at?: string;
    conversation_count?: number;
  };
}

export const ItemCard = memo(function ItemCard({ item }: ItemCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const images = item.images && item.images.length > 0 ? item.images : [];
  const hasMultipleImages = images.length > 1;

  // Handle swipe gestures
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasMultipleImages) {
      handleNextImage();
    }
    if (isRightSwipe && hasMultipleImages) {
      handlePrevImage();
    }
  }, [touchStart, touchEnd, hasMultipleImages, handleNextImage, handlePrevImage]);

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      new: "New",
      like_new: "Like New",
      good: "Good",
      fair: "Fair",
    };
    return labels[condition] || condition;
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      new: "bg-emerald-100 text-emerald-700",
      like_new: "bg-blue-100 text-blue-700",
      good: "bg-amber-100 text-amber-700",
      fair: "bg-gray-100 text-gray-700",
    };
    return colors[condition] || "bg-gray-100 text-gray-700";
  };

  return (
    <Link href={`/items/${item.id}`} className="block">
      <Card className="group hover:border-primary/50 transition-colors cursor-pointer overflow-hidden bg-card border border-border shadow-subtle">
      {/* Image Section */}
      <div
        ref={imageContainerRef}
        className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {images.length > 0 ? (
          <>
            <Image
              src={images[currentImageIndex]}
              alt={item.title}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={currentImageIndex === 0}
            />
            {/* Navigation Arrows - Desktop Only */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Gift className="w-16 h-16 text-gray-300" />
            </div>
          )}

        {/* Status Badge - Top Left */}
        <div className="absolute top-3 left-3 z-10">
            <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.status === "available"
                  ? "bg-green-500 text-white"
                  : item.status === "reserved"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-500 text-white"
              }`}
            >
              {item.status === "available"
                ? "Available"
                : item.status === "reserved"
                ? "Requested"
              : "Given"}
            </span>
        </div>

        {/* Progress Dots - Bottom Center */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`transition-all ${
                  index === currentImageIndex
                    ? "w-2 h-2 bg-primary rounded-full"
                    : "w-2 h-2 bg-white/60 rounded-full hover:bg-white/80"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
        </div>

      {/* Product Details Section */}
      <CardContent className="p-4">
        {/* Category Tag, Condition, and Request Count */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {item.category}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(item.condition)}`}>
              {getConditionLabel(item.condition)}
            </span>
            {item.conversation_count !== undefined && item.conversation_count > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-50 text-pink-700 text-xs font-medium rounded-full">
                <MessageSquare className="w-3 h-3" />
                {item.conversation_count}
              </span>
            )}
          </div>
          </div>

          {/* Title */}
        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-foreground leading-tight">
            {item.title}
          </h3>

          {/* Location */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">
              {item.town}, {item.region}
            </span>
          </div>
          </div>

        {/* Action Button */}
        <Button 
          className="w-auto rounded-[24px] bg-foreground text-background hover:bg-foreground/90 font-medium"
          onClick={(e) => {
            // Allow button click to navigate
            e.stopPropagation();
          }}
        >
          View Details
        </Button>
        </CardContent>
      </Card>
    </Link>
  );
});
