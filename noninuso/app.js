const STORAGE_KEY = "teacher-grading-data-v1";

const versionNameInput = document.getElementById("versionNameInput");
const facilitatedVersionSelect = document.getElementById("facilitatedVersionSelect");
const addVersionBtn = document.getElementById("addVersionBtn");
const testTitleInput = document.getElementById("testTitleInput");

const addTestBtn = document.getElementById("addTestBtn");
const addSectionBtn = document.getElementById("addSectionBtn");
const addStudentBtn = document.getElementById("addStudentBtn");
const addBulkStudentsBtn = document.getElementById("addBulkStudentsBtn");
const bulkStudentsInput = document.getElementById("bulkStudentsInput");

const exportBtn = document.getElementById("exportBtn");

const classStudentsTable = document.getElementById("classStudentsTable");
const classList = document.getElementById("classList");
const classSelect = document.getElementById("classSelect");
const classRenameInput = document.getElementById("classRenameInput");

const testsList = document.getElementById("testsList");

const configView = document.getElementById("configView");
const configTestSelect = document.getElementById("configTestSelect");
const configVersionSelect = document.getElementById("configVersionSelect");
const sectionsContainer = document.getElementById("sectionsContainer");

const gradeTable = document.getElementById("gradeTable");
const warningArea = document.getElementById("warningArea");

const testClassSelect = document.getElementById("testClassSelect");
const testSelect = document.getElementById("testSelect");
const testVersionSelect = document.getElementById("testVersionSelect");

const homeView = document.getElementById("homeView");
const classView = document.getElementById("classView");
const testsView = document.getElementById("testsView");
const testView = document.getElementById("testView");


const defaultData = {
  classes: [
    {
      id: "class-1",
      name: "Class 1",
      students: [
        { id: "stu-maria", name: "Maria", scores: {} },
        { id: "stu-luca", name: "Luca", scores: {} },
        { id: "stu-sofia", name: "Sofia", scores: {} },
      ],
    },
  ],
  tests: [
    {
      id: "test-1",
      title: "English Midterm Exam",
      sections: [
        {
          id: "sec-grammar",
          name: "Grammar",
          weight: 2,
          max: 10,
          subsections: [
            { id: "sub-g1", name: "Exercise 1", weight: 1, max: 3 },
            { id: "sub-g2", name: "Exercise 2", weight: 1, max: 3 },
            { id: "sub-g3", name: "Exercise 3", weight: 1, max: 4 },
          ],
        },
        {
          id: "sec-vocab",
          name: "Vocabulary",
          weight: 1,
          max: 8,
          subsections: [{ id: "sub-v1", name: "Exercise 4", weight: 1, max: 8 }],
        },
        {
          id: "sec-read",
          name: "Reading",
          weight: 3,
          max: 15,
          subsections: [],
        },
        {
          id: "sec-write",
          name: "Writing",
          weight: 2,
          max: 12,
          subsections: [],
        },
      ],
    },
  ],
  selectedClassId: "class-1",
  selectedTestId: "test-1",
  selectedTestVersionId: null,
  selectedConfigVersionId: null,
  view: "home",
};

const state = loadState();

const navHomeBtn = document.getElementById("navHomeBtn");
const navTestsBtn = document.getElementById("navTestsBtn");
const navEvaluationBtn = document.getElementById("navEvaluationBtn");
const navConfigBtn = document.getElementById("navConfigBtn");
const resetBtn = document.getElementById("resetBtn");




const sectionTemplate = document.getElementById("sectionTemplate");
const subsectionTemplate = document.getElementById("subsectionTemplate");

init();

// Permetti selezione classe nella vista valutazione
if (testClassSelect) {
  testClassSelect.addEventListener("change", function () {
    state.selectedClassId = this.value;
    saveState();
    renderTestTable();
  });
}

function init() {
  // Solo listener per elementi presenti in grades.html
  if (navHomeBtn) navHomeBtn.addEventListener("click", () => setView("home"));
  if (navTestsBtn) navTestsBtn.addEventListener("click", () => setView("tests"));
  if (navEvaluationBtn) navEvaluationBtn.addEventListener("click", () => setView("test"));
  if (navConfigBtn) navConfigBtn.addEventListener("click", () => setView("config"));
  if (resetBtn) resetBtn.addEventListener("click", () => { localStorage.clear(); location.reload(); });
}

  if (versionNameInput) {
    versionNameInput.addEventListener("change", (event) => {
      const selectedTest = getSelectedTest();
      if (!selectedTest) {
        return;
      }
      const version = getVersionById(selectedTest, state.selectedConfigVersionId);
      if (!version) {
        return;
      }
      version.name = event.target.value.trim() || version.name;
      saveState();
      renderConfig();
      renderTestsList();
    });
  }

  if (facilitatedVersionSelect) {
    facilitatedVersionSelect.addEventListener("change", (event) => {
      const selectedTest = getSelectedTest();
      if (!selectedTest) {
        return;
      }
      selectedTest.facilitatedVersionId = event.target.value;
      saveState();
      renderTestTable();
    });
  }

  if (addVersionBtn) {
    addVersionBtn.addEventListener("click", () => {
      const selectedTest = getSelectedTest();
      if (!selectedTest) {
        return;
      }
      const baseVersion = getVersionById(
        selectedTest,
        state.selectedConfigVersionId
      );
      const newVersion = createVersionFrom(baseVersion, selectedTest);
      selectedTest.versions.push(newVersion);
      selectedTest.facilitatedVersionId =
        selectedTest.facilitatedVersionId ?? newVersion.id;
      state.selectedConfigVersionId = newVersion.id;
      state.selectedTestVersionId = newVersion.id;
      saveState();
      renderConfig();
      renderTestTable();
    });
  }

  if (testTitleInput) {
    testTitleInput.addEventListener("input", (event) => {
      const selectedTest = getSelectedTest();
      if (!selectedTest) {
        return;
      }
      selectedTest.title = event.target.value;
      saveState();
      renderTestsList();
      renderClassDetail();
    });
  }

  // Dialog elementi
  const newTestDialog = document.getElementById("newTestDialog");
  const newTestForm = document.getElementById("newTestForm");
  const newTestNameInput = document.getElementById("newTestNameInput");
  const newTestSubjectInput = document.getElementById("newTestSubjectInput");
  const cancelNewTestBtn = document.getElementById("cancelNewTestBtn");

  addTestBtn.addEventListener("click", () => {
    newTestNameInput.value = "";
    newTestSubjectInput.value = "";
    newTestDialog.showModal();
  });

  cancelNewTestBtn.addEventListener("click", () => {
    newTestDialog.close();
  });

  if (addSectionBtn) {
    addSectionBtn.addEventListener("click", () => {
      const selectedTest = getSelectedTest();
      if (!selectedTest) {
        return;
      }
      const version = getVersionById(selectedTest, state.selectedConfigVersionId);
      if (!version) {
        return;
      }
      version.sections.push(createSection());
      saveState();
      renderConfig();
      renderTestTable();
    });
  }

  addStudentBtn.addEventListener("click", () => {
    const selectedClass = getSelectedClass();
    if (!selectedClass) {
      return;
    }
    selectedClass.students.push(createStudent());
    saveState();
    renderClassDetail();
  });

  addBulkStudentsBtn.addEventListener("click", () => {
    const selectedClass = getSelectedClass();
    if (!selectedClass) {
      return;
    }

    const entries = bulkStudentsInput.value
      .replace(/\n/g, ",")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    entries.forEach((fullName) => {
      const student = createStudent();
      student.name = fullName;
      selectedClass.students.push(student);
    });

    bulkStudentsInput.value = "";
    saveState();
    renderClassDetail();
  });

  exportBtn.addEventListener("click", exportCSV);

  resetBtn.addEventListener("click", () => {
    if (confirm("Reset all data?")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  });

  classStudentsTable.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-test-id]");
    if (!target) {
      return;
    }
    const testId = target.dataset.testId;
    if (testId) {
      state.selectedTestId = testId;
      saveState();
      renderTestTable();
      setView("test");
    }
  });

  render();

function render() {
  ensureClassState();
  ensureTestState();
  renderClassesList();
  renderClassDetail();
  renderTestsList();
  if (configView) {
    renderConfig();
  }
  renderTestTable();
  updateView();
}

function setView(view) {
  state.view = view;
  saveState();
  updateView();
}

function updateView() {
  const views = [homeView, classView, testsView, testView, configView].filter(Boolean);
  views.forEach((view) => view.classList.remove("active"));

  if (state.view === "config" && !configView) {
    state.view = "home";
  }

  switch (state.view) {
    case "class":
      classView.classList.add("active");
      break;
    case "tests":
      testsView.classList.add("active");
      break;
    case "test":
      testView.classList.add("active");
      break;
    case "config":
      if (configView) {
        configView.classList.add("active");
      } else {
        homeView.classList.add("active");
      }
      break;
    default:
      homeView.classList.add("active");
      break;
  }
}

function renderClassesList() {
  if (!classList) return;
  classList.innerHTML = "";
  state.classes.forEach((classItem) => {
    const card = document.createElement("div");
    card.classList.add("card");

    const title = document.createElement("h3");
    title.textContent = classItem.name || "Class";
    card.appendChild(title);

    const info = document.createElement("small");
    info.textContent = `${classItem.students.length} studenti`;
    card.appendChild(info);

    const openBtn = document.createElement("button");
    openBtn.classList.add("btn", "btn-secondary");
    openBtn.textContent = "Apri";
    openBtn.addEventListener("click", () => {
      state.selectedClassId = classItem.id;
      saveState();
      renderClassDetail();
      setView("class");
    });
    card.appendChild(openBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("icon-btn", "card-delete");
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", "Elimina classe");
    deleteBtn.addEventListener("click", () => {
      if (!confirm("Eliminare questa classe?")) {
        return;
      }
      state.classes = state.classes.filter(
        (item) => item.id !== classItem.id
      );
      ensureClassState();
      saveState();
      render();
    });
    card.appendChild(deleteBtn);

    classList.appendChild(card);
  });
}

function renderClassDetail() {
  const selectedClass = getSelectedClass();
  classSelect.innerHTML = "";
  state.classes.forEach((classItem) => {
    const option = document.createElement("option");
    option.value = classItem.id;
    option.textContent = classItem.name || "Class";
    if (classItem.id === state.selectedClassId) {
      option.selected = true;
    }
    classSelect.appendChild(option);
  });

  classRenameInput.value = selectedClass?.name || "";

  classStudentsTable.innerHTML = "";
  if (!selectedClass) {
    return;
  }

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const studentHeader = document.createElement("th");
  studentHeader.textContent = "Studente";
  headerRow.appendChild(studentHeader);

  state.tests.forEach((test) => {
    const th = document.createElement("th");
    th.innerHTML = `<div>${test.title || "Verifica"}</div>`;
    if (test.subject && test.subject.trim() !== "") {
      const subjectDiv = document.createElement("div");
      subjectDiv.style.fontSize = "11px";
      subjectDiv.style.color = "#666";
      subjectDiv.textContent = test.subject;
      th.appendChild(subjectDiv);
    }
    headerRow.appendChild(th);
  });

  const avgHeader = document.createElement("th");
  avgHeader.textContent = "Media";
  headerRow.appendChild(avgHeader);

  const actionsHeader = document.createElement("th");
  actionsHeader.textContent = "Azioni";
  headerRow.appendChild(actionsHeader);

  thead.appendChild(headerRow);
  classStudentsTable.appendChild(thead);

  const tbody = document.createElement("tbody");

  selectedClass.students.forEach((student) => {
    const row = document.createElement("tr");

    const studentCell = document.createElement("td");
    studentCell.classList.add("student-cell");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = student.name || "";
    nameInput.addEventListener("change", (event) => {
      student.name = event.target.value.trim() || "Student";
      saveState();
      renderClassDetail();
    });
    studentCell.appendChild(nameInput);
    row.appendChild(studentCell);

    state.tests.forEach((test) => {
      const score = getFinalScore(student, test);
      const cell = document.createElement("td");
      const btn = document.createElement("button");
      btn.classList.add("grade-link");
      btn.dataset.testId = test.id;
      btn.textContent = formatScore(score);
      if (isLowGrade(score)) {
        btn.classList.add("low-grade");
      }
      cell.appendChild(btn);
      row.appendChild(cell);
    });

    const avgCell = document.createElement("td");
    const avgScore = getStudentAverage(student);
    avgCell.textContent = formatScore(avgScore);
    if (isLowGrade(avgScore)) {
      avgCell.classList.add("low-grade");
    }
    row.appendChild(avgCell);

    const actionsCell = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("btn", "btn-danger", "btn-small");
    deleteBtn.textContent = "Elimina";
    deleteBtn.addEventListener("click", () => {
      selectedClass.students = selectedClass.students.filter(
        (item) => item.id !== student.id
      );
      saveState();
      renderClassDetail();
    });
    actionsCell.appendChild(deleteBtn);
    row.appendChild(actionsCell);

    tbody.appendChild(row);
  });

  classStudentsTable.appendChild(tbody);
}

function renderTestsList() {
  testsList.innerHTML = "";
  state.tests.forEach((test) => {
    const card = document.createElement("div");
    card.classList.add("card");

    ensureTestVersions(test);
    const defaultVersion = getDefaultVersion(test);

    const title = document.createElement("h3");
    title.textContent = test.title || "Verifica";
    card.appendChild(title);

    // Materia
    if (test.subject && test.subject.trim() !== "") {
      const subject = document.createElement("div");
      subject.classList.add("test-subject");
      subject.textContent = `Materia: ${test.subject}`;
      card.appendChild(subject);
    }

    const info = document.createElement("small");
    info.textContent = `${defaultVersion?.sections.length ?? 0} sezioni`;
    card.appendChild(info);

    const actions = document.createElement("div");
    actions.classList.add("panel-actions");

    const evalBtn = document.createElement("button");
    evalBtn.classList.add("btn", "btn-secondary");
    evalBtn.textContent = "Valuta";
    evalBtn.addEventListener("click", () => {
      state.selectedTestId = test.id;
      saveState();
      renderTestTable();
      setView("test");
    });
    actions.appendChild(evalBtn);
    if (configView) {
      const configBtn = document.createElement("button");
      configBtn.classList.add("btn", "btn-secondary");
      configBtn.textContent = "Configura";
      configBtn.addEventListener("click", () => {
        state.selectedTestId = test.id;
        saveState();
        renderConfig();
        setView("config");
      });
      actions.appendChild(configBtn);
    }
    card.appendChild(actions);

    testsList.appendChild(card);
  });
}

function renderConfig() {
  if (!configView || !configTestSelect || !configVersionSelect || !sectionsContainer) {
    return;
  }
  const selectedTest = getSelectedTest();
  configTestSelect.innerHTML = "";
  state.tests.forEach((test) => {
    const option = document.createElement("option");
    option.value = test.id;
    option.textContent = test.title || "Verifica";
    if (test.id === state.selectedTestId) {
      option.selected = true;
    }
    configTestSelect.appendChild(option);
  });

  testTitleInput.value = selectedTest?.title || "";

  configVersionSelect.innerHTML = "";
  facilitatedVersionSelect.innerHTML = "";
  versionNameInput.value = "";

  if (!selectedTest) {
    sectionsContainer.innerHTML = "";
    return;
  }

  ensureTestVersions(selectedTest);
  ensureVersionSelections();

  selectedTest.versions.forEach((version) => {
    const option = document.createElement("option");
    option.value = version.id;
    option.textContent = version.name || "Versione";
    if (version.id === state.selectedConfigVersionId) {
      option.selected = true;
    }
    configVersionSelect.appendChild(option);

    const facilitatedOption = document.createElement("option");
    facilitatedOption.value = version.id;
    facilitatedOption.textContent = version.name || "Versione";
    if (version.id === selectedTest.facilitatedVersionId) {
      facilitatedOption.selected = true;
    }
    facilitatedVersionSelect.appendChild(facilitatedOption);
  });

  const activeVersion = getVersionById(
    selectedTest,
    state.selectedConfigVersionId
  );
  versionNameInput.value = activeVersion?.name || "";
  renderSections(activeVersion);
}

function renderSections(version) {
  sectionsContainer.innerHTML = "";

  if (!version) {
    return;
  }

  version.sections.forEach((section) => {
    const card = sectionTemplate.content.firstElementChild.cloneNode(true);
    const nameInput = card.querySelector(".section-name");
    const subsectionsContainer = card.querySelector(".subsections");

    nameInput.value = section.name;

    nameInput.addEventListener("change", (event) => {
      section.name = event.target.value;
      saveState();
      renderConfig();
      renderTestTable();
    });


    card.querySelector(".remove-section").addEventListener("click", () => {
      version.sections = version.sections.filter((item) => item.id !== section.id);
      removeSectionScores(section.id, getSelectedTest()?.id);
      saveState();
      renderConfig();
      renderTestTable();
    });

    card.querySelector(".add-subsection").addEventListener("click", () => {
      const lastSubsection = section.subsections[section.subsections.length - 1];
      section.subsections.push(createSubsection(lastSubsection));
      saveState();
      renderConfig();
      renderTestTable();
    });

    section.subsections.forEach((subsection) => {
      const subRow = subsectionTemplate.content.firstElementChild.cloneNode(true);
      const subNameInput = subRow.querySelector(".subsection-name");
      const subWeightInput = subRow.querySelector(".subsection-weight");
      const subMaxInput = subRow.querySelector(".subsection-max");
      subNameInput.value = subsection.name;
      subWeightInput.value = subsection.weight ?? "";
      subMaxInput.value = subsection.max ?? "";

      subNameInput.addEventListener("change", (event) => {
        subsection.name = event.target.value;
        saveState();
        renderTestTable();
      });

      subWeightInput.addEventListener("change", (event) => {
        subsection.weight = parseNumber(event.target.value);
        saveState();
        renderConfig();
        renderTestTable();
      });

      subMaxInput.addEventListener("change", (event) => {
        subsection.max = parseNumber(event.target.value);
        saveState();
        renderConfig();
        renderTestTable();
      });

      subRow.querySelector(".remove-subsection").addEventListener("click", () => {
        section.subsections = section.subsections.filter(
          (item) => item.id !== subsection.id
        );
        removeSubsectionScores(section.id, subsection.id, getSelectedTest()?.id);
        saveState();
        renderConfig();
        renderTestTable();
      });

      subsectionsContainer.appendChild(subRow);
    });

    sectionsContainer.appendChild(card);
  });
}

function renderTestTable() {
  gradeTable.innerHTML = "";
  warningArea.innerHTML = "";

  const selectedClass = getSelectedClass();
  const selectedTest = getSelectedTest();
  const students = selectedClass?.students ?? [];

  testClassSelect.innerHTML = "";
  state.classes.forEach((classItem) => {
    const option = document.createElement("option");
    option.value = classItem.id;
    option.textContent = classItem.name || "Class";
    if (classItem.id === state.selectedClassId) {
      option.selected = true;
    }
    testClassSelect.appendChild(option);
  });

  testSelect.innerHTML = "";
  state.tests.forEach((test) => {
    const option = document.createElement("option");
    option.value = test.id;
    option.textContent = test.title || "Verifica";
    if (test.id === state.selectedTestId) {
      option.selected = true;
    }
    testSelect.appendChild(option);
  });

  if (!selectedTest) {
    return;
  }

  ensureTestVersions(selectedTest);
  ensureVersionSelections();

  testVersionSelect.innerHTML = "";
  selectedTest.versions.forEach((version) => {
    const option = document.createElement("option");
    option.value = version.id;
    option.textContent = version.name || "Versione";
    if (version.id === state.selectedTestVersionId) {
      option.selected = true;
    }
    testVersionSelect.appendChild(option);
  });

  const defaultVersion = getDefaultVersion(selectedTest);
  const activeVersion =
    getVersionById(selectedTest, state.selectedTestVersionId) ??
    defaultVersion;
  const facilitatedVersionId = getFacilitatedVersionId(selectedTest);

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const subHeaderRow = document.createElement("tr");
  const weightRow = document.createElement("tr");
  const maxRow = document.createElement("tr");

  const studentHeader = document.createElement("th");
  studentHeader.textContent = "Studente";
  studentHeader.rowSpan = 4;
  headerRow.appendChild(studentHeader);

  const versionHeader = document.createElement("th");
  versionHeader.textContent = "Facilitata";
  versionHeader.rowSpan = 4;
  headerRow.appendChild(versionHeader);

  const sections = activeVersion?.sections ?? [];

  sections.forEach((section) => {
    if (!Array.isArray(section.subsections)) {
      section.subsections = [];
    }
    if (section.subsections.length === 0) {
      section.subsections.push(
        createSubsection({ weight: section.weight, max: section.max })
      );
      saveState();
    }

    const th = document.createElement("th");
    th.colSpan = section.subsections.length;
    const headerWrap = document.createElement("div");
    headerWrap.classList.add("section-header-cell");

    const sectionNameInput = document.createElement("input");
    sectionNameInput.type = "text";
    sectionNameInput.value = section.name || "Section";
    sectionNameInput.addEventListener("change", (event) => {
      section.name = event.target.value;
      saveState();
      renderTestTable();
    });
    headerWrap.appendChild(sectionNameInput);

    const addColumnBtn = document.createElement("button");
    addColumnBtn.type = "button";
    addColumnBtn.classList.add("btn", "btn-secondary", "btn-small");
    addColumnBtn.textContent = "+";
    addColumnBtn.addEventListener("click", () => {
      const lastSubsection = section.subsections[section.subsections.length - 1];
      section.subsections.push(createSubsection(lastSubsection));
      saveState();
      renderTestTable();
    });
    headerWrap.appendChild(addColumnBtn);

    th.appendChild(headerWrap);
    headerRow.appendChild(th);

    section.subsections.forEach((subsection) => {
      const subTh = document.createElement("th");
      subTh.classList.add("subheader");
      const subHeaderWrap = document.createElement("div");
      subHeaderWrap.classList.add("subheader-cell");
      const subNameInput = document.createElement("input");
      subNameInput.type = "text";
      subNameInput.value = subsection.name || "Subsection";
      subNameInput.addEventListener("change", (event) => {
        subsection.name = event.target.value;
        saveState();
        renderTestTable();
      });
      subHeaderWrap.appendChild(subNameInput);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.classList.add("subsection-remove");
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        section.subsections = section.subsections.filter(
          (item) => item.id !== subsection.id
        );
        removeSubsectionScores(section.id, subsection.id, getSelectedTest()?.id);
        saveState();
        renderTestTable();
      });
      subHeaderWrap.appendChild(removeBtn);

      subTh.appendChild(subHeaderWrap);
      subHeaderRow.appendChild(subTh);

      const weightTh = document.createElement("th");
      weightTh.classList.add("subheader");
      const weightInput = document.createElement("input");
      weightInput.type = "number";
      weightInput.step = "0.1";
      weightInput.min = "0";
      weightInput.value = getSubsectionWeight(subsection);
      weightInput.addEventListener("change", (event) => {
        subsection.weight = parseNumber(event.target.value);
        saveState();
        renderTestTable();
      });
      weightTh.appendChild(weightInput);
      weightRow.appendChild(weightTh);

      const maxTh = document.createElement("th");
      maxTh.classList.add("subheader");
      const maxInput = document.createElement("input");
      maxInput.type = "number";
      maxInput.step = "0.1";
      maxInput.min = "0";
      maxInput.value = getSubsectionMax(
        section,
        subsection,
        getSectionTotals(section).fallbackPerSubMax
      );
      maxInput.addEventListener("change", (event) => {
        subsection.max = parseNumber(event.target.value);
        saveState();
        renderTestTable();
      });
      maxTh.appendChild(maxInput);
      maxRow.appendChild(maxTh);
    });
  });

  const finalHeader = document.createElement("th");
  const finalHeaderWrap = document.createElement("div");
  finalHeaderWrap.classList.add("section-header-cell");
  const addSectionBtn = document.createElement("button");
  addSectionBtn.type = "button";
  addSectionBtn.classList.add("btn", "btn-add-section");
  addSectionBtn.textContent = "+ Section";
  addSectionBtn.addEventListener("click", () => {
    if (!activeVersion) {
      return;
    }
    activeVersion.sections.push(createSection());
    saveState();
    renderTestTable();
  });
  const finalLabel = document.createElement("span");
  finalLabel.textContent = "FINAL";
  finalHeaderWrap.appendChild(addSectionBtn);
  finalHeaderWrap.appendChild(finalLabel);
  finalHeader.appendChild(finalHeaderWrap);
  finalHeader.rowSpan = 4;
  headerRow.appendChild(finalHeader);

  thead.appendChild(headerRow);
  thead.appendChild(subHeaderRow);
  thead.appendChild(weightRow);
  thead.appendChild(maxRow);
  gradeTable.appendChild(thead);

  const tbody = document.createElement("tbody");
  const warnings = [];

  students.forEach((student) => {
    const row = document.createElement("tr");

    const studentVersionId = getStudentVersionId(
      student,
      selectedTest.id,
      defaultVersion?.id
    );
    const isFacilitated = studentVersionId === facilitatedVersionId;
    const isActiveVersion = studentVersionId === activeVersion?.id;

    if (isFacilitated) {
      row.classList.add("facilitated-row");
    }
    if (!isActiveVersion) {
      row.classList.add("version-mismatch");
    }

    const studentCell = document.createElement("td");
    studentCell.classList.add("student-cell");
    const studentInput = document.createElement("input");
    studentInput.type = "text";
    studentInput.value = student.name || "";
    studentInput.addEventListener("change", (event) => {
      student.name = event.target.value;
      saveState();
    });
    studentCell.appendChild(studentInput);
    row.appendChild(studentCell);

    const versionCell = document.createElement("td");
    const versionToggle = document.createElement("input");
    versionToggle.type = "checkbox";
    versionToggle.checked = isFacilitated;
    versionToggle.addEventListener("change", (event) => {
      const nextVersionId = event.target.checked
        ? facilitatedVersionId
        : defaultVersion?.id;
      if (!nextVersionId) {
        return;
      }
      setStudentVersionId(student, selectedTest.id, nextVersionId);
      saveState();
      renderTestTable();
    });
    versionCell.appendChild(versionToggle);
    row.appendChild(versionCell);

    sections.forEach((section) => {
      const sectionScore = getSectionScore(student, selectedTest, section);
      const hasSubsections = section.subsections.length > 0;

      if (hasSubsections) {
        section.subsections.forEach((subsection) => {
          const cell = document.createElement("td");
          const input = createScoreInput(
            student,
            selectedTest.id,
            section.id,
            subsection.id,
            "subsection",
            false
          );
          if (isLowGrade(input.value)) {
            input.classList.add("low-grade");
          }
          cell.appendChild(input);
          row.appendChild(cell);
        });
      } else {
        const cell = document.createElement("td");
        const input = createScoreInput(
          student,
          selectedTest.id,
          section.id,
          null,
          "section",
          false
        );
        if (isLowGrade(input.value)) {
          input.classList.add("low-grade");
        }
        cell.appendChild(input);
        row.appendChild(cell);
      }

      if (getSectionMax(section) != null && sectionScore > getSectionMax(section)) {
        warnings.push(
          `${student.name || "Student"}: ${section.name || "Section"} exceeds max (${sectionScore} > ${getSectionMax(section)})`
        );
      }
    });

    const finalCell = document.createElement("td");
    finalCell.classList.add("final-cell");
    const finalScore = getFinalScore(student, selectedTest, activeVersion);
    finalCell.textContent = formatScore(finalScore);
    if (isLowGrade(finalScore)) {
      finalCell.classList.add("low-grade");
    }
    row.appendChild(finalCell);

    tbody.appendChild(row);
  });

  gradeTable.appendChild(tbody);

  warnings.forEach((message) => {
    const warning = document.createElement("div");
    warning.classList.add("warning");
    warning.textContent = message;
    warningArea.appendChild(warning);
  });
}

function createScoreInput(
  student,
  testId,
  sectionId,
  subsectionId,
  type,
  isDisabled = false
) {
  ensureScoreStore(student, testId, sectionId);
  const input = document.createElement("input");
  input.type = "number";
  input.step = "0.1";
  input.min = "0";
  input.disabled = Boolean(isDisabled);

  if (type === "subsection") {
    const value = student.scores[testId][sectionId].subsections[subsectionId];
    input.value = value ?? "";
  } else {
    input.value = student.scores[testId][sectionId].direct ?? "";
  }

  input.addEventListener("change", (event) => {
    const value = parseNumber(event.target.value);
    if (type === "subsection") {
      student.scores[testId][sectionId].subsections[subsectionId] = value;
    } else {
      student.scores[testId][sectionId].direct = value;
    }
    saveState();
    renderTestTable();
  });

  return input;
}

function ensureScoreStore(student, testId, sectionId) {
  if (!student.scores[testId]) {
    student.scores[testId] = {};
  }
  if (!student.scores[testId][sectionId]) {
    student.scores[testId][sectionId] = { subsections: {}, direct: null };
  }
  if (!student.scores[testId][sectionId].subsections) {
    student.scores[testId][sectionId].subsections = {};
  }
}

function getSectionScore(student, test, section) {
  ensureScoreStore(student, test.id, section.id);
  if (section.subsections.length > 0) {
    const totals = getSectionTotals(section);
    if (totals.totalWeight <= 0 || totals.totalMax <= 0) {
      return 0;
    }
    const weightedRatioSum = section.subsections.reduce((sum, subsection) => {
      const value = parseNumber(
        student.scores[test.id][section.id].subsections[subsection.id]
      ) ?? 0;
      const max = getSubsectionMax(section, subsection, totals.fallbackPerSubMax);
      const weight = getSubsectionWeight(subsection);
      if (max <= 0 || weight <= 0) {
        return sum;
      }
      return sum + (value / max) * weight;
    }, 0);
    const averageRatio = weightedRatioSum / totals.totalWeight;
    return averageRatio * totals.totalMax;
  }

  return parseNumber(student.scores[test.id][section.id].direct) ?? 0;
}

function getFinalScore(student, test, version) {
  if (!test) {
    return null;
  }
  const targetVersion =
    version ??
    getVersionById(
      test,
      getStudentVersionId(student, test.id, getDefaultVersion(test)?.id)
    );
  const sections = targetVersion?.sections ?? [];
  let weightedSum = 0;
  let weightedMaxSum = 0;

  sections.forEach((section) => {
    const score = getSectionScore(student, test, section);
    const weight = getSectionWeight(section) ?? 0;
    const max = getSectionMax(section) ?? 0;
    if (weight > 0 && max > 0) {
      weightedSum += score * weight;
      weightedMaxSum += max * weight;
    }
  });

  if (weightedMaxSum === 0) {
    return null;
  }

  return (weightedSum * 10) / weightedMaxSum;
}

function removeSectionScores(sectionId, testId) {
  if (!testId) {
    return;
  }
  state.classes.forEach((classItem) => {
    classItem.students.forEach((student) => {
      if (student.scores?.[testId]) {
        delete student.scores[testId][sectionId];
      }
    });
  });
}

function removeSubsectionScores(sectionId, subsectionId, testId) {
  if (!testId) {
    return;
  }
  state.classes.forEach((classItem) => {
    classItem.students.forEach((student) => {
      if (student.scores?.[testId]?.[sectionId]?.subsections) {
        delete student.scores[testId][sectionId].subsections[subsectionId];
      }
    });
  });
}

function formatSectionTitle(section) {
  const name = section.name || "Section";
  const sectionWeight = getSectionWeight(section);
  const sectionMax = getSectionMax(section);
  const weight = sectionWeight != null ? `w:${sectionWeight}` : "w:?";
  const max = sectionMax != null ? `max:${sectionMax}` : "max:?";
  return `${name} (${weight}, ${max})`;
}

function formatScore(score) {
  if (score === null || score === undefined) {
    return "";
  }
  return Math.round(score * 10) / 10;
}

function isLowGrade(value) {
  const numeric = parseNumber(value);
  return numeric != null && numeric < 6;
}

function parseNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function ensureTestVersions(test) {
  if (!test) {
    return;
  }
  if (!Array.isArray(test.versions) || test.versions.length === 0) {
    const baseSections = Array.isArray(test.sections) ? test.sections : [];
    test.versions = [
      {
        id: createId("ver"),
        name: "Standard",
        sections: baseSections,
      },
    ];
  }
  test.versions.forEach((version) => {
    if (!version.id) {
      version.id = createId("ver");
    }
    if (!version.name) {
      version.name = "Versione";
    }
    if (!Array.isArray(version.sections)) {
      version.sections = [];
    }
  });
  if (!test.facilitatedVersionId) {
    test.facilitatedVersionId =
      test.versions[1]?.id ?? test.versions[0]?.id ?? null;
  }
}

function ensureVersionSelections() {
  const selectedTest = getSelectedTest();
  if (!selectedTest) {
    return;
  }
  ensureTestVersions(selectedTest);
  const versions = selectedTest.versions;
  if (
    !state.selectedTestVersionId ||
    !versions.some((version) => version.id === state.selectedTestVersionId)
  ) {
    state.selectedTestVersionId = versions[0]?.id ?? null;
  }
  if (
    !state.selectedConfigVersionId ||
    !versions.some((version) => version.id === state.selectedConfigVersionId)
  ) {
    state.selectedConfigVersionId = versions[0]?.id ?? null;
  }
}

function getVersionById(test, versionId) {
  if (!test || !versionId) {
    return null;
  }
  return test.versions?.find((version) => version.id === versionId) ?? null;
}

function getDefaultVersion(test) {
  if (!test) {
    return null;
  }
  ensureTestVersions(test);
  return test.versions[0] ?? null;
}

function getFacilitatedVersionId(test) {
  if (!test) {
    return null;
  }
  ensureTestVersions(test);
  if (!test.facilitatedVersionId) {
    test.facilitatedVersionId =
      test.versions[1]?.id ?? test.versions[0]?.id ?? null;
  }
  return test.facilitatedVersionId;
}

function getStudentVersionId(student, testId, fallbackVersionId) {
  if (!student) {
    return fallbackVersionId ?? null;
  }
  if (!student.testVersions) {
    student.testVersions = {};
  }
  return student.testVersions[testId] ?? fallbackVersionId ?? null;
}

function setStudentVersionId(student, testId, versionId) {
  if (!student) {
    return;
  }
  if (!student.testVersions) {
    student.testVersions = {};
  }
  student.testVersions[testId] = versionId;
}

function createVersionFrom(baseVersion, test) {
  const existingNames = (test?.versions ?? []).map((version) => version.name);
  const suggestedName = existingNames.includes("Facilitata")
    ? `Versione ${existingNames.length + 1}`
    : "Facilitata";

  return {
    id: createId("ver"),
    name: suggestedName,
    sections: cloneSections(baseVersion?.sections ?? []),
  };
}

function cloneSections(sections) {
  return sections.map((section) => ({
    id: createId("sec"),
    name: section.name,
    weight: section.weight,
    max: section.max,
    subsections: (section.subsections ?? []).map((subsection) => ({
      id: createId("sub"),
      name: subsection.name,
      weight: subsection.weight,
      max: subsection.max,
    })),
  }));
}

function createSection() {
  return {
    id: createId("sec"),
    name: "New Section",
    weight: 1,
    max: 10,
    subsections: [createSubsection()],
  };
}

function createSubsection(base = null) {
  return {
    id: createId("sub"),
    name: "New Subsection",
    weight: parseNumber(base?.weight) ?? 1,
    max: parseNumber(base?.max) ?? 1,
  };
}

function getSubsectionWeight(subsection) {
  return parseNumber(subsection?.weight) ?? 1;
}

function getSectionTotals(section) {
  const subsections = section?.subsections ?? [];
  const fallbackMax = parseNumber(section?.max) ?? 0;
  const fallbackPerSub = subsections.length > 0 ? fallbackMax / subsections.length : 0;
  return subsections.reduce(
    (totals, subsection) => {
      totals.totalWeight += getSubsectionWeight(subsection);
      totals.totalMax += getSubsectionMax(section, subsection, fallbackPerSub);
      return totals;
    },
    { totalWeight: 0, totalMax: 0, fallbackPerSubMax: fallbackPerSub }
  );
}

function getSubsectionMax(section, subsection, fallbackPerSub = null) {
  const explicitMax = parseNumber(subsection?.max);
  if (explicitMax != null) {
    return explicitMax;
  }
  if (fallbackPerSub != null) {
    return fallbackPerSub;
  }
  const fallbackMax = parseNumber(section?.max) ?? 0;
  const count = section?.subsections?.length ?? 0;
  return count > 0 ? fallbackMax / count : 0;
}

function getSectionWeight(section) {
  if (section?.subsections?.length) {
    return getSectionTotals(section).totalWeight;
  }
  return parseNumber(section?.weight) ?? 1;
}

function getSectionMax(section) {
  if (section?.subsections?.length) {
    return getSectionTotals(section).totalMax;
  }
  return parseNumber(section?.max) ?? null;
}

function createStudent() {
  return {
    id: createId("stu"),
    name: "New Student",
    scores: {},
    testVersions: {},
  };
}

function createTest(title, subject) {
  const baseVersion = {
    id: createId("ver"),
    name: "Standard",
    sections: [],
  };
  return {
    id: createId("test"),
    title: title || "New Test",
    subject: subject || "",
    versions: [baseVersion],
    facilitatedVersionId: baseVersion.id,
  };
  }
// Gestione submit del form per nuova verifica
  newTestForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = newTestNameInput.value.trim() || generateTestName();
    const subject = newTestSubjectInput.value.trim();
    const newTest = createTest(name, subject);
    state.tests.push(newTest);
    state.selectedTestId = newTest.id;
    state.selectedTestVersionId = newTest.versions[0]?.id ?? null;
    state.selectedConfigVersionId = newTest.versions[0]?.id ?? null;
    saveState();
    render();
    setView("tests");
    renderTestsList(); // forza aggiornamento lista se la vista è già attiva
    newTestDialog.close();
  });


function createClass(name) {
  return {
    id: createId("class"),
    name: name || "New Class",
    students: [],
  };
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function getStudentAverage(student) {
  if (!state.tests.length) {
    return 0;
  }
  const scores = state.tests
    .map((test) => getFinalScore(student, test))
    .filter((value) => value !== null && value !== undefined);

  if (scores.length === 0) {
    return 0;
  }

  const sum = scores.reduce((total, value) => total + value, 0);
  return sum / scores.length;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(defaultData);
  }

  try {
    const parsed = JSON.parse(saved);
    const classesFromOld = parsed.students
      ? [
          {
            id: createId("class"),
            name: "Class 1",
            students: parsed.students ?? [],
          },
        ]
      : null;

    const testsFromOld = parsed.sections
      ? [
          {
            id: createId("test"),
            title: parsed.title ?? "New Test",
            subject: parsed.subject ?? "",
            sections: parsed.sections ?? [],
          },
        ]
      : null;

    const classes = parsed.classes ?? classesFromOld ?? [];
    // Assicura che ogni test abbia la proprietà subject
    const tests = (parsed.tests ?? testsFromOld ?? []).map(test => ({
      ...test,
      subject: typeof test.subject === 'string' ? test.subject : ""
    }));

    const selectedClassId = parsed.selectedClassId ?? classes[0]?.id ?? null;
    const selectedTestId = parsed.selectedTestId ?? tests[0]?.id ?? null;
    const selectedTestVersionId = parsed.selectedTestVersionId ?? null;
    const selectedConfigVersionId = parsed.selectedConfigVersionId ?? null;
    const view = parsed.view ?? "home";

    const data = {
      classes,
      tests,
      selectedClassId,
      selectedTestId,
      selectedTestVersionId,
      selectedConfigVersionId,
      view,
    };

    tests.forEach((testItem) => {
      ensureTestVersions(testItem);
    });

    if (tests[0]) {
      normalizeStudentScores(classes, tests[0]);
    }

    return data;
  } catch (error) {
    return structuredClone(defaultData);
  }
}

function exportCSV() {
  const selectedClass = getSelectedClass();
  const selectedTest = getSelectedTest();
  const students = selectedClass?.students ?? [];
  if (!selectedTest) {
    return;
  }
  ensureTestVersions(selectedTest);
  ensureVersionSelections();
  const activeVersion = getVersionById(
    selectedTest,
    state.selectedTestVersionId
  );
  const headers = ["Student", "Versione"];

  (activeVersion?.sections ?? []).forEach((section) => {
    if (section.subsections.length > 0) {
      section.subsections.forEach((subsection) => {
        headers.push(`${section.name} - ${subsection.name}`);
      });
      headers.push(`${section.name} - Total`);
    } else {
      headers.push(section.name);
    }
  });

  headers.push("Final Grade");

  const rows = students.map((student) => {
    const versionId = getStudentVersionId(
      student,
      selectedTest.id,
      getDefaultVersion(selectedTest)?.id
    );
    const versionLabel = getVersionById(selectedTest, versionId)?.name || "";
    const row = [student.name, versionLabel];

    (activeVersion?.sections ?? []).forEach((section) => {
      if (section.subsections.length > 0) {
        section.subsections.forEach((subsection) => {
          const value =
            student.scores[selectedTest.id]?.[section.id]?.subsections?.[
              subsection.id
            ] ?? "";
          row.push(value);
        });
        row.push(getSectionScore(student, selectedTest, section));
      } else {
        const value =
          student.scores[selectedTest.id]?.[section.id]?.direct ?? "";
        row.push(value);
      }
    });

    row.push(formatScore(getFinalScore(student, selectedTest, activeVersion)));
    return row;
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const classLabel = selectedClass?.name ? `-${selectedClass.name}` : "";
  link.download = `${(selectedTest.title || "grades").replace(/\s+/g, "-")}${classLabel.replace(/\s+/g, "-")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getSelectedClass() {
  if (!state.classes || state.classes.length === 0) {
    return null;
  }
  const selected = state.classes.find(
    (classItem) => classItem.id === state.selectedClassId
  );
  return selected ?? state.classes[0];
}

function getSelectedTest() {
  if (!state.tests || state.tests.length === 0) {
    return null;
  }
  const selected = state.tests.find(
    (testItem) => testItem.id === state.selectedTestId
  );
  return selected ?? state.tests[0];
}

function ensureClassState() {
  if (!state.classes || state.classes.length === 0) {
    state.classes = [createClass("Class 1")];
  }
  const hasSelected = state.classes.some(
    (classItem) => classItem.id === state.selectedClassId
  );
  if (!state.selectedClassId || !hasSelected) {
    state.selectedClassId = state.classes[0]?.id ?? null;
  }
}

function ensureTestState() {
  if (!state.tests || state.tests.length === 0) {
    state.tests = [createTest("Test 1")];
  }
  state.tests.forEach((test) => ensureTestVersions(test));
  const hasSelected = state.tests.some(
    (testItem) => testItem.id === state.selectedTestId
  );
  if (!state.selectedTestId || !hasSelected) {
    state.selectedTestId = state.tests[0]?.id ?? null;
  }
  ensureVersionSelections();
}

function generateClassName() {
  const count = state.classes?.length ?? 0;
  return `Class ${count + 1}`;
}

function generateTestName() {
  const count = state.tests?.length ?? 0;
  return `Test ${count + 1}`;
}

function normalizeStudentScores(classes, test) {
  const sectionIds = (getDefaultVersion(test)?.sections ?? []).map(
    (section) => section.id
  );
  classes.forEach((classItem) => {
    classItem.students.forEach((student) => {
      if (!student.scores) {
        student.scores = {};
      }
      const hasTestScores = Boolean(student.scores[test.id]);
      const looksOld = Object.keys(student.scores).some((key) =>
        sectionIds.includes(key)
      );
      if (!hasTestScores && looksOld) {
        const oldScores = student.scores;
        student.scores = {};
        student.scores[test.id] = oldScores;
      }
    });
  });
}

function escapeCsv(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
