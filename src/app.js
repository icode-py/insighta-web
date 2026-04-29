const API_URL = 'https://insighta-backend-production-89e8.up.railway.app';
let currentPage = 1;

// Check if user is logged in (has cookies)
async function checkAuth() {
    try {
        const res = await fetch(`${API_URL}/auth/whoami`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            document.getElementById('user-info').textContent = `@${data.data.username} (${data.data.role})`;
            showPage('dashboard');
            loadDashboard();
            return true;
        }
    } catch (e) { }
    showPage('login');
    return false;
}

function login() {
    window.location.href = `${API_URL}/auth/github`;
}

async function logout() {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    showPage('login');
}

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const pageMap = {
        'login': 'login-page',
        'dashboard': 'dashboard-page',
        'profiles': 'profiles-page',
        'search': 'search-page'
    };
    document.getElementById(pageMap[page]).style.display = 'block';

    if (page === 'dashboard') loadDashboard();
    if (page === 'profiles') loadProfiles();
}

async function loadDashboard() {
    try {
        const [totalRes, maleRes, femaleRes] = await Promise.all([
            fetch(`${API_URL}/api/profiles?limit=1`, { headers: { 'X-API-Version': '1' }, credentials: 'include' }),
            fetch(`${API_URL}/api/profiles?gender=male&limit=1`, { headers: { 'X-API-Version': '1' }, credentials: 'include' }),
            fetch(`${API_URL}/api/profiles?gender=female&limit=1`, { headers: { 'X-API-Version': '1' }, credentials: 'include' })
        ]);

        const total = await totalRes.json();
        const male = await maleRes.json();
        const female = await femaleRes.json();

        document.getElementById('total-profiles').textContent = total.total;
        document.getElementById('total-male').textContent = male.total;
        document.getElementById('total-female').textContent = female.total;
    } catch (e) {
        console.error('Dashboard error:', e);
    }
}

async function loadProfiles(page = 1) {
    currentPage = page;
    const gender = document.getElementById('filter-gender')?.value || '';
    const country = document.getElementById('filter-country')?.value || '';
    const minAge = document.getElementById('filter-min-age')?.value || '';
    const maxAge = document.getElementById('filter-max-age')?.value || '';

    const params = new URLSearchParams({ page, limit: 10 });
    if (gender) params.append('gender', gender);
    if (country) params.append('country_id', country);
    if (minAge) params.append('min_age', minAge);
    if (maxAge) params.append('max_age', maxAge);

    try {
        const res = await fetch(`${API_URL}/api/profiles?${params}`, {
            headers: { 'X-API-Version': '1' },
            credentials: 'include'
        });
        const data = await res.json();

        if (data.data && data.data.length > 0) {
            let html = '<table><tr><th>Name</th><th>Gender</th><th>Age</th><th>Country</th></tr>';
            data.data.forEach(p => {
                html += `<tr><td>${p.name}</td><td>${p.gender}</td><td>${p.age} (${p.age_group})</td><td>${p.country_name}</td></tr>`;
            });
            html += '</table>';
            document.getElementById('profiles-table').innerHTML = html;

            // Pagination
            let pagHtml = '';
            if (data.links.prev) pagHtml += `<button onclick="loadProfiles(${data.page - 1})">← Prev</button>`;
            pagHtml += `<span>Page ${data.page} of ${data.total_pages}</span>`;
            if (data.links.next) pagHtml += `<button onclick="loadProfiles(${data.page + 1})">Next →</button>`;
            document.getElementById('pagination').innerHTML = pagHtml;
        } else {
            document.getElementById('profiles-table').innerHTML = '<p>No profiles found</p>';
        }
    } catch (e) {
        console.error('Profiles error:', e);
    }
}

async function searchProfiles() {
    const query = document.getElementById('search-query').value;
    if (!query) return;

    try {
        const res = await fetch(`${API_URL}/api/profiles/search?q=${encodeURIComponent(query)}&limit=10`, {
            headers: { 'X-API-Version': '1' },
            credentials: 'include'
        });
        const data = await res.json();

        if (data.data && data.data.length > 0) {
            let html = '<table><tr><th>Name</th><th>Gender</th><th>Age</th><th>Country</th></tr>';
            data.data.forEach(p => {
                html += `<tr><td>${p.name}</td><td>${p.gender}</td><td>${p.age} (${p.age_group})</td><td>${p.country_name}</td></tr>`;
            });
            html += '</table>';
            document.getElementById('search-results').innerHTML = html;
        } else {
            document.getElementById('search-results').innerHTML = '<p>No results found</p>';
        }
    } catch (e) {
        console.error('Search error:', e);
    }
}

// Initialize
checkAuth();