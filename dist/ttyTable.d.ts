interface IcliTableOptions {
    columnPadding?: number;
}
export default function ttyTable(rowsAndColumns: string[][], options?: IcliTableOptions): string;
export declare function renameFunction(name: string, fn: Function): any;
export declare function boolean(v: any): boolean;
export declare function string(v: any): any;
export declare function integer(v?: string): number;
export declare function integerRange(min?: number, max?: number): any;
export {};
