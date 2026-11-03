import React, { useState, useCallback, useMemo, useEffect } from "react";
import { ExamSimulator } from "../../../shared/contexts/ExamSimulatorContext";

export type FilterType =
  | "highlighted"
  | "classExams"
  | "public"
  | "short"
  | "medium"
  | "long";

// Duration thresholds in minutes
const DURATION_SHORT_MAX = 5;
const DURATION_MEDIUM_MAX = 15;

interface FilterChip {
  id: FilterType;
  label: string;
  icon: React.ReactNode;
}

const FILTER_CHIPS: FilterChip[] = [
  {
    id: "highlighted",
    label: "Fremhævet",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  },
  {
    id: "classExams",
    label: "Klasseeksamener",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    id: "public",
    label: "Offentlige",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      </svg>
    ),
  },
  {
    id: "short",
    label: "Kort (<5 min)",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: "medium",
    label: "Medium (5-15 min)",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: "long",
    label: "Lang (>15 min)",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export interface FilteredExams {
  highlighted: ExamSimulator[];
  classExams: ExamSimulator[];
  public: ExamSimulator[];
  userExams: ExamSimulator[];
}

export interface SectionVisibility {
  highlighted: boolean;
  classExams: boolean;
  public: boolean;
  myExams: boolean;
}

interface FilterChipsProps {
  highlightedExams: ExamSimulator[];
  classExams: ExamSimulator[];
  publicExams: ExamSimulator[];
  userExams: ExamSimulator[];
  showClassExams?: boolean;
  onFilteredExamsChange: (
    filtered: FilteredExams,
    showSection: SectionVisibility,
    hasActiveFilters: boolean
  ) => void;
}

export default function FilterChips({
  highlightedExams,
  classExams,
  publicExams,
  userExams,
  showClassExams = true,
  onFilteredExamsChange,
}: FilterChipsProps) {
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(
    new Set()
  );

  // Toggle filter on/off
  const handleFilterToggle = (filter: FilterType) => {
    setActiveFilters((prev) => {
      const newFilters = new Set(prev);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  };

  // Clear all filters
  const clearFilters = useCallback(() => {
    setActiveFilters(new Set());
  }, []);

  // Filter exams by duration
  const filterByDuration = useCallback(
    (exams: ExamSimulator[]): ExamSimulator[] => {
      const hasShort = activeFilters.has("short");
      const hasMedium = activeFilters.has("medium");
      const hasLong = activeFilters.has("long");

      // If no duration filters active, return all
      if (!hasShort && !hasMedium && !hasLong) {
        return exams;
      }

      return exams.filter((exam) => {
        const duration = exam.duration || 0;
        if (hasShort && duration > 0 && duration <= DURATION_SHORT_MAX)
          return true;
        if (
          hasMedium &&
          duration > DURATION_SHORT_MAX &&
          duration <= DURATION_MEDIUM_MAX
        )
          return true;
        if (hasLong && duration > DURATION_MEDIUM_MAX) return true;
        return false;
      });
    },
    [activeFilters]
  );

  // Compute which sections to show based on filters
  const showSection = useMemo((): SectionVisibility => {
    const categoryFilters = ["highlighted", "classExams", "public"] as const;
    const hasAnyCategoryFilter = categoryFilters.some((f) =>
      activeFilters.has(f)
    );

    return {
      highlighted: !hasAnyCategoryFilter || activeFilters.has("highlighted"),
      classExams: !hasAnyCategoryFilter || activeFilters.has("classExams"),
      public: !hasAnyCategoryFilter || activeFilters.has("public"),
      myExams: !hasAnyCategoryFilter, // Always show if no category filter
    };
  }, [activeFilters]);

  // Filtered exam lists
  const filteredExams = useMemo(
    (): FilteredExams => ({
      highlighted: filterByDuration(highlightedExams),
      classExams: filterByDuration(classExams),
      public: filterByDuration(publicExams),
      userExams: filterByDuration(userExams),
    }),
    [highlightedExams, classExams, publicExams, userExams, filterByDuration]
  );

  // Notify parent of filter changes - use primitive dependencies to avoid infinite loops
  const hasActiveFilters = activeFilters.size > 0;
  const filterKey = Array.from(activeFilters).sort().join(",");
  const examCounts = `${highlightedExams.length}-${classExams.length}-${publicExams.length}-${userExams.length}`;
  
  useEffect(() => {
    onFilteredExamsChange(filteredExams, showSection, hasActiveFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, examCounts]);

  const visibleChips = FILTER_CHIPS.filter(
    (chip) => chip.id !== "classExams" || showClassExams
  );

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">Filtre</p>
        {activeFilters.size > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ryd filtre
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleChips.map((chip) => {
          const isActive = activeFilters.has(chip.id);
          return (
            <button
              key={chip.id}
              onClick={() => handleFilterToggle(chip.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              {chip.icon}
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
