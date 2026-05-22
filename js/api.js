// Get weather by coordinates
function getWeatherByCoords(lat, lon) {
    showLoading();

    // Initialize map with coordinates
    initMap(lat, lon);

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Weather data not available");
            }
            return response.json();
        })
        .then(data => {
            currentCity = data.name;
            updateCurrentWeather(data);

            return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Forecast data not available");
            }
            return response.json();
        })
        .then(data => {
            updateForecast(data);
            hideLoading();
        })
        .catch(error => {
            console.error("Error:", error);
            hideLoading();
            // If getting weather by coordinates fails, fall back to default city
            getWeatherData(DEFAULT_CITY);
        });
}

// Fetch weather data by city name
function getWeatherData(city) {
    showLoading();

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("City not found");
            }
            return response.json();
        })
        .then(data => {
            currentCity = city;
            updateCurrentWeather(data);

            // Initialize map with coordinates
            initMap(data.coord.lat, data.coord.lon);

            return fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Forecast data not available");
            }
            return response.json();
        })
        .then(data => {
            updateForecast(data);
            hideLoading();
        })
        .catch(error => {
            console.error("Error:", error);
            hideLoading();
        });
}