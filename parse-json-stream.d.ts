export declare function parseJSONStream(): {
    write(buffer: Uint8Array): any;
    finish(): void;
    /**
     * A "structure" is an array or an object
     */
    onStructure(path: string[], callback: (value: string, path: string[]) => void): any;
};
