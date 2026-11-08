const fs = require('fs');
const path = require('path');

/** Read a .env value without $-expansion (JSONBin keys start with $2a$). */
function readEnvFileValue(fileName, name) {
  try {
    const text = fs.readFileSync(path.join(__dirname, fileName), 'utf8');
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
    // ignore missing file
  }
  return '';
}

function readJsonBinValue(name) {
  // Prefer file reads over process.env: Expo dotenv expands `$` in `$2a$...` keys.
  return (
    readEnvFileValue('.env.local', name) ||
    readEnvFileValue('.env', name) ||
    ''
  );
}

module.exports = ({ config }) => {
  const jsonbinApiKey =
    readJsonBinValue('JSONBIN_API_KEY') ||
    readJsonBinValue('EXPO_PUBLIC_JSONBIN_API_KEY') ||
    // EAS-injected env (not dotenv) is safe; local dotenv process.env may be corrupted.
    process.env.JSONBIN_API_KEY ||
    process.env.EXPO_PUBLIC_JSONBIN_API_KEY ||
    '';
  const jsonbinBinId =
    readJsonBinValue('JSONBIN_BIN_ID') ||
    readJsonBinValue('EXPO_PUBLIC_JSONBIN_BIN_ID') ||
    process.env.JSONBIN_BIN_ID ||
    process.env.EXPO_PUBLIC_JSONBIN_BIN_ID ||
    '';

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      openRouterApiKey:
        process.env.OPENROUTER_API_KEY_onequy ||
        process.env.EXPO_PUBLIC_OPENROUTER_API_KEY_onequy ||
        '',
      jsonbinApiKey,
      jsonbinBinId,
    },
  };
};
