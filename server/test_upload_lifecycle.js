require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function testUpload() {
  console.log('Testing Researcher Upload Lifecycle via actual login...');
  
  // 1. Login as researcher
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dr.ananya@ncaor.gov.in',
      password: 'researcher123'
    })
  });
  
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    throw new Error('Failed to login as researcher: ' + JSON.stringify(loginData));
  }
  const token = loginData.token;
  console.log('✓ [PASS] Authenticated researcher via real JWT login');

  // 2. Prepare upload payload
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const dummyPdf = '%PDF-1.4\n1 0 obj\n<< /Title (Test Polar Dynamics) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';
  
  const formDataParts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nAutomated Test: Larsemann Hills Ice Velocity\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="abstract"\r\n\r\nQuantifying surface velocity anomalies in East Antarctica using satellite radar interferometry.\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="authors"\r\n\r\n["Dr. Test Researcher", "Dr. Polar Observer"]\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="research_area"\r\n\r\nGlaciology\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="polar_region"\r\n\r\nAntarctic\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test_ice_velocity.pdf"\r\nContent-Type: application/pdf\r\n\r\n${dummyPdf}\r\n`,
    `--${boundary}--\r\n`
  ];

  const body = Buffer.from(formDataParts.join(''));

  const response = await fetch('http://localhost:5000/api/researcher/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: body
  });

  const resJson = await response.json();
  console.log('Upload response status:', response.status);
  console.log('Upload response body:', resJson);

  if ((response.status === 200 || response.status === 201) && (resJson.paperId || resJson.id || resJson.paper)) {
    const paperId = resJson.paperId || resJson.id || (resJson.paper && resJson.paper.id);
    console.log('✓ [PASS] Paper uploaded successfully with ID:', paperId);
    
    // Check if paper exists in DB
    const db = require('./src/db/db.js');
    const paper = db.queryGet('SELECT * FROM papers WHERE id = ?', [paperId]);
    if (paper && paper.title.includes('Larsemann Hills')) {
      console.log('✓ [PASS] Paper verified in database:', paper.title, 'Status:', paper.status);
      // Clean up test paper
      db.execute('DELETE FROM papers WHERE id = ?', [paperId]);
      db.execute('DELETE FROM papers WHERE title LIKE ?', ['%Automated Test%']);
      console.log('✓ [PASS] Cleaned up test paper from database');
    } else {
      console.error('✗ [FAIL] Paper not found in database');
      process.exit(1);
    }
  } else {
    console.error('✗ [FAIL] Upload failed with status:', response.status);
    process.exit(1);
  }
}

testUpload().catch(err => {
  console.error('Error in testUpload:', err);
  process.exit(1);
});
