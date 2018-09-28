import { execSync } from 'child_process';
import { join, resolve as _resolve } from 'path';
import { readFileSync } from 'fs';
import Queue from './Queue';
import ttyTable, {
    integerRange,
    boolean,
} from './ttyTable';
import { parseArgv } from './argv';
import * as readline from 'readline';
import * as cliWidth from 'cli-width';

const noop = function () { };

const npmGlobalRoot = execSync('npm root -g').toString().trim();
const bower = require(join(npmGlobalRoot, '/bower'));

const bowerfileStr = process.argv.slice(-1).pop().startsWith('-') ? false : process.argv.pop();
const argvArr = process.argv.slice(2);
const argv = new Set(argvArr);

const queue = new Queue();

function optionsToRowsAndCols(options) {
  return options.map(([shortcmd, cmd, type, def, description = '']) => [
    // cmd column
    [(shortcmd ? `-${shortcmd}, ` : ''), `--${cmd}`].join(''),
    // type and default value column
    (type ? (type.name || type) : '') + (def ? ` = ${def.name || def}` : ''),
    // description column
    description,
  ]);
}

function renderHelp(options) {
  const rowsAndColumns = optionsToRowsAndCols(options);
  // render all rows and columns
  const optionsTable = ttyTable(rowsAndColumns);
  console.log(`
Cache Bower Dependencies

  Add all dependencies from a bower.json file to Bowers cache.

Usage: cache-bower [OPTIONS] path/to/bower.json

Options:
${optionsTable}

Example:
  < ./cache-bower.js ./app/bower.json
  > added 69 packages to cache in 11.927s
`.trim());
}

/* tslint:disable max-line-length */
const options = [
    // short command, long command, type, description
//  ['p', 'production',  boolean, 'true', 'Ignore developer depdencies'], // TODO: support
//  ['f', 'no-file',     boolean, 'true', 'Ignore file protocol dependencies'], // TODO: support
    ['b', 'no-progress', boolean,              'false', 'Disable progress rendering'],
    ['k', 'concurrency', integerRange(1, 100), '10',    'Number of dependencies to cache at one given time'],
    ['h', 'help',        ,                     ,        'Display this help'],
];
/* tslint:enable max-line-length */

const parsedOptions : any = parseArgv(argvArr, options);

if (!bowerfileStr || parsedOptions.help) {
  renderHelp(options);
  process.exit();
}

queue.concurrencyLimit = parsedOptions.concurrency;

const isCached = new Set();
const rootPackage = JSON.parse(readFileSync(_resolve(bowerfileStr as string)).toString());

// TODO: check options if package should not be cached
const shouldCachePackage = (name, usedVersion) => {
  return true;
};

let cached = 0;
const processing = new Set();
const ttyWidth = cliWidth({ defaultWidth: 80 });

const clearProcessingLine = parsedOptions.noProgress ? noop : () => {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
};
const renderProcessing = parsedOptions.noProgress ? noop : () => {
  clearProcessingLine();
  let done;
  const line = Array.from(processing).reduce(
    (p, c, i, arr) => {
      if (done) return p;
      const postfix = `... +${(arr.length - i).toString()}`;
      const a = ((i > 0) ? `, ${c}` : c);
      if (ttyWidth < p.length + a.length + postfix.length) {
        done = true;
        const parts = postfix.split(' ', 2);
        return (p + parts[0]).padEnd(ttyWidth - parts[0].length, ' ') + parts[1];
      }
      return p + a;
    },
    'Caching: ');
  process.stdout.write(line);
};

const httpGitOrSvnURL = /^((https?:\/\/)|((git|svn)[+@]))/;
const cacheDependencies = (pkg) => {
  const resolutions = pkg.resolutions || {};
  if (!(pkg.dependencies instanceof Object)) return;
  for (const [name, version] of Object.entries(pkg.dependencies)) {
    // TODO: support "overrides"
    // resolution version takes precedence
    const usedVersion = resolutions[name] || version;
    if (!isCached.has(`${name}@${usedVersion}`)) {
      isCached.add(`${name}@${usedVersion}`);
      queue.add(async () => {
        if (!shouldCachePackage(name, usedVersion)) return;
        await new Promise((resolve) => {
        // bower info command downloads package to cache
          let endpoint = usedVersion;
          if (!httpGitOrSvnURL.test(endpoint)) {
            // support <name>=<package>#<version>
            endpoint = endpoint.includes('#') ? endpoint : `${name}#${usedVersion}`;
          }

          processing.add(name);
          renderProcessing();
          bower.commands.info(endpoint)
            .on('error', (err) => {
              clearProcessingLine();
              console.error('Error caching', name, usedVersion);
              console.error(err);
              resolve();
            })
            .on('end', (res) => {
              if (res.dependencies) cacheDependencies(res);
              if (res.latest && res.latest.dependencies) cacheDependencies(res.latest);
              cached += 1;
              resolve();
            });
        });
        processing.delete(name);
        renderProcessing();
      });
    }
  }
};

const startTime = Date.now();
queue.on('drained', () => {
  const runTime = Date.now() - startTime;
  console.log(`added ${cached} packages to cache in ${runTime / 1000}s`);
});
cacheDependencies(rootPackage);
