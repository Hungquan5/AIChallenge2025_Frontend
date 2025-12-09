import React, { useEffect, } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

// Define the structure of a submission result
interface SubmissionResult {
  submission: 'CORRECT' | 'WRONG' | 'INDETERMINATE' | 'DUPLICATE' | 'ERROR';
  description: string;
  username?: string; // Optional: who submitted it
}

interface SubmissionStatusPanelProps {
  result: SubmissionResult;
  onClose: () => void;
}

// Helper to get styling based on submission status
const getStatusStyle = (status: SubmissionResult['submission']) => {
  switch (status) {
    case 'CORRECT':
      return {
        Icon: CheckCircle2,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-400',
        textColor: 'text-green-800',
        iconColor: 'text-green-500',
      };
    case 'WRONG':
      return {
        Icon: XCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-400',
        textColor: 'text-red-800',
        iconColor: 'text-red-500',
      };
    case 'INDETERMINATE':
    case 'DUPLICATE':
       return {
        Icon: AlertTriangle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-400',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-500',
      };
    default: // ERROR or other cases
      return {
        Icon: Info,
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-400',
        textColor: 'text-gray-800',
        iconColor: 'text-gray-500',
      };
  }
};


const SubmissionStatusPanel: React.FC<SubmissionStatusPanelProps> = ({ result, onClose }) => {
  // Auto-close the panel after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const { Icon, bgColor, borderColor, textColor, iconColor } = getStatusStyle(result.submission);

  return (
    <div 
      className={`fixed bottom-5 right-5 w-80 max-w-sm p-4 border rounded-lg shadow-2xl z-50 transform transition-all duration-300 ease-in-out animate-slide-in-right ${bgColor} ${borderColor}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className={`text-sm font-bold ${textColor}`}>
            Submission: {result.submission}
          </p>
          <p className={`mt-1 text-sm ${textColor}`}>
            {result.description}
          </p>
          {result.username && (
            <p className={`mt-2 text-xs font-medium text-gray-500`}>
              Submitted by: {result.username}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className={`inline-flex rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${textColor} hover:bg-black/10`}
          >
            <span className="sr-only">Close</span>
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionStatusPanel;