import React from 'react';
import { Dna, Menu, X } from 'lucide-react';
import { PageRoute } from '../types/protein';

interface HeaderProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  selectedAccession: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  mobileMenuOpen,
  onToggleMobileMenu,
  selectedAccession,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#0B57D0] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0B57D0] rounded-lg"
          >
            <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-teal-400 flex items-center justify-center shrink-0">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap">
                ProteinTrail
              </span>
              <span className="hidden sm:block text-xs text-slate-500 whitespace-nowrap">
                Explore proteins. Trace the evidence.
              </span>
            </div>
          </button>
        </div>

        <nav aria-label="Top navigation" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPage === 'home' ? 'text-[#0B57D0] font-semibold underline underline-offset-8' : ''
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate('search')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPage === 'search' ? 'text-[#0B57D0] font-semibold underline underline-offset-8' : ''
            }`}
          >
            Protein Search
          </button>
          <button
            type="button"
            onClick={() => onNavigate('explorer')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPage === 'explorer' ? 'text-[#0B57D0] font-semibold underline underline-offset-8' : ''
            }`}
          >
            Protein Explorer
          </button>
          <button
            type="button"
            onClick={() => onNavigate('compare')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPage === 'compare' ? 'text-[#0B57D0] font-semibold underline underline-offset-8' : ''
            }`}
          >
            Compare Proteins
          </button>
          <button
            type="button"
            onClick={() => onNavigate('structure')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPage === 'structure' ? 'text-[#0B57D0] font-semibold underline underline-offset-8' : ''
            }`}
          >
            Structure Explorer
          </button>
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPage === 'about' ? 'text-[#0B57D0] font-semibold underline underline-offset-8' : ''
            }`}
          >
            About
          </button>
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {selectedAccession ? (
            <button
              type="button"
              onClick={() => onNavigate('explorer')}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white bg-[#0B57D0] hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono shadow-xs"
            >
              Active: {selectedAccession}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('search')}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              Investigate
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
