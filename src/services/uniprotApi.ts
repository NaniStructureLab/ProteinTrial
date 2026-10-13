import { NormalizedProteinRecord } from '../types/protein';
import { normalizeProteinRecord } from '../utils/normalizeProteinRecord';

const UNIPROT_BASE_URL = 'https://rest.uniprot.org/uniprotkb';

export async function fetchWithTimeoutAndRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12000,
  maxRetries = 2
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
        headers: {
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      if (response.status === 404) {
        return response;
      }

      if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
        const retryAfter = Number(response.headers.get('Retry-After'));
        const delayMs =
          !Number.isNaN(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 600 * Math.pow(2, attempt);
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }

      const errText = await response.text().catch(() => '');
      throw new Error(
        `UniProt API returned HTTP ${response.status} (${response.statusText}). ${errText.slice(0, 200)}`
      );
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        throw new Error(
          'The request to the UniProt database timed out. Please check your internet connection and retry.'
        );
      }
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((res) => setTimeout(res, 600 * Math.pow(2, attempt)));
    }
  }
  throw new Error('Failed to reach the UniProt REST API after multiple attempts.');
}

export async function fetchUniProtByAccession(
  accession: string,
  signal?: AbortSignal
): Promise<NormalizedProteinRecord | null> {
  const cleanAcc = accession.trim().toUpperCase();
  const url = `${UNIPROT_BASE_URL}/${encodeURIComponent(cleanAcc)}.json`;

  const response = await fetchWithTimeoutAndRetry(url, { signal });
  if (response.status === 404) {
    return null;
  }

  const data = await response.json();
  if (!data || !data.primaryAccession) {
    throw new Error('Unexpected response format received from UniProtKB entry endpoint.');
  }

  return normalizeProteinRecord(data);
}

export interface UniProtSearchResponse {
  results: NormalizedProteinRecord[];
  totalResults: number | null;
  nextOffset: number | null;
  queryUsed: string;
}

export async function searchUniProtRecords(params: {
  query: string;
  organism?: string;
  reviewedOnly?: boolean;
  size?: number;
  offset?: number;
  signal?: AbortSignal;
}): Promise<UniProtSearchResponse> {
  const {
    query,
    organism,
    reviewedOnly = false,
    size = 10,
    offset = 0,
    signal,
  } = params;

  const trimmedQuery = query.trim();
  const clauses: string[] = [trimmedQuery];

  if (organism && organism.trim()) {
    clauses.push(`organism_name:"${organism.trim()}"`);
  }
  if (reviewedOnly) {
    clauses.push('reviewed:true');
  }

  const combinedQuery = clauses.join(' AND ');
  const searchParams = new URLSearchParams({
    query: combinedQuery,
    format: 'json',
    size: String(size),
  });

  const url = `${UNIPROT_BASE_URL}/search?${searchParams.toString()}`;
  const response = await fetchWithTimeoutAndRetry(url, { signal });

  if (response.status === 404) {
    return {
      results: [],
      totalResults: 0,
      nextOffset: null,
      queryUsed: combinedQuery,
    };
  }

  const totalHeader = response.headers.get('x-total-results');
  const totalResults = totalHeader ? parseInt(totalHeader, 10) : null;

  const data = await response.json();
  if (!data || !Array.isArray(data.results)) {
    throw new Error('Unexpected response structure from UniProtKB search endpoint.');
  }

  const normalized: NormalizedProteinRecord[] = [];
  for (const rawItem of data.results) {
    try {
      normalized.push(normalizeProteinRecord(rawItem));
    } catch {
      // skip malformed
    }
  }

  return {
    results: normalized,
    totalResults: totalResults ?? normalized.length,
    nextOffset: normalized.length >= size ? offset + size : null,
    queryUsed: combinedQuery,
  };
}
