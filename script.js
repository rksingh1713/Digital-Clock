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

let pomodoroRunning = false;
let pomodoroTime = 25 * 60; // 25 minutes in seconds
let pomodoroInterval = null;
let pomodoroSession = 'focus'; // 'focus', 'shortBreak', 'longBreak'
let pomodoroCount = 0;

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
    loadNotes();
    loadTodos();
    
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
    setInterval(updateSystemInfo, 5000);
    setInterval(fetchWeather, 300000); // Update weather every 5 minutes
    
    // Apply saved background
    applyBackground();
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
        // Morning
        gradient = `linear-gradient(135deg, #${currentGradient.color1}, #${currentGradient.color2})`;
    } else if (hour >= 12 && hour < 18) {
        // Afternoon
        gradient = `linear-gradient(135deg, #74b9ff, #0984e3)`;
    } else if (hour >= 18 && hour < 21) {
        // Evening
        gradient = `linear-gradient(135deg, #fd79a8, #fdcb6e)`;
    } else {
        // Night
        gradient = `linear-gradient(135deg, #0f2027, #203a43, #2c5364)`;
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
            const apiKey = "dd6a7e5451e86c14dcf5531b155bb2ac";
            
            // Get current weather
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
                .then(res => res.json())
                .then(data => {
                    currentWeatherData = data;
                    displayWeather(data);
                    playAmbientSound(data.weather[0].main.toLowerCase());
                })
                .catch(() => {
                    document.getElementById('weatherDesc').textContent = "Weather unavailable";
                });
            
            // Get hourly forecast
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`)
                .then(res => res.json())
                .then(data => {
                    hourlyForecast = data.list.slice(0, 6);
                    displayHourlyForecast();
                })
                .catch(err => console.log('Forecast error:', err));
            
            // Get air quality
            fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
                .then(res => res.json())
                .then(data => {
                    displayAirQuality(data);
                })
                .catch(err => console.log('Air quality error:', err));
                
        }, () => {
            document.getElementById('weatherDesc').textContent = "Location not allowed";
        });
    } else {
        document.getElementById('weatherDesc').textContent = "Geolocation not supported";
    }
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
    document.getElementById(tabName + 'Tab').classList.remove('hidden');
    
    // Add active class to clicked button
    event.target.closest('.tab-btn').classList.add('active');
}

// Stopwatch Functions
function startStopwatch() {
    if (!stopwatchRunning) {
        stopwatchRunning = true;
        stopwatchInterval = setInterval(() => {
            stopwatchTime += 10;
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
        const lapTime = formatTime(stopwatchTime);
        const lapDiv = document.createElement('div');
        lapDiv.className = 'info-item';
        lapDiv.innerHTML = `<span>Lap ${lapCounter}:</span><span>${lapTime}</span>`;
        document.getElementById('lapTimes').appendChild(lapDiv);
        lapCounter++;
    }
}

function updateStopwatchDisplay() {
    document.getElementById('stopwatchDisplay').textContent = formatTime(stopwatchTime);
}

// Timer Functions
function startTimer() {
    if (!timerRunning && timerTime > 0) {
        timerRunning = true;
        timerInterval = setInterval(() => {
            timerTime -= 1000;
            updateTimerDisplay();
            
            if (timerTime <= 0) {
                timerTime = 0;
                pauseTimer();
                if (audioEnabled) {
                    document.getElementById('alarmSound').play().catch(() => {});
                }
                alert('Timer finished!');
            }
        }, 1000);
    } else if (timerTime === 0) {
        // Set timer from inputs
        const hours = parseInt(document.getElementById('timerHours').value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
        
        timerTime = (hours * 3600 + minutes * 60 + seconds) * 1000;
        updateTimerDisplay();
    }
}

function pauseTimer() {
    timerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    document.getElementById('alarmSound').pause();
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

// Pomodoro Functions
function startPomodoro() {
    if (!pomodoroRunning) {
        pomodoroRunning = true;
        pomodoroInterval = setInterval(() => {
            pomodoroTime--;
            updatePomodoroDisplay();
            updatePomodoroProgress();
            
            if (pomodoroTime <= 0) {
                pomodoroTime = 0;
                pausePomodoro();
                completePomodoro();
            }
        }, 1000);
    }
}

function pausePomodoro() {
    pomodoroRunning = false;
    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }
}

function resetPomodoro() {
    pausePomodoro();
    initializePomodoro();
}

function skipPomodoro() {
    pausePomodoro();
    completePomodoro();
}

function completePomodoro() {
    if (audioEnabled) {
        document.getElementById('alarmSound').play().catch(() => {});
    }
    
    if (pomodoroSession === 'focus') {
        pomodoroCount++;
        if (pomodoroCount % 4 === 0) {
            // Long break after 4 focus sessions
            pomodoroSession = 'longBreak';
            pomodoroTime = 15 * 60; // 15 minutes
        } else {
            // Short break
            pomodoroSession = 'shortBreak';
            pomodoroTime = 5 * 60; // 5 minutes
        }
    } else {
        // Back to focus session
        pomodoroSession = 'focus';
        pomodoroTime = 25 * 60; // 25 minutes
    }
    
    updatePomodoroDisplay();
    updatePomodoroStatus();
    updatePomodoroProgress();
}

function initializePomodoro() {
    pomodoroSession = 'focus';
    pomodoroTime = 25 * 60;
    pomodoroCount = 0;
    updatePomodoroDisplay();
    updatePomodoroStatus();
    updatePomodoroProgress();
}

function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroTime / 60);
    const seconds = pomodoroTime % 60;
    document.getElementById('pomodoroDisplay').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updatePomodoroStatus() {
    const statusMap = {
        'focus': 'Focus Session',
        'shortBreak': 'Short Break',
        'longBreak': 'Long Break'
    };
    document.getElementById('pomodoroStatus').textContent = statusMap[pomodoroSession];
}

function updatePomodoroProgress() {
    const totalTime = pomodoroSession === 'focus' ? 25 * 60 : 
                     pomodoroSession === 'shortBreak' ? 5 * 60 : 15 * 60;
    const progress = ((totalTime - pomodoroTime) / totalTime) * 100;
    document.getElementById('pomodoroBar').style.width = progress + '%';
}

// Utility Functions
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Customization Functions
function openCustomization() {
    document.getElementById('customizationModal').classList.remove('hidden');
}

function closeCustomization() {
    document.getElementById('customizationModal').classList.add('hidden');
}

function setGradient(color1, color2) {
    currentGradient = { color1, color2 };
    customBackground = null;
    applyBackground();
    saveSettings();
}

function setCustomBackground(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            customBackground = e.target.result;
            applyBackground();
            saveSettings();
        };
        reader.readAsDataURL(file);
    }
}

function resetBackground() {
    customBackground = null;
    currentGradient = { color1: '56ccf2', color2: '2f80ed' };
    applyBackground();
    saveSettings();
}

function applyBackground() {
    if (customBackground) {
        document.body.style.background = `url(${customBackground})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        document.body.style.backgroundImage = 'none';
        updateBackgroundBasedOnTime();
    }
}

// Productivity Functions
function loadNotes() {
    const notes = localStorage.getItem('clockNotes') || '';
    document.getElementById('notesArea').value = notes;
    
    document.getElementById('notesArea').addEventListener('input', function() {
        localStorage.setItem('clockNotes', this.value);
    });
}

function loadTodos() {
    const todos = JSON.parse(localStorage.getItem('clockTodos') || '[]');
    renderTodos(todos);
}

function handleTodoKeyPress(event) {
    if (event.key === 'Enter') {
        addTodo();
    }
}

function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (text) {
        const todos = JSON.parse(localStorage.getItem('clockTodos') || '[]');
        todos.push({ id: Date.now(), text: text, completed: false });
        localStorage.setItem('clockTodos', JSON.stringify(todos));
        input.value = '';
        renderTodos(todos);
    }
}

function toggleTodo(id) {
    const todos = JSON.parse(localStorage.getItem('clockTodos') || '[]');
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        localStorage.setItem('clockTodos', JSON.stringify(todos));
        renderTodos(todos);
    }
}

function deleteTodo(id) {
    const todos = JSON.parse(localStorage.getItem('clockTodos') || '[]');
    const filtered = todos.filter(t => t.id !== id);
    localStorage.setItem('clockTodos', JSON.stringify(filtered));
    renderTodos(filtered);
}

function renderTodos(todos) {
    const container = document.getElementById('todoList');
    container.innerHTML = todos.map(todo => `
        <div class="todo-item">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo(${todo.id})">
            <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
            <button class="timer-btn" onclick="deleteTodo(${todo.id})" style="margin-left: auto; padding: 4px 8px; font-size: 0.8rem;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Initialize Pomodoro on load
initializePomodoro();
