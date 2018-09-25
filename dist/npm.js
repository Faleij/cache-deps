"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path = require("path");
const ttyTable_1 = require("./ttyTable");
const Queue_1 = require("./Queue");
const readline = require("readline");
const argv_1 = require("./argv");
const npmPath_1 = require("./npmPath");
const noop = function () { };
const globalNpmPath = npmPath_1.getNpmPath();
const npm = require(`${globalNpmPath}/lib/npm`);
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
    const npmCache = require(`${globalNpmPath}/lib/cache`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnBtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL25wbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDJCQUFrQztBQUNsQyw2QkFBNkI7QUFDN0IseUNBS29CO0FBQ3BCLG1DQUE0QjtBQUM1QixxQ0FBcUM7QUFDckMsaUNBQW1DO0FBQ25DLHVDQUF1QztBQUV2QyxNQUFNLElBQUksR0FBRyxjQUFhLENBQUMsQ0FBQztBQUU1QixNQUFNLGFBQWEsR0FBRyxvQkFBVSxFQUFFLENBQUM7QUFDbkMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsYUFBYSxVQUFVLENBQUMsQ0FBQztBQUVoRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzlGLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksZUFBSyxFQUFFLENBQUM7QUFFMUIsU0FBUyxVQUFVLENBQUMsT0FBTztJQUN6QixNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsV0FBVyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNuRixhQUFhO1FBQ2IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxH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