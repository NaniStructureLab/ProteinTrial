import React from 'react';
import {
  FileSpreadsheet,
  ShieldCheck,
  GitCompare,
  Box,
  ArrowRight,
} from 'lucide-react';
import { SearchBar, ExampleProteinSpec } from '../components/SearchBar';
import { PageRoute } from '../types/protein';

interface HomeProps {
  onSearch: (params: { query: string; organism?: string; reviewedOnly?: boolean }) => void;
  onSelectExample: (example: ExampleProteinSpec) => void;
  onNavigate: (page: PageRoute) => void;
  isLoading: boolean;
  verifiedExamplesStatus: Record<string, { verified: boolean; length?: number; checking?: boolean }>;
}

const WORKFLOW_STEPS = [
  { step: '01', title: 'Search Protein', detail: 'Query by name, gene, or UniProt accession' },
  { step: '02', title: 'Retrieve Records', detail: 'Fetch live UniProtKB & RCSB PDB records' },
  { step: '03', title: 'Organize Information', detail: 'Normalize sequence, features & metadata' },
  { step: '04', title: 'Trace Evidence', detail: 'Audit source status & missing annotations' },
  { step: '05', title: 'Explore or Compare', detail: 'Run BLOSUM62 alignment or inspect 3D models' },
];

export const Home: React.FC<HomeProps> = ({
  onSearch,
  onSelectExample,
  onNavigate,
  isLoading,
  verifiedExamplesStatus,
}) => {
  return (
    <div className="space-y-8">
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="text-xs font-mono font-semibold text-teal-700 tracking-wide mb-2">
            CROSS-DATABASE BIOINFORMATICS WORKBENCH
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 font-display tracking-tight text-balance">
            ProteinTrail — Cross-Database Protein Investigator
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            Explore protein sequences, biological functions, and available structures while tracing
            information back to its source.
          </p>
        </div>

        <div className="mt-6">
          <SearchBar
            onSearch={onSearch}
            onSelectExample={onSelectExample}
            isLoading={isLoading}
            verifiedExamplesStatus={verifiedExamplesStatus}
          />
        </div>
      </section>

      <section aria-labelledby="features-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="features-heading" className="text-lg font-bold text-slate-900 font-display">
            Core Investigation Modules
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Click any module to open its dedicated workspace
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('explorer')}
            className="text-left bg-white border border-slate-200 hover:border-[#0B57D0] rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors cursor-pointer group"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0B57D0] flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display group-hover:text-[#0B57D0]">
                Protein Information
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Explore protein sequences and functional annotations retrieved directly from
                UniProtKB records, with FASTA export and length verification.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0B57D0]">
              <span>Open Protein Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('explorer')}
            className="text-left bg-white border border-slate-200 hover:border-[#0B57D0] rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors cursor-pointer group"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display group-hover:text-[#0B57D0]">
                Evidence Trail
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Trace information to its source across six biological categories and distinguish
                missing annotations from failed database lookups.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
              <span>Inspect Evidence Trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('compare')}
            className="text-left bg-white border border-slate-200 hover:border-[#0B57D0] rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors cursor-pointer group"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0B57D0] flex items-center justify-center mb-3">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display group-hover:text-[#0B57D0]">
                Compare Proteins (6-Part Report)
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Needleman–Wunsch alignment, dual percentage identities, BLOSUM62 similarity analysis,
                detailed mutation differences table, and biological interpretation.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0B57D0]">
              <span>Compare Two Proteins</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('structure')}
            className="text-left bg-white border border-slate-200 hover:border-[#0B57D0] rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors cursor-pointer group"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display group-hover:text-[#0B57D0]">
                Structure Explorer
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                View available three-dimensional structures from RCSB PDB and AlphaFold DB with
                interactive WebGL rotation, zoom, and method attribution.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
              <span>Explore 3D Structures</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="text-xs font-mono text-slate-500 font-semibold mb-1">
          METHODOLOGY & DATA PIPELINE
        </div>
        <h2 className="text-base font-bold text-slate-900 font-display mb-4">
          Search Protein → Retrieve Records → Organize Information → Trace Evidence → Explore or Compare
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {WORKFLOW_STEPS.map((item, index) => (
            <div
              key={item.step}
              className="bg-[#F8FAFC] border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#0B57D0] font-semibold">
                  <span>STEP {item.step}</span>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <span className="text-slate-400 hidden sm:inline">→</span>
                  )}
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1 font-display">
                  {item.title}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label="Educational research-support disclaimer"
        className="bg-slate-100/80 border border-slate-200 rounded-xl p-5 text-xs sm:text-sm text-slate-700 leading-relaxed"
      >
        <strong className="font-semibold text-slate-900">Scientific & Educational Disclaimer: </strong>
        “ProteinTrail is an educational research-support tool. Database annotations and predicted
        information should be interpreted according to their sources. This tool does not
        independently establish biological function or clinical significance.”
      </section>
    </div>
  );
};
