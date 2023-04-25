declare const enum State {
    START = 17,
    TRUE1 = 33,
    TRUE2 = 34,
    TRUE3 = 35,
    FALSE1 = 49,
    FALSE2 = 50,
    FALSE3 = 51,
    FALSE4 = 52,
    NULL1 = 65,
    NULL2 = 66,
    NULL3 = 67,
    NUMBER1 = 81,
    NUMBER2 = 82,
    NUMBER3 = 83,
    NUMBER4 = 84,
    NUMBER5 = 85,
    NUMBER6 = 86,
    NUMBER7 = 87,
    NUMBER8 = 88,
    STRING1 = 97,
    STRING2 = 98,
    STRING3 = 99,
    STRING4 = 100,
    STRING5 = 101,
    STRING6 = 102
}
export declare type Callbacks = {
    onString: (value: string) => void;
    onStartObject: (startCharIndex: number) => void;
    onEndObject: (lastCharIndex: number) => void;
    onStartArray: (startCharIndex: number) => void;
    onEndArray: (lastCharIndex: number) => void;
};
export declare class JSONParser {
    state: State;
    callbacks: Callbacks;
    string: string | undefined;
    unicode: string | undefined;
    constructor(callbacks: Callbacks);
    charError(buffer: Uint8Array, i: number): void;
    parse(buffer: Uint8Array): void;
    finish(): void;
}
export {};
