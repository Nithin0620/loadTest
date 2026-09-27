/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.externals.push({
      'mongodb-client-encryption': 'mongodb-client-encryption',
      '@aws-sdk/credential-providers': '@aws-sdk/credential-providers',
      'gcp-metadata': 'gcp-metadata',
      'snappy': 'snappy',
      'socks': 'socks',
      'aws4': 'aws4',
      'kerberos': 'kerberos'
    });
    return config;
  },
};

export default nextConfig;
