import mongoose from 'mongoose';

/**
 * Global cache for MongoDB connection across Next.js hot-reloads in development.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, memServer: null };
}

export async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    let uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URI || process.env.DATABASE_URL;
    const isExplicitUriProvided = Boolean(uri);

    // If no external MONGODB_URI is provided, launch an in-memory Mongo instance seamlessly (for local dev)
    if (!uri) {
      if (!cached.memServer) {
        try {
          const os = await import('os');
          const path = await import('path');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          cached.memServer = await MongoMemoryServer.create({
            binary: {
              downloadDir: process.env.MONGOMS_DOWNLOAD_DIR || path.join(os.tmpdir(), 'mongodb-binaries'),
            }
          });
          uri = cached.memServer.getUri();
          console.log('[LoadCheck DB] Initialized in-memory MongoDB instance for zero-config persistence');
        } catch (err) {
          console.warn('[LoadCheck DB] Could not start MongoMemoryServer, falling back to localhost:27017', err.message);
          uri = 'mongodb://127.0.0.1:27017/loadcheck';
        }
      } else {
        uri = cached.memServer.getUri();
      }
    }

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log('[LoadCheck DB] Successfully connected to MongoDB');
      return m;
    }).catch(async (err) => {
      console.error('[LoadCheck DB] MongoDB connection error:', err.message);
      
      // If a real URI was provided, or in production, do NOT mask the error with in-memory server
      if (isExplicitUriProvided || process.env.NODE_ENV === 'production') {
        throw new Error(`MongoDB connection failed: ${err.message}`);
      }

      if (!cached.memServer) {
        try {
          const os = await import('os');
          const path = await import('path');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          cached.memServer = await MongoMemoryServer.create({
            binary: {
              downloadDir: process.env.MONGOMS_DOWNLOAD_DIR || path.join(os.tmpdir(), 'mongodb-binaries'),
            }
          });
          const fallbackUri = cached.memServer.getUri();
          return await mongoose.connect(fallbackUri, opts);
        } catch (fallbackErr) {
          throw new Error(`MongoDB connection failed: ${fallbackErr.message}`);
        }
      }
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (cached.memServer) {
    await cached.memServer.stop();
    cached.memServer = null;
  }
  cached.conn = null;
  cached.promise = null;
}
