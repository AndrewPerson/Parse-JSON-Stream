const enum State {
    START = 0x11,
    TRUE1 = 0x21,
    TRUE2 = 0x22,
    TRUE3 = 0x23,
    FALSE1 = 0x31,
    FALSE2 = 0x32,
    FALSE3 = 0x33,
    FALSE4 = 0x34,
    NULL1 = 0x41,
    NULL2 = 0x42,
    NULL3 = 0x43,
    NUMBER1 = 0x51,
    NUMBER2 = 0x52,
    NUMBER3 = 0x53,
    NUMBER4 = 0x54,
    NUMBER5 = 0x55,
    NUMBER6 = 0x56,
    NUMBER7 = 0x57,
    NUMBER8 = 0x58,
    STRING1 = 0x61,
    STRING2 = 0x62,
    STRING3 = 0x63,
    STRING4 = 0x64,
    STRING5 = 0x65,
    STRING6 = 0x66,
}

type Callbacks = {
    onString: (value: string) => void;
    onStartObject: (i: number) => void;
    onEndObject: (i: number) => void;
}

class SaxParser {
    state = State.START;
    callbacks: Callbacks;

    // For string parsing
    string: string | undefined = undefined;
    unicode: string | undefined = undefined;

    constructor(callbacks: Callbacks) {
        this.callbacks = callbacks;
    }

    charError(buffer: Uint8Array, i: number) {
        throw new Error(`Unexpected token ${JSON.stringify(String.fromCharCode(buffer[i]))} at position ${i}`);
    };

    parse(buffer: Uint8Array) {
        var n;
        for (var i = 0, l = buffer.length; i < l; i++) {
            switch (this.state) {
                case State.START:
                    n = buffer[i];
                    switch (n) {
                        case 0x7b: // `{`
                            this.callbacks.onStartObject(i);
                            continue;
                        case 0x7d: // `}`
                            this.callbacks.onEndObject(i);
                            continue;
                        case 0x5b: // `[`
                            continue;
                        case 0x5d: // `]`
                            continue;
                        case 0x3a: // `:`
                            continue;
                        case 0x2c: // `,`
                            continue;
                        case 0x74: // `t`
                            this.state = State.TRUE1;
                            continue;
                        case 0x66: // `f`
                            this.state = State.FALSE1;
                            continue;
                        case 0x6e: // `n`
                            this.state = State.NULL1;
                            continue;
                        case 0x22: // `"`
                            this.string = "";
                            this.state = State.STRING1;
                            continue;
                        case 0x2d: // `-`
                            this.state = State.NUMBER1;
                            continue;
                        case 0x30: // `0`
                            this.state = State.NUMBER2;
                            continue;
                    }
                    if (n > 0x30 && n < 0x40) { // 1-9
                        this.state = State.NUMBER3;
                        continue;
                    }
                    if (n === 0x20 || n === 0x09 || n === 0x0a || n === 0x0d) {
                        continue; // whitespace
                    }
                    this.charError(buffer, i);
                case State.STRING1: // After open quote
                    n = buffer[i];
                    switch (n) {
                        case 0x22: // `"`
                            this.callbacks.onString(this.string!);
                            this.string = undefined;
                            this.state = State.START;
                            continue;
                        case 0x5c: // `\`
                            this.state = State.STRING2;
                            continue;
                    }
                    if (n >= 0x20) {
                        this.string += String.fromCharCode(n);
                        continue;
                    }
                    this.charError(buffer, i);
                case State.STRING2: // After backslash
                    n = buffer[i];
                    switch (n) {
                        case 0x22: this.string += "\""; this.state = State.STRING1; continue;
                        case 0x5c: this.string += "\\"; this.state = State.STRING1; continue;
                        case 0x2f: this.string += "\/"; this.state = State.STRING1; continue;
                        case 0x62: this.string += "\b"; this.state = State.STRING1; continue;
                        case 0x66: this.string += "\f"; this.state = State.STRING1; continue;
                        case 0x6e: this.string += "\n"; this.state = State.STRING1; continue;
                        case 0x72: this.string += "\r"; this.state = State.STRING1; continue;
                        case 0x74: this.string += "\t"; this.state = State.STRING1; continue;
                        case 0x75: this.unicode = ""; this.state = State.STRING3; continue;
                    }
                    this.charError(buffer, i);
                case State.STRING3: case State.STRING4: case State.STRING5: case State.STRING6: // unicode hex codes
                    n = buffer[i];
                    // 0-9 A-F a-f
                    if ((n >= 0x30 && n < 0x40) || (n > 0x40 && n <= 0x46) || (n > 0x60 && n <= 0x66)) {
                        this.unicode += String.fromCharCode(n);
                        if (this.state++ === State.STRING6) {
                            this.string += String.fromCharCode(parseInt(this.unicode!, 16));
                            this.unicode = undefined;
                            this.state = State.STRING1;
                        }
                        continue;
                    }
                    this.charError(buffer, i);
                case State.NUMBER1: // after minus
                    n = buffer[i];
                    if (n === 0x30) { // `0`
                        this.state = State.NUMBER2;
                        continue;
                    }
                    if (n > 0x30 && n < 0x40) { // `1`-`9`
                        this.state = State.NUMBER3;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.NUMBER2: // * After initial zero
                    this.finish();
                    i--; // rewind to re-check this char
                    continue;
                case State.NUMBER3: // * After digit (before period)
                    this.finish();
                    i--; // rewind to re-check
                    continue;
                case State.NUMBER4: // After period
                    n = buffer[i];
                    if (n >= 0x30 && n < 0x40) { // 0-9
                        this.state = State.NUMBER5;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.NUMBER5: // * After digit (after period)
                    n = buffer[i];
                    if (n >= 0x30 && n < 0x40) { // 0-9
                        continue;
                    }
                    if (n === 0x65 || n === 0x45) { // E/e
                        this.state = State.NUMBER6;
                        continue;
                    }
                    this.finish();
                    i--; // rewind
                    continue;
                case State.NUMBER6: // After E
                    n = buffer[i];
                    if (n === 0x2b || n === 0x2d) { // +/-
                        this.state = State.NUMBER7;
                        continue;
                    }
                    if (n >= 0x30 && n < 0x40) {
                        this.state = State.NUMBER8;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.NUMBER7: // After +/-
                    n = buffer[i];
                    if (n >= 0x30 && n < 0x40) { // 0-9
                        this.state = State.NUMBER8;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.NUMBER8: // * After digit (after +/-)
                    n = buffer[i];
                    if (n >= 0x30 && n < 0x40) { // 0-9
                        continue;
                    }
                    this.finish();
                    i--;
                    continue;
                case State.TRUE1: // r
                    if (buffer[i] === 0x72) {
                        this.state = State.TRUE2;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.TRUE2: // u
                    if (buffer[i] === 0x75) {
                        this.state = State.TRUE3;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.TRUE3: // e
                    if (buffer[i] === 0x65) {
                        this.state = State.START;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.FALSE1: // a
                    if (buffer[i] === 0x61) {
                        this.state = State.FALSE2;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.FALSE2: // l
                    if (buffer[i] === 0x6c) {
                        this.state = State.FALSE3;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.FALSE3: // s
                    if (buffer[i] === 0x73) {
                        this.state = State.FALSE4;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.FALSE4: // e
                    if (buffer[i] === 0x65) {
                        this.state = State.START;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.NULL1: // u
                    if (buffer[i] === 0x75) {
                        this.state = State.NULL2;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.NULL2: // l
                    if (buffer[i] === 0x6c) {
                        this.state = State.NULL3;
                        continue;
                    }
                    this.charError(buffer, i);
                case State.NULL3: // l
                    if (buffer[i] === 0x6c) {
                        this.state = State.START;
                        continue;
                    }
                    this.charError(buffer, i);
            }
        }
    };
    
    finish() {
        switch (this.state) {
            case State.NUMBER2: // * After initial zero
                this.state = State.START;
                break;
            case State.NUMBER3: // * After digit (before period)
                this.state = State.START;
                break;
            case State.NUMBER5: // * After digit (after period)
                this.state = State.START;
                break;
            case State.NUMBER8: // * After digit (after +/-)
                this.state = State.START;
                break;
        }

        if (this.state !== State.START) {
            throw new Error("Unexpected end of input stream");
        }
    }
}

export function parseJSONStream(objectPaths: string[][]) {
    const textDecoder = new TextDecoder();
    let totalBuffer = new Uint8Array(0);
    let indexOffset = 0;

    let objectCallbacks: ((path: string[], value: any) => void)[] = [];

    let path: string[] = [];
    let objectStarts: number[] = [];
    let possiblePathName: string | null = null;

    var p = new SaxParser({
        onString: function (value: string) {
            possiblePathName = value;
        },
        onStartObject: function (i: number) {
            if (possiblePathName !== null) {
                path.push(possiblePathName);
                objectStarts.push(i + indexOffset);
            }
        },
        onEndObject: function (index: number) {
            for (let possiblePath of objectPaths) {
                if (path.length == possiblePath.length) {
                    for (let i = 0; i < path.length; i++) {
                        if (path[i] != possiblePath[i] && possiblePath[i] != "*") {
                            return;
                        }
                    }

                    let object = JSON.parse(textDecoder.decode(totalBuffer.subarray(objectStarts[objectStarts.length - 1], index + 1 + indexOffset)));

                    objectCallbacks.forEach(callback => callback(path, object));
                }
            }
            
            path.pop();
            objectStarts.pop();
        }
    });

    return {
        write(buffer: Uint8Array) {
            indexOffset = totalBuffer.length;

            let newTotalBuffer = new Uint8Array(totalBuffer.length + buffer.length);
            newTotalBuffer.set(totalBuffer);
            newTotalBuffer.set(buffer, totalBuffer.length);
            totalBuffer = newTotalBuffer;

            p.parse(buffer);
        },
        finish() {
            totalBuffer = new Uint8Array(0);
            p.finish();
        },
        onObject(callback: (path: string[], value: any) => void) {
            objectCallbacks.push(callback);
        }
    };
}
