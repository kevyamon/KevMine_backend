import express from 'express';
import { getLogs, clearLogs } from '../controllers/logController.js';
import { adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(adminProtect, getLogs).delete(adminProtect, clearLogs);

export default router;