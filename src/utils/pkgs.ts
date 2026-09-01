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

export function pattern(obj: unknown, p: unknown): boolean {
  if (typeof p === "string") {
    const optional = p.endsWith("?")
    const type = optional ? p.slice(0, -1) : p
    if (optional && obj === undefined) return true

    switch (type) {
      case "any":
        return true

      case "int":
        return typeof obj === "number" && Number.isInteger(obj)

      case "string":
        return typeof obj === "string"

      case "number":
        return typeof obj === "number"

      case "boolean":
        return typeof obj === "boolean"

      default:
        return false
    }
  }

  if (typeof p === "object" && p !== null) {
    if (typeof obj !== "object" || obj === null) {
      return false
    }
    const objRecord = obj as Record<string, unknown>
    const patternRecord = p as Record<string, unknown>
    if ("*" in patternRecord && patternRecord["*"] === "any") {   // * = any  property
      return true
    }
    const objKeys = Object.keys(objRecord)
    const patternKeys = Object.keys(patternRecord)
    if (objKeys.length !== patternKeys.length) {
      return false
    }
    for (const key of patternKeys) {
      if (!(key in objRecord)) {
        const value = patternRecord[key]
        if (typeof value === "string" && value.endsWith("?")) {
          continue;
        }
        return false
      }
      if (!pattern(objRecord[key], patternRecord[key])) {
        return false
      }
    }
    return true
  }
  return obj === p
}