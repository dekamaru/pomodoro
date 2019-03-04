const TimerState = {
  IDLE: 0,
  WORK: 1,
  SHORT_BREAK: 2,
  LONG_BREAK: 3
}

class TimerView {
  constructor(options = {}, timer) {
    this.defaultOptions = {
      workLabel: '#work-time',
      shortBreakLabel: '#break-short-time',
      longBreakLabel: '#break-long-time',
      roundsCountLabel: '#rounds-count',
      phaseLabel: '#state',
      timeLabel: '#time'
    };

    this.options = Object.assign(options, this.defaultOptions);
    this.timer = timer;
  }

  display() {
    this.displayWorkTime();
    this.displayShortBreakTime();
    this.displayLongBreakTime();
    this.displayRoundsCount();
    this.displayState();
    this.displayTime();
  }

  displayWorkTime() {
    let minutes = this.timer.getWorkTime() / 60;
    this._setText(this.options.workLabel, `${minutes}:00`);
  }

  displayShortBreakTime() {
    let minutes = this.timer.getShortBreakTime() / 60;
    this._setText(this.options.shortBreakLabel, `${minutes}:00`);
  }

  displayLongBreakTime() {
    let minutes = this.timer.getLongBreakTime() / 60;
    this._setText(this.options.longBreakLabel, `${minutes}:00`);
  }

  displayRoundsCount() {
    this._setText(this.options.roundsCountLabel, this.timer.getRoundsCount());
  }

  displayState() {
    switch(this.timer.getCurrentState()) {
      case TimerState.IDLE:
        this._setText(this.options.phaseLabel, 'Preparing')
        break;
      case TimerState.WORK:
        this._setText(this.options.phaseLabel, 'Work')
        break;
      case TimerState.SHORT_BREAK:
        this._setText(this.options.phaseLabel, 'Short break')
        break;
      case TimerState.LONG_BREAK:
        this._setText(this.options.phaseLabel, 'Long break')
        break;
    }
  }

  displayTime() {
    if (this.timer.getCurrentState() === TimerState.IDLE) {
      this._setText(this.options.timeLabel, '');
      return;
    }

    let minutes = Math.floor(this.timer.getCurrentTimer() / 60);
    let seconds = this.timer.getCurrentTimer() - minutes * 60;
    let timeString = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

    this._setText(this.options.timeLabel, timeString);
  }

  _setText(selector, value) {
    document.querySelector(selector).innerHTML = value;
  }
}

class TimerInput {
  constructor(options = {}, view, timer) {
    this.defaultOptions = {
      workInput: '#work-input',
      shortBreakInput: '#short-break-input',
      longBreakInput: '#long-break-input',
      roundsCountInput: '#rounds',
      resetButton: '#timer-reset',
      startButton: '#start',
      stopButton: '#stop'
    };

    this.options = Object.assign(options, this.defaultOptions);
    this.view = view;
    this.timer = timer;

    document.querySelector(this.options.workInput).oninput = this.injectSelf(this.setWorkTime);
    document.querySelector(this.options.shortBreakInput).oninput = this.injectSelf(this.setShortBreak);
    document.querySelector(this.options.longBreakInput).oninput = this.injectSelf(this.setLongBreak);
    document.querySelector(this.options.roundsCountInput).oninput = this.injectSelf(this.setRoundsCount);
    document.querySelector(this.options.resetButton).onclick = this.injectSelf(this.resetTimer);
    document.querySelector(this.options.startButton).onclick = this.injectSelf(this.startTimer);
    document.querySelector(this.options.stopButton).onclick = this.injectSelf(this.stopTimer);
  }

  setWorkTime(event, self) {
    if (self.timer.getCurrentState() !== TimerState.IDLE) {
      document.querySelector(self.options.workInput).value = self.timer.getWorkTime() / 60;
      return;
    }

    let seconds = parseInt(event.target.value) * 60;
    self.timer.setWorkTime(seconds);
    self.view.displayWorkTime();
  }

  setShortBreak(event, self) {
    if (self.timer.getCurrentState() !== TimerState.IDLE) {
      document.querySelector(self.options.shortBreakInput).value = self.timer.getShortBreakTime() / 60;
      return;
    }

    let seconds = parseInt(event.target.value) * 60;
    self.timer.setShortBreakTime(seconds);
    self.view.displayShortBreakTime();

  }

  setLongBreak(event, self) {
    if (self.timer.getCurrentState() !== TimerState.IDLE) {
      document.querySelector(self.options.longBreakInput).value = self.timer.getLongBreakTime() / 60;
      return;
    }

    let seconds = parseInt(event.target.value) * 60;
    self.timer.setLongBreakTime(seconds);
    self.view.displayLongBreakTime();
  }

  setRoundsCount(event, self) {
    if (self.timer.getCurrentState() !== TimerState.IDLE) {
      document.querySelector(self.options.roundsCountInput).value = self.timer.getRoundsCount();
      return;
    }

    self.timer.setRoundsCount(parseInt(event.target.value));
    self.view.displayRoundsCount();

  }

  resetInputs() {
    document.querySelector(this.options.workInput).value = this.timer.getWorkTime() / 60;
    document.querySelector(this.options.shortBreakInput).value = this.timer.getShortBreakTime() / 60;
    document.querySelector(this.options.longBreakInput).value = this.timer.getLongBreakTime() / 60;
    document.querySelector(this.options.roundsCountInput).value = this.timer.getRoundsCount();
  }

  resetTimer(event, self) {
    if (self.timer.getCurrentState() !== TimerState.IDLE) {
      return;
    }

    self.timer.resetToDefaults();
    self.view.display();
    self.resetInputs();
  }

  startTimer(event, self) {
    self.timer.start();
  }

  stopTimer(event, self) {
    self.timer.stop();
  }

  injectSelf(callback) {
    return (args) => {
      callback(args, this);
    }
  }
}

class Timer {
  constructor(options = {}) {
    this.defaultOptions = {
      workTime: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60,
      rounds: 4
    };

    this.options = Object.assign(options, this.defaultOptions);
    this.currentState = TimerState.IDLE;

    setInterval(() => {
      this.tick();
    }, 1000);
  }

  tick() {
    switch (this.getCurrentState()) {
      case TimerState.IDLE:
        break;
      case TimerState.WORK:
          this.handleWorkTimer()
        break;
      case TimerState.SHORT_BREAK:
      case TimerState.LONG_BREAK:
          this.handleBreakTimer(this.getCurrentState())
        break;
    }

    this.onTick();
  }

  handleWorkTimer() {
    this.decreaseTimer();
    if (this.isTimerEnd()) {
      if (this.isLastRound()) {
        this.runLongBreak();
      } else {
        this.runShortBreak();
      }
    }
  }

  handleBreakTimer(state) {
    this.decreaseTimer();
    if (this.isTimerEnd()) {
      if (TimerState.LONG_BREAK === state) {
        this.stop();
      } else {
        this.runWork();
      }
    }
  }

  isTimerEnd() {
    return 0 === this.currentTimer;
  }

  decreaseTimer() {
    this.currentTimer--;
  }

  decreaseRound() {
    this.currentRounds--;
  }

  isLastRound() {
    return 0 === this.currentRounds;
  }

  runShortBreak() {
    this.currentTimer = this.options.longBreak;
    this.currentState = TimerState.SHORT_BREAK;
  }

  runLongBreak() {
    this.currentTimer = this.options.shortBreak;
    this.currentState = TimerState.LONG_BREAK;
  }

  runWork() {
    this.decreaseRound();
    this.currentTimer = this.options.workTime;
    this.currentState = TimerState.WORK;
  }

  start() {
    this.currentRounds = this.options.rounds;
    this.runWork();
  }

  stop() {
    this.currentState = TimerState.IDLE;
  }

  getCurrentTimer() {
    return this.currentTimer;
  }

  getCurrentState() {
    return this.currentState;
  }

  resetToDefaults() {
    this.options = Object.assign({}, this.defaultOptions);
  }

  getWorkTime() {
    return this.options.workTime;
  }

  setWorkTime(seconds) {
    this.options.workTime = seconds;
  }

  getShortBreakTime() {
    return this.options.shortBreak;
  }

  setShortBreakTime(seconds) {
    this.options.shortBreak = seconds;
  }

  getLongBreakTime() {
    return this.options.longBreak;
  }

  setLongBreakTime(seconds) {
    this.options.longBreak = seconds;
  }

  getRoundsCount() {
    return this.options.rounds;
  }

  setRoundsCount(rounds) {
    this.options.rounds = rounds;
  }
}

class TimerApp {
  constructor(options = {}) {
    this.timer = new Timer(options.timer);
    this.view = new TimerView(options.view, this.timer);
    this.input = new TimerInput(options.input, this.view, this.timer);

    this.view.display();
    this.timer.onTick = () => {
      this.view.display();
    };
  }
}

new TimerApp();
