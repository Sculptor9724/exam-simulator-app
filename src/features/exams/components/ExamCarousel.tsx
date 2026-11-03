import React, { useRef, useState, useEffect } from "react";
import { ExamSimulator } from "../../../shared/contexts/ExamSimulatorContext";
import ExamCardCompact from "./ExamCardCompact";

interface ExamCarouselProps {
  title: string;
  icon: React.ReactNode;
  exams: ExamSimulator[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  getClassTitle?: (examId: string) => string | undefined;
  completedExamIds?: Set<string>;
  isOwner?: boolean;
  currentUserId?: string;
  onCopyLink?: (message: string) => void;
}

export default function ExamCarousel({
  title,
  icon,
  exams,
  isLoading = false,
  emptyMessage = "Ingen eksamener fundet",
  emptyIcon,
  getClassTitle,
  completedExamIds,
  isOwner = false,
  currentUserId,
  onCopyLink,
}: ExamCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft <
          container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      window.addEventListener("resize", checkScrollButtons);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScrollButtons);
      }
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, [exams]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 md:w-80 h-52 md:h-56 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Hide section when empty instead of showing empty state
  if (exams.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 relative group/carousel">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <span className="text-sm text-gray-400">({exams.length})</span>
      </div>

      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 mt-4 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-gray-50 border border-gray-200"
          aria-label="Scroll left"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 mt-4 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-gray-50 border border-gray-200"
          aria-label="Scroll right"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Cards container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {exams.map((exam) => {
          // Determine ownership: use isOwner prop OR check if currentUserId matches exam.user_id
          const examIsOwned =
            isOwner || (currentUserId ? exam.user_id === currentUserId : false);
          return (
            <ExamCardCompact
              key={exam.id}
              exam={exam}
              classTitle={getClassTitle?.(exam.id)}
              showStatistics={completedExamIds?.has(String(exam.id))}
              isOwner={examIsOwned}
              onCopyLink={onCopyLink}
            />
          );
        })}
      </div>
    </div>
  );
}
