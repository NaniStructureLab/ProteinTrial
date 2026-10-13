import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  technicalDetail?: string | null;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Database Retrieval Issue',
  message,
  technicalDetail,
  onRetry,
}) => {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div
      role="alert"
      className="bg-rose-50/70 border border-rose-200 rounded-xl p-5 my-4 text-slate-900"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-rose-950">{title}</h3>
            <p className="text-sm text-rose-900 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Request
          </button>
        )}
      </div>

      {technicalDetail && (
        <div className="mt-3 pt-3 border-t border-rose-200/80">
          <button
            type="button"
            onClick={() => setShowTechnical((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-800 hover:text-rose-950 cursor-pointer"
          >
            {showTechnical ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Hide technical diagnostic details
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Show technical diagnostic details
              </>
            )}
          </button>
          {showTechnical && (
            <pre className="mt-2 p-3 bg-white border border-rose-200 rounded-lg text-xs font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
              {technicalDetail}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
