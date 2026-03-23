// ============================================================
// FocusForge — script.js  (Full featured localStorage version)
// Features: Auth, XP/Levels, Subjects, Streaks,
//           Multiple Plans, Dark/Light Mode, Timer, Delete Profile
// ============================================================

// ── HELPERS ──────────────────────────────────────────────────
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
function getUsers()       { return JSON.parse(localStorage.getItem('ff_users') || '{}'); }
function saveUsers(u)     { localStorage.setItem('ff_users', JSON.stringify(u)); }
function getCurrentUser() { return localStorage.getItem('ff_currentUser'); }
function getKey(type)     { return `ff_${getCurrentUser()}_${type}`; }
function escapeHtml(str)  {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}
function authGuard() {
  if (!getCurrentUser()) { window.location.href = 'login.html'; return false; }
  return true;
}

// ── SUBJECT COLORS ────────────────────────────────────────────
const SUBJECT_COLORS = {
  'Math':      '#f59e0b',
  'Science':   '#10b981',
  'English':   '#3b82f6',
  'History':   '#8b5cf6',
  'Computer':  '#06b6d4',
  'Physics':   '#f97316',
  'Chemistry': '#ec4899',
  'Biology':   '#84cc16',
  'Other':     '#94a3b8',
};
function subjectTag(subject) {
  if (!subject) return '';
  const color = SUBJECT_COLORS[subject] || '#94a3b8';
  return `<span class="subject-tag" style="background:${color}22;color:${color};border-color:${color}44">${subject}</span>`;
}

// ── AUTH ──────────────────────────────────────────────────────
function register() {
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;
  const confirm  = document.getElementById('regPassConfirm').value;
  if (!username || !password || !confirm) return showError('regError', 'Please fill in all fields.');
  if (username.length < 3)  return showError('regError', 'Username must be at least 3 characters.');
  if (password.length < 4)  return showError('regError', 'Password must be at least 4 characters.');
  if (password !== confirm)  return showError('regError', 'Passwords do not match.');
  const users = getUsers();
  if (users[username]) return showError('regError', 'Username already taken. Try another.');
  users[username] = { password };
  saveUsers(users);
  alert('✅ Account created! Please login.');
  window.location.href = 'login.html';
}

function login() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  if (!username || !password) return showError('loginError', 'Please fill in all fields.');
  const users = getUsers();
  if (!users[username] || users[username].password !== password)
    return showError('loginError', 'Invalid username or password.');
  localStorage.setItem('ff_currentUser', username);
  window.location.href = 'dashboard.html';
}

function logout() {
  timerStop();
  localStorage.removeItem('ff_currentUser');
  window.location.href = 'login.html';
}

// ── THEME ─────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('ff_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = saved === 'dark' ? '🌙' : '☀️';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ff_theme', next);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
}

// ── PROFILE MENU ─────────────────────────────────────────────
function toggleProfileMenu() {
  document.getElementById('profileDropdown').classList.toggle('open');
}
document.addEventListener('click', (e) => {
  const btn = document.getElementById('profileMenuBtn');
  const dd  = document.getElementById('profileDropdown');
  if (dd && btn && !btn.contains(e.target) && !dd.contains(e.target))
    dd.classList.remove('open');
});

// ── DELETE PROFILE ────────────────────────────────────────────
function openDeleteProfile() {
  document.getElementById('deleteConfirmInput').value = '';
  document.getElementById('deleteError').style.display = 'none';
  document.getElementById('deleteModal').classList.add('open');
  document.getElementById('profileDropdown').classList.remove('open');
}
function closeDeleteProfile() {
  document.getElementById('deleteModal').classList.remove('open');
}
function confirmDeleteProfile() {
  const typed = document.getElementById('deleteConfirmInput').value.trim();
  const user  = getCurrentUser();
  if (typed !== user) return showError('deleteError', `Username doesn't match. Type "${user}" exactly.`);
  const toDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`ff_${user}_`)) toDelete.push(k);
  }
  toDelete.forEach(k => localStorage.removeItem(k));
  const users = getUsers();
  delete users[user];
  saveUsers(users);
  localStorage.removeItem('ff_currentUser');
  alert('🗑️ Your profile has been permanently deleted.');
  window.location.href = 'index.html';
}

// ── CHANGE PASSWORD ───────────────────────────────────────────
function openChangePassword() {
  ['oldPass','newPass','newPassConfirm'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('changePassError').style.display = 'none';
  document.getElementById('changePassModal').classList.add('open');
  document.getElementById('profileDropdown').classList.remove('open');
}
function closeChangePassword() {
  document.getElementById('changePassModal').classList.remove('open');
}
function confirmChangePassword() {
  const oldPass = document.getElementById('oldPass').value;
  const newPass = document.getElementById('newPass').value;
  const newConf = document.getElementById('newPassConfirm').value;
  const user    = getCurrentUser();
  const users   = getUsers();
  if (!oldPass || !newPass || !newConf) return showError('changePassError', 'Please fill in all fields.');
  if (users[user].password !== oldPass)  return showError('changePassError', 'Current password is incorrect.');
  if (newPass.length < 4)                return showError('changePassError', 'New password must be at least 4 characters.');
  if (newPass !== newConf)               return showError('changePassError', 'New passwords do not match.');
  users[user].password = newPass;
  saveUsers(users);
  closeChangePassword();
  alert('✅ Password updated successfully!');
}

// ════════════════════════════════════════════════════════════
// ── XP / LEVELS ──────────────────────────────────────────────
// ════════════════════════════════════════════════════════════

const LEVELS = [
  { min:    0, max:   99,  title: 'Beginner',    emoji: '🌱', num: 1  },
  { min:  100, max:  249,  title: 'Scholar',     emoji: '📖', num: 2  },
  { min:  250, max:  499,  title: 'Focused',     emoji: '🎯', num: 3  },
  { min:  500, max:  899,  title: 'Achiever',    emoji: '⚡', num: 4  },
  { min:  900, max: 1499,  title: 'Expert',      emoji: '🏆', num: 5  },
  { min: 1500, max: 2499,  title: 'Master',      emoji: '🌟', num: 6  },
  { min: 2500, max: 3999,  title: 'Legend',      emoji: '👑', num: 7  },
  { min: 4000, max: 99999, title: 'Grandmaster', emoji: '🔥', num: 8  },
];

function getXP()      { return parseInt(localStorage.getItem(getKey('xp')) || '0'); }
function setXP(v)     { localStorage.setItem(getKey('xp'), v); }

function getLevelData(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
}

function awardXP(amount, label) {
  const oldXP  = getXP();
  const newXP  = oldXP + amount;
  const oldLvl = getLevelData(oldXP);
  const newLvl = getLevelData(newXP);
  setXP(newXP);
  updateXPBar();
  updateStats();
  showXPPopup(`+${amount} XP${label ? ' · ' + label : ''}`);
  if (newLvl.num > oldLvl.num) showLevelUp(newLvl);
}

function updateXPBar() {
  const xp   = getXP();
  const lvl  = getLevelData(xp);
  const next = LEVELS[lvl.index + 1];
  const pct  = next ? Math.round(((xp - lvl.min) / (next.min - lvl.min)) * 100) : 100;
  const el   = (id) => document.getElementById(id);

  if (el('levelEmoji'))  el('levelEmoji').textContent  = lvl.emoji;
  if (el('levelTitle'))  el('levelTitle').textContent  = lvl.title;
  if (el('levelNum'))    el('levelNum').textContent    = `Level ${lvl.num}`;
  if (el('xpBarFill'))   el('xpBarFill').style.width  = `${pct}%`;
  if (el('xpText'))      el('xpText').textContent     = next
    ? `${xp - lvl.min} / ${next.min - lvl.min} XP`
    : `${xp} XP — MAX LEVEL`;
  if (el('totalXP'))     el('totalXP').textContent    = xp;
}

function showXPPopup(text) {
  const el = document.getElementById('xpPopup');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1800);
}

function showLevelUp(lvl) {
  const toast = document.getElementById('levelupToast');
  const emoji = document.getElementById('levelupEmoji');
  const title = document.getElementById('levelupTitle');
  const sub   = document.getElementById('levelupSub');
  if (!toast) return;
  if (emoji) emoji.textContent = lvl.emoji;
  if (title) title.textContent = 'Level Up!';
  if (sub)   sub.textContent   = `You are now a ${lvl.title}!`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ════════════════════════════════════════════════════════════
// ── STREAK ───────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════

function getTodayStr() { return new Date().toISOString().split('T')[0]; }

function getStreakData() {
  return JSON.parse(localStorage.getItem(getKey('streak')) || JSON.stringify({
    current: 0, longest: 0, lastActive: '', activeDays: []
  }));
}
function saveStreakData(d) { localStorage.setItem(getKey('streak'), JSON.stringify(d)); }

function recordActivity() {
  const today = getTodayStr();
  const data  = getStreakData();

  if (data.activeDays.includes(today)) return; // already recorded today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const wasYesterday = data.lastActive === yesterday;

  data.current   = wasYesterday ? data.current + 1 : 1;
  data.longest   = Math.max(data.longest, data.current);
  data.lastActive = today;
  data.activeDays = [...(data.activeDays || []), today].slice(-90); // keep 90 days

  saveStreakData(data);
  renderStreak();
  updateStats();
}

function renderStreak() {
  const data = getStreakData();
  const el   = (id) => document.getElementById(id);

  if (el('streakCount'))       el('streakCount').textContent       = data.current;
  if (el('currentStreak'))     el('currentStreak').textContent     = `${data.current}🔥`;
  if (el('longestStreak'))     el('longestStreak').textContent     = data.longest;
  if (el('streakPillCurrent')) el('streakPillCurrent').textContent = `Current: ${data.current} day${data.current !== 1 ? 's' : ''}`;
  if (el('streakPillBest'))    el('streakPillBest').textContent    = `Best: ${data.longest} day${data.longest !== 1 ? 's' : ''}`;

  const today   = getTodayStr();
  const isToday = data.activeDays.includes(today);
  if (el('streakTip')) {
    el('streakTip').textContent = isToday
      ? `✅ You've been active today! Keep it up.`
      : `⚡ Complete a task, habit, or timer session today to keep your streak alive!`;
  }

  renderStreakCalendar(data.activeDays);
}

function renderStreakCalendar(activeDays) {
  const cal = document.getElementById('streakCalendar');
  if (!cal) return;

  // Show last 28 days (4 rows × 7)
  const today  = new Date();
  const days   = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const dayLabels = ['S','M','T','W','T','F','S'];
  let html = '<div class="cal-labels">';
  dayLabels.forEach(l => { html += `<span>${l}</span>`; });
  html += '</div><div class="cal-grid">';

  days.forEach(dateStr => {
    const active  = activeDays.includes(dateStr);
    const isToday = dateStr === getTodayStr();
    const dd      = new Date(dateStr).getDate();
    html += `<div class="cal-cell ${active ? 'active' : ''} ${isToday ? 'today' : ''}" title="${dateStr}">${dd}</div>`;
  });
  html += '</div>';
  cal.innerHTML = html;
}

// ════════════════════════════════════════════════════════════
// ── DASHBOARD INIT ───────────────────────────────────────────
// ════════════════════════════════════════════════════════════

function initDashboard() {
  if (!authGuard()) return;
  initTheme();

  const badge = document.getElementById('userBadge');
  if (badge) badge.textContent = '👤 ' + getCurrentUser();

  const dateInput = document.getElementById('studyDate');
  if (dateInput) dateInput.value = getTodayStr();

  loadTasks();
  loadHabits();
  loadPlansForDate();
  updateStats();
  updateXPBar();
  renderStreak();
  initTimer();
  loadSessionLog();
}

// ── TASKS ─────────────────────────────────────────────────────
function getTasks()   { return JSON.parse(localStorage.getItem(getKey('tasks')) || '[]'); }
function saveTasks(t) { localStorage.setItem(getKey('tasks'), JSON.stringify(t)); }

function addTask() {
  const input   = document.getElementById('taskInput');
  const text    = input.value.trim();
  const subject = document.getElementById('taskSubject').value;
  if (!text) return;
  const tasks = getTasks();
  tasks.push({ id: Date.now(), text, subject, done: false, doneDate: null });
  saveTasks(tasks);
  input.value = '';
  loadTasks(); updateStats();
}

function toggleTask(id) {
  const tasks = getTasks().map(t => {
    if (t.id !== id) return t;
    const nowDone = !t.done;
    if (nowDone) {
      awardXP(10, t.subject || 'Task');
      recordActivity();
    }
    return { ...t, done: nowDone, doneDate: nowDone ? getTodayStr() : null };
  });
  saveTasks(tasks); loadTasks(); updateStats();
}

function deleteTask(id) {
  saveTasks(getTasks().filter(t => t.id !== id));
  loadTasks(); updateStats();
}

function loadTasks() {
  const list    = document.getElementById('taskList');
  const empty   = document.getElementById('taskEmpty');
  const count   = document.getElementById('taskCount');
  const filter  = document.getElementById('taskSubjectFilter');
  if (!list) return;

  const filterVal = filter ? filter.value : '';
  let tasks = getTasks();
  if (filterVal) tasks = tasks.filter(t => t.subject === filterVal);

  list.innerHTML = '';
  tasks.forEach(t => {
    const li = document.createElement('li');
    li.className = 'list-item' + (t.done ? ' done' : '');
    li.innerHTML = `
      <button class="check-btn ${t.done ? 'checked' : ''}" onclick="toggleTask(${t.id})">${t.done ? '✓' : ''}</button>
      <span class="item-text">${escapeHtml(t.text)}</span>
      ${subjectTag(t.subject)}
      <button class="delete-btn" onclick="deleteTask(${t.id})" title="Delete">✕</button>`;
    list.appendChild(li);
  });

  const allTasks = getTasks();
  if (count) count.textContent = allTasks.length;
  if (empty) empty.style.display = tasks.length === 0 ? 'block' : 'none';
}

// ── HABITS ────────────────────────────────────────────────────
function getHabits()   { return JSON.parse(localStorage.getItem(getKey('habits')) || '[]'); }
function saveHabits(h) { localStorage.setItem(getKey('habits'), JSON.stringify(h)); }

function addHabit() {
  const input = document.getElementById('habitInput');
  const text  = input.value.trim();
  if (!text) return;
  const habits = getHabits();
  habits.push({ id: Date.now(), text, done: false });
  saveHabits(habits);
  input.value = '';
  loadHabits(); updateStats();
}

function toggleHabit(id) {
  const habits = getHabits().map(h => {
    if (h.id !== id) return h;
    const nowDone = !h.done;
    if (nowDone) { awardXP(5, 'Habit'); recordActivity(); }
    return { ...h, done: nowDone };
  });
  saveHabits(habits); loadHabits(); updateStats();
}

function deleteHabit(id) {
  saveHabits(getHabits().filter(h => h.id !== id));
  loadHabits(); updateStats();
}

function loadHabits() {
  const list  = document.getElementById('habitList');
  const empty = document.getElementById('habitEmpty');
  const count = document.getElementById('habitCount');
  if (!list) return;

  const habits = getHabits();
  list.innerHTML = '';
  habits.forEach(h => {
    const li = document.createElement('li');
    li.className = 'list-item' + (h.done ? ' done' : '');
    li.innerHTML = `
      <button class="check-btn ${h.done ? 'checked' : ''}" onclick="toggleHabit(${h.id})">${h.done ? '✓' : ''}</button>
      <span class="item-text">${escapeHtml(h.text)}</span>
      <button class="delete-btn" onclick="deleteHabit(${h.id})" title="Delete">✕</button>`;
    list.appendChild(li);
  });
  if (count) count.textContent = habits.length;
  if (empty) empty.style.display = habits.length === 0 ? 'block' : 'none';
}

// ════════════════════════════════════════════════════════════
// ── STUDY PLANNER — MULTIPLE PLANS PER DATE ──────────────────
// ════════════════════════════════════════════════════════════

function getAllPlanData() {
  return JSON.parse(localStorage.getItem(getKey('plandata')) || '{}');
}
function saveAllPlanData(d) {
  localStorage.setItem(getKey('plandata'), JSON.stringify(d));
}
function getDatePlan(date) {
  const all = getAllPlanData();
  return all[date] || { items: [], notes: '' };
}
function saveDatePlan(date, plan) {
  const all = getAllPlanData();
  all[date] = plan;
  saveAllPlanData(all);
}

function addPlanItem() {
  const input   = document.getElementById('planItemInput');
  const text    = input.value.trim();
  const subject = document.getElementById('planSubject').value;
  const time    = document.getElementById('planTime').value;
  const date    = document.getElementById('studyDate').value;
  if (!text || !date) return;

  const plan = getDatePlan(date);
  plan.items.push({ id: Date.now(), text, subject, time, done: false });
  saveDatePlan(date, plan);
  input.value = '';
  document.getElementById('planSubject').value = '';
  document.getElementById('planTime').value = '';
  loadPlansForDate();
  awardXP(20, 'Plan Item');
  recordActivity();
  updateStats();
}

function togglePlanItem(date, id) {
  const plan = getDatePlan(date);
  plan.items = plan.items.map(i => i.id === id ? { ...i, done: !i.done } : i);
  saveDatePlan(date, plan);
  if (plan.items.find(i => i.id === id).done) {
    awardXP(10, 'Plan Item');
    recordActivity();
  }
  loadPlansForDate();
}

function deletePlanItem(date, id) {
  const plan = getDatePlan(date);
  plan.items = plan.items.filter(i => i.id !== id);
  saveDatePlan(date, plan);
  loadPlansForDate(); updateStats();
}

function saveNotes() {
  const date  = document.getElementById('studyDate').value;
  const notes = document.getElementById('studyPlan').value.trim();
  if (!date) return alert('Please select a date first.');
  const plan = getDatePlan(date);
  plan.notes = notes;
  saveDatePlan(date, plan);
  const status = document.getElementById('planStatus');
  if (status) { status.textContent = '✅ Notes saved!'; status.className = 'plan-status saved'; }
  updateStats();
}

function clearDayPlan() {
  const date = document.getElementById('studyDate').value;
  if (!date || !confirm('Clear all plans and notes for this date?')) return;
  const all = getAllPlanData();
  delete all[date];
  saveAllPlanData(all);
  document.getElementById('studyPlan').value = '';
  const status = document.getElementById('planStatus');
  if (status) { status.textContent = ''; status.className = 'plan-status'; }
  loadPlansForDate(); updateStats();
}

function loadPlansForDate() {
  const dateEl   = document.getElementById('studyDate');
  const list     = document.getElementById('planItemList');
  const empty    = document.getElementById('planItemEmpty');
  const textarea = document.getElementById('studyPlan');
  const status   = document.getElementById('planStatus');
  if (!dateEl || !list) return;

  const date = dateEl.value;
  const plan = getDatePlan(date);

  // Render items
  list.innerHTML = '';
  (plan.items || []).forEach(item => {
    const li = document.createElement('li');
    li.className = 'plan-item' + (item.done ? ' done' : '');
    const timeStr = item.time ? `<span class="plan-time">${item.time}</span>` : '';
    li.innerHTML = `
      <button class="check-btn ${item.done ? 'checked' : ''}" onclick="togglePlanItem('${date}', ${item.id})">${item.done ? '✓' : ''}</button>
      ${timeStr}
      ${subjectTag(item.subject)}
      <span class="item-text">${escapeHtml(item.text)}</span>
      <button class="delete-btn" onclick="deletePlanItem('${date}', ${item.id})" title="Delete">✕</button>`;
    list.appendChild(li);
  });

  if (empty) empty.style.display = plan.items.length === 0 ? 'block' : 'none';
  if (textarea) textarea.value = plan.notes || '';
  if (status) {
    status.textContent = plan.notes ? '📝 Notes saved' : '';
    status.className = plan.notes ? 'plan-status saved' : 'plan-status';
  }
}

// ── STATS ────────────────────────────────────────────────────
function updateStats() {
  const tasks    = getTasks();
  const habits   = getHabits();
  const plans    = getAllPlanData();
  const sessions = getSessionLog();
  const streak   = getStreakData();

  const el = id => document.getElementById(id);
  if (el('statTasks'))    el('statTasks').textContent    = `${tasks.filter(t=>t.done).length}/${tasks.length}`;
  if (el('statHabits'))   el('statHabits').textContent   = `${habits.filter(h=>h.done).length}/${habits.length}`;
  if (el('statPlans'))    el('statPlans').textContent    = Object.keys(plans).length;
  if (el('statSessions')) el('statSessions').textContent = sessions.length;
  if (el('currentStreak')) el('currentStreak').textContent = `${streak.current}🔥`;
  if (el('longestStreak')) el('longestStreak').textContent = streak.longest;
  if (el('streakCount'))   el('streakCount').textContent   = streak.current;
}

// ════════════════════════════════════════════════════════════
// ── FOCUS TIMER ──────────────────────────────────────────────
// ════════════════════════════════════════════════════════════
const TIMER_MODES = {
  pomodoro: { label: 'Focus',       seconds: 25 * 60 },
  short:    { label: 'Short Break', seconds:  5 * 60 },
  custom:   { label: 'Custom',      seconds: 10 * 60 },
};
let timerMode = 'pomodoro', timerTotal = 25*60, timerRemaining = 25*60;
let timerInterval = null, timerRunning = false;
const RING_CIRCUM = 603;

function initTimer() { timerRemaining = timerTotal; renderTimer(); }

function switchMode(mode) {
  timerStop(); timerMode = mode;
  const ci = document.getElementById('customInputs');
  if (ci) ci.style.display = mode === 'custom' ? 'flex' : 'none';
  ['pomodoro','short','custom'].forEach(m => {
    const tab = document.getElementById('tab' + m.charAt(0).toUpperCase() + m.slice(1));
    if (tab) tab.classList.toggle('active', m === mode);
  });
  timerTotal = TIMER_MODES[mode].seconds;
  timerRemaining = timerTotal;
  renderTimer();
}

function setCustomTimer() {
  const mins  = parseInt(document.getElementById('customMin').value) || 0;
  const secs  = parseInt(document.getElementById('customSec').value) || 0;
  const total = mins * 60 + secs;
  if (total <= 0) return alert('Please enter a valid duration.');
  timerStop();
  TIMER_MODES.custom.seconds = total;
  timerTotal = total; timerRemaining = total;
  renderTimer();
}

function toggleTimer()  { timerRunning ? timerPause() : timerStart(); }
function timerStart() {
  if (timerRemaining <= 0) timerRemaining = timerTotal;
  timerRunning = true;
  const btn = document.getElementById('timerPlayBtn');
  if (btn) { btn.textContent = '⏸'; btn.classList.add('running'); }
  timerInterval = setInterval(() => {
    timerRemaining--;
    renderTimer();
    if (timerRemaining <= 0) { timerStop(); onTimerEnd(); }
  }, 1000);
}
function timerPause() {
  timerRunning = false;
  clearInterval(timerInterval); timerInterval = null;
  const btn = document.getElementById('timerPlayBtn');
  if (btn) { btn.textContent = '▶'; btn.classList.remove('running'); }
}
function timerStop()  { timerPause(); }
function resetTimer() { timerStop(); timerRemaining = timerTotal; renderTimer(); }
function skipTimer()  { timerStop(); timerRemaining = 0; renderTimer(); onTimerEnd(); }

function renderTimer() {
  const m = String(Math.floor(timerRemaining / 60)).padStart(2,'0');
  const s = String(timerRemaining % 60).padStart(2,'0');
  const display = document.getElementById('timerDisplay');
  const label   = document.getElementById('timerLabel');
  const ring    = document.getElementById('timerRing');
  const wrap    = document.querySelector('.timer-display-wrap');
  if (display) display.textContent = `${m}:${s}`;
  if (label)   label.textContent   = TIMER_MODES[timerMode].label;
  if (ring) {
    const pct = timerRemaining / timerTotal;
    ring.style.strokeDashoffset = RING_CIRCUM * (1 - pct);
    ring.style.stroke = pct > 0.5 ? 'var(--accent)' : pct > 0.25 ? '#f97316' : 'var(--danger)';
  }
  if (wrap) wrap.classList.toggle('pulse', timerRemaining <= 10 && timerRunning);
}

function onTimerEnd() {
  playBeep();
  const topic = document.getElementById('sessionLabel')?.value.trim() || '';
  logSession(TIMER_MODES[timerMode].label, timerTotal, topic);
  awardXP(15, 'Focus Session');
  recordActivity();
  const display = document.getElementById('timerDisplay');
  if (display) { display.classList.add('flash'); setTimeout(() => display.classList.remove('flash'), 1200); }
  if (Notification.permission === 'granted') {
    new Notification('⏱️ FocusForge', { body: `${TIMER_MODES[timerMode].label} complete!${topic ? ' (' + topic + ')' : ''}` });
  } else if (Notification.permission !== 'denied') Notification.requestPermission();
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.30].forEach((delay, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = i === 2 ? 880 : 660;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.45);
    });
  } catch(e) {}
}

function getSessionLog()   { return JSON.parse(localStorage.getItem(getKey('sessions')) || '[]'); }
function saveSessionLog(s) { localStorage.setItem(getKey('sessions'), JSON.stringify(s)); }

function logSession(mode, seconds, topic) {
  const sessions = getSessionLog();
  const mins = Math.floor(seconds / 60), secs = seconds % 60;
  sessions.unshift({
    id: Date.now(), mode, duration: secs > 0 ? `${mins}m ${secs}s` : `${mins}m`,
    topic, time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
  });
  if (sessions.length > 50) sessions.pop();
  saveSessionLog(sessions); loadSessionLog(); updateStats();
}

function loadSessionLog() {
  const log   = document.getElementById('sessionLog');
  const empty = document.getElementById('sessionLogEmpty');
  if (!log) return;
  const sessions = getSessionLog();
  log.innerHTML = '';
  sessions.forEach(s => {
    const li = document.createElement('li');
    li.className = 'session-entry';
    li.innerHTML = `
      <span class="sess-mode">${s.mode}</span>
      <span class="sess-info">${s.topic ? escapeHtml(s.topic)+' · ' : ''}${s.duration}</span>
      <span class="sess-time">${s.time}</span>
      <button class="delete-btn" onclick="deleteSession(${s.id})" title="Remove">✕</button>`;
    log.appendChild(li);
  });
  if (empty) empty.style.display = sessions.length === 0 ? 'block' : 'none';
}

function deleteSession(id) { saveSessionLog(getSessionLog().filter(s=>s.id!==id)); loadSessionLog(); updateStats(); }
function clearSessionLog()  {
  if (!confirm('Clear all session history?')) return;
  saveSessionLog([]); loadSessionLog(); updateStats();
}