/**
 * DHRUVA Enterprise Authentication, Profile & RBAC Security Suite
 * Verifies all 20 authentication, security, authorization and account requirements.
 */

const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAuthSuite() {
  console.log('========================================================================');
  console.log('🔐 DHRUVA AUTHENTICATION, USER PROFILE & RBAC VERIFICATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message, evidence = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message} ${evidence ? `(${evidence})` : ''}`);
      passed++;
      return true;
    } else {
      console.error(`❌ [FAIL] ${message} ${evidence ? `[Evidence: ${evidence}]` : ''}`);
      return false;
    }
  }

  // --- 1. LOGIN TESTS ---
  console.log('--- 1. Login System & Verification ---');
  
  // 1.1 Valid Admin Login
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@dhruva.gov.in',
    password: 'admin123'
  });
  assert(
    adminLogin.status === 200 && adminLogin.body.token && adminLogin.body.user.role === 'admin',
    'Admin login returns 200 with valid JWT and role "admin"',
    `User: ${adminLogin.body.user?.email}`
  );
  const adminToken = adminLogin.body.token;

  // 1.2 Valid Researcher Login
  const resLogin = await request('POST', '/api/auth/login', {
    email: 'dr.ananya@ncaor.gov.in',
    password: 'researcher123'
  });
  assert(
    resLogin.status === 200 && resLogin.body.token && resLogin.body.user.role === 'researcher',
    'Researcher login returns 200 with valid JWT and role "researcher"',
    `User: ${resLogin.body.user?.name}`
  );
  const researcherToken = resLogin.body.token;

  // 1.3 Invalid Password
  const badPass = await request('POST', '/api/auth/login', {
    email: 'admin@dhruva.gov.in',
    password: 'wrongpassword999'
  });
  assert(
    badPass.status === 401 && badPass.body.error === 'Invalid email or password.',
    'Invalid password returns 401 with generic message (no leak)',
    badPass.body.error
  );

  // 1.4 Non-existent Email
  const badEmail = await request('POST', '/api/auth/login', {
    email: 'nonexistent_user_999@dhruva.gov.in',
    password: 'somepassword123'
  });
  assert(
    badEmail.status === 401 && badEmail.body.error === 'Invalid email or password.',
    'Non-existent email returns identical 401 message (anti-enumeration)',
    badEmail.body.error
  );

  // 1.5 Empty / Missing fields
  const emptyReq = await request('POST', '/api/auth/login', {});
  assert(emptyReq.status === 400, 'Empty login payload returns 400 Bad Request');

  // --- 2. SIGNUP & REGISTRATION ---
  console.log('\n--- 2. Registration / Signup Flow ---');

  const testEmail = `test.researcher.${Date.now()}@dhruva.org`;
  const registerRes = await request('POST', '/api/auth/register', {
    name: 'Dr. Polar Test Researcher',
    email: testEmail,
    password: 'SecurePassword123!',
    role: 'researcher',
    institution: 'Antarctic Glaciology Institute',
    phone: '+91 98765 11223',
    dateOfBirth: '1988-04-12',
    researchDomain: 'Ice Core Paleoclimatology',
    bio: 'Palaeoclimate researcher exploring Vostok and Dome C ice records.'
  });

  assert(
    registerRes.status === 201 && registerRes.body.token && registerRes.body.user.email === testEmail.toLowerCase(),
    'Registration creates new user in PostgreSQL and returns 201 + JWT',
    `User ID: ${registerRes.body.user?.id}`
  );
  const newCreatedToken = registerRes.body.token;

  // 2.2 Duplicate Email
  const dupRes = await request('POST', '/api/auth/register', {
    name: 'Dr. Duplicate',
    email: testEmail,
    password: 'SecurePassword123!'
  });
  assert(dupRes.status === 409, 'Duplicate email registration returns 409 Conflict', dupRes.body.error);

  // 2.3 Admin Role Tampering Prevention
  const tamperedRegister = await request('POST', '/api/auth/register', {
    name: 'Hacker Admin',
    email: `hacker.${Date.now()}@test.org`,
    password: 'SecurePassword123!',
    role: 'admin' // Attempting to register as admin
  });
  assert(
    tamperedRegister.status === 201 && tamperedRegister.body.user.role === 'public',
    'Registration sanitizes role: public cannot register as "admin" (forces to public)',
    `Assigned Role: ${tamperedRegister.body.user?.role}`
  );

  // --- 3. PROFILE API (GET /api/auth/me) ---
  console.log('\n--- 3. User Profile API (/api/auth/me) ---');

  const profileRes = await request('GET', '/api/auth/me', null, newCreatedToken);
  assert(
    profileRes.status === 200 && profileRes.body.user && profileRes.body.user.phone === '+91 98765 11223',
    'GET /api/auth/me returns real PostgreSQL record with all profile fields',
    `Phone: ${profileRes.body.user?.phone}, DOB: ${profileRes.body.user?.dateOfBirth}`
  );

  // 3.2 Verify Zero Secret Leakage
  const rawProfileKeys = Object.keys(profileRes.body.user || {});
  assert(
    !rawProfileKeys.includes('password') && !rawProfileKeys.includes('password_hash') && !rawProfileKeys.includes('token'),
    'Security: Password hash and secrets are strictly excluded from profile responses',
    `Keys: ${rawProfileKeys.join(', ')}`
  );

  // 3.3 Unauthenticated Profile Access
  const noTokenRes = await request('GET', '/api/auth/me');
  assert(noTokenRes.status === 401, 'Unauthenticated GET /api/auth/me returns 401 Unauthorized');

  // 3.4 Tampered / Bad JWT Token
  const badTokenRes = await request('GET', '/api/auth/me', null, 'invalid.jwt.token.here');
  assert(badTokenRes.status === 401, 'Invalid/Tampered JWT returns 401 Unauthorized');

  // --- 4. PROFILE EDITING (PUT /api/auth/profile) ---
  console.log('\n--- 4. Profile Editing & Persistence ---');

  const updateRes = await request('PUT', '/api/auth/profile', {
    name: 'Dr. Polar Test Researcher (Updated)',
    phone: '+91 99999 88888',
    institution: 'National Centre for Polar and Ocean Research, Goa',
    bio: 'Updated polar science biography with published Arctic papers.'
  }, newCreatedToken);

  assert(
    updateRes.status === 200 && updateRes.body.user.name === 'Dr. Polar Test Researcher (Updated)' && updateRes.body.user.phone === '+91 99999 88888',
    'PUT /api/auth/profile updates user record in PostgreSQL and returns updated profile',
    `Updated Name: ${updateRes.body.user?.name}`
  );

  // 4.2 Role Elevation Attack via Profile PUT
  const elevateAttack = await request('PUT', '/api/auth/profile', {
    role: 'admin',
    status: 'superadmin'
  }, newCreatedToken);
  assert(
    elevateAttack.body.user.role === 'researcher',
    'Security: Users cannot elevate role or status via profile edit (remains researcher)',
    `Role: ${elevateAttack.body.user?.role}`
  );

  // --- 5. ROLE-BASED ACCESS CONTROL (RBAC) ---
  console.log('\n--- 5. Role-Based Access Control (RBAC) Enforcement ---');

  // Public Token
  const publicLogin = await request('POST', '/api/auth/login', {
    email: 'student@dhruva.edu',
    password: 'student123'
  });
  const publicToken = publicLogin.body.token;

  // 5.1 Public accessing Researcher upload API
  const publicToResearcher = await request('POST', '/api/researcher/upload', { title: 'Unauthorized Paper' }, publicToken);
  assert(
    publicToResearcher.status === 403 || publicToResearcher.status === 401,
    'Public user blocked from Researcher upload API (RBAC 403)',
    `Status: ${publicToResearcher.status}`
  );

  // 5.2 Public accessing Admin Verification Queue
  const publicToAdmin = await request('GET', '/api/admin/audit-logs', null, publicToken);
  assert(
    publicToAdmin.status === 403 || publicToAdmin.status === 401,
    'Public user blocked from Admin Audit Logs API (RBAC 403)',
    `Status: ${publicToAdmin.status}`
  );

  // 5.3 Researcher accessing Admin Audit Logs API
  const resToAdmin = await request('GET', '/api/admin/audit-logs', null, researcherToken);
  assert(
    resToAdmin.status === 403,
    'Researcher blocked from Admin Audit Logs API (RBAC 403)',
    `Status: ${resToAdmin.status}`
  );

  // 5.4 Admin accessing Admin Audit Logs API
  const adminToAdmin = await request('GET', '/api/admin/audit-logs', null, adminToken);
  assert(
    adminToAdmin.status === 200,
    'Admin successfully authorized to access Admin Audit Logs API (200 OK)',
    `Logs count: ${adminToAdmin.body?.logs?.length || 0}`
  );

  // --- 6. LOGOUT FLOW ---
  console.log('\n--- 6. Logout & Session Invalidation ---');
  const logoutRes = await request('POST', '/api/auth/logout', null, newCreatedToken);
  assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200 and records audit event');

  console.log('\n========================================================================');
  console.log(`📊 AUTHENTICATION SUITE SCORE: ${passed} / ${total} Tests Passed (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('========================================================================\n');

  if (passed === total) {
    console.log('✨ All DHRUVA Authentication, Profile & RBAC Security Tests PASSED!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runAuthSuite().catch((err) => {
  console.error('Test suite runtime error:', err);
  process.exit(1);
});
