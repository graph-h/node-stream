import express, { Request, Response } from "express";
import { createReadStream } from "fs";
import { once } from "events";

import { Counter as MyReadable } from "./streams/Readable";
import { MyWritable } from "./streams/Writable";
import { MyTransform } from "./streams/Transform";

const counterReader = new MyReadable({ highWaterMark: 2 });
const counterWriter = new MyWritable({ highWaterMark: 2 });
const counterTransform = new MyTransform({ highWaterMark: 2 });

counterReader.pipe(counterTransform).pipe(counterWriter);

// app.listen(4000, () => console.log("Server is running http://localhost:4000/"));
