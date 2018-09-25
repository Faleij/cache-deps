
import * as wordWrap from 'word-wrap';

interface IcliTableOptions {
  columnPadding? : number;
}

function tableLayout(
    availableWidth: number,
    maxContentWidths: number[],
) {
  const sumMaxContentWidths = maxContentWidths.reduce((p, c) => p + c, 0);
  const widthPerCell = Math.floor(availableWidth / maxContentWidths.length);
  let overflowCount = 0;
  let overflowTotalWidth = 0;
  const widthLeft = maxContentWidths.reduce((p, width) => {
    const isOverflowing = width > widthPerCell;
    if (isOverflowing) {
      overflowCount += 1;
      overflowTotalWidth += width;
      return p;
    }
    return p + (widthPerCell - width);
  },                                        0);
  const widths = maxContentWidths.map((width) => {
    const isOverflowing = width > widthPerCell;
    if (!isOverflowing) return width;
    const widthLeftRatio = width / overflowTotalWidth;
    return Math.floor(widthPerCell + (widthLeftRatio * widthLeft));
  });
  const sumWidths = widths.reduce((p, c) => p + c, 0);
  const widthDiff = availableWidth - sumWidths;
  widths[widths.length - 1] += widthDiff;
  return widths;
}

// rework and go column by column instead of row by row
//

export default function ttyTable(rowsAndColumns : string[][], options? : IcliTableOptions) {
  const {
    columnPadding = 2,
  } = options || {};

  // calculate max length for each column
  const maxLengthPerColumn : number[] = rowsAndColumns.reduce(
    (p, row) => row.map((v, i) => Math.max(p[i], v.length)),
    Array(rowsAndColumns[0].length).fill(0),
  );

  const sumColumnMaxLength = maxLengthPerColumn.reduce((p, c) => p + c, 0);

  const availableWidth = process.stdout.columns - (maxLengthPerColumn.length * columnPadding);
  const lengthPerColumn = tableLayout(availableWidth, maxLengthPerColumn);
  if (availableWidth < sumColumnMaxLength) {
    const rowsAndColumnsIter = rowsAndColumns.entries();
    for (const [rowIndex, row] of rowsAndColumnsIter) {
      let restLine : string[][];
      let restLineRowCount = 0;
      for (const [colIndex, maxLength] of lengthPerColumn.entries()) {
        if (row[colIndex].length > maxLength) {
          if (!restLine) restLine = Array(row.length).fill([]);
          const wrapped = wordWrap(row[colIndex], { width: maxLength, indent: '', newline: '\n' });
          const lines = wrapped.split('\n');
          row[colIndex] = lines.shift().trim();
          restLine[colIndex] = lines;
          restLineRowCount = Math.max(restLineRowCount, lines.length);
        }
      }
      // deal with wrapped lines
      for (let restLineIndex = 0; restLineIndex < restLineRowCount; restLineIndex += 1) {
        // insert each wrapped line into rows and columns
        const newLine = restLine.map(arr => (arr[restLineIndex] || '').trim());
        rowsAndColumns.splice(rowIndex + 1 + restLineIndex, 0, newLine);
        // ignore processing inserted line as it is already wrapped
        rowsAndColumnsIter.next();
      }
    }
  }

  const lineStartPadding = ' '.repeat(columnPadding);

  function renderColumn(lineStr, colStr = '', colIndex) {
    return lineStr + colStr.padEnd(lengthPerColumn[colIndex] + columnPadding, ' ');
  }

  // return table as rendered string
  const rows = rowsAndColumns.map(
    row => row.reduce(renderColumn, lineStartPadding).slice(0, -columnPadding),
    );
  return rows.join('\n');
}

export function renameFunction(name: string, fn: Function) {
  return Object.defineProperty(fn, 'name', { value: name });
}

export function boolean(v) {
  return String(v).toLowerCase() === 'false' ? false : Boolean(v);
}

export function string(v) {
  return v;
}

export function integer(v = '0') {
  return parseInt(v, 10);
}

export function integerRange(min = -Infinity, max = Infinity) {
  const name = `integer[${min === -Infinity ? '-∞' : min}, ${max === Infinity ? '∞' : max}]`;
  return renameFunction(name, v => Math.min(max, Math.max(min, integer(v))));
}
