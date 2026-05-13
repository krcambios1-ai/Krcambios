# Security Specification - KR Cambios

## Data Invariants
1. **Scam Reports**: Must have a valid phone number, reason, and status. Status defaults to 'pending' on creation. Only admins can verify reports.
2. **Settings**: Only admins can modify exchange rates.
3. **Messages**: Anyone can submit a message, but only if they provide a name and message. Only admins can read or manage these messages.
4. **Users**: Users can only read and update their own profiles. Role manipulation is forbidden.
5. **Admins**: This collection is system-managed and used to verify administrative privileges.

## The "Dirty Dozen" Payloads

### P1: Unauthorized Role Escalation
**Payload (to /users/attackerUid)**: `{ "email": "attacker@spam.com", "role": "admin" }`
**Expected Result**: PERMISSION_DENIED (Users cannot set their own role).

### P2: Identity Spoofing in Reports
**Payload (to /scam_reports/newId)**: `{ "number": "+55123", "reason": "test", "date": "2024-01-01T00:00:00Z", "status": "verified", "reporterUid": "victimUid" }`
**Expected Result**: PERMISSION_DENIED (Users cannot spoof reporterUid or set status to 'verified').

### P3: Resource Exhaustion (ID Poisoning)
**Path**: `/scam_reports/VERY_LONG_ID_EXCEEDING_LIMITS...`
**Expected Result**: PERMISSION_DENIED (isValidId check).

### P4: Shadow Field Injection
**Payload (to /messages/msg1)**: `{ "name": "John", "message": "Hi", "createdAt": "2024-01-01T00:00:00Z", "isApproved": true }`
**Expected Result**: PERMISSION_DENIED (Strict key check prevents "isApproved" injection).

### P5: Bypassing Master Gate
**Action**: Read `/messages/secretMsg` without being an admin.
**Expected Result**: PERMISSION_DENIED.

### P6: Non-Admin Rate Manipulation
**Payload (to /settings/global)**: `{ "rates": { "brl_ves": 150 }, "updatedAt": "2024-01-01T00:00:00Z" }`
**Expected Result**: PERMISSION_DENIED.

### P7: Orphaned Message Submission
**Payload**: Missing `message` field.
**Expected Result**: PERMISSION_DENIED (isValidMessage schema check).

### P8: Malicious Status Transition
**Action**: User attempting to change a report status from 'pending' to 'verified'.
**Expected Result**: PERMISSION_DENIED (Only admins can change status).

### P9: PII Leak Attempt
**Action**: Listing `/users` collection as a non-admin.
**Expected Result**: PERMISSION_DENIED (Users can only read their own document).

### P10: Temporal Integrity Violation
**Payload**: Providing a `createdAt` in the future or manipulated.
**Expected Result**: PERMISSION_DENIED (Must match `request.time`).

### P11: Resource Poisoning (Size Attack)
**Payload**: `number` field with 1MB of garbage text.
**Expected Result**: PERMISSION_DENIED (.size() constraints).

### P12: Invalid Timestamp Format
**Payload**: `date` field as "not-a-date".
**Expected Result**: PERMISSION_DENIED (Regex/Type check).

## The Test Runner (DRAFT)
A full test suite `firestore.rules.test.ts` will verify these payloads.
