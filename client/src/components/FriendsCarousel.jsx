import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const FriendsCarousel = ({ children, itemsPerView = 2 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const carouselRef = useRef(null);
  const containerRef = useRef(null);

  const totalItems = children.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView);

  // Handle next button
  const handleNext = () => {
    if (!isAnimating && currentIndex < maxIndex) {
      setIsAnimating(true);
      setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Handle previous button
  const handlePrev = () => {
    if (!isAnimating && currentIndex > 0) {
      setIsAnimating(true);
      setCurrentIndex(prev => Math.max(prev - 1, 0));
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Handle mouse down (start drag)
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  // Handle touch start
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
  };

  // Handle mouse move (drag)
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStart;
    setDragOffset(diff);
  };

  // Handle touch move
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - dragStart;
    setDragOffset(diff);
  };

  // Handle mouse up (end drag)
  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    handleDragEnd();
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    handleDragEnd();
  };

  // Process drag end
  const handleDragEnd = () => {
    const threshold = 50;
    if (dragOffset > threshold && currentIndex > 0) {
      handlePrev();
    } else if (dragOffset < -threshold && currentIndex < maxIndex) {
      handleNext();
    }
    setDragOffset(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, maxIndex, isAnimating]);

  const slideWidth = 100 / itemsPerView;
  const baseTranslate = -(currentIndex * slideWidth);
  const dragTranslate = (dragOffset / (containerRef.current?.offsetWidth || 1)) * 100;
  const translateX = baseTranslate + dragTranslate;

  return (
    <div className="relative w-full py-4">
      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="overflow-x-hidden mx-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={carouselRef}
          className={`flex ${isDragging ? "" : "transition-transform duration-300 ease-out"} cursor-grab active:cursor-grabbing`}
          style={{
            transform: `translateX(${translateX}%)`,
            gap: '1rem',
          }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              style={{
                flex: `0 0 calc((100% - ${(itemsPerView - 1) * 16}px) / ${itemsPerView})`,
                minWidth: 0,
              }}
            >
              <div className="h-full">
                {child}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {totalItems > itemsPerView && (
        <>
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || isAnimating}
            className={`absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full transition-all duration-200 ${
              currentIndex === 0
                ? "bg-base-300 text-base-content/30 cursor-not-allowed"
                : "bg-primary text-primary-content hover:bg-primary/90 shadow-lg hover:shadow-xl"
            }`}
            aria-label="Previous"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentIndex === maxIndex || isAnimating}
            className={`absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full transition-all duration-200 ${
              currentIndex === maxIndex
                ? "bg-base-300 text-base-content/30 cursor-not-allowed"
                : "bg-primary text-primary-content hover:bg-primary/90 shadow-lg hover:shadow-xl"
            }`}
            aria-label="Next"
            title="Next"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-3 sm:mt-4">
            {Array.from({ length: Math.ceil(totalItems / itemsPerView) }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAnimating(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsAnimating(false), 300);
                }}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary w-6 sm:w-8"
                    : "bg-base-300 w-1.5 sm:w-2 hover:bg-base-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
                title={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Info text for mobile */}
      <div className="text-center text-xs text-base-content/50 mt-2 sm:hidden">
        Swipe left or right to browse
      </div>
    </div>
  );
};

export default FriendsCarousel;
