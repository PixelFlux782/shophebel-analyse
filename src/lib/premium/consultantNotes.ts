export type ConsultantNotes = {
  executiveComment?: string;
  priorityOverrideNotes?: string;
  customActionItems?: string[];
  upsellRecommendation?: string;
  internalNotes?: string;
};

export const EMPTY_CONSULTANT_NOTES: ConsultantNotes = {
  executiveComment: "",
  priorityOverrideNotes: "",
  customActionItems: [],
  upsellRecommendation: "",
  internalNotes: "",
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanActionItems(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map(cleanText)
      .filter(Boolean);
  }

  return [];
}

export function normalizeConsultantNotes(value: unknown): ConsultantNotes {
  const source = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};

  return {
    executiveComment: cleanText(source.executiveComment),
    priorityOverrideNotes: cleanText(source.priorityOverrideNotes),
    customActionItems: cleanActionItems(source.customActionItems),
    upsellRecommendation: cleanText(source.upsellRecommendation),
    internalNotes: cleanText(source.internalNotes),
  };
}

export function hasCustomerFacingConsultantNotes(notes?: ConsultantNotes | null) {
  if (!notes) return false;

  return Boolean(
    notes.executiveComment ||
    notes.priorityOverrideNotes ||
    notes.customActionItems?.length ||
    notes.upsellRecommendation,
  );
}

export function hasAnyConsultantNotes(notes?: ConsultantNotes | null) {
  return Boolean(
    hasCustomerFacingConsultantNotes(notes) ||
    notes?.internalNotes,
  );
}
