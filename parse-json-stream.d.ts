export declare type JSONStreamParser = {
    onStructure(path: string[], callback: (value: string, path: string[]) => void | Promise<void>): JSONStreamParser;
    write(buffer: Uint8Array): void;
    finish(): void;
};
export declare function parseJSONStream(): JSONStreamParser;
