import React from 'react';
import { containerClass, labelClass, inputClass } from './styles';

interface QueryListProps {
  queries: string[];
  onQueriesChange: (queries: string[]) => void;
  maxQueries?: number;  // Optional maximum number of queries
}

const QueryList: React.FC<QueryListProps> = ({ queries, onQueriesChange, maxQueries }) => {
  const handleQueryChange = (index: number, value: string) => {
    const newQueries = [...queries];
    newQueries[index] = value;
    onQueriesChange(newQueries);
  };

  const addQuery = () => {
    if (maxQueries && queries.length >= maxQueries) {
      return; // Don't add more queries if we've reached the maximum
    }
    onQueriesChange([...queries, '']);
  };

  const removeQuery = (index: number) => {
    const newQueries = queries.filter((_, i) => i !== index);
    onQueriesChange(newQueries);
  };

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-2">
        <label className={labelClass}>Search Queries</label>
        {(!maxQueries || queries.length < maxQueries) && (
          <button
            onClick={addQuery}
            className="px-2 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            type="button"
          >
            Add Query
          </button>
        )}
      </div>
      <div className="space-y-2">
        {queries.map((query, index) => (
          <div key={index} className="flex gap-2">
            <textarea
              value={query}
              onChange={(e) => handleQueryChange(index, e.target.value)}
              placeholder={maxQueries === 1 ? "Enter search text..." : `Query ${index + 1}...`}
              className={`${inputClass} h-16 resize-none flex-1`}
            />
            {queries.length > 1 && (
              <button
                onClick={() => removeQuery(index)}
                className="px-2 self-start text-gray-400 hover:text-red-500"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueryList; 