/**
 * NCBI standard BLOSUM62 substitution matrix.
 * Positive scores (> 0) represent conservative substitutions observed more frequently than by chance.
 * Neutral scores (0) represent semi-conservative substitutions.
 * Negative scores (< 0) represent non-conservative substitutions / mismatches.
 */
export const BLOSUM62_ORDER = 'ARNDCQEGHILKMFPSTWYV';

// 20 x 20 symmetric matrix for canonical amino acids
const RAW_BLOSUM62: number[][] = [
  /* A */ [ 4, -1, -2, -2,  0, -1, -1,  0, -2, -1, -1, -1, -1, -2, -1,  1,  0, -3, -2,  0],
  /* R */ [-1,  5,  0, -2, -3,  1,  0, -2,  0, -3, -2,  2, -1, -3, -2, -1, -1, -3, -2, -3],
  /* N */ [-2,  0,  6,  1, -3,  0,  0,  0,  1, -3, -3,  0, -2, -3, -2,  1,  0, -4, -2, -3],
  /* D */ [-2, -2,  1,  6, -3,  0,  2, -1, -1, -3, -4, -1, -3, -3, -1,  0, -1, -4, -3, -3],
  /* C */ [ 0, -3, -3, -3,  9, -3, -4, -3, -3, -1, -1, -3, -1, -2, -3, -1, -1, -2, -2, -1],
  /* Q */ [-1,  1,  0,  0, -3,  5,  2, -2,  0, -3, -2,  1,  0, -3, -1,  0, -1, -2, -1, -2],
  /* E */ [-1,  0,  0,  2, -4,  2,  5, -2,  0, -3, -3,  1, -2, -3, -1,  0, -1, -3, -2, -2],
  /* G */ [ 0, -2,  0, -1, -3, -2, -2,  6, -2, -4, -4, -2, -3, -3, -2,  0, -2, -2, -3, -3],
  /* H */ [-2,  0,  1, -1, -3,  0,  0, -2,  8, -3, -3, -1, -2, -1, -2, -1, -2, -2,  2, -3],
  /* I */ [-1, -3, -3, -3, -1, -3, -3, -4, -3,  4,  2, -3,  1,  0, -3, -2, -1, -3, -1,  3],
  /* L */ [-1, -2, -3, -4, -1, -2, -3, -4, -3,  2,  4, -2,  2,  0, -3, -2, -1, -2, -1,  1],
  /* K */ [-1,  2,  0, -1, -3,  1,  1, -2, -1, -3, -2,  5, -1, -3, -1,  0, -1, -3, -2, -2],
  /* M */ [-1, -1, -2, -3, -1,  0, -2, -3, -2,  1,  2, -1,  5,  0, -2, -1, -1, -1, -1,  1],
  /* F */ [-2, -3, -3, -3, -2, -3, -3, -3, -1,  0,  0, -3,  0,  6, -4, -2, -2,  1,  3, -1],
  /* P */ [-1, -2, -2, -1, -3, -1, -1, -2, -2, -3, -3, -1, -2, -4,  7, -1, -1, -4, -3, -2],
  /* S */ [ 1, -1,  1,  0, -1,  0,  0,  0, -1, -2, -2,  0, -1, -2, -1,  4,  1, -3, -2, -2],
  /* T */ [ 0, -1,  0, -1, -1, -1, -1, -2, -2, -1, -1, -1, -1, -2, -1,  1,  5, -2, -2,  0],
  /* W */ [-3, -3, -4, -4, -2, -2, -3, -2, -2, -3, -2, -3, -1,  1, -4, -3, -2, 11,  2, -3],
  /* Y */ [-2, -2, -2, -3, -2, -1, -2, -3,  2, -1, -1, -2, -1,  3, -3, -2, -2,  2,  7, -1],
  /* V */ [ 0, -3, -3, -3, -1, -2, -2, -3, -3,  3,  1, -2,  1, -1, -2, -2,  0, -3, -1,  4]
];

const AA_TO_INDEX: Record<string, number> = {};
for (let i = 0; i < BLOSUM62_ORDER.length; i++) {
  AA_TO_INDEX[BLOSUM62_ORDER[i]] = i;
}

/**
 * Returns the BLOSUM62 score for a pair of amino acids.
 */
export function getBlosum62Score(aa1: string, aa2: string): number {
  const i1 = AA_TO_INDEX[aa1.toUpperCase()];
  const i2 = AA_TO_INDEX[aa2.toUpperCase()];
  if (i1 !== undefined && i2 !== undefined) {
    return RAW_BLOSUM62[i1][i2];
  }
  // Fallback for non-standard / ambiguous characters (X, B, Z, etc.)
  if (aa1.toUpperCase() === aa2.toUpperCase()) return 1;
  return -1;
}

/**
 * Categorizes the biochemical similarity of a pair of amino acids.
 */
export function categorizeSimilarity(aa1: string, aa2: string): {
  category: 'identical' | 'conservative' | 'semi-conservative' | 'non-conservative' | 'gap';
  symbol: string;
  description: string;
  score: number;
} {
  if (aa1 === '-' || aa2 === '-') {
    return {
      category: 'gap',
      symbol: ' ',
      description: 'Gap (insertion or deletion)',
      score: -1,
    };
  }

  if (aa1.toUpperCase() === aa2.toUpperCase()) {
    const score = getBlosum62Score(aa1, aa2);
    return {
      category: 'identical',
      symbol: '|',
      description: 'Identical amino acid match',
      score,
    };
  }

  const score = getBlosum62Score(aa1, aa2);
  if (score > 0) {
    return {
      category: 'conservative',
      symbol: ':',
      description: 'Conservative substitution (chemically similar, BLOSUM62 > 0)',
      score,
    };
  }
  if (score === 0) {
    return {
      category: 'semi-conservative',
      symbol: '.',
      description: 'Semi-conservative substitution (weakly similar, BLOSUM62 = 0)',
      score,
    };
  }
  return {
    category: 'non-conservative',
    symbol: ' ',
    description: 'Non-conservative mismatch (different chemical properties, BLOSUM62 < 0)',
    score,
  };
}

/**
 * Summarizes the chemical property shift between two amino acids.
 */
export function getChemicalPropertyShift(refAa: string, targetAa: string): string {
  const properties: Record<string, string> = {
    A: 'Hydrophobic / Aliphatic',
    V: 'Hydrophobic / Aliphatic (branched)',
    I: 'Hydrophobic / Aliphatic (branched)',
    L: 'Hydrophobic / Aliphatic (branched)',
    M: 'Hydrophobic (sulfur-containing)',
    F: 'Aromatic / Hydrophobic',
    Y: 'Aromatic / Polar',
    W: 'Aromatic / Bulky hydrophobic',
    P: 'Rigid imino acid / Helix-breaker',
    G: 'Small flexible / Achiral',
    C: 'Thiol / Disulfide-forming',
    S: 'Polar uncharged (hydroxyl)',
    T: 'Polar uncharged (hydroxyl)',
    N: 'Polar uncharged (amide)',
    Q: 'Polar uncharged (amide)',
    D: 'Negatively charged (acidic)',
    E: 'Negatively charged (acidic)',
    K: 'Positively charged (basic)',
    R: 'Positively charged (basic / guanidinium)',
    H: 'Positively charged / Histidine imidazole (aromatic)',
  };

  const p1 = properties[refAa.toUpperCase()] || 'Unclassified';
  const p2 = properties[targetAa.toUpperCase()] || 'Unclassified';
  if (p1 === p2) {
    return `Retained ${p1} character`;
  }
  return `${p1} → ${p2}`;
}
