const SUPABASE_FALLBACK_URL = 'https://dgpdlwklqvbmdtalyiis.supabase.co';
const SUPABASE_FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA';

// Ensure IMAGEKIT_CONFIG is available (from config.js or fallback)
if (typeof IMAGEKIT_CONFIG === 'undefined') {
    // Only create if config.js didn't load
    window.IMAGEKIT_CONFIG = {
        PUBLIC_KEY: 'public_ViO2c8x++d222YZkE23sM671Tb0=',
        URL_ENDPOINT: 'https://ik.imagekit.io/kanze88sec',
        PRIVATE_KEY: 'private_eLSlvvmgFTZDNPd3xwA85wH9OEY='
    };
}

// NOTE: For token-based auth, we need to either:
// 1. Use service role key (not secure for client-side - use Edge Functions instead)
// 2. Update RLS policies to allow operations
// 3. Create Edge Functions to handle updates server-side
// For now, check browser console for RLS errors

// ImageKit Upload Function
async function uploadToImageKit(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', `${Date.now()}_${file.name}`);
        formData.append('publicKey', IMAGEKIT_CONFIG.PUBLIC_KEY);

        const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(IMAGEKIT_CONFIG.PRIVATE_KEY + ':')}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload to ImageKit');
        }

        const data = await response.json();
        let imageUrl = data.url || data.filePath || '';
        imageUrl = imageUrl.replace(/\]+$/, '').trim();

        if (!imageUrl.startsWith('http') && data.filePath) {
            imageUrl = `${IMAGEKIT_CONFIG.URL_ENDPOINT}/${data.filePath}`;
        }

        return imageUrl;
    } catch (error) {
        console.error('ImageKit upload error:', error);
        throw error;
    }
}

// Initialize Supabase
let supabaseClient;
let currentUser = null;
let currentComplexId = null;
let currentComplex = null;
let complexes = [];
let bookings = [];
let pitches = [];
let sportTypes = [];
let revenueChart = null;
let statusChart = null;

function initSupabase() {
    try {
        // Fallback for SUPABASE_URL and SUPABASE_ANON_KEY from window.config if available
        const sUrl = (typeof window.config !== 'undefined' ? window.config.supabaseUrl : null) || SUPABASE_FALLBACK_URL;
        const sKey = (typeof window.config !== 'undefined' ? window.config.supabaseKey : null) || SUPABASE_FALLBACK_KEY;

        if (typeof supabaseJs !== 'undefined' && supabaseJs.createClient) {
            supabaseClient = supabaseJs.createClient(sUrl, sKey);
        } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(sUrl, sKey);
        } else if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseClient = supabase.createClient(sUrl, sKey);
        } else {
            setTimeout(initSupabase, 100);
            return;
        }
        initDashboard();
    } catch (err) {
        console.error('Error initializing Supabase:', err);
        setTimeout(initSupabase, 100);
    }
}

let dashboardInitAttempts = 0;
function initDashboard() {
    if (!supabaseClient) {
        dashboardInitAttempts++;
        if (dashboardInitAttempts > 50) {
            console.error('Failed to initialize Supabase after 50 attempts');
            alert('Erreur de connexion à la base de données. Veuillez rafraîchir la page.');
            return;
        }
        setTimeout(initDashboard, 100);
        return;
    }

    // Check token authentication
    (async () => {
        const token = sessionStorage.getItem('owner_token');
        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        // Verify token
        let profile = null;
        try {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .select('id, name, email, role')
                .eq('portal_token', token)
                .eq('role', 'owner')
                .single();

            if (error || !data) {
                console.log('Invalid token, clearing session and redirecting');
                sessionStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            profile = data;
        } catch (err) {
            console.error('Error verifying token:', err);
            sessionStorage.clear();
            window.location.href = 'login.html';
            return;
        }

        currentUser = { id: profile.id, name: profile.name, email: profile.email };
        document.getElementById('userName').textContent = profile.name || profile.email;

        const path = window.location.pathname || '';
        const isSportTypesPage = path.endsWith('sport-types.html');

        await loadSportTypes();

        if (isSportTypesPage) {
            renderSportTypes();
            setupEventListeners();
            return;
        }

        await loadComplexes();
        setupEventListeners();
    })();
}

async function loadComplexes() {
    // Try to load from cache first
    const cachedComplexes = sessionStorage.getItem('cached_complexes');
    if (cachedComplexes) {
        try {
            complexes = JSON.parse(cachedComplexes);
        } catch (e) {
            console.error('Error parsing cached complexes:', e);
            sessionStorage.removeItem('cached_complexes');
        }
    }

    // Populate UI immediately if we have cache
    const selector = document.getElementById('complexSelect');
    if (selector && complexes.length > 0) {
        populateComplexSelector(selector);
        // Restore selection
        const storedId = sessionStorage.getItem('selected_complex_id');
        if (storedId && complexes.find(c => c.id === storedId)) {
            // Don't await here to unblock UI
            selectComplex(storedId);
        } else {
            selectComplex(complexes[0].id);
        }
    }

    // Fetch fresh data
    const { data: complexesData, error } = await supabaseClient
        .from('complexes')
        .select('*')
        .eq('owner_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading complexes:', error);
        return;
    }

    // Update cache if data changed
    const newComplexes = complexesData || [];
    if (JSON.stringify(newComplexes) !== JSON.stringify(complexes)) {
        complexes = newComplexes;
        sessionStorage.setItem('cached_complexes', JSON.stringify(complexes));

        // Re-populate if selector exists (it might have been missing earlier)
        const currentSelector = document.getElementById('complexSelect');
        if (currentSelector) {
            populateComplexSelector(currentSelector);

            // If we didn't have data before, initialize now
            if (!currentComplexId && complexes.length > 0) {
                const storedId = sessionStorage.getItem('selected_complex_id');
                const idToSelect = (storedId && complexes.find(c => c.id === storedId)) ? storedId : complexes[0].id;
                selectComplex(idToSelect);
            }
        }
    }
}

function populateComplexSelector(selector) {
    if (!selector) {
        console.warn('Complex selector element not found');
        return;
    }
    if (complexes.length === 0) {
        selector.innerHTML = '<option value="">Aucun complexe trouvé</option>';
        const noComplexesMsg = document.getElementById('noComplexesMessage');
        if (noComplexesMsg) noComplexesMsg.classList.remove('hidden');

        ['statsSection', 'chartsSection', 'analyticsSection', 'patternsSection', 'managementSection'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el?.classList.add('hidden');
        });
        return;
    }

    document.getElementById('noComplexesMessage')?.classList.add('hidden');
    selector.innerHTML = complexes.map(c =>
        `<option value="${c.id}">${c.name || c.Name}</option>`
    ).join('');

    // Ensure listener is attached (once)
    if (!selector.dataset.listenerAttached) {
        selector.addEventListener('change', (e) => {
            selectComplex(e.target.value);
        });
        selector.dataset.listenerAttached = 'true';
    }
}

async function loadSportTypes() {
    if (!currentUser?.id) return;
    try {
        const { data, error } = await supabaseClient
            .from('sport_types')
            .select('*')
            .eq('owner_id', currentUser.id)
            .order('name');
        if (error) throw error;
        sportTypes = data || [];
    } catch (e) {
        console.error('Error loading sport types:', e);
        sportTypes = [];
    }
}

function renderSportTypes() {
    const list = document.getElementById('sportTypesList');
    const section = document.getElementById('sportTypesSection');
    const empty = document.getElementById('sportTypesEmpty');
    if (!list) return;
    if (sportTypes.length === 0) {
        section?.classList.add('hidden');
        empty?.classList.remove('hidden');
        return;
    }
    empty?.classList.add('hidden');
    section?.classList.remove('hidden');
    list.innerHTML = sportTypes.map(st => `
        <tr class="hover:bg-white/5">
            <td class="px-6 py-4 font-medium text-white">${(st.name || '').replace(/</g, '&lt;')}</td>
            <td class="px-6 py-4 text-slate-400">${st.match_duration} min</td>
            <td class="px-6 py-4 text-slate-400">${st.buffer_minutes} min</td>
            <td class="px-6 py-4 text-right">
                <button type="button" onclick="editSportType('${st.id}')" class="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Edit"><span class="material-symbols-outlined text-sm">edit</span></button>
                <button type="button" onclick="deleteSportType('${st.id}')" class="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Delete"><span class="material-symbols-outlined text-sm">delete</span></button>
            </td>
        </tr>
    `).join('');
}

function populatePitchSlotConfig() {
    const sel = document.getElementById('pitchSlotConfig');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Custom —</option>' + (sportTypes || []).map(st =>
        '<option value="' + st.id + '" data-duration="' + (st.match_duration || 75) + '" data-name="' + (String(st.name || '')).replace(/"/g, '&quot;') + '">' + (st.name || '') + ' (' + (st.match_duration || 75) + ' min)</option>'
    ).join('');
}

function applyPitchSlotConfigState() {
    const sel = document.getElementById('pitchSlotConfig');
    const dur = document.getElementById('pitchDuration');
    if (!sel || !dur) return;
    const v = sel.value;
    if (v) {
        const opt = sel.selectedOptions && sel.selectedOptions[0];
        const d = opt ? (parseInt(opt.getAttribute('data-duration'), 10) || 75) : 75;
        dur.value = d;
        dur.disabled = true;
    } else {
        dur.disabled = false;
        if (dur.value === '' || dur.value == null) dur.value = 75;
    }
}

function editSportType(id) {
    const st = sportTypes.find(s => s.id === id);
    if (!st) return;
    document.getElementById('sportTypeModalTitle').textContent = 'Modifier le Type de Sport';
    document.getElementById('sportTypeId').value = id;
    document.getElementById('sportTypeName').value = st.name || '';
    document.getElementById('sportTypeDuration').value = st.match_duration ?? 60;
    document.getElementById('sportTypeBuffer').value = st.buffer_minutes ?? 15;
    document.getElementById('sportTypeModal').classList.remove('hidden');
}

async function deleteSportType(id) {
    if (!confirm('Supprimer ce type de sport ? Les terrains l\'utilisant conserveront leurs paramètres de créneaux actuels (vous pourrez attribuer un type différent plus tard).')) return;
    const token = sessionStorage.getItem('owner_token');
    if (!token) return;
    try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/manage-sport-type`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ id, owner_token: token })
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Échec de la suppression');
        await loadSportTypes();
        renderSportTypes();
        closeModal('sportTypeModal');
    } catch (e) {
        alert('Échec de la suppression : ' + (e.message || e));
    }
}

async function selectComplex(complexId) {
    if (!complexId) return;

    currentComplexId = complexId;
    currentComplex = complexes.find(c => c.id === complexId);
    sessionStorage.setItem('selected_complex_id', complexId);

    // Update selector value visually if needed (e.g. if driven by code)
    const selector = document.getElementById('complexSelect');
    if (selector && selector.value !== complexId) {
        selector.value = complexId;
    }

    // Determine current page
    const path = window.location.pathname;
    const isDashboard = path.endsWith('dashboard.html') || path === '/' || path.endsWith('/');
    const isComplexes = path.endsWith('complexes.html');
    const isBookings = path.endsWith('bookings.html');

    // Show/Hide sections immediately
    if (isDashboard) {
        ['statsSection', 'chartsSection', 'analyticsSection', 'patternsSection'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el?.classList.remove('hidden');
        });
    }

    if (isComplexes || isBookings) {
        const mgmt = document.getElementById('managementSection');
        if (mgmt) mgmt.classList.remove('hidden');

        // Ensure correct tab is active (legacy support, mainly used for container visibility)
        if (isComplexes) {
            document.getElementById('complexTab')?.classList.remove('hidden');
            document.getElementById('pitchesTab')?.classList.add('hidden');
        }
        if (isBookings) {
            document.getElementById('bookingsTab')?.classList.remove('hidden');
        }
    }

    // Load Data safely in background
    // We await this only if we want to block specific inner content rendering, 
    // but the main page structure is already shown.
    await loadComplexData();

    // Page specific renders
    if (isComplexes) {
        // Render simple details immediately if available
        renderComplexDetails();
        renderPitches();
    } else if (isBookings) {
        renderBookings();
    } else {
        // Dashboard
        renderComplexDetails(); // Updates stats
    }
}

async function loadComplexData() {
    if (!currentComplexId) return;

    // Load bookings
    const { data: pitchesData } = await supabaseClient
        .from('pitches')
        .select('id')
        .eq('complex_id', currentComplexId);

    if (pitchesData && pitchesData.length > 0) {
        const pitchIds = pitchesData.map(p => p.id);
        const { data: bookingsData } = await supabaseClient
            .from('bookings')
            .select('*, user_profiles(*), pitches(*, complexes(*))')
            .in('pitch_id', pitchIds)
            .order('start_time', { ascending: false });

        bookings = bookingsData || [];
    } else {
        bookings = [];
    }

    // Load pitches
    const { data: pitchesData2 } = await supabaseClient
        .from('pitches')
        .select('*, complexes(*)')
        .eq('complex_id', currentComplexId);

    pitches = pitchesData2 || [];

    updateStats();
    updateCharts();
    if (typeof updateAdvancedCharts === 'function') {
        updateAdvancedCharts();
    }
    renderBookings();
    renderPitches();
}

function renderComplexDetails() {
    if (!currentComplex) return;

    const container = document.getElementById('complexDetails');
    if (!container) {
        console.warn('complexDetails element not found - might be on wrong page');
        return;
    }

    // Handle main image - ensure it's a string
    let mainImage = '';
    if (currentComplex.main_image && typeof currentComplex.main_image === 'string') {
        mainImage = currentComplex.main_image;
    } else if (Array.isArray(currentComplex.images) && currentComplex.images.length > 0) {
        mainImage = currentComplex.images[0];
    }

    // Handle gallery - parse from images column (comma-separated string or array)
    let gallery = [];
    if (currentComplex.images) {
        gallery = typeof currentComplex.images === 'string'
            ? currentComplex.images.split(',').map(s => s.trim()).filter(s => s.length > 0)
            : (Array.isArray(currentComplex.images) ? currentComplex.images : []);
    }

    // Filter out invalid values
    gallery = gallery.filter(img => img && typeof img === 'string' && img.trim().length > 0);

    container.innerHTML = `
        <div class="grid md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-lg font-semibold text-slate-300 mb-2">Nom</h3>
                <p class="text-white">${currentComplex.name || currentComplex.Name || 'N/A'}</p>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-slate-300 mb-2">Adresse</h3>
                <p class="text-white">${currentComplex.address || 'N/A'}</p>
            </div>
            <div class="md:col-span-2">
                <h3 class="text-lg font-semibold text-slate-300 mb-2">Description</h3>
                <p class="text-white">${currentComplex.description || 'Pas de description'}</p>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-slate-300 mb-2">Téléphone</h3>
                <p class="text-white">${currentComplex.phone || 'N/A'}</p>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-slate-300 mb-2">Email</h3>
                <p class="text-white">${currentComplex.email || 'N/A'}</p>
            </div>
            ${mainImage ? `
            <div class="md:col-span-2">
                <h3 class="text-lg font-semibold text-slate-300 mb-2">Image Principale</h3>
                <img src="${mainImage}" alt="Image Principale" class="w-full h-64 object-cover rounded-xl border border-slate-700" onerror="this.style.display='none'"/>
            </div>
            ` : ''}
            ${gallery.length > 0 ? `
            <div class="md:col-span-2">
                <h3 class="text-lg font-semibold text-slate-300 mb-2">Galerie</h3>
                <div class="grid grid-cols-3 gap-2">
                    ${gallery.map(img => `<img src="${img}" alt="Galerie" class="w-full h-32 object-cover rounded-xl border border-slate-700" onerror="this.style.display='none'"/>`).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

function updateStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalRevenue = bookings
        .filter(b => b.status === 'approved')
        .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);

    const monthlyBookings = bookings.filter(b => {
        const bookingDate = new Date(b.start_time);
        return bookingDate >= startOfMonth && b.status === 'approved';
    });

    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);

    const pending = bookings.filter(b =>
        b.status === 'pending' || b.status === 'cancel_request'
    ).length;

    // Animated number ticker helper
    function animateNumber(element, targetValue, suffix = '', duration = 1500) {
        if (!element) return;
        const startValue = parseFloat(element.textContent.replace(/[^0-9.]/g, '')) || 0;
        const endValue = parseFloat(targetValue) || 0;
        if (isNaN(endValue)) return;

        const startTime = performance.now();
        const isDecimal = endValue % 1 !== 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = startValue + (endValue - startValue) * easeOutQuart;

            if (isDecimal) {
                element.textContent = current.toFixed(1) + suffix;
            } else {
                element.textContent = Math.floor(current).toLocaleString() + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = isDecimal ? endValue.toFixed(1) + suffix : endValue.toLocaleString() + suffix;
            }
        }
        requestAnimationFrame(update);
    }

    const elTotalRevenue = document.getElementById('totalRevenue');
    if (elTotalRevenue) animateNumber(elTotalRevenue, totalRevenue, '');

    const elMonthlyRevenue = document.getElementById('monthlyRevenue');
    if (elMonthlyRevenue) animateNumber(elMonthlyRevenue, monthlyRevenue, '');

    const elMonthlyBookings = document.getElementById('monthlyBookings');
    if (elMonthlyBookings) animateNumber(elMonthlyBookings, monthlyBookings.length, '');

    const elPendingRequests = document.getElementById('pendingRequests');
    if (elPendingRequests) animateNumber(elPendingRequests, pending, '');

    // Calculate Average Booking Value
    const avgBookingValue = monthlyBookings.length > 0
        ? (monthlyRevenue / monthlyBookings.length).toFixed(2)
        : 0;
    const elAvgBooking = document.getElementById('avgBookingValue');
    if (elAvgBooking) animateNumber(elAvgBooking, parseFloat(avgBookingValue), '');

    // Calculate Occupancy Rate
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const totalSlotsAvailable = pitches.length * daysInMonth * 60;
    const occupancyRate = totalSlotsAvailable > 0
        ? ((monthlyBookings.length / totalSlotsAvailable) * 100).toFixed(1)
        : 0;
    const elOccupancy = document.getElementById('occupancyRate');
    if (elOccupancy) animateNumber(elOccupancy, parseFloat(occupancyRate), '%');
}

function updateCharts() {
    // Revenue Chart (last 6 months)
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthBookings = bookings.filter(b => {
            const bookingDate = new Date(b.start_time);
            return bookingDate >= monthStart && bookingDate <= monthEnd && b.status === 'approved';
        });

        return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            revenue: monthBookings.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0)
        };
    }).reverse();

    const revenueCtx = document.getElementById('revenueChart');
    if (!revenueCtx) return; // Charts not present on this page

    if (revenueChart) {
        revenueChart.destroy();
        revenueChart = null;
    }

    if (revenueCtx) {
        revenueChart = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [{
                    label: 'Revenu (TND)',
                    data: monthlyData.map(d => d.revenue),
                    borderColor: '#D9FF66',
                    backgroundColor: 'rgba(217, 255, 102, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        });
    }

    // Status Chart
    const statusCounts = {
        approved: bookings.filter(b => b.status === 'approved').length,
        pending: bookings.filter(b => b.status === 'pending').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        cancel_request: bookings.filter(b => b.status === 'cancel_request').length
    };

    if (statusChart) {
        statusChart.destroy();
        statusChart = null;
    }
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Approuvé', 'En attente', 'Annulé', 'Demande d\'annulation'],
                datasets: [{
                    data: [statusCounts.approved, statusCounts.pending, statusCounts.cancelled, statusCounts.cancel_request],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#f97316']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
}

function renderBookings(filter = 'all') {
    const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
    const container = document.getElementById('bookingsList');
    if (!container) return; // Guard clause if element doesn't exist

    if (filtered.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                    <span class="material-symbols-outlined text-4xl mb-2">event_busy</span>
                    <p>Aucune réservation trouvée pour ce filtre.</p>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = filtered.map(booking => {
        const pitch = booking.pitches || booking.pitch;
        const user = booking.user_profiles || booking.user;
        const startDate = new Date(booking.start_time);

        let actions = '';
        if (booking.status === 'pending') {
            actions = `
                <button onclick="updateBookingStatus('${booking.id}', 'approved')" class="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors mr-1" title="Approve">
                    <span class="material-symbols-outlined text-sm">check</span>
                </button>
                <button onclick="updateBookingStatus('${booking.id}', 'rejected')" class="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors" title="Reject">
                    <span class="material-symbols-outlined text-sm">close</span>
                </button>
            `;
        } else if (booking.status === 'cancel_request') {
            actions = `
                <button onclick="updateBookingStatus('${booking.id}', 'cancelled')" class="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors mr-1" title="Approve Cancel">
                    <span class="material-symbols-outlined text-sm">check</span>
                </button>
                <button onclick="updateBookingStatus('${booking.id}', 'approved')" class="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors" title="Reject Cancel">
                    <span class="material-symbols-outlined text-sm">undo</span>
                </button>
            `;
        }

        const statusColors = {
            'approved': 'bg-green-500/20 text-green-400',
            'pending': 'bg-yellow-500/20 text-yellow-400',
            'cancelled': 'bg-red-500/20 text-red-400',
            'rejected': 'bg-red-500/20 text-red-400',
            'cancel_request': 'bg-orange-500/20 text-orange-400'
        };

        const statusLabels = {
            'approved': 'Approuvé',
            'pending': 'En attente',
            'cancelled': 'Annulé',
            'rejected': 'Rejeté',
            'cancel_request': 'Demande d\'annulation'
        };

        return `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex flex-col">
                        <span class="text-white font-medium">${startDate.toLocaleDateString()}</span>
                        <span class="text-xs text-slate-500">${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-slate-300">${pitch?.name || 'Inconnu'}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                         <div class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                            ${(user?.name || '?').charAt(0)}
                        </div>
                        <span class="text-slate-300 text-sm">${user?.name || 'Inconnu'}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-slate-400 font-mono text-xs">${user?.phone || 'N/A'}</td>
                <td class="px-6 py-4 text-primary font-mono">${booking.total_price || 0} TND</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${statusColors[booking.status] || 'bg-slate-700 text-slate-300'}">
                        ${statusLabels[booking.status] || booking.status}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end">
                        ${actions}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPitches() {
    const container = document.getElementById('pitchesList');
    if (!container) return;

    if (pitches.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                    <span class="material-symbols-outlined text-4xl mb-2">sports_soccer</span>
                    <p>Aucun terrain trouvé. Ajoutez votre premier terrain !</p>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = pitches.map(pitch => {
        // Handle image array
        let pitchImage = '';
        if (Array.isArray(pitch.image) && pitch.image.length > 0) {
            pitchImage = pitch.image[0];
        } else if (typeof pitch.image === 'string') {
            pitchImage = pitch.image;
        }

        const status = pitch.status || 'active';
        const statusColors = {
            'active': 'bg-green-500/20 text-green-400',
            'maintenance': 'bg-yellow-500/20 text-yellow-400',
            'closed': 'bg-red-500/20 text-red-400'
        };

        const statusLabels = {
            'active': 'Actif',
            'maintenance': 'Entretien',
            'closed': 'Fermé'
        };

        return `
            <tr class="hover:bg-white/5 transition-colors group">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                            ${pitchImage ?
                `<img src="${pitchImage}" class="w-full h-full object-cover">` :
                `<span class="material-symbols-outlined text-slate-500">sports_soccer</span>`
            }
                        </div>
                        <span class="font-bold text-white">${pitch.name || pitch.Name}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-slate-400">${pitch.type || 'Football'}</td>
                <td class="px-6 py-4 text-slate-400">${pitch.surface || 'Pelouse'}</td>
                <td class="px-6 py-4 text-white font-mono">${pitch.price_per_hour} <span class="text-xs text-slate-500">TND</span></td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${statusColors[status] || statusColors['active']}">${statusLabels[status] || 'Actif'}</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="editPitch('${pitch.id}')" class="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Edit">
                            <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                         <!-- Delete not typically immediate, maybe modal? simplifying to button for now -->
                         <button onclick="deletePitch('${pitch.id}')" class="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupEventListeners() {
    // Sport Types (sport-types.html)
    const addSportTypeBtn = document.getElementById('addSportTypeBtn');
    const addSportTypeBtnEmpty = document.getElementById('addSportTypeBtnEmpty');
    const openSportTypeModal = () => {
        document.getElementById('sportTypeModalTitle').textContent = 'Add Sport Type';
        document.getElementById('sportTypeId').value = '';
        document.getElementById('sportTypeForm').reset();
        document.getElementById('sportTypeDuration').value = 60;
        document.getElementById('sportTypeBuffer').value = 15;
        document.getElementById('sportTypeModal').classList.remove('hidden');
    };
    if (addSportTypeBtn) addSportTypeBtn.addEventListener('click', openSportTypeModal);
    if (addSportTypeBtnEmpty) addSportTypeBtnEmpty.addEventListener('click', openSportTypeModal);

    const sportTypeForm = document.getElementById('sportTypeForm');
    if (sportTypeForm) {
        sportTypeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('sportTypeId').value;
            const name = document.getElementById('sportTypeName').value.trim();
            const match_duration = parseInt(document.getElementById('sportTypeDuration').value, 10) || 60;
            const buffer_minutes = parseInt(document.getElementById('sportTypeBuffer').value, 10) || 15;
            const token = sessionStorage.getItem('owner_token');
            if (!token) return;
            const btn = sportTypeForm.querySelector('button[type="submit"]');
            const orig = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Saving...';
            try {
                const url = `${SUPABASE_URL}/functions/v1/manage-sport-type`;
                const opts = {
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY
                    }
                };
                let r;
                if (id) {
                    r = await fetch(url, { ...opts, method: 'PUT', body: JSON.stringify({ id, name, match_duration, buffer_minutes, owner_token: token }) });
                } else {
                    r = await fetch(url, { ...opts, method: 'POST', body: JSON.stringify({ name, match_duration, buffer_minutes, owner_token: token }) });
                }
                const j = await r.json();
                if (!r.ok) throw new Error(j.error || 'Save failed');
                await loadSportTypes();
                renderSportTypes();
                closeModal('sportTypeModal');
            } catch (err) {
                alert('Failed to save: ' + (err.message || err));
            } finally {
                btn.disabled = false;
                btn.textContent = orig;
            }
        });
    }

    // Complex selector
    const complexSelect = document.getElementById('complexSelect');
    if (complexSelect) {
        complexSelect.addEventListener('change', async (e) => {
            await selectComplex(e.target.value);
        });
    }

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            const tabContent = document.getElementById(tab + 'Tab');
            if (tabContent) tabContent.classList.remove('hidden');
        });
    });

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active', 'bg-primary', 'text-background-dark');
                b.classList.add('bg-card-dark', 'border', 'border-slate-800', 'text-slate-400');
            });
            btn.classList.add('active', 'bg-primary', 'text-background-dark');
            btn.classList.remove('bg-card-dark', 'border', 'border-slate-800', 'text-slate-400');

            // Update both list and calendar views
            renderBookings(filter);
            if (currentViewMode === 'calendar') {
                renderCalendarMode(filter);
            }
        });
    });

    // View Mode Toggle Buttons
    const listViewBtn = document.getElementById('listViewBtn');
    const calendarViewBtn = document.getElementById('calendarViewBtn');

    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => switchViewMode('list'));
    }

    if (calendarViewBtn) {
        calendarViewBtn.addEventListener('click', () => switchViewMode('calendar'));
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('owner_token');
            sessionStorage.removeItem('owner_id');
            sessionStorage.removeItem('owner_name');
            window.location.href = 'login.html';
        });
    }

    // Complex form
    const complexForm = document.getElementById('complexForm');
    if (complexForm) {
        complexForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = complexForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Saving...';

            try {
                const id = document.getElementById('complexId').value;
                const mainImageFile = document.getElementById('complexMainImage').files[0];
                const galleryFiles = Array.from(document.getElementById('complexGallery').files);

                // Get existing images - ensure they're arrays
                let mainImageUrl = '';
                if (currentComplex?.main_image && typeof currentComplex.main_image === 'string') {
                    mainImageUrl = currentComplex.main_image;
                }

                let galleryUrls = [];
                if (currentComplex?.images) {
                    galleryUrls = typeof currentComplex.images === 'string'
                        ? currentComplex.images.split(',').map(s => s.trim()).filter(s => s.length > 0)
                        : (Array.isArray(currentComplex.images) ? [...currentComplex.images] : []);
                }

                // Filter out invalid values
                galleryUrls = galleryUrls.filter(url => url && typeof url === 'string' && url.trim().length > 0);

                // Upload main image
                if (mainImageFile) {
                    mainImageUrl = await uploadToImageKit(mainImageFile);
                }

                // Upload gallery images
                if (galleryFiles.length > 0) {
                    const maxNew = Math.max(0, 10 - galleryUrls.length);
                    if (maxNew > 0) {
                        const uploaded = await Promise.all(
                            galleryFiles.slice(0, maxNew).map(file => uploadToImageKit(file))
                        );
                        galleryUrls = [...galleryUrls, ...uploaded.filter(url => url && url.trim().length > 0)];
                    }
                }

                // Combine main image and gallery into array for the images column
                const allImages = [];
                if (mainImageUrl) allImages.push(mainImageUrl);
                if (galleryUrls.length > 0) allImages.push(...galleryUrls);

                const data = {
                    name: document.getElementById('complexName').value,
                    address: document.getElementById('complexAddress').value,
                    description: document.getElementById('complexDescription').value,
                    phone: document.getElementById('complexPhone').value,
                    email: document.getElementById('complexEmail').value,
                    location_lat: document.getElementById('complexLatitude').value ? parseFloat(document.getElementById('complexLatitude').value) : null,
                    location_lng: document.getElementById('complexLongitude').value ? parseFloat(document.getElementById('complexLongitude').value) : null,
                    facilities: document.getElementById('complexFacilities').value ? document.getElementById('complexFacilities').value.split(',').map(f => f.trim()).filter(f => f.length > 0) : null,
                    images: allImages.length > 0 ? allImages : null
                };

                // Use Edge Function for secure updates
                const token = sessionStorage.getItem('owner_token');
                if (!token) {
                    throw new Error('No authentication token found. Please login again.');
                }

                console.log('Sending complex update with token:', token.substring(0, 10) + '...');

                const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/update-complex`;

                if (id) {
                    // Update existing complex
                    const response = await fetch(edgeFunctionUrl, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY
                        },
                        body: JSON.stringify({ id, ...data })
                    });

                    let result;
                    try {
                        result = await response.json();
                    } catch (e) {
                        throw new Error(`Failed to parse response: ${response.status} ${response.statusText}`);
                    }

                    if (!response.ok) {
                        console.error('Complex update error:', result);
                        throw new Error(result.error || `Failed to update complex: ${response.status}`);
                    }

                    if (result.data) {
                        // Update local complex data
                        const index = complexes.findIndex(c => c.id === id);
                        if (index !== -1) {
                            complexes[index] = result.data;
                        }
                        if (currentComplexId === id) {
                            currentComplex = result.data;
                        }
                    }
                } else {
                    // Create new complex
                    const response = await fetch(edgeFunctionUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY
                        },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.error || 'Failed to create complex');
                    }

                    if (result.data) {
                        complexes.push(result.data);
                        await loadComplexes();
                        document.getElementById('complexSelect').value = result.data.id;
                        await selectComplex(result.data.id);
                    }
                }

                closeModal('complexModal');
                await loadComplexes();
                if (currentComplexId) {
                    await loadComplexData();
                    renderComplexDetails();
                }

                alert('Complex saved successfully!');
            } catch (err) {
                console.error('Error saving complex:', err);
                alert('Failed to save complex: ' + (err.message || 'Unknown error') + '\n\nCheck console for details.');
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });

        // Image previews
        document.getElementById('complexMainImage').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('complexMainImagePreview').classList.remove('hidden');
                    document.getElementById('complexMainImagePreviewImg').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('complexGallery').addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            const preview = document.getElementById('complexGalleryPreview');
            preview.innerHTML = '';
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'w-full h-24 object-cover rounded-xl border border-slate-700';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // Pitch form
    const pitchSlotConfigEl = document.getElementById('pitchSlotConfig');
    if (pitchSlotConfigEl) {
        pitchSlotConfigEl.addEventListener('change', applyPitchSlotConfigState);
    }

    const pitchForm = document.getElementById('pitchForm');
    if (pitchForm) {
        pitchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentComplexId) {
                alert('Please select a complex first');
                return;
            }

            const btn = pitchForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Saving...';

            try {
                const id = document.getElementById('pitchId').value;
                const imageFile = document.getElementById('pitchImage').files[0];

                let imageUrl = pitches.find(p => p.id === id)?.image || '';

                if (imageFile) {
                    imageUrl = await uploadToImageKit(imageFile);
                }

                const slotId = (document.getElementById('pitchSlotConfig') && document.getElementById('pitchSlotConfig').value) || '';
                let sport_type, match_duration, sport_type_id;
                if (slotId) {
                    const st = sportTypes.find(s => s.id === slotId);
                    sport_type_id = slotId;
                    sport_type = (st && st.name) || document.getElementById('pitchSportType').value;
                    match_duration = (st && st.match_duration) != null ? st.match_duration : (parseInt(document.getElementById('pitchDuration').value, 10) || 75);
                } else {
                    sport_type_id = null;
                    sport_type = document.getElementById('pitchSportType').value;
                    match_duration = parseInt(document.getElementById('pitchDuration').value, 10) || 75;
                }

                const data = {
                    name: document.getElementById('pitchName').value,
                    size: document.getElementById('pitchSize').value,
                    surface: document.getElementById('pitchSurface').value,
                    sport_type,
                    status: document.getElementById('pitchStatus').value || 'active',
                    price_per_hour: parseFloat(document.getElementById('pitchPrice').value) || 0,
                    opening_hour: parseInt(document.getElementById('pitchOpeningHour').value) || 8,
                    closing_hour: parseInt(document.getElementById('pitchClosingHour').value) || 23,
                    match_duration,
                    sport_type_id,
                    image: imageUrl || null
                };

                // Use Edge Function for secure updates
                const token = sessionStorage.getItem('owner_token');
                if (!token) {
                    throw new Error('No authentication token found. Please login again.');
                }

                console.log('Sending pitch update with token:', token.substring(0, 10) + '...');

                const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/update-pitch`;

                if (id) {
                    // Update existing pitch
                    const response = await fetch(edgeFunctionUrl, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY
                        },
                        body: JSON.stringify({ id, ...data })
                    });

                    let result;
                    try {
                        result = await response.json();
                    } catch (e) {
                        throw new Error(`Failed to parse response: ${response.status} ${response.statusText}`);
                    }

                    if (!response.ok) {
                        console.error('Pitch update error:', result);
                        throw new Error(result.error || `Failed to update pitch: ${response.status}`);
                    }

                    if (result.data) {
                        // Update local pitch data
                        const index = pitches.findIndex(p => p.id === id);
                        if (index !== -1) {
                            pitches[index] = result.data;
                        }
                    }
                } else {
                    // Create new pitch
                    const response = await fetch(edgeFunctionUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY
                        },
                        body: JSON.stringify({ ...data, complex_id: currentComplexId })
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.error || 'Failed to create pitch');
                    }

                    if (result.data) {
                        pitches.push(result.data);
                    }
                }

                closeModal('pitchModal');
                await loadComplexData();
                alert('Pitch saved successfully!');
            } catch (err) {
                console.error('Error saving pitch:', err);
                alert('Failed to save pitch: ' + (err.message || 'Unknown error') + '\n\nCheck console for details.');
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });

        // Image preview
        document.getElementById('pitchImage').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('pitchImagePreview').classList.remove('hidden');
                    document.getElementById('pitchImagePreviewImg').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Add buttons
    const addComplexBtn = document.getElementById('addComplexBtn');
    if (addComplexBtn) {
        addComplexBtn.addEventListener('click', () => {
            document.getElementById('complexModalTitle').textContent = 'Add Complex';
            document.getElementById('complexId').value = '';
            document.getElementById('complexForm').reset();
            document.getElementById('complexMainImagePreview').classList.add('hidden');
            document.getElementById('complexGalleryPreview').innerHTML = '';
            document.getElementById('complexModal').classList.remove('hidden');
        });
    }

    const editComplexBtn = document.getElementById('editComplexBtn');
    if (editComplexBtn) {
        editComplexBtn.addEventListener('click', () => {
            if (!currentComplex) return;
            editComplex(currentComplex.id);
        });
    }

    const addPitchBtn = document.getElementById('addPitchBtn');
    if (addPitchBtn) {
        addPitchBtn.addEventListener('click', async () => {
            if (!currentComplexId) {
                alert('Please select a complex first');
                return;
            }
            document.getElementById('pitchModalTitle').textContent = 'Add Pitch';
            document.getElementById('pitchId').value = '';
            document.getElementById('pitchForm').reset();
            document.getElementById('pitchStatus').value = 'active';
            document.getElementById('pitchImagePreview').classList.add('hidden');
            await loadSportTypes();
            populatePitchSlotConfig();
            const slotEl = document.getElementById('pitchSlotConfig');
            if (slotEl) { slotEl.value = ''; }
            applyPitchSlotConfigState();
            document.getElementById('pitchModal').classList.remove('hidden');
        });
    }
}

async function updateBookingStatus(bookingId, status) {
    await supabaseClient.from('bookings').update({ status }).eq('id', bookingId);
    await loadComplexData();
}

function editComplex(id) {
    const complex = complexes.find(c => c.id === id);
    if (!complex) return;

    document.getElementById('complexModalTitle').textContent = 'Edit Complex';
    document.getElementById('complexId').value = id;
    document.getElementById('complexName').value = complex.name || complex.Name || '';
    document.getElementById('complexAddress').value = complex.address || '';
    document.getElementById('complexDescription').value = complex.description || '';
    document.getElementById('complexPhone').value = complex.phone || '';
    document.getElementById('complexEmail').value = complex.email || '';
    document.getElementById('complexLatitude').value = complex.location_lat || '';
    document.getElementById('complexLongitude').value = complex.location_lng || '';

    // Handle facilities - convert array to comma-separated string
    if (complex.facilities) {
        const facilitiesStr = Array.isArray(complex.facilities)
            ? complex.facilities.join(', ')
            : (typeof complex.facilities === 'string' ? complex.facilities : '');
        document.getElementById('complexFacilities').value = facilitiesStr;
    } else {
        document.getElementById('complexFacilities').value = '';
    }

    // Show existing images - extract first image from comma-separated string or array
    let mainImg = null;
    if (complex.images) {
        if (typeof complex.images === 'string') {
            const imageArray = complex.images.split(',').map(s => s.trim()).filter(s => s.length > 0);
            mainImg = imageArray.length > 0 ? imageArray[0] : null;
        } else if (Array.isArray(complex.images) && complex.images.length > 0) {
            mainImg = complex.images[0];
        }
    }

    if (mainImg) {
        document.getElementById('complexMainImagePreview').classList.remove('hidden');
        document.getElementById('complexMainImagePreviewImg').src = mainImg;
    } else {
        document.getElementById('complexMainImagePreview').classList.add('hidden');
    }

    // Handle gallery/images - parse from comma-separated string or array
    let gallery = [];
    if (complex.images) {
        gallery = typeof complex.images === 'string'
            ? complex.images.split(',').map(s => s.trim()).filter(s => s.length > 0)
            : (Array.isArray(complex.images) ? complex.images : []);
    }

    // Filter out null/undefined/empty values
    gallery = gallery.filter(img => img && typeof img === 'string' && img.trim().length > 0);

    const preview = document.getElementById('complexGalleryPreview');
    preview.innerHTML = '';
    if (gallery.length > 0) {
        gallery.forEach(img => {
            if (img && typeof img === 'string') {
                const imgEl = document.createElement('img');
                imgEl.src = img;
                imgEl.className = 'w-full h-24 object-cover rounded-xl border border-slate-700';
                imgEl.onerror = function () {
                    this.style.display = 'none';
                };
                preview.appendChild(imgEl);
            }
        });
    }

    document.getElementById('complexModal').classList.remove('hidden');
}

async function editPitch(id) {
    const pitch = pitches.find(p => p.id === id);
    if (!pitch) return;

    document.getElementById('pitchModalTitle').textContent = 'Edit Pitch';
    document.getElementById('pitchId').value = id;
    document.getElementById('pitchName').value = pitch.name || pitch.Name || '';
    document.getElementById('pitchSize').value = pitch.size || pitch.Size || '11 a side';
    document.getElementById('pitchSurface').value = pitch.surface || 'Grass';
    document.getElementById('pitchSportType').value = pitch.sport_type || 'Football';
    document.getElementById('pitchStatus').value = pitch.status || 'active';
    document.getElementById('pitchPrice').value = pitch.price_per_hour || 0;
    document.getElementById('pitchOpeningHour').value = pitch.opening_hour || 8;
    document.getElementById('pitchClosingHour').value = pitch.closing_hour || 23;
    document.getElementById('pitchDuration').value = pitch.match_duration || 75;

    await loadSportTypes();
    populatePitchSlotConfig();
    const slotEl = document.getElementById('pitchSlotConfig');
    if (slotEl) {
        slotEl.value = pitch.sport_type_id || '';
        // If no sport_type_id but pitch has sport_type text (e.g. "Football"), preselect matching sport type
        if (!pitch.sport_type_id && pitch.sport_type && sportTypes.length) {
            const byName = sportTypes.find(st => (st.name || '').toLowerCase() === (pitch.sport_type || '').toLowerCase());
            if (byName) slotEl.value = byName.id;
        }
    }
    applyPitchSlotConfigState();

    // When pitch loads from a sport type (sport_type_id), set Sport type dropdown from the sport type's name
    if (pitch.sport_type_id && sportTypes.length) {
        const st = sportTypes.find(s => s.id === pitch.sport_type_id);
        const sportTypeOpts = ['Football', 'Padel', 'Basketball', 'Tennis'];
        if (st && (st.name || '').trim()) {
            const opt = sportTypeOpts.find(o => o.toLowerCase() === (st.name || '').toLowerCase().trim());
            if (opt) document.getElementById('pitchSportType').value = opt;
        }
    }

    if (pitch.image) {
        document.getElementById('pitchImagePreview').classList.remove('hidden');
        document.getElementById('pitchImagePreviewImg').src = pitch.image;
    } else {
        document.getElementById('pitchImagePreview').classList.add('hidden');
    }

    document.getElementById('pitchModal').classList.remove('hidden');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}

// Global chart variables for new charts
let pitchPerformanceChart = null;
let peakHoursChart = null;
let weeklyPatternChart = null;
let revenueBreakdownChart = null;

function updateAdvancedCharts() {
    // Pitch Performance Chart
    const pitchStats = pitches.map(pitch => {
        const pitchBookings = bookings.filter(b => b.pitch_id === pitch.id && b.status === 'approved');
        const revenue = pitchBookings.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);
        return {
            name: pitch.name,
            bookings: pitchBookings.length,
            revenue: revenue
        };
    });

    if (pitchPerformanceChart) {
        pitchPerformanceChart.destroy();
        pitchPerformanceChart = null;
    }
    const pitchPerfCtx = document.getElementById('pitchPerformanceChart');
    if (pitchPerfCtx) {
        pitchPerformanceChart = new Chart(pitchPerfCtx, {
            type: 'bar',
            data: {
                labels: pitchStats.map(p => p.name),
                datasets: [{
                    label: 'Revenue (TND)',
                    data: pitchStats.map(p => p.revenue),
                    backgroundColor: 'rgba(217, 255, 102, 0.8)',
                    borderColor: '#D9FF66',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        });
    }

    // Peak Hours Chart
    const hourlyBookings = Array.from({ length: 24 }, (_, hour) => {
        const count = bookings.filter(b => {
            const bookingHour = new Date(b.start_time).getHours();
            return bookingHour === hour && b.status === 'approved';
        }).length;
        return { hour, count };
    });

    if (peakHoursChart) {
        peakHoursChart.destroy();
        peakHoursChart = null;
    }
    const peakHoursCtx = document.getElementById('peakHoursChart');
    if (peakHoursCtx) {
        peakHoursChart = new Chart(peakHoursCtx, {
            type: 'bar',
            data: {
                labels: hourlyBookings.map(h => `${h.hour}:00`),
                datasets: [{
                    label: 'Bookings',
                    data: hourlyBookings.map(h => h.count),
                    backgroundColor: hourlyBookings.map(h =>
                        h.count > 0 ? 'rgba(217, 255, 102, 0.8)' : 'rgba(148, 163, 184, 0.2)'
                    ),
                    borderColor: '#D9FF66',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8', stepSize: 1 },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        });
    }

    // Weekly Pattern Chart
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyData = daysOfWeek.map((day, index) => {
        const count = bookings.filter(b => {
            const bookingDay = new Date(b.start_time).getDay();
            return bookingDay === index && b.status === 'approved';
        }).length;
        return count;
    });

    if (weeklyPatternChart) {
        weeklyPatternChart.destroy();
        weeklyPatternChart = null;
    }
    const weeklyPatternCtx = document.getElementById('weeklyPatternChart');
    if (weeklyPatternCtx) {
        weeklyPatternChart = new Chart(weeklyPatternCtx, {
            type: 'line',
            data: {
                labels: daysOfWeek,
                datasets: [{
                    label: 'Bookings',
                    data: weeklyData,
                    borderColor: '#D9FF66',
                    backgroundColor: 'rgba(217, 255, 102, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8', stepSize: 1 },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        });
    }

    // Revenue Breakdown by Sport Type
    const sportRevenue = {};
    pitches.forEach(pitch => {
        const sport = pitch.sport_type || 'Football';
        const pitchBookings = bookings.filter(b => b.pitch_id === pitch.id && b.status === 'approved');
        const revenue = pitchBookings.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);
        sportRevenue[sport] = (sportRevenue[sport] || 0) + revenue;
    });

    const sports = Object.keys(sportRevenue);
    const revenues = Object.values(sportRevenue);

    if (revenueBreakdownChart) {
        revenueBreakdownChart.destroy();
        revenueBreakdownChart = null;
    }
    const revenueBreakdownCtx = document.getElementById('revenueBreakdownChart');
    if (revenueBreakdownCtx) {
        revenueBreakdownChart = new Chart(revenueBreakdownCtx, {
            type: 'doughnut',
            data: {
                labels: sports,
                datasets: [{
                    data: revenues,
                    backgroundColor: [
                        '#D9FF66',
                        '#10b981',
                        '#3b82f6',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
}

// ===== CALENDAR VIEW FOR BOOKINGS =====
let calendar = null;
let currentViewMode = 'list'; // 'list' or 'calendar'

function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl || calendar) return; // Already initialized or element doesn't exist

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        height: 650, // Fixed height for no scrolling
        contentHeight: 600,
        expandRows: true, // Fill available height
        dayMaxEvents: 3, // Limit events shown per day, rest in "+more" link
        moreLinkClick: 'popover', // Show overflow events in popover
        events: [],
        eventClick: function (info) {
            const booking = info.event.extendedProps.booking;
            if (booking) {
                showBookingDetails(booking);
            }
        },
        eventDidMount: function (info) {
            // Apply custom styling based on status
            const status = info.event.extendedProps.status;
            info.el.style.borderLeft = '3px solid';

            if (status === 'approved') {
                info.el.style.borderLeftColor = '#10b981';
                info.el.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            } else if (status === 'pending') {
                info.el.style.borderLeftColor = '#f59e0b';
                info.el.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
            } else if (status === 'cancelled' || status === 'rejected') {
                info.el.style.borderLeftColor = '#ef4444';
                info.el.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            } else if (status === 'cancel_request') {
                info.el.style.borderLeftColor = '#f97316';
                info.el.style.backgroundColor = 'rgba(249, 115, 22, 0.2)';
            }
        }
    });

    calendar.render();
    applyCalendarStyling();
}

function applyCalendarStyling() {
    // Custom CSS for dark theme - compact version
    const style = document.createElement('style');
    style.textContent = `
        /* FullCalendar Dark Theme Customization - Compact */
        .fc {
            --fc-border-color: #1e293b;
            --fc-button-bg-color: #0D111D;
            --fc-button-border-color: #334155;
            --fc-button-hover-bg-color: #1e293b;
            --fc-button-hover-border-color: #475569;
            --fc-button-active-bg-color: #D9FF66;
            --fc-button-active-border-color: #D9FF66;
            --fc-today-bg-color: rgba(217, 255, 102, 0.08);
        }
        
        .fc .fc-button-primary {
            background-color: #0D111D !important;
            border-color: #334155 !important;
            color: #94a3b8 !important;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.05em;
            padding: 6px 12px;
        }
        
        .fc .fc-button-primary:hover {
            background-color: #1e293b !important;
            border-color: #475569 !important;
            color: #fff !important;
        }
        
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
            background-color: #D9FF66 !important;
            border-color: #D9FF66 !important;
            color: #05080F !important;
        }
        
        .fc .fc-toolbar {
            margin-bottom: 12px !important;
        }
        
        .fc .fc-toolbar-title {
            color: #fff;
            font-weight: 700;
            font-size: 1.1rem;
        }
        
        .fc .fc-col-header-cell {
            background-color: #0D111D;
            border-color: #1e293b;
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.1em;
            padding: 8px 4px;
        }
        
        .fc .fc-daygrid-day {
            background-color: #080B14;
            border-color: #1e293b;
        }
        
        .fc .fc-daygrid-day:hover {
            background-color: #0D111D;
        }
        
        .fc .fc-daygrid-day-frame {
            min-height: 80px;
        }
        
        .fc .fc-daygrid-day-number {
            color: #94a3b8;
            font-weight: 600;
            padding: 4px 6px;
            font-size: 11px;
        }
        
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
            color: #D9FF66;
            font-weight: 800;
            background-color: rgba(217, 255, 102, 0.15);
            border-radius: 4px;
        }
        
        .fc .fc-event {
            border-radius: 4px;
            padding: 2px 6px;
            margin: 1px 2px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
            line-height: 1.3;
        }
        
        .fc .fc-event:hover {
            transform: scale(1.02);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 10;
        }
        
        .fc .fc-event-title {
            color: #fff;
            font-size: 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .fc .fc-event-time {
            color: rgba(255, 255, 255, 0.8);
            font-size: 9px;
        }
        
        .fc .fc-daygrid-event-harness {
            margin-top: 1px;
        }
        
        .fc .fc-daygrid-more-link {
            color: #D9FF66;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 4px;
            margin: 2px;
        }
        
        .fc .fc-daygrid-more-link:hover {
            background-color: rgba(217, 255, 102, 0.1);
            border-radius: 3px;
        }
        
        .fc .fc-timegrid-slot {
            height: 2.5em;
            border-color: #1e293b;
        }
        
        .fc .fc-timegrid-slot-label {
            color: #64748b;
            font-size: 10px;
            padding: 0 4px;
        }
        
        .fc .fc-scrollgrid {
            border-color: #1e293b;
        }
        
        .fc .fc-popover {
            background-color: #0D111D;
            border: 1px solid #334155;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        
        .fc .fc-popover-header {
            background-color: #1e293b;
            color: #fff;
            padding: 8px 12px;
        }
        
        .fc .fc-popover-body {
            padding: 8px;
        }
        
        /* View mode toggle styling */
        .view-mode-btn {
            color: #64748b;
        }
        
        .view-mode-btn.active {
            background-color: #D9FF66;
            color: #05080F;
        }
        
        .view-mode-btn:not(.active):hover {
            background-color: rgba(148, 163, 184, 0.1);
            color: #fff;
        }
        
        /* Optimize calendar container */
        #calendarView {
            max-height: 700px;
            overflow: visible;
        }
    `;
    document.head.appendChild(style);
}

function renderCalendarMode(filter = 'all') {
    if (!calendar) {
        initializeCalendar();
    }

    const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

    const events = filtered.map(booking => {
        const pitch = booking.pitches || booking.pitch;
        const user = booking.user_profiles || booking.user;
        const startTime = new Date(booking.start_time);
        const endTime = new Date(booking.end_time);

        let color = '#10b981'; // approved - green
        if (booking.status === 'pending') color = '#f59e0b'; // yellow
        else if (booking.status === 'cancelled' || booking.status === 'rejected') color = '#ef4444'; // red
        else if (booking.status === 'cancel_request') color = '#f97316'; // orange

        return {
            title: `${pitch?.name || 'Unknown'} - ${user?.name || 'Unknown'}`,
            start: startTime,
            end: endTime,
            backgroundColor: color,
            borderColor: color,
            extendedProps: {
                booking: booking,
                status: booking.status,
                pitch: pitch,
                user: user
            }
        };
    });

    calendar.removeAllEvents();
    calendar.addEventSource(events);
}

function showBookingDetails(booking) {
    const pitch = booking.pitches || booking.pitch;
    const user = booking.user_profiles || booking.user;
    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);

    const statusColors = {
        'approved': 'green',
        'pending': 'yellow',
        'cancelled': 'red',
        'rejected': 'red',
        'cancel_request': 'orange'
    };

    const details = `
📅 Booking Details

Date: ${startDate.toLocaleDateString()}
Time: ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
Pitch: ${pitch?.name || 'Unknown'}
Customer: ${user?.name || 'Unknown'}
Phone: ${user?.phone || 'N/A'}
Price: ${booking.total_price || 0} TND
Status: ${booking.status}
    `.trim();

    alert(details);
}

function switchViewMode(mode) {
    currentViewMode = mode;
    const listView = document.getElementById('listView');
    const calendarView = document.getElementById('calendarView');
    const listBtn = document.getElementById('listViewBtn');
    const calendarBtn = document.getElementById('calendarViewBtn');

    if (mode === 'list') {
        listView?.classList.remove('hidden');
        calendarView?.classList.add('hidden');
        listBtn?.classList.add('active');
        calendarBtn?.classList.remove('active');
    } else {
        listView?.classList.add('hidden');
        calendarView?.classList.remove('hidden');
        listBtn?.classList.remove('active');
        calendarBtn?.classList.add('active');

        // Initialize calendar if needed and render current bookings
        if (!calendar) {
            initializeCalendar();
        }

        // Get current filter
        const activeFilter = document.querySelector('.filter-btn.active');
        const filter = activeFilter ? activeFilter.dataset.filter : 'all';
        renderCalendarMode(filter);
    }
}
