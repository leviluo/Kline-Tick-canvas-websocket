function isEmpty(value) {
    return (Array.isArray(value) && value.length === 0) || (Object.prototype.isPrototypeOf(value) && Object.keys(value).length === 0);
}

//格式化时间
function formatDate(timestamp) {
    var now = new Date(timestamp);
    var month = now.getMonth();
    var date = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    if (minute < 10) {
        minute = '0' + minute;
    };
    return month + "-" + date + " " + hour + ":" + minute;
}

//计算价格数组
function calcAxisValues(high, low, count) {
    var diff = high - low;
    var space = diff / (count - 1);
    var result = [];
    for (var i = 0; i < count; i++) {
        result.push((high - i * space).toFixed(2));
    }
    return result;
}

function addEvent(elm, evType, fn, useCapture) { //防止重复监听同样函数

    // if (!elm.eventList) {
    //     elm.eventList = [];
    // }

    // for (var i = 0; i < elm.eventList.length; i++) {
    //     if (elm.eventList[i] == evType) {
    //         return
    //     } 
    // };

    // elm.eventList.push(evType)

    if (elm.addEventListener) {
        elm.addEventListener(evType, fn, useCapture);
        return true;
    } else if (elm.attachEvent) {
        var r = elm.attachEvent('on' + evType, fn);
        return r;
    } else {
        elm['on' + evType] = fn;
    }
    if (elm.eventList === undefined) {
        elm.eventList = [];
    }
}

(function() {
    Array.prototype.each = function(func, startIndex, endIndex) { //用于计算最高价和最低价
        startIndex = startIndex || 0;
        endIndex = endIndex || this.length - 1;
        for (var i = startIndex; i <= endIndex; i++) {
            func(this[i], this, i);
            if (this.breakLoop) {
                this.breakLoop = false;
                break;
            }
        }
    };
})();

// canvas调整不同屏幕分辨率
(function(prototype) {
    var pixelRatio = (function(context) {
            var backingStore = context.backingStorePixelRatio ||
                context.webkitBackingStorePixelRatio ||
                context.mozBackingStorePixelRatio ||
                context.msBackingStorePixelRatio ||
                context.oBackingStorePixelRatio ||
                context.backingStorePixelRatio || 1;

            return (window.devicePixelRatio || 1) / backingStore;
        })(prototype),

        forEach = function(obj, func) {
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    func(obj[p], p);
                }
            }
        },

        ratioArgs = {
            'fillRect': 'all',
            'clearRect': 'all',
            'strokeRect': 'all',
            'moveTo': 'all',
            'lineTo': 'all',
            'arc': [0, 1, 2],
            'arcTo': 'all',
            'bezierCurveTo': 'all',
            'isPointinPath': 'all',
            'isPointinStroke': 'all',
            'quadraticCurveTo': 'all',
            'rect': 'all',
            'translate': 'all',
            'createRadialGradient': 'all',
            'createLinearGradient': 'all'
        };

    if (pixelRatio === 1) return;

    forEach(ratioArgs, function(value, key) {
        prototype[key] = (function(_super) {
            return function() {
                var i, len,
                    args = Array.prototype.slice.call(arguments);

                if (value === 'all') {
                    args = args.map(function(a) {
                        return a * pixelRatio;
                    });
                } else if (Array.isArray(value)) {
                    for (i = 0, len = value.length; i < len; i++) {
                        args[value[i]] *= pixelRatio;
                    }
                }

                return _super.apply(this, args);
            };
        })(prototype[key]);
    });

    // Stroke lineWidth adjustment
    prototype.stroke = (function(_super) {
        return function() {
            this.lineWidth *= pixelRatio;
            _super.apply(this, arguments);
            this.lineWidth /= pixelRatio;
        };
    })(prototype.stroke);

    // Text
    prototype.fillText = (function(_super) {
        return function() {
            var args = Array.prototype.slice.call(arguments);

            args[1] *= pixelRatio; // x
            args[2] *= pixelRatio; // y

            this.font = this.font.replace(
                /(\d+)(px|em|rem|pt)/g,
                function(w, m, u) {
                    return (m * pixelRatio) + u;
                }
            );

            _super.apply(this, args);

            this.font = this.font.replace(
                /(\d+)(px|em|rem|pt)/g,
                function(w, m, u) {
                    return (m / pixelRatio) + u;
                }
            );
        };
    })(prototype.fillText);

    prototype.strokeText = (function(_super) {
        return function() {
            var args = Array.prototype.slice.call(arguments);

            args[1] *= pixelRatio; // x
            args[2] *= pixelRatio; // y

            this.font = this.font.replace(
                /(\d+)(px|em|rem|pt)/g,
                function(w, m, u) {
                    return (m * pixelRatio) + u;
                }
            );

            _super.apply(this, args);

            this.font = this.font.replace(
                /(\d+)(px|em|rem|pt)/g,
                function(w, m, u) {
                    return (m / pixelRatio) + u;
                }
            );
        };
    })(prototype.strokeText);
})(CanvasRenderingContext2D.prototype);

(function(prototype) {
    prototype.getContext = (function(_super) {
        return function(type) {
            var backingStore, ratio,
                context = _super.call(this, type);

            if (type === '2d') {

                backingStore = context.backingStorePixelRatio ||
                    context.webkitBackingStorePixelRatio ||
                    context.mozBackingStorePixelRatio ||
                    context.msBackingStorePixelRatio ||
                    context.oBackingStorePixelRatio ||
                    context.backingStorePixelRatio || 1;
                // // console.log(backingStore)
                ratio = (window.devicePixelRatio || 1) / backingStore;
                // console.log(ratio)
                if (ratio > 1) {
                    // // console.log(this.height)
                    // // console.log(this.width)
                    this.height = 300;
                    this.style.height = this.height + 'px';
                    this.style.width = this.width + 'px';
                    this.width *= ratio;
                    this.height *= ratio;
                }
            }
            return context;
        };
    })(prototype.getContext);
})(HTMLCanvasElement.prototype);
