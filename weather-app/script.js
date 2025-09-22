// ===== BACKGROUND ANIMATION =====
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const particles = [];
const particleCount = 150;

class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.alpha = Math.random() * 0.2 + 0.05;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x < 0 || this.x > canvas.width || 
            this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }
    
    draw() {
        ctx.fillStyle = `rgba(0, 102, 255, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let particle of particles) {
        particle.update();
        particle.draw();
    }
    
    requestAnimationFrame(animateParticles);
}

// ===== WEATHER APP FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', function() {
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const weatherResult = document.getElementById('weatherResult');
    const loader = document.querySelector('.loader');
    
    // Initialize particles
    initParticles();
    animateParticles();
    
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
});

async function getWeather(cityName) {
    const weatherResult = document.getElementById('weatherResult');
    const loader = document.querySelector('.loader');
    
    // Show loading spinner
    weatherResult.style.display = 'none';
    loader.style.display = 'block';
    
    try {
        // First get coordinates for the city
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
            
            // Update UI with weather data
            updateWeatherUI(cityName, weatherData);
        } else {
            throw new Error('City not found');
        }
    } catch (error) {
        weatherResult.innerHTML = `
            <div style="text-align:center; padding: 2rem;">
                <h3>⚠️ Error</h3>
                <p>${error.message || 'Failed to load weather data'}</p>
                <p>Please try another city</p>
            </div>
        `;
        weatherResult.style.display = 'block';
    } finally {
        // Hide loader
        loader.style.display = 'none';
        weatherResult.style.display = 'block';
    }
}

function updateWeatherUI(cityName, weatherData) {
    const current = weatherData.current_weather;
    const hourly = weatherData.hourly;
    const nowIndex = hourly.time.findIndex(time => time === current.time);
    
    // Get additional data from hourly
    const humidity = nowIndex >= 0 ? hourly.relativehumidity_2m[nowIndex] : 'N/A';
    const pressure = nowIndex >= 0 ? hourly.pressure_msl[nowIndex] : 'N/A';
    
    // Get weather icon based on conditions
    const weatherIcon = getWeatherIcon(current.weathercode);
    
    // Format time
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const formattedTime = new Date(current.time).toLocaleTimeString([], timeOptions);
    
    // Update DOM
    document.querySelector('.weather-icon').textContent = weatherIcon;
    document.querySelector('.location').textContent = cityName;
    document.querySelector('.detail-value:nth-child(1)').innerHTML = `${current.temperature}<span class="detail-unit">°C</span>`;
    document.querySelector('.detail-value:nth-child(2)').innerHTML = `${current.windspeed}<span class="detail-unit">km/h</span>`;
    document.querySelector('.detail-value:nth-child(3)').innerHTML = `${humidity}<span class="detail-unit">%</span>`;
    document.querySelector('.detail-value:nth-child(4)').innerHTML = `${pressure}<span class="detail-unit">hPa</span>`;
    document.querySelector('.timestamp').textContent = `Last updated: ${formattedTime}`;
}

function getWeatherIcon(weatherCode) {
    // Weather code to emoji mapping
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