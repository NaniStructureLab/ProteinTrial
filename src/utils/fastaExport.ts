import { NormalizedProteinRecord } from '../types/protein';
import { validateAminoAcidSequence } from './validation';

export function formatFastaString(record: NormalizedProteinRecord, lineWidth = 60): string | null {
  const validation = validateAminoAcidSequence(record.sequence);
  if (!validation.isValid) {
    return null;
  }

  const dbPrefix = record.recordStatus.toLowerCase().includes('reviewed') &&
    !record.recordStatus.toLowerCase().includes('unreviewed')
    ? 'sp'
    : 'tr';

  const entryId = record.uniProtId || record.accession;
  const genePart = record.geneName ? ` GN=${record.geneName}` : '';
  const taxPart = record.taxonId ? ` OX=${record.taxonId}` : '';

  const header = `>${dbPrefix}|${record.accession}|${entryId} ${record.proteinName} OS=${record.organism}${taxPart}${genePart}`;

  const seq = validation.cleanedSequence;
  const lines: string[] = [header];

  for (let i = 0; i < seq.length; i += lineWidth) {
    lines.push(seq.slice(i, i + lineWidth));
  }

  return lines.join('\n') + '\n';
}

export function downloadFastaFile(record: NormalizedProteinRecord): {
  success: boolean;
  error?: string;
} {
  const fastaContent = formatFastaString(record);
  if (!fastaContent) {
    return {
      success: false,
      error: 'Cannot generate FASTA file: source amino-acid sequence is unavailable or invalid.',
    };
  }

  const blob = new Blob([fastaContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeAcc = record.accession.replace(/[^A-Za-z0-9_-]/g, '');
  link.href = url;
  link.download = `${safeAcc || 'protein'}.fasta`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true };
}
