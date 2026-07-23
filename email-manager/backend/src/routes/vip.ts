import { Router } from "express";
import { addVip, listVips, removeVip } from "../mail/repository";

export const vipRouter = Router();

vipRouter.get("/", (_req, res) => {
  res.json({ vips: listVips() });
});

vipRouter.post("/", (req, res) => {
  const { address, label } = req.body ?? {};
  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "address required" });
  }
  addVip(address, typeof label === "string" ? label : "");
  res.json({ vips: listVips() });
});

vipRouter.delete("/:address", (req, res) => {
  removeVip(req.params.address);
  res.json({ vips: listVips() });
});
