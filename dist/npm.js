"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path = require("path");
const ttyTable_1 = require("./ttyTable");
const Queue_1 = require("./Queue");
const readline = require("readline");
const argv_1 = require("./argv");
const npmPath_1 = require("./npmPath");
const cliWidth = require("cli-width");
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
    const ttyWidth = cliWidth({ defaultWidth: 80 });
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
            if (ttyWidth < p.length + a.length + postfix.length) {
                done = true;
                const parts = postfix.split(' ', 2);
                return (p + parts[0]).padEnd(ttyWidth - parts[0].length, ' ') + parts[1];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnBtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL25wbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDJCQUFrQztBQUNsQyw2QkFBNkI7QUFDN0IseUNBS29CO0FBQ3BCLG1DQUE0QjtBQUM1QixxQ0FBcUM7QUFDckMsaUNBQW1DO0FBQ25DLHVDQUF1QztBQUN2QyxzQ0FBc0M7QUFFdEMsTUFBTSxJQUFJLEdBQUcsY0FBYSxDQUFDLENBQUM7QUFFNUIsTUFBTSxhQUFhLEdBQUcsb0JBQVUsRUFBRSxDQUFDO0FBQ25DLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLGFBQWEsVUFBVSxDQUFDLENBQUM7QUFFaEQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUM5RixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLGVBQUssRUFBRSxDQUFDO0FBRTFCLFNBQVMsVUFBVSxDQUFDLE9BQU87SUFDekIsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFdBQVcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDbkYsYUFBYTtRQUNiLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FB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