import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import * as path from 'path';
import ttyTable, {
    renameFunction,
    boolean,
    string,
    integerRange,
} from './ttyTable';
import Queue from './Queue';
import * as readline from 'readline';
import { parseArgv } from './argv';

const noop = function () {};

const isWin32 = process.platform === 'win32';
const npmGlobalRoot = execSync('npm root -g').toString().trim();
const npmExec = execSync(`${isWin32 ? 'where' : 'which'} npm`).toString().split('\n')[0];
if (!npmExec || !(/[\\\/]/).test(npmExec)) throw new Error('unable to locate npm');
const npmModulesPath = path.join(npmExec, '../node_modules/');
const npmPaths = [npmModulesPath, npmGlobalRoot];
const npm = require(require.resolve('npm/lib/npm', { paths: npmPaths }));

const lockfileStr = process.argv.slice(-1).pop().startsWith('-') ? false : process.argv.pop();
const argvArr = process.argv.slice(2);
const argv = new Set(argvArr);
const queue = new Queue();

function renderHelp(options) {
  const rowsAndColumns = options.map(([shortcmd, cmd, type, def, description = '']) => [
    // cmd column
    [(shortcmd ? `-${shortcmd}, ` : ''), `--${cmd}`].join(''),
    // type and default value column
    (type ? (type.name || type) : '') + (def ? ` = ${ def.name || def}` : ''),
    // description column
    description,
  ]);

  // render all rows and columns
  const optionsTable = ttyTable(rowsAndColumns);

  console.log(`
Cache NPM Packages

  Add depedencies from a package-lock file to NPM cache.

Usage: cache - packages[OPTIONS] path / to / package - lock.json

OPTIONS:
${optionsTable}

Example:
  < ./cache-npm.js ./app/package-lock.json
  > added 69 packages to cache in 3.632s
`.trim());
}

const isCached = new Set();
npm.load({ loaded: false }, (err) => {
  if (err) throw err;
  const npmCache = require(require.resolve('npm/lib/cache', { paths: npmPaths }));

  const npmConfigProduction = renameFunction('npm.config.production',
                                             () => npm.config.get('production'));
  const npmConfigOptional = renameFunction('npm.config.optional', () => npm.config.get('optional'));
  const npmConfigCache = renameFunction('npm.config.cache', () => npm.config.get('cache'));

  /* tslint:disable max-line-length */
  const options = [
        // short command, long command, type, description
        ['c', 'cache',       string,               npmConfigCache,      'Cache Directory'],
        ['p', 'production',  boolean,              npmConfigProduction, 'Ignore developer depdencies'],
        ['o', 'no-optional', boolean,              npmConfigOptional,   'Ignore optional depedencies'],
        ['b', 'no-bundled',  boolean,              'false',             'Ignore bundled depdencies'],
        ['f', 'no-file',     boolean,              'true',              'Ignore file protocol dependencies'],
        ['b', 'no-progress', boolean,              'false',             'Disable progress rendering'],
        ['k', 'concurrency', integerRange(1, 100), '10',                'Number of dependencies to process at one given time. Concurrency number relates to number of concurrent requests to NPMs servers. Use a sensible value!'],
        ['h', 'help',        ,                     ,                    'Display this help'],
  ];
  /* tslint:enable max-line-length */

  const parsedOptions = parseArgv(argvArr, options);

  if (!lockfileStr || parsedOptions.help) {
    renderHelp(options);
    return;
  }

  const rootPackage = JSON.parse(readFileSync(path.resolve(lockfileStr)).toString());

  const npmCacheFolder = parsedOptions.cache;
  queue.concurrencyLimit = parsedOptions.concurrency;

    // TODO: check options if package should not be cached
  const shouldCachePackage = (pkg, usedVersion) => {
    const out = !(
      (parsedOptions.production && pkg.dev) ||
      (parsedOptions.noBundled && pkg.bundled) ||
      (parsedOptions.noOptional && pkg.optional) ||
      (parsedOptions.noFile && usedVersion.startsWith('file:'))
    );
    return out;
  };

  let cached = 0;
  const processing = new Set();

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
          if (process.stdout.columns < p.length + a.length + postfix.length) {
            done = true;
            const parts = postfix.split(' ', 2);
            return (p + parts[0]).padEnd(process.stdout.columns - parts[0].length, ' ') + parts[1];
          }
          return p + a;
        },
        'Caching: ');
    process.stdout.write(line);
  };

  const cacheDependencies = (dependencies) => {
    if (!(dependencies instanceof Object)) return false;
    let found = 0;
    for (const entry of Object.entries(dependencies)) {
      const [name, dependency] : [string, any] = entry;
      const {
        version,
        from,
      } = dependency;
      // if version specifies commit hash then it takes precedence
      const usedVersion = version.includes('#') ? version || from : from || version;
      if (!isCached.has(`${name}@${usedVersion}`)) {
        found += 1;
        isCached.add(`${name}@${usedVersion}`);
        queue.add(async () => {
          if (dependency.dependencies) cacheDependencies(dependency.dependencies);
          if (!shouldCachePackage(dependency, usedVersion)) return;
          try {
            processing.add(name);
            renderProcessing();
            await npmCache.add(name, usedVersion, npmCacheFolder);
            cached += 1;
          } catch (err) {
            clearProcessingLine();
            console.error('Error caching', name, usedVersion);
            console.error(err);
          }
          processing.delete(name);
          renderProcessing();
        });
      }
    }
    return found > 0;
  };

  const startTime = Date.now();
  queue.on('drained', () => {
    const runTime = Date.now() - startTime;
    console.log(`added ${cached} packages to cache in ${runTime / 1000}s`);
  });
  if (!cacheDependencies(rootPackage.dependencies)) {
    console.warn('0 dependencies found. Wrong file?');
  }
});
