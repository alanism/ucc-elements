import crypto from 'node:crypto';

export function computePayloadHash(payload) {
  const canonicalString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

export function appendEventIdempotent(db, event) {
  const payloadJson = typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload);
  const payloadHash = computePayloadHash(payloadJson);

  // Check existing event with same event_id
  const stmtCheck = db.prepare('SELECT event_id, payload_hash, sequence FROM events WHERE event_id = ?');
  const existing = stmtCheck.get(event.eventId);

  if (existing) {
    if (existing.payload_hash === payloadHash) {
      // Idempotent retry: return existing record
      return { status: 'idempotent_ok', sequence: existing.sequence, eventId: existing.event_id };
    }
    // Conflict: same UUID but different payload
    throw new Error(`Conflict: event_id ${event.eventId} already exists with different payload hash`);
  }

  // Insert new event
  const stmtInsert = db.prepare(`
    INSERT INTO events (event_id, learner_id, session_id, operation_id, event_type, payload_hash, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmtInsert.run(
    event.eventId,
    event.learnerId,
    event.sessionId,
    event.operationId || null,
    event.eventType,
    payloadHash,
    payloadJson,
    event.createdAt || new Date().toISOString()
  );

  return { status: 'inserted', sequence: info.lastInsertRowid, eventId: event.eventId };
}
