const UNIPROT_ACCESSION_REGEX =
  /^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})(-[0-9]+)?$/i;

const AMINO_ACID_SEQUENCE_REGEX = /^[ACDEFGHIKLMNPQRSTVWYBZXJUO]+$/i;

export interface InputValidationResult {
  isValid: boolean;
  trimmedInput: string;
  isAccession: boolean;
  errorMessage: string | null;
}

export function validateSearchInput(rawInput: string): InputValidationResult {
  const trimmed = (rawInput || '').trim();

  if (!trimmed) {
    return {
      isValid: false,
      trimmedInput: '',
      isAccession: false,
      errorMessage: 'Please enter a protein name (e.g., insulin) or a UniProt accession (e.g., P01308).',
    };
  }

  if (trimmed.length > 150) {
    return {
      isValid: false,
      trimmedInput: trimmed,
      isAccession: false,
      errorMessage: 'Search query is too long. Please enter a concise protein name, gene symbol, or UniProt accession.',
    };
  }

  const isAccession = UNIPROT_ACCESSION_REGEX.test(trimmed);

  return {
    isValid: true,
    trimmedInput: trimmed,
    isAccession,
    errorMessage: null,
  };
}

export function validateAminoAcidSequence(sequence: string | null | undefined): {
  isValid: boolean;
  cleanedSequence: string;
  error: string | null;
} {
  if (!sequence || typeof sequence !== 'string') {
    return {
      isValid: false,
      cleanedSequence: '',
      error: 'No amino-acid sequence is present in this record.',
    };
  }

  const cleaned = sequence.replace(/\s+/g, '').toUpperCase();
  if (cleaned.length === 0) {
    return {
      isValid: false,
      cleanedSequence: '',
      error: 'The retrieved sequence is empty.',
    };
  }

  if (!AMINO_ACID_SEQUENCE_REGEX.test(cleaned)) {
    return {
      isValid: false,
      cleanedSequence: cleaned,
      error: 'Sequence contains non-standard characters outside the IUPAC amino-acid alphabet.',
    };
  }

  return {
    isValid: true,
    cleanedSequence: cleaned,
    error: null,
  };
}
