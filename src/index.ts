import express, { Request, Response } from "express";
import { createReadStream } from "fs";
import { once } from "events";

import { MyDuplex } from "./streams/Duplex";

const app = express();
const counter = new MyDuplex({
    readableHighWaterMark: 2,
    writableHighWaterMark: 2,
});

(async () => {
    let chunk = counter.read();

    while (chunk != null) {
        const canWrite = counter.write(chunk);

        console.log(`Can we write bunch of data? ${canWrite}`);

        if (!canWrite) {
            await once(counter, "drain");
            console.log("drain event fired.");
        }

        chunk = counter.read();
    }
})();
// app.listen(4000, () => console.log("Server is running http://localhost:4000/"));
