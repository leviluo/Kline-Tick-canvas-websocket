function Tips(tips,options){
	this.options = options
	this.tips = tips;
}

Tips.prototype={
	createTip:function(isImg){
		// var tips = document.getElementById('tips');
		console.log(this.tips.id)
		this.tips.style.position = "absolute";
		this.tips.style.marginTop = this.options.region.y+'px';

		if (!document.getElementById('tipVline'+this.tips.id)) {
			var vLine = document.createElement('div')
			vLine.id="tipVline"+this.tips.id
			vLine.style.width='1px';
			vLine.style.height=this.options.region.height + 'px';
			vLine.style.background="#ccc";
			vLine.style.position = "absolute"
		}else{
			var vLine = document.getElementById('tipVline'+this.tips.id)
		}
		
		this.vLine = vLine
		
		// if(isImg){
			if (!document.getElementById('tipImg'+this.tips.id)) {
				var img = document.createElement('img')
				img.setAttribute('src', './img/point.png')
				img.setAttribute('width', '16')
				img.setAttribute('height', '16')
				img.style.margin = "0 0 0 -7px"
				img.id = "tipImg"+this.tips.id
				vLine.appendChild(img)
			}else{
				var img = document.getElementById('tipImg'+this.tips.id)
			}
			this.img = img
		// }

		if (!document.getElementById('tipContent'+this.tips.id)) {
			var content = document.createElement('div');
			content.id = "tipContent"+this.tips.id
			content.style.width = this.options.contentWidth + "px";
			content.style.height = this.options.region.y+"px";
			content.style.lineHeight = this.options.region.y+"px";
			content.style.color = "red";
			content.style.textIndent = "5px";
			content.style.background="rgba(240,240,240,0.9)";
			content.style.position = "absolute"
			
			content.style.top = "-"+ this.options.region.y +'px'
		}else{
			var content = document.getElementById('tipContent'+this.tips.id)
		}
		content.style.left = this.options.region.width - this.options.contentWidth +'px'
		this.content = content
		this.tips.appendChild(vLine)
		this.tips.appendChild(content)
		this.tips.style.display = "block"
	},
	showTip:function(position,text){
		this.vLine.style.left = position.x + 'px'
		this.img.style.marginTop = position.y-7+ 'px'
		this.tips.style.display = "block"
		this.content.innerHTML = text;
	},
	hideTip:function(){
		// this.tips.style.display = "none"
		// console.log('hide')
	}
}