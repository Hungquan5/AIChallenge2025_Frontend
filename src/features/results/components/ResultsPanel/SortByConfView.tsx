  // src/features/results/components/SortedByConfidenceView.tsx
  import React, { useState, useCallback, useMemo } from 'react';
  import type { ResultItem } from '../../types';
  import {
    gridClass,
    noResultsClass,
    noResultsHintClass,
    noResultsTitleClass,
    imageClass
  } from './styles';
  import ResultCard from './ResultCard';
  interface Props {
    results: ResultItem[];
  // ✅ The signatures of these handlers should match what ResultCard expects
  onResultClick: (item: ResultItem) => void;
  onRightClick: (item: ResultItem, event: React.MouseEvent) => void;
  onSimilaritySearch: (imageSrc: string, cardId: string) => void;
  onResultDoubleClick: (item: ResultItem) => void;
  onSubmission: (item: ResultItem) => void; // This prop is already correct
  onDislike: (item: ResultItem) => void;
    // --- NEW PROPS ---
    currentUser: string; // The name of the current user for broadcasting
    sendMessage: (message: string) => void; // WebSocket send function
  // Change the function signature
    submissionStatuses: { [key: string]: string }; // --- NEW PROP ---
    optimisticSubmissions: Set<string>; // Add new prop
  }


  // ✅ FIX 1: Destructure `onSimilaritySearch` from the component's props
  const SortedByConfidenceView: React.FC<Props> = ({
    results,
    onResultClick,
    onRightClick,
    onSimilaritySearch,
    currentUser, // Destructure new prop
    sendMessage, // Destructure new prop
    onResultDoubleClick,
    onSubmission,
    submissionStatuses, // --- Destructure the new prop ---
    optimisticSubmissions,
    onDislike
  }) => {
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

    const sorted = useMemo(() => [...results].sort((a, b) => b.confidence - a.confidence), [results]);

    const handleImageLoad = useCallback((id: string) => {
      setLoadedImages(prev => new Set([...prev, id]));
    }, []);
    // ✅ FIX: This handler now sends a complete and consistent ResultItem payload
    // ✅ This handler now expects to receive the item from the child
  const handleSending = useCallback((item: ResultItem) => {
    const message = {
      type: 'broadcast_image',
      payload: { ...item, submittedBy: currentUser },
    };
    sendMessage(JSON.stringify(message));
  }, [currentUser, sendMessage]);


    if (results.length === 0) {
      return (
        <div className={noResultsClass}>
          <p className={noResultsTitleClass}>No results found</p>
          <p className={noResultsHintClass}>Try adjusting your search terms</p>
        </div>
      );
    }
    return (
      <div className={gridClass}>
        {sorted.map(item => {
          // ✅ Combined check for disabled status
          const isDisabledByServer = !!submissionStatuses[item.thumbnail];
          const isDisabledOptimistically = optimisticSubmissions.has(item.thumbnail);
          return (
            <ResultCard
            key={item.id}
            item={item}
            loaded={loadedImages.has(item.id)}
            onLoad={handleImageLoad}
            
            // ✅ FIX #1: Pass the handler directly. No more arrow function.
            onClick={onResultClick}
            
            // ✅ FIX #2: Pass the handler directly.
            onContextMenu={onRightClick}
            
            onSimilaritySearch={onSimilaritySearch}
            onSubmit={onSubmission}
            
            // ✅ FIX #3: Pass the handler directly.
            onSending={handleSending}
            
            imageClassName={imageClass}
            onDoubleClick={onResultDoubleClick}
            disabled={isDisabledByServer || isDisabledOptimistically}
            onDislike={onDislike}
          />
        );
      })}
    </div>
  );
  };

  export default React.memo(SortedByConfidenceView);