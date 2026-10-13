import {
  AlignmentPosition,
  AlignmentResult,
  AlignmentStatistics,
  BiologicalInterpretation,
  MutationDifferenceItem,
  MutationType,
} from '../types/protein';
import {
  getBlosum62Score,
  categorizeSimilarity,
  getChemicalPropertyShift,
} from './sequenceIdentity';
import { validateAminoAcidSequence } from '../utils/validation';

export const DEFAULT_MAX_SEQUENCE_LENGTH = 2000;

// Needleman-Wunsch with BLOSUM62 and affine gap penalties (or linear gap penalty)
// Gap opening: -10, Gap extension: -1 (standard NCBI/BLAST default), or standard -4 for educational parity
const GAP_OPEN = -8;
const GAP_EXTEND = -2;

const PTR_DIAG = 1;
const PTR_UP = 2;
const PTR_LEFT = 3;

/**
 * Needleman-Wunsch alignment with BLOSUM62 scoring matrix.
 */
export function runNeedlemanWunschAlignment(
  rawSeqA: string,
  rawSeqB: string,
  maxSequenceLength = DEFAULT_MAX_SEQUENCE_LENGTH
): AlignmentResult {
  const valA = validateAminoAcidSequence(rawSeqA);
  const valB = validateAminoAcidSequence(rawSeqB);

  if (!valA.isValid) {
    throw new Error(`Invalid Sequence A: ${valA.error}`);
  }
  if (!valB.isValid) {
    throw new Error(`Invalid Sequence B: ${valB.error}`);
  }

  let seqA = valA.cleanedSequence;
  let seqB = valB.cleanedSequence;
  let truncated = false;

  const originalLenA = seqA.length;
  const originalLenB = seqB.length;

  if (seqA.length > maxSequenceLength || seqB.length > maxSequenceLength) {
    seqA = seqA.slice(0, maxSequenceLength);
    seqB = seqB.slice(0, maxSequenceLength);
    truncated = true;
  }

  const m = seqA.length;
  const n = seqB.length;
  const cols = n + 1;

  // Initialize scoring and traceback matrices
  const scoreMatrix = new Int32Array((m + 1) * (n + 1));
  const pointerMatrix = new Uint8Array((m + 1) * (n + 1));

  // Initialize first column (gaps against sequence A)
  for (let i = 0; i <= m; i++) {
    scoreMatrix[i * cols] = i === 0 ? 0 : GAP_OPEN + (i - 1) * GAP_EXTEND;
    pointerMatrix[i * cols] = PTR_UP;
  }

  // Initialize first row (gaps against sequence B)
  for (let j = 0; j <= n; j++) {
    scoreMatrix[j] = j === 0 ? 0 : GAP_OPEN + (j - 1) * GAP_EXTEND;
    pointerMatrix[j] = PTR_LEFT;
  }
  pointerMatrix[0] = 0;

  // Fill the matrix using BLOSUM62 substitution scores
  for (let i = 1; i <= m; i++) {
    const charA = seqA[i - 1];
    const rowOffset = i * cols;
    const prevRowOffset = (i - 1) * cols;

    for (let j = 1; j <= n; j++) {
      const charB = seqB[j - 1];
      const substScore = getBlosum62Score(charA, charB);

      const diagScore = scoreMatrix[prevRowOffset + (j - 1)] + substScore;

      // Check if previous move was a gap or extension
      const prevUpPtr = pointerMatrix[prevRowOffset + j];
      const upCost = prevUpPtr === PTR_UP ? GAP_EXTEND : GAP_OPEN;
      const upScore = scoreMatrix[prevRowOffset + j] + upCost;

      const prevLeftPtr = pointerMatrix[rowOffset + (j - 1)];
      const leftCost = prevLeftPtr === PTR_LEFT ? GAP_EXTEND : GAP_OPEN;
      const leftScore = scoreMatrix[rowOffset + (j - 1)] + leftCost;

      let bestScore = diagScore;
      let ptr = PTR_DIAG;

      if (upScore > bestScore) {
        bestScore = upScore;
        ptr = PTR_UP;
      }
      if (leftScore > bestScore) {
        bestScore = leftScore;
        ptr = PTR_LEFT;
      }

      scoreMatrix[rowOffset + j] = bestScore;
      pointerMatrix[rowOffset + j] = ptr;
    }
  }

  const finalScore = scoreMatrix[m * cols + n];

  // Trace back the alignment
  const alignedCharsA: string[] = [];
  const alignedCharsB: string[] = [];

  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const ptr = pointerMatrix[i * cols + j];
      if (ptr === PTR_DIAG) {
        alignedCharsA.push(seqA[i - 1]);
        alignedCharsB.push(seqB[j - 1]);
        i--;
        j--;
      } else if (ptr === PTR_UP) {
        alignedCharsA.push(seqA[i - 1]);
        alignedCharsB.push('-');
        i--;
      } else {
        alignedCharsA.push('-');
        alignedCharsB.push(seqB[j - 1]);
        j--;
      }
    } else if (i > 0) {
      alignedCharsA.push(seqA[i - 1]);
      alignedCharsB.push('-');
      i--;
    } else {
      alignedCharsA.push('-');
      alignedCharsB.push(seqB[j - 1]);
      j--;
    }
  }

  alignedCharsA.reverse();
  alignedCharsB.reverse();

  const alignedSeqA = alignedCharsA.join('');
  const alignedSeqB = alignedCharsB.join('');

  // Analyze position-by-position
  const positions: AlignmentPosition[] = [];
  const differences: MutationDifferenceItem[] = [];
  const midlineChars: string[] = [];

  let posCounterA = 0;
  let posCounterB = 0;

  let identicalResidues = 0;
  let conservativeSubstitutions = 0;
  let semiConservativeSubstitutions = 0;
  let mismatches = 0;
  let totalGaps = 0;
  let gapOpenings = 0;
  let inGap = false;

  for (let k = 0; k < alignedSeqA.length; k++) {
    const rA = alignedSeqA[k];
    const rB = alignedSeqB[k];

    const currentPosA = rA !== '-' ? ++posCounterA : null;
    const currentPosB = rB !== '-' ? ++posCounterB : null;

    const sim = categorizeSimilarity(rA, rB);
    midlineChars.push(sim.symbol);

    let mutationType: MutationType;
    let mutationDesc = '';

    if (rA === '-') {
      // Insertion into sequence B relative to reference A
      mutationType = 'insertion';
      mutationDesc = `Insertion of ${rB} at target position ${currentPosB}`;
      totalGaps++;
      if (!inGap) {
        gapOpenings++;
        inGap = true;
      }
      differences.push({
        alignmentColumn: k + 1,
        type: 'insertion',
        refResidue: '-',
        refPosition: currentPosA,
        targetResidue: rB,
        targetPosition: currentPosB,
        score: sim.score,
        notation: `ins-${currentPosB}${rB}`,
        chemicalChangeSummary: `Insertion of ${rB} (${getChemicalPropertyShift(rB, rB)})`,
      });
    } else if (rB === '-') {
      // Deletion in sequence B relative to reference A
      mutationType = 'deletion';
      mutationDesc = `Deletion of reference residue ${rA} (pos ${currentPosA})`;
      totalGaps++;
      if (!inGap) {
        gapOpenings++;
        inGap = true;
      }
      differences.push({
        alignmentColumn: k + 1,
        type: 'deletion',
        refResidue: rA,
        refPosition: currentPosA,
        targetResidue: '-',
        targetPosition: currentPosB,
        score: sim.score,
        notation: `del-${currentPosA}${rA}`,
        chemicalChangeSummary: `Loss of ${rA} (${getChemicalPropertyShift(rA, rA)})`,
      });
    } else {
      inGap = false;
      if (rA === rB) {
        identicalResidues++;
        mutationType = 'identical';
        mutationDesc = `Identical residue (${rA})`;
      } else {
        if (sim.category === 'conservative') {
          conservativeSubstitutions++;
          mutationType = 'conservative_substitution';
        } else if (sim.category === 'semi-conservative') {
          semiConservativeSubstitutions++;
          mutationType = 'semi_conservative_substitution';
        } else {
          mismatches++;
          mutationType = 'non_conservative_substitution';
        }
        mutationDesc = `Substitution ${rA}${currentPosA} → ${rB}${currentPosB} (${sim.category})`;

        differences.push({
          alignmentColumn: k + 1,
          type: 'substitution',
          category: sim.category as any,
          refResidue: rA,
          refPosition: currentPosA,
          targetResidue: rB,
          targetPosition: currentPosB,
          score: sim.score,
          notation: `${rA}${currentPosA}${rB}`,
          chemicalChangeSummary: getChemicalPropertyShift(rA, rB),
        });
      }
    }

    positions.push({
      index: k + 1,
      resA: rA,
      resB: rB,
      posA: currentPosA,
      posB: currentPosB,
      matrixScore: sim.score,
      similarityCategory: sim.category,
      mutationTypeRelativeA: mutationType,
      mutationDescription: mutationDesc,
    });
  }

  const alignedLength = alignedSeqA.length;
  const nonGapPairs = identicalResidues + conservativeSubstitutions + semiConservativeSubstitutions + mismatches;

  const identityIncludingGapsPercent =
    alignedLength > 0 ? Number(((identicalResidues / alignedLength) * 100).toFixed(2)) : 0;

  const identityExcludingGapsPercent =
    nonGapPairs > 0 ? Number(((identicalResidues / nonGapPairs) * 100).toFixed(2)) : null;

  const similarityPercent =
    alignedLength > 0
      ? Number((((identicalResidues + conservativeSubstitutions) / alignedLength) * 100).toFixed(2))
      : 0;

  const similarityExcludingGapsPercent =
    nonGapPairs > 0
      ? Number((((identicalResidues + conservativeSubstitutions) / nonGapPairs) * 100).toFixed(2))
      : null;

  const coverageAPercent =
    originalLenA > 0 ? Number(((posCounterA / originalLenA) * 100).toFixed(1)) : 100;
  const coverageBPercent =
    originalLenB > 0 ? Number(((posCounterB / originalLenB) * 100).toFixed(1)) : 100;

  const statistics: AlignmentStatistics = {
    alignmentScore: finalScore,
    alignedLength,
    identicalResidues,
    conservativeSubstitutions,
    semiConservativeSubstitutions,
    mismatches,
    totalSubstitutions: conservativeSubstitutions + semiConservativeSubstitutions + mismatches,
    totalGaps,
    gapOpenings,
    gapExtensions: Math.max(0, totalGaps - gapOpenings),
    seqALength: originalLenA,
    seqBLength: originalLenB,
    coverageAPercent,
    coverageBPercent,
    identityIncludingGapsPercent,
    identityExcludingGapsPercent,
    similarityPercent,
    similarityExcludingGapsPercent,
  };

  // Biological Interpretation synthesis
  let overallAssessment: BiologicalInterpretation['overallAssessment'] =
    'Divergent sequences / low sequence identity';
  let identityAssessment = '';
  let conservationAssessment = '';

  if (identityIncludingGapsPercent >= 70) {
    overallAssessment = 'High homology / likely homologous';
    identityAssessment = `High pairwise identity (${identityIncludingGapsPercent}% across all ${alignedLength} columns, including gaps; ${identityExcludingGapsPercent}% when excluding gaps). Sequences share substantial primary sequence conservation typical of closely related orthologs or paralogs.`;
  } else if (identityIncludingGapsPercent >= 35 || (identityExcludingGapsPercent && identityExcludingGapsPercent >= 40)) {
    overallAssessment = 'Moderate sequence similarity / potential shared fold';
    identityAssessment = `Moderate pairwise identity (${identityIncludingGapsPercent}% overall, ${identityExcludingGapsPercent}% excluding gaps). This degree of sequence similarity often falls into the twilight zone where a conserved 3D fold or core domain architecture may be maintained despite primary sequence drift.`;
  } else {
    overallAssessment = 'Divergent sequences / low sequence identity';
    identityAssessment = `Low sequence identity (${identityIncludingGapsPercent}% overall). At this level of divergence, sequence similarity is low and could represent distant evolutionary homology, convergent evolution, or unrelated functional classes.`;
  }

  conservationAssessment = `BLOSUM62 matrix evaluation revealed ${conservativeSubstitutions} conservative substitutions (chemically favored, positive matrix score) and ${semiConservativeSubstitutions} semi-conservative substitutions, raising the effective biochemical similarity to ${similarityPercent}% of all columns (${similarityExcludingGapsPercent}% of aligned residue pairs).`;

  const structuralFunctionalCaveat =
    'Crucial Biological Caveat: Sequence identity and similarity describe statistical alignment between linear amino-acid polymers. They do not, by themselves, prove identical biological function, enzymatic activity, or shared binding partners. Conversely, even a single critical point mutation in a catalytic active site or binding pocket can completely eliminate function while maintaining >99% overall sequence identity.';

  const mutationSummaryText = `Identified ${differences.length} difference(s) relative to Reference A: ${conservativeSubstitutions + semiConservativeSubstitutions + mismatches} amino-acid substitutions (${conservativeSubstitutions} conservative, ${semiConservativeSubstitutions} semi-conservative, ${mismatches} non-conservative) and ${totalGaps} gap position(s) across ${gapOpenings} indel event(s).`;

  const interpretation: BiologicalInterpretation = {
    overallAssessment,
    identityAssessment,
    conservationAssessment,
    structuralFunctionalCaveat,
    mutationSummaryText,
  };

  return {
    alignedSeqA,
    alignedSeqB,
    midlineSymbols: midlineChars.join(''),
    positions,
    differences,
    statistics,
    interpretation,
    scoringSchemeName: 'BLOSUM62 with Affine Gaps',
    truncated,
    maxLimitUsed: maxSequenceLength,
  };
}
