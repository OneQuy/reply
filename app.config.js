const fs = require('fs');
const path = require('path');

/** Read a .env value without $-expansion (JSONBin master keys start with $2a$). */
function readEnvFileValue(name) {
  try {
    const text = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    for (const line of text.split(/\n/)) {
      if (!line.startsWith(`${name}=`)) continue;
      let value = line.slice(name.length + 1).trim();
      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1);
      }
      return value;
    }
  } catch {
    // ignore missing .env
  }
  return '';
}

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    openRouterApiKey: process.env.OPENROUTER_API_KEY_onequy ?? '',
    // Prefer literal .env read: Expo/dotenv expands $ in $2a$... and corrupts the key.
    jsonbinApiKey:
      readEnvFileValue('JSONBIN_API_KEY') ||
      readEnvFileValue('EXPO_PUBLIC_JSONBIN_API_KEY') ||
      process.env.JSONBIN_API_KEY ||
      process.env.EXPO_PUBLIC_JSONBIN_API_KEY ||
      '',
    jsonbinBinId:
      readEnvFileValue('JSONBIN_BIN_ID') ||
      readEnvFileValue('EXPO_PUBLIC_JSONBIN_BIN_ID') ||
      process.env.JSONBIN_BIN_ID ||
      process.env.EXPO_PUBLIC_JSONBIN_BIN_ID ||
      '',
  },
});
