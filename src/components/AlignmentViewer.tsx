import React, { useState, useMemo } from 'react';
import {
  AlignmentResult,
  NormalizedProteinRecord,
  MutationDifferenceItem,
} from '../types/protein';
import {
  BarChart3,
  AlignLeft,
  Percent,
  Atom,
  GitBranch,
  FileText,
  Search,
  Filter,
} from 'lucide-react';

interface AlignmentViewerProps {
  proteinA: NormalizedProteinRecord;
  proteinB: NormalizedProteinRecord;
  alignment: AlignmentResult;
}

export const AlignmentViewer: React.FC<AlignmentViewerProps> = ({
  proteinA,
  proteinB,
  alignment,
}) => {
  const [activeTab, setActiveTab] = useState<
    'all' | 'alignment' | 'identity' | 'similarity' | 'differences' | 'statistics' | 'interpretation'
  >('all');

  const [diffSearch, setDiffSearch] = useState('');
  const [diffTypeFilter, setDiffTypeFilter] = useState<'all' | 'substitution' | 'insertion' | 'deletion'>('all');
  const [diffCategoryFilter, setDiffCategoryFilter] = useState<'all' | 'conservative' | 'semi-conservative' | 'non-conservative'>('all');

  const stats = alignment.statistics;
  const interp = alignment.interpretation;

  // Filtered difference items
  const filteredDifferences = useMemo(() => {
    return alignment.differences.filter((diff) => {
      if (diffTypeFilter !== 'all' && diff.type !== diffTypeFilter) return false;
      if (
        diffCategoryFilter !== 'all' &&
        diff.type === 'substitution' &&
        diff.category !== diffCategoryFilter
      ) {
        return false;
      }
      if (diffSearch.trim()) {
        const q = diffSearch.trim().toLowerCase();
        return (
          diff.notation.toLowerCase().includes(q) ||
          diff.chemicalChangeSummary.toLowerCase().includes(q) ||
          String(diff.refPosition || '').includes(q) ||
          String(diff.targetPosition || '').includes(q) ||
          String(diff.alignmentColumn).includes(q)
        );
      }
      return true;
    });
  }, [alignment.differences, diffTypeFilter, diffCategoryFilter, diffSearch]);

  // Split sequence into readable rows of 60 columns
  const blockSize = 60;
  const blocks: Array<{
    startCol: number;
    endCol: number;
    sliceA: string;
    sliceMid: string;
    sliceB: string;
    startPosA: number | null;
    endPosA: number | null;
    startPosB: number | null;
    endPosB: number | null;
  }> = [];

  for (let i = 0; i < alignment.positions.length; i += blockSize) {
    const slicePositions = alignment.positions.slice(i, i + blockSize);
    const sliceA = alignment.alignedSeqA.slice(i, i + blockSize);
    const sliceMid = alignment.midlineSymbols.slice(i, i + blockSize);
    const sliceB = alignment.alignedSeqB.slice(i, i + blockSize);

    const nonNullA = slicePositions.map((p) => p.posA).filter((p): p is number => p !== null);
    const nonNullB = slicePositions.map((p) => p.posB).filter((p): p is number => p !== null);

    blocks.push({
      startCol: i + 1,
      endCol: Math.min(i + blockSize, alignment.positions.length),
      sliceA,
      sliceMid,
      sliceB,
      startPosA: nonNullA.length > 0 ? nonNullA[0] : null,
      endPosA: nonNullA.length > 0 ? nonNullA[nonNullA.length - 1] : null,
      startPosB: nonNullB.length > 0 ? nonNullB[0] : null,
      endPosB: nonNullB.length > 0 ? nonNullB[nonNullB.length - 1] : null,
    });
  }

  return (
    <div className="space-y-6">
      {/* Section Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-[#0B57D0] text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Complete Comparison Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alignment')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'alignment'
              ? 'bg-[#0B57D0] text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlignLeft className="w-4 h-4" />
          <span>1. Sequence Alignment</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'identity'
              ? 'bg-[#0B57D0] text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>2. Percentage Identity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('similarity')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'similarity'
              ? 'bg-[#0B57D0] text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Atom className="w-4 h-4" />
          <span>3. Similarity & Substitution</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('differences')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'differences'
              ? 'bg-[#0B57D0] text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>4. Differences & Mutations ({alignment.differences.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('statistics')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'statistics'
              ? 'bg-[#0B57D0] text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>5. Alignment Statistics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interpretation')}
          className={`px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'interpretation'
              ? 'bg-[#0B57D0] text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>6. Biological Interpretation</span>
        </button>
      </div>

      {/* =========================================================================
          SECTION 5: ALIGNMENT STATISTICS (Top Executive Summary)
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'statistics') && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="text-xs font-mono text-[#0B57D0] font-semibold">SECTION 5 · METRIC OVERVIEW</div>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                5. Comprehensive Alignment Statistics
              </h3>
            </div>
            <div className="text-xs font-mono text-slate-600 bg-[#F8FAFC] border border-slate-200 rounded-lg px-3 py-1.5">
              Algorithm: Needleman–Wunsch · Matrix: BLOSUM62 · Gap Open: −8 · Extension: −2
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              <div className="text-[11px] font-mono text-slate-400">ALIGNMENT SCORE</div>
              <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">
                {stats.alignmentScore > 0 ? `+${stats.alignmentScore}` : stats.alignmentScore}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Global BLOSUM62 sum</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              <div className="text-[11px] font-mono text-slate-400">ALIGNED LENGTH</div>
              <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">
                {stats.alignedLength} cols
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Total columns with gaps</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              <div className="text-[11px] font-mono text-slate-400">IDENTICAL RESIDUES</div>
              <div className="text-xl font-mono font-bold text-emerald-700 mt-0.5">
                {stats.identicalResidues}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Exact amino-acid matches</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              <div className="text-[11px] font-mono text-slate-400">CONSERVATIVE SUBS.</div>
              <div className="text-xl font-mono font-bold text-[#0B57D0] mt-0.5">
                {stats.conservativeSubstitutions}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">BLOSUM62 &gt; 0 (similar)</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              <div className="text-[11px] font-mono text-slate-400">MISMATCHES</div>
              <div className="text-xl font-mono font-bold text-amber-700 mt-0.5">
                {stats.mismatches}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Non-conservative (score &lt; 0)</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              <div className="text-[11px] font-mono text-slate-400">GAPS & INDELS</div>
              <div className="text-xl font-mono font-bold text-slate-700 mt-0.5">
                {stats.totalGaps}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Across {stats.gapOpenings} indel event(s)
              </div>
            </div>
          </div>

          {/* Sequence Coverage Comparison */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-lg flex items-center justify-between text-xs font-mono">
              <div>
                <span className="font-semibold text-slate-900">Protein A Coverage: </span>
                <span className="text-[#0B57D0] font-bold">{stats.coverageAPercent}%</span>
                <span className="text-slate-500 ml-1.5">
                  ({proteinA.sequenceLength} / {proteinA.sequenceLength} residues aligned)
                </span>
              </div>
              <span className="text-slate-600 font-bold">{proteinA.accession}</span>
            </div>

            <div className="p-3 bg-teal-50/40 border border-teal-200 rounded-lg flex items-center justify-between text-xs font-mono">
              <div>
                <span className="font-semibold text-slate-900">Protein B Coverage: </span>
                <span className="text-teal-700 font-bold">{stats.coverageBPercent}%</span>
                <span className="text-slate-500 ml-1.5">
                  ({proteinB.sequenceLength} / {proteinB.sequenceLength} residues aligned)
                </span>
              </div>
              <span className="text-slate-600 font-bold">{proteinB.accession}</span>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 2: PERCENTAGE IDENTITY (Clearly Defined Denominators)
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'identity') && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="pb-3 border-b border-slate-200">
            <div className="text-xs font-mono text-[#0B57D0] font-semibold">SECTION 2 · MATHEMATICAL FORMULATION</div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              2. Percentage Identity Calculation & Denominator Clarification
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Calculates the percentage of aligned positions containing exactly the same amino acid.
              Because bioinformatics literature uses different denominator conventions, both standards
              are calculated and displayed explicitly below:
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard A: Total Alignment Columns (Including Gaps) */}
            <div className="p-4 bg-[#F8FAFC] border-2 border-[#0B57D0]/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#0B57D0]">STANDARD 1 (RECOMMENDED)</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 text-[#0B57D0] font-semibold">
                  Global Denominator
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1 font-display">
                Identity Across All Alignment Columns (Including Gaps)
              </h4>
              <div className="mt-2 text-3xl font-mono font-bold text-[#0B57D0]">
                {stats.identityIncludingGapsPercent}%
              </div>
              <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 space-y-1">
                <div>
                  <strong>Formula:</strong> (Identical Residues / Total Alignment Columns) × 100
                </div>
                <div>
                  <strong>Calculation:</strong> ({stats.identicalResidues} / {stats.alignedLength}) × 100 ={' '}
                  <span className="font-bold text-[#0B57D0]">{stats.identityIncludingGapsPercent}%</span>
                </div>
                <div className="text-slate-500 text-[11px] pt-1">
                  Denominator = {stats.alignedLength} columns ({stats.alignedLength - stats.totalGaps} aligned residue pairs + {stats.totalGaps} gap positions). Penalizes insertions and deletions globally.
                </div>
              </div>
            </div>

            {/* Standard B: Non-Gap Aligned Residue Pairs (Excluding Gaps) */}
            <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-500">STANDARD 2 (PAIRWISE)</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                  Excluding Gaps
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1 font-display">
                Identity Across Compared Residue Pairs (Excluding Gaps)
              </h4>
              <div className="mt-2 text-3xl font-mono font-bold text-slate-900">
                {stats.identityExcludingGapsPercent !== null
                  ? `${stats.identityExcludingGapsPercent}%`
                  : 'Undefined'}
              </div>
              <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 space-y-1">
                <div>
                  <strong>Formula:</strong> (Identical Residues / Non-Gap Aligned Pairs) × 100
                </div>
                <div>
                  <strong>Calculation:</strong> ({stats.identicalResidues} /{' '}
                  {stats.alignedLength - stats.totalGaps}) × 100 ={' '}
                  <span className="font-bold text-slate-900">
                    {stats.identityExcludingGapsPercent ?? 'N/A'}%
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] pt-1">
                  Denominator = {stats.alignedLength - stats.totalGaps} positions where both sequences have an amino acid. Ignores gap penalty weighting in the denominator.
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 3: SIMILARITY AND SUBSTITUTION ANALYSIS (BLOSUM62)
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'similarity') && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="pb-3 border-b border-slate-200">
            <div className="text-xs font-mono text-teal-700 font-semibold">SECTION 3 · BIOCHEMICAL MATRIX ANALYSIS</div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              3. Sequence Similarity & BLOSUM62 Substitution Analysis
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Identifies chemically similar amino acids using the standard BLOSUM62 substitution matrix,
              separately from exact matches. Amino-acid pairs with positive scores (&gt; 0) share similar
              physicochemical properties (size, charge, hydropathy) and frequently substitute during evolution.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-800 font-semibold">
                <span>EXACT MATCHES</span>
                <span>Symbol: |</span>
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-900 mt-1">
                {stats.identicalResidues} residues
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                Identical amino acid in both sequences ({stats.identityIncludingGapsPercent}% of alignment).
              </p>
            </div>

            <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between text-xs font-mono text-[#0B57D0] font-semibold">
                <span>CONSERVATIVE SUBSTITUTIONS</span>
                <span>Symbol: :</span>
              </div>
              <div className="text-2xl font-mono font-bold text-[#0B57D0] mt-1">
                {stats.conservativeSubstitutions} residues
              </div>
              <p className="text-xs text-slate-700 mt-1">
                Different amino acids, but positive BLOSUM62 score (&gt; 0). Chemically favored replacements.
              </p>
            </div>

            <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between text-xs font-mono text-amber-800 font-semibold">
                <span>SEMI-CONSERVATIVE & MISMATCHES</span>
                <span>Symbol: . / space</span>
              </div>
              <div className="text-2xl font-mono font-bold text-amber-900 mt-1">
                {stats.semiConservativeSubstitutions + stats.mismatches} residues
              </div>
              <p className="text-xs text-slate-700 mt-1">
                {stats.semiConservativeSubstitutions} neutral (score = 0) and {stats.mismatches} non-conservative (score &lt; 0) dissimilar pairs.
              </p>
            </div>
          </div>

          {/* Combined Similarity Metric */}
          <div className="mt-4 p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 font-display">
                Total Sequence Similarity (Identical + Conservative Substitutions)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Formula: ({stats.identicalResidues} matches + {stats.conservativeSubstitutions} conservative) / {stats.alignedLength} total columns ={' '}
                <strong className="text-slate-900 font-mono">{stats.similarityPercent}%</strong>
                {stats.similarityExcludingGapsPercent !== null && (
                  <span className="ml-1 text-slate-500">
                    ({stats.similarityExcludingGapsPercent}% when excluding gaps)
                  </span>
                )}
              </div>
            </div>
            <div className="text-2xl font-mono font-bold text-teal-800 shrink-0">
              {stats.similarityPercent}% Similar
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 1: SEQUENCE ALIGNMENT (Aligned Rows with Midline Symbols)
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'alignment') && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-200">
            <div>
              <div className="text-xs font-mono text-[#0B57D0] font-semibold">SECTION 1 · ALIGNED SEQUENCES</div>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                1. Sequence Alignment View
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Displays both sequences in aligned rows, placing matching amino acids in the same columns and inserting gaps (<code className="font-mono">-</code>) where necessary.
              </p>
            </div>

            {/* Midline Legend */}
            <div className="flex items-center gap-3 text-xs font-mono bg-[#F8FAFC] p-2 rounded-lg border border-slate-200">
              <span className="inline-flex items-center gap-1">
                <span className="font-bold text-emerald-700">|</span> Match
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="font-bold text-[#0B57D0]">:</span> Conservative
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="font-bold text-amber-600">.</span> Semi-cons.
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <span>space</span> Mismatch/Gap
              </span>
            </div>
          </div>

          {/* Alignment Blocks */}
          <div className="mt-4 bg-[#F8FAFC] border border-slate-200 rounded-lg p-4 overflow-x-auto space-y-6 max-h-[560px] overflow-y-auto">
            {blocks.map((block) => (
              <div key={block.startCol} className="font-mono text-xs leading-tight space-y-1">
                {/* Row A */}
                <div className="flex items-center gap-3">
                  <span className="w-28 text-slate-700 font-bold truncate shrink-0">
                    {proteinA.accession} (A)
                  </span>
                  <span className="w-12 text-right text-slate-400 tabular-nums shrink-0">
                    {block.startPosA ?? '-'}
                  </span>
                  <div className="flex tracking-widest">
                    {block.sliceA.split('').map((ch, idx) => {
                      const posInfo = alignment.positions[block.startCol - 1 + idx];
                      const cls =
                        posInfo.similarityCategory === 'identical'
                          ? 'bg-emerald-100/90 text-emerald-950 font-semibold'
                          : posInfo.similarityCategory === 'conservative'
                          ? 'bg-blue-100/90 text-blue-950'
                          : posInfo.similarityCategory === 'semi-conservative'
                          ? 'bg-amber-50 text-amber-900'
                          : posInfo.resA === '-'
                          ? 'bg-slate-200/80 text-slate-500 font-bold'
                          : 'bg-rose-50 text-rose-900';
                      return (
                        <span key={idx} className={`px-[1px] ${cls}`}>
                          {ch}
                        </span>
                      );
                    })}
                  </div>
                  <span className="w-12 text-left text-slate-400 tabular-nums shrink-0">
                    {block.endPosA ?? '-'}
                  </span>
                </div>

                {/* Midline Symbols */}
                <div className="flex items-center gap-3">
                  <span className="w-28 shrink-0" />
                  <span className="w-12 shrink-0" />
                  <div className="flex tracking-widest text-slate-600 select-none">
                    {block.sliceMid.split('').map((ch, idx) => (
                      <span
                        key={idx}
                        className={`px-[1px] font-bold ${
                          ch === '|'
                            ? 'text-emerald-700'
                            : ch === ':'
                            ? 'text-[#0B57D0]'
                            : ch === '.'
                            ? 'text-amber-600'
                            : 'text-transparent'
                        }`}
                      >
                        {ch || ' '}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Row B */}
                <div className="flex items-center gap-3">
                  <span className="w-28 text-slate-700 font-bold truncate shrink-0">
                    {proteinB.accession} (B)
                  </span>
                  <span className="w-12 text-right text-slate-400 tabular-nums shrink-0">
                    {block.startPosB ?? '-'}
                  </span>
                  <div className="flex tracking-widest">
                    {block.sliceB.split('').map((ch, idx) => {
                      const posInfo = alignment.positions[block.startCol - 1 + idx];
                      const cls =
                        posInfo.similarityCategory === 'identical'
                          ? 'bg-emerald-100/90 text-emerald-950 font-semibold'
                          : posInfo.similarityCategory === 'conservative'
                          ? 'bg-blue-100/90 text-blue-950'
                          : posInfo.similarityCategory === 'semi-conservative'
                          ? 'bg-amber-50 text-amber-900'
                          : posInfo.resB === '-'
                          ? 'bg-slate-200/80 text-slate-500 font-bold'
                          : 'bg-rose-50 text-rose-900';
                      return (
                        <span key={idx} className={`px-[1px] ${cls}`}>
                          {ch}
                        </span>
                      );
                    })}
                  </div>
                  <span className="w-12 text-left text-slate-400 tabular-nums shrink-0">
                    {block.endPosB ?? '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 4: DIFFERENCES AND MUTATIONS TABLE
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'differences') && (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-[#0B57D0] font-semibold">SECTION 4 · VARIANT & INDEL REPORT</div>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                4. Differences and Mutations Relative to Reference ({proteinA.proteinName})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Reports all substitutions, insertions, and deletions with alignment column positions,
                reference residue indices ({proteinA.accession}), and target indices ({proteinB.accession}).
              </p>
            </div>

            <div className="text-xs font-mono text-slate-500">
              Total Differences: <strong>{alignment.differences.length}</strong>
            </div>
          </div>

          {/* Filtering and Search Controls */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={diffSearch}
                onChange={(e) => setDiffSearch(e.target.value)}
                placeholder="Search notation, position, or residue..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-[#0B57D0] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={diffTypeFilter}
                onChange={(e) => setDiffTypeFilter(e.target.value as any)}
                aria-label="Filter differences by mutation event type"
                className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-300 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-none"
              >
                <option value="all">All Event Types</option>
                <option value="substitution">Substitutions Only</option>
                <option value="insertion">Insertions Only</option>
                <option value="deletion">Deletions Only</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={diffCategoryFilter}
                onChange={(e) => setDiffCategoryFilter(e.target.value as any)}
                aria-label="Filter differences by BLOSUM62 conservation tier"
                className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-slate-300 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-none"
              >
                <option value="all">All Conservation Tiers</option>
                <option value="conservative">Conservative Substitutions</option>
                <option value="semi-conservative">Semi-Conservative</option>
                <option value="non-conservative">Non-Conservative Mismatches</option>
              </select>
            </div>
          </div>

          {/* Differences Table */}
          <div className="mt-4 border border-slate-200 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F8FAFC] text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 font-mono">Col #</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 font-mono">Ref A ({proteinA.accession})</th>
                  <th className="py-2.5 px-3 font-mono">Target B ({proteinB.accession})</th>
                  <th className="py-2.5 px-3 font-mono">Notation</th>
                  <th className="py-2.5 px-3 font-mono">BLOSUM62</th>
                  <th className="py-2.5 px-3">Physicochemical Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDifferences.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      No differences match the active search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredDifferences.map((item, idx) => (
                    <tr key={`${item.alignmentColumn}-${idx}`} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-slate-500 tabular-nums">
                        {item.alignmentColumn}
                      </td>
                      <td className="py-2 px-3 capitalize">
                        {item.type === 'substitution' ? (
                          <span
                            className={
                              item.category === 'conservative'
                                ? 'text-[#0B57D0] font-semibold'
                                : item.category === 'semi-conservative'
                                ? 'text-amber-700'
                                : 'text-rose-700 font-semibold'
                            }
                          >
                            {item.category}
                          </span>
                        ) : item.type === 'insertion' ? (
                          <span className="text-purple-700 font-semibold">Insertion</span>
                        ) : (
                          <span className="text-slate-600 font-semibold">Deletion</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {item.refResidue !== '-' ? (
                          <span>
                            {item.refResidue} <span className="text-slate-400">(pos {item.refPosition})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">- (gap)</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {item.targetResidue !== '-' ? (
                          <span>
                            {item.targetResidue}{' '}
                            <span className="text-slate-400">(pos {item.targetPosition})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">- (gap)</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {item.notation}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums">
                        {item.score > 0 ? `+${item.score}` : item.score}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {item.chemicalChangeSummary}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 6: BIOLOGICAL INTERPRETATION (Prose & Rigorous Caveats)
         ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'interpretation') && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <div className="text-xs font-mono text-teal-700 font-semibold">SECTION 6 · SCIENTIFIC REASONING</div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              6. Biological Interpretation & Epistemic Boundaries
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Explains what the sequence comparison indicates in understandable language without making
              unsupported functional or clinical claims.
            </p>
          </div>

          {/* Assessment Badge / Header */}
          <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 uppercase">Evolutionary Distance Assessment:</span>
              <span className="text-sm font-bold text-[#0B57D0] font-display">
                {interp.overallAssessment}
              </span>
            </div>

            <p className="text-sm text-slate-800 leading-relaxed">
              {interp.identityAssessment}
            </p>

            <p className="text-sm text-slate-700 leading-relaxed">
              {interp.conservationAssessment}
            </p>

            <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-200">
              {interp.mutationSummaryText}
            </p>
          </div>

          {/* Mandatory Biological Caveat Box */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 leading-relaxed space-y-2">
            <div className="font-bold text-amber-900 uppercase font-mono text-[11px]">
              CRITICAL BIOINFORMATICS PRINCIPLE & SCIENTIFIC CAVEAT
            </div>
            <p>
              {interp.structuralFunctionalCaveat}
            </p>
            <p className="text-amber-900/90">
              For definitive determination of functional homology, researchers must cross-reference
              three-dimensional structure models (available in the <strong>Structure Explorer</strong> module),
              active site catalytic triads, and experimental wet-lab assays.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};
