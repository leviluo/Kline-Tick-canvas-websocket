function initKlineCanvas(options, canvasId, parentQuote) {
    this.options = options
    this.canvasId = canvasId
    this.parentQuote = parentQuote
    this.ctx = document.getElementById(canvasId).getContext('2d');
}

initKlineCanvas.prototype = {
    paint: function(data, ranges, isNewData) {
        this.data = data;
        // this.isMove = false;
        var region = this.options.region;
        var options = this.options
        this.ctx.clearRect(0, 0, region.width, 300); //清除画布

        var DataLength = this.data.length
        var dataActualCount = Math.ceil(region.width / (options.spaceWidth + options.barWidth)) - 1; //

        if (dataActualCount > DataLength) {
            dataActualCount = DataLength;
            var timeMaxWidth = (DataLength - 1) * options.spaceWidth + DataLength * options.barWidth;
        } else {
            var timeMaxWidth = options.region.width;
        }
        // console.log(ranges)
        // console.log(DataLength, dataActualCount)

        this.dataRanges = ranges ? ranges : { //onMove event的ranges计算
            start: 100 * (DataLength - dataActualCount) / DataLength,
            to: 100
        };
        // console.log(this.dataRanges)

        //新增数据重现计算ranges
        if (isNewData) {
            if (100 / (this.updateCounts + 1) - (this.dataRanges.to - this.dataRanges.start) >= 0) {
                this.dataRanges = {
                    start: 100 / (this.updateCounts + 1) - (this.dataRanges.to - this.dataRanges.start),
                    to: 100 / (this.updateCounts + 1)
                }
            } else {
                this.dataRanges = {
                    start: 0,
                    to: this.dataRanges.to - this.dataRanges.start
                }
            }
        }

        if (timeMaxWidth < 300) {
            var timeCounts = 0
        } else if (timeMaxWidth < 400) {
            var timeCounts = 1
        } else if (timeMaxWidth < 600) {
            var timeCounts = 2
        } else if (timeMaxWidth < 800) {
            var timeCounts = 3
        } else {
            var timeCounts = 5
        }

        var dataRanges = this.dataRanges
        // console.log(dataRanges)
        var startIndex = Math.ceil(dataRanges.start / 100 * DataLength);
        var toIndex = Math.ceil(dataRanges.to / 100 * DataLength) + 1;
        // console.log(this.data)
        // console.log(dataRanges)
        var filteredData = [];
        for (var i = startIndex; i <= toIndex && i < DataLength; i++) {
            filteredData.push(this.data[i]);
        }

        var init = new drawing(this.ctx, options)

        var high, low;
        filteredData.each(function(val, a, i) {
            if (i == 0) {
                high = val[2];
                low = val[3];
            } else {
                high = Math.max(val[2], high);
                low = Math.min(low, val[3]);
            }
        });
        this.high = high;
        this.low = low;
        //移动平均线
        // this.paintMAs(filteredData,high,low);
        this.currentX = 0;
        //画蜡烛
        init.paintCandleLine(filteredData, this)
            //水平线和价格
        var priceItems = calcAxisValues(high, low, (options.horizontalLineCount))
        init.drawHLineandPrice(priceItems);
        //垂直线和时间
        var quareTime = [];
        var stepLength = filteredData.length / (timeCounts + 1);
        for (var i = 0; i < timeCounts + 1; i++) {
            var index = Math.floor(i * stepLength);
            if (index >= filteredData.length) index = filteredData.length - 1;
            var quoteTime = formatDate(filteredData[index][0]);
            quareTime.push(quoteTime);
        }
        quareTime.push(formatDate(filteredData[filteredData.length - 1][0]));
        init.paintTime(quareTime, timeMaxWidth);
        if(!this.evts)this.addEvts(); //添加拖拉事件
        this.filteredData = filteredData;
        this.init = init;
        // console.log("更新了数据么么？")
        // console.log(this)
    },
    updateLastPoint: function(data) { //更新最新点
        this.paint(data, this.dataRanges)
    },
    updateContract: function(data) { //更新合约
        this.updateCounts = 0; //初始化翻屏页数
        this.paint(data)
    },
    addNewData:function(data){
        // this.isMove = false;
        this.paint(data, null, true)
    },
    reSize:function(width){
        this.options.region.width = width;
        this.paint(this.data);
    },
    getX: function(i) {
        var result = i * (this.options.spaceWidth + this.options.barWidth) + (this.options.spaceWidth + this.options.barWidth) * .5;
        if (result * 10 % 10 == 0) result += .5;
        return result;
    },
    getY: function(price) {
        return ((this.high - price) * this.options.region.height / (this.high - this.low)) + this.options.region.y;
    },

    addEvts: function() {
        this.isMove = false
        var me = this;
        var tips = document.getElementById(this.canvasId + 'Tips')
        tips.style.display = "none"

        var eventContrls = {
            onStart: function(e) {
                console.log("onStart")
                this.startX = e.offsetX;
                me.isMove = true
                tips.style.display = "none"
            },
            onEnd: function(e) {
                console.log("onEnd")
                me.isMove = false
            },
            onMove: function(e) {
                // console.log(me)
                console.log(me.isMove)
                if (!me.isMove) {
                    var pointNum = Math.round(e.offsetX / (me.options.barWidth + me.options.spaceWidth))
                    var point = me.filteredData[pointNum];
                    if (pointNum > me.filteredData.length - 1) {
                        return
                    }
                    var text = "T" + formatDate(point[0]) + " 开盘" + point[1] + " 最高" + point[2] + " 最低" + point[3] + " 收盘" + point[4];
                    me.paint(me.data, me.dataRanges);
                    me.init.paintTips({ x: me.getX(pointNum) - 0.5, y: me.getY(point[4]) }, text)
                    return
                };
                var moveDistance = e.offsetX - this.startX
                var moveValue = 0 - (moveDistance / me.options.region.width) * (me.dataRanges.to - me.dataRanges.start);
                var start = me.dataRanges.start + moveValue;
                // console.log(e.offsetX,this.startX)
                // console.log(start, me.dataRanges, moveDistance, moveValue)
                if (start < 0) {
                    start = 0;
                    me.isMove = false
                    me.updateCounts += 1;
                    console.log("更新了几次")
                    console.log(me.isMove)
                    me.parentQuote.addOldData(me.data[0][0])
                    return
                }
                var to = me.dataRanges.to + moveValue;
                if (to > 100) {
                    to = 100;
                    return;
                }
                var changeToValue = { left: start, right: to };
                // console.log(changeToValue)
                this.startX = e.offsetX;
                me.paint(me.data, { start: changeToValue.left, to: changeToValue.right });
            },
        }
        // if (!this.evts) {
            this.evts = new Evts(this.canvasId, eventContrls);
            this.evts.addKlineEvent();
        // }
    },

}
