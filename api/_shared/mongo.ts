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
      new: true,
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
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}
