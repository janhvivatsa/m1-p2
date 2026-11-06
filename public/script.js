/**
 * AI-POWERED MEETING-TO-ACTION ASSISTANT
 * Core Frontend Application Controller
 * Handles SPA navigation, LocalStorage persistence, Gemini AI API integration,
 * document upload parsing, task tracking, ambiguity resolution, and PDF/CSV export.
 */

// ============================================================================
// CONSTANTS & INITIAL STATE
// ============================================================================
const STORAGE_KEY = 'meeting_flow_ai_store_v1';

// In-memory application state
let appState = {
  meetings: [],
  actionItems: [],
  clarifications: []
};

// Currently viewed or active meeting report
let currentActiveReport = null;

// Filter states for Action Items view
let actionFilters = {
  search: '',
  status: 'ALL',
  priority: 'ALL',
  meetingId: 'ALL'
};

// Active tab for Clarifications view
let activeClarificationTab = 'unresolved';

// ============================================================================
// LOCAL STORAGE MANAGEMENT
// ============================================================================

/**
 * Load state from browser LocalStorage
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      appState = {
        meetings: parsed.meetings || [],
        actionItems: parsed.actionItems || [],
        clarifications: parsed.clarifications || []
      };
    } else {
      // First visit: Seed sample meeting so the user immediately sees a functional dashboard
      seedInitialData();
    }
  } catch (err) {
    console.error('Failed to load LocalStorage state:', err);
    seedInitialData();
  }
}

/**
 * Persist application state to browser LocalStorage
 */
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    updateBadgesAndStats();
  } catch (err) {
    console.error('Failed to save to LocalStorage:', err);
    showToast('Failed to save data locally', 'error');
  }
}

/**
 * Seed initial sample meeting data for immediate evaluation and viva demo
 */
function seedInitialData() {
  const seedMeetingId = 'mtg_seed_101';
  const meetingDate = new Date().toISOString().split('T')[0];

  const seedMeeting = {
    id: seedMeetingId,
    title: "Q3 Product Roadmap & Sprint 14 Planning",
    date: meetingDate,
    participants: "Sarah Chen (Product Lead), Alex Rodriguez (Engineering Lead), Priya Patel (UX Designer)",
    transcript: typeof SAMPLE_MEETING !== 'undefined' ? SAMPLE_MEETING.transcript : '',
    createdAt: new Date().toISOString(),
    analysisResult: {
      meetingSummary: {
        executiveSummary: "The team aligned on Sprint 14 priorities, evaluated mobile client API latency bottlenecks, and approved architectural improvements. Key decisions were made regarding GraphQL adoption while deferring multi-language support to preserve checkout delivery velocity.",
        objectives: [
          "Review Sprint 14 performance and mobile app latency bottlenecks",
          "Decide on GraphQL mobile gateway adoption",
          "Align on Q3 localization scope and sprint deliverables"
        ],
        discussionPoints: [
          {
            topic: "Mobile API Latency Bottleneck",
            summary: "Alex identified that heavy REST payloads and missing database indexes caused a 42% latency spike on mobile networks."
          },
          {
            topic: "Checkout UX Prototypes",
            summary: "Priya presented high-fidelity Figma stepper mockups; user testing indicated strong demand for upfront dynamic pricing."
          },
          {
            topic: "Localization Tradeoffs",
            summary: "Marketing requested 3 languages, but engineering estimated 3 weeks delay; team agreed to postpone localization to Q4."
          }
        ],
        outcomes: [
          "Formally adopted GraphQL gateway for mobile endpoints",
          "Postponed multi-language localization to Q4 roadmap",
          "Generated immediate action items for database indexing and wireframes"
        ]
      },
      decisions: [
        {
          id: "dec-1",
          title: "Adopt GraphQL Gateway for Mobile APIs",
          description: "Transition mobile endpoints to a GraphQL gateway to reduce payload size and minimize client network round-trips.",
          responsiblePerson: "Alex Rodriguez"
        },
        {
          id: "dec-2",
          title: "Postpone Multi-Language Localization to Q4",
          description: "Focus current sprint velocity exclusively on checkout speed and stability, deferring i18n support.",
          responsiblePerson: "Sarah Chen"
        }
      ],
      actionItems: [
        {
          id: "act-1",
          meetingId: seedMeetingId,
          meetingTitle: "Q3 Product Roadmap & Sprint 14 Planning",
          title: "Optimize Database Indexing Queries",
          description: "Profile slow queries on the orders table and add composite indexes for mobile checkout paths.",
          assignedTo: "Alex Rodriguez",
          deadline: getRelativeDate(7),
          priority: "High",
          status: "Pending"
        },
        {
          id: "act-2",
          meetingId: seedMeetingId,
          meetingTitle: "Q3 Product Roadmap & Sprint 14 Planning",
          title: "Complete Figma High-Fidelity Wireframes",
          description: "Finalize dynamic pricing breakdown components for mobile checkout stepper in Figma.",
          assignedTo: "Priya Patel",
          deadline: getRelativeDate(11),
          priority: "Medium",
          status: "In Progress"
        },
        {
          id: "act-3",
          meetingId: seedMeetingId,
          meetingTitle: "Q3 Product Roadmap & Sprint 14 Planning",
          title: "Prepare Stakeholder Review Presentation",
          description: "Compile roadmap slides, architecture diagrams, and sprint milestones for the executive steering committee.",
          assignedTo: "Unassigned",
          deadline: "TBD",
          priority: "High",
          status: "Pending"
        },
        {
          id: "act-4",
          meetingId: seedMeetingId,
          meetingTitle: "Q3 Product Roadmap & Sprint 14 Planning",
          title: "Finish API Schema Documentation",
          description: "Draft OpenAPI/GraphQL schema contracts and distribution guide for mobile developers.",
          assignedTo: "Alex Rodriguez & Priya Patel",
          deadline: "TBD",
          priority: "Medium",
          status: "Pending"
        }
      ],
      ambiguities: [
        {
          id: "amb-1",
          meetingId: seedMeetingId,
          meetingTitle: "Q3 Product Roadmap & Sprint 14 Planning",
          originalStatement: "Someone should prepare the presentation for the stakeholder review.",
          problem: "Assigned person missing",
          missingInfo: "Assignee",
          suggestedQuestion: "Who should be responsible for preparing the stakeholder review presentation?",
          relatedTaskId: "act-3",
          resolved: false
        },
        {
          id: "amb-2",
          meetingId: seedMeetingId,
          meetingTitle: "Q3 Product Roadmap & Sprint 14 Planning",
          originalStatement: "Alex and Priya need to finish the API schema documentation soon.",
          problem: "Deadline missing or vague ('soon')",
          missingInfo: "Target Deadline Date",
          suggestedQuestion: "What is the exact target completion date for finishing the API schema documentation?",
          relatedTaskId: "act-4",
          resolved: false
        }
      ]
    }
  };

  appState = {
    meetings: [seedMeeting],
    actionItems: seedMeeting.analysisResult.actionItems,
    clarifications: seedMeeting.analysisResult.ambiguities
  };

  saveState();
}

/**
 * Utility to calculate relative date string YYYY-MM-DD
 */
function getRelativeDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

// ============================================================================
// NAVIGATION & VIEW SWITCHING
// ============================================================================

const viewTitles = {
  dashboard: {
    heading: 'Dashboard',
    subheading: 'Real-time overview of meetings, action items, and ambiguities'
  },
  'new-meeting': {
    heading: 'New Meeting Analysis',
    subheading: 'Submit transcript or upload audio/text document for AI processing'
  },
  'meeting-report': {
    heading: 'Meeting Intelligence Report',
    subheading: 'Detailed AI summary, decisions, action items, and detected ambiguities'
  },
  history: {
    heading: 'Meeting History',
    subheading: 'Review previously analyzed meetings saved in your local workspace'
  },
  actions: {
    heading: 'Action Items Tracker',
    subheading: 'Manage, filter, and track deliverables extracted across meetings'
  },
  clarifications: {
    heading: 'Ambiguity & Clarification Center',
    subheading: 'Review and resolve incomplete tasks with missing owners or deadlines'
  }
};

/**
 * Switch active view smoothly
 * @param {string} viewName - Target view ID (e.g. 'dashboard', 'new-meeting', etc.)
 */
function switchView(viewName) {
  // Update nav buttons active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Update view sections active state
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.toggle('active', section.id === `view-${viewName}`);
  });

  // Update header titles
  const meta = viewTitles[viewName] || { heading: 'Meeting Assistant', subheading: '' };
  const headingEl = document.getElementById('page-heading');
  const subheadingEl = document.getElementById('page-subheading');
  if (headingEl) headingEl.textContent = meta.heading;
  if (subheadingEl) subheadingEl.textContent = meta.subheading;

  // View-specific refreshes
  if (viewName === 'dashboard') {
    renderDashboard();
  } else if (viewName === 'actions') {
    renderActionItemsTable();
    populateMeetingFilterDropdown();
  } else if (viewName === 'clarifications') {
    renderClarificationsList();
  } else if (viewName === 'history') {
    renderMeetingHistory();
  }

  // Scroll to top of content
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// DASHBOARD RENDERING & CALCULATIONS
// ============================================================================

function updateBadgesAndStats() {
  const totalMeetings = appState.meetings.length;
  const totalActions = appState.actionItems.length;
  const unresolvedClarifications = appState.clarifications.filter(c => !c.resolved).length;

  // Sidebar badges
  const badgeMeetings = document.getElementById('badge-meetings-count');
  const badgeActions = document.getElementById('badge-actions-count');
  const badgeClarifications = document.getElementById('badge-clarifications-count');

  if (badgeMeetings) badgeMeetings.textContent = totalMeetings;
  if (badgeActions) badgeActions.textContent = totalActions;
  if (badgeClarifications) {
    badgeClarifications.textContent = unresolvedClarifications;
    badgeClarifications.style.display = unresolvedClarifications > 0 ? 'inline-block' : 'none';
  }
}

function renderDashboard() {
  updateBadgesAndStats();

  const totalMeetings = appState.meetings.length;
  const totalActions = appState.actionItems.length;
  const completedActions = appState.actionItems.filter(a => a.status === 'Completed').length;
  const inProgressActions = appState.actionItems.filter(a => a.status === 'In Progress').length;
  const pendingActions = appState.actionItems.filter(a => a.status === 'Pending').length;
  const unresolvedClarifications = appState.clarifications.filter(c => !c.resolved).length;

  // Stat values
  document.getElementById('stat-total-meetings').textContent = totalMeetings;
  document.getElementById('stat-total-actions').textContent = totalActions;
  document.getElementById('stat-completed-actions').textContent = completedActions;
  document.getElementById('stat-pending-actions').textContent = pendingActions;
  document.getElementById('stat-unresolved-clarifications').textContent = unresolvedClarifications;

  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  document.getElementById('stat-completion-rate').textContent = `${completionRate}% completed`;
  document.getElementById('progress-percent-badge').textContent = `${completionRate}% Done`;

  // Progress Bar
  const completedPct = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
  const inProgressPct = totalActions > 0 ? (inProgressActions / totalActions) * 100 : 0;
  const pendingPct = totalActions > 0 ? (pendingActions / totalActions) * 100 : 0;

  document.getElementById('progress-bar-completed').style.width = `${completedPct}%`;
  document.getElementById('progress-bar-inprogress').style.width = `${inProgressPct}%`;
  document.getElementById('progress-bar-pending').style.width = `${pendingPct}%`;

  document.getElementById('legend-completed-val').textContent = completedActions;
  document.getElementById('legend-inprogress-val').textContent = inProgressActions;
  document.getElementById('legend-pending-val').textContent = pendingActions;

  // Render Upcoming & Overdue Deadlines
  renderUpcomingDeadlines();

  // Render Recent Meetings in Dashboard
  renderDashboardRecentMeetings();
}

function isTaskOverdue(deadline, status) {
  if (!deadline || deadline === 'TBD' || status === 'Completed') return false;
  const today = new Date().toISOString().split('T')[0];
  return deadline < today;
}

function renderUpcomingDeadlines() {
  const container = document.getElementById('dashboard-deadlines-container');
  if (!container) return;

  const activeTasks = appState.actionItems.filter(t => t.status !== 'Completed');

  if (activeTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state-sm">
        <p>No active deadlines pending. Great job!</p>
      </div>
    `;
    return;
  }

  // Sort: Overdue first, then upcoming by date
  const sorted = [...activeTasks].sort((a, b) => {
    const aOverdue = isTaskOverdue(a.deadline, a.status);
    const bOverdue = isTaskOverdue(b.deadline, b.status);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (!a.deadline || a.deadline === 'TBD') return 1;
    if (!b.deadline || b.deadline === 'TBD') return -1;
    return a.deadline.localeCompare(b.deadline);
  }).slice(0, 5);

  container.innerHTML = sorted.map(task => {
    const overdue = isTaskOverdue(task.deadline, task.status);
    return `
      <div class="deadline-item ${overdue ? 'overdue' : ''}">
        <div class="deadline-info">
          <span class="deadline-title">${escapeHtml(task.title)}</span>
          <span class="deadline-assignee">👤 ${escapeHtml(task.assignedTo || 'Unassigned')} &bull; ${escapeHtml(task.meetingTitle || 'Meeting')}</span>
        </div>
        <div class="deadline-date-pill ${overdue ? 'text-rose' : ''}">
          ${overdue ? '⚠️ Overdue: ' : '📅 '}${task.deadline || 'No deadline'}
        </div>
      </div>
    `;
  }).join('');
}

function renderDashboardRecentMeetings() {
  const tbody = document.getElementById('dashboard-recent-meetings-tbody');
  if (!tbody) return;

  if (appState.meetings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-muted">
          No meetings saved yet. Click <strong>"New Meeting"</strong> to analyze your first transcript!
        </td>
      </tr>
    `;
    return;
  }

  const recent = [...appState.meetings].slice(0, 5);

  tbody.innerHTML = recent.map(meeting => {
    const actionsCount = (meeting.analysisResult?.actionItems || []).length;
    const decisionsCount = (meeting.analysisResult?.decisions || []).length;
    const ambiguitiesCount = (meeting.analysisResult?.ambiguities || []).filter(a => !a.resolved).length;

    return `
      <tr>
        <td>
          <strong>${escapeHtml(meeting.title)}</strong>
        </td>
        <td>${escapeHtml(meeting.date || 'N/A')}</td>
        <td><span class="badge badge-blue">${actionsCount} tasks</span></td>
        <td><span class="badge badge-green">${decisionsCount} decisions</span></td>
        <td>
          ${ambiguitiesCount > 0 
            ? `<span class="badge badge-rose">${ambiguitiesCount} unresolved</span>` 
            : `<span class="badge badge-green">All clear</span>`
          }
        </td>
        <td class="text-right">
          <button class="btn btn-sm btn-outline btn-view-report" data-meeting-id="${meeting.id}">
            View Report &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach event listeners to "View Report" buttons
  tbody.querySelectorAll('.btn-view-report').forEach(btn => {
    btn.addEventListener('click', () => {
      const meetingId = btn.dataset.meetingId;
      openMeetingReport(meetingId);
    });
  });
}

// ============================================================================
// NEW MEETING & AI ANALYSIS WORKFLOW
// ============================================================================

/**
 * Initialize New Meeting form, file dropzone, and event handlers
 */
function setupNewMeetingView() {
  const form = document.getElementById('meeting-form');
  const titleInput = document.getElementById('input-meeting-title');
  const dateInput = document.getElementById('input-meeting-date');
  const participantsInput = document.getElementById('input-meeting-participants');
  const transcriptInput = document.getElementById('input-meeting-transcript');
  const transcriptCounter = document.getElementById('transcript-counter');
  const btnLoadSample = document.getElementById('btn-load-sample');
  const btnClearForm = document.getElementById('btn-clear-form');
  
  // Set default date to today
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Live transcript word & character counter
  if (transcriptInput && transcriptCounter) {
    transcriptInput.addEventListener('input', () => {
      const text = transcriptInput.value.trim();
      const words = text ? text.split(/\s+/).length : 0;
      const chars = text.length;
      transcriptCounter.textContent = `${words} words | ${chars} characters`;
    });
  }

  // Load Sample Meeting Button
  if (btnLoadSample) {
    btnLoadSample.addEventListener('click', () => {
      if (typeof SAMPLE_MEETING !== 'undefined') {
        titleInput.value = SAMPLE_MEETING.title;
        dateInput.value = SAMPLE_MEETING.date;
        participantsInput.value = SAMPLE_MEETING.participants;
        transcriptInput.value = SAMPLE_MEETING.transcript;
        transcriptInput.dispatchEvent(new Event('input'));
        showToast('Sample meeting loaded with 3 participants & ambiguities!', 'info');
      }
    });
  }

  // Clear Form Button
  if (btnClearForm) {
    btnClearForm.addEventListener('click', () => {
      form.reset();
      dateInput.value = new Date().toISOString().split('T')[0];
      transcriptInput.dispatchEvent(new Event('input'));
      clearUploadedFileInfo();
      showToast('Form cleared', 'info');
    });
  }

  // Setup File Upload Dropzone
  setupFileDropzone();

  // Handle Form Submission -> Trigger AI Analysis
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = titleInput.value.trim();
      const date = dateInput.value;
      const participants = participantsInput.value.trim();
      const transcript = transcriptInput.value.trim();

      if (!transcript) {
        showToast('Please enter or upload a meeting transcript.', 'error');
        return;
      }

      await executeAIAnalysis({ title, date, participants, transcript });
    });
  }
}

/**
 * Configure file dropzone for TXT, PDF, and DOCX uploads
 */
function setupFileDropzone() {
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-input');
  const btnBrowse = document.getElementById('btn-browse-file');
  const spinner = document.getElementById('upload-spinner');
  const badge = document.getElementById('file-info-badge');
  const badgeName = document.getElementById('file-info-name');
  const badgeWords = document.getElementById('file-info-words');
  const btnRemove = document.getElementById('btn-remove-file');
  const transcriptInput = document.getElementById('input-meeting-transcript');

  if (!dropzone || !fileInput) return;

  // Click to browse
  btnBrowse.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileUpload(fileInput.files[0]);
    }
  });

  btnRemove.addEventListener('click', () => {
    clearUploadedFileInfo();
    transcriptInput.value = '';
    transcriptInput.dispatchEvent(new Event('input'));
  });

  async function handleFileUpload(file) {
    const validExts = ['.txt', '.pdf', '.docx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExts.includes(ext)) {
      showToast(`Unsupported format '${ext}'. Please upload .txt, .pdf, or .docx`, 'error');
      return;
    }

    spinner.classList.remove('hidden');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to parse file');
      }

      // Populate transcript
      transcriptInput.value = result.text;
      transcriptInput.dispatchEvent(new Event('input'));

      // If title is empty, infer from filename
      const titleInput = document.getElementById('input-meeting-title');
      if (titleInput && !titleInput.value.trim()) {
        const inferredTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        titleInput.value = inferredTitle.charAt(0).toUpperCase() + inferredTitle.slice(1);
      }

      // Update badge
      badgeName.textContent = result.filename;
      badgeWords.textContent = `${result.wordCount} words`;
      badge.classList.remove('hidden');

      showToast(`Document parsed successfully (${result.wordCount} words)!`, 'success');

    } catch (err) {
      console.error('Upload Error:', err);
      showToast(err.message, 'error');
    } finally {
      spinner.classList.add('hidden');
    }
  }
}

function clearUploadedFileInfo() {
  const badge = document.getElementById('file-info-badge');
  const fileInput = document.getElementById('file-input');
  if (badge) badge.classList.add('hidden');
  if (fileInput) fileInput.value = '';
}

/**
 * Calls Node backend /api/analyze and animates loading steps
 */
async function executeAIAnalysis(meetingData) {
  const loadingOverlay = document.getElementById('analysis-loading-state');
  const form = document.getElementById('meeting-form');
  const submitBtn = document.getElementById('btn-analyze-submit');

  loadingOverlay.classList.remove('hidden');
  form.style.opacity = '0.4';
  form.style.pointerEvents = 'none';
  submitBtn.disabled = true;

  // Progressive step animation
  animateLoadingSteps();

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meetingData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'AI analysis failed.');
    }

    const analysisData = result.data;

    // Create meeting object with unique ID
    const meetingId = 'mtg_' + Date.now();
    const newMeeting = {
      id: meetingId,
      title: meetingData.title || 'Untitled Meeting',
      date: meetingData.date || new Date().toISOString().split('T')[0],
      participants: meetingData.participants || 'Team Members',
      transcript: meetingData.transcript,
      analysisResult: analysisData,
      createdAt: new Date().toISOString()
    };

    // Attach meetingId to child tasks and ambiguities for relational integrity
    if (newMeeting.analysisResult.actionItems) {
      newMeeting.analysisResult.actionItems.forEach(item => {
        item.meetingId = meetingId;
        item.meetingTitle = newMeeting.title;
        if (!item.id) item.id = 'act_' + Math.random().toString(36).substr(2, 9);
      });
    }

    if (newMeeting.analysisResult.ambiguities) {
      newMeeting.analysisResult.ambiguities.forEach(amb => {
        amb.meetingId = meetingId;
        amb.meetingTitle = newMeeting.title;
        amb.resolved = false;
        if (!amb.id) amb.id = 'amb_' + Math.random().toString(36).substr(2, 9);
      });
    }

    currentActiveReport = newMeeting;

    // Render report view immediately
    renderMeetingReport(newMeeting);
    switchView('meeting-report');

    // Notify user of demo vs live mode
    if (analysisData.isMock) {
      showToast('Analysis completed via local engine (Add GEMINI_API_KEY in .env for live API)', 'info');
    } else {
      showToast('Meeting successfully analyzed with Gemini AI!', 'success');
    }

  } catch (err) {
    console.error('Analysis error:', err);
    showToast(`Analysis Error: ${err.message}`, 'error');
  } finally {
    loadingOverlay.classList.add('hidden');
    form.style.opacity = '1';
    form.style.pointerEvents = 'auto';
    submitBtn.disabled = false;
  }
}

/**
 * Animate the 5 loading steps visually
 */
function animateLoadingSteps() {
  const steps = [1, 2, 3, 4, 5];
  steps.forEach((stepNum, idx) => {
    const el = document.getElementById(`step-${stepNum}`);
    if (el) {
      el.className = 'step-item';
      setTimeout(() => {
        el.className = 'step-item active';
        if (idx > 0) {
          const prevEl = document.getElementById(`step-${stepNum - 1}`);
          if (prevEl) prevEl.className = 'step-item done';
        }
      }, idx * 700);
    }
  });
}

// ============================================================================
// MEETING REPORT VIEW RENDERING & ACTIONS
// ============================================================================

/**
 * Populates and displays the complete meeting report
 * @param {object} meeting - Meeting model
 */
function renderMeetingReport(meeting) {
  currentActiveReport = meeting;

  const titleEl = document.getElementById('report-display-title');
  const dateEl = document.getElementById('report-display-date');
  const participantsContainer = document.getElementById('report-display-participants');
  const executiveSummaryEl = document.getElementById('report-executive-summary');
  const objectivesListEl = document.getElementById('report-objectives-list');
  const discussionPointsContainer = document.getElementById('report-discussion-points-container');
  const outcomesListEl = document.getElementById('report-outcomes-list');
  const decisionsContainer = document.getElementById('report-decisions-container');
  const actionItemsTbody = document.getElementById('report-action-items-tbody');
  const ambiguitiesContainer = document.getElementById('report-ambiguities-container');
  const ambiguitiesBadge = document.getElementById('report-ambiguities-badge');

  // Header
  titleEl.textContent = meeting.title || 'Untitled Meeting';
  dateEl.textContent = formatDate(meeting.date);

  // Participants
  const parts = (meeting.participants || '').split(',').map(p => p.trim()).filter(Boolean);
  participantsContainer.innerHTML = parts.length > 0 
    ? parts.map(p => `<span class="participant-chip">👤 ${escapeHtml(p)}</span>`).join('')
    : '<span class="text-muted text-sm">No participants specified</span>';

  const res = meeting.analysisResult || {};

  // Executive Summary & Objectives
  executiveSummaryEl.textContent = res.meetingSummary?.executiveSummary || 'No summary available.';
  
  const objectives = res.meetingSummary?.objectives || [];
  objectivesListEl.innerHTML = objectives.length > 0
    ? objectives.map(obj => `<li>${escapeHtml(obj)}</li>`).join('')
    : '<li>General project alignment and sprint review.</li>';

  // Discussion Points
  const discPoints = res.meetingSummary?.discussionPoints || [];
  discussionPointsContainer.innerHTML = discPoints.length > 0
    ? discPoints.map(dp => `
        <div class="discussion-point-card">
          <div class="discussion-topic">📌 ${escapeHtml(dp.topic || 'Discussion')}</div>
          <div class="discussion-summary">${escapeHtml(dp.summary || '')}</div>
        </div>
      `).join('')
    : '<p class="text-muted text-sm">No key discussion points recorded.</p>';

  // Important Outcomes
  const outcomes = res.meetingSummary?.outcomes || [];
  outcomesListEl.innerHTML = outcomes.length > 0
    ? outcomes.map(o => `<li>${escapeHtml(o)}</li>`).join('')
    : '<li>Documented actionable commitments for team.</li>';

  // Decisions
  const decisions = res.decisions || [];
  decisionsContainer.innerHTML = decisions.length > 0
    ? decisions.map(d => `
        <div class="decision-item">
          <div class="decision-check">✓</div>
          <div class="decision-content">
            <h4 class="decision-title">${escapeHtml(d.title)}</h4>
            <p class="decision-desc">${escapeHtml(d.description)}</p>
            <div class="decision-owner"><strong>Lead / Owner:</strong> ${escapeHtml(d.responsiblePerson || 'Team')}</div>
          </div>
        </div>
      `).join('')
    : '<p class="text-muted text-sm">No explicit decisions recorded.</p>';

  // Action Items Table
  const actionItems = res.actionItems || [];
  actionItemsTbody.innerHTML = actionItems.length > 0
    ? actionItems.map(item => {
        const isUnassigned = !item.assignedTo || item.assignedTo.toLowerCase() === 'unassigned' || item.assignedTo === '';
        const isTbd = !item.deadline || item.deadline === 'TBD';
        const priorityClass = `priority-${(item.priority || 'Medium').toLowerCase()}`;
        const statusClass = `status-${(item.status || 'Pending').toLowerCase().replace(/\s+/g, '')}`;

        return `
          <tr>
            <td>
              <div class="task-title-cell">
                <span class="task-title-text">${escapeHtml(item.title)}</span>
                <span class="task-desc-text">${escapeHtml(item.description || '')}</span>
              </div>
            </td>
            <td>
              <span class="assignee-chip ${isUnassigned ? 'unassigned' : ''}">
                ${isUnassigned ? '⚠️ Unassigned' : '👤 ' + escapeHtml(item.assignedTo)}
              </span>
            </td>
            <td>
              <span class="badge ${isTbd ? 'badge-amber' : 'badge-info'}">
                ${isTbd ? '⚠️ Date Missing' : '📅 ' + escapeHtml(item.deadline)}
              </span>
            </td>
            <td>
              <span class="priority-pill ${priorityClass}">${escapeHtml(item.priority || 'Medium')}</span>
            </td>
            <td>
              <span class="status-pill ${statusClass}">${escapeHtml(item.status || 'Pending')}</span>
            </td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="5" class="text-center py-4 text-muted">No action items extracted.</td></tr>';

  // Ambiguities & Clarifications Callouts
  const ambiguities = res.ambiguities || [];
  const unresolvedCount = ambiguities.filter(a => !a.resolved).length;
  ambiguitiesBadge.textContent = `${unresolvedCount} Issues Detected`;

  ambiguitiesContainer.innerHTML = ambiguities.length > 0
    ? ambiguities.map(amb => `
        <div class="ambiguity-card ${amb.resolved ? 'resolved' : ''}">
          <div class="ambiguity-card-top">
            <div class="problem-callout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Problem: ${escapeHtml(amb.problem)}</span>
            </div>
            <span class="badge ${amb.resolved ? 'badge-green' : 'badge-rose'}">
              ${amb.resolved ? '✓ Resolved' : 'Missing: ' + escapeHtml(amb.missingInfo)}
            </span>
          </div>

          <div class="quote-box">
            "${escapeHtml(amb.originalStatement)}"
          </div>

          <div class="suggested-question-box">
            <span>💡 <strong>AI Question:</strong> ${escapeHtml(amb.suggestedQuestion)}</span>
          </div>

          <div class="ambiguity-actions">
            ${amb.resolved 
              ? `<span class="badge badge-green">Resolved &bull; Task Updated</span>` 
              : `<button class="btn btn-sm btn-primary btn-resolve-in-report" 
                   data-amb-id="${amb.id}" 
                   data-task-id="${amb.relatedTaskId || ''}" 
                   data-meeting-id="${meeting.id}">
                   Resolve &amp; Update Task &rarr;
                 </button>`
            }
          </div>
        </div>
      `).join('')
    : '<div class="empty-state-sm text-green">✓ No ambiguities detected! All action items have owners and clear deadlines.</div>';

  // Hook resolve buttons inside report
  ambiguitiesContainer.querySelectorAll('.btn-resolve-in-report').forEach(btn => {
    btn.addEventListener('click', () => {
      openClarificationModal(btn.dataset.ambId, btn.dataset.taskId, btn.dataset.meetingId);
    });
  });

  // Update Save Button state
  const isAlreadySaved = appState.meetings.some(m => m.id === meeting.id);
  const btnSave = document.getElementById('btn-report-save');
  if (btnSave) {
    btnSave.innerHTML = isAlreadySaved 
      ? `✓ Saved in History` 
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
         </svg> Save Meeting`;
  }
}

/**
 * Setup Report Action Bar (Save, Edit, Download PDF, Export CSV)
 */
function setupReportViewActions() {
  const btnBack = document.getElementById('btn-report-back');
  const btnSave = document.getElementById('btn-report-save');
  const btnToggleEdit = document.getElementById('btn-report-toggle-edit');
  const btnDownloadPdf = document.getElementById('btn-report-download-pdf');
  const btnExportCsv = document.getElementById('btn-report-export-csv');

  // Back button
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      switchView('history');
    });
  }

  // Save Meeting to LocalStorage
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      if (!currentActiveReport) return;

      const existingIndex = appState.meetings.findIndex(m => m.id === currentActiveReport.id);
      if (existingIndex !== -1) {
        appState.meetings[existingIndex] = currentActiveReport;
      } else {
        appState.meetings.unshift(currentActiveReport);
      }

      // Synchronize action items into global list
      if (currentActiveReport.analysisResult?.actionItems) {
        currentActiveReport.analysisResult.actionItems.forEach(item => {
          const actIndex = appState.actionItems.findIndex(a => a.id === item.id);
          if (actIndex !== -1) {
            appState.actionItems[actIndex] = item;
          } else {
            appState.actionItems.push(item);
          }
        });
      }

      // Synchronize clarifications into global list
      if (currentActiveReport.analysisResult?.ambiguities) {
        currentActiveReport.analysisResult.ambiguities.forEach(amb => {
          const ambIndex = appState.clarifications.findIndex(c => c.id === amb.id);
          if (ambIndex !== -1) {
            appState.clarifications[ambIndex] = amb;
          } else {
            appState.clarifications.push(amb);
          }
        });
      }

      saveState();
      btnSave.innerHTML = `✓ Saved in History`;
      showToast('Meeting and action items saved to your workspace!', 'success');
    });
  }

  // Toggle Edit Report
  let isEditing = false;
  if (btnToggleEdit) {
    btnToggleEdit.addEventListener('click', () => {
      isEditing = !isEditing;
      const summaryEl = document.getElementById('report-executive-summary');
      const titleEl = document.getElementById('report-display-title');

      summaryEl.contentEditable = isEditing ? 'true' : 'false';
      titleEl.contentEditable = isEditing ? 'true' : 'false';

      if (isEditing) {
        summaryEl.style.backgroundColor = '#fdf4ff';
        titleEl.style.backgroundColor = '#fdf4ff';
        btnToggleEdit.innerHTML = `✓ Done Editing`;
        btnToggleEdit.classList.add('btn-primary');
        btnToggleEdit.classList.remove('btn-outline');
        showToast('You can now edit the summary and title directly.', 'info');
      } else {
        summaryEl.style.backgroundColor = 'transparent';
        titleEl.style.backgroundColor = 'transparent';
        btnToggleEdit.innerHTML = `Edit Report`;
        btnToggleEdit.classList.remove('btn-primary');
        btnToggleEdit.classList.add('btn-outline');

        // Persist edits back to currentActiveReport
        if (currentActiveReport) {
          currentActiveReport.title = titleEl.textContent.trim();
          if (currentActiveReport.analysisResult?.meetingSummary) {
            currentActiveReport.analysisResult.meetingSummary.executiveSummary = summaryEl.textContent.trim();
          }
          saveState();
          showToast('Edits saved locally!', 'success');
        }
      }
    });
  }

  // Download PDF using html2pdf.js
  if (btnDownloadPdf) {
    btnDownloadPdf.addEventListener('click', () => {
      const element = document.getElementById('printable-report-area');
      const meetingTitle = currentActiveReport ? currentActiveReport.title : 'Meeting-Report';
      const cleanFileName = meetingTitle.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';

      showToast('Generating high-resolution PDF report...', 'info');

      if (typeof html2pdf !== 'undefined') {
        const opt = {
          margin: [10, 10, 10, 10],
          filename: cleanFileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
          showToast('PDF downloaded successfully!', 'success');
        }).catch(err => {
          console.error('PDF error:', err);
          window.print();
        });
      } else {
        window.print();
      }
    });
  }

  // Export Action Items as CSV
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      const actionItems = currentActiveReport?.analysisResult?.actionItems || [];
      if (actionItems.length === 0) {
        showToast('No action items available to export.', 'info');
        return;
      }
      exportTasksToCsv(actionItems, `${currentActiveReport.title}_Action_Items.csv`);
    });
  }
}

/**
 * Open saved meeting report from History
 */
function openMeetingReport(meetingId) {
  const meeting = appState.meetings.find(m => m.id === meetingId);
  if (meeting) {
    renderMeetingReport(meeting);
    switchView('meeting-report');
  }
}

// ============================================================================
// GLOBAL ACTION ITEMS TRACKER VIEW
// ============================================================================

function setupActionItemsView() {
  const searchInput = document.getElementById('filter-action-search');
  const statusSelect = document.getElementById('filter-action-status');
  const prioritySelect = document.getElementById('filter-action-priority');
  const meetingSelect = document.getElementById('filter-action-meeting');
  const btnExportAll = document.getElementById('btn-export-all-tasks-csv');
  const btnAddCustom = document.getElementById('btn-add-custom-task');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      actionFilters.search = searchInput.value.trim().toLowerCase();
      renderActionItemsTable();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      actionFilters.status = statusSelect.value;
      renderActionItemsTable();
    });
  }

  if (prioritySelect) {
    prioritySelect.addEventListener('change', () => {
      actionFilters.priority = prioritySelect.value;
      renderActionItemsTable();
    });
  }

  if (meetingSelect) {
    meetingSelect.addEventListener('change', () => {
      actionFilters.meetingId = meetingSelect.value;
      renderActionItemsTable();
    });
  }

  if (btnExportAll) {
    btnExportAll.addEventListener('click', () => {
      if (appState.actionItems.length === 0) {
        showToast('No action items to export.', 'info');
        return;
      }
      exportTasksToCsv(appState.actionItems, 'All_Meeting_Action_Items.csv');
    });
  }

  if (btnAddCustom) {
    btnAddCustom.addEventListener('click', () => {
      openTaskEditModal(null);
    });
  }
}

function populateMeetingFilterDropdown() {
  const select = document.getElementById('filter-action-meeting');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="ALL">All Meetings</option>';

  appState.meetings.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.title;
    select.appendChild(opt);
  });

  select.value = currentVal;
}

function renderActionItemsTable() {
  const tbody = document.getElementById('global-action-items-tbody');
  if (!tbody) return;

  // Filter items
  const filtered = appState.actionItems.filter(task => {
    // Search
    if (actionFilters.search) {
      const matchTitle = (task.title || '').toLowerCase().includes(actionFilters.search);
      const matchDesc = (task.description || '').toLowerCase().includes(actionFilters.search);
      const matchAssignee = (task.assignedTo || '').toLowerCase().includes(actionFilters.search);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }

    // Status
    if (actionFilters.status !== 'ALL' && task.status !== actionFilters.status) {
      return false;
    }

    // Priority
    if (actionFilters.priority !== 'ALL' && task.priority !== actionFilters.priority) {
      return false;
    }

    // Meeting
    if (actionFilters.meetingId !== 'ALL' && task.meetingId !== actionFilters.meetingId) {
      return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          No action items found matching your filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(task => {
    const isOverdue = isTaskOverdue(task.deadline, task.status);
    const isUnassigned = !task.assignedTo || task.assignedTo.toLowerCase() === 'unassigned' || task.assignedTo === '';
    const priorityClass = `priority-${(task.priority || 'Medium').toLowerCase()}`;
    const statusClass = `status-${(task.status || 'Pending').toLowerCase().replace(/\s+/g, '')}`;

    return `
      <tr class="${isOverdue ? 'overdue-row' : ''}">
        <td>
          <div class="task-title-cell">
            <span class="task-title-text">${escapeHtml(task.title)}</span>
            <span class="task-desc-text">${escapeHtml(task.description || '')}</span>
          </div>
        </td>
        <td>
          <span class="text-muted text-sm">${escapeHtml(task.meetingTitle || 'Independent Task')}</span>
        </td>
        <td>
          <span class="assignee-chip ${isUnassigned ? 'unassigned' : ''}">
            ${isUnassigned ? '⚠️ Unassigned' : '👤 ' + escapeHtml(task.assignedTo)}
          </span>
        </td>
        <td>
          <span class="badge ${isOverdue ? 'badge-rose' : 'badge-info'}">
            ${isOverdue ? '⚠️ Overdue: ' : '📅 '}${escapeHtml(task.deadline || 'TBD')}
          </span>
        </td>
        <td>
          <span class="priority-pill ${priorityClass}">${escapeHtml(task.priority || 'Medium')}</span>
        </td>
        <td>
          <select class="form-control btn-sm status-dropdown" data-task-id="${task.id}" style="width: auto;">
            <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td class="text-right">
          <button class="btn btn-sm btn-ghost btn-edit-task" data-task-id="${task.id}" title="Edit task">
            ✏️
          </button>
          <button class="btn btn-sm btn-ghost text-rose btn-delete-task" data-task-id="${task.id}" title="Delete task">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Status change listeners
  tbody.querySelectorAll('.status-dropdown').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const taskId = e.target.dataset.taskId;
      const newStatus = e.target.value;
      updateTaskStatus(taskId, newStatus);
    });
  });

  // Edit task listeners
  tbody.querySelectorAll('.btn-edit-task').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset.taskId;
      const task = appState.actionItems.find(t => t.id === taskId);
      if (task) openTaskEditModal(task);
    });
  });

  // Delete task listeners
  tbody.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset.taskId;
      deleteTask(taskId);
    });
  });
}

function updateTaskStatus(taskId, newStatus) {
  const task = appState.actionItems.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;

    // Sync in parent meeting object if present
    appState.meetings.forEach(m => {
      const found = (m.analysisResult?.actionItems || []).find(a => a.id === taskId);
      if (found) found.status = newStatus;
    });

    saveState();
    showToast(`Task status updated to "${newStatus}"`, 'success');
    renderActionItemsTable();
  }
}

function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this action item?')) return;

  appState.actionItems = appState.actionItems.filter(t => t.id !== taskId);

  // Sync with meetings
  appState.meetings.forEach(m => {
    if (m.analysisResult?.actionItems) {
      m.analysisResult.actionItems = m.analysisResult.actionItems.filter(a => a.id !== taskId);
    }
  });

  saveState();
  showToast('Action item deleted', 'info');
  renderActionItemsTable();
}

// ============================================================================
// CLARIFICATIONS & AMBIGUITY RESOLUTION WORKFLOW
// ============================================================================

function setupClarificationsView() {
  const tabUnresolved = document.getElementById('tab-clarification-unresolved');
  const tabResolved = document.getElementById('tab-clarification-resolved');
  const tabAll = document.getElementById('tab-clarification-all');

  [tabUnresolved, tabResolved, tabAll].forEach(tab => {
    if (tab) {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.clarification-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        tab.classList.add('active');
        activeClarificationTab = tab.dataset.clarificationTab;
        renderClarificationsList();
      });
    }
  });
}

function renderClarificationsList() {
  const container = document.getElementById('clarifications-list-container');
  if (!container) return;

  const totalUnresolved = appState.clarifications.filter(c => !c.resolved).length;
  const totalResolved = appState.clarifications.filter(c => c.resolved).length;
  const totalAll = appState.clarifications.length;

  document.getElementById('unresolved-tab-count').textContent = totalUnresolved;
  document.getElementById('resolved-tab-count').textContent = totalResolved;
  document.getElementById('all-clarification-tab-count').textContent = totalAll;

  let items = appState.clarifications;
  if (activeClarificationTab === 'unresolved') {
    items = items.filter(c => !c.resolved);
  } else if (activeClarificationTab === 'resolved') {
    items = items.filter(c => c.resolved);
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state card">
        <h3 class="mb-2">No ${activeClarificationTab} ambiguities found!</h3>
        <p class="text-muted">
          ${activeClarificationTab === 'unresolved' 
            ? 'All identified action items have designated owners and explicit deadlines.' 
            : 'No resolved clarifications yet.'}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(amb => `
    <div class="ambiguity-card ${amb.resolved ? 'resolved' : ''}">
      <div class="ambiguity-card-top">
        <div>
          <span class="text-muted text-xs">SOURCE: ${escapeHtml(amb.meetingTitle || 'Meeting')}</span>
          <div class="problem-callout mt-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Problem: ${escapeHtml(amb.problem)}</span>
          </div>
        </div>
        <span class="badge ${amb.resolved ? 'badge-green' : 'badge-rose'}">
          ${amb.resolved ? '✓ Resolved' : 'Missing: ' + escapeHtml(amb.missingInfo)}
        </span>
      </div>

      <div class="quote-box">
        "${escapeHtml(amb.originalStatement)}"
      </div>

      <div class="suggested-question-box">
        <span>💡 <strong>AI Clarification:</strong> ${escapeHtml(amb.suggestedQuestion)}</span>
      </div>

      ${amb.resolved && amb.resolutionDetails ? `
        <div class="p-2 bg-green-50 rounded text-sm text-green">
          <strong>Resolution:</strong> Assigned to <em>${escapeHtml(amb.resolutionDetails.assignee || 'Assigned')}</em> 
          &bull; Target date: <em>${escapeHtml(amb.resolutionDetails.deadline || 'Set')}</em>
          ${amb.resolutionDetails.notes ? `<br><small class="text-muted">${escapeHtml(amb.resolutionDetails.notes)}</small>` : ''}
        </div>
      ` : ''}

      <div class="ambiguity-actions">
        ${amb.resolved 
          ? `<button class="btn btn-sm btn-ghost btn-reopen-ambiguity" data-amb-id="${amb.id}">Reopen Issue</button>`
          : `
            <button class="btn btn-sm btn-ghost btn-dismiss-ambiguity" data-amb-id="${amb.id}">Dismiss</button>
            <button class="btn btn-sm btn-primary btn-resolve-ambiguity" 
              data-amb-id="${amb.id}" 
              data-task-id="${amb.relatedTaskId || ''}" 
              data-meeting-id="${amb.meetingId || ''}">
              Resolve Ambiguity &rarr;
            </button>
          `
        }
      </div>
    </div>
  `).join('');

  // Attach button actions
  container.querySelectorAll('.btn-resolve-ambiguity').forEach(btn => {
    btn.addEventListener('click', () => {
      openClarificationModal(btn.dataset.ambId, btn.dataset.taskId, btn.dataset.meetingId);
    });
  });

  container.querySelectorAll('.btn-dismiss-ambiguity').forEach(btn => {
    btn.addEventListener('click', () => {
      dismissClarification(btn.dataset.ambId);
    });
  });

  container.querySelectorAll('.btn-reopen-ambiguity').forEach(btn => {
    btn.addEventListener('click', () => {
      reopenClarification(btn.dataset.ambId);
    });
  });
}

function openClarificationModal(ambId, taskId, meetingId) {
  const amb = appState.clarifications.find(c => c.id === ambId);
  if (!amb) return;

  const modal = document.getElementById('modal-resolve-clarification');
  document.getElementById('resolve-clarification-id').value = ambId;
  document.getElementById('resolve-related-task-id').value = taskId || amb.relatedTaskId || '';
  document.getElementById('resolve-meeting-id').value = meetingId || amb.meetingId || '';

  document.getElementById('modal-clarification-quote').textContent = `"${amb.originalStatement}"`;
  document.getElementById('modal-clarification-question').textContent = amb.suggestedQuestion;

  // Pre-fill existing task info if available
  const relatedTask = appState.actionItems.find(t => t.id === taskId);
  document.getElementById('resolve-assignee-input').value = relatedTask && relatedTask.assignedTo !== 'Unassigned' ? relatedTask.assignedTo : '';
  document.getElementById('resolve-deadline-input').value = relatedTask && relatedTask.deadline !== 'TBD' ? relatedTask.deadline : getRelativeDate(5);
  document.getElementById('resolve-notes-input').value = '';

  modal.classList.remove('hidden');
}

function setupClarificationModal() {
  const modal = document.getElementById('modal-resolve-clarification');
  const btnClose = document.getElementById('btn-close-clarification-modal');
  const btnCancel = document.getElementById('btn-cancel-clarification-modal');
  const form = document.getElementById('form-resolve-clarification');

  const closeModal = () => modal.classList.add('hidden');

  btnClose.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const ambId = document.getElementById('resolve-clarification-id').value;
    const taskId = document.getElementById('resolve-related-task-id').value;
    const assignee = document.getElementById('resolve-assignee-input').value.trim();
    const deadline = document.getElementById('resolve-deadline-input').value;
    const notes = document.getElementById('resolve-notes-input').value.trim();

    if (!assignee) {
      showToast('Please specify an assignee/owner to resolve this ambiguity.', 'error');
      return;
    }

    resolveAmbiguityAndSyncTask(ambId, taskId, { assignee, deadline, notes });
    closeModal();
  });
}

function resolveAmbiguityAndSyncTask(ambId, taskId, resolution) {
  // 1. Mark ambiguity as resolved
  const amb = appState.clarifications.find(c => c.id === ambId);
  if (amb) {
    amb.resolved = true;
    amb.resolutionDetails = {
      assignee: resolution.assignee,
      deadline: resolution.deadline,
      notes: resolution.notes,
      resolvedAt: new Date().toISOString()
    };
  }

  // 2. Synchronize ambiguity resolution inside the meeting object
  appState.meetings.forEach(m => {
    const meetingAmb = (m.analysisResult?.ambiguities || []).find(a => a.id === ambId);
    if (meetingAmb) {
      meetingAmb.resolved = true;
      meetingAmb.resolutionDetails = amb.resolutionDetails;
    }
  });

  // 3. Update the corresponding action item
  const task = appState.actionItems.find(t => t.id === taskId);
  if (task) {
    task.assignedTo = resolution.assignee;
    if (resolution.deadline) task.deadline = resolution.deadline;
    if (resolution.notes) task.description += ` (Note: ${resolution.notes})`;

    // Sync in parent meeting object
    appState.meetings.forEach(m => {
      const meetingTask = (m.analysisResult?.actionItems || []).find(a => a.id === taskId);
      if (meetingTask) {
        meetingTask.assignedTo = resolution.assignee;
        if (resolution.deadline) meetingTask.deadline = resolution.deadline;
      }
    });
  }

  saveState();
  showToast('Ambiguity resolved! Linked action item updated.', 'success');

  // Refresh views
  renderClarificationsList();
  renderActionItemsTable();
  if (currentActiveReport) renderMeetingReport(currentActiveReport);
}

function dismissClarification(ambId) {
  appState.clarifications = appState.clarifications.filter(c => c.id !== ambId);
  appState.meetings.forEach(m => {
    if (m.analysisResult?.ambiguities) {
      m.analysisResult.ambiguities = m.analysisResult.ambiguities.filter(c => c.id !== ambId);
    }
  });

  saveState();
  showToast('Clarification dismissed', 'info');
  renderClarificationsList();
}

function reopenClarification(ambId) {
  const amb = appState.clarifications.find(c => c.id === ambId);
  if (amb) {
    amb.resolved = false;
    saveState();
    showToast('Clarification reopened', 'info');
    renderClarificationsList();
  }
}

// ============================================================================
// MEETING HISTORY VIEW
// ============================================================================

function setupHistoryView() {
  const searchInput = document.getElementById('filter-history-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderMeetingHistory(searchInput.value.trim().toLowerCase());
    });
  }
}

function renderMeetingHistory(searchQuery = '') {
  const container = document.getElementById('history-cards-container');
  if (!container) return;

  let list = appState.meetings;

  if (searchQuery) {
    list = list.filter(m => 
      (m.title || '').toLowerCase().includes(searchQuery) ||
      (m.participants || '').toLowerCase().includes(searchQuery) ||
      (m.transcript || '').toLowerCase().includes(searchQuery)
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state card" style="grid-column: 1 / -1;">
        <h3 class="mb-2">No meetings found</h3>
        <p class="text-muted mb-3">You haven't saved any meetings yet, or no meetings match your query.</p>
        <button class="btn btn-primary" id="btn-history-empty-new">
          Analyze New Meeting &rarr;
        </button>
      </div>
    `;
    const btn = document.getElementById('btn-history-empty-new');
    if (btn) btn.addEventListener('click', () => switchView('new-meeting'));
    return;
  }

  container.innerHTML = list.map(m => {
    const actionsCount = (m.analysisResult?.actionItems || []).length;
    const decisionsCount = (m.analysisResult?.decisions || []).length;
    const unresolvedCount = (m.analysisResult?.ambiguities || []).filter(a => !a.resolved).length;

    return `
      <div class="history-card">
        <div class="history-card-header">
          <div class="history-card-date">📅 ${formatDate(m.date)}</div>
          <h3 class="history-card-title">${escapeHtml(m.title)}</h3>
          <div class="text-xs text-muted mt-1">👥 ${escapeHtml(m.participants || 'Team')}</div>
        </div>

        <div class="history-card-stats">
          <div class="history-stat-col">
            <span class="history-stat-label">Tasks</span>
            <span class="history-stat-num text-purple">${actionsCount}</span>
          </div>
          <div class="history-stat-col">
            <span class="history-stat-label">Decisions</span>
            <span class="history-stat-num text-green">${decisionsCount}</span>
          </div>
          <div class="history-stat-col">
            <span class="history-stat-label">Issues</span>
            <span class="history-stat-num ${unresolvedCount > 0 ? 'text-rose' : 'text-muted'}">${unresolvedCount}</span>
          </div>
        </div>

        <div class="history-card-footer">
          <button class="btn btn-sm btn-ghost text-rose btn-delete-history-meeting" data-meeting-id="${m.id}" title="Delete meeting">
            🗑️ Delete
          </button>
          <button class="btn btn-sm btn-primary btn-open-history-meeting" data-meeting-id="${m.id}">
            Open Report &rarr;
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach button events
  container.querySelectorAll('.btn-open-history-meeting').forEach(btn => {
    btn.addEventListener('click', () => {
      openMeetingReport(btn.dataset.meetingId);
    });
  });

  container.querySelectorAll('.btn-delete-history-meeting').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteMeeting(btn.dataset.meetingId);
    });
  });
}

function deleteMeeting(meetingId) {
  if (!confirm('Are you sure you want to delete this meeting and its associated records?')) return;

  appState.meetings = appState.meetings.filter(m => m.id !== meetingId);
  appState.actionItems = appState.actionItems.filter(a => a.meetingId !== meetingId);
  appState.clarifications = appState.clarifications.filter(c => c.meetingId !== meetingId);

  saveState();
  showToast('Meeting and related tasks removed', 'info');
  renderMeetingHistory();
}

// ============================================================================
// MODAL: TASK EDIT / ADD CUSTOM TASK
// ============================================================================

function setupTaskEditModal() {
  const modal = document.getElementById('modal-edit-task');
  const btnClose = document.getElementById('btn-close-task-modal');
  const btnCancel = document.getElementById('btn-cancel-task-modal');
  const form = document.getElementById('form-edit-task');

  const closeModal = () => modal.classList.add('hidden');

  btnClose.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const taskId = document.getElementById('edit-task-id').value;
    const meetingId = document.getElementById('edit-task-meeting-id').value;
    const title = document.getElementById('edit-task-title-input').value.trim();
    const description = document.getElementById('edit-task-desc-input').value.trim();
    const assignedTo = document.getElementById('edit-task-assignee-input').value.trim() || 'Unassigned';
    const deadline = document.getElementById('edit-task-deadline-input').value || 'TBD';
    const priority = document.getElementById('edit-task-priority-select').value;
    const status = document.getElementById('edit-task-status-select').value;

    if (!title) {
      showToast('Task title is required', 'error');
      return;
    }

    if (taskId) {
      // Editing existing task
      const task = appState.actionItems.find(t => t.id === taskId);
      if (task) {
        task.title = title;
        task.description = description;
        task.assignedTo = assignedTo;
        task.deadline = deadline;
        task.priority = priority;
        task.status = status;

        // Sync with parent meeting
        appState.meetings.forEach(m => {
          const match = (m.analysisResult?.actionItems || []).find(a => a.id === taskId);
          if (match) {
            Object.assign(match, { title, description, assignedTo, deadline, priority, status });
          }
        });
      }
      showToast('Action item updated successfully', 'success');
    } else {
      // Adding new custom task
      const newTask = {
        id: 'act_' + Date.now(),
        meetingId: meetingId || null,
        meetingTitle: meetingId ? 'Linked Meeting' : 'Custom Task',
        title,
        description,
        assignedTo,
        deadline,
        priority,
        status,
        createdAt: new Date().toISOString()
      };
      appState.actionItems.unshift(newTask);
      showToast('New action item created', 'success');
    }

    saveState();
    closeModal();
    renderActionItemsTable();
    if (currentActiveReport) renderMeetingReport(currentActiveReport);
  });
}

function openTaskEditModal(task) {
  const modal = document.getElementById('modal-edit-task');
  const titleHeader = document.getElementById('modal-task-title');

  if (task) {
    titleHeader.textContent = 'Edit Action Item';
    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-task-meeting-id').value = task.meetingId || '';
    document.getElementById('edit-task-title-input').value = task.title;
    document.getElementById('edit-task-desc-input').value = task.description || '';
    document.getElementById('edit-task-assignee-input').value = task.assignedTo !== 'Unassigned' ? task.assignedTo : '';
    document.getElementById('edit-task-deadline-input').value = task.deadline !== 'TBD' ? task.deadline : '';
    document.getElementById('edit-task-priority-select').value = task.priority || 'Medium';
    document.getElementById('edit-task-status-select').value = task.status || 'Pending';
  } else {
    titleHeader.textContent = 'Add Custom Action Item';
    document.getElementById('edit-task-id').value = '';
    document.getElementById('edit-task-meeting-id').value = '';
    document.getElementById('edit-task-title-input').value = '';
    document.getElementById('edit-task-desc-input').value = '';
    document.getElementById('edit-task-assignee-input').value = '';
    document.getElementById('edit-task-deadline-input').value = getRelativeDate(7);
    document.getElementById('edit-task-priority-select').value = 'Medium';
    document.getElementById('edit-task-status-select').value = 'Pending';
  }

  modal.classList.remove('hidden');
}

// ============================================================================
// EXPORT UTILITIES: CSV
// ============================================================================

/**
 * Generates and triggers browser download of tasks in CSV format
 * @param {Array} tasks - List of action items
 * @param {string} filename - Desired CSV file name
 */
function exportTasksToCsv(tasks, filename = 'action_items.csv') {
  const headers = ['Task Title', 'Description', 'Meeting', 'Assigned To', 'Deadline', 'Priority', 'Status'];
  
  const rows = tasks.map(t => [
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.meetingTitle || 'N/A').replace(/"/g, '""')}"`,
    `"${(t.assignedTo || 'Unassigned').replace(/"/g, '""')}"`,
    `"${(t.deadline || 'TBD').replace(/"/g, '""')}"`,
    `"${(t.priority || 'Medium').replace(/"/g, '""')}"`,
    `"${(t.status || 'Pending').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Exported ${tasks.length} action items to CSV!`, 'success');
}

// ============================================================================
// TOAST NOTIFICATIONS & UTILITIES
// ============================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================================
// BACKEND HEALTH CHECK
// ============================================================================

async function checkBackendHealth() {
  const modelLabel = document.getElementById('ai-model-label');
  const connLabel = document.getElementById('ai-connection-label');
  const dot = document.querySelector('.status-indicator-dot');

  try {
    const res = await fetch('/api/health');
    const data = await res.json();

    if (data.status === 'ok') {
      if (dot) dot.className = 'status-indicator-dot online';
      if (modelLabel) modelLabel.textContent = data.hasGeminiKey ? 'Gemini 3.8 / 2.5' : 'Gemini AI (Demo)';
      if (connLabel) connLabel.textContent = data.hasGeminiKey ? 'Live API Connected' : 'Local Fallback Ready';
    }
  } catch (err) {
    if (dot) dot.className = 'status-indicator-dot offline';
    if (modelLabel) modelLabel.textContent = 'Backend Offline';
    if (connLabel) connLabel.textContent = 'Check Node.js server';
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load LocalStorage State
  loadState();

  // 2. Set current date display
  const dateDisplay = document.getElementById('current-date-display');
  if (dateDisplay) {
    dateDisplay.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  }

  // 3. Setup Navigation buttons
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view) switchView(view);
    });
  });

  // Top header Quick "New Meeting" button
  const quickNewBtn = document.getElementById('btn-quick-new-meeting');
  if (quickNewBtn) {
    quickNewBtn.addEventListener('click', () => switchView('new-meeting'));
  }

  // Dashboard shortcuts
  const cardClarifications = document.getElementById('card-unresolved-clarifications');
  if (cardClarifications) {
    cardClarifications.addEventListener('click', () => switchView('clarifications'));
  }

  const btnGotoActions = document.getElementById('btn-goto-all-actions');
  if (btnGotoActions) {
    btnGotoActions.addEventListener('click', () => switchView('actions'));
  }

  const btnGotoHistory = document.getElementById('btn-goto-all-history');
  if (btnGotoHistory) {
    btnGotoHistory.addEventListener('click', () => switchView('history'));
  }

  const btnDashboardAnalyzeCta = document.getElementById('btn-dashboard-analyze-cta');
  if (btnDashboardAnalyzeCta) {
    btnDashboardAnalyzeCta.addEventListener('click', () => switchView('new-meeting'));
  }

  // 4. Setup View Controllers
  setupNewMeetingView();
  setupReportViewActions();
  setupActionItemsView();
  setupClarificationsView();
  setupHistoryView();
  setupTaskEditModal();
  setupClarificationModal();

  // 5. Initial Render
  switchView('dashboard');

  // 6. Check AI backend health
  checkBackendHealth();
});
