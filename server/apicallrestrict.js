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
        return false;
      }
      this.numberOfCalls += 1;
      return true;
    } else {
      this.setInterval();
      this.numberOfCalls = 1;
      return true;
    }
  }
  setInterval() {
    this.nextInterval = this.getTime() + this.timeStep;
  }
  checkTime() {
    return this.getTime() > this.nextInterval;
  }

  getTime() {
    return Math.floor(Date.now() / 1000);
  }
};
