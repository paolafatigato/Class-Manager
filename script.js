// Data structure
let classes = [];
let classrooms = [];
let currentClassId = null;
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

function loadUserData(userId) {
  showLoading(true);
  
  // Reference to user's data in Realtime Database
  const userRef = window.firebaseRef(window.firebaseDb, 'users/' + userId);
  
  // Real-time listener - updates automatically when data changes
  window.firebaseOnValue(userRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
      classes = data.classes || [];
      classrooms = data.classrooms || [];
    } else {
      // First time user
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
  saveTimeout = setTimeout(saveToFirebase, 500);
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
