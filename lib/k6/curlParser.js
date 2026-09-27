/**
 * Parses raw cURL command strings into structured LoadCheck test configurations.
 * Handles:
 * - URL and Method (-X, --request, default GET, or POST when -d is present)
 * - Headers (-H, --header)
 * - Basic / Bearer Auth (-u, --user, Authorization header)
 * - Data payloads (-d, --data, --data-raw, --data-binary, --data-urlencode)
 */
export function parseCurlCommand(rawCurl) {
  if (!rawCurl || typeof rawCurl !== 'string') {
    throw new Error('Invalid cURL command input');
  }

  // Normalize newlines and backslashes
  const cleaned = rawCurl
    .replace(/\\\r?\n/g, ' ')
    .replace(/\r?\n/g, ' ')
    .trim();

  if (!cleaned.toLowerCase().startsWith('curl')) {
    throw new Error('Command must start with "curl"');
  }

  // Tokenize preserving quotes
  const tokens = tokenizeArgs(cleaned.slice(4).trim());

  let targetUrl = '';
  let httpMethod = '';
  const headers = [];
  const auth = { authType: 'none', token: '', username: '', password: '' };
  let bodyType = 'none';
  let bodyContent = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Method flag
    if (token === '-X' || token === '--request') {
      httpMethod = (tokens[++i] || 'GET').toUpperCase();
    }
    // Headers flag
    else if (token === '-H' || token === '--header') {
      const headerStr = tokens[++i] || '';
      const colonIdx = headerStr.indexOf(':');
      if (colonIdx > -1) {
        const key = headerStr.slice(0, colonIdx).trim();
        const value = headerStr.slice(colonIdx + 1).trim();

        // Check if authorization header
        if (key.toLowerCase() === 'authorization') {
          if (value.toLowerCase().startsWith('bearer ')) {
            auth.authType = 'bearer';
            auth.token = value.slice(7).trim();
          } else if (value.toLowerCase().startsWith('basic ')) {
            try {
              const decoded = Buffer.from(value.slice(6).trim(), 'base64').toString('utf-8');
              const [user, pass] = decoded.split(':');
              auth.authType = 'basic';
              auth.username = user || '';
              auth.password = pass || '';
            } catch {
              headers.push({ key, value, enabled: true });
            }
          } else {
            headers.push({ key, value, enabled: true });
          }
        } else {
          headers.push({ key, value, enabled: true });
        }
      }
    }
    // User auth flag (-u / --user)
    else if (token === '-u' || token === '--user') {
      const authStr = tokens[++i] || '';
      const [u, p] = authStr.split(':');
      auth.authType = 'basic';
      auth.username = u || '';
      auth.password = p || '';
    }
    // Data / Body flags
    else if (
      token === '-d' || 
      token === '--data' || 
      token === '--data-raw' || 
      token === '--data-binary' ||
      token === '--data-ascii'
    ) {
      const rawData = tokens[++i] || '';
      bodyContent = rawData;
      // Auto-detect JSON
      try {
        JSON.parse(rawData);
        bodyType = 'json';
      } catch {
        bodyType = 'raw';
      }
    }
    // URL without flags (or url argument)
    else if (token.startsWith('http://') || token.startsWith('https://')) {
      targetUrl = token.replace(/^['"]|['"]$/g, '');
    } else if (token === '--url') {
      targetUrl = (tokens[++i] || '').replace(/^['"]|['"]$/g, '');
    }
  }

  // Infer method if not explicitly set
  if (!httpMethod) {
    httpMethod = bodyContent ? 'POST' : 'GET';
  }

  if (!targetUrl) {
    throw new Error('Could not extract target URL from cURL command');
  }

  return {
    targetUrl,
    httpMethod,
    headers,
    auth,
    bodyType,
    bodyContent,
  };
}

/**
 * Tokenizes command string handling single, double, and unquoted strings.
 */
function tokenizeArgs(str) {
  const tokens = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let escaping = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (char === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }

    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }

    if (/\s/.test(char) && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}
