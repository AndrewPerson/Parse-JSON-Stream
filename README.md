# Parse-JSON-Stream
This library allows you to parse JSON from an incoming stream and add listeners for when certain objects are found.

# Usage
There is a single function, `parseJSONStream`. This returns an object, the parser, which is then further used.

The parser has 3 functions:
1. `onStructure`: This takes a `string[]`, the path to the object/array(s) that will cause the callback to fire. It takes the callback as its 2nd argument.
2. `write`: This takes a `Uint8Array` representing the next sequential bytes of the json and writes it to the parser, which parses it and fires off the necessary callbacks.
3. `finish`: This closes the parser and finalises any parsing remaining.

# Example
```js
import { parseJSONStream } from "@andrewperson/parse-json-stream.js";

const json = `{
    "token": {
        "access_token": "",
        "refresh_token": "",
        "expires_in": 0,
        "termination": 0
    },
    "data": {
        "dailytimetable": {
            "date": "0000-00-00"
        },
        "timetable": {
            "subjects": [
                {
                    "title": "ABC",
                    "teacher": "DEF"
                }
            ]
        }
    }
}`;

let parser = parseJSONStream()
    .onStructure(["token"], (token, _) => console.log(`token: ${token}`))
    .onStructure(["data", "*"], (data, path) => console.log(`${path.join(".")}: ${data}`));

let textEncoder = new TextEncoder();

//Split JSON into parts and pass JSON in sequentially, as if from a stream.
for (let i = 20; i < json.length; i += 20) {
    parser.write(textEncoder.encode(json.substring(i - 20, Math.min(i, json.length))));
}

parser.finish();

/* Output:
token: {
        "access_token": "",
        "refresh_token": "",
        "expires_in": 0,
        "termination": 0
    }
data.dailytimetable: {
            "date": "0000-00-00"
        }
data.timetable: {
            "subjects": [
                {
                    "title": "ABC",
                    "teacher": "DEF"
                }
            ]
        }
*/
```