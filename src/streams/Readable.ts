import { Readable, ReadableOptions } from "stream";

export class Counter extends Readable {
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
