/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  NormalizedProteinRecord,
  PageRoute,
  SearchHistoryItem,
} from './types/protein';
import {
  fetchUniProtByAccession,
  searchUniProtRecords,
} from './services/uniprotApi';
import { fetchStructuresForProtein } from './services/pdbApi';
import { validateSearchInput } from './utils/validation';
import {
  buildEvidenceTrail,
  StructureLookupState,
} from './utils/evidenceTrailBuilder';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import {
  VERIFIED_EXAMPLE_PROTEINS,
  ExampleProteinSpec,
} from './components/SearchBar';
import { Home } from './pages/Home';
import { SearchResults } from './pages/SearchResults';
import { ProteinDetails } from './pages/ProteinDetails';
import { CompareProteins } from './pages/CompareProteins';
import { StructureExplorer } from './pages/StructureExplorer';
import { About } from './pages/About';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchQueryUsed, setSearchQueryUsed] = useState('');
  const [searchOrganismUsed, setSearchOrganismUsed] = useState<string | undefined>(undefined);
  const [searchReviewedUsed, setSearchReviewedUsed] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<NormalizedProteinRecord[]>([]);
  const [totalSearchResults, setTotalSearchResults] = useState<number | null>(null);
  const [searchSize, setSearchSize] = useState(10);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedProtein, setSelectedProtein] = useState<NormalizedProteinRecord | null>(null);

  const [structureLookup, setStructureLookup] = useState<StructureLookupState>({
    checked: false,
    loading: false,
    error: null,
    structures: [],
  });

  const [compareProteinA, setCompareProteinA] = useState<NormalizedProteinRecord | null>(null);
  const [compareProteinB, setCompareProteinB] = useState<NormalizedProteinRecord | null>(null);

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const [verifiedExamplesStatus, setVerifiedExamplesStatus] = useState<
    Record<string, { verified: boolean; length?: number; checking?: boolean }>
  >({});

  const [recordCache, setRecordCache] = useState<Record<string, NormalizedProteinRecord>>({});

  const addToHistory = useCallback((record: NormalizedProteinRecord, queryLabel?: string) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.accession !== record.accession);
      return [
        {
          query: queryLabel || record.accession,
          accession: record.accession,
          proteinName: record.proteinName,
          organism: record.organism,
          timestamp: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 15);
    });
  }, []);

  const runStructureLookupForRecord = useCallback(async (record: NormalizedProteinRecord) => {
    setStructureLookup({
      checked: false,
      loading: true,
      error: null,
      structures: [],
    });

    try {
      const structures = await fetchStructuresForProtein(
        record.accession,
        record.pdbCrossReferences
      );
      setStructureLookup({
        checked: true,
        loading: false,
        error: null,
        structures,
      });
    } catch (err: any) {
      setStructureLookup({
        checked: true,
        loading: false,
        error: err?.message || 'Structure lookup failed due to a technical problem.',
        structures: [],
      });
    }
  }, []);

  const handleSelectProteinRecord = useCallback(
    (record: NormalizedProteinRecord, openExplorer = true) => {
      setSelectedProtein(record);
      setRecordCache((prev) => ({ ...prev, [record.accession]: record }));
      addToHistory(record, record.accession);
      runStructureLookupForRecord(record);
      if (!compareProteinA) {
        setCompareProteinA(record);
      }
      if (openExplorer) {
        setCurrentPage('explorer');
      }
    },
    [addToHistory, compareProteinA, runStructureLookupForRecord]
  );

  useEffect(() => {
    let isMounted = true;

    async function verifyReferenceExamples() {
      const initialChecking: Record<
        string,
        { verified: boolean; length?: number; checking?: boolean }
      > = {};
      for (const ex of VERIFIED_EXAMPLE_PROTEINS) {
        initialChecking[ex.accession] = { verified: false, checking: true };
      }
      setVerifiedExamplesStatus(initialChecking);

      for (const ex of VERIFIED_EXAMPLE_PROTEINS) {
        try {
          const rec = await fetchUniProtByAccession(ex.accession);
          if (!isMounted) return;
          if (rec) {
            setRecordCache((prev) => ({ ...prev, [rec.accession]: rec }));
            setVerifiedExamplesStatus((prev) => ({
              ...prev,
              [ex.accession]: {
                verified: true,
                length: rec.sequenceLength ?? undefined,
                checking: false,
              },
            }));

            if (ex.accession === 'P01308') {
              setSelectedProtein((curr) => {
                if (!curr) {
                  runStructureLookupForRecord(rec);
                  addToHistory(rec, 'P01308');
                  return rec;
                }
                return curr;
              });
              setCompareProteinA((curr) => curr ?? rec);
            }
            if (ex.accession === 'P68871') {
              setCompareProteinB((curr) => curr ?? rec);
            }
          } else {
            setVerifiedExamplesStatus((prev) => ({
              ...prev,
              [ex.accession]: { verified: false, checking: false },
            }));
          }
        } catch {
          if (!isMounted) return;
          setVerifiedExamplesStatus((prev) => ({
            ...prev,
            [ex.accession]: { verified: false, checking: false },
          }));
        }
      }
    }

    verifyReferenceExamples();
    return () => {
      isMounted = false;
    };
  }, [addToHistory, runStructureLookupForRecord]);

  const handleSearch = async (params: {
    query: string;
    organism?: string;
    reviewedOnly?: boolean;
  }) => {
    const validation = validateSearchInput(params.query);
    if (!validation.isValid) {
      setSearchError(validation.errorMessage);
      setCurrentPage('search');
      return;
    }

    const cleanQuery = validation.trimmedInput;
    setSearchQueryUsed(cleanQuery);
    setSearchOrganismUsed(params.organism);
    setSearchReviewedUsed(Boolean(params.reviewedOnly));
    setSearchSize(10);
    setSearchLoading(true);
    setSearchError(null);
    setCurrentPage('search');

    try {
      if (validation.isAccession && !params.organism) {
        const cached = recordCache[cleanQuery.toUpperCase()];
        if (cached) {
          setSearchResults([cached]);
          setTotalSearchResults(1);
          setSearchLoading(false);
          return;
        }

        const directRecord = await fetchUniProtByAccession(cleanQuery);
        if (directRecord) {
          setRecordCache((prev) => ({ ...prev, [directRecord.accession]: directRecord }));
          setSearchResults([directRecord]);
          setTotalSearchResults(1);
          addToHistory(directRecord, cleanQuery);
        } else {
          setSearchResults([]);
          setTotalSearchResults(0);
        }
      } else {
        const response = await searchUniProtRecords({
          query: cleanQuery,
          organism: params.organism,
          reviewedOnly: params.reviewedOnly,
          size: 10,
        });
        setSearchResults(response.results);
        setTotalSearchResults(response.totalResults);
        const newCache: Record<string, NormalizedProteinRecord> = {};
        for (const r of response.results) {
          newCache[r.accession] = r;
        }
        setRecordCache((prev) => ({ ...prev, ...newCache }));
      }
    } catch (err: any) {
      setSearchError(
        err?.message ||
          'Failed to retrieve records from the UniProt REST API. Please verify your network connection and retry.'
      );
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLoadMoreSearchResults = async () => {
    if (!searchQueryUsed || loadingMore) return;
    const nextSize = searchSize + 10;
    setLoadingMore(true);

    try {
      const response = await searchUniProtRecords({
        query: searchQueryUsed,
        organism: searchOrganismUsed,
        reviewedOnly: searchReviewedUsed,
        size: nextSize,
      });
      setSearchResults(response.results);
      setTotalSearchResults(response.totalResults);
      setSearchSize(nextSize);
    } catch (err: any) {
      setSearchError(err?.message || 'Failed to load additional records.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSelectExample = async (example: ExampleProteinSpec) => {
    const cached = recordCache[example.accession];
    if (cached) {
      setSearchQueryUsed(example.accession);
      setSearchResults([cached]);
      setTotalSearchResults(1);
      setSearchError(null);
      handleSelectProteinRecord(cached, true);
      return;
    }
    await handleSearch({ query: example.accession });
  };

  const handleQuickLoadByAccession = async (accession: string, targetPage: PageRoute = 'explorer') => {
    const cleanAcc = accession.trim().toUpperCase();
    const cached = recordCache[cleanAcc];
    if (cached) {
      handleSelectProteinRecord(cached, false);
      setCurrentPage(targetPage);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    try {
      const rec = await fetchUniProtByAccession(cleanAcc);
      if (rec) {
        handleSelectProteinRecord(rec, false);
        setCurrentPage(targetPage);
      } else {
        setSearchQueryUsed(cleanAcc);
        setSearchResults([]);
        setCurrentPage('search');
      }
    } catch (err: any) {
      setSearchQueryUsed(cleanAcc);
      setSearchError(err?.message || 'Failed to load protein record.');
      setCurrentPage('search');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddToCompare = (record: NormalizedProteinRecord) => {
    if (!compareProteinA || compareProteinA.accession === record.accession) {
      setCompareProteinA(record);
    } else {
      setCompareProteinB(record);
    }
    setCurrentPage('compare');
  };

  const evidenceEntries = selectedProtein
    ? buildEvidenceTrail(selectedProtein, structureLookup)
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)}
        selectedAccession={selectedProtein?.accession ?? null}
      />

      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          searchHistory={searchHistory}
          onSelectHistoryItem={(acc) => handleQuickLoadByAccession(acc, 'explorer')}
          onClearHistory={() => setSearchHistory([])}
          selectedAccession={selectedProtein?.accession ?? null}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {currentPage === 'home' && (
            <Home
              onSearch={handleSearch}
              onSelectExample={handleSelectExample}
              onNavigate={setCurrentPage}
              isLoading={searchLoading}
              verifiedExamplesStatus={verifiedExamplesStatus}
            />
          )}

          {currentPage === 'search' && (
            <SearchResults
              queryUsed={searchQueryUsed}
              results={searchResults}
              totalResults={totalSearchResults}
              isLoading={searchLoading}
              error={searchError}
              selectedAccession={selectedProtein?.accession ?? null}
              onSearch={handleSearch}
              onClearSearch={() => {
                setSearchQueryUsed('');
                setSearchResults([]);
                setTotalSearchResults(null);
                setSearchError(null);
              }}
              onSelectExample={handleSelectExample}
              onSelectProtein={(rec) => handleSelectProteinRecord(rec, true)}
              onAddToCompare={handleAddToCompare}
              onRetry={() =>
                handleSearch({
                  query: searchQueryUsed,
                  organism: searchOrganismUsed,
                  reviewedOnly: searchReviewedUsed,
                })
              }
              onLoadMore={handleLoadMoreSearchResults}
              canLoadMore={
                totalSearchResults !== null &&
                searchResults.length > 0 &&
                searchResults.length < totalSearchResults &&
                searchSize < 50
              }
              loadingMore={loadingMore}
              verifiedExamplesStatus={verifiedExamplesStatus}
            />
          )}

          {currentPage === 'explorer' && (
            <ProteinDetails
              record={selectedProtein}
              evidenceEntries={evidenceEntries}
              structureLookup={structureLookup}
              onRetryStructureLookup={() => {
                if (selectedProtein) runStructureLookupForRecord(selectedProtein);
              }}
              onNavigate={setCurrentPage}
              onSendToCompare={handleAddToCompare}
              onQuickLoadExample={(acc) => handleQuickLoadByAccession(acc, 'explorer')}
            />
          )}

          {currentPage === 'compare' && (
            <CompareProteins
              initialProteinA={compareProteinA}
              initialProteinB={compareProteinB}
              onUpdateComparisonProteins={(protA, protB) => {
                setCompareProteinA(protA);
                setCompareProteinB(protB);
              }}
            />
          )}

          {currentPage === 'structure' && (
            <StructureExplorer
              record={selectedProtein}
              structureLookup={structureLookup}
              onRetryLookup={() => {
                if (selectedProtein) runStructureLookupForRecord(selectedProtein);
              }}
              onNavigate={setCurrentPage}
              onQuickLoadProtein={(acc) => handleQuickLoadByAccession(acc, 'structure')}
            />
          )}

          {currentPage === 'about' && <About />}
        </main>
      </div>

      {/* Global Application Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">ProteinTrail</span>
            <span aria-hidden="true">·</span>
            <span>Cross-Database Protein Investigator</span>
          </div>
          <div className="text-slate-700 font-medium">
            Designed By <span className="font-semibold text-[#0B57D0]">Nani P</span>{' '}
            <span className="text-slate-500 font-normal">(MSc Bioinformatics)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
