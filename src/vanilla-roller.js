'use strict';

var VanillaRoller = function (params) {
  this.params = params;

  // consts
  this.MIN = params.minValue;
  this.MAX = params.maxValue;
  this.DIFFERENCE = this.MAX - this.MIN;
  var DEFAULT_STEPS_QUNTITY = 20;
  this.STEP = this.params.step || this.DIFFERENCE / DEFAULT_STEPS_QUNTITY;

  // nodes
  var rollerNode = this.params.parentElement;
  this.rollerHandler = rollerNode.querySelector('.vanilla-roller__circle');
  this.rollerHandler2 = rollerNode.querySelectorAll('.vanilla-roller__circle')[1] || false;
  this.shaftIndicator = rollerNode.querySelector('.vanilla-roller__shaft-indicator');
  this.isSecondHandler = !!this.rollerHandler2;

  // callback vars
  this.value1 = this.MIN;
  this.value2 = this.MAX;
  this.currentChangedInput = false;

  this.currentTarget = this.rollerHandler;
  this.handlerPosition = 0;
  this.secondHandlerPosition = 0;

  this.rollerNodeLongitude = rollerNode.offsetWidth;
  this.parentLongitudeFromLeft = rollerNode.getBoundingClientRect().left;

  this.shaftIndicatorFromLeft = 0;
  this.shaftIndicatorFromRight = 0;

  this._move = this._move.bind(this);

  this._setInitialValues();
  this._setListeners();
};

VanillaRoller.prototype = {
  _getProcentGap: function () {
    var DIFFERENCE = this.DIFFERENCE;
    var procentGap = null;

    if (this.params.gap) {
      procentGap = Math.floor((this.params.gap * 100) / DIFFERENCE);
      return procentGap;
    }

    var rollerWidth = this.params.parentElement.offsetWidth;
    var circleWidth = this.rollerHandler.offsetWidth;
    var circleToRollerRatio = circleWidth / rollerWidth;
    var defaultGap = Math.floor(DIFFERENCE * circleToRollerRatio) * 2;
    var gap = defaultGap;

    procentGap = Math.floor((gap * 100) / DIFFERENCE);

    return procentGap;
  },

  _roundOff: function (val) {
    var STEP = this.STEP;
    var MIN = this.MIN;
    var MAX = this.MAX;

    var value = Number(val);

    value = value === 0 ? 0 : Number(value.toFixed(0));

    if (value === STEP) {
      return value;
    }

    var numberTail = value % STEP;

    if (value === numberTail) {
      if (value > STEP / 2) {
        value = STEP;
      } else {
        value = MIN;
      }
      return value;
    }

    if (value > numberTail) {
      value = value - numberTail;

      if (value > MAX || value + numberTail >= MAX) {
        value = MAX;
      }
    }
    return value;
  },

  _getHandlerPositionPercent: function (handlerPosition, totalLongitude) {
    var handlerPositionPercent = Math.ceil(handlerPosition / totalLongitude * 100);

    if (handlerPositionPercent > 100) {
      handlerPositionPercent = 100;
    } else if (handlerPositionPercent < 0) {
      handlerPositionPercent = 0;
    }

    return handlerPositionPercent;
  },

  _move: function (pointerPosition, target, declaredValue) {
    var rollerNode = this.params.parentElement;
    var procentGap = this._getProcentGap();
    var rollerNodeLongitude = rollerNode.offsetWidth;
    var parentLongitudeFromLeft = rollerNode.getBoundingClientRect().left;
    var rollerPosition = pointerPosition - parentLongitudeFromLeft;
    var percent = this._getHandlerPositionPercent(rollerPosition, rollerNodeLongitude);
    var restLongitudeOfShaft = 100 - percent;
    var callback = this.params.onMove;

    if (!this.isSecondHandler) {
      this.currentChangedInput = 1;
      if (declaredValue) {
        this.value1 = this._roundOff(declaredValue);
      } else {
        this.value1 = this._roundOff(percent * this.DIFFERENCE / 100 + this.MIN);
      }

      this.rollerHandler.style.left = percent + '%';
      this.shaftIndicator.style.width = restLongitudeOfShaft + '%';
    }
    // end one roller condition

    if (this.isSecondHandler) {
      if (target === this.rollerHandler || target === this.rollerHandler2) {
        this.currentTarget = target;
      }

      if (this.currentTarget === this.rollerHandler) {
        this.currentChangedInput = 1;

        if (percent + this.secondHandlerPosition <= 100 - procentGap) {
          this.rollerHandler.style.left = percent + '%';
          this.handlerPosition = percent;
          this.shaftIndicatorFromLeft = percent;
          this.shaftIndicator.style.width = 100 - (this.shaftIndicatorFromLeft + this.shaftIndicatorFromRight) + '%';
          if (declaredValue) {
            this.value1 = this._roundOff(declaredValue);
          } else {
            this.value1 = this._roundOff(percent * this.DIFFERENCE / 100 + this.MIN);
          }
        }
      }

      if (this.currentTarget === this.rollerHandler2) {
        this.currentChangedInput = 2;

        if (restLongitudeOfShaft + this.handlerPosition <= 100 - procentGap) {
          if (declaredValue) {
            this.value2 = this._roundOff(declaredValue);
          } else {
            this.value2 = this._roundOff(percent * this.DIFFERENCE / 100 + this.MIN);
          }

          this.shaftIndicatorFromRight = restLongitudeOfShaft;
          this.secondHandlerPosition = restLongitudeOfShaft;
          this.rollerHandler2.style.right = restLongitudeOfShaft + '%';
          this.shaftIndicator.style.right = restLongitudeOfShaft + '%';
          this.shaftIndicator.style.width = 100 - (this.shaftIndicatorFromLeft + this.shaftIndicatorFromRight) + '%';
        }
      }
    }
    // end multi rollers condition
    if (callback) {
      callback(this.value1, this.value2, this.currentChangedInput);
    }
  },

  setValue: function (value, rollerNumber) {
    var coef = value > this.MAX ? 1 : (value - this.MIN) / this.DIFFERENCE;
    var pxPosition = this.rollerNodeLongitude * coef + this.parentLongitudeFromLeft;

    if (rollerNumber === 1) {
      this._move(pxPosition, this.rollerHandler, value);
    } else if (rollerNumber === 2) {
      this._move(pxPosition, this.rollerHandler2, value);
    }
  },

  _setInitialValues: function () {
    if (this.params.startValue) {
      this.setValue(this.params.startValue, 1);
    }

    if (this.params.endValue) {
      this.setValue(this.params.endValue, 2);
    }
  },

  _clickHandler: function () {
    var move = this._move;
    var rollerHandler = this.rollerHandler;
    var rollerHandler2 = this.rollerHandler2;

    return function (e) {
      if (e.target !== rollerHandler && e.target !== rollerHandler2) {
        move(e.pageX);
      }
    };
  },


  _setMouseKeyListener: function (element) {
    var move = this._move;

    var onMouseUpCallback = function (self) {
      if (self.params.onMouseUp) {
        self.params.onMouseUp(self.value1, self.value2, self.currentChangedInput);
      }
    };

    var callback = onMouseUpCallback.bind(null, this);

    var mouseMoveHandler = function (evt) {
      move(evt.pageX, evt.target);
    };

    var mouseUpHandler = function (evt) {
      callback();
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    var mouseDownHandler = function () {
      console.log('mousedown');
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };

    element.addEventListener('mousedown', mouseDownHandler);
  },

  _setTouchListener: function (element) {
    var move = this._move;

    if (window.TouchEvent) {
      var touchMove = function (e) {
        var touchobj = e.changedTouches[0];
        var startx = parseInt(touchobj.pageX, 10);
        move(startx, e.target);
      };

      element.addEventListener('touchstart', function () {
        element.addEventListener('touchmove', touchMove, false);
      }, false);
    }
  },

  _setListeners: function () {
    var shaftClickHandler = this._clickHandler();
    this.params.parentElement.addEventListener('click', shaftClickHandler);

    this._setMouseKeyListener(this.rollerHandler);
    this._setTouchListener(this.rollerHandler);

    if (this.isSecondHandler) {
      this._setMouseKeyListener(this.rollerHandler2);
      this._setTouchListener(this.rollerHandler2);
    }
  },
};
