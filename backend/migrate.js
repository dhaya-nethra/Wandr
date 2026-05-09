const { loadData } = require('./db');
const db = require('./database');
const crypto = require('crypto');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function migrate() {
  console.log('Starting migration from JSON to PostgreSQL...');
  const data = loadData();

  try {
    // Migrate Participants
    console.log('Migrating participants...');
    for (const [id, p] of Object.entries(data.participants)) {
      await db.query(
        'INSERT INTO participants (id, alias, consent_status, created_at, last_consent_update) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [id, p.alias, p.consentStatus || 'yes', p.createdAt, p.lastConsentUpdate || p.createdAt]
      );
    }

    // Migrate Participant Auth
    console.log('Migrating participant auth...');
    for (const [id, passHash] of Object.entries(data.participantAuth || {})) {
      await db.query(
        'INSERT INTO participant_auth (participant_id, password_hash) VALUES ($1, $2) ON CONFLICT (participant_id) DO NOTHING',
        [id, passHash]
      );
    }

    // Migrate Trips
    console.log('Migrating trips...');
    for (const [participantId, trips] of Object.entries(data.trips)) {
      for (const trip of trips) {
        await db.query(
          'INSERT INTO trips (id, participant_id, trip_data, synced_at, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
          [trip.id, participantId, JSON.stringify(trip), trip.syncedAt || new Date().toISOString(), trip.createdAt || new Date().toISOString()]
        );
      }
    }

    // Migrate Audit Logs
    console.log('Migrating audit logs...');
    for (const entry of data.auditLog) {
      await db.query(
        'INSERT INTO audit_log (id, timestamp, admin_id, role, action, details, prev_hash, chain_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
        [entry.id, entry.timestamp, entry.adminId, entry.role, entry.action, entry.details, entry.prevHash, entry.chainHash]
      );
    }

    // Migrate Admin Users
    console.log('Migrating admin users...');
    for (const user of data.adminUsers) {
      await db.query(
        'INSERT INTO admin_users (username, password, role, added_at, added_by) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING',
        [user.username, user.password, user.role, user.addedAt, user.addedBy]
      );
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
