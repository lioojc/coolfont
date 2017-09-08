/**
 * canvas字体特效
 * @return {[type]} [description]
 */
var cool = (function() {
	var tx = 0; //距离canvas左上角 x轴距离
	var ty = 0; //距离canvas左上角 y轴距离
	var ctx;
	var particles = []; // 粒子
	var coolTop; // canvas距离页面顶部距离
	var coolLeft; // canvas距离页面左边距离
	var loadImagePromise;

	var dx;
	var dy;
	var distance;
	var density = 12; // 每隔几个像素生成一个点
	var range = 14; // 跟单条线的高度有关
	var speed = 50; // 跟文字3d的垂直连线高度有关，数值越大，高度越大
	var megane = 100; // 新生成的点跟原点距离
	var stroke_megane = 24; // 两个点之间能够连上线的最大距离，数值越大，连线越密

	// 默认配置
	var defaultConfig = {
		cW: null, // canvas的宽
		cH: null, // canvas的高
		cX: 0, // 背景图 绘制 位置
		cY: 0, // 背景图 绘制 位置
		imgW: null, // 背景图文字的宽
		imgH: null, // 背景图文字的高
		imgUrl: null,
		el: null,
		canvas: null
	};

	return {
		init: function(config) {
			var self = this;
			config = $.extend({}, defaultConfig, config);

			if (config.el) {
				coolTop = $(config.el).offset().top;
				coolLeft = $(config.el).offset().left
			}

			this.setdraw(config);

			$(window).on("resize", function() {
				if (config.el) {
					coolTop = $(config.el).offset().top;
					coolLeft = $(config.el).offset().left
				}
			});
			$(config.el).on("mousemove", function(e) {
				var px = e.pageX;
				var py = e.pageY;
				tx = px - coolLeft;
				ty = py - coolTop;
				self.draw(config);
			});
			$(config.el).on("mouseout", function() {
				self.resetDraw(config);
			});
		},
		setdraw: function(config) {
			var self = this;
			var canvas = config.canvas;
			var cW = config.cW;
			var cH = config.cH;
			var cX = config.cX;
			var cY = config.cY;
			var imgW = config.imgW;
			var imgH = config.imgH;

			ctx = canvas.getContext("2d");
			canvas.width = cW;
			canvas.height = cH;

			// 加载图片
			loadImagePromise = this.loadImage(config.imgUrl);
			loadImagePromise.then(function(image) {
				ctx.drawImage(image, 0, 0, imgW, imgH, cX, cY, cW, cH);
			}).then(function() {
				self.setParticles(config);
			});
		},
		loadImage: function(imgUrl) {
			var image = new Image();
			image.crossOrigin = "Anonymous";
			image.src = imgUrl;
			return new Promise(function(resolve, reject) {
				image.onload = function() {
					resolve(image);
				}
			});
		},
		setParticles: function(config) {
			var cW = config.cW;
			var cH = config.cH;
			var imageData;
			var data;
			var cur;

			imageData = ctx.getImageData(0, 0, cW, cH);
			data = imageData.data;

			for (var i = 0; i < cW; i += density) {
				for (var j = 0; j < cH; j += density) {
					cur = data[((i + (j * cW)) * 4) - 1];
					if (cur == 255) {
						particles.push({
							x: i,
							y: j,
							x0: i,
							y0: j
						})
					}
				}
			}
		},
		resetDraw: function(config) {
			var cW = config.cW;
			var cH = config.cH;
			var cX = config.cX;
			var cY = config.cY;
			var imgW = config.imgW;
			var imgH = config.imgH;

			loadImagePromise.then(function(image) {
				ctx.clearRect(0, 0, cW, cH);
				ctx.drawImage(image, 0, 0, imgW, imgH, cX, cY, cW, cH);
			});
		},
		draw: function(config) {
			var cW = config.cW;
			var cH = config.cH;
			var cX = config.cX;
			var cY = config.cY;
			var imgW = config.imgW;
			var imgH = config.imgH;

			loadImagePromise.then(function(image) {
				ctx.clearRect(0, 0, cW, cH);
				ctx.drawImage(image, 0, 0, imgW, imgH, cX, cY, cW, cH);

				//在源图像外设置目标图像，源图像外的目标图像被显示，源图像透明，即：
				//要绘制的图像透明，与它重合的之前绘制的图像被隐藏，它之外的显示，即：
				//跟随鼠标的区域透明且遮盖了之前绘制的图像
				// 这些值中的 "source" 一词，指的是将要绘制到画布上的颜色，而 "destination" 指的是画布上已经存在的颜色。默认值是 "source-over"。
				// 在已有内容和新图形不重叠的地方，已有内容保留。所有其他内容成为透明。
				ctx.globalCompositeOperation = "destination-out";

				for (var i = 0; i <= 10; i++) {
					var j = 1 - i / 10;
					var b = 80 + (i * 3);
					ctx.beginPath();
					ctx.fillStyle = "rgba(255,255,255," + j + ")";
					ctx.arc(tx, ty, b, 0, Math.PI * 2, true);
					ctx.closePath();
					ctx.fill();
				}

				//source-over: 在目标图像上显示源图像，目标图像绘制在前，源图像是要绘制的图像
				// 新图形绘制于已有图形的顶部。这是默认的行为。
				ctx.globalCompositeOperation = "source-over";

				for (var i = 0, len = particles.length; i < len; ++i) {
					var d = particles[i];
					dx = tx - d.x;
					dy = ty - d.y;
					distance = Math.sqrt(dx * dx + dy * dy);

					d.x = (d.x - (dx / distance) * (range / distance) * speed) - ((d.x - d.x0) / 2);
					d.y = (d.y - (dy / distance) * (range / distance) * speed) - ((d.y - d.y0) / 2);

					var o = d.x - tx;
					var m = d.y - ty;
					var q = Math.sqrt(Math.pow(o, 2) + Math.pow(m, 2));

					if (q < megane) {
						for (var e = 1; e < particles.length; e++) {
							var f = particles[e];
							var k = d.x - f.x0;
							var h = d.y - f.y0;
							var a = Math.sqrt(Math.pow(k, 2) + Math.pow(h, 2));
							if (a < stroke_megane) {
								ctx.beginPath();
								ctx.lineWidth = 0.7;
								ctx.strokeStyle = "rgba(255,255,255,1)";
								ctx.lineTo(d.x, d.y);
								ctx.lineTo(f.x, f.y);
								ctx.lineTo(d.x0, d.y0);
								ctx.lineTo(f.x0, f.y0);
								ctx.closePath();
								ctx.stroke();
							}
						}
					}
				}
			});
		}
	}
})();

var coolfont = function(config) {
	cool.init(config);
}