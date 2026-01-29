// ===== LOGIQUE DU PORTAIL ÉLÈVE =====
const supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);

let currentStudent = null;

document.addEventListener('DOMContentLoaded', async () => {
    const studentCode = sessionStorage.getItem('student_code');
    const studentId = sessionStorage.getItem('student_id');

    if (!studentCode || !studentId) {
        window.location.href = 'login.html';
        return;
    }

    await loadStudentData(studentId);
});

async function loadStudentData(studentId) {
    const { data: student, error } = await supabaseClient
        .from('academy_students')
        .select(`
            *,
            academy_registrations!inner (
                child_name,
                child_age,
                program_name,
                academies (
                    id,
                    name,
                    programs
                )
            )
        `)
        .eq('id', studentId)
        .single();

    if (error) {
        console.error('Erreur lors du chargement des données de l\'élève :', error);
        return;
    }

    currentStudent = student;
    const reg = student.academy_registrations;
    await loadInteractions(studentId);
    await loadSchedule(student.academy_id, reg.program_name);
    renderPortal();
}

let interactions = [];
let sessions = [];

async function loadInteractions(studentId) {
    const { data, error } = await supabaseClient
        .from('student_interactions')
        .select('*, coach:academy_coaches(name)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (!error) interactions = data || [];
}

async function loadSchedule(academyId, programName) {
    const { data, error } = await supabaseClient
        .from('academy_program_sessions')
        .select('*')
        .eq('academy_id', academyId)
        .eq('program_name', programName)
        .order('day_of_week')
        .order('start_time');

    if (!error) sessions = data || [];
}

function renderPortal() {
    const reg = currentStudent.academy_registrations;
    const academy = reg.academies;

    document.getElementById('studentName').textContent = reg.child_name;
    document.getElementById('welcomeMsg').textContent = `Bienvenue, ${reg.child_name} !`;
    document.getElementById('studentCode').textContent = `Code : ${currentStudent.student_code}`;

    if (currentStudent.photo_url) {
        const img = document.getElementById('profilePhoto');
        img.src = currentStudent.photo_url;
        img.classList.remove('hidden');
        document.getElementById('profilePlaceholder').classList.add('hidden');
    } else {
        document.getElementById('profilePlaceholder').textContent = reg.child_name[0];
    }

    // Infos Programme
    document.getElementById('programName').textContent = `Programme : ${reg.program_name}`;

    renderBadges();
    renderInteractions();
    renderSessionList();
}

function renderBadges() {
    const grid = document.getElementById('badgeGrid');
    if (!grid) return;

    const uniqueBadges = [...new Set(interactions.map(i => i.badge).filter(b => b))];

    const badgeIcons = {
        'Expert Technique': { icon: 'sports_soccer', color: 'text-primary' },
        'Leader d\'Équipe': { icon: 'groups', color: 'text-blue-500' },
        'Esprit Sportif': { icon: 'handshake', color: 'text-orange-500' },
        'Guerrier': { icon: 'bolt', color: 'text-red-500' }
    };

    grid.innerHTML = uniqueBadges.map(b => {
        const meta = badgeIcons[b] || { icon: 'workspace_premium', color: 'text-primary' };
        return `
            <div class="badge earned group relative cursor-help">
                <span class="material-symbols-outlined text-2xl ${meta.color}">${meta.icon}</span>
                <div class="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-background-dark px-2 py-1 rounded text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                    ${b}
                </div>
            </div>
        `;
    }).join('') + Array(Math.max(0, 8 - uniqueBadges.length)).fill('<div class="badge"><span class="material-symbols-outlined text-2xl">lock</span></div>').join('');
}

function renderInteractions() {
    const container = document.getElementById('coachNotesContainer');
    if (!container) return;

    if (interactions.length === 0) {
        container.innerHTML = `
            <div class="p-4 bg-background-dark rounded-2xl border border-white/5 italic text-slate-500 text-sm">
                Pas encore de commentaires pour le moment.
            </div>
        `;
        return;
    }

    container.innerHTML = interactions.map(i => `
        <div class="space-y-3">
            <div class="p-4 bg-background-dark rounded-2xl border border-white/5 italic text-slate-300 text-sm leading-relaxed relative group">
                "${i.feedback}"
                ${i.badge ? `<span class="absolute -top-2 -right-2 bg-primary text-background-dark text-[8px] font-black px-2 py-1 rounded-full shadow-lg border border-background-dark uppercase">${i.badge}</span>` : ''}
            </div>
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                    <span class="material-symbols-outlined text-xs text-slate-500">person</span>
                </div>
                <p class="text-[10px] text-slate-500 font-bold uppercase">Coach ${i.coach?.name || 'Inconnu'} • ${new Date(i.created_at).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('<div class="h-[1px] bg-white/5 my-4"></div>');
}

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function renderSessionList() {
    const list = document.getElementById('scheduleList');
    if (!list) return;

    if (sessions.length === 0) {
        list.innerHTML = '<p class="text-slate-500 text-xs italic">Aucune session programmée pour ce programme.</p>';
        return;
    }

    list.innerHTML = sessions.map(s => `
        <div class="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all">
            <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">calendar_today</span>
            </div>
            <div>
                <p class="text-xs font-black uppercase text-white">${DAYS_FR[s.day_of_week]} • ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}</p>
                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Entraînement ${s.program_name}</p>
            </div>
        </div>
    `).join('');
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}
