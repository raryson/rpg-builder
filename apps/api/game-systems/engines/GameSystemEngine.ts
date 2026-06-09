export type EngineValidationIssue = {
  path: string;
  message: string;
  severity: 'warning' | 'error';
};

export type EngineValidationResult = {
  valid: boolean;
  issues: EngineValidationIssue[];
};

export type EngineSummary = {
  title: string;
  subtitle?: string;
  lines: string[];
};

export interface GameSystemEngine<TSnapshot = unknown> {
  readonly slug: string;
  validateSheet(snapshot: TSnapshot): EngineValidationResult;
  calculateDerivedFields(snapshot: TSnapshot): TSnapshot;
  validatePrerequisites(snapshot: TSnapshot): EngineValidationResult;
  validateProgression(previousSnapshot: TSnapshot | null, nextSnapshot: TSnapshot): EngineValidationResult;
  generateSummary(snapshot: TSnapshot): EngineSummary;
  prepareForExport(snapshot: TSnapshot): Record<string, unknown>;
}
