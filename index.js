// index.js
// Make sure to add <script src="index.js" defer></script> before </body> in your index.html

(() => {
  // Simple project app: localStorage-backed
  const STORAGE_KEY = 'projects_v1';

  // DOM refs
  const projectsContainer = document.getElementById('projectsContainer');
  const adminModal = document.getElementById('adminModal');
  const projectForm = document.getElementById('projectForm');
  const projectTitle = document.getElementById('projectTitle');
  const projectDate = document.getElementById('projectDate');
  const projectDesc = document.getElementById('projectDesc');
  const projectTech = document.getElementById('projectTech');
  const projectImage = document.getElementById('projectImage');

  // Expose openModal/closeModal globally to match your inline onclicks
  window.openModal = () => {
    // mark as admin-mode for simple inline admin controls
    window.__isAdmin = true;
    adminModal.classList.add('active');
    // optional: focus first input
    setTimeout(() => projectTitle.focus(), 100);
  };

  window.closeModal = () => {
    adminModal.classList.remove('active');
  };

  // Utility: load/save from localStorage
  function loadProjects() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse projects from storage', e);
      return [];
    }
  }

  function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  // Render helpers
  function createTechTags(techCsv) {
    const arr = techCsv.split(',').map(s => s.trim()).filter(Boolean);
    const wrapper = document.createElement('div');
    wrapper.className = 'project-tech';
    arr.forEach(t => {
      const tag = document.createElement('span');
      tag.className = 'tech-tag';
      tag.textContent = t;
      wrapper.appendChild(tag);
    });
    return wrapper;
  }

  function renderProjectCard(project, index) {
    // Create project-card structure consistent with your CSS
    const card = document.createElement('div');
    card.className = 'project-card fade-in';
    card.dataset.projectId = project.id ?? index;

    // Left: image
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'project-image-wrapper';
    const img = document.createElement('img');
    img.className = 'project-image';
    img.src = project.image;
    img.alt = project.title;
    img.loading = 'lazy';
    imgWrapper.appendChild(img);

    // Right: content
    const content = document.createElement('div');
    content.className = 'project-content';
    const number = document.createElement('div');
    number.className = 'project-number';
    number.textContent = `Project ${index + 1}`;
    const title = document.createElement('div');
    title.className = 'project-title';
    title.textContent = project.title;
    const date = document.createElement('div');
    date.className = 'project-date';
    date.textContent = project.date;
    const desc = document.createElement('div');
    desc.className = 'project-description';
    desc.textContent = project.description;

    content.appendChild(number);
    content.appendChild(title);
    content.appendChild(date);
    content.appendChild(desc);
    content.appendChild(createTechTags(project.tech));

    // Admin controls (shown when admin modal has been opened at least once)
    if (window.__isAdmin) {
      const adminControls = document.createElement('div');
      adminControls.style.marginTop = '1rem';
      adminControls.style.display = 'flex';
      adminControls.style.gap = '0.6rem';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'btn btn-outline mono';
      editBtn.onclick = () => openEditModal(project);

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'btn btn-outline mono';
      delBtn.onclick = () => {
        if (!confirm('Delete this project?')) return;
        deleteProject(project.id);
      };

      adminControls.appendChild(editBtn);
      adminControls.appendChild(delBtn);
      content.appendChild(adminControls);
    }

    // For alternating layout maintain direction trait used in your CSS
    // Insert elements in same order as your .project-card grid: image then content
    card.appendChild(imgWrapper);
    card.appendChild(content);

    return card;
  }

  function renderProjects() {
    const projects = loadProjects();
    projectsContainer.innerHTML = '';
    if (!projects.length) {
      const p = document.createElement('p');
      p.style.color = 'var(--lighter-gray)';
      p.textContent = 'No projects yet — click the + to add one.';
      projectsContainer.appendChild(p);
      return;
    }
    projects.forEach((proj, idx) => {
      const el = renderProjectCard(proj, idx);
      projectsContainer.appendChild(el);
    });
  }

  // Create / Update / Delete
  function addProject(project) {
    const projects = loadProjects();
    projects.unshift(project); // newest first
    saveProjects(projects);
    renderProjects();
  }

  function updateProject(updated) {
    const projects = loadProjects();
    const idx = projects.findIndex(p => p.id === updated.id);
    if (idx === -1) return;
    projects[idx] = updated;
    saveProjects(projects);
    renderProjects();
  }

  function deleteProject(id) {
    const projects = loadProjects().filter(p => p.id !== id);
    saveProjects(projects);
    renderProjects();
  }

  // Form handling
  projectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Basic validation
    if (!projectTitle.value.trim() || !projectDesc.value.trim() || !projectTech.value.trim() || !projectImage.value.trim()) {
      alert('Please fill all fields.');
      return;
    }

    const newProject = {
      id: Date.now().toString(),
      title: projectTitle.value.trim(),
      date: projectDate.value.trim(),
      description: projectDesc.value.trim(),
      tech: projectTech.value.trim(),
      image: projectImage.value.trim()
    };

    // If editing, the form will carry data-edit-id attribute
    const editId = projectForm.dataset.editId;
    if (editId) {
      newProject.id = editId;
      updateProject(newProject);
      delete projectForm.dataset.editId;
    } else {
      addProject(newProject);
    }

    projectForm.reset();
    closeModal();
  });

  // Editing convenience
  function openEditModal(project) {
    projectTitle.value = project.title;
    projectDate.value = project.date;
    projectDesc.value = project.description;
    projectTech.value = project.tech;
    projectImage.value = project.image;
    projectForm.dataset.editId = project.id;
    openModal();
  }

  // Smooth scroll for nav links
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href === '#') return;
        const el = document.querySelector(href);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', href);
        }
      });
    });
  }

  // Optional: sync with Supabase if body has data attributes
  async function setupOptionalSupabase() {
    try {
      const body = document.body;
      const url = body.dataset.supabaseUrl;
      const key = body.dataset.supabaseKey;
      if (!url || !key || !window.createClient) return;
      // initialize
      const supabase = window.createClient(url, key);
      // basic sync: on page load, attempt to read remote projects and merge into local
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) {
        console.warn('Supabase read error:', error);
        return;
      }
      if (Array.isArray(data) && data.length) {
        // Map remote data to local structure expected by this script
        const mapped = data.map(r => ({
          id: String(r.id ?? r.project_id ?? Date.now()),
          title: r.title || r.name || 'Untitled',
          date: r.date || '',
          description: r.description || '',
          tech: r.tech || '',
          image: r.image || ''
        }));
        // Merge (remote first)
        saveProjects(mapped);
        renderProjects();
      }
      // You could also extend to write new local projects to Supabase here
    } catch (err) {
      console.error('Supabase optional setup failed', err);
    }
  }

  // Close modal on overlay click and ESC
  adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    setupSmoothScroll();
    setupOptionalSupabase();
  });

  // Expose deleteProject for console debugging
  window.__deleteProject = deleteProject;
})();