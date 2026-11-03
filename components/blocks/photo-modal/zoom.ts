export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
/** Zoom aplicado ao clicar/tocar na etiqueta. */
export const CLICK_ZOOM = 2.5;
const ZOOM_STEP = 0.5;
export const CENTER = { x: 50, y: 50 };

export type ZoomOrigin = { x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Próximo nível de zoom ao apertar +/-, sem passar dos limites. */
export const stepZoom = (zoom: number, direction: 1 | -1) => clamp(zoom + direction * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);

/** Ponto do clique/cursor em % da moldura, para a lupa ampliar exatamente ali. */
export function pointerOrigin(pointer: { clientX: number; clientY: number }, frame: { left: number; top: number; width: number; height: number }): ZoomOrigin {
  return {
    x: clamp(((pointer.clientX - frame.left) / frame.width) * 100, 0, 100),
    y: clamp(((pointer.clientY - frame.top) / frame.height) * 100, 0, 100),
  };
}
