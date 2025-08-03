// Global Variables
let currentTheme = 'dark';
let is24HourFormat = false;
let audioEnabled = true;
let hourlyChimeEnabled = false;
let ambientSoundsEnabled = false;
let currentGradient = { color1: '56ccf2', color2: '2f80ed' };
let customBackground = null;

// Timer Variables
let stopwatchRunning = false;
let stopwatchTime = 0;
let stopwatchInterval = null;
let lapCounter = 1;

let timerRunning = false;
let timerTime = 0;
let timerInterval = null;
let timerDuration = 0;

// Weather and Location Variables
let currentWeatherData = null;
let hourlyForecast = [];

// Calendar Variables
let currentCalendarDate = new Date();

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadSettings();
    updateClock();
    drawAnalogClock();
    fetchWeather();
    updateCalendar();
    requestNotificationPermission();
    setupKeyboardShortcuts();
    initializeCustomizationSettings();
    
    // Set today's date in the date input
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    document.getElementById('dateInput').value = dateString;
    
    // Set intervals
    setInterval(() => {
        updateClock();
        drawAnalogClock();
        checkHourlyChime();
    }, 1000);
    
    setInterval(updateSystemInfo, 5000);
    setInterval(fetchWeather, 300000); // Update weather every 5 minutes
    
    // Apply saved background
    applyBackground();
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Close modals with Escape key
        if (e.key === 'Escape') {
            closeCustomization();
            closeHelp();
            return;
        }
        
        // Only trigger if not typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key.toLowerCase()) {
            case '1':
                showTab('clock');
                break;
            case '2':
                showTab('stopwatch');
                break;
            case '3':
                showTab('timer');
                break;
            case ' ': // Spacebar
                e.preventDefault();
                handleSpacebarAction();
                break;
            case 'r':
                if (e.ctrlKey || e.metaKey) return; // Don't interfere with page refresh
                handleResetAction();
                break;
            case 't':
                toggleTheme();
                break;
            case 'f':
                toggleTimeFormat();
                break;
            case 'm':
                toggleAudio();
                break;
            case 'h':
            case '?':
                openHelp();
                break;
        }
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeCustomization();
            closeHelp();
        }
    });
}

function handleSpacebarAction() {
    const activeTab = document.querySelector('.tab-content:not(.hidden)');
    if (!activeTab) return;
    
    const tabId = activeTab.id;
    switch(tabId) {
        case 'stopwatchTab':
            if (stopwatchRunning) {
                pauseStopwatch();
            } else {
                startStopwatch();
            }
            break;
        case 'timerTab':
            if (timerRunning) {
                pauseTimer();
            } else {
                startTimer();
            }
            break;
    }
}

function handleResetAction() {
    const activeTab = document.querySelector('.tab-content:not(.hidden)');
    if (!activeTab) return;
    
    const tabId = activeTab.id;
    switch(tabId) {
        case 'stopwatchTab':
            resetStopwatch();
            break;
        case 'timerTab':
            resetTimer();
            break;
    }
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('clockSettings') || '{}');
    currentTheme = settings.theme || 'dark';
    is24HourFormat = settings.is24Hour || false;
    audioEnabled = settings.audioEnabled !== false;
    hourlyChimeEnabled = settings.hourlyChime || false;
    ambientSoundsEnabled = settings.ambientSounds || false;
    currentGradient = settings.gradient || { color1: '56ccf2', color2: '2f80ed' };
    customBackground = settings.customBackground || null;
    
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    updateTimeFormatButton();
    updateAudioIcon();
    updateChimeStatus();
    updateAmbientStatus();
}

function saveSettings() {
    const settings = {
        theme: currentTheme,
        is24Hour: is24HourFormat,
        audioEnabled: audioEnabled,
        hourlyChime: hourlyChimeEnabled,
        ambientSounds: ambientSoundsEnabled,
        gradient: currentGradient,
        customBackground: customBackground
    };
    localStorage.setItem('clockSettings', JSON.stringify(settings));
}

// Theme Functions
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    saveSettings();
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Time Format Functions
function toggleTimeFormat() {
    is24HourFormat = !is24HourFormat;
    updateTimeFormatButton();
    saveSettings();
}

function updateTimeFormatButton() {
    document.getElementById('timeFormatBtn').textContent = is24HourFormat ? '12H' : '24H';
}

// Audio Functions
function toggleAudio() {
    audioEnabled = !audioEnabled;
    updateAudioIcon();
    saveSettings();
}

function updateAudioIcon() {
    const icon = document.getElementById('audioIcon');
    icon.className = audioEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
}

function updateVolume() {
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        const volume = volumeSlider.value / 100;
        const hourlyChime = document.getElementById('hourlyChime');
        const alarmSound = document.getElementById('alarmSound');
        const ambientRain = document.getElementById('ambientRain');
        
        if (hourlyChime) hourlyChime.volume = volume;
        if (alarmSound) alarmSound.volume = volume;
        if (ambientRain) ambientRain.volume = volume * 0.3; // Lower volume for ambient
    }
}

function toggleHourlyChime() {
    hourlyChimeEnabled = !hourlyChimeEnabled;
    updateChimeStatus();
    saveSettings();
}

function updateChimeStatus() {
    const chimeStatus = document.getElementById('chimeStatus');
    if (chimeStatus) {
        chimeStatus.textContent = hourlyChimeEnabled ? 'Disable' : 'Enable';
    }
}

function toggleAmbientSounds() {
    ambientSoundsEnabled = !ambientSoundsEnabled;
    updateAmbientStatus();
    
    if (ambientSoundsEnabled && currentWeatherData) {
        playAmbientSound(currentWeatherData.weather[0].main.toLowerCase());
    } else {
        document.getElementById('ambientRain').pause();
    }
    saveSettings();
}

function updateAmbientStatus() {
    const ambientStatus = document.getElementById('ambientStatus');
    if (ambientStatus) {
        ambientStatus.textContent = ambientSoundsEnabled ? 'Disable' : 'Enable';
    }
}

function playAmbientSound(weatherCondition) {
    if (!ambientSoundsEnabled || !audioEnabled) return;
    
    const rainSound = document.getElementById('ambientRain');
    
    if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
        rainSound.play().catch(() => {});
    } else {
        rainSound.pause();
    }
}

function checkHourlyChime() {
    if (!hourlyChimeEnabled || !audioEnabled) return;
    
    const now = new Date();
    if (now.getMinutes() === 0 && now.getSeconds() === 0) {
        document.getElementById('hourlyChime').play().catch(() => {});
    }
}

// Clock Functions
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let ampm = '';
    
    if (!is24HourFormat) {
        ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
    }
    
    hours = hours.toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');
    
    const timeElement = document.getElementById('time');
    if (is24HourFormat) {
        timeElement.innerHTML = `${hours}:${minutes}:${seconds}`;
    } else {
        timeElement.innerHTML = `${hours}:${minutes}:${seconds}<span class="ampm">${ampm}</span>`;
    }
    
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    document.getElementById('date').textContent =
        `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    
    updateBackgroundBasedOnTime();
}

function updateBackgroundBasedOnTime() {
    if (customBackground) return;
    
    const now = new Date();
    const hour = now.getHours();
    
    let gradient;
    if (hour >= 6 && hour < 12) {
        // Morning - use selected gradient
        gradient = `linear-gradient(135deg, #${currentGradient.color1}, #${currentGradient.color2})`;
    } else if (hour >= 12 && hour < 18) {
        // Afternoon - use selected gradient with slight variation
        gradient = `linear-gradient(135deg, #${currentGradient.color1}, #${currentGradient.color2})`;
    } else if (hour >= 18 && hour < 21) {
        // Evening - use selected gradient with warmer tones
        gradient = `linear-gradient(135deg, #${currentGradient.color1}, #${currentGradient.color2})`;
    } else {
        // Night - use selected gradient with darker tones
        gradient = `linear-gradient(135deg, #${currentGradient.color1}, #${currentGradient.color2})`;
    }
    
    document.body.style.background = gradient;
}

function drawAnalogClock() {
    const canvas = document.getElementById('analogClock');
    const ctx = canvas.getContext('2d');
    const now = new Date();
    const radius = canvas.height / 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(radius, radius);
    
    // Draw clock face
    ctx.beginPath();
    ctx.arc(0, 0, radius - 10, 0, 2 * Math.PI);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-glass');
    ctx.fill();
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-glass');
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw hour markers
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI / 6);
        ctx.beginPath();
        ctx.moveTo(0, -radius + 15);
        ctx.lineTo(0, -radius + 25);
        ctx.stroke();
        ctx.restore();
    }
    
    // Draw minute markers
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color');
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
        if (i % 5 !== 0) {
            ctx.save();
            ctx.rotate(i * Math.PI / 30);
            ctx.beginPath();
            ctx.moveTo(0, -radius + 15);
            ctx.lineTo(0, -radius + 20);
            ctx.stroke();
            ctx.restore();
        }
    }
    
    // Draw numbers
    ctx.font = radius * 0.15 + "px Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
    for (let num = 1; num <= 12; num++) {
        const ang = num * Math.PI / 6;
        ctx.save();
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.85);
        ctx.rotate(-ang);
        ctx.fillText(num.toString(), 0, 0);
        ctx.restore();
    }
    
    function drawHand(pos, length, width, color) {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.strokeStyle = color;
        ctx.moveTo(0, 0);
        ctx.rotate(pos);
        ctx.lineTo(0, -length);
        ctx.stroke();
        ctx.rotate(-pos);
    }
    
    // Calculate hand positions
    let hour = now.getHours() % 12;
    hour = (hour * Math.PI / 6) + (now.getMinutes() * Math.PI / (6 * 60)) + (now.getSeconds() * Math.PI / (6 * 3600));
    
    let minute = (now.getMinutes() * Math.PI / 30) + (now.getSeconds() * Math.PI / (30 * 60));
    
    let second = (now.getSeconds() * Math.PI / 30) + (now.getMilliseconds() * Math.PI / (30 * 1000));
    
    // Draw hands
    drawHand(hour, radius * 0.5, radius * 0.07, getComputedStyle(document.documentElement).getPropertyValue('--primary-color'));
    drawHand(minute, radius * 0.8, radius * 0.05, getComputedStyle(document.documentElement).getPropertyValue('--secondary-color'));
    drawHand(second, radius * 0.9, radius * 0.02, "#ff6b6b");
    
    // Draw center dot
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
    ctx.fill();
    
    ctx.restore();
}

// Weather Functions
function fetchWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            
            // Using OpenWeatherMap's free API (requires API key)
            // For demo purposes, we'll use a mock weather response
            mockWeatherResponse(lat, lon);
            
        }, (error) => {
            console.log('Geolocation error:', error);
            document.getElementById('weatherDesc').textContent = "Location access denied";
            displayMockWeather();
        });
    } else {
        document.getElementById('weatherDesc').textContent = "Geolocation not supported";
        displayMockWeather();
    }
}

function mockWeatherResponse(lat, lon) {
    // Mock weather data for demonstration
    const mockWeatherData = {
        main: {
            temp: 22,
            feels_like: 24,
            humidity: 65,
            pressure: 1013
        },
        weather: [{
            main: 'Clear',
            description: 'clear sky'
        }],
        wind: {
            speed: 3.5
        },
        visibility: 10000,
        name: 'Your Location'
    };
    
    currentWeatherData = mockWeatherData;
    displayWeather(mockWeatherData);
    
    // Mock hourly forecast
    hourlyForecast = [
        { dt: Date.now()/1000 + 3600, main: { temp: 23 }, weather: [{ main: 'Clear' }] },
        { dt: Date.now()/1000 + 7200, main: { temp: 24 }, weather: [{ main: 'Clouds' }] },
        { dt: Date.now()/1000 + 10800, main: { temp: 25 }, weather: [{ main: 'Clear' }] },
        { dt: Date.now()/1000 + 14400, main: { temp: 23 }, weather: [{ main: 'Rain' }] },
        { dt: Date.now()/1000 + 18000, main: { temp: 21 }, weather: [{ main: 'Clouds' }] },
        { dt: Date.now()/1000 + 21600, main: { temp: 20 }, weather: [{ main: 'Clear' }] }
    ];
    displayHourlyForecast();
    
    // Mock air quality
    displayAirQuality({ list: [{ main: { aqi: 2 } }] });
}

function displayMockWeather() {
    // Display default weather when location is not available
    document.getElementById('weatherIcon').textContent = '🌤️';
    document.getElementById('weatherTemp').textContent = '--°C';
    document.getElementById('weatherDesc').textContent = 'Weather data unavailable';
    document.getElementById('weatherDetails').innerHTML = '';
    document.getElementById('weatherForecast').innerHTML = '';
}

function displayWeather(data) {
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const weatherMain = data.weather[0].main.toLowerCase();
    
    // Set weather icon
    const weatherIcons = {
        'clear': '☀️',
        'clouds': '☁️',
        'rain': '🌧️',
        'drizzle': '🌦️',
        'thunderstorm': '⛈️',
        'snow': '❄️',
        'mist': '🌫️',
        'fog': '🌫️',
        'haze': '🌫️'
    };
    
    document.getElementById('weatherIcon').textContent = weatherIcons[weatherMain] || '🌤️';
    document.getElementById('weatherTemp').textContent = `${temperature}°C`;
    document.getElementById('weatherDesc').textContent = description.charAt(0).toUpperCase() + description.slice(1);
    
    // Display additional weather details
    const details = document.getElementById('weatherDetails');
    details.innerHTML = `
        <div>Feels like: ${Math.round(data.main.feels_like)}°C</div>
        <div>Humidity: ${data.main.humidity}%</div>
        <div>Wind: ${Math.round(data.wind.speed * 3.6)} km/h</div>
        <div>Pressure: ${data.main.pressure} hPa</div>
        <div>Visibility: ${(data.visibility / 1000).toFixed(1)} km</div>
        <div>UV Index: ${data.uvi || 'N/A'}</div>
    `;
}

function displayHourlyForecast() {
    const forecast = document.getElementById('weatherForecast');
    forecast.innerHTML = hourlyForecast.map(item => {
        const time = new Date(item.dt * 1000).getHours();
        const temp = Math.round(item.main.temp);
        const weatherMain = item.weather[0].main.toLowerCase();
        
        const weatherIcons = {
            'clear': '☀️',
            'clouds': '☁️',
            'rain': '🌧️',
            'drizzle': '🌦️',
            'thunderstorm': '⛈️',
            'snow': '❄️',
            'mist': '🌫️'
        };
        
        return `
            <div class="forecast-item">
                <div>${time}:00</div>
                <div>${weatherIcons[weatherMain] || '🌤️'}</div>
                <div>${temp}°C</div>
            </div>
        `;
    }).join('');
}

function displayAirQuality(data) {
    const aqi = data.list[0].main.aqi;
    const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const aqiColors = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97'];
    
    const details = document.getElementById('weatherDetails');
    details.innerHTML += `
        <div style="color: ${aqiColors[aqi - 1]}">AQI: ${aqiLabels[aqi - 1]}</div>
    `;
}

// System Info Functions
function updateSystemInfo() {
    // This function is called but doesn't do anything in the current implementation
    // It was part of the removed system info functionality
}

// Calendar Functions
function updateCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const todayDate = today.getDate();
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    
    document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Add days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = daysInPrevMonth - i;
        dayElement.onclick = () => {
            previousMonth();
            setTimeout(() => {
                // Highlight the clicked date in previous month
                const prevMonthDays = document.querySelectorAll('.calendar-day:not(.other-month)');
                prevMonthDays.forEach(d => d.classList.remove('selected'));
                const targetDay = document.querySelector(`.calendar-day:not(.other-month)[data-day="${daysInPrevMonth - i}"]`);
                if (targetDay) targetDay.classList.add('selected');
            }, 100);
        };
        grid.appendChild(dayElement);
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        dayElement.setAttribute('data-day', day);
        
        if (isCurrentMonth && day === todayDate) {
            dayElement.classList.add('today');
        }
        
        dayElement.onclick = () => {
            // Remove previous selection
            document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
            dayElement.classList.add('selected');
        };
        
        grid.appendChild(dayElement);
    }
    
    // Add days from next month
    const remainingCells = 42 - (firstDay + daysInMonth); // 6 rows × 7 days = 42 total cells
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = day;
        dayElement.onclick = () => {
            nextMonth();
            setTimeout(() => {
                // Highlight the clicked date in next month
                const nextMonthDays = document.querySelectorAll('.calendar-day:not(.other-month)');
                nextMonthDays.forEach(d => d.classList.remove('selected'));
                const targetDay = document.querySelector(`.calendar-day:not(.other-month)[data-day="${day}"]`);
                if (targetDay) targetDay.classList.add('selected');
            }, 100);
        };
        grid.appendChild(dayElement);
    }
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    updateCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    updateCalendar();
}

function goToToday() {
    currentCalendarDate = new Date();
    updateCalendar();
    
    // Update the date input to today's date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    document.getElementById('dateInput').value = dateString;
}

function goToSpecificDate() {
    const dateInput = document.getElementById('dateInput');
    const selectedDate = dateInput.value;
    
    if (selectedDate) {
        const date = new Date(selectedDate);
        currentCalendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
        updateCalendar();
        
        // Highlight the selected date after calendar update
        setTimeout(() => {
            const dayElements = document.querySelectorAll('.calendar-day:not(.other-month)');
            dayElements.forEach(el => el.classList.remove('selected'));
            
            const targetDay = date.getDate();
            const targetElement = document.querySelector(`.calendar-day:not(.other-month)[data-day="${targetDay}"]`);
            if (targetElement) {
                targetElement.classList.add('selected');
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}

// Tab Functions
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
    
    // Add active class to clicked button - find the button that corresponds to this tab
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName.toLowerCase())) {
            btn.classList.add('active');
        }
    });
}

// Stopwatch Functions
function startStopwatch() {
    if (!stopwatchRunning) {
        stopwatchRunning = true;
        const startTime = Date.now() - stopwatchTime;
        stopwatchInterval = setInterval(() => {
            stopwatchTime = Date.now() - startTime;
            updateStopwatchDisplay();
        }, 10);
    }
}

function pauseStopwatch() {
    stopwatchRunning = false;
    if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
    }
}

function resetStopwatch() {
    pauseStopwatch();
    stopwatchTime = 0;
    lapCounter = 1;
    updateStopwatchDisplay();
    document.getElementById('lapTimes').innerHTML = '';
}

function lapStopwatch() {
    if (stopwatchRunning) {
        const lapTime = formatStopwatchTime(stopwatchTime);
        const lapDiv = document.createElement('div');
        lapDiv.className = 'info-item';
        lapDiv.innerHTML = `<span>Lap ${lapCounter}:</span><span>${lapTime}</span>`;
        const lapTimes = document.getElementById('lapTimes');
        lapTimes.insertBefore(lapDiv, lapTimes.firstChild); // Add to top
        lapCounter++;
        
        // Limit to 10 laps
        const laps = lapTimes.querySelectorAll('.info-item');
        if (laps.length > 10) {
            lapTimes.removeChild(laps[laps.length - 1]);
        }
    }
}

function updateStopwatchDisplay() {
    document.getElementById('stopwatchDisplay').textContent = formatStopwatchTime(stopwatchTime);
}

function formatStopwatchTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Timer Functions
function startTimer() {
    // Get timer inputs
    const hours = parseInt(document.getElementById('timerHours').value) || 0;
    const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
    const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
    
    // Validate inputs
    if (hours < 0 || hours > 23) {
        alert('Hours must be between 0 and 23');
        return;
    }
    if (minutes < 0 || minutes > 59) {
        alert('Minutes must be between 0 and 59');
        return;
    }
    if (seconds < 0 || seconds > 59) {
        alert('Seconds must be between 0 and 59');
        return;
    }
    
    // If timer is not running and no time is set, set time from inputs
    if (!timerRunning && timerTime === 0) {
        const totalSeconds = (hours * 3600 + minutes * 60 + seconds);
        if (totalSeconds === 0) {
            alert('Please set a time for the timer');
            return;
        }
        timerTime = totalSeconds * 1000;
        updateTimerDisplay();
    }
    
    // Start the timer if it's not running and has time
    if (!timerRunning && timerTime > 0) {
        timerRunning = true;
        timerInterval = setInterval(() => {
            timerTime -= 1000;
            updateTimerDisplay();
            
            if (timerTime <= 0) {
                timerTime = 0;
                pauseTimer();
                if (audioEnabled) {
                    const alarmSound = document.getElementById('alarmSound');
                    if (alarmSound) {
                        alarmSound.play().catch(e => console.log('Audio play failed:', e));
                    }
                }
                showNotification('Timer Finished!', 'Your timer has completed.');
            }
        }, 1000);
    }
}

function pauseTimer() {
    timerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const alarmSound = document.getElementById('alarmSound');
    if (alarmSound) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
    }
}

function resetTimer() {
    pauseTimer();
    timerTime = 0;
    updateTimerDisplay();
    document.getElementById('timerHours').value = '';
    document.getElementById('timerMinutes').value = '';
    document.getElementById('timerSeconds').value = '';
}

function updateTimerDisplay() {
    document.getElementById('timerDisplay').textContent = formatTime(timerTime);
}

// Utility Functions
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Enhanced notification function
function showNotification(title, message) {
    // Try to use browser notifications if available
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM1NmNjZjIiLz4KPHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCwyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTMTcuNTIgMiAxMiAyeiIgZmlsbD0iI2ZmZiIvPgo8L3N2Zz4KPC9zdmc+'
        });
    } else {
        // Fallback to alert
        alert(`${title}\n${message}`);
    }
}

// Request notification permission on load
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Customization Functions
function openCustomization() {
    document.getElementById('customizationModal').classList.remove('hidden');
    updateGradientSelection();
}

function closeCustomization() {
    document.getElementById('customizationModal').classList.add('hidden');
}

function openHelp() {
    document.getElementById('helpModal').classList.remove('hidden');
}

function closeHelp() {
    document.getElementById('helpModal').classList.add('hidden');
}

function setGradient(color1, color2) {
    currentGradient = { color1, color2 };
    customBackground = null;
    applyBackground();
    saveSettings();
    updateGradientSelection();
    showCustomizationFeedback('Gradient applied!');
}

function setCustomBackground(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size too large. Please choose an image under 5MB.');
            return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            customBackground = e.target.result;
            applyBackground();
            saveSettings();
            updateGradientSelection();
            showCustomizationFeedback('Custom background applied!');
        };
        reader.onerror = function() {
            alert('Error reading file. Please try again.');
        };
        reader.readAsDataURL(file);
    }
}

function resetBackground() {
    customBackground = null;
    currentGradient = { color1: '56ccf2', color2: '2f80ed' };
    applyBackground();
    saveSettings();
    updateGradientSelection();
    
    // Reset file input
    const fileInput = document.getElementById('backgroundUpload');
    if (fileInput) fileInput.value = '';
    
    showCustomizationFeedback('Background reset to default!');
}

function updateGradientSelection() {
    // Remove all previous selections
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selection to current gradient if no custom background
    if (!customBackground) {
        const currentGradientString = `linear-gradient(135deg, #${currentGradient.color1}, #${currentGradient.color2})`;
        document.querySelectorAll('.color-option').forEach(option => {
            if (option.style.background === currentGradientString) {
                option.classList.add('selected');
            }
        });
    }
}

function showCustomizationFeedback(message) {
    // Create or update feedback element
    let feedback = document.getElementById('customizationFeedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'customizationFeedback';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--secondary-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10001;
            font-weight: 500;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(feedback);
    }
    
    feedback.textContent = message;
    feedback.style.opacity = '1';
    
    setTimeout(() => {
        feedback.style.opacity = '0';
    }, 2000);
}

function applyBackground() {
    if (customBackground) {
        document.body.style.background = `url(${customBackground})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';
    } else {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundAttachment = 'fixed';
        updateBackgroundBasedOnTime();
    }
}

// Enhanced customization functions
function toggleAutoTimeGradient() {
    const checkbox = document.getElementById('autoTimeGradient');
    const autoTimeEnabled = checkbox.checked;
    
    // Save setting
    const settings = JSON.parse(localStorage.getItem('clockSettings') || '{}');
    settings.autoTimeGradient = autoTimeEnabled;
    localStorage.setItem('clockSettings', JSON.stringify(settings));
    
    if (autoTimeEnabled) {
        updateBackgroundBasedOnTime();
        showCustomizationFeedback('Auto time-based colors enabled!');
    } else {
        showCustomizationFeedback('Auto time-based colors disabled!');
    }
}

function updateBackgroundOpacity(value) {
    const opacity = parseFloat(value);
    const percentage = Math.round(opacity * 100);
    document.getElementById('opacityValue').textContent = percentage + '%';
    
    // Apply opacity to the background
    document.body.style.filter = `opacity(${opacity})`;
    
    // Save setting
    const settings = JSON.parse(localStorage.getItem('clockSettings') || '{}');
    settings.backgroundOpacity = opacity;
    localStorage.setItem('clockSettings', JSON.stringify(settings));
}

function initializeCustomizationSettings() {
    const settings = JSON.parse(localStorage.getItem('clockSettings') || '{}');
    
    // Set auto time gradient
    const autoTimeCheckbox = document.getElementById('autoTimeGradient');
    if (autoTimeCheckbox) {
        autoTimeCheckbox.checked = settings.autoTimeGradient !== false;
    }
    
    // Set background opacity
    const opacitySlider = document.getElementById('backgroundOpacity');
    const opacityValue = document.getElementById('opacityValue');
    if (opacitySlider && opacityValue) {
        const opacity = settings.backgroundOpacity || 1;
        opacitySlider.value = opacity;
        opacityValue.textContent = Math.round(opacity * 100) + '%';
        document.body.style.filter = `opacity(${opacity})`;
    }
}
