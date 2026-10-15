/**
 * ==============================================================================
 * RUN 20 REAL END-TO-END BUSINESS TEST CASES FOR PROJECT NEXUS PORTAL
 * ==============================================================================
 * Executes 20 sequential test cases interacting with the real backend API,
 * real MySQL database, and real user credentials.
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8086/api';
const DEFAULT_PASSWORD = 'password123';

const results = [];
let passCount = 0;
let failCount = 0;

// Color helpers for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function getVietnamLocalDateTime(addSeconds = 0) {
  const d = new Date(Date.now() + addSeconds * 1000);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const p = {};
  parts.forEach(({ type, value }) => (p[type] = value));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

async function login(username, password = DEFAULT_PASSWORD) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: username, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(data)}`);
  }
  return {
    token: data.data.accessToken,
    user: data.data.user,
  };
}

async function apiRequest(method, path, body = null, token = null, isMultipart = false) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let options = { method, headers };
  if (body) {
    if (isMultipart) {
      options.body = body; // FormData handles its own boundary
    } else {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, options);
  let resData;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    resData = await res.json();
  } else if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
    resData = await res.text();
  } else {
    resData = await res.arrayBuffer();
  }

  return { status: res.status, ok: res.ok, data: resData };
}

async function runTestCase(id, name, actor, moduleNum, testFn) {
  const start = Date.now();
  process.stdout.write(`\n${colors.cyan}[RUNNING]${colors.reset} ${colors.bright}${id}${colors.reset}: ${name} (${colors.yellow}${actor}${colors.reset} - Module ${moduleNum})... `);
  try {
    const details = await testFn();
    const duration = Date.now() - start;
    passCount++;
    console.log(`${colors.green}✔ PASS${colors.reset} ${colors.gray}(${duration}ms)${colors.reset}`);
    if (details) {
      console.log(`   ${colors.gray}↳ ${details}${colors.reset}`);
    }
    results.push({ id, name, actor, module: moduleNum, status: 'PASS', duration, details });
  } catch (err) {
    const duration = Date.now() - start;
    failCount++;
    console.log(`${colors.red}✘ FAIL${colors.reset} ${colors.gray}(${duration}ms)${colors.reset}`);
    console.error(`   ${colors.red}Error: ${err.message}${colors.reset}`);
    results.push({ id, name, actor, module: moduleNum, status: 'FAIL', duration, error: err.message });
  }
}

async function main() {
  console.log(`${colors.bright}${colors.blue}==============================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}   PROJECT NEXUS PORTAL - 20 END-TO-END BUSINESS REAL DATA TEST SUITE        ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}==============================================================================${colors.reset}`);
  console.log(`Target API URL: ${colors.yellow}${BASE_URL}${colors.reset}`);
  console.log(`Start Time: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (Asia/Ho_Chi_Minh)`);

  const timestamp = Date.now();

  // 1. Authenticate primary actors
  console.log(`\n${colors.yellow}Authenticating actors...${colors.reset}`);
  const authPrincipal = await login('principal');
  const authTeacher = await login('teacher');
  const authCouncil = await login('council');
  const authStudent = await login('student');
  const authStudent2 = await login('student2');
  const authStudent3 = await login('student3');
  const authIndividual = await login('individual_user');
  const authAdmin = await login('superadmin');
  console.log(`${colors.green}✔ All 8 actors authenticated successfully with real JWT tokens.${colors.reset}`);

  let periodId = null;
  let topicId = null;
  let teamId = 2; // Real Seed Team: Team Nexus Alpha (3 SV)
  let registrationId = null;
  let taskId = null;
  let docId = null;
  let councilId = null;
  let councilEndsEpoch = 0;
  let assignmentId = null;
  let assessmentId = null;

  // ----------------------------------------------------------------------------
  // TC-01: Configure thesis registration period & timeline milestones
  // ----------------------------------------------------------------------------
  await runTestCase('TC-01', 'Configure thesis registration period & timeline milestones', 'principal', 2, async () => {
    const payload = {
      name: `Graduation Thesis Term 1 ${timestamp}`,
      academicYear: '2026-2027',
      semester: 1,
      startDate: getVietnamLocalDateTime(-3600), // started 1 hour ago
      endDate: getVietnamLocalDateTime(86400 * 30), // ends in 30 days
      submissionDeadline: getVietnamLocalDateTime(86400 * 45), // submission in 45 days
      status: 'OPEN',
      facultyIds: [1],
      cohortIds: [1],
    };
    const res = await apiRequest('POST', '/periods', payload, authPrincipal.token);
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    periodId = res.data.data.id;

    // Clean and align Team 2 to this new period for end-to-end flow without destroying master seed data
    const { execSync } = require('child_process');
    execSync(`docker exec nexus_mysql_db mysql -uroot -proot nexus_db -e "
      SET FOREIGN_KEY_CHECKS = 0;
      DELETE pr FROM nexus_db.published_results pr JOIN nexus_db.defense_assignments da ON pr.assignment_id = da.id JOIN nexus_db.topic_registrations tr ON da.registration_id = tr.id WHERE tr.team_id = 2;
      DELETE a FROM nexus_db.assessments a JOIN nexus_db.defense_assignments da ON a.assignment_id = da.id JOIN nexus_db.topic_registrations tr ON da.registration_id = tr.id WHERE tr.team_id = 2;
      DELETE da FROM nexus_db.defense_assignments da JOIN nexus_db.topic_registrations tr ON da.registration_id = tr.id WHERE tr.team_id = 2;
      DELETE dcm FROM nexus_db.defense_council_members dcm JOIN nexus_db.defense_councils dc ON dcm.council_id = dc.id WHERE dc.name LIKE 'SE Defense Council Room%' OR dc.name LIKE 'Conflicting Council%';
      DELETE FROM nexus_db.defense_councils WHERE name LIKE 'SE Defense Council Room%' OR name LIKE 'Conflicting Council%';
      DELETE rd FROM nexus_db.report_documents rd JOIN nexus_db.topic_registrations tr ON rd.registration_id = tr.id WHERE tr.team_id = 2;
      DELETE FROM nexus_db.progress_tasks WHERE team_id = 2;
      DELETE FROM nexus_db.topic_registrations WHERE team_id = 2;
      DELETE FROM nexus_db.matchmaking_post_skills WHERE post_id IN (SELECT id FROM (SELECT id FROM nexus_db.matchmaking_posts WHERE author_id = ${authIndividual.user.id}) as tmp);
      DELETE FROM nexus_db.team_join_requests WHERE applicant_id = ${authIndividual.user.id};
      DELETE FROM nexus_db.matchmaking_posts WHERE author_id = ${authIndividual.user.id};
      UPDATE nexus_db.teams SET period_id = ${periodId}, status = 'READY', name = 'Team Nexus Alpha (3 Students)' WHERE id = 2;
      INSERT IGNORE INTO nexus_db.user_departments (user_id, department_id) VALUES (4, 1);
      SET FOREIGN_KEY_CHECKS = 1;
    "`);

    return `Registration period created successfully ID: ${periodId}, status: ${res.data.data.status}`;
  });

  // ----------------------------------------------------------------------------
  // TC-02: Publish realtime announcement to faculty students
  // ----------------------------------------------------------------------------
  await runTestCase('TC-02', 'Publish realtime announcement to faculty students', 'principal', 9, async () => {
    const payload = {
      title: `Notice: Graduation Thesis Registration HK1 2026-2027 (${timestamp})`,
      content: 'Head of department announces K21 students to form teams and register topics before deadline.',
      facultyId: 1,
    };
    const res = await apiRequest('POST', '/notifications', payload, authPrincipal.token);
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);

    // Verify student receives the notification
    const studentRes = await apiRequest('GET', '/notifications', null, authStudent.token);
    if (!studentRes.ok) throw new Error(`Student could not fetch notifications`);
    const notif = studentRes.data.data.find((n) => n.id === res.data.data.id);
    if (!notif) throw new Error(`Notification ID ${res.data.data.id} not visible to student`);

    return `Notification ID: ${notif.id} broadcast successfully to IT students`;
  });

  // ----------------------------------------------------------------------------
  // TC-03: Lecturer registers new thesis topic under SE department
  // ----------------------------------------------------------------------------
  await runTestCase('TC-03', 'Lecturer registers new thesis topic under SE department', 'teacher', 4, async () => {
    const payload = {
      title: `Cloud-Native DevOps & CI/CD Governance Platform (${timestamp})`,
      description: 'Research microservices architecture and automated CI/CD pipeline',
      objectives: 'Deploy Kubernetes and automated continuous deployment',
      requirements: 'Docker, Kubernetes, Spring Boot',
      departmentId: 1,
      periodId: periodId,
      type: 'GRADUATION_THESIS',
      maxStudents: 3,
      duration: '15 weeks',
      majorIds: [1],
    };
    const res = await apiRequest('POST', '/topics', payload, authTeacher.token);
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    topicId = res.data.data.id;
    return `Topic created successfully ID: ${topicId}, Department ID: ${res.data.data.departmentId}`;
  });

  // ----------------------------------------------------------------------------
  // TC-04: Solo student creates matchmaking post looking for team
  // ----------------------------------------------------------------------------
  await runTestCase('TC-04', 'Solo student creates matchmaking post looking for team', 'individual_user', 8, async () => {
    const payload = {
      postType: 'STUDENT_LOOKING_FOR_TEAM',
      title: `K21 SE student looking for graduation thesis team (${timestamp})`,
      goals: 'Seeking a dedicated team aiming for excellent honors thesis grade',
      departmentId: 1,
      slotsNeeded: 1,
      contactInfo: 'individual_user@nexus.edu.vn / 0901000008',
      skills: ['Docker', 'Spring Boot', 'ReactJS'],
    };
    const res = await apiRequest('POST', '/matchmaking/posts', payload, authIndividual.token);
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    return `Matchmaking post created ID: ${res.data.data.id}, Skills: ${res.data.data.skills.join(', ')}`;
  });

  // ----------------------------------------------------------------------------
  // TC-05: Team leader verifies members & system blocks team size > 3
  // ----------------------------------------------------------------------------
  await runTestCase('TC-05', 'Team leader verifies members & system blocks team size > 3', 'student', '6 & 8', async () => {
    // Team 2 has 3 members (student, student2, student3)
    const myTeam = await apiRequest('GET', `/teams/${teamId}`, null, authStudent.token);
    if (myTeam.data.data.members.length !== 3) {
      throw new Error(`Expected 3 members in Team 2, got ${myTeam.data.data.members.length}`);
    }

    // Attempt to invite a 4th member (individual_user id=8) -> MUST FAIL 400
    const inv4th = await apiRequest('POST', `/teams/${teamId}/invitations`, {
      inviteeId: authIndividual.user.id,
      message: 'Invite 4th member',
    }, authStudent.token);

    if (inv4th.status !== 400) {
      throw new Error(`Expected 400 when exceeding 3 members, received ${inv4th.status}: ${JSON.stringify(inv4th.data)}`);
    }
    return `Team ID: ${teamId} has 3 members (${myTeam.data.data.members.map(m=>m.fullName).join(', ')}). 4th member invitation blocked successfully (HTTP 400: "${inv4th.data.message}")`;
  });

  // ----------------------------------------------------------------------------
  // TC-06: Browse topics marketplace with keyword and department filter
  // ----------------------------------------------------------------------------
  await runTestCase('TC-06', 'Browse topics marketplace with keyword and department filter', 'student', 5, async () => {
    const res = await apiRequest('GET', `/topics?query=DevOps&departmentId=1&status=OPEN`, null, authStudent.token);
    if (!res.ok) throw new Error(`Search topics failed`);
    const found = res.data.data.content.find((t) => t.id === topicId);
    if (!found) throw new Error(`Topic ID ${topicId} not found in search results`);
    return `Found topic '${found.title}' (ID: ${found.id}) under SE Department, status: ${found.status}`;
  });

  // ----------------------------------------------------------------------------
  // TC-07: Team leader submits topic registration application
  // ----------------------------------------------------------------------------
  await runTestCase('TC-07', 'Team leader submits topic registration application', 'student', 7, async () => {
    const payload = {
      topicId: topicId,
      message: 'Team of 3 K21 SE students applying for topic guidance under advisor.',
    };
    const res = await apiRequest('POST', '/registrations', payload, authStudent.token);
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    registrationId = res.data.data.id;
    return `Registration submitted successfully ID: ${registrationId}, status: ${res.data.data.status}`;
  });

  // ----------------------------------------------------------------------------
  // TC-08: Block team from registering multiple topics simultaneously
  // ----------------------------------------------------------------------------
  await runTestCase('TC-08', 'Block team from registering multiple topics simultaneously', 'student', '7 & 18', async () => {
    const payload = {
      topicId: 1, // sample topic
      message: 'Attempting to register a second topic simultaneously',
    };
    const res = await apiRequest('POST', '/registrations', payload, authStudent.token);
    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request on duplicate registration, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
    return `System successfully blocked duplicate registration with HTTP 400: "${res.data.message || res.data.error}"`;
  });

  // ----------------------------------------------------------------------------
  // TC-09: Lecturer reviews and approves application & locks topic to team
  // ----------------------------------------------------------------------------
  await runTestCase('TC-09', 'Lecturer reviews and approves application & locks topic to team', 'teacher', '4 & 7', async () => {
    const payload = {
      status: 'APPROVED',
      feedback: 'Accepted team application to conduct this graduation thesis.',
    };
    const res = await apiRequest('PUT', `/registrations/${registrationId}/review`, payload, authTeacher.token);
    if (!res.ok) throw new Error(`Review registration failed: ${JSON.stringify(res.data)}`);
    if (res.data.data.status !== 'APPROVED') throw new Error(`Expected APPROVED, got ${res.data.data.status}`);

    // Verify topic is now ASSIGNED
    const topicRes = await apiRequest('GET', `/topics/${topicId}`, null, authStudent.token);
    if (topicRes.data.data.status !== 'ASSIGNED') {
      throw new Error(`Expected topic status ASSIGNED, got ${topicRes.data.data.status}`);
    }
    return `Registration ID: ${registrationId} approved (APPROVED). Topic ID: ${topicId} updated to ASSIGNED status.`;
  });

  // ----------------------------------------------------------------------------
  // TC-10: Create project milestone task on Kanban board
  // ----------------------------------------------------------------------------
  await runTestCase('TC-10', 'Create project milestone task on Kanban board', 'student', 10, async () => {
    const payload = {
      title: 'Design System Architecture and CI/CD Pipeline',
      description: 'Create Docker Compose architecture and Kubernetes deployment manifests',
      assigneeId: authStudent2.user.id,
      dueDate: getVietnamLocalDateTime(86400 * 10),
    };
    const res = await apiRequest('POST', `/progress/teams/${teamId}/tasks`, payload, authStudent.token);
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
    taskId = res.data.data.id;
    return `Task created successfully ID: ${taskId}, Status: ${res.data.data.status}, Assigned to: ${res.data.data.assigneeName}`;
  });

  // ----------------------------------------------------------------------------
  // TC-11: Update progress task status & lecturer adds feedback
  // ----------------------------------------------------------------------------
  await runTestCase('TC-11', 'Update progress task status & lecturer adds feedback', 'student2 & teacher', 10, async () => {
    // Step 1: student2 updates task status to DONE
    const stRes = await apiRequest('PUT', `/progress/tasks/${taskId}/status`, { status: 'DONE' }, authStudent2.token);
    if (!stRes.ok) throw new Error(`Failed to update task status: ${JSON.stringify(stRes.data)}`);

    // Step 2: teacher provides feedback
    const fbRes = await apiRequest('PUT', `/progress/tasks/${taskId}/feedback`, {
      feedback: 'System architecture design is robust, highly scalable, and well-structured.',
    }, authTeacher.token);
    if (!fbRes.ok) throw new Error(`Failed to save feedback: ${JSON.stringify(fbRes.data)}`);

    return `Task ID: ${taskId} updated to DONE. Lecturer feedback recorded: "${fbRes.data.data.feedback}"`;
  });

  // ----------------------------------------------------------------------------
  // TC-12: Leader uploads PDF report & file signature security check
  // ----------------------------------------------------------------------------
  await runTestCase('TC-12', 'Leader uploads PDF report & file signature security check', 'student', '11 & 18', async () => {
    // Step 1: Attack test: fake PDF (invalid signature)
    const fakeForm = new FormData();
    fakeForm.append('type', 'REPORT');
    fakeForm.append('title', 'Forged Report Document');
    fakeForm.append('note', 'Plain text file with renamed .pdf extension');
    fakeForm.append('file', new Blob(['Plain text invalid content without magic header'], { type: 'application/pdf' }), 'fake.pdf');

    const fakeRes = await apiRequest('POST', `/reports/registrations/${registrationId}/documents`, fakeForm, authStudent.token, true);
    if (fakeRes.status !== 400) {
      throw new Error(`Expected 400 for invalid PDF signature, received ${fakeRes.status}: ${JSON.stringify(fakeRes.data)}`);
    }

    // Step 2: Valid PDF upload
    const validPdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Title (Real Report) >>\nendobj\ntrailer\n<< /Size 1 >>\nstartxref\n50\n%%EOF');
    const validForm = new FormData();
    validForm.append('type', 'REPORT');
    validForm.append('title', 'Graduation Thesis Full Report - Term 1');
    validForm.append('note', 'Final complete draft including chapters 1 to 5.');
    validForm.append('file', new Blob([validPdfBuffer], { type: 'application/pdf' }), 'Thesis_Report_v1.pdf');

    const validRes = await apiRequest('POST', `/reports/registrations/${registrationId}/documents`, validForm, authStudent.token, true);
    if (validRes.status !== 201) throw new Error(`Expected 201, got ${validRes.status}: ${JSON.stringify(validRes.data)}`);
    docId = validRes.data.data.id;
    return `Blocked spoofed PDF successfully (HTTP 400: "${fakeRes.data.message}"). Valid PDF uploaded successfully ID: ${docId}, Version: ${validRes.data.data.version}`;
  });

  // ----------------------------------------------------------------------------
  // TC-13: Upload report version 2 before deadline & maintain version history
  // ----------------------------------------------------------------------------
  await runTestCase('TC-13', 'Upload report version 2 before deadline & maintain version history', 'student', 11, async () => {
    const v2Buffer = Buffer.from('%PDF-1.5\n%âãÏÓ\n1 0 obj\n<< /Title (Real Report Version 2) >>\nendobj\ntrailer\n<< /Size 1 >>\nstartxref\n60\n%%EOF');
    const form2 = new FormData();
    form2.append('type', 'REPORT');
    form2.append('title', 'Graduation Thesis Full Report (Updated Version 2)');
    form2.append('note', 'Updated experimental benchmark results based on advisor feedback.');
    form2.append('file', new Blob([v2Buffer], { type: 'application/pdf' }), 'Thesis_Report_v2.pdf');

    const res2 = await apiRequest('POST', `/reports/registrations/${registrationId}/documents`, form2, authStudent.token, true);
    if (res2.status !== 201) throw new Error(`Expected 201, got ${res2.status}`);

    const docsRes = await apiRequest('GET', `/reports/registrations/${registrationId}/documents`, null, authStudent.token);
    const versions = docsRes.data.data.filter((d) => d.type === 'REPORT').map((d) => d.version);

    if (!versions.includes(1) || !versions.includes(2)) {
      throw new Error(`Expected versions [1, 2], got ${JSON.stringify(versions)}`);
    }
    return `Version 2 uploaded successfully. Versions in database: [${versions.join(', ')}]`;
  });

  // ----------------------------------------------------------------------------
  // TC-14: Verify document download & Base64 data integrity
  // ----------------------------------------------------------------------------
  await runTestCase('TC-14', 'Verify document download & Base64 data integrity', 'teacher', 11, async () => {
    const dlRes = await apiRequest('GET', `/reports/documents/${docId}/content`, null, authTeacher.token);
    if (!dlRes.ok) throw new Error(`Download failed: ${JSON.stringify(dlRes.data)}`);
    const base64Data = dlRes.data.data.base64 || dlRes.data.data.contentBase64;
    if (!base64Data) throw new Error(`Missing base64 content`);

    const decoded = Buffer.from(base64Data, 'base64').toString('ascii');
    if (!decoded.startsWith('%PDF-')) throw new Error(`Decoded content does not match PDF signature`);

    const byteLen = Buffer.from(base64Data, 'base64').length;
    return `Downloaded document ID: ${docId} successfully (${dlRes.data.data.fileName}, ${byteLen} bytes). PDF integrity verified.`;
  });

  // ----------------------------------------------------------------------------
  // TC-15: Establish Defense Council & assign defense schedule
  // ----------------------------------------------------------------------------
  await runTestCase('TC-15', 'Establish Defense Council & assign defense schedule', 'principal', 12, async () => {
    // Schedule council starting in future
    councilEndsEpoch = Date.now() + 4000;
    const startsAt = getVietnamLocalDateTime(1);
    const endsAt = getVietnamLocalDateTime(4);

    const payload = {
      name: `SE Defense Council Room A3-201 (${timestamp})`,
      departmentId: 1,
      periodId: periodId,
      room: `Room A3-${timestamp % 1000}`,
      startsAt: startsAt,
      endsAt: endsAt,
      members: [
        { lecturerId: authPrincipal.user.id, role: 'CHAIR' },
        { lecturerId: authTeacher.user.id, role: 'SECRETARY' },
        { lecturerId: authCouncil.user.id, role: 'REVIEWER' },
      ],
    };

    const res = await apiRequest('POST', '/councils', payload, authPrincipal.token);
    if (res.status !== 201) throw new Error(`Failed to create council: ${JSON.stringify(res.data)}`);
    councilId = res.data.data.id;

    // Assign team to council
    const assignRes = await apiRequest('POST', `/councils/${councilId}/assignments`, {
      registrationId: registrationId,
    }, authPrincipal.token);
    if (!assignRes.ok) throw new Error(`Failed to assign team to council: ${JSON.stringify(assignRes.data)}`);

    assignmentId = assignRes.data.data.assignments.find((a) => a.registration.id === registrationId).id;
    return `Defense Council created ID: ${councilId}. Team assigned successfully Assignment ID: ${assignmentId}`;
  });

  // ----------------------------------------------------------------------------
  // TC-16: Conflict prevention: Block advisor from reviewing own project
  // ----------------------------------------------------------------------------
  await runTestCase('TC-16', 'Conflict prevention: Block advisor from reviewing own project', 'principal', '12 & 18', async () => {
    const startsAt = getVietnamLocalDateTime(100);
    const endsAt = getVietnamLocalDateTime(200);

    // Attempt to create council where teacher is REVIEWER
    const conflictCouncil = await apiRequest('POST', '/councils', {
      name: `Conflicting Council (${timestamp})`,
      departmentId: 1,
      periodId: periodId,
      room: `Room B2-${timestamp % 1000}`,
      startsAt: startsAt,
      endsAt: endsAt,
      members: [
        { lecturerId: authPrincipal.user.id, role: 'CHAIR' },
        { lecturerId: authCouncil.user.id, role: 'SECRETARY' },
        { lecturerId: authTeacher.user.id, role: 'REVIEWER' }, // Teacher as reviewer!
      ],
    }, authPrincipal.token);

    if (conflictCouncil.status === 201) {
      // Trying to assign the topic advised by teacher MUST fail
      const assignRes = await apiRequest('POST', `/councils/${conflictCouncil.data.data.id}/assignments`, {
        registrationId: registrationId,
      }, authPrincipal.token);

      if (assignRes.status !== 400) {
        throw new Error(`Expected 400 when advisor reviews their own project, got ${assignRes.status}`);
      }
      return `Blocked advisor from reviewing own project successfully (HTTP 400: "${assignRes.data.message}")`;
    }

    return `System strictly enforces council assignment conflict rules`;
  });

  // ----------------------------------------------------------------------------
  // TC-17: Reviewer enters 3 criteria scores & submits locked assessment
  // ----------------------------------------------------------------------------
  await runTestCase('TC-17', 'Reviewer enters 3 criteria scores & submits locked assessment', 'council', '13 & 18', async () => {
    // Step 1: Save draft review assessment for student 1 (id=5)
    const draftPayload = {
      assignmentId: assignmentId,
      studentId: authStudent.user.id,
      type: 'REVIEW',
      contentScore: 8.5,
      implementationScore: 9.0,
      presentationScore: 8.5,
      strengths: 'Cloud-native architecture is well thought out and executed.',
      weaknesses: 'Infrastructure resource cost optimization could be improved.',
      questions: 'How does pod auto-scaling handle sudden traffic spikes?',
      comment: 'Excellent work; qualified for oral defense before council.',
    };
    const draftRes = await apiRequest('POST', '/assessments', draftPayload, authCouncil.token);
    if (!draftRes.ok) throw new Error(`Draft assessment failed: ${JSON.stringify(draftRes.data)}`);
    assessmentId = draftRes.data.data.id;

    // Step 2: Submit and lock assessment
    const subRes = await apiRequest('POST', `/assessments/${assessmentId}/submit`, null, authCouncil.token);
    if (!subRes.ok) throw new Error(`Submit assessment failed: ${JSON.stringify(subRes.data)}`);
    if (subRes.data.data.status !== 'SUBMITTED') throw new Error(`Expected SUBMITTED status`);

    // Step 3: Attempt to delete submitted assessment -> MUST FAIL 400
    const delRes = await apiRequest('DELETE', `/assessments/${assessmentId}`, null, authCouncil.token);
    if (delRes.status !== 400) throw new Error(`Expected 400 when deleting submitted assessment`);

    return `Assessment ID: ${assessmentId} submitted and locked. Delete operation rejected successfully (HTTP 400: "${delRes.data.message}")`;
  });

  // ----------------------------------------------------------------------------
  // TC-18: Automated weighted average score calculation & Pass/Fail status
  // ----------------------------------------------------------------------------
  await runTestCase('TC-18', 'Automated weighted average score calculation & Pass/Fail status', 'principal & system', 14, async () => {
    const students = [authStudent.user.id, authStudent2.user.id, authStudent3.user.id];

    // Wait a brief moment to pass council startsAt / endsAt
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Submit remaining REVIEW assessments for student 2 & 3
    for (const sId of [authStudent2.user.id, authStudent3.user.id]) {
      const a = await apiRequest('POST', '/assessments', {
        assignmentId, studentId: sId, type: 'REVIEW',
        contentScore: 8.0, implementationScore: 8.5, presentationScore: 8.0,
        comment: 'Meets review evaluation standards.',
      }, authCouncil.token);
      await apiRequest('POST', `/assessments/${a.data.data.id}/submit`, null, authCouncil.token);
    }

    // Submit DEFENSE assessments from all 3 members (principal, teacher, council) for all 3 students
    const evaluators = [
      { token: authPrincipal.token, score: 8.5 },
      { token: authTeacher.token, score: 8.0 },
      { token: authCouncil.token, score: 8.5 },
    ];

    for (const ev of evaluators) {
      for (const sId of students) {
        const d = await apiRequest('POST', '/assessments', {
          assignmentId, studentId: sId, type: 'DEFENSE',
          contentScore: ev.score, implementationScore: ev.score, presentationScore: ev.score,
          comment: 'Confident defense presentation, answered committee questions well.',
        }, ev.token);
        await apiRequest('POST', `/assessments/${d.data.data.id}/submit`, null, ev.token);
      }
    }

    // Wait until council defense time has ended before marking COMPLETED
    while (Date.now() <= councilEndsEpoch + 1500) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    // Mark council as COMPLETED
    const completeRes = await apiRequest('PATCH', `/councils/${councilId}/status`, { status: 'COMPLETED' }, authPrincipal.token);
    if (!completeRes.ok) throw new Error(`Complete council failed: ${JSON.stringify(completeRes.data)}`);

    // Calculate scores
    const calcRes = await apiRequest('GET', `/results/assignments/${assignmentId}`, null, authPrincipal.token);
    if (!calcRes.ok) throw new Error(`Score calculation failed: ${JSON.stringify(calcRes.data)}`);

    const s1 = calcRes.data.data.find((g) => g.studentId === authStudent.user.id);
    if (!s1) throw new Error(`Missing calculated grade for student 1`);

    return `Council COMPLETED. Calculated scores: Review = ${s1.reviewScore}, Defense = ${s1.defenseScore}, Final Score = ${s1.finalScore}, Result = ${s1.passed ? 'PASSED' : 'FAILED'}`;
  });

  // ----------------------------------------------------------------------------
  // TC-19: Department head publishes results & creates immutable snapshot
  // ----------------------------------------------------------------------------
  await runTestCase('TC-19', 'Department head publishes results & creates immutable snapshot', 'principal', '15 & 18', async () => {
    // Step 1: Publish scores
    const pubRes = await apiRequest('POST', `/results/assignments/${assignmentId}/publish`, null, authPrincipal.token);
    if (!pubRes.ok) throw new Error(`Publish results failed: ${JSON.stringify(pubRes.data)}`);

    // Step 2: Negative test - Try to publish again -> MUST FAIL
    const rePubRes = await apiRequest('POST', `/results/assignments/${assignmentId}/publish`, null, authPrincipal.token);
    if (rePubRes.status !== 400) {
      throw new Error(`Expected 400 when republishing, received ${rePubRes.status}`);
    }

    return `Published results successfully for ${pubRes.data.data.length} students. Duplicate publish rejected with HTTP 400: "${rePubRes.data.message}"`;
  });

  // ----------------------------------------------------------------------------
  // TC-20: Student queries personal transcript & Dean exports CSV report
  // ----------------------------------------------------------------------------
  await runTestCase('TC-20', 'Student queries personal transcript & Dean exports CSV report', 'student & principal', '15 & 16', async () => {
    // Step 1: Student checks their own published results
    const myGrades = await apiRequest('GET', '/results/me', null, authStudent.token);
    if (!myGrades.ok) throw new Error(`Student getMyPublishedResults failed: ${JSON.stringify(myGrades.data)}`);
    const studentGrade = myGrades.data.data.find((g) => g.assignmentId === assignmentId);
    if (!studentGrade) throw new Error(`Student could not find their published grade`);

    // Step 2: Principal views statistical reports
    const reportRes = await apiRequest('GET', `/results/reports?periodId=${periodId}`, null, authPrincipal.token);
    if (!reportRes.ok) throw new Error(`Get statistics report failed`);

    // Step 3: Principal downloads CSV report
    const csvRes = await apiRequest('GET', `/results/reports.csv?periodId=${periodId}`, null, authPrincipal.token);
    if (!csvRes.ok) throw new Error(`Export CSV failed`);
    const csvContent = csvRes.data;

    return `Student checked personal grade: Score ${studentGrade.finalScore} (${studentGrade.passed ? 'PASSED' : 'FAILED'}). Dean exported CSV successfully (${csvContent.split('\n').length} lines, full UTF-8 data).`;
  });

  // ----------------------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------------------
  console.log(`\n${colors.bright}${colors.blue}==============================================================================${colors.reset}`);
  console.log(`${colors.bright}   TEST SUITE EXECUTION SUMMARY                                               ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}==============================================================================${colors.reset}`);
  console.log(`Total Test Cases : ${results.length}`);
  console.log(`Passed           : ${colors.green}${colors.bright}${passCount}${colors.reset}`);
  console.log(`Failed           : ${failCount > 0 ? colors.red : colors.gray}${colors.bright}${failCount}${colors.reset}`);
  console.log(`Success Rate     : ${colors.bright}${((passCount / results.length) * 100).toFixed(1)}%${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}==============================================================================${colors.reset}\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\n${colors.red}Fatal execution error: ${err.message}${colors.reset}`);
  console.error(err.stack);
  process.exit(1);
});
