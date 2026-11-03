"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { IconButton } from "@/components/elements/button";
import { CENTER, CLICK_ZOOM, MAX_ZOOM, MIN_ZOOM, pointerOrigin, stepZoom, type ZoomOrigin } from "./zoom";

/** Foto da etiqueta com lupa: clique amplia no ponto, o cursor percorre a foto, +/- no teclado. */
export function ZoomablePhoto({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [origin, setOrigin] = useState<ZoomOrigin>(CENTER);
  const frameRef = useRef<HTMLDivElement>(null);
  const zoomed = zoom > MIN_ZOOM;

  useEffect(() => {
    const zoomWithKeyboard = (event: KeyboardEvent) => {
      if (event.key === "+" || event.key === "=") setZoom((current) => stepZoom(current, 1));
      if (event.key === "-") setZoom((current) => stepZoom(current, -1));
    };
    window.addEventListener("keydown", zoomWithKeyboard);
    return () => window.removeEventListener("keydown", zoomWithKeyboard);
  }, []);

  function followPointer(pointer: { clientX: number; clientY: number }) {
    const frame = frameRef.current?.getBoundingClientRect();
    if (frame) setOrigin(pointerOrigin(pointer, frame));
  }

  function toggleZoom(pointer: { clientX: number; clientY: number }) {
    if (zoomed) {
      setZoom(MIN_ZOOM);
      return;
    }
    followPointer(pointer);
    setZoom(CLICK_ZOOM);
  }

  function reset() {
    setZoom(MIN_ZOOM);
    setOrigin(CENTER);
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-stone-900">
      <div
        ref={frameRef}
        className={`relative aspect-[4/3] w-full overflow-hidden lg:aspect-auto lg:flex-1 ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        style={{ touchAction: zoomed ? "none" : "manipulation" }}
        onClick={toggleZoom}
        onPointerMove={(event) => zoomed && followPointer(event)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- foto .webp já otimizada no upload */}
        <img
          src={src}
          alt={alt}
          decoding="async"
          draggable={false}
          className="absolute inset-0 size-full select-none object-contain transition-transform duration-150 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: `${origin.x}% ${origin.y}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 bg-stone-900 px-3 py-2 text-stone-200">
        <span className="text-xs text-stone-400">{zoomed ? "Mova o cursor / arraste para explorar" : "Clique ou toque na etiqueta para ampliar"}</span>
        <div className="flex items-center gap-1">
          <IconButton tone="dark" label="Diminuir zoom" onClick={() => setZoom((current) => stepZoom(current, -1))} disabled={zoom <= MIN_ZOOM}>
            <ZoomOut className="size-4" />
          </IconButton>
          <span className="w-12 text-center text-xs tabular">{Math.round(zoom * 100)}%</span>
          <IconButton tone="dark" label="Aumentar zoom" onClick={() => setZoom((current) => stepZoom(current, 1))} disabled={zoom >= MAX_ZOOM}>
            <ZoomIn className="size-4" />
          </IconButton>
          <IconButton tone="dark" label="Restaurar" onClick={reset} disabled={!zoomed}>
            <RotateCcw className="size-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
