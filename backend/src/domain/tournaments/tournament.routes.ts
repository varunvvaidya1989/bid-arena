import express from "express";
import { authorize } from "../../auth/auth.middleware";
import * as tournamentService from "./tournament.service";
import * as playerService from "../players/player.service";
import { auctionEngine } from "../auctions/auction.engine";
import { listPlayers } from "../players/player.service";

const router = express.Router();

router.get(
  "/tournaments",
  authorize(["ADMIN", "VIEWER"]),
  async (req, res) => {
    try {
      const items = await tournamentService.listTournaments();
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/tournaments",
  authorize(["ADMIN"]),
  async (req, res) => {
    try {
      const { name, auctionConfig } = req.body;
      if (!name || !auctionConfig) return res.status(400).json({ error: "name and auctionConfig required" });
      const t = await tournamentService.createTournament({ name, auctionConfig });
      res.status(201).json(t);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.delete(
  "/tournaments/:tournamentId",
  authorize(["ADMIN"]),
  async (req, res) => {
    try {
      const { tournamentId } = req.params;
      await tournamentService.deleteTournament(tournamentId);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ROUTE FOR REGISTRATION OF A PLAYER TO A TOURNAMENT
router.post(
  "/tournaments/:tournamentId/register",
  authorize(["ADMIN"]),
  async (req, res) => {
    try {
      const { tournamentId } = req.params;
      const { userId, name, teamId } = req.body;
      if (!userId || !name) return res.status(400).json({ error: "userId and name required" });
      const p = await playerService.registerPlayer(tournamentId, { userId, name, teamId });
      res.status(200).json(p);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Start an auction for a tournament (optionally with a specific player to auction first)
router.post(
  "/tournaments/:tournamentId/start",
  authorize(["ADMIN"]),
  async (req, res) => {
    try {
      const { tournamentId } = req.params;
      const { playerId } = req.body;
      const t = await tournamentService.getTournament(tournamentId);
      if (!t) return res.status(404).json({ error: "Tournament not found" });
      const players = await listPlayers(tournamentId);
      const result = auctionEngine.startAuction(t, players, playerId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Place a bid for the active player in a tournament
router.post(
  "/tournaments/:tournamentId/bid",
  authorize(["ADMIN"]),
  async (req, res) => {
    try {
      const { tournamentId } = req.params;
      const { teamId, amount } = req.body;
      if (!teamId || typeof amount !== 'number') return res.status(400).json({ error: "teamId and numeric amount required" });
      const result = auctionEngine.placeBid(tournamentId, teamId, amount);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.post(
  "/tournaments/:tournamentId/finalize",
  authorize(["ADMIN"]),
  async (req, res) => {
    try {
      const { tournamentId } = req.params;
      const state = auctionEngine.getState(tournamentId);
      if (!state) return res.status(400).json({ error: 'Auction not running' });

      // persist assignments to DB
      for (const playerId of Object.keys(state.assignments)) {
        const a = state.assignments[playerId];
        await tournamentService.saveAssignment(tournamentId, playerId, a.teamId, a.price);
      }

      await tournamentService.updateTournamentStatus(tournamentId, 'CLOSED');
      try { const io = require('../../socket').getIO(); io.emit('auction:finalize', { tournamentId }); } catch(e) {}
      res.status(200).json({ message: 'Auction finalized' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
