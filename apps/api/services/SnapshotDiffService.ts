export type SnapshotDiffOperation = {
  path: string;
  type: 'added' | 'removed' | 'changed';
  before?: unknown;
  after?: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function diffValues(before: unknown, after: unknown, path: string): SnapshotDiffOperation[] {
  if (Object.is(before, after)) {
    return [];
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

    return Array.from(keys).flatMap((key) => {
      const nextPath = path ? `${path}.${key}` : key;

      if (!(key in before)) {
        return [{ path: nextPath, type: 'added', after: after[key] }];
      }

      if (!(key in after)) {
        return [{ path: nextPath, type: 'removed', before: before[key] }];
      }

      return diffValues(before[key], after[key], nextPath);
    });
  }

  if (Array.isArray(before) || Array.isArray(after)) {
    const beforeJson = JSON.stringify(before);
    const afterJson = JSON.stringify(after);

    return beforeJson === afterJson
      ? []
      : [
          {
            path,
            type: 'changed',
            before,
            after,
          },
        ];
  }

  return [
    {
      path,
      type: 'changed',
      before,
      after,
    },
  ];
}

export class SnapshotDiffService {
  compare(before: unknown, after: unknown) {
    return diffValues(before, after, '');
  }
}
