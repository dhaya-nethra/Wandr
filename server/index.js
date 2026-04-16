const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { loadData, saveData } = require('./db');

const DEFAULT_PORT = process.env.PORT || 3001;
const GOV_MASTER_KEY = process.env.GOV_MASTER_KEY || 'NATPAC-KERALA-GOV-2026-';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'NATPAC-ADMIN-KEY';

const DEMO_ADMINS = {
  natpac_admin: {
    password: 'NATPAC@Kerala2024',
    role: 'ADMIN',
  },
  natpac_scientist: {
    password: 'Science@Kerala24',
    role: 'SCIENTIST',
  },
};

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function createApp(options = {}) {
  const { webDir } = options;
  const app = express();

  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:8080',
             'http://localhost:8081', 'http://localhost:3000',
             'https://localhost:8081'],
    credentials: true,
  }));
  app.use(express.json({ limit: '2mb' }));

  function isAdminAuthorized(req) {
    return req.headers['x-admin-key'] === ADMIN_API_KEY;
  }

  function appendAuditEntry(data, params) {
    const prevHash = data.auditLog.length > 0
      ? data.auditLog[data.auditLog.length - 1].chainHash
      : '0'.repeat(64);

    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      adminId: params.adminId,
      role: params.role,
      action: params.action,
      details: params.details || '',
    };

    const chainInput = `${prevHash}|${entry.id}|${entry.timestamp}|${entry.adminId}|${entry.action}|`;
    const chainHash = sha256(chainInput);

    data.auditLog.push({ ...entry, chainHash });
    if (data.auditLog.length > 500) {
      data.auditLog = data.auditLog.slice(-500);
    }
  }

  function verifyAdminCredentials(data, username, password) {
    const builtIn = DEMO_ADMINS[username];
    if (builtIn && builtIn.password === password) {
      return { ok: true, role: builtIn.role };
    }

    const stored = data.adminUsers.find((user) => user.username === username);
    if (stored && stored.password === password) {
      return { ok: true, role: stored.role || 'ADMIN' };
    }

    return { ok: false };
  }

  app.post('/api/sync', (req, res) => {
    const { participantId, trips } = req.body;
    if (!participantId || !Array.isArray(trips)) {
      return res.status(400).json({ error: 'participantId and trips array are required' });
    }

    try {
      const hashedId = sha256(participantId);
      const alias = participantId.slice(0, 2).toUpperCase() + hashedId.slice(0, 4).toUpperCase();
      const data = loadData();

      data.participants[hashedId] = {
        id: hashedId,
        alias,
        createdAt: data.participants[hashedId]?.createdAt ?? new Date().toISOString(),
      };

      const existing = data.trips[hashedId] ?? [];
      const map = Object.fromEntries(existing.map((trip) => [trip.id, trip]));
      for (const trip of trips) {
        map[trip.id] = { ...trip, syncedAt: new Date().toISOString() };
      }
      data.trips[hashedId] = Object.values(map);

      saveData(data);
      return res.json({ success: true, synced: trips.length });
    } catch (error) {
      console.error('Sync error:', error);
      return res.status(500).json({ error: 'Sync failed', detail: error.message });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const { username, password, govKey } = req.body || {};

    if (!username || !password || !govKey) {
      return res.status(400).json({ error: 'username, password and govKey are required' });
    }

    const data = loadData();
    const cred = verifyAdminCredentials(data, username, password);

    if (govKey !== GOV_MASTER_KEY || !cred.ok) {
      appendAuditEntry(data, {
        adminId: sha256(username),
        role: 'UNKNOWN',
        action: 'FAILED_LOGIN',
        details: govKey !== GOV_MASTER_KEY ? 'Invalid government key' : 'Wrong username/password',
      });
      saveData(data);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    appendAuditEntry(data, {
      adminId: sha256(username),
      role: cred.role,
      action: 'ADMIN_LOGIN',
      details: 'Successful login',
    });
    saveData(data);

    return res.json({
      success: true,
      role: cred.role,
      adminApiKey: ADMIN_API_KEY,
    });
  });

  app.get('/api/trips/:participantId', (req, res) => {
    try {
      const hashedId = sha256(req.params.participantId);
      const data = loadData();
      return res.json({ trips: data.trips[hashedId] ?? [] });
    } catch (error) {
      console.error('Get trips error:', error);
      return res.status(500).json({ error: 'Failed to retrieve trips' });
    }
  });

  app.delete('/api/trips/:participantId/:tripId', (req, res) => {
    try {
      const hashedId = sha256(req.params.participantId);
      const { tripId } = req.params;
      const data = loadData();
      const before = (data.trips[hashedId] ?? []).length;
      data.trips[hashedId] = (data.trips[hashedId] ?? []).filter((trip) => trip.id !== tripId);
      if (data.trips[hashedId].length === before) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      saveData(data);
      return res.json({ success: true });
    } catch (error) {
      console.error('Delete trip error:', error);
      return res.status(500).json({ error: 'Failed to delete trip' });
    }
  });

  app.get('/api/admin/participants', (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const data = loadData();
      const result = Object.values(data.participants).map((participant) => ({
        ...participant,
        participantId: participant.id,
        hashedId: participant.id,
        participantAlias: participant.alias,
        lastUpdated: (data.trips[participant.id] ?? []).reduce((latest, trip) => {
          const timestamp = trip.syncedAt || trip.createdAt || latest;
          return timestamp > latest ? timestamp : latest;
        }, participant.createdAt),
        trips: data.trips[participant.id] ?? [],
      }));
      return res.json({ participants: result });
    } catch (error) {
      console.error('Admin participants error:', error);
      return res.status(500).json({ error: 'Failed to retrieve participants' });
    }
  });

  app.post('/api/admin/audit', (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { adminId, role, action, details } = req.body || {};
    if (!adminId || !role || !action) {
      return res.status(400).json({ error: 'adminId, role and action are required' });
    }

    try {
      const data = loadData();
      appendAuditEntry(data, { adminId, role, action, details });
      saveData(data);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to write audit log' });
    }
  });

  app.get('/api/admin/audit', (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const data = loadData();
      const logs = [...data.auditLog].reverse().slice(0, 200);
      return res.json({ logs });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve audit log' });
    }
  });

  app.get('/api/admin/users', (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const data = loadData();
      return res.json({ users: data.adminUsers || [] });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to load admin users' });
    }
  });

  app.post('/api/admin/users', (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { username, password, role, addedAt, addedBy } = req.body || {};
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'username, password and role are required' });
    }

    if (DEMO_ADMINS[username]) {
      return res.status(400).json({ error: 'Cannot overwrite built-in admin account' });
    }

    try {
      const data = loadData();
      const normalizedRole = role === 'SCIENTIST' ? 'SCIENTIST' : 'ADMIN';
      const nextUser = {
        username,
        password,
        role: normalizedRole,
        addedAt: addedAt || new Date().toISOString(),
        addedBy: addedBy || 'system',
      };

      const idx = data.adminUsers.findIndex((user) => user.username === username);
      if (idx >= 0) {
        data.adminUsers[idx] = nextUser;
      } else {
        data.adminUsers.push(nextUser);
      }

      saveData(data);
      return res.json({ success: true, user: nextUser });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save admin user' });
    }
  });

  app.delete('/api/admin/users/:username', (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const username = req.params.username;
    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }
    if (DEMO_ADMINS[username]) {
      return res.status(400).json({ error: 'Cannot delete built-in admin account' });
    }

    try {
      const data = loadData();
      const before = data.adminUsers.length;
      data.adminUsers = data.adminUsers.filter((user) => user.username !== username);
      if (data.adminUsers.length === before) {
        return res.status(404).json({ error: 'Admin user not found' });
      }
      saveData(data);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to remove admin user' });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (webDir) {
    const resolvedWebDir = path.resolve(webDir);
    if (fs.existsSync(resolvedWebDir)) {
      app.use(express.static(resolvedWebDir));
      app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
        const indexFile = path.join(resolvedWebDir, 'index.html');
        if (fs.existsSync(indexFile)) {
          res.sendFile(indexFile);
          return;
        }
        res.status(404).send('Frontend build not found');
      });
    }
  }

  return app;
}

function startServer(options = {}) {
  const { port = DEFAULT_PORT, webDir } = options;
  const app = createApp({ webDir });
  const server = app.listen(port, () => {
    console.log(`\n🚀 NATPAC Trip Tracker Server running on http://localhost:${port}`);
    console.log(`   Health: http://localhost:${port}/api/health\n`);
  });
  return server;
}

if (require.main === module) {
  startServer({ webDir: process.env.WEB_DIR });
}

module.exports = { createApp, startServer };
