import {
  NormalizedProteinRecord,
  EvidenceTrailEntry,
  EvidenceStatus,
  PdbStructureDetails,
} from '../types/protein';

export interface StructureLookupState {
  checked: boolean;
  loading: boolean;
  error: string | null;
  structures: PdbStructureDetails[];
}

export function buildEvidenceTrail(
  record: NormalizedProteinRecord,
  structureLookup: StructureLookupState
): EvidenceTrailEntry[] {
  const entries: EvidenceTrailEntry[] = [];

  const hasIdentity = Boolean(record.accession && record.proteinName && record.proteinName !== 'Unnamed protein record');
  entries.push({
    id: 'identity',
    category: 'Protein identity',
    dataSource: 'UniProtKB',
    recordIdentifier: record.accession,
    status: hasIdentity ? 'Available' : 'Not annotated',
    explanation: hasIdentity
      ? `Primary accession ${record.accession}${record.uniProtId ? ` (${record.uniProtId})` : ''} and recommended name "${record.proteinName}" retrieved from ${record.recordStatus}.`
      : `Record ${record.accession} was retrieved, but a curated recommended protein name is not annotated.`,
    sourceUrl: record.sourceUrl,
    details: record.synonyms.length > 0
      ? `Includes ${record.synonyms.length} alternative name(s)/synonym(s).`
      : 'No alternative synonyms listed in the source record.',
  });

  const hasSequence = Boolean(record.sequence && record.sequenceLength && record.sequenceLength > 0);
  entries.push({
    id: 'sequence',
    category: 'Amino-acid sequence',
    dataSource: 'UniProtKB Sequence Archive',
    recordIdentifier: record.accession,
    status: hasSequence ? 'Available' : 'Not annotated',
    explanation: hasSequence
      ? `Canonical amino-acid sequence retrieved (${record.sequenceLength} residues${
          record.sequenceLengthMatchesReported
            ? ', verified against reported database length'
            : `, database metadata reported ${record.reportedSequenceLength ?? 'N/A'}`
        }).`
      : 'The UniProtKB entry was retrieved, but a valid canonical amino-acid sequence is not annotated in the record.',
    sourceUrl: `${record.sourceUrl}#sequences`,
    details: record.massDa
      ? `Calculated molecular mass: ${record.massDa.toLocaleString()} Da.`
      : undefined,
  });

  const hasFunction = Boolean(record.functionAnnotation && record.functionAnnotation.trim().length > 0);
  entries.push({
    id: 'function',
    category: 'Biological function',
    dataSource: 'UniProtKB Function [CC]',
    recordIdentifier: record.accession,
    status: hasFunction ? 'Available' : 'Not annotated',
    explanation: hasFunction
      ? 'Curated functional annotation (FUNCTION comment block) is present in the retrieved UniProtKB record.'
      : 'The UniProtKB record was retrieved, but a general FUNCTION text annotation is not annotated. Absence of annotation does not imply the protein lacks biological activity.',
    sourceUrl: `${record.sourceUrl}#function`,
    details:
      record.catalyticActivity.length > 0
        ? `Includes ${record.catalyticActivity.length} catalytic reaction annotation(s).`
        : undefined,
  });

  const hasGeneAndOrganism = Boolean(record.organism && record.organism !== 'Unknown organism' && record.geneName);
  const hasOnlyOrganism = Boolean(record.organism && record.organism !== 'Unknown organism' && !record.geneName);
  entries.push({
    id: 'gene-organism',
    category: 'Gene and organism information',
    dataSource: 'UniProtKB / NCBI Taxonomy',
    recordIdentifier: record.geneName
      ? `${record.geneName} (TaxID: ${record.taxonId ?? 'N/A'})`
      : record.taxonId
      ? `TaxID: ${record.taxonId}`
      : record.accession,
    status: hasGeneAndOrganism ? 'Available' : 'Not annotated',
    explanation: hasGeneAndOrganism
      ? `Source organism "${record.organism}"${record.taxonId ? ` (NCBI TaxID ${record.taxonId})` : ''} and primary gene symbol "${record.geneName}" are annotated.`
      : hasOnlyOrganism
      ? `Source organism "${record.organism}" is available, but a primary gene symbol is not annotated in the retrieved record.`
      : 'Gene and organism identifiers are not annotated in this record.',
    sourceUrl: record.taxonId
      ? `https://www.uniprot.org/taxonomy/${record.taxonId}`
      : record.sourceUrl,
    details:
      record.geneSynonyms.length > 0
        ? `Gene synonyms: ${record.geneSynonyms.join(', ')}`
        : undefined,
  });

  const hasFeatures = record.features.length > 0;
  entries.push({
    id: 'features',
    category: 'Sequence features',
    dataSource: 'UniProtKB Feature Table [FT]',
    recordIdentifier: hasFeatures ? `${record.features.length} feature(s) in ${record.accession}` : record.accession,
    status: hasFeatures ? 'Available' : 'Not annotated',
    explanation: hasFeatures
      ? `Retrieved ${record.features.length} positional sequence feature annotation(s) (domains, chains, active/binding sites, or variants).`
      : 'No positional sequence features are annotated in the retrieved UniProtKB record.',
    sourceUrl: `${record.sourceUrl}#family_and_domains`,
  });

  let structStatus: EvidenceStatus = 'Not checked';
  let structExplanation = '';
  let structId: string | null = null;
  let structSource = 'RCSB PDB / UniProtKB Cross-References';
  let structUrl = `https://www.rcsb.org/search?request=%7B%22query%22%3A%7B%22type%22%3A%22terminal%22%2C%22service%22%3A%22text%22%2C%22parameters%22%3A%7B%22attribute%22%3A%22rcsb_polymer_entity_container_identifiers.uniprot_ids%22%2C%22operator%22%3A%22exact_match%22%2C%22value%22%3A%22${encodeURIComponent(
    record.accession
  )}%22%7D%7D%2C%22return_type%22%3A%22entry%22%7D`;

  if (!structureLookup.checked) {
    structStatus = 'Not checked';
    structId =
      record.pdbCrossReferences.length > 0
        ? `${record.pdbCrossReferences.length} UniProt PDB xref(s) listed`
        : null;
    structExplanation =
      record.pdbCrossReferences.length > 0
        ? `UniProt lists ${record.pdbCrossReferences.length} PDB cross-reference(s) (${record.pdbCrossReferences
            .slice(0, 4)
            .map((x) => x.id)
            .join(', ')}${record.pdbCrossReferences.length > 4 ? '...' : ''}), but live structure metadata verification has not been run yet.`
        : 'Live 3D structure lookup against RCSB PDB / AlphaFold DB has not been performed yet.';
  } else if (structureLookup.error) {
    structStatus = 'Retrieval failed';
    structId = record.pdbCrossReferences[0]?.id ?? record.accession;
    structExplanation = `Structure lookup could not be completed due to a technical problem: ${structureLookup.error}`;
  } else if (structureLookup.structures.length === 0) {
    structStatus = 'No matching record found';
    structId = null;
    structExplanation =
      'The structure lookup completed across UniProt PDB cross-references and RCSB PDB without finding a matching structure record. This does not prove that no structure exists in any database.';
  } else {
    structStatus = 'Available';
    const first = structureLookup.structures[0];
    const expCount = structureLookup.structures.filter((s) => !s.isPredictedModel).length;
    const predCount = structureLookup.structures.filter((s) => s.isPredictedModel).length;
    structId = structureLookup.structures
      .slice(0, 5)
      .map((s) => s.pdbId)
      .join(', ') + (structureLookup.structures.length > 5 ? ` (+${structureLookup.structures.length - 5} more)` : '');
    structSource =
      expCount > 0 && predCount > 0
        ? 'RCSB PDB & AlphaFold DB'
        : expCount > 0
        ? 'RCSB Protein Data Bank'
        : 'AlphaFold Protein Structure Database';
    structUrl = first.sourceUrl;
    structExplanation = `Retrieved ${structureLookup.structures.length} structure record(s) (${expCount} experimental PDB entry/entries, ${predCount} predicted computational model(s)). Primary record: ${first.pdbId}.`;
  }

  entries.push({
    id: 'structures',
    category: 'Three-dimensional structure records',
    dataSource: structSource,
    recordIdentifier: structId,
    status: structStatus,
    explanation: structExplanation,
    sourceUrl: structUrl,
  });

  return entries;
}
