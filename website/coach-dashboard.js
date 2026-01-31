// ===== COACH DASHBOARD LOGIC =====
let supabaseClient;
let currentCoach = null;
let currentAcademy = null;
let coachSessions = [];
let coachStudents = [];
let currentTab = 'overview';

// Configuration Supabase
const SUPABASE_URL = 'https://dgpdlwklqvbmdtalyiis.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA';

function initSupabase() {
    try {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.error('Supabase library not found!');
            return;
        }
        initDashboard();
    } catch (err) {
        console.error('Initialization error:', err);
    }
}

async function initDashboard() {
    const token = sessionStorage.getItem('owner_token'); // We reuse the same token key for simplicity
    const role = sessionStorage.getItem('userRole');

    if (!token || role !== 'coach') {
        window.location.href = 'login.html';
        return;
    }

    // Load Coach Profile
    const { data: profile, error: pError } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('portal_token', token)
        .single();

    if (pError || !profile) {
        logout();
        return;
    }

    // Get the Coach details from academy_coaches
    const { data: coachData, error: cError } = await supabaseClient
        .from('academy_coaches')
        .select('*, academy:academies(*)')
        .eq('email', profile.email)
        .single();

    if (cError || !coachData) {
        alert('Erreur: Détails du coach non trouvés.');
        return;
    }

    currentCoach = coachData;
    currentAcademy = coachData.academy;

    updateUIHeader();
    await loadInitialData();
}

function updateUIHeader() {
    document.getElementById('userName').textContent = currentCoach.name;
    document.getElementById('userInitial').textContent = currentCoach.name[0];
    document.getElementById('academyNameDisplay').textContent = currentAcademy?.name || 'Académie Inconnue';
}

async function loadInitialData() {
    await loadSessions();
    await loadStudents();
    await updateStats();
    renderAll();
}

async function loadSessions() {
    const { data, error } = await supabaseClient
        .from('academy_program_sessions')
        .select('*')
        .eq('coach_id', currentCoach.id)
        .order('day_of_week')
        .order('start_time');

    if (error) console.error('Error loading sessions:', error);
    coachSessions = data || [];
}

async function loadStudents() {
    if (!currentAcademy) return;

    // In a real app, we would only fetch students assigned to the coach's programs.
    // For now, let's fetch all students of the academy.
    const { data, error } = await supabaseClient
        .from('academy_students')
        .select(`
            *,
            registration:academy_registrations!inner(*)
        `)
        .eq('academy_id', currentAcademy.id);

    if (error) console.error('Error loading students:', error);
    coachStudents = data || [];
}

async function updateStats() {
    const today = new Date().getDay(); // 0-6
    const sessionsToday = coachSessions.filter(s => s.day_of_week === today).length;
    document.getElementById('todaySessionsCount').textContent = sessionsToday;
    document.getElementById('totalStudentsCount').textContent = coachStudents.length;

    const { count } = await supabaseClient
        .from('student_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', currentCoach.id);

    document.getElementById('badgesCount').textContent = count || 0;
}

function renderAll() {
    renderNextSessions();
    renderFullSchedule();
    renderStudents();
}

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function renderNextSessions() {
    const grid = document.getElementById('nextSessionsGrid');
    if (!grid) return;

    if (coachSessions.length === 0) {
        grid.innerHTML = '<p class="text-slate-500 italic">Aucune session assignée.</p>';
        return;
    }

    grid.innerHTML = coachSessions.slice(0, 4).map(s => `
        <div class="bg-card p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary">schedule</span>
                </div>
                <div>
                    <h4 class="text-white font-bold">${s.program_name}</h4>
                    <p class="text-xs text-slate-500">${DAYS_FR[s.day_of_week]} • ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}</p>
                </div>
            </div>
            <span class="material-symbols-outlined text-slate-700 group-hover:text-primary transition-colors">arrow_forward</span>
        </div>
    `).join('');
}

function renderFullSchedule() {
    const container = document.getElementById('fullScheduleGrid');
    if (!container) return;

    const grouped = coachSessions.reduce((acc, s) => {
        acc[s.day_of_week] = acc[s.day_of_week] || [];
        acc[s.day_of_week].push(s);
        return acc;
    }, {});

    container.innerHTML = Object.keys(grouped).sort().map(day => `
        <div class="space-y-4">
            <h4 class="text-primary font-black uppercase text-[10px] tracking-widest">${DAYS_FR[day]}</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${grouped[day].map(s => `
                    <div class="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                            <p class="text-white font-bold">${s.program_name}</p>
                            <p class="text-xs text-slate-500">${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}</p>
                        </div>
                        <span class="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase">Confirmé</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function renderStudents(filtered = coachStudents) {
    const grid = document.getElementById('studentsGrid');
    if (!grid) return;

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-20 text-center glass-morphism rounded-3xl border border-dashed border-slate-700"><p class="text-slate-500">Aucun élève trouvé.</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(s => `
        <div class="magic-card bg-card p-6 rounded-[2rem] border border-white/5 group relative overflow-hidden">
            <div class="flex flex-col items-center text-center space-y-4">
                <div class="w-20 h-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary text-2xl font-black">
                    ${s.registration.child_name[0]}
                </div>
                <div>
                    <h4 class="text-white font-bold text-lg">${s.registration.child_name}</h4>
                    <p class="text-xs text-slate-500 uppercase font-black tracking-widest">${s.registration.program_name}</p>
                </div>
                <button onclick="openInteractionModal('${s.id}', '${s.registration.child_name}')"
                    class="w-full mt-2 py-3 bg-white/5 hover:bg-primary hover:text-background-dark rounded-xl text-xs font-black uppercase transition-all">
                    Évaluer l'élève
                </button>
            </div>
        </div>
    `).join('');

    // Re-attach magic card
    document.querySelectorAll('#studentsGrid .magic-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

function openInteractionModal(id, name) {
    document.getElementById('modalStudentId').value = id;
    document.getElementById('modalStudentName').textContent = name;
    document.getElementById('interactionForm').reset();
    document.getElementById('interactionModal').classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function switchTab(tab) {
    currentTab = tab;
    ['overview', 'schedule', 'students'].forEach(t => {
        document.getElementById(`${t}TabBtn`).classList.toggle('active', t === tab);
        document.getElementById(`${t}View`).classList.toggle('hidden', t !== tab);

        const btn = document.getElementById(`${t}TabBtn`);
        if (t === tab) {
            btn.classList.add('bg-primary', 'text-background', 'shadow-lg');
            btn.classList.remove('text-slate-500');
        } else {
            btn.classList.remove('bg-primary', 'text-background', 'shadow-lg');
            btn.classList.add('text-slate-500');
        }
    });

    const titles = {
        'overview': 'Vue d\'ensemble',
        'schedule': 'Mon Planning',
        'students': 'Mes Élèves'
    };
    document.getElementById('headerTitle').textContent = titles[tab];
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Event Listeners
document.getElementById('studentSearch')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = coachStudents.filter(s => s.registration.child_name.toLowerCase().includes(q));
    renderStudents(filtered);
});

document.getElementById('interactionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('modalStudentId').value;
    const feedback = document.getElementById('coachFeedback').value;
    const badge = document.querySelector('input[name="badge"]:checked')?.value;

    try {
        const { error } = await supabaseClient
            .from('student_interactions')
            .insert([{
                student_id: studentId,
                coach_id: currentCoach.id,
                badge: badge || null,
                feedback: feedback
            }]);

        if (error) throw error;

        alert('Évaluation enregistrée avec succès !');
        closeModal('interactionModal');
        await updateStats();
    } catch (err) {
        alert('Erreur: ' + err.message);
    }
});

// Initialization
document.addEventListener('DOMContentLoaded', initSupabase);
window.switchTab = switchTab;
window.openInteractionModal = openInteractionModal;
window.closeModal = closeModal;
window.logout = logout;
