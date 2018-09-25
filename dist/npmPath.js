"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// original code from https://github.com/commenthol/require-global-npm/blob/master/index.js
const fs = require("fs");
const path = require("path");
function getNpmPath() {
    // it is assumed that npm is always installed alongside with node
    let npm;
    let npmBinPath;
    let npmPath;
    const binDir = path.dirname(process.execPath);
    const npmBin = path.join(binDir, 'npm');
    try {
        // maybe the NODE_PATH var is already set correctly
        npm = require('npm');
        if (!npm)
            throw new Error('npm not found');
        return npm;
    }
    catch (e) {
        if (fs.statSync(npmBin)) {
            if (fs.lstatSync(npmBin).isSymbolicLink()) {
                npmBinPath = path.resolve(binDir, fs.readlinkSync(npmBin));
                const NODE_MODULE_REGEX = /^(.*\/node_modules\/npm)(?:(?!\/node_modules\/npm).)*?$/;
                npmPath = npmBinPath.replace(NODE_MODULE_REGEX, '$1');
            }
            else {
                npmPath = path.resolve(binDir, 'node_modules', 'npm');
            }
            return npmPath;
        }
    }
}
exports.getNpmPath = getNpmPath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnBtUGF0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9ucG1QYXRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkZBQTJGO0FBQzNGLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFFN0IsU0FBZ0IsVUFBVTtJQUN4QixpRUFBaUU7SUFDakUsSUFBSSxHQUFHLENBQUM7SUFDUixJQUFJLFVBQVUsQ0FBQztJQUNmLElBQUksT0FBTyxDQUFDO0lBQ1osTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDOUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFeEMsSUFBSTtRQUNGLG1EQUFtRDtRQUNuRCxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxHQUFHO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUMzQyxPQUFPLEdBQUcsQ0FBQztLQUNaO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDdkIsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGNBQWMsRUFBRSxFQUFFO2dCQUN6QyxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUMzRCxNQUFNLGlCQUFpQixHQUFHLHlEQUF5RCxDQUFDO2dCQUNwRixPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUN2RDtpQkFBTTtnQkFDTCxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ3ZEO1lBQ0QsT0FBTyxPQUFPLENBQUM7U0FDaEI7S0FDRjtBQUNILENBQUM7QUF6QkQsZ0NBeUJDIn0=