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

let schoolLogoDataUrl = null;
let backgroundImageDataUrl = null;

function setupImageUpload(inputId, buttonId, labelId, previewId, onDataUrl) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(buttonId);
  const label = document.getElementById(labelId);
  const preview = previewId ? document.getElementById(previewId) : null;
  if (!input || !btn) return;
  btn.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      onDataUrl(dataUrl);
      if (label) label.textContent = file.name;
      if (preview && dataUrl) {
        preview.classList.remove('hidden');
        const img = preview.querySelector('img');
        if (img) img.src = dataUrl;
        else {
          const im = document.createElement('img');
          im.src = dataUrl;
          im.alt = 'Preview';
          im.className = 'w-full h-full object-cover';
          preview.innerHTML = '';
          preview.appendChild(im);
        }
      }
    };
    reader.readAsDataURL(file);
  });
}

setupImageUpload('schoolLogo', 'schoolLogoBtn', 'schoolLogoLabel', 'schoolLogoPreview', (url) => { schoolLogoDataUrl = url; });
setupImageUpload('backgroundImage', 'backgroundImageBtn', 'backgroundImageLabel', null, (url) => { backgroundImageDataUrl = url; });

function getSubjectRowHtml() {
  const div = document.createElement('div');
  div.className = 'subject-row grid grid-cols-1 md:grid-cols-12 gap-2 items-center';
  div.innerHTML = `
    <input type="text" placeholder="Subject" class="subject-name col-span-2 md:col-span-2 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm" />
    <input type="number" placeholder="Exam" min="0" max="100" class="exam-score col-span-1 md:col-span-1 bg-slate-700 border border-slate-600 rounded px-2 py-2 text-sm" />
    <input type="number" placeholder="Class" min="0" max="100" class="classwork-score col-span-1 md:col-span-1 bg-slate-700 border border-slate-600 rounded px-2 py-2 text-sm" />
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
  if (sumEl) sumEl.textContent = (exam > 0 || classwork > 0) ? Math.min(100, exam + classwork) : '—';
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
  const total = Math.min(100, exam + classwork);
  const grade = gradeFromPercentage(total);
  const remark = gradeToRemark(grade);
  if (gradeInput) gradeInput.value = grade;
  if (remarksInput) remarksInput.value = remark;
}

function enforceExamClassSum(row, changedField) {
  const examInput = row.querySelector('.exam-score');
  const classInput = row.querySelector('.classwork-score');
  let exam = parseFloat(examInput.value) || 0;
  let classwork = parseFloat(classInput.value) || 0;
  if (exam + classwork > 100) {
    if (changedField === 'exam') examInput.value = Math.min(exam, 100 - classwork);
    else classInput.value = Math.min(classwork, 100 - exam);
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
    if (exam + classwork > 100) classwork = Math.max(0, 100 - exam);
    const total = Math.min(100, exam + classwork);
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
    classTeacher: get('classTeacher'),
    headteacherRemarks: get('headteacherRemarks'),
    reopeningDate: get('reopeningDate'),
    feesBalance: get('feesBalance'),
    feesNextTerm: get('feesNextTerm'),
    totalDue: String(totalDue),
  };
}

const REQUIRED_FIELDS = [
  'organization', 'schoolName', 'department', 'studentName', 'reportYear', 'termSession',
  'reportClass', 'classTeacher', 'headteacherRemarks', 'reopeningDate',
  'feesBalance', 'feesNextTerm'
];

const FIELD_LABELS = {
  organization: 'Organization', schoolName: 'School name', department: 'Department',
  studentName: 'Student name', reportYear: 'Year', termSession: 'Term',
  reportClass: 'Form/Class', classTeacher: 'Class teacher',
  headteacherRemarks: "Headteacher's comments", reopeningDate: 'Next term begins on',
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

  const schoolName = escapeHtml(f.schoolName || '');
  const schoolAddress = f.schoolAddress ? escapeHtml(f.schoolAddress) : '';

  const subjectRowsHtml = subjects.map((s) =>
    `<tr><td class="col-subject">${escapeHtml(s.name)}</td><td>${s.exam}</td><td>${s.classwork}</td><td>${s.total}</td><td>${escapeHtml(s.grade)}</td><td>${s.points !== '' ? s.points : ''}</td><td>${escapeHtml(s.remarks)}</td></tr>`
  ).join('');

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
    <div class="line"><span class="label">Headteacher's/Deputy Headteacher's Comments:</span><span class="dotted">${escapeHtml(f.headteacherRemarks || '')}</span></div>
    <div class="line"><span class="label">Report seen by Parent/Guardian:</span><span class="dotted"></span> <span class="label">Signature:</span><span class="dotted"></span></div>
    <div class="line"><span class="label">Next term Begins on:</span><span class="dotted">${escapeHtml(f.reopeningDate || '')}</span> <span class="label">Date:</span><span class="dotted"></span></div>
  </div>
  <div class="report-fees-box">
    <strong>FEES RECORD</strong>
    <div>Fees Balance: ${escapeHtml(f.feesBalance || '')}</div>
    <div>Fees for next term: ${escapeHtml(f.feesNextTerm || '')}</div>
    <div>Total due on opening day Kshs: ${escapeHtml(f.totalDue || '')}</div>
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

printReportBtn.addEventListener('click', () => window.print());

document.getElementById('closeReportModal').addEventListener('click', () => {
  reportSection.classList.add('hidden');
  reportSection.setAttribute('aria-hidden', 'true');
});
