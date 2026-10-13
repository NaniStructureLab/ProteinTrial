import React, { useState } from 'react';
import { Search, X, CheckCircle2, Loader2, SlidersHorizontal } from 'lucide-react';
import { validateSearchInput } from '../utils/validation';

export interface ExampleProteinSpec {
  label: string;
  description: string;
  accession: string;
  query: string;
}

export const VERIFIED_EXAMPLE_PROTEINS: ExampleProteinSpec[] = [
  {
    label: 'Insulin',
    description: 'human insulin, accession P01308',
    accession: 'P01308',
    query: 'P01308',
  },
  {
    label: 'Hemoglobin subunit beta',
    description: 'human beta-globin, accession P68871',
    accession: 'P68871',
    query: 'P68871',
  },
  {
    label: 'Cytochrome c',
    description: 'human cytochrome c, accession P99999',
    accession: 'P99999',
    query: 'P99999',
  },
];

interface SearchBarProps {
  initialQuery?: string;
  initialOrganism?: string;
  onSearch: (params: { query: string; organism?: string; reviewedOnly?: boolean }) => void;
  onClear?: () => void;
  onSelectExample?: (example: ExampleProteinSpec) => void;
  isLoading?: boolean;
  showAdvancedFilters?: boolean;
  verifiedExamplesStatus?: Record<string, { verified: boolean; length?: number; checking?: boolean }>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  initialOrganism = '',
  onSearch,
  onClear,
  onSelectExample,
  isLoading = false,
  showAdvancedFilters = false,
  verifiedExamplesStatus = {},
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [organism, setOrganism] = useState(initialOrganism);
  const [reviewedOnly, setReviewedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(showAdvancedFilters);
  const [validationError, setValidationError] = useState<string | null>(null);

  React.useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSearchInput(query);
    if (!validation.isValid) {
      setValidationError(validation.errorMessage);
      return;
    }
    setValidationError(null);
    onSearch({
      query: validation.trimmedInput,
      organism: organism.trim() || undefined,
      reviewedOnly,
    });
  };

  const handleClear = () => {
    setQuery('');
    setOrganism('');
    setValidationError(null);
    if (onClear) onClear();
  };

  const handleExampleClick = (ex: ExampleProteinSpec) => {
    setQuery(ex.accession);
    setValidationError(null);
    if (onSelectExample) {
      onSelectExample(ex);
    } else {
      onSearch({ query: ex.accession });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <form onSubmit={handleSubmit} noValidate>
        <label
          htmlFor="protein-search-input"
          className="block text-sm font-semibold text-slate-900 mb-2"
        >
          Search UniProtKB by Protein Name or Accession
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="protein-search-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Enter a protein name or UniProt accession"
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0B57D0] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20 font-mono"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setValidationError(null);
                }}
                aria-label="Clear search text"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0B57D0] hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              aria-expanded={showFilters}
              title="Toggle organism and review status filters"
              className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                showFilters || organism || reviewedOnly
                  ? 'border-[#0B57D0] bg-blue-50/50 text-[#0B57D0]'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label
                htmlFor="organism-filter-input"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Organism Filter (optional, for name searches)
              </label>
              <input
                id="organism-filter-input"
                type="text"
                value={organism}
                onChange={(e) => setOrganism(e.target.value)}
                placeholder="e.g., Homo sapiens, Mus musculus, 9606"
                className="w-full px-3 py-1.5 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:border-[#0B57D0] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 sm:mt-5">
              <input
                id="reviewed-only-checkbox"
                type="checkbox"
                checked={reviewedOnly}
                onChange={(e) => setReviewedOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0B57D0] focus:ring-[#0B57D0]"
              />
              <label
                htmlFor="reviewed-only-checkbox"
                className="text-xs font-medium text-slate-700 cursor-pointer"
              >
                Restrict search to Reviewed (UniProtKB/Swiss-Prot) entries only
              </label>
            </div>
          </div>
        )}

        {validationError && (
          <p role="alert" className="mt-2.5 text-xs font-medium text-rose-600">
            {validationError}
          </p>
        )}
      </form>

      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="text-xs font-medium text-slate-500 mb-2">
          Verified Reference Examples (click to populate and inspect live UniProt record):
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {VERIFIED_EXAMPLE_PROTEINS.map((ex) => {
            const status = verifiedExamplesStatus[ex.accession];
            return (
              <button
                key={ex.accession}
                type="button"
                onClick={() => handleExampleClick(ex)}
                className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#0B57D0] hover:bg-blue-50/30 transition-colors cursor-pointer group flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 group-hover:text-[#0B57D0] flex items-center gap-1.5">
                    <span className="truncate">{ex.label}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-[#0B57D0]">{ex.accession}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {ex.description}
                  </div>
                </div>
                <div className="shrink-0 mt-0.5">
                  {status?.checking ? (
                    <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                  ) : status?.verified ? (
                    <span
                      title={`Live API verified (${status.length} aa)`}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {status.length ? `${status.length} aa` : 'Live'}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
