import type { ResultItem } from "../features/results/types";
// ✅ 1. IMPORT THE CORRECT TYPE: This is the object structure our app state now uses.
import type { GroupedResultsObject } from "../hooks/useAppState";

// This list of mock results is perfect and does not need to be changed.
export const mockResults: ResultItem[] = [
  {
    id: 'mock-1',
    videoId: 'L21_V013',
    title: 'L21_V013 - 152',
    thumbnail: 'https://picsum.photos/seed/L21V013_1/300/200',
    confidence: 0.985,
    timestamp: '152',
  },
  {
    id: 'mock-2',
    videoId: 'L20_V001',
    title: 'L20_V001 - 345',
    thumbnail: 'https://picsum.photos/seed/L20V001_1/300/200',
    confidence: 0.851,
    timestamp: '345',
  },
  {
    id: 'mock-3',
    videoId: 'L21_V013',
    title: 'L21_V013 - 088',
    thumbnail: 'https://picsum.photos/seed/L21V013_2/300/200',
    confidence: 0.992,
    timestamp: '088',
  },
  {
    id: 'mock-4',
    videoId: 'L22_V007',
    title: 'L22_V007 - 1201',
    thumbnail: 'https://picsum.photos/seed/L22V007_1/300/200',
    confidence: 0.976,
    timestamp: '1201',
  },
  {
    id: 'mock-5',
    videoId: 'L20_V001',
    title: 'L20_V001 - 512',
    thumbnail: 'https://picsum.photos/seed/L20V001_2/300/200',
    confidence: 0.783,
    timestamp: '512',
  },
  {
    id: 'mock-6',
    videoId: 'L21_V013',
    title: 'L21_V013 - 918',
    thumbnail: 'https://picsum.photos/seed/L21V013_3/300/200',
    confidence: 0.914,
    timestamp: '918',
  },
  {
    id: 'mock-7',
    videoId: 'L22_V007',
    title: 'L22_V007 - 250',
    thumbnail: 'https://picsum.photos/seed/L22V007_2/300/200',
    confidence: 0.899,
    timestamp: '250',
  },
  {
    id: 'mock-8',
    videoId: 'L20_V001',
    title: 'L20_V001 - 1122',
    thumbnail: 'https://picsum.photos/seed/L20V001_3/300/200',
    confidence: 0.932,
    timestamp: '1122',
  },
    {
    id: 'mock-9',
    videoId: 'L21_V013',
    title: 'L21_V013 - 42',
    thumbnail: 'https://picsum.photos/seed/L21V013_4/300/200',
    confidence: 0.810,
    timestamp: '42',
  },
];

// ✅ 2. THE FIX: Create the grouped version as an OBJECT, not an array.
export const mockGroupedResults: GroupedResultsObject = mockResults.reduce(
  (acc, item) => {
    const { videoId } = item;
    
    // If a group for this video doesn't exist yet, create an empty array for it.
    if (!acc[videoId]) {
      acc[videoId] = [];
    }
    
    // Add the current item to its group.
    acc[videoId].push(item);
    
    return acc;
  },
  {} as GroupedResultsObject // Start with an empty object as the accumulator.
);

// (Optional but recommended) Sort the items within each group by timestamp, just like before.
Object.values(mockGroupedResults).forEach(items => {
  items.sort((a, b) => parseInt(a.timestamp, 10) - parseInt(b.timestamp, 10));
});