document.addEventListener('DOMContentLoaded', function() {
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const weatherResult = document.getElementById('weatherResult');
    const loader = document.querySelector('.loader');

    // Load weather for default city
    getWeather('New York');

    // Search button click handler
    searchBtn.addEventListener('click', function() {
        const city = cityInput.value.trim();
        if (city) {
            getWeather(city);
        }
    });

    // Enter key handler
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                getWeather(city);
            }
        }
    });

    async function getWeather(cityName) {
        // Show loading spinner
        weatherResult.style.display = 'none';
        loader.style.display = 'block';

        try {
            // Get coordinates for the city
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (geoData.results && geoData.results.length > 0) {
                const firstResult = geoData.results[0];
                const lat = firstResult.latitude;
                const lon = firstResult.longitude;

                // Get weather data
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,pressure_msl&timezone=auto`;
                const weatherResponse = await fetch(weatherUrl);
                const weatherData = await weatherResponse.json();

                // Update UI with weather data (this resets the markup every time)
                updateWeatherUI(cityName, weatherData);
            } else {
                showError('City not found');
            }
        } catch (error) {
            showError(error.message || 'Failed to load weather data');
        } finally {
            loader.style.display = 'none';
            weatherResult.style.display = 'block';
        }
    }

    function updateWeatherUI(cityName, weatherData) {
        const current = weatherData.current_weather;
        const hourly = weatherData.hourly;
        const nowIndex = hourly.time.findIndex(time => time === current.time);

        const humidity = nowIndex >= 0 ? hourly.relativehumidity_2m[nowIndex] : 'N/A';
        const pressure = nowIndex >= 0 ? hourly.pressure_msl[nowIndex] : 'N/A';
        const weatherIcon = getWeatherIcon(current.weathercode);
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        const formattedTime = new Date(current.time).toLocaleTimeString([], timeOptions);

        // Reset the markup
        weatherResult.innerHTML = `
            <div class="weather-header">
                <div class="weather-icon">${weatherIcon}</div>
                <h2 class="location">${cityName}</h2>
            </div>
            <div class="weather-details">
                <div class="detail-card">
                    <div class="detail-title">Temperature</div>
                    <div class="detail-value">${current.temperature}<span class="detail-unit">°C</span></div>
                </div>
                <div class="detail-card">
                    <div class="detail-title">Wind Speed</div>
                    <div class="detail-value">${current.windspeed}<span class="detail-unit">km/h</span></div>
                </div>
                <div class="detail-card">
                    <div class="detail-title">Humidity</div>
                    <div class="detail-value">${humidity}<span class="detail-unit">%</span></div>
                </div>
                <div class="detail-card">
                    <div class="detail-title">Pressure</div>
                    <div class="detail-value">${pressure}<span class="detail-unit">hPa</span></div>
                </div>
            </div>
            <p class="timestamp">Last updated: ${formattedTime}</p>
        `;
    }

    function showError(message) {
        weatherResult.innerHTML = `
            <div style="text-align:center; padding: 2rem;">
                <h3>⚠️ Error</h3>
                <p>Cannot set properties of null (setting 'textContent')</p>
                <p>${message}</p>
                <p>Please try another city</p>
            </div>
        `;
    }

    function getWeatherIcon(weatherCode) {
        const icons = {
            0: '☀️',  1: '🌤️',  2: '⛅',  3: '☁️',
            45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌧️',
            55: '🌧️', 56: '🌧️', 57: '🌧️', 61: '🌧️',
            63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
            71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️',
            80: '🌧️', 81: '🌧️', 82: '🌧️', 85: '❄️',
            86: '❄️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        return icons[weatherCode] || '🌤️';
    }
});
