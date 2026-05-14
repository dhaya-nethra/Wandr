const fs = require('fs');
const path = require('path');
const db = require('./database');
const { loadData } = require('./db');

async function migrate() {
  try {
    // 1. Run init_db.sql
    console.log('Running init_db.sql...');
    const initSql = fs.readFileSync(path.join(__dirname, 'init_db.sql'), 'utf8');
    await db.query(initSql);
    console.log('Tables created successfully.');

    // 2. Load JSON data
    console.log('Loading data from natpac_data.json...');
    const data = loadData();

    // 3. Insert Participants and Auth
    console.log(`Migrating ${Object.keys(data.participants || {}).length} participants...`);
    for (const [hashedId, p] of Object.entries(data.participants || {})) {
      await db.query(
        `INSERT INTO participants (id, alias, consent_status, created_at, last_consent_update)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [p.id, p.alias, p.consentStatus || 'yes', p.createdAt || new Date().toISOString(), p.lastConsentUpdate || new Date().toISOString()]
      );

      const passwordHash = data.participantAuth?.[hashedId];
      if (passwordHash) {
        await db.query(
          `INSERT INTO participant_auth (participant_id, password_hash)
           VALUES ($1, $2)
           ON CONFLICT (participant_id) DO NOTHING`,
          [p.id, passwordHash]
        );
      }
    }

    // 4. Insert Trips
    let tripCount = 0;
    for (const [hashedId, trips] of Object.entries(data.trips || {})) {
      for (const t of trips) {
        await db.query(
          `INSERT INTO trips (id, participant_id, trip_data, synced_at, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [t.id, hashedId, JSON.stringify(t), t.syncedAt || new Date().toISOString(), t.createdAt || new Date().toISOString()]
        );
        tripCount++;
      }
    }
    console.log(`Migrated ${tripCount} trips.`);

    // 5. Insert Audit Log
    console.log(`Migrating ${data.auditLog?.length || 0} audit log entries...`);
    for (const entry of data.auditLog || []) {
      await db.query(
        `INSERT INTO audit_log (id, timestamp, admin_id, role, action, details, prev_hash, chain_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [entry.id, entry.timestamp, entry.adminId, entry.role, entry.action, entry.details, entry.prevHash, entry.chainHash]
      );
    }

    // 6. Insert Admin Users
    console.log(`Migrating ${data.adminUsers?.length || 0} admin users...`);
    for (const user of data.adminUsers || []) {
      await db.query(
        `INSERT INTO admin_users (username, password, role, added_at, added_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username) DO NOTHING`,
        [user.username, user.password, user.role, user.addedAt, user.addedBy]
      );
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
