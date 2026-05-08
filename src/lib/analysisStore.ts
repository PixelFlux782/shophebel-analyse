import { randomUUID } from "crypto";

import { AnalysisResult } from "@/types/analysis";

export interface StoredAnalysisResult {
  id: string;
  analysis: AnalysisResult;
  createdAt: string;
}

declare global {
  var __shophebelAnalysisStore: Map<string, StoredAnalysisResult> | undefined;
}

function getStore() {
  if (!global.__shophebelAnalysisStore) {
    global.__shophebelAnalysisStore = new Map<string, StoredAnalysisResult>();
  }

  return global.__shophebelAnalysisStore;
}

export function createStoredAnalysisResult(input: Omit<StoredAnalysisResult, "id" | "createdAt">) {
  const id = randomUUID();
  const record: StoredAnalysisResult = {
    id,
    createdAt: new Date().toISOString(),
    ...input,
  };

  getStore().set(id, record);

  return record;
}

export function getStoredAnalysisResult(id: string) {
  return getStore().get(id) ?? null;
}
