const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.bin')) {
          walk(fullPath, callback);
        }
      } else {
        callback(fullPath);
      }
    }
  } catch (err) {
    // Ignore permissions or missing folder errors
  }
}

// 1. Patch opennextjs-cloudflare cli build command to default dangerouslyUseUnsupportedNextVersion to true
const cfBuildPath = path.join(process.cwd(), 'node_modules/@opennextjs/cloudflare/dist/cli/commands/build.js');
if (fs.existsSync(cfBuildPath)) {
  try {
    let content = fs.readFileSync(cfBuildPath, 'utf8');
    if (content.includes('default: false')) {
      content = content.replace(
        /dangerouslyUseUnsupportedNextVersion[\s\S]*?default:\s*false/g,
        (match) => match.replace('default: false', 'default: true')
      );
      fs.writeFileSync(cfBuildPath, content, 'utf8');
      console.log('[patch-opennext] Patched opennextjs-cloudflare build.js default flag to true');
    }
  } catch (e) {
    console.warn('[patch-opennext] Could not patch build.js:', e.message);
  }
}

// 2. Patch helper.js checkNextVersionSupport to always consider version supported
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
walk(nodeModulesPath, (filePath) => {
  if (filePath.endsWith(path.join('dist', 'build', 'helper.js')) || filePath.endsWith(path.join('build', 'helper.js'))) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('function checkNextVersionSupport') || content.includes('isNextVersionSupported')) {
        if (content.includes('const isSupported = isNextVersionSupported(nextVersion);')) {
          content = content.replace(
            'const isSupported = isNextVersionSupported(nextVersion);',
            'const isSupported = true;'
          );
          fs.writeFileSync(filePath, content, 'utf8');
          console.log('[patch-opennext] Patched helper.js in', filePath);
        }
      }
    } catch (e) {
      // Ignore
    }
  }
});
