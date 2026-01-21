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

  const newClassroom = {
    id: Date.now().toString(),
    name: name,
    desks: desks
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
  cls.selectedClassroomId = classroomId;
  cls.seating = null;
  
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
    
    deskEl.addEventListener('mousedown', (e) => startDragClassroomDesk(e, deskEl));
    chart.appendChild(deskEl);
  });
}

function startDragClassroomDesk(e, deskEl) {
  isDragging = true;
  dragElement = deskEl;
  dragElement.classList.add('dragging');
  
  const rect = dragElement.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  
  document.addEventListener('mousemove', dragClassroomDesk);
  document.addEventListener('mouseup', stopDragClassroomDesk);
}

function dragClassroomDesk(e) {
  if (!isDragging) return;
  const chartRect = document.getElementById('classroomEditorChart').getBoundingClientRect();
  dragElement.style.left = Math.max(0, e.clientX - chartRect.left - offsetX) + 'px';
  dragElement.style.top = Math.max(0, e.clientY - chartRect.top - offsetY) + 'px';
}

function stopDragClassroomDesk() {
  if (dragElement) dragElement.classList.remove('dragging');
  isDragging = false;
  dragElement = null;
  document.removeEventListener('mousemove', dragClassroomDesk);
  document.removeEventListener('mouseup', stopDragClassroomDesk);
}

function saveClassroomLayout() {
  const classroom = classrooms.find(c => c.id === currentClassroomId);
  const desks = Array.from(document.querySelectorAll('#classroomEditorChart .student-seat'));
  
  classroom.desks = desks.map(desk => ({
    id: desk.dataset.deskId,
    x: parseInt(desk.style.left),
    y: parseInt(desk.style.top)
  }));
  
  debouncedSave();
  alert('Classroom layout saved!');
}

// ========== SEATING CHART ==========

function renderSeatingChart() {
  const cls = classes.find(c => c.id === currentClassId);
  const chart = document.getElementById('seatingChart');
  chart.innerHTML = '';

  editMode = false;
  studentMode = false;
  updateModeButtons();

  if (!cls.selectedClassroomId) {
    chart.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;"><h3>No classroom selected</h3><p>Please select a classroom to view the seating chart.</p></div>';
    return;
  }

  const classroom = classrooms.find(c => c.id === cls.selectedClassroomId);
  if (!classroom) {
    chart.innerHTML = '<div style="text-align: center; padding: 50px; color: #f56565;"><h3>Classroom not found</h3></div>';
    return;
  }

  if (cls.seating && cls.seating.length > 0) {
    classroom.desks.forEach((desk, index) => {
      const savedSeat = cls.seating.find(s => s.deskId === desk.id);
      createSeatElement(savedSeat?.displayName || '', desk.x, desk.y, index, desk.id);
    });
  } else {
    const shuffled = [...cls.students].sort(() => Math.random() - 0.5);
    classroom.desks.forEach((desk, index) => {
      createSeatElement(shuffled[index]?.displayName || '', desk.x, desk.y, index, desk.id);
    });
  }
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
    if (editMode && e.target === seat) startDragDesk(e, seat);
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
  updateModeButtons();
  updateSeatStyles();
}

function toggleStudentMode() {
  studentMode = !studentMode;
  editMode = false;
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

// ========== DRAG DESK ==========

function startDragDesk(e, seat) {
  if (!editMode) return;
  isDragging = true;
  dragElement = seat;
  dragElement.classList.add('dragging');
  
  const rect = dragElement.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  
  document.addEventListener('mousemove', dragDesk);
  document.addEventListener('mouseup', stopDragDesk);
}

function dragDesk(e) {
  if (!isDragging || !editMode) return;
  const chartRect = document.getElementById('seatingChart').getBoundingClientRect();
  dragElement.style.left = Math.max(0, e.clientX - chartRect.left - offsetX) + 'px';
  dragElement.style.top = Math.max(0, e.clientY - chartRect.top - offsetY) + 'px';
}

function stopDragDesk() {
  if (dragElement) dragElement.classList.remove('dragging');
  isDragging = false;
  dragElement = null;
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
  
  cls.seating = seats.map(seat => {
    const nameEl = seat.querySelector('.student-name');
    return {
      displayName: nameEl.dataset.name || '',
      x: parseInt(seat.style.left),
      y: parseInt(seat.style.top),
      deskId: seat.dataset.deskId
    };
  });
  
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
