export type EvidenceStatus =
  | 'Available'
  | 'Not annotated'
  | 'No matching record found'
  | 'Retrieval failed'
  | 'Not checked';

export interface SequenceFeature {
  type: string;
  description: string;
  start: number | null;
  end: number | null;
  evidencesCount: number;
}

export interface PdbCrossReference {
  id: string;
  method: string | null;
  resolution: string | null;
  chains: string | null;
  sourceUrl: string;
}

export interface CrossReferenceItem {
  database: string;
  id: string;
  properties: Record<string, string>;
  url: string | null;
}

export interface NormalizedProteinRecord {
  accession: string;
  uniProtId: string | null;
  proteinName: string;
  synonyms: string[];
  organism: string;
  taxonId: number | null;
  geneName: string | null;
  geneSynonyms: string[];
  sequence: string | null;
  sequenceLength: number | null;
  reportedSequenceLength: number | null;
  sequenceLengthMatchesReported: boolean;
  massDa: number | null;
  recordStatus: string;
  proteinExistence: string | null;
  functionAnnotation: string | null;
  catalyticActivity: string[];
  subcellularLocations: string[];
  subunitNote: string | null;
  diseases: Array<{ name: string; description: string; mimId?: string }>;
  features: SequenceFeature[];
  pdbCrossReferences: PdbCrossReference[];
  otherCrossReferences: CrossReferenceItem[];
  keywords: string[];
  source: 'UniProtKB';
  sourceUrl: string;
  retrievedAt: string;
}

export interface EvidenceTrailEntry {
  id: string;
  category:
    | 'Protein identity'
    | 'Amino-acid sequence'
    | 'Biological function'
    | 'Gene and organism information'
    | 'Sequence features'
    | 'Three-dimensional structure records';
  dataSource: string;
  recordIdentifier: string | null;
  status: EvidenceStatus;
  explanation: string;
  sourceUrl: string;
  details?: string;
}

export interface PdbStructureDetails {
  pdbId: string;
  title: string | null;
  experimentalMethod: string | null;
  isPredictedModel: boolean;
  resolutionAngstrom: number | null;
  organism: string | null;
  releaseDate: string | null;
  depositedAtomCount: number | null;
  chainsSummary: string | null;
  citationTitle: string | null;
  pubMedId: number | null;
  sourceUrl: string;
  sourceType: 'RCSB PDB' | 'AlphaFold DB';
  cifUrl: string;
}

export type MutationType =
  | 'identical'
  | 'conservative_substitution'
  | 'semi_conservative_substitution'
  | 'non_conservative_substitution'
  | 'insertion'
  | 'deletion';

export interface AlignmentPosition {
  index: number; // 1-based alignment column index
  resA: string;
  resB: string;
  posA: number | null; // 1-based sequence A residue index
  posB: number | null; // 1-based sequence B residue index
  matrixScore: number; // BLOSUM62 score for this pair
  similarityCategory: 'identical' | 'conservative' | 'semi-conservative' | 'non-conservative' | 'gap';
  mutationTypeRelativeA: MutationType; // from perspective of seqA as reference
  mutationDescription: string;
}

export interface MutationDifferenceItem {
  alignmentColumn: number;
  type: 'substitution' | 'insertion' | 'deletion';
  category?: 'conservative' | 'semi-conservative' | 'non-conservative';
  refResidue: string;
  refPosition: number | null;
  targetResidue: string;
  targetPosition: number | null;
  score: number;
  notation: string; // e.g. "E6V" or "ins-45G" or "del-23P"
  chemicalChangeSummary: string;
}

export interface AlignmentStatistics {
  alignmentScore: number;
  alignedLength: number; // Total columns in alignment including gaps
  identicalResidues: number;
  conservativeSubstitutions: number; // positive BLOSUM62 score (>= 1, non-identical)
  semiConservativeSubstitutions: number; // BLOSUM62 score == 0
  mismatches: number; // negative BLOSUM62 score
  totalSubstitutions: number; // any non-identical aligned pair
  totalGaps: number;
  gapOpenings: number;
  gapExtensions: number;
  
  // Sequence lengths and coverage
  seqALength: number;
  seqBLength: number;
  coverageAPercent: number; // (aligned residues in A / total len A) * 100
  coverageBPercent: number; // (aligned residues in B / total len B) * 100

  // Percentage identities with clearly defined denominators
  identityIncludingGapsPercent: number; // (identical / total alignment columns) * 100
  identityExcludingGapsPercent: number | null; // (identical / non-gap pairs) * 100
  similarityPercent: number; // ((identical + conservative) / total alignment columns) * 100
  similarityExcludingGapsPercent: number | null; // ((identical + conservative) / non-gap pairs) * 100
}

export interface BiologicalInterpretation {
  overallAssessment: 'High homology / likely homologous' | 'Moderate sequence similarity / potential shared fold' | 'Divergent sequences / low sequence identity';
  identityAssessment: string;
  conservationAssessment: string;
  structuralFunctionalCaveat: string;
  mutationSummaryText: string;
}

export interface AlignmentResult {
  alignedSeqA: string;
  alignedSeqB: string;
  midlineSymbols: string; // '|' for exact, ':' for conservative, '.' for semi-conservative, ' ' for mismatch/gap
  positions: AlignmentPosition[];
  differences: MutationDifferenceItem[];
  statistics: AlignmentStatistics;
  interpretation: BiologicalInterpretation;
  scoringSchemeName: 'BLOSUM62 with Affine Gaps' | 'Linear Identity (+1/-1/-1)';
  truncated: boolean;
  maxLimitUsed: number;
}

export interface SearchHistoryItem {
  query: string;
  accession: string;
  proteinName: string;
  organism: string;
  timestamp: string;
}

export type PageRoute =
  | 'home'
  | 'search'
  | 'explorer'
  | 'compare'
  | 'structure'
  | 'about';
