import React from 'react';
import { ExternalLink, ArrowRight, GitCompare } from 'lucide-react';
import { NormalizedProteinRecord } from '../types/protein';

interface ProteinCardProps {
  record: NormalizedProteinRecord;
  isSelected?: boolean;
  onSelect: (record: NormalizedProteinRecord) => void;
  onAddToCompare?: (record: NormalizedProteinRecord) => void;
}

export const ProteinCard: React.FC<ProteinCardProps> = ({
  record,
  isSelected = false,
  onSelect,
  onAddToCompare,
}) => {
  const isReviewed =
    record.recordStatus.toLowerCase().includes('reviewed') &&
    !record.recordStatus.toLowerCase().includes('unreviewed');

  return (
    <article
      className={`bg-white rounded-xl border transition-colors p-5 flex flex-col justify-between gap-4 ${
        isSelected
          ? 'border-[#0B57D0] ring-2 ring-[#0B57D0]/15'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-bold text-[#0B57D0] text-sm">{record.accession}</span>
            {record.uniProtId && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600">{record.uniProtId}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className={isReviewed ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
              {isReviewed ? 'Reviewed (Swiss-Prot)' : 'Unreviewed (TrEMBL)'}
            </span>
          </div>

          <div className="font-mono tabular-nums text-slate-700 font-medium">
            {record.sequenceLength !== null
              ? `${record.sequenceLength.toLocaleString()} aa`
              : 'Length unavailable'}
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 font-display leading-snug">
          {record.proteinName}
        </h3>

        <div className="mt-1 flex items-center gap-2 text-xs text-slate-600 flex-wrap">
          <span className="italic font-medium text-slate-800">{record.organism}</span>
          {record.geneName && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Gene: <strong className="font-mono text-slate-900">{record.geneName}</strong>
              </span>
            </>
          )}
          {record.pdbCrossReferences.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-teal-700">
                {record.pdbCrossReferences.length} PDB structure(s)
              </span>
            </>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">
          {record.functionAnnotation
            ? record.functionAnnotation
            : 'No curated function description is annotated in this UniProt record.'}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <a
          href={record.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#0B57D0] transition-colors whitespace-nowrap"
        >
          <span>UniProt Source ({record.accession})</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <div className="flex items-center gap-2">
          {onAddToCompare && (
            <button
              type="button"
              onClick={() => onAddToCompare(record)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelect(record)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B57D0] hover:bg-blue-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Inspect Protein</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
