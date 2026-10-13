import React from 'react';
import {
  Home,
  Search,
  FileSpreadsheet,
  GitCompare,
  Box,
  Info,
  History,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import { PageRoute, SearchHistoryItem } from '../types/protein';

interface SidebarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  searchHistory: SearchHistoryItem[];
  onSelectHistoryItem: (accession: string) => void;
  onClearHistory: () => void;
  selectedAccession: string | null;
}

const NAV_ITEMS: Array<{ id: PageRoute; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Protein Search', icon: Search },
  { id: 'explorer', label: 'Protein Explorer', icon: FileSpreadsheet },
  { id: 'compare', label: 'Compare Proteins', icon: GitCompare },
  { id: 'structure', label: 'Structure Explorer', icon: Box },
  { id: 'about', label: 'About the Project', icon: Info },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  searchHistory,
  onSelectHistoryItem,
  onClearHistory,
  selectedAccession,
}) => {
  const handleNavClick = (page: PageRoute) => {
    onNavigate(page);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between py-5 px-3.5 bg-white border-r border-slate-200 w-64 shrink-0 select-none">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 tracking-wider">
            Workbench Navigation
          </div>
          <nav aria-label="Main workbench navigation" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0B57D0]/10 text-[#0B57D0] font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0B57D0]' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </span>
                  {item.id === 'explorer' && selectedAccession && (
                    <span className="text-xs font-mono text-teal-700 font-semibold">
                      {selectedAccession}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              Recent Session Records
            </span>
            {searchHistory.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                title="Clear recent searches"
                className="text-xs text-slate-400 hover:text-rose-600 inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {searchHistory.length === 0 ? (
            <p className="px-3 text-xs text-slate-400 leading-relaxed">
              Proteins you inspect during this session will appear here for one-click reopening.
            </p>
          ) : (
            <ul className="space-y-1 max-h-60 overflow-y-auto px-1">
              {searchHistory.map((item) => (
                <li key={item.accession}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectHistoryItem(item.accession);
                      onCloseMobile();
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 group cursor-pointer ${
                      selectedAccession === item.accession
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-semibold text-[#0B57D0] truncate">
                        {item.accession}
                      </div>
                      <div className="truncate text-slate-700">{item.proteinName}</div>
                      <div className="truncate text-[11px] text-slate-400 italic">{item.organism}</div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B57D0] shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="px-3 pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="font-semibold text-slate-700">Live Data Sources</div>
        <div>UniProt REST API · RCSB PDB · AlphaFold DB</div>
        <div className="text-slate-400">Educational Research Workbench</div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 flex">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
