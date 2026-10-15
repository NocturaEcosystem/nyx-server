/*
pkg format 

    {
        "header": {
            "from": "app_name"
            "to": "app_name"
            "ID": "request number"
            "schema": "V-1.0"
            "with": ANY from {
                "delay": "10", // ms
                "response": true/false // get a response back or not
            }
        }
        "payload": {
            ...
        }
    }

*/
import { WebSocket } from "ws"


enum ignore {
    False,
    True
}

export class nyx_client {
    name: string
    version: number
    webserver: WebSocket
    private receive?: (message: unknown) => void
    connection: Promise<void>
    req_key: number

    constructor(name: string) {
        this.name = name
        this.version = 1
        this.webserver = new WebSocket("ws://localhost:1212");
        this.req_key = 1
        
        
        this.webserver.on("message", (message) => {
            this.receive?.(message)
        })

        this.connection = new Promise((resolve, reject) => {
            this.webserver.onopen = () => resolve()
            this.webserver.onerror = () => reject(new Error("WebSocket connection failed"))
        })
    }

    async send(toWhom: string, payload: unknown, with_delay: Number | ignore=ignore.True, with_response: boolean | ignore=ignore.True) {
        this.req_key += 1
        let withs: any = {}
        if (with_delay != ignore.False ){
            withs.delay = with_delay
        }
        if (with_response != ignore.False) {
            withs.response = with_response
        }
        let message = {
            "header": {
                "from": this.name,
                "to": toWhom,
                "ID": this.req_key,
                "schema": this.version,
                "with": withs
            },
            "payload": payload
        }
        await this.connection
        this.webserver.send(JSON.stringify(message))
    }
}

export type PrimitivePattern =
  | "any"
  | "string"
  | "number"
  | "int"
  | "boolean"
  | "null"
  | `${"any" | "string" | "number" | "int" | "boolean" | "null"}?`;

export type Pattern =
  | PrimitivePattern
  | { [key: string]: Pattern };

// Validate a value against a runtime pattern.
export function pattern(
  value: unknown,
  schema: Pattern,
): boolean {
  // Primitive patterns
  if (typeof schema === "string") {
    const optional = schema.endsWith("?");
    const type = optional ? schema.slice(0, -1) : schema;

    if (optional && value === undefined) {
      return true;
    }

    switch (type) {
      case "any":
        return true;

      case "string":
        return typeof value === "string";

      case "number":
        return typeof value === "number" &&
          Number.isFinite(value);

      case "int":
        return typeof value === "number" &&
          Number.isSafeInteger(value);

      case "boolean":
        return typeof value === "boolean";

      case "null":
        return value === null;

      default:
        return false;
    }
  }

  // Reject invalid schema objects and arrays.
  if (
    typeof schema !== "object" ||
    schema === null ||
    Array.isArray(schema)
  ) {
    return false;
  }

  // This validator expects object values, not arrays or null.
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const valueRecord = value as Record<string, unknown>;
  const schemaRecord = schema as Record<string, Pattern>;

  const schemaKeys = Object.keys(schemaRecord);
  const valueKeys = Object.keys(valueRecord);

  // Wildcard: validate every value against the wildcard pattern.
  if (Object.hasOwn(schemaRecord, "*")) {
    const wildcard = schemaRecord["*"];

    if (wildcard === undefined) {
      return false;
    }

    return valueKeys.every((key) =>
      pattern(valueRecord[key], wildcard)
    );
  }

  // Reject unexpected properties.
  for (const key of valueKeys) {
    if (!Object.hasOwn(schemaRecord, key)) {
      return false;
    }
  }

  // Validate required and optional properties.
  for (const key of schemaKeys) {
    const rule = schemaRecord[key];

    if (rule === undefined) {
      return false;
    }

    const exists = Object.hasOwn(valueRecord, key);

    if (!exists) {
      if (typeof rule === "string" && rule.endsWith("?")) {
        continue;
      }

      return false;
    }

    if (!pattern(valueRecord[key], rule)) {
      return false;
    }
  }

  return true;
}

// Lepus protocol schema
export const v1 = {
  header: {
    from: "string",
    to: "string",
    schema: "int",
    ID: "int",
    with: {
      delay: "int?",
      response: "int?",
    },
  },
  payload: {
    "*": "any",
  },
} as const satisfies Pattern;
