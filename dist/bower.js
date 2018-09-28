"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_1 = require("fs");
const Queue_1 = require("./Queue");
const ttyTable_1 = require("./ttyTable");
const argv_1 = require("./argv");
const readline = require("readline");
const cliWidth = require("cli-width");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm93ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvYm93ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpREFBeUM7QUFDekMsK0JBQWlEO0FBQ2pELDJCQUFrQztBQUNsQyxtQ0FBNEI7QUFDNUIseUNBR29CO0FBQ3BCLGlDQUFtQztBQUNuQyxxQ0FBcUM7QUFDckMsc0NBQXNDO0FBRXRDLE1BQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQyxDQUFDO0FBRTdCLE1BQU0sYUFBYSxHQUFHLHdCQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDaEUsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFdBQUksQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUVyRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQy9GLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRTlCLE1BQU0sS0FBSyxHQUFHLElBQUksZUFBSyxFQUFFLENBQUM7QUFFMUIsU0FBUyxvQkFBb0IsQ0FBQyxPQUFPO0lBQ25DLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFdBQVcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDbkUsYUFBYTtRQUNiLENBQUMsQ0FBQyxRQUFRLENB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