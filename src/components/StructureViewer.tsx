import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { PdbStructureDetails } from '../types/protein';

interface StructureViewerProps {
  structure: PdbStructureDetails;
  proteinLength: number | null;
}

type RenderStyle = 'cartoon' | 'stick' | 'sphere' | 'line';
type ColorMode = 'spectrum' | 'chain' | 'plddt';

export const StructureViewer: React.FC<StructureViewerProps> = ({
  structure,
  proteinLength,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('cartoon');
  const [colorMode, setColorMode] = useState<ColorMode>(
    structure.isPredictedModel ? 'plddt' : 'spectrum'
  );
  const [darkCanvas, setDarkCanvas] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [clickedAtomInfo, setClickedAtomInfo] = useState<string | null>(null);

  useEffect(() => {
    setColorMode(structure.isPredictedModel ? 'plddt' : 'spectrum');
  }, [structure.pdbId, structure.isPredictedModel]);

  const applyCurrentStyle = (viewer: any, styleMode: RenderStyle, colMode: ColorMode) => {
    if (!viewer) return;

    const getColorConfig = () => {
      if (colMode === 'plddt') {
        return {
          colorfunc: (atom: any) => {
            const b = atom.b;
            if (b > 90) return '#0053D6';
            if (b > 70) return '#65CBF3';
            if (b > 50) return '#FFDB13';
            return '#FF7D45';
          },
        };
      }
      if (colMode === 'chain') {
        return { colorscheme: 'chainHetatm' };
      }
      return { color: 'spectrum' };
    };

    const colorCfg = getColorConfig();
    viewer.setStyle({}, {});

    if (styleMode === 'cartoon') {
      viewer.setStyle({ hetflag: false }, { cartoon: colorCfg });
      viewer.setStyle(
        { hetflag: true, resn: ['HOH', 'WAT'], invert: true },
        { stick: { radius: 0.25, colorscheme: 'Jmol' } }
      );
    } else if (styleMode === 'stick') {
      viewer.setStyle({ hetflag: false }, { stick: { radius: 0.2, ...colorCfg } });
    } else if (styleMode === 'sphere') {
      viewer.setStyle({ hetflag: false }, { sphere: { scale: 0.8, ...colorCfg } });
    } else {
      viewer.setStyle({ hetflag: false }, { line: { ...colorCfg } });
    }

    viewer.render();
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadStructureCoordinates() {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);
      setClickedAtomInfo(null);

      try {
        if (!viewerRef.current) {
          viewerRef.current = $3Dmol.createViewer(containerRef.current, {
            backgroundColor: darkCanvas ? '#0F172A' : '#F8FAFC',
          });
        } else {
          viewerRef.current.clear();
        }

        const res = await fetch(structure.cifUrl, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(
            `Coordinate file download returned HTTP ${res.status} (${res.statusText}).`
          );
        }

        const cifText = await res.text();
        if (!isMounted) return;

        if (!cifText || cifText.trim().length < 50) {
          throw new Error('Retrieved coordinate file was empty or incomplete.');
        }

        const viewer = viewerRef.current;
        viewer.clear();
        viewer.addModel(cifText, 'cif');

        const initialColorMode = structure.isPredictedModel ? 'plddt' : 'spectrum';
        applyCurrentStyle(viewer, renderStyle, initialColorMode);

        viewer.setClickable({}, true, (atom: any) => {
          if (!atom || !isMounted) return;
          setClickedAtomInfo(
            `Chain ${atom.chain} · Residue ${atom.resn} ${atom.resi} · Atom ${atom.atom}${
              typeof atom.b === 'number'
                ? structure.isPredictedModel
                  ? ` · pLDDT: ${atom.b.toFixed(1)}`
                  : ` · B-factor: ${atom.b.toFixed(1)}`
                : ''
            }`
          );
        });

        viewer.zoomTo();
        viewer.render();
        setLoading(false);
      } catch (err: any) {
        if (err?.name === 'AbortError' || !isMounted) return;
        setError(
          err?.message ||
            'Failed to load 3D molecular coordinates from the remote structure repository.'
        );
        setLoading(false);
      }
    }

    loadStructureCoordinates();

    return () => {
      isMounted = false;
      controller.abort();
      if (viewerRef.current) {
        try {
          viewerRef.current.spin(false);
        } catch {
          // ignore
        }
      }
    };
  }, [structure.pdbId, structure.cifUrl]);

  useEffect(() => {
    if (!loading && !error && viewerRef.current) {
      applyCurrentStyle(viewerRef.current, renderStyle, colorMode);
    }
  }, [renderStyle, colorMode, loading, error]);

  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.setBackgroundColor(darkCanvas ? '#0F172A' : '#F8FAFC');
      viewerRef.current.render();
    }
  }, [darkCanvas]);

  const handleResetCamera = () => {
    if (viewerRef.current) {
      viewerRef.current.zoomTo();
      viewerRef.current.render();
    }
  };

  const handleZoom = (factor: number) => {
    if (viewerRef.current) {
      viewerRef.current.zoom(factor, 200);
      viewerRef.current.render();
    }
  };

  const handleToggleSpin = () => {
    if (!viewerRef.current) return;
    const next = !spinning;
    setSpinning(next);
    viewerRef.current.spin(next ? 'y' : false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap bg-white">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="font-bold text-[#0B57D0] text-sm">{structure.pdbId}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                structure.isPredictedModel
                  ? 'text-amber-700 font-semibold'
                  : 'text-emerald-700 font-semibold'
              }
            >
              {structure.isPredictedModel
                ? '[Predicted Computational Model — AlphaFold]'
                : `[Experimentally Determined — ${structure.experimentalMethod || 'PDB'}]`}
            </span>
            {structure.resolutionAngstrom !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-700">
                  Resolution: {structure.resolutionAngstrom} Å
                </span>
              </>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">
            {structure.title || `3D Structure Record ${structure.pdbId}`}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            {(['cartoon', 'stick', 'sphere', 'line'] as RenderStyle[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setRenderStyle(st)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                  renderStyle === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setColorMode('spectrum')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                colorMode === 'spectrum'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              N→C Spectrum
            </button>
            <button
              type="button"
              onClick={() => setColorMode('chain')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                colorMode === 'chain'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chain
            </button>
            <button
              type="button"
              onClick={() => setColorMode('plddt')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                colorMode === 'plddt'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {structure.isPredictedModel ? 'pLDDT Confidence' : 'B-Factor'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleZoom(1.25)}
            title="Zoom In"
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(0.8)}
            title="Zoom Out"
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetCamera}
            title="Reset View"
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToggleSpin}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
              spinning
                ? 'bg-[#0B57D0] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {spinning ? 'Stop Spin' : 'Spin'}
          </button>
          <button
            type="button"
            onClick={() => setDarkCanvas((d) => !d)}
            title="Toggle dark/light 3D viewport background"
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            {darkCanvas ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="relative w-full h-[440px] bg-[#0F172A]">
        <div
          ref={containerRef}
          className="w-full h-full relative cursor-crosshair"
          aria-label={`Interactive 3D molecular viewer for ${structure.pdbId}`}
        />

        {loading && (
          <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white p-6 text-center z-10">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-2" />
            <div className="text-sm font-semibold">
              Loading 3D Coordinates ({structure.pdbId})...
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Retrieving mmCIF structural coordinates from {structure.sourceType}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-6 text-center z-10">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
            <div className="text-sm font-semibold text-rose-200">
              3D Structure Viewer Loading Failed
            </div>
            <p className="text-xs text-slate-300 max-w-md mt-1 leading-relaxed">
              {error}
            </p>
            <a
              href={structure.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <span>Inspect Record Directly on {structure.sourceType}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {clickedAtomInfo && !loading && !error && (
          <div className="absolute bottom-3 left-3 z-10 bg-slate-900/85 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-xs font-mono">
            {clickedAtomInfo}
          </div>
        )}

        {!loading && !error && (
          <div className="absolute bottom-3 right-3 z-10 bg-slate-900/75 text-slate-300 px-2.5 py-1 rounded-md text-[11px] font-mono pointer-events-none">
            Left-drag: Rotate · Scroll: Zoom · Click atom: Inspect residue
          </div>
        )}
      </div>

      <div className="p-4 bg-[#F8FAFC] border-t border-slate-200 space-y-2.5 text-xs text-slate-600">
        {colorMode === 'plddt' && (
          <div className="flex flex-wrap items-center gap-4 pb-2 border-b border-slate-200">
            <span className="font-semibold text-slate-800">
              {structure.isPredictedModel
                ? 'AlphaFold pLDDT Per-Residue Confidence Scale:'
                : 'B-Factor / Temperature Factor Scale:'}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono">
              <span className="w-3 h-3 rounded-xs bg-[#0053D6] inline-block" />
              <span>&gt;90 Very High</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono">
              <span className="w-3 h-3 rounded-xs bg-[#65CBF3] inline-block" />
              <span>70–90 Confident</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono">
              <span className="w-3 h-3 rounded-xs bg-[#FFDB13] inline-block" />
              <span>50–70 Low</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono">
              <span className="w-3 h-3 rounded-xs bg-[#FF7D45] inline-block" />
              <span>&lt;50 Very Low / Unstructured</span>
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 leading-relaxed">
          <p>
            <strong className="text-slate-900">Structural Representation Note:</strong> This 3D view
            represents the specific molecular construct, chains, or experimental complex deposited in
            record <strong className="font-mono">{structure.pdbId}</strong>
            {structure.chainsSummary ? (
              <>
                {' '}
                (reported chain/residue mapping:{' '}
                <code className="font-mono text-slate-800">{structure.chainsSummary}</code> vs. full
                UniProt length of {proteinLength ?? 'N/A'} aa)
              </>
            ) : null}
            . A structure record often covers only a specific domain or processed mature peptide rather
            than the entire full-length precursor protein.
          </p>

          <a
            href={structure.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#0B57D0] hover:underline shrink-0 whitespace-nowrap"
          >
            <span>Open {structure.sourceType} Entry</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
