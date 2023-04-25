import { Transform, TransformCallback, TransformOptions } from "stream";

export class MyTransform extends Transform {
    constructor(opt: TransformOptions) {
        super(opt);
    }

    _transform(
        chunk: any,
        encoding: BufferEncoding,
        callback: TransformCallback
    ): void {
        const resultString = `*${chunk.toString("utf-8")}*`;

        callback(null, resultString);
    }
}
