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
router.get('/sessions', (req, res) => {
  const userId = req.user ? req.user.userId : null;
  const guestId = req.headers['x-guest-id'] || null;

  try {
    let sessions = [];
    if (userId) {
      sessions = db.queryAll(
        'SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC',
        [userId]
      );
    } else if (guestId) {
      sessions = db.queryAll(
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
router.post('/sessions', (req, res) => {
  const userId = req.user ? req.user.userId : null;
  const guestId = !userId ? (req.headers['x-guest-id'] || 'guest-default') : null;
  const { title } = req.body;

  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const sessionTitle = title || 'New Discussion';

  try {
    db.execute(
      'INSERT INTO chat_sessions (id, user_id, guest_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [sessionId, userId, guestId, sessionTitle]
    );

    const session = db.queryGet('SELECT * FROM chat_sessions WHERE id = ?', [sessionId]);
    res.status(201).json({ session });
  } catch (err) {
    console.error('Error creating chat session:', err);
    res.status(500).json({ error: 'Failed to create conversation session' });
  }
});

// PUT /api/chat/sessions/:id - Rename a session
router.put('/sessions/:id', (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    db.execute(
      'UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title.trim(), id]
    );

    const session = db.queryGet('SELECT * FROM chat_sessions WHERE id = ?', [id]);
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
router.delete('/sessions/:id', (req, res) => {
  const { id } = req.params;

  try {
    db.execute('DELETE FROM chat_messages WHERE session_id = ?', [id]);
    db.execute('DELETE FROM chat_sessions WHERE id = ?', [id]);
    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('Error deleting chat session:', err);
    res.status(500).json({ error: 'Failed to delete conversation session' });
  }
});

// GET /api/chat/sessions/:id/messages - Get messages for a session
router.get('/sessions/:id/messages', (req, res) => {
  const { id } = req.params;

  try {
    const messages = db.queryAll(
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

// POST /api/chat/sessions/:id/messages - Append message to session
router.post('/sessions/:id/messages', (req, res) => {
  const { id } = req.params;
  const { role, content, sources } = req.body;

  if (!content || !role) {
    return res.status(400).json({ error: 'Content and role are required' });
  }

  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const sourcesJson = sources ? JSON.stringify(sources) : null;

  try {
    db.execute(
      'INSERT INTO chat_messages (id, session_id, role, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [messageId, id, role, content, sourcesJson]
    );

    // If session title is default or first user query, auto-generate better title
    const session = db.queryGet('SELECT * FROM chat_sessions WHERE id = ?', [id]);
    if (session && (session.title === 'New Discussion' || session.title === 'New Chat') && role === 'user') {
      const generatedTitle = generateChatTitle(content);
      db.execute(
        'UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [generatedTitle, id]
      );
    } else {
      db.execute(
        'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    }

    res.status(201).json({
      message: {
        id: messageId,
        sessionId: id,
        role,
        content,
        sources: sources || [],
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Error saving chat message:', err);
    res.status(500).json({ error: 'Failed to save conversation message' });
  }
});

module.exports = router;
