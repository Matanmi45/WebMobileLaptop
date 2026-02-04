import express from 'express';
import { checkHealth } from '../controllers/health.controller.ts';

const router = express.Router();

router.get('/', checkHealth);

export default router;