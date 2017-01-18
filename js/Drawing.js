function drawing(ctx, options) {
    this.ctx = ctx;
    this.options = options;
}
drawing.prototype = {
    drawHLineandPrice: function(priceItems) {
        var options = this.options;
        var ctx = this.ctx;
        ctx.strokeStyle = options.Hline.color || "#ccc";
        ctx.lineStyle = options.Hline.lineStyle || "solid";
        ctx.lineWidth = options.Hline.lineWidth || "1px";
        var spaceHeight = options.region.height / (options.horizontalLineCount - 1);
        ctx.fillStyle = options.leftPrice.backgroundColor;
        ctx.fillRect(0, 0, options.leftPrice.backgroundWidth, options.leftPrice.backgroundheight);

        ctx.fillStyle = options.leftPrice.color;
        ctx.font = options.leftPrice.font;

        for (var i = 0; i < options.horizontalLineCount; i++) {
            var y = options.region.y + spaceHeight * i;
            // if (y * 10 % 10 == 0) y += .5;
            if (i == options.horizontalLineCount - 1) {
                //     ctx.setLineDash([0]);
                // } else {
                //     ctx.setLineDash([2]);
                this.paintLine(options.region.x, y, options.region.width)
            }

            this.paintText(priceItems[i], options.leftPrice.region.x, y - 8)
            this.focusY = y;
        }
        var me = this;
    },
    paintTime: function(quareTime, timeMaxWidth) {
        var options = this.options.xAxis
        this.ctx.fillStyle = options.color;
        this.ctx.font = options.font;
        var steps = timeMaxWidth / (quareTime.length - 1)
        for (var i = 0; i < quareTime.length; i++) {
            if (i == 0) {
                this.paintText(quareTime[i], options.region.x, options.region.y)
            } else if (i == (quareTime.length - 1)) {
                this.paintText(quareTime[i], options.region.x + steps * i - options.width, options.region.y)
            } else {
                this.paintText(quareTime[i], options.region.x + steps * i - 5 - options.width / 2, options.region.y)
            }
        };
    },
    paintText: function(text, x, y) {
        this.ctx.fillText(text, x, y);
    },
    paintLine: function(x, y, width) {
        var ctx = this.ctx
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.stroke()
    },
    paintVine: function(x, y, height) {
        var ctx = this.ctx
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.stroke()
    },
    paintPriceline: function(priceArray, parentQuote) { //走势图主体
        this.maxDotsCount = priceArray.length;
        for (var i = 0; i < this.maxDotsCount; i++) {
            this.paintItemline(i, parentQuote.getX(i), parentQuote.getY(priceArray[i]) + this.options.region.y)
        }
        for (var i = 0; i < this.maxDotsCount; i++) {
            this.paintItemDiv(i, parentQuote.getX(i), parentQuote.getY(priceArray[i]) + this.options.region.y)
        }
    },
    paintItemline: function(i, x, y) { //价格走势图白色边条
        var ctx = this.ctx;
        if (i == 0) {
            ctx.lineStyle = 'solid'
            ctx.strokeStyle = 'rgba(255,255,255,1)'
            ctx.beginPath();
            ctx.moveTo(x, y);
        } else if (i == this.maxDotsCount - 1) {
            ctx.lineTo(x, y);
            ctx.stroke();
        } else {
            ctx.lineTo(x, y);
        }
    },
    paintItemDiv: function(i, x, y) { //价格走势图白色渐变区域
        var ctx = this.ctx;
        if (i == 0) {
            ctx.beginPath();
            ctx.moveTo(x, y);
        } else if (i == this.maxDotsCount - 1) {
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(255,255,255,0)'
            var my_gradient = ctx.createLinearGradient(0, 0, 0, 170);
            my_gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
            my_gradient.addColorStop(1, 'rgba(255,255,255,0.2)');
            ctx.fillStyle = my_gradient;
            ctx.lineTo(x, this.options.region.height + this.options.region.y);
            ctx.lineTo(this.options.region.x, this.options.region.height + this.options.region.y);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        } else {
            ctx.lineTo(x, y);
        }
    },
    paintCandleLine: function(items, parentQuote) {
        this.currentX = 0;
        for (var i = 0; i < items.length; i++) {
            this.drawCandle(i, items[i], parentQuote)
            this.drawVolume(i, items[i], parentQuote)
        }
        this.paintVolumeBorder()
    },
    paintVolumeBorder:function(){
        this.ctx.lineWidth = "1px";
        this.ctx.strokeStyle = "#efefef";
        this.ctx.strokeRect(this.options.volume.x, this.options.volume.y, this.options.volume.width, this.options.volume.height);
    },
    drawVolume:function(i,ki,parentQuote){
        var color;
        var lineX = parentQuote.getX(i)
        var topY = parentQuote.getVolumeY(ki[5]);
        var topX = lineX - this.options.barWidth / 2;
        // var candleY, candleHeight;
        if (ki[4] > ki[1]) { //红线
            // candleY = parentQuote.getY(ki[4]);
            // candleHeight = parentQuote.getY(ki[1]) - candleY;
            color = this.options.riseColor;
        } else if (ki[4] < ki[1]) { //绿线
            // candleY = parentQuote.getY(ki[1]);
            // candleHeight = parentQuote.getY(ki[4]) - candleY;
            color = this.options.fallColor;
        } else { //白线
            // candleY = parentQuote.getY(ki[1]);
            // candleHeight = 1;
            color = '#fff';
        }
        this.ctx.fillStyle = color;
        // this.ctx.strokeStyle = color;

        this.ctx.beginPath();
        this.ctx.fillRect(topX, topY, this.options.barWidth, parentQuote.options.volume.y+parentQuote.options.volume.height-topY);
    },
    drawCandle: function(i, ki, parentQuote) {
        var color;
        var lineX = parentQuote.getX(i);
        if (this.currentX == 0) this.currentX = lineX;
        else {
            if (lineX - this.currentX < 1) return;
        }
        this.currentX = lineX;
        var topY = parentQuote.getY(ki[2]);
        var bottomY = parentQuote.getY(ki[3]);
        var candleX = lineX - this.options.barWidth / 2;
        var candleY, candleHeight;
        if (ki[4] > ki[1]) { //红线
            candleY = parentQuote.getY(ki[4]);
            candleHeight = parentQuote.getY(ki[1]) - candleY;
            color = this.options.riseColor;
        } else if (ki[4] < ki[1]) { //绿线
            candleY = parentQuote.getY(ki[1]);
            candleHeight = parentQuote.getY(ki[4]) - candleY;
            color = this.options.fallColor;
        } else { //白线
            candleY = parentQuote.getY(ki[1]);
            candleHeight = 1;
            color = '#fff';
        }
        this.ctx.fillStyle = color;
        // this.ctx.strokeStyle = color;
        //画线
        this.ctx.beginPath();
        this.ctx.moveTo(lineX, topY);
        this.ctx.lineTo(lineX, bottomY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.fillRect(candleX, candleY, this.options.barWidth, candleHeight);
    },
    paintTips: function(position, text) {
        this.paintVine(position.x, this.options.region.y, this.options.volume.y+this.options.volume.height-this.options.region.y)
        this.paintTipContent(580, text)
        this.paintPoint(position)
    },
    paintTipContent: function(width, text) {
        var options = this.options
        this.ctx.fillStyle = "#efefef"
        this.ctx.fillRect(options.region.width - width, 0, width, options.region.y)
        this.ctx.fillStyle = "red"
        this.ctx.fillText(text, options.region.width - width + 10, 20)
    },
    paintPoint:function(position){
        this.paintCicle(position,8,"rgba(72,118,255,0.7)")
        this.paintCicle(position,4,"white")
        this.paintCicle(position,3,"rgba(72,118,255,1)")
    },
    paintCicle: function(position,r,color) {
        var ctx = this.ctx;
        //画一个实心圆
        ctx.beginPath();
        ctx.arc(position.x,position.y, r, 0, 360, false);
        ctx.fillStyle = color; 
        ctx.fill(); //画实心圆
        ctx.closePath();
    },

}
