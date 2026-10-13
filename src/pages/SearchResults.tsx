import React from 'react';
import { SearchBar, ExampleProteinSpec } from '../components/SearchBar';
import { ProteinCard } from '../components/ProteinCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorMessage } from '../components/ErrorMessage';
import { NormalizedProteinRecord } from '../types/protein';

interface SearchResultsProps {
  queryUsed: string;
  results: NormalizedProteinRecord[];
  totalResults: number | null;
  isLoading: boolean;
  error: string | null;
  selectedAccession: string | null;
  onSearch: (params: { query: string; organism?: string; reviewedOnly?: boolean }) => void;
  onClearSearch: () => void;
  onSelectExample: (example: ExampleProteinSpec) => void;
  onSelectProtein: (record: NormalizedProteinRecord) => void;
  onAddToCompare: (record: NormalizedProteinRecord) => void;
  onRetry: () => void;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
  loadingMore?: boolean;
  verifiedExamplesStatus: Record<string, { verified: boolean; length?: number; checking?: boolean }>;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  queryUsed,
  results,
  totalResults,
  isLoading,
  error,
  selectedAccession,
  onSearch,
  onClearSearch,
  onSelectExample,
  onSelectProtein,
  onAddToCompare,
  onRetry,
  onLoadMore,
  canLoadMore = false,
  loadingMore = false,
  verifiedExamplesStatus,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-mono text-[#0B57D0] font-semibold">
          UNIPROTKB DATABASE RETRIEVAL
        </div>
        <h1 className="text-2xl font-bold text-slate-900 font-display mt-0.5">
          Protein Search & Record Selection
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Search by UniProtKB accession (e.g., <code className="font-mono">P01308</code>), protein
          name (e.g., <code className="font-mono">insulin</code>), or gene symbol. When multiple
          records match, review the organism and curation status below to select the intended record.
        </p>
      </div>

      <SearchBar
        initialQuery={queryUsed}
        onSearch={onSearch}
        onClear={onClearSearch}
        onSelectExample={onSelectExample}
        isLoading={isLoading}
        showAdvancedFilters={true}
        verifiedExamplesStatus={verifiedExamplesStatus}
      />

      {isLoading && (
        <LoadingState
          title="Querying UniProt REST API..."
          message={`Retrieving matching protein records for "${queryUsed || 'query'}"...`}
        />
      )}

      {!isLoading && error && (
        <ErrorMessage
          title="UniProt Database Request Failed"
          message="ProteinTrail could not complete the search due to a network or API error. This is a technical retrieval failure, not a 'no matching records' result."
          technicalDetail={error}
          onRetry={onRetry}
        />
      )}

      {!isLoading && !error && queryUsed && results.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <h3 className="text-base font-bold text-slate-900 font-display">
            No Matching Protein Records Found
          </h3>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mt-1.5 leading-relaxed">
            The UniProt REST API completed your query (<code className="font-mono">{queryUsed}</code>)
            successfully, but returned zero matching entries. Check the spelling of the protein name,
            verify the accession format, or remove restrictive organism filters.
          </p>
        </div>
      )}

      {!isLoading && !error && results.length > 0 && (
        <section aria-label="Matching protein records" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-slate-200 rounded-xl px-5 py-3.5">
            <div className="text-sm text-slate-700">
              Showing <strong className="font-mono font-bold text-slate-900">{results.length}</strong>
              {totalResults !== null && totalResults > results.length ? (
                <>
                  {' '}
                  of <strong className="font-mono text-slate-900">{totalResults.toLocaleString()}</strong>
                </>
              ) : null}{' '}
              matching UniProtKB record(s) for{' '}
              <code className="font-mono font-semibold text-[#0B57D0]">{queryUsed}</code>
            </div>
            <div className="text-xs text-slate-500">
              Select a card below to load the Protein Explorer & Evidence Trail
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((rec) => (
              <ProteinCard
                key={rec.accession}
                record={rec}
                isSelected={selectedAccession === rec.accession}
                onSelect={onSelectProtein}
                onAddToCompare={onAddToCompare}
              />
            ))}
          </div>

          {canLoadMore && onLoadMore && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="px-5 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                {loadingMore ? 'Loading more records...' : 'Load More Matching Records'}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
