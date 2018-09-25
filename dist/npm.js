"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path = require("path");
const ttyTable_1 = require("./ttyTable");
const Queue_1 = require("./Queue");
const readline = require("readline");
const argv_1 = require("./argv");
const noop = function () { };
const isWin32 = process.platform === 'win32';
const npmExec = child_process_1.execSync(`${isWin32 ? 'where' : 'which'} npm`).toString().split('\n')[0];
if (!npmExec || !(/[\\\/]/).test(npmExec))
    throw new Error('unable to locate npm');
const npmModulesPath = path.join(npmExec, '../node_modules/');
const npm = require(path.join(npmModulesPath, 'npm/lib/npm'));
const lockfileStr = process.argv.slice(-1).pop().startsWith('-') ? false : process.argv.pop();
const argvArr = process.argv.slice(2);
const argv = new Set(argvArr);
const queue = new Queue_1.default();
function renderHelp(options) {
    const rowsAndColumns = options.map(([shortcmd, cmd, type, def, description = '']) => [
        // cmd column
        [(shortcmd ? `-${shortcmd}, ` : ''), `--${cmd}`].join(''),
        // type and default value column
        (type ? (type.name || type) : '') + (def ? ` = ${def.name || def}` : ''),
        // description column
        description,
    ]);
    // render all rows and columns
    const optionsTable = ttyTable_1.default(rowsAndColumns);
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
    if (err)
        throw err;
    const npmCache = require(path.join(npmModulesPath, 'npm/lib/cache'));
    const npmConfigProduction = ttyTable_1.renameFunction('npm.config.production', () => npm.config.get('production'));
    const npmConfigOptional = ttyTable_1.renameFunction('npm.config.optional', () => npm.config.get('optional'));
    const npmConfigCache = ttyTable_1.renameFunction('npm.config.cache', () => npm.config.get('cache'));
    /* tslint:disable max-line-length */
    const options = [
        // short command, long command, type, description
        ['c', 'cache', ttyTable_1.string, npmConfigCache, 'Cache Directory'],
        ['p', 'production', ttyTable_1.boolean, npmConfigProduction, 'Ignore developer depdencies'],
        ['o', 'no-optional', ttyTable_1.boolean, npmConfigOptional, 'Ignore optional depedencies'],
        ['b', 'no-bundled', ttyTable_1.boolean, 'false', 'Ignore bundled depdencies'],
        ['f', 'no-file', ttyTable_1.boolean, 'true', 'Ignore file protocol dependencies'],
        ['b', 'no-progress', ttyTable_1.boolean, 'false', 'Disable progress rendering'],
        ['k', 'concurrency', ttyTable_1.integerRange(1, 100), '10', 'Number of dependencies to process at one given time. Concurrency number relates to number of concurrent requests to NPMs servers. Use a sensible value!'],
        ['h', 'help', , , 'Display this help'],
    ];
    /* tslint:enable max-line-length */
    const parsedOptions = argv_1.parseArgv(argvArr, options);
    if (!lockfileStr || parsedOptions.help) {
        renderHelp(options);
        return;
    }
    const rootPackage = JSON.parse(fs_1.readFileSync(path.resolve(lockfileStr)).toString());
    const npmCacheFolder = parsedOptions.cache;
    queue.concurrencyLimit = parsedOptions.concurrency;
    // TODO: check options if package should not be cached
    const shouldCachePackage = (pkg, usedVersion) => {
        const out = !((parsedOptions.production && pkg.dev) ||
            (parsedOptions.noBundled && pkg.bundled) ||
            (parsedOptions.noOptional && pkg.optional) ||
            (parsedOptions.noFile && usedVersion.startsWith('file:')));
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
        const line = Array.from(processing).reduce((p, c, i, arr) => {
            if (done)
                return p;
            const postfix = `... +${(arr.length - i).toString()}`;
            const a = ((i > 0) ? `, ${c}` : c);
            if (process.stdout.columns < p.length + a.length + postfix.length) {
                done = true;
                const parts = postfix.split(' ', 2);
                return (p + parts[0]).padEnd(process.stdout.columns - parts[0].length, ' ') + parts[1];
            }
            return p + a;
        }, 'Caching: ');
        process.stdout.write(line);
    };
    const cacheDependencies = (dependencies) => {
        if (!(dependencies instanceof Object))
            return false;
        let found = 0;
        for (const entry of Object.entries(dependencies)) {
            const [name, dependency] = entry;
            const { version, from, } = dependency;
            // if version specifies commit hash then it takes precedence
            const usedVersion = version.includes('#') ? version || from : from || version;
            if (!isCached.has(`${name}@${usedVersion}`)) {
                found += 1;
                isCached.add(`${name}@${usedVersion}`);
                queue.add(async () => {
                    if (dependency.dependencies)
                        cacheDependencies(dependency.dependencies);
                    if (!shouldCachePackage(dependency, usedVersion))
                        return;
                    try {
                        processing.add(name);
                        renderProcessing();
                        await npmCache.add(name, usedVersion, npmCacheFolder);
                        cached += 1;
                    }
                    catch (err) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnBtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL25wbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlEQUF5QztBQUN6QywyQkFBa0M7QUFDbEMsNkJBQTZCO0FBQzdCLHlDQUtvQjtBQUNwQixtQ0FBNEI7QUFDNUIscUNBQXFDO0FBQ3JDLGlDQUFtQztBQUVuQyxNQUFNLElBQUksR0FBRyxjQUFhLENBQUMsQ0FBQztBQUU1QixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sQ0FBQztBQUM3QyxNQUFNLE9BQU8sR0FBRyx3QkFBUSxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pGLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7SUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDbkYsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztBQUM5RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztBQUU5RCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzlGLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJ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