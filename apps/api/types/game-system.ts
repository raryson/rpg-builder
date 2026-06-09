export type GameSystemStatus = 'active' | 'beta' | 'deprecated';

export type SupportedFieldDefinition = {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
};

export type GameSystemDefinition = {
  name: string;
  slug: string;
  version: string;
  description: string;
  status: GameSystemStatus;
  metadata: Record<string, unknown>;
  supportedFields: SupportedFieldDefinition[];
};
