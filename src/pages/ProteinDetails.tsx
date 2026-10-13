import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  GitCompare,
  Box,
  Search,
  BookOpen,
} from 'lucide-react';
import {
  NormalizedProteinRecord,
  EvidenceTrailEntry,
  PageRoute,
} from '../types/protein';
import { StructureLookupState } from '../utils/evidenceTrailBuilder';
import { SequenceViewer } from '../components/SequenceViewer';
import { EvidenceTrail } from '../components/EvidenceTrail';

interface ProteinDetailsProps {
  record: NormalizedProteinRecord | null;
  evidenceEntries: EvidenceTrailEntry[];
  structureLookup: StructureLookupState;
  onRetryStructureLookup: () => void;
  onNavigate: (page: PageRoute) => void;
  onSendToCompare: (record: NormalizedProteinRecord) => void;
  onQuickLoadExample: (accession: string) => void;
}

function buildPlainLanguageSummary(record: NormalizedProteinRecord): string {
  const parts: string[] = [];
  parts.push(
    `This record describes "${record.proteinName}" (accession ${record.accession}) from the organism ${record.organism}${
      record.geneName ? `, encoded by the ${record.geneName} gene` : ''
    }.`
  );
  if (record.sequenceLength) {
    parts.push(
      `Its canonical polypeptide chain consists of ${record.sequenceLength.toLocaleString()} amino-acid residues.`
    );
  }
  if (record.subcellularLocations.length > 0) {
    parts.push(
      `Curated subcellular localization annotations indicate presence in: ${record.subcellularLocations
        .slice(0, 4)
        .join(', ')}.`
    );
  }
  if (record.catalyticActivity.length > 0) {
    parts.push(
      `It includes ${record.catalyticActivity.length} annotated catalytic reaction(s) in UniProtKB.`
    );
  }
  return parts.join(' ');
}

export const ProteinDetails: React.FC<ProteinDetailsProps> = ({
  record,
  evidenceEntries,
  structureLookup,
  onRetryStructureLookup,
  onNavigate,
  onSendToCompare,
  onQuickLoadExample,
}) => {
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [highlightedFeature, setHighlightedFeature] = useState<{
    start: number;
    end: number;
    label?: string;
  } | null>(null);
  const [featureTypeFilter, setFeatureTypeFilter] = useState<string>('ALL');

  if (!record) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 font-display">
          No Protein Record Currently Selected
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Search for a protein or choose one of the verified reference records below to inspect its
          overview, biological function, amino-acid sequence, and dynamic Evidence Trail.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
          <button
            type="button"
            onClick={() => onQuickLoadExample('P01308')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0B57D0] hover:bg-blue-800 rounded-lg cursor-pointer font-mono"
          >
            Load Human Insulin (P01308)
          </button>
          <button
            type="button"
            onClick={() => onQuickLoadExample('P68871')}
            className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer font-mono"
          >
            Load Hemoglobin Beta (P68871)
          </button>
          <button
            type="button"
            onClick={() => onQuickLoadExample('P99999')}
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
            Open Search Page
          </button>
        </div>
      </div>
    );
  }

  const handleCopyAccession = async () => {
    try {
      await navigator.clipboard.writeText(record.accession);
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    } catch {
      // ignore
    }
  };

  const uniqueFeatureTypes = Array.from(new Set(record.features.map((f) => f.type)));
  const filteredFeatures =
    featureTypeFilter === 'ALL'
      ? record.features
      : record.features.filter((f) => f.type === featureTypeFilter);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 flex-wrap">
              <span className="font-bold text-[#0B57D0] text-sm">{record.accession}</span>
              {record.uniProtId && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Entry ID: {record.uniProtId}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-semibold">{record.recordStatus}</span>
              <span aria-hidden="true">·</span>
              <span>Source: [Literature curated / UniProtKB]</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display mt-1">
              {record.proteinName}
            </h1>

            {record.synonyms.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Alternative names / synonyms: {record.synonyms.slice(0, 6).join(' · ')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleCopyAccession}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap font-mono"
            >
              {copiedAcc ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied {record.accession}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Accession
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSendToCompare(record)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare Protein
            </button>

            <button
              type="button"
              onClick={() => onNavigate('structure')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Box className="w-3.5 h-3.5" />
              Explore 3D Structures ({structureLookup.checked ? structureLookup.structures.length : record.pdbCrossReferences.length})
            </button>

            <a
              href={record.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B57D0] hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>Original UniProt Record</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-lg">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              UniProt Accession
            </div>
            <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              {record.accession}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Primary identifier
            </div>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-lg">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Organism (Scientific Name)
            </div>
            <div className="text-base font-bold text-slate-900 italic mt-0.5 truncate" title={record.organism}>
              {record.organism}
            </div>
            <div className="text-xs font-mono text-slate-500 mt-0.5">
              {record.taxonId ? `NCBI Taxon ID: ${record.taxonId}` : 'Taxon ID not specified'}
            </div>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-lg">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Gene Name
            </div>
            <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
              {record.geneName ?? 'Not annotated'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">
              {record.geneSynonyms.length > 0
                ? `Synonyms: ${record.geneSynonyms.join(', ')}`
                : 'Primary gene symbol'}
            </div>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-lg">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Sequence Length
            </div>
            <div className="text-lg font-mono font-bold text-slate-900 tabular-nums mt-0.5">
              {record.sequenceLength !== null
                ? `${record.sequenceLength.toLocaleString()} aa`
                : 'Unavailable'}
            </div>
            <div className="text-xs font-mono text-slate-500 mt-0.5">
              {record.massDa ? `${record.massDa.toLocaleString()} Da` : 'Amino acids'}
            </div>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-lg">
            <div className="text-[11px] font-mono uppercase text-slate-400">
              Record Status
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {record.recordStatus}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">
              {record.proteinExistence ?? 'UniProtKB entry'}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-slate-200">
          <div>
            <div className="text-xs font-mono text-teal-700 font-semibold">
              BIOLOGICAL FUNCTION ANNOTATION · UNIPROTKB [CC_FUNCTION]
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-display mt-0.5">
              What is this protein known to do?
            </h2>
          </div>

          <a
            href={`${record.sourceUrl}#function`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B57D0] hover:underline"
          >
            <span>Verify Function in UniProt</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {record.functionAnnotation ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              <div className="text-xs font-mono font-semibold text-slate-500 mb-1.5">
                SOURCE ANNOTATION (UNIPROTKB RECORD {record.accession}):
              </div>
              <p className="text-sm text-slate-900 leading-relaxed">
                {record.functionAnnotation}
              </p>
            </div>

            <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B57D0] mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Plain-Language Reading Context (Derived Strictly from Record Metadata):</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {buildPlainLanguageSummary(record)}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-sm text-amber-950">
            No function annotation is available in the retrieved record.
            <span className="block text-xs text-amber-800 mt-1">
              Note: Absence of a curated function comment in UniProtKB means the annotation is not
              present in this database entry; it does not prove that the protein lacks biological activity.
            </span>
          </div>
        )}

        {(record.catalyticActivity.length > 0 ||
          record.subcellularLocations.length > 0 ||
          record.subunitNote) && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              <div className="font-semibold text-slate-800 mb-1">Subcellular Location</div>
              {record.subcellularLocations.length > 0 ? (
                <p className="text-slate-600">{record.subcellularLocations.join(' · ')}</p>
              ) : (
                <p className="text-slate-400">Not annotated in record</p>
              )}
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              <div className="font-semibold text-slate-800 mb-1">Catalytic Activity</div>
              {record.catalyticActivity.length > 0 ? (
                <ul className="space-y-1 text-slate-600 font-mono text-[11px]">
                  {record.catalyticActivity.slice(0, 3).map((rxn, i) => (
                    <li key={i}>{rxn}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">Not annotated in record</p>
              )}
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg">
              <div className="font-semibold text-slate-800 mb-1">Subunit / Quaternary Structure</div>
              {record.subunitNote ? (
                <p className="text-slate-600 line-clamp-4">{record.subunitNote}</p>
              ) : (
                <p className="text-slate-400">Not annotated in record</p>
              )}
            </div>
          </div>
        )}
      </section>

      <EvidenceTrail
        record={record}
        entries={evidenceEntries}
        structureLookup={structureLookup}
        onRetryStructureLookup={onRetryStructureLookup}
        onOpenStructureExplorer={() => onNavigate('structure')}
      />

      <SequenceViewer record={record} highlightRange={highlightedFeature} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Sequence Features & Annotated Regions ({record.features.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any positional feature row to highlight its amino-acid span in the Sequence Viewer above.
                </p>
              </div>
              {highlightedFeature && (
                <button
                  type="button"
                  onClick={() => setHighlightedFeature(null)}
                  className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer"
                >
                  Clear Highlight
                </button>
              )}
            </div>

            {record.features.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No sequence features are annotated in this UniProtKB record.
              </p>
            ) : (
              <>
                <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-2">
                  <button
                    type="button"
                    onClick={() => setFeatureTypeFilter('ALL')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      featureTypeFilter === 'ALL'
                        ? 'bg-[#0F172A] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({record.features.length})
                  </button>
                  {uniqueFeatureTypes.slice(0, 8).map((ft) => (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => setFeatureTypeFilter(ft)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        featureTypeFilter === ft
                          ? 'bg-[#0B57D0] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {ft}
                    </button>
                  ))}
                </div>

                <div className="mt-2 max-h-80 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {filteredFeatures.slice(0, 60).map((feat, idx) => {
                    const canHighlight = feat.start !== null && feat.end !== null;
                    const isSelected =
                      highlightedFeature &&
                      highlightedFeature.start === feat.start &&
                      highlightedFeature.end === feat.end;
                    return (
                      <button
                        key={`${feat.type}-${feat.start}-${idx}`}
                        type="button"
                        disabled={!canHighlight}
                        onClick={() => {
                          if (feat.start !== null && feat.end !== null) {
                            setHighlightedFeature({
                              start: feat.start,
                              end: feat.end,
                              label: `${feat.type}: ${feat.description}`,
                            });
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-3 transition-colors ${
                          canHighlight ? 'cursor-pointer hover:bg-blue-50/40' : 'cursor-default'
                        } ${isSelected ? 'bg-blue-50/80 font-semibold' : ''}`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-900">{feat.type}</span>
                          {feat.description && (
                            <>
                              <span className="mx-1.5 text-slate-400">·</span>
                              <span className="text-slate-600">{feat.description}</span>
                            </>
                          )}
                        </div>
                        <div className="font-mono tabular-nums text-slate-600 shrink-0">
                          {feat.start !== null && feat.end !== null
                            ? feat.start === feat.end
                              ? `Pos ${feat.start}`
                              : `${feat.start}–${feat.end}`
                            : 'N/A'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Database Cross-References ({record.pdbCrossReferences.length + record.otherCrossReferences.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified external database links supplied in UniProtKB record {record.accession}.
              </p>
            </div>

            {record.pdbCrossReferences.length === 0 && record.otherCrossReferences.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No external cross-references are listed in this UniProtKB record.
              </p>
            ) : (
              <div className="mt-3 max-h-80 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {record.pdbCrossReferences.slice(0, 15).map((pdb) => (
                  <div
                    key={`pdb-${pdb.id}`}
                    className="px-3.5 py-2.5 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono font-bold text-teal-800">PDB</span>
                      <span className="mx-1.5 text-slate-400">·</span>
                      <span className="font-mono font-semibold text-slate-900">{pdb.id}</span>
                      {pdb.method && (
                        <>
                          <span className="mx-1.5 text-slate-400">·</span>
                          <span className="text-slate-600">{pdb.method}</span>
                        </>
                      )}
                      {pdb.resolution && (
                        <>
                          <span className="mx-1.5 text-slate-400">·</span>
                          <span className="font-mono text-slate-500">{pdb.resolution}</span>
                        </>
                      )}
                    </div>
                    <a
                      href={pdb.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#0B57D0] hover:underline shrink-0"
                    >
                      <span>RCSB PDB</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}

                {record.otherCrossReferences.map((xref, idx) => (
                  <div
                    key={`${xref.database}-${xref.id}-${idx}`}
                    className="px-3.5 py-2.5 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 truncate">
                      <span className="font-mono font-semibold text-slate-800">{xref.database}</span>
                      <span className="mx-1.5 text-slate-400">·</span>
                      <span className="font-mono text-slate-700">{xref.id}</span>
                      {Object.values(xref.properties).length > 0 && (
                        <>
                          <span className="mx-1.5 text-slate-400">·</span>
                          <span className="text-slate-500">
                            {Object.values(xref.properties).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                    {xref.url ? (
                      <a
                        href={xref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#0B57D0] hover:underline shrink-0"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400 font-mono">Listed</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
