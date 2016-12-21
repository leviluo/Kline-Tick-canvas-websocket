function initTickCanvas(options, canvasId) {
    this.options = options
    this.canvasId = canvasId
    console.log(canvasId)
    this.ctx = document.getElementById(canvasId).getContext('2d');
}

initTickCanvas.prototype = {
    paint: function(data) {
        var options = this.options
        var init = new drawing(this.ctx, options)
        var data = this.data = data;
        //水平线和价格
        var high, low;
        var priceArray = [];
        data.each(function(val, a, i) {
            if (i == 0) {
                high = val[1];
                low = val[1];
            } else {
                high = Math.max(val[1], high);
                low = Math.min(low, val[1]);
            }
            priceArray.push(val[1])
        });
        var priceItems = calcAxisValues(high, low, options.horizontalLineCount)
        init.drawHLineandPrice(priceItems);

        var maxDiff = high - low;

        this.high = high;
        this.maxDiff = maxDiff;
        //走势图
        init.paintPriceline(priceArray, this)
        var width = this.options.region.width;

        if (width < 300) {
            var timeCounts = 0
        } else if (width < 400) {
            var timeCounts = 1
        } else if (width < 600) {
            var timeCounts = 2
        } else if (width < 800) {
            var timeCounts = 3
        } else {
            var timeCounts = 5
        }

        var step = Math.floor(data.length / (timeCounts + 1));
        var timeItems = [];
        for (var i = 0; i <= timeCounts; i++) {
            timeItems.push(formatDate(data[i * step][0]))
        }

        timeItems.push(formatDate(data[data.length - 1][0]));

        init.paintTime(timeItems, width);

        //事件
        this.addEvts();

    },
    getX: function(i) { //获取价格点X位置
        return i * (this.options.region.width / (this.data.length - 1));
    },
    getY: function(i) { //获取价格点Y位置
        return ((this.high - i) * this.options.region.height / this.maxDiff)
    },
    reSize:function(width){
        this.options.region.width = width;
        this.paint(this.data);
    },
    addEvts: function() {
        var me = this;
        var averX = this.options.region.width / (this.data.length - 1)
        var tips = document.getElementById('tips')
        tips.style.display = "none"
        var eventContrls = {
            moveIn: function(e) {
                var pointNum = Math.round(e.offsetX / averX)
                if (pointNum > me.data.length-1) {
                        return
                    }
                var options = {
                    region: me.options.region,
                    contentWidth: 180
                }
                if (!me.tip) {
                    me.tip = new Tips(tips, options)
                    me.tip.createTip();
                }
                var text = "T" + formatDate(me.data[pointNum][0]) + " ¥" + me.data[pointNum][1]
                me.tip.showTip({ x: e.offsetX, y: me.getY(me.data[pointNum][1]) }, text);
            },
            moveOut: function(e) {
                console.log("mouseout")
                    // me.tip.hideTip()
            }
        }
        if (!this.evts) {
            this.evts = new Evts(this.canvasId, eventContrls);
            this.evts.addTickEvent();
        }
    }
}
