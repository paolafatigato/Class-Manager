 // Data structure: stores classes with students and seating layouts
    let classes = [];
    let classrooms = []; // New: store classroom layouts
    let currentClassId = null;
    let currentClassroomId = null; // Currently editing classroom
    let isDragging = false;
    let dragElement = null;
    let offsetX = 0;
    let offsetY = 0;
    let editMode = false; // Edit desk positions
    let studentMode = false; // Move students between desks
    let draggedStudentName = null;
    let draggedFromSeat = null;

    // Initialize app
    function init() {
      loadClasses();
      loadClassrooms();
      renderClassList();
      renderClassroomList();
    }

    // Load classes from localStorage
    function loadClasses() {
      const saved = localStorage.getItem('classroomClasses');
      if (saved) {
        classes = JSON.parse(saved);
      }
    }

    // Save classes to localStorage
    function saveClasses() {
      localStorage.setItem('classroomClasses', JSON.stringify(classes));
    }

    // Load classrooms from localStorage
    function loadClassrooms() {
      const saved = localStorage.getItem('classrooms');
      if (saved) {
        classrooms = JSON.parse(saved);
      }
    }

    // Save classrooms to localStorage
    function saveClassrooms() {
      localStorage.setItem('classrooms', JSON.stringify(classrooms));
    }

    // Parse student input (SURNAME NAME, comma-separated)
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
          return {
            fullName: s,
            displayName: s
          };
        });
    }

        // Show add class modal
    function showAddClassModal() {
      document.getElementById('addClassModal').classList.add('active');
    }
    // Show add classroom modal
    function showAddClassroomModal() {
      document.getElementById('addClassroomModal').classList.add('active');
    }

    // Add new classroom
    function addClassroom() {
      const name = document.getElementById('classroomNameInput').value.trim();
      const numDesks = parseInt(document.getElementById('classroomDesksInput').value);

      if (!name) {
        alert('Please enter a classroom name');
        return;
      }

      // Create default desk layout in a grid
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
      saveClassrooms();
      renderClassroomList();
      
      // Reset form
      document.getElementById('classroomNameInput').value = '';
      document.getElementById('classroomDesksInput').value = '20';
      closeModal('addClassroomModal');
    }

    // Show add classroom modal
    function showAddClassroomModal() {
      document.getElementById('addClassroomModal').classList.add('active');
    }

    // Show select classroom modal
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

    // Select classroom for current class
    function selectClassroom(classroomId) {
      const cls = classes.find(c => c.id === currentClassId);
      cls.selectedClassroomId = classroomId;
      cls.seating = null; // Reset seating when changing classroom
      
      saveClasses();
      closeModal('selectClassroomModal');
      
      // Update display and re-render
      const classroom = classrooms.find(c => c.id === classroomId);
      document.getElementById('currentClassroomName').textContent = classroom.name;
      renderSeatingChart();
    }

    // Delete classroom
    function deleteClassroom(classroomId) {
      if (!confirm('Are you sure you want to delete this classroom?')) return;
      
      classrooms = classrooms.filter(c => c.id !== classroomId);
      
      // Remove classroom reference from classes
      classes.forEach(cls => {
        if (cls.selectedClassroomId === classroomId) {
          cls.selectedClassroomId = null;
          cls.seating = null;
        }
      });
      
      saveClassrooms();
      saveClasses();
      renderClassroomList();
      renderClassList();
    }

    // Open classroom editor
    function openClassroomEditor(classroomId) {
      currentClassroomId = classroomId;
      const classroom = classrooms.find(c => c.id === classroomId);
      
      document.getElementById('homePage').classList.add('hidden');
      document.getElementById('classroomEditorPage').classList.remove('hidden');
      document.getElementById('editorClassroomName').textContent = classroom.name;
      
      renderClassroomEditor();
    }

    // Exit classroom editor
    function exitClassroomEditor() {
      document.getElementById('classroomEditorPage').classList.add('hidden');
      document.getElementById('homePage').classList.remove('hidden');
      currentClassroomId = null;
    }

    // Render classroom editor
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
        
        deskEl.addEventListener('mousedown', (e) => {
          startDragClassroomDesk(e, deskEl);
        });
        
        chart.appendChild(deskEl);
      });
    }

    // Drag desk in classroom editor
    function startDragClassroomDesk(e, deskEl) {
      isDragging = true;
      dragElement = deskEl;
      dragElement.classList.add('dragging');
      
      const rect = dragElement.getBoundingClientRect();
      const chartRect = document.getElementById('classroomEditorChart').getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      document.addEventListener('mousemove', dragClassroomDesk);
      document.addEventListener('mouseup', stopDragClassroomDesk);
    }

    function dragClassroomDesk(e) {
      if (!isDragging) return;
      
      const chartRect = document.getElementById('classroomEditorChart').getBoundingClientRect();
      const x = e.clientX - chartRect.left - offsetX;
      const y = e.clientY - chartRect.top - offsetY;
      
      dragElement.style.left = Math.max(0, x) + 'px';
      dragElement.style.top = Math.max(0, y) + 'px';
    }

    function stopDragClassroomDesk() {
      if (dragElement) {
        dragElement.classList.remove('dragging');
      }
      isDragging = false;
      dragElement = null;
      document.removeEventListener('mousemove', dragClassroomDesk);
      document.removeEventListener('mouseup', stopDragClassroomDesk);
    }

    // Save classroom layout
    function saveClassroomLayout() {
      const classroom = classrooms.find(c => c.id === currentClassroomId);
      const desks = Array.from(document.querySelectorAll('#classroomEditorChart .student-seat'));
      
      classroom.desks = desks.map(desk => ({
        id: desk.dataset.deskId,
        x: parseInt(desk.style.left),
        y: parseInt(desk.style.top)
      }));
      
      saveClassrooms();
      alert('Classroom layout saved!');
    }

    // Close modal
    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
    }

    // Add new class
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
        seating: null
      };

      classes.push(newClass);
      saveClasses();
      renderClassList();
      
      // Reset form
      document.getElementById('classNameInput').value = '';
      document.getElementById('studentsInput').value = '';
      closeModal('addClassModal');
    }

    // Render class list on home page
    function renderClassList() {
      const container = document.getElementById('classList');
      container.innerHTML = '';

      classes.forEach(cls => {
        const card = document.createElement('div');
        card.className = 'class-card';
        card.onclick = () => openClass(cls.id);
        
        const classroomName = cls.selectedClassroomId 
          ? classrooms.find(c => c.id === cls.selectedClassroomId)?.name || 'Not selected'
          : 'Not selected';
        
        card.innerHTML = `
          <h3>${cls.name}</h3>
          <p>${cls.students.length} students</p>
          <p style="font-size: 0.85em; margin-top: 8px;">📍 ${classroomName}</p>
        `;
        container.appendChild(card);
      });
    }

    // Render classroom list on home page
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

    // Open class page
    function openClass(classId) {
      currentClassId = classId;
      const cls = classes.find(c => c.id === classId);
      
      document.getElementById('homePage').classList.add('hidden');
      document.getElementById('classPage').classList.remove('hidden');
      document.getElementById('className').textContent = cls.name;
      
      // Show selected classroom name
      if (cls.selectedClassroomId) {
        const classroom = classrooms.find(c => c.id === cls.selectedClassroomId);
        document.getElementById('currentClassroomName').textContent = classroom ? classroom.name : 'Not selected';
      } else {
        document.getElementById('currentClassroomName').textContent = 'Not selected';
      }
      
      renderSeatingChart();
    }

    // Show home page
    function showHomePage() {
      document.getElementById('classPage').classList.add('hidden');
      document.getElementById('homePage').classList.remove('hidden');
      currentClassId = null;
    }

    // Render seating chart
    function renderSeatingChart() {
      const cls = classes.find(c => c.id === currentClassId);
      const chart = document.getElementById('seatingChart');
      chart.innerHTML = '';

      // Reset modes
      editMode = false;
      studentMode = false;
      updateModeButtons();

      // Check if classroom is selected
      if (!cls.selectedClassroomId) {
        chart.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;"><h3>No classroom selected</h3><p>Please select a classroom to view the seating chart.</p></div>';
        return;
      }

      const classroom = classrooms.find(c => c.id === cls.selectedClassroomId);
      if (!classroom) {
        chart.innerHTML = '<div style="text-align: center; padding: 50px; color: #f56565;"><h3>Classroom not found</h3><p>The selected classroom may have been deleted.</p></div>';
        return;
      }

      // If saved seating exists for this classroom, use it
      if (cls.seating && cls.seating.length > 0) {
        // Render all desks from classroom with saved student assignments
        classroom.desks.forEach((desk, index) => {
          const savedSeat = cls.seating.find(s => s.deskId === desk.id);
          const displayName = savedSeat ? savedSeat.displayName : '';
          createSeatElement(displayName, desk.x, desk.y, index, desk.id);
        });
      } else {
        // Assign students to desks using classroom layout
        const shuffledStudents = [...cls.students].sort(() => Math.random() - 0.5);
        classroom.desks.forEach((desk, index) => {
          const student = shuffledStudents[index];
          const displayName = student ? student.displayName : '';
          createSeatElement(displayName, desk.x, desk.y, index, desk.id);
        });
      }
    }

    // Toggle edit desk mode
    function toggleEditMode() {
      editMode = !editMode;
      studentMode = false;
      updateModeButtons();
      updateSeatStyles();
    }

    // Toggle student move mode
    function toggleStudentMode() {
      studentMode = !studentMode;
      editMode = false;
      updateModeButtons();
      updateSeatStyles();
    }

    // Update mode button styles
    function updateModeButtons() {
      const editBtn = document.getElementById('editModeBtn');
      const studentBtn = document.getElementById('studentModeBtn');
      
      if (editMode) {
        editBtn.style.background = '#48bb78';
        editBtn.textContent = '✓ Editing Desks';
      } else {
        editBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        editBtn.textContent = '🔧 Edit Desks';
      }
      
      if (studentMode) {
        studentBtn.style.background = '#48bb78';
        studentBtn.textContent = '✓ Moving Students';
      } else {
        studentBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        studentBtn.textContent = '👥 Move Students';
      }
    }

    // Update seat styles based on mode
    function updateSeatStyles() {
      const seats = document.querySelectorAll('.student-seat');
      seats.forEach(seat => {
        seat.classList.remove('edit-mode', 'student-mode');
        if (editMode) {
          seat.classList.add('edit-mode');
        } else if (studentMode) {
          seat.classList.add('student-mode');
        }
      });
    }

    // Create seat element
    function createSeatElement(displayName, x, y, index, deskId) {
      const seat = document.createElement('div');
      seat.className = 'student-seat';
      seat.style.left = x + 'px';
      seat.style.top = y + 'px';
      seat.dataset.index = index;
      seat.dataset.deskId = deskId;
      
      // Mark as empty if no student assigned
      const isEmpty = !displayName || displayName === '';
      if (isEmpty) {
        seat.classList.add('empty');
      }
      
      // Create name element for student mode
      const nameEl = document.createElement('div');
      nameEl.className = 'student-name';
      nameEl.textContent = isEmpty ? 'Empty' : displayName;
      nameEl.dataset.name = displayName || '';
      seat.appendChild(nameEl);
      
      // Mouse down on seat (for edit mode - moving desks)
      seat.addEventListener('mousedown', (e) => {
        if (editMode && e.target === seat) {
          startDragDesk(e, seat);
        }
      });
      
      // Mouse down on name (for student mode - moving students)
      nameEl.addEventListener('mousedown', (e) => {
        if (studentMode && !isEmpty) {
          e.stopPropagation();
          startDragStudent(e, seat, nameEl);
        }
      });
      
      document.getElementById('seatingChart').appendChild(seat);
    }

    // Drag desk (edit mode)
    function startDragDesk(e, seat) {
      if (!editMode) return;
      
      isDragging = true;
      dragElement = seat;
      dragElement.classList.add('dragging');
      
      const rect = dragElement.getBoundingClientRect();
      const chartRect = document.getElementById('seatingChart').getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      document.addEventListener('mousemove', dragDesk);
      document.addEventListener('mouseup', stopDragDesk);
    }

    function dragDesk(e) {
      if (!isDragging || !editMode) return;
      
      const chartRect = document.getElementById('seatingChart').getBoundingClientRect();
      const x = e.clientX - chartRect.left - offsetX;
      const y = e.clientY - chartRect.top - offsetY;
      
      dragElement.style.left = Math.max(0, x) + 'px';
      dragElement.style.top = Math.max(0, y) + 'px';
    }

    function stopDragDesk() {
      if (dragElement) {
        dragElement.classList.remove('dragging');
      }
      isDragging = false;
      dragElement = null;
      document.removeEventListener('mousemove', dragDesk);
      document.removeEventListener('mouseup', stopDragDesk);
    }

    // Drag student name (student mode)
    function startDragStudent(e, seat, nameEl) {
      if (!studentMode) return;
      
      draggedStudentName = nameEl.dataset.name;
      draggedFromSeat = seat;
      nameEl.classList.add('dragging-name');
      
      // Highlight potential drop targets (including empty desks)
      const allSeats = document.querySelectorAll('.student-seat');
      allSeats.forEach(s => {
        if (s !== seat) {
          s.classList.add('drop-target');
        }
      });
      
      document.addEventListener('mousemove', dragStudentMove);
      document.addEventListener('mouseup', dropStudent);
    }

    function dragStudentMove(e) {
      // Visual feedback could be added here
    }

    function dropStudent(e) {
      if (!draggedStudentName) return;
      
      // Find the seat under the cursor
      const seats = document.querySelectorAll('.student-seat');
      let targetSeat = null;
      
      seats.forEach(seat => {
        const rect = seat.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          targetSeat = seat;
        }
      });
      
      // Swap students if dropped on a different seat (including empty ones)
      if (targetSeat && targetSeat !== draggedFromSeat) {
        const targetName = targetSeat.querySelector('.student-name');
        const sourceName = draggedFromSeat.querySelector('.student-name');
        
        // Swap the names (can be empty)
        const tempName = targetName.dataset.name || '';
        const tempText = targetName.dataset.name ? targetName.textContent : '';
        
        targetName.dataset.name = sourceName.dataset.name;
        targetName.textContent = sourceName.textContent;
        
        sourceName.dataset.name = tempName;
        sourceName.textContent = tempName ? tempText : 'Empty';
        
        // Update empty class
        targetSeat.classList.toggle('empty', !targetName.dataset.name);
        draggedFromSeat.classList.toggle('empty', !sourceName.dataset.name);
      }
      
      // Clean up
      const allSeats = document.querySelectorAll('.student-seat');
      allSeats.forEach(s => {
        s.classList.remove('drop-target');
      });
      
      if (draggedFromSeat) {
        const nameEl = draggedFromSeat.querySelector('.student-name');
        if (nameEl) {
          nameEl.classList.remove('dragging-name');
        }
      }
      
      draggedStudentName = null;
      draggedFromSeat = null;
      
      document.removeEventListener('mousemove', dragStudentMove);
      document.removeEventListener('mouseup', dropStudent);
    }

    // Randomize seating (shuffle student names in seats)
    function randomizeSeating() {
      const cls = classes.find(c => c.id === currentClassId);
      const seats = Array.from(document.querySelectorAll('.student-seat'));
      
      // Get all student names (excluding empty seats)
      const studentNames = [];
      seats.forEach(seat => {
        const nameEl = seat.querySelector('.student-name');
        if (nameEl.dataset.name && nameEl.dataset.name !== '') {
          studentNames.push(nameEl.dataset.name);
        }
      });
      
      // Shuffle student names
      const shuffled = [...studentNames].sort(() => Math.random() - 0.5);
      
      // Assign shuffled names back to seats
      let studentIndex = 0;
      seats.forEach((seat) => {
        const nameEl = seat.querySelector('.student-name');
        if (studentIndex < shuffled.length) {
          nameEl.textContent = shuffled[studentIndex];
          nameEl.dataset.name = shuffled[studentIndex];
          seat.classList.remove('empty');
          studentIndex++;
        } else {
          nameEl.textContent = 'Empty';
          nameEl.dataset.name = '';
          seat.classList.add('empty');
        }
      });
    }

    // Save seating layout
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
      
      saveClasses();
      alert('Seating layout saved!');
    }

    // Show wheel modal
    function showWheel() {
      document.getElementById('wheelModal').classList.add('active');
      drawWheel();
    }

    // Draw wheel
    function drawWheel() {
      const cls = classes.find(c => c.id === currentClassId);
      const canvas = document.getElementById('wheelCanvas');
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 180;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const students = cls.students;
      const sliceAngle = (2 * Math.PI) / students.length;
      
      // Draw slices
      students.forEach((student, i) => {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;
        
        // Alternate colors
        ctx.fillStyle = i % 2 === 0 ? '#667eea' : '#764ba2';
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        
        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(student.displayName, radius - 20, 5);
        ctx.restore();
      });
      
      // Draw center circle
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Spin wheel
    function spinWheel() {
      const cls = classes.find(c => c.id === currentClassId);
      const canvas = document.getElementById('wheelCanvas');
      const ctx = canvas.getContext('2d');
      const students = cls.students;
      
      let rotation = 0;
      const spinDuration = 3000;
      const spins = 5 + Math.random() * 3;
      const totalRotation = spins * 360 + Math.random() * 360;
      const startTime = Date.now();
      
      document.getElementById('wheelResult').textContent = 'Spinning...';
      
      function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        
        // Easing function
        const eased = 1 - Math.pow(1 - progress, 3);
        rotation = eased * totalRotation;
        
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
          // Calculate winner
          const finalAngle = (rotation % 360);
          const sliceAngle = 360 / students.length;
          const winnerIndex = Math.floor(((360 - finalAngle) % 360) / sliceAngle);
          const winner = students[winnerIndex];
          
          document.getElementById('wheelResult').textContent = `Selected: ${winner.displayName}`;
        }
      }
      
      animate();
    }

    // Initialize on load
    init();
