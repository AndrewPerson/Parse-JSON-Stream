# Parse-JSON-Stream
This library allows you to parse JSON from an incoming stream and add listeners for when certain objects are found.

# Usage
There is a single function, `parseJSONStream`. This is to be called with a single parameter, a list of lists of strings. This list represents the paths for the objects you wish to receive events for. See the example below.

# Limitations
 - Recursive paths are not supported.
 - Arrays are ignored, meaning you cannot receive events for objects in arrays.

# Example
```js
import { parseJSONStream } from './parse-json-stream.js';

const watchPaths = [
    ["token"],
    ["data", "*"]
];

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

let parser = parseJSONStream(watchPaths);

parser.onObject((path, obj) => {
    console.log(`${path.join(".")}: ${JSON.stringify(obj)}`);
});

let textEncoder = new TextEncoder();

//Split JSON into parts and pass JSON in sequentially, as if from a stream.
for (let i = 20; i < json.length; i += 20) {
    parser.write(textEncoder.encode(json.substring(i - 20, Math.min(i, json.length))));
}

parser.finish();

/* Output:
token: {"access_token":"","refresh_token":"","expires_in":0,"termination":0}
data.dailytimetable: {"date":"0000-00-00"}
data.timetable: {"subjects":[{"title":"ABC","teacher":"DEF"}]}
*/
```