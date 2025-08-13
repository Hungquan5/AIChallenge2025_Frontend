// src/features/results/components/PaginationControls.tsx (NEW FILE)

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  onPageChange: (newPage: number) => void;
  // To disable the "Next" button if we know we're on the last page
  hasNextPage: boolean; 
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  onPageChange,
  hasNextPage,
}) => {
  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNextPage) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 my-4">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 bg-white rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
        Prev
      </button>

      <span className="text-sm font-bold text-slate-700 bg-slate-100 rounded-md px-4 py-2">
        Page {currentPage}
      </span>

      <button
        onClick={handleNext}
        disabled={!hasNextPage}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 bg-white rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PaginationControls;