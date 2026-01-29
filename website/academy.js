// ===== ACADEMY MANAGEMENT LOGIC =====
let currentComplex = null;
let currentAcademy = null;
let currentTab = 'programs';
let coaches = [];
let sessions = [];
let currentScheduleView = 'list';
let fullCalendar = null;
let showArchived = false;
let allStudents = [];

// Initialiser Supabase avec fallback pour InfinityFree
let supabaseClient;
const SUPABASE_FALLBACK_URL = 'https://dgpdlwklqvbmdtalyiis.supabase.co';
const SUPABASE_FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA';

// Extremely robust fallback check
const getAppConfig = () => {
    if (typeof window.config !== 'undefined') return window.config;
    if (typeof config !== 'undefined') return config;
    return {
        supabaseUrl: SUPABASE_FALLBACK_URL,
        supabaseKey: SUPABASE_FALLBACK_KEY
    };
};

function initSupabase() {
    const SAFE_CONFIG = getAppConfig();
    try {
        const sUrl = SAFE_CONFIG.supabaseUrl || SUPABASE_FALLBACK_URL;
        const sKey = SAFE_CONFIG.supabaseKey || SUPABASE_FALLBACK_KEY;

        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(sUrl, sKey);
        } else if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseClient = supabase.createClient(sUrl, sKey);
        } else {
            console.error('Bibliothèque Supabase non trouvée !');
        }
    } catch (err) {
        console.error('Erreur lors de l\'initialisation de Supabase :', err);
    }
}

initSupabase();

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadComplexes();
    setupEventListeners();
    setupGlobalListeners();
});

async function checkAuth() {
    const userRole = sessionStorage.getItem('userRole');
    const userEmail = sessionStorage.getItem('userEmail');

    if (!userRole || !userEmail) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userName').textContent = userEmail.split('@')[0];
}

async function loadComplexes() {
    const ownerId = sessionStorage.getItem('owner_id');
    if (!ownerId) {
        console.error('Owner ID not found in session storage');
        return;
    }

    const { data: complexes, error } = await supabaseClient
        .from('complexes')
        .select('*')
        .eq('owner_id', ownerId);

    if (error) {
        console.error('Error loading complexes:', error);
        return;
    }

    const select = document.getElementById('complexSelect');
    select.innerHTML = '';

    if (complexes && complexes.length > 0) {
        complexes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });

        currentComplex = complexes[0];
        await loadAcademyData(currentComplex.id);
    } else {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Aucun complexe trouvé';
        select.appendChild(opt);
        renderAcademyUI();
    }
}

async function loadAcademyData(complexId) {
    const { data: academy, error } = await supabaseClient
        .from('academies')
        .select('*')
        .eq('complex_id', complexId)
        .maybeSingle();

    if (error && error.code !== 'PGRST116') {
        console.error('Error loading academy:', error);
        return;
    }

    currentAcademy = academy;
    if (currentAcademy) {
        await loadSchedule(); // Fetch sessions before rendering UI
    }
    renderAcademyUI();
}

function renderAcademyUI() {
    const academyInfo = document.getElementById('academyInfo');
    const academyEmpty = document.getElementById('academyEmpty');
    const createBtn = document.getElementById('createAcademyBtn');
    const addProgBtn = document.getElementById('addProgramBtn');

    if (currentAcademy) {
        academyInfo.classList.remove('hidden');
        academyEmpty.classList.add('hidden');
        createBtn.classList.add('hidden');
        addProgBtn.classList.remove('hidden');

        document.getElementById('academyNameDisplay').textContent = currentAcademy.name;
        document.getElementById('academyDescDisplay').textContent = currentAcademy.description || 'Aucune description fournie.';

        // Show Logo
        const logoDisplay = document.getElementById('academyLogoDisplay');
        if (currentAcademy.logo_url) {
            logoDisplay.innerHTML = `<img src="${currentAcademy.logo_url}" class="w-full h-full object-cover">`;
        } else {
            logoDisplay.innerHTML = `<span class="material-symbols-outlined text-4xl text-slate-800">school</span>`;
        }

        renderPrograms();
        updateStats();
        loadRequests();
        loadStudents();
    } else {
        academyInfo.classList.add('hidden');
        academyEmpty.classList.remove('hidden');
        createBtn.classList.remove('hidden');
        addProgBtn.classList.add('hidden');
    }
}

async function deleteCoach(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce coach ?')) return;
    const { error } = await supabaseClient.from('academy_coaches').delete().eq('id', id);
    if (!error) loadCoaches();
}

function editCoach(id) {
    openCoachModal(id);
}

async function deleteSession(id) {
    if (!confirm('Supprimer cette session ?')) return;
    const { error } = await supabaseClient.from('academy_program_sessions').delete().eq('id', id);
    if (!error) loadSchedule();
}

function editSession(id) {
    openSessionModal(id);
}

function formatProgramSchedule(programName) {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const programSessions = sessions.filter(s => s.program_name === programName && s.is_recurring !== false);

    if (programSessions.length === 0) return 'Aucun horaire défini';

    // Group by time
    const timeGroups = {};
    programSessions.forEach(s => {
        const time = s.start_time.substring(0, 5);
        if (!timeGroups[time]) timeGroups[time] = [];
        timeGroups[time].push(days[s.day_of_week]);
    });

    const results = Object.entries(timeGroups).map(([time, dayList]) => {
        return `${dayList.join(' & ')} ${time}`;
    });

    return results.join(' | ');
}

async function renderPrograms() {
    const grid = document.getElementById('programsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (coaches.length === 0) await loadCoaches();

    (currentAcademy.programs || []).forEach((p, index) => {
        const assignedCoach = coaches.find(c => c.id === p.coach_id);
        const dynamicSchedule = formatProgramSchedule(p.name);

        const card = document.createElement('div');
        card.className = 'magic-card bg-card-dark p-8 rounded-[2.5rem] border border-white/5 group relative overflow-hidden';
        card.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <div class="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-3xl">sports_soccer</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editProgram(${index})" class="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
                            <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onclick="deleteProgram(${index})" class="p-2 hover:bg-red-500/5 rounded-lg text-slate-500 hover:text-red-500 transition-all">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </div>
                </div>
                <div>
                    <h4 class="text-xl font-display font-bold text-white mb-2">${p.name}</h4>
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">${p.ageGroup} Ans</p>
                </div>

                ${assignedCoach ? `
                <div class="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div class="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                        ${assignedCoach.avatar_url ? `<img src="${assignedCoach.avatar_url}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-xs flex items-center justify-center h-full text-slate-500">person</span>`}
                    </div>
                    <div>
                        <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest">Coach</p>
                        <p class="text-xs font-bold text-white">${assignedCoach.name}</p>
                    </div>
                </div>
                ` : ''}

                <div class="flex items-center gap-3 text-slate-400 text-xs font-medium">
                    <span class="material-symbols-outlined text-sm text-primary">schedule</span>
                    ${dynamicSchedule}
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-white/5">
                    <span class="text-lg font-display font-bold text-white">${p.price} <span class="text-[10px] text-slate-500 font-normal uppercase">TND/Mois</span></span>
                    <span class="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-wider">Actif</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openAcademyProfileModal() {
    const modal = document.getElementById('academyProfileModal');
    modal.classList.remove('hidden');

    if (currentAcademy) {
        document.getElementById('profileNameInput').value = currentAcademy.name;
        document.getElementById('profileDescInput').value = currentAcademy.description || '';
        if (currentAcademy.logo_url) {
            const preview = document.getElementById('logoPreview');
            preview.src = currentAcademy.logo_url;
            preview.classList.remove('hidden');
        }
    } else {
        document.getElementById('profileNameInput').value = '';
        document.getElementById('profileDescInput').value = '';
        document.getElementById('logoPreview').classList.add('hidden');
    }
}

async function openProgramModal(isEdit = false, index = null) {
    const modal = document.getElementById('programModal');
    modal.classList.remove('hidden');

    const title = document.getElementById('programModalTitle');
    const form = document.getElementById('programForm');
    form.reset();
    document.getElementById('editProgramIndex').value = isEdit ? index : '';

    if (isEdit) {
        title.textContent = 'Modifier le Programme';
        const p = currentAcademy.programs[index];
        document.getElementById('pNameInput').value = p.name;
        document.getElementById('pAgeInput').value = p.ageGroup;
        document.getElementById('pScheduleInput').value = p.schedule;
        document.getElementById('pPriceInput').value = p.price;

        // Load coaches and set value
        await loadCoachesForSelect(p.coach_id);
    } else {
        title.textContent = 'Ajouter un Programme';
        await loadCoachesForSelect();
    }
}

async function loadCoachesForSelect(selectedId = null) {
    const select = document.getElementById('pCoachSelect');
    if (!select) return;

    if (coaches.length === 0) await loadCoaches();

    select.innerHTML = '<option value="">Sélectionner un Coach</option>';
    coaches.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        if (selectedId === c.id) opt.selected = true;
        select.appendChild(opt);
    });
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function setupEventListeners() {
    // Complex Change
    document.getElementById('complexSelect').addEventListener('change', async (e) => {
        const complexId = e.target.value;
        if (complexId) {
            currentComplex = (await supabaseClient.from('complexes').select('*').eq('id', complexId).single()).data;
            await loadAcademyData(complexId);
        }
    });

    // Edit Student Form
    document.getElementById('editStudentForm').addEventListener('submit', saveStudentEdit);

    // Logo Upload Area
    document.getElementById('logoUploadArea').addEventListener('click', () => {
        document.getElementById('logoInput').click();
    });

    // Coach Avatar Upload Area
    document.getElementById('coachAvatarUploadArea').addEventListener('click', () => {
        document.getElementById('coachAvatarInput').click();
    });

    document.getElementById('coachAvatarInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.getElementById('coachAvatarPreview');
                img.src = event.target.result;
                img.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // Coach Form
    document.getElementById('coachForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Enregistrement...';

        const coachId = document.getElementById('editCoachId').value;
        const name = document.getElementById('coachNameInput').value;
        const email = document.getElementById('coachEmailInput').value;
        const phone = document.getElementById('coachPhoneInput').value;
        const specialtiesInput = document.getElementById('coachSpecialtiesInput').value;
        const specialties = specialtiesInput ? specialtiesInput.split(',').map(s => s.trim()).filter(s => s) : [];
        const bio = document.getElementById('coachBioInput').value;
        const avatarFile = document.getElementById('coachAvatarInput').files[0];

        try {
            let avatar_url = null;
            if (coachId) {
                const existing = coaches.find(c => c.id === coachId);
                avatar_url = existing?.avatar_url || null;
            }

            if (avatarFile) {
                avatar_url = await uploadToImageKit(avatarFile);
            }

            const coachData = {
                name,
                email,
                phone,
                specialties,
                bio,
                avatar_url,
                updated_at: new Date()
            };

            if (coachId) {
                const { error } = await supabaseClient
                    .from('academy_coaches')
                    .update(coachData)
                    .eq('id', coachId);
                if (error) throw error;
            } else {
                const tempToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

                const { error } = await supabaseClient
                    .from('academy_coaches')
                    .insert([{
                        ...coachData,
                        academy_id: currentAcademy.id,
                        portal_token: tempToken
                    }]);
                if (error) throw error;

                // Create or update user profile for coach login
                await supabaseClient.from('user_profiles').upsert([{
                    email,
                    name,
                    phone,
                    role: 'coach',
                    portal_token: tempToken,
                    avatar: avatar_url
                }], { onConflict: 'email' });
            }
            closeModal('coachModal');
            loadCoaches();
        } catch (err) {
            alert('Erreur: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Enregistrer Coach';
        }
    });

    // Session Recurrence Toggle
    document.getElementById('sessionRecurringCheck').addEventListener('change', (e) => {
        const isRecurring = e.target.checked;
        document.getElementById('sessionSlotsContainer').classList.toggle('hidden', !isRecurring);
        document.getElementById('addSlotBtnContainer').classList.toggle('hidden', !isRecurring);
        document.getElementById('dateSelectGroup').classList.toggle('hidden', isRecurring);
    });

    // Student search
    const searchInput = document.getElementById('studentSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyAdvancedFilters();
        });
    }

    // Session Form
    document.getElementById('sessionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const sessionId = document.getElementById('editSessionId').value;
        const program_name = document.getElementById('sessionProgramSelect').value;
        const coach_id = document.getElementById('sessionCoachSelect').value;
        const is_recurring = document.getElementById('sessionRecurringCheck').checked;
        const specific_date = !is_recurring ? document.getElementById('sessionDateInput').value : null;

        const sessionsToInsert = [];
        const slotRows = document.querySelectorAll('.slot-row');

        if (is_recurring) {
            slotRows.forEach(row => {
                const day = parseInt(row.querySelector('[name="slotDay"]').value);
                const start = row.querySelector('[name="slotStart"]').value;
                const end = row.querySelector('[name="slotEnd"]').value;

                if (start && end) {
                    sessionsToInsert.push({
                        academy_id: currentAcademy.id,
                        program_name,
                        coach_id,
                        is_recurring: true,
                        day_of_week: day,
                        specific_date: null,
                        start_time: start,
                        end_time: end,
                        updated_at: new Date()
                    });
                }
            });

            if (sessionsToInsert.length === 0) {
                alert('Veuillez ajouter au moins un créneau avec des horaires valides.');
                return;
            }
        } else {
            // Non-recurring: use specific date and first slot's time
            const firstSlot = slotRows[0];
            const start = firstSlot?.querySelector('[name="slotStart"]').value;
            const end = firstSlot?.querySelector('[name="slotEnd"]').value;

            if (!specific_date || !start || !end) {
                alert('Veuillez renseigner la date et les horaires.');
                return;
            }

            sessionsToInsert.push({
                academy_id: currentAcademy.id,
                program_name,
                coach_id,
                is_recurring: false,
                day_of_week: null,
                specific_date,
                start_time: start,
                end_time: end,
                updated_at: new Date()
            });
        }

        const btn = e.submitter;
        if (btn) btn.disabled = true;

        try {
            if (sessionId) {
                // Edit existing session
                // 1. Update the original session with the first slot data
                const { error: updateError } = await supabaseClient
                    .from('academy_program_sessions')
                    .update(sessionsToInsert[0])
                    .eq('id', sessionId);
                if (updateError) throw updateError;

                // 2. If there are additional slots, insert them as new records
                if (sessionsToInsert.length > 1) {
                    const extraSessions = sessionsToInsert.slice(1);
                    const { error: insertError } = await supabaseClient
                        .from('academy_program_sessions')
                        .insert(extraSessions);
                    if (insertError) throw insertError;
                }
            } else {
                // Create potentially multiple sessions
                const { error } = await supabaseClient
                    .from('academy_program_sessions')
                    .insert(sessionsToInsert);
                if (error) throw error;
            }

            closeModal('sessionModal');
            await loadSchedule();
            // No alert needed if it works, UI update is enough, 
            // but let's add one to be sure the user knows it saved.
        } catch (err) {
            console.error('Session save error:', err);
            alert('Erreur lors de l\'enregistrement: ' + (err.message || err));
        } finally {
            if (btn) btn.disabled = false;
        }
    });

    document.getElementById('logoInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.getElementById('logoPreview');
                img.src = event.target.result;
                img.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // Save Academy Profile
    document.getElementById('academyProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Enregistrement...';

        const name = document.getElementById('profileNameInput').value;
        const description = document.getElementById('profileDescInput').value;
        const logoFile = document.getElementById('logoInput').files[0];

        try {
            let logo_url = currentAcademy?.logo_url || null;
            if (logoFile) {
                logo_url = await uploadToImageKit(logoFile);
            }

            const academyData = {
                name,
                description,
                logo_url,
                complex_id: currentComplex.id,
                updated_at: new Date().toISOString()
            };

            let result;
            if (currentAcademy) {
                result = await supabaseClient.from('academies').update(academyData).eq('id', currentAcademy.id).select();
            } else {
                result = await supabaseClient.from('academies').insert([academyData]).select();
            }

            if (result.error) throw result.error;

            if (result.data && result.data.length > 0) {
                currentAcademy = result.data[0];
            }

            renderAcademyUI();
            // Populate filters
            const filterProg = document.getElementById('filterProgram');
            if (filterProg) {
                filterProg.innerHTML = '<option value="">Tous les programmes</option>' +
                    (currentAcademy.programs || []).map(p => `<option value="${p.name}">${p.name}</option>`).join('');
            }

            closeModal('academyProfileModal');
            alert('Profil mis à jour avec succès !');
        } catch (err) {
            console.error('Save Error:', err);
            alert('Erreur lors de l\'enregistrement : ' + (err.message || 'Erreur inconnue'));
        } finally {
            btn.disabled = false;
            btn.textContent = 'Enregistrer le Profil';
        }
    });

    // Save Program
    document.getElementById('programForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const index = document.getElementById('editProgramIndex').value;
        const name = document.getElementById('pNameInput').value;
        const ageGroup = document.getElementById('pAgeInput').value;
        const schedule = document.getElementById('pScheduleInput').value;
        const price = document.getElementById('pPriceInput').value;
        const coachId = document.getElementById('pCoachSelect').value;

        const newProgram = {
            name,
            ageGroup,
            schedule,
            price,
            coach_id: coachId || null
        };

        let programs = [...(currentAcademy.programs || [])];
        if (index !== '') {
            programs[index] = newProgram;
        } else {
            programs.push(newProgram);
        }

        const { error } = await supabaseClient
            .from('academies')
            .update({ programs, updated_at: new Date().toISOString() })
            .eq('id', currentAcademy.id);

        if (error) {
            alert('Erreur : ' + error.message);
        } else {
            closeModal('programModal');
            await loadAcademyData(currentComplex.id);
        }
    });

    // Header Buttons
    document.getElementById('createAcademyBtn').addEventListener('click', () => openAcademyProfileModal());
    document.getElementById('addProgramBtn').addEventListener('click', () => openProgramModal());

    // Confirm Student
    document.getElementById('confirmStudentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const regId = document.getElementById('regIdInput').value;
        const program = document.getElementById('assignProgram').value;
        const kitSize = document.getElementById('kitSize').value;
        const photoFile = document.getElementById('childPhotoInput').files[0];

        const studentCode = 'ST-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        try {
            let photo_url = null;
            if (photoFile) photo_url = await uploadToImageKit(photoFile);

            await supabaseClient.from('academy_registrations').update({ status: 'confirmed' }).eq('id', regId);
            await supabaseClient.from('academy_students').insert({
                registration_id: regId,
                student_code: studentCode,
                photo_url,
                additional_details: { program, kitSize }
            });

            alert('Élève confirmé ! Code : ' + studentCode);
            closeModal('confirmStudentModal');
            await loadRequests();
            await loadStudents();
        } catch (err) {
            alert('Erreur : ' + err.message);
        }
    });

    document.getElementById('childPhotoPreview').addEventListener('click', () => document.getElementById('childPhotoInput').click());
    document.getElementById('childPhotoInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = document.getElementById('previewImg');
                img.src = ev.target.result;
                img.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    // Payment Form
    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('paymentStudentId').value;
        const expiryDate = document.getElementById('paymentExpiryInput').value;

        try {
            const { error } = await supabaseClient
                .from('academy_students')
                .update({ payment_expiration_date: expiryDate })
                .eq('id', studentId);

            if (error) throw error;

            closeModal('paymentModal');
            await loadStudents();
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    });
}

function setupGlobalListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            sessionStorage.clear();
            window.location.href = 'login.html';
        };
    }
}

function editProgram(index) {
    openProgramModal(true, index);
}

async function deleteProgram(index) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) return;

    let programs = [...currentAcademy.programs];
    programs.splice(index, 1);

    const { error } = await supabaseClient
        .from('academies')
        .update({ programs, updated_at: new Date() })
        .eq('id', currentAcademy.id);

    if (error) {
        alert('Erreur : ' + error.message);
    } else {
        await loadAcademyData(currentComplex.id);
    }
}

async function uploadToImageKit(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('publicKey', IMAGEKIT_CONFIG.PUBLIC_KEY);

    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(IMAGEKIT_CONFIG.PRIVATE_KEY + ':')
        },
        body: formData
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'ImageKit upload failed with status ' + response.status);
    }

    const data = await response.json();
    if (data.url) return data.url;
    throw new Error(data.message || 'Échec du téléchargement');
}

async function updateStats() {
    try {
        // Step 1: Get all registration IDs for this academy
        const { data: regs, error: regsError } = await supabaseClient
            .from('academy_registrations')
            .select('id')
            .eq('academy_id', currentAcademy.id);

        if (regsError) throw regsError;

        if (!regs || regs.length === 0) {
            document.getElementById('totalStudentsCount').textContent = '0';
        } else {
            // Step 2: Count students in those registrations
            const regIds = regs.map(r => r.id);
            const { count, error: countError } = await supabaseClient
                .from('academy_students')
                .select('*', { count: 'exact', head: true })
                .in('registration_id', regIds);

            if (countError) throw countError;
            document.getElementById('totalStudentsCount').textContent = count || '0';
        }

        document.getElementById('activeProgramsCount').textContent = (currentAcademy.programs?.length || 0).toString();
    } catch (err) {
        console.error('Stats update failed:', err);
    }
}

async function loadRequests() {
    if (!supabaseClient) initSupabase();
    if (!supabaseClient) return;

    const { data: requests } = await supabaseClient.from('academy_registrations')
        .select('*, user_profiles(name)')
        .eq('academy_id', currentAcademy.id)
        .eq('status', 'pending');

    const list = document.getElementById('requestsList');
    list.innerHTML = '';

    const badge = document.getElementById('requestsBadge');
    if (requests?.length > 0) {
        badge.textContent = requests.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    requests?.forEach(reg => {
        const row = document.createElement('tr');
        row.className = 'group hover:bg-white/5 transition-all';
        row.innerHTML = `
            <td class="px-6 py-4">
                <p class="text-sm font-bold text-white">${reg.child_name}</p>
                <p class="text-[10px] text-slate-500">${reg.child_age} ans</p>
            </td>
            <td class="px-6 py-4">
                <p class="text-sm font-bold text-slate-200">${reg.parent_name || reg.user_profiles?.name || 'N/A'}</p>
            </td>
            <td class="px-6 py-4">
                <a href="tel:${reg.parent_phone}" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">call</span>
                    ${reg.parent_phone || 'N/A'}
                </a>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase text-slate-400">
                    ${reg.selected_program || 'N/A'}
                </span>
            </td>
            <td class="px-6 py-4 text-[11px] text-slate-500 font-bold">
                ${new Date(reg.created_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="openConfirmModal('${reg.id}', '${reg.child_name}')" 
                    class="bg-primary text-background-dark px-4 py-2 rounded-xl text-xs font-black hover:scale-105 transition-all">
                    Confirmer
                </button>
            </td>
        `;
        list.appendChild(row);
    });
}

async function loadStudents() {
    const { data: students, error } = await supabaseClient.from('academy_students')
        .select(`
            *,
            academy_registrations!inner(
                academy_id, 
                child_name, 
                child_age, 
                parent_name,
                parent_phone,
                selected_program,
                user_profiles(name)
            )
        `)
        .eq('academy_registrations.academy_id', currentAcademy.id)
        .eq('is_archived', showArchived);

    if (error) {
        console.error('Error loading students:', error);
        return;
    }

    allStudents = students || [];
    renderStudents(allStudents);
}

function renderStudents(students) {
    const tbody = document.getElementById('studentsTableBody');
    const countSpan = document.getElementById('studentCount');
    if (!tbody) return;

    tbody.innerHTML = '';
    countSpan.textContent = `${students?.length || 0} Élèves ${showArchived ? '(Archivés)' : ''}`;

    if (!students || students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-500 italic">
                    ${showArchived ? 'Aucun élève archivé.' : 'Aucun élève enregistré.'}
                </td>
            </tr>
        `;
        return;
    }

    students.forEach(s => {
        const reg = s.academy_registrations;
        const expiryDate = s.payment_expiration_date ? new Date(s.payment_expiration_date) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let statusHtml = '';
        if (!expiryDate) {
            statusHtml = `<span class="px-2 py-1 bg-slate-500/10 text-slate-500 text-[9px] font-black rounded-lg border border-slate-500/20 uppercase">Non Défini</span>`;
        } else if (expiryDate < today) {
            statusHtml = `<span class="px-2 py-1 bg-red-500/10 text-red-500 text-[9px] font-black rounded-lg border border-red-500/20 uppercase">Expiré</span>`;
        } else {
            const diffTime = Math.abs(expiryDate - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
                statusHtml = `<span class="px-2 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black rounded-lg border border-amber-500/20 uppercase">Expire sous ${diffDays}j</span>`;
            } else {
                statusHtml = `<span class="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-lg border border-primary/20 uppercase">Actif</span>`;
            }
        }

        const row = document.createElement('tr');
        row.className = 'group hover:bg-white/5 transition-all';
        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-900 overflow-hidden border border-white/5 flex-shrink-0">
                        ${s.photo_url ? `<img src="${s.photo_url}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-slate-700 font-black text-xl">${reg.child_name[0]}</div>`}
                    </div>
                    <div>
                        <p class="text-sm font-bold text-white">${reg.child_name}</p>
                        <p class="text-[10px] text-slate-500">${reg.child_age} ans</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <p class="text-sm font-bold text-slate-300">${reg.parent_name || 'N/A'}</p>
                <a href="tel:${reg.parent_phone}" class="text-[11px] text-primary hover:underline font-bold">${reg.parent_phone || 'N/A'}</a>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase text-slate-400">
                    ${s.additional_details?.program || reg.selected_program || 'N/A'}
                </span>
            </td>
            <td class="px-6 py-4">
                <code class="px-2 py-1 bg-background-dark/50 rounded text-xs font-mono text-slate-500">${s.student_code}</code>
            </td>
            <td class="px-6 py-4">
                <div class="flex flex-col gap-1">
                    ${statusHtml}
                    ${expiryDate ? `<p class="text-[9px] text-slate-600 font-bold uppercase">Jusqu'au ${expiryDate.toLocaleDateString()}</p>` : ''}
                </div>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${!showArchived ? `
                        <button onclick="openEditStudentModal('${s.id}')" 
                            class="p-2 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all"
                            title="Modifier les informations">
                            <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onclick="openPaymentModal('${s.id}', '${s.payment_expiration_date || ''}')" 
                            class="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-background-dark rounded-xl transition-all"
                            title="Mettre à jour le paiement">
                            <span class="material-symbols-outlined text-sm">payments</span>
                        </button>
                    ` : ''}
                    <button onclick="viewStudentDetails('${s.id}')" 
                        class="p-2 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all">
                        <span class="material-symbols-outlined text-sm">visibility</span>
                    </button>
                    <button onclick="${showArchived ? `unarchiveStudent('${s.id}')` : `archiveStudent('${s.id}')`}" 
                        class="p-2 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all"
                        title="${showArchived ? 'Désarchiver' : 'Archiver'}">
                        <span class="material-symbols-outlined text-sm">${showArchived ? 'unarchive' : 'archive'}</span>
                    </button>
                    <button onclick="deleteStudent('${s.id}')" 
                        class="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        title="Supprimer">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function archiveStudent(id) {
    if (!confirm('Voulez-vous archiver cet élève ? Il ne sera plus visible dans le registre actif.')) return;
    const { error } = await supabaseClient.from('academy_students').update({ is_archived: true }).eq('id', id);
    if (!error) loadStudents();
}

async function unarchiveStudent(id) {
    const { error } = await supabaseClient.from('academy_students').update({ is_archived: false }).eq('id', id);
    if (!error) loadStudents();
}

async function openEditStudentModal(id) {
    try {
        const { data: student, error } = await supabaseClient
            .from('academy_students')
            .select(`
                *,
                academy_registrations(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('editStudentId').value = student.id;
        document.getElementById('editRegId').value = student.academy_registrations.id;
        document.getElementById('editChildName').value = student.academy_registrations.child_name;
        document.getElementById('editChildAge').value = student.academy_registrations.child_age;
        document.getElementById('editParentName').value = student.academy_registrations.parent_name || '';
        document.getElementById('editParentPhone').value = student.academy_registrations.parent_phone || '';

        // Fill programs select
        const programSelect = document.getElementById('editStudentProgram');
        programSelect.innerHTML = '<option value="">Sélectionner un programme</option>';
        currentAcademy.programs.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.textContent = p.name;
            if (p.name === (student.additional_details?.program || student.academy_registrations.selected_program)) {
                opt.selected = true;
            }
            programSelect.appendChild(opt);
        });

        openModal('editStudentModal');
    } catch (err) {
        alert('Erreur lors du chargement des données: ' + err.message);
    }
}

async function saveStudentEdit(e) {
    if (e) e.preventDefault();
    const btn = e ? e.submitter : null;
    if (btn) btn.disabled = true;

    try {
        const studentId = document.getElementById('editStudentId').value;
        const regId = document.getElementById('editRegId').value;
        const childName = document.getElementById('editChildName').value;
        const childAge = document.getElementById('editChildAge').value;
        const parentName = document.getElementById('editParentName').value;
        const parentPhone = document.getElementById('editParentPhone').value;
        const selectedProgram = document.getElementById('editStudentProgram').value;

        // Update Registration
        const { error: regError } = await supabaseClient
            .from('academy_registrations')
            .update({
                child_name: childName,
                child_age: childAge,
                parent_name: parentName,
                parent_phone: parentPhone,
                selected_program: selectedProgram
            })
            .eq('id', regId);

        if (regError) throw regError;

        // Update Student (additional details for program consistency)
        const { error: studentError } = await supabaseClient
            .from('academy_students')
            .update({
                additional_details: { program: selectedProgram }
            })
            .eq('id', studentId);

        if (studentError) throw studentError;

        closeModal('editStudentModal');
        loadStudents();
    } catch (err) {
        alert('Erreur lors de la sauvegarde: ' + err.message);
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function deleteStudent(id) {
    if (!confirm('ATTENTION: Cette action est irréversible. Toutes les données de cet élève seront supprimées. Continuer ?')) return;
    const { error } = await supabaseClient.from('academy_students').delete().eq('id', id);
    if (!error) loadStudents();
}

function toggleArchivedView() {
    showArchived = !showArchived;
    const btn = document.getElementById('viewArchivedBtn');
    if (showArchived) {
        btn.classList.add('bg-primary', 'text-background-dark');
        btn.classList.remove('text-slate-400');
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">inventory_2</span> Actifs`;
    } else {
        btn.classList.remove('bg-primary', 'text-background-dark');
        btn.classList.add('text-slate-400');
        btn.innerHTML = `<span class="material-symbols-outlined text-sm">archive</span> Archive`;
    }
    loadStudents();
}

function openPaymentModal(studentId, currentExpiry) {
    document.getElementById('paymentStudentId').value = studentId;
    document.getElementById('paymentExpiryInput').value = currentExpiry || '';
    document.getElementById('paymentModal').classList.remove('hidden');
}

function viewStudentDetails(studentId) {
    // Placeholder for future expanded view
    alert('Détails complets de l\'élève (Historique, Performance, etc.) bientôt disponible.');
}

function openConfirmModal(regId, childName) {
    document.getElementById('regIdInput').value = regId;
    document.getElementById('confirmStudentModal').classList.remove('hidden');
    const select = document.getElementById('assignProgram');
    select.innerHTML = '<option value="">Sélectionner un Programme</option>';
    currentAcademy.programs?.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        select.appendChild(opt);
    });
}

function switchTab(tab) {
    currentTab = tab;
    ['programs', 'requests', 'students', 'coaches', 'schedule'].forEach(t => {
        const btn = document.getElementById(`${t}TabBtn`);
        const view = document.getElementById(`${t}View`);
        if (btn) {
            btn.classList.toggle('active', t === tab);
            if (t !== tab) {
                btn.classList.add('text-slate-400');
                btn.classList.remove('active', 'bg-primary', 'text-background-dark');
            } else {
                btn.classList.remove('text-slate-400');
                btn.classList.add('active', 'bg-primary', 'text-background-dark');
            }
        }
        if (view) view.classList.toggle('hidden', t !== tab);
    });

    if (tab === 'requests') loadRequests();
    if (tab === 'students') loadStudents();
    if (tab === 'coaches') loadCoaches();
    if (tab === 'schedule') loadSchedule();
}

// --- COACH MANAGEMENT ---

async function loadCoaches() {
    if (!currentAcademy) return;
    const { data, error } = await supabaseClient
        .from('academy_coaches')
        .select('*')
        .eq('academy_id', currentAcademy.id);

    if (error) {
        console.error('Error loading coaches:', error);
        return;
    }
    coaches = data || [];
    renderCoaches();
}

function renderCoaches() {
    const grid = document.getElementById('coachesGrid');
    if (!grid) return;

    if (coaches.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center glass-morphism rounded-3xl border border-dashed border-slate-700">
                <p class="text-slate-500">Aucun coach recruté pour le moment.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = coaches.map(coach => `
        <div class="magic-card bg-card-dark p-6 rounded-3xl border border-slate-800 group relative">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border border-white/5 shadow-inner">
                    ${coach.avatar_url ? `<img src="${coach.avatar_url}" class="w-full h-full object-cover">` :
            `<span class="material-symbols-outlined text-3xl text-primary">person</span>`}
                </div>
                <div class="flex-1 overflow-hidden">
                    <h4 class="text-white font-bold truncate">${coach.name}</h4>
                    <p class="text-slate-500 text-[10px] font-bold uppercase tracking-wider">${coach.email || 'Pas d\'email'}</p>
                    ${coach.phone ? `<p class="text-primary text-[10px] font-bold mt-1">${coach.phone}</p>` : ''}
                </div>
            </div>
            
            ${coach.specialties?.length > 0 ? `
                <div class="flex flex-wrap gap-2 mb-4">
                    ${coach.specialties.map(s => `<span class="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-md uppercase tracking-tighter">${s}</span>`).join('')}
                </div>
            ` : ''}

            <p class="text-slate-400 text-xs mb-6 line-clamp-2 italic">${coach.bio || 'Aucune biographie.'}</p>
            
            <div class="mb-6 p-3 bg-background-dark/50 rounded-xl border border-white/5 space-y-2">
                <div class="flex items-center justify-between">
                    <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest">Jeton d'accès</p>
                    <button onclick="copyToClipboard('${coach.portal_token}', this)" class="text-primary hover:text-white transition-colors">
                        <span class="material-symbols-outlined text-xs">content_copy</span>
                    </button>
                </div>
                <p class="text-xs font-mono text-slate-300 break-all select-all">${coach.portal_token || 'Non généré'}</p>
            </div>
            
            <div class="flex gap-2">
                <button onclick="editCoach('${coach.id}')" class="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all">Modifier</button>
                <button onclick="deleteCoach('${coach.id}')" class="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-all">
                    <span class="material-symbols-outlined text-sm">delete</span>
                </button>
            </div>
        </div>
    `).join('');

    // Re-attach magic card spotlight
    document.querySelectorAll('#coachesGrid .magic-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

function openCoachModal(coachId = null) {
    const modal = document.getElementById('coachModal');
    const form = document.getElementById('coachForm');
    const title = document.getElementById('coachModalTitle');

    form.reset();
    document.getElementById('editCoachId').value = coachId || '';
    document.getElementById('coachAvatarPreview').classList.add('hidden');

    if (coachId) {
        const coach = coaches.find(c => c.id === coachId);
        if (coach) {
            title.textContent = 'Modifier le Coach';
            document.getElementById('coachNameInput').value = coach.name;
            document.getElementById('coachEmailInput').value = coach.email || '';
            document.getElementById('coachPhoneInput').value = coach.phone || '';
            document.getElementById('coachSpecialtiesInput').value = (coach.specialties || []).join(', ');
            document.getElementById('coachBioInput').value = coach.bio || '';

            if (coach.avatar_url) {
                const preview = document.getElementById('coachAvatarPreview');
                preview.src = coach.avatar_url;
                preview.classList.remove('hidden');
            }
        }
    } else {
        title.textContent = 'Ajouter un Coach';
    }

    modal.classList.remove('hidden');
}

// --- SCHEDULE MANAGEMENT ---

async function loadSchedule() {
    if (!currentAcademy) return;
    const { data, error } = await supabaseClient
        .from('academy_program_sessions')
        .select(`
            *,
            coach:academy_coaches!academy_program_sessions_coach_id_fkey(*)
        `)
        .eq('academy_id', currentAcademy.id)
        .order('day_of_week')
        .order('start_time');

    if (error) {
        console.error('Error loading schedule:', error);
        return;
    }
    sessions = data || [];
    renderSchedule();
    updateCalendarEvents();
}

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function renderSchedule() {
    const container = document.getElementById('scheduleGrid');
    if (!container) return;

    if (sessions.length === 0) {
        container.innerHTML = `
            <div class="py-12 text-center">
                <p class="text-slate-500">Aucune session programmée.</p>
            </div>
        `;
        return;
    }

    // Group recurring sessions by day
    const recurring = sessions.filter(s => s.is_recurring !== false).reduce((acc, s) => {
        acc[s.day_of_week] = acc[s.day_of_week] || [];
        acc[s.day_of_week].push(s);
        return acc;
    }, {});

    // Group one-time sessions
    const oneTime = sessions.filter(s => s.is_recurring === false);

    let html = '';

    // Render Recurring
    if (Object.keys(recurring).length > 0) {
        html += `<h3 class="text-white font-bold mb-4 flex items-center gap-2 pt-4">
                    <span class="material-symbols-outlined text-sm text-primary">event_repeat</span>
                    Sessions Récurrentes
                 </h3>`;
        html += Object.keys(recurring).sort().map(day => `
            <div class="space-y-4 mb-6">
                <h4 class="text-primary font-black uppercase tracking-widest text-[10px] ml-2">${DAYS_FR[day]}</h4>
                <div class="grid grid-cols-1 gap-3">
                    ${recurring[day].map(s => renderSessionRow(s)).join('')}
                </div>
            </div>
        `).join('');
    }

    // Render One-time
    if (oneTime.length > 0) {
        html += `<h3 class="text-white font-bold mb-4 flex items-center gap-2 pt-8 border-t border-white/5">
                    <span class="material-symbols-outlined text-sm text-amber-400">event_upcoming</span>
                    Sessions Ponctuelles
                 </h3>`;
        html += `
            <div class="grid grid-cols-1 gap-3">
                ${oneTime.sort((a, b) => new Date(a.specific_date) - new Date(b.specific_date)).map(s => renderSessionRow(s)).join('')}
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderSessionRow(s) {
    const dateInfo = s.is_recurring !== false
        ? `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`
        : `${new Date(s.specific_date).toLocaleDateString()} • ${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`;

    return `
        <div class="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-primary/30 transition-all group">
            <div class="flex items-center gap-6">
                <div class="flex flex-col">
                    <span class="text-white font-bold">${dateInfo}</span>
                    <span class="text-[10px] text-slate-500 uppercase font-black">${s.program_name}</span>
                </div>
                <div class="h-8 w-[1px] bg-slate-800"></div>
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                        ${s.coach?.avatar_url ? `<img src="${s.coach.avatar_url}" class="w-full h-full object-cover">` :
            `<span class="material-symbols-outlined text-sm text-primary">sports</span>`}
                    </div>
                    <span class="text-slate-300 text-sm font-semibold">${s.coach?.name || 'Coach non assigné'}</span>
                </div>
            </div>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="editSession('${s.id}')" class="p-2 hover:bg-primary/20 hover:text-primary rounded-lg transition-all">
                    <span class="material-symbols-outlined text-sm">edit</span>
                </button>
                <button onclick="deleteSession('${s.id}')" class="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all">
                    <span class="material-symbols-outlined text-sm">delete_forever</span>
                </button>
            </div>
        </div>
    `;
}

function addSessionSlot(data = null) {
    const container = document.getElementById('sessionSlotsContainer');
    const slotId = Date.now() + Math.random();
    const div = document.createElement('div');
    div.id = `slot-${slotId}`;
    div.className = 'slot-row grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end p-4 bg-white/5 rounded-2xl border border-white/5 relative group/slot';

    div.innerHTML = `
        <div>
            <label class="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Jour</label>
            <select name="slotDay" required class="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:border-primary">
                <option value="1">Lundi</option>
                <option value="2">Mardi</option>
                <option value="3">Mercredi</option>
                <option value="4">Jeudi</option>
                <option value="5">Vendredi</option>
                <option value="6">Samedi</option>
                <option value="0">Dimanche</option>
            </select>
        </div>
        <div>
            <label class="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Début</label>
            <input type="time" name="slotStart" required class="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:border-primary">
        </div>
        <div>
            <label class="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Fin</label>
            <input type="time" name="slotEnd" required class="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:border-primary">
        </div>
        <button type="button" onclick="removeSessionSlot('${div.id}')" class="p-2 text-slate-500 hover:text-red-500 transition-colors">
            <span class="material-symbols-outlined">delete</span>
        </button>
    `;

    container.appendChild(div);

    if (data) {
        div.querySelector('[name="slotDay"]').value = data.day_of_week;
        div.querySelector('[name="slotStart"]').value = data.start_time;
        div.querySelector('[name="slotEnd"]').value = data.end_time;
    }
}

function removeSessionSlot(id) {
    const slot = document.getElementById(id);
    if (document.querySelectorAll('.slot-row').length > 1) {
        slot.remove();
    } else {
        alert("Au moins un créneau est requis pour une session récurrente.");
    }
}

function openSessionModal(sessionId = null) {
    const modal = document.getElementById('sessionModal');
    const form = document.getElementById('sessionForm');
    const slotsContainer = document.getElementById('sessionSlotsContainer');

    // Populate dropdowns
    const progSelect = document.getElementById('sessionProgramSelect');
    const coachSelect = document.getElementById('sessionCoachSelect');

    progSelect.innerHTML = (currentAcademy?.programs || []).map(p =>
        `<option value="${p.name}">${p.name}</option>`
    ).join('');

    coachSelect.innerHTML = coaches.map(c =>
        `<option value="${c.id}">${c.name}</option>`
    ).join('') || '<option value="">Aucun coach disponible</option>';

    form.reset();
    slotsContainer.innerHTML = '';
    document.getElementById('editSessionId').value = sessionId || '';

    // Default to recurring
    document.getElementById('sessionRecurringCheck').checked = true;
    document.getElementById('sessionSlotsContainer').classList.remove('hidden');
    document.getElementById('addSlotBtnContainer').classList.remove('hidden');
    document.getElementById('dateSelectGroup').classList.add('hidden');

    if (sessionId) {
        const s = sessions.find(sess => sess.id === sessionId);
        if (s) {
            document.getElementById('sessionProgramSelect').value = s.program_name;
            document.getElementById('sessionCoachSelect').value = s.coach_id || '';

            const isRecurring = s.is_recurring !== false;
            document.getElementById('sessionRecurringCheck').checked = isRecurring;
            document.getElementById('sessionSlotsContainer').classList.toggle('hidden', !isRecurring);
            document.getElementById('addSlotBtnContainer').classList.toggle('hidden', !isRecurring);
            document.getElementById('dateSelectGroup').classList.toggle('hidden', isRecurring);

            if (isRecurring) {
                addSessionSlot(s);
            } else {
                document.getElementById('sessionDateInput').value = s.specific_date;
                // Add an empty slot just in case the user toggles recurring
                addSessionSlot();
            }
            // For editing, we might only want to edit one specific session or the whole group.
            // But the user's request was about "adding new day and time" in the creation flow.
            // If editing, we'll just show the single session being edited as one slot.
        }
    } else {
        // New session: start with one empty slot
        addSessionSlot();
    }

    openModal('sessionModal');
}

window.addSessionSlot = addSessionSlot;
window.removeSessionSlot = removeSessionSlot;

function toggleFilterPanel() {
    const panel = document.getElementById('studentFilterPanel');
    const btn = document.getElementById('studentFilterBtn');
    if (!panel) return;

    panel.classList.toggle('hidden');
    btn.classList.toggle('bg-primary/20', !panel.classList.contains('hidden'));
    btn.classList.toggle('text-primary', !panel.classList.contains('hidden'));
}

function resetFilters() {
    document.getElementById('studentSearchInput').value = '';
    document.getElementById('filterAgeRange').value = '';
    document.getElementById('filterProgram').value = '';
    document.getElementById('filterPaymentStatus').value = '';
    applyAdvancedFilters();
}

function applyAdvancedFilters() {
    const queryInput = document.getElementById('studentSearchInput');
    const ageInput = document.getElementById('filterAgeRange');
    const progInput = document.getElementById('filterProgram');
    const statusInput = document.getElementById('filterPaymentStatus');

    if (!queryInput || !ageInput || !progInput || !statusInput) return;

    const query = queryInput.value.toLowerCase();
    const ageRange = ageInput.value;
    const program = progInput.value;
    const paymentStatus = statusInput.value;

    const filtered = allStudents.filter(s => {
        const reg = s.academy_registrations;
        const studentProgram = s.additional_details?.program || reg.selected_program;

        // Search Filter
        const matchesSearch = !query ||
            reg.child_name?.toLowerCase().includes(query) ||
            reg.parent_name?.toLowerCase().includes(query) ||
            reg.parent_phone?.toLowerCase().includes(query) ||
            s.student_code?.toLowerCase().includes(query);

        // Age Filter
        let matchesAge = true;
        if (ageRange) {
            const age = parseInt(reg.child_age);
            if (ageRange === '0-8') matchesAge = age <= 8;
            else if (ageRange === '9-12') matchesAge = age >= 9 && age <= 12;
            else if (ageRange === '13-17') matchesAge = age >= 13 && age <= 17;
            else if (ageRange === '18+') matchesAge = age >= 18;
        }

        // Program Filter
        const matchesProgram = !program || studentProgram === program;

        // Payment Status Filter
        let matchesPayment = true;
        if (paymentStatus) {
            const expiryDate = s.payment_expiration_date ? new Date(s.payment_expiration_date) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (paymentStatus === 'undefined') matchesPayment = !expiryDate;
            else if (paymentStatus === 'expired') matchesPayment = expiryDate && expiryDate < today;
            else if (paymentStatus === 'expiring') {
                if (!expiryDate) matchesPayment = false;
                else {
                    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    matchesPayment = diffDays > 0 && diffDays <= 7;
                }
            }
            else if (paymentStatus === 'active') {
                if (!expiryDate) matchesPayment = false;
                else {
                    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    matchesPayment = diffDays > 7;
                }
            }
        }

        return matchesSearch && matchesAge && matchesProgram && matchesPayment;
    });

    renderStudents(filtered);
}

window.toggleFilterPanel = toggleFilterPanel;
window.resetFilters = resetFilters;
window.applyAdvancedFilters = applyAdvancedFilters;

function setScheduleView(view) {
    currentScheduleView = view;

    const isList = view === 'list';
    document.getElementById('scheduleListView').classList.toggle('hidden', !isList);
    document.getElementById('scheduleCalendarView').classList.toggle('hidden', isList);

    // Update button styles
    const listBtn = document.getElementById('viewListBtn');
    const calBtn = document.getElementById('viewCalendarBtn');

    if (isList) {
        listBtn.classList.add('bg-primary', 'text-background-dark');
        listBtn.classList.remove('text-slate-500', 'hover:text-white');
        calBtn.classList.remove('bg-primary', 'text-background-dark');
        calBtn.classList.add('text-slate-500', 'hover:text-white');
    } else {
        calBtn.classList.add('bg-primary', 'text-background-dark');
        calBtn.classList.remove('text-slate-500', 'hover:text-white');
        listBtn.classList.remove('bg-primary', 'text-background-dark');
        listBtn.classList.add('text-slate-500', 'hover:text-white');

        // Init or update calendar
        if (!fullCalendar) {
            initScheduleCalendar();
        } else {
            setTimeout(() => {
                fullCalendar.render();
                updateCalendarEvents();
            }, 50);
        }
    }
}

function initScheduleCalendar() {
    const calendarEl = document.getElementById('scheduleCalendar');
    if (!calendarEl) return;

    fullCalendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,dayGridMonth'
        },
        locale: 'fr',
        firstDay: 1, // Start on Monday
        slotMinTime: '06:00:00',
        slotMaxTime: '23:59:00',
        allDaySlot: false,
        height: 'auto',
        events: getCalendarEvents(),
        eventClick: (info) => {
            editSession(info.event.id);
        },
        eventDidMount: (info) => {
            info.el.classList.add('rounded-xl', 'border-0', 'shadow-lg');
            if (info.event.extendedProps.isRecurring) {
                // info.el.style.borderLeft = '4px solid #D9FF66';
            }
        }
    });

    fullCalendar.render();
}

function updateCalendarEvents() {
    if (!fullCalendar) return;
    fullCalendar.removeAllEvents();
    fullCalendar.addEventSource(getCalendarEvents());
}

function getCalendarEvents() {
    return sessions.map(s => {
        const isRecurring = s.is_recurring !== false;
        const color = isRecurring ? '#D9FF66' : '#fbbf24';
        const textColor = '#05080F';

        if (isRecurring) {
            return {
                id: s.id,
                title: `${s.program_name}\n${s.coach?.name || 'Coach'}`,
                daysOfWeek: [s.day_of_week],
                startTime: s.start_time,
                endTime: s.end_time,
                backgroundColor: color,
                textColor: textColor,
                extendedProps: { isRecurring: true }
            };
        } else {
            return {
                id: s.id,
                title: `${s.program_name}\n${s.coach?.name || 'Coach'}`,
                start: `${s.specific_date}T${s.start_time}`,
                end: `${s.specific_date}T${s.end_time}`,
                backgroundColor: color,
                textColor: textColor,
                extendedProps: { isRecurring: false }
            };
        }
    });
}

window.setScheduleView = setScheduleView;

async function copyToClipboard(text, btn) {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        const icon = btn.querySelector('.material-symbols-outlined');
        const oldIcon = icon.textContent;
        icon.textContent = 'check';
        btn.classList.add('text-green-500');
        setTimeout(() => {
            icon.textContent = oldIcon;
            btn.classList.remove('text-green-500');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy!', err);
    }
}
window.copyToClipboard = copyToClipboard;
window.toggleArchivedView = toggleArchivedView;
window.archiveStudent = archiveStudent;
window.unarchiveStudent = unarchiveStudent;
window.deleteStudent = deleteStudent;
window.openPaymentModal = openPaymentModal;
window.viewStudentDetails = viewStudentDetails;
window.openEditStudentModal = openEditStudentModal;
window.saveStudentEdit = saveStudentEdit;
window.openModal = openModal;
window.closeModal = closeModal;
