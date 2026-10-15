import type { Pattern } from "./pkgs.ts";

export let v1 = {
    "header": {
        "from": "string",
        "to": "string",
        "schema": "int",
        "ID": "int",
        "with": {
            "delay": "int?", // ms
            "response": "int?"// get a response back or not, int since true: 1, false: 0
        },
    },
    "payload": {
        "*": "any"
    }
} as const satisfies Pattern;