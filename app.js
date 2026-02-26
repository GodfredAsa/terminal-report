/**
 * Subject scores: configurable Exam % + Class % weights.
 * Generates a printable terminal-style report.
 */

function getWeights() {
  const examPct = parseFloat(document.getElementById('examPercent').value) || 70;
  const classPct = parseFloat(document.getElementById('classPercent').value) || 30;
  const sum = examPct + classPct;
  if (sum <= 0) return { exam: 0.7, classwork: 0.3, examPct: 70, classPct: 30 };
  return {
    exam: examPct / sum,
    classwork: classPct / sum,
    examPct,
    classPct,
  };
}

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
    <input type="number" placeholder="CAT" min="0" max="100" class="classwork-score col-span-1 md:col-span-1 bg-slate-700 border border-slate-600 rounded px-2 py-2 text-sm" />
    <input type="number" placeholder="Exam" min="0" max="100" class="exam-score col-span-1 md:col-span-1 bg-slate-700 border border-slate-600 rounded px-2 py-2 text-sm" />
    <span class="total-preview col-span-1 text-amber-400 text-sm">%</span>
    <input type="text" placeholder="Grade" class="subject-grade col-span-1 md:col-span-1 bg-slate-700 border border-slate-600 rounded px-2 py-2 text-sm" maxlength="3" />
    <input type="text" placeholder="Remarks" class="subject-remarks col-span-2 md:col-span-2 bg-slate-700 border border-slate-600 rounded px-2 py-2 text-sm" />
    <button type="button" class="remove-row col-span-1 text-red-400 hover:text-red-300 text-sm" title="Remove">×</button>
  `;
  return div;
}

function calculateTotal(exam, classwork) {
  const { exam: examW, classwork: classW } = getWeights();
  const e = parseFloat(exam) || 0;
  const c = parseFloat(classwork) || 0;
  return Math.round((e * examW + c * classW) * 10) / 10;
}

function gradeFromPercentage(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 75) return 'A-';
  if (pct >= 70) return 'B+';
  if (pct >= 65) return 'B';
  if (pct >= 60) return 'B-';
  if (pct >= 55) return 'C+';
  if (pct >= 50) return 'C';
  if (pct >= 45) return 'C-';
  if (pct >= 40) return 'D+';
  if (pct >= 35) return 'D';
  if (pct >= 30) return 'D-';
  return 'E';
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

function updatePreview(row) {
  const exam = row.querySelector('.exam-score').value;
  const classwork = row.querySelector('.classwork-score').value;
  const preview = row.querySelector('.total-preview');
  if (exam !== '' || classwork !== '') {
    preview.textContent = Math.round(calculateTotal(exam, classwork));
  } else {
    preview.textContent = '—';
  }
}

function bindRowEvents(row) {
  const updateGrade = () => {
    const exam = row.querySelector('.exam-score').value;
    const classwork = row.querySelector('.classwork-score').value;
    const gradeInput = row.querySelector('.subject-grade');
    if (gradeInput && gradeInput.value === '' && (exam !== '' || classwork !== '')) {
      const pct = calculateTotal(exam, classwork);
      gradeInput.placeholder = gradeFromPercentage(pct);
    }
  };
  row.querySelector('.exam-score').addEventListener('input', () => { updatePreview(row); updateGrade(); });
  row.querySelector('.classwork-score').addEventListener('input', () => { updatePreview(row); updateGrade(); });
  row.querySelector('.remove-row').addEventListener('click', () => {
    if (subjectRows.children.length > 1) row.remove();
  });
}

function refreshAllPreviews() {
  subjectRows.querySelectorAll('.subject-row').forEach(updatePreview);
}

document.getElementById('examPercent').addEventListener('input', refreshAllPreviews);
document.getElementById('classPercent').addEventListener('input', refreshAllPreviews);

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
    const exam = parseFloat(row.querySelector('.exam-score').value) || 0;
    const classwork = parseFloat(row.querySelector('.classwork-score').value) || 0;
    const pct = calculateTotal(exam, classwork);
    const gradeInput = row.querySelector('.subject-grade');
    const grade = (gradeInput && gradeInput.value.trim()) || gradeFromPercentage(pct);
    const remarks = (row.querySelector('.subject-remarks') && row.querySelector('.subject-remarks').value.trim()) || '';
    const points = pointsFromGrade(grade);
    return { name, exam, classwork, pct: Math.round(pct), grade, points, remarks };
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

function buildTerminalReport(subjects, examPct, classPct, form) {
  const f = form || getReportFormData();
  const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const logoHtml = schoolLogoDataUrl
    ? `<img src="${schoolLogoDataUrl.replace(/"/g, '&quot;')}" alt="School logo" />`
    : '<span>Logo</span>';
  const watermarkClass = backgroundImageDataUrl ? 'report-watermark' : 'report-watermark no-bg-image';

  const schoolName = escapeHtml(f.schoolName || '');
  const schoolAddress = f.schoolAddress ? escapeHtml(f.schoolAddress) : '';

  const subjectRowsHtml = subjects.map((s) =>
    `<tr><td class="col-subject">${escapeHtml(s.name)}</td><td>${s.classwork}</td><td>${s.exam}</td><td>${s.pct}</td><td>${escapeHtml(s.grade)}</td><td>${s.points !== '' ? s.points : ''}</td><td>${escapeHtml(s.remarks)}</td></tr>`
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
        <th>CAT</th>
        <th>EXAM</th>
        <th>%</th>
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
    alert('Add at least one subject with exam or classwork (CAT) score.');
    return;
  }
  const { examPct, classPct } = getWeights();
  const formData = getReportFormData();
  reportContent.innerHTML = buildTerminalReport(subjects, examPct, classPct, formData);
  const watermarkEl = reportContent.querySelector('.report-watermark:not(.no-bg-image)');
  if (watermarkEl && backgroundImageDataUrl) watermarkEl.style.backgroundImage = `url("${backgroundImageDataUrl.replace(/"/g, '\\"')}")`;
  reportSection.classList.remove('hidden');
  printReportBtn.classList.remove('hidden');
  reportSection.scrollIntoView({ behavior: 'smooth' });
});

printReportBtn.addEventListener('click', () => window.print());
