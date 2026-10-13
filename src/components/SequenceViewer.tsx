import React, { useState } from 'react';
import { Copy, Check, Download, AlertTriangle } from 'lucide-react';
import { NormalizedProteinRecord } from '../types/protein';
import { downloadFastaFile } from '../utils/fastaExport';
import { validateAminoAcidSequence } from '../utils/validation';

interface SequenceViewerProps {
  record: NormalizedProteinRecord;
  highlightRange?: { start: number; end: number; label?: string } | null;
}

export const SequenceViewer: React.FC<SequenceViewerProps> = ({ record, highlightRange }) => {
  const [copiedSeq, setCopiedSeq] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const validation = validateAminoAcidSequence(record.sequence);
  const seq = validation.cleanedSequence;

  const handleCopySequence = async () => {
    if (!validation.isValid) return;
    try {
      await navigator.clipboard.writeText(seq);
      setCopiedSeq(true);
      setTimeout(() => setCopiedSeq(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadFasta = () => {
    setDownloadError(null);
    const res = downloadFastaFile(record);
    if (!res.success && res.error) {
      setDownloadError(res.error);
    }
  };

  if (!validation.isValid) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-base font-bold text-slate-900 font-display mb-2">
          Amino-Acid Sequence Viewer
        </h3>
        <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{validation.error || 'No valid amino-acid sequence available in this record.'}</span>
        </div>
      </div>
    );
  }

  const lineWidth = 60;
  const rows: Array<{ startPos: number; endPos: number; blocks: Array<{ text: string; offset: number }> }> = [];

  for (let i = 0; i < seq.length; i += lineWidth) {
    const lineSlice = seq.slice(i, i + lineWidth);
    const blocks: Array<{ text: string; offset: number }> = [];
    for (let b = 0; b < lineSlice.length; b += 10) {
      blocks.push({
        text: lineSlice.slice(b, b + 10),
        offset: i + b + 1,
      });
    }
    rows.push({
      startPos: i + 1,
      endPos: Math.min(i + lineWidth, seq.length),
      blocks,
    });
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-mono text-teal-700 font-semibold mb-0.5">
            AMINO-ACID SEQUENCE (IUPAC SINGLE-LETTER CODE — NOT DNA SEQUENCE)
          </div>
          <h3 className="text-base font-bold text-slate-900 font-display">
            Canonical Polypeptide Sequence ({seq.length.toLocaleString()} amino acids)
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 flex-wrap font-mono tabular-nums">
            <span>Calculated length: {seq.length} aa</span>
            <span aria-hidden="true">·</span>
            <span>
              Database reported length: {record.reportedSequenceLength ?? 'N/A'} aa
            </span>
            {record.sequenceLengthMatchesReported ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">● Length verified</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-medium">▲ Length discrepancy noted</span>
              </>
            )}
            {record.massDa && (
              <>
                <span aria-hidden="true">·</span>
                <span>Mass: {record.massDa.toLocaleString()} Da</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleCopySequence}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {copiedSeq ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Copied Sequence
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Sequence
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadFasta}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B57D0] hover:bg-blue-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Download FASTA ({record.accession}.fasta)
          </button>
        </div>
      </div>

      {downloadError && (
        <p role="alert" className="mt-3 text-xs text-rose-600 font-medium">
          {downloadError}
        </p>
      )}

      {highlightRange && (
        <div className="mt-3 px-3 py-2 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-slate-700 flex items-center justify-between">
          <span>
            Highlighting feature region:{' '}
            <strong className="font-mono text-[#0B57D0]">
              Residues {highlightRange.start}–{highlightRange.end}
            </strong>
            {highlightRange.label ? ` (${highlightRange.label})` : ''}
          </span>
        </div>
      )}

      <div className="mt-4 bg-[#F8FAFC] border border-slate-200 rounded-lg p-4 overflow-x-auto">
        <div className="font-mono text-xs sm:text-sm leading-relaxed space-y-1.5 select-all">
          {rows.map((row) => (
            <div key={row.startPos} className="flex items-baseline gap-3 sm:gap-4">
              <span className="w-12 text-right text-xs text-slate-400 tabular-nums select-none shrink-0">
                {row.startPos}
              </span>
              <div className="flex flex-wrap gap-x-2.5 gap-y-1 tracking-wider text-slate-900">
                {row.blocks.map((block) => (
                  <span key={block.offset} className="inline-flex">
                    {block.text.split('').map((char, idx) => {
                      const resPos = block.offset + idx;
                      const isHighlighted =
                        highlightRange &&
                        resPos >= highlightRange.start &&
                        resPos <= highlightRange.end;
                      return (
                        <span
                          key={resPos}
                          title={`Residue ${char} at position ${resPos}`}
                          className={
                            isHighlighted
                              ? 'bg-[#0B57D0] text-white font-semibold px-0.5 rounded-xs'
                              : undefined
                          }
                        >
                          {char}
                        </span>
                      );
                    })}
                  </span>
                ))}
              </div>
              <span className="w-12 text-left text-xs text-slate-400 tabular-nums select-none shrink-0">
                {row.endPos}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
