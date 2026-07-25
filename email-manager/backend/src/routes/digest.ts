import { Router } from "express";
import { buildDigest } from "../mail/digest";

export const digestRouter = Router();

digestRouter.get("/", (_req, res) => {
  res.json({ digest: buildDigest() });
});
