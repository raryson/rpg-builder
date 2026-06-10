import { connectToDatabase } from '../lib/mongodb';
import { RuleEntryModel } from '../models/RuleEntry';

export type RuleEntryListInput = {
  systemSlug?: string;
  type?: string;
  category?: string;
  query?: string;
  limit?: number;
};

export type SaveRuleEntryInput = {
  systemSlug: string;
  type: string;
  name: string;
  slug: string;
  category?: string;
  summary?: string;
  content?: string;
  stats?: Record<string, unknown>;
  tags?: string[];
  source?: string;
  imageUrl?: string;
  imageSourceUrl?: string;
  imageAttribution?: string;
  imageProvider?: string;
  imageUpdatedAt?: Date | null;
  imageSearchStatus?: 'pending' | 'found' | 'missed';
  imageSearchUpdatedAt?: Date | null;
  visibility?: 'public' | 'private';
  status?: 'draft' | 'published' | 'archived';
};

function leanRuleEntry(entry: any) {
  return {
    id: String(entry._id),
    systemSlug: entry.systemSlug,
    type: entry.type,
    name: entry.name,
    slug: entry.slug,
    category: entry.category ?? '',
    summary: entry.summary ?? '',
    content: entry.content ?? '',
    stats: entry.stats ?? {},
    tags: entry.tags ?? [],
    source: entry.source ?? '',
    imageUrl: entry.imageUrl ?? '',
    imageSourceUrl: entry.imageSourceUrl ?? '',
    imageAttribution: entry.imageAttribution ?? '',
    imageProvider: entry.imageProvider ?? '',
    imageUpdatedAt: entry.imageUpdatedAt ?? null,
    imageSearchStatus: entry.imageSearchStatus ?? 'pending',
    imageSearchUpdatedAt: entry.imageSearchUpdatedAt ?? null,
    updatedAt: entry.updatedAt,
  };
}

export class RuleEntryService {
  async list(input: RuleEntryListInput = {}) {
    await connectToDatabase();

    const filter: Record<string, unknown> = {
      systemSlug: input.systemSlug ?? 'star-wars-saga',
      visibility: 'public',
      status: 'published',
    };

    if (input.type) filter.type = input.type;
    if (input.category) filter.category = input.category;
    if (input.query) filter.$text = { $search: input.query };

    const limit = Math.min(Math.max(input.limit ?? 120, 1), 500);
    const query = RuleEntryModel.find(filter)
      .sort(input.query ? { score: { $meta: 'textScore' }, name: 1 } : { type: 1, category: 1, name: 1 })
      .limit(limit);

    if (input.query) {
      query.select({ score: { $meta: 'textScore' } });
    }

    const entries = await query.lean();
    return entries.map(leanRuleEntry);
  }

  async getWithRelated(systemSlug: string, slug: string) {
    await connectToDatabase();

    const rule = await RuleEntryModel.findOne({
      systemSlug,
      slug,
      visibility: 'public',
      status: 'published',
    }).lean();

    if (!rule) return null;

    const relatedFilter: Record<string, unknown> = {
      systemSlug,
      slug: { $ne: slug },
      visibility: 'public',
      status: 'published',
      $or: [
        { type: rule.type },
        { category: rule.category },
      ],
    };

    if (Array.isArray(rule.tags) && rule.tags.length > 0) {
      (relatedFilter.$or as Array<Record<string, unknown>>).push({ tags: { $in: rule.tags.slice(0, 8) } });
    }

    const related = await RuleEntryModel.find(relatedFilter)
      .sort({ type: 1, category: 1, name: 1 })
      .limit(8)
      .lean();

    return {
      rule: leanRuleEntry(rule),
      related: related.map(leanRuleEntry),
    };
  }

  async saveMany(entries: SaveRuleEntryInput[]) {
    await connectToDatabase();

    await Promise.all(
      entries.map((entry) =>
        RuleEntryModel.findOneAndUpdate(
          {
            systemSlug: entry.systemSlug,
            type: entry.type,
            slug: entry.slug,
          },
          {
            $set: {
              name: entry.name,
              category: entry.category ?? '',
              summary: entry.summary ?? '',
              content: entry.content ?? '',
              stats: entry.stats ?? {},
              tags: entry.tags ?? [],
              source: entry.source ?? '',
              visibility: entry.visibility ?? 'public',
              status: entry.status ?? 'published',
            },
          },
          {
            returnDocument: 'after',
            upsert: true,
            setDefaultsOnInsert: true,
          },
        ),
      ),
    );
  }
}
