import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import https from 'https';
import { fileURLToPath } from 'url';

const PROJECT_BIN_DIR = path.resolve(process.cwd(), 'bin');
const PROJECT_K6_PATH = path.join(PROJECT_BIN_DIR, 'k6');
const TEMP_BIN_DIR = path.join(os.tmpdir(), 'loadcheck-k6');
const TEMP_K6_PATH = path.join(TEMP_BIN_DIR, 'k6');
const BINARY_CACHE_KEY = Symbol.for('loadcheck.k6BinaryPath');

const K6_ASSETS = {
  'linux-x64': 'linux-amd64',
  'linux-arm64': 'linux-arm64',
  'darwin-x64': 'macos-amd64',
  'darwin-arm64': 'macos-arm64',
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
  const asset = K6_ASSETS[`${process.platform}-${process.arch}`];
  if (!asset) {
    throw new Error(`No prebuilt k6 download is configured for ${process.platform}-${process.arch}. Set K6_BINARY_PATH instead.`);
  }

  const K6_VERSION = 'v0.56.0';
  const downloadUrl = `https://github.com/grafana/k6/releases/download/${K6_VERSION}/k6-${K6_VERSION}-${asset}.tar.gz`;
  fs.mkdirSync(TEMP_BIN_DIR, { recursive: true });
  const tarGzPath = path.join(TEMP_BIN_DIR, `k6-${asset}.tar.gz`);

  console.log(`[LoadCheck k6] k6 not found. Downloading ${downloadUrl}...`);
  try {
    await downloadFile(downloadUrl, tarGzPath);
    execSync(`tar -xzf "${tarGzPath}" -C "${TEMP_BIN_DIR}" --strip-components=1`, { stdio: 'inherit' });
    if (!fs.existsSync(TEMP_K6_PATH)) {
      throw new Error('k6 binary was not found after extraction');
    }
    makeExecutable(TEMP_K6_PATH);
    console.log(`[LoadCheck k6] Installed k6 to ${TEMP_K6_PATH}`);
    return cacheBinary(TEMP_K6_PATH);
  } finally {
    if (fs.existsSync(tarGzPath)) {
      try { fs.unlinkSync(tarGzPath); } catch {}
    }
  }
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
