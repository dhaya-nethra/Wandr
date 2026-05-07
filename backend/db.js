/**
 * Pure-JS JSON file store — no native addons required.
 * Data is persisted to natpac_data.json alongside this file.
 *
 * Shape:
 *   {
 *     participants: { [hashedId]: { id, alias, createdAt } },
 *     trips:        { [hashedId]: Trip[]                  },
 *     auditLog:     { id, adminId, role, action, details, timestamp, chainHash }[],
 *     adminUsers:   { username, password, role, addedAt, addedBy }[]
 *   }
 */

const fs   = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'natpac_data.json');

function defaultData() {
  return {
    participants: {},
    trips: {},
    auditLog: [],
    adminUsers: [],
    participantAuth: {},
  };
}

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    return defaultData();
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    return {
      ...defaultData(),
      ...parsed,
      participants: parsed?.participants || {},
      trips: parsed?.trips || {},
      auditLog: Array.isArray(parsed?.auditLog) ? parsed.auditLog : [],
      adminUsers: Array.isArray(parsed?.adminUsers) ? parsed.adminUsers : [],
      participantAuth: parsed?.participantAuth || {},
    };
  } catch {
    return defaultData();
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { loadData, saveData };
