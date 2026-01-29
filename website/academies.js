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

let userLocation = null;
let allAcademies = [];
let allCoaches = []; // Global coach store for public view
let allSessions = []; // Global sessions store for schedules

const translationMap = {
    // Academy Names & Descriptions
    'Elite Football Academy': 'Académie de Football Élite',
    'Padel Junior Club': 'Club Padel Junior',
    'Professional football coaching for Kids aged 6-16': 'Coaching de football professionnel pour les enfants de 6 à 16 ans',
    'Professional football coaching for': 'Coaching de football professionnel pour',
    'Discover the fastest growing sport! Learn padel from certified instructors in a fun, gamified environment.': 'Découvrez le sport à la croissance la plus rapide ! Apprenez le padel avec des instructeurs certifiés dans un environnement ludique.',
    'Junior Strikers': 'Attaquants Juniors',
    'Senior Pro': 'Senior Pro',
    'aged': 'âgés',
    // Age Groups
    'Elite Kids': 'Élite Enfants',
    'Young Stars': 'Jeunes Étoiles',
    'Teens': 'Ados',
    'Adults': 'Adultes',
    'Kids': 'Enfants',
    'Youth': 'Jeunesse',
    'Beginner': 'Débutant',
    'Intermediate': 'Intermédiaire',
    'Advanced': 'Avancé',
    // Schedules
    'Weekends': 'Week-ends',
    'Mon/Wed': 'Lun/Mer',
    'Tue/Thu': 'Mar/Jeu',
    'Mon & Wed': 'Lun & Mer',
    'Tue & Thu': 'Mar & Jeu',
    'Fri/Sat': 'Ven/Sam',
    'Morning': 'Matin',
    'Afternoon': 'Après-midi',
    'Evening': 'Soir',
    'Daily': 'Quotidien',
    'Twice a week': 'Deux fois par semaine',
    'Thrice a week': 'Trois fois par semaine'
};

function t(text) {
    if (!text) return text;
    let translated = text;
    // Sort keys by length descending to prevent partial matches of shorter keys within longer keys
    const sortedKeys = Object.keys(translationMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        const val = translationMap[key];
        // Use global regex with word boundaries or just global replace if keys are phrases
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        translated = translated.replace(regex, val);
    }
    return translated;
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadAcademies();
    detectLocation();
});

async function loadAcademies() {
    if (!supabaseClient) initSupabase();
    if (!supabaseClient) {
        console.error('Impossible de charger les académies : Supabase non initialisé.');
        return;
    }
    // Charger les académies et les emplacements de leurs complexes
    const { data: academies, error } = await supabaseClient
        .from('academies')
        .select(`
            *,
            complexes (
                name,
                address,
                location_lat,
                location_lng
            )
        `);

    if (error) {
        console.error('Erreur lors du chargement des académies :', error);
        return;
    }

    allAcademies = academies;
    await loadCoaches(); // Load coaches for cross-reference
    await loadAllSessions(); // Load sessions for dynamic schedules
    renderAcademies(allAcademies);
}

async function loadAllSessions() {
    const { data, error } = await supabaseClient.from('academy_program_sessions').select('*').eq('is_recurring', true);
    if (!error) allSessions = data || [];
}

function formatProgramSchedule(programName, academyId) {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const programSessions = allSessions.filter(s => s.academy_id === academyId && s.program_name === programName);

    if (programSessions.length === 0) return 'Horaires à confirmer';

    // Group by time
    const timeGroups = {};
    programSessions.forEach(s => {
        const time = s.start_time.substring(0, 5);
        if (!timeGroups[time]) timeGroups[time] = [];
        timeGroups[time].push(t(days[s.day_of_week]));
    });

    const results = Object.entries(timeGroups).map(([time, dayList]) => {
        return `${dayList.join(' & ')} ${time}`;
    });

    return results.join(' | ');
}

async function loadCoaches() {
    const { data, error } = await supabaseClient.from('academy_coaches').select('id, academy_id, name, avatar_url, bio, specialties');
    if (!error) allCoaches = data || [];
}

function detectLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            document.getElementById('locationSearch').value = `Emplacement détecté`;
            sortByProximity();
        }, error => {
            console.warn("Permission de géolocalisation refusée ou erreur :", error);
            document.getElementById('locationSearch').value = "Accès à l'emplacement refusé";
        });
    } else {
        document.getElementById('locationSearch').value = "Géolocalisation non supportée";
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
}

function sortByProximity() {
    if (!userLocation || allAcademies.length === 0) return;

    allAcademies.forEach(academy => {
        if (academy.complexes?.location_lat && academy.complexes?.location_lng) {
            academy.distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                parseFloat(academy.complexes.location_lat),
                parseFloat(academy.complexes.location_lng)
            );
        } else {
            academy.distance = 9999;
        }
    });

    allAcademies.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    renderAcademies(allAcademies);
}

function renderAcademies(academies) {
    const grid = document.getElementById('academiesGrid');
    grid.innerHTML = '';

    if (academies.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-24 text-center">
                <p class="text-slate-500">Aucune académie trouvée pour le moment. Revenez plus tard !</p>
            </div>
        `;
        return;
    }

    academies.forEach(academy => {
        const distanceStr = academy.distance && academy.distance < 999 ? `À ${academy.distance} km` : 'Mode découverte';
        const card = document.createElement('div');
        card.className = 'academy-card group';
        card.onclick = () => openAcademyModal(academy);

        // Utiliser le logo si existant, sinon initiale du nom
        const logoHtml = academy.logo_url ?
            `<img src="${academy.logo_url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">` :
            `<div class="w-full h-full flex items-center justify-center text-slate-800 text-6xl font-black">${academy.name[0]}</div>`;

        card.innerHTML = `
            <div class="aspect-video bg-slate-900 overflow-hidden relative border-b border-white/5">
                ${logoHtml}
                <div class="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent"></div>
                <div class="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                    <span class="px-3 py-1.5 bg-primary text-background-dark text-[10px] font-black uppercase rounded-lg shadow-xl shadow-primary/20">${academy.complexes?.name || 'Complexe Sportif'}</span>
                    <span class="text-[10px] text-white/50 font-black uppercase tracking-widest">${distanceStr}</span>
                </div>
            </div>
            <div class="p-8">
                <h3 class="text-xl font-display font-bold text-white mb-2 group-hover:text-primary transition-colors">${t(academy.name)}</h3>
                <p class="text-[10px] text-primary font-black uppercase tracking-widest mb-2">${academy.programs?.length || 0} Programmes Disponibles</p>
                <p class="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-6 font-medium">${t(academy.description) || 'Programmes d\'entraînement professionnels pour la prochaine génération.'}</p>
                <div class="flex items-center justify-between">
                    <div class="flex -space-x-2">
                        <div class="w-7 h-7 rounded-full border-2 border-card-dark bg-slate-800 flex items-center justify-center"><span class="material-symbols-outlined text-[10px]">person</span></div>
                        <div class="w-7 h-7 rounded-full border-2 border-card-dark bg-slate-800 flex items-center justify-center font-black text-[8px] text-slate-500">+12</div>
                    </div>
                    <span class="text-primary text-[10px] uppercase font-black tracking-widest flex items-center gap-1">Détails <span class="material-symbols-outlined text-sm">arrow_forward</span></span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openAcademyModal(academy) {
    const modal = document.getElementById('academyModal');
    modal.classList.remove('hidden');

    document.getElementById('modalName').textContent = t(academy.name);
    document.getElementById('modalDesc').textContent = t(academy.description);
    document.getElementById('modalProximity').textContent = academy.distance ? `${academy.distance} km` : 'Découverte';
    document.getElementById('regAcademyId').value = academy.id;

    // Afficher le logo dans le modal
    const cover = document.getElementById('modalCover');
    const placeholder = document.getElementById('modalPlaceholder');
    if (academy.logo_url) {
        cover.src = academy.logo_url;
        cover.classList.remove('hidden');
        placeholder.classList.add('hidden');
    } else {
        cover.classList.add('hidden');
        placeholder.classList.remove('hidden');
        placeholder.textContent = academy.name[0];
    }

    const programsList = document.getElementById('modalPrograms');
    programsList.innerHTML = '';

    (academy.programs || []).forEach(p => {
        const coach = allCoaches.find(c => c.id === p.coach_id);
        const dynamicSchedule = formatProgramSchedule(p.name, academy.id);

        const div = document.createElement('div');
        div.className = 'flex flex-col gap-4 p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:border-primary/20 transition-all cursor-pointer group';
        div.onclick = (e) => {
            e.stopPropagation();
            toggleRegistration(p.name);
        };

        div.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-2xl">sports_soccer</span>
                    </div>
                    <div>
                        <h4 class="font-display font-bold text-white group-hover:text-primary transition-colors">${t(p.name)}</h4>
                        <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest">${t(p.ageGroup)} Ans</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-lg font-display font-black text-white">${p.price}<span class="text-[10px] text-slate-500 font-normal uppercase ml-1">TND</span></p>
                    <p class="text-[9px] text-primary font-black uppercase tracking-tighter">Demande d'inscription</p>
                </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-white/5">
                <div class="flex items-center gap-3 text-slate-400 text-[11px] font-medium">
                    <span class="material-symbols-outlined text-sm text-primary">schedule</span>
                    ${dynamicSchedule}
                </div>

                ${coach ? `
                <div class="flex items-center gap-2 px-3 py-1.5 bg-background-dark/50 rounded-full border border-white/5">
                    <div class="w-5 h-5 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                        ${coach.avatar_url ? `<img src="${coach.avatar_url}" class="w-full h-full object-cover">` : `<span class="material-symbols-outlined text-[8px] flex items-center justify-center h-full">person</span>`}
                    </div>
                    <span class="text-[10px] font-bold text-white">${coach.name}</span>
                </div>
                ` : ''}
            </div>
        `;
        programsList.appendChild(div);
    });

    // Réinitialiser l'inscription et peupler le sélecteur de programme
    const programSelect = document.getElementById('regProgramSelect');
    if (programSelect) {
        programSelect.innerHTML = '<option value="">Sélectionner un programme</option>' +
            (academy.programs || []).map(p => `<option value="${p.name}">${t(p.name)}</option>`).join('');
    }
    document.getElementById('registrationSection').classList.add('hidden');
}

function toggleRegistration(programName = null) {
    const section = document.getElementById('registrationSection');
    const programSelect = document.getElementById('regProgramSelect');

    if (programSelect && programName) {
        programSelect.value = programName;
    } else if (programSelect) {
        programSelect.selectedIndex = 0; // Reset to "Select a program"
    }

    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth' });
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// Gestionnaire du formulaire d'inscription
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const academyId = document.getElementById('regAcademyId').value;
    const programName = document.getElementById('regProgramSelect').value;
    const childName = document.getElementById('regChildName').value;
    const childAge = document.getElementById('regChildAge').value;
    const parentName = document.getElementById('regParentName').value;
    const parentPhone = document.getElementById('regParentPhone').value;

    // Capture connected user if any
    const { data: { user } } = await supabaseClient.auth.getUser().catch(() => ({ data: { user: null } }));

    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Envoi en cours...';

    const { error } = await supabaseClient
        .from('academy_registrations')
        .insert({
            academy_id: academyId,
            parent_id: user?.id || null,
            child_name: childName,
            child_age: parseInt(childAge),
            parent_name: parentName,
            parent_phone: parentPhone,
            selected_program: programName,
            status: 'pending'
        });

    if (error) {
        alert('Erreur : ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Envoyer la Demande d\'Inscription';
    } else {
        alert('Demande envoyée avec succès ! L\'académie vous contactera bientôt.');
        closeModal('academyModal');
        btn.disabled = false;
        btn.textContent = 'Envoyer la Demande d\'Inscription';
    }
});

document.getElementById('useMyLocation').addEventListener('click', () => {
    detectLocation();
});
