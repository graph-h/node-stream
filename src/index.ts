import express, { Request, Response } from "express";
import { createReadStream } from "fs";
import { ReadableOptions } from "stream";
import { Readable } from "stream";
const app = express();

class Counter extends Readable {
    _max: number;
    _index: number;
    constructor(opt: ReadableOptions) {
        super(opt);
        this._max = 1000;
        this._index = 0;
    }

    _read(size: number): void {
        this._index += 1;

        if (this._index > this._max) {
            this.push(null);
        } else {
            const buf = Buffer.from(`${this._index}`, "utf-8");

            console.log(
                `Added: ${this._index}. Cound be added`,
                this.push(buf)
            );
        }
    }
}

const counter = new Counter({ highWaterMark: 2 });

counter.on("data", (chunk) => {
    console.log(`Recived: ${chunk.toString()}`);
});

// app.get("/video", (req: Request, res: Response) => {
//     const stream = createReadStream("video.mp4");

//     res.contentType("video/mp4");

//     stream.pipe(res);
// });

// app.listen(4000, () => console.log("Server is running http://localhost:4000/"));
