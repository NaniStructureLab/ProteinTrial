import {
  NormalizedProteinRecord,
  SequenceFeature,
  PdbCrossReference,
  CrossReferenceItem,
} from '../types/protein';
import { validateAminoAcidSequence } from './validation';

function buildCrossReferenceUrl(database: string, id: string): string | null {
  const db = database.toUpperCase();
  if (db === 'PDB') return `https://www.rcsb.org/structure/${encodeURIComponent(id)}`;
  if (db === 'ALPHAFOLDDB') return `https://alphafold.ebi.ac.uk/entry/${encodeURIComponent(id)}`;
  if (db === 'INTERPRO') return `https://www.ebi.ac.uk/interpro/entry/InterPro/${encodeURIComponent(id)}/`;
  if (db === 'PFAM') return `https://www.ebi.ac.uk/interpro/entry/pfam/${encodeURIComponent(id)}/`;
  if (db === 'REACTOME') return `https://reactome.org/content/detail/${encodeURIComponent(id)}`;
  if (db === 'STRING') return `https://string-db.org/network/${encodeURIComponent(id)}`;
  if (db === 'GO') return `https://www.ebi.ac.uk/QuickGO/term/${encodeURIComponent(id)}`;
  if (db === 'ENSEMBL') return `https://www.ensembl.org/id/${encodeURIComponent(id)}`;
  if (db === 'HGNC') return `https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/${encodeURIComponent(id)}`;
  if (db === 'MIM') return `https://www.omim.org/entry/${encodeURIComponent(id)}`;
  if (db === 'CHEMBL') return `https://www.ebi.ac.uk/chembl/target_report_card/${encodeURIComponent(id)}/`;
  if (db === 'DRUGBANK') return `https://go.drugbank.com/drugs/${encodeURIComponent(id)}`;
  if (db === 'REFSEQ') return `https://www.ncbi.nlm.nih.gov/protein/${encodeURIComponent(id)}`;
  if (db === 'GENEID') return `https://www.ncbi.nlm.nih.gov/gene/${encodeURIComponent(id)}`;
  return null;
}

export function normalizeProteinRecord(raw: any): NormalizedProteinRecord {
  if (!raw || typeof raw !== 'object' || !raw.primaryAccession) {
    throw new Error('Malformed UniProt record: primaryAccession is missing.');
  }

  const accession: string = String(raw.primaryAccession);
  const uniProtId: string | null = raw.uniProtkbId ? String(raw.uniProtkbId) : null;

  const desc = raw.proteinDescription;
  let proteinName = 'Unnamed protein record';
  const synonyms: string[] = [];

  if (desc?.recommendedName?.fullName?.value) {
    proteinName = String(desc.recommendedName.fullName.value);
    if (Array.isArray(desc.recommendedName.shortNames)) {
      for (const s of desc.recommendedName.shortNames) {
        if (s?.value) synonyms.push(String(s.value));
      }
    }
  } else if (Array.isArray(desc?.submissionNames) && desc.submissionNames[0]?.fullName?.value) {
    proteinName = String(desc.submissionNames[0].fullName.value);
  } else if (Array.isArray(desc?.alternativeNames) && desc.alternativeNames[0]?.fullName?.value) {
    proteinName = String(desc.alternativeNames[0].fullName.value);
  }

  if (Array.isArray(desc?.alternativeNames)) {
    for (const alt of desc.alternativeNames) {
      if (alt?.fullName?.value && alt.fullName.value !== proteinName) {
        synonyms.push(String(alt.fullName.value));
      }
    }
  }

  const organism: string = raw.organism?.scientificName
    ? String(raw.organism.scientificName)
    : 'Unknown organism';
  const taxonId: number | null =
    typeof raw.organism?.taxonId === 'number' ? raw.organism.taxonId : null;

  let geneName: string | null = null;
  const geneSynonyms: string[] = [];
  if (Array.isArray(raw.genes) && raw.genes.length > 0) {
    const primaryGene = raw.genes[0];
    if (primaryGene?.geneName?.value) {
      geneName = String(primaryGene.geneName.value);
    } else if (Array.isArray(primaryGene?.orderedLocusNames) && primaryGene.orderedLocusNames[0]?.value) {
      geneName = String(primaryGene.orderedLocusNames[0].value);
    }
    if (Array.isArray(primaryGene?.synonyms)) {
      for (const syn of primaryGene.synonyms) {
        if (syn?.value) geneSynonyms.push(String(syn.value));
      }
    }
  }

  const rawSeq: string | null =
    typeof raw.sequence?.value === 'string' ? raw.sequence.value : null;
  const seqValidation = validateAminoAcidSequence(rawSeq);
  const sequence: string | null = seqValidation.isValid ? seqValidation.cleanedSequence : null;
  const sequenceLength: number | null = sequence ? sequence.length : null;
  const reportedSequenceLength: number | null =
    typeof raw.sequence?.length === 'number' ? raw.sequence.length : null;

  const sequenceLengthMatchesReported =
    sequenceLength !== null && reportedSequenceLength !== null
      ? sequenceLength === reportedSequenceLength
      : sequenceLength !== null || reportedSequenceLength !== null;

  const massDa: number | null =
    typeof raw.sequence?.molWeight === 'number' ? raw.sequence.molWeight : null;

  const entryType = String(raw.entryType || '');
  let recordStatus = 'Unknown status';
  if (entryType.toLowerCase().includes('unreviewed') || entryType.toLowerCase().includes('trembl')) {
    recordStatus = 'Unreviewed (UniProtKB/TrEMBL)';
  } else if (entryType.toLowerCase().includes('reviewed') || entryType.toLowerCase().includes('swiss-prot')) {
    recordStatus = 'Reviewed (UniProtKB/Swiss-Prot)';
  } else if (entryType) {
    recordStatus = entryType;
  }

  const proteinExistence: string | null = raw.proteinExistence
    ? String(raw.proteinExistence)
    : null;

  let functionAnnotation: string | null = null;
  const catalyticActivity: string[] = [];
  const subcellularLocations: string[] = [];
  let subunitNote: string | null = null;
  const diseases: Array<{ name: string; description: string; mimId?: string }> = [];

  if (Array.isArray(raw.comments)) {
    const funcTexts: string[] = [];
    for (const comment of raw.comments) {
      if (comment?.commentType === 'FUNCTION' && Array.isArray(comment.texts)) {
        for (const t of comment.texts) {
          if (t?.value) funcTexts.push(String(t.value));
        }
      } else if (comment?.commentType === 'CATALYTIC ACTIVITY' && comment.reaction?.name) {
        catalyticActivity.push(String(comment.reaction.name));
      } else if (comment?.commentType === 'SUBCELLULAR LOCATION' && Array.isArray(comment.subcellularLocations)) {
        for (const loc of comment.subcellularLocations) {
          if (loc?.location?.value) {
            subcellularLocations.push(String(loc.location.value));
          }
        }
      } else if (comment?.commentType === 'SUBUNIT' && Array.isArray(comment.texts) && comment.texts[0]?.value) {
        subunitNote = String(comment.texts[0].value);
      } else if (comment?.commentType === 'DISEASE' && comment.disease) {
        diseases.push({
          name: String(comment.disease.diseaseId || comment.disease.acronym || 'Associated condition'),
          description: String(comment.disease.description || ''),
          mimId: comment.disease.diseaseCrossReference?.id
            ? String(comment.disease.diseaseCrossReference.id)
            : undefined,
        });
      }
    }
    if (funcTexts.length > 0) {
      functionAnnotation = funcTexts.join(' ');
    }
  }

  const features: SequenceFeature[] = [];
  if (Array.isArray(raw.features)) {
    for (const feat of raw.features) {
      if (!feat?.type) continue;
      const start =
        typeof feat.location?.start?.value === 'number' ? feat.location.start.value : null;
      const end =
        typeof feat.location?.end?.value === 'number' ? feat.location.end.value : null;
      features.push({
        type: String(feat.type),
        description: feat.description ? String(feat.description) : '',
        start,
        end,
        evidencesCount: Array.isArray(feat.evidences) ? feat.evidences.length : 0,
      });
    }
  }

  const pdbCrossReferences: PdbCrossReference[] = [];
  const otherCrossReferences: CrossReferenceItem[] = [];

  if (Array.isArray(raw.uniProtKBCrossReferences)) {
    for (const xref of raw.uniProtKBCrossReferences) {
      if (!xref?.database || !xref?.id) continue;
      const db = String(xref.database);
      const id = String(xref.id);
      const props: Record<string, string> = {};

      if (Array.isArray(xref.properties)) {
        for (const p of xref.properties) {
          if (p?.key && p?.value && p.value !== '-') {
            props[String(p.key)] = String(p.value);
          }
        }
      }

      if (db === 'PDB') {
        pdbCrossReferences.push({
          id,
          method: props.Method || null,
          resolution: props.Resolution || null,
          chains: props.Chains || null,
          sourceUrl: `https://www.rcsb.org/structure/${encodeURIComponent(id)}`,
        });
      } else {
        const importantDbs = new Set([
          'AlphaFoldDB',
          'InterPro',
          'Pfam',
          'PROSITE',
          'SMART',
          'Reactome',
          'STRING',
          'GO',
          'Ensembl',
          'HGNC',
          'MIM',
          'ChEMBL',
          'DrugBank',
          'RefSeq',
          'GeneID',
        ]);
        if (importantDbs.has(db) && otherCrossReferences.length < 40) {
          otherCrossReferences.push({
            database: db,
            id,
            properties: props,
            url: buildCrossReferenceUrl(db, id),
          });
        }
      }
    }
  }

  const keywords: string[] = [];
  if (Array.isArray(raw.keywords)) {
    for (const kw of raw.keywords) {
      if (kw?.name) keywords.push(String(kw.name));
    }
  }

  return {
    accession,
    uniProtId,
    proteinName,
    synonyms,
    organism,
    taxonId,
    geneName,
    geneSynonyms,
    sequence,
    sequenceLength,
    reportedSequenceLength,
    sequenceLengthMatchesReported,
    massDa,
    recordStatus,
    proteinExistence,
    functionAnnotation,
    catalyticActivity,
    subcellularLocations,
    subunitNote,
    diseases,
    features,
    pdbCrossReferences,
    otherCrossReferences,
    keywords,
    source: 'UniProtKB',
    sourceUrl: `https://www.uniprot.org/uniprotkb/${encodeURIComponent(accession)}`,
    retrievedAt: new Date().toISOString(),
  };
}
