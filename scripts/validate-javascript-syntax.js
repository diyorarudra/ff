const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'reports']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function lineColumnFromOffset(source, offset) {
  const before = source.slice(0, offset);
  const lines = before.split(/\r?\n/);
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function isJavaScriptScriptTag(attrs) {
  const typeMatch = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i);
  if (!typeMatch) return true;
  const type = typeMatch[1].toLowerCase();
  return [
    'text/javascript',
    'application/javascript',
    'application/ecmascript',
    'text/ecmascript',
    'module'
  ].includes(type);
}

function syntaxPosition(error, fallbackLine = 1) {
  if (typeof error.lineNumber === 'number') {
    return { line: error.lineNumber, column: error.columnNumber || 1 };
  }
  const stack = String(error.stack || error.message || '');
  const match = stack.match(/:(\d+):(\d+)\)?(?:\r?\n|$)/);
  return {
    line: match ? Number(match[1]) : fallbackLine,
    column: match ? Number(match[2]) : 1
  };
}

function parseJavaScript(code, filename, lineOffset = 0) {
  try {
    new vm.Script(code, { filename, lineOffset });
    return null;
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    const pos = syntaxPosition(error, lineOffset + 1);
    return {
      file: filename,
      line: pos.line,
      column: pos.column,
      message: error.message
    };
  }
}

function extractInlineScripts(html, file) {
  const scripts = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let index = 0;
  while ((match = re.exec(html))) {
    index += 1;
    const attrs = match[1] || '';
    if (/\bsrc\s*=/i.test(attrs) || !isJavaScriptScriptTag(attrs)) continue;
    const startOffset = match.index + match[0].indexOf(match[2]);
    const pos = lineColumnFromOffset(html, startOffset);
    scripts.push({
      file,
      index,
      code: match[2],
      lineOffset: pos.line - 1
    });
  }
  return scripts;
}

function validate(rootDir = root) {
  const files = walk(rootDir);
  const inlineErrors = [];
  const localErrors = [];
  let inlineScriptsChecked = 0;
  let localScriptsChecked = 0;

  for (const file of files) {
    if (file.endsWith('.html')) {
      const html = fs.readFileSync(file, 'utf8');
      for (const script of extractInlineScripts(html, rel(file))) {
        inlineScriptsChecked += 1;
        const error = parseJavaScript(
          script.code,
          `${script.file}#script-${script.index}`,
          script.lineOffset
        );
        if (error) inlineErrors.push({ ...error, scriptIndex: script.index });
      }
    } else if (/\.(?:js|mjs)$/i.test(file)) {
      localScriptsChecked += 1;
      const error = parseJavaScript(fs.readFileSync(file, 'utf8'), rel(file));
      if (error) localErrors.push(error);
    }
  }

  return {
    inlineScriptsChecked,
    localScriptsChecked,
    inlineErrors,
    localErrors
  };
}

function printResult(result) {
  for (const error of result.inlineErrors) {
    console.error(`inline ${error.file}:${error.line}:${error.column} script ${error.scriptIndex} ${error.message}`);
  }
  for (const error of result.localErrors) {
    console.error(`local ${error.file}:${error.line}:${error.column} ${error.message}`);
  }
  console.log(`Inline JavaScript scripts checked: ${result.inlineScriptsChecked}`);
  console.log(`Local JavaScript files checked: ${result.localScriptsChecked}`);
  console.log(`Inline JavaScript syntax errors: ${result.inlineErrors.length}`);
  console.log(`External/local JavaScript syntax errors: ${result.localErrors.length}`);
}

if (require.main === module) {
  const result = validate(root);
  printResult(result);
  if (result.inlineErrors.length || result.localErrors.length) process.exit(1);
}

module.exports = {
  validate,
  extractInlineScripts,
  parseJavaScript
};
