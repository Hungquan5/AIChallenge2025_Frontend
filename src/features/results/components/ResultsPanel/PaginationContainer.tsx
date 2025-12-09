import React from 'react';
import PaginationControls from './PaginationControls';

interface Props {
  currentPage: number;
  onPageChange: (newPage: number) => void;
  hasNextPage: boolean;
  totalResults: number;
}

const PaginationContainer: React.FC<Props> = ({
  currentPage,
  onPageChange,
  hasNextPage,
  totalResults,
}) => {
  // This logic is now isolated here.
  // This small component is the only thing that will re-render on search.
  if (totalResults > 0 || currentPage > 1) {
    return (
      <PaginationControls
        currentPage={currentPage}
        onPageChange={onPageChange}
        hasNextPage={hasNextPage}
      />
    );
  }

  return null; // Render nothing if there are no results on page 1
};

export default React.memo(PaginationContainer);