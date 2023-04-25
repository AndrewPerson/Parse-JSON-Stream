export declare function parseJSONStream(): {
    write(buffer: Uint8Array): void;
    finish(): void;
    /**
     * A "structure" is an array or an object
     */
    onStructure(path: string[], callback: (value: string, path: string[]) => void): any;
};
