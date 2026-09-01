export let v1 = {
    "header": {
        "from": "string",
        "to": "string",
        "schema": "string",
        "ID": "int",
        "with": {
            "delay": "int?", // ms
            "response": "bool?"// get a response back or not
        },
    },
    "payload": {
        "*": "any"
    }
}