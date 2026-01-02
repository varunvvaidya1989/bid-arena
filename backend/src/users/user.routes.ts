import express from "express";
import { authorize } from "../auth/auth.middleware";
import {
  createUser,
  deleteUser,
  listUsers
} from "./user.service";

const router = express.Router();

/**
 * CREATE USER
 * POST /api/admin/users
 */
router.post(
  "/users",
  authorize(["ADMIN", "AUCTION_OWNER"]),
  async (req, res) => {
    const result = await createUser(req.body);
    res.status(201).json(result);
  }
);

/**
 * DELETE USER
 * DELETE /api/admin/users/:userId?auctionId=MC_2026
 */
router.delete(
  "/users/:userId",
  authorize(["ADMIN", "AUCTION_OWNER"]),
  async (req, res) => {
    const { userId } = req.params;
    const { auctionId } = req.query;

    if (!auctionId) {
      return res.status(400).json({ message: "auctionId required" });
    }

    await deleteUser(userId, auctionId as string);
    res.status(204).send();
  }
);

/**
 * LIST USERS
 * GET /api/admin/users?auctionId=MC_2026
 */
router.get(
  "/users",
  authorize(["ADMIN", "AUCTION_OWNER"]),
  async (req, res) => {
    const { auctionId } = req.query;

    if (!auctionId) {
      return res.status(400).json({ message: "auctionId required" });
    }

    const users = await listUsers(auctionId as string);
    res.json(users);
  }
);

export default router;
