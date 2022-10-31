export declare function parseJSONStream(objectPaths: string[][]): {
    write(buffer: Uint8Array): void;
    finish(): void;
    onObject(callback: (path: string[], value: any) => void): void;
};
