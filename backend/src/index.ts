import "dotenv/config";
import express from "express";
import { sharesRouter } from "./routes/shares";

const app = express();
app.use(express.json());
app.use("/shares", sharesRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Alongside API listening on :${port}`));
