import type { GeoJSONLineStringGeometry, GeoJSONPosition } from "@bikeroutes/shared";

export type LineStringDraft = GeoJSONLineStringGeometry;

export type HistoryState = {
  past: LineStringDraft[];
  present: LineStringDraft;
  future: LineStringDraft[];
};

function cloneDraft(d: LineStringDraft): LineStringDraft {
  return {
    type: "LineString",
    coordinates: d.coordinates.map((p) => [p[0], p[1]] as GeoJSONPosition),
  };
}

export function emptyLineString(): LineStringDraft {
  return { type: "LineString", coordinates: [] };
}

export function historyInit(initial?: LineStringDraft): HistoryState {
  return { past: [], present: cloneDraft(initial ?? emptyLineString()), future: [] };
}

export function historyCanUndo(h: HistoryState): boolean {
  return h.past.length > 0;
}

export function historyCanRedo(h: HistoryState): boolean {
  return h.future.length > 0;
}

export function historyPush(h: HistoryState, next: LineStringDraft): HistoryState {
  const nextDraft = cloneDraft(next);
  return {
    past: [...h.past, cloneDraft(h.present)],
    present: nextDraft,
    future: [],
  };
}

export function historyUndo(h: HistoryState): HistoryState {
  if (!historyCanUndo(h)) return h;
  const prev = h.past[h.past.length - 1]!;
  return {
    past: h.past.slice(0, -1),
    present: cloneDraft(prev),
    future: [cloneDraft(h.present), ...h.future],
  };
}

export function historyRedo(h: HistoryState): HistoryState {
  if (!historyCanRedo(h)) return h;
  const next = h.future[0]!;
  return {
    past: [...h.past, cloneDraft(h.present)],
    present: cloneDraft(next),
    future: h.future.slice(1),
  };
}

export function appendVertex(d: LineStringDraft, p: GeoJSONPosition): LineStringDraft {
  return { type: "LineString", coordinates: [...d.coordinates, [p[0], p[1]]] };
}
