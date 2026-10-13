import React from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
        <div className="text-xs font-mono text-[#0B57D0] font-semibold">
          ABOUT THE PROJECT · BIOINFORMATICS TOOLS & DATABASE
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
          ProteinTrail — Cross-Database Protein Investigator
        </h1>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          ProteinTrail is an interactive educational bioinformatics web application designed to help
          students and researchers investigate protein records across authoritative biological
          databases through a single, transparent interface. Rather than presenting isolated numbers
          or black-box predictions, ProteinTrail emphasizes <strong>epistemic provenance</strong>:
          showing where each biological annotation comes from, what evidence supports it, and how
          missing annotations differ from technical retrieval failures.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Authoritative Biological Data Sources
          </h2>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">UniProt Knowledgebase (UniProtKB REST API):</strong>{' '}
              Primary source for curated protein names, gene symbols, organism taxonomy, canonical
              amino-acid sequences, functional comments, and positional sequence features.
              <div className="mt-0.5">
                <a
                  href="https://www.uniprot.org/help/license"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B57D0] hover:underline"
                >
                  <span>UniProt License & Attribution Terms (CC BY 4.0)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </li>
            <li>
              <strong className="text-slate-900">RCSB Protein Data Bank (PDB Data & Search APIs):</strong>{' '}
              Source for experimentally determined three-dimensional macromolecular structures
              (X-ray diffraction, Cryo-EM, solution NMR), resolution metrics, and coordinate files.
            </li>
            <li>
              <strong className="text-slate-900">AlphaFold Protein Structure Database (EMBL-EBI):</strong>{' '}
              Provides predicted monomer structure coordinates and per-residue pLDDT confidence
              scores, clearly distinguished from experimental PDB entries.
            </li>
          </ul>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Implemented Algorithms & Methodologies
          </h2>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <li>
              <strong className="text-slate-900">6-Part Comparison & Alignment Analysis:</strong>{' '}
              Full global pairwise alignment with BLOSUM62 matrix scoring, dual-denominator percentage
              identities, chemical substitution categorization, granular mutation differences reporting,
              detailed statistics, and biological caveats.
            </li>
            <li>
              <strong className="text-slate-900">Protein Evidence Trail (Algorithm 4):</strong>{' '}
              Audits 6 categories of biological information using 5 distinct non-interchangeable
              statuses (<code className="font-mono">Available</code>,{' '}
              <code className="font-mono">Not annotated</code>,{' '}
              <code className="font-mono">No matching record found</code>,{' '}
              <code className="font-mono">Retrieval failed</code>, and{' '}
              <code className="font-mono">Not checked</code>).
            </li>
            <li>
              <strong className="text-slate-900">Sequence Verification & FASTA Export (Algorithm 7):</strong>{' '}
              Validates IUPAC amino-acid characters, cross-checks actual residue count against
              reported metadata length, and exports standard 60-column FASTA files.
            </li>
          </ul>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-display">
          Evaluation & Verification Checklist
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
          {[
            'Search by UniProtKB accession (e.g., P01308, P68871, P99999)',
            'Search by protein name and organism filter with user selection',
            'Exact agreement between calculated sequence length and retrieved sequence',
            'Accurate display of UniProt biological function and plain-language context',
            'Dynamic Evidence Trail across all 6 categories with source links',
            'One-click copy accession, copy sequence, and .fasta download',
            'Needleman–Wunsch sequence alignment with BLOSUM62 similarity analysis',
            'Granular mutations and differences table with residue numbering and notations',
            'Dual percentage identity calculation with transparent denominator definition',
            'Interactive 3D molecular viewer (3Dmol.js) with experimental vs. model badges',
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-100/80 border border-slate-200 rounded-xl p-5 text-xs text-slate-700 leading-relaxed">
        <strong className="text-slate-900">Disclaimer: </strong>
        “ProteinTrail is an educational research-support tool. Database annotations and predicted
        information should be interpreted according to their sources. This tool does not
        independently establish biological function or clinical significance.”
      </section>
    </div>
  );
};
