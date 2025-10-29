class TimeManager {
    constructor() {
        this.stopwatchTime = 0;
        this.stopwatchInterval = null;
        this.stopwatchRunning = false;
        this.lapCount = 0;
        this.laps = [];
        
        this.timerTime = 0;
        this.timerInterval = null;
        this.timerRunning = false;
        this.previousTimerTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupNavigation();
        this.setupStopwatch();
        this.setupTimer();
        this.setupWorldClock();
        this.updateWorldClocks();
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Update world clocks every second
        setInterval(() => this.updateWorldClocks(), 1000);
    }
    
    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Update active nav button
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(tab => tab.classList.remove('active'));
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }
    
    setupStopwatch() {
        const startBtn = document.getElementById('stopwatch-start');
        const resetBtn = document.getElementById('stopwatch-reset');
        
        startBtn.addEventListener('click', () => {
            if (this.stopwatchRunning) {
                this.stopStopwatch();
                this.addLap();
            } else {
                this.startStopwatch();
            }
        });
        
        resetBtn.addEventListener('click', () => {
            this.resetStopwatch();
        });
    }
    
    startStopwatch() {
        this.stopwatchRunning = true;
        const startBtn = document.getElementById('stopwatch-start');
        startBtn.textContent = 'Lap';
        startBtn.classList.add('stop');
        
        this.stopwatchInterval = setInterval(() => {
            this.stopwatchTime += 10;
            this.updateStopwatchDisplay();
        }, 10);
    }
    
    stopStopwatch() {
        this.stopwatchRunning = false;
        const startBtn = document.getElementById('stopwatch-start');
        startBtn.textContent = 'Start';
        startBtn.classList.remove('stop');
        
        clearInterval(this.stopwatchInterval);
    }
    
    resetStopwatch() {
        this.stopStopwatch();
        this.stopwatchTime = 0;
        this.lapCount = 0;
        this.laps = [];
        this.updateStopwatchDisplay();
        this.updateLapsDisplay();
        
        const startBtn = document.getElementById('stopwatch-start');
        startBtn.textContent = 'Start';
        startBtn.classList.remove('stop');
    }
    
    addLap() {
        this.lapCount++;
        const lapTime = this.stopwatchTime;
        const splitTime = this.laps.length > 0 ? lapTime - this.laps[this.laps.length - 1].total : lapTime;
        
        this.laps.push({
            number: this.lapCount,
            split: splitTime,
            total: lapTime
        });
        
        this.updateLapsDisplay();
    }
    
    updateStopwatchDisplay() {
        const display = document.getElementById('stopwatch-time');
        display.textContent = this.formatTime(this.stopwatchTime, true);
    }
    
    updateLapsDisplay() {
        const lapsList = document.getElementById('laps-list');
        lapsList.innerHTML = '';
        
        this.laps.slice().reverse().forEach(lap => {
            const lapItem = document.createElement('div');
            lapItem.className = 'lap-item';
            lapItem.innerHTML = `
                <span>Lap ${lap.number}</span>
                <span>${this.formatTime(lap.split, true)}</span>
                <span>${this.formatTime(lap.total, true)}</span>
            `;
            lapsList.appendChild(lapItem);
        });
    }
    
    setupTimer() {
        const startBtn = document.getElementById('timer-start');
        
        // Initialize timer values
        this.timerHours = 5;
        this.timerMinutes = 15;
        this.timerSeconds = 4;
        
        // Setup scroll pickers
        this.setupScrollPicker('hours', 24, 5);
        this.setupScrollPicker('minutes', 60, 15);
        this.setupScrollPicker('seconds', 60, 4);
        
        startBtn.addEventListener('click', () => {
            if (this.timerRunning) {
                this.stopTimer();
            } else {
                const totalSeconds = this.timerHours * 3600 + this.timerMinutes * 60 + this.timerSeconds;
                if (totalSeconds > 0) {
                    this.startTimer(totalSeconds);
                }
            }
        });
        
        const cancelBtn = document.getElementById('timer-cancel');
        cancelBtn.addEventListener('click', () => {
            this.resetTimer();
        });
        
        this.updateTimerPicker();
    }
    
    setupScrollPicker(type, maxValue, defaultValue) {
        const optionsContainer = document.getElementById(`${type}-options`);
        const wheel = document.getElementById(`${type}-wheel`);
        
        // Create options
        for (let i = 0; i < maxValue; i++) {
            const option = document.createElement('div');
            option.className = 'picker-option';
            option.textContent = i;
            option.dataset.value = i;
            
            if (i === defaultValue) {
                option.classList.add('selected');
            }
            
            option.addEventListener('click', () => {
                this.selectPickerValue(type, i);
            });
            
            optionsContainer.appendChild(option);
        }
        
        // Simple wheel scroll
        let scrollAccumulator = 0;
        const scrollThreshold = 120;
        
        wheel.addEventListener('wheel', (e) => {
            if (this.timerRunning) return;
            
            e.preventDefault();
            scrollAccumulator += e.deltaY;
            
            if (Math.abs(scrollAccumulator) >= scrollThreshold) {
                const currentValue = this[`timer${type.charAt(0).toUpperCase() + type.slice(1)}`];
                const delta = scrollAccumulator > 0 ? 1 : -1;
                const newValue = Math.max(0, Math.min(maxValue - 1, currentValue + delta));
                
                if (newValue !== currentValue) {
                    this.selectPickerValue(type, newValue);
                }
                
                scrollAccumulator = 0;
            }
        });
        
        // Simple touch/drag
        let touchStartY = 0;
        let isDragging = false;
        let dragAccumulator = 0;
        const dragThreshold = 70;
        
        wheel.addEventListener('touchstart', (e) => {
            if (this.timerRunning) return;
            touchStartY = e.touches[0].clientY;
            isDragging = true;
            dragAccumulator = 0;
        });
        
        wheel.addEventListener('touchmove', (e) => {
            if (!isDragging || this.timerRunning) return;
            e.preventDefault();
            
            const touchCurrentY = e.touches[0].clientY;
            const diff = touchStartY - touchCurrentY;
            
            dragAccumulator += diff;
            
            if (Math.abs(dragAccumulator) >= dragThreshold) {
                const currentValue = this[`timer${type.charAt(0).toUpperCase() + type.slice(1)}`];
                const delta = dragAccumulator > 0 ? 1 : -1;
                const newValue = Math.max(0, Math.min(maxValue - 1, currentValue + delta));
                
                if (newValue !== currentValue) {
                    this.selectPickerValue(type, newValue);
                }
                
                dragAccumulator = 0;
                touchStartY = touchCurrentY;
            }
        });
        
        wheel.addEventListener('touchend', () => {
            isDragging = false;
            dragAccumulator = 0;
        });
        
        // Simple mouse drag
        let mouseStartY = 0;
        let isMouseDragging = false;
        let mouseDragAccumulator = 0;
        
        wheel.addEventListener('mousedown', (e) => {
            if (this.timerRunning) return;
            mouseStartY = e.clientY;
            isMouseDragging = true;
            mouseDragAccumulator = 0;
            e.preventDefault();
        });
        
        wheel.addEventListener('mousemove', (e) => {
            if (!isMouseDragging || this.timerRunning) return;
            e.preventDefault();
            
            const mouseCurrentY = e.clientY;
            const diff = mouseStartY - mouseCurrentY;
            
            mouseDragAccumulator += diff;
            
            if (Math.abs(mouseDragAccumulator) >= dragThreshold) {
                const currentValue = this[`timer${type.charAt(0).toUpperCase() + type.slice(1)}`];
                const delta = mouseDragAccumulator > 0 ? 1 : -1;
                const newValue = Math.max(0, Math.min(maxValue - 1, currentValue + delta));
                
                if (newValue !== currentValue) {
                    this.selectPickerValue(type, newValue);
                }
                
                mouseDragAccumulator = 0;
                mouseStartY = mouseCurrentY;
            }
        });
        
        wheel.addEventListener('mouseup', () => {
            isMouseDragging = false;
            mouseDragAccumulator = 0;
        });
        
        wheel.addEventListener('mouseleave', () => {
            isMouseDragging = false;
            mouseDragAccumulator = 0;
        });
        
        // Set initial position
        this.updatePickerPosition(type, defaultValue);
        
        // Update selection display
        this.updateSelectionDisplay();
    }
    
    selectPickerValue(type, value) {
        if (this.timerRunning) return;
        
        // Update internal value
        this[`timer${type.charAt(0).toUpperCase() + type.slice(1)}`] = value;
        
        // Update visual selection
        const options = document.querySelectorAll(`#${type}-options .picker-option`);
        options.forEach((option, index) => {
            option.classList.toggle('selected', index === value);
        });
        
        // Update position
        this.updatePickerPosition(type, value);
        
        // Update selection display and timer
        this.updateSelectionDisplay();
        this.updateTimerPicker();
    }
    
    updatePickerPosition(type, value) {
        const optionsContainer = document.getElementById(`${type}-options`);
        const offset = -value * 40; // 40px per option
        optionsContainer.style.transform = `translateY(${offset}px)`;
    }
    
    updateSelectionDisplay() {
        document.getElementById('selected-hours').textContent = this.timerHours;
        document.getElementById('selected-minutes').textContent = this.timerMinutes;
        document.getElementById('selected-seconds').textContent = this.timerSeconds;
    }
    
    startTimer(seconds) {
        if (seconds <= 0) return;
        
        this.timerTime = seconds;
        this.previousTimerTime = seconds;
        this.timerRunning = true;
        const startBtn = document.getElementById('timer-start');
        startBtn.textContent = 'Stop';
        startBtn.classList.add('stop');
        
        // Show flip clock and hide scroll picker
        document.querySelector('.flip-clock').classList.add('active');
        document.querySelector('.timer-controls').style.display = 'none';
        this.initializeFlipDisplay();
        
        this.timerInterval = setInterval(() => {
            this.previousTimerTime = this.timerTime;
            this.timerTime--;
            this.updateTimerDisplay();
            
            if (this.timerTime <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }
    
    stopTimer() {
        this.timerRunning = false;
        const startBtn = document.getElementById('timer-start');
        startBtn.textContent = 'Start';
        startBtn.classList.remove('stop');
        
        // Hide flip clock and show scroll picker
        document.querySelector('.flip-clock').classList.remove('active');
        document.querySelector('.timer-controls').style.display = 'flex';
        
        clearInterval(this.timerInterval);
    }
    
    resetTimer() {
        this.stopTimer();
        this.timerHours = 5;
        this.timerMinutes = 15;
        this.timerSeconds = 4;
        this.timerTime = this.timerHours * 3600 + this.timerMinutes * 60 + this.timerSeconds;
        
        // Reset picker positions
        this.selectPickerValue('hours', 5);
        this.selectPickerValue('minutes', 15);
        this.selectPickerValue('seconds', 4);
        
        this.updateTimerDisplay();
        this.updateTimerPicker();
    }
    
    updateTimerPicker() {
        if (!this.timerRunning) {
            this.timerTime = this.timerHours * 3600 + this.timerMinutes * 60 + this.timerSeconds;
            this.updateTimerDisplay();
        }
    }
    
    timerComplete() {
        this.stopTimer();
        
        // Visual feedback
        const display = document.getElementById('timer-time');
        display.style.color = '#ff4444';
        display.style.animation = 'pulse 1s infinite';
        
        // Audio notification
        this.playTimerSound();
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
                body: 'Your timer has finished.',
                icon: '/favicon.ico'
            });
        } else {
            alert('Timer finished!');
        }
        
        // Reset after 3 seconds
        setTimeout(() => {
            const flipClock = document.querySelector('.flip-clock');
            flipClock.style.color = '#7BB3FF';
            flipClock.style.animation = '';
            this.resetTimer();
        }, 3000);
    }
    
    playTimerSound() {
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    updateTimerDisplay() {
        const display = document.getElementById('timer-time');
        const hours = Math.floor(this.timerTime / 3600);
        const minutes = Math.floor((this.timerTime % 3600) / 60);
        const seconds = this.timerTime % 60;
        
        if (hours > 0) {
            display.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update flip display if running
        if (this.timerRunning) {
            this.updateFlipDisplay(minutes, seconds);
        }
    }
    
    initializeFlipDisplay() {
        const hours = Math.floor(this.timerTime / 3600);
        const minutes = Math.floor((this.timerTime % 3600) / 60);
        const seconds = this.timerTime % 60;
        const secondsTens = Math.floor(seconds / 10);
        const secondsOnes = seconds % 10;
        
        // Show/hide hours display based on timer value
        const hoursUnit = document.getElementById('hours-flip-unit');
        const hoursSeparator = document.getElementById('hours-separator');
        
        if (hours > 0) {
            hoursUnit.style.display = 'block';
            hoursSeparator.style.display = 'block';
            this.setFlipValue('hours-flip', hours);
        } else {
            hoursUnit.style.display = 'none';
            hoursSeparator.style.display = 'none';
        }
        
        // Set initial values without animation
        this.setFlipValue('minutes-flip', minutes);
        this.setFlipValue('seconds-tens-flip', secondsTens);
        this.setFlipValue('seconds-ones-flip', secondsOnes);
    }
    
    updateFlipDisplay(minutes, seconds) {
        const hours = Math.floor(this.timerTime / 3600);
        const prevHours = Math.floor(this.previousTimerTime / 3600);
        const prevMinutes = Math.floor((this.previousTimerTime % 3600) / 60);
        const prevSeconds = this.previousTimerTime % 60;
        
        const secondsTens = Math.floor(seconds / 10);
        const secondsOnes = seconds % 10;
        const prevSecondsTens = Math.floor(prevSeconds / 10);
        const prevSecondsOnes = prevSeconds % 10;
        
        // Show/hide hours display
        const hoursUnit = document.getElementById('hours-flip-unit');
        const hoursSeparator = document.getElementById('hours-separator');
        
        if (hours > 0 || prevHours > 0) {
            hoursUnit.style.display = 'block';
            hoursSeparator.style.display = 'block';
            
            if (hours !== prevHours) {
                this.flipValue('hours-flip', hours);
            }
        } else {
            hoursUnit.style.display = 'none';
            hoursSeparator.style.display = 'none';
        }
        
        // Animate changes
        if (minutes !== prevMinutes) {
            this.flipValue('minutes-flip', minutes);
        }
        
        if (secondsTens !== prevSecondsTens) {
            this.flipValue('seconds-tens-flip', secondsTens);
        }
        
        if (secondsOnes !== prevSecondsOnes) {
            this.flipValue('seconds-ones-flip', secondsOnes);
        }
    }
    
    setFlipValue(cardId, value) {
        const card = document.getElementById(cardId);
        const front = card.querySelector('.flip-card-front span');
        const back = card.querySelector('.flip-card-back span');
        
        front.textContent = value;
        back.textContent = value;
    }
    
    flipValue(cardId, newValue) {
        const card = document.getElementById(cardId);
        const front = card.querySelector('.flip-card-front span');
        const back = card.querySelector('.flip-card-back span');
        
        // Set the new value on the back
        back.textContent = newValue;
        
        // Add flip animation
        card.classList.add('flip-down');
        
        // After animation completes, update front and reset
        setTimeout(() => {
            front.textContent = newValue;
            card.classList.remove('flip-down');
            
            // Reset the card position
            const inner = card.querySelector('.flip-card-inner');
            inner.style.transform = 'rotateX(0deg)';
        }, 600);
    }
    
    setupWorldClock() {
        const addClockBtn = document.getElementById('add-clock-btn');
        const modal = document.getElementById('clock-modal');
        const closeModal = document.getElementById('close-modal');
        const searchInput = document.getElementById('clock-search');
        const clockList = document.getElementById('clock-list');
        
        // Available timezones with city names
        this.availableClocks = [
            { city: 'New York', timezone: 'America/New_York', country: 'USA' },
            { city: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'USA' },
            { city: 'Chicago', timezone: 'America/Chicago', country: 'USA' },
            { city: 'London', timezone: 'Europe/London', country: 'UK' },
            { city: 'Paris', timezone: 'Europe/Paris', country: 'France' },
            { city: 'Berlin', timezone: 'Europe/Berlin', country: 'Germany' },
            { city: 'Rome', timezone: 'Europe/Rome', country: 'Italy' },
            { city: 'Madrid', timezone: 'Europe/Madrid', country: 'Spain' },
            { city: 'Moscow', timezone: 'Europe/Moscow', country: 'Russia' },
            { city: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan' },
            { city: 'Seoul', timezone: 'Asia/Seoul', country: 'South Korea' },
            { city: 'Beijing', timezone: 'Asia/Shanghai', country: 'China' },
            { city: 'Hong Kong', timezone: 'Asia/Hong_Kong', country: 'Hong Kong' },
            { city: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore' },
            { city: 'Mumbai', timezone: 'Asia/Kolkata', country: 'India' },
            { city: 'Dubai', timezone: 'Asia/Dubai', country: 'UAE' },
            { city: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia' },
            { city: 'Melbourne', timezone: 'Australia/Melbourne', country: 'Australia' },
            { city: 'Auckland', timezone: 'Pacific/Auckland', country: 'New Zealand' },
            { city: 'São Paulo', timezone: 'America/Sao_Paulo', country: 'Brazil' },
            { city: 'Mexico City', timezone: 'America/Mexico_City', country: 'Mexico' },
            { city: 'Toronto', timezone: 'America/Toronto', country: 'Canada' },
            { city: 'Vancouver', timezone: 'America/Vancouver', country: 'Canada' }
        ];
        
        addClockBtn.addEventListener('click', () => {
            modal.classList.add('active');
            this.renderClockList();
            searchInput.focus();
        });
        
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        searchInput.addEventListener('input', () => {
            this.renderClockList(searchInput.value);
        });
        
        // Setup remove clock functionality
        this.setupRemoveClocks();
    }
    
    renderClockList(searchTerm = '') {
        const clockList = document.getElementById('clock-list');
        const existingTimezones = Array.from(document.querySelectorAll('.clock-item')).map(item => item.dataset.timezone);
        
        const filteredClocks = this.availableClocks.filter(clock => {
            const matchesSearch = clock.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                clock.country.toLowerCase().includes(searchTerm.toLowerCase());
            const notExists = !existingTimezones.includes(clock.timezone);
            return matchesSearch && notExists;
        });
        
        clockList.innerHTML = '';
        
        filteredClocks.forEach(clock => {
            const clockOption = document.createElement('div');
            clockOption.className = 'clock-option';
            
            const currentTime = new Date().toLocaleTimeString('en-US', {
                timeZone: clock.timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            
            clockOption.innerHTML = `
                <div class="clock-option-info">
                    <div class="clock-option-city">${clock.city}</div>
                    <div class="clock-option-timezone">${clock.country}</div>
                </div>
                <div class="clock-option-time">${currentTime}</div>
            `;
            
            clockOption.addEventListener('click', () => {
                this.addClock(clock);
                document.getElementById('clock-modal').classList.remove('active');
            });
            
            clockList.appendChild(clockOption);
        });
    }
    
    addClock(clock) {
        const worldClocks = document.getElementById('world-clocks');
        
        const clockItem = document.createElement('div');
        clockItem.className = 'clock-item';
        clockItem.dataset.timezone = clock.timezone;
        
        clockItem.innerHTML = `
            <div class="clock-info">
                <div class="city-name">${clock.city}</div>
                <div class="clock-time"></div>
            </div>
            <button class="remove-clock-btn">×</button>
        `;
        
        worldClocks.appendChild(clockItem);
        this.setupRemoveClocks();
        this.updateWorldClocks();
    }
    
    setupRemoveClocks() {
        const removeButtons = document.querySelectorAll('.remove-clock-btn');
        removeButtons.forEach(btn => {
            btn.replaceWith(btn.cloneNode(true)); // Remove existing listeners
        });
        
        document.querySelectorAll('.remove-clock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.closest('.clock-item').remove();
            });
        });
    }
    
    updateWorldClocks() {
        const clockItems = document.querySelectorAll('.clock-item');
        
        clockItems.forEach(item => {
            const timezone = item.dataset.timezone;
            const timeElement = item.querySelector('.clock-time');
            
            if (timezone && timeElement) {
                const time = new Date().toLocaleTimeString('en-US', {
                    timeZone: timezone,
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                timeElement.textContent = time;
            }
        });
    }
    
    formatTime(milliseconds, includeHundredths = false) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const hundredths = Math.floor((milliseconds % 1000) / 10);
        
        if (includeHundredths) {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimeManager();
});