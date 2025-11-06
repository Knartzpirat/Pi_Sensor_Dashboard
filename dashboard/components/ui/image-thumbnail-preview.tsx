'use client';

import * as React from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from './dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from './carousel';
import AutoHeight from 'embla-carousel-auto-height';

interface ImageData {
  id: string;
  url: string;
  order: number;
}

interface ImageThumbnailPreviewProps {
  images: ImageData[];
  title: string;
  thumbnailSize?: number;
  currentLabel?: string;
  ofLabel?: string;
}

/**
 * Reusable thumbnail preview component with image carousel dialog
 */
export function ImageThumbnailPreview({
  images,
  title,
  thumbnailSize = 48,
  currentLabel = 'Bild',
  ofLabel = 'von',
}: ImageThumbnailPreviewProps) {
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const [imagesLoaded, setImagesLoaded] = React.useState(0);

  React.useEffect(() => {
    if (!carouselApi) return;

    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap() + 1);

    carouselApi.on('select', () => {
      setCurrent(carouselApi.selectedScrollSnap() + 1);
    });
  }, [carouselApi]);

  // Reinit carousel when images are loaded
  React.useEffect(() => {
    if (carouselApi && imagesLoaded > 0) {
      carouselApi.reInit();
    }
  }, [carouselApi, imagesLoaded]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setImagesLoaded(0);
      setCurrent(0);
    }
  }, [isOpen]);

  const handleImageLoad = React.useCallback(() => {
    setImagesLoaded((prev) => prev + 1);
  }, []);

  if (!images || images.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-md border bg-muted/50"
        style={{ height: thumbnailSize, width: thumbnailSize }}
      >
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  const thumbnailUrl = images[0].url;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center justify-center rounded-md border bg-muted/50 cursor-pointer hover:ring-2 hover:ring-ring transition-all"
          style={{ height: thumbnailSize, width: thumbnailSize }}
        >
          <Image
            src={thumbnailUrl}
            alt={title}
            width={thumbnailSize}
            height={thumbnailSize}
            className="h-full w-full rounded-md object-cover"
            unoptimized
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {images.length === 1 ? (
          <div className="flex items-center justify-center">
            <Image
              src={images[0].url}
              alt={title}
              width={800}
              height={800}
              className="rounded-md object-contain max-h-[70vh]"
              unoptimized
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Carousel
              setApi={setCarouselApi}
              className="w-full"
              plugins={[AutoHeight()]}
              opts={{ watchDrag: true }}
            >
              <CarouselContent className="items-center">
                {images.map((image, index) => (
                  <CarouselItem
                    key={image.id}
                    className="flex items-center justify-center"
                  >
                    <Image
                      src={image.url}
                      alt={`${title} - ${currentLabel} ${index + 1}`}
                      width={800}
                      height={800}
                      className="rounded-md object-contain max-h-[70vh] w-auto h-auto"
                      unoptimized
                      onLoad={handleImageLoad}
                      priority={index === 0}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            <div className="text-center text-sm text-muted-foreground">
              {currentLabel} {current} {ofLabel} {count}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
