import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import https from 'https';
import { promisify } from 'util';
import stream from 'stream';
import zlib from 'zlib';

const pipeline = promisify(stream.pipeline);

const BIN_DIR = path.resolve(process.cwd(), 'bin');
const K6_BIN_PATH = path.join(BIN_DIR, 'k6');

export async function ensureK6Binary() {
  // 1. Check if k6 is installed globally
  try {
    const globalK6 = execSync('which k6', { encoding: 'utf-8' }).trim();
    if (globalK6) {
      console.log(`[LoadCheck k6] Found system k6 at: ${globalK6}`);
      return globalK6;
    }
  } catch {
    // Not installed globally
  }

  // 2. Check if local bin/k6 exists and is executable
  if (fs.existsSync(K6_BIN_PATH)) {
    try {
      fs.accessSync(K6_BIN_PATH, fs.constants.X_OK);
      return K6_BIN_PATH;
    } catch {
      fs.chmodSync(K6_BIN_PATH, 0o755);
      return K6_BIN_PATH;
    }
  }

  // 3. Download standalone k6 binary for Linux x86_64
  console.log('[LoadCheck k6] k6 binary not found. Auto-downloading official k6 release...');
  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }

  const K6_VERSION = 'v0.56.0';
  const downloadUrl = `https://github.com/grafana/k6/releases/download/${K6_VERSION}/k6-${K6_VERSION}-linux-amd64.tar.gz`;
  const tarGzPath = path.join(BIN_DIR, 'k6.tar.gz');

  console.log(`[LoadCheck k6] Downloading ${downloadUrl}...`);
  await downloadFile(downloadUrl, tarGzPath);

  console.log('[LoadCheck k6] Extracting binary...');
  try {
    execSync(`tar -xzf "${tarGzPath}" -C "${BIN_DIR}" --strip-components=1`, { stdio: 'inherit' });
    if (fs.existsSync(tarGzPath)) {
      fs.unlinkSync(tarGzPath);
    }
    if (fs.existsSync(K6_BIN_PATH)) {
      fs.chmodSync(K6_BIN_PATH, 0o755);
      console.log(`[LoadCheck k6] Successfully installed k6 binary to ${K6_BIN_PATH}`);
      return K6_BIN_PATH;
    }
  } catch (err) {
    console.error('[LoadCheck k6] Extraction failed:', err.message);
    throw err;
  }

  return K6_BIN_PATH;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle HTTP redirects (GitHub Releases redirect to AWS S3)
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

// Run standalone if invoked directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(K6_BIN_PATH.replace(/\/k6$/, '/ensure-k6.js') || '')) {
  ensureK6Binary().catch(console.error);
}
