import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  NormalizedProteinRecord,
  PdbStructureDetails,
  PageRoute,
} from '../types/protein';
import { StructureLookupState } from '../utils/evidenceTrailBuilder';
import { StructureViewer } from '../components/StructureViewer';
import { LoadingState } from '../components/LoadingState';
import { ErrorMessage } from '../components/ErrorMessage';

interface StructureExplorerProps {
  record: NormalizedProteinRecord | null;
  structureLookup: StructureLookupState;
  onRetryLookup: () => void;
  onNavigate: (page: PageRoute) => void;
  onQuickLoadProtein: (accession: string) => void;
}

export const StructureExplorer: React.FC<StructureExplorerProps> = ({
  record,
  structureLookup,
  onRetryLookup,
  onNavigate,
  onQuickLoadProtein,
}) => {
  const [selectedStructure, setSelectedStructure] = useState<PdbStructureDetails | null>(null);

  useEffect(() => {
    if (structureLookup.structures.length > 0) {
      setSelectedStructure((prev) => {
        if (prev && structureLookup.structures.some((s) => s.pdbId === prev.pdbId)) {
          return prev;
        }
        return structureLookup.structures[0];
      });
    } else {
      setSelectedStructure(null);
    }
  }, [structureLookup.structures]);

  if (!record) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 font-display">
          No Protein Selected for 3D Structure Exploration
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Select a protein record first to retrieve its verified RCSB PDB cross-references and
          AlphaFold predicted models.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
          <button
            type="button"
            onClick={() => onQuickLoadProtein('P01308')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0B57D0] hover:bg-blue-800 rounded-lg cursor-pointer font-mono"
          >
            Load Human Insulin (P01308)
          </button>
          <button
            type="button"
            onClick={() => onQuickLoadProtein('P68871')}
            className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer font-mono"
          >
            Load Hemoglobin Beta (P68871)
          </button>
          <button
            type="button"
            onClick={() => onQuickLoadProtein('P99999')}
            className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer font-mono"
          >
            Load Cytochrome c (P99999)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            Search Another Protein
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-teal-700 font-semibold">
              3D MACROMOLECULAR STRUCTURE EXPLORER · RCSB PDB & ALPHAFOLD DB
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-display mt-0.5">
              Available Structure Records for {record.proteinName} ({record.accession})
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-3xl">
              Experimentally determined structures (X-ray crystallography, Cryo-EM, NMR) from the
              RCSB Protein Data Bank are clearly distinguished from computational predictions
              (AlphaFold DB). Each structure represents the specific construct or complex in that
              record and may cover only a segment of the full {record.sequenceLength ?? 'N/A'}-residue
              sequence.
            </p>
          </div>

          <button
            type="button"
            onClick={onRetryLookup}
            disabled={structureLookup.loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${structureLookup.loading ? 'animate-spin' : ''}`} />
            <span>Refresh Structure Lookup</span>
          </button>
        </div>
      </section>

      {structureLookup.loading && (
        <LoadingState
          title="Retrieving 3D structure metadata..."
          message={`Checking RCSB PDB and AlphaFold DB records associated with ${record.accession}...`}
        />
      )}

      {!structureLookup.loading && structureLookup.error && (
        <ErrorMessage
          title="Structure Metadata Retrieval Failed"
          message="Could not complete the structure lookup due to a network or API error."
          technicalDetail={structureLookup.error}
          onRetry={onRetryLookup}
        />
      )}

      {!structureLookup.loading &&
        !structureLookup.error &&
        structureLookup.checked &&
        structureLookup.structures.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h3 className="text-base font-bold text-slate-900 font-display">
              No Matching Structure Records Found
            </h3>
            <p className="text-sm text-slate-600 max-w-xl mx-auto mt-2 leading-relaxed">
              “No matching structure was found through the sources checked. This does not prove that
              no structure exists in any database.”
            </p>
          </div>
        )}

      {!structureLookup.loading && structureLookup.structures.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 font-display">
                Verified Structure Records ({structureLookup.structures.length})
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Click to load in 3D viewer
              </span>
            </div>

            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {structureLookup.structures.map((st) => {
                const isSelected = selectedStructure?.pdbId === st.pdbId;
                return (
                  <div
                    key={st.pdbId}
                    onClick={() => setSelectedStructure(st)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedStructure(st);
                      }
                    }}
                    className={`p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#0B57D0] bg-blue-50/40'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                      <span className="font-bold text-[#0B57D0] text-sm">{st.pdbId}</span>
                      <span
                        className={
                          st.isPredictedModel
                            ? 'text-amber-700 font-semibold'
                            : 'text-emerald-700 font-semibold'
                        }
                      >
                        {st.isPredictedModel ? '● Predicted Model' : '● Experimental PDB'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-900 mt-1 line-clamp-2">
                      {st.title || `Structure entry ${st.pdbId}`}
                    </div>

                    <div className="mt-2 space-y-1 text-[11px] text-slate-600 font-mono">
                      <div>
                        Method: <span className="text-slate-800">{st.experimentalMethod ?? 'Unavailable'}</span>
                      </div>
                      <div>
                        Resolution:{' '}
                        <span className="text-slate-800">
                          {st.resolutionAngstrom !== null
                            ? `${st.resolutionAngstrom} Å`
                            : st.isPredictedModel
                            ? 'Not applicable (predicted model)'
                            : 'Not applicable / Not supplied'}
                        </span>
                      </div>
                      {st.chainsSummary && (
                        <div>
                          Construct / Chains: <span className="text-slate-800">{st.chainsSummary}</span>
                        </div>
                      )}
                      {st.organism && (
                        <div>
                          Source Organism: <span className="italic text-slate-800">{st.organism}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">{st.sourceType}</span>
                      <a
                        href={st.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-semibold text-[#0B57D0] hover:underline"
                      >
                        <span>Original {st.sourceType} Entry</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {selectedStructure && (
              <>
                <StructureViewer
                  structure={selectedStructure}
                  proteinLength={record.sequenceLength}
                />

                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 font-display">
                      Selected Structure Record Metadata ({selectedStructure.pdbId})
                    </h3>
                    <a
                      href={selectedStructure.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B57D0] hover:underline"
                    >
                      <span>View Full Record on {selectedStructure.sourceType}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
                      <div className="text-slate-400 font-mono text-[11px]">METHOD & PROVENANCE</div>
                      <div className="font-semibold text-slate-900 mt-0.5">
                        {selectedStructure.experimentalMethod ?? 'Unavailable'}
                      </div>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
                      <div className="text-slate-400 font-mono text-[11px]">RESOLUTION</div>
                      <div className="font-mono font-semibold text-slate-900 mt-0.5">
                        {selectedStructure.resolutionAngstrom !== null
                          ? `${selectedStructure.resolutionAngstrom} Å`
                          : 'Not applicable'}
                      </div>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
                      <div className="text-slate-400 font-mono text-[11px]">CHAIN / RESIDUE RANGE</div>
                      <div className="font-mono font-semibold text-slate-900 mt-0.5">
                        {selectedStructure.chainsSummary ?? 'See PDB entry'}
                      </div>
                    </div>
                  </div>

                  {selectedStructure.citationTitle && (
                    <div className="text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <strong className="text-slate-800">Primary Citation: </strong>
                      {selectedStructure.citationTitle}
                      {selectedStructure.pubMedId && (
                        <>
                          {' '}
                          (
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${selectedStructure.pubMedId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0B57D0] hover:underline font-mono"
                          >
                            PMID: {selectedStructure.pubMedId}
                          </a>
                          )
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
