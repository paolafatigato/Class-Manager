// ====== PRINT FUNCTIONS ======
function printClassLayout() {
  const chart = document.getElementById('seatingChart');
  if (!chart) return;
  // Clona il seating chart
  const clone = chart.cloneNode(true);
  // Rimuovi bottoni e controlli
  clone.querySelectorAll('button, .selection-box').forEach(el => el.remove());
  // Prepara contenuto per stampa
  const style = document.createElement('style');
  style.textContent = `@media print { body { margin: 0; } .student-seat, .teacher-desk { box-shadow: none !important; } }`;
  const win = window.open('', '', 'width=900,height=1200');
  win.document.write('<html><head><title>Stampa Layout Classe</title>');
  win.document.write('<link rel="stylesheet" href="style.css">');
  win.document.write(style.outerHTML);
  win.document.write('</head><body>');
  win.document.write('<h2>Layout Classe</h2>');
  win.document.write(clone.outerHTML);
  win.document.write('</body></html>');
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

function printClassroomLayout() {
  const chart = document.getElementById('classroomEditorChart');
  if (!chart) return;
  // Clona il chart
  const clone = chart.cloneNode(true);
  // Rimuovi bottoni, nomi studenti
  clone.querySelectorAll('button, .selection-box, .student-name').forEach(el => el.remove());
  // Prepara contenuto per stampa
  const style = document.createElement('style');
  style.textContent = `@media print { body { margin: 0; } .student-seat, .teacher-desk { box-shadow: none !important; } }`;
  const win = window.open('', '', 'width=900,height=1200');
  win.document.write('<html><head><title>Stampa Layout Banchi</title>');
  win.document.write('<link rel="stylesheet" href="style.css">');
  win.document.write(style.outerHTML);
  win.document.write('</head><body>');
  win.document.write('<h2>Layout Banchi</h2>');
  win.document.write(clone.outerHTML);
  win.document.write('</body></html>');
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}
// Chiudi modale generica
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}
// ===== STUDENT LIST MODAL =====
function showStudentListModal() {
  const modal = document.getElementById('studentListModal');
  if (!currentClassId) return;
  const cls = classes.find(c => c.id === currentClassId);
  if (!cls) return;
  // Ordina studenti per cognome
  let students = [...cls.students];
  students.sort((a, b) => {
    const aSurname = (a.fullName || '').split(' ')[0].toLowerCase();
    const bSurname = (b.fullName || '').split(' ')[0].toLowerCase();
    if (aSurname < bSurname) return -1;
    if (aSurname > bSurname) return 1;
    return 0;
  });
  // Genera tabella
  let html = '<table class="student-table" style="width:100%; border-collapse:collapse;">';
  html += '<thead><tr><th style="width:40px;">#</th><th>Surname</th><th>Name</th><th></th></tr></thead><tbody>';
  students.forEach((s, i) => {
    const parts = (s.fullName || '').split(' ');
    const surname = parts[0] || '';
    const name = parts.slice(1).join(' ') || '';
    html += `<tr>
      <td style="text-align:center;">${i+1}</td>
      <td><input type="text" class="student-surname" value="${surname}" data-idx="${i}" style="width:90%;"></td>
      <td><input type="text" class="student-name" value="${name}" data-idx="${i}" style="width:90%;"></td>
      <td><button class="btn btn-small btn-danger" onclick="removeStudentRow(${i})">×</button></td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('studentTableContainer').innerHTML = html;
  modal.classList.add('active');
  // Gestione aggiunta riga
  document.getElementById('addStudentBtn').onclick = function() {
    addStudentRow();
  };
  // Gestione salvataggio
  document.getElementById('saveStudentListBtn').onclick = function() {
    saveStudentList();
  };
}

function addStudentRow() {
  const table = document.querySelector('#studentTableContainer tbody');
  const idx = table.rows.length;
  const tr = document.createElement('tr');
  tr.innerHTML = `<td style="text-align:center;">${idx+1}</td>
    <td><input type="text" class="student-surname" value="" data-idx="${idx}" style="width:90%;"></td>
    <td><input type="text" class="student-name" value="" data-idx="${idx}" style="width:90%;"></td>
    <td><button class="btn btn-small btn-danger" onclick="removeStudentRow(${idx})">×</button></td>`;
  table.appendChild(tr);
}

function removeStudentRow(idx) {
  const table = document.querySelector('#studentTableContainer tbody');
  if (table && table.rows[idx]) table.deleteRow(idx);
  // Rinumera le righe
  Array.from(table.rows).forEach((row, i) => {
    row.cells[0].textContent = i+1;
    row.querySelectorAll('input').forEach(inp => inp.setAttribute('data-idx', i));
    row.cells[3].querySelector('button').setAttribute('onclick', `removeStudentRow(${i})`);
  });
}

function saveStudentList() {
  if (!currentClassId) return;
  const cls = classes.find(c => c.id === currentClassId);
  if (!cls) return;
  const table = document.querySelector('#studentTableContainer tbody');
  const newStudents = [];
  Array.from(table.rows).forEach(row => {
    const surname = row.querySelector('.student-surname').value.trim();
    const name = row.querySelector('.student-name').value.trim();
    if (surname && name) {
      newStudents.push({
        fullName: surname + ' ' + name,
        displayName: name + ' ' + surname.charAt(0) + '.'
      });
    }
  });
  // Ordina per cognome
  newStudents.sort((a, b) => {
    const aSurname = (a.fullName || '').split(' ')[0].toLowerCase();
    const bSurname = (b.fullName || '').split(' ')[0].toLowerCase();
    if (aSurname < bSurname) return -1;
    if (aSurname > bSurname) return 1;
    return 0;
  });
  cls.students = newStudents;
  debouncedSave();
  closeModal('studentListModal');
  renderClassList();
}
// ========== GRADES BUTTON ========== 
document.addEventListener('DOMContentLoaded', function() {
  const gradesBtn = document.getElementById('gradesBtn');
  if (gradesBtn) {
    gradesBtn.addEventListener('click', function() {
      window.open('https://paolafatigato.github.io/RegistroTeacher/', '_blank');
    });
  }
});
function createRandomGroupsBySize() {
  const input = document.getElementById('numPerGroupInput');
  let size = parseInt(input.value);
  if (isNaN(size) || size < 2) size = 2;
  const cls = classes.find(c => c.id === currentClassId);
  if (!cls || !Array.isArray(cls.students) || cls.students.length === 0) {
    document.getElementById('groupResults').innerHTML = '<p style="color:red">Nessuno studente nella classe.</p>';
    return;
  }
  // Copia e mescola gli studenti
  const students = [...cls.students];
  for (let i = students.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [students[i], students[j]] = [students[j], students[i]];
  }
  // Crea i gruppi da size persone (tieni oggetti, non solo stringhe)
  const groups = [];
  for (let i = 0; i < students.length; i += size) {
    groups.push(students.slice(i, i + size));
  }
  _lastGroups = groups;
  // Mostra i risultati
  let html = '';
  groups.forEach((group, i) => {
    const names = group.map(s => s.displayName || s.fullName).join(', ');
    html += `<div style="margin-bottom:10px;"><strong>Gruppo ${i + 1}:</strong> ${names}</div>`;
  });
  html += _arrangeBtn();
  document.getElementById('groupResults').innerHTML = html;
}
function createRandomGroupsFromInput() {
  const input = document.getElementById('numGroupsInput');
  let num = parseInt(input.value);
  if (isNaN(num) || num < 2) num = 2;
  createRandomGroups(num);
}
// Data structure
let classes = [];
let classrooms = [];
let currentClassId = null;
let _lastGroups = []; // ultimo set di gruppi creati, usato da arrangeGroupsOnSeats()
let currentClassroomId = null;
let isDragging = false;
let dragElement = null;
let offsetX = 0;
let offsetY = 0;
let editMode = false;
let studentMode = false;
let draggedStudentName = null;
let draggedFromSeat = null;
let selectedSeats = new Set();
let isSelecting = false;
let selectionStart = null;
let selectionBoxEl = null;
let selectionChartEl = null;
let dragGroupData = null;
let dragStartPoint = null;
let dragChartEl = null;

// ========== UI FUNCTIONS ==========

function showLoginUI() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('homePage').classList.add('hidden');
  document.getElementById('classPage').classList.add('hidden');
  document.getElementById('classroomEditorPage').classList.add('hidden');
}

function showLoggedInUI(user) {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('homePage').classList.remove('hidden');
  document.getElementById('userAvatar').src = user.photoURL || '';
  document.getElementById('userName').textContent = user.displayName || user.email;
}

function showLoading(show) {
  document.getElementById('loadingIndicator').classList.toggle('hidden', !show);
  document.getElementById('mainContent').classList.toggle('hidden', show);
}

function showSyncIndicator(message, isSaving = false) {
  const indicator = document.getElementById('syncIndicator');
  indicator.textContent = message;
  indicator.classList.toggle('saving', isSaving);
  indicator.classList.add('show');
  setTimeout(() => indicator.classList.remove('show'), 2000);
}

// ========== FIREBASE DATA FUNCTIONS ==========

/**
 * Ripara i dati corrotti: classi senza "id", studenti senza fullName/displayName.
 * Idempotente: se i dati sono già corretti non cambia nulla.
 */
function normalizeLoadedData(rawClasses) {
  const arr = Array.isArray(rawClasses)
    ? rawClasses
    : Object.values(rawClasses || {});

  return arr.filter(Boolean).map((cls, idx) => {
    // Ripristina id della classe se mancante
    if (!cls.id) {
      cls.id = Date.now().toString() + idx;
    }

    // Normalizza studenti
    const rawStudents = Array.isArray(cls.students)
      ? cls.students
      : Object.values(cls.students || {});

    cls.students = rawStudents.filter(Boolean).map(s => {
      // Già corretto
      if (s.fullName && s.displayName) return s;

      // Corrotto: ha solo "name" (es. "Mario R.") → lo usiamo come entrambi
      const nameVal = s.name || s.fullName || s.displayName || '';
      return {
        fullName: nameVal,
        displayName: nameVal
      };
    });

    return cls;
  });
}

function loadUserData(userId) {
  showLoading(true);
  
  const userRef = window.firebaseRef(window.firebaseDb, 'users/' + userId);
  
  window.firebaseOnValue(userRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
      classes    = normalizeLoadedData(data.classes || []);
      classrooms = Array.isArray(data.classrooms)
        ? data.classrooms
        : Object.values(data.classrooms || {});
    } else {
      classes = [];
      classrooms = [];
    }
    
    renderClassList();
    renderClassroomList();
    showLoading(false);
  }, (error) => {
    console.error('Error loading data:', error);
    showLoading(false);
    alert('Error loading data. Please refresh the page.');
  });
}

async function saveToFirebase() {
  if (!window.currentUser) return;
  
  showSyncIndicator('💾 Saving...', true);
  
  try {
    const userRef = window.firebaseRef(window.firebaseDb, 'users/' + window.currentUser.uid);
    await window.firebaseSet(userRef, {
      classes: classes,
      classrooms: classrooms,
      lastUpdated: new Date().toISOString()
    });
    showSyncIndicator('✓ Saved!', false);
  } catch (error) {
    console.error('Error saving:', error);
    showSyncIndicator('❌ Save failed', false);
  }
}

// Debounced save
let saveTimeout = null;
function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveToFirebase();
    // Salva anche le classi in localStorage per grades.html
    try {
      localStorage.setItem('classroomManagerClasses', JSON.stringify(classes));
    } catch (e) { console.error('LocalStorage sync error:', e); }
  }, 500);
}

// ========== CLASS FUNCTIONS ==========

function parseStudents(input) {
  return input
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => {
      const parts = s.split(' ').filter(p => p.length > 0);
      if (parts.length >= 2) {
        const surname = parts[0];
        const name = parts.slice(1).join(' ');
        return {
          fullName: `${surname} ${name}`,
          displayName: `${name} ${surname.charAt(0)}.`
        };
      }
      return { fullName: s, displayName: s };
    });
}

function showAddClassModal() {
  document.getElementById('addClassModal').classList.add('active');
}

function addClass() {
  const className = document.getElementById('classNameInput').value.trim();
  const studentsInput = document.getElementById('studentsInput').value.trim();

  if (!className) {
    alert('Please enter a class name');
    return;
  }

  const students = parseStudents(studentsInput);

  const newClass = {
    id: Date.now().toString(),
    name: className,
    students: students,
    seating: null,
    seatingByClassroom: {},
    selectedClassroomId: null
  };

  classes.push(newClass);
  debouncedSave();
  renderClassList();
  
  document.getElementById('classNameInput').value = '';
  document.getElementById('studentsInput').value = '';
  closeModal('addClassModal');
}

function deleteClass(classId) {
  if (!confirm('Delete this class?')) return;
  classes = classes.filter(c => c.id !== classId);
  debouncedSave();
  renderClassList();
}

function renderClassList() {
  const container = document.getElementById('classList');
  container.innerHTML = '';

  classes.forEach(cls => {
    const card = document.createElement('div');
    card.className = 'class-card';

    const classroomName = cls.selectedClassroomId
      ? classrooms.find(c => c.id === cls.selectedClassroomId)?.name || 'Not selected'
      : 'Not selected';

    card.innerHTML = `
      <button class="delete-btn" onclick="event.stopPropagation(); deleteClass('${cls.id}')">×</button>
      <h3>${cls.name}</h3>
      <p>${cls.students.length} students</p>
      <p style="font-size: 0.85em; margin-top: 8px;">📍 ${classroomName}</p>
    `;

    card.onclick = () => openClass(cls.id);
    container.appendChild(card);
  });
}

function openClass(classId) {
  currentClassId = classId;
  const cls = classes.find(c => c.id === classId);
  
  document.getElementById('homePage').classList.add('hidden');
  document.getElementById('classPage').classList.remove('hidden');
  document.getElementById('className').textContent = cls.name;
  
  if (cls.selectedClassroomId) {
    const classroom = classrooms.find(c => c.id === cls.selectedClassroomId);
    document.getElementById('currentClassroomName').textContent = classroom ? classroom.name : 'Not selected';
  } else {
    document.getElementById('currentClassroomName').textContent = 'Not selected';
  }
  
  renderSeatingChart();
}

function showHomePage() {
  document.getElementById('classPage').classList.add('hidden');
  document.getElementById('homePage').classList.remove('hidden');
  currentClassId = null;
}

// ========== CLASSROOM FUNCTIONS ==========

function showAddClassroomModal() {
  document.getElementById('addClassroomModal').classList.add('active');
}

function addClassroom() {
  const name = document.getElementById('classroomNameInput').value.trim();
  const numDesks = parseInt(document.getElementById('classroomDesksInput').value);

  if (!name) {
    alert('Please enter a classroom name');
    return;
  }

  const cols = Math.ceil(Math.sqrt(numDesks));
  const desks = [];
  for (let i = 0; i < numDesks; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    desks.push({
      id: `desk_${i}`,
      x: col * 150 + 50,
      y: row * 100 + 50
    });
  }

  const layoutWidth = cols * 150;
  const teacherDesk = {
    x: Math.max(20, (layoutWidth / 2) - 120),
    y: 20
  };

  const newClassroom = {
    id: Date.now().toString(),
    name: name,
    desks: desks,
    teacherDesk: teacherDesk
  };

  classrooms.push(newClassroom);
  debouncedSave();
  renderClassroomList();
  
  document.getElementById('classroomNameInput').value = '';
  document.getElementById('classroomDesksInput').value = '20';
  closeModal('addClassroomModal');
}

function deleteClassroom(classroomId) {
  if (!confirm('Delete this classroom?')) return;
  
  classrooms = classrooms.filter(c => c.id !== classroomId);
  
  classes.forEach(cls => {
    if (cls.seatingByClassroom && cls.seatingByClassroom[classroomId]) {
      delete cls.seatingByClassroom[classroomId];
    }
    if (cls.selectedClassroomId === classroomId) {
      cls.selectedClassroomId = null;
      cls.seating = null;
    }
  });
  
  debouncedSave();
  renderClassroomList();
  renderClassList();
}

function renderClassroomList() {
  const container = document.getElementById('classroomList');
  container.innerHTML = '';

  classrooms.forEach(classroom => {
    const card = document.createElement('div');
    card.className = 'classroom-card';
    
    card.innerHTML = `
      <button class="delete-btn" onclick="event.stopPropagation(); deleteClassroom('${classroom.id}')">×</button>
      <h3>${classroom.name}</h3>
      <p>${classroom.desks.length} desks</p>
    `;
    
    card.onclick = () => openClassroomEditor(classroom.id);
    container.appendChild(card);
  });
}

function showSelectClassroomModal() {
  const modal = document.getElementById('selectClassroomModal');
  const list = document.getElementById('selectClassroomList');
  list.innerHTML = '';
  
  if (classrooms.length === 0) {
    list.innerHTML = '<p style="color: #999; text-align: center;">No classrooms available. Create one first!</p>';
  } else {
    classrooms.forEach(classroom => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.style.width = '100%';
      btn.style.marginBottom = '10px';
      btn.textContent = `${classroom.name} (${classroom.desks.length} desks)`;
      btn.onclick = () => selectClassroom(classroom.id);
      list.appendChild(btn);
    });
  }
  
  modal.classList.add('active');
}

function selectClassroom(classroomId) {
  const cls = classes.find(c => c.id === currentClassId);
  ensureSeatingByClassroom(cls);
  cls.selectedClassroomId = classroomId;
  
  debouncedSave();
  closeModal('selectClassroomModal');
  
  const classroom = classrooms.find(c => c.id === classroomId);
  document.getElementById('currentClassroomName').textContent = classroom.name;
  renderSeatingChart();
}

// ========== CLASSROOM EDITOR ==========

// ========== GRUPPI (CASUALI + INTELLIGENTI PER LIVELLO) ==========

function showGroupModal() {
  document.getElementById('groupResults').innerHTML = '';
  document.getElementById('groupModal').classList.add('active');
}

function createRandomGroups(numGroups) {
  const cls = classes.find(c => c.id === currentClassId);
  if (!cls || !Array.isArray(cls.students) || cls.students.length === 0) {
    document.getElementById('groupResults').innerHTML = '<p style="color:red">Nessuno studente nella classe.</p>';
    return;
  }
  const students = [...cls.students];
  for (let i = students.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [students[i], students[j]] = [students[j], students[i]];
  }
  // Mantieni oggetti studente (non solo stringhe) per arrangeGroupsOnSeats
  const groups = Array.from({ length: numGroups }, () => []);
  students.forEach((student, idx) => {
    groups[idx % numGroups].push(student);
  });
  _lastGroups = groups;
  let html = '';
  groups.forEach((group, i) => {
    const names = group.map(s => s.displayName || s.fullName).join(', ');
    html += `<div style="margin-bottom:10px;"><strong>Gruppo ${i + 1}:</strong> ${names}</div>`;
  });
  html += _arrangeBtn();
  document.getElementById('groupResults').innerHTML = html;
}

// ── Lettura voti da Firebase (read-only, nessuna scrittura) ──────────────────

/**
 * Legge /users/{uid}/grading/ dal database Firebase condiviso.
 * Usa onlyOnce: true → nessun listener persistente, solo una lettura.
 * Non scrive nulla, non modifica niente.
 */
async function loadGradingData() {
  if (!window.currentUser || !window.firebaseDb || !window.firebaseRef || !window.firebaseOnValue) {
    return null;
  }
  return new Promise((resolve, reject) => {
    const ref = window.firebaseRef(window.firebaseDb, `users/${window.currentUser.uid}/grading`);
    window.firebaseOnValue(
      ref,
      (snapshot) => resolve(snapshot.val()),
      (err) => reject(err),
      { onlyOnce: true }
    );
  });
}

// ── Calcolo media studente (replica fedele di app.js getStudentAverage) ──────

function _parseNum(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

/**
 * Calcola il voto finale (0-10) di uno studente per un test, dato il grading snapshot.
 * fullName è la chiave usata da entrambi i sistemi (es. "Rossi Mario").
 */
function _computeFinalScore(studentId, test, gradingScores, gradingTestVersions) {
  const allScores = gradingScores?.[studentId];
  if (!allScores || !allScores[test.id]) return null;
  const testScores = allScores[test.id];

  // Versione assegnata allo studente, o prima disponibile
  const versionId = gradingTestVersions?.[studentId]?.[test.id];
  const versions = test.versions || [];
  const version = (versionId ? versions.find(v => v.id === versionId) : null) || versions[0];
  if (!version) return null;

  const sections = version.sections || [];
  let weightedSum = 0;
  let weightedMaxSum = 0;

  sections.forEach(section => {
    const sectionScores = testScores[section.id];
    if (!sectionScores) return;

    const subsections = section.subsections || [];
    let sectionScore = 0;

    if (subsections.length > 0) {
      // Calcola totalWeight e totalMax delle sottosezioni
      let totalWeight = 0, totalMax = 0;
      subsections.forEach(sub => {
        totalWeight += _parseNum(sub.weight) ?? 1;
        totalMax    += _parseNum(sub.max)    ?? 0;
      });
      if (totalWeight <= 0 || totalMax <= 0) return;

      const fallbackPerSub = totalMax / subsections.length;
      let weightedRatioSum = 0;
      subsections.forEach(sub => {
        const val = _parseNum(sectionScores.subsections?.[sub.id]) ?? 0;
        const m   = (_parseNum(sub.max) !== null) ? _parseNum(sub.max) : fallbackPerSub;
        const w   = _parseNum(sub.weight) ?? 1;
        if (m > 0 && w > 0) weightedRatioSum += (val / m) * w;
      });
      sectionScore = (weightedRatioSum / totalWeight) * totalMax;

      // weight e max della sezione = somma delle sottosezioni
      const sWeight = subsections.reduce((s, sub) => s + (_parseNum(sub.weight) ?? 1), 0);
      const sMax    = subsections.reduce((s, sub) => s + (_parseNum(sub.max)    ?? 0), 0);
      if (sWeight > 0 && sMax > 0) {
        weightedSum    += sectionScore * sWeight;
        weightedMaxSum += sMax * sWeight;
      }
    } else {
      // Sezione diretta (senza sottosezioni)
      sectionScore = _parseNum(sectionScores.direct) ?? 0;
      const sWeight = _parseNum(section.weight) ?? 1;
      const sMax    = _parseNum(section.max)    ?? 0;
      if (sWeight > 0 && sMax > 0) {
        weightedSum    += sectionScore * sWeight;
        weightedMaxSum += sMax * sWeight;
      }
    }
  });

  if (weightedMaxSum === 0) return null;
  return (weightedSum * 10) / weightedMaxSum;
}

/**
 * Calcola la media generale (0-10) di uno studente su tutti i test.
 * Esclude voti <= 2 (assenti/non svolti), come fa app.js.
 */
function computeStudentAverage(fullName, gradingData) {
  if (!gradingData?.tests || !gradingData?.scores) return null;
  if (!gradingData.scores[fullName]) return null; // nessun voto registrato

  const finals = gradingData.tests
    .map(test => _computeFinalScore(fullName, test, gradingData.scores, gradingData.testVersions))
    .filter(v => v !== null && v > 2);

  if (finals.length === 0) return null;
  return finals.reduce((a, b) => a + b, 0) / finals.length;
}

// ── Badge colore per livello ──────────────────────────────────────────────────

function _gradeLevel(avg) {
  if (avg === null || avg === undefined) return { emoji: '❓', color: '#9e9e9e', label: '—' };
  if (avg >= 8.5) return { emoji: '🟢', color: '#2e7d32', label: avg.toFixed(1) };
  if (avg >= 7)   return { emoji: '🟩', color: '#388e3c', label: avg.toFixed(1) };
  if (avg >= 6)   return { emoji: '🟡', color: '#f57f17', label: avg.toFixed(1) };
  return             { emoji: '🔴', color: '#c62828', label: avg.toFixed(1) };
}

// ── Algoritmi di raggruppamento ───────────────────────────────────────────────

/**
 * Gruppi OMOGENEI: stessi livelli insieme.
 * Ordina per voto decrescente, poi distribuisce in blocchi consecutivi.
 */
function _makeHomogeneous(students, numGroups, gradeMap) {
  const sorted = [...students].sort((a, b) => {
    const ga = gradeMap[a.fullName] ?? -1;
    const gb = gradeMap[b.fullName] ?? -1;
    return gb - ga;
  });
  const size = Math.ceil(sorted.length / numGroups);
  const groups = [];
  for (let i = 0; i < sorted.length; i += size) {
    groups.push(sorted.slice(i, i + size));
  }
  return groups;
}

/**
 * Gruppi ETEROGENEI: livelli misti con variazione ad ogni chiamata.
 * 1. Ordina per voto e divide in "livelli" di numGroups studenti ciascuno
 *    (es. 26 studenti, 13 gruppi → livello alto: i 13 migliori, livello basso: i 13 peggiori).
 * 2. Mescola casualmente ogni livello → risultato diverso ad ogni click.
 * 3. Assegna livello[t][i] → gruppo[i]: ogni gruppo riceve uno studente per livello
 *    → nessun gruppo con soli bravissimi né soli scarsissimi.
 */
function _makeHeterogeneous(students, numGroups, gradeMap) {
  const sorted = [...students].sort((a, b) => {
    const ga = gradeMap[a.fullName] ?? -1;
    const gb = gradeMap[b.fullName] ?? -1;
    return gb - ga;
  });

  // Taglia in livelli di numGroups studenti (uno slot per gruppo)
  const tiers = [];
  for (let i = 0; i < sorted.length; i += numGroups) {
    const tier = sorted.slice(i, i + numGroups);
    // Fisher-Yates shuffle dentro ogni livello
    for (let j = tier.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [tier[j], tier[k]] = [tier[k], tier[j]];
    }
    tiers.push(tier);
  }

  // tier[t][i] → gruppo[i]: ogni gruppo riceve un rappresentante per livello
  const groups = Array.from({ length: numGroups }, () => []);
  tiers.forEach(tier => {
    tier.forEach((s, i) => groups[i].push(s));
  });

  return groups.filter(g => g.length > 0);
}

// ── Render risultati con badge ────────────────────────────────────────────────

/** HTML del bottone "Disponi sui banchi" condiviso da tutti i render */
function _arrangeBtn() {
  return `<button
    onclick="arrangeGroupsOnSeats()"
    style="margin-top:14px;display:inline-flex;align-items:center;gap:8px;
      padding:10px 20px;border-radius:20px;border:none;cursor:pointer;font-weight:700;
      font-size:.95em;background:linear-gradient(135deg,#667eea,#764ba2);color:white;
      box-shadow:0 4px 12px rgba(102,126,234,.35);transition:transform .2s,box-shadow .2s;"
    onmouseover="this.style.transform='scale(1.05)'"
    onmouseout="this.style.transform='scale(1)'">
    📐 Disponi sui banchi
  </button>`;
}

function _renderSmartGroups(groups, gradeMap, strategy) {
  // Salva i gruppi per arrangeGroupsOnSeats()
  _lastGroups = groups;

  const labels = {
    homogeneous:  '📊 Gruppi Omogenei — stesso livello',
    heterogeneous:'🔀 Gruppi Eterogenei — livelli misti',
  };
  let html = `<p style="font-size:.85em;color:#667eea;margin-bottom:10px;font-weight:600;">
    ${labels[strategy] || strategy}
  </p>`;

  groups.forEach((group, i) => {
    html += `<div style="margin-bottom:12px;padding:10px 12px;border-radius:12px;
      background:#f7fafc;border:1.5px solid #e2e8f0;">
      <strong style="color:#764ba2;font-size:.95em;">Gruppo ${i + 1}</strong>
      <div style="margin-top:7px;display:flex;flex-wrap:wrap;gap:6px;">`;

    group.forEach(s => {
      const avg = gradeMap[s.fullName];
      const lv  = _gradeLevel(avg);
      html += `<span style="display:inline-flex;align-items:center;gap:4px;
        padding:3px 9px;border-radius:20px;background:white;
        border:2px solid ${lv.color};font-size:.85em;white-space:nowrap;">
        <span>${lv.emoji}</span>
        <span style="font-weight:600;">${s.displayName || s.fullName}</span>
        <span style="color:${lv.color};font-weight:700;">${lv.label}</span>
      </span>`;
    });

    html += `</div></div>`;
  });

  // Legenda
  html += `<div style="margin-top:12px;font-size:.78em;color:#888;
    display:flex;gap:12px;flex-wrap:wrap;padding-top:8px;border-top:1px solid #eee;">
    <span>🟢 Ottimo ≥8.5</span>
    <span>🟩 Buono ≥7</span>
    <span>🟡 Sufficiente ≥6</span>
    <span>🔴 Insufficiente &lt;6</span>
    <span>❓ Nessun voto</span>
  </div>`;

  html += _arrangeBtn();

  document.getElementById('groupResults').innerHTML = html;
}

// ── Disponi gruppi sui banchi ─────────────────────────────────────────────────

/**
 * Assegna ogni gruppo a un cluster di banchi adiacenti nel seating chart.
 * Algoritmo greedy nearest-neighbor:
 *   1. Ordina i banchi top-left → bottom-right (selezione del "seme")
 *   2. Per ogni gruppo, prende il primo banco libero come seme
 *   3. Espande il cluster aggiungendo sempre il banco libero più vicino
 *      a qualsiasi banco già nel cluster
 * Evidenzia i cluster con colori per 4 secondi, poi rimuove l'highlight.
 */
function arrangeGroupsOnSeats() {
  if (!_lastGroups?.length) {
    alert('Crea prima i gruppi!');
    return;
  }

  const chart = document.getElementById('seatingChart');
  if (!chart) { alert('Nessun layout visibile.'); return; }

  const seatEls = Array.from(chart.querySelectorAll('.student-seat'));
  if (!seatEls.length) {
    alert('Nessun banco trovato. Seleziona prima un\'aula per questa classe.');
    closeModal('groupModal');
    return;
  }

  // Build seat pool with positions
  const ROW_SNAP = 55; // pixel tolerance per raggruppare in righe
  let pool = seatEls.map(el => ({
    el,
    x: parseInt(el.style.left) || 0,
    y: parseInt(el.style.top)  || 0,
    assigned: false
  }));

  // Sort: fila (y arrotondato) poi colonna (x) — per scegliere i semi in ordine naturale
  pool.sort((a, b) => {
    const rA = Math.round(a.y / ROW_SNAP);
    const rB = Math.round(b.y / ROW_SNAP);
    return rA !== rB ? rA - rB : a.x - b.x;
  });

  const totalStudents = _lastGroups.flat().length;
  if (pool.length < totalStudents) {
    if (!confirm(`⚠️ Banchi insufficienti: ${totalStudents} studenti, ${pool.length} banchi.\nProcedo assegnando quanti più studenti posso. Continuo?`)) return;
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Palette colori gruppi
  const COLORS = [
    '#667eea','#48bb78','#ed8936','#e53e3e','#9f7aea',
    '#38b2ac','#d69e2e','#e91e63','#00bcd4','#8bc34a'
  ];

  const assignedSeats = []; // per rimuovere highlight dopo 4s

  _lastGroups.forEach((group, gIdx) => {
    if (!group.length) return;
    const color = COLORS[gIdx % COLORS.length];

    // Seed: primo banco libero nell'ordine naturale
    const seed = pool.find(s => !s.assigned);
    if (!seed) return;
    seed.assigned = true;
    const cluster = [seed];

    // Espandi il cluster con nearest-neighbor
    for (let k = 1; k < group.length; k++) {
      let bestDist = Infinity, bestSeat = null;
      pool.forEach(s => {
        if (s.assigned) return;
        // Distanza dal banco libero al più vicino già nel cluster
        const d = Math.min(...cluster.map(c => dist(c, s)));
        if (d < bestDist) { bestDist = d; bestSeat = s; }
      });
      if (!bestSeat) break;
      bestSeat.assigned = true;
      cluster.push(bestSeat);
    }

    // Assegna nomi e colora
    cluster.forEach((seat, sIdx) => {
      const student = group[sIdx];
      if (!student) return;
      const nameEl = seat.el.querySelector('.student-name');
      if (!nameEl) return;

      const name = student.displayName || student.fullName || student;
      nameEl.textContent = name;
      nameEl.dataset.name = name;
      seat.el.classList.remove('empty');

      // Highlight con colore gruppo
      seat.el.style.transition = 'border-color .3s, box-shadow .3s';
      seat.el.style.borderColor = color;
      seat.el.style.boxShadow   = `0 0 0 3px ${color}66, 0 4px 14px ${color}55`;

      assignedSeats.push(seat.el);
    });
  });

  // Svuota i banchi rimasti liberi
  pool.forEach(s => {
    if (s.assigned) return;
    const nameEl = s.el.querySelector('.student-name');
    if (!nameEl) return;
    nameEl.textContent = 'Empty';
    nameEl.dataset.name = '';
    s.el.classList.add('empty');
    s.el.style.borderColor = '';
    s.el.style.boxShadow   = '';
  });

  // Rimuovi l'highlight dopo 4 secondi
  setTimeout(() => {
    assignedSeats.forEach(el => {
      el.style.borderColor = '';
      el.style.boxShadow   = '';
    });
  }, 4000);

  closeModal('groupModal');
  showSyncIndicator('📐 Gruppi disposti sui banchi!', false);
}

// ── Entry point: bottoni del modal ────────────────────────────────────────────

async function createSmartGroupsFromInput() {
  const strategy = document.getElementById('groupStrategySelect')?.value || 'random';
  if (strategy === 'random') { createRandomGroupsFromInput(); return; }

  const numGroups = Math.max(2, parseInt(document.getElementById('numGroupsInput').value) || 2);
  const cls = classes.find(c => c.id === currentClassId);
  if (!cls?.students?.length) {
    document.getElementById('groupResults').innerHTML = '<p style="color:red">Nessuno studente nella classe.</p>';
    return;
  }

  document.getElementById('groupResults').innerHTML =
    '<p style="color:#667eea;font-style:italic;">⏳ Caricamento voti da Firebase…</p>';

  try {
    const gradingData = await loadGradingData();
    const gradeMap = {};
    cls.students.forEach(s => {
      gradeMap[s.fullName] = computeStudentAverage(s.fullName, gradingData);
    });
    const groups = strategy === 'homogeneous'
      ? _makeHomogeneous(cls.students, numGroups, gradeMap)
      : _makeHeterogeneous(cls.students, numGroups, gradeMap);
    _renderSmartGroups(groups, gradeMap, strategy);
  } catch (e) {
    document.getElementById('groupResults').innerHTML =
      `<p style="color:red">⚠️ Errore caricamento voti: ${e.message}</p>`;
  }
}

async function createSmartGroupsBySize() {
  const strategy = document.getElementById('groupStrategySelect')?.value || 'random';
  if (strategy === 'random') { createRandomGroupsBySize(); return; }

  const size = Math.max(2, parseInt(document.getElementById('numPerGroupInput').value) || 4);
  const cls = classes.find(c => c.id === currentClassId);
  if (!cls?.students?.length) {
    document.getElementById('groupResults').innerHTML = '<p style="color:red">Nessuno studente nella classe.</p>';
    return;
  }

  const numGroups = Math.ceil(cls.students.length / size);
  document.getElementById('groupResults').innerHTML =
    '<p style="color:#667eea;font-style:italic;">⏳ Caricamento voti da Firebase…</p>';

  try {
    const gradingData = await loadGradingData();
    const gradeMap = {};
    cls.students.forEach(s => {
      gradeMap[s.fullName] = computeStudentAverage(s.fullName, gradingData);
    });
    const groups = strategy === 'homogeneous'
      ? _makeHomogeneous(cls.students, numGroups, gradeMap)
      : _makeHeterogeneous(cls.students, numGroups, gradeMap);
    _renderSmartGroups(groups, gradeMap, strategy);
  } catch (e) {
    document.getElementById('groupResults').innerHTML =
      `<p style="color:red">⚠️ Errore caricamento voti: ${e.message}</p>`;
  }
}
function openClassroomEditor(classroomId) {
  currentClassroomId = classroomId;
  const classroom = classrooms.find(c => c.id === classroomId);
  
  document.getElementById('homePage').classList.add('hidden');
  document.getElementById('classroomEditorPage').classList.remove('hidden');
  document.getElementById('editorClassroomName').textContent = classroom.name;
  
  renderClassroomEditor();
}

function exitClassroomEditor() {
  document.getElementById('classroomEditorPage').classList.add('hidden');
  document.getElementById('homePage').classList.remove('hidden');
  currentClassroomId = null;
}

function renderClassroomEditor() {
  const classroom = classrooms.find(c => c.id === currentClassroomId);
  const chart = document.getElementById('classroomEditorChart');
  chart.innerHTML = '';
  clearSeatSelection();

  if (!chart.dataset.selectionReady) {
    chart.addEventListener('mousedown', (e) => {
      if (e.target.closest('.student-seat') || e.target.closest('.teacher-desk')) return;
      startSelection(e, chart);
    });
    chart.dataset.selectionReady = 'true';
  }

  const teacherDesk = getTeacherDesk(classroom);
  const teacherDeskEl = createTeacherDeskElement(teacherDesk.x, teacherDesk.y, true);
  teacherDeskEl.addEventListener('mousedown', (e) => startDragClassroomDesk(e, teacherDeskEl));
  chart.appendChild(teacherDeskEl);

  classroom.desks.forEach((desk, index) => {
    const deskEl = document.createElement('div');
    deskEl.className = 'student-seat edit-mode';
    deskEl.style.left = desk.x + 'px';
    deskEl.style.top = desk.y + 'px';
    deskEl.dataset.deskId = desk.id;
    
    const label = document.createElement('div');
    label.className = 'student-name';
    label.textContent = `Desk ${index + 1}`;
    deskEl.appendChild(label);
    
    deskEl.addEventListener('mousedown', (e) => handleDeskPointerDown(e, deskEl, chart));
    chart.appendChild(deskEl);
  });

  updateChartHeight(chart);
}

function startDragClassroomDesk(e, deskEl) {
  isDragging = true;
  dragElement = deskEl;
  dragElement.classList.add('dragging');
  dragChartEl = document.getElementById('classroomEditorChart');
  dragGroupData = null;
  dragStartPoint = null;
  
  const rect = dragElement.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  
  document.addEventListener('mousemove', dragClassroomDesk);
  document.addEventListener('mouseup', stopDragClassroomDesk);
}

function dragClassroomDesk(e) {
  if (!isDragging) return;
  const chartRect = dragChartEl.getBoundingClientRect();
  dragElement.style.left = Math.max(0, e.clientX - chartRect.left - offsetX) + 'px';
  dragElement.style.top = Math.max(0, e.clientY - chartRect.top - offsetY) + 'px';
  updateChartHeight(dragChartEl);
}

function stopDragClassroomDesk() {
  if (dragElement) dragElement.classList.remove('dragging');
  isDragging = false;
  dragElement = null;
  if (dragChartEl) updateChartHeight(dragChartEl);
  dragChartEl = null;
  dragGroupData = null;
  dragStartPoint = null;
  document.removeEventListener('mousemove', dragClassroomDesk);
  document.removeEventListener('mouseup', stopDragClassroomDesk);
}

function saveClassroomLayout() {
  const classroom = classrooms.find(c => c.id === currentClassroomId);
  const desks = Array.from(document.querySelectorAll('#classroomEditorChart .student-seat'));

  const teacherDeskEl = document.querySelector('#classroomEditorChart .teacher-desk');
  if (teacherDeskEl) {
    classroom.teacherDesk = {
      x: parseInt(teacherDeskEl.style.left),
      y: parseInt(teacherDeskEl.style.top)
    };
  }
  
  classroom.desks = desks.map(desk => ({
    id: desk.dataset.deskId,
    x: parseInt(desk.style.left),
    y: parseInt(desk.style.top)
  }));
  
  debouncedSave();
  alert('Classroom layout saved!');
}

// ========== SEATING CHART ==========

const CHART_MIN_HEIGHT = 500;
const CHART_MAX_HEIGHT = 900;
const CHART_PADDING = 60;

function updateChartHeight(chart) {
  if (!chart) return;
  const elements = chart.querySelectorAll('.student-seat, .teacher-desk');
  if (elements.length === 0) {
    chart.style.height = '';
    chart.style.paddingBottom = '';
    return;
  }

  let maxBottom = 0;
  elements.forEach(el => {
    const top = parseInt(el.style.top) || 0;
    const height = el.offsetHeight || 0;
    maxBottom = Math.max(maxBottom, top + height);
  });

  const desired = Math.max(CHART_MIN_HEIGHT, maxBottom + CHART_PADDING);

  if (desired <= CHART_MAX_HEIGHT) {
    chart.style.height = desired + 'px';
    chart.style.paddingBottom = '';
    return;
  }

  chart.style.height = CHART_MAX_HEIGHT + 'px';
  chart.style.paddingBottom = (desired - CHART_MAX_HEIGHT) + 'px';
}

function getTeacherDesk(classroom) {
  if (classroom.teacherDesk && Number.isFinite(classroom.teacherDesk.x) && Number.isFinite(classroom.teacherDesk.y)) {
    return classroom.teacherDesk;
  }

  const deskCount = classroom.desks?.length || 0;
  const cols = Math.max(1, Math.ceil(Math.sqrt(deskCount || 1)));
  const layoutWidth = cols * 150;
  return {
    x: Math.max(20, (layoutWidth / 2) - 120),
    y: 20
  };
}

function createTeacherDeskElement(x, y, isEditable = false) {
  const desk = document.createElement('div');
  desk.className = 'teacher-desk';
  if (isEditable) desk.classList.add('edit-mode');
  desk.style.left = x + 'px';
  desk.style.top = y + 'px';

  const label = document.createElement('div');
  label.className = 'teacher-desk-label';
  label.textContent = 'Teacher Desk';
  desk.appendChild(label);

  return desk;
}

function ensureSeatingByClassroom(cls) {
  if (!cls) return;
  if (!cls.seatingByClassroom || typeof cls.seatingByClassroom !== 'object') {
    cls.seatingByClassroom = {};
  }

  if (cls.seating && cls.selectedClassroomId && !cls.seatingByClassroom[cls.selectedClassroomId]) {
    cls.seatingByClassroom[cls.selectedClassroomId] = cls.seating;
  }
}

function renderSeatingChart() {
  const cls = classes.find(c => c.id === currentClassId);
  const chart = document.getElementById('seatingChart');
  chart.innerHTML = '';
  clearSeatSelection();

  ensureSeatingByClassroom(cls);

  if (!chart.dataset.selectionReady) {
    chart.addEventListener('mousedown', (e) => {
      if (!editMode) return;
      if (e.target.closest('.student-seat') || e.target.closest('.teacher-desk')) return;
      startSelection(e, chart);
    });
    chart.dataset.selectionReady = 'true';
  }

  editMode = false;
  studentMode = false;
  updateModeButtons();

  if (!cls.selectedClassroomId) {
    chart.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;"><h3>No classroom selected</h3><p>Please select a classroom to view the seating chart.</p></div>';
    chart.style.height = '';
    chart.style.paddingBottom = '';
    return;
  }

  const classroom = classrooms.find(c => c.id === cls.selectedClassroomId);
  if (!classroom) {
    chart.innerHTML = '<div style="text-align: center; padding: 50px; color: #f56565;"><h3>Classroom not found</h3></div>';
    chart.style.height = '';
    chart.style.paddingBottom = '';
    return;
  }

  const teacherDesk = getTeacherDesk(classroom);
  chart.appendChild(createTeacherDeskElement(teacherDesk.x, teacherDesk.y));

  const savedSeating = cls.seatingByClassroom?.[cls.selectedClassroomId] || null;

  if (savedSeating && savedSeating.length > 0) {
    classroom.desks.forEach((desk, index) => {
      const savedSeat = savedSeating.find(s => s.deskId === desk.id);
      createSeatElement(savedSeat?.displayName || '', desk.x, desk.y, index, desk.id);
    });
  } else {
    const shuffled = [...cls.students].sort(() => Math.random() - 0.5);
    classroom.desks.forEach((desk, index) => {
      createSeatElement(shuffled[index]?.displayName || '', desk.x, desk.y, index, desk.id);
    });
  }

  updateChartHeight(chart);
}

function createSeatElement(displayName, x, y, index, deskId) {
  const seat = document.createElement('div');
  seat.className = 'student-seat';
  seat.style.left = x + 'px';
  seat.style.top = y + 'px';
  seat.dataset.index = index;
  seat.dataset.deskId = deskId;
  
  const isEmpty = !displayName;
  if (isEmpty) seat.classList.add('empty');
  
  const nameEl = document.createElement('div');
  nameEl.className = 'student-name';
  nameEl.textContent = isEmpty ? 'Empty' : displayName;
  nameEl.dataset.name = displayName || '';
  seat.appendChild(nameEl);
  
  seat.addEventListener('mousedown', (e) => {
    if (editMode && e.target === seat) handleDeskPointerDown(e, seat, document.getElementById('seatingChart'));
  });
  
  nameEl.addEventListener('mousedown', (e) => {
    if (studentMode && !isEmpty) {
      e.stopPropagation();
      startDragStudent(e, seat, nameEl);
    }
  });
  
  document.getElementById('seatingChart').appendChild(seat);
}

// ========== EDIT MODE ==========

function toggleEditMode() {
  editMode = !editMode;
  studentMode = false;
  clearSeatSelection();
  stopSelection();
  updateModeButtons();
  updateSeatStyles();
}

function toggleStudentMode() {
  studentMode = !studentMode;
  editMode = false;
  clearSeatSelection();
  stopSelection();
  updateModeButtons();
  updateSeatStyles();
}

function updateModeButtons() {
  const editBtn = document.getElementById('editModeBtn');
  const studentBtn = document.getElementById('studentModeBtn');
  
  editBtn.style.background = editMode ? '#48bb78' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  editBtn.textContent = editMode ? '✓ Editing Desks' : '🔧 Edit Desks';
  
  studentBtn.style.background = studentMode ? '#48bb78' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  studentBtn.textContent = studentMode ? '✓ Moving Students' : '👥 Move Students';
}

function updateSeatStyles() {
  document.querySelectorAll('.student-seat').forEach(seat => {
    seat.classList.remove('edit-mode', 'student-mode');
    if (editMode) seat.classList.add('edit-mode');
    else if (studentMode) seat.classList.add('student-mode');
  });
}

// ========== MULTI-SELECTION HELPERS ===========

function clearSeatSelection() {
  selectedSeats.forEach(seat => seat.classList.remove('selected'));
  selectedSeats.clear();
}

function addSeatToSelection(seat) {
  selectedSeats.add(seat);
  seat.classList.add('selected');
}

function removeSeatFromSelection(seat) {
  selectedSeats.delete(seat);
  seat.classList.remove('selected');
}

function getRelativePoint(e, chart) {
  const rect = chart.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function getSelectionRect(start, current) {
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  return { left, top, width, height };
}

function ensureSelectionBox(chart) {
  if (!selectionBoxEl || selectionBoxEl.parentElement !== chart) {
    if (selectionBoxEl && selectionBoxEl.parentElement) {
      selectionBoxEl.parentElement.removeChild(selectionBoxEl);
    }
    selectionBoxEl = document.createElement('div');
    selectionBoxEl.className = 'selection-box';
    chart.appendChild(selectionBoxEl);
  }
}

function updateSelectionBox(rect) {
  if (!selectionBoxEl) return;
  selectionBoxEl.style.left = rect.left + 'px';
  selectionBoxEl.style.top = rect.top + 'px';
  selectionBoxEl.style.width = rect.width + 'px';
  selectionBoxEl.style.height = rect.height + 'px';
}

function rectsIntersect(a, b) {
  return !(b.left > a.left + a.width ||
           b.left + b.width < a.left ||
           b.top > a.top + a.height ||
           b.top + b.height < a.top);
}

function startSelection(e, chart) {
  if (e.button !== 0) return;
  isSelecting = true;
  selectionChartEl = chart;
  selectionStart = getRelativePoint(e, chart);
  ensureSelectionBox(chart);
  updateSelectionBox({ left: selectionStart.x, top: selectionStart.y, width: 0, height: 0 });
  clearSeatSelection();
  document.addEventListener('mousemove', onSelectionMove);
  document.addEventListener('mouseup', stopSelection);
}

function onSelectionMove(e) {
  if (!isSelecting || !selectionChartEl) return;
  const current = getRelativePoint(e, selectionChartEl);
  const rect = getSelectionRect(selectionStart, current);
  updateSelectionBox(rect);

  const chartRect = selectionChartEl.getBoundingClientRect();
  selectionChartEl.querySelectorAll('.student-seat').forEach(seat => {
    const seatRect = seat.getBoundingClientRect();
    const seatBox = {
      left: seatRect.left - chartRect.left,
      top: seatRect.top - chartRect.top,
      width: seatRect.width,
      height: seatRect.height
    };
    if (rectsIntersect(rect, seatBox)) addSeatToSelection(seat);
    else removeSeatFromSelection(seat);
  });
}

function stopSelection() {
  isSelecting = false;
  selectionStart = null;
  if (selectionBoxEl && selectionBoxEl.parentElement) {
    selectionBoxEl.parentElement.removeChild(selectionBoxEl);
  }
  selectionBoxEl = null;
  selectionChartEl = null;
  document.removeEventListener('mousemove', onSelectionMove);
  document.removeEventListener('mouseup', stopSelection);
}

function handleDeskPointerDown(e, seat, chart) {
  if (e.button !== 0) return;
  if (!editMode && chart.id === 'seatingChart') return;

  if (selectedSeats.has(seat)) {
    startDragDesk(e, seat, chart);
    return;
  }

  clearSeatSelection();
  addSeatToSelection(seat);
  startDragDesk(e, seat, chart);
}

// ========== DRAG DESK ==========

function startDragDesk(e, seat, chart) {
  if (chart.id === 'seatingChart' && !editMode) return;
  isDragging = true;
  dragChartEl = chart;

  if (selectedSeats.size > 1 && selectedSeats.has(seat)) {
    dragGroupData = Array.from(selectedSeats).map(s => ({
      el: s,
      startLeft: parseInt(s.style.left),
      startTop: parseInt(s.style.top)
    }));
    dragStartPoint = getRelativePoint(e, chart);
    selectedSeats.forEach(s => s.classList.add('dragging'));
    document.addEventListener('mousemove', dragDesk);
    document.addEventListener('mouseup', stopDragDesk);
    return;
  }

  dragGroupData = null;
  dragStartPoint = null;
  dragElement = seat;
  dragElement.classList.add('dragging');
  
  const rect = dragElement.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  
  document.addEventListener('mousemove', dragDesk);
  document.addEventListener('mouseup', stopDragDesk);
}

function dragDesk(e) {
  if (!isDragging) return;
  if (!dragChartEl) return;

  if (dragGroupData && dragStartPoint) {
    const current = getRelativePoint(e, dragChartEl);
    const dx = current.x - dragStartPoint.x;
    const dy = current.y - dragStartPoint.y;
    dragGroupData.forEach(item => {
      item.el.style.left = Math.max(0, item.startLeft + dx) + 'px';
      item.el.style.top = Math.max(0, item.startTop + dy) + 'px';
    });
    return;
  }

  const chartRect = dragChartEl.getBoundingClientRect();
  dragElement.style.left = Math.max(0, e.clientX - chartRect.left - offsetX) + 'px';
  dragElement.style.top = Math.max(0, e.clientY - chartRect.top - offsetY) + 'px';
  updateChartHeight(dragChartEl);
}

function stopDragDesk() {
  if (dragGroupData) {
    selectedSeats.forEach(s => s.classList.remove('dragging'));
  }
  if (dragElement) dragElement.classList.remove('dragging');
  isDragging = false;
  dragElement = null;
  dragGroupData = null;
  dragStartPoint = null;
  if (dragChartEl) updateChartHeight(dragChartEl);
  dragChartEl = null;
  document.removeEventListener('mousemove', dragDesk);
  document.removeEventListener('mouseup', stopDragDesk);
}

// ========== DRAG STUDENT ==========

function startDragStudent(e, seat, nameEl) {
  if (!studentMode) return;
  
  draggedStudentName = nameEl.dataset.name;
  draggedFromSeat = seat;
  nameEl.classList.add('dragging-name');
  
  document.querySelectorAll('.student-seat').forEach(s => {
    if (s !== seat) s.classList.add('drop-target');
  });
  
  document.addEventListener('mousemove', dragStudentMove);
  document.addEventListener('mouseup', dropStudent);
}

function dragStudentMove(e) {}

function dropStudent(e) {
  if (!draggedStudentName) return;
  
  let targetSeat = null;
  document.querySelectorAll('.student-seat').forEach(seat => {
    const rect = seat.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom) {
      targetSeat = seat;
    }
  });
  
  if (targetSeat && targetSeat !== draggedFromSeat) {
    const targetName = targetSeat.querySelector('.student-name');
    const sourceName = draggedFromSeat.querySelector('.student-name');
    
    const tempName = targetName.dataset.name || '';
    const tempText = targetName.dataset.name ? targetName.textContent : '';
    
    targetName.dataset.name = sourceName.dataset.name;
    targetName.textContent = sourceName.textContent;
    
    sourceName.dataset.name = tempName;
    sourceName.textContent = tempName ? tempText : 'Empty';
    
    targetSeat.classList.toggle('empty', !targetName.dataset.name);
    draggedFromSeat.classList.toggle('empty', !sourceName.dataset.name);
  }
  
  document.querySelectorAll('.student-seat').forEach(s => s.classList.remove('drop-target'));
  
  if (draggedFromSeat) {
    const nameEl = draggedFromSeat.querySelector('.student-name');
    if (nameEl) nameEl.classList.remove('dragging-name');
  }
  
  draggedStudentName = null;
  draggedFromSeat = null;
  
  document.removeEventListener('mousemove', dragStudentMove);
  document.removeEventListener('mouseup', dropStudent);
}

// ========== RANDOMIZE & SAVE ==========

function randomizeSeating() {
  const seats = Array.from(document.querySelectorAll('.student-seat'));
  const studentNames = [];
  
  seats.forEach(seat => {
    const nameEl = seat.querySelector('.student-name');
    if (nameEl.dataset.name) studentNames.push(nameEl.dataset.name);
  });
  
  const shuffled = [...studentNames].sort(() => Math.random() - 0.5);
  let i = 0;
  
  seats.forEach(seat => {
    const nameEl = seat.querySelector('.student-name');
    if (i < shuffled.length) {
      nameEl.textContent = shuffled[i];
      nameEl.dataset.name = shuffled[i];
      seat.classList.remove('empty');
      i++;
    } else {
      nameEl.textContent = 'Empty';
      nameEl.dataset.name = '';
      seat.classList.add('empty');
    }
  });
}

function saveSeating() {
  const cls = classes.find(c => c.id === currentClassId);
  const seats = Array.from(document.querySelectorAll('.student-seat'));

  ensureSeatingByClassroom(cls);
  if (!cls.selectedClassroomId) {
    alert('Please select a classroom before saving the layout.');
    return;
  }
  
  const newSeating = seats.map(seat => {
    const nameEl = seat.querySelector('.student-name');
    return {
      displayName: nameEl.dataset.name || '',
      x: parseInt(seat.style.left),
      y: parseInt(seat.style.top),
      deskId: seat.dataset.deskId
    };
  });

  cls.seatingByClassroom[cls.selectedClassroomId] = newSeating;
  
  debouncedSave();
  alert('Seating layout saved!');
}

// ========== WHEEL ==========

function showWheel() {
  document.getElementById('wheelModal').classList.add('active');
  drawWheel();
}

function drawWheel() {
  const cls = classes.find(c => c.id === currentClassId);
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 180;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const students = cls.students;
  if (!students.length) return;
  
  const sliceAngle = (2 * Math.PI) / students.length;
  
  students.forEach((student, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#667eea' : '#764ba2';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, i * sliceAngle, (i + 1) * sliceAngle);
    ctx.closePath();
    ctx.fill();
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(i * sliceAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(student.displayName, radius - 20, 5);
    ctx.restore();
  });
  
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
  ctx.fill();
}

function spinWheel() {
  const cls = classes.find(c => c.id === currentClassId);
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const students = cls.students;
  
  if (!students.length) return;
  
  const spinDuration = 3000;
  const totalRotation = (5 + Math.random() * 3) * 360 + Math.random() * 360;
  const startTime = Date.now();
  
  document.getElementById('wheelResult').textContent = 'Spinning...';
  
  function animate() {
    const progress = Math.min((Date.now() - startTime) / spinDuration, 1);
    const rotation = (1 - Math.pow(1 - progress, 3)) * totalRotation;
    
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    drawWheel();
    ctx.restore();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      const winnerIndex = Math.floor(((360 - (rotation % 360)) % 360) / (360 / students.length));
      document.getElementById('wheelResult').textContent = `Selected: ${students[winnerIndex].displayName}`;
    }
  }
  
  animate();
}

// ========== MODAL ==========

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
    e.target.classList.remove('active');
  }
});