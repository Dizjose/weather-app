function getActiveView() {
    return document.querySelector('.nav-item.active')?.dataset.view;
}

// Initialize map
function initMap(lat, lon) {
    if (map) {
        map.remove();
    }

    map = L.map('map').setView([lat, lon], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);

    L.marker([lat, lon]).addTo(map);
}

// Initialize temperature chart
function initTempChart(hourlyData) {
    const ctx = document.getElementById('temp-chart').getContext('2d');

    if (window.tempChartInstance) {
        window.tempChartInstance.destroy();
    }

    const toFahrenheit = (c) => Math.round((c * 9/5) + 32);

    const formatTimeDisplay = (timeStr, is12h) => {
        let [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        if (!is12h) return `${h < 10 ? '0' + h : h}:00`; 
        let ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:00 ${ampm}`;
    };

    // Extract times and temperatures
    const times = hourlyData.map(item => {
        const date = new Date(item.dt * 1000);
        return date.getHours() + ':00';
    });

    const temps = hourlyData.map(item => Math.round(item.main.temp));

    window.tempChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: 'Temperature (°C)',
                data: temps,
                borderColor: (ctx) => {
                    const value = ctx.raw;
                    if (value <= 10) return '#3498db';
                    if (value <= 20) return '#2ecc71';
                    if (value <= 30) return '#f1c40f';
                    return '#e74c3c';
                },
                segment: {
                    borderColor: (ctx) => {
                        const value = ctx.p1.parsed.y;
                        if (value <= 10) return '#3498db';
                        if (value <= 20) return '#2ecc71';
                        if (value <= 30) return '#f1c40f';
                        return '#e74c3c';
                    }
                },
                backgroundColor: 'rgba(255,255,255,0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'white',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Initialize analytics chart
function initAnalyticsChart(days = 7, baseTemp = 20) {
    const canvas = document.getElementById('analytics-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const tempBase = Math.round(parseFloat(baseTemp)) || 20;
    const totalDays = parseInt(days) || 7;

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    let labels = [];
    if (totalDays === 7) {
        labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    } else {
        labels = Array.from({ length: totalDays }, (_, i) => (i + 1).toString());
    }

    const tempData = Array.from({ length: totalDays }, () => {
        const variation = (Math.random() * 6) - 3; 
        return Math.round(tempBase + variation);
    });

    const minTemp = Math.min(...tempData);
    const maxTemp = Math.max(...tempData);
    const avgTemp = Math.round(tempData.reduce((a, b) => a + b, 0) / tempData.length);
    const variance = maxTemp - minTemp;

    const unitSelect = document.querySelector('.temp-unit-select');
    const isFahrenheit = unitSelect ? unitSelect.value.includes('F') : false;
    const toDisplay = (t) => isFahrenheit ? Math.round((t * 9/5) + 32) + "°F" : Math.round(t) + "°C";

    const stats = document.querySelectorAll('.stat-card .stat-value');
    if (stats.length >= 4) {
        stats[0].textContent = `${avgTemp}°`;
        stats[1].textContent = `${minTemp}°`;
        stats[2].textContent = `${maxTemp}°`;
        stats[3].textContent = `${variance}°`;
    }

    analyticsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperatura',
                data: tempData,
                borderColor: 'rgba(79, 70, 229, 0.8)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: totalDays > 15 ? 2 : 4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: tempBase - 5,
                    suggestedMax: tempBase + 5,
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: (value) => isFahrenheit ? Math.round((value * 9/5) + 32) + "°" : value + "°"
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    type: 'category',
                    ticks: { 
                        color: 'rgba(255, 255, 255, 0.7)',
                        autoSkip: false, 
                        includeBounds: true,
                        callback: function(value, index) {
                            const label = labels[index];
                            const dia = parseInt(label);
                            if (totalDays <= 7) return label;
                            if (dia === 1 || dia === totalDays || dia % 5 === 0) {
                                return label;
                            }
                            return null;
                        }
                    },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            return ` Temp: ${context.parsed.y}°`;
                        }
                    }
                }
            }
        }
    });
}

// Update current weather UI
function updateCurrentWeather(data) {
    document.getElementById("location").textContent = `${data.name}, ${data.sys.country}`;
    
    let tempValue = Math.round(data.main.temp);
    if (currentUnit === 'F') {
        tempValue = Math.round((tempValue * 9/5) + 32);
    }
    
    document.getElementById("current-temp").textContent = `${tempValue}°${currentUnit}`;
    document.getElementById("weather-desc").textContent = data.weather[0].description;
    document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

function createLocationCard(data) {
    const existingCards = document.querySelectorAll('.location-detail-card .location-name');
    for (let el of existingCards) {
        const cityNameInCard = el.textContent.split(',')[0].trim().toLowerCase();
        if (cityNameInCard === data.name.toLowerCase()) {
            showToast("This city is already added!", "error");
            return;
        }
    }
                
    const card = document.createElement('div');
    card.className = 'location-detail-card';
    card.style.cursor = 'pointer';

    card.innerHTML = `
    <div class="location-header">
        <div class="location-name">${data.name}, ${data.sys.country}</div>
        <div class="location-actions">
            <button class="action-btn"><i class="fas fa-star"></i></button>
            <button class="action-btn delete-location-btn">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    </div>
    <div class="location-weather">
        <div class="location-temp">${Math.round(data.main.temp)}°</div>
        <div class="location-icon">
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" width="50">
        </div>
        <div class="location-desc">${data.weather[0].description}</div>
    </div>
    <div class="location-details">
        <div class="detail-item">
            <div class="detail-label">Humidity</div>
            <div class="detail-value">${data.main.humidity}%</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Wind</div>
            <div class="detail-value">${Math.round(data.wind.speed)} km/h</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Pressure</div>
            <div class="detail-value">${data.main.pressure} hPa</div>
        </div>
    </div>
`;

    const deleteBtn = card.querySelector('.delete-location-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cityName = card.querySelector('.location-name').textContent;
        const selectTrigger = document.querySelector('.mini-trigger');
        card.remove();
        if (selectTrigger && selectTrigger.textContent === cityName) {
            selectTrigger.textContent = "Select City";
        }
        setTimeout(() => { syncAnalyticsCities(); }, 10);
    });

    const locationGrid = document.querySelector('.location-grid');
    const addLocationCard = document.querySelector('.add-location');
    
    card.addEventListener('click', () => {
        getWeatherData(data.name);
        document.querySelectorAll('.view-container').forEach(v => v.style.display = 'none');
        document.getElementById('weather-view').style.display = 'block';
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const weatherNavItem = document.querySelector('[data-view="weather"]');
        if (weatherNavItem) weatherNavItem.classList.add('active');
        const citySearch = document.getElementById("city-search");
        if (citySearch) citySearch.value = data.name;
    });

    locationGrid.insertBefore(card, addLocationCard);
    showToast("City added successfully");
    syncAnalyticsCities();
}

function syncAnalyticsCities() {
    const optionsContainer = document.getElementById('analytics-city-options');
    if (!optionsContainer) return;
    
    const selectParent = optionsContainer.closest('.mini-select');
    const trigger = selectParent.querySelector('.mini-trigger');
    const addedCities = document.querySelectorAll('.location-detail-card');

    optionsContainer.innerHTML = ''; 

    addedCities.forEach(cityCard => {
        const cityName = cityCard.querySelector('.location-name').textContent;
        const cityTempText = cityCard.querySelector('.location-temp').textContent;
        const cityTemp = parseInt(cityTempText.replace('°', '')); 
        
        const option = document.createElement('div');
        option.className = 'mini-option';
        option.textContent = cityName;

        option.onclick = (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            trigger.textContent = cityName;
            selectedAnalyticsCityTemp = cityTemp;
            
            const allTriggers = document.querySelectorAll('#analytics-view .mini-trigger');
            allTriggers.forEach(t => {
                if (t !== trigger) { 
                    t.textContent = "7 days"; 
                }
            });
            initAnalyticsChart(7, selectedAnalyticsCityTemp);
            selectParent.classList.remove('open');
        };
        optionsContainer.appendChild(option);
    });
}

function filterLocationCards(query) {
    const cards = document.querySelectorAll('.location-detail-card');
    const searchTerm = query.toLowerCase().trim();

    cards.forEach(card => {
        if (card.classList.contains('add-location')) return;
        const nameElement = card.querySelector('.location-name');
        if (nameElement) {
            const cityName = nameElement.textContent.toLowerCase();
            card.style.display = cityName.includes(searchTerm) ? '' : 'none';
        }
    });
}

function updateForecast(data) {
    // Daily forecast
    const dailyForecastContainer = document.getElementById("daily-forecast");
    dailyForecastContainer.innerHTML = "";
    const dailyForecasts = {};

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (!dailyForecasts[day]) {
            dailyForecasts[day] = {
                icon: item.weather[0].icon,
                minTemp: item.main.temp_min,
                maxTemp: item.main.temp_max,
                date: date
            };
        } else {
            dailyForecasts[day].minTemp = Math.min(dailyForecasts[day].minTemp, item.main.temp_min);
            dailyForecasts[day].maxTemp = Math.max(dailyForecasts[day].maxTemp, item.main.temp_max);
        }
    });

    Object.entries(dailyForecasts).slice(0, 5).forEach(([day, forecast]) => {
        let min = Math.round(forecast.minTemp);
        let max = Math.round(forecast.maxTemp);
        if (currentUnit === 'F') {
            min = Math.round((min * 9/5) + 32);
            max = Math.round((max * 9/5) + 32);
        }
        const fillWidth = Math.min(100, Math.max(20, (max - min) * 10));

        const dailyItem = document.createElement("div");
        dailyItem.className = "daily-item";
        dailyItem.innerHTML = `
            <div class="daily-day">${day}</div>
            <img class="daily-icon" src="https://openweathermap.org/img/wn/${forecast.icon}.png" alt="Weather icon">
            <div class="daily-temp-range">
                <div class="temp-bar"><div class="temp-fill" style="width: ${fillWidth}%;"></div></div>
                <div class="daily-min">${min}°</div>
                <div class="daily-max">${max}°</div>
            </div>
        `;
        dailyForecastContainer.appendChild(dailyItem);
    });

    // Hourly forecast
    const hourlyForecastContainer = document.getElementById("hourly-forecast");
    hourlyForecastContainer.innerHTML = "";
    const hourlyData = data.list.slice(0, 8);

    hourlyData.forEach(hour => {
        const date = new Date(hour.dt * 1000);
        let time;
        if (is12hFormat) {
            let h = date.getHours();
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            time = `${h} ${ampm}`;
        } else {
            time = `${date.getHours()}:00`;
        }

        let hTemp = Math.round(hour.main.temp);
        if (currentUnit === 'F') {
            hTemp = Math.round((hTemp * 9/5) + 32);
        }

        const hourItem = document.createElement("div");
        hourItem.className = "hour-item";
        hourItem.innerHTML = `
            <div class="hour-time">${time}</div>
            <div class="hour-icon"><img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" width="30"></div>
            <div class="hour-temp">${hTemp}°</div>
        `;
        hourlyForecastContainer.appendChild(hourItem);
    });

    initTempChart(hourlyData);
    updatePopularCities();
}

function updatePopularCities() {
    const cityListContainer = document.getElementById("city-list");
    cityListContainer.innerHTML = "";
    const popularCities = ["New York", "London", "Tokyo", "Paris", "Sydney"];

    popularCities.forEach(city => {
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`)
            .then(response => response.json())
            .then(data => {
                const cityItem = document.createElement("div");
                cityItem.className = "city-item";
                cityItem.innerHTML = `<div class="city-name">${city}</div><div class="city-temp">${Math.round(data.main.temp)}°</div>`;
                cityItem.addEventListener("click", () => {
                    getWeatherData(city);
                    document.getElementById("city-search").value = city;
                });
                cityListContainer.appendChild(cityItem);
            })
            .catch(error => console.error(`Error fetching data for ${city}:`, error));
    });
}

function showLoading() {
    document.getElementById("loading-container").style.display = "block";
}

function hideLoading() {
    document.getElementById("loading-container").style.display = "none";
}