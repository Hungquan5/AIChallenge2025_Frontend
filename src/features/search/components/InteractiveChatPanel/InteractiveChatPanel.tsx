import React, { useState, useEffect } from 'react';
import { Loader2, Zap } from 'lucide-react';
import type { Query } from '../../types';

interface InteractiveChatPanelProps {
  queryToParaphrase: { query: Query; index: number } | null;
  onApplyParaphrase: (text: string, index: number) => void;
  onClose: () => void;
}

const InteractiveChatPanel: React.FC<InteractiveChatPanelProps> = ({
  queryToParaphrase,
  onApplyParaphrase,
  onClose,
}) => {
  const [paraphrases, setParaphrases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (queryToParaphrase) {
      const fetchParaphrases = async () => {
        setIsLoading(true);
        try {
          // This is where you would make the API call to your backend
          const response = await fetch('/api/paraphrase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: queryToParaphrase.query.text || queryToParaphrase.query.origin }),
          });
          if (!response.ok) {
            throw new Error('Failed to fetch paraphrases');
          }
          const data = await response.json();
          setParaphrases(data);
        } catch (error) {
          console.error('Error fetching paraphrases:', error);
          setParaphrases([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchParaphrases();
    }
  }, [queryToParaphrase]);

  if (!queryToParaphrase) {
    return null;
  }

  return (
    <div className="relative p-4 mt-4 border-t border-slate-200">
      <button onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600">
        &times;
      </button>
      <h3 className="text-lg font-semibold mb-2">Suggestions for: "{queryToParaphrase.query.text || queryToParaphrase.query.origin}"</h3>
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <ul className="space-y-2">
          {paraphrases.map((phrase, i) => (
            <li key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
              <span>{phrase}</span>
              <button
                onClick={() => onApplyParaphrase(phrase, queryToParaphrase.index)}
                className="flex items-center px-2 py-1 text-xs font-semibold text-white bg-emerald-500 rounded-md hover:bg-emerald-600"
              >
                <Zap className="w-4 h-4 mr-1" />
                Apply
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InteractiveChatPanel;