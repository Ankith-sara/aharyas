import express from 'express';
import fetch from 'node-fetch';
import logger from '../config/logger.js';
import { publicLimiter } from '../middlewares/rateLimiter.js';
import { validateChat } from '../middlewares/validate.js';

const chatRouter = express.Router();

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

chatRouter.post('/chat', publicLimiter, validateChat, async (req, res) => {
    const { messages, max_tokens = 512, temperature = 0.7 } = req.body;

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ success: false, message: 'Chat service is not configured.' });
    }

    try {
        const groqRes = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens, temperature })
        });

        const data = await groqRes.json();

        if (!groqRes.ok) {
            logger.error('Groq API error:', data);
            return res.status(502).json({ success: false, message: 'Chat service temporarily unavailable.' });
        }

        res.json({ success: true, content: data.choices?.[0]?.message?.content || '' });
    } catch (err) {
        logger.error('Chat proxy error:', err);
        res.status(500).json({ success: false, message: 'Failed to reach chat service.' });
    }
});

export default chatRouter;