module.exports = class CallReferenceTimer {
  constructor() {
    this.numberOfCalls = 0;
    this.maxNumberOfCalls = 30;
    this.timeStep = 60;
    this.nextInterval = this.getTime() + this.timeStep;
  }

  incrementCalls() {
    if (!this.checkTime()) {
      if (this.numberOfCalls > this.maxNumberOfCalls) {
        this.sleepFor(this.timeTillNextInterval());
        this.setInterval();
        this.numberOfCalls = 1;
        return;
      }
      this.numberOfCalls += 1;
      return;
    } else {
      this.setInterval();
      this.numberOfCalls = 1;
      return;
    }
  }
  setInterval() {
    this.nextInterval = this.getTime() + this.timeStep;
  }
  checkTime() {
    return this.getTime() > this.nextInterval;
  }
  timeTillNextInterval() {
    return this.nextInterval - this.getTime();
  }
  getTime() {
    return Math.floor(Date.now() / 1000);
  }
  /**
   *
   * @param {Number} ms
   */
  sleepFor(time) {
    while (new Date().now() < time) {
      console.log("doing nothing");
      /* do nothing */
    }
  }
};
