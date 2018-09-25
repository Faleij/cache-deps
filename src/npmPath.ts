// original code from https://github.com/commenthol/require-global-npm/blob/master/index.js
import * as fs from 'fs';
import * as path from 'path';

export function getNpmPath() {
  // it is assumed that npm is always installed alongside with node
  let npm;
  let npmBinPath;
  let npmPath;
  const binDir = path.dirname(process.execPath);
  const npmBin = path.join(binDir, 'npm');

  try {
    // maybe the NODE_PATH var is already set correctly
    npm = require('npm');
    if (!npm) throw new Error('npm not found');
    return npm;
  } catch (e) {
    if (fs.statSync(npmBin)) {
      if (fs.lstatSync(npmBin).isSymbolicLink()) {
        npmBinPath = path.resolve(binDir, fs.readlinkSync(npmBin));
        const NODE_MODULE_REGEX = /^(.*\/node_modules\/npm)(?:(?!\/node_modules\/npm).)*?$/;
        npmPath = npmBinPath.replace(NODE_MODULE_REGEX, '$1');
      } else {
        npmPath = path.resolve(binDir, 'node_modules', 'npm');
      }
      return npmPath;
    }
  }
}
