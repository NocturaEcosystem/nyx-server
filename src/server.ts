import { WebSocketServer, WebSocket } from "ws"
import { pattern } from "./utils/pkgs.ts"
import { v1 } from "./utils/formats.ts"
const ws = new WebSocketServer( {
    port: 1212,          // 12 = n, 1 = y, 2 = x 😜
} )

let connections = new Map<string, WebSocket>()    // all connections would be stored here

ws.on("connection", (connection) => {
    console.log("NEW CONNECTION")
    let verified = false
    connection.on("message", (buff) => {
        if (!verified) {
            let data = JSON.parse(buff.toString("utf-8"))
            if (!data.name) {
                return 1
            }
            verified = true
            connections.set(data.name, connection)
        }
        /* message format at pkgs.ts */

        // We are checking if the message matches the format

        let data = JSON.parse(buff.toString("utf-8"))
        if (!data?.head?.version) {
            return 1;
        }
        let fits = false;
        switch (data.head.version) {
            case "V-1.0": {
                fits = pattern(data, v1);
            }
        }
        if (!fits) {
            return 1;
        }

        let receiver = connections.get(data.head.to)
        if (!receiver) {
            return 1;
        }

        receiver.send(JSON.stringify(data))

    })
})