"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_1 = require("fs");
const Queue_1 = require("./Queue");
const ttyTable_1 = require("./ttyTable");
const argv_1 = require("./argv");
const readline = require("readline");
const noop = function () { };
const npmGlobalRoot = child_process_1.execSync('npm root -g').toString().trim();
const bower = require(path_1.join(npmGlobalRoot, '/bower'));
const bowerfileStr = process.argv.slice(-1).pop().startsWith('-') ? false : process.argv.pop();
const argvArr = process.argv.slice(2);
const argv = new Set(argvArr);
const queue = new Queue_1.default();
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
    const optionsTable = ttyTable_1.default(rowsAndColumns);
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
    ['b', 'no-progress', ttyTable_1.boolean, 'false', 'Disable progress rendering'],
    ['k', 'concurrency', ttyTable_1.integerRange(1, 100), '10', 'Number of dependencies to cache at one given time'],
    ['h', 'help', , , 'Display this help'],
];
/* tslint:enable max-line-length */
const parsedOptions = argv_1.parseArgv(argvArr, options);
if (!bowerfileStr || parsedOptions.help) {
    renderHelp(options);
    process.exit();
}
queue.concurrencyLimit = parsedOptions.concurrency;
const isCached = new Set();
const rootPackage = JSON.parse(fs_1.readFileSync(path_1.resolve(bowerfileStr)).toString());
// TODO: check options if package should not be cached
const shouldCachePackage = (name, usedVersion) => {
    return true;
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
const httpGitOrSvnURL = /^((https?:\/\/)|((git|svn)[+@]))/;
const cacheDependencies = (pkg) => {
    const resolutions = pkg.resolutions || {};
    if (!(pkg.dependencies instanceof Object))
        return;
    for (const [name, version] of Object.entries(pkg.dependencies)) {
        // TODO: support "overrides"
        // resolution version takes precedence
        const usedVersion = resolutions[name] || version;
        if (!isCached.has(`${name}@${usedVersion}`)) {
            isCached.add(`${name}@${usedVersion}`);
            queue.add(async () => {
                if (!shouldCachePackage(name, usedVersion))
                    return;
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
                        if (res.dependencies)
                            cacheDependencies(res);
                        if (res.latest && res.latest.dependencies)
                            cacheDependencies(res.latest);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm93ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvYm93ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpREFBeUM7QUFDekMsK0JBQWlEO0FBQ2pELDJCQUFrQztBQUNsQyxtQ0FBNEI7QUFDNUIseUNBR29CO0FBQ3BCLGlDQUFtQztBQUNuQyxxQ0FBcUM7QUFFckMsTUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLENBQUM7QUFFN0IsTUFBTSxhQUFhLEdBQUcsd0JBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNoRSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsV0FBSSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBRXJELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDL0YsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFOUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxlQUFLLEVBQUUsQ0FBQztBQUUxQixTQUFTLG9CQUFvQixDQUFDLE9BQU87SUFDbkMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsV0FBVyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNuRSxhQUFhO1FBQ2IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMs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