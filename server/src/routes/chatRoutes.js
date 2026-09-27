const express = require('express');
const router = express.Router();
const db = require('../db/db.js');

// Helper to generate readable short titles from questions
function generateChatTitle(query) {
  if (!query) return 'New Discussion';
  let cleaned = query.replace(/[?.,!]/g, '').trim();
  const words = cleaned.split(/\s+/);
  if (words.length <= 5) {
    return words.join(' ');
  }
  return words.slice(0, 5).join(' ') + '...';
}

// GET /api/chat/sessions - Get user's conversation sessions
router.get('/sessions', async (req, res) => {
  const userId = req.user ? req.user.userId : null;
  const guestId = req.headers['x-guest-id'] || null;

  try {
    let sessions = [];
    if (userId) {
      sessions = await db.queryAll(
        'SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC',
        [userId]
      );
    } else if (guestId) {
      sessions = await db.queryAll(
        'SELECT * FROM chat_sessions WHERE guest_id = ? ORDER BY updated_at DESC',
        [guestId]
      );
    }
    res.json({ sessions });
  } catch (err) {
    console.error('Error fetching chat sessions:', err);
    res.status(500).json({ error: 'Failed to fetch conversation sessions' });
  }
});

// POST /api/chat/sessions - Create new chat session
router.post('/sessions', async (req, res) => {
  const userId = req.user ? req.user.userId : null;
  const guestId = !userId ? (req.headers['x-guest-id'] || 'guest-default') : null;
  const { title } = req.body;

  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const sessionTitle = title || 'New Discussion';

  try {
    await db.execute(
      'INSERT INTO chat_sessions (id, user_id, guest_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [sessionId, userId, guestId, sessionTitle]
    );

    const session = await db.queryGet('SELECT * FROM chat_sessions WHERE id = ?', [sessionId]);
    res.status(201).json({ session });
  } catch (err) {
    console.error('Error creating chat session:', err);
    res.status(500).json({ error: 'Failed to create conversation session' });
  }
});

// GET /api/chat/sessions/:id - Get a single session with its messages
router.get('/sessions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const session = await db.queryGet('SELECT * FROM chat_sessions WHERE id = ?', [id]);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const rawMessages = await db.queryAll(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [id]
    );

    const messages = rawMessages.map(m => ({
      id: m.id,
      sessionId: m.session_id,
      role: m.role,
      content: m.content,
      sources: m.sources_json ? JSON.parse(m.sources_json) : [],
      createdAt: m.created_at
    }));

    res.json({ session, messages });
  } catch (err) {
    console.error('Error fetching chat session:', err);
    res.status(500).json({ error: 'Failed to fetch conversation session' });
  }
});

// PUT /api/chat/sessions/:id - Rename a session
router.put('/sessions/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    await db.execute(
      'UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title.trim(), id]
    );

    const session = await db.queryGet('SELECT * FROM chat_sessions WHERE id = ?', [id]);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ session });
  } catch (err) {
    console.error('Error renaming chat session:', err);
    res.status(500).json({ error: 'Failed to rename conversation session' });
  }
});

// DELETE /api/chat/sessions/:id - Delete a session and its messages
router.delete('/sessions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute('DELETE FROM chat_messages WHERE session_id = ?', [id]);
    await db.execute('DELETE FROM chat_sessions WHERE id = ?', [id]);
    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('Error deleting chat session:', err);
    res.status(500).json({ error: 'Failed to delete conversation session' });
  }
});

// GET /api/chat/sessions/:id/messages - Get messages for a session
router.get('/sessions/:id/messages', async (req, res) => {
  const { id } = req.params;

  try {
    const messages = await db.queryAll(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [id]
    );

    // Parse sources_json if present
    const parsed = messages.map(m => ({
      id: m.id,
      sessionId: m.session_id,
      role: m.role,
      content: m.content,
      sources: m.sources_json ? JSON.parse(m.sources_json) : [],
      createdAt: m.created_at
    }));

    res.json({ messages: parsed });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ error: 'Failed to fetch conversation messages' });
  }
});

const { answerQueryAsync, searchChunks } = require('../services/ragService.js');

// POST /api/chat/sessions/:id/messages - Append message to session
router.post('/sessions/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { role, content, sources, generateReply = false } = req.body;

  if (!content || !role) {
    return res.status(400).json({ error: 'Content and role are required' });
  }

  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const sourcesJson = sources ? JSON.stringify(sources) : null;

  try {
    await db.execute(
      'INSERT INTO chat_messages (id, session_id, role, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [messageId, id, role, content, sourcesJson]
    );

    // If session title is default or first user query, auto-generate better title
    const session = await db.queryGet('SELECT * FROM chat_sessions WHERE id = ?', [id]);
    if (session && (session.title === 'New Discussion' || session.title === 'New Chat') && role === 'user') {
      const generatedTitle = generateChatTitle(content);
      await db.execute(
        'UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [generatedTitle, id]
      );
    } else {
      await db.execute(
        'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    }

    const savedMessage = {
      id: messageId,
      sessionId: id,
      role,
      content,
      sources: sources || [],
      createdAt: new Date().toISOString()
    };

    // If autoReply requested for user message, synthesize research-grade assistant response with session history
    let assistantMessage = null;
    if (role === 'user' && generateReply) {
      try {
        // Fetch recent session history for context-aware follow-up resolution
        const priorMessages = await db.queryAll(
          'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
          [id]
        );

        const ragResult = await answerQueryAsync(db, content, {
          topK: 5,
          history: priorMessages
        });

        const replyText = ragResult.answer;
        const replySources = ragResult.sources || [];

        const replyMsgId = `msg-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await db.execute(
          'INSERT INTO chat_messages (id, session_id, role, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
          [replyMsgId, id, 'assistant', replyText, JSON.stringify(replySources)]
        );

        assistantMessage = {
          id: replyMsgId,
          sessionId: id,
          role: 'assistant',
          content: replyText,
          sources: replySources,
          createdAt: new Date().toISOString()
        };
      } catch (replyErr) {
        console.warn('Chat autoReply note:', replyErr.message);
      }
    }


    res.status(201).json({
      message: savedMessage,
      reply: assistantMessage
    });
  } catch (err) {
    console.error('Error saving chat message:', err);
    res.status(500).json({ error: 'Failed to save conversation message' });
  }
});

module.exports = router;
