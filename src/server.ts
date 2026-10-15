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
    connection.on("message", async(buff) => {
        if (!verified) {
            let data = JSON.parse(buff.toString("utf-8"))
            console.log(data)
            if (!data.name) {
                return 1
            }
            verified = true
            connections.set(data.name, connection)
            console.log(`NEW CONNECTION with name ${data.name}`)
            return 0
        }
        /* message format at pkgs.ts */

        // We are checking if the message matches the format
        let data = JSON.parse(buff.toString("utf-8"))
        console.log(data)
        if (!data?.header?.schema) {
            console.log("version")
            return 1;
        }
        let fits = false;
        console.log(data)
        console.log(v1)
        switch (data?.header?.schema) {
            case 1: {
                fits = pattern(data, v1);
                console.log(fits)
                break;
            }
            default:
                console.log("default")
        }
        if (!fits) {
            console.log("fits")
            return 1;
        }
        let receiver = connections.get(data.header.to)

        for (let i: number = 0; i < 10; i++) {
            if (!receiver) {
                console.log("rcv")
                await new Promise(resolve => setTimeout(resolve, 2000))
                receiver = connections.get(data.header.to)
                const firstString = connections.keys().next().value;
                console.log(firstString)
            } else {
                break;
            }
        }

        if (!receiver){
            return 1
        }

        receiver.send(JSON.stringify(data))

    })
})