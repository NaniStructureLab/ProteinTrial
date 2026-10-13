import { PdbCrossReference, PdbStructureDetails } from '../types/protein';
import { fetchWithTimeoutAndRetry } from './uniprotApi';

export async function fetchStructuresForProtein(
  accession: string,
  pdbCrossRefs: PdbCrossReference[]
): Promise<PdbStructureDetails[]> {
  const structures: PdbStructureDetails[] = [];
  const cleanAcc = accession.trim().toUpperCase();

  let pdbIds = pdbCrossRefs.slice(0, 12).map((ref) => ref.id.toUpperCase());

  if (pdbIds.length === 0) {
    try {
      const searchPayload = {
        query: {
          type: 'terminal',
          service: 'text',
          parameters: {
            attribute: 'rcsb_polymer_entity_container_identifiers.uniprot_ids',
            operator: 'exact_match',
            value: cleanAcc,
          },
        },
        return_type: 'entry',
        request_options: {
          paginate: { start: 0, rows: 10 },
        },
      };

      const searchRes = await fetchWithTimeoutAndRetry(
        'https://search.rcsb.org/rcsbsearch/v2/query',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchPayload),
        },
        10000,
        1
      );

      if (searchRes.ok && searchRes.status !== 204) {
        const searchJson = await searchRes.json();
        if (Array.isArray(searchJson?.result_set)) {
          pdbIds = searchJson.result_set
            .map((item: any) => String(item.identifier || '').toUpperCase())
            .filter(Boolean)
            .slice(0, 10);
        }
      }
    } catch {
      // proceed to AlphaFold check
    }
  }

  if (pdbIds.length > 0) {
    const graphqlQuery = `
      query GetEntries($ids: [String!]!) {
        entries(entry_ids: $ids) {
          rcsb_id
          struct {
            title
          }
          exptl {
            method
          }
          rcsb_entry_info {
            resolution_combined
            deposited_atom_count
            experimental_method
          }
          rcsb_accession_info {
            initial_release_date
          }
          rcsb_primary_citation {
            title
            pdbx_database_id_PubMed
          }
          polymer_entities {
            rcsb_entity_source_organism {
              ncbi_scientific_name
            }
          }
        }
      }
    `;

    try {
      const gqlRes = await fetchWithTimeoutAndRetry(
        'https://data.rcsb.org/graphql',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: graphqlQuery,
            variables: { ids: pdbIds },
          }),
        },
        10000,
        1
      );

      if (gqlRes.ok) {
        const gqlJson = await gqlRes.json();
        const entries = gqlJson?.data?.entries;

        if (Array.isArray(entries)) {
          const xrefMap = new Map<string, PdbCrossReference>();
          for (const xr of pdbCrossRefs) {
            xrefMap.set(xr.id.toUpperCase(), xr);
          }

          for (const entry of entries) {
            if (!entry?.rcsb_id) continue;
            const id = String(entry.rcsb_id).toUpperCase();
            const xref = xrefMap.get(id);

            const methodFromGql =
              Array.isArray(entry.exptl) && entry.exptl[0]?.method
                ? String(entry.exptl[0].method)
                : entry.rcsb_entry_info?.experimental_method
                ? String(entry.rcsb_entry_info.experimental_method)
                : xref?.method || 'Experimental structure';

            const resArr = entry.rcsb_entry_info?.resolution_combined;
            let resolutionAngstrom: number | null =
              Array.isArray(resArr) && typeof resArr[0] === 'number'
                ? Number(resArr[0].toFixed(2))
                : null;

            if (resolutionAngstrom === null && xref?.resolution) {
              const parsed = parseFloat(xref.resolution);
              if (!Number.isNaN(parsed)) {
                resolutionAngstrom = parsed;
              }
            }

            const orgName =
              entry.polymer_entities?.[0]?.rcsb_entity_source_organism?.[0]
                ?.ncbi_scientific_name || null;

            structures.push({
              pdbId: id,
              title: entry.struct?.title ? String(entry.struct.title) : null,
              experimentalMethod: methodFromGql,
              isPredictedModel: false,
              resolutionAngstrom,
              organism: orgName ? String(orgName) : null,
              releaseDate: entry.rcsb_accession_info?.initial_release_date
                ? String(entry.rcsb_accession_info.initial_release_date).slice(0, 10)
                : null,
              depositedAtomCount:
                typeof entry.rcsb_entry_info?.deposited_atom_count === 'number'
                  ? entry.rcsb_entry_info.deposited_atom_count
                  : null,
              chainsSummary: xref?.chains || null,
              citationTitle: entry.rcsb_primary_citation?.title
                ? String(entry.rcsb_primary_citation.title)
                : null,
              pubMedId:
                typeof entry.rcsb_primary_citation?.pdbx_database_id_PubMed === 'number'
                  ? entry.rcsb_primary_citation.pdbx_database_id_PubMed
                  : null,
              sourceUrl: `https://www.rcsb.org/structure/${encodeURIComponent(id)}`,
              sourceType: 'RCSB PDB',
              cifUrl: `https://files.rcsb.org/download/${encodeURIComponent(id)}.cif`,
            });
          }
        }
      }
    } catch {
      for (const xr of pdbCrossRefs.slice(0, 10)) {
        const resVal = xr.resolution ? parseFloat(xr.resolution) : NaN;
        structures.push({
          pdbId: xr.id.toUpperCase(),
          title: `PDB structure cross-referenced in UniProt (${xr.id})`,
          experimentalMethod: xr.method || 'Experimental method (see PDB record)',
          isPredictedModel: false,
          resolutionAngstrom: !Number.isNaN(resVal) ? resVal : null,
          organism: null,
          releaseDate: null,
          depositedAtomCount: null,
          chainsSummary: xr.chains,
          citationTitle: null,
          pubMedId: null,
          sourceUrl: xr.sourceUrl,
          sourceType: 'RCSB PDB',
          cifUrl: `https://files.rcsb.org/download/${encodeURIComponent(xr.id.toUpperCase())}.cif`,
        });
      }
    }
  }

  try {
    const afRes = await fetchWithTimeoutAndRetry(
      `https://alphafold.ebi.ac.uk/api/prediction/${encodeURIComponent(cleanAcc)}`,
      {},
      8000,
      1
    );
    if (afRes.ok) {
      const afData = await afRes.json();
      if (Array.isArray(afData) && afData.length > 0 && afData[0]?.cifUrl) {
        const afModel = afData[0];
        const afId = String(afModel.entryId || `AF-${cleanAcc}-F1`);
        structures.push({
          pdbId: afId,
          title: `AlphaFold Monomer v6 Predicted Structure for ${afModel.uniprotDescription || cleanAcc}`,
          experimentalMethod: 'Predicted by AlphaFold (Computational Model — Not Experimental)',
          isPredictedModel: true,
          resolutionAngstrom: null,
          organism: afModel.organismScientificName ? String(afModel.organismScientificName) : null,
          releaseDate: null,
          depositedAtomCount: null,
          chainsSummary:
            afModel.uniprotStart && afModel.uniprotEnd
              ? `A=${afModel.uniprotStart}-${afModel.uniprotEnd}`
              : null,
          citationTitle: 'Highly accurate protein structure prediction with AlphaFold',
          pubMedId: 34265844,
          sourceUrl: `https://alphafold.ebi.ac.uk/entry/${encodeURIComponent(cleanAcc)}`,
          sourceType: 'AlphaFold DB',
          cifUrl: String(afModel.cifUrl),
        });
      }
    }
  } catch {
    // Non-fatal
  }

  return structures;
}
