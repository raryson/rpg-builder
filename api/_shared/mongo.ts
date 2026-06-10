import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB ?? 'rpg-builder';

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  vercelMongooseCache?: MongooseCache;
};

const cache = globalWithMongoose.vercelMongooseCache ?? {
  connection: null,
  promise: null,
};

globalWithMongoose.vercelMongooseCache = cache;

async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI must be defined.');
  }

  if (cache.connection) {
    return cache.connection;
  }

  cache.promise ??= mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    dbName: MONGODB_DB,
  });

  cache.connection = await cache.promise;
  return cache.connection;
}

function getWebSheetModel() {
  const mongooseAny = mongoose as any;
  const schema = new mongooseAny.Schema(
    {
      ownerId: { type: String, required: true, index: true },
      sheetId: { type: String, required: true, index: true },
      name: { type: String, required: true, trim: true },
      data: { type: mongooseAny.Schema.Types.Mixed, required: true },
      archivedAt: { type: Date, default: null },
    },
    { timestamps: true },
  );

  schema.index({ ownerId: 1, sheetId: 1 }, { unique: true });
  schema.index({ ownerId: 1, archivedAt: 1, updatedAt: -1 });

  return mongooseAny.models.WebSheet || mongooseAny.model('WebSheet', schema);
}

function getWebUserModel() {
  const mongooseAny = mongoose as any;
  const schema = new mongooseAny.Schema(
    {
      provider: { type: String, required: true, default: 'google', index: true },
      providerId: { type: String, required: true, index: true },
      email: { type: String, required: true, trim: true, lowercase: true, index: true },
      emailVerified: { type: Boolean, required: true, default: false },
      name: { type: String, required: true, trim: true },
      picture: { type: String, default: '' },
      lastLoginAt: { type: Date, default: null },
    },
    { timestamps: true },
  );

  schema.index({ provider: 1, providerId: 1 }, { unique: true });

  return mongooseAny.models.WebUser || mongooseAny.model('WebUser', schema);
}

function getRuleEntryModel() {
  const mongooseAny = mongoose as any;
  const schema = new mongooseAny.Schema(
    {
      systemSlug: { type: String, required: true, index: true },
      type: { type: String, required: true, index: true },
      name: { type: String, required: true, trim: true },
      slug: { type: String, required: true, trim: true },
      category: { type: String, default: '', index: true },
      summary: { type: String, default: '' },
      content: { type: String, default: '' },
      stats: { type: mongooseAny.Schema.Types.Mixed, default: {} },
      tags: { type: [String], default: [], index: true },
      source: { type: String, default: '' },
      imageUrl: { type: String, default: '' },
      imageSourceUrl: { type: String, default: '' },
      imageAttribution: { type: String, default: '' },
      imageProvider: { type: String, default: '' },
      imageUpdatedAt: { type: Date, default: null },
      imageSearchStatus: { type: String, enum: ['pending', 'found', 'missed'], default: 'pending', index: true },
      imageSearchUpdatedAt: { type: Date, default: null },
      visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
      status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
    },
    { timestamps: true },
  );

  schema.index({ systemSlug: 1, type: 1, slug: 1 }, { unique: true });
  schema.index({ systemSlug: 1, visibility: 1, status: 1, type: 1, category: 1, name: 1 });
  schema.index({ name: 'text', summary: 'text', content: 'text', tags: 'text' });

  return mongooseAny.models.RuleEntry || mongooseAny.model('RuleEntry', schema);
}

export async function listWebSheets(ownerId: string) {
  await connectToDatabase();
  const sheets = await getWebSheetModel().find({ ownerId, archivedAt: null }).sort({ updatedAt: -1 });
  return sheets.map((sheet: any) => sheet.data);
}

export async function saveWebSheet(input: { ownerId: string; sheetId: string; name: string; data: unknown }) {
  await connectToDatabase();
  const sheet = await getWebSheetModel().findOneAndUpdate(
    {
      ownerId: input.ownerId,
      sheetId: input.sheetId,
    },
    {
      $set: {
        name: input.name,
        data: input.data,
        archivedAt: null,
      },
    },
    {
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return sheet.data;
}

export async function archiveWebSheet(ownerId: string, sheetId: string) {
  await connectToDatabase();
  await getWebSheetModel().findOneAndUpdate(
    {
      ownerId,
      sheetId,
    },
    {
      $set: {
        archivedAt: new Date(),
      },
    },
  );
}

export async function saveGoogleUser(input: {
  providerId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}) {
  await connectToDatabase();
  return getWebUserModel().findOneAndUpdate(
    {
      provider: 'google',
      providerId: input.providerId,
    },
    {
      $set: {
        email: input.email,
        emailVerified: input.emailVerified,
        name: input.name || input.email,
        picture: input.picture ?? '',
        lastLoginAt: new Date(),
      },
    },
    {
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}

export async function listRuleEntries(input: {
  systemSlug?: string;
  type?: string;
  category?: string;
  query?: string;
  limit?: number;
}) {
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
  const query = getRuleEntryModel()
    .find(filter)
    .sort(input.query ? { score: { $meta: 'textScore' }, name: 1 } : { type: 1, category: 1, name: 1 })
    .limit(limit);

  if (input.query) {
    query.select({ score: { $meta: 'textScore' } });
  }

  const entries = await query.lean();

  return entries.map((entry: any) => ({
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
  }));
}

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

export async function getRuleEntryWithRelated(systemSlug: string, slug: string) {
  await connectToDatabase();
  const model = getRuleEntryModel();
  const rule = await model.findOne({
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

  const related = await model.find(relatedFilter)
    .sort({ type: 1, category: 1, name: 1 })
    .limit(8)
    .lean();

  return {
    rule: leanRuleEntry(rule),
    related: related.map(leanRuleEntry),
  };
}
