document.addEventListener("DOMContentLoaded", () => {
  let appData = { projects: [] };
  let currentProject = null;
  let targetTaskStatus = null;
  let currentTargetTaskId = null;
  let currentParentId = null;
  let currentTaskIdToDelete = null;

  // --- Element Selectors ---
  const sidebarEl = document.getElementById("sidebar");
  const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const projectListContainer = document.getElementById(
    "project-list-container"
  );
  const sidebarDropZone = document.getElementById("sidebar-drop-zone");
  const projectTitleEl = document.getElementById("project-title");
  const descriptionDisplayEl = document.getElementById(
    "project-description-display"
  );
  const expandDescriptionBtn = document.getElementById(
    "expand-description-btn"
  );
  const projectHeaderEl = document.getElementById("project-header");
  const projectContentView = document.getElementById("project-content-view");
  const subProjectListContainer = document.getElementById(
    "sub-project-list-container"
  );
  const taskBoardContainer = document.getElementById("task-board-container");
  const noProjectSelectedView = document.getElementById(
    "no-project-selected-view"
  );
  const addTopLevelProjectBtn = document.getElementById("add-project-btn");
  const deleteProjectBtn = document.getElementById("delete-project-btn");
  const addProjectModal = new bootstrap.Modal(
    document.getElementById("addProjectModal")
  );
  const addProjectForm = document.getElementById("addProjectForm");
  const projectNameInput = document.getElementById("projectName");
  const projectDescriptionInput = document.getElementById("projectDescription");
  const addProjectModalLabel = document.getElementById("addProjectModalLabel");
  const addTaskModalEl = document.getElementById("addTaskModal"); // Get the element
  const addTaskModal = new bootstrap.Modal(addTaskModalEl);
  const addTaskForm = document.getElementById("addTaskForm");
  const taskTitleInput = document.getElementById("taskTitle"); // Now a textarea
  const addProgressModal = new bootstrap.Modal(
    document.getElementById("addProgressModal")
  );
  const addProgressForm = document.getElementById("addProgressForm");
  const progressNoteInput = document.getElementById("progressNote");
  const descriptionModal = new bootstrap.Modal(
    document.getElementById("descriptionModal")
  );
  const descriptionModalLabel = document.getElementById(
    "descriptionModalLabel"
  );
  const descriptionModalBody = document.getElementById("descriptionModalBody");
  const deleteProjectModal = new bootstrap.Modal(
    document.getElementById("deleteProjectModal")
  );
  const deletionTreeContainer = document.getElementById(
    "deletion-tree-container"
  );
  const projectNameToDelete = document.getElementById("project-name-to-delete");
  const deleteConfirmationInput = document.getElementById(
    "delete-confirmation-input"
  );
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const deleteTaskModal = new bootstrap.Modal(
    document.getElementById("deleteTaskModal")
  );
  const taskTitleToDelete = document.getElementById("task-title-to-delete");
  const confirmDeleteTaskBtn = document.getElementById(
    "confirm-delete-task-btn"
  );

  // --- Mobile Sidebar Controls ---
  function openSidebar() {
    sidebarEl.classList.add("open");
    sidebarOverlay.classList.add("active");
  }
  function closeSidebar() {
    sidebarEl.classList.remove("open");
    sidebarOverlay.classList.remove("active");
  }
  sidebarToggleBtn.addEventListener("click", openSidebar);
  sidebarOverlay.addEventListener("click", closeSidebar);

  function highlightActiveProject(projectId) {
    document
      .querySelectorAll(".project-item")
      .forEach((p) => p.classList.remove("active"));
    if (!projectId) return;
    const selectedEl = document.querySelector(
      `.project-item[data-project-id="${projectId}"]`
    );
    if (selectedEl) selectedEl.classList.add("active");
  }

  function updateDescriptionView() {
    if (
      !currentProject ||
      !descriptionDisplayEl.textContent ||
      descriptionDisplayEl.textContent === "Click to add a description."
    ) {
      expandDescriptionBtn.classList.add("d-none");
      descriptionDisplayEl.classList.remove("collapsed");
      return;
    }
    descriptionDisplayEl.classList.remove("collapsed");
    expandDescriptionBtn.classList.add("d-none");
    expandDescriptionBtn.classList.remove("expanded");
    expandDescriptionBtn.querySelector("i").className = "bi bi-three-dots";
    expandDescriptionBtn.title = "View full description";
    const lineHeight = parseFloat(
      getComputedStyle(descriptionDisplayEl).lineHeight
    );
    const isMobile = window.innerWidth <= 992;
    const lineLimit = isMobile ? 5 : 7;
    const maxHeight = lineHeight * lineLimit;
    if (descriptionDisplayEl.scrollHeight > maxHeight + lineHeight * 0.5) {
      descriptionDisplayEl.classList.add("collapsed");
      expandDescriptionBtn.classList.remove("d-none");
      if (isMobile) {
        expandDescriptionBtn.querySelector("i").className =
          "bi bi-chevron-down";
        expandDescriptionBtn.title = "Show more";
      }
    }
  }

  // --- Rendering ---
  function renderTasks() {
    document
      .querySelectorAll(".task-list")
      .forEach((list) => (list.innerHTML = ""));
    if (!currentProject || !currentProject.tasks) return;
    currentProject.tasks.forEach((task) => {
      const taskListEl = document.getElementById(
        task.status.replace(/\s+/g, "-").toLowerCase()
      );
      if (taskListEl) {
        const taskCard = document.createElement("div");
        taskCard.className = "task-card";
        taskCard.setAttribute("draggable", true);
        taskCard.dataset.taskId = task.id;
        let progressHTML =
          task.progress && task.progress.length > 0
            ? `<ul class="progress-list">${task.progress
                .map((p) => {
                  const progressDate = new Date(p.created_at);
                  const progressDateTime = !isNaN(progressDate)
                    ? progressDate.toLocaleString()
                    : "N/A";
                  return `<li class="progress-item" data-progress-id="${p.id}">
                                    <em class="progress-note-text">${p.note}</em>
                                    <div class="progress-date">${progressDateTime}</div>
                                </li>`;
                })
                .join("")}</ul>`
            : "";
        taskCard.innerHTML = `
                    <div class="task-card-main-content">
                        <h6 class="task-title-text">${task.title}</h6>
                        ${progressHTML}
                    </div>
                    <div class="task-card-footer">
                        <button class="btn btn-sm btn-outline-danger delete-task-btn" title="Delete Task">
                            <i class="bi bi-trash"></i>
                        </button>
                        <div class="task-card-actions">
                             <button class="btn btn-sm btn-outline-secondary add-progress-btn" data-task-id="${task.id}">+ Update Progress</button>
                        </div>
                    </div>
                `;
        taskCard.addEventListener("dragstart", handleDragStart);
        taskCard.addEventListener("dragend", handleDragEnd);
        const taskTitleEl = taskCard.querySelector(".task-title-text");
        taskTitleEl.addEventListener("click", () =>
          makeTaskTitleEditable(taskTitleEl, task.id)
        );
        taskCard
          .querySelectorAll(".progress-note-text")
          .forEach((progressNoteEl) => {
            const progressId =
              progressNoteEl.closest(".progress-item").dataset.progressId;
            progressNoteEl.addEventListener("dblclick", () =>
              makeProgressNoteEditable(progressNoteEl, task.id, progressId)
            );
          });
        taskCard
          .querySelector(".add-progress-btn")
          .addEventListener("click", (e) => {
            currentTargetTaskId = e.currentTarget.dataset.taskId;
            addProgressForm.reset();
            addProgressModal.show();
          });
        taskCard
          .querySelector(".delete-task-btn")
          .addEventListener("click", (e) => {
            e.stopPropagation();
            currentTaskIdToDelete = task.id;
            taskTitleToDelete.textContent = task.title;
            deleteTaskModal.show();
          });
        taskListEl.appendChild(taskCard);
      }
    });
  }

  function renderProjectHeader(projectId) {
    if (!projectTitleEl) return;
    projectTitleEl.innerHTML = "";
    const path = findProjectPath(projectId);
    if (!path) return;
    path.forEach((item, index) => {
      if (index < path.length - 1) {
        const part = document.createElement("span");
        part.className = "project-breadcrumb-link";
        part.textContent = item.name;
        part.dataset.projectId = item.id;
        part.title = `Go to ${item.name}`;
        part.addEventListener("click", () => selectProject(item.id));
        projectTitleEl.appendChild(part);

        const separator = document.createElement("span");
        separator.className = "project-breadcrumb-separator";
        separator.textContent = " / ";
        projectTitleEl.appendChild(separator);
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.value = item.name;
        input.className = "editable-project-title";
        input.dataset.originalName = item.name;
        input.addEventListener("blur", handleRename);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") input.blur();
          if (e.key === "Escape") {
            input.value = input.dataset.originalName;
            input.blur();
          }
        });
        projectTitleEl.appendChild(input);
      }
    });
  }

  function selectProject(projectId) {
    currentProject = findProjectById(projectId, appData.projects);
    if (!currentProject) {
      localStorage.removeItem("lastSelectedProjectId");
      showNoProjectView();
      return;
    }
    localStorage.setItem("lastSelectedProjectId", projectId);
    noProjectSelectedView.style.display = "none";
    projectHeaderEl.style.display = "flex";
    projectContentView.style.display = "flex";
    deleteProjectBtn.style.display = "inline-block";
    renderProjectHeader(projectId);
    descriptionDisplayEl.textContent =
      currentProject.description || "Click to add a description.";
    updateDescriptionView();
    highlightActiveProject(projectId);
    if (currentProject.subProjects && currentProject.subProjects.length > 0) {
      subProjectListContainer.innerHTML = "";
      subProjectListContainer.style.display = "grid";
      taskBoardContainer.style.display = "none";
      currentProject.subProjects.forEach((sub) => {
        const tile = document.createElement("div");
        tile.className = "subproject-tile";
        tile.dataset.projectId = sub.id;
        const description = sub.description || "";
        tile.innerHTML = `<div><h5>${sub.name}</h5><p class="subproject-tile-description">${description}</p></div><div class="more-btn-container" style="display: none;"><button class="btn btn-sm btn-outline-secondary more-btn" data-project-id="${sub.id}">More</button></div>`;
        tile.addEventListener("click", (e) => {
          if (!e.target.closest(".more-btn")) selectProject(sub.id);
        });
        subProjectListContainer.appendChild(tile);
        const descriptionEl = tile.querySelector(
          ".subproject-tile-description"
        );
        if (descriptionEl.scrollHeight > descriptionEl.clientHeight) {
          const moreBtnContainer = tile.querySelector(".more-btn-container");
          if (moreBtnContainer) moreBtnContainer.style.display = "block";
        }
      });
    } else {
      subProjectListContainer.style.display = "none";
      taskBoardContainer.style.display = "flex";
      renderTasks();
    }
    closeSidebar();
  }

  function showNoProjectView() {
    currentProject = null;
    localStorage.removeItem("lastSelectedProjectId");
    projectHeaderEl.style.display = "none";
    projectContentView.style.display = "none";
    noProjectSelectedView.style.display = "flex";
    noProjectSelectedView.innerHTML = `<div class="d-flex align-items-center"><button class="btn btn-outline-secondary me-3 d-lg-none" id="sidebar-toggle-btn-main"><i class="bi bi-list"></i></button><div><h2 class="text-body-secondary fw-light">Select a Project</h2><p class="text-body-secondary">Choose a project from the sidebar to get started.</p></div></div>`;
    document
      .getElementById("sidebar-toggle-btn-main")
      ?.addEventListener("click", openSidebar);
    deleteProjectBtn.style.display = "none";
    highlightActiveProject(null);
  }

  if (descriptionDisplayEl) {
    descriptionDisplayEl.addEventListener("click", () => {
      if (!currentProject) return;
      const currentDesc = descriptionDisplayEl.textContent;
      const textarea = document.createElement("textarea");
      textarea.className = "editable-description";
      textarea.value =
        currentDesc === "Click to add a description." ? "" : currentDesc;
      descriptionDisplayEl.replaceWith(textarea);
      textarea.focus();
      const autoResize = () => {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      };
      textarea.addEventListener("input", autoResize);
      setTimeout(autoResize, 0);
      const saveChanges = async () => {
        const newDesc = textarea.value.trim();
        const originalDesc = currentProject.description || "";
        textarea.replaceWith(descriptionDisplayEl);
        currentProject.description = newDesc;
        descriptionDisplayEl.textContent =
          newDesc || "Click to add a description.";
        updateDescriptionView();
        renderSidebar();
        highlightActiveProject(currentProject.id);
        try {
          await fetch(`/api/projects/${currentProject.id}/describe`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: newDesc }),
          });
        } catch (error) {
          console.error("Error updating description:", error);
          alert("Failed to save description.");
          currentProject.description = originalDesc;
          descriptionDisplayEl.textContent =
            originalDesc || "Click to add a description.";
          updateDescriptionView();
          renderSidebar();
          highlightActiveProject(currentProject.id);
        }
      };
      textarea.addEventListener("blur", saveChanges);
      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          textarea.blur();
        }
        if (e.key === "Escape") {
          textarea.value = currentProject.description || "";
          textarea.blur();
        }
      });
    });
  }

  async function initializeApp() {
    await loadData();
    const lastProjectId = localStorage.getItem("lastSelectedProjectId");
    if (lastProjectId && findProjectById(lastProjectId, appData.projects)) {
      selectProject(lastProjectId);
    } else {
      showNoProjectView();
    }
  }
  async function loadData() {
    try {
      const response = await fetch("/api/data");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      appData = await response.json();
      renderSidebar();
    } catch (error) {
      console.error("Could not load data:", error);
      if (projectListContainer)
        projectListContainer.innerHTML =
          '<p class="text-danger">Error loading projects.</p>';
    }
  }
  function renderSidebar() {
    if (!projectListContainer) return;
    projectListContainer.innerHTML = "";
    if (appData.projects) {
      appData.projects.forEach((project) => {
        projectListContainer.appendChild(createProjectElement(project, 0));
      });
    }
  }
  function createProjectElement(project, depth) {
    const container = document.createDocumentFragment();
    const projEl = document.createElement("div");
    projEl.className = "project-item";
    projEl.dataset.projectId = project.id;
    projEl.draggable = true;
    projEl.style.paddingLeft = `${0.5 + depth * 1.5}rem`;
    const descriptionHTML = project.description
      ? `<div class="project-item-description">${project.description}</div>`
      : "";
    projEl.innerHTML = `<div class="project-item-main"><span class="project-item-name">${project.name}</span><button class="btn btn-sm btn-outline-secondary add-subproject-btn" data-parent-id="${project.id}" title="Add Sub-Project"><i class="bi bi-plus"></i></button></div>${descriptionHTML}`;
    projEl.addEventListener("click", (e) => {
      if (e.target.closest(".add-subproject-btn")) return;
      selectProject(project.id);
    });
    projEl.addEventListener("dragstart", (e) => {
      e.stopPropagation();
      e.dataTransfer.setData("text/plain", project.id);
      setTimeout(() => projEl.classList.add("dragging"), 0);
    });
    projEl.addEventListener(
      "dragend",
      (e) => e.stopPropagation() || projEl.classList.remove("dragging")
    );
    projEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      projEl.classList.add("drag-over");
    });
    projEl.addEventListener(
      "dragleave",
      (e) => e.stopPropagation() || projEl.classList.remove("drag-over")
    );
    projEl.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      projEl.classList.remove("drag-over");
      const droppedProjectId = e.dataTransfer.getData("text/plain");
      const targetProjectId = projEl.dataset.projectId;
      if (
        droppedProjectId === targetProjectId ||
        isDescendant(targetProjectId, droppedProjectId)
      ) {
        return;
      }
      moveProject(droppedProjectId, targetProjectId);
    });
    container.appendChild(projEl);
    if (project.subProjects && project.subProjects.length > 0) {
      const sublist = document.createElement("div");
      project.subProjects.forEach((sub) =>
        sublist.appendChild(createProjectElement(sub, depth + 1))
      );
      container.appendChild(sublist);
    }
    return container;
  }
  function makeTaskTitleEditable(element, taskId) {
    if (element.closest(".task-card.dragging")) return;
    const originalTitle = element.textContent;
    const textarea = document.createElement("textarea");
    textarea.className = "editable-task-title";
    textarea.value = originalTitle;
    element.replaceWith(textarea);
    textarea.focus();
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
    const saveChanges = async () => {
      const newTitle = textarea.value.trim();
      element.textContent = newTitle || originalTitle;
      textarea.replaceWith(element);
      if (newTitle && newTitle !== originalTitle) {
        const task = currentProject.tasks.find((t) => t.id === taskId);
        if (task) task.title = newTitle;
        try {
          await fetch(`/api/tasks/${taskId}/rename`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
          });
        } catch (error) {
          console.error("Error updating task title:", error);
          alert("Failed to save task title.");
          element.textContent = originalTitle;
          if (task) task.title = originalTitle;
        }
      }
    };
    textarea.addEventListener("blur", saveChanges);
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        textarea.blur();
      }
      if (e.key === "Escape") {
        element.textContent = originalTitle;
        textarea.replaceWith(element);
      }
    });
    textarea.addEventListener("input", () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }
  function makeProgressNoteEditable(element, taskId, progressId) {
    const originalNote = element.textContent;
    const textarea = document.createElement("textarea");
    textarea.className = "editable-progress-note";
    textarea.value = originalNote;
    textarea.rows = 3;
    element.replaceWith(textarea);
    textarea.focus();
    const saveChanges = async () => {
      const newNote = textarea.value.trim();
      element.textContent = newNote || originalNote;
      textarea.replaceWith(element);
      if (newNote && newNote !== originalNote) {
        const task = currentProject.tasks.find((t) => t.id === taskId);
        const progress = task?.progress.find((p) => p.id === progressId);
        if (progress) progress.note = newNote;
        try {
          await fetch(`/api/progress/${progressId}/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note: newNote }),
          });
        } catch (error) {
          console.error("Error updating progress note:", error);
          alert("Failed to save progress note.");
          element.textContent = originalNote;
          if (progress) progress.note = originalNote;
        }
      }
    };
    textarea.addEventListener("blur", saveChanges);
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        textarea.blur();
      }
      if (e.key === "Escape") {
        element.textContent = originalNote;
        textarea.replaceWith(element);
      }
    });
  }
  function buildDeletionTree(project, depth = 0) {
    const li = document.createElement("li");
    li.style.paddingLeft = `${depth * 20}px`;
    li.innerHTML = `<span><i class="bi bi-folder-minus"></i> <span class="${
      depth === 0 ? "deleted-project-name" : ""
    }">${project.name}</span></span>`;
    const ul = document.createElement("ul");
    if (project.subProjects && project.subProjects.length > 0) {
      project.subProjects.forEach((sub) => {
        ul.appendChild(buildDeletionTree(sub, depth + 1));
      });
    }
    li.appendChild(ul);
    return li;
  }
  async function deleteProject() {
    if (!currentProject) return;
    try {
      const response = await fetch(`/api/projects/${currentProject.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete project.");
      }
      deleteProjectModal.hide();
      await loadData();
      showNoProjectView();
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(`Failed to delete project: ${error.message}`);
    }
  }
  function findProjectById(id, projects) {
    for (const project of projects) {
      if (project.id === id) return project;
      if (project.subProjects) {
        const found = findProjectById(id, project.subProjects);
        if (found) return found;
      }
    }
    return null;
  }
  function findProjectPath(projectId, data = appData, path = []) {
    for (const project of data.projects) {
      const currentPath = [...path, project];
      if (project.id === projectId) return currentPath;
      if (project.subProjects) {
        const foundPath = findProjectPath(
          projectId,
          { projects: project.subProjects },
          currentPath
        );
        if (foundPath) return foundPath;
      }
    }
    return null;
  }
  function isDescendant(childId, parentId) {
    const parent = findProjectById(parentId, appData.projects);
    if (!parent || !parent.subProjects) return false;
    for (const subProject of parent.subProjects) {
      if (subProject.id === childId) return true;
      if (isDescendant(childId, subProject.id)) return true;
    }
    return false;
  }
  async function moveProject(projectId, newParentId) {
    try {
      await fetch(`/api/projects/${projectId}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newParentId: newParentId || null }),
      });
      await loadData();
      highlightActiveProject(currentProject.id);
    } catch (error) {
      console.error("Error moving project:", error);
      alert("Failed to move project.");
    }
  }
  async function handleRename(e) {
    const input = e.target;
    const newName = input.value.trim();
    const originalName = input.dataset.originalName;
    if (!newName || newName === originalName) {
      input.value = originalName;
      return;
    }
    try {
      await fetch(`/api/projects/${currentProject.id}/rename`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      await loadData();
    } catch (error) {
      console.error("Error renaming project:", error);
      alert(`Error: ${error.message}`);
      input.value = originalName;
    }
  }
  addTopLevelProjectBtn.addEventListener("click", () => {
    currentParentId = null;
    addProjectModalLabel.textContent = "Add New Top-Level Project";
    addProjectForm.reset();
    addProjectModal.show();
  });
  projectListContainer.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-subproject-btn");
    if (addBtn) {
      e.stopPropagation();
      currentParentId = addBtn.dataset.parentId;
      addProjectModalLabel.textContent = "Add Sub-Project";
      addProjectForm.reset();
      addProjectModal.show();
    }
  });
  deleteProjectBtn.addEventListener("click", () => {
    if (!currentProject) return;
    deletionTreeContainer.innerHTML = "";
    const tree = buildDeletionTree(currentProject);
    deletionTreeContainer.appendChild(tree);
    projectNameToDelete.textContent = currentProject.name;
    deleteConfirmationInput.value = "";
    confirmDeleteBtn.disabled = true;
    deleteProjectModal.show();
  });
  deleteConfirmationInput.addEventListener("input", () => {
    confirmDeleteBtn.disabled =
      deleteConfirmationInput.value !== currentProject.name;
  });
  confirmDeleteBtn.addEventListener("click", deleteProject);
  addProjectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = projectNameInput.value.trim();
    const description = projectDescriptionInput.value.trim();
    if (name) {
      const newProject = {
        id: `proj-${Date.now()}`,
        name,
        description,
        parentId: currentParentId,
      };
      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProject),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save project");
        }
        const savedProject = await response.json();
        await loadData();
        addProjectModal.hide();
        selectProject(savedProject.id);
      } catch (error) {
        console.error("Error adding project:", error);
        alert(`Error: ${error.message}`);
      }
    }
  });
  if (taskBoardContainer) {
    taskBoardContainer.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".add-task-to-section-btn");
      if (addBtn) {
        if (!currentProject) return alert("Please select a project first.");
        targetTaskStatus = addBtn.dataset.status;
        addTaskModal.show();
      }
    });
  }

  // UPDATED: Logic for Add Task Modal
  if (addTaskForm) {
    addTaskModalEl.addEventListener("shown.bs.modal", () => {
      taskTitleInput.focus();
      taskTitleInput.style.height = "auto"; // Reset height
    });
    taskTitleInput.addEventListener("input", () => {
      taskTitleInput.style.height = "auto";
      taskTitleInput.style.height = `${taskTitleInput.scrollHeight}px`;
    });
    taskTitleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        addTaskForm.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });
    addTaskForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = taskTitleInput.value.trim();
      if (title && currentProject && targetTaskStatus) {
        const newTaskData = {
          id: `task-${Date.now()}`,
          title,
          status: targetTaskStatus,
          projectId: currentProject.id,
        };
        try {
          const response = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTaskData),
          });
          if (!response.ok) throw new Error("Failed to save task");
          const savedTask = await response.json();
          if (!currentProject.tasks) currentProject.tasks = [];
          currentProject.tasks.push(savedTask);
          renderTasks();
          addTaskModal.hide();
        } catch (error) {
          console.error("Error adding task:", error);
          alert("Failed to add new task.");
        }
        targetTaskStatus = null;
      }
    });
  }

  if (addProgressForm) {
    addProgressForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const note = progressNoteInput.value.trim();
      if (note && currentTargetTaskId) {
        try {
          const response = await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note: note, taskId: currentTargetTaskId }),
          });
          if (!response.ok) throw new Error("Failed to save progress");
          const newProgress = await response.json();
          const task = currentProject.tasks.find(
            (t) => t.id === currentTargetTaskId
          );
          if (task) {
            if (!task.progress) task.progress = [];
            task.progress.push(newProgress);
          }
          renderTasks();
          addProgressModal.hide();
        } catch (error) {
          console.error("Error adding progress:", error);
          alert("Failed to add progress.");
        }
        currentTargetTaskId = null;
      }
    });
  }
  function handleDragStart(e) {
    if (e.target.dataset.taskId) {
      e.dataTransfer.setData("text/plain", e.target.dataset.taskId);
    }
    e.target.classList.add("dragging");
  }
  function handleDragEnd(e) {
    e.target.classList.remove("dragging");
  }
  function handleDragOver(e) {
    e.preventDefault();
  }
  async function handleDrop(e) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    const taskCard = document.querySelector(
      `.task-card[data-task-id="${taskId}"]`
    );
    const dropZone = e.target.closest(".task-list");
    if (dropZone && taskCard && currentProject) {
      const newStatus = dropZone.dataset.status;
      const task = currentProject.tasks.find((t) => t.id === taskId);
      if (task && task.status !== newStatus) {
        task.status = newStatus;
        dropZone.appendChild(taskCard);
        try {
          await fetch(`/api/tasks/${taskId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
        } catch (error) {
          console.error("Error updating task status:", error);
          alert("Error saving task's new status. Please refresh.");
        }
      } else {
        dropZone.appendChild(taskCard);
      }
    }
  }
  document.querySelectorAll(".task-list").forEach((list) => {
    list.addEventListener("dragover", handleDragOver);
    list.addEventListener("drop", handleDrop);
  });
  sidebarDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    sidebarDropZone.classList.add("drag-over-root");
  });
  sidebarDropZone.addEventListener("dragleave", () => {
    sidebarDropZone.classList.remove("drag-over-root");
  });
  sidebarDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    sidebarDropZone.classList.remove("drag-over-root");
    const droppedProjectId = e.dataTransfer.getData("text/plain");
    if (!e.target.closest(".project-item")) {
      moveProject(droppedProjectId, null);
    }
  });
  expandDescriptionBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isMobile = window.innerWidth <= 992;
    if (isMobile) {
      descriptionDisplayEl.classList.toggle("collapsed");
      expandDescriptionBtn.classList.toggle("expanded");
      expandDescriptionBtn.querySelector("i").className =
        expandDescriptionBtn.classList.contains("expanded")
          ? "bi bi-chevron-up"
          : "bi bi-chevron-down";
      expandDescriptionBtn.title = expandDescriptionBtn.classList.contains(
        "expanded"
      )
        ? "Show less"
        : "Show more";
    } else {
      descriptionModalLabel.textContent = `Description for: ${currentProject.name}`;
      descriptionModalBody.textContent = currentProject.description;
      descriptionModal.show();
    }
  });
  confirmDeleteTaskBtn.addEventListener("click", async () => {
    if (!currentTaskIdToDelete) return;
    try {
      const response = await fetch(`/api/tasks/${currentTaskIdToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete task.");
      }
      if (currentProject && currentProject.tasks) {
        currentProject.tasks = currentProject.tasks.filter(
          (t) => t.id !== currentTaskIdToDelete
        );
      }
      renderTasks();
      deleteTaskModal.hide();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert(`Failed to delete task: ${error.message}`);
    } finally {
      currentTaskIdToDelete = null;
    }
  });
  window.addEventListener("resize", updateDescriptionView);

  initializeApp();
});
