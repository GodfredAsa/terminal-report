/**
 * Subject scores: single score per subject.
 * Generates a printable terminal-style report.
 */

const subjectRows = document.getElementById('subjectRows');
const addSubjectBtn = document.getElementById('addSubject');
const generateReportBtn = document.getElementById('generateReport');
const printReportBtn = document.getElementById('printReport');
const reportSection = document.getElementById('reportSection');
const reportContent = document.getElementById('reportContent');

// Static assets (no uploads in UI).
const schoolLogoDataUrl = 'dynamic-logo.jpeg';
const backgroundImageDataUrl = 'adinkra-bnw.webp';

function getSubjectRowHtml() {
  const div = document.createElement('div');
  div.className = 'subject-row grid grid-cols-1 md:grid-cols-12 gap-2 items-center';
  div.innerHTML = `
    <input type="text" placeholder="Subject" class="subject-name col-span-2 md:col-span-2 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm" />
    <input type="number" placeholder="Exam" min="0" max="60" class="exam-score col-span-1 md:col-span-1 bg-slate-700 border border-slate-600 rounded px-2 py-2 text-sm" />
    <input type="number" placeholder="Class" min="0" max="40" class="classwork-score col-span-1 md:col-span-1 bg-slate-700 border border-slate-600 rounded px-2 py-2 text-sm" />
    <span class="subject-sum col-span-1 text-amber-400 text-sm font-medium" title="Sum (Exam + Class)">—</span>
    <input type="text" placeholder="Grade" class="subject-grade col-span-1 md:col-span-1 bg-slate-700 border border-slate-600 rounded px-2 py-2 text-sm" maxlength="3" />
    <input type="text" placeholder="Remarks" class="subject-remarks col-span-2 md:col-span-2 bg-slate-700 border border-slate-600 rounded px-2 py-2 text-sm" />
    <button type="button" class="remove-row col-span-1 text-red-400 hover:text-red-300 text-sm" title="Remove">×</button>
  `;
  return div;
}

/** Grading system: A+ 90–100, A 80–89, A− 75–79, B+ 70–74, B 65–69, B− 60–64, C+ 55–59, C 50–54, C− 45–49, D+ 40–44, D 35–39, D− 30–34, E 0–29 */
const GRADING_SCALE = [
  { min: 90, grade: 'A+' },
  { min: 80, grade: 'A' },
  { min: 75, grade: 'A-' },
  { min: 70, grade: 'B+' },
  { min: 65, grade: 'B' },
  { min: 60, grade: 'B-' },
  { min: 55, grade: 'C+' },
  { min: 50, grade: 'C' },
  { min: 45, grade: 'C-' },
  { min: 40, grade: 'D+' },
  { min: 35, grade: 'D' },
  { min: 30, grade: 'D-' },
  { min: 0, grade: 'E' },
];

// Subject scoring rules: Exam contributes 60%, Classwork contributes 40%.
// Total used for grade calculation is always in the 0–100 range.
const EXAM_MAX = 60;
const CLASS_MAX = 40;
const TOTAL_MAX = EXAM_MAX + CLASS_MAX;

function gradeFromPercentage(pct) {
  const score = Math.min(100, Math.max(0, Number(pct) || 0));
  const entry = GRADING_SCALE.find((e) => score >= e.min);
  return entry ? entry.grade : 'E';
}

function pointsFromGrade(grade) {
  const g = String(grade).toUpperCase().replace(/\s/g, '');
  if (g === 'A+') return 12;
  if (g === 'A') return 11;
  if (g === 'A-') return 10;
  if (g === 'B+') return 9;
  if (g === 'B') return 8;
  if (g === 'B-') return 7;
  if (g === 'C+') return 6;
  if (g === 'C') return 5;
  if (g === 'C-') return 4;
  if (g === 'D+') return 3;
  if (g === 'D') return 2;
  if (g === 'D-') return 1;
  if (g === 'E') return 0;
  return '';
}

/** Suggested remarks by grade: Excellent, Very Good, Good, etc. */
function gradeToRemark(grade) {
  const g = String(grade).toUpperCase().replace(/\s/g, '');
  if (g === 'A+') return 'Excellent';
  if (g === 'A' || g === 'A-') return 'Very Good';
  if (g === 'B+' || g === 'B' || g === 'B-') return 'Good';
  if (g === 'C+' || g === 'C') return 'Average';
  if (g === 'C-') return 'Below Average';
  if (g === 'D+' || g === 'D' || g === 'D-') return 'Poor';
  if (g === 'E') return 'Very Poor';
  return '';
}

function updateSumDisplay(row) {
  const exam = parseFloat(row.querySelector('.exam-score').value) || 0;
  const classwork = parseFloat(row.querySelector('.classwork-score').value) || 0;
  const sumEl = row.querySelector('.subject-sum');
  if (sumEl) sumEl.textContent = (exam > 0 || classwork > 0) ? Math.min(TOTAL_MAX, exam + classwork) : '—';
}

function updateGradeAndRemarksFromScores(row) {
  const examInput = row.querySelector('.exam-score');
  const classInput = row.querySelector('.classwork-score');
  const gradeInput = row.querySelector('.subject-grade');
  const remarksInput = row.querySelector('.subject-remarks');
  const exam = parseFloat(examInput.value) || 0;
  const classwork = parseFloat(classInput.value) || 0;
  updateSumDisplay(row);
  if (exam === 0 && classwork === 0) {
    if (gradeInput) gradeInput.value = '';
    if (remarksInput) remarksInput.value = '';
    return;
  }
  const total = Math.min(TOTAL_MAX, exam + classwork);
  const grade = gradeFromPercentage(total);
  const remark = gradeToRemark(grade);
  if (gradeInput) gradeInput.value = grade;
  if (remarksInput) remarksInput.value = remark;
}

function enforceExamClassSum(row, changedField) {
  const examInput = row.querySelector('.exam-score');
  const classInput = row.querySelector('.classwork-score');

  // Only correct when values exceed limits; don't force empty fields into "0".
  const examRaw = examInput.value;
  const classRaw = classInput.value;
  let exam = examRaw === '' ? null : Number(examRaw);
  let classwork = classRaw === '' ? null : Number(classRaw);

  if (exam !== null && !Number.isNaN(exam) && exam > EXAM_MAX) {
    exam = EXAM_MAX;
    examInput.value = String(exam);
  }
  if (classwork !== null && !Number.isNaN(classwork) && classwork > CLASS_MAX) {
    classwork = CLASS_MAX;
    classInput.value = String(classwork);
  }

  const examNum = (exam === null || Number.isNaN(exam)) ? 0 : exam;
  const classNum = (classwork === null || Number.isNaN(classwork)) ? 0 : classwork;

  if (examNum + classNum > TOTAL_MAX) {
    if (changedField === 'exam') {
      const allowedExam = Math.min(EXAM_MAX, TOTAL_MAX - classNum);
      examInput.value = String(allowedExam);
    } else {
      const allowedClass = Math.min(CLASS_MAX, TOTAL_MAX - examNum);
      classInput.value = String(allowedClass);
    }
  }
}

function bindRowEvents(row) {
  const onScoreChange = (field) => {
    enforceExamClassSum(row, field);
    updateGradeAndRemarksFromScores(row);
  };
  row.querySelector('.exam-score').addEventListener('input', () => onScoreChange('exam'));
  row.querySelector('.classwork-score').addEventListener('input', () => onScoreChange('class'));
  row.querySelector('.remove-row').addEventListener('click', () => {
    if (subjectRows.children.length > 1) row.remove();
  });
}

addSubjectBtn.addEventListener('click', () => {
  const row = getSubjectRowHtml();
  subjectRows.appendChild(row);
  bindRowEvents(row);
});

subjectRows.querySelectorAll('.subject-row').forEach(bindRowEvents);

function getSubjectsData() {
  const rows = subjectRows.querySelectorAll('.subject-row');
  return Array.from(rows).map((row) => {
    const name = row.querySelector('.subject-name').value.trim() || 'Subject';
    let exam = parseFloat(row.querySelector('.exam-score').value) || 0;
    let classwork = parseFloat(row.querySelector('.classwork-score').value) || 0;

    // Enforce max contribution per field.
    exam = Math.min(EXAM_MAX, Math.max(0, exam));
    classwork = Math.min(CLASS_MAX, Math.max(0, classwork));

    // Re-correct if the combined total is somehow above 100.
    if (exam + classwork > TOTAL_MAX) {
      classwork = Math.min(CLASS_MAX, Math.max(0, TOTAL_MAX - exam));
    }

    const total = Math.min(TOTAL_MAX, exam + classwork);
    const gradeInput = row.querySelector('.subject-grade');
    const remarksInput = row.querySelector('.subject-remarks');
    let grade = (gradeInput && gradeInput.value.trim()) || '';
    let remarks = (remarksInput && remarksInput.value.trim()) || '';
    if (!grade && (exam > 0 || classwork > 0)) grade = gradeFromPercentage(total);
    if (!remarks && grade) remarks = gradeToRemark(grade);
    const points = grade ? pointsFromGrade(grade) : '';
    return { name, exam, classwork, total, grade, points, remarks };
  }).filter((s) => s.exam > 0 || s.classwork > 0);
}

function getReportFormData() {
  const get = (id) => (document.getElementById(id) && document.getElementById(id).value) || '';
  const balance = parseFloat(get('feesBalance')) || 0;
  const nextTerm = parseFloat(get('feesNextTerm')) || 0;
  const totalDue = balance + nextTerm;
  return {
    organization: get('organization'),
    schoolName: get('schoolName'),
    department: get('department'),
    schoolAddress: get('schoolAddress'),
    studentName: get('studentName'),
    reportYear: get('reportYear'),
    termSession: get('termSession'),
    reportClass: get('reportClass'),
    reportDate: get('reportDate'),
    attendance: get('attendance'),
    expectedAttendance: get('expectedAttendance'),
    vacationDate: get('vacationDate'),
    classTeacher: get('classTeacher'),
    classTeacherRemarks: get('classTeacherRemarks'),
    headteacherRemarks: get('headteacherRemarks'),
    feesBalance: get('feesBalance'),
    feesNextTerm: get('feesNextTerm'),
    totalDue: String(totalDue),
  };
}

const REQUIRED_FIELDS = [
  'department', 'studentName', 'reportYear', 'termSession',
  'reportClass', 'reportDate', 'classTeacher',
  'feesBalance', 'feesNextTerm'
];

const FIELD_LABELS = {
  department: 'Department',
  studentName: 'Student name', reportYear: 'Year', termSession: 'Term',
  reportClass: 'Form/Class', reportDate: 'Report date', classTeacher: 'Class teacher',
  headteacherRemarks: "Headteacher's comments",
  feesBalance: 'Fees balance', feesNextTerm: 'Fees for next term'
};

function validateRequired() {
  const missing = [];
  REQUIRED_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el || !String(el.value || '').trim()) missing.push(FIELD_LABELS[id] || id);
  });
  return missing;
}

function buildTerminalReport(subjects, form) {
  const f = form || getReportFormData();
  const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const logoHtml = schoolLogoDataUrl
    ? `<img src="${schoolLogoDataUrl.replace(/"/g, '&quot;')}" alt="School logo" />`
    : '<span>Logo</span>';
  const watermarkClass = backgroundImageDataUrl ? 'report-watermark' : 'report-watermark no-bg-image';

  // Static school name (no user input).
  const schoolName = escapeHtml('DYNAMIC DIVINE ACADEMY');
  const schoolAddress = f.schoolAddress ? escapeHtml(f.schoolAddress) : '';

  const subjectRowsHtml = subjects.map((s) =>
    `<tr><td class="col-subject">${escapeHtml(s.name)}</td><td>${s.exam}</td><td>${s.classwork}</td><td>${s.total}</td><td>${escapeHtml(s.grade)}</td><td>${s.points !== '' ? s.points : ''}</td><td>${escapeHtml(s.remarks)}</td></tr>`
  ).join('');

  const attendanceText = f.attendance ? escapeHtml(f.attendance) : '';
  const expectedAttendanceText = f.expectedAttendance ? escapeHtml(f.expectedAttendance) : '';
  const vacationDateText = f.vacationDate ? escapeHtml(f.vacationDate) : '';

  return `
<div class="${watermarkClass}" aria-hidden="true"></div>
<div class="report-inner">
  <div class="report-header">
    <div class="report-logo">${logoHtml}</div>
    <div class="report-school-block">
      <div class="report-school-name">${schoolName}</div>
      ${schoolAddress ? `<div class="report-school-address">${schoolAddress}</div>` : ''}
    </div>
  </div>
  <div class="report-title-row">
    <span class="report-title">TERMINAL REPORT FORM</span>
    <span class="report-year-term">YEAR ${escapeHtml(f.reportYear || '')} &nbsp; TERM ${escapeHtml(f.termSession || '')}</span>
  </div>
  <div class="report-student-line">
    <span><strong>Name</strong> ${escapeHtml(f.studentName || '')}</span>
    <span><strong>${escapeHtml(f.reportClass || 'FORM')}</strong></span>
    <span><strong>Attendance</strong> ${attendanceText}</span>
    <span><strong>Expected Attendance</strong> ${expectedAttendanceText}</span>
    <span><strong>Vacation</strong> ${vacationDateText}</span>
  </div>
  <table class="report-table">
    <thead>
      <tr>
        <th>SUBJECTS</th>
        <th>EXAM</th>
        <th>CLASS</th>
        <th>SUM</th>
        <th>Grade</th>
        <th>POINTS</th>
        <th>REMARKS</th>
      </tr>
    </thead>
    <tbody>${subjectRowsHtml}</tbody>
  </table>
  <div class="report-grade-key">
    <strong>KEY</strong>
    A+: 90–100 &nbsp; A: 80–89 &nbsp; A−: 75–79 &nbsp; B+: 70–74 &nbsp; B: 65–69 &nbsp; B−: 60–64 &nbsp; C+: 55–59 &nbsp; C: 50–54 &nbsp; C−: 45–49 &nbsp; D+: 40–44 &nbsp; D: 35–39 &nbsp; D−: 30–34 &nbsp; E: 0–29
  </div>
  <div class="report-remarks-section">
    <div class="line"><span class="label">Class Teacher's Comments:</span><span class="dotted">${escapeHtml(f.classTeacherRemarks || '')}</span></div>
    <div class="line"><span class="label">Headteacher's/Deputy Headteacher's Comments:</span><span class="dotted">${escapeHtml(f.headteacherRemarks || '')}</span></div>
    <div class="line"><span class="label">Report seen by Parent/Guardian:</span><span class="dotted"></span> <span class="label">Signature:</span><span class="dotted"></span></div>
  </div>
  <div class="report-fees-box">
    <strong>FEES RECORD</strong>
    <div>Fees Balance: ${escapeHtml(f.feesBalance || '')}</div>
    <div>Fees for next term: ${escapeHtml(f.feesNextTerm || '')}</div>
    <div>Total due on opening day GHS: ${escapeHtml(f.totalDue || '')}</div>
  </div>
</div>
  `.trim();
}

generateReportBtn.addEventListener('click', () => {
  const missing = validateRequired();
  if (missing.length > 0) {
    alert('Please fill all required fields: ' + missing.slice(0, 5).join(', ') + (missing.length > 5 ? ' ...' : ''));
    return;
  }
  const subjects = getSubjectsData();
  if (subjects.length === 0) {
    alert('Add at least one subject with an exam or class score.');
    return;
  }
  const formData = getReportFormData();
  reportContent.innerHTML = buildTerminalReport(subjects, formData);
  const watermarkEl = reportContent.querySelector('.report-watermark:not(.no-bg-image)');
  if (watermarkEl && backgroundImageDataUrl) watermarkEl.style.backgroundImage = `url("${backgroundImageDataUrl.replace(/"/g, '\\"')}")`;
  reportSection.classList.remove('hidden');
  reportSection.setAttribute('aria-hidden', 'false');
});

// ---- CSV multi-report generation ----
const csvFileInput = document.getElementById('csvFile');
const loadCsvBtn = document.getElementById('loadCsvBtn');
const csvStatus = document.getElementById('csvStatus');
const csvReportsContainer = document.getElementById('csvReportsContainer');

// Template buttons / guide modal
const dataTemplateBtn = document.getElementById('dataTemplateBtn');
const templateGuideBtn = document.getElementById('templateGuideBtn');
const templateGuideModal = document.getElementById('templateGuideModal');
const closeTemplateGuideBtn = document.getElementById('closeTemplateGuideBtn');
const templateGuideText = document.getElementById('templateGuideText');

const CSV_TEMPLATE_HEADER = 'reportId,department,schoolAddress,studentName,reportClass,termSession,reportYear,reportDate,attendance,expectedAttendance,vacationDate,classTeacher,classTeacherRemarks,headteacherRemarks,feesBalance,feesNextTerm,subjectName,examScore,classworkScore';

const TEMPLATE_GUIDE_TEXT = `CSV format (long format)
One CSV row = one subject line.
Rows are grouped by "reportId" to generate one report per student.

Required CSV headers:
reportId, department, schoolAddress, studentName, reportClass, termSession, reportYear, reportDate,
attendance, expectedAttendance, vacationDate,
classTeacher, classTeacherRemarks, headteacherRemarks,
feesBalance, feesNextTerm,
subjectName, examScore, classworkScore

Notes:
- grade and remarks are system-generated from examScore + classworkScore (so DO NOT include them).
- examScore max = 60, classworkScore max = 40.
- If examScore + classworkScore exceed 100, the app auto-corrects within limits.`;

function openTemplateGuide() {
  if (!templateGuideModal) return;
  if (templateGuideText) templateGuideText.textContent = TEMPLATE_GUIDE_TEXT;
  templateGuideModal.classList.remove('hidden');
  templateGuideModal.setAttribute('aria-hidden', 'false');
}

function closeTemplateGuide() {
  if (!templateGuideModal) return;
  templateGuideModal.classList.add('hidden');
  templateGuideModal.setAttribute('aria-hidden', 'true');
}

if (dataTemplateBtn) {
  dataTemplateBtn.addEventListener('click', () => {
    // Download a header-only CSV (no sample student/subject rows).
    const blob = new Blob([`${CSV_TEMPLATE_HEADER}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_reports.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  });
}

if (templateGuideBtn) {
  templateGuideBtn.addEventListener('click', () => {
    const url = 'https://drive.google.com/file/d/1RmZEYyvTA7-4lWnPP3TJwfuNKKbkgxQ6/view?usp=sharing';
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

if (closeTemplateGuideBtn) {
  closeTemplateGuideBtn.addEventListener('click', () => closeTemplateGuide());
}

if (templateGuideModal) {
  templateGuideModal.addEventListener('click', (e) => {
    if (e.target === templateGuideModal) closeTemplateGuide();
  });
}

function parseCsv2D(text) {
  // Minimal CSV parser: quoted fields may include commas and escaped quotes ("").
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      field = '';
      if (row.some((c) => String(c).trim() !== '')) rows.push(row);
      row = [];
    } else if (ch === '\r') {
      // ignore
    } else {
      field += ch;
    }
  }

  // Flush last line
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => String(c).trim() !== '')) rows.push(row);
  }

  return rows;
}

function normalizeCsvNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeSubjectFromCsv(subjectName, examScore, classworkScore) {
  const name = String(subjectName || '').trim();
  if (!name) return null;

  let exam = Math.min(EXAM_MAX, Math.max(0, normalizeCsvNumber(examScore)));
  let classwork = Math.min(CLASS_MAX, Math.max(0, normalizeCsvNumber(classworkScore)));

  if (exam + classwork > TOTAL_MAX) {
    classwork = Math.min(CLASS_MAX, Math.max(0, TOTAL_MAX - exam));
  }

  const total = Math.min(TOTAL_MAX, exam + classwork);
  if (exam === 0 && classwork === 0) return null;

  const grade = gradeFromPercentage(total);
  const remarks = gradeToRemark(grade);
  const points = pointsFromGrade(grade);

  return { name, exam, classwork, total, grade, points, remarks };
}

function printReportWithData(subjects, formData, reportId) {
  // Open a dedicated print page so the CSV list page doesn't change.
  const reportHtml = buildTerminalReport(subjects, formData);

  const w = window.open('', '_blank');
  if (!w) {
    alert('Please allow popups to download/print PDFs.');
    return;
  }

  const department = formData && formData.department ? String(formData.department) : '';
  const studentName = formData && formData.studentName ? String(formData.studentName) : '';
  const termSession = formData && formData.termSession ? String(formData.termSession) : '';
  const safeReportId = sanitizeFilenamePart(reportId);
  const safeDepartment = sanitizeFilenamePart(department);
  const safeStudentName = sanitizeFilenamePart(studentName);
  // Keep TERM exactly as in CSV (including spaces/case), but strip illegal filename characters.
  const safeTerm = sanitizeFilenamePartPreserveSpaces(termSession);
  const printTitle = `${safeReportId}-${safeDepartment}-${safeStudentName}-${safeTerm}`;

  const bgUrlEscaped = String(backgroundImageDataUrl || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'');
  const baseHrefEscaped = String(document.baseURI || window.location.href)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '&quot;');

  w.document.open();
  w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <base href="${baseHrefEscaped}" />
  <title>${printTitle}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="report-border">
    <div class="report-sheet">${reportHtml}</div>
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () {
        var el = document.querySelector('.report-watermark:not(.no-bg-image)');
        if (el) el.style.backgroundImage = "url('${bgUrlEscaped}')"; 
        window.print();
      }, 50);
    };
  </script>
</body>
</html>`);
  w.document.close();
}

function sanitizeFilenamePartPreserveSpaces(s) {
  return String(s || '')
    .trim()
    // Remove characters disallowed in filenames, but do not replace spaces.
    .replace(/[/\\:*?"<>|]/g, '') || 'Report';
}

async function handleCsvLoad() {
  if (!csvFileInput || !loadCsvBtn || !csvReportsContainer || !csvStatus) return;

  if (!csvFileInput.files || csvFileInput.files.length === 0) {
    csvStatus.textContent = 'Please choose a CSV file first.';
    return;
  }

  const file = csvFileInput.files[0];
  csvStatus.textContent = `Reading ${file.name}...`;
  csvReportsContainer.innerHTML = '';

  const text = await file.text();
  const rows2D = parseCsv2D(text);
  if (rows2D.length < 2) {
    csvStatus.textContent = 'CSV is empty or missing rows.';
    return;
  }

  const headerRow = rows2D[0];
  const headers = headerRow.map((h) => String(h).trim().toLowerCase());

  const rowObjects = rows2D.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] ?? '';
    });
    return obj;
  });

  // Group rows by reportId (one reportId => multiple subject rows => one printable report)
  const reportsById = new Map();
  const order = [];

  for (const r of rowObjects) {
    const reportId = String(r.reportid || '').trim();
    if (!reportId) continue;

    if (!reportsById.has(reportId)) {
      const feesBalance = normalizeCsvNumber(r.feesbalance);
      const feesNextTerm = normalizeCsvNumber(r.feesnextterm);
      reportsById.set(reportId, {
        meta: {
          department: String(r.department || ''),
          schoolAddress: String(r.schooladdress || ''),
          studentName: String(r.studentname || ''),
          reportClass: String(r.reportclass || ''),
          termSession: String(r.termsession || ''),
          reportYear: String(r.reportyear || ''),
          reportDate: String(r.reportdate || ''),
          attendance: String(r.attendance || ''),
          expectedAttendance: String(r.expectedattendance || ''),
          vacationDate: String(r.vacationdate || ''),
          classTeacher: String(r.classteacher || ''),
          classTeacherRemarks: String(r.classteacherremarks || ''),
          headteacherRemarks: String(r.headteacherremarks || ''),
          feesBalance: String(feesBalance),
          feesNextTerm: String(feesNextTerm),
          totalDue: String(feesBalance + feesNextTerm),
        },
        subjects: [],
      });
      order.push(reportId);
    }

    const group = reportsById.get(reportId);
    const subject = normalizeSubjectFromCsv(r.subjectname, r.examscore, r.classworkscore);
    if (subject) group.subjects.push(subject);
  }

  const grouped = order
    .map((id) => ({ id, group: reportsById.get(id) }))
    .filter((x) => x.group && x.group.subjects.length > 0);

  if (grouped.length === 0) {
    csvStatus.textContent = 'No valid reports found (check reportId and subject scores).';
    return;
  }

  csvStatus.textContent = `Found ${grouped.length} report(s).`;
  csvReportsContainer.innerHTML = '';

  for (const { id, group } of grouped) {
    const meta = group.meta;
    const studentLabel = meta.studentName || 'Student';
    const reportLabel = [meta.reportClass, meta.termSession].filter(Boolean).join(' ');
    const subjectsCount = group.subjects.length;

    const details = document.createElement('details');
    details.className = 'bg-slate-800/50 border border-slate-600/60 rounded-lg p-3';
    details.open = false;
    details.innerHTML = `
      <summary class="cursor-pointer list-none">
        <div class="min-w-0">
          <div class="text-slate-200 font-semibold text-sm truncate">${escapeHtmlForUi(studentLabel)}</div>
          <div class="text-slate-400 text-xs truncate">${escapeHtmlForUi(reportLabel || 'Report')} • ${subjectsCount} subject(s)</div>
        </div>
      </summary>
      <div class="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div class="text-slate-400 text-xs">
          Department: ${escapeHtmlForUi(meta.department || '—')} • Date: ${escapeHtmlForUi(meta.reportDate || '—')}
        </div>
        <button type="button" class="csv-print-btn px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition">
          Print / Download PDF
        </button>
      </div>
    `;

    const btn = details.querySelector('.csv-print-btn');
    btn.addEventListener('click', () => {
      printReportWithData(group.subjects, meta, id);
    });

    csvReportsContainer.appendChild(details);
  }
}

function escapeHtmlForUi(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

if (loadCsvBtn) {
  loadCsvBtn.addEventListener('click', () => {
    handleCsvLoad().catch((err) => {
      console.error(err);
      if (csvStatus) csvStatus.textContent = 'Failed to load CSV. Check formatting and headers.';
    });
  });
}

/** Sanitize a string for use in a PDF filename (no path chars, no spaces → underscores). */
function sanitizeFilenamePart(s) {
  return String(s || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Report';
}

printReportBtn.addEventListener('click', () => {
  const form = getReportFormData();
  const studentName = sanitizeFilenamePart(form.studentName);
  const reportClass = sanitizeFilenamePart(form.reportClass);
  const termSession = sanitizeFilenamePart(form.termSession);
  const date = (form.reportDate && form.reportDate.trim()) ? form.reportDate.trim() : new Date().toISOString().slice(0, 10);
  const printTitle = `${studentName}_${reportClass}_${termSession}_${date}`;
  const previousTitle = document.title;
  document.title = printTitle;
  window.print();
  window.onafterprint = () => {
    document.title = previousTitle;
    window.onafterprint = null;
  };
});

document.getElementById('closeReportModal').addEventListener('click', () => {
  reportSection.classList.add('hidden');
  reportSection.setAttribute('aria-hidden', 'true');
});
