// To-Do List Life Dashboard - Main Script File

// ============================================================================
// APPLICATION STATE
// ============================================================================

const AppState = {
  // Task state
  tasks: [],
  taskCounter: 0,

  // Timer state (transient)
  timer: {
    timeRemaining: 1500,      // seconds (25 minutes)
    isRunning: false,
    isPaused: false,
    intervalId: null
  },

  // Quick links state
  quickLinks: [],
  linkCounter: 0,

  // UI state
  editingTaskId: null,
  isInitialized: false
};

// ============================================================================
// LOCAL STORAGE MANAGER
// ============================================================================

const LocalStorageManager = {
  // Constants
  TASKS_KEY: 'dashboard_tasks',
  LINKS_KEY: 'dashboard_quick_links',

  /**
   * Validates a task object against schema requirements
   * @param {object} task - Task to validate
   * @returns {boolean} - True if task is valid
   */
  validateTask(task) {
    if (!task || typeof task !== 'object') return false;
    
    // Check required fields exist
    if (!task.id || !task.text || typeof task.completed !== 'boolean' ||
        typeof task.createdAt !== 'number' || typeof task.updatedAt !== 'number') {
      return false;
    }
    
    // Validate text: non-empty, non-whitespace, ≤500 chars
    if (typeof task.text !== 'string' || task.text.trim() === '' || task.text.length > 500) {
      return false;
    }
    
    // Validate timestamps are positive numbers
    if (task.createdAt < 0 || task.updatedAt < 0) {
      return false;
    }
    
    return true;
  },

  /**
   * Validates a quick link object against schema requirements
   * @param {object} link - Link to validate
   * @returns {boolean} - True if link is valid
   */
  validateLink(link) {
    if (!link || typeof link !== 'object') return false;
    
    // Check required fields exist
    if (!link.id || !link.name || !link.url || typeof link.createdAt !== 'number') {
      return false;
    }
    
    // Validate name: 1-100 characters, non-empty
    if (typeof link.name !== 'string' || link.name.trim() === '' || link.name.length > 100) {
      return false;
    }
    
    // Validate URL: must start with http:// or https://
    if (typeof link.url !== 'string' || (!link.url.startsWith('http://') && !link.url.startsWith('https://'))) {
      return false;
    }
    
    // Validate timestamp is positive number
    if (link.createdAt < 0) {
      return false;
    }
    
    return true;
  },

  /**
   * Saves tasks to LocalStorage with error handling
   * Wraps in try-catch to handle QuotaExceededError and other exceptions
   * On QuotaExceededError, attempts to free space by removing old completed tasks
   * 
   * @param {array} tasks - Array of task objects to save
   * @returns {boolean} - True if save was successful
   */
  saveTasks(tasks) {
    try {
      const data = { tasks: tasks };
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded when saving tasks:', error);
        // Attempt recovery by removing old completed tasks
        this.handleQuotaExceeded('tasks');
        return false;
      } else {
        console.error('Error saving tasks:', error);
        showError('Failed to save tasks to storage');
        return false;
      }
    }
  },

  /**
   * Loads tasks from LocalStorage with validation and error handling
   * Wraps localStorage.getItem() and JSON.parse() in try-catch
   * Handles JSON.parse() errors by resetting to empty state
   * Validates each task and filters out corrupted entries
   * 
   * @returns {array} - Array of valid task objects, or empty array on error
   */
  loadTasks() {
    try {
      // Wrap localStorage.getItem in try-catch for safety
      let stored;
      try {
        stored = localStorage.getItem(this.TASKS_KEY);
      } catch (getError) {
        console.error('Error accessing LocalStorage when loading tasks:', getError);
        showError('Failed to load tasks. Starting fresh.');
        return [];
      }
      
      // If nothing stored, return empty array
      if (!stored) {
        return [];
      }
      
      // Parse JSON - may throw SyntaxError if corrupted
      let data;
      try {
        data = JSON.parse(stored);
      } catch (parseError) {
        console.error('JSON parse error loading tasks:', parseError);
        localStorage.removeItem(this.TASKS_KEY);
        console.warn('Corrupted tasks data removed from LocalStorage');
        showError('Failed to load tasks. Starting fresh.');
        return [];
      }
      
      // Validate structure
      if (!data || !Array.isArray(data.tasks)) {
        console.error('Invalid tasks structure in LocalStorage');
        showError('Failed to load tasks. Starting fresh.');
        return [];
      }
      
      // Filter out corrupted/invalid entries
      const validTasks = data.tasks.filter(task => this.validateTask(task));
      
      // If some tasks were invalid, re-save cleaned data
      if (validTasks.length < data.tasks.length) {
        const invalidCount = data.tasks.length - validTasks.length;
        console.warn(`Removed ${invalidCount} corrupted task(s) from LocalStorage`);
        
        // Re-save cleaned data
        if (validTasks.length > 0) {
          this.saveTasks(validTasks);
        } else {
          localStorage.removeItem(this.TASKS_KEY);
        }
      }
      
      return validTasks;
    } catch (error) {
      console.error('Unexpected error loading tasks:', error);
      showError('Failed to load tasks. Starting fresh.');
      return [];
    }
  },

  /**
   * Saves quick links to LocalStorage with error handling
   * Wraps in try-catch to handle QuotaExceededError and other exceptions
   * 
   * @param {array} links - Array of link objects to save
   * @returns {boolean} - True if save was successful
   */
  saveLinks(links) {
    try {
      const data = { links: links };
      localStorage.setItem(this.LINKS_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded when saving links:', error);
        showError('Storage is full. Please delete some quick links.');
        return false;
      } else {
        console.error('Error saving links:', error);
        showError('Failed to save quick links to storage');
        return false;
      }
    }
  },

  /**
   * Loads quick links from LocalStorage with validation and error handling
   * Wraps localStorage.getItem() and JSON.parse() in try-catch
   * Handles JSON.parse() errors by resetting to empty state
   * Validates each link and filters out corrupted entries
   * 
   * @returns {array} - Array of valid link objects, or empty array on error
   */
  loadLinks() {
    try {
      // Wrap localStorage.getItem in try-catch for safety
      let stored;
      try {
        stored = localStorage.getItem(this.LINKS_KEY);
      } catch (getError) {
        console.error('Error accessing LocalStorage when loading links:', getError);
        showError('Failed to load quick links. Starting fresh.');
        return [];
      }
      
      // If nothing stored, return empty array
      if (!stored) {
        return [];
      }
      
      // Parse JSON - may throw SyntaxError if corrupted
      let data;
      try {
        data = JSON.parse(stored);
      } catch (parseError) {
        console.error('JSON parse error loading links:', parseError);
        localStorage.removeItem(this.LINKS_KEY);
        console.warn('Corrupted links data removed from LocalStorage');
        showError('Failed to load quick links. Starting fresh.');
        return [];
      }
      
      // Validate structure
      if (!data || !Array.isArray(data.links)) {
        console.error('Invalid links structure in LocalStorage');
        showError('Failed to load quick links. Starting fresh.');
        return [];
      }
      
      // Filter out corrupted/invalid entries
      const validLinks = data.links.filter(link => this.validateLink(link));
      
      // If some links were invalid, re-save cleaned data
      if (validLinks.length < data.links.length) {
        const invalidCount = data.links.length - validLinks.length;
        console.warn(`Removed ${invalidCount} corrupted link(s) from LocalStorage`);
        
        // Re-save cleaned data
        if (validLinks.length > 0) {
          this.saveLinks(validLinks);
        } else {
          localStorage.removeItem(this.LINKS_KEY);
        }
      }
      
      return validLinks;
    } catch (error) {
      console.error('Unexpected error loading links:', error);
      showError('Failed to load quick links. Starting fresh.');
      return [];
    }
  },

  /**
   * Handles QuotaExceededError by attempting to free space
   * Strategy: Remove oldest completed tasks (up to 10) and retry
   * This allows users to continue working even with limited storage
   * 
   * @param {string} dataType - Type of data ('tasks' or 'links')
   * @returns {boolean} - True if space was freed, false otherwise
   */
  handleQuotaExceeded(dataType) {
    console.warn(`Storage quota exceeded for ${dataType}`);
    
    if (dataType === 'tasks') {
      // Attempt to free space by removing oldest completed tasks
      const completedTasks = AppState.tasks
        .filter(task => task && task.completed && typeof task.createdAt === 'number')
        .sort((a, b) => a.createdAt - b.createdAt);
      
      if (completedTasks.length > 0) {
        // Remove up to 10 oldest completed tasks
        const toRemove = completedTasks.slice(0, 10);
        let removedCount = 0;
        
        toRemove.forEach(taskToRemove => {
          const index = AppState.tasks.findIndex(t => t.id === taskToRemove.id);
          if (index > -1) {
            AppState.tasks.splice(index, 1);
            removedCount++;
          }
        });
        
        if (removedCount > 0) {
          // Try to save again with freed space
          try {
            this.saveTasks(AppState.tasks);
            console.log(`Successfully freed space by removing ${removedCount} completed tasks`);
            showSuccess('Storage was full. Removed old completed tasks.');
            return true;
          } catch (retryError) {
            console.error('Still cannot save after removing completed tasks:', retryError);
            // Restore the removed tasks to AppState since save still failed
            toRemove.forEach(task => {
              AppState.tasks.push(task);
            });
            AppState.tasks.sort((a, b) => a.createdAt - b.createdAt);
            showError('Storage is full and cannot be freed. Please delete tasks manually.');
            return false;
          }
        }
      }
      
      // No completed tasks to remove
      showError('Storage is full and no completed tasks found to remove. Please delete some tasks.');
      return false;
    }
    
    return false;
  },

  /**
   * Clears a specific key from LocalStorage
   * @param {string} key - LocalStorage key to clear
   */
  clear(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing ${key}:`, error);
    }
  },

  /**
   * Checks if LocalStorage is available and accessible
   * @returns {boolean} - True if LocalStorage is available
   */
  isAvailable() {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.error('LocalStorage is not available:', error);
      return false;
    }
  },

  /**
   * Gets storage information
   * @returns {object} - Object with used and limit properties
   */
  getStorageInfo() {
    let used = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
    } catch (error) {
      console.error('Error calculating storage usage:', error);
    }
    
    return {
      used: used,
      limit: 5 * 1024 * 1024  // Typical 5MB limit
    };
  }
};

// ============================================================================
// GREETING COMPONENT
// ============================================================================

const GreetingComponent = {
  // Reference to the update interval
  updateIntervalId: null,

  /**
   * Initializes the GreetingComponent
   * Sets up the 1-second update interval
   */
  init() {
    this.render();
    
    // Update time immediately, then every 1 second
    this.updateTime();
    this.updateIntervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
  },

  /**
   * Renders the initial greeting display (called once on init)
   */
  render() {
    this.updateTime();
  },

  /**
   * Updates the greeting message, date, and time display
   * Formats date as "Weekday, Month Date, Year" (e.g., "Tuesday, October 26, 2024")
   * Formats time as "H:MM AM/PM" (e.g., "10:30 AM")
   * 
   * **Validates: Requirements 3.3, 4.5, 8.5 - DOM element existence checks**
   */
  updateTime() {
    try {
      const now = new Date();
      
      // Validate Date object was created successfully
      if (!(now instanceof Date) || isNaN(now.getTime())) {
        console.error('Invalid Date object created');
        showError('Failed to update time display');
        return false;
      }
      
      // Get current hour for greeting determination
      const hour = now.getHours();
      
      // Determine and display greeting
      const greetingText = this.getGreeting(hour);
      
      // Check for greeting element before manipulation
      const greetingElement = document.querySelector('.greeting-message');
      if (!greetingElement) {
        console.error('Greeting message element (.greeting-message) not found in DOM');
        showError('Greeting display element missing');
        return false;
      }
      greetingElement.textContent = greetingText;
      
      // Format and display date as "Tuesday, October 26, 2024"
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',      // Full day name (Monday, Tuesday, etc.)
        year: 'numeric',      // Full 4-digit year (2024)
        month: 'long',        // Full month name (January, February, etc.)
        day: 'numeric'        // Day as 1 or 2 digits (1-31)
      });
      
      // Check for date element before manipulation
      const dateElement = document.querySelector('.date');
      if (!dateElement) {
        console.error('Date element (.date) not found in DOM');
        showError('Date display element missing');
        return false;
      }
      dateElement.textContent = dateString;
      
      // Format and display time in 12-hour AM/PM format
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      // Convert 24-hour to 12-hour format
      const displayHours = hours % 12 || 12;  // 0 becomes 12, 1-12 stay same, 13-23 become 1-11
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      const timeString = `${displayHours}:${minutes}:${seconds} ${ampm}`;
      
      // Check for time element before manipulation
      const timeElement = document.querySelector('.time');
      if (!timeElement) {
        console.error('Time element (.time) not found in DOM');
        showError('Time display element missing');
        return false;
      }
      timeElement.textContent = timeString;
      
      return true;
    } catch (error) {
      console.error('Error updating time display:', error);
      showError('Failed to update time display');
      return false;
    }
  },

  /**
   * Determines the appropriate greeting based on the current hour
   * @param {number} hour - The current hour (0-23 in 24-hour format)
   * @returns {string} - Appropriate greeting message
   * 
   * Greeting logic:
   * - [5, 12): "Good Morning" (5 AM to 11:59 AM)
   * - [12, 17): "Good Afternoon" (12 PM to 4:59 PM)
   * - [17, 24) or [0, 5): "Good Evening" (5 PM to 4:59 AM)
   */
  getGreeting(hour) {
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      // [17, 24) or [0, 5)
      return 'Good Evening';
    }
  },

  /**
   * Stops the greeting component update interval
   * Should be called on page unload or component cleanup
   */
  stop() {
    if (this.updateIntervalId !== null) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }
};

// ============================================================================
// TIMER COMPONENT
// ============================================================================

const TimerComponent = {
  /**
   * Initializes the TimerComponent
   * Resets timer to initial state (1500 seconds / 25 minutes)
   * Sets up initial display
   */
  init() {
    AppState.timer.timeRemaining = 1500;  // 25 minutes * 60 seconds
    AppState.timer.isRunning = false;
    AppState.timer.isPaused = false;
    AppState.timer.intervalId = null;
    
    this.render();
  },

  /**
   * Renders the timer display in MM:SS format
   * Updates the .timer-text element with validation
   * 
   * **Validates: Requirements 3.3, 4.5, 8.5 - DOM element existence checks**
   */
  render() {
    try {
      // Validate AppState.timer exists and has required properties
      if (!AppState.timer || typeof AppState.timer !== 'object') {
        console.error('AppState.timer is null or not an object');
        showError('Timer state is invalid');
        return false;
      }
      
      if (typeof AppState.timer.timeRemaining !== 'number' || AppState.timer.timeRemaining < 0) {
        console.error('Timer timeRemaining is invalid');
        showError('Timer display corrupted');
        return false;
      }
      
      const display = this.getFormattedTime();
      
      // Check for timer display element before manipulation
      const timerElement = document.querySelector('.timer-text');
      if (!timerElement) {
        console.error('Timer display element (.timer-text) not found in DOM');
        showError('Timer display element missing');
        return false;
      }
      
      timerElement.textContent = display;
      return true;
    } catch (error) {
      console.error('Error rendering timer display:', error);
      showError('Failed to update timer display');
      return false;
    }
  },

  /**
   * Returns the formatted time string in MM:SS format
   * Examples: "25:00", "24:53", "00:05"
   * 
   * @returns {string} - Time in MM:SS format
   */
  getFormattedTime() {
    const minutes = Math.floor(AppState.timer.timeRemaining / 60);
    const seconds = AppState.timer.timeRemaining % 60;
    
    // Pad both to 2 digits with leading zeros
    const minuteStr = String(minutes).padStart(2, '0');
    const secondStr = String(seconds).padStart(2, '0');
    
    return `${minuteStr}:${secondStr}`;
  },

  /**
   * Checks if the timer is currently running
   * @returns {boolean} - True if timer is running
   */
  isRunning() {
    return AppState.timer.isRunning;
  },

  /**
   * Checks if the timer is currently paused
   * @returns {boolean} - True if timer is paused
   */
  isPaused() {
    return AppState.timer.isPaused;
  },

  /**
   * Starts the timer countdown
   * If already running, this is a no-op
   * If paused, this resumes from the pause point
   */
  start() {
    // If already running, don't start again
    if (AppState.timer.isRunning) {
      return;
    }
    
    // Set flags
    AppState.timer.isRunning = true;
    AppState.timer.isPaused = false;
    
    // Clear any existing interval before starting a new one
    if (AppState.timer.intervalId !== null) {
      clearInterval(AppState.timer.intervalId);
    }
    
    // Set up the countdown interval (tick every 1000ms = 1 second)
    AppState.timer.intervalId = setInterval(() => {
      if (AppState.timer.timeRemaining > 0) {
        AppState.timer.timeRemaining--;
        this.render();
      } else {
        // Timer reached 0, stop it and trigger notification
        this.stop();
        this.triggerTimerNotification();
      }
    }, 1000);
  },

  /**
   * Stops or pauses the timer
   * If running, pauses at current time
   * If paused, resumes the timer
   * 
   * This function implements toggle behavior:
   * - running → paused (saves current time)
   * - paused → running (resumes from saved time)
   */
  stop() {
    if (AppState.timer.isRunning) {
      // Stop the interval
      if (AppState.timer.intervalId !== null) {
        clearInterval(AppState.timer.intervalId);
        AppState.timer.intervalId = null;
      }
      
      // Switch to paused state
      AppState.timer.isRunning = false;
      AppState.timer.isPaused = true;
    } else if (AppState.timer.isPaused) {
      // Resume from paused state
      this.start();
    }
  },

  /**
   * Resets the timer to 25 minutes (1500 seconds)
   * Stops any running interval
   * Resets all state flags to initial values
   */
  reset() {
    // Clear any running interval
    if (AppState.timer.intervalId !== null) {
      clearInterval(AppState.timer.intervalId);
      AppState.timer.intervalId = null;
    }
    
    // Reset state to initial values
    AppState.timer.timeRemaining = 1500;  // 25 minutes
    AppState.timer.isRunning = false;
    AppState.timer.isPaused = false;
    
    // Update the display
    this.render();
  },

  /**
   * Triggers notification when timer completes
   * Called when timeRemaining reaches 0
   */
  triggerTimerNotification() {
    triggerTimerNotification();
  },

  /**
   * Cleans up the timer on page unload
   * Stops any running interval and prevents memory leaks
   * Ensures the countdown interval is cleared to prevent memory leaks
   */
  cleanup() {
    if (AppState.timer.intervalId !== null) {
      clearInterval(AppState.timer.intervalId);
      AppState.timer.intervalId = null;
    }
    
    AppState.timer.isRunning = false;
    AppState.timer.isPaused = false;
  }
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Performance monitoring utility for tracking operation timing
 * Logs warnings when operations exceed 100ms threshold
 */
const PerformanceMonitor = {
  // Threshold in milliseconds for warning
  THRESHOLD_MS: 100,

  /**
   * Measures execution time of a function and logs warnings if threshold exceeded
   * @param {string} operationName - Name of the operation being measured
   * @param {function} fn - Function to execute and measure
   * @returns {*} - Return value from the executed function
   */
  measure(operationName, fn) {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > this.THRESHOLD_MS) {
        console.warn(
          `Performance warning: ${operationName} took ${duration.toFixed(2)}ms (threshold: ${this.THRESHOLD_MS}ms)`
        );
      } else {
        console.log(`${operationName} completed in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Triggers a notification when the timer reaches 00:00
 * Uses the Web Notifications API if available, falls back to visual/audio feedback
 */
function triggerTimerNotification() {
  // Try to use Web Notifications API first (with user permission)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Pomodoro Timer Complete!', {
      body: 'Your 25-minute focus session is complete. Time for a break!',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23FF6B6B"/><text x="50" y="60" font-size="40" font-weight="bold" text-anchor="middle" fill="white">✓</text></svg>'
    });
  }
  
  // Always provide visual feedback
  showTimerNotification();
  
  // Try to play a sound (if we have one)
  playTimerSound();
}

/**
 * Shows a visual notification on screen when timer completes
 */
function showTimerNotification() {
  const notification = document.createElement('div');
  notification.className = 'timer-notification';
  notification.innerHTML = `
    <div class="timer-notification-content">
      <h3>🎉 Time's Up!</h3>
      <p>Your 25-minute focus session is complete.</p>
      <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Dismiss</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
}

/**
 * Attempts to play a notification sound
 * Creates a simple beep using Web Audio API
 */
function playTimerSound() {
  try {
    // Create Web Audio API context for beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Beep configuration
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    // Beep duration (3 short beeps)
    const now = audioContext.currentTime;
    const beepDuration = 0.1;
    const pauseDuration = 0.1;
    
    // Beep 1
    gainNode.gain.setValueAtTime(0.3, now);
    oscillator.start(now);
    oscillator.stop(now + beepDuration);
    gainNode.gain.setValueAtTime(0, now + beepDuration);
    
    // Create new oscillator for beep 2
    const oscillator2 = audioContext.createOscillator();
    oscillator2.connect(gainNode);
    oscillator2.frequency.value = 800;
    oscillator2.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, now + beepDuration + pauseDuration);
    oscillator2.start(now + beepDuration + pauseDuration);
    oscillator2.stop(now + beepDuration * 2 + pauseDuration);
    gainNode.gain.setValueAtTime(0, now + beepDuration * 2 + pauseDuration);
    
    // Create new oscillator for beep 3
    const oscillator3 = audioContext.createOscillator();
    oscillator3.connect(gainNode);
    oscillator3.frequency.value = 800;
    oscillator3.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, now + beepDuration * 2 + pauseDuration * 2);
    oscillator3.start(now + beepDuration * 2 + pauseDuration * 2);
    oscillator3.stop(now + beepDuration * 3 + pauseDuration * 2);
    gainNode.gain.setValueAtTime(0, now + beepDuration * 3 + pauseDuration * 2);
  } catch (error) {
    // Web Audio API not available or failed, silently fail
    console.warn('Unable to play timer notification sound:', error);
  }
}

/**
 * Shows an error message temporarily on screen
 */
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-notification';
  errorDiv.textContent = message;
  errorDiv.setAttribute('role', 'alert');
  
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    if (errorDiv.parentElement) {
      errorDiv.remove();
    }
  }, 5000);
}

/**
 * Shows a success message temporarily on screen
 */
function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-notification';
  successDiv.textContent = message;
  
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    if (successDiv.parentElement) {
      successDiv.remove();
    }
  }, 3000);
}

// ============================================================================
// TASK MANAGEMENT - CORE DATA LAYER
// ============================================================================

/**
 * Adds a new task to the task list with validation
 * Validates task text: non-empty, non-whitespace, ≤500 characters
 * Generates unique task ID (task_{timestamp}_{counter})
 * Creates task object with text, completed=false, timestamps
 * Adds to AppState.tasks and saves to LocalStorage
 * 
 * @param {string} text - The task text to add
 * @returns {boolean} - True if task was successfully added, false otherwise
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */
function addTask(text) {
  try {
    // Validate input exists and is a string
    if (text === null || text === undefined) {
      showError('Task text cannot be null or undefined');
      return false;
    }
    
    if (typeof text !== 'string') {
      showError('Task text must be a string');
      return false;
    }
    
    // Validate text is not empty
    if (!text || text.trim() === '') {
      showError('Task cannot be empty');
      return false;
    }
    
    // Validate text does not exceed 500 characters
    if (text.length > 500) {
      showError('Task cannot exceed 500 characters');
      return false;
    }
    
    // Perform measurement of task addition
    return PerformanceMonitor.measure('addTask', () => {
      // Generate unique task ID using timestamp and counter
      const timestamp = Date.now();
      const id = `task_${timestamp}_${AppState.taskCounter}`;
      AppState.taskCounter++;
      
      // Create task object with required fields
      const task = {
        id: id,
        text: text.trim(),
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      // Add task to AppState
      AppState.tasks.push(task);
      
      // Persist to LocalStorage
      const saveSuccess = LocalStorageManager.saveTasks(AppState.tasks);
      
      if (!saveSuccess) {
        // Remove task from state if save failed
        AppState.tasks.pop();
        AppState.taskCounter--;
        return false;
      }
      
      return true;
    });
  } catch (error) {
    console.error('Unexpected error in addTask:', error);
    showError('An unexpected error occurred while adding the task');
    return false;
  }
}

/**
 * Updates an existing task with new values
 * Validates new task text if provided
 * Updates only allowed fields (text, completed)
 * Updates updatedAt timestamp
 * Saves to LocalStorage
 * 
 * @param {string} taskId - The ID of the task to update
 * @param {object} updates - Object containing fields to update (text, completed)
 * @returns {boolean} - True if task was successfully updated, false otherwise
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 */
function updateTask(taskId, updates) {
  try {
    // Validate taskId exists and is a string
    if (taskId === null || taskId === undefined) {
      showError('Task ID cannot be null or undefined');
      return false;
    }
    
    if (typeof taskId !== 'string' || taskId.trim() === '') {
      showError('Invalid task ID');
      return false;
    }
    
    // Validate updates object exists
    if (updates === null || updates === undefined || typeof updates !== 'object') {
      showError('Invalid update parameters');
      return false;
    }
    
    return PerformanceMonitor.measure('updateTask', () => {
      // Find task by ID
      const task = AppState.tasks.find(t => t.id === taskId);
      
      if (!task) {
        showError('Task not found');
        return false;
      }
      
      // Update text if provided
      if (updates.text !== undefined) {
        // Validate new text
        if (updates.text === null) {
          showError('Task text cannot be null');
          return false;
        }
        
        if (!updates.text || typeof updates.text !== 'string') {
          showError('Task text must be a string');
          return false;
        }
        
        if (updates.text.trim() === '') {
          showError('Task cannot be empty or contain only whitespace');
          return false;
        }
        
        if (updates.text.length > 500) {
          showError('Task cannot exceed 500 characters');
          return false;
        }
        
        task.text = updates.text.trim();
      }
      
      // Update completed flag if provided
      if (updates.completed !== undefined) {
        if (updates.completed === null) {
          showError('Completion flag cannot be null');
          return false;
        }
        task.completed = Boolean(updates.completed);
      }
      
      // Update timestamp
      task.updatedAt = Date.now();
      
      // Save to LocalStorage
      const saveSuccess = LocalStorageManager.saveTasks(AppState.tasks);
      
      if (!saveSuccess) {
        showError('Failed to save task update to storage');
        return false;
      }
      
      showSuccess('Task updated successfully');
      return true;
    });
  } catch (error) {
    console.error('Unexpected error in updateTask:', error);
    showError('An unexpected error occurred while updating the task');
    return false;
  }
}



/**
 * Toggles the completion state of a task by its ID
 * Finds the task, toggles the completed boolean, updates the timestamp,
 * saves to LocalStorage, and returns success status.
 * 
 * @param {string} taskId - The unique identifier of the task to toggle
 * @returns {boolean} - True if toggle was successful, false if task not found or save failed
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 */
function toggleTask(taskId) {
  try {
    // Validate taskId exists and is a string
    if (taskId === null || taskId === undefined) {
      console.warn('Task ID cannot be null or undefined');
      return false;
    }
    
    if (typeof taskId !== 'string' || taskId.trim() === '') {
      console.warn('Invalid task ID provided');
      return false;
    }
    
    return PerformanceMonitor.measure('toggleTask', () => {
      // Find task by ID
      const task = AppState.tasks.find(t => t.id === taskId);
      
      if (!task) {
        console.warn(`Task with ID ${taskId} not found`);
        return false;
      }
      
      // Toggle completed boolean
      task.completed = !task.completed;
      
      // Update updatedAt timestamp
      task.updatedAt = Date.now();
      
      // Save to LocalStorage
      const saveSuccess = LocalStorageManager.saveTasks(AppState.tasks);
      
      if (!saveSuccess) {
        console.error(`Failed to save tasks after toggling task ${taskId}`);
        return false;
      }
      
      return true;
    });
  } catch (error) {
    console.error('Unexpected error in toggleTask:', error);
    return false;
  }
}

/**
 * Deletes a task from the task list by its ID
 * Finds and removes the task from AppState.tasks, saves to LocalStorage,
 * and returns success status.
 * 
 * @param {string} taskId - The unique identifier of the task to delete
 * @returns {boolean} - True if deletion was successful, false if task not found or save failed
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */
function deleteTask(taskId) {
  try {
    // Validate taskId exists and is a string
    if (taskId === null || taskId === undefined) {
      console.warn('Task ID cannot be null or undefined');
      return false;
    }
    
    if (typeof taskId !== 'string' || taskId.trim() === '') {
      console.warn('Invalid task ID provided');
      return false;
    }
    
    return PerformanceMonitor.measure('deleteTask', () => {
      // Find the index of the task
      const index = AppState.tasks.findIndex(t => t.id === taskId);
      
      if (index === -1) {
        console.warn(`Task with ID ${taskId} not found`);
        return false;
      }
      
      // Remove task from array
      AppState.tasks.splice(index, 1);
      
      // Save to LocalStorage
      const saveSuccess = LocalStorageManager.saveTasks(AppState.tasks);
      
      if (!saveSuccess) {
        console.error(`Failed to save tasks after deleting task ${taskId}`);
        // Restore the task since save failed
        AppState.tasks.splice(index, 0, AppState.tasks[index]);
        return false;
      }
      
      return true;
    });
  } catch (error) {
    console.error('Unexpected error in deleteTask:', error);
    return false;
  }
}

// ============================================================================
// TASK UI RENDERING
// ============================================================================

/**
 * Renders all tasks to the DOM from AppState.tasks
 * Creates semantic HTML structure with proper accessibility attributes
 * Clears the task list before re-rendering (idempotent)
 * Each task item displays: checkbox, text, edit button, delete button
 * When task is in edit mode (editingTaskId matches), shows inline input field with save/cancel buttons
 * Applies "completed" class to items where task.completed === true for strikethrough styling
 * 
 * **Validates: Requirements 3.2, 5.2, 4.1, 4.2, 4.3, 4.4, 4.5, 3.3, 8.5**
 */
function renderTaskList() {
  try {
    // Get the task list container
    const taskListContainer = document.getElementById('task-list');
    
    if (!taskListContainer) {
      console.error('Task list container (#task-list) not found in DOM');
      showError('Unable to render task list - container not found');
      return false;
    }
    
    // Clear the task list before re-rendering
    taskListContainer.innerHTML = '';
    
    // Validate AppState exists
    if (!AppState || typeof AppState !== 'object') {
      console.error('AppState is null or not an object');
      showError('Application state is corrupted');
      return false;
    }
    
    // Validate AppState.tasks exists and is an array
    if (!AppState.tasks || !Array.isArray(AppState.tasks)) {
      console.error('AppState.tasks is not a valid array');
      showError('Task list data is corrupted');
      return false;
    }
    
    // Iterate through all tasks in AppState
    AppState.tasks.forEach(task => {
      // Validate task object exists and is not null
      if (!task || typeof task !== 'object') {
        console.warn('Skipping null or invalid task object');
        return;
      }
      
      // Validate task object has required properties
      if (!task.id || typeof task.id !== 'string' || task.id.trim() === '') {
        console.warn('Skipping task with missing or invalid ID');
        return;
      }
      
      if (typeof task.text !== 'string' || task.text === null) {
        console.warn(`Skipping task ${task.id} with invalid text property`);
        return;
      }
      
      if (typeof task.completed !== 'boolean') {
        console.warn(`Skipping task ${task.id} with invalid completed property`);
        return;
      }
      
      try {
        // Create the list item element
        const listItem = document.createElement('li');
        
        if (!listItem) {
          console.error('Failed to create list item element');
          return;
        }
        
        listItem.className = 'task-item';
        listItem.setAttribute('data-task-id', task.id);
        
        // Apply "completed" class if task is marked complete
        if (task.completed) {
          listItem.classList.add('completed');
        }
        
        // Create checkbox element
        const checkbox = document.createElement('input');
        if (!checkbox) {
          console.error('Failed to create checkbox element');
          return;
        }
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.setAttribute('aria-label', 'Mark task as complete');
        checkbox.checked = task.completed;
        
        // Check if this task is in edit mode
        const isEditing = AppState.editingTaskId === task.id;
        
        if (isEditing) {
          // EDIT MODE: Show input field, hide text, show save/cancel buttons
          
          // Create input field with current task text
          const editInput = document.createElement('input');
          if (!editInput) {
            console.error('Failed to create edit input element');
            return;
          }
          editInput.type = 'text';
          editInput.className = 'task-edit-input';
          editInput.value = task.text;
          editInput.setAttribute('aria-label', 'Edit task text');
          
          // Create save button
          const saveButton = document.createElement('button');
          if (!saveButton) {
            console.error('Failed to create save button element');
            return;
          }
          saveButton.className = 'task-save';
          saveButton.setAttribute('aria-label', 'Save task changes');
          saveButton.textContent = 'Save';
          
          // Create cancel button
          const cancelButton = document.createElement('button');
          if (!cancelButton) {
            console.error('Failed to create cancel button element');
            return;
          }
          cancelButton.className = 'task-cancel';
          cancelButton.setAttribute('aria-label', 'Cancel task edit');
          cancelButton.textContent = 'Cancel';
          
          // Append elements: checkbox, input, save, cancel
          listItem.appendChild(checkbox);
          listItem.appendChild(editInput);
          listItem.appendChild(saveButton);
          listItem.appendChild(cancelButton);
          
          // Set focus to input field and select all text for convenience
          setTimeout(() => {
            if (editInput) {
              editInput.focus();
              editInput.select();
            }
          }, 0);
        } else {
          // DISPLAY MODE: Show text, show edit and delete buttons
          
          // Create task text span
          const textSpan = document.createElement('span');
          if (!textSpan) {
            console.error('Failed to create text span element');
            return;
          }
          textSpan.className = 'task-text';
          textSpan.textContent = task.text;
          
          // Create edit button
          const editButton = document.createElement('button');
          if (!editButton) {
            console.error('Failed to create edit button element');
            return;
          }
          editButton.className = 'task-edit';
          editButton.setAttribute('aria-label', 'Edit task');
          editButton.textContent = 'Edit';
          
          // Create delete button
          const deleteButton = document.createElement('button');
          if (!deleteButton) {
            console.error('Failed to create delete button element');
            return;
          }
          deleteButton.className = 'task-delete';
          deleteButton.setAttribute('aria-label', 'Delete task');
          deleteButton.textContent = 'Delete';
          
          // Append all elements to the list item in order
          listItem.appendChild(checkbox);
          listItem.appendChild(textSpan);
          listItem.appendChild(editButton);
          listItem.appendChild(deleteButton);
        }
        
        // Append list item to the task list container
        if (taskListContainer) {
          taskListContainer.appendChild(listItem);
        }
      } catch (error) {
        console.error(`Error rendering task ${task?.id}:`, error);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Unexpected error in renderTaskList:', error);
    showError('Failed to render task list');
    return false;
  }
}
/**
 * Handles adding a new task from user input
 * Gets text from #task-input element, calls addTask() for validation,
 * clears input on success, and re-renders the task list.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.3, 4.5, 8.5**
 */
function addTaskHandler() {
  try {
    // Get the input element
    const taskInput = document.getElementById('task-input');
    
    if (!taskInput) {
      console.error('Task input element (#task-input) not found in DOM');
      showError('Unable to add task - input field not found');
      return false;
    }
    
    // Get text from input field
    const text = taskInput.value;
    
    // Validate text is not null or undefined
    if (text === null || text === undefined) {
      showError('Task input value is invalid');
      return false;
    }
    
    // Validate text is a string
    if (typeof text !== 'string') {
      showError('Task input must be a string');
      return false;
    }
    
    // Call addTask() - it handles validation and shows errors via showError()
    const success = addTask(text);
    
    if (success) {
      // Clear the input field
      if (taskInput) {
        taskInput.value = '';
        
        // Restore focus to the input field for quick next entry
        taskInput.focus();
      }
      
      // Update the task list display
      renderTaskList();
    } else {
      // On failure, addTask() has already called showError()
      // Keep input focused for user to correct
      if (taskInput) {
        taskInput.focus();
      }
    }
    
    return success;
  } catch (error) {
    console.error('Unexpected error in addTaskHandler:', error);
    showError('An unexpected error occurred while adding the task');
    return false;
  }
}

/**
 * Handles saving an edited task
 * Gets the task ID from the task item, retrieves the new text from the edit input,
 * validates the new text, calls updateTask() if valid, clears edit mode, and re-renders.
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 3.3, 8.5**
 */
function handleTaskSave(event) {
  try {
    // Validate event exists
    if (!event || !event.target) {
      console.warn('Invalid save event');
      showError('Failed to save task - invalid event');
      return false;
    }
    
    // Get the save button and closest task item
    const saveButton = event.target;
    if (!saveButton) {
      console.error('Save button element is null');
      showError('Failed to save task - button element invalid');
      return false;
    }
    
    const taskItem = saveButton.closest('.task-item');
    if (!taskItem) {
      console.error('Could not find task item for save button');
      showError('Unable to save task - task item not found');
      return false;
    }
    
    // Get task ID from data attribute
    const taskId = taskItem.getAttribute('data-task-id');
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      console.error('Invalid task ID on task item');
      showError('Invalid task ID');
      return false;
    }
    
    // Get the edit input field
    const editInput = taskItem.querySelector('.task-edit-input');
    if (!editInput) {
      console.error('Edit input not found in task item');
      showError('Unable to find edit field');
      return false;
    }
    
    // Get new text from input
    const newText = editInput.value;
    
    // Validate new text (updateTask will perform validation, but we can show early error)
    if (newText === null || newText === undefined) {
      showError('Task text cannot be null');
      if (editInput) {
        editInput.focus();
      }
      return false;
    }
    
    if (typeof newText !== 'string') {
      showError('Task text must be a string');
      if (editInput) {
        editInput.focus();
      }
      return false;
    }
    
    // Call updateTask() to validate and save
    const success = updateTask(taskId, { text: newText });
    
    if (success) {
      // Clear edit mode
      AppState.editingTaskId = null;
      
      // Re-render task list to show updated task
      renderTaskList();
    } else {
      // updateTask() has already called showError()
      // Keep input focused for user to try again
      if (editInput) {
        editInput.focus();
        editInput.select();
      }
    }
    
    return success;
  } catch (error) {
    console.error('Unexpected error in handleTaskSave:', error);
    showError('An unexpected error occurred while saving the task');
    return false;
  }
}

/**
 * Handles canceling a task edit
 * Gets the task ID, clears edit mode without saving, and re-renders the task list
 * to show the original task text.
 * 
 * **Validates: Requirements 4.4, 3.3, 8.5**
 */
function handleTaskCancel(event) {
  try {
    // Validate event exists
    if (!event || !event.target) {
      console.warn('Invalid cancel event');
      showError('Failed to cancel edit - invalid event');
      return false;
    }
    
    // Get the cancel button and closest task item
    const cancelButton = event.target;
    if (!cancelButton) {
      console.error('Cancel button element is null');
      showError('Failed to cancel edit - button element invalid');
      return false;
    }
    
    const taskItem = cancelButton.closest('.task-item');
    if (!taskItem) {
      console.error('Could not find task item for cancel button');
      showError('Unable to cancel edit - task item not found');
      return false;
    }
    
    // Get task ID from data attribute
    const taskId = taskItem.getAttribute('data-task-id');
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      console.error('Invalid task ID on task item');
      showError('Invalid task ID');
      return false;
    }
    
    // Clear edit mode
    AppState.editingTaskId = null;
    
    // Re-render task list to show original text
    renderTaskList();
    
    return true;
  } catch (error) {
    console.error('Unexpected error in handleTaskCancel:', error);
    showError('An unexpected error occurred while canceling the edit');
    return false;
  }
}


// ============================================================================
// QUICK LINKS MANAGEMENT - UTILITY AND CORE DATA LAYER
// ============================================================================

/**
 * Validates a URL to ensure it's properly formatted
 * Checks if URL starts with http:// or https:// and uses browser URL constructor
 * 
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if URL is valid, false otherwise
 * 
 * **Validates: Requirements 8.4**
 */
function validateUrl(url) {
  // Check if URL starts with http:// or https://
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }
  
  // Use browser URL constructor for additional validation
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Adds a new quick link with validation
 * Validates name: non-empty, non-whitespace, 1-100 characters
 * Validates URL using validateUrl()
 * Generates unique link ID (link_{timestamp}_{counter})
 * Creates link object with name, url, createdAt
 * Adds to AppState.quickLinks and saves to LocalStorage
 * 
 * @param {string} name - The display name for the link
 * @param {string} url - The URL to navigate to
 * @returns {boolean} - True if link was successfully added, false otherwise
 * 
 * **Validates: Requirements 8.1, 8.3, 8.4**
 */
function addLink(name, url) {
  try {
    // Validate name exists and is a string
    if (name === null || name === undefined) {
      showError('Link name cannot be null or undefined');
      return false;
    }
    
    if (typeof name !== 'string') {
      showError('Link name must be a string');
      return false;
    }
    
    // Validate name is not empty
    if (!name || name.trim() === '') {
      showError('Link name cannot be empty');
      return false;
    }
    
    // Validate name does not exceed 100 characters
    if (name.length > 100) {
      showError('Link name cannot exceed 100 characters');
      return false;
    }
    
    // Validate URL exists and is a string
    if (url === null || url === undefined) {
      showError('URL cannot be null or undefined');
      return false;
    }
    
    if (typeof url !== 'string') {
      showError('URL must be a string');
      return false;
    }
    
    // Validate URL using validateUrl()
    if (!validateUrl(url)) {
      showError('Invalid URL. Please use http:// or https://');
      return false;
    }
    
    // Generate unique link ID using timestamp and counter
    const timestamp = Date.now();
    const id = `link_${timestamp}_${AppState.linkCounter}`;
    AppState.linkCounter++;
    
    // Create link object with required fields
    const link = {
      id: id,
      name: name.trim(),
      url: url,
      createdAt: timestamp
    };
    
    // Add link to AppState
    AppState.quickLinks.push(link);
    
    // Persist to LocalStorage
    const saveSuccess = LocalStorageManager.saveLinks(AppState.quickLinks);
    
    if (!saveSuccess) {
      // Remove link from state if save failed
      AppState.quickLinks.pop();
      AppState.linkCounter--;
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error in addLink:', error);
    showError('An unexpected error occurred while adding the link');
    return false;
  }
}

/**
 * Deletes a quick link by its ID
 * Finds and removes the link from AppState.quickLinks
 * Saves to LocalStorage
 * 
 * @param {string} linkId - The unique identifier of the link to delete
 * @returns {boolean} - True if deletion was successful, false if link not found or save failed
 * 
 * **Validates: Requirements 8.5**
 */
function deleteLink(linkId) {
  try {
    // Validate linkId exists and is a string
    if (linkId === null || linkId === undefined) {
      console.warn('Link ID cannot be null or undefined');
      return false;
    }
    
    if (typeof linkId !== 'string' || linkId.trim() === '') {
      console.warn('Invalid link ID provided');
      return false;
    }
    
    // Find the index of the link
    const index = AppState.quickLinks.findIndex(link => link.id === linkId);
    
    if (index === -1) {
      console.warn(`Link with ID ${linkId} not found`);
      return false;
    }
    
    // Remove link from array
    AppState.quickLinks.splice(index, 1);
    
    // Save to LocalStorage
    const saveSuccess = LocalStorageManager.saveLinks(AppState.quickLinks);
    
    if (!saveSuccess) {
      console.error(`Failed to save links after deleting link ${linkId}`);
      // Restore the link since save failed
      AppState.quickLinks.splice(index, 0, AppState.quickLinks[index]);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error in deleteLink:', error);
    return false;
  }
}

// ============================================================================
// QUICK LINKS UI RENDERING
// ============================================================================

/**
 * Renders all quick links to the DOM from AppState.quickLinks
 * Creates button elements for each link with data-link-id attribute
 * Adds delete button adjacent to each link
 * Clears the links container before re-rendering (idempotent)
 * 
 * **Validates: Requirements 8.1, 8.6, 3.3, 4.5, 8.5**
 */
function renderLinks() {
  try {
    // Get the links container
    const linksContainer = document.getElementById('links-container');
    
    if (!linksContainer) {
      console.error('Links container (#links-container) not found in DOM');
      showError('Unable to render links - container not found');
      return false;
    }
    
    // Clear the container before re-rendering
    linksContainer.innerHTML = '';
    
    // Validate AppState exists
    if (!AppState || typeof AppState !== 'object') {
      console.error('AppState is null or not an object');
      showError('Application state is corrupted');
      return false;
    }
    
    // Validate AppState.quickLinks exists and is an array
    if (!AppState.quickLinks || !Array.isArray(AppState.quickLinks)) {
      console.error('AppState.quickLinks is not a valid array');
      showError('Quick links data is corrupted');
      return false;
    }
    
    // Iterate through all links in AppState
    AppState.quickLinks.forEach(link => {
      try {
        // Validate link object exists and is not null
        if (!link || typeof link !== 'object') {
          console.warn('Skipping null or invalid link object');
          return;
        }
        
        // Validate link object has required properties
        if (!link.id || typeof link.id !== 'string' || link.id.trim() === '') {
          console.warn('Skipping link with missing or invalid ID');
          return;
        }
        
        if (typeof link.name !== 'string' || link.name === null || link.name === '') {
          console.warn(`Skipping link ${link.id} with invalid name property`);
          return;
        }
        
        if (typeof link.url !== 'string' || link.url === null) {
          console.warn(`Skipping link ${link.id} with invalid URL property`);
          return;
        }
        
        // Create a wrapper div for each quick link (link button + delete button)
        const linkWrapper = document.createElement('div');
        if (!linkWrapper) {
          console.error('Failed to create link wrapper element');
          return;
        }
        linkWrapper.className = 'quick-link-wrapper';
        linkWrapper.setAttribute('data-link-id', link.id);
        
        // Create the link button
        const linkButton = document.createElement('button');
        if (!linkButton) {
          console.error('Failed to create link button element');
          return;
        }
        linkButton.className = 'quick-link-btn';
        linkButton.setAttribute('data-link-id', link.id);
        linkButton.setAttribute('aria-label', `Open ${link.name}`);
        linkButton.textContent = link.name;
        
        // Create the delete button
        const deleteButton = document.createElement('button');
        if (!deleteButton) {
          console.error('Failed to create delete button element');
          return;
        }
        deleteButton.className = 'link-delete-btn';
        deleteButton.setAttribute('aria-label', `Delete ${link.name} link`);
        deleteButton.textContent = '×';
        
        // Append both buttons to the wrapper
        linkWrapper.appendChild(linkButton);
        linkWrapper.appendChild(deleteButton);
        
        // Append wrapper to the links container
        if (linksContainer) {
          linksContainer.appendChild(linkWrapper);
        }
      } catch (error) {
        console.error(`Error rendering link ${link?.id}:`, error);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Unexpected error in renderLinks:', error);
    showError('Failed to render links');
    return false;
  }
}

/**
 * Handles Enter key press on the task input field
 * Triggers add task handler when Enter key (keyCode 13) is pressed
 * 
 * **Validates: Requirements 3.1**
 */
function handleTaskInputKeypress(event) {
  // Check if the key pressed is Enter (keyCode 13)
  if (event.keyCode === 13) {
    // Prevent default form submission behavior
    event.preventDefault();
    
    // Call the add task handler
    addTaskHandler();
  }
}

// ============================================================================
// QUICK LINKS EVENT HANDLERS
// ============================================================================

/**
 * Handles adding a new quick link from user input
 * Gets name from #link-name and url from #link-url
 * Calls addLink() with validation
 * Clears both input fields on success
 * Restores focus to #link-name
 * Shows error message on failure
 * 
 * **Validates: Requirements 8.1, 8.3, 3.3, 4.5, 8.5**
 */
function addLinkHandler() {
  try {
    // Get the input elements
    const linkNameInput = document.getElementById('link-name');
    const linkUrlInput = document.getElementById('link-url');
    
    if (!linkNameInput) {
      console.error('Link name input element (#link-name) not found in DOM');
      showError('Unable to add link - name input not found');
      return false;
    }
    
    if (!linkUrlInput) {
      console.error('Link URL input element (#link-url) not found in DOM');
      showError('Unable to add link - URL input not found');
      return false;
    }
    
    // Get values from input fields
    const name = linkNameInput.value;
    const url = linkUrlInput.value;
    
    // Validate name is not null or undefined
    if (name === null || name === undefined) {
      showError('Link name is invalid');
      return false;
    }
    
    // Validate name is a string
    if (typeof name !== 'string') {
      showError('Link name must be a string');
      return false;
    }
    
    // Validate URL is not null or undefined
    if (url === null || url === undefined) {
      showError('Link URL is invalid');
      return false;
    }
    
    // Validate URL is a string
    if (typeof url !== 'string') {
      showError('Link URL must be a string');
      return false;
    }
    
    // Call addLink() - it handles validation and shows errors via showError()
    const success = addLink(name, url);
    
    if (success) {
      // Clear both input fields
      if (linkNameInput) {
        linkNameInput.value = '';
      }
      if (linkUrlInput) {
        linkUrlInput.value = '';
      }
      
      // Restore focus to the name input field for quick next entry
      if (linkNameInput) {
        linkNameInput.focus();
      }
      
      // Update the links display
      renderLinks();
      
      // Show success feedback
      showSuccess('Quick link added successfully');
    } else {
      // On failure, addLink() has already called showError()
      // Keep focus on URL input for user to correct
      if (linkUrlInput) {
        linkUrlInput.focus();
      }
    }
    
    return success;
  } catch (error) {
    console.error('Unexpected error in addLinkHandler:', error);
    showError('An unexpected error occurred while adding the link');
    return false;
  }
}

/**
 * Handles quick link button clicks
 * Gets URL from the link's data attribute
 * Opens URL in a new browser tab
 * 
 * **Validates: Requirements 8.2, 3.3, 4.5, 8.5**
 */
function handleQuickLinkClick(event) {
  try {
    // Validate event exists
    if (!event || !event.target) {
      console.warn('Invalid click event');
      showError('Failed to open link - invalid event');
      return false;
    }
    
    // Get the event target
    const target = event.target;
    if (!target) {
      console.warn('Event target is null');
      return false;
    }
    
    // Get the link ID from the event target
    const linkId = target.getAttribute('data-link-id');
    
    if (!linkId || typeof linkId !== 'string' || linkId.trim() === '') {
      console.warn('Link ID not found or invalid on clicked element');
      showError('Quick link ID is invalid');
      return false;
    }
    
    // Validate AppState and quickLinks array
    if (!AppState || !Array.isArray(AppState.quickLinks)) {
      console.warn('AppState or quickLinks array is invalid');
      showError('Quick links data is corrupted');
      return false;
    }
    
    // Find the link in AppState
    const link = AppState.quickLinks.find(l => l && l.id === linkId);
    
    if (!link) {
      console.warn(`Link with ID ${linkId} not found`);
      showError('Quick link not found');
      return false;
    }
    
    // Validate link object
    if (typeof link !== 'object') {
      console.warn('Link object is invalid');
      showError('Quick link data is corrupted');
      return false;
    }
    
    // Validate link URL exists and is a string
    if (!link.url || typeof link.url !== 'string' || link.url.trim() === '') {
      console.warn(`Link ${linkId} has invalid or missing URL`);
      showError('Quick link URL is invalid');
      return false;
    }
    
    // Open the URL in a new tab
    window.open(link.url, '_blank');
    return true;
  } catch (error) {
    console.error('Unexpected error in handleQuickLinkClick:', error);
    showError('An unexpected error occurred while opening the link');
    return false;
  }
}

/**
 * Handles deleting a quick link
 * Gets link ID from the event target's closest quick-link wrapper
 * Calls deleteLink() with ID
 * Re-renders links
 * Shows success feedback
 * 
 * **Validates: Requirements 8.5, 3.3, 4.5, 8.5**
 */
function handleDeleteLink(event) {
  try {
    // Validate event exists
    if (!event || !event.target) {
      console.warn('Invalid delete event');
      showError('Failed to delete link - invalid event');
      return false;
    }
    
    // Get the delete button
    const deleteButton = event.target;
    if (!deleteButton) {
      console.error('Delete button element is null');
      showError('Failed to delete link - button element invalid');
      return false;
    }
    
    // Find the closest quick-link-wrapper to get the link ID
    const linkWrapper = deleteButton.closest('.quick-link-wrapper');
    
    if (!linkWrapper) {
      console.warn('Could not find quick-link-wrapper');
      showError('Failed to delete link - wrapper not found');
      return false;
    }
    
    // Get the link ID from the wrapper
    const linkId = linkWrapper.getAttribute('data-link-id');
    
    if (!linkId || typeof linkId !== 'string' || linkId.trim() === '') {
      console.warn('Link ID not found or invalid on wrapper');
      showError('Invalid link ID');
      return false;
    }
    
    // Call deleteLink() - it handles the deletion and storage
    const success = deleteLink(linkId);
    
    if (success) {
      // Re-render the links
      renderLinks();
      
      // Show success feedback
      showSuccess('Quick link deleted successfully');
    } else {
      showError('Failed to delete link');
    }
    
    return success;
  } catch (error) {
    console.error('Unexpected error in handleDeleteLink:', error);
    showError('An unexpected error occurred while deleting the link');
    return false;
  }
}

/**
 * Handles Enter key press on the link URL input field
 * Triggers add link handler when Enter key (keyCode 13) is pressed
 * 
 * **Validates: Requirements 8.1**
 */
function handleLinkUrlKeypress(event) {
  // Check if the key pressed is Enter (keyCode 13)
  if (event.keyCode === 13) {
    // Prevent default form submission behavior
    event.preventDefault();
    
    // Call the add link handler
    addLinkHandler();
  }
}

// ============================================================================
// UI CONTROLLER - ORCHESTRATOR
// ============================================================================

const UIController = {
  /**
   * Initializes the entire application
   * This is the main entry point that coordinates all components
   * 
   * Performs the following steps:
   * 1. Checks for required DOM elements
   * 2. Sets up global error handler
   * 3. Initializes all components (Greeting, Timer, Task, QuickLinks)
   * 4. Loads data from LocalStorage
   * 5. Renders the complete initial UI state
   * 
   * **Validates: Requirements 1.1, 2.1, 3.1, 8.1**
   * 
   * @returns {boolean} - True if initialization was successful, false otherwise
   */
  init() {
    console.log('UIController: Starting application initialization...');
    
    try {
      // ============================================================================
      // STEP 1: CHECK FOR REQUIRED DOM ELEMENTS
      // ============================================================================
      const requiredElements = [
        '.greeting-message',
        '.date',
        '.time',
        '.timer-text',
        '#timer-start',
        '#timer-stop',
        '#timer-reset',
        '#task-input',
        '#task-add',
        '#task-list',
        '#link-name',
        '#link-url',
        '#link-add',
        '#links-container'
      ];
      
      const missingElements = [];
      for (const selector of requiredElements) {
        if (!document.querySelector(selector)) {
          missingElements.push(selector);
        }
      }
      
      if (missingElements.length > 0) {
        const errorMsg = `Critical Error: Missing required DOM elements: ${missingElements.join(', ')}`;
        console.error(errorMsg);
        showError('Application failed to initialize. Required HTML elements are missing.');
        return false;
      }
      
      console.log('✓ All required DOM elements found');
      
      // ============================================================================
      // STEP 2: SET UP GLOBAL ERROR HANDLER
      // ============================================================================
      window.addEventListener('error', (event) => {
        console.error('Global error caught:', event.error);
        showError('An unexpected error occurred. Please refresh the page.');
        
        // Prevent error propagation to the browser's default error handler
        event.preventDefault();
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        showError('An unexpected error occurred. Please refresh the page.');
        
        // Prevent error propagation to the browser's default handler
        event.preventDefault();
      });
      
      console.log('✓ Global error handlers set up');
      
      // ============================================================================
      // STEP 3: INITIALIZE ALL COMPONENTS
      // ============================================================================
      
      // Initialize Greeting Component
      console.log('Initializing GreetingComponent...');
      GreetingComponent.init();
      console.log('✓ GreetingComponent initialized');
      
      // Initialize Timer Component
      console.log('Initializing TimerComponent...');
      TimerComponent.init();
      console.log('✓ TimerComponent initialized');
      
      // Initialize Task Component
      console.log('Initializing Task component...');
      this.initializeTaskComponent();
      console.log('✓ Task component initialized');
      
      // Initialize Quick Links Component
      console.log('Initializing Quick Links component...');
      this.initializeQuickLinksComponent();
      console.log('✓ Quick Links component initialized');
      
      // Wire up Timer Button Listeners
      console.log('Wiring up timer button event listeners...');
      this.initializeTimerButtons();
      console.log('✓ Timer button listeners wired');
      
      // ============================================================================
      // STEP 4: LOAD DATA FROM LOCAL STORAGE
      // ============================================================================
      console.log('Loading data from LocalStorage...');
      
      // Load tasks from LocalStorage
      AppState.tasks = LocalStorageManager.loadTasks();
      if (!Array.isArray(AppState.tasks)) {
        console.warn('Loaded tasks is not an array, initializing empty array');
        AppState.tasks = [];
      }
      console.log(`✓ Loaded ${AppState.tasks.length} tasks from LocalStorage`);
      
      // Load quick links from LocalStorage
      AppState.quickLinks = LocalStorageManager.loadLinks();
      if (!Array.isArray(AppState.quickLinks)) {
        console.warn('Loaded quick links is not an array, initializing empty array');
        AppState.quickLinks = [];
      }
      console.log(`✓ Loaded ${AppState.quickLinks.length} quick links from LocalStorage`);
      
      // ============================================================================
      // STEP 5: RENDER COMPLETE INITIAL UI STATE
      // ============================================================================
      console.log('Rendering initial UI...');
      this.renderAll();
      console.log('✓ Initial UI rendered');
      
      // ============================================================================
      // INITIALIZATION COMPLETE
      // ============================================================================
      AppState.isInitialized = true;
      console.log('✓ UIController initialization complete - Application ready');
      
      return true;
      
    } catch (error) {
      console.error('Critical error during UIController initialization:', error);
      showError('Failed to initialize the application. Please refresh the page.');
      return false;
    }
  },

  /**
   * Initializes the Task component
   * Loads tasks from LocalStorage and wires up event listeners
   * 
   * @private
   */
  initializeTaskComponent() {
    try {
      // Update task counter based on loaded tasks
      if (AppState.tasks.length > 0) {
        const maxCounter = AppState.tasks.reduce((max, task) => {
          if (!task || !task.id || typeof task.id !== 'string') {
            return max;
          }
          
          const parts = task.id.split('_');
          if (parts.length >= 3) {
            const counter = parseInt(parts[2], 10);
            return Math.max(max, isNaN(counter) ? 0 : counter);
          }
          return max;
        }, 0);
        
        AppState.taskCounter = maxCounter + 1;
      }
      
      // Wire up event listeners
      const taskAddButton = document.getElementById('task-add');
      const taskInput = document.getElementById('task-input');
      const taskList = document.getElementById('task-list');
      
      if (taskAddButton) {
        taskAddButton.addEventListener('click', addTaskHandler);
      } else {
        console.warn('Task add button (#task-add) not found');
      }
      
      if (taskInput) {
        taskInput.addEventListener('keypress', handleTaskInputKeypress);
      } else {
        console.warn('Task input (#task-input) not found');
      }
      
      if (taskList) {
        taskList.addEventListener('click', (event) => {
          if (event.target.classList.contains('task-checkbox')) {
            const taskItem = event.target.closest('.task-item');
            if (taskItem) {
              const taskId = taskItem.getAttribute('data-task-id');
              if (taskId) {
                const success = toggleTask(taskId);
                if (success) {
                  renderTaskList();
                  showSuccess('Task marked complete');
                } else {
                  showError('Failed to update task');
                }
              }
            }
          }
          
          if (event.target.classList.contains('task-delete')) {
            const taskItem = event.target.closest('.task-item');
            if (taskItem) {
              const taskId = taskItem.getAttribute('data-task-id');
              if (taskId) {
                const success = deleteTask(taskId);
                if (success) {
                  renderTaskList();
                  showSuccess('Task deleted successfully');
                } else {
                  showError('Failed to delete task');
                }
              }
            }
          }
          
          if (event.target.classList.contains('task-edit')) {
            const taskItem = event.target.closest('.task-item');
            if (taskItem) {
              const taskId = taskItem.getAttribute('data-task-id');
              if (taskId) {
                AppState.editingTaskId = taskId;
                renderTaskList();
              }
            }
          }
          
          if (event.target.classList.contains('task-save')) {
            handleTaskSave(event);
          }
          
          if (event.target.classList.contains('task-cancel')) {
            handleTaskCancel(event);
          }
        });
      } else {
        console.warn('Task list (#task-list) not found');
      }
    } catch (error) {
      console.error('Error initializing Task component:', error);
      throw error;
    }
  },

  /**
   * Initializes the Quick Links component
   * Loads quick links from LocalStorage and wires up event listeners
   * 
   * @private
   */
  initializeQuickLinksComponent() {
    try {
      // Update link counter based on loaded links
      if (AppState.quickLinks.length > 0) {
        const maxCounter = AppState.quickLinks.reduce((max, link) => {
          if (!link || !link.id || typeof link.id !== 'string') {
            return max;
          }
          
          const parts = link.id.split('_');
          if (parts.length >= 3) {
            const counter = parseInt(parts[2], 10);
            return Math.max(max, isNaN(counter) ? 0 : counter);
          }
          return max;
        }, 0);
        
        AppState.linkCounter = maxCounter + 1;
      }
      
      // Wire up event listeners
      const linkAddButton = document.getElementById('link-add');
      const linkUrlInput = document.getElementById('link-url');
      const linksContainer = document.getElementById('links-container');
      
      if (linkAddButton) {
        linkAddButton.addEventListener('click', addLinkHandler);
      } else {
        console.warn('Link add button (#link-add) not found');
      }
      
      if (linkUrlInput) {
        linkUrlInput.addEventListener('keypress', handleLinkUrlKeypress);
      } else {
        console.warn('Link URL input (#link-url) not found');
      }
      
      if (linksContainer) {
        linksContainer.addEventListener('click', (event) => {
          if (event.target.classList.contains('quick-link-btn')) {
            handleQuickLinkClick(event);
          }
          
          if (event.target.classList.contains('link-delete-btn')) {
            handleDeleteLink(event);
          }
        });
      } else {
        console.warn('Links container (#links-container) not found');
      }
    } catch (error) {
      console.error('Error initializing Quick Links component:', error);
      throw error;
    }
  },

  /**
   * Initializes the Timer button event listeners
   * Wires up direct click listeners to timer control buttons
   * 
   * **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
   * 
   * @private
   */
  initializeTimerButtons() {
    try {
      const timerStartBtn = document.getElementById('timer-start');
      const timerStopBtn = document.getElementById('timer-stop');
      const timerResetBtn = document.getElementById('timer-reset');
      
      if (timerStartBtn) {
        timerStartBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          try {
            TimerComponent.start();
            console.log('Timer started');
          } catch (error) {
            console.error('Error starting timer:', error);
            showError('Failed to start timer');
          }
        });
      } else {
        console.warn('Timer start button (#timer-start) not found');
      }
      
      if (timerStopBtn) {
        timerStopBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          try {
            TimerComponent.stop();
            console.log('Timer stopped/paused');
          } catch (error) {
            console.error('Error stopping timer:', error);
            showError('Failed to stop timer');
          }
        });
      } else {
        console.warn('Timer stop button (#timer-stop) not found');
      }
      
      if (timerResetBtn) {
        timerResetBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          try {
            TimerComponent.reset();
            console.log('Timer reset');
          } catch (error) {
            console.error('Error resetting timer:', error);
            showError('Failed to reset timer');
          }
        });
      } else {
        console.warn('Timer reset button (#timer-reset) not found');
      }
    } catch (error) {
      console.error('Error initializing timer buttons:', error);
      throw error;
    }
  },

  /**
   * Renders all UI components with their current state
   * This is called during initialization to display the complete initial UI,
   * and after any state changes that affect multiple components
   * 
   * Orchestrates rendering of:
   * - Greeting message, date, and time (via GreetingComponent.updateTime())
   * - Timer display in MM:SS format (via TimerComponent.render())
   * - Task list with all tasks and completion states (via renderTaskList())
   * - Quick links buttons (via renderLinks())
   * 
   * Error handling:
   * - Wraps each render operation in try-catch
   * - Displays error notification if rendering fails
   * - Continues rendering other components even if one fails
   * 
   * **Validates: Requirements 1.1, 2.6, 3.2, 8.1**
   */
  renderAll() {
    try {
      // Update greeting, date, and time display
      // This updates the greeting message based on current hour,
      // the date in "Weekday, Month Date, Year" format,
      // and the time in "H:MM:SS AM/PM" format
      GreetingComponent.updateTime();
      
      // Update timer display in MM:SS format
      // Reflects current timeRemaining state
      TimerComponent.render();
      
      // Render all tasks from AppState.tasks
      // Applies strikethrough to completed tasks
      // Shows edit mode if a task is being edited
      renderTaskList();
      
      // Render all quick links from AppState.quickLinks
      // Shows delete buttons for each link
      renderLinks();
      
      console.log('All UI components rendered successfully');
    } catch (error) {
      console.error('Error in renderAll:', error);
      showError('Failed to render UI. Please refresh the page.');
    }
  },

  /**
   * Cleans up the application on page unload
   * This should be called when the page is being unloaded to prevent memory leaks
   * 
   * Cleanup tasks:
   * - Stop the greeting component's update interval
   * - Stop the timer component
   * - Clear any active timers
   */
  destroy() {
    try {
      console.log('UIController: Cleaning up...');
      
      // Stop greeting component
      if (GreetingComponent && typeof GreetingComponent.stop === 'function') {
        GreetingComponent.stop();
      }
      
      // Stop timer component
      if (TimerComponent && typeof TimerComponent.cleanup === 'function') {
        TimerComponent.cleanup();
      } else if (AppState.timer.intervalId !== null) {
        clearInterval(AppState.timer.intervalId);
        AppState.timer.intervalId = null;
      }
      
      console.log('✓ Application cleaned up');
    } catch (error) {
      console.error('Error during UIController cleanup:', error);
    }
  }
};

// ============================================================================
// INITIALIZATION AND EVENT WIRING
// ============================================================================

/**
 * Initializes the tasks component on page load
 * Loads tasks from LocalStorage
 * Renders the initial task list
 * Wires up event listeners for interactions
 */
function initializeTasks() {
  try {
    // Load tasks from LocalStorage
    AppState.tasks = LocalStorageManager.loadTasks();
    
    // Validate loaded data
    if (!Array.isArray(AppState.tasks)) {
      console.error('Loaded tasks is not an array');
      AppState.tasks = [];
    }
    
    // Update task counter based on loaded tasks
    if (AppState.tasks.length > 0) {
      const maxCounter = AppState.tasks.reduce((max, task) => {
        // Validate task has required properties
        if (!task || !task.id || typeof task.id !== 'string') {
          console.warn('Skipping task with invalid ID during counter update');
          return max;
        }
        
        // Extract counter from ID (format: task_{timestamp}_{counter})
        const parts = task.id.split('_');
        if (parts.length >= 3) {
          const counter = parseInt(parts[2], 10);
          return Math.max(max, isNaN(counter) ? 0 : counter);
        }
        return max;
      }, 0);
      
      AppState.taskCounter = maxCounter + 1;
    }
    
    // Render the initial task list
    renderTaskList();
    
    // Wire up event listeners
    const taskAddButton = document.getElementById('task-add');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    
    if (taskAddButton) {
      taskAddButton.addEventListener('click', addTaskHandler);
    } else {
      console.warn('Task add button (#task-add) not found');
    }
    
    if (taskInput) {
      taskInput.addEventListener('keypress', handleTaskInputKeypress);
    } else {
      console.warn('Task input (#task-input) not found');
    }
    
    if (taskList) {
      // Use event delegation for dynamically added task items
      taskList.addEventListener('click', function(event) {
        // Check if a task-checkbox was clicked
        if (event.target.classList.contains('task-checkbox')) {
          const taskItem = event.target.closest('.task-item');
          if (taskItem) {
            const taskId = taskItem.getAttribute('data-task-id');
            if (taskId) {
              toggleTask(taskId);
              renderTaskList();
            }
          }
        }
        
        // Check if a task-delete was clicked
        if (event.target.classList.contains('task-delete')) {
          const taskItem = event.target.closest('.task-item');
          if (taskItem) {
            const taskId = taskItem.getAttribute('data-task-id');
            if (taskId) {
              const success = deleteTask(taskId);
              if (success) {
                renderTaskList();
                showSuccess('Task deleted successfully');
              } else {
                showError('Failed to delete task');
              }
            }
          }
        }
        
        // Check if a task-edit was clicked (enter edit mode)
        if (event.target.classList.contains('task-edit')) {
          const taskItem = event.target.closest('.task-item');
          if (taskItem) {
            const taskId = taskItem.getAttribute('data-task-id');
            if (taskId) {
              AppState.editingTaskId = taskId;
              renderTaskList();
            }
          }
        }
        
        // Check if a task-save was clicked (save edited task)
        if (event.target.classList.contains('task-save')) {
          handleTaskSave(event);
        }
        
        // Check if a task-cancel was clicked (cancel edit mode)
        if (event.target.classList.contains('task-cancel')) {
          handleTaskCancel(event);
        }
      });
    } else {
      console.warn('Task list (#task-list) not found');
    }
  } catch (error) {
    console.error('Unexpected error initializing tasks:', error);
    showError('Failed to initialize tasks');
  }
}

// ============================================================================
// QUICK LINKS INITIALIZATION AND EVENT WIRING
// ============================================================================

/**
 * Initializes the quick links component on page load
 * Loads links from LocalStorage
 * Renders the initial links display
 * Wires up event listeners for interactions
 */
function initializeQuickLinks() {
  try {
    // Load quick links from LocalStorage
    AppState.quickLinks = LocalStorageManager.loadLinks();
    
    // Validate loaded data
    if (!Array.isArray(AppState.quickLinks)) {
      console.error('Loaded quick links is not an array');
      AppState.quickLinks = [];
    }
    
    // Update link counter based on loaded links
    if (AppState.quickLinks.length > 0) {
      const maxCounter = AppState.quickLinks.reduce((max, link) => {
        // Validate link has required properties
        if (!link || !link.id || typeof link.id !== 'string') {
          console.warn('Skipping link with invalid ID during counter update');
          return max;
        }
        
        // Extract counter from ID (format: link_{timestamp}_{counter})
        const parts = link.id.split('_');
        if (parts.length >= 3) {
          const counter = parseInt(parts[2], 10);
          return Math.max(max, isNaN(counter) ? 0 : counter);
        }
        return max;
      }, 0);
      
      AppState.linkCounter = maxCounter + 1;
    }
    
    // Render the initial links display
    renderLinks();
    
    // Wire up event listeners
    const linkAddButton = document.getElementById('link-add');
    const linkUrlInput = document.getElementById('link-url');
    const linksContainer = document.getElementById('links-container');
    
    if (linkAddButton) {
      linkAddButton.addEventListener('click', addLinkHandler);
    } else {
      console.warn('Link add button (#link-add) not found');
    }
    
    if (linkUrlInput) {
      linkUrlInput.addEventListener('keypress', handleLinkUrlKeypress);
    } else {
      console.warn('Link URL input (#link-url) not found');
    }
    
    if (linksContainer) {
      // Use event delegation for dynamically added link buttons
      linksContainer.addEventListener('click', function(event) {
        // Check if a quick-link-btn was clicked
        if (event.target.classList.contains('quick-link-btn')) {
          handleQuickLinkClick(event);
        }
        
        // Check if a link-delete-btn was clicked
        if (event.target.classList.contains('link-delete-btn')) {
          handleDeleteLink(event);
        }
      });
    } else {
      console.warn('Links container (#links-container) not found');
    }
  } catch (error) {
    console.error('Unexpected error initializing quick links:', error);
    showError('Failed to initialize quick links');
  }
}

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

// Initialize the application when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    UIController.init();
  });
} else {
  UIController.init();
}

// Clean up on page unload to prevent memory leaks
window.addEventListener('beforeunload', function() {
  UIController.destroy();
});
