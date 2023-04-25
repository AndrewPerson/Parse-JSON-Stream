import { JSONParser } from "./parser";

type Structure = {
    type: "object" | "array",
    start: number,
    name: string | null
};

type Array = Structure & {
    type: "array",
    currentIndex: number
}

type Object = Structure & {
    type: "object",
};

export function parseJSONStream() {
    const textDecoder = new TextDecoder();
    let totalBuffer = new Uint8Array(0);
    let indexOffset = 0;

    let structureCallbacks = new Map<string[], ((value: string, path: string[]) => void)[]>();

    let structures: (Array | Object)[] = [];
    let possiblePathName: string | null = null;

    function onStartStructure(type: "object" | "array") {
        return (startCharIndex: number) => {
            const prevStructure = structures[structures.length - 1] as Array | Object | undefined;
            if (prevStructure?.type == "array") {
                structures.push({
                    type,
                    start: startCharIndex + indexOffset,
                    name: (prevStructure.currentIndex++).toString(),
                    currentIndex: 0
                });
            }
            else if (possiblePathName != null) {
                structures.push({
                    type,
                    start: startCharIndex + indexOffset,
                    name: possiblePathName,
                    currentIndex: 0
                });
            }
        };
    }

    function onEndStructure(lastCharIndex: number) {
        const path = structures.map(structure => structure.name).filter(name => name != null) as string[];

        for (let possiblePath of structureCallbacks.keys()) {
            if (path.length == possiblePath.length) {
                for (let i = 0; i < path.length; i++) {
                    if (path[i] != possiblePath[i] && possiblePath[i] != "*") {
                        break;
                    }
                }

                let structure = textDecoder.decode(totalBuffer.subarray(structures[structures.length - 1].start, lastCharIndex + 1 + indexOffset));

                structureCallbacks.get(possiblePath)!.forEach(callback => callback(structure, path));
            }
        }

        structures.pop();
    }

    var parser = new JSONParser({
        onString: value => possiblePathName = value,
        onStartObject: onStartStructure("object"),
        onEndObject: onEndStructure,
        onStartArray: onStartStructure("array"),
        onEndArray: onEndStructure
    });

    return {
        write(buffer: Uint8Array) {
            indexOffset = totalBuffer.length;

            let newTotalBuffer = new Uint8Array(totalBuffer.length + buffer.length);
            newTotalBuffer.set(totalBuffer);
            newTotalBuffer.set(buffer, totalBuffer.length);
            totalBuffer = newTotalBuffer;

            parser.parse(buffer);
        },
        finish() {
            totalBuffer = new Uint8Array(0);
            parser.finish();
        },
        /**
         * A "structure" is an array or an object
         */
        onStructure(path: string[], callback: (value: string, path: string[]) => void) {
            if (structureCallbacks.has(path)) {
                structureCallbacks.get(path)!.push(callback);
            }
            else {
                structureCallbacks.set(path, [callback]);
            }

            return this;
        }
    };
}
