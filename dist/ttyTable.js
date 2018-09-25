"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wordWrap = require("word-wrap");
function tableLayout(availableWidth, maxContentWidths) {
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
    }, 0);
    const widths = maxContentWidths.map((width) => {
        const isOverflowing = width > widthPerCell;
        if (!isOverflowing)
            return width;
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
function ttyTable(rowsAndColumns, options) {
    const { columnPadding = 2, } = options || {};
    // calculate max length for each column
    const maxLengthPerColumn = rowsAndColumns.reduce((p, row) => row.map((v, i) => Math.max(p[i], v.length)), Array(rowsAndColumns[0].length).fill(0));
    const sumColumnMaxLength = maxLengthPerColumn.reduce((p, c) => p + c, 0);
    const availableWidth = process.stdout.columns - (maxLengthPerColumn.length * columnPadding);
    const lengthPerColumn = tableLayout(availableWidth, maxLengthPerColumn);
    if (availableWidth < sumColumnMaxLength) {
        const rowsAndColumnsIter = rowsAndColumns.entries();
        for (const [rowIndex, row] of rowsAndColumnsIter) {
            let restLine;
            let restLineRowCount = 0;
            for (const [colIndex, maxLength] of lengthPerColumn.entries()) {
                if (row[colIndex].length > maxLength) {
                    if (!restLine)
                        restLine = Array(row.length).fill([]);
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
    const rows = rowsAndColumns.map(row => row.reduce(renderColumn, lineStartPadding).slice(0, -columnPadding));
    return rows.join('\n');
}
exports.default = ttyTable;
function renameFunction(name, fn) {
    return Object.defineProperty(fn, 'name', { value: name });
}
exports.renameFunction = renameFunction;
function boolean(v) {
    return String(v).toLowerCase() === 'false' ? false : Boolean(v);
}
exports.boolean = boolean;
function string(v) {
    return v;
}
exports.string = string;
function integer(v = '0') {
    return parseInt(v, 10);
}
exports.integer = integer;
function integerRange(min = -Infinity, max = Infinity) {
    const name = `integer[${min === -Infinity ? '-∞' : min}, ${max === Infinity ? '∞' : max}]`;
    return renameFunction(name, v => Math.min(max, Math.max(min, integer(v))));
}
exports.integerRange = integerRange;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHR5VGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdHR5VGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxzQ0FBc0M7QUFNdEMsU0FBUyxXQUFXLENBQ2hCLGNBQXNCLEVBQ3RCLGdCQUEwQjtJQUU1QixNQUFNLG1CQUFtQixHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDeEUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUUsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLE1BQU0sU0FBUyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUNyRCxNQUFNLGFBQWEsR0FBRyxLQUFLLEdBQUcsWUFBWSxDQUFDO1FBQzNDLElBQUksYUFBYSxFQUFFO1lBQ2pCLGFBQWEsSUFBSSxDQUFDLENBQUM7WUFDbkIsa0JBQWtCLElBQUksS0FBSyxDQUFDO1lBQzVCLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7UUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsQ0FBQztJQUNwQyxDQUFDLEVBQXlDLENBQUMsQ0FBQyxDQUFDO0lBQzdDLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQzVDLE1BQU0sYUFBYSxHQUFHLEtBQUssR0FBRyxZQUFZLENBQUM7UUFDM0MsSUFBSSxDQUFDLGFBQWE7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUNqQyxNQUFNLGNBQWMsR0FBRyxLQUFLLEdBQUcsa0JBQWtCLENB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