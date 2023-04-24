import { Writable, WritableOptions } from "stream";

export class MyWritable extends Writable {
    constructor(opt: WritableOptions) {
        super(opt);
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
