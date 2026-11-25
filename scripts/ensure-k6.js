import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import https from 'https';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';

const PROJECT_BIN_DIR = path.resolve(process.cwd(), 'bin');
const PROJECT_K6_PATH = path.join(PROJECT_BIN_DIR, 'k6');
const TEMP_BIN_DIR = path.join(os.tmpdir(), 'loadcheck-k6');
const TEMP_K6_PATH = path.join(TEMP_BIN_DIR, 'k6');
const BINARY_CACHE_KEY = Symbol.for('loadcheck.k6BinaryPath');

const K6_ASSETS = {
  'linux-x64': { asset: 'linux-amd64', extension: 'tar.gz' },
  'linux-arm64': { asset: 'linux-arm64', extension: 'tar.gz' },
};

function isExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function makeExecutable(filePath) {
  if (!isExecutable(filePath)) {
    fs.chmodSync(filePath, 0o755);
  }
  return filePath;
}

function cacheBinary(binaryPath) {
  globalThis[BINARY_CACHE_KEY] = binaryPath;
  return binaryPath;
}

function copyToTemp(sourcePath) {
  fs.mkdirSync(TEMP_BIN_DIR, { recursive: true });
  fs.copyFileSync(sourcePath, TEMP_K6_PATH);
  return makeExecutable(TEMP_K6_PATH);
}

export async function ensureK6Binary() {
  if (globalThis[BINARY_CACHE_KEY]) {
    return globalThis[BINARY_CACHE_KEY];
  }

  // Explicit override is useful on serverless platforms that ship k6 via a layer.
  const configuredPath = process.env.K6_BINARY_PATH;
  if (configuredPath) {
    if (!fs.existsSync(configuredPath)) {
      throw new Error(`K6_BINARY_PATH does not exist: ${configuredPath}`);
    }
    return cacheBinary(makeExecutable(configuredPath));
  }

  // 1. k6 installed globally on PATH
  try {
    const globalK6 = execSync('which k6', { encoding: 'utf-8' }).trim();
    if (globalK6) {
      console.log(`[LoadCheck k6] Found system k6 at: ${globalK6}`);
      return cacheBinary(globalK6);
    }
  } catch {
    // Not installed globally
  }

  // 2. Bundled project binary (read-only in most serverless runtimes)
  if (fs.existsSync(PROJECT_K6_PATH)) {
    try {
      return cacheBinary(makeExecutable(PROJECT_K6_PATH));
    } catch {
      try {
        return cacheBinary(copyToTemp(PROJECT_K6_PATH));
      } catch {
        // Fall through to download
      }
    }
  }

  // 3. Previously downloaded binary in the writable temp directory
  if (fs.existsSync(TEMP_K6_PATH)) {
    return cacheBinary(makeExecutable(TEMP_K6_PATH));
  }

  // 4. Download into OS temp dir — never write into the app directory in production
  const platformKey = `${process.platform}-${process.arch}`;
  const target = K6_ASSETS[platformKey];
  if (!target) {
    throw new Error(`No tar.gz k6 release is configured for ${platformKey}. Set K6_BINARY_PATH to a k6 executable instead.`);
  }

  const K6_VERSION = 'v0.56.0';
  const downloadUrl = `https://github.com/grafana/k6/releases/download/${K6_VERSION}/k6-${K6_VERSION}-${target.asset}.${target.extension}`;
  fs.mkdirSync(TEMP_BIN_DIR, { recursive: true });
  const archivePath = path.join(TEMP_BIN_DIR, `k6-${target.asset}.${target.extension}`);

  console.log(`[LoadCheck k6] k6 not found. Downloading ${downloadUrl}...`);
  try {
    await downloadFile(downloadUrl, archivePath);
    await extractK6FromTarGz(archivePath, TEMP_BIN_DIR);
    makeExecutable(TEMP_K6_PATH);
    console.log(`[LoadCheck k6] Installed k6 to ${TEMP_K6_PATH}`);
    return cacheBinary(TEMP_K6_PATH);
  } finally {
    if (fs.existsSync(archivePath)) {
      try { fs.unlinkSync(archivePath); } catch {}
    }
  }
}

async function extractK6FromTarGz(archivePath, outputDir) {
  const magic = Buffer.alloc(2);
  const fileDescriptor = fs.openSync(archivePath, 'r');
  try {
    fs.readSync(fileDescriptor, magic, 0, 2, 0);
  } finally {
    fs.closeSync(fileDescriptor);
  }

  if (magic[0] !== 0x1f || magic[1] !== 0x8b) {
    const preview = fs.readFileSync(archivePath).subarray(0, 200).toString('utf8').replace(/\s+/g, ' ');
    throw new Error(`Downloaded k6 archive is not gzip: ${preview.slice(0, 120)}`);
  }

  const chunks = [];
  await pipeline(
    fs.createReadStream(archivePath),
    zlib.createGunzip(),
    async (source) => {
      for await (const chunk of source) chunks.push(chunk);
    }
  );

  const tar = Buffer.concat(chunks);
  let offset = 0;

  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    let hasData = false;
    for (const byte of header) {
      if (byte !== 0) {
        hasData = true;
        break;
      }
    }
    if (!hasData) break;

    const name = header.subarray(0, 100).toString('utf8').split('\0')[0];
    const sizeField = header.subarray(124, 136).toString('utf8').split('\0')[0].trim();
    const size = sizeField ? Number.parseInt(sizeField, 8) : 0;
    const typeFlag = String.fromCharCode(header[156]) || '0';
    if (!Number.isFinite(size) || size < 0) {
      throw new Error(`Invalid entry size in k6 archive at offset ${offset}`);
    }

    offset += 512;
    const contents = tar.subarray(offset, offset + size);
    offset += Math.ceil(size / 512) * 512;

    if (path.posix.basename(name) === 'k6' && typeFlag !== '5') {
      const destination = path.join(outputDir, 'k6');
      fs.writeFileSync(destination, contents);
      return destination;
    }
  }

  throw new Error('k6 executable was not found inside the downloaded archive');
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download k6: HTTP ${res.statusCode}`));
      }

      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  ensureK6Binary()
    .then((binaryPath) => console.log(`[LoadCheck k6] Ready: ${binaryPath}`))
    .catch((err) => {
      console.error(`[LoadCheck k6] Failed to provision k6: ${err.message}`);
      process.exitCode = 1;
    });
}
