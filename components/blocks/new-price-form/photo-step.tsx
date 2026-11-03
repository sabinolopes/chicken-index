"use client";

import { useRef } from "react";
import { Camera, ImagePlus, Loader2, RotateCcw } from "lucide-react";
import { Alert } from "@/components/elements/alert";
import { Button } from "@/components/elements/button";
import { FormSection } from "@/components/elements/form-section";
import type { ProcessedPhoto, ProcessStep } from "@/modules/photos/process-photo";
import { STEP_LABEL } from "./form-rules";
import { PhotoSummary } from "./photo-summary";

interface PhotoStepProps {
  photo: ProcessedPhoto | null;
  step: ProcessStep | null;
  error: string | null;
  onSelect: (file: File) => void;
}

const PICKER_CLASS = "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 px-3 py-8 text-sm font-medium hover:border-stone-500";

/** Etapa 1: câmera ou galeria; mostra o andamento do processamento e o resumo da foto. */
export function PhotoStep({ photo, step, error, onSelect }: PhotoStepProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Limpa o campo para permitir escolher a mesma foto de novo.
    event.target.value = "";
    if (file) onSelect(file);
  }

  return (
    <FormSection legend="1. Foto da etiqueta">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={pick} />

      {!photo && !step && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => cameraRef.current?.click()} className={PICKER_CLASS}>
            <Camera className="size-8 text-accent" aria-hidden />
            Tirar foto
          </button>
          <button type="button" onClick={() => galleryRef.current?.click()} className={PICKER_CLASS}>
            <ImagePlus className="size-8 text-muted" aria-hidden />
            Escolher da galeria
          </button>
        </div>
      )}

      {step && (
        <div className="flex items-center gap-3 rounded-xl bg-background p-6 text-sm" role="status">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          {STEP_LABEL[step]}
        </div>
      )}

      {error && (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      )}

      {photo && (
        <div className="space-y-3">
          <PhotoSummary photo={photo} />
          <div className="flex gap-2">
            <Button onClick={() => cameraRef.current?.click()}>
              <RotateCcw className="size-4" aria-hidden /> Trocar foto
            </Button>
            <Button onClick={() => galleryRef.current?.click()}>
              <ImagePlus className="size-4" aria-hidden /> Galeria
            </Button>
          </div>
        </div>
      )}
    </FormSection>
  );
}
