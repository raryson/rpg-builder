import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB ?? 'rpg-builder';

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache = globalWithMongoose.mongooseCache ?? {
  connection: null,
  promise: null,
};

globalWithMongoose.mongooseCache = cache;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI must be defined.');
  }

  if (cache.connection) {
    return cache.connection;
  }

  cache.promise ??= mongoose.connect(MONGODB_URI!, {
    bufferCommands: false,
    dbName: MONGODB_DB,
  });

  cache.connection = await cache.promise;
  return cache.connection;
}
