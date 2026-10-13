import React from 'react';
import {
  ExternalLink,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  EvidenceTrailEntry,
  EvidenceStatus,
  NormalizedProteinRecord,
} from '../types/protein';
import { StructureLookupState } from '../utils/evidenceTrailBuilder';

interface EvidenceTrailProps {
  record: NormalizedProteinRecord;
  entries: EvidenceTrailEntry[];
  structureLookup: StructureLookupState;
  onRetryStructureLookup?: () => void;
  onOpenStructureExplorer?: () => void;
}

function getStatusStyle(status: EvidenceStatus): {
  glyph: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
} {
  switch (status) {
    case 'Available':
      return {
        glyph: '● Available',
        textColor: 'text-emerald-800',
        borderColor: 'border-emerald-200',
        bgColor: 'bg-emerald-50/40',
      };
    case 'Not annotated':
      return {
        glyph: '○ Not annotated',
        textColor: 'text-amber-800',
        borderColor: 'border-amber-200',
        bgColor: 'bg-amber-50/40',
      };
    case 'No matching record found':
      return {
        glyph: '◌ No matching record found',
        textColor: 'text-slate-700',
        borderColor: 'border-slate-300',
        bgColor: 'bg-slate-50',
      };
    case 'Retrieval failed':
      return {
        glyph: '✖ Retrieval failed',
        textColor: 'text-rose-800',
        borderColor: 'border-rose-200',
        bgColor: 'bg-rose-50/40',
      };
    case 'Not checked':
    default:
      return {
        glyph: '◇ Not checked',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        bgColor: 'bg-blue-50/30',
      };
  }
}

export const EvidenceTrail: React.FC<EvidenceTrailProps> = ({
  record,
  entries,
  structureLookup,
  onRetryStructureLookup,
  onOpenStructureExplorer,
}) => {
  const hasPdbXrefs = record.pdbCrossReferences.length > 0;
  const structEntry = entries.find((e) => e.id === 'structures');

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs font-mono text-[#0B57D0] font-semibold mb-0.5">
          SIGNATURE FEATURE · EPISTEMIC PROVENANCE & SOURCE VERIFICATION
        </div>
        <h3 className="text-lg font-bold text-slate-900 font-display">
          Protein Evidence Trail
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          Traces where each category of protein information originates and whether the corresponding
          annotation or supporting structure record was retrieved. Missing annotations are distinguished
          from technical retrieval failures and do not imply that a protein lacks a biological property.
        </p>
      </div>

      <div className="mt-4 p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl">
        <div className="text-xs font-semibold text-slate-500 mb-3">
          Evidence Retrieval Pathway
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-stretch">
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono text-slate-400">STEP 1 · QUERY</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">User Search</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Selected accession <strong className="font-mono">{record.accession}</strong>
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono text-emerald-700 font-semibold">
              ● Completed
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono text-slate-400">STEP 2 · PRIMARY RECORD</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">UniProt Record</div>
              <p className="text-[11px] text-slate-600 mt-1">
                {record.recordStatus} ({record.uniProtId || record.accession})
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono text-emerald-700 font-semibold">
              ● Retrieved
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono text-slate-400">STEP 3 · LINKS</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                Available Cross-References
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {hasPdbXrefs
                  ? `${record.pdbCrossReferences.length} PDB xref(s) + ${record.otherCrossReferences.length} external DB link(s)`
                  : `0 PDB xrefs in UniProt (${record.otherCrossReferences.length} other DB links)`}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-700 font-semibold">
              {hasPdbXrefs ? '● PDB Xrefs Present' : '○ No Direct PDB Xref'}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono text-slate-400">STEP 4 · 3D COORDINATES</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                Supporting Structure Record
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {!structureLookup.checked
                  ? 'Lookup not yet run'
                  : structureLookup.error
                  ? 'Stopped: technical retrieval error'
                  : structureLookup.structures.length === 0
                  ? 'Stopped: no matching structure record found'
                  : `${structureLookup.structures.length} structure record(s) verified`}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono font-semibold">
              {structEntry ? (
                <span className={getStatusStyle(structEntry.status).textColor}>
                  {getStatusStyle(structEntry.status).glyph}
                </span>
              ) : (
                <span className="text-slate-500">◇ Not checked</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map((entry, idx) => {
          const style = getStatusStyle(entry.status);
          return (
            <div
              key={entry.id}
              className={`rounded-xl border ${style.borderColor} ${style.bgColor} p-4 flex flex-col justify-between gap-3`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-500">
                    0{idx + 1}. {entry.dataSource}
                  </span>
                  <span className={`text-xs font-mono font-semibold ${style.textColor}`}>
                    {style.glyph}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-1 font-display">
                  {entry.category}
                </h4>

                <div className="mt-1 text-xs font-mono text-slate-700">
                  Identifier:{' '}
                  <span className="font-semibold">
                    {entry.recordIdentifier ?? 'None returned'}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-700 leading-relaxed">
                  {entry.explanation}
                </p>

                {entry.details && (
                  <p className="mt-1.5 text-[11px] text-slate-500 font-mono">
                    {entry.details}
                  </p>
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2 flex-wrap">
                <a
                  href={entry.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B57D0] hover:underline whitespace-nowrap"
                >
                  <span>Verify in {entry.dataSource.split('/')[0].trim()}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {entry.id === 'structures' && (
                  <div className="flex items-center gap-2">
                    {(entry.status === 'Retrieval failed' || entry.status === 'Not checked') &&
                      onRetryStructureLookup && (
                        <button
                          type="button"
                          onClick={onRetryStructureLookup}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{entry.status === 'Not checked' ? 'Check Now' : 'Retry'}</span>
                        </button>
                      )}
                    {entry.status === 'Available' && onOpenStructureExplorer && (
                      <button
                        type="button"
                        onClick={onOpenStructureExplorer}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
                      >
                        <span>Open 3D Viewer</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="font-semibold text-slate-700">Evidence Status Definitions:</span>
        <span>
          <strong className="font-mono text-emerald-800">● Available</strong>: Retrieved from source
        </span>
        <span>
          <strong className="font-mono text-amber-800">○ Not annotated</strong>: Record retrieved, field absent
        </span>
        <span>
          <strong className="font-mono text-slate-700">◌ No matching record found</strong>: Lookup completed with 0 hits
        </span>
        <span>
          <strong className="font-mono text-rose-800">✖ Retrieval failed</strong>: Technical/network error
        </span>
        <span>
          <strong className="font-mono text-blue-800">◇ Not checked</strong>: Lookup not yet executed
        </span>
      </div>
    </section>
  );
};
