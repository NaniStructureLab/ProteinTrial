import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  title?: string;
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Retrieving database records...',
  message = 'Querying authoritative biological databases via live REST API.',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center my-4"
    >
      <Loader2 className="w-8 h-8 text-[#0B57D0] animate-spin mb-3" />
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md">{message}</p>
    </div>
  );
};
