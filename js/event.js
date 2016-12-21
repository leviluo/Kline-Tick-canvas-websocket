function Evts(canvasId, eventContrls) {
    this.eventContrls = eventContrls
    this.element = document.getElementById(canvasId);
}
Evts.prototype = {
    addKlineEvent: function() {
        var canvasId = this.canvasId
        var eventContrls = this.eventContrls
        // this.element.addEventListener("mousedown",function(e) {
        //         eventContrls.onStart(e)
        //     }, false)
        addEvent(this.element,"mousedown",function(e) {
                eventContrls.onStart(e)
            },false)
        addEvent(this.element,"mousemove",function(e) {
                eventContrls.onMove(e)
            },false)
        addEvent(this.element,"mouseout",function(e) {
                eventContrls.onEnd(e)
            },false)
        addEvent(this.element,"mouseup",function(e) {
                eventContrls.onEnd(e)
            },false)
    },
    addTickEvent:function(){
        var canvasId = this.canvasId
        var eventContrls = this.eventContrls
        this.element.addEventListener("mousemove", function(e) {
                eventContrls.moveIn(e)
            }, false)
        this.element.addEventListener("mouseout", function(e) {
                eventContrls.moveOut(e)
            }, false)
    }
}
