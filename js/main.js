document.addEventListener("DOMContentLoaded", () => {
    const citySearch = document.getElementById("city-search");
    const addLocationCard = document.querySelector('.add-location');
    const navItems = document.querySelectorAll('.nav-item');
    const viewContainers = document.querySelectorAll('.view-container');
    const searchBar = document.querySelector('.search-bar');

    // Click on "Add Location"
    addLocationCard.addEventListener('click', async () => {
        const city = prompt("Enter city name:");
        if (!city) return;

        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`);
            if (!res.ok) {
                alert("City not found");
                return;
            }
            const data = await res.json();
            createLocationCard(data);
        } catch (error) {
            console.error(error);
            alert("Error fetching city data");
        }
    });

    // Navigation functionality
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.getAttribute('data-view');
            const citySearchInput = document.getElementById('city-search');
            if (citySearchInput) citySearchInput.value = '';

            if (searchBar) {
                searchBar.style.display = (viewName === 'analytics' || viewName === 'settings') ? 'none' : 'flex';
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            viewContainers.forEach(view => { view.style.display = 'none'; });
            const targetView = document.getElementById(`${viewName}-view`);
            if (targetView) targetView.style.display = 'block';

            if (viewName === 'analytics' && typeof initAnalyticsChart === "function") {
                initAnalyticsChart(7, selectedAnalyticsCityTemp); 
            }
        });
    });

    // Event listeners Finders
    citySearch.addEventListener("input", () => {
        const value = citySearch.value.trim().toLowerCase();
        const view = getActiveView();
        if (view === "home") { filterLocationCards(value); }
    });

    citySearch.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const value = citySearch.value.trim();
            const view = getActiveView();
            if (view === "weather" && value !== "") { getWeatherData(value); }
        }
    });

    // Tab switching forecast
    const tabs = document.querySelectorAll('.forecast-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Initial click on static cards, if any exist
    document.querySelectorAll('.location-card:not(.add-location)').forEach(card => {
        card.addEventListener('click', () => {
            const cityName = card.querySelector('.location-name').textContent;
            getWeatherData(cityName);
            viewContainers.forEach(view => view.style.display = 'none');
            document.getElementById('weather-view').style.display = 'block';
            navItems.forEach(nav => nav.classList.remove('active'));
            document.querySelector('[data-view="weather"]').classList.add('active');
        });
    });

    // --- SETTINGS ---
    document.querySelectorAll('#settings-view .mini-trigger').forEach(trigger => {
        trigger.onclick = function(e) {
            e.stopPropagation();
            const parent = this.closest('.mini-select');
            document.querySelectorAll('.mini-select').forEach(s => {
                if (s !== parent) s.classList.remove('open');
            });
            parent.classList.toggle('open');
        };
    });

    document.querySelectorAll('#settings-view .mini-option').forEach(option => {
        option.onclick = function(e) {
            e.stopPropagation();
            const val = this.textContent.trim();
            const parent = this.closest('.mini-select');
            const trigger = parent.querySelector('.mini-trigger');
            if (trigger) trigger.textContent = val;
            parent.classList.remove('open');
        };
    });

    const saveSettingsBtn = document.querySelector('.save-btn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const triggers = document.querySelectorAll('#settings-view .mini-trigger');
            currentUnit = triggers[0].textContent.includes('Fahrenheit') ? 'F' : 'C';
            is12hFormat = triggers[1].textContent.includes('12-hour');
            getWeatherData(currentCity || DEFAULT_CITY);
            showToast("Settings applied!");
        });
    }

    const resetSettingsBtn = document.querySelector('.reset-btn');
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', () => {
            const triggers = document.querySelectorAll('#settings-view .mini-trigger');
            if (triggers[0]) triggers[0].textContent = "Celsius (°C)";
            if (triggers[1]) triggers[1].textContent = "24-hour";
            getWeatherData(currentCity || DEFAULT_CITY);
            showToast("Settings reset to default", "info");
        });
    }

    // --- ANALYTICS ---
    document.querySelectorAll('#analytics-view .mini-trigger').forEach(trigger => {
        trigger.onclick = function(e) {
            e.stopPropagation();
            const parent = this.closest('.mini-select');
            document.querySelectorAll('.mini-select').forEach(s => {
                if (s !== parent) s.classList.remove('open');
            });
            parent.classList.toggle('open');
        };
    });

    document.querySelectorAll('#analytics-view .mini-option').forEach(option => {
        option.onclick = function(e) {
            e.stopPropagation();
            const val = this.textContent.trim();
            const parent = this.closest('.mini-select');
            const trigger = parent.querySelector('.mini-trigger');
            if (trigger) trigger.textContent = val;
            if (val.includes('days')) {
                const days = parseInt(val);
                initAnalyticsChart(days, selectedAnalyticsCityTemp);
            }
            parent.classList.remove('open');
        };
    });

    // Global click to close menus
    window.addEventListener('click', () => {
        document.querySelectorAll('.mini-select').forEach(s => s.classList.remove('open'));
    });

    // --- INITIALIZATION ---
    getWeatherData(DEFAULT_CITY);
    citySearch.value = DEFAULT_CITY;
});