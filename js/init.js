function init(options) {
    this.options = options;
    this.loading = document.getElementById('loading')
    this.loading.style.top = '150px'
    this.initialWidth = this.setStyle('canvasKL');
    if (this.initialWidth < 400) {
        this.datalength = 120
    } else if (this.initialWidth < 800) {
        this.datalength = 200
    } else if (this.initialWidth < 1200) {
        this.datalength = 300
    } else {
        this.datalength = 400
    }

    this.config = {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
    }
    this.historyArray = {}
    this.lineType = {}
    this.painting = {}
    for (var key in options.items) {
        this.historyArray[key] = [];
        this.lineType[key] = options.items[key];
        this.painting[key] = null;
    }
}

init.prototype = {
    initWs: function() {
        this.lastData = [];

        if (this.options.websocketUrl) this.ws = new WebSocket(this.options.websocketUrl)
        var ws = this.ws;
        var that = this;

        ws.onopen = function() {
            console.log('startWebsocket')
        };

        ws.onerror = function(error) {
            console.log(error);
        };

        ws.onmessage = function(e) {
            var data = JSON.parse(e.data);
            if (data['0'] == 'MD') {
                if (isEmpty(data) || data['1'] != that.contract || that.lastData[1] == data['2']) {
                    return;
                }

                var sss = [];
                sss[0] = parseInt(data['9']) * 1000;
                sss[1] = parseFloat(data['2']);
                that.lastData = [sss[0], sss[1]];

                that.historyArray['canvas'].pop();
                that.historyArray['canvas'].push(sss);
                that.configTick('canvas');

                that.updateLastPoint(sss[1], 'canvasKL');
                that.updateLastPoint(sss[1], 'canvas5KL');
                that.updateLastPoint(sss[1], 'canvas15KL');

            } else if (data['0'] == 'KLINE') {

                if (data['8'] == '60') {
                    var historyKlineData = that.historyArray['canvasKL']
                    var id = 'canvasKL'
                } else if (data['8'] == '300') {
                    var historyKlineData = that.historyArray['canvas5KL']
                    var id = 'canvas5KL'
                } else if (data['8'] == '900') {
                    var historyKlineData = that.historyArray['canvas15KL']
                    var id = 'canvas15KL'
                } else {
                    return
                }

                if (historyKlineData.length == 0) {
                    return
                }

                if (historyKlineData[historyKlineData.length - 1][0] > data['6'] * 1000 || data['1'] != that.contract) {
                    return;
                }

                var sss = [];
                sss[0] = parseInt(data['6']) * 1000;
                sss[1] = parseFloat(data['2']);
                sss[2] = parseFloat(data['4']);
                sss[3] = parseFloat(data['5']);
                sss[4] = parseFloat(data['3']);
                sss[5] = parseFloat(data['9']);

                historyKlineData.pop();
                historyKlineData.push(sss)
                historyKlineData.push([sss[0] + data['8'] * 1000, sss[1], sss[2], sss[3], sss[4],sss[5]]);

                // that.configKline(id, true);
                that.painting[id].addNewData(that.historyArray[id]);
                if (data['8'] == '60') {
                    that.historyArray['canvas'].pop();
                    that.historyArray['canvas'].push([sss[0], sss[4]])
                    that.historyArray['canvas'].push([sss[0] + 1, sss[4]])
                    that.configTick('canvas');
                }
            };
        };
    },
    updateLastPoint: function(price, type) {
        if (this.historyArray[type].length == 0) return
        var lastPoint = this.historyArray[type][this.historyArray[type].length - 1];
        var time = lastPoint[0];
        var open = lastPoint[1];
        var high = Math.max(price, lastPoint[2]);
        var low = Math.min(price, lastPoint[3]);
        var close = price;
        this.historyArray[type][this.historyArray[type].length - 1] = [time, open, high, low, close,0];
        // this.configKline(type);
        // console.log(type)
        this.painting[type].updateLastPoint(this.historyArray[type])
    },
    wsDisconnect: function() {
        if (this.ws == null) console.log('already disconnected');
        this.ws.close();
    },
    setStyle: function(type) {
        var canvasklineN = document.getElementsByClassName('kline');
        initialWidth = canvasklineN[0].parentNode.offsetWidth;
        var canvas = document.getElementById(type);
        canvas.setAttribute("width", initialWidth);
        this.loading.style.left = (initialWidth - 64) / 2 + 'px'
        return initialWidth
    },
    run: function(target) {
        if (target.contract) this.contract = target.contract;
        if (target.type) this.type = target.type;
        this.loading.style.display = 'block'
        document.getElementById(this.type).getContext('2d').clearRect(0, 0, this.initialWidth, 300); //清除画布
        this.config.body = "contract=K" + this.lineType[this.type] + "_" + this.contract
        ajax({
            url: this.options.url + "/url/futuresapi/getLastKline", //请求地址        
            type: "POST", //请求方式        
            data: { contract: "K" + this.lineType[this.type] + "_" + this.contract }, //请求参数        
            success: function(response, xml) {
                var str = JSON.parse(JSON.parse(response)[0])
                fetchHistoryKline(str['7'])
            },
            fail: function(status) {
                console.log('请求最新数据失败', status)
            }
        });

        var me = this;

        function fetchHistoryKline(time) {
            ajax({
                url: me.options.url + "/url/futuresapi/getHistoryKline", //请求地址        
                type: "POST", //请求方式        
                data: {
                    contract: "K" + me.lineType[me.type] + "_" + me.contract,
                    timestamp: time,
                    datalength: me.datalength,
                    directive: 0
                },
                success: function(response, xml) {
                    me.klineInit(JSON.parse(response))
                },
                fail: function(status) {
                    console.log('请求历史数据失败', status)
                }
            });
        }
    },

    addOldData: function(timestamp) {
        var time = timestamp / 1000
        this.loading.style.display = 'block'
        var me = this
        ajax({
            url: me.options.url + "/url/futuresapi/getHistoryKline", //请求地址        
            type: "POST", //请求方式        
            data: {
                contract: "K" + me.lineType[me.type] + "_" + me.contract,
                timestamp: time,
                datalength: me.datalength,
                directive: 0
            },
            success: function(response, xml) {
                me.klineAddData(JSON.parse(response))
            },
            fail: function(status) {
                console.log('请求历史数据失败', status)
            }
        });
        // this.config.body = `contract=K${this.lineType[this.type]}_${this.contract}&timestamp=${time}&datalength=${this.datalength}&directive=0`
        // fetch(this.options.url + "/url/futuresapi/getHistoryKline", this.config)
        //         .then(response => response.json())
        //         .then(data => { this.klineAddData(data) })
    },
    showTips: function() {
        var element = document.getElementById('result')
        element.innerHTML = '没有获取历史k线数据';
        setTimeout(function() {
            element.innerHTML = "";
        }, 2000)
    },
    klineAddData: function(data) {
        this.loading.style.display = 'none'

        if (isEmpty(data) || !data) {
            this.showTips();
            return;
        };

        var items = [];
        for (var i = 0; i < data.length; i++) {
            var str = JSON.parse(data[i]);
            items.push([str['6'] * 1000, str['2'], str['4'], str['5'], str['3']])
        };
        // console.log(items)

        this.historyArray[this.type] = items.reverse().concat(this.historyArray[this.type])
        this.painting[this.type].addNewData(this.historyArray[this.type]);
        // this.painting[this.type].paint(this.historyArray[this.type], null, true)
    },
    klineInit: function(data) {
        this.loading.style.display = 'none'
        if (isEmpty(data) || !data) {
            this.showTips();
            return;
        };

        this.historyArray[this.type] = [];

        if (this.type == 'canvasKL') {
            this.historyArray['canvas'] = [];
        }

        // 拿到历史行情
        for (var i = 0; i < data.length; i++) {
            var str = JSON.parse(data[i]);
            this.historyArray[this.type].push([str['6'] * 1000, str['2'], str['4'], str['5'], str['3'], str['8']])
            if (this.type == 'canvasKL') {
                this.historyArray['canvas'].unshift([str['6'] * 1000, str['3']])
            }
        };

        // if (directive == 0) {
        this.historyArray[this.type].reverse();
        // };

        //画一个空白点
        var lastPoint = this.historyArray[this.type][this.historyArray[this.type].length - 1];
        this.historyArray[this.type].push([lastPoint[0] + this.lineType[this.type] * 1000, lastPoint[4], lastPoint[4], lastPoint[4], lastPoint[4],0]);

        this.configKline();

        if (this.type == 'canvasKL') {
            lastPoint = this.historyArray['canvas'][this.historyArray['canvas'].length - 1];
            this.historyArray['canvas'].push([lastPoint[0] + 1, lastPoint[1]])
            this.configTick('canvas');
        }

        var me = this


        if (!this.ws.readyState) {
            var setin = setInterval(function() {
                if (me.ws.readyState) {
                    clearInterval(setin)
                    me.ws.send('1:' + me.contract);
                    me.ws.send('3:' + me.contract);
                };
            }, 10)
        } else {
            this.ws.send('1:' + this.contract);
            this.ws.send('3:' + this.contract);
        }
        // })
    },

    configKline: function(type) { //在更新最新点时，实际上时没有切换视图，updateLastPoint需要传入type,而不是默认的type
        var initialWidth = this.setStyle(type || this.type)
        if (!this.painting[type || this.type]) {
            this.painting[type || this.type] = new initKlineCanvas({
                Hline: {
                    color: "#ccc",
                    lineStyle: "dashed",
                    lineWidth: "1px",
                    region: {
                        x: 0,
                        y: 280
                    }
                },
                leftPrice: {
                    font: '1em Helvetica',
                    color: 'yellow',
                    backgroundWidth: 80,
                    backgroundheight: 270,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    region: {
                        x: 4.5,
                    }
                },
                riseColor: 'red',
                fallColor: 'green',
                region: { x: 0, y: 30, width: initialWidth, height: 240 }, //主绘图区域
                barWidth: 4,
                spaceWidth: 2,
                horizontalLineCount: 7,
                // lineWidth: 1,
                MAs: [
                    { color: 'rgb(255,0,255)', daysCount: 5 },
                    { color: 'rgb(255,165,0)', daysCount: 10 },
                    { color: 'rgb(30,144,255)', daysCount: 20 }
                ],
                volume:{
                    x:0,
                    y:300,
                    height:80,
                    width:initialWidth
                },
                xAxis: {
                    font: '1em Helvetica', //
                    color: 'yellow',
                    width: 90,
                    region: {
                        x: 4.5,
                        y: 290,
                    },
                },
            }, type || this.type, this);
        };
        this.painting[type || this.type].updateContract(this.historyArray[this.type])
    },
    configTick: function(type) {
        var initialWidth = this.setStyle(type || this.type)
        // console.log(this.painting[type])
        if (!this.painting[type]) {
            this.painting[type] = new initTickCanvas({
                horizontalLineCount: 7,
                Hline: {
                    color: "#ccc",
                    lineStyle: "dashed",
                    lineWidth: "1px",
                    region: {
                        x: 0,
                        y: 280
                    }
                },
                leftPrice: {
                    font: '1em Helvetica',
                    color: 'yellow',
                    backgroundWidth: 80,
                    backgroundheight: 270,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    region: {
                        x: 4.5,
                    }
                },
                region: { x: 0.5, y: 30, width: initialWidth, height: 240 },
                xAxis: {
                    font: '1em Helvetica', //
                    color: 'yellow',
                    width: 90,
                    region: {
                        x: 4.5,
                        y: 290,
                    },
                }
            }, type);
        }
        this.painting[type].paint(this.historyArray[type])
    },
    changeLine: function(type) {
        var e = event || window.event
        var items = document.getElementsByClassName('btn');
        var itemsK = document.getElementsByClassName('kline');

        for (var i = 0; i < items.length; i++) {
            items[i].style.background = '#efefef';
            items[i].style.color = 'red'
        };

        e.srcElement.style.background = '#666'
        e.srcElement.style.color = '#fff'

        for (var i = 0; i < itemsK.length; i++) {
            itemsK[i].style.display = 'none'
        };

        document.getElementById(type).parentNode.style.display = 'block'

        if (type == 'canvas') {
            return
        }

        // if(this.painting[type] instanceof initKlineCanvas || type == this.type)return;

        this.run({ type: type })
    },
    changeContract: function(contract) {
        this.ws.send('2:' + this.contract);
        this.ws.send('4:' + this.contract);
        this.run({ contract: contract })
    },
    resizeCanvas: function() {
        var initialWidth = this.setStyle(this.type)
        if (this.historyArray['canvas'].length != 0) {
            this.painting['canvas'].reSize(initialWidth);
        }

        if (this.historyArray['canvasKL'].length != 0) {
            this.painting['canvasKL'].reSize(initialWidth)
        }

        if (this.historyArray['canvas5KL'].length != 0) {
            this.painting('canvas5KL').reSize(initialWidth);
        }

        if (this.historyArray['canvas15KL'].length != 0) {
            this.painting('canvas15KL').reSize(initialWidth);
        }
    }
}

var initial;

initial = new init({ //配置
    url: "http://139.196.25.153:50001",
    websocketUrl: "ws://" + "md03.qizcloud.com:12301",
    account: "123",
    password: "456",
    items: {
        "canvas": "MD",
        "canvasKL": "60",
        "canvas5KL": "300",
        "canvas15KL": "900"
    }
});

initial.initWs(); //初始化websocket

initial.run({ //初始化画图
    type: "canvasKL",
    contract: "CL1702"
});

function changeContract() { //切换合约
    initial.changeContract("6B1612")
}

function changeContract1() { //切换合约
    initial.changeContract("CL1702")
}

function changeLine(type) { //切换视图
    initial.changeLine(type)
}

window.addEventListener("resize", resizeCanvas, false);

function resizeCanvas() {
    initial.resizeCanvas()
}
