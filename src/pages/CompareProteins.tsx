import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Search,
  Loader2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { NormalizedProteinRecord, AlignmentResult } from '../types/protein';
import {
  fetchUniProtByAccession,
  searchUniProtRecords,
} from '../services/uniprotApi';
import { validateSearchInput } from '../utils/validation';
import {
  runNeedlemanWunschAlignment,
  DEFAULT_MAX_SEQUENCE_LENGTH,
} from '../algorithms/needlemanWunsch';
import { AlignmentViewer } from '../components/AlignmentViewer';
import { ErrorMessage } from '../components/ErrorMessage';

interface CompareProteinsProps {
  initialProteinA: NormalizedProteinRecord | null;
  initialProteinB: NormalizedProteinRecord | null;
  onUpdateComparisonProteins: (
    protA: NormalizedProteinRecord | null,
    protB: NormalizedProteinRecord | null
  ) => void;
}

const PRESET_PAIRS = [
  {
    label: 'Human vs. Mouse Beta-Globin (Orthologs)',
    accA: 'P68871',
    accB: 'P02088',
  },
  {
    label: 'Human Hemoglobin Beta vs. Alpha Subunit (Paralogs)',
    accA: 'P68871',
    accB: 'P69905',
  },
  {
    label: 'Human Insulin vs. Human Cytochrome c (Unrelated Controls)',
    accA: 'P01308',
    accB: 'P99999',
  },
];

export const CompareProteins: React.FC<CompareProteinsProps> = ({
  initialProteinA,
  initialProteinB,
  onUpdateComparisonProteins,
}) => {
  const [proteinA, setProteinA] = useState<NormalizedProteinRecord | null>(initialProteinA);
  const [proteinB, setProteinB] = useState<NormalizedProteinRecord | null>(initialProteinB);

  const [inputA, setInputA] = useState(initialProteinA?.accession || 'P01308');
  const [inputB, setInputB] = useState(initialProteinB?.accession || 'P68871');

  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  const [candidatesA, setCandidatesA] = useState<NormalizedProteinRecord[]>([]);
  const [candidatesB, setCandidatesB] = useState<NormalizedProteinRecord[]>([]);

  const [alignment, setAlignment] = useState<AlignmentResult | null>(null);
  const [alignmentError, setAlignmentError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProteinA && initialProteinA.accession !== proteinA?.accession) {
      setProteinA(initialProteinA);
      setInputA(initialProteinA.accession);
      setAlignment(null);
    }
  }, [initialProteinA]);

  useEffect(() => {
    if (initialProteinB && initialProteinB.accession !== proteinB?.accession) {
      setProteinB(initialProteinB);
      setInputB(initialProteinB.accession);
      setAlignment(null);
    }
  }, [initialProteinB]);

  const retrieveSlot = async (
    rawQuery: string,
    slot: 'A' | 'B'
  ): Promise<NormalizedProteinRecord | null> => {
    const val = validateSearchInput(rawQuery);
    if (!val.isValid) {
      if (slot === 'A') setErrorA(val.errorMessage);
      else setErrorB(val.errorMessage);
      return null;
    }

    if (slot === 'A') {
      setLoadingA(true);
      setErrorA(null);
      setCandidatesA([]);
    } else {
      setLoadingB(true);
      setErrorB(null);
      setCandidatesB([]);
    }

    try {
      if (val.isAccession) {
        const rec = await fetchUniProtByAccession(val.trimmedInput);
        if (!rec) {
          throw new Error(`No UniProtKB entry found for accession "${val.trimmedInput}".`);
        }
        if (slot === 'A') {
          setProteinA(rec);
          onUpdateComparisonProteins(rec, proteinB);
        } else {
          setProteinB(rec);
          onUpdateComparisonProteins(proteinA, rec);
        }
        setAlignment(null);
        return rec;
      } else {
        const searchRes = await searchUniProtRecords({
          query: val.trimmedInput,
          size: 5,
        });
        if (searchRes.results.length === 0) {
          throw new Error(`No matching UniProtKB records found for "${val.trimmedInput}".`);
        }
        if (searchRes.results.length === 1) {
          const single = searchRes.results[0];
          if (slot === 'A') {
            setProteinA(single);
            onUpdateComparisonProteins(single, proteinB);
          } else {
            setProteinB(single);
            onUpdateComparisonProteins(proteinA, single);
          }
          setAlignment(null);
          return single;
        } else {
          if (slot === 'A') setCandidatesA(searchRes.results);
          else setCandidatesB(searchRes.results);
          return null;
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to retrieve protein record from UniProt.';
      if (slot === 'A') setErrorA(msg);
      else setErrorB(msg);
      return null;
    } finally {
      if (slot === 'A') setLoadingA(false);
      else setLoadingB(false);
    }
  };

  useEffect(() => {
    async function initDefaultComparison() {
      let recA = proteinA;
      let recB = proteinB;

      if (!recA) {
        recA = await retrieveSlot('P01308', 'A');
      }
      if (!recB) {
        recB = await retrieveSlot('P68871', 'B');
      }
      if (recA?.sequence && recB?.sequence) {
        try {
          const res = runNeedlemanWunschAlignment(recA.sequence, recB.sequence);
          setAlignment(res);
          setAlignmentError(null);
        } catch (err: any) {
          setAlignmentError(err?.message || 'Alignment failed.');
        }
      }
    }
    initDefaultComparison();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunAlignment = () => {
    setAlignmentError(null);
    if (!proteinA || !proteinB) {
      setAlignmentError('Please retrieve both Protein A and Protein B before running the alignment.');
      return;
    }
    if (!proteinA.sequence || !proteinB.sequence) {
      setAlignmentError('One or both selected records lack a valid amino-acid sequence.');
      return;
    }

    try {
      const result = runNeedlemanWunschAlignment(
        proteinA.sequence,
        proteinB.sequence,
        DEFAULT_MAX_SEQUENCE_LENGTH
      );
      setAlignment(result);
    } catch (err: any) {
      setAlignment(null);
      setAlignmentError(err?.message || 'Failed to execute Needleman–Wunsch alignment.');
    }
  };

  const handleLoadPresetPair = async (accA: string, accB: string) => {
    setInputA(accA);
    setInputB(accB);
    setAlignment(null);
    setAlignmentError(null);

    const [resA, resB] = await Promise.all([
      retrieveSlot(accA, 'A'),
      retrieveSlot(accB, 'B'),
    ]);

    if (resA?.sequence && resB?.sequence) {
      try {
        const aligned = runNeedlemanWunschAlignment(resA.sequence, resB.sequence);
        setAlignment(aligned);
      } catch (err: any) {
        setAlignmentError(err?.message || 'Alignment failed.');
      }
    }
  };

  const renderSlotPanel = (
    slot: 'A' | 'B',
    record: NormalizedProteinRecord | null,
    inputVal: string,
    setInputVal: (v: string) => void,
    loading: boolean,
    error: string | null,
    candidates: NormalizedProteinRecord[],
    setCandidates: (c: NormalizedProteinRecord[]) => void
  ) => (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
      <div>
        <div className="text-xs font-mono text-[#0B57D0] font-semibold mb-1">
          PROTEIN {slot} · INDEPENDENT DATABASE RETRIEVAL {slot === 'A' ? '(REFERENCE)' : '(TARGET)'}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            retrieveSlot(inputVal, slot);
          }}
          className="flex gap-2 mt-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`Enter accession or protein name for Protein ${slot}`}
            aria-label={`Search input for Protein ${slot}`}
            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg font-mono focus:bg-white focus:border-[#0B57D0] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0B57D0] hover:bg-blue-800 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Retrieve {slot}</span>
          </button>
        </form>

        {error && (
          <div className="mt-3">
            <ErrorMessage
              title={`Protein ${slot} Retrieval Error`}
              message={error}
              onRetry={() => retrieveSlot(inputVal, slot)}
            />
          </div>
        )}

        {candidates.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2">
            <div className="text-xs font-semibold text-slate-800">
              Multiple records matched. Select the intended record for Protein {slot}:
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {candidates.map((cand) => (
                <button
                  key={cand.accession}
                  type="button"
                  onClick={() => {
                    if (slot === 'A') {
                      setProteinA(cand);
                      onUpdateComparisonProteins(cand, proteinB);
                    } else {
                      setProteinB(cand);
                      onUpdateComparisonProteins(proteinA, cand);
                    }
                    setInputVal(cand.accession);
                    setCandidates([]);
                    setAlignment(null);
                  }}
                  className="w-full text-left p-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-md text-xs flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-[#0B57D0]">{cand.accession}</span>
                    <span className="mx-1.5 text-slate-400">·</span>
                    <span className="font-semibold text-slate-900">{cand.proteinName}</span>
                    <span className="block text-[11px] text-slate-500 italic">{cand.organism}</span>
                  </div>
                  <span className="font-mono text-slate-600 shrink-0">
                    {cand.sequenceLength ?? '?'} aa
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {record ? (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
              <span className="text-sm font-bold text-[#0B57D0]">{record.accession}</span>
              <span className="text-slate-600 tabular-nums font-semibold">
                Length: {record.sequenceLength !== null ? `${record.sequenceLength} aa` : 'N/A'}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 font-display">
              {record.proteinName}
            </h3>

            <div className="text-xs text-slate-600">
              Organism: <em className="font-medium text-slate-900">{record.organism}</em>
              {record.geneName && (
                <>
                  {' '}
                  · Gene: <strong className="font-mono text-slate-900">{record.geneName}</strong>
                </>
              )}
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-xs text-slate-600 max-h-28 overflow-y-auto leading-relaxed">
              <strong className="text-slate-800 block mb-0.5">Function Annotation:</strong>
              {record.functionAnnotation || 'No function annotation available in this record.'}
            </div>
          </div>
        ) : (
          !loading && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
              No record loaded in Slot {slot}. Enter an accession or protein name above.
            </div>
          )
        )}
      </div>

      {record && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="font-mono text-slate-500">{record.recordStatus}</span>
          <a
            href={record.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#0B57D0] hover:underline"
          >
            <span>UniProt Source ({record.accession})</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="text-xs font-mono text-[#0B57D0] font-semibold">
          PAIRWISE SEQUENCE & SUBSTITUTION COMPARISON MODULE
        </div>
        <h1 className="text-2xl font-bold text-slate-900 font-display mt-0.5">
          Compare Proteins & Deep Alignment Analysis
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Retrieve two protein records independently and perform full Needleman–Wunsch alignment with BLOSUM62
          substitution scoring, generating a complete 6-part comparison report: Sequence Alignment, Percentage Identity
          with dual denominators, Similarity and substitution matrix analysis, Differences and mutations table, Alignment
          statistics, and Biological interpretation.
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            Quick Demonstration Pairs:
          </span>
          {PRESET_PAIRS.map((pair) => (
            <button
              key={`${pair.accA}-${pair.accB}`}
              type="button"
              onClick={() => handleLoadPresetPair(pair.accA, pair.accB)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-[#0B57D0] border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {pair.label} (<span className="font-mono">{pair.accA}</span> vs{' '}
              <span className="font-mono">{pair.accB}</span>)
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {renderSlotPanel(
          'A',
          proteinA,
          inputA,
          setInputA,
          loadingA,
          errorA,
          candidatesA,
          setCandidatesA
        )}
        {renderSlotPanel(
          'B',
          proteinB,
          inputB,
          setInputB,
          loadingB,
          errorB,
          candidatesB,
          setCandidatesB
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs text-slate-600">
          {proteinA && proteinB ? (
            <span>
              Ready to compare <strong className="font-mono">{proteinA.accession}</strong> (
              {proteinA.sequenceLength ?? 0} aa) and{' '}
              <strong className="font-mono">{proteinB.accession}</strong> (
              {proteinB.sequenceLength ?? 0} aa).
            </span>
          ) : (
            <span>Select both Protein A and Protein B above to generate the comparison report.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {alignment && (
            <button
              type="button"
              onClick={() => setAlignment(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Alignment
            </button>
          )}

          <button
            type="button"
            disabled={!proteinA || !proteinB || loadingA || loadingB}
            onClick={handleRunAlignment}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0B57D0] hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4" />
            <span>Generate 6-Part Comparison & Alignment Report</span>
          </button>
        </div>
      </div>

      {alignmentError && (
        <ErrorMessage
          title="Sequence Comparison Could Not Run"
          message={alignmentError}
        />
      )}

      {alignment && proteinA && proteinB && (
        <AlignmentViewer
          proteinA={proteinA}
          proteinB={proteinB}
          alignment={alignment}
        />
      )}
    </div>
  );
};
