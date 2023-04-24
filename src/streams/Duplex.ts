import { Duplex, DuplexOptions } from "stream";

export class MyDuplex extends Duplex {
    _index: number;
    _max: number;
    constructor(opt: DuplexOptions) {
        super(opt);

        this._max = 1000;
        this._index = 1;
    }

    _read(): void {
        this._index += 1;

        if (this._index > this._max) {
            this.push(null);
        } else {
            const buf = Buffer.from(`${this._index}`, "utf-8");
        }
    }

    _write(
        chunk: any,
        encoding: BufferEncoding,
        callback: (error?: Error | null | undefined) => void
    ): void {
        console.log(chunk.toString());

        callback();
    }
}
