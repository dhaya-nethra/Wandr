const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = require('./database'); // PostgreSQL connection pool

const DEFAULT_PORT = process.env.PORT || 3001;
const GOV_MASTER_KEY = process.env.GOV_MASTER_KEY || 'NATPAC-KERALA-GOV-2026-DEMO';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'NATPAC-ADMIN-KEY';

const DEMO_ADMINS = {
  natpac_admin: {
    password: 'NATPAC@Kerala2024',
    role: 'ADMIN',
  },
  natpac_scientist: {
    password: 'Science@Kerala24',
    role: 'RESEARCHER',
  },
};

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function createApp(options = {}) {
  const { webDir } = options;
  const app = express();

  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081',
      'http://localhost:8082', 'http://localhost:8083', 'http://localhost:3000',
      'https://localhost:8080', 'https://localhost:8081', 'https://localhost:8083', 'https://alamelu08.github.io',],
    credentials: true,
  }));
  app.use(express.json({ limit: '2mb' }));

  function isAdminAuthorized(req) {
    return req.headers['x-admin-key'] === ADMIN_API_KEY;
  }

  async function appendAuditEntry(params) {
    const res = await db.query('SELECT chain_hash FROM audit_log ORDER BY timestamp DESC LIMIT 1');
    const prevHash = res.rows.length > 0 ? res.rows[0].chain_hash : '0'.repeat(64);

    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      adminId: params.adminId,
      role: params.role,
      action: params.action,
      details: params.details || '',
      prevHash,
    };

    const chainInput = `${prevHash}|${entry.id}|${entry.timestamp}|${entry.adminId}|${entry.action}|`;
    const chainHash = sha256(chainInput);

    await db.query(
      `INSERT INTO audit_log (id, timestamp, admin_id, role, action, details, prev_hash, chain_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [entry.id, entry.timestamp, entry.adminId, entry.role, entry.action, entry.details, entry.prevHash, chainHash]
    );
  }

  async function verifyAdminCredentials(username, password) {
    const builtIn = DEMO_ADMINS[username];
    if (builtIn && builtIn.password === password) {
      return { ok: true, role: builtIn.role };
    }

    const res = await db.query('SELECT role, password FROM admin_users WHERE username = $1', [username]);
    if (res.rows.length > 0) {
      const stored = res.rows[0];
      if (stored.password === password) {
        return { ok: true, role: stored.role || 'ADMIN' };
      }
    }

    return { ok: false };
  }

  app.post('/api/participant/register', async (req, res) => {
    const { participantId, password } = req.body || {};
    if (!participantId || !password) {
      return res.status(400).json({ error: 'participantId and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
      const hashedId = sha256(participantId);

      const checkAuth = await db.query('SELECT * FROM participant_auth WHERE participant_id = $1', [hashedId]);
      if (checkAuth.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const alias = participantId.slice(0, 2).toUpperCase() + hashedId.slice(0, 4).toUpperCase();
      const createdAt = new Date().toISOString();

      await db.query(
        `INSERT INTO participants (id, alias, consent_status, created_at, last_consent_update)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [hashedId, alias, 'yes', createdAt, createdAt]
      );

      await db.query(
        `INSERT INTO participant_auth (participant_id, password_hash)
         VALUES ($1, $2)`,
        [hashedId, sha256(password)]
      );

      await appendAuditEntry({
        adminId: `USER_${hashedId.slice(0,8)}`,
        role: 'USER',
        action: 'USER_REGISTER',
        details: `Participant registered`,
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Participant register error:', error);
      return res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/participant/login', async (req, res) => {
    const { participantId, password } = req.body || {};
    if (!participantId || !password) {
      return res.status(400).json({ error: 'participantId and password are required' });
    }

    try {
      const hashedId = sha256(participantId);

      const authRes = await db.query('SELECT password_hash FROM participant_auth WHERE participant_id = $1', [hashedId]);
      if (authRes.rows.length === 0) {
        return res.status(401).json({ error: 'User not registered' });
      }

      if (authRes.rows[0].password_hash !== sha256(password)) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      const partRes = await db.query('SELECT consent_status FROM participants WHERE id = $1', [hashedId]);
      if (partRes.rows.length > 0 && partRes.rows[0].consent_status === 'revoked') {
        return res.status(403).json({ error: 'Account access has been revoked' });
      }

      await appendAuditEntry({
        adminId: `USER_${hashedId.slice(0,8)}`,
        role: 'USER',
        action: 'USER_LOGIN',
        details: `Participant logged in`,
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Participant login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/sync', async (req, res) => {
    const { participantId, trips, hasConsent } = req.body;
    if (!participantId || !Array.isArray(trips)) {
      return res.status(400).json({ error: 'participantId and trips array are required' });
    }

    try {
      const hashedId = sha256(participantId);
      const alias = participantId.slice(0, 2).toUpperCase() + hashedId.slice(0, 4).toUpperCase();
      const consentStatus = hasConsent === false ? 'no' : 'yes';
      const now = new Date().toISOString();

      await db.query(
        `INSERT INTO participants (id, alias, consent_status, created_at, last_consent_update)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           consent_status = EXCLUDED.consent_status,
           last_consent_update = EXCLUDED.last_consent_update`,
        [hashedId, alias, consentStatus, now, now]
      );

      for (const trip of trips) {
        const syncedAt = new Date().toISOString();
        await db.query(
          `INSERT INTO trips (id, participant_id, trip_data, synced_at, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             trip_data = EXCLUDED.trip_data,
             synced_at = EXCLUDED.synced_at`,
          [trip.id, hashedId, JSON.stringify(trip), syncedAt, trip.createdAt || now]
        );
      }

      await appendAuditEntry({
        adminId: `USER_${hashedId.slice(0,8)}`,
        role: 'USER',
        action: 'USER_SYNC',
        details: `Synced ${trips.length} trips`,
      });

      return res.json({ success: true, synced: trips.length });
    } catch (error) {
      console.error('Sync error:', error);
      return res.status(500).json({ error: 'Sync failed', detail: error.message });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    const { username, password, govKey } = req.body || {};

    if (!username || !password || !govKey) {
      return res.status(400).json({ error: 'username, password and govKey are required' });
    }

    const cred = await verifyAdminCredentials(username, password);

    if (govKey !== GOV_MASTER_KEY || !cred.ok) {
      await appendAuditEntry({
        adminId: sha256(username),
        role: 'UNKNOWN',
        action: 'FAILED_LOGIN',
        details: govKey !== GOV_MASTER_KEY ? 'Invalid government key' : 'Wrong username/password',
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await appendAuditEntry({
      adminId: sha256(username),
      role: cred.role,
      action: 'ADMIN_LOGIN',
      details: 'Successful login',
    });

    return res.json({
      success: true,
      role: cred.role,
      adminApiKey: ADMIN_API_KEY,
    });
  });

  app.delete('/api/participant/data/:participantId', async (req, res) => {
    try {
      const hashedId = sha256(req.params.participantId);
      
      await db.query('DELETE FROM trips WHERE participant_id = $1', [hashedId]);

      await appendAuditEntry({
        adminId: `USER_${hashedId.slice(0,8)}`,
        role: 'USER',
        action: 'USER_CLEAR_DATA',
        details: `Cleared all trips`,
      });

      return res.json({ success: true, message: 'All user data cleared' });
    } catch (error) {
      console.error('Clear data error:', error);
      return res.status(500).json({ error: 'Failed to clear user data' });
    }
  });

  app.get('/api/trips/:participantId', async (req, res) => {
    try {
      const hashedId = sha256(req.params.participantId);
      const tripsRes = await db.query('SELECT trip_data FROM trips WHERE participant_id = $1', [hashedId]);
      const trips = tripsRes.rows.map(row => row.trip_data);
      return res.json({ trips });
    } catch (error) {
      console.error('Get trips error:', error);
      return res.status(500).json({ error: 'Failed to retrieve trips' });
    }
  });

  app.delete('/api/trips/:participantId/:tripId', async (req, res) => {
    try {
      const hashedId = sha256(req.params.participantId);
      const { tripId } = req.params;
      
      const deleteRes = await db.query('DELETE FROM trips WHERE participant_id = $1 AND id = $2', [hashedId, tripId]);
      
      if (deleteRes.rowCount === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      await appendAuditEntry({
        adminId: `USER_${hashedId.slice(0,8)}`,
        role: 'USER',
        action: 'USER_DELETE_TRIP',
        details: `Deleted trip ${tripId.slice(0,8)}...`,
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Delete trip error:', error);
      return res.status(500).json({ error: 'Failed to delete trip' });
    }
  });

  app.get('/api/admin/participants', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const partRes = await db.query('SELECT * FROM participants');
      const tripsRes = await db.query('SELECT participant_id, trip_data, synced_at, created_at FROM trips');
      
      const tripsByParticipant = {};
      for (const row of tripsRes.rows) {
        if (!tripsByParticipant[row.participant_id]) {
          tripsByParticipant[row.participant_id] = [];
        }
        const trip = row.trip_data;
        trip.syncedAt = row.synced_at;
        tripsByParticipant[row.participant_id].push(trip);
      }

      const result = partRes.rows.map((p) => {
        const pTrips = p.consent_status === 'revoked' ? [] : (tripsByParticipant[p.id] || []);
        
        let lastUpdated = p.created_at;
        for (const trip of pTrips) {
          const ts = new Date(trip.syncedAt || trip.createdAt || lastUpdated);
          const currentLatest = new Date(lastUpdated);
          if (ts > currentLatest) lastUpdated = ts.toISOString();
        }

        return {
          id: p.id,
          alias: p.alias,
          createdAt: p.created_at,
          consentStatus: p.consent_status,
          participantId: p.id,
          hashedId: p.id,
          participantAlias: p.alias,
          lastUpdated: typeof lastUpdated === 'string' ? lastUpdated : lastUpdated.toISOString(),
          trips: pTrips,
        };
      });

      return res.json({ participants: result });
    } catch (error) {
      console.error('Admin participants error:', error);
      return res.status(500).json({ error: 'Failed to retrieve participants' });
    }
  });

  app.post('/api/admin/revoke-consent/:participantId', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const participantId = req.params.participantId;
    if (!participantId) {
      return res.status(400).json({ error: 'participantId is required' });
    }
    try {
      const hashedId = sha256(participantId);
      const updateRes = await db.query(
        `UPDATE participants SET consent_status = 'revoked', last_consent_update = $1 WHERE id = $2`,
        [new Date().toISOString(), hashedId]
      );
      
      if (updateRes.rowCount > 0) {
        return res.json({ success: true, message: 'Consent revoked' });
      }
      return res.status(404).json({ error: 'Participant not found' });
    } catch (error) {
      console.error('Revoke consent error:', error);
      return res.status(500).json({ error: 'Failed to revoke consent' });
    }
  });

  app.post('/api/admin/audit', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { adminId, role, action, details } = req.body || {};
    if (!adminId || !role || !action) {
      return res.status(400).json({ error: 'adminId, role and action are required' });
    }

    try {
      await appendAuditEntry({ adminId, role, action, details });
      return res.json({ success: true });
    } catch (error) {
      console.error('Audit entry error:', error);
      return res.status(500).json({ error: 'Failed to write audit log' });
    }
  });

  app.post('/api/admin/audit/repair', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const auditRes = await db.query('SELECT * FROM audit_log ORDER BY timestamp ASC');
      let prevHash = '0'.repeat(64);
      let count = 0;

      for (const row of auditRes.rows) {
        const chainInput = `${prevHash}|${row.id}|${new Date(row.timestamp).toISOString()}|${row.admin_id}|${row.action}|`;
        const chainHash = sha256(chainInput);
        
        await db.query(
          `UPDATE audit_log SET prev_hash = $1, chain_hash = $2 WHERE id = $3`,
          [prevHash, chainHash, row.id]
        );
        
        prevHash = chainHash;
        count++;
      }

      console.log(`Audit chain repaired: ${count} entries re-hashed.`);
      return res.json({ success: true, count });
    } catch (error) {
      console.error('Repair audit error:', error);
      return res.status(500).json({ error: 'Failed to repair audit chain' });
    }
  });

  app.get('/api/admin/audit', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Get up to 500 latest logs in descending order, then reverse to chronological order
      const logsRes = await db.query('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 500');
      
      const logs = logsRes.rows.reverse().map(row => ({
        id: row.id,
        timestamp: row.timestamp,
        adminId: row.admin_id,
        role: row.role,
        action: row.action,
        details: row.details,
        prevHash: row.prev_hash,
        chainHash: row.chain_hash
      }));

      return res.json({ logs });
    } catch (error) {
      console.error('Get audit log error:', error);
      return res.status(500).json({ error: 'Failed to retrieve audit log' });
    }
  });

  app.get('/api/admin/users', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const usersRes = await db.query('SELECT username, password, role, added_at as "addedAt", added_by as "addedBy" FROM admin_users');
      return res.json({ users: usersRes.rows });
    } catch (error) {
      console.error('Get admin users error:', error);
      return res.status(500).json({ error: 'Failed to load admin users' });
    }
  });

  app.post('/api/admin/users', async (req, res) => {
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
      const checkRes = await db.query('SELECT username FROM admin_users WHERE username = $1', [username]);
      if (checkRes.rows.length > 0) {
        return res.status(400).json({ error: 'username already exists' });
      }

      const normalizedRole = role === 'RESEARCHER' ? 'RESEARCHER' : 'ADMIN';
      const actualAddedAt = addedAt || new Date().toISOString();
      const actualAddedBy = addedBy || 'system';

      await db.query(
        `INSERT INTO admin_users (username, password, role, added_at, added_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [username, password, normalizedRole, actualAddedAt, actualAddedBy]
      );

      const nextUser = {
        username,
        password,
        role: normalizedRole,
        addedAt: actualAddedAt,
        addedBy: actualAddedBy,
      };

      return res.json({ success: true, user: nextUser });
    } catch (error) {
      console.error('Add admin user error:', error);
      return res.status(500).json({ error: 'Failed to save admin user' });
    }
  });

  app.put('/api/admin/users', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { username, password, role, addedAt, addedBy } = req.body || {};
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'username, password and role are required' });
    }
    
    try {
      const normalizedRole = role === 'RESEARCHER' ? 'RESEARCHER' : 'ADMIN';
      
      const updateRes = await db.query(
        `UPDATE admin_users 
         SET password = $1, role = $2 
         WHERE username = $3
         RETURNING added_at, added_by`,
        [password, normalizedRole, username]
      );

      if (updateRes.rowCount === 0) {
        return res.status(404).json({ error: 'Admin user not found' });
      }

      const nextUser = {
        username,
        password,
        role: normalizedRole,
        addedAt: updateRes.rows[0].added_at,
        addedBy: updateRes.rows[0].added_by,
      };
      
      return res.json({ success: true, user: nextUser });
    } catch (error) {
      console.error('Update admin user error:', error);
      return res.status(500).json({ error: 'Failed to update admin user' });
    }
  });

  app.delete('/api/admin/users/:username', async (req, res) => {
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
      const deleteRes = await db.query('DELETE FROM admin_users WHERE username = $1', [username]);
      if (deleteRes.rowCount === 0) {
        return res.status(404).json({ error: 'Admin user not found' });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error('Delete admin user error:', error);
      return res.status(500).json({ error: 'Failed to remove admin user' });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/db-health', async (_req, res) => {
    try {
      const result = await db.query('SELECT NOW()');
      res.json({ status: 'ok', db_time: result.rows[0].now });
    } catch (error) {
      console.error('Database health check failed:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
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
