/**
 * Timer utility functions for InactiTab extension
 */

/**
 * Convert timer settings to milliseconds
 * @param {Object} settings - Settings object with timerValue and timerUnit
 * @returns {number} Duration in milliseconds
 */
export function getTimerDurationMs(settings) {
  let duration = settings.timerValue;
  switch (settings.timerUnit) {
    case "minutes":
      duration *= 60;
      break;
    case "hours":
      duration *= 3600;
      break;
  }
  return duration * 1000;
}

/**
 * Timer class to manage individual tab timers
 */
export class TabTimer {
  constructor() {
    this.interval = null;
    this.startTime = null;
    this.elapsedTime = 0;
    this.isPaused = true;
  }

  /**
   * Start or resume the timer
   * @param {Function} onTimeout - Callback when timer expires
   * @param {number} duration - Timer duration in milliseconds
   * @param {Function} checkProtection - Function to check if tab is still protected
   */
  start(onTimeout, duration, checkProtection) {
    if (this.interval) return;

    this.startTime = Date.now();
    this.isPaused = false;

    this.interval = setInterval(async () => {
      const currentElapsed = this.elapsedTime + (Date.now() - this.startTime);

      // Check if tab should still be protected
      const isProtected = await checkProtection();
      if (isProtected) {
        this.stop();
        return;
      }

      if (currentElapsed >= duration) {
        onTimeout();
        this.stop();
      }
    }, 1000);
  }

  /**
   * Pause the timer
   */
  pause() {
    if (this.interval) {
      clearInterval(this.interval);
      if (this.startTime) {
        this.elapsedTime += Date.now() - this.startTime;
      }
      this.isPaused = true;
      this.interval = null;
    }
  }

  /**
   * Stop and reset the timer
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.elapsedTime = 0;
    this.startTime = null;
    this.interval = null;
    this.isPaused = true;
  }

  /**
   * Get current elapsed time
   * @returns {number} Elapsed time in seconds
   */
  getElapsedTime() {
    if (this.isPaused) {
      return Math.floor(this.elapsedTime / 1000);
    }
    return Math.floor(
      (this.elapsedTime + (Date.now() - this.startTime)) / 1000
    );
  }
}
