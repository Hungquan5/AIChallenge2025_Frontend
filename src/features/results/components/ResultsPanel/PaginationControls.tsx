// src/features/results/components/PaginationControls.tsx (NEW FILE)

import React from 'react';

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

  return (
    <div className="flex items-center justify-center gap-1 my-1">
      <span className="text-sm font-bold text-slate-700 bg-slate-100 rounded-md px-4 py-2">
        Page {currentPage}
      </span>
    </div>
  );
};

export default PaginationControls;