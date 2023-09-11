// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function f(){ log.history = log.history || []; log.history.push(arguments); if(this.console) { var args = arguments, newarr; args.callee = args.callee.caller; newarr = [].slice.call(args); if (typeof console.log === 'object') log.apply.call(console.log, console, newarr); else console.log.apply(console, newarr);}};

// make it safe to use console.log always
(function(a){function b(){}for(var c="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),d;!!(d=c.pop());){a[d]=a[d]||b;}})
(function(){try{console.log();return window.console;}catch(a){return (window.console={});}}());


// place any jQuery/helper plugins in here, instead of separate, slower script files.

/**
 * Copyright (c) 2007-2012 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Dual licensed under MIT and GPL.
 * @author Ariel Flesler
 * @version 1.4.3.1
 */
;(function($){var h=$.scrollTo=function(a,b,c){$(window).scrollTo(a,b,c)};h.defaults={axis:'xy',duration:parseFloat($.fn.jquery)>=1.3?0:1,limit:true};h.window=function(a){return $(window)._scrollable()};$.fn._scrollable=function(){return this.map(function(){var a=this,isWin=!a.nodeName||$.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!isWin)return a;var b=(a.contentWindow||a).document||a.ownerDocument||a;return/webkit/i.test(navigator.userAgent)||b.compatMode=='BackCompat'?b.body:b.documentElement})};$.fn.scrollTo=function(e,f,g){if(typeof f=='object'){g=f;f=0}if(typeof g=='function')g={onAfter:g};if(e=='max')e=9e9;g=$.extend({},h.defaults,g);f=f||g.duration;g.queue=g.queue&&g.axis.length>1;if(g.queue)f/=2;g.offset=both(g.offset);g.over=both(g.over);return this._scrollable().each(function(){if(e==null)return;var d=this,$elem=$(d),targ=e,toff,attr={},win=$elem.is('html,body');switch(typeof targ){case'number':case'string':if(/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(targ)){targ=both(targ);break}targ=$(targ,this);if(!targ.length)return;case'object':if(targ.is||targ.style)toff=(targ=$(targ)).offset()}$.each(g.axis.split(''),function(i,a){var b=a=='x'?'Left':'Top',pos=b.toLowerCase(),key='scroll'+b,old=d[key],max=h.max(d,a);if(toff){attr[key]=toff[pos]+(win?0:old-$elem.offset()[pos]);if(g.margin){attr[key]-=parseInt(targ.css('margin'+b))||0;attr[key]-=parseInt(targ.css('border'+b+'Width'))||0}attr[key]+=g.offset[pos]||0;if(g.over[pos])attr[key]+=targ[a=='x'?'width':'height']()*g.over[pos]}else{var c=targ[pos];attr[key]=c.slice&&c.slice(-1)=='%'?parseFloat(c)/100*max:c}if(g.limit&&/^\d+$/.test(attr[key]))attr[key]=attr[key]<=0?0:Math.min(attr[key],max);if(!i&&g.queue){if(old!=attr[key])animate(g.onAfterFirst);delete attr[key]}});animate(g.onAfter);function animate(a){$elem.animate(attr,f,g.easing,a&&function(){a.call(this,e,g)})}}).end()};h.max=function(a,b){var c=b=='x'?'Width':'Height',scroll='scroll'+c;if(!$(a).is('html,body'))return a[scroll]-$(a)[c.toLowerCase()]();var d='client'+c,html=a.ownerDocument.documentElement,body=a.ownerDocument.body;return Math.max(html[scroll],body[scroll])-Math.min(html[d],body[d])};function both(a){return typeof a=='object'?a:{top:a,left:a}}})(jQuery);









/* :after and :before fix for IE7 */
$(window).load(function(){
(function($){
	var patterns = {
		text: /^['"]?(.+?)["']?$/,
		url: /^url\(["']?(.+?)['"]?\)$/
	};
	function clean(content) {
		if(content && content.length) {
			var text = content.match(patterns.text)[1],
				url = text.match(patterns.url);
			return url ? '<img src="' + url[1] + '" />': text;
		}
	}
	function inject(prop, elem, content) {
		if(prop != 'after' && prop != 'before') return;
		if(content = clean(elem.currentStyle[prop])) {
			$(elem)[prop == 'before' ? 'prepend' : 'append'](
				$(document.createElement('span')).addClass(prop).html(content)
			);
		}
	}
	$.pseudo = function(elem) {
		inject('before', elem);
		inject('after', elem);
		elem.runtimeStyle.behavior = null;
	};
	if(document.createStyleSheet) {
		var o = document.createStyleSheet(null, 0);
		o.addRule('.dummy','display: static;');
		o.cssText = 'html, head, head *, body, *.before, *.after, *.before *, *.after * { behavior: none; } * { behavior: expression($.pseudo(this)); }';
	}
})(jQuery);
});

(function($) { //create closure
$.fn.fileupload = function(options){
	this.each(function(){
	        var fileInput = $(this).get(0);
	        var fileName = $(this).siblings('.cf_file_progress').get(0);
		fileInput.value = '';
		fileInput.onchange = HandleChanges;
		var accept = fileInput.accept.split(',');
		function HandleChanges() {
			file = fileInput.value;
			reWin = /.*\\(.*)/;
			var fileTitle = file.replace(reWin, "$1"); //выдираем название файла
			reUnix = /.*\/(.*)/;
			fileTitle = fileTitle.replace(reUnix, "$1"); //выдираем название файла
			fileName.innerHTML = fileTitle;
			var RegExExt =/.*\.(.*)/;
			var ext = fileTitle.replace(RegExExt, "$1");//и его расширение
			if (accept.indexOf('.'+ext.toLowerCase()) < 0) {
				fileInput.value = '';
				$(fileName).addClass('error').text('Недопустимый формат файла');
				window.setTimeout(function(){
					$(fileName).removeClass('error').text('');
				},3000);
			}
		}
	});
}
//end of closure
})(jQuery);



(function($) { //create closure
	$.fn.formValidator = function(options) {
		var defaults = {
		};
		var errors = 0; var msg='';
		this.each(function() {
			var o = $.extend(defaults, options), form = $(this), inputs = $(':input', form), il = inputs.length;
			inputs.removeClass('error').each(function(){
				var inp = $(this), par = inp.parents('.fieldrow'), val = inp.val(); gr = inp.data('group');
				inp.parent().removeClass('error'); 
//				inp.removeClass('error');
				par.find('em.error').css('display', 'none');
				if (inp.data('validate') || inp.data('required')) {
					if (inp.data('required') && inp.val() == '') { 
						inp.addClass('error'); 
						inp.parent().addClass('error'); 
						par.find('.error.required').css('display', 'block');
					} else {
						if (gr) {
							var brothers = inputs.filter('[data-group="' + gr + '"]'),
								vals = false;
							brothers.each(function() {
								var elval = $(this).is('[type="checkbox"]') ? $(this)[0].checked : $(this).val();
								if (elval) {
									vals = true;
								}
							});
							if (vals) {
								brothers
									.removeClass('error')
									.closest('div.fieldrow')
									.find('.error.group').hide();
							} else {
								brothers
									.addClass('error')
									.closest('div.fieldrow')
									.find('.error.group').show();
							}
						}
						switch(inp.data('validate')) {
							case 'number':
								if (val != '') {
									var validchars="-+0123456789. ";
									for (var i=val.length-1; i>=0; i--) {
										var x = new String(val.charAt(i));
										var checker = validchars.lastIndexOf(x) > -1;
										if (!checker) {
											inp.addClass('error');
											inp.parent().addClass('error'); 
											par.find('.error.validate').css('display', 'block');
											break;
										};
									}
								}
							break;
							case 'password':
							if (val != '') {
								if (val.length < 6) {
									inp.addClass('error'); 
									par.find('.error.validate').css('display', 'block');
								}
							}
							break;
							case 'email':
								if (val != '') {
									if (!(/^([a-z0-9_\-]+\.)*[a-z0-9_\-]+@([a-z0-9][a-z0-9\-]*[a-z0-9]\.)+[a-z]{2,4}$/i).test(val)) {
										inp.addClass('error');
										inp.parent().addClass('error');
										par.find('.error.validate').css('display', 'block');
									}
								}
							break;
							default:
							break;
						}
						if   (inp.data('minlength')) {
							if (val != '') {
								if (val.length < inp.data('minlength')*1) {
									inp.removeClass('ok'); 
									inp.parent().addClass('error'); 
									inp.addClass('error'); 
									par.find('.error.minlength').css('display', 'block');
								}
								else {
									inp.removeClass('error'); 
									par.addClass('ok'); 
								}
							}
						}

						if (inp.data('identity')) {
							var idsel = $(inp.data('identity'));
							if (idsel.length < 1) alert('Ссылка на неверный селектор в поле '+inp.attr('name'));
							if (val != '' && idsel.val() != '' && val != idsel.val()) {
								inp.addClass('error');
								inp.parent().addClass('error');
								par.find('.error.identity').css('display', 'block');
							}
						}
					}
				} else {
				}
			});
			form.data('valid', $(':input.error', form).length == 0);
		});
	}
})(jQuery);


function passwordSwitcher() {
					$('.switch-password')
						.off('click.switchPass')
						.on('click.switchPass', function() {
							var el = $(this);
							var inpPass = $(this).parent().find('input');
							if (el.hasClass('visible')) {
								el.removeClass('visible');
								inpPass.attr('type', 'text');
							} else {
								el.addClass('visible');
								inpPass.attr('type', 'password');
							}
						});
				};

/*
 * jQuery Easing Compatibility v1 - http://gsgd.co.uk/sandbox/jquery.easing.php
 *
 * Adds compatibility for applications that use the pre 1.2 easing names
 *
 * Copyright (c) 2007 George Smith
 * Licensed under the MIT License:
 *   http://www.opensource.org/licenses/mit-license.php
 */

jQuery.extend( jQuery.easing,
{
	easeIn: function (x, t, b, c, d) {
		return jQuery.easing.easeInQuad(x, t, b, c, d);
	},
	easeOut: function (x, t, b, c, d) {
		return jQuery.easing.easeOutQuad(x, t, b, c, d);
	},
	easeInOut: function (x, t, b, c, d) {
		return jQuery.easing.easeInOutQuad(x, t, b, c, d);
	},
	expoin: function(x, t, b, c, d) {
		return jQuery.easing.easeInExpo(x, t, b, c, d);
	},
	expoout: function(x, t, b, c, d) {
		return jQuery.easing.easeOutExpo(x, t, b, c, d);
	},
	expoinout: function(x, t, b, c, d) {
		return jQuery.easing.easeInOutExpo(x, t, b, c, d);
	},
	bouncein: function(x, t, b, c, d) {
		return jQuery.easing.easeInBounce(x, t, b, c, d);
	},
	bounceout: function(x, t, b, c, d) {
		return jQuery.easing.easeOutBounce(x, t, b, c, d);
	},
	bounceinout: function(x, t, b, c, d) {
		return jQuery.easing.easeInOutBounce(x, t, b, c, d);
	},
	elasin: function(x, t, b, c, d) {
		return jQuery.easing.easeInElastic(x, t, b, c, d);
	},
	elasout: function(x, t, b, c, d) {
		return jQuery.easing.easeOutElastic(x, t, b, c, d);
	},
	elasinout: function(x, t, b, c, d) {
		return jQuery.easing.easeInOutElastic(x, t, b, c, d);
	},
	backin: function(x, t, b, c, d) {
		return jQuery.easing.easeInBack(x, t, b, c, d);
	},
	backout: function(x, t, b, c, d) {
		return jQuery.easing.easeOutBack(x, t, b, c, d);
	},
	backinout: function(x, t, b, c, d) {
		return jQuery.easing.easeInOutBack(x, t, b, c, d);
	}
});

// REPLACE CHECKBOXES
(function($) { //create closure
$.fn.replaceCheckBox = function(options){
	this.each(function(){
		var inp = $(this), label = $('label[for='+inp.attr('id')+']');
		if (inp.hasClass('custom')) return false;
		inp.wrap('<span class="field checkbox" />').wrap('<span />');
		var par = inp.parents('span.checkbox:eq(0)');
		if (inp.prop('checked')) {
			par.addClass('checked');
		}
		par.on('click', function(){
			if (inp.attr('disabled')) return false;
			inp.trigger('change');
		});
		inp.on('change',function(){
			if (inp.attr('disabled')) return false;
			if (!inp.prop('checked')) {
				par.addClass('checked');
				inp.prop('checked',true);
			} else {
				par.removeClass('checked');
				inp.prop('checked', false);
			}
		});
	});
}
//end of closure
})(jQuery);


(function($) { //create closure
$.fn.selectReplace = function(options){
	this.each(function(){
        var field = $(this), selblock = $("<span class=\"inpselblock\"></span>"), seltxt = $("<span class=\"inpseltxt\"></span>"), w = field.width();
	if (field.hasClass('custom')) return false;
	//if (!field.hasClass('floatwidth')) { selblock.width(w); }
	selblock.parent().width(w);
	field.wrap(selblock);
	seltxt.insertBefore(field);
	seltxt.text($("option:selected",field).text());
	var selopener = $("<a class=\"selopener\" href=\"#\"></a>").insertBefore(seltxt);
	var optcontainer = $("<div class=\"optcontainer"+((field.hasClass('round'))? ' round':'')+"\" id=\""+field.attr("name")+"opts\"></div>").appendTo("body");
	optcontainer.css('min-width',w).hide(function(){
		$(this).addClass("hide");
	});
	$("option",field).each(function(k){
		var opt = $(this);
		var aopt = $("<a href=\"#\" title=\""+opt.text()+"\">"+opt.text()+"</a>").appendTo(optcontainer);
		aopt.click(function(){
			field.get(0).selectedIndex = k;
			seltxt.text($("option:eq("+k+")",field).text());
			optcontainer.find('.selected').removeClass('selected');
			$(this).addClass('selected');
			optcontainer.slideUp("fast",function() {
				$(this).addClass("hide");
				selopener.removeClass('open');
			});
			field.change();
			return false;
		});
		if (opt.prop('selected')) aopt.addClass('selected');
	});
	selopener.click(function(){
		$('.inpselblock').removeClass('open');
		$("div.optcontainer").slideUp("fast",function() {
			$(this).addClass("hide");
		});
		if (optcontainer.hasClass("hide")) {
			var pos = $(seltxt).offset(), zi = 0;
			optcontainer.removeClass("hide");
			optcontainer.css({left: pos.left+"px", top: pos.top-1 + "px", 'min-width': field.outerWidth()+15});
			optcontainer.slideDown("fast", function(){
				$(document).on("click",function(e) {
					if (e.pageX < pos.left 
						|| e.pageX > (pos.left + optcontainer.width()) 
						|| e.pageY < (pos.top) 
						|| e.pageY > (pos.top + optcontainer.height())) {
						optcontainer.slideUp("fast",function() {
							$(this).addClass("hide");
							selopener.removeClass('open');
						});
					} 
				});
				selopener.addClass('open');
			});

			optcontainer.siblings().each(function(){
				var nzi = parseInt($(this).css('z-index'));
				zi = Math.max(zi, (!isNaN(nzi)) ? nzi: 0);
			});
			optcontainer.css({'z-index':zi+1});


		} else {
			optcontainer.slideUp("fast",function() {
				$(this).addClass("hide");
				selopener.removeClass('open');
			});
		}
		return false;
	});
	field.addClass('custom');
	});
}
//end of closure
})(jQuery);


(function($) { //create closure
$.fn.radioReplace = function(options){
	this.each(function(){
		var inp = $(this), label = $('label[for='+inp.attr('id')+']'), form = $(this.form), n = inp.attr('name');
		if (inp.hasClass('custom')) return false;
		inp.wrap('<span class="field radio" />').wrap('<span />');
		var par = inp.parents('span.radio:eq(0)');
		if (inp.prop('checked')) {
			par.addClass('checked');
		}
		inp.change(function(){
			if ($(this).attr('disabled')) return false;
			var n = $(this).attr('name');
			$('input[name="'+n+'"]',form).each(function(){
				var i = $(this), p = i.parents('span.radio:eq(0)'); 
				if (i.prop('checked')) {
					p.addClass('checked');
				} else {
					p.removeClass('checked');
				}
			});
		});
	});
}
//end of closure
})(jQuery);


// version 1.6.0
// http://welcome.totheinter.net/columnizer-jquery-plugin/
// created by: Adam Wulf @adamwulf, adam.wulf@gmail.com
(function($){$.fn.columnize=function(options){var defaults={width:400,columns:false,buildOnce:false,overflow:false,doneFunc:function(){},target:false,ignoreImageLoading:true,columnFloat:"left",lastNeverTallest:false,accuracy:false,manualBreaks:false,cssClassPrefix:""};options=$.extend(defaults,options);if(typeof(options.width)=="string"){options.width=parseInt(options.width,10);if(isNaN(options.width)){options.width=defaults.width;}}
return this.each(function(){var $inBox=options.target?$(options.target):$(this);var maxHeight=$(this).height();var $cache=$('<div></div>');var lastWidth=0;var columnizing=false;var manualBreaks=options.manualBreaks;var cssClassPrefix=defaults.cssClassPrefix;if(typeof(options.cssClassPrefix)=="string"){cssClassPrefix=options.cssClassPrefix;}
var adjustment=0;$cache.append($(this).contents().clone(true));if(!options.ignoreImageLoading&&!options.target){if(!$inBox.data("imageLoaded")){$inBox.data("imageLoaded",true);if($(this).find("img").length>0){var func=function($inBox,$cache){return function(){if(!$inBox.data("firstImageLoaded")){$inBox.data("firstImageLoaded","true");$inBox.empty().append($cache.children().clone(true));$inBox.columnize(options);}};}($(this),$cache);$(this).find("img").one("load",func);$(this).find("img").one("abort",func);return;}}}
$inBox.empty();columnizeIt();if(!options.buildOnce){$(window).resize(function(){if(!options.buildOnce){if($inBox.data("timeout")){clearTimeout($inBox.data("timeout"));}
$inBox.data("timeout",setTimeout(columnizeIt,200));}});}
function prefixTheClassName(className,withDot){var dot=withDot?".":"";if(cssClassPrefix.length){return dot+cssClassPrefix+"-"+className;}
return dot+className;}
function columnize($putInHere,$pullOutHere,$parentColumn,targetHeight){while((manualBreaks||$parentColumn.height()<targetHeight)&&$pullOutHere[0].childNodes.length){var node=$pullOutHere[0].childNodes[0];if($(node).find(prefixTheClassName("columnbreak",true)).length){return;}
if($(node).hasClass(prefixTheClassName("columnbreak"))){return;}
$putInHere.append(node);}
if($putInHere[0].childNodes.length===0)return;var kids=$putInHere[0].childNodes;var lastKid=kids[kids.length-1];$putInHere[0].removeChild(lastKid);var $item=$(lastKid);if($item[0].nodeType==3){var oText=$item[0].nodeValue;var counter2=options.width/18;if(options.accuracy)
counter2=options.accuracy;var columnText;var latestTextNode=null;while($parentColumn.height()<targetHeight&&oText.length){var indexOfSpace=oText.indexOf(' ',counter2);if(indexOfSpace!=-1){columnText=oText.substring(0,oText.indexOf(' ',counter2));}else{columnText=oText;}
latestTextNode=document.createTextNode(columnText);$putInHere.append(latestTextNode);if(oText.length>counter2&&indexOfSpace!=-1){oText=oText.substring(indexOfSpace);}else{oText="";}}
if($parentColumn.height()>=targetHeight&&latestTextNode!==null){$putInHere[0].removeChild(latestTextNode);oText=latestTextNode.nodeValue+oText;}
if(oText.length){$item[0].nodeValue=oText;}else{return false;}}
if($pullOutHere.contents().length){$pullOutHere.prepend($item);}else{$pullOutHere.append($item);}
return $item[0].nodeType==3;}
function split($putInHere,$pullOutHere,$parentColumn,targetHeight){if($putInHere.contents(":last").find(prefixTheClassName("columnbreak",true)).length){return;}
if($putInHere.contents(":last").hasClass(prefixTheClassName("columnbreak"))){return;}
if($pullOutHere.contents().length){var $cloneMe=$pullOutHere.contents(":first");if($cloneMe.get(0).nodeType!=1)return;var $clone=$cloneMe.clone(true);if($cloneMe.hasClass(prefixTheClassName("columnbreak"))){$putInHere.append($clone);$cloneMe.remove();}else if(manualBreaks){$putInHere.append($clone);$cloneMe.remove();}else if($clone.get(0).nodeType==1&&!$clone.hasClass(prefixTheClassName("dontend"))){$putInHere.append($clone);if($clone.is("img")&&$parentColumn.height()<targetHeight+20){$cloneMe.remove();}else if(!$cloneMe.hasClass(prefixTheClassName("dontsplit"))&&$parentColumn.height()<targetHeight+20){$cloneMe.remove();}else if($clone.is("img")||$cloneMe.hasClass(prefixTheClassName("dontsplit"))){$clone.remove();}else{$clone.empty();if(!columnize($clone,$cloneMe,$parentColumn,targetHeight)){$cloneMe.addClass(prefixTheClassName("split"));if($cloneMe.children().length){split($clone,$cloneMe,$parentColumn,targetHeight);}}else{$cloneMe.addClass(prefixTheClassName("split"));}
if($clone.get(0).childNodes.length===0){$clone.remove();}}}}}
function singleColumnizeIt(){if($inBox.data("columnized")&&$inBox.children().length==1){return;}
$inBox.data("columnized",true);$inBox.data("columnizing",true);$inBox.empty();$inBox.append($("<div class='"
+prefixTheClassName("first")+" "
+prefixTheClassName("last")+" "
+prefixTheClassName("column")+" "
+"' style='width:100%; float: "+options.columnFloat+";'></div>"));$col=$inBox.children().eq($inBox.children().length-1);$destroyable=$cache.clone(true);if(options.overflow){targetHeight=options.overflow.height;columnize($col,$destroyable,$col,targetHeight);if(!$destroyable.contents().find(":first-child").hasClass(prefixTheClassName("dontend"))){split($col,$destroyable,$col,targetHeight);}
while($col.contents(":last").length&&checkDontEndColumn($col.contents(":last").get(0))){var $lastKid=$col.contents(":last");$lastKid.remove();$destroyable.prepend($lastKid);}
var html="";var div=document.createElement('DIV');while($destroyable[0].childNodes.length>0){var kid=$destroyable[0].childNodes[0];if(kid.attributes){for(var i=0;i<kid.attributes.length;i++){if(kid.attributes[i].nodeName.indexOf("jQuery")===0){kid.removeAttribute(kid.attributes[i].nodeName);}}}
div.innerHTML="";div.appendChild($destroyable[0].childNodes[0]);html+=div.innerHTML;}
var overflow=$(options.overflow.id)[0];overflow.innerHTML=html;}else{$col.append($destroyable);}
$inBox.data("columnizing",false);if(options.overflow&&options.overflow.doneFunc){options.overflow.doneFunc();}}
function checkDontEndColumn(dom){if(dom.nodeType==3){if(/^\s+$/.test(dom.nodeValue)){if(!dom.previousSibling)return false;return checkDontEndColumn(dom.previousSibling);}
return false;}
if(dom.nodeType!=1)return false;if($(dom).hasClass(prefixTheClassName("dontend")))return true;if(dom.childNodes.length===0)return false;return checkDontEndColumn(dom.childNodes[dom.childNodes.length-1]);}
function columnizeIt(){adjustment=0;if(lastWidth==$inBox.width())return;lastWidth=$inBox.width();var numCols=Math.round($inBox.width()/options.width);var optionWidth=options.width;var optionHeight=options.height;if(options.columns)numCols=options.columns;if(manualBreaks){numCols=$cache.find(prefixTheClassName("columnbreak",true)).length+1;optionWidth=false;}
if(numCols<=1){return singleColumnizeIt();}
if($inBox.data("columnizing"))return;$inBox.data("columnized",true);$inBox.data("columnizing",true);$inBox.empty();$inBox.append($("<div style='width:"+(Math.floor(100/numCols))+"%; float: "+options.columnFloat+";'></div>"));$col=$inBox.children(":last");$col.append($cache.clone());maxHeight=$col.height();$inBox.empty();var targetHeight=maxHeight/numCols;var firstTime=true;var maxLoops=3;var scrollHorizontally=false;if(options.overflow){maxLoops=1;targetHeight=options.overflow.height;}else if(optionHeight&&optionWidth){maxLoops=1;targetHeight=optionHeight;scrollHorizontally=true;}
for(var loopCount=0;loopCount<maxLoops&&loopCount<20;loopCount++){$inBox.empty();var $destroyable,className,$col,$lastKid;try{$destroyable=$cache.clone(true);}catch(e){$destroyable=$cache.clone();}
$destroyable.css("visibility","hidden");for(var i=0;i<numCols;i++){className=(i===0)?prefixTheClassName("first"):"";className+=" "+prefixTheClassName("column");className=(i==numCols-1)?(prefixTheClassName("last")+" "+className):className;$inBox.append($("<div class='"+className+"' style='width:"+(Math.floor(100/numCols))+"%; float: "+options.columnFloat+";'></div>"));}
i=0;while(i<numCols-(options.overflow?0:1)||scrollHorizontally&&$destroyable.contents().length){if($inBox.children().length<=i){$inBox.append($("<div class='"+className+"' style='width:"+(Math.floor(100/numCols))+"%; float: "+options.columnFloat+";'></div>"));}
$col=$inBox.children().eq(i);if(scrollHorizontally){$col.width(optionWidth+"px");}
columnize($col,$destroyable,$col,targetHeight);split($col,$destroyable,$col,targetHeight);while($col.contents(":last").length&&checkDontEndColumn($col.contents(":last").get(0))){$lastKid=$col.contents(":last");$lastKid.remove();$destroyable.prepend($lastKid);}
i++;if($col.contents().length===0&&$destroyable.contents().length){$col.append($destroyable.contents(":first"));}else if(i==numCols-(options.overflow?0:1)&&!options.overflow){if($destroyable.find(prefixTheClassName("columnbreak",true)).length){numCols++;}}}
if(options.overflow&&!scrollHorizontally){var IE6=false;var IE7=(document.all)&&(navigator.appVersion.indexOf("MSIE 7.")!=-1);if(IE6||IE7){var html="";var div=document.createElement('DIV');while($destroyable[0].childNodes.length>0){var kid=$destroyable[0].childNodes[0];for(i=0;i<kid.attributes.length;i++){if(kid.attributes[i].nodeName.indexOf("jQuery")===0){kid.removeAttribute(kid.attributes[i].nodeName);}}
div.innerHTML="";div.appendChild($destroyable[0].childNodes[0]);html+=div.innerHTML;}
var overflow=$(options.overflow.id)[0];overflow.innerHTML=html;}else{$(options.overflow.id).empty().append($destroyable.contents().clone(true));}}else if(!scrollHorizontally){$col=$inBox.children().eq($inBox.children().length-1);$destroyable.contents().each(function(){$col.append($(this));});var afterH=$col.height();var diff=afterH-targetHeight;var totalH=0;var min=10000000;var max=0;var lastIsMax=false;var numberOfColumnsThatDontEndInAColumnBreak=0;$inBox.children().each(function($inBox){return function($item){var $col=$inBox.children().eq($item);var endsInBreak=$col.children(":last").find(prefixTheClassName("columnbreak",true)).length;if(!endsInBreak){var h=$col.height();lastIsMax=false;totalH+=h;if(h>max){max=h;lastIsMax=true;}
if(h<min)min=h;numberOfColumnsThatDontEndInAColumnBreak++;}};}($inBox));var avgH=totalH/numberOfColumnsThatDontEndInAColumnBreak;if(totalH===0){loopCount=maxLoops;}else if(options.lastNeverTallest&&lastIsMax){adjustment+=30;targetHeight=targetHeight+30;if(loopCount==maxLoops-1)maxLoops++;}else if(max-min>30){targetHeight=avgH+30;}else if(Math.abs(avgH-targetHeight)>20){targetHeight=avgH;}else{loopCount=maxLoops;}}else{$inBox.children().each(function(i){$col=$inBox.children().eq(i);$col.width(optionWidth+"px");if(i===0){$col.addClass(prefixTheClassName("first"));}else if(i==$inBox.children().length-1){$col.addClass(prefixTheClassName("last"));}else{$col.removeClass(prefixTheClassName("first"));$col.removeClass(prefixTheClassName("last"));}});$inBox.width($inBox.children().length*optionWidth+"px");}
$inBox.append($("<br style='clear:both;'>"));}
$inBox.find(prefixTheClassName("column",true)).find(":first"+prefixTheClassName("removeiffirst",true)).remove();$inBox.find(prefixTheClassName("column",true)).find(':last'+prefixTheClassName("removeiflast",true)).remove();$inBox.data("columnizing",false);if(options.overflow){options.overflow.doneFunc();}
options.doneFunc();}});};})(jQuery);


/*
 * jQuery UI Touch Punch 0.2.2
 *
 * Copyright 2011, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function(b){b.support.touch="ontouchend" in document;if(!b.support.touch){return;}var c=b.ui.mouse.prototype,e=c._mouseInit,a;function d(g,h){if(g.originalEvent.touches.length>1){return;}g.preventDefault();var i=g.originalEvent.changedTouches[0],f=document.createEvent("MouseEvents");f.initMouseEvent(h,true,true,window,1,i.screenX,i.screenY,i.clientX,i.clientY,false,false,false,false,0,null);g.target.dispatchEvent(f);}c._touchStart=function(g){var f=this;if(a||!f._mouseCapture(g.originalEvent.changedTouches[0])){return;}a=true;f._touchMoved=false;d(g,"mouseover");d(g,"mousemove");d(g,"mousedown");};c._touchMove=function(f){if(!a){return;}this._touchMoved=true;d(f,"mousemove");};c._touchEnd=function(f){if(!a){return;}d(f,"mouseup");d(f,"mouseout");if(!this._touchMoved){d(f,"click");}a=false;};c._mouseInit=function(){var f=this;f.element.bind("touchstart",b.proxy(f,"_touchStart")).bind("touchmove",b.proxy(f,"_touchMove")).bind("touchend",b.proxy(f,"_touchEnd"));e.call(f);};})(jQuery);



/*
 * jPlayer Plugin for jQuery JavaScript Library
 * http://www.jplayer.org
 *
 * Copyright (c) 2009 - 2013 Happyworm Ltd
 * Licensed under the MIT license.
 * http://opensource.org/licenses/MIT
 *
 * Author: Mark J Panaghiston
 * Version: 2.5.0
 * Date: 7th November 2013
 */

(function(b,f){"function"===typeof define&&define.amd?define(["jquery"],f):b.jQuery?f(b.jQuery):f(b.Zepto)})(this,function(b,f){b.fn.jPlayer=function(a){var c="string"===typeof a,d=Array.prototype.slice.call(arguments,1),e=this;a=!c&&d.length?b.extend.apply(null,[!0,a].concat(d)):a;if(c&&"_"===a.charAt(0))return e;c?this.each(function(){var c=b(this).data("jPlayer"),h=c&&b.isFunction(c[a])?c[a].apply(c,d):c;if(h!==c&&h!==f)return e=h,!1}):this.each(function(){var c=b(this).data("jPlayer");c?c.option(a||
{}):b(this).data("jPlayer",new b.jPlayer(a,this))});return e};b.jPlayer=function(a,c){if(arguments.length){this.element=b(c);this.options=b.extend(!0,{},this.options,a);var d=this;this.element.bind("remove.jPlayer",function(){d.destroy()});this._init()}};"function"!==typeof b.fn.stop&&(b.fn.stop=function(){});b.jPlayer.emulateMethods="load play pause";b.jPlayer.emulateStatus="src readyState networkState currentTime duration paused ended playbackRate";b.jPlayer.emulateOptions="muted volume";b.jPlayer.reservedEvent=
"ready flashreset resize repeat error warning";b.jPlayer.event={};b.each("ready flashreset resize repeat click error warning loadstart progress suspend abort emptied stalled play pause loadedmetadata loadeddata waiting playing canplay canplaythrough seeking seeked timeupdate ended ratechange durationchange volumechange".split(" "),function(){b.jPlayer.event[this]="jPlayer_"+this});b.jPlayer.htmlEvent="loadstart abort emptied stalled loadedmetadata loadeddata canplay canplaythrough".split(" ");b.jPlayer.pause=
function(){b.each(b.jPlayer.prototype.instances,function(a,c){c.data("jPlayer").status.srcSet&&c.jPlayer("pause")})};b.jPlayer.timeFormat={showHour:!1,showMin:!0,showSec:!0,padHour:!1,padMin:!0,padSec:!0,sepHour:":",sepMin:":",sepSec:""};var m=function(){this.init()};m.prototype={init:function(){this.options={timeFormat:b.jPlayer.timeFormat}},time:function(a){var c=new Date(1E3*(a&&"number"===typeof a?a:0)),b=c.getUTCHours();a=this.options.timeFormat.showHour?c.getUTCMinutes():c.getUTCMinutes()+60*
b;c=this.options.timeFormat.showMin?c.getUTCSeconds():c.getUTCSeconds()+60*a;b=this.options.timeFormat.padHour&&10>b?"0"+b:b;a=this.options.timeFormat.padMin&&10>a?"0"+a:a;c=this.options.timeFormat.padSec&&10>c?"0"+c:c;b=""+(this.options.timeFormat.showHour?b+this.options.timeFormat.sepHour:"");b+=this.options.timeFormat.showMin?a+this.options.timeFormat.sepMin:"";return b+=this.options.timeFormat.showSec?c+this.options.timeFormat.sepSec:""}};var n=new m;b.jPlayer.convertTime=function(a){return n.time(a)};
b.jPlayer.uaBrowser=function(a){a=a.toLowerCase();var c=/(opera)(?:.*version)?[ \/]([\w.]+)/,b=/(msie) ([\w.]+)/,e=/(mozilla)(?:.*? rv:([\w.]+))?/;a=/(webkit)[ \/]([\w.]+)/.exec(a)||c.exec(a)||b.exec(a)||0>a.indexOf("compatible")&&e.exec(a)||[];return{browser:a[1]||"",version:a[2]||"0"}};b.jPlayer.uaPlatform=function(a){var c=a.toLowerCase(),b=/(android)/,e=/(mobile)/;a=/(ipad|iphone|ipod|android|blackberry|playbook|windows ce|webos)/.exec(c)||[];c=/(ipad|playbook)/.exec(c)||!e.exec(c)&&b.exec(c)||
[];a[1]&&(a[1]=a[1].replace(/\s/g,"_"));return{platform:a[1]||"",tablet:c[1]||""}};b.jPlayer.browser={};b.jPlayer.platform={};var k=b.jPlayer.uaBrowser(navigator.userAgent);k.browser&&(b.jPlayer.browser[k.browser]=!0,b.jPlayer.browser.version=k.version);k=b.jPlayer.uaPlatform(navigator.userAgent);k.platform&&(b.jPlayer.platform[k.platform]=!0,b.jPlayer.platform.mobile=!k.tablet,b.jPlayer.platform.tablet=!!k.tablet);b.jPlayer.getDocMode=function(){var a;b.jPlayer.browser.msie&&(document.documentMode?
a=document.documentMode:(a=5,document.compatMode&&"CSS1Compat"===document.compatMode&&(a=7)));return a};b.jPlayer.browser.documentMode=b.jPlayer.getDocMode();b.jPlayer.nativeFeatures={init:function(){var a=document,c=a.createElement("video"),b={w3c:"fullscreenEnabled fullscreenElement requestFullscreen exitFullscreen fullscreenchange fullscreenerror".split(" "),moz:"mozFullScreenEnabled mozFullScreenElement mozRequestFullScreen mozCancelFullScreen mozfullscreenchange mozfullscreenerror".split(" "),
webkit:" webkitCurrentFullScreenElement webkitRequestFullScreen webkitCancelFullScreen webkitfullscreenchange ".split(" "),webkitVideo:"webkitSupportsFullscreen webkitDisplayingFullscreen webkitEnterFullscreen webkitExitFullscreen  ".split(" ")},e=["w3c","moz","webkit","webkitVideo"],g,h;this.fullscreen=c={support:{w3c:!!a[b.w3c[0]],moz:!!a[b.moz[0]],webkit:"function"===typeof a[b.webkit[3]],webkitVideo:"function"===typeof c[b.webkitVideo[2]]},used:{}};g=0;for(h=e.length;g<h;g++){var f=e[g];if(c.support[f]){c.spec=
f;c.used[f]=!0;break}}if(c.spec){var l=b[c.spec];c.api={fullscreenEnabled:!0,fullscreenElement:function(c){c=c?c:a;return c[l[1]]},requestFullscreen:function(a){return a[l[2]]()},exitFullscreen:function(c){c=c?c:a;return c[l[3]]()}};c.event={fullscreenchange:l[4],fullscreenerror:l[5]}}else c.api={fullscreenEnabled:!1,fullscreenElement:function(){return null},requestFullscreen:function(){},exitFullscreen:function(){}},c.event={}}};b.jPlayer.nativeFeatures.init();b.jPlayer.focus=null;b.jPlayer.keyIgnoreElementNames=
"INPUT TEXTAREA";var p=function(a){var c=b.jPlayer.focus,d;c&&(b.each(b.jPlayer.keyIgnoreElementNames.split(/\s+/g),function(c,b){if(a.target.nodeName.toUpperCase()===b.toUpperCase())return d=!0,!1}),d||b.each(c.options.keyBindings,function(d,g){if(g&&a.which===g.key&&b.isFunction(g.fn))return a.preventDefault(),g.fn(c),!1}))};b.jPlayer.keys=function(a){b(document.documentElement).unbind("keydown.jPlayer");a&&b(document.documentElement).bind("keydown.jPlayer",p)};b.jPlayer.keys(!0);b.jPlayer.prototype=
{count:0,version:{script:"2.5.0",needFlash:"2.5.0",flash:"unknown"},options:{swfPath:"js",solution:"html, flash",supplied:"mp3",preload:"metadata",volume:0.8,muted:!1,playbackRate:1,defaultPlaybackRate:1,minPlaybackRate:0.5,maxPlaybackRate:4,wmode:"opaque",backgroundColor:"#000000",cssSelectorAncestor:"#jp_container_1",cssSelector:{videoPlay:".jp-video-play",play:".jp-play",pause:".jp-pause",stop:".jp-stop",seekBar:".jp-seek-bar",playBar:".jp-play-bar",mute:".jp-mute",unmute:".jp-unmute",volumeBar:".jp-volume-bar",
volumeBarValue:".jp-volume-bar-value",volumeMax:".jp-volume-max",playbackRateBar:".jp-playback-rate-bar",playbackRateBarValue:".jp-playback-rate-bar-value",currentTime:".jp-current-time",duration:".jp-duration",fullScreen:".jp-full-screen",restoreScreen:".jp-restore-screen",repeat:".jp-repeat",repeatOff:".jp-repeat-off",gui:".jp-gui",noSolution:".jp-no-solution"},smoothPlayBar:!1,fullScreen:!1,fullWindow:!1,autohide:{restored:!1,full:!0,fadeIn:200,fadeOut:600,hold:1E3},loop:!1,repeat:function(a){a.jPlayer.options.loop?
b(this).unbind(".jPlayerRepeat").bind(b.jPlayer.event.ended+".jPlayer.jPlayerRepeat",function(){b(this).jPlayer("play")}):b(this).unbind(".jPlayerRepeat")},nativeVideoControls:{},noFullWindow:{msie:/msie [0-6]\./,ipad:/ipad.*?os [0-4]\./,iphone:/iphone/,ipod:/ipod/,android_pad:/android [0-3]\.(?!.*?mobile)/,android_phone:/android.*?mobile/,blackberry:/blackberry/,windows_ce:/windows ce/,iemobile:/iemobile/,webos:/webos/},noVolume:{ipad:/ipad/,iphone:/iphone/,ipod:/ipod/,android_pad:/android(?!.*?mobile)/,
android_phone:/android.*?mobile/,blackberry:/blackberry/,windows_ce:/windows ce/,iemobile:/iemobile/,webos:/webos/,playbook:/playbook/},timeFormat:{},keyEnabled:!1,audioFullScreen:!1,keyBindings:{play:{key:32,fn:function(a){a.status.paused?a.play():a.pause()}},fullScreen:{key:13,fn:function(a){(a.status.video||a.options.audioFullScreen)&&a._setOption("fullScreen",!a.options.fullScreen)}},muted:{key:8,fn:function(a){a._muted(!a.options.muted)}},volumeUp:{key:38,fn:function(a){a.volume(a.options.volume+
0.1)}},volumeDown:{key:40,fn:function(a){a.volume(a.options.volume-0.1)}}},verticalVolume:!1,verticalPlaybackRate:!1,globalVolume:!1,idPrefix:"jp",noConflict:"jQuery",emulateHtml:!1,consoleAlerts:!0,errorAlerts:!1,warningAlerts:!1},optionsAudio:{size:{width:"0px",height:"0px",cssClass:""},sizeFull:{width:"0px",height:"0px",cssClass:""}},optionsVideo:{size:{width:"480px",height:"270px",cssClass:"jp-video-270p"},sizeFull:{width:"100%",height:"100%",cssClass:"jp-video-full"}},instances:{},status:{src:"",
media:{},paused:!0,format:{},formatType:"",waitForPlay:!0,waitForLoad:!0,srcSet:!1,video:!1,seekPercent:0,currentPercentRelative:0,currentPercentAbsolute:0,currentTime:0,duration:0,videoWidth:0,videoHeight:0,readyState:0,networkState:0,playbackRate:1,ended:0},internal:{ready:!1},solution:{html:!0,flash:!0},format:{mp3:{codec:'audio/mpeg; codecs="mp3"',flashCanPlay:!0,media:"audio"},m4a:{codec:'audio/mp4; codecs="mp4a.40.2"',flashCanPlay:!0,media:"audio"},m3u8a:{codec:'application/vnd.apple.mpegurl; codecs="mp4a.40.2"',
flashCanPlay:!1,media:"audio"},m3ua:{codec:"audio/mpegurl",flashCanPlay:!1,media:"audio"},oga:{codec:'audio/ogg; codecs="vorbis, opus"',flashCanPlay:!1,media:"audio"},flac:{codec:"audio/x-flac",flashCanPlay:!1,media:"audio"},wav:{codec:'audio/wav; codecs="1"',flashCanPlay:!1,media:"audio"},webma:{codec:'audio/webm; codecs="vorbis"',flashCanPlay:!1,media:"audio"},fla:{codec:"audio/x-flv",flashCanPlay:!0,media:"audio"},rtmpa:{codec:'audio/rtmp; codecs="rtmp"',flashCanPlay:!0,media:"audio"},m4v:{codec:'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
flashCanPlay:!0,media:"video"},m3u8v:{codec:'application/vnd.apple.mpegurl; codecs="avc1.42E01E, mp4a.40.2"',flashCanPlay:!1,media:"video"},m3uv:{codec:"audio/mpegurl",flashCanPlay:!1,media:"video"},ogv:{codec:'video/ogg; codecs="theora, vorbis"',flashCanPlay:!1,media:"video"},webmv:{codec:'video/webm; codecs="vorbis, vp8"',flashCanPlay:!1,media:"video"},flv:{codec:"video/x-flv",flashCanPlay:!0,media:"video"},rtmpv:{codec:'video/rtmp; codecs="rtmp"',flashCanPlay:!0,media:"video"}},_init:function(){var a=
this;this.element.empty();this.status=b.extend({},this.status);this.internal=b.extend({},this.internal);this.options.timeFormat=b.extend({},b.jPlayer.timeFormat,this.options.timeFormat);this.internal.cmdsIgnored=b.jPlayer.platform.ipad||b.jPlayer.platform.iphone||b.jPlayer.platform.ipod;this.internal.domNode=this.element.get(0);this.options.keyEnabled&&!b.jPlayer.focus&&(b.jPlayer.focus=this);this.formats=[];this.solutions=[];this.require={};this.htmlElement={};this.html={};this.html.audio={};this.html.video=
{};this.flash={};this.css={};this.css.cs={};this.css.jq={};this.ancestorJq=[];this.options.volume=this._limitValue(this.options.volume,0,1);b.each(this.options.supplied.toLowerCase().split(","),function(c,d){var e=d.replace(/^\s+|\s+$/g,"");if(a.format[e]){var f=!1;b.each(a.formats,function(a,c){if(e===c)return f=!0,!1});f||a.formats.push(e)}});b.each(this.options.solution.toLowerCase().split(","),function(c,d){var e=d.replace(/^\s+|\s+$/g,"");if(a.solution[e]){var f=!1;b.each(a.solutions,function(a,
c){if(e===c)return f=!0,!1});f||a.solutions.push(e)}});this.internal.instance="jp_"+this.count;this.instances[this.internal.instance]=this.element;this.element.attr("id")||this.element.attr("id",this.options.idPrefix+"_jplayer_"+this.count);this.internal.self=b.extend({},{id:this.element.attr("id"),jq:this.element});this.internal.audio=b.extend({},{id:this.options.idPrefix+"_audio_"+this.count,jq:f});this.internal.video=b.extend({},{id:this.options.idPrefix+"_video_"+this.count,jq:f});this.internal.flash=
b.extend({},{id:this.options.idPrefix+"_flash_"+this.count,jq:f,swf:this.options.swfPath+(".swf"!==this.options.swfPath.toLowerCase().slice(-4)?(this.options.swfPath&&"/"!==this.options.swfPath.slice(-1)?"/":"")+"Jplayer.swf":"")});this.internal.poster=b.extend({},{id:this.options.idPrefix+"_poster_"+this.count,jq:f});b.each(b.jPlayer.event,function(c,b){a.options[c]!==f&&(a.element.bind(b+".jPlayer",a.options[c]),a.options[c]=f)});this.require.audio=!1;this.require.video=!1;b.each(this.formats,function(c,
b){a.require[a.format[b].media]=!0});this.options=this.require.video?b.extend(!0,{},this.optionsVideo,this.options):b.extend(!0,{},this.optionsAudio,this.options);this._setSize();this.status.nativeVideoControls=this._uaBlocklist(this.options.nativeVideoControls);this.status.noFullWindow=this._uaBlocklist(this.options.noFullWindow);this.status.noVolume=this._uaBlocklist(this.options.noVolume);b.jPlayer.nativeFeatures.fullscreen.api.fullscreenEnabled&&this._fullscreenAddEventListeners();this._restrictNativeVideoControls();
this.htmlElement.poster=document.createElement("img");this.htmlElement.poster.id=this.internal.poster.id;this.htmlElement.poster.onload=function(){a.status.video&&!a.status.waitForPlay||a.internal.poster.jq.show()};this.element.append(this.htmlElement.poster);this.internal.poster.jq=b("#"+this.internal.poster.id);this.internal.poster.jq.css({width:this.status.width,height:this.status.height});this.internal.poster.jq.hide();this.internal.poster.jq.bind("click.jPlayer",function(){a._trigger(b.jPlayer.event.click)});
this.html.audio.available=!1;this.require.audio&&(this.htmlElement.audio=document.createElement("audio"),this.htmlElement.audio.id=this.internal.audio.id,this.html.audio.available=!!this.htmlElement.audio.canPlayType&&this._testCanPlayType(this.htmlElement.audio));this.html.video.available=!1;this.require.video&&(this.htmlElement.video=document.createElement("video"),this.htmlElement.video.id=this.internal.video.id,this.html.video.available=!!this.htmlElement.video.canPlayType&&this._testCanPlayType(this.htmlElement.video));
this.flash.available=this._checkForFlash(10.1);this.html.canPlay={};this.flash.canPlay={};b.each(this.formats,function(c,b){a.html.canPlay[b]=a.html[a.format[b].media].available&&""!==a.htmlElement[a.format[b].media].canPlayType(a.format[b].codec);a.flash.canPlay[b]=a.format[b].flashCanPlay&&a.flash.available});this.html.desired=!1;this.flash.desired=!1;b.each(this.solutions,function(c,d){if(0===c)a[d].desired=!0;else{var e=!1,f=!1;b.each(a.formats,function(c,b){a[a.solutions[0]].canPlay[b]&&("video"===
a.format[b].media?f=!0:e=!0)});a[d].desired=a.require.audio&&!e||a.require.video&&!f}});this.html.support={};this.flash.support={};b.each(this.formats,function(c,b){a.html.support[b]=a.html.canPlay[b]&&a.html.desired;a.flash.support[b]=a.flash.canPlay[b]&&a.flash.desired});this.html.used=!1;this.flash.used=!1;b.each(this.solutions,function(c,d){b.each(a.formats,function(c,b){if(a[d].support[b])return a[d].used=!0,!1})});this._resetActive();this._resetGate();this._cssSelectorAncestor(this.options.cssSelectorAncestor);
this.html.used||this.flash.used?this.css.jq.noSolution.length&&this.css.jq.noSolution.hide():(this._error({type:b.jPlayer.error.NO_SOLUTION,context:"{solution:'"+this.options.solution+"', supplied:'"+this.options.supplied+"'}",message:b.jPlayer.errorMsg.NO_SOLUTION,hint:b.jPlayer.errorHint.NO_SOLUTION}),this.css.jq.noSolution.length&&this.css.jq.noSolution.show());if(this.flash.used){var c,d="jQuery="+encodeURI(this.options.noConflict)+"&id="+encodeURI(this.internal.self.id)+"&vol="+this.options.volume+
"&muted="+this.options.muted;if(b.jPlayer.browser.msie&&(9>Number(b.jPlayer.browser.version)||9>b.jPlayer.browser.documentMode)){d=['<param name="movie" value="'+this.internal.flash.swf+'" />','<param name="FlashVars" value="'+d+'" />','<param name="allowScriptAccess" value="always" />','<param name="bgcolor" value="'+this.options.backgroundColor+'" />','<param name="wmode" value="'+this.options.wmode+'" />'];c=document.createElement('<object id="'+this.internal.flash.id+'" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" width="0" height="0" tabindex="-1"></object>');
for(var e=0;e<d.length;e++)c.appendChild(document.createElement(d[e]))}else e=function(a,c,b){var d=document.createElement("param");d.setAttribute("name",c);d.setAttribute("value",b);a.appendChild(d)},c=document.createElement("object"),c.setAttribute("id",this.internal.flash.id),c.setAttribute("name",this.internal.flash.id),c.setAttribute("data",this.internal.flash.swf),c.setAttribute("type","application/x-shockwave-flash"),c.setAttribute("width","1"),c.setAttribute("height","1"),c.setAttribute("tabindex",
"-1"),e(c,"flashvars",d),e(c,"allowscriptaccess","always"),e(c,"bgcolor",this.options.backgroundColor),e(c,"wmode",this.options.wmode);this.element.append(c);this.internal.flash.jq=b(c)}this.status.playbackRateEnabled=this.html.used&&!this.flash.used?this._testPlaybackRate("audio"):!1;this._updatePlaybackRate();this.html.used&&(this.html.audio.available&&(this._addHtmlEventListeners(this.htmlElement.audio,this.html.audio),this.element.append(this.htmlElement.audio),this.internal.audio.jq=b("#"+this.internal.audio.id)),
this.html.video.available&&(this._addHtmlEventListeners(this.htmlElement.video,this.html.video),this.element.append(this.htmlElement.video),this.internal.video.jq=b("#"+this.internal.video.id),this.status.nativeVideoControls?this.internal.video.jq.css({width:this.status.width,height:this.status.height}):this.internal.video.jq.css({width:"0px",height:"0px"}),this.internal.video.jq.bind("click.jPlayer",function(){a._trigger(b.jPlayer.event.click)})));this.options.emulateHtml&&this._emulateHtmlBridge();
this.html.used&&!this.flash.used&&setTimeout(function(){a.internal.ready=!0;a.version.flash="n/a";a._trigger(b.jPlayer.event.repeat);a._trigger(b.jPlayer.event.ready)},100);this._updateNativeVideoControls();this.css.jq.videoPlay.length&&this.css.jq.videoPlay.hide();b.jPlayer.prototype.count++},destroy:function(){this.clearMedia();this._removeUiClass();this.css.jq.currentTime.length&&this.css.jq.currentTime.text("");this.css.jq.duration.length&&this.css.jq.duration.text("");b.each(this.css.jq,function(a,
c){c.length&&c.unbind(".jPlayer")});this.internal.poster.jq.unbind(".jPlayer");this.internal.video.jq&&this.internal.video.jq.unbind(".jPlayer");this._fullscreenRemoveEventListeners();this===b.jPlayer.focus&&(b.jPlayer.focus=null);this.options.emulateHtml&&this._destroyHtmlBridge();this.element.removeData("jPlayer");this.element.unbind(".jPlayer");this.element.empty();delete this.instances[this.internal.instance]},enable:function(){},disable:function(){},_testCanPlayType:function(a){try{return a.canPlayType(this.format.mp3.codec),
!0}catch(c){return!1}},_testPlaybackRate:function(a){a=document.createElement("string"===typeof a?a:"audio");try{return"playbackRate"in a?(a.playbackRate=0.5,0.5===a.playbackRate):!1}catch(c){return!1}},_uaBlocklist:function(a){var c=navigator.userAgent.toLowerCase(),d=!1;b.each(a,function(a,b){if(b&&b.test(c))return d=!0,!1});return d},_restrictNativeVideoControls:function(){this.require.audio&&this.status.nativeVideoControls&&(this.status.nativeVideoControls=!1,this.status.noFullWindow=!0)},_updateNativeVideoControls:function(){this.html.video.available&&
this.html.used&&(this.htmlElement.video.controls=this.status.nativeVideoControls,this._updateAutohide(),this.status.nativeVideoControls&&this.require.video?(this.internal.poster.jq.hide(),this.internal.video.jq.css({width:this.status.width,height:this.status.height})):this.status.waitForPlay&&this.status.video&&(this.internal.poster.jq.show(),this.internal.video.jq.css({width:"0px",height:"0px"})))},_addHtmlEventListeners:function(a,c){var d=this;a.preload=this.options.preload;a.muted=this.options.muted;
a.volume=this.options.volume;this.status.playbackRateEnabled&&(a.defaultPlaybackRate=this.options.defaultPlaybackRate,a.playbackRate=this.options.playbackRate);a.addEventListener("progress",function(){c.gate&&(d.internal.cmdsIgnored&&0<this.readyState&&(d.internal.cmdsIgnored=!1),d._getHtmlStatus(a),d._updateInterface(),d._trigger(b.jPlayer.event.progress))},!1);a.addEventListener("timeupdate",function(){c.gate&&(d._getHtmlStatus(a),d._updateInterface(),d._trigger(b.jPlayer.event.timeupdate))},!1);
a.addEventListener("durationchange",function(){c.gate&&(d._getHtmlStatus(a),d._updateInterface(),d._trigger(b.jPlayer.event.durationchange))},!1);a.addEventListener("play",function(){c.gate&&(d._updateButtons(!0),d._html_checkWaitForPlay(),d._trigger(b.jPlayer.event.play))},!1);a.addEventListener("playing",function(){c.gate&&(d._updateButtons(!0),d._seeked(),d._trigger(b.jPlayer.event.playing))},!1);a.addEventListener("pause",function(){c.gate&&(d._updateButtons(!1),d._trigger(b.jPlayer.event.pause))},
!1);a.addEventListener("waiting",function(){c.gate&&(d._seeking(),d._trigger(b.jPlayer.event.waiting))},!1);a.addEventListener("seeking",function(){c.gate&&(d._seeking(),d._trigger(b.jPlayer.event.seeking))},!1);a.addEventListener("seeked",function(){c.gate&&(d._seeked(),d._trigger(b.jPlayer.event.seeked))},!1);a.addEventListener("volumechange",function(){c.gate&&(d.options.volume=a.volume,d.options.muted=a.muted,d._updateMute(),d._updateVolume(),d._trigger(b.jPlayer.event.volumechange))},!1);a.addEventListener("ratechange",
function(){c.gate&&(d.options.defaultPlaybackRate=a.defaultPlaybackRate,d.options.playbackRate=a.playbackRate,d._updatePlaybackRate(),d._trigger(b.jPlayer.event.ratechange))},!1);a.addEventListener("suspend",function(){c.gate&&(d._seeked(),d._trigger(b.jPlayer.event.suspend))},!1);a.addEventListener("ended",function(){c.gate&&(b.jPlayer.browser.webkit||(d.htmlElement.media.currentTime=0),d.htmlElement.media.pause(),d._updateButtons(!1),d._getHtmlStatus(a,!0),d._updateInterface(),d._trigger(b.jPlayer.event.ended))},
!1);a.addEventListener("error",function(){c.gate&&(d._updateButtons(!1),d._seeked(),d.status.srcSet&&(clearTimeout(d.internal.htmlDlyCmdId),d.status.waitForLoad=!0,d.status.waitForPlay=!0,d.status.video&&!d.status.nativeVideoControls&&d.internal.video.jq.css({width:"0px",height:"0px"}),d._validString(d.status.media.poster)&&!d.status.nativeVideoControls&&d.internal.poster.jq.show(),d.css.jq.videoPlay.length&&d.css.jq.videoPlay.show(),d._error({type:b.jPlayer.error.URL,context:d.status.src,message:b.jPlayer.errorMsg.URL,
hint:b.jPlayer.errorHint.URL})))},!1);b.each(b.jPlayer.htmlEvent,function(e,g){a.addEventListener(this,function(){c.gate&&d._trigger(b.jPlayer.event[g])},!1)})},_getHtmlStatus:function(a,c){var b=0,e=0,g=0,f=0;isFinite(a.duration)&&(this.status.duration=a.duration);b=a.currentTime;e=0<this.status.duration?100*b/this.status.duration:0;"object"===typeof a.seekable&&0<a.seekable.length?(g=0<this.status.duration?100*a.seekable.end(a.seekable.length-1)/this.status.duration:100,f=0<this.status.duration?
100*a.currentTime/a.seekable.end(a.seekable.length-1):0):(g=100,f=e);c&&(e=f=b=0);this.status.seekPercent=g;this.status.currentPercentRelative=f;this.status.currentPercentAbsolute=e;this.status.currentTime=b;this.status.videoWidth=a.videoWidth;this.status.videoHeight=a.videoHeight;this.status.readyState=a.readyState;this.status.networkState=a.networkState;this.status.playbackRate=a.playbackRate;this.status.ended=a.ended},_resetStatus:function(){this.status=b.extend({},this.status,b.jPlayer.prototype.status)},
_trigger:function(a,c,d){a=b.Event(a);a.jPlayer={};a.jPlayer.version=b.extend({},this.version);a.jPlayer.options=b.extend(!0,{},this.options);a.jPlayer.status=b.extend(!0,{},this.status);a.jPlayer.html=b.extend(!0,{},this.html);a.jPlayer.flash=b.extend(!0,{},this.flash);c&&(a.jPlayer.error=b.extend({},c));d&&(a.jPlayer.warning=b.extend({},d));this.element.trigger(a)},jPlayerFlashEvent:function(a,c){if(a===b.jPlayer.event.ready)if(!this.internal.ready)this.internal.ready=!0,this.internal.flash.jq.css({width:"0px",
height:"0px"}),this.version.flash=c.version,this.version.needFlash!==this.version.flash&&this._error({type:b.jPlayer.error.VERSION,context:this.version.flash,message:b.jPlayer.errorMsg.VERSION+this.version.flash,hint:b.jPlayer.errorHint.VERSION}),this._trigger(b.jPlayer.event.repeat),this._trigger(a);else if(this.flash.gate){if(this.status.srcSet){var d=this.status.currentTime,e=this.status.paused;this.setMedia(this.status.media);this.volumeWorker(this.options.volume);0<d&&(e?this.pause(d):this.play(d))}this._trigger(b.jPlayer.event.flashreset)}if(this.flash.gate)switch(a){case b.jPlayer.event.progress:this._getFlashStatus(c);
this._updateInterface();this._trigger(a);break;case b.jPlayer.event.timeupdate:this._getFlashStatus(c);this._updateInterface();this._trigger(a);break;case b.jPlayer.event.play:this._seeked();this._updateButtons(!0);this._trigger(a);break;case b.jPlayer.event.pause:this._updateButtons(!1);this._trigger(a);break;case b.jPlayer.event.ended:this._updateButtons(!1);this._trigger(a);break;case b.jPlayer.event.click:this._trigger(a);break;case b.jPlayer.event.error:this.status.waitForLoad=!0;this.status.waitForPlay=
!0;this.status.video&&this.internal.flash.jq.css({width:"0px",height:"0px"});this._validString(this.status.media.poster)&&this.internal.poster.jq.show();this.css.jq.videoPlay.length&&this.status.video&&this.css.jq.videoPlay.show();this.status.video?this._flash_setVideo(this.status.media):this._flash_setAudio(this.status.media);this._updateButtons(!1);this._error({type:b.jPlayer.error.URL,context:c.src,message:b.jPlayer.errorMsg.URL,hint:b.jPlayer.errorHint.URL});break;case b.jPlayer.event.seeking:this._seeking();
this._trigger(a);break;case b.jPlayer.event.seeked:this._seeked();this._trigger(a);break;case b.jPlayer.event.ready:break;default:this._trigger(a)}return!1},_getFlashStatus:function(a){this.status.seekPercent=a.seekPercent;this.status.currentPercentRelative=a.currentPercentRelative;this.status.currentPercentAbsolute=a.currentPercentAbsolute;this.status.currentTime=a.currentTime;this.status.duration=a.duration;this.status.videoWidth=a.videoWidth;this.status.videoHeight=a.videoHeight;this.status.readyState=
4;this.status.networkState=0;this.status.playbackRate=1;this.status.ended=!1},_updateButtons:function(a){a===f?a=!this.status.paused:this.status.paused=!a;this.css.jq.play.length&&this.css.jq.pause.length&&(a?(this.css.jq.play.hide(),this.css.jq.pause.show()):(this.css.jq.play.show(),this.css.jq.pause.hide()));this.css.jq.restoreScreen.length&&this.css.jq.fullScreen.length&&(this.status.noFullWindow?(this.css.jq.fullScreen.hide(),this.css.jq.restoreScreen.hide()):this.options.fullWindow?(this.css.jq.fullScreen.hide(),
this.css.jq.restoreScreen.show()):(this.css.jq.fullScreen.show(),this.css.jq.restoreScreen.hide()));this.css.jq.repeat.length&&this.css.jq.repeatOff.length&&(this.options.loop?(this.css.jq.repeat.hide(),this.css.jq.repeatOff.show()):(this.css.jq.repeat.show(),this.css.jq.repeatOff.hide()))},_updateInterface:function(){this.css.jq.seekBar.length&&this.css.jq.seekBar.width(this.status.seekPercent+"%");this.css.jq.playBar.length&&(this.options.smoothPlayBar?this.css.jq.playBar.stop().animate({width:this.status.currentPercentAbsolute+
"%"},250,"linear"):this.css.jq.playBar.width(this.status.currentPercentRelative+"%"));this.css.jq.currentTime.length&&this.css.jq.currentTime.text(this._convertTime(this.status.currentTime));this.css.jq.duration.length&&this.css.jq.duration.text(this._convertTime(this.status.duration))},_convertTime:m.prototype.time,_seeking:function(){this.css.jq.seekBar.length&&this.css.jq.seekBar.addClass("jp-seeking-bg")},_seeked:function(){this.css.jq.seekBar.length&&this.css.jq.seekBar.removeClass("jp-seeking-bg")},
_resetGate:function(){this.html.audio.gate=!1;this.html.video.gate=!1;this.flash.gate=!1},_resetActive:function(){this.html.active=!1;this.flash.active=!1},_escapeHtml:function(a){return a.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;")},_qualifyURL:function(a){var c=document.createElement("div");c.innerHTML='<a href="'+this._escapeHtml(a)+'">x</a>';return c.firstChild.href},_absoluteMediaUrls:function(a){var c=this;b.each(a,function(b,e){c.format[b]&&
(a[b]=c._qualifyURL(e))});return a},setMedia:function(a){var c=this,d=!1,e=this.status.media.poster!==a.poster;this._resetMedia();this._resetGate();this._resetActive();a=this._absoluteMediaUrls(a);b.each(this.formats,function(e,f){var k="video"===c.format[f].media;b.each(c.solutions,function(b,e){if(c[e].support[f]&&c._validString(a[f])){var g="html"===e;k?(g?(c.html.video.gate=!0,c._html_setVideo(a),c.html.active=!0):(c.flash.gate=!0,c._flash_setVideo(a),c.flash.active=!0),c.css.jq.videoPlay.length&&
c.css.jq.videoPlay.show(),c.status.video=!0):(g?(c.html.audio.gate=!0,c._html_setAudio(a),c.html.active=!0):(c.flash.gate=!0,c._flash_setAudio(a),c.flash.active=!0),c.css.jq.videoPlay.length&&c.css.jq.videoPlay.hide(),c.status.video=!1);d=!0;return!1}});if(d)return!1});d?(this.status.nativeVideoControls&&this.html.video.gate||!this._validString(a.poster)||(e?this.htmlElement.poster.src=a.poster:this.internal.poster.jq.show()),this.status.srcSet=!0,this.status.media=b.extend({},a),this._updateButtons(!1),
this._updateInterface()):this._error({type:b.jPlayer.error.NO_SUPPORT,context:"{supplied:'"+this.options.supplied+"'}",message:b.jPlayer.errorMsg.NO_SUPPORT,hint:b.jPlayer.errorHint.NO_SUPPORT})},_resetMedia:function(){this._resetStatus();this._updateButtons(!1);this._updateInterface();this._seeked();this.internal.poster.jq.hide();clearTimeout(this.internal.htmlDlyCmdId);this.html.active?this._html_resetMedia():this.flash.active&&this._flash_resetMedia()},clearMedia:function(){this._resetMedia();
this.html.active?this._html_clearMedia():this.flash.active&&this._flash_clearMedia();this._resetGate();this._resetActive()},load:function(){this.status.srcSet?this.html.active?this._html_load():this.flash.active&&this._flash_load():this._urlNotSetError("load")},focus:function(){this.options.keyEnabled&&(b.jPlayer.focus=this)},play:function(a){a="number"===typeof a?a:NaN;this.status.srcSet?(this.focus(),this.html.active?this._html_play(a):this.flash.active&&this._flash_play(a)):this._urlNotSetError("play")},
videoPlay:function(){this.play()},pause:function(a){a="number"===typeof a?a:NaN;this.status.srcSet?this.html.active?this._html_pause(a):this.flash.active&&this._flash_pause(a):this._urlNotSetError("pause")},tellOthers:function(a,c){var d=this,e="function"===typeof c,g=Array.prototype.slice.call(arguments);"string"===typeof a&&(e&&g.splice(1,1),b.each(this.instances,function(){d.element!==this&&(e&&!c.call(this.data("jPlayer"),d)||this.jPlayer.apply(this,g))}))},pauseOthers:function(a){this.tellOthers("pause",
function(){return this.status.srcSet},a)},stop:function(){this.status.srcSet?this.html.active?this._html_pause(0):this.flash.active&&this._flash_pause(0):this._urlNotSetError("stop")},playHead:function(a){a=this._limitValue(a,0,100);this.status.srcSet?this.html.active?this._html_playHead(a):this.flash.active&&this._flash_playHead(a):this._urlNotSetError("playHead")},_muted:function(a){this.mutedWorker(a);this.options.globalVolume&&this.tellOthers("mutedWorker",function(){return this.options.globalVolume},
a)},mutedWorker:function(a){this.options.muted=a;this.html.used&&this._html_setProperty("muted",a);this.flash.used&&this._flash_mute(a);this.html.video.gate||this.html.audio.gate||(this._updateMute(a),this._updateVolume(this.options.volume),this._trigger(b.jPlayer.event.volumechange))},mute:function(a){a=a===f?!0:!!a;this._muted(a)},unmute:function(a){a=a===f?!0:!!a;this._muted(!a)},_updateMute:function(a){a===f&&(a=this.options.muted);this.css.jq.mute.length&&this.css.jq.unmute.length&&(this.status.noVolume?
(this.css.jq.mute.hide(),this.css.jq.unmute.hide()):a?(this.css.jq.mute.hide(),this.css.jq.unmute.show()):(this.css.jq.mute.show(),this.css.jq.unmute.hide()))},volume:function(a){this.volumeWorker(a);this.options.globalVolume&&this.tellOthers("volumeWorker",function(){return this.options.globalVolume},a)},volumeWorker:function(a){a=this._limitValue(a,0,1);this.options.volume=a;this.html.used&&this._html_setProperty("volume",a);this.flash.used&&this._flash_volume(a);this.html.video.gate||this.html.audio.gate||
(this._updateVolume(a),this._trigger(b.jPlayer.event.volumechange))},volumeBar:function(a){if(this.css.jq.volumeBar.length){var c=b(a.currentTarget),d=c.offset(),e=a.pageX-d.left,g=c.width();a=c.height()-a.pageY+d.top;c=c.height();this.options.verticalVolume?this.volume(a/c):this.volume(e/g)}this.options.muted&&this._muted(!1)},volumeBarValue:function(){},_updateVolume:function(a){a===f&&(a=this.options.volume);a=this.options.muted?0:a;this.status.noVolume?(this.css.jq.volumeBar.length&&this.css.jq.volumeBar.hide(),
this.css.jq.volumeBarValue.length&&this.css.jq.volumeBarValue.hide(),this.css.jq.volumeMax.length&&this.css.jq.volumeMax.hide()):(this.css.jq.volumeBar.length&&this.css.jq.volumeBar.show(),this.css.jq.volumeBarValue.length&&(this.css.jq.volumeBarValue.show(),this.css.jq.volumeBarValue[this.options.verticalVolume?"height":"width"](100*a+"%")),this.css.jq.volumeMax.length&&this.css.jq.volumeMax.show())},volumeMax:function(){this.volume(1);this.options.muted&&this._muted(!1)},_cssSelectorAncestor:function(a){var c=
this;this.options.cssSelectorAncestor=a;this._removeUiClass();this.ancestorJq=a?b(a):[];a&&1!==this.ancestorJq.length&&this._warning({type:b.jPlayer.warning.CSS_SELECTOR_COUNT,context:a,message:b.jPlayer.warningMsg.CSS_SELECTOR_COUNT+this.ancestorJq.length+" found for cssSelectorAncestor.",hint:b.jPlayer.warningHint.CSS_SELECTOR_COUNT});this._addUiClass();b.each(this.options.cssSelector,function(a,b){c._cssSelector(a,b)});this._updateInterface();this._updateButtons();this._updateAutohide();this._updateVolume();
this._updateMute()},_cssSelector:function(a,c){var d=this;"string"===typeof c?b.jPlayer.prototype.options.cssSelector[a]?(this.css.jq[a]&&this.css.jq[a].length&&this.css.jq[a].unbind(".jPlayer"),this.options.cssSelector[a]=c,this.css.cs[a]=this.options.cssSelectorAncestor+" "+c,this.css.jq[a]=c?b(this.css.cs[a]):[],this.css.jq[a].length&&this.css.jq[a].bind("click.jPlayer",function(c){c.preventDefault();d[a](c);b(this).blur()}),c&&1!==this.css.jq[a].length&&this._warning({type:b.jPlayer.warning.CSS_SELECTOR_COUNT,
context:this.css.cs[a],message:b.jPlayer.warningMsg.CSS_SELECTOR_COUNT+this.css.jq[a].length+" found for "+a+" method.",hint:b.jPlayer.warningHint.CSS_SELECTOR_COUNT})):this._warning({type:b.jPlayer.warning.CSS_SELECTOR_METHOD,context:a,message:b.jPlayer.warningMsg.CSS_SELECTOR_METHOD,hint:b.jPlayer.warningHint.CSS_SELECTOR_METHOD}):this._warning({type:b.jPlayer.warning.CSS_SELECTOR_STRING,context:c,message:b.jPlayer.warningMsg.CSS_SELECTOR_STRING,hint:b.jPlayer.warningHint.CSS_SELECTOR_STRING})},
seekBar:function(a){if(this.css.jq.seekBar.length){var c=b(a.currentTarget),d=c.offset();a=a.pageX-d.left;c=c.width();this.playHead(100*a/c)}},playBar:function(){},playbackRate:function(a){this._setOption("playbackRate",a)},playbackRateBar:function(a){if(this.css.jq.playbackRateBar.length){var c=b(a.currentTarget),d=c.offset(),e=a.pageX-d.left,g=c.width();a=c.height()-a.pageY+d.top;c=c.height();this.playbackRate((this.options.verticalPlaybackRate?a/c:e/g)*(this.options.maxPlaybackRate-this.options.minPlaybackRate)+
this.options.minPlaybackRate)}},playbackRateBarValue:function(){},_updatePlaybackRate:function(){var a=(this.options.playbackRate-this.options.minPlaybackRate)/(this.options.maxPlaybackRate-this.options.minPlaybackRate);this.status.playbackRateEnabled?(this.css.jq.playbackRateBar.length&&this.css.jq.playbackRateBar.show(),this.css.jq.playbackRateBarValue.length&&(this.css.jq.playbackRateBarValue.show(),this.css.jq.playbackRateBarValue[this.options.verticalPlaybackRate?"height":"width"](100*a+"%"))):
(this.css.jq.playbackRateBar.length&&this.css.jq.playbackRateBar.hide(),this.css.jq.playbackRateBarValue.length&&this.css.jq.playbackRateBarValue.hide())},repeat:function(){this._loop(!0)},repeatOff:function(){this._loop(!1)},_loop:function(a){this.options.loop!==a&&(this.options.loop=a,this._updateButtons(),this._trigger(b.jPlayer.event.repeat))},currentTime:function(){},duration:function(){},gui:function(){},noSolution:function(){},option:function(a,c){var d=a;if(0===arguments.length)return b.extend(!0,
{},this.options);if("string"===typeof a){var e=a.split(".");if(c===f){for(var d=b.extend(!0,{},this.options),g=0;g<e.length;g++)if(d[e[g]]!==f)d=d[e[g]];else return this._warning({type:b.jPlayer.warning.OPTION_KEY,context:a,message:b.jPlayer.warningMsg.OPTION_KEY,hint:b.jPlayer.warningHint.OPTION_KEY}),f;return d}for(var g=d={},h=0;h<e.length;h++)h<e.length-1?(g[e[h]]={},g=g[e[h]]):g[e[h]]=c}this._setOptions(d);return this},_setOptions:function(a){var c=this;b.each(a,function(a,b){c._setOption(a,
b)});return this},_setOption:function(a,c){var d=this;switch(a){case "volume":this.volume(c);break;case "muted":this._muted(c);break;case "globalVolume":this.options[a]=c;break;case "cssSelectorAncestor":this._cssSelectorAncestor(c);break;case "cssSelector":b.each(c,function(a,c){d._cssSelector(a,c)});break;case "playbackRate":this.options[a]=c=this._limitValue(c,this.options.minPlaybackRate,this.options.maxPlaybackRate);this.html.used&&this._html_setProperty("playbackRate",c);this._updatePlaybackRate();
break;case "defaultPlaybackRate":this.options[a]=c=this._limitValue(c,this.options.minPlaybackRate,this.options.maxPlaybackRate);this.html.used&&this._html_setProperty("defaultPlaybackRate",c);this._updatePlaybackRate();break;case "minPlaybackRate":this.options[a]=c=this._limitValue(c,0.1,this.options.maxPlaybackRate-0.1);this._updatePlaybackRate();break;case "maxPlaybackRate":this.options[a]=c=this._limitValue(c,this.options.minPlaybackRate+0.1,16);this._updatePlaybackRate();break;case "fullScreen":if(this.options[a]!==
c){var e=b.jPlayer.nativeFeatures.fullscreen.used.webkitVideo;if(!e||e&&!this.status.waitForPlay)e||(this.options[a]=c),c?this._requestFullscreen():this._exitFullscreen(),e||this._setOption("fullWindow",c)}break;case "fullWindow":this.options[a]!==c&&(this._removeUiClass(),this.options[a]=c,this._refreshSize());break;case "size":this.options.fullWindow||this.options[a].cssClass===c.cssClass||this._removeUiClass();this.options[a]=b.extend({},this.options[a],c);this._refreshSize();break;case "sizeFull":this.options.fullWindow&&
this.options[a].cssClass!==c.cssClass&&this._removeUiClass();this.options[a]=b.extend({},this.options[a],c);this._refreshSize();break;case "autohide":this.options[a]=b.extend({},this.options[a],c);this._updateAutohide();break;case "loop":this._loop(c);break;case "nativeVideoControls":this.options[a]=b.extend({},this.options[a],c);this.status.nativeVideoControls=this._uaBlocklist(this.options.nativeVideoControls);this._restrictNativeVideoControls();this._updateNativeVideoControls();break;case "noFullWindow":this.options[a]=
b.extend({},this.options[a],c);this.status.nativeVideoControls=this._uaBlocklist(this.options.nativeVideoControls);this.status.noFullWindow=this._uaBlocklist(this.options.noFullWindow);this._restrictNativeVideoControls();this._updateButtons();break;case "noVolume":this.options[a]=b.extend({},this.options[a],c);this.status.noVolume=this._uaBlocklist(this.options.noVolume);this._updateVolume();this._updateMute();break;case "emulateHtml":this.options[a]!==c&&((this.options[a]=c)?this._emulateHtmlBridge():
this._destroyHtmlBridge());break;case "timeFormat":this.options[a]=b.extend({},this.options[a],c);break;case "keyEnabled":this.options[a]=c;c||this!==b.jPlayer.focus||(b.jPlayer.focus=null);break;case "keyBindings":this.options[a]=b.extend(!0,{},this.options[a],c);break;case "audioFullScreen":this.options[a]=c}return this},_refreshSize:function(){this._setSize();this._addUiClass();this._updateSize();this._updateButtons();this._updateAutohide();this._trigger(b.jPlayer.event.resize)},_setSize:function(){this.options.fullWindow?
(this.status.width=this.options.sizeFull.width,this.status.height=this.options.sizeFull.height,this.status.cssClass=this.options.sizeFull.cssClass):(this.status.width=this.options.size.width,this.status.height=this.options.size.height,this.status.cssClass=this.options.size.cssClass);this.element.css({width:this.status.width,height:this.status.height})},_addUiClass:function(){this.ancestorJq.length&&this.ancestorJq.addClass(this.status.cssClass)},_removeUiClass:function(){this.ancestorJq.length&&this.ancestorJq.removeClass(this.status.cssClass)},
_updateSize:function(){this.internal.poster.jq.css({width:this.status.width,height:this.status.height});!this.status.waitForPlay&&this.html.active&&this.status.video||this.html.video.available&&this.html.used&&this.status.nativeVideoControls?this.internal.video.jq.css({width:this.status.width,height:this.status.height}):!this.status.waitForPlay&&this.flash.active&&this.status.video&&this.internal.flash.jq.css({width:this.status.width,height:this.status.height})},_updateAutohide:function(){var a=this,
c=function(){a.css.jq.gui.fadeIn(a.options.autohide.fadeIn,function(){clearTimeout(a.internal.autohideId);a.internal.autohideId=setTimeout(function(){a.css.jq.gui.fadeOut(a.options.autohide.fadeOut)},a.options.autohide.hold)})};this.css.jq.gui.length&&(this.css.jq.gui.stop(!0,!0),clearTimeout(this.internal.autohideId),this.element.unbind(".jPlayerAutohide"),this.css.jq.gui.unbind(".jPlayerAutohide"),this.status.nativeVideoControls?this.css.jq.gui.hide():this.options.fullWindow&&this.options.autohide.full||
!this.options.fullWindow&&this.options.autohide.restored?(this.element.bind("mousemove.jPlayer.jPlayerAutohide",c),this.css.jq.gui.bind("mousemove.jPlayer.jPlayerAutohide",c),this.css.jq.gui.hide()):this.css.jq.gui.show())},fullScreen:function(){this._setOption("fullScreen",!0)},restoreScreen:function(){this._setOption("fullScreen",!1)},_fullscreenAddEventListeners:function(){var a=this,c=b.jPlayer.nativeFeatures.fullscreen;c.api.fullscreenEnabled&&c.event.fullscreenchange&&("function"!==typeof this.internal.fullscreenchangeHandler&&
(this.internal.fullscreenchangeHandler=function(){a._fullscreenchange()}),document.addEventListener(c.event.fullscreenchange,this.internal.fullscreenchangeHandler,!1))},_fullscreenRemoveEventListeners:function(){var a=b.jPlayer.nativeFeatures.fullscreen;this.internal.fullscreenchangeHandler&&document.addEventListener(a.event.fullscreenchange,this.internal.fullscreenchangeHandler,!1)},_fullscreenchange:function(){this.options.fullScreen&&!b.jPlayer.nativeFeatures.fullscreen.api.fullscreenElement()&&
this._setOption("fullScreen",!1)},_requestFullscreen:function(){var a=this.ancestorJq.length?this.ancestorJq[0]:this.element[0],c=b.jPlayer.nativeFeatures.fullscreen;c.used.webkitVideo&&(a=this.htmlElement.video);c.api.fullscreenEnabled&&c.api.requestFullscreen(a)},_exitFullscreen:function(){var a=b.jPlayer.nativeFeatures.fullscreen,c;a.used.webkitVideo&&(c=this.htmlElement.video);a.api.fullscreenEnabled&&a.api.exitFullscreen(c)},_html_initMedia:function(a){var c=b(this.htmlElement.media).empty();
b.each(a.track||[],function(a,b){var g=document.createElement("track");g.setAttribute("kind",b.kind?b.kind:"");g.setAttribute("src",b.src?b.src:"");g.setAttribute("srclang",b.srclang?b.srclang:"");g.setAttribute("label",b.label?b.label:"");b.def&&g.setAttribute("default",b.def);c.append(g)});this.htmlElement.media.src=this.status.src;"none"!==this.options.preload&&this._html_load();this._trigger(b.jPlayer.event.timeupdate)},_html_setFormat:function(a){var c=this;b.each(this.formats,function(b,e){if(c.html.support[e]&&
a[e])return c.status.src=a[e],c.status.format[e]=!0,c.status.formatType=e,!1})},_html_setAudio:function(a){this._html_setFormat(a);this.htmlElement.media=this.htmlElement.audio;this._html_initMedia(a)},_html_setVideo:function(a){this._html_setFormat(a);this.status.nativeVideoControls&&(this.htmlElement.video.poster=this._validString(a.poster)?a.poster:"");this.htmlElement.media=this.htmlElement.video;this._html_initMedia(a)},_html_resetMedia:function(){this.htmlElement.media&&(this.htmlElement.media.id!==
this.internal.video.id||this.status.nativeVideoControls||this.internal.video.jq.css({width:"0px",height:"0px"}),this.htmlElement.media.pause())},_html_clearMedia:function(){this.htmlElement.media&&(this.htmlElement.media.src="about:blank",this.htmlElement.media.load())},_html_load:function(){this.status.waitForLoad&&(this.status.waitForLoad=!1,this.htmlElement.media.load());clearTimeout(this.internal.htmlDlyCmdId)},_html_play:function(a){var b=this,d=this.htmlElement.media;this._html_load();if(isNaN(a))d.play();
else{this.internal.cmdsIgnored&&d.play();try{if(!d.seekable||"object"===typeof d.seekable&&0<d.seekable.length)d.currentTime=a,d.play();else throw 1;}catch(e){this.internal.htmlDlyCmdId=setTimeout(function(){b.play(a)},250);return}}this._html_checkWaitForPlay()},_html_pause:function(a){var b=this,d=this.htmlElement.media;0<a?this._html_load():clearTimeout(this.internal.htmlDlyCmdId);d.pause();if(!isNaN(a))try{if(!d.seekable||"object"===typeof d.seekable&&0<d.seekable.length)d.currentTime=a;else throw 1;
}catch(e){this.internal.htmlDlyCmdId=setTimeout(function(){b.pause(a)},250);return}0<a&&this._html_checkWaitForPlay()},_html_playHead:function(a){var b=this,d=this.htmlElement.media;this._html_load();try{if("object"===typeof d.seekable&&0<d.seekable.length)d.currentTime=a*d.seekable.end(d.seekable.length-1)/100;else if(0<d.duration&&!isNaN(d.duration))d.currentTime=a*d.duration/100;else throw"e";}catch(e){this.internal.htmlDlyCmdId=setTimeout(function(){b.playHead(a)},250);return}this.status.waitForLoad||
this._html_checkWaitForPlay()},_html_checkWaitForPlay:function(){this.status.waitForPlay&&(this.status.waitForPlay=!1,this.css.jq.videoPlay.length&&this.css.jq.videoPlay.hide(),this.status.video&&(this.internal.poster.jq.hide(),this.internal.video.jq.css({width:this.status.width,height:this.status.height})))},_html_setProperty:function(a,b){this.html.audio.available&&(this.htmlElement.audio[a]=b);this.html.video.available&&(this.htmlElement.video[a]=b)},_flash_setAudio:function(a){var c=this;try{b.each(this.formats,
function(b,d){if(c.flash.support[d]&&a[d]){switch(d){case "m4a":case "fla":c._getMovie().fl_setAudio_m4a(a[d]);break;case "mp3":c._getMovie().fl_setAudio_mp3(a[d]);break;case "rtmpa":c._getMovie().fl_setAudio_rtmp(a[d])}c.status.src=a[d];c.status.format[d]=!0;c.status.formatType=d;return!1}}),"auto"===this.options.preload&&(this._flash_load(),this.status.waitForLoad=!1)}catch(d){this._flashError(d)}},_flash_setVideo:function(a){var c=this;try{b.each(this.formats,function(b,d){if(c.flash.support[d]&&
a[d]){switch(d){case "m4v":case "flv":c._getMovie().fl_setVideo_m4v(a[d]);break;case "rtmpv":c._getMovie().fl_setVideo_rtmp(a[d])}c.status.src=a[d];c.status.format[d]=!0;c.status.formatType=d;return!1}}),"auto"===this.options.preload&&(this._flash_load(),this.status.waitForLoad=!1)}catch(d){this._flashError(d)}},_flash_resetMedia:function(){this.internal.flash.jq.css({width:"0px",height:"0px"});this._flash_pause(NaN)},_flash_clearMedia:function(){try{this._getMovie().fl_clearMedia()}catch(a){this._flashError(a)}},
_flash_load:function(){try{this._getMovie().fl_load()}catch(a){this._flashError(a)}this.status.waitForLoad=!1},_flash_play:function(a){try{this._getMovie().fl_play(a)}catch(b){this._flashError(b)}this.status.waitForLoad=!1;this._flash_checkWaitForPlay()},_flash_pause:function(a){try{this._getMovie().fl_pause(a)}catch(b){this._flashError(b)}0<a&&(this.status.waitForLoad=!1,this._flash_checkWaitForPlay())},_flash_playHead:function(a){try{this._getMovie().fl_play_head(a)}catch(b){this._flashError(b)}this.status.waitForLoad||
this._flash_checkWaitForPlay()},_flash_checkWaitForPlay:function(){this.status.waitForPlay&&(this.status.waitForPlay=!1,this.css.jq.videoPlay.length&&this.css.jq.videoPlay.hide(),this.status.video&&(this.internal.poster.jq.hide(),this.internal.flash.jq.css({width:this.status.width,height:this.status.height})))},_flash_volume:function(a){try{this._getMovie().fl_volume(a)}catch(b){this._flashError(b)}},_flash_mute:function(a){try{this._getMovie().fl_mute(a)}catch(b){this._flashError(b)}},_getMovie:function(){return document[this.internal.flash.id]},
_getFlashPluginVersion:function(){var a=0,b;if(window.ActiveXObject)try{if(b=new ActiveXObject("ShockwaveFlash.ShockwaveFlash")){var d=b.GetVariable("$version");d&&(d=d.split(" ")[1].split(","),a=parseInt(d[0],10)+"."+parseInt(d[1],10))}}catch(e){}else navigator.plugins&&0<navigator.mimeTypes.length&&(b=navigator.plugins["Shockwave Flash"])&&(a=navigator.plugins["Shockwave Flash"].description.replace(/.*\s(\d+\.\d+).*/,"$1"));return 1*a},_checkForFlash:function(a){var b=!1;this._getFlashPluginVersion()>=
a&&(b=!0);return b},_validString:function(a){return a&&"string"===typeof a},_limitValue:function(a,b,d){return a<b?b:a>d?d:a},_urlNotSetError:function(a){this._error({type:b.jPlayer.error.URL_NOT_SET,context:a,message:b.jPlayer.errorMsg.URL_NOT_SET,hint:b.jPlayer.errorHint.URL_NOT_SET})},_flashError:function(a){var c;c=this.internal.ready?"FLASH_DISABLED":"FLASH";this._error({type:b.jPlayer.error[c],context:this.internal.flash.swf,message:b.jPlayer.errorMsg[c]+a.message,hint:b.jPlayer.errorHint[c]});
this.internal.flash.jq.css({width:"1px",height:"1px"})},_error:function(a){this._trigger(b.jPlayer.event.error,a);this.options.errorAlerts&&this._alert("Error!"+(a.message?"\n"+a.message:"")+(a.hint?"\n"+a.hint:"")+"\nContext: "+a.context)},_warning:function(a){this._trigger(b.jPlayer.event.warning,f,a);this.options.warningAlerts&&this._alert("Warning!"+(a.message?"\n"+a.message:"")+(a.hint?"\n"+a.hint:"")+"\nContext: "+a.context)},_alert:function(a){a="jPlayer "+this.version.script+" : id='"+this.internal.self.id+
"' : "+a;this.options.consoleAlerts?console&&console.log&&console.log(a):alert(a)},_emulateHtmlBridge:function(){var a=this;b.each(b.jPlayer.emulateMethods.split(/\s+/g),function(b,d){a.internal.domNode[d]=function(b){a[d](b)}});b.each(b.jPlayer.event,function(c,d){var e=!0;b.each(b.jPlayer.reservedEvent.split(/\s+/g),function(a,b){if(b===c)return e=!1});e&&a.element.bind(d+".jPlayer.jPlayerHtml",function(){a._emulateHtmlUpdate();var b=document.createEvent("Event");b.initEvent(c,!1,!0);a.internal.domNode.dispatchEvent(b)})})},
_emulateHtmlUpdate:function(){var a=this;b.each(b.jPlayer.emulateStatus.split(/\s+/g),function(b,d){a.internal.domNode[d]=a.status[d]});b.each(b.jPlayer.emulateOptions.split(/\s+/g),function(b,d){a.internal.domNode[d]=a.options[d]})},_destroyHtmlBridge:function(){var a=this;this.element.unbind(".jPlayerHtml");b.each((b.jPlayer.emulateMethods+" "+b.jPlayer.emulateStatus+" "+b.jPlayer.emulateOptions).split(/\s+/g),function(b,d){delete a.internal.domNode[d]})}};b.jPlayer.error={FLASH:"e_flash",FLASH_DISABLED:"e_flash_disabled",
NO_SOLUTION:"e_no_solution",NO_SUPPORT:"e_no_support",URL:"e_url",URL_NOT_SET:"e_url_not_set",VERSION:"e_version"};b.jPlayer.errorMsg={FLASH:"jPlayer's Flash fallback is not configured correctly, or a command was issued before the jPlayer Ready event. Details: ",FLASH_DISABLED:"jPlayer's Flash fallback has been disabled by the browser due to the CSS rules you have used. Details: ",NO_SOLUTION:"No solution can be found by jPlayer in this browser. Neither HTML nor Flash can be used.",NO_SUPPORT:"It is not possible to play any media format provided in setMedia() on this browser using your current options.",
URL:"Media URL could not be loaded.",URL_NOT_SET:"Attempt to issue media playback commands, while no media url is set.",VERSION:"jPlayer "+b.jPlayer.prototype.version.script+" needs Jplayer.swf version "+b.jPlayer.prototype.version.needFlash+" but found "};b.jPlayer.errorHint={FLASH:"Check your swfPath option and that Jplayer.swf is there.",FLASH_DISABLED:"Check that you have not display:none; the jPlayer entity or any ancestor.",NO_SOLUTION:"Review the jPlayer options: support and supplied.",NO_SUPPORT:"Video or audio formats defined in the supplied option are missing.",
URL:"Check media URL is valid.",URL_NOT_SET:"Use setMedia() to set the media URL.",VERSION:"Update jPlayer files."};b.jPlayer.warning={CSS_SELECTOR_COUNT:"e_css_selector_count",CSS_SELECTOR_METHOD:"e_css_selector_method",CSS_SELECTOR_STRING:"e_css_selector_string",OPTION_KEY:"e_option_key"};b.jPlayer.warningMsg={CSS_SELECTOR_COUNT:"The number of css selectors found did not equal one: ",CSS_SELECTOR_METHOD:"The methodName given in jPlayer('cssSelector') is not a valid jPlayer method.",CSS_SELECTOR_STRING:"The methodCssSelector given in jPlayer('cssSelector') is not a String or is empty.",
OPTION_KEY:"The option requested in jPlayer('option') is undefined."};b.jPlayer.warningHint={CSS_SELECTOR_COUNT:"Check your css selector and the ancestor.",CSS_SELECTOR_METHOD:"Check your method name.",CSS_SELECTOR_STRING:"Check your css selector is a string.",OPTION_KEY:"Check your option name."}});




/*!
 * zeroclipboard
 * The ZeroClipboard library provides an easy way to copy text to the clipboard using an invisible Adobe Flash movie, and a JavaScript interface.
 * Copyright 2013 Jon Rohan, James M. Greene, .
 * Released under the MIT license
 * http://zeroclipboard.github.io/ZeroClipboard/
 * v1.2.0-beta.4
 */(function(){"use strict";var a=function(){var a=/\-([a-z])/g,b=function(a,b){return b.toUpperCase()};return function(c){return c.replace(a,b)}}(),b=function(b,c){var d,e,f,g,h,i;window.getComputedStyle?d=window.getComputedStyle(b,null).getPropertyValue(c):(e=a(c),b.currentStyle?d=b.currentStyle[e]:d=b.style[e]);if(c==="cursor")if(!d||d==="auto"){f=b.tagName.toLowerCase(),g=["a"];for(h=0,i=g.length;h<i;h++)if(f===g[h])return"pointer"}return d},c=function(a){if(!o.prototype._singleton)return;a||(a=window.event);var b;this!==window?b=this:a.target?b=a.target:a.srcElement&&(b=a.srcElement),o.prototype._singleton.setCurrent(b)},d=function(a,b,c){a.addEventListener?a.addEventListener(b,c,!1):a.attachEvent&&a.attachEvent("on"+b,c)},e=function(a,b,c){a.removeEventListener?a.removeEventListener(b,c,!1):a.detachEvent&&a.detachEvent("on"+b,c)},f=function(a,b){if(a.addClass)return a.addClass(b),a;if(b&&typeof b=="string"){var c=(b||"").split(/\s+/);if(a.nodeType===1)if(!a.className)a.className=b;else{var d=" "+a.className+" ",e=a.className;for(var f=0,g=c.length;f<g;f++)d.indexOf(" "+c[f]+" ")<0&&(e+=" "+c[f]);a.className=e.replace(/^\s+|\s+$/g,"")}}return a},g=function(a,b){if(a.removeClass)return a.removeClass(b),a;if(b&&typeof b=="string"||b===undefined){var c=(b||"").split(/\s+/);if(a.nodeType===1&&a.className)if(b){var d=(" "+a.className+" ").replace(/[\n\t]/g," ");for(var e=0,f=c.length;e<f;e++)d=d.replace(" "+c[e]+" "," ");a.className=d.replace(/^\s+|\s+$/g,"")}else a.className=""}return a},h=function(){var a,b,c,d=1;return typeof document.body.getBoundingClientRect=="function"&&(a=document.body.getBoundingClientRect(),b=a.right-a.left,c=document.body.offsetWidth,d=Math.round(b/c*100)/100),d},i=function(a){var c={left:0,top:0,width:0,height:0,zIndex:999999999},d=b(a,"z-index");d&&d!=="auto"&&(c.zIndex=parseInt(d,10));if(a.getBoundingClientRect){var e=a.getBoundingClientRect(),f,g,i;"pageXOffset"in window&&"pageYOffset"in window?(f=window.pageXOffset,g=window.pageYOffset):(i=h(),f=Math.round(document.documentElement.scrollLeft/i),g=Math.round(document.documentElement.scrollTop/i));var j=document.documentElement.clientLeft||0,k=document.documentElement.clientTop||0;c.left=e.left+f-j,c.top=e.top+g-k,c.width="width"in e?e.width:e.right-e.left,c.height="height"in e?e.height:e.bottom-e.top}return c},j=function(a){var b=o.prototype._singleton;return b.options.useNoCache?(a.indexOf("?")>=0?"&nocache=":"?nocache=")+(new Date).getTime():""},k=function(a){var b=[];if(a.trustedDomains){var c;typeof a.trustedDomains=="string"&&a.trustedDomains?c=[a.trustedDomains]:"length"in a.trustedDomains&&(c=a.trustedDomains),b.push("trustedDomain="+encodeURIComponent(c.join(",")))}return typeof a.amdModuleId=="string"&&a.amdModuleId&&b.push("amdModuleId="+encodeURIComponent(a.amdModuleId)),typeof a.cjsModuleId=="string"&&a.cjsModuleId&&b.push("cjsModuleId="+encodeURIComponent(a.cjsModuleId)),b.join("&")},l=function(a,b){if(b.indexOf)return b.indexOf(a);for(var c=0,d=b.length;c<d;c++)if(b[c]===a)return c;return-1},m=function(a){if(typeof a=="string")throw new TypeError("ZeroClipboard doesn't accept query strings.");return a.length?a:[a]},n=function(a,b,c,d,e){e?window.setTimeout(function(){a.call(b,c,d)},0):a.call(b,c,d)},o=function(a,b){a&&(o.prototype._singleton||this).glue(a);if(o.prototype._singleton)return o.prototype._singleton;o.prototype._singleton=this,this.options={};for(var c in s)this.options[c]=s[c];for(var d in b)this.options[d]=b[d];this.handlers={},o.detectFlashSupport()&&v()},p,q=[];o.prototype.setCurrent=function(a){p=a,this.reposition();var c=a.getAttribute("title");c&&this.setTitle(c);var d=this.options.forceHandCursor===!0||b(a,"cursor")==="pointer";r.call(this,d)},o.prototype.setText=function(a){a&&a!==""&&(this.options.text=a,this.ready()&&this.flashBridge.setText(a))},o.prototype.setTitle=function(a){a&&a!==""&&this.htmlBridge.setAttribute("title",a)},o.prototype.setSize=function(a,b){this.ready()&&this.flashBridge.setSize(a,b)},o.prototype.setHandCursor=function(a){a=typeof a=="boolean"?a:!!a,r.call(this,a),this.options.forceHandCursor=a};var r=function(a){this.ready()&&this.flashBridge.setHandCursor(a)};o.version="1.2.0-beta.4";var s={moviePath:"ZeroClipboard.swf",trustedDomains:null,text:null,hoverClass:"zeroclipboard-is-hover",activeClass:"zeroclipboard-is-active",allowScriptAccess:"sameDomain",useNoCache:!0,forceHandCursor:!1};o.setDefaults=function(a){for(var b in a)s[b]=a[b]},o.destroy=function(){o.prototype._singleton.unglue(q);var a=o.prototype._singleton.htmlBridge;a.parentNode.removeChild(a),delete o.prototype._singleton},o.detectFlashSupport=function(){var a=!1;if(typeof ActiveXObject=="function")try{new ActiveXObject("ShockwaveFlash.ShockwaveFlash")&&(a=!0)}catch(b){}return!a&&navigator.mimeTypes["application/x-shockwave-flash"]&&(a=!0),a};var t=null,u=null,v=function(){var a=o.prototype._singleton,b=document.getElementById("global-zeroclipboard-html-bridge");if(!b){var c={};for(var d in a.options)c[d]=a.options[d];c.amdModuleId=t,c.cjsModuleId=u;var e=k(c),f='      <object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" id="global-zeroclipboard-flash-bridge" width="100%" height="100%">         <param name="movie" value="'+a.options.moviePath+j(a.options.moviePath)+'"/>         <param name="allowScriptAccess" value="'+a.options.allowScriptAccess+'"/>         <param name="scale" value="exactfit"/>         <param name="loop" value="false"/>         <param name="menu" value="false"/>         <param name="quality" value="best" />         <param name="bgcolor" value="#ffffff"/>         <param name="wmode" value="transparent"/>         <param name="flashvars" value="'+e+'"/>         <embed src="'+a.options.moviePath+j(a.options.moviePath)+'"           loop="false" menu="false"           quality="best" bgcolor="#ffffff"           width="100%" height="100%"           name="global-zeroclipboard-flash-bridge"           allowScriptAccess="always"           allowFullScreen="false"           type="application/x-shockwave-flash"           wmode="transparent"           pluginspage="http://www.macromedia.com/go/getflashplayer"           flashvars="'+e+'"           scale="exactfit">         </embed>       </object>';b=document.createElement("div"),b.id="global-zeroclipboard-html-bridge",b.setAttribute("class","global-zeroclipboard-container"),b.setAttribute("data-clipboard-ready",!1),b.style.position="absolute",b.style.left="-9999px",b.style.top="-9999px",b.style.width="15px",b.style.height="15px",b.style.zIndex="9999",b.innerHTML=f,document.body.appendChild(b)}a.htmlBridge=b,a.flashBridge=document["global-zeroclipboard-flash-bridge"]||b.children[0].lastElementChild};o.prototype.resetBridge=function(){this.htmlBridge.style.left="-9999px",this.htmlBridge.style.top="-9999px",this.htmlBridge.removeAttribute("title"),this.htmlBridge.removeAttribute("data-clipboard-text"),g(p,this.options.activeClass),p=null,this.options.text=null},o.prototype.ready=function(){var a=this.htmlBridge.getAttribute("data-clipboard-ready");return a==="true"||a===!0},o.prototype.reposition=function(){if(!p)return!1;var a=i(p);this.htmlBridge.style.top=a.top+"px",this.htmlBridge.style.left=a.left+"px",this.htmlBridge.style.width=a.width+"px",this.htmlBridge.style.height=a.height+"px",this.htmlBridge.style.zIndex=a.zIndex+1,this.setSize(a.width,a.height)},o.dispatch=function(a,b){o.prototype._singleton.receiveEvent(a,b)},o.prototype.on=function(a,b){var c=a.toString().split(/\s/g);for(var d=0;d<c.length;d++)a=c[d].toLowerCase().replace(/^on/,""),this.handlers[a]||(this.handlers[a]=b);this.handlers.noflash&&!o.detectFlashSupport()&&this.receiveEvent("onNoFlash",null)},o.prototype.addEventListener=o.prototype.on,o.prototype.off=function(a,b){var c=a.toString().split(/\s/g);for(var d=0;d<c.length;d++){a=c[d].toLowerCase().replace(/^on/,"");for(var e in this.handlers)e===a&&this.handlers[e]===b&&delete this.handlers[e]}},o.prototype.removeEventListener=o.prototype.off,o.prototype.receiveEvent=function(a,b){a=a.toString().toLowerCase().replace(/^on/,"");var c=p,d=!0;switch(a){case"load":if(b&&parseFloat(b.flashVersion.replace(",",".").replace(/[^0-9\.]/gi,""))<10){this.receiveEvent("onWrongFlash",{flashVersion:b.flashVersion});return}this.htmlBridge.setAttribute("data-clipboard-ready",!0);break;case"mouseover":f(c,this.options.hoverClass);break;case"mouseout":g(c,this.options.hoverClass),this.resetBridge();break;case"mousedown":f(c,this.options.activeClass);break;case"mouseup":g(c,this.options.activeClass);break;case"datarequested":var e=c.getAttribute("data-clipboard-target"),h=e?document.getElementById(e):null;if(h){var i=h.value||h.textContent||h.innerText;i&&this.setText(i)}else{var j=c.getAttribute("data-clipboard-text");j&&this.setText(j)}d=!1;break;case"complete":this.options.text=null}if(this.handlers[a]){var k=this.handlers[a];typeof k=="string"&&typeof window[k]=="function"&&(k=window[k]),typeof k=="function"&&n(k,c,this,b,d)}},o.prototype.glue=function(a){a=m(a);for(var b=0;b<a.length;b++)l(a[b],q)==-1&&(q.push(a[b]),d(a[b],"mouseover",c))},o.prototype.unglue=function(a){a=m(a);for(var b=0;b<a.length;b++){e(a[b],"mouseover",c);var d=l(a[b],q);d!=-1&&q.splice(d,1)}},typeof define=="function"&&define.amd?define(["require","exports","module"],function(a,b,c){return t=c&&c.id||null,o}):typeof module!="undefined"&&module?(u=module.id||null,module.exports=o):window.ZeroClipboard=o})();


// Some default UI customizations
// Datepicker localization
$.datepicker.regional['ru'] = {
	closeText: 'Закрыть',
	prevText: '&#x3c;Пред',
	nextText: 'След&#x3e;',
	currentText: 'Сегодня',
	monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь',
	'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
	monthNamesShort:['Январь','Февраль','Март','Апрель','Май','Июнь',
	'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
	dayNames: ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'],
	dayNamesShort: ['вск','пнд','втр','срд','чтв','птн','сбт'],
	dayNamesMin: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
	weekHeader: 'Не',
	dateFormat: 'dd.mm.yy',
	firstDay: 1,
	isRTL: false,
	showMonthAfterYear: false,
	yearSuffix: ''
};
$.datepicker.setDefaults($.datepicker.regional['ru']);




/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.9
 *
 * Requires: jQuery 1.2.2+
 */

(function (factory) {
	if ( typeof define === 'function' && define.amd ) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS style for Browserify
		module.exports = factory;
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var toFix  = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
		toBind = ( 'onwheel' in document || document.documentMode >= 9 ) ?
					['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
		slice  = Array.prototype.slice,
		nullLowestDeltaTimeout, lowestDelta;

	if ( $.event.fixHooks ) {
		for ( var i = toFix.length; i; ) {
			$.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
		}
	}

	var special = $.event.special.mousewheel = {
		version: '3.1.9',

		setup: function() {
			if ( this.addEventListener ) {
				for ( var i = toBind.length; i; ) {
					this.addEventListener( toBind[--i], handler, false );
				}
			} else {
				this.onmousewheel = handler;
			}
			// Store the line height and page height for this particular element
			$.data(this, 'mousewheel-line-height', special.getLineHeight(this));
			$.data(this, 'mousewheel-page-height', special.getPageHeight(this));
		},

		teardown: function() {
			if ( this.removeEventListener ) {
				for ( var i = toBind.length; i; ) {
					this.removeEventListener( toBind[--i], handler, false );
				}
			} else {
				this.onmousewheel = null;
			}
		},

		getLineHeight: function(elem) {
			return parseInt($(elem)['offsetParent' in $.fn ? 'offsetParent' : 'parent']().css('fontSize'), 10);
		},

		getPageHeight: function(elem) {
			return $(elem).height();
		},

		settings: {
			adjustOldDeltas: true
		}
	};

	$.fn.extend({
		mousewheel: function(fn) {
			return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
		},

		unmousewheel: function(fn) {
			return this.unbind('mousewheel', fn);
		}
	});


	function handler(event) {
		var orgEvent   = event || window.event,
			args       = slice.call(arguments, 1),
			delta      = 0,
			deltaX     = 0,
			deltaY     = 0,
			absDelta   = 0;
		event = $.event.fix(orgEvent);
		event.type = 'mousewheel';

		// Old school scrollwheel delta
		if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1;      }
		if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;       }
		if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY;      }
		if ( 'wheelDeltaX' in orgEvent ) { deltaX = orgEvent.wheelDeltaX * -1; }

		// Firefox < 17 horizontal scrolling related to DOMMouseScroll event
		if ( 'axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
			deltaX = deltaY * -1;
			deltaY = 0;
		}

		// Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
		delta = deltaY === 0 ? deltaX : deltaY;

		// New school wheel delta (wheel event)
		if ( 'deltaY' in orgEvent ) {
			deltaY = orgEvent.deltaY * -1;
			delta  = deltaY;
		}
		if ( 'deltaX' in orgEvent ) {
			deltaX = orgEvent.deltaX;
			if ( deltaY === 0 ) { delta  = deltaX * -1; }
		}

		// No change actually happened, no reason to go any further
		if ( deltaY === 0 && deltaX === 0 ) { return; }

		// Need to convert lines and pages to pixels if we aren't already in pixels
		// There are three delta modes:
		//   * deltaMode 0 is by pixels, nothing to do
		//   * deltaMode 1 is by lines
		//   * deltaMode 2 is by pages
		if ( orgEvent.deltaMode === 1 ) {
			var lineHeight = $.data(this, 'mousewheel-line-height');
			delta  *= lineHeight;
			deltaY *= lineHeight;
			deltaX *= lineHeight;
		} else if ( orgEvent.deltaMode === 2 ) {
			var pageHeight = $.data(this, 'mousewheel-page-height');
			delta  *= pageHeight;
			deltaY *= pageHeight;
			deltaX *= pageHeight;
		}

		// Store lowest absolute delta to normalize the delta values
		absDelta = Math.max( Math.abs(deltaY), Math.abs(deltaX) );

		if ( !lowestDelta || absDelta < lowestDelta ) {
			lowestDelta = absDelta;

			// Adjust older deltas if necessary
			if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
				lowestDelta /= 40;
			}
		}

		// Adjust older deltas if necessary
		if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
			// Divide all the things by 40!
			delta  /= 40;
			deltaX /= 40;
			deltaY /= 40;
		}

		// Get a whole, normalized value for the deltas
		delta  = Math[ delta  >= 1 ? 'floor' : 'ceil' ](delta  / lowestDelta);
		deltaX = Math[ deltaX >= 1 ? 'floor' : 'ceil' ](deltaX / lowestDelta);
		deltaY = Math[ deltaY >= 1 ? 'floor' : 'ceil' ](deltaY / lowestDelta);

		// Add information to the event object
		event.deltaX = deltaX;
		event.deltaY = deltaY;
		event.deltaFactor = lowestDelta;
		// Go ahead and set deltaMode to 0 since we converted to pixels
		// Although this is a little odd since we overwrite the deltaX/Y
		// properties with normalized deltas.
		event.deltaMode = 0;

		// Add event and delta to the front of the arguments
		args.unshift(event, delta, deltaX, deltaY);

		// Clearout lowestDelta after sometime to better
		// handle multiple device types that give different
		// a different lowestDelta
		// Ex: trackpad = 3 and mouse wheel = 120
		if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
		nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

		return ($.event.dispatch || $.event.handle).apply(this, args);
	}

	function nullLowestDelta() {
		lowestDelta = null;
	}

	function shouldAdjustOldDeltas(orgEvent, absDelta) {
		// If this is an older event and the delta is divisable by 120,
		// then we are assuming that the browser is treating this as an
		// older mouse wheel event and that we should divide the deltas
		// by 40 to try and get a more usable deltaFactor.
		// Side note, this actually impacts the reported scroll distance
		// in older browsers and can cause scrolling to be slower than native.
		// Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
		return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
	}

}));




/*scrollbar */
//Vertical slider script by Simon Battersby
//Reference: http://www.simonbattersby.com/blog/vertical-scrollbar-using-jquery-ui-slider/
//standard slider WITH HANDLE IMAGE
//DON'T LINK DIRECTLY TO THIS FILE - IT EATS MY BANDWIDTH. TAKE A COPY AND STORE ON YOUR OWN SERVER
function setSlider($scrollpane){//$scrollpane is the div to be scrolled
	//set options for handle image - amend this to true or false as required
	var handleImage = true;
	//change the main div to overflow-hidden as we can use the slider now
	$scrollpane.css('overflow','hidden');
	//f it's not there, wrap a div around the contents of the scrollpane to allow the scrolling
	if ($scrollpane.find('.scroll-content').length==0) $scrollpane.children().wrapAll('<\div class="scroll-content"> /');
	//compare the height of the scroll content to the scroll pane to see if we need a scrollbar
	var difference = $scrollpane.find('.scroll-content').height()-$scrollpane.height();//eg it's 200px longer
	$scrollpane.data('difference',difference);
	if(difference<=0 && $scrollpane.find('.slider-wrap').length>0)//scrollbar exists but is no longer required
	{
		$scrollpane.find('.slider-wrap').remove();//remove the scrollbar
		$scrollpane.find('.scroll-content').css({top:0});//and reset the top position
	}
	if(difference>0)//if the scrollbar is needed, set it up...
	{
		var proportion = difference / $scrollpane.find('.scroll-content').height();//eg 200px/500px
		var handleHeight = Math.round((1-proportion)*$scrollpane.height());//set the proportional height - round it to make sure everything adds up correctly later on
		handleHeight -= handleHeight%2;
		//if the slider has already been set up and this function is called again, we may need to set the position of the slider handle
		var contentposition = $scrollpane.find('.scroll-content').position();
		var sliderInitial = 100*(1-Math.abs(contentposition.top)/difference);
		if($scrollpane.find('.slider-wrap').length==0)//if the slider-wrap doesn't exist, insert it and set the initial value
			{
			$scrollpane.append('<\div class="slider-wrap"><\div class="slider-vertical"><\/div><\/div>');//append the necessary divs so they're only there if needed
			sliderInitial = 100;
			}
		$scrollpane.find('.slider-wrap').height($scrollpane.height());//set the height of the slider bar to that of the scroll pane
		//set up the slider
		$scrollpane.find('.slider-vertical').slider({
			orientation: 'vertical',
			min: 0,
			max: 100,
			range:'min',
			value: sliderInitial,
			slide: function(event, ui) {
				var topValue = -((100-ui.value)*difference/100);
				$scrollpane.find('.scroll-content').css({top:topValue});//move the top up (negative value) by the percentage the slider has been moved times the difference in height
				$('ui-slider-range').height(ui.value+'%');//set the height of the range element
			},
			change: function(event, ui) {
				var topValue = -((100-ui.value)*($scrollpane.find('.scroll-content').height()-$scrollpane.height())/100);//recalculate the difference on change
				$scrollpane.find('.scroll-content').css({top:topValue});//move the top up (negative value) by the percentage the slider has been moved times the difference in height
				$('ui-slider-range').height(ui.value+'%');
			}
		});
		//set the handle height and bottom margin so the middle of the handle is in line with the slider
		$scrollpane.find(".ui-slider-handle").css({height:handleHeight,'margin-bottom':-0.5*handleHeight});
		var origSliderHeight = $scrollpane.height();//read the original slider height
		var sliderHeight = origSliderHeight - handleHeight ;//the height through which the handle can move needs to be the original height minus the handle height
		var sliderMargin = (origSliderHeight - sliderHeight)*0.5;//so the slider needs to have both top and bottom margins equal to half the difference
		$scrollpane.find(".ui-slider").css({height:sliderHeight,'margin-top':sliderMargin});//set the slider height and margins
		$scrollpane.find(".ui-slider-range").css({bottom:-sliderMargin});//position the slider-range div at the top of the slider container
		//if required create elements to hold the images for the scrollbar handle
		if (handleImage){
			$(".ui-slider-handle").append('<span class="scrollbar-top" />');
			$(".ui-slider-handle").append('<span class="scrollbar-bottom" />');
			$(".ui-slider-handle").append('<span class="scrollbar-grip" />');
		}
	}//end if
	//code for clicks on the scrollbar outside the slider
	$(".ui-slider").click(function(event){//stop any clicks on the slider propagating through to the code below
		event.stopPropagation();
	});
	$(".slider-wrap").click(function(event){//clicks on the wrap outside the slider range
		var offsetTop = $(this).offset().top;//read the offset of the scroll pane
		var clickValue = (event.pageY-offsetTop)*100/$(this).height();//find the click point, subtract the offset, and calculate percentage of the slider clicked
		$(this).find(".slider-vertical").slider("value", 100-clickValue);//set the new value of the slider
	});
	//additional code for mousewheel
	if($.fn.mousewheel){
		$scrollpane.unmousewheel();//remove any previously attached mousewheel events
		$scrollpane.mousewheel(function(event, delta){
			var speed = Math.round(5000/$scrollpane.data('difference'));
			if (speed <1) speed = 1;
			if (speed >100) speed = 100;
			var sliderVal = $(this).find(".slider-vertical").slider("value");//read current value of the slider
			sliderVal += (delta*speed);//increment the current value
			$(this).find(".slider-vertical").slider("value", sliderVal);//and set the new value of the slider
			event.preventDefault();//stop any default behaviour
		});
	}
} 

/*
	Masked Input plugin for jQuery
	Copyright (c) 2007-2013 Josh Bush (digitalbush.com)
	Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license)
	Version: 1.3.1
*/
(function(e){function t(){var e=document.createElement("input"),t="onpaste";return e.setAttribute(t,""),"function"==typeof e[t]?"paste":"input"}var n,a=t()+".mask",r=navigator.userAgent,i=/iphone/i.test(r),o=/android/i.test(r);e.mask={definitions:{9:"[0-9]",a:"[A-Za-z]","*":"[A-Za-z0-9]"},dataName:"rawMaskFn",placeholder:"_"},e.fn.extend({caret:function(e,t){var n;if(0!==this.length&&!this.is(":hidden"))return"number"==typeof e?(t="number"==typeof t?t:e,this.each(function(){this.setSelectionRange?this.setSelectionRange(e,t):this.createTextRange&&(n=this.createTextRange(),n.collapse(!0),n.moveEnd("character",t),n.moveStart("character",e),n.select())})):(this[0].setSelectionRange?(e=this[0].selectionStart,t=this[0].selectionEnd):document.selection&&document.selection.createRange&&(n=document.selection.createRange(),e=0-n.duplicate().moveStart("character",-1e5),t=e+n.text.length),{begin:e,end:t})},unmask:function(){return this.trigger("unmask")},mask:function(t,r){var c,l,s,u,f,h;return!t&&this.length>0?(c=e(this[0]),c.data(e.mask.dataName)()):(r=e.extend({placeholder:e.mask.placeholder,completed:null},r),l=e.mask.definitions,s=[],u=h=t.length,f=null,e.each(t.split(""),function(e,t){"?"==t?(h--,u=e):l[t]?(s.push(RegExp(l[t])),null===f&&(f=s.length-1)):s.push(null)}),this.trigger("unmask").each(function(){function c(e){for(;h>++e&&!s[e];);return e}function d(e){for(;--e>=0&&!s[e];);return e}function m(e,t){var n,a;if(!(0>e)){for(n=e,a=c(t);h>n;n++)if(s[n]){if(!(h>a&&s[n].test(R[a])))break;R[n]=R[a],R[a]=r.placeholder,a=c(a)}b(),x.caret(Math.max(f,e))}}function p(e){var t,n,a,i;for(t=e,n=r.placeholder;h>t;t++)if(s[t]){if(a=c(t),i=R[t],R[t]=n,!(h>a&&s[a].test(i)))break;n=i}}function g(e){var t,n,a,r=e.which;8===r||46===r||i&&127===r?(t=x.caret(),n=t.begin,a=t.end,0===a-n&&(n=46!==r?d(n):a=c(n-1),a=46===r?c(a):a),k(n,a),m(n,a-1),e.preventDefault()):27==r&&(x.val(S),x.caret(0,y()),e.preventDefault())}function v(t){var n,a,i,l=t.which,u=x.caret();t.ctrlKey||t.altKey||t.metaKey||32>l||l&&(0!==u.end-u.begin&&(k(u.begin,u.end),m(u.begin,u.end-1)),n=c(u.begin-1),h>n&&(a=String.fromCharCode(l),s[n].test(a)&&(p(n),R[n]=a,b(),i=c(n),o?setTimeout(e.proxy(e.fn.caret,x,i),0):x.caret(i),r.completed&&i>=h&&r.completed.call(x))),t.preventDefault())}function k(e,t){var n;for(n=e;t>n&&h>n;n++)s[n]&&(R[n]=r.placeholder)}function b(){x.val(R.join(""))}function y(e){var t,n,a=x.val(),i=-1;for(t=0,pos=0;h>t;t++)if(s[t]){for(R[t]=r.placeholder;pos++<a.length;)if(n=a.charAt(pos-1),s[t].test(n)){R[t]=n,i=t;break}if(pos>a.length)break}else R[t]===a.charAt(pos)&&t!==u&&(pos++,i=t);return e?b():u>i+1?(x.val(""),k(0,h)):(b(),x.val(x.val().substring(0,i+1))),u?t:f}var x=e(this),R=e.map(t.split(""),function(e){return"?"!=e?l[e]?r.placeholder:e:void 0}),S=x.val();x.data(e.mask.dataName,function(){return e.map(R,function(e,t){return s[t]&&e!=r.placeholder?e:null}).join("")}),x.attr("readonly")||x.one("unmask",function(){x.unbind(".mask").removeData(e.mask.dataName)}).bind("focus.mask",function(){clearTimeout(n);var e;S=x.val(),e=y(),n=setTimeout(function(){b(),e==t.length?x.caret(0,e):x.caret(e)},10)}).bind("blur.mask",function(){y(),x.val()!=S&&x.change()}).bind("keydown.mask",g).bind("keypress.mask",v).bind(a,function(){setTimeout(function(){var e=y(!0);x.caret(e),r.completed&&e==x.val().length&&r.completed.call(x)},0)}),y()}))}})})(jQuery);
/* Author:
	http://notamedia.ru/
*/

var WND, DOC, BODY, touchdevice = false;
$(function() {
	WND = $(window), DOC = $(document), BODY = $('body');
	if (!$('html').hasClass('no-touch')) touchdevice = true;
	$('.iblock').cleanWS();
	$('.liveplayer').initLivePlayer();

	$('.liveprogrammes,.livetitle').refreshLivePopUp();
}); // DOM loaded

$(window).load(function(){
});

function setQuality(id, element, url) {
    var btn = $(element);

    btn.addClass('active').siblings().removeClass('active');

    $('#notaplayer_' + id)
        .jPlayer("setMedia", { mp3: 'http://ice912.echo.msk.ru:9120/' + url })
        .jPlayer("playHead", 0)
        .jPlayer("play");
}

(function($) { //create closure
$.fn.refreshLivePopUp = function(options){
	this.each(function(){
		var cont = $(this), cn = (cont.hasClass('livetitle'))?'livetitle':'liveprogrammes' , url = cont.data('url'), nextquery = cont.data('nextquery');
                function updateBlock(cn, url, nextquery) {
			var cont = $('.'+cn), url = cont.data('url'), nextquery = parseInt(cont.data('nextquery'));
			if (cn && url && nextquery) {
				$.ajax({
					url: url,
					method: 'GET',
					success: function(html){
						cont.before(html);
						cont.remove();
						window.setTimeout(function(){
							updateBlock(cn, url, nextquery)
						}, nextquery);
					}
				});
			}                	
                }
		window.setTimeout(function(){
			updateBlock(cn, url, nextquery)
		}, nextquery);
	});
}
})(jQuery);

(function($) { //create closure
$.fn.initLivePlayer = function(options){
	this.each(function(){
		var mainplayer = $(this), audioplayer = $('<div class="audioplayer"></div>').prependTo(mainplayer),
		title = mainplayer.find('.title').text(),
		setMedia = {}, supplied = '', id= mainplayer.attr('id')? mainplayer.attr('id') : 'a'+new Date().getTime();
		mainplayer.find('.media a').each(function(i){
			var a = $(this); supplied += (i>0) ? ','+a.attr('rel'):a.attr('rel');
			setMedia[a.attr('rel')] = a.attr('href');
		});

		// настройки берем из атрибута data-* контейнера
		var	width = (mainplayer.data('width'))? mainplayer.data('width') : 625,
			autoplay = (mainplayer.data('autoplay'))? mainplayer.data('autoplay') : false,
			volume = (mainplayer.data('volume'))? mainplayer.data('volume') : .6,
			mute = (mainplayer.data('mute'))? mainplayer.data('mute') : false,
			swfpath =  (mainplayer.data('swf'))? mainplayer.data('swf') : "/swf",
			currenttime, // в currenttime сохраним время по головке плеера во время воспроизведения
			duration, // длительность ролика (известна после loadedmetadata)
			firststart = false, seeking = false, playing = false, timetooltip, timetooltiptext; // tooltip для mouseover time

		var tpl = '<div id="container_'+id+'" class="nota_audio">'+
				'<div class="nota_type-single">'+
					'<div id="notaplayer_'+id+'" class="nota_jplayer"></div>'+
					'<div class="nota_gui">'+
						'<div class="nota_interface">'+
							'<div class="nota_title-container">'+
								'<div class="nota_title">'+ 
									title +
								'</div>'+
							'</div>'+
							'<div class="nota_progress-container">'+
								'<div class="nota_progress">'+
									'<div class="nota_seek-bar">'+
										'<div class="nota_play-bar"></div>'+
										'<div class="nota_time-container">'+
											'<span class="nota_current-time"></span> / '+
											'<span class="nota_duration"></span>'+
										'</div>'+
									'</div>'+
								'</div><div class="nota_time-tooltip"><span>00:00</span><i></i></div>'+
							'</div>'+
							'<div class="nota_controls-holder">'+
								'<div class="nota_controls">'+
									'<a href="javascript:;" class="nota_play" tabindex="1"><span>воспр.</span></a>'+
									'<a href="javascript:;" class="nota_pause" tabindex="1"><span>пауза</span></a>'+
									'<a href="javascript:;" class="nota_stop" tabindex="1"><span>стоп</span></a>'+
                                    '<div class="nota_quality">Качество: '+
                                        '<a href="javascript:;" onclick="setQuality(\''+id+'\', this, \'stream\')" class="nota_quality_item active" tabindex="1">обычное</a> / '+
                                        '<a href="javascript:;" onclick="setQuality(\''+id+'\', this, \'stream2\')" class="nota_quality_item" tabindex="1">высокое</a>'+
									'</div>'+
									'<div class="nota_volume-controls">'+
										'<a href="javascript:;" class="nota_mute" tabindex="1" title="выкл."><span>выкл.</span></a>'+
										'<a href="javascript:;" class="nota_unmute" tabindex="1" title="вкл."><span>вкл.</span></a>'+
										'<a href="javascript:;" class="nota_volume-max" tabindex="1" title="max volume"><span>вжарить</span></a>'+
										'<div class="nota_volume-bar">'+
											'<div class="nota_volume-bar-value"><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
										'</div>'+
									'</div>'+
								'</div>'+
							'</div>'+
						'</div>'+
					'</div>'+
					'<div class="nota_no-solution">'+
						'<span>Нужен плагин</span>'+
						'Для воспроизведения видео вам нужно обновить браузер или <a href="http://get.adobe.com/flashplayer/" target="_blank">Flash plugin</a>.'+
					'</div>'+
//					'<div class="nota_loader"></div>'+
				'</div>'+
			'</div>';
		$(tpl).appendTo(audioplayer);

		if (audioplayer.data('apready')!='apready') {
              		$('#notaplayer_'+id).jPlayer({
				ready: function (event) {
					var player // usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function f(){ log.history = log.history || []; log.history.push(arguments); if(this.console) { var args = arguments, newarr; args.callee = args.callee.caller; newarr = [].slice.call(args); if (typeof console.log === 'object') log.apply.call(console.log, console, newarr); else console.log.apply(console, newarr);}};

// make it safe to use console.log always
(function(a){function b(){}for(var c="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),d;!!(d=c.pop());){a[d]=a[d]||b;}})
(function(){try{console.log();return window.console;}catch(a){return (window.console={});}}());


// place any jQuery/helper plugins in here, instead of separate, slower script files.

/**
 * Copyright (c) 2007-2012 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Dual licensed under MIT and GPL.
 * @author Ariel Flesler
 * @version 1.4.3.1
 */
;(function($){var h=$.scrollTo=function(a,b,c){$(window).scrollTo(a,b,c)};h.defaults={axis:'xy',duration:parseFloat($.fn.jquery)>=1.3?0:1,limit:true};h.window=function(a){return $(window)._scrollable()};$.fn._scrollable=function(){return this.map(function(){var a=this,isWin=!a.nodeName||$.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!isWin)return a;var b=(a.contentWindow||a).document||a.ownerDocument||a;return/webkit/i.test(navigator.userAgent)||b.compatMode=='BackCompat'?b.body:b.documentElement})};$.fn.scrollTo=function(e,f,g){if(typeof f=='object'){g=f;f=0}if(typeof g=='function')g={onAfter:g};if(e=='max')e=9e9;g=$.extend({},h.defaults,g);f=f||g.duration;g.queue=g.queue&&g.axis.length>1;if(g.queue)f/=2;g.offset=both(g.offset);g.over=both(g.over);return this._scrollable().each(function(){if(e==null)return;var d=this,$elem=$(d),targ=e,toff,attr={},win=$elem.is('html,body');switch(typeof targ){case'number':case'string':if(/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(targ)){targ=both(targ);break}targ=$(targ,this);if(!targ.length)return;case'object':if(targ.is||targ.style)toff=(targ=$(targ)).offset()}$.each(g.axis.split(''),function(i,a){var b=a=='x'?'Left':'Top',pos=b.toLowerCase(),key='scroll'+b,old=d[key],max=h.max(d,a);if(toff){attr[key]=toff[pos]+(win?0:old-$elem.offset()[pos]);if(g.margin){attr[key]-=parseInt(targ.css('margin'+b))||0;attr[key]-=parseInt(targ.css('border'+b+'Width'))||0}attr[key]+=g.offset[pos]||0;if(g.over[pos])attr[key]+=targ[a=='x'?'width':'height']()*g.over[pos]}else{var c=targ[pos];attr[key]=c.slice&&c.slice(-1)=='%'?parseFloat(c)/100*max:c}if(g.limit&&/^\d+$/.test(attr[key]))attr[key]=attr[key]<=0?0:Math.min(attr[key],max);if(!i&&g.queue){if(old!=attr[key])animate(g.onAfterFirst);delete attr[key]}});animate(g.onAfter);function animate(a){$elem.animate(attr,f,g.easing,a&&function(){a.call(this,e,g)})}}).end()};h.max=function(a,b){var c=b=='x'?'Width':'Height',scroll='scroll'+c;if(!$(a).is('html,body'))return a[scroll]-$(a)[c.toLowerCase()]();var d='client'+c,html=a.ownerDocument.documentElement,body=a.ownerDocument.body;return Math.max(html[scroll],body[scroll])-Math.min(html[d],body[d])};function both(a){return typeof a=='object'?a:{top:a,left:a}}})(jQuery);









/* :after and :before fix for IE7 */
$(window).load(function(){
(function($){
	var patterns = {
		text: /^['"]?(.+?)["']?$/,
		url: /^url\(["']?(.+?)['"]?\)$/
	};
	function clean(content) {
		if(content && content.length) {
			var text = content.match(patterns.text)[1],
				url = text.match(patterns.url);
			return url ? '<img src="' + url[1] + '" />': text;
		}
	}
	function inject(prop, elem, content) {
		if(prop != 'after' && prop != 'before') return;
		if(content = clean(elem.currentStyle[prop])) {
			$(elem)[prop == 'before' ? 'prepend' : 'append'](
				$(document.createElement('span')).addClass(prop).html(content)
			);
		}
	}
	$.pseudo = function(elem) {
		inject('before', elem);
		inject('after', elem);
		elem.runtimeStyle.behavior = null;
	};
	if(document.createStyleSheet) {
		var o = document.createStyleSheet(null, 0);
		o.addRule('.dummy','display: static;');
		o.cssText = 'html, head, head *, body, *.before, *.after, *.before *, *.after * { behavior: none; } * { behavior: expression($.pseudo(this)); }';
	}
})(jQuery);
});

(function($) { //create closure
$.fn.fileupload = function(options){
	this.each(function(){
	        var fileInput = $(this).get(0);
	        var fileName = $(this).siblings('.cf_file_progress').get(0);
		fileInput.value = '';
		fileInput.onchange = HandleChanges;
		var accept = fileInput.accept.split(',');
		function HandleChanges() {
			file = fileInput.value;
			reWin = /.*\\(.*)/;
			var fileTitle = file.replace(reWin, "$1"); //выдираем название файла
			reUnix = /.*\/(.*)/;
			fileTitle = fileTitle.replace(reUnix, "$1"); //выдираем название файла
			fileName.innerHTML = fileTitle;
			var RegExExt =/.*\.(.*)/;
			var ext = fileTitle.replace(RegExExt, "$1");//и его расширение
			if (accept.indexOf('.'+ext.toLowerCase()) < 0) {
				fileInput.value = '';
				$(fileName).addClass('error').text('Недопустимый формат файла');
				window.setTimeout(function(){
					$(fileName).removeClass('error').text('');
				},3000);
			}
		}
	});
}
//end of closure
})(jQuery);



(function($) { //create closure
	$.fn.formValidator = function(options) {
		var defaults = {
		};
		var errors = 0; var msg='';
		this.each(function() {
			var o = $.extend(defaults, options), form = $(this), inputs = $(':input', form), il = inputs.length;
			inputs.removeClass('error').each(function(){
				var inp = $(this), par = inp.parents('.fieldrow'), val = inp.val(); gr = inp.data('group');
				inp.parent().removeClass('error'); 
//				inp.removeClass('error');
				par.find('em.error').css('display', 'none');
				if (inp.data('validate') || inp.data('required')) {
					if (inp.data('required') && inp.val() == '') { 
						inp.addClass('error'); 
						inp.parent().addClass('error'); 
						par.find('.error.required').css('display', 'block');
					} else {
						if (gr) {
							var brothers = inputs.filter('[data-group="' + gr + '"]'),
								vals = false;
							brothers.each(function() {
								var elval = $(this).is('[type="checkbox"]') ? $(this)[0].checked : $(this).val();
								if (elval) {
									vals = true;
								}
							});
							if (vals) {
								brothers
									.removeClass('error')
									.closest('div.fieldrow')
									.find('.error.group').hide();
							} else {
								brothers
									.addClass('error')
									.closest('div.fieldrow')
									.find('.error.group').show();
							}
						}
						switch(inp.data('validate')) {
							case 'number':
								if (val != '') {
									var validchars="-+0123456789. ";
									for (var i=val.length-1; i>=0; i--) {
										var x = new String(val.charAt(i));
										var checker = validchars.lastIndexOf(x) > -1;
										if (!checker) {
											inp.addClass('error');
											inp.parent().addClass('error'); 
											par.find('.error.validate').css('display', 'block');
											break;
										};
									}
								}
							break;
							case 'password':
							if (val != '') {
								if (val.length < 6) {
									inp.addClass('error'); 
									par.find('.error.validate').css('display', 'block');
								}
							}
							break;
							case 'email':
								if (val != '') {
									if (!(/^([a-z0-9_\-]+\.)*[a-z0-9_\-]+@([a-z0-9][a-z0-9\-]*[a-z0-9]\.)+[a-z]{2,4}$/i).test(val)) {
										inp.addClass('error');
										inp.parent().addClass('error');
										par.find('.error.validate').css('display', 'block');
									}
								}
							break;
							default:
							break;
						}
						if   (inp.data('minlength')) {
							if (val != '') {
								if (val.length < inp.data('minlength')*1) {
									inp.removeClass('ok'); 
									inp.parent().addClass('error'); 
									inp.addClass('error'); 
									par.find('.error.minlength').css('display', 'block');
								}
								else {
									inp.removeClass('error'); 
									par.addClass('ok'); 
								}
							}
						}

						if (inp.data('identity')) {
							var idsel = $(inp.data('identity'));
							if (idsel.length < 1) alert('Ссылка на неверный селектор в поле '+inp.attr('name'));
							if (val != '' && idsel.val() != '' && val != idsel.val()) {
								inp.addClass('error');
								inp.parent().addClass('error');
								par.find('.error.identity').css('display', 'block');
							}
						}
					}
				} else {
				}
			});
			form.data('valid', $(':input.error', form).length == 0);
		});
	}
})(jQuery);


function passwordSwitcher() {
					$('.switch-password')
						.off('click.switchPass')
						.on('click.switchPass', function() {
							var el = $(this);
							var inpPass = $(this).parent().find('input');
							if (el.hasClass('visible')) {
								el.removeClass('visible');
								inpPass.attr('type', 'text');
							} else {
								el.addClass('visible');
								inpPass.attr('type', 'password');
							}
						});
				};

/*
 * jQuery Easing Compatibility v1 - http://gsgd.co.uk/sandbox/jquery.easing.php
 *
 * Adds compatibility for applications that use the pre 1.2 easing names
 *
 * Copyright (c) 2007 George Smith
 * Licensed under the MIT License:
 *   http://www.opensource.org/licenses/mit-license.php
 */

jQuery.extend( jQuery.easing,
{
	easeIn: function (x, t, b, c, d) {
		return jQuery.easing.easeInQuad(x, t, b, c, d);
	},
	easeOut: function (x, t, b, c, d) {
		return jQuery.easing.easeOutQuad(x, t, b, c, d);
	},
	easeInOut: function (x, t, b, c, d) {
		return jQuery.easing.easeInOutQuad(x, t, b, c, d);
	},
	expoin: function(x, t, b, c, d) {
		return jQuery.easing.easeInExpo(x, t, b, c, d);
	},
	expoout: function(x, t, b, c, d) {
		return jQuery.easing.easeOutExpo(x, t, b, c, d);
	},
	expoinout: function(x, t, b, c, d) {
		return jQuery.easing.easeInOutExpo(x, t, b, c, d);
	},
	bouncein: function(x, t, b, c, d) {
		return jQuery.easing.easeInBounce(x, t, b, c, d);
	},
	bounceout: function(x, t, b, c, d) {
		return jQuery.easing.easeOutBounce(x, t, b, c, d);
	},
	bounceinout: function(x, t, b, c, d) {
		return jQuery.easing.easeInOutBounce(x, t, b, c, d);
	},
	elasin: function(x, t, b, c, d) {
		return jQuery.easing.easeInElastic(x, t, b, c, d);
	},
	elasout: function(x, t, b, c, d) {
		return jQuery.easing.easeOutElastic(x, t, b, c, d);
	},
	elasinout: function(x, t, b, c, d) {
		return jQuery.easing.easeInOutElastic(x, t, b, c, d);
	},
	backin: function(x, t, b, c, d) {
		return jQuery.easing.easeInBack(x, t, b, c, d);
	},
	backout: function(x, t, b, c, d) {
		return jQuery.easing.easeOutBack(x, t, b, c, d);
	},
	backinout: function(x, t, b, c, d) {
		return jQuery.easing.easeInOutBack(x, t, b, c, d);
	}
});

// REPLACE CHECKBOXES
(function($) { //create closure
$.fn.replaceCheckBox = function(options){
	this.each(function(){
		var inp = $(this), label = $('label[for='+inp.attr('id')+']');
		if (inp.hasClass('custom')) return false;
		inp.wrap('<span class="field checkbox" />').wrap('<span />');
		var par = inp.parents('span.checkbox:eq(0)');
		if (inp.prop('checked')) {
			par.addClass('checked');
		}
		par.on('click', function(){
			if (inp.attr('disabled')) return false;
			inp.trigger('change');
		});
		inp.on('change',function(){
			if (inp.attr('disabled')) return false;
			if (!inp.prop('checked')) {
				par.addClass('checked');
				inp.prop('checked',true);
			} else {
				par.removeClass('checked');
				inp.prop('checked', false);
			}
		});
	});
}
//end of closure
})(jQuery);


(function($) { //create closure
$.fn.selectReplace = function(options){
	this.each(function(){
        var field = $(this), selblock = $("<span class=\"inpselblock\"></span>"), seltxt = $("<span class=\"inpseltxt\"></span>"), w = field.width();
	if (field.hasClass('custom')) return false;
	//if (!field.hasClass('floatwidth')) { selblock.width(w); }
	selblock.parent().width(w);
	field.wrap(selblock);
	seltxt.insertBefore(field);
	seltxt.text($("option:selected",field).text());
	var selopener = $("<a class=\"selopener\" href=\"#\"></a>").insertBefore(seltxt);
	var optcontainer = $("<div class=\"optcontainer"+((field.hasClass('round'))? ' round':'')+"\" id=\""+field.attr("name")+"opts\"></div>").appendTo("body");
	optcontainer.css('min-width',w).hide(function(){
		$(this).addClass("hide");
	});
	$("option",field).each(function(k){
		var opt = $(this);
		var aopt = $("<a href=\"#\" title=\""+opt.text()+"\">"+opt.text()+"</a>").appendTo(optcontainer);
		aopt.click(function(){
			field.get(0).selectedIndex = k;
			seltxt.text($("option:eq("+k+")",field).text());
			optcontainer.find('.selected').removeClass('selected');
			$(this).addClass('selected');
			optcontainer.slideUp("fast",function() {
				$(this).addClass("hide");
				selopener.removeClass('open');
			});
			field.change();
			return false;
		});
		if (opt.prop('selected')) aopt.addClass('selected');
	});
	selopener.click(function(){
		$('.inpselblock').removeClass('open');
		$("div.optcontainer").slideUp("fast",function() {
			$(this).addClass("hide");
		});
		if (optcontainer.hasClass("hide")) {
			var pos = $(seltxt).offset(), zi = 0;
			optcontainer.removeClass("hide");
			optcontainer.css({left: pos.left+"px", top: pos.top-1 + "px", 'min-width': field.outerWidth()+15});
			optcontainer.slideDown("fast", function(){
				$(document).on("click",function(e) {
					if (e.pageX < pos.left 
						|| e.pageX > (pos.left + optcontainer.width()) 
						|| e.pageY < (pos.top) 
						|| e.pageY > (pos.top + optcontainer.height())) {
						optcontainer.slideUp("fast",function() {
							$(this).addClass("hide");
							selopener.removeClass('open');
						});
					} 
				});
				selopener.addClass('open');
			});

			optcontainer.siblings().each(function(){
				var nzi = parseInt($(this).css('z-index'));
				zi = Math.max(zi, (!isNaN(nzi)) ? nzi: 0);
			});
			optcontainer.css({'z-index':zi+1});


		} else {
			optcontainer.slideUp("fast",function() {
				$(this).addClass("hide");
				selopener.removeClass('open');
			});
		}
		return false;
	});
	field.addClass('custom');
	});
}
//end of closure
})(jQuery);


(function($) { //create closure
$.fn.radioReplace = function(options){
	this.each(function(){
		var inp = $(this), label = $('label[for='+inp.attr('id')+']'), form = $(this.form), n = inp.attr('name');
		if (inp.hasClass('custom')) return false;
		inp.wrap('<span class="field radio" />').wrap('<span />');
		var par = inp.parents('span.radio:eq(0)');
		if (inp.prop('checked')) {
			par.addClass('checked');
		}
		inp.change(function(){
			if ($(this).attr('disabled')) return false;
			var n = $(this).attr('name');
			$('input[name="'+n+'"]',form).each(function(){
				var i = $(this), p = i.parents('span.radio:eq(0)'); 
				if (i.prop('checked')) {
					p.addClass('checked');
				} else {
					p.removeClass('checked');
				}
			});
		});
	});
}
//end of closure
})(jQuery);


// version 1.6.0
// http://welcome.totheinter.net/columnizer-jquery-plugin/
// created by: Adam Wulf @adamwulf, adam.wulf@gmail.com
(function($){$.fn.columnize=function(options){var defaults={width:400,columns:false,buildOnce:false,overflow:false,doneFunc:function(){},target:false,ignoreImageLoading:true,columnFloat:"left",lastNeverTallest:false,accuracy:false,manualBreaks:false,cssClassPrefix:""};options=$.extend(defaults,options);if(typeof(options.width)=="string"){options.width=parseInt(options.width,10);if(isNaN(options.width)){options.width=defaults.width;}}
return this.each(function(){var $inBox=options.target?$(options.target):$(this);var maxHeight=$(this).height();var $cache=$('<div></div>');var lastWidth=0;var columnizing=false;var manualBreaks=options.manualBreaks;var cssClassPrefix=defaults.cssClassPrefix;if(typeof(options.cssClassPrefix)=="string"){cssClassPrefix=options.cssClassPrefix;}
var adjustment=0;$cache.append($(this).contents().clone(true));if(!options.ignoreImageLoading&&!options.target){if(!$inBox.data("imageLoaded")){$inBox.data("imageLoaded",true);if($(this).find("img").length>0){var func=function($inBox,$cache){return function(){if(!$inBox.data("firstImageLoaded")){$inBox.data("firstImageLoaded","true");$inBox.empty().append($cache.children().clone(true));$inBox.columnize(options);}};}($(this),$cache);$(this).find("img").one("load",func);$(this).find("img").one("abort",func);return;}}}
$inBox.empty();columnizeIt();if(!options.buildOnce){$(window).resize(function(){if(!options.buildOnce){if($inBox.data("timeout")){clearTimeout($inBox.data("timeout"));}
$inBox.data("timeout",setTimeout(columnizeIt,200));}});}
function prefixTheClassName(className,withDot){var dot=withDot?".":"";if(cssClassPrefix.length){return dot+cssClassPrefix+"-"+className;}
return dot+className;}
function columnize($putInHere,$pullOutHere,$parentColumn,targetHeight){while((manualBreaks||$parentColumn.height()<targetHeight)&&$pullOutHere[0].childNodes.length){var node=$pullOutHere[0].childNodes[0];if($(node).find(prefixTheClassName("columnbreak",true)).length){return;}
if($(node).hasClass(prefixTheClassName("columnbreak"))){return;}
$putInHere.append(node);}
if($putInHere[0].childNodes.length===0)return;var kids=$putInHere[0].childNodes;var lastKid=kids[kids.length-1];$putInHere[0].removeChild(lastKid);var $item=$(lastKid);if($item[0].nodeType==3){var oText=$item[0].nodeValue;var counter2=options.width/18;if(options.accuracy)
counter2=options.accuracy;var columnText;var latestTextNode=null;while($parentColumn.height()<targetHeight&&oText.length){var indexOfSpace=oText.indexOf(' ',counter2);if(indexOfSpace!=-1){columnText=oText.substring(0,oText.indexOf(' ',counter2));}else{columnText=oText;}
latestTextNode=document.createTextNode(columnText);$putInHere.append(latestTextNode);if(oText.length>counter2&&indexOfSpace!=-1){oText=oText.substring(indexOfSpace);}else{oText="";}}
if($parentColumn.height()>=targetHeight&&latestTextNode!==null){$putInHere[0].removeChild(latestTextNode);oText=latestTextNode.nodeValue+oText;}
if(oText.length){$item[0].nodeValue=oText;}else{return false;}}
if($pullOutHere.contents().length){$pullOutHere.prepend($item);}else{$pullOutHere.append($item);}
return $item[0].nodeType==3;}
function split($putInHere,$pullOutHere,$parentColumn,targetHeight){if($putInHere.contents(":last").find(prefixTheClassName("columnbreak",true)).length){return;}
if($putInHere.contents(":last").hasClass(prefixTheClassName("columnbreak"))){return;}
if($pullOutHere.contents().length){var $cloneMe=$pullOutHere.contents(":first");if($cloneMe.get(0).nodeType!=1)return;var $clone=$cloneMe.clone(true);if($cloneMe.hasClass(prefixTheClassName("columnbreak"))){$putInHere.append($clone);$cloneMe.remove();}else if(manualBreaks){$putInHere.append($clone);$cloneMe.remove();}else if($clone.get(0).nodeType==1&&!$clone.hasClass(prefixTheClassName("dontend"))){$putInHere.append($clone);if($clone.is("img")&&$parentColumn.height()<targetHeight+20){$cloneMe.remove();}else if(!$cloneMe.hasClass(prefixTheClassName("dontsplit"))&&$parentColumn.height()<targetHeight+20){$cloneMe.remove();}else if($clone.is("img")||$cloneMe.hasClass(prefixTheClassName("dontsplit"))){$clone.remove();}else{$clone.empty();if(!columnize($clone,$cloneMe,$parentColumn,targetHeight)){$cloneMe.addClass(prefixTheClassName("split"));if($cloneMe.children().length){split($clone,$cloneMe,$parentColumn,targetHeight);}}else{$cloneMe.addClass(prefixTheClassName("split"));}
if($clone.get(0).childNodes.length===0){$clone.remove();}}}}}
function singleColumnizeIt(){if($inBox.data("columnized")&&$inBox.children().length==1){return;}
$inBox.data("columnized",true);$inBox.data("columnizing",true);$inBox.empty();$inBox.append($("<div class='"
+prefixTheClassName("first")+" "
+prefixTheClassName("last")+" "
+prefixTheClassName("column")+" "
+"' style='width:100%; float: "+options.columnFloat+";'></div>"));$col=$inBox.children().eq($inBox.children().length-1);$destroyable=$cache.clone(true);if(options.overflow){targetHeight=options.overflow.height;columnize($col,$destroyable,$col,targetHeight);if(!$destroyable.contents().find(":first-child").hasClass(prefixTheClassName("dontend"))){split($col,$destroyable,$col,targetHeight);}
while($col.contents(":last").length&&checkDontEndColumn($col.contents(":last").get(0))){var $lastKid=$col.contents(":last");$lastKid.remove();$destroyable.prepend($lastKid);}
var html="";var div=document.createElement('DIV');while($destroyable[0].childNodes.length>0){var kid=$destroyable[0].childNodes[0];if(kid.attributes){for(var i=0;i<kid.attributes.length;i++){if(kid.attributes[i].nodeName.indexOf("jQuery")===0){kid.removeAttribute(kid.attributes[i].nodeName);}}}
div.innerHTML="";div.appendChild($destroyable[0].childNodes[0]);html+=div.innerHTML;}
var overflow=$(options.overflow.id)[0];overflow.innerHTML=html;}else{$col.append($destroyable);}
$inBox.data("columnizing",false);if(options.overflow&&options.overflow.doneFunc){options.overflow.doneFunc();}}
function checkDontEndColumn(dom){if(dom.nodeType==3){if(/^\s+$/.test(dom.nodeValue)){if(!dom.previousSibling)return false;return checkDontEndColumn(dom.previousSibling);}
return false;}
if(dom.nodeType!=1)return false;if($(dom).hasClass(prefixTheClassName("dontend")))return true;if(dom.childNodes.length===0)return false;return checkDontEndColumn(dom.childNodes[dom.childNodes.length-1]);}
function columnizeIt(){adjustment=0;if(lastWidth==$inBox.width())return;lastWidth=$inBox.width();var numCols=Math.round($inBox.width()/options.width);var optionWidth=options.width;var optionHeight=options.height;if(options.columns)numCols=options.columns;if(manualBreaks){numCols=$cache.find(prefixTheClassName("columnbreak",true)).length+1;optionWidth=false;}
if(numCols<=1){return singleColumnizeIt();}
if($inBox.data("columnizing"))return;$inBox.data("columnized",true);$inBox.data("columnizing",true);$inBox.empty();$inBox.append($("<div style='width:"+(Math.floor(100/numCols))+"%; float: "+options.columnFloat+";'></div>"));$col=$inBox.children(":last");$col.append($cache.clone());maxHeight=$col.height();$inBox.empty();var targetHeight=maxHeight/numCols;var firstTime=true;var maxLoops=3;var scrollHorizontally=false;if(options.overflow){maxLoops=1;targetHeight=options.overflow.height;}else if(optionHeight&&optionWidth){maxLoops=1;targetHeight=optionHeight;scrollHorizontally=true;}
for(var loopCount=0;loopCount<maxLoops&&loopCount<20;loopCount++){$inBox.empty();var $destroyable,className,$col,$lastKid;try{$destroyable=$cache.clone(true);}catch(e){$destroyable=$cache.clone();}
$destroyable.css("visibility","hidden");for(var i=0;i<numCols;i++){className=(i===0)?prefixTheClassName("first"):"";className+=" "+prefixTheClassName("column");className=(i==numCols-1)?(prefixTheClassName("last")+" "+className):className;$inBox.append($("<div class='"+className+"' style='width:"+(Math.floor(100/numCols))+"%; float: "+options.columnFloat+";'></div>"));}
i=0;while(i<numCols-(options.overflow?0:1)||scrollHorizontally&&$destroyable.contents().length){if($inBox.children().length<=i){$inBox.append($("<div class='"+className+"' style='width:"+(Math.floor(100/numCols))+"%; float: "+options.columnFloat+";'></div>"));}
$col=$inBox.children().eq(i);if(scrollHorizontally){$col.width(optionWidth+"px");}
columnize($col,$destroyable,$col,targetHeight);split($col,$destroyable,$col,targetHeight);while($col.contents(":last").length&&checkDontEndColumn($col.contents(":last").get(0))){$lastKid=$col.contents(":last");$lastKid.remove();$destroyable.prepend($lastKid);}
i++;if($col.contents().length===0&&$destroyable.contents().length){$col.append($destroyable.contents(":first"));}else if(i==numCols-(options.overflow?0:1)&&!options.overflow){if($destroyable.find(prefixTheClassName("columnbreak",true)).length){numCols++;}}}
if(options.overflow&&!scrollHorizontally){var IE6=false;var IE7=(document.all)&&(navigator.appVersion.indexOf("MSIE 7.")!=-1);if(IE6||IE7){var html="";var div=document.createElement('DIV');while($destroyable[0].childNodes.length>0){var kid=$destroyable[0].childNodes[0];for(i=0;i<kid.attributes.length;i++){if(kid.attributes[i].nodeName.indexOf("jQuery")===0){kid.removeAttribute(kid.attributes[i].nodeName);}}
div.innerHTML="";div.appendChild($destroyable[0].childNodes[0]);html+=div.innerHTML;}
var overflow=$(options.overflow.id)[0];overflow.innerHTML=html;}else{$(options.overflow.id).empty().append($destroyable.contents().clone(true));}}else if(!scrollHorizontally){$col=$inBox.children().eq($inBox.children().length-1);$destroyable.contents().each(function(){$col.append($(this));});var afterH=$col.height();var diff=afterH-targetHeight;var totalH=0;var min=10000000;var max=0;var lastIsMax=false;var numberOfColumnsThatDontEndInAColumnBreak=0;$inBox.children().each(function($inBox){return function($item){var $col=$inBox.children().eq($item);var endsInBreak=$col.children(":last").find(prefixTheClassName("columnbreak",true)).length;if(!endsInBreak){var h=$col.height();lastIsMax=false;totalH+=h;if(h>max){max=h;lastIsMax=true;}
if(h<min)min=h;numberOfColumnsThatDontEndInAColumnBreak++;}};}($inBox));var avgH=totalH/numberOfColumnsThatDontEndInAColumnBreak;if(totalH===0){loopCount=maxLoops;}else if(options.lastNeverTallest&&lastIsMax){adjustment+=30;targetHeight=targetHeight+30;if(loopCount==maxLoops-1)maxLoops++;}else if(max-min>30){targetHeight=avgH+30;}else if(Math.abs(avgH-targetHeight)>20){targetHeight=avgH;}else{loopCount=maxLoops;}}else{$inBox.children().each(function(i){$col=$inBox.children().eq(i);$col.width(optionWidth+"px");if(i===0){$col.addClass(prefixTheClassName("first"));}else if(i==$inBox.children().length-1){$col.addClass(prefixTheClassName("last"));}else{$col.removeClass(prefixTheClassName("first"));$col.removeClass(prefixTheClassName("last"));}});$inBox.width($inBox.children().length*optionWidth+"px");}
$inBox.append($("<br style='clear:both;'>"));}
$inBox.find(prefixTheClassName("column",true)).find(":first"+prefixTheClassName("removeiffirst",true)).remove();$inBox.find(prefixTheClassName("column",true)).find(':last'+prefixTheClassName("removeiflast",true)).remove();$inBox.data("columnizing",false);if(options.overflow){options.overflow.doneFunc();}
options.doneFunc();}});};})(jQuery);


/*
 * jQuery UI Touch Punch 0.2.2
 *
 * Copyright 2011, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function(b){b.support.touch="ontouchend" in document;if(!b.support.touch){return;}var c=b.ui.mouse.prototype,e=c._mouseInit,a;function d(g,h){if(g.originalEvent.touches.length>1){return;}g.preventDefault();var i=g.originalEvent.changedTouches[0],f=document.createEvent("MouseEvents");f.initMouseEvent(h,true,true,window,1,i.screenX,i.screenY,i.clientX,i.clientY,false,false,false,false,0,null);g.target.dispatchEvent(f);}c._touchStart=function(g){var f=this;if(a||!f._mouseCapture(g.originalEvent.changedTouches[0])){return;}a=true;f._touchMoved=false;d(g,"mouseover");d(g,"mousemove");d(g,"mousedown");};c._touchMove=function(f){if(!a){return;}this._touchMoved=true;d(f,"mousemove");};c._touchEnd=function(f){if(!a){return;}d(f,"mouseup");d(f,"mouseout");if(!this._touchMoved){d(f,"click");}a=false;};c._mouseInit=function(){var f=this;f.element.bind("touchstart",b.proxy(f,"_touchStart")).bind("touchmove",b.proxy(f,"_touchMove")).bind("touchend",b.proxy(f,"_touchEnd"));e.call(f);};})(jQuery);



/*
 * jPlayer Plugin for jQuery JavaScript Library
 * http://www.jplayer.org
 *
 * Copyright (c) 2009 - 2013 Happyworm Ltd
 * Licensed under the MIT license.
 * http://opensource.org/licenses/MIT
 *
 * Author: Mark J Panaghiston
 * Version: 2.5.0
 * Date: 7th November 2013
 */

(function(b,f){"function"===typeof define&&define.amd?define(["jquery"],f):b.jQuery?f(b.jQuery):f(b.Zepto)})(this,function(b,f){b.fn.jPlayer=function(a){var c="string"===typeof a,d=Array.prototype.slice.call(arguments,1),e=this;a=!c&&d.length?b.extend.apply(null,[!0,a].concat(d)):a;if(c&&"_"===a.charAt(0))return e;c?this.each(function(){var c=b(this).data("jPlayer"),h=c&&b.isFunction(c[a])?c[a].apply(c,d):c;if(h!==c&&h!==f)return e=h,!1}):this.each(function(){var c=b(this).data("jPlayer");c?c.option(a||
{}):b(this).data("jPlayer",new b.jPlayer(a,this))});return e};b.jPlayer=function(a,c){if(arguments.length){this.element=b(c);this.options=b.extend(!0,{},this.options,a);var d=this;this.element.bind("remove.jPlayer",function(){d.destroy()});this._init()}};"function"!==typeof b.fn.stop&&(b.fn.stop=function(){});b.jPlayer.emulateMethods="load play pause";b.jPlayer.emulateStatus="src readyState networkState currentTime duration paused ended playbackRate";b.jPlayer.emulateOptions="muted volume";b.jPlayer.reservedEvent=
"ready flashreset resize repeat error warning";b.jPlayer.event={};b.each("ready flashreset resize repeat click error warning loadstart progress suspend abort emptied stalled play pause loadedmetadata loadeddata waiting playing canplay canplaythrough seeking seeked timeupdate ended ratechange durationchange volumechange".split(" "),function(){b.jPlayer.event[this]="jPlayer_"+this});b.jPlayer.htmlEvent="loadstart abort emptied stalled loadedmetadata loadeddata canplay canplaythrough".split(" ");b.jPlayer.pause=
function(){b.each(b.jPlayer.prototype.instances,function(a,c){c.data("jPlayer").status.srcSet&&c.jPlayer("pause")})};b.jPlayer.timeFormat={showHour:!1,showMin:!0,showSec:!0,padHour:!1,padMin:!0,padSec:!0,sepHour:":",sepMin:":",sepSec:""};var m=function(){this.init()};m.prototype={init:function(){this.options={timeFormat:b.jPlayer.timeFormat}},time:function(a){var c=new Date(1E3*(a&&"number"===typeof a?a:0)),b=c.getUTCHours();a=this.options.timeFormat.showHour?c.getUTCMinutes():c.getUTCMinutes()+60*
b;c=this.options.timeFormat.showMin?c.getUTCSeconds():c.getUTCSeconds()+60*a;b=this.options.timeFormat.padHour&&10>b?"0"+b:b;a=this.options.timeFormat.padMin&&10>a?"0"+a:a;c=this.options.timeFormat.padSec&&10>c?"0"+c:c;b=""+(this.options.timeFormat.showHour?b+this.options.timeFormat.sepHour:"");b+=this.options.timeFormat.showMin?a+this.options.timeFormat.sepMin:"";return b+=this.options.timeFormat.showSec?c+this.options.timeFormat.sepSec:""}};var n=new m;b.jPlayer.convertTime=function(a){return n.time(a)};
b.jPlayer.uaBrowser=function(a){a=a.toLowerCase();var c=/(opera)(?:.*version)?[ \/]([\w.]+)/,b=/(msie) ([\w.]+)/,e=/(mozilla)(?:.*? rv:([\w.]+))?/;a=/(webkit)[ \/]([\w.]+)/.exec(a)||c.exec(a)||b.exec(a)||0>a.indexOf("compatible")&&e.exec(a)||[];return{browser:a[1]||"",version:a[2]||"0"}};b.jPlayer.uaPlatform=function(a){var c=a.toLowerCase(),b=/(android)/,e=/(mobile)/;a=/(ipad|iphone|ipod|android|blackberry|playbook|windows ce|webos)/.exec(c)||[];c=/(ipad|playbook)/.exec(c)||!e.exec(c)&&b.exec(c)||
[];a[1]&&(a[1]=a[1].replace(/\s/g,"_"));return{platform:a[1]||"",tablet:c[1]||""}};b.jPlayer.browser={};b.jPlayer.platform={};var k=b.jPlayer.uaBrowser(navigator.userAgent);k.browser&&(b.jPlayer.browser[k.browser]=!0,b.jPlayer.browser.version=k.version);k=b.jPlayer.uaPlatform(navigator.userAgent);k.platform&&(b.jPlayer.platform[k.platform]=!0,b.jPlayer.platform.mobile=!k.tablet,b.jPlayer.platform.tablet=!!k.tablet);b.jPlayer.getDocMode=function(){var a;b.jPlayer.browser.msie&&(document.documentMode?
a=document.documentMode:(a=5,document.compatMode&&"CSS1Compat"===document.compatMode&&(a=7)));return a};b.jPlayer.browser.documentMode=b.jPlayer.getDocMode();b.jPlayer.nativeFeatures={init:function(){var a=document,c=a.createElement("video"),b={w3c:"fullscreenEnabled fullscreenElement requestFullscreen exitFullscreen fullscreenchange fullscreenerror".split(" "),moz:"mozFullScreenEnabled mozFullScreenElement mozRequestFullScreen mozCancelFullScreen mozfullscreenchange mozfullscreenerror".split(" "),
webkit:" webkitCurrentFullScreenElement webkitRequestFullScreen webkitCancelFullScreen webkitfullscreenchange ".split(" "),webkitVideo:"webkitSupportsFullscreen webkitDisplayingFullscreen webkitEnterFullscreen webkitExitFullscreen  ".split(" ")},e=["w3c","moz","webkit","webkitVideo"],g,h;this.fullscreen=c={support:{w3c:!!a[b.w3c[0]],moz:!!a[b.moz[0]],webkit:"function"===typeof a[b.webkit[3]],webkitVideo:"function"===typeof c[b.webkitVideo[2]]},used:{}};g=0;for(h=e.length;g<h;g++){var f=e[g];if(c.support[f]){c.spec=
f;c.used[f]=!0;break}}if(c.spec){var l=b[c.spec];c.api={fullscreenEnabled:!0,fullscreenElement:function(c){c=c?c:a;return c[l[1]]},requestFullscreen:function(a){return a[l[2]]()},exitFullscreen:function(c){c=c?c:a;return c[l[3]]()}};c.event={fullscreenchange:l[4],fullscreenerror:l[5]}}else c.api={fullscreenEnabled:!1,fullscreenElement:function(){return null},requestFullscreen:function(){},exitFullscreen:function(){}},c.event={}}};b.jPlayer.nativeFeatures.init();b.jPlayer.focus=null;b.jPlayer.keyIgnoreElementNames=
"INPUT TEXTAREA";var p=function(a){var c=b.jPlayer.focus,d;c&&(b.each(b.jPlayer.keyIgnoreElementNames.split(/\s+/g),function(c,b){if(a.target.nodeName.toUpperCase()===b.toUpperCase())return d=!0,!1}),d||b.each(c.options.keyBindings,function(d,g){if(g&&a.which===g.key&&b.isFunction(g.fn))return a.preventDefault(),g.fn(c),!1}))};b.jPlayer.keys=function(a){b(document.documentElement).unbind("keydown.jPlayer");a&&b(document.documentElement).bind("keydown.jPlayer",p)};b.jPlayer.keys(!0);b.jPlayer.prototype=
{count:0,version:{script:"2.5.0",needFlash:"2.5.0",flash:"unknown"},options:{swfPath:"js",solution:"html, flash",supplied:"mp3",preload:"metadata",volume:0.8,muted:!1,playbackRate:1,defaultPlaybackRate:1,minPlaybackRate:0.5,maxPlaybackRate:4,wmode:"opaque",backgroundColor:"#000000",cssSelectorAncestor:"#jp_container_1",cssSelector:{videoPlay:".jp-video-play",play:".jp-play",pause:".jp-pause",stop:".jp-stop",seekBar:".jp-seek-bar",playBar:".jp-play-bar",mute:".jp-mute",unmute:".jp-unmute",volumeBar:".jp-volume-bar",
volumeBarValue:".jp-volume-bar-value",volumeMax:".jp-volume-max",playbackRateBar:".jp-playback-rate-bar",playbackRateBarValue:".jp-playback-rate-bar-value",currentTime:".jp-current-time",duration:".jp-duration",fullScreen:".jp-full-screen",restoreScreen:".jp-restore-screen",repeat:".jp-repeat",repeatOff:".jp-repeat-off",gui:".jp-gui",noSolution:".jp-no-solution"},smoothPlayBar:!1,fullScreen:!1,fullWindow:!1,autohide:{restored:!1,full:!0,fadeIn:200,fadeOut:600,hold:1E3},loop:!1,repeat:function(a){a.jPlayer.options.loop?
b(this).unbind(".jPlayerRepeat").bind(b.jPlayer.event.ended+".jPlayer.jPlayerRepeat",function(){b(this).jPlayer("play")}):b(this).unbind(".jPlayerRepeat")},nativeVideoControls:{},noFullWindow:{msie:/msie [0-6]\./,ipad:/ipad.*?os [0-4]\./,iphone:/iphone/,ipod:/ipod/,android_pad:/android [0-3]\.(?!.*?mobile)/,android_phone:/android.*?mobile/,blackberry:/blackberry/,windows_ce:/windows ce/,iemobile:/iemobile/,webos:/webos/},noVolume:{ipad:/ipad/,iphone:/iphone/,ipod:/ipod/,android_pad:/android(?!.*?mobile)/,
android_phone:/android.*?mobile/,blackberry:/blackberry/,windows_ce:/windows ce/,iemobile:/iemobile/,webos:/webos/,playbook:/playbook/},timeFormat:{},keyEnabled:!1,audioFullScreen:!1,keyBindings:{play:{key:32,fn:function(a){a.status.paused?a.play():a.pause()}},fullScreen:{key:13,fn:function(a){(a.status.video||a.options.audioFullScreen)&&a._setOption("fullScreen",!a.options.fullScreen)}},muted:{key:8,fn:function(a){a._muted(!a.options.muted)}},volumeUp:{key:38,fn:function(a){a.volume(a.options.volume+
0.1)}},volumeDown:{key:40,fn:function(a){a.volume(a.options.volume-0.1)}}},verticalVolume:!1,verticalPlaybackRate:!1,globalVolume:!1,idPrefix:"jp",noConflict:"jQuery",emulateHtml:!1,consoleAlerts:!0,errorAlerts:!1,warningAlerts:!1},optionsAudio:{size:{width:"0px",height:"0px",cssClass:""},sizeFull:{width:"0px",height:"0px",cssClass:""}},optionsVideo:{size:{width:"480px",height:"270px",cssClass:"jp-video-270p"},sizeFull:{width:"100%",height:"100%",cssClass:"jp-video-full"}},instances:{},status:{src:"",
media:{},paused:!0,format:{},formatType:"",waitForPlay:!0,waitForLoad:!0,srcSet:!1,video:!1,seekPercent:0,currentPercentRelative:0,currentPercentAbsolute:0,currentTime:0,duration:0,videoWidth:0,videoHeight:0,readyState:0,networkState:0,playbackRate:1,ended:0},internal:{ready:!1},solution:{html:!0,flash:!0},format:{mp3:{codec:'audio/mpeg; codecs="mp3"',flashCanPlay:!0,media:"audio"},m4a:{codec:'audio/mp4; codecs="mp4a.40.2"',flashCanPlay:!0,media:"audio"},m3u8a:{codec:'application/vnd.apple.mpegurl; codecs="mp4a.40.2"',
flashCanPlay:!1,media:"audio"},m3ua:{codec:"audio/mpegurl",flashCanPlay:!1,media:"audio"},oga:{codec:'audio/ogg; codecs="vorbis, opus"',flashCanPlay:!1,media:"audio"},flac:{codec:"audio/x-flac",flashCanPlay:!1,media:"audio"},wav:{codec:'audio/wav; codecs="1"',flashCanPlay:!1,media:"audio"},webma:{codec:'audio/webm; codecs="vorbis"',flashCanPlay:!1,media:"audio"},fla:{codec:"audio/x-flv",flashCanPlay:!0,media:"audio"},rtmpa:{codec:'audio/rtmp; codecs="rtmp"',flashCanPlay:!0,media:"audio"},m4v:{codec:'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
flashCanPlay:!0,media:"video"},m3u8v:{codec:'application/vnd.apple.mpegurl; codecs="avc1.42E01E, mp4a.40.2"',flashCanPlay:!1,media:"video"},m3uv:{codec:"audio/mpegurl",flashCanPlay:!1,media:"video"},ogv:{codec:'video/ogg; codecs="theora, vorbis"',flashCanPlay:!1,media:"video"},webmv:{codec:'video/webm; codecs="vorbis, vp8"',flashCanPlay:!1,media:"video"},flv:{codec:"video/x-flv",flashCanPlay:!0,media:"video"},rtmpv:{codec:'video/rtmp; codecs="rtmp"',flashCanPlay:!0,media:"video"}},_init:function(){var a=
this;this.element.empty();this.status=b.extend({},this.status);this.internal=b.extend({},this.internal);this.options.timeFormat=b.extend({},b.jPlayer.timeFormat,this.options.timeFormat);this.internal.cmdsIgnored=b.jPlayer.platform.ipad||b.jPlayer.platform.iphone||b.jPlayer.platform.ipod;this.internal.domNode=this.element.get(0);this.options.keyEnabled&&!b.jPlayer.focus&&(b.jPlayer.focus=this);this.formats=[];this.solutions=[];this.require={};this.htmlElement={};this.html={};this.html.audio={};this.html.video=
{};this.flash={};this.css={};this.css.cs={};this.css.jq={};this.ancestorJq=[];this.options.volume=this._limitValue(this.options.volume,0,1);b.each(this.options.supplied.toLowerCase().split(","),function(c,d){var e=d.replace(/^\s+|\s+$/g,"");if(a.format[e]){var f=!1;b.each(a.formats,function(a,c){if(e===c)return f=!0,!1});f||a.formats.push(e)}});b.each(this.options.solution.toLowerCase().split(","),function(c,d){var e=d.replace(/^\s+|\s+$/g,"");if(a.solution[e]){var f=!1;b.each(a.solutions,function(a,
c){if(e===c)return f=!0,!1});f||a.solutions.push(e)}});this.internal.instance="jp_"+this.count;this.instances[this.internal.instance]=this.element;this.element.attr("id")||this.element.attr("id",this.options.idPrefix+"_jplayer_"+this.count);this.internal.self=b.extend({},{id:this.element.attr("id"),jq:this.element});this.internal.audio=b.extend({},{id:this.options.idPrefix+"_audio_"+this.count,jq:f});this.internal.video=b.extend({},{id:this.options.idPrefix+"_video_"+this.count,jq:f});this.internal.flash=
b.extend({},{id:this.options.idPrefix+"_flash_"+this.count,jq:f,swf:this.options.swfPath+(".swf"!==this.options.swfPath.toLowerCase().slice(-4)?(this.options.swfPath&&"/"!==this.options.swfPath.slice(-1)?"/":"")+"Jplayer.swf":"")});this.internal.poster=b.extend({},{id:this.options.idPrefix+"_poster_"+this.count,jq:f});b.each(b.jPlayer.event,function(c,b){a.options[c]!==f&&(a.element.bind(b+".jPlayer",a.options[c]),a.options[c]=f)});this.require.audio=!1;this.require.video=!1;b.each(this.formats,function(c,
b){a.require[a.format[b].media]=!0});this.options=this.require.video?b.extend(!0,{},this.optionsVideo,this.options):b.extend(!0,{},this.optionsAudio,this.options);this._setSize();this.status.nativeVideoControls=this._uaBlocklist(this.options.nativeVideoControls);this.status.noFullWindow=this._uaBlocklist(this.options.noFullWindow);this.status.noVolume=this._uaBlocklist(this.options.noVolume);b.jPlayer.nativeFeatures.fullscreen.api.fullscreenEnabled&&this._fullscreenAddEventListeners();this._restrictNativeVideoControls();
this.htmlElement.poster=document.createElement("img");this.htmlElement.poster.id=this.internal.poster.id;this.htmlElement.poster.onload=function(){a.status.video&&!a.status.waitForPlay||a.internal.poster.jq.show()};this.element.append(this.htmlElement.poster);this.internal.poster.jq=b("#"+this.internal.poster.id);this.internal.poster.jq.css({width:this.status.width,height:this.status.height});this.internal.poster.jq.hide();this.internal.poster.jq.bind("click.jPlayer",function(){a._trigger(b.jPlayer.event.click)});
this.html.audio.available=!1;this.require.audio&&(this.htmlElement.audio=document.createElement("audio"),this.htmlElement.audio.id=this.internal.audio.id,this.html.audio.available=!!this.htmlElement.audio.canPlayType&&this._testCanPlayType(this.htmlElement.audio));this.html.video.available=!1;this.require.video&&(this.htmlElement.video=document.createElement("video"),this.htmlElement.video.id=this.internal.video.id,this.html.video.available=!!this.htmlElement.video.canPlayType&&this._testCanPlayType(this.htmlElement.video));
this.flash.available=this._checkForFlash(10.1);this.html.canPlay={};this.flash.canPlay={};b.each(this.formats,function(c,b){a.html.canPlay[b]=a.html[a.format[b].media].available&&""!==a.htmlElement[a.format[b].media].canPlayType(a.format[b].codec);a.flash.canPlay[b]=a.format[b].flashCanPlay&&a.flash.available});this.html.desired=!1;this.flash.desired=!1;b.each(this.solutions,function(c,d){if(0===c)a[d].desired=!0;else{var e=!1,f=!1;b.each(a.formats,function(c,b){a[a.solutions[0]].canPlay[b]&&("video"===
a.format[b].media?f=!0:e=!0)});a[d].desired=a.require.audio&&!e||a.require.video&&!f}});this.html.support={};this.flash.support={};b.each(this.formats,function(c,b){a.html.support[b]=a.html.canPlay[b]&&a.html.desired;a.flash.support[b]=a.flash.canPlay[b]&&a.flash.desired});this.html.used=!1;this.flash.used=!1;b.each(this.solutions,function(c,d){b.each(a.formats,function(c,b){if(a[d].support[b])return a[d].used=!0,!1})});this._resetActive();this._resetGate();this._cssSelectorAncestor(this.options.cssSelectorAncestor);
this.html.used||this.flash.used?this.css.jq.noSolution.length&&this.css.jq.noSolution.hide():(this._error({type:b.jPlayer.error.NO_SOLUTION,context:"{solution:'"+this.options.solution+"', supplied:'"+this.options.supplied+"'}",message:b.jPlayer.errorMsg.NO_SOLUTION,hint:b.jPlayer.errorHint.NO_SOLUTION}),this.css.jq.noSolution.length&&this.css.jq.noSolution.show());if(this.flash.used){var c,d="jQuery="+encodeURI(this.options.noConflict)+"&id="+encodeURI(this.internal.self.id)+"&vol="+this.options.volume+
"&muted="+this.options.muted;if(b.jPlayer.browser.msie&&(9>Number(b.jPlayer.browser.version)||9>b.jPlayer.browser.documentMode)){d=['<param name="movie" value="'+this.internal.flash.swf+'" />','<param name="FlashVars" value="'+d+'" />','<param name="allowScriptAccess" value="always" />','<param name="bgcolor" value="'+this.options.backgroundColor+'" />','<param name="wmode" value="'+this.options.wmode+'" />'];c=document.createElement('<object id="'+this.internal.flash.id+'" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" width="0" height="0" tabindex="-1"></object>');
for(var e=0;e<d.length;e++)c.appendChild(document.createElement(d[e]))}else e=function(a,c,b){var d=document.createElement("param");d.setAttribute("name",c);d.setAttribute("value",b);a.appendChild(d)},c=document.createElement("object"),c.setAttribute("id",this.internal.flash.id),c.setAttribute("name",this.internal.flash.id),c.setAttribute("data",this.internal.flash.swf),c.setAttribute("type","application/x-shockwave-flash"),c.setAttribute("width","1"),c.setAttribute("height","1"),c.setAttribute("tabindex",
"-1"),e(c,"flashvars",d),e(c,"allowscriptaccess","always"),e(c,"bgcolor",this.options.backgroundColor),e(c,"wmode",this.options.wmode);this.element.append(c);this.internal.flash.jq=b(c)}this.status.playbackRateEnabled=this.html.used&&!this.flash.used?this._testPlaybackRate("audio"):!1;this._updatePlaybackRate();this.html.used&&(this.html.audio.available&&(this._addHtmlEventListeners(this.htmlElement.audio,this.html.audio),this.element.append(this.htmlElement.audio),this.internal.audio.jq=b("#"+this.internal.audio.id)),
this.html.video.available&&(this._addHtmlEventListeners(this.htmlElement.video,this.html.video),this.element.append(this.htmlElement.video),this.internal.video.jq=b("#"+this.internal.video.id),this.status.nativeVideoControls?this.internal.video.jq.css({width:this.status.width,height:this.status.height}):this.internal.video.jq.css({width:"0px",height:"0px"}),this.internal.video.jq.bind("click.jPlayer",function(){a._trigger(b.jPlayer.event.click)})));this.options.emulateHtml&&this._emulateHtmlBridge();
this.html.used&&!this.flash.used&&setTimeout(function(){a.internal.ready=!0;a.version.flash="n/a";a._trigger(b.jPlayer.event.repeat);a._trigger(b.jPlayer.event.ready)},100);this._updateNativeVideoControls();this.css.jq.videoPlay.length&&this.css.jq.videoPlay.hide();b.jPlayer.prototype.count++},destroy:function(){this.clearMedia();this._removeUiClass();this.css.jq.currentTime.length&&this.css.jq.currentTime.text("");this.css.jq.duration.length&&this.css.jq.duration.text("");b.each(this.css.jq,function(a,
c){c.length&&c.unbind(".jPlayer")});this.internal.poster.jq.unbind(".jPlayer");this.internal.video.jq&&this.internal.video.jq.unbind(".jPlayer");this._fullscreenRemoveEventListeners();this===b.jPlayer.focus&&(b.jPlayer.focus=null);this.options.emulateHtml&&this._destroyHtmlBridge();this.element.removeData("jPlayer");this.element.unbind(".jPlayer");this.element.empty();delete this.instances[this.internal.instance]},enable:function(){},disable:function(){},_testCanPlayType:function(a){try{return a.canPlayType(this.format.mp3.codec),
!0}catch(c){return!1}},_testPlaybackRate:function(a){a=document.createElement("string"===typeof a?a:"audio");try{return"playbackRate"in a?(a.playbackRate=0.5,0.5===a.playbackRate):!1}catch(c){return!1}},_uaBlocklist:function(a){var c=navigator.userAgent.toLowerCase(),d=!1;b.each(a,function(a,b){if(b&&b.test(c))return d=!0,!1});return d},_restrictNativeVideoControls:function(){this.require.audio&&this.status.nativeVideoControls&&(this.status.nativeVideoControls=!1,this.status.noFullWindow=!0)},_updateNativeVideoControls:function(){this.html.video.available&&
this.html.used&&(this.htmlElement.video.controls=this.status.nativeVideoControls,this._updateAutohide(),this.status.nativeVideoControls&&this.require.video?(this.internal.poster.jq.hide(),this.internal.video.jq.css({width:this.status.width,height:this.status.height})):this.status.waitForPlay&&this.status.video&&(this.internal.poster.jq.show(),this.internal.video.jq.css({width:"0px",height:"0px"})))},_addHtmlEventListeners:function(a,c){var d=this;a.preload=this.options.preload;a.muted=this.options.muted;
a.volume=this.options.volume;this.status.playbackRateEnabled&&(a.defaultPlaybackRate=this.options.defaultPlaybackRate,a.playbackRate=this.options.playbackRate);a.addEventListener("progress",function(){c.gate&&(d.internal.cmdsIgnored&&0<this.readyState&&(d.internal.cmdsIgnored=!1),d._getHtmlStatus(a),d._updateInterface(),d._trigger(b.jPlayer.event.progress))},!1);a.addEventListener("timeupdate",function(){c.gate&&(d._getHtmlStatus(a),d._updateInterface(),d._trigger(b.jPlayer.event.timeupdate))},!1);
a.addEventListener("durationchange",function(){c.gate&&(d._getHtmlStatus(a),d._updateInterface(),d._trigger(b.jPlayer.event.durationchange))},!1);a.addEventListener("play",function(){c.gate&&(d._updateButtons(!0),d._html_checkWaitForPlay(),d._trigger(b.jPlayer.event.play))},!1);a.addEventListener("playing",function(){c.gate&&(d._updateButtons(!0),d._seeked(),d._trigger(b.jPlayer.event.playing))},!1);a.addEventListener("pause",function(){c.gate&&(d._updateButtons(!1),d._trigger(b.jPlayer.event.pause))},
!1);a.addEventListener("waiting",function(){c.gate&&(d._seeking(),d._trigger(b.jPlayer.event.waiting))},!1);a.addEventListener("seeking",function(){c.gate&&(d._seeking(),d._trigger(b.jPlayer.event.seeking))},!1);a.addEventListener("seeked",function(){c.gate&&(d._seeked(),d._trigger(b.jPlayer.event.seeked))},!1);a.addEventListener("volumechange",function(){c.gate&&(d.options.volume=a.volume,d.options.muted=a.muted,d._updateMute(),d._updateVolume(),d._trigger(b.jPlayer.event.volumechange))},!1);a.addEventListener("ratechange",
function(){c.gate&&(d.options.defaultPlaybackRate=a.defaultPlaybackRate,d.options.playbackRate=a.playbackRate,d._updatePlaybackRate(),d._trigger(b.jPlayer.event.ratechange))},!1);a.addEventListener("suspend",function(){c.gate&&(d._seeked(),d._trigger(b.jPlayer.event.suspend))},!1);a.addEventListener("ended",function(){c.gate&&(b.jPlayer.browser.webkit||(d.htmlElement.media.currentTime=0),d.htmlElement.media.pause(),d._updateButtons(!1),d._getHtmlStatus(a,!0),d._updateInterface(),d._trigger(b.jPlayer.event.ended))},
!1);a.addEventListener("error",function(){c.gate&&(d._updateButtons(!1),d._seeked(),d.status.srcSet&&(clearTimeout(d.internal.htmlDlyCmdId),d.status.waitForLoad=!0,d.status.waitForPlay=!0,d.status.video&&!d.status.nativeVideoControls&&d.internal.video.jq.css({width:"0px",height:"0px"}),d._validString(d.status.media.poster)&&!d.status.nativeVideoControls&&d.internal.poster.jq.show(),d.css.jq.videoPlay.length&&d.css.jq.videoPlay.show(),d._error({type:b.jPlayer.error.URL,context:d.status.src,message:b.jPlayer.errorMsg.URL,
hint:b.jPlayer.errorHint.URL})))},!1);b.each(b.jPlayer.htmlEvent,function(e,g){a.addEventListener(this,function(){c.gate&&d._trigger(b.jPlayer.event[g])},!1)})},_getHtmlStatus:function(a,c){var b=0,e=0,g=0,f=0;isFinite(a.duration)&&(this.status.duration=a.duration);b=a.currentTime;e=0<this.status.duration?100*b/this.status.duration:0;"object"===typeof a.seekable&&0<a.seekable.length?(g=0<this.status.duration?100*a.seekable.end(a.seekable.length-1)/this.status.duration:100,f=0<this.status.duration?
100*a.currentTime/a.seekable.end(a.seekable.length-1):0):(g=100,f=e);c&&(e=f=b=0);this.status.seekPercent=g;this.status.currentPercentRelative=f;this.status.currentPercentAbsolute=e;this.status.currentTime=b;this.status.videoWidth=a.videoWidth;this.status.videoHeight=a.videoHeight;this.status.readyState=a.readyState;this.status.networkState=a.networkState;this.status.playbackRate=a.playbackRate;this.status.ended=a.ended},_resetStatus:function(){this.status=b.extend({},this.status,b.jPlayer.prototype.status)},
_trigger:function(a,c,d){a=b.Event(a);a.jPlayer={};a.jPlayer.version=b.extend({},this.version);a.jPlayer.options=b.extend(!0,{},this.options);a.jPlayer.status=b.extend(!0,{},this.status);a.jPlayer.html=b.extend(!0,{},this.html);a.jPlayer.flash=b.extend(!0,{},this.flash);c&&(a.jPlayer.error=b.extend({},c));d&&(a.jPlayer.warning=b.extend({},d));this.element.trigger(a)},jPlayerFlashEvent:function(a,c){if(a===b.jPlayer.event.ready)if(!this.internal.ready)this.internal.ready=!0,this.internal.flash.jq.css({width:"0px",
height:"0px"}),this.version.flash=c.version,this.version.needFlash!==this.version.flash&&this._error({type:b.jPlayer.error.VERSION,context:this.version.flash,message:b.jPlayer.errorMsg.VERSION+this.version.flash,hint:b.jPlayer.errorHint.VERSION}),this._trigger(b.jPlayer.event.repeat),this._trigger(a);else if(this.flash.gate){if(this.status.srcSet){var d=this.status.currentTime,e=this.status.paused;this.setMedia(this.status.media);this.volumeWorker(this.options.volume);0<d&&(e?this.pause(d):this.play(d))}this._trigger(b.jPlayer.event.flashreset)}if(this.flash.gate)switch(a){case b.jPlayer.event.progress:this._getFlashStatus(c);
this._updateInterface();this._trigger(a);break;case b.jPlayer.event.timeupdate:this._getFlashStatus(c);this._updateInterface();this._trigger(a);break;case b.jPlayer.event.play:this._seeked();this._updateButtons(!0);this._trigger(a);break;case b.jPlayer.event.pause:this._updateButtons(!1);this._trigger(a);break;case b.jPlayer.event.ended:this._updateButtons(!1);this._trigger(a);break;case b.jPlayer.event.click:this._trigger(a);break;case b.jPlayer.event.error:this.status.waitForLoad=!0;this.status.waitForPlay=
!0;this.status.video&&this.internal.flash.jq.css({width:"0px",height:"0px"});this._validString(this.status.media.poster)&&this.internal.poster.jq.show();this.css.jq.videoPlay.length&&this.status.video&&this.css.jq.videoPlay.show();this.status.video?this._flash_setVideo(this.status.media):this._flash_setAudio(this.status.media);this._updateButtons(!1);this._error({type:b.jPlayer.error.URL,context:c.src,message:b.jPlayer.errorMsg.URL,hint:b.jPlayer.errorHint.URL});break;case b.jPlayer.event.seeking:this._seeking();
this._trigger(a);break;case b.jPlayer.event.seeked:this._seeked();this._trigger(a);break;case b.jPlayer.event.ready:break;default:this._trigger(a)}return!1},_getFlashStatus:function(a){this.status.seekPercent=a.seekPercent;this.status.currentPercentRelative=a.currentPercentRelative;this.status.currentPercentAbsolute=a.currentPercentAbsolute;this.status.currentTime=a.currentTime;this.status.duration=a.duration;this.status.videoWidth=a.videoWidth;this.status.videoHeight=a.videoHeight;this.status.readyState=
4;this.status.networkState=0;this.status.playbackRate=1;this.status.ended=!1},_updateButtons:function(a){a===f?a=!this.status.paused:this.status.paused=!a;this.css.jq.play.length&&this.css.jq.pause.length&&(a?(this.css.jq.play.hide(),this.css.jq.pause.show()):(this.css.jq.play.show(),this.css.jq.pause.hide()));this.css.jq.restoreScreen.length&&this.css.jq.fullScreen.length&&(this.status.noFullWindow?(this.css.jq.fullScreen.hide(),this.css.jq.restoreScreen.hide()):this.options.fullWindow?(this.css.jq.fullScreen.hide(),
this.css.jq.restoreScreen.show()):(this.css.jq.fullScreen.show(),this.css.jq.restoreScreen.hide()));this.css.jq.repeat.length&&this.css.jq.repeatOff.length&&(this.options.loop?(this.css.jq.repeat.hide(),this.css.jq.repeatOff.show()):(this.css.jq.repeat.show(),this.css.jq.repeatOff.hide()))},_updateInterface:function(){this.css.jq.seekBar.length&&this.css.jq.seekBar.width(this.status.seekPercent+"%");this.css.jq.playBar.length&&(this.options.smoothPlayBar?this.css.jq.playBar.stop().animate({width:this.status.currentPercentAbsolute+
"%"},250,"linear"):this.css.jq.playBar.width(this.status.currentPercentRelative+"%"));this.css.jq.currentTime.length&&this.css.jq.currentTime.text(this._convertTime(this.status.currentTime));this.css.jq.duration.length&&this.css.jq.duration.text(this._convertTime(this.status.duration))},_convertTime:m.prototype.time,_seeking:function(){this.css.jq.seekBar.length&&this.css.jq.seekBar.addClass("jp-seeking-bg")},_seeked:function(){this.css.jq.seekBar.length&&this.css.jq.seekBar.removeClass("jp-seeking-bg")},
_resetGate:function(){this.html.audio.gate=!1;this.html.video.gate=!1;this.flash.gate=!1},_resetActive:function(){this.html.active=!1;this.flash.active=!1},_escapeHtml:function(a){return a.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;")},_qualifyURL:function(a){var c=document.createElement("div");c.innerHTML='<a href="'+this._escapeHtml(a)+'">x</a>';return c.firstChild.href},_absoluteMediaUrls:function(a){var c=this;b.each(a,function(b,e){c.format[b]&&
(a[b]=c._qualifyURL(e))});return a},setMedia:function(a){var c=this,d=!1,e=this.status.media.poster!==a.poster;this._resetMedia();this._resetGate();this._resetActive();a=this._absoluteMediaUrls(a);b.each(this.formats,function(e,f){var k="video"===c.format[f].media;b.each(c.solutions,function(b,e){if(c[e].support[f]&&c._validString(a[f])){var g="html"===e;k?(g?(c.html.video.gate=!0,c._html_setVideo(a),c.html.active=!0):(c.flash.gate=!0,c._flash_setVideo(a),c.flash.active=!0),c.css.jq.videoPlay.length&&
c.css.jq.videoPlay.show(),c.status.video=!0):(g?(c.html.audio.gate=!0,c._html_setAudio(a),c.html.active=!0):(c.flash.gate=!0,c._flash_setAudio(a),c.flash.active=!0),c.css.jq.videoPlay.length&&c.css.jq.videoPlay.hide(),c.status.video=!1);d=!0;return!1}});if(d)return!1});d?(this.status.nativeVideoControls&&this.html.video.gate||!this._validString(a.poster)||(e?this.htmlElement.poster.src=a.poster:this.internal.poster.jq.show()),this.status.srcSet=!0,this.status.media=b.extend({},a),this._updateButtons(!1),
this._updateInterface()):this._error({type:b.jPlayer.error.NO_SUPPORT,context:"{supplied:'"+this.options.supplied+"'}",message:b.jPlayer.errorMsg.NO_SUPPORT,hint:b.jPlayer.errorHint.NO_SUPPORT})},_resetMedia:function(){this._resetStatus();this._updateButtons(!1);this._updateInterface();this._seeked();this.internal.poster.jq.hide();clearTimeout(this.internal.htmlDlyCmdId);this.html.active?this._html_resetMedia():this.flash.active&&this._flash_resetMedia()},clearMedia:function(){this._resetMedia();
this.html.active?this._html_clearMedia():this.flash.active&&this._flash_clearMedia();this._resetGate();this._resetActive()},load:function(){this.status.srcSet?this.html.active?this._html_load():this.flash.active&&this._flash_load():this._urlNotSetError("load")},focus:function(){this.options.keyEnabled&&(b.jPlayer.focus=this)},play:function(a){a="number"===typeof a?a:NaN;this.status.srcSet?(this.focus(),this.html.active?this._html_play(a):this.flash.active&&this._flash_play(a)):this._urlNotSetError("play")},
videoPlay:function(){this.play()},pause:function(a){a="number"===typeof a?a:NaN;this.status.srcSet?this.html.active?this._html_pause(a):this.flash.active&&this._flash_pause(a):this._urlNotSetError("pause")},tellOthers:function(a,c){var d=this,e="function"===typeof c,g=Array.prototype.slice.call(arguments);"string"===typeof a&&(e&&g.splice(1,1),b.each(this.instances,function(){d.element!==this&&(e&&!c.call(this.data("jPlayer"),d)||this.jPlayer.apply(this,g))}))},pauseOthers:function(a){this.tellOthers("pause",
function(){return this.status.srcSet},a)},stop:function(){this.status.srcSet?this.html.active?this._html_pause(0):this.flash.active&&this._flash_pause(0):this._urlNotSetError("stop")},playHead:function(a){a=this._limitValue(a,0,100);this.status.srcSet?this.html.active?this._html_playHead(a):this.flash.active&&this._flash_playHead(a):this._urlNotSetError("playHead")},_muted:function(a){this.mutedWorker(a);this.options.globalVolume&&this.tellOthers("mutedWorker",function(){return this.options.globalVolume},
a)},mutedWorker:function(a){this.options.muted=a;this.html.used&&this._html_setProperty("muted",a);this.flash.used&&this._flash_mute(a);this.html.video.gate||this.html.audio.gate||(this._updateMute(a),this._updateVolume(this.options.volume),this._trigger(b.jPlayer.event.volumechange))},mute:function(a){a=a===f?!0:!!a;this._muted(a)},unmute:function(a){a=a===f?!0:!!a;this._muted(!a)},_updateMute:function(a){a===f&&(a=this.options.muted);this.css.jq.mute.length&&this.css.jq.unmute.length&&(this.status.noVolume?
(this.css.jq.mute.hide(),this.css.jq.unmute.hide()):a?(this.css.jq.mute.hide(),this.css.jq.unmute.show()):(this.css.jq.mute.show(),this.css.jq.unmute.hide()))},volume:function(a){this.volumeWorker(a);this.options.globalVolume&&this.tellOthers("volumeWorker",function(){return this.options.globalVolume},a)},volumeWorker:function(a){a=this._limitValue(a,0,1);this.options.volume=a;this.html.used&&this._html_setProperty("volume",a);this.flash.used&&this._flash_volume(a);this.html.video.gate||this.html.audio.gate||
(this._updateVolume(a),this._trigger(b.jPlayer.event.volumechange))},volumeBar:function(a){if(this.css.jq.volumeBar.length){var c=b(a.currentTarget),d=c.offset(),e=a.pageX-d.left,g=c.width();a=c.height()-a.pageY+d.top;c=c.height();this.options.verticalVolume?this.volume(a/c):this.volume(e/g)}this.options.muted&&this._muted(!1)},volumeBarValue:function(){},_updateVolume:function(a){a===f&&(a=this.options.volume);a=this.options.muted?0:a;this.status.noVolume?(this.css.jq.volumeBar.length&&this.css.jq.volumeBar.hide(),
this.css.jq.volumeBarValue.length&&this.css.jq.volumeBarValue.hide(),this.css.jq.volumeMax.length&&this.css.jq.volumeMax.hide()):(this.css.jq.volumeBar.length&&this.css.jq.volumeBar.show(),this.css.jq.volumeBarValue.length&&(this.css.jq.volumeBarValue.show(),this.css.jq.volumeBarValue[this.options.verticalVolume?"height":"width"](100*a+"%")),this.css.jq.volumeMax.length&&this.css.jq.volumeMax.show())},volumeMax:function(){this.volume(1);this.options.muted&&this._muted(!1)},_cssSelectorAncestor:function(a){var c=
this;this.options.cssSelectorAncestor=a;this._removeUiClass();this.ancestorJq=a?b(a):[];a&&1!==this.ancestorJq.length&&this._warning({type:b.jPlayer.warning.CSS_SELECTOR_COUNT,context:a,message:b.jPlayer.warningMsg.CSS_SELECTOR_COUNT+this.ancestorJq.length+" found for cssSelectorAncestor.",hint:b.jPlayer.warningHint.CSS_SELECTOR_COUNT});this._addUiClass();b.each(this.options.cssSelector,function(a,b){c._cssSelector(a,b)});this._updateInterface();this._updateButtons();this._updateAutohide();this._updateVolume();
this._updateMute()},_cssSelector:function(a,c){var d=this;"string"===typeof c?b.jPlayer.prototype.options.cssSelector[a]?(this.css.jq[a]&&this.css.jq[a].length&&this.css.jq[a].unbind(".jPlayer"),this.options.cssSelector[a]=c,this.css.cs[a]=this.options.cssSelectorAncestor+" "+c,this.css.jq[a]=c?b(this.css.cs[a]):[],this.css.jq[a].length&&this.css.jq[a].bind("click.jPlayer",function(c){c.preventDefault();d[a](c);b(this).blur()}),c&&1!==this.css.jq[a].length&&this._warning({type:b.jPlayer.warning.CSS_SELECTOR_COUNT,
context:this.css.cs[a],message:b.jPlayer.warningMsg.CSS_SELECTOR_COUNT+this.css.jq[a].length+" found for "+a+" method.",hint:b.jPlayer.warningHint.CSS_SELECTOR_COUNT})):this._warning({type:b.jPlayer.warning.CSS_SELECTOR_METHOD,context:a,message:b.jPlayer.warningMsg.CSS_SELECTOR_METHOD,hint:b.jPlayer.warningHint.CSS_SELECTOR_METHOD}):this._warning({type:b.jPlayer.warning.CSS_SELECTOR_STRING,context:c,message:b.jPlayer.warningMsg.CSS_SELECTOR_STRING,hint:b.jPlayer.warningHint.CSS_SELECTOR_STRING})},
seekBar:function(a){if(this.css.jq.seekBar.length){var c=b(a.currentTarget),d=c.offset();a=a.pageX-d.left;c=c.width();this.playHead(100*a/c)}},playBar:function(){},playbackRate:function(a){this._setOption("playbackRate",a)},playbackRateBar:function(a){if(this.css.jq.playbackRateBar.length){var c=b(a.currentTarget),d=c.offset(),e=a.pageX-d.left,g=c.width();a=c.height()-a.pageY+d.top;c=c.height();this.playbackRate((this.options.verticalPlaybackRate?a/c:e/g)*(this.options.maxPlaybackRate-this.options.minPlaybackRate)+
this.options.minPlaybackRate)}},playbackRateBarValue:function(){},_updatePlaybackRate:function(){var a=(this.options.playbackRate-this.options.minPlaybackRate)/(this.options.maxPlaybackRate-this.options.minPlaybackRate);this.status.playbackRateEnabled?(this.css.jq.playbackRateBar.length&&this.css.jq.playbackRateBar.show(),this.css.jq.playbackRateBarValue.length&&(this.css.jq.playbackRateBarValue.show(),this.css.jq.playbackRateBarValue[this.options.verticalPlaybackRate?"height":"width"](100*a+"%"))):
(this.css.jq.playbackRateBar.length&&this.css.jq.playbackRateBar.hide(),this.css.jq.playbackRateBarValue.length&&this.css.jq.playbackRateBarValue.hide())},repeat:function(){this._loop(!0)},repeatOff:function(){this._loop(!1)},_loop:function(a){this.options.loop!==a&&(this.options.loop=a,this._updateButtons(),this._trigger(b.jPlayer.event.repeat))},currentTime:function(){},duration:function(){},gui:function(){},noSolution:function(){},option:function(a,c){var d=a;if(0===arguments.length)return b.extend(!0,
{},this.options);if("string"===typeof a){var e=a.split(".");if(c===f){for(var d=b.extend(!0,{},this.options),g=0;g<e.length;g++)if(d[e[g]]!==f)d=d[e[g]];else return this._warning({type:b.jPlayer.warning.OPTION_KEY,context:a,message:b.jPlayer.warningMsg.OPTION_KEY,hint:b.jPlayer.warningHint.OPTION_KEY}),f;return d}for(var g=d={},h=0;h<e.length;h++)h<e.length-1?(g[e[h]]={},g=g[e[h]]):g[e[h]]=c}this._setOptions(d);return this},_setOptions:function(a){var c=this;b.each(a,function(a,b){c._setOption(a,
b)});return this},_setOption:function(a,c){var d=this;switch(a){case "volume":this.volume(c);break;case "muted":this._muted(c);break;case "globalVolume":this.options[a]=c;break;case "cssSelectorAncestor":this._cssSelectorAncestor(c);break;case "cssSelector":b.each(c,function(a,c){d._cssSelector(a,c)});break;case "playbackRate":this.options[a]=c=this._limitValue(c,this.options.minPlaybackRate,this.options.maxPlaybackRate);this.html.used&&this._html_setProperty("playbackRate",c);this._updatePlaybackRate();
break;case "defaultPlaybackRate":this.options[a]=c=this._limitValue(c,this.options.minPlaybackRate,this.options.maxPlaybackRate);this.html.used&&this._html_setProperty("defaultPlaybackRate",c);this._updatePlaybackRate();break;case "minPlaybackRate":this.options[a]=c=this._limitValue(c,0.1,this.options.maxPlaybackRate-0.1);this._updatePlaybackRate();break;case "maxPlaybackRate":this.options[a]=c=this._limitValue(c,this.options.minPlaybackRate+0.1,16);this._updatePlaybackRate();break;case "fullScreen":if(this.options[a]!==
c){var e=b.jPlayer.nativeFeatures.fullscreen.used.webkitVideo;if(!e||e&&!this.status.waitForPlay)e||(this.options[a]=c),c?this._requestFullscreen():this._exitFullscreen(),e||this._setOption("fullWindow",c)}break;case "fullWindow":this.options[a]!==c&&(this._removeUiClass(),this.options[a]=c,this._refreshSize());break;case "size":this.options.fullWindow||this.options[a].cssClass===c.cssClass||this._removeUiClass();this.options[a]=b.extend({},this.options[a],c);this._refreshSize();break;case "sizeFull":this.options.fullWindow&&
this.options[a].cssClass!==c.cssClass&&this._removeUiClass();this.options[a]=b.extend({},this.options[a],c);this._refreshSize();break;case "autohide":this.options[a]=b.extend({},this.options[a],c);this._updateAutohide();break;case "loop":this._loop(c);break;case "nativeVideoControls":this.options[a]=b.extend({},this.options[a],c);this.status.nativeVideoControls=this._uaBlocklist(this.options.nativeVideoControls);this._restrictNativeVideoControls();this._updateNativeVideoControls();break;case "noFullWindow":this.options[a]=
b.extend({},this.options[a],c);this.status.nativeVideoControls=this._uaBlocklist(this.options.nativeVideoControls);this.status.noFullWindow=this._uaBlocklist(this.options.noFullWindow);this._restrictNativeVideoControls();this._updateButtons();break;case "noVolume":this.options[a]=b.extend({},this.options[a],c);this.status.noVolume=this._uaBlocklist(this.options.noVolume);this._updateVolume();this._updateMute();break;case "emulateHtml":this.options[a]!==c&&((this.options[a]=c)?this._emulateHtmlBridge():
this._destroyHtmlBridge());break;case "timeFormat":this.options[a]=b.extend({},this.options[a],c);break;case "keyEnabled":this.options[a]=c;c||this!==b.jPlayer.focus||(b.jPlayer.focus=null);break;case "keyBindings":this.options[a]=b.extend(!0,{},this.options[a],c);break;case "audioFullScreen":this.options[a]=c}return this},_refreshSize:function(){this._setSize();this._addUiClass();this._updateSize();this._updateButtons();this._updateAutohide();this._trigger(b.jPlayer.event.resize)},_setSize:function(){this.options.fullWindow?
(this.status.width=this.options.sizeFull.width,this.status.height=this.options.sizeFull.height,this.status.cssClass=this.options.sizeFull.cssClass):(this.status.width=this.options.size.width,this.status.height=this.options.size.height,this.status.cssClass=this.options.size.cssClass);this.element.css({width:this.status.width,height:this.status.height})},_addUiClass:function(){this.ancestorJq.length&&this.ancestorJq.addClass(this.status.cssClass)},_removeUiClass:function(){this.ancestorJq.length&&this.ancestorJq.removeClass(this.status.cssClass)},
_updateSize:function(){this.internal.poster.jq.css({width:this.status.width,height:this.status.height});!this.status.waitForPlay&&this.html.active&&this.status.video||this.html.video.available&&this.html.used&&this.status.nativeVideoControls?this.internal.video.jq.css({width:this.status.width,height:this.status.height}):!this.status.waitForPlay&&this.flash.active&&this.status.video&&this.internal.flash.jq.css({width:this.status.width,height:this.status.height})},_updateAutohide:function(){var a=this,
c=function(){a.css.jq.gui.fadeIn(a.options.autohide.fadeIn,function(){clearTimeout(a.internal.autohideId);a.internal.autohideId=setTimeout(function(){a.css.jq.gui.fadeOut(a.options.autohide.fadeOut)},a.options.autohide.hold)})};this.css.jq.gui.length&&(this.css.jq.gui.stop(!0,!0),clearTimeout(this.internal.autohideId),this.element.unbind(".jPlayerAutohide"),this.css.jq.gui.unbind(".jPlayerAutohide"),this.status.nativeVideoControls?this.css.jq.gui.hide():this.options.fullWindow&&this.options.autohide.full||
!this.options.fullWindow&&this.options.autohide.restored?(this.element.bind("mousemove.jPlayer.jPlayerAutohide",c),this.css.jq.gui.bind("mousemove.jPlayer.jPlayerAutohide",c),this.css.jq.gui.hide()):this.css.jq.gui.show())},fullScreen:function(){this._setOption("fullScreen",!0)},restoreScreen:function(){this._setOption("fullScreen",!1)},_fullscreenAddEventListeners:function(){var a=this,c=b.jPlayer.nativeFeatures.fullscreen;c.api.fullscreenEnabled&&c.event.fullscreenchange&&("function"!==typeof this.internal.fullscreenchangeHandler&&
(this.internal.fullscreenchangeHandler=function(){a._fullscreenchange()}),document.addEventListener(c.event.fullscreenchange,this.internal.fullscreenchangeHandler,!1))},_fullscreenRemoveEventListeners:function(){var a=b.jPlayer.nativeFeatures.fullscreen;this.internal.fullscreenchangeHandler&&document.addEventListener(a.event.fullscreenchange,this.internal.fullscreenchangeHandler,!1)},_fullscreenchange:function(){this.options.fullScreen&&!b.jPlayer.nativeFeatures.fullscreen.api.fullscreenElement()&&
this._setOption("fullScreen",!1)},_requestFullscreen:function(){var a=this.ancestorJq.length?this.ancestorJq[0]:this.element[0],c=b.jPlayer.nativeFeatures.fullscreen;c.used.webkitVideo&&(a=this.htmlElement.video);c.api.fullscreenEnabled&&c.api.requestFullscreen(a)},_exitFullscreen:function(){var a=b.jPlayer.nativeFeatures.fullscreen,c;a.used.webkitVideo&&(c=this.htmlElement.video);a.api.fullscreenEnabled&&a.api.exitFullscreen(c)},_html_initMedia:function(a){var c=b(this.htmlElement.media).empty();
b.each(a.track||[],function(a,b){var g=document.createElement("track");g.setAttribute("kind",b.kind?b.kind:"");g.setAttribute("src",b.src?b.src:"");g.setAttribute("srclang",b.srclang?b.srclang:"");g.setAttribute("label",b.label?b.label:"");b.def&&g.setAttribute("default",b.def);c.append(g)});this.htmlElement.media.src=this.status.src;"none"!==this.options.preload&&this._html_load();this._trigger(b.jPlayer.event.timeupdate)},_html_setFormat:function(a){var c=this;b.each(this.formats,function(b,e){if(c.html.support[e]&&
a[e])return c.status.src=a[e],c.status.format[e]=!0,c.status.formatType=e,!1})},_html_setAudio:function(a){this._html_setFormat(a);this.htmlElement.media=this.htmlElement.audio;this._html_initMedia(a)},_html_setVideo:function(a){this._html_setFormat(a);this.status.nativeVideoControls&&(this.htmlElement.video.poster=this._validString(a.poster)?a.poster:"");this.htmlElement.media=this.htmlElement.video;this._html_initMedia(a)},_html_resetMedia:function(){this.htmlElement.media&&(this.htmlElement.media.id!==
this.internal.video.id||this.status.nativeVideoControls||this.internal.video.jq.css({width:"0px",height:"0px"}),this.htmlElement.media.pause())},_html_clearMedia:function(){this.htmlElement.media&&(this.htmlElement.media.src="about:blank",this.htmlElement.media.load())},_html_load:function(){this.status.waitForLoad&&(this.status.waitForLoad=!1,this.htmlElement.media.load());clearTimeout(this.internal.htmlDlyCmdId)},_html_play:function(a){var b=this,d=this.htmlElement.media;this._html_load();if(isNaN(a))d.play();
else{this.internal.cmdsIgnored&&d.play();try{if(!d.seekable||"object"===typeof d.seekable&&0<d.seekable.length)d.currentTime=a,d.play();else throw 1;}catch(e){this.internal.htmlDlyCmdId=setTimeout(function(){b.play(a)},250);return}}this._html_checkWaitForPlay()},_html_pause:function(a){var b=this,d=this.htmlElement.media;0<a?this._html_load():clearTimeout(this.internal.htmlDlyCmdId);d.pause();if(!isNaN(a))try{if(!d.seekable||"object"===typeof d.seekable&&0<d.seekable.length)d.currentTime=a;else throw 1;
}catch(e){this.internal.htmlDlyCmdId=setTimeout(function(){b.pause(a)},250);return}0<a&&this._html_checkWaitForPlay()},_html_playHead:function(a){var b=this,d=this.htmlElement.media;this._html_load();try{if("object"===typeof d.seekable&&0<d.seekable.length)d.currentTime=a*d.seekable.end(d.seekable.length-1)/100;else if(0<d.duration&&!isNaN(d.duration))d.currentTime=a*d.duration/100;else throw"e";}catch(e){this.internal.htmlDlyCmdId=setTimeout(function(){b.playHead(a)},250);return}this.status.waitForLoad||
this._html_checkWaitForPlay()},_html_checkWaitForPlay:function(){this.status.waitForPlay&&(this.status.waitForPlay=!1,this.css.jq.videoPlay.length&&this.css.jq.videoPlay.hide(),this.status.video&&(this.internal.poster.jq.hide(),this.internal.video.jq.css({width:this.status.width,height:this.status.height})))},_html_setProperty:function(a,b){this.html.audio.available&&(this.htmlElement.audio[a]=b);this.html.video.available&&(this.htmlElement.video[a]=b)},_flash_setAudio:function(a){var c=this;try{b.each(this.formats,
function(b,d){if(c.flash.support[d]&&a[d]){switch(d){case "m4a":case "fla":c._getMovie().fl_setAudio_m4a(a[d]);break;case "mp3":c._getMovie().fl_setAudio_mp3(a[d]);break;case "rtmpa":c._getMovie().fl_setAudio_rtmp(a[d])}c.status.src=a[d];c.status.format[d]=!0;c.status.formatType=d;return!1}}),"auto"===this.options.preload&&(this._flash_load(),this.status.waitForLoad=!1)}catch(d){this._flashError(d)}},_flash_setVideo:function(a){var c=this;try{b.each(this.formats,function(b,d){if(c.flash.support[d]&&
a[d]){switch(d){case "m4v":case "flv":c._getMovie().fl_setVideo_m4v(a[d]);break;case "rtmpv":c._getMovie().fl_setVideo_rtmp(a[d])}c.status.src=a[d];c.status.format[d]=!0;c.status.formatType=d;return!1}}),"auto"===this.options.preload&&(this._flash_load(),this.status.waitForLoad=!1)}catch(d){this._flashError(d)}},_flash_resetMedia:function(){this.internal.flash.jq.css({width:"0px",height:"0px"});this._flash_pause(NaN)},_flash_clearMedia:function(){try{this._getMovie().fl_clearMedia()}catch(a){this._flashError(a)}},
_flash_load:function(){try{this._getMovie().fl_load()}catch(a){this._flashError(a)}this.status.waitForLoad=!1},_flash_play:function(a){try{this._getMovie().fl_play(a)}catch(b){this._flashError(b)}this.status.waitForLoad=!1;this._flash_checkWaitForPlay()},_flash_pause:function(a){try{this._getMovie().fl_pause(a)}catch(b){this._flashError(b)}0<a&&(this.status.waitForLoad=!1,this._flash_checkWaitForPlay())},_flash_playHead:function(a){try{this._getMovie().fl_play_head(a)}catch(b){this._flashError(b)}this.status.waitForLoad||
this._flash_checkWaitForPlay()},_flash_checkWaitForPlay:function(){this.status.waitForPlay&&(this.status.waitForPlay=!1,this.css.jq.videoPlay.length&&this.css.jq.videoPlay.hide(),this.status.video&&(this.internal.poster.jq.hide(),this.internal.flash.jq.css({width:this.status.width,height:this.status.height})))},_flash_volume:function(a){try{this._getMovie().fl_volume(a)}catch(b){this._flashError(b)}},_flash_mute:function(a){try{this._getMovie().fl_mute(a)}catch(b){this._flashError(b)}},_getMovie:function(){return document[this.internal.flash.id]},
_getFlashPluginVersion:function(){var a=0,b;if(window.ActiveXObject)try{if(b=new ActiveXObject("ShockwaveFlash.ShockwaveFlash")){var d=b.GetVariable("$version");d&&(d=d.split(" ")[1].split(","),a=parseInt(d[0],10)+"."+parseInt(d[1],10))}}catch(e){}else navigator.plugins&&0<navigator.mimeTypes.length&&(b=navigator.plugins["Shockwave Flash"])&&(a=navigator.plugins["Shockwave Flash"].description.replace(/.*\s(\d+\.\d+).*/,"$1"));return 1*a},_checkForFlash:function(a){var b=!1;this._getFlashPluginVersion()>=
a&&(b=!0);return b},_validString:function(a){return a&&"string"===typeof a},_limitValue:function(a,b,d){return a<b?b:a>d?d:a},_urlNotSetError:function(a){this._error({type:b.jPlayer.error.URL_NOT_SET,context:a,message:b.jPlayer.errorMsg.URL_NOT_SET,hint:b.jPlayer.errorHint.URL_NOT_SET})},_flashError:function(a){var c;c=this.internal.ready?"FLASH_DISABLED":"FLASH";this._error({type:b.jPlayer.error[c],context:this.internal.flash.swf,message:b.jPlayer.errorMsg[c]+a.message,hint:b.jPlayer.errorHint[c]});
this.internal.flash.jq.css({width:"1px",height:"1px"})},_error:function(a){this._trigger(b.jPlayer.event.error,a);this.options.errorAlerts&&this._alert("Error!"+(a.message?"\n"+a.message:"")+(a.hint?"\n"+a.hint:"")+"\nContext: "+a.context)},_warning:function(a){this._trigger(b.jPlayer.event.warning,f,a);this.options.warningAlerts&&this._alert("Warning!"+(a.message?"\n"+a.message:"")+(a.hint?"\n"+a.hint:"")+"\nContext: "+a.context)},_alert:function(a){a="jPlayer "+this.version.script+" : id='"+this.internal.self.id+
"' : "+a;this.options.consoleAlerts?console&&console.log&&console.log(a):alert(a)},_emulateHtmlBridge:function(){var a=this;b.each(b.jPlayer.emulateMethods.split(/\s+/g),function(b,d){a.internal.domNode[d]=function(b){a[d](b)}});b.each(b.jPlayer.event,function(c,d){var e=!0;b.each(b.jPlayer.reservedEvent.split(/\s+/g),function(a,b){if(b===c)return e=!1});e&&a.element.bind(d+".jPlayer.jPlayerHtml",function(){a._emulateHtmlUpdate();var b=document.createEvent("Event");b.initEvent(c,!1,!0);a.internal.domNode.dispatchEvent(b)})})},
_emulateHtmlUpdate:function(){var a=this;b.each(b.jPlayer.emulateStatus.split(/\s+/g),function(b,d){a.internal.domNode[d]=a.status[d]});b.each(b.jPlayer.emulateOptions.split(/\s+/g),function(b,d){a.internal.domNode[d]=a.options[d]})},_destroyHtmlBridge:function(){var a=this;this.element.unbind(".jPlayerHtml");b.each((b.jPlayer.emulateMethods+" "+b.jPlayer.emulateStatus+" "+b.jPlayer.emulateOptions).split(/\s+/g),function(b,d){delete a.internal.domNode[d]})}};b.jPlayer.error={FLASH:"e_flash",FLASH_DISABLED:"e_flash_disabled",
NO_SOLUTION:"e_no_solution",NO_SUPPORT:"e_no_support",URL:"e_url",URL_NOT_SET:"e_url_not_set",VERSION:"e_version"};b.jPlayer.errorMsg={FLASH:"jPlayer's Flash fallback is not configured correctly, or a command was issued before the jPlayer Ready event. Details: ",FLASH_DISABLED:"jPlayer's Flash fallback has been disabled by the browser due to the CSS rules you have used. Details: ",NO_SOLUTION:"No solution can be found by jPlayer in this browser. Neither HTML nor Flash can be used.",NO_SUPPORT:"It is not possible to play any media format provided in setMedia() on this browser using your current options.",
URL:"Media URL could not be loaded.",URL_NOT_SET:"Attempt to issue media playback commands, while no media url is set.",VERSION:"jPlayer "+b.jPlayer.prototype.version.script+" needs Jplayer.swf version "+b.jPlayer.prototype.version.needFlash+" but found "};b.jPlayer.errorHint={FLASH:"Check your swfPath option and that Jplayer.swf is there.",FLASH_DISABLED:"Check that you have not display:none; the jPlayer entity or any ancestor.",NO_SOLUTION:"Review the jPlayer options: support and supplied.",NO_SUPPORT:"Video or audio formats defined in the supplied option are missing.",
URL:"Check media URL is valid.",URL_NOT_SET:"Use setMedia() to set the media URL.",VERSION:"Update jPlayer files."};b.jPlayer.warning={CSS_SELECTOR_COUNT:"e_css_selector_count",CSS_SELECTOR_METHOD:"e_css_selector_method",CSS_SELECTOR_STRING:"e_css_selector_string",OPTION_KEY:"e_option_key"};b.jPlayer.warningMsg={CSS_SELECTOR_COUNT:"The number of css selectors found did not equal one: ",CSS_SELECTOR_METHOD:"The methodName given in jPlayer('cssSelector') is not a valid jPlayer method.",CSS_SELECTOR_STRING:"The methodCssSelector given in jPlayer('cssSelector') is not a String or is empty.",
OPTION_KEY:"The option requested in jPlayer('option') is undefined."};b.jPlayer.warningHint={CSS_SELECTOR_COUNT:"Check your css selector and the ancestor.",CSS_SELECTOR_METHOD:"Check your method name.",CSS_SELECTOR_STRING:"Check your css selector is a string.",OPTION_KEY:"Check your option name."}});




/*!
 * zeroclipboard
 * The ZeroClipboard library provides an easy way to copy text to the clipboard using an invisible Adobe Flash movie, and a JavaScript interface.
 * Copyright 2013 Jon Rohan, James M. Greene, .
 * Released under the MIT license
 * http://zeroclipboard.github.io/ZeroClipboard/
 * v1.2.0-beta.4
 */(function(){"use strict";var a=function(){var a=/\-([a-z])/g,b=function(a,b){return b.toUpperCase()};return function(c){return c.replace(a,b)}}(),b=function(b,c){var d,e,f,g,h,i;window.getComputedStyle?d=window.getComputedStyle(b,null).getPropertyValue(c):(e=a(c),b.currentStyle?d=b.currentStyle[e]:d=b.style[e]);if(c==="cursor")if(!d||d==="auto"){f=b.tagName.toLowerCase(),g=["a"];for(h=0,i=g.length;h<i;h++)if(f===g[h])return"pointer"}return d},c=function(a){if(!o.prototype._singleton)return;a||(a=window.event);var b;this!==window?b=this:a.target?b=a.target:a.srcElement&&(b=a.srcElement),o.prototype._singleton.setCurrent(b)},d=function(a,b,c){a.addEventListener?a.addEventListener(b,c,!1):a.attachEvent&&a.attachEvent("on"+b,c)},e=function(a,b,c){a.removeEventListener?a.removeEventListener(b,c,!1):a.detachEvent&&a.detachEvent("on"+b,c)},f=function(a,b){if(a.addClass)return a.addClass(b),a;if(b&&typeof b=="string"){var c=(b||"").split(/\s+/);if(a.nodeType===1)if(!a.className)a.className=b;else{var d=" "+a.className+" ",e=a.className;for(var f=0,g=c.length;f<g;f++)d.indexOf(" "+c[f]+" ")<0&&(e+=" "+c[f]);a.className=e.replace(/^\s+|\s+$/g,"")}}return a},g=function(a,b){if(a.removeClass)return a.removeClass(b),a;if(b&&typeof b=="string"||b===undefined){var c=(b||"").split(/\s+/);if(a.nodeType===1&&a.className)if(b){var d=(" "+a.className+" ").replace(/[\n\t]/g," ");for(var e=0,f=c.length;e<f;e++)d=d.replace(" "+c[e]+" "," ");a.className=d.replace(/^\s+|\s+$/g,"")}else a.className=""}return a},h=function(){var a,b,c,d=1;return typeof document.body.getBoundingClientRect=="function"&&(a=document.body.getBoundingClientRect(),b=a.right-a.left,c=document.body.offsetWidth,d=Math.round(b/c*100)/100),d},i=function(a){var c={left:0,top:0,width:0,height:0,zIndex:999999999},d=b(a,"z-index");d&&d!=="auto"&&(c.zIndex=parseInt(d,10));if(a.getBoundingClientRect){var e=a.getBoundingClientRect(),f,g,i;"pageXOffset"in window&&"pageYOffset"in window?(f=window.pageXOffset,g=window.pageYOffset):(i=h(),f=Math.round(document.documentElement.scrollLeft/i),g=Math.round(document.documentElement.scrollTop/i));var j=document.documentElement.clientLeft||0,k=document.documentElement.clientTop||0;c.left=e.left+f-j,c.top=e.top+g-k,c.width="width"in e?e.width:e.right-e.left,c.height="height"in e?e.height:e.bottom-e.top}return c},j=function(a){var b=o.prototype._singleton;return b.options.useNoCache?(a.indexOf("?")>=0?"&nocache=":"?nocache=")+(new Date).getTime():""},k=function(a){var b=[];if(a.trustedDomains){var c;typeof a.trustedDomains=="string"&&a.trustedDomains?c=[a.trustedDomains]:"length"in a.trustedDomains&&(c=a.trustedDomains),b.push("trustedDomain="+encodeURIComponent(c.join(",")))}return typeof a.amdModuleId=="string"&&a.amdModuleId&&b.push("amdModuleId="+encodeURIComponent(a.amdModuleId)),typeof a.cjsModuleId=="string"&&a.cjsModuleId&&b.push("cjsModuleId="+encodeURIComponent(a.cjsModuleId)),b.join("&")},l=function(a,b){if(b.indexOf)return b.indexOf(a);for(var c=0,d=b.length;c<d;c++)if(b[c]===a)return c;return-1},m=function(a){if(typeof a=="string")throw new TypeError("ZeroClipboard doesn't accept query strings.");return a.length?a:[a]},n=function(a,b,c,d,e){e?window.setTimeout(function(){a.call(b,c,d)},0):a.call(b,c,d)},o=function(a,b){a&&(o.prototype._singleton||this).glue(a);if(o.prototype._singleton)return o.prototype._singleton;o.prototype._singleton=this,this.options={};for(var c in s)this.options[c]=s[c];for(var d in b)this.options[d]=b[d];this.handlers={},o.detectFlashSupport()&&v()},p,q=[];o.prototype.setCurrent=function(a){p=a,this.reposition();var c=a.getAttribute("title");c&&this.setTitle(c);var d=this.options.forceHandCursor===!0||b(a,"cursor")==="pointer";r.call(this,d)},o.prototype.setText=function(a){a&&a!==""&&(this.options.text=a,this.ready()&&this.flashBridge.setText(a))},o.prototype.setTitle=function(a){a&&a!==""&&this.htmlBridge.setAttribute("title",a)},o.prototype.setSize=function(a,b){this.ready()&&this.flashBridge.setSize(a,b)},o.prototype.setHandCursor=function(a){a=typeof a=="boolean"?a:!!a,r.call(this,a),this.options.forceHandCursor=a};var r=function(a){this.ready()&&this.flashBridge.setHandCursor(a)};o.version="1.2.0-beta.4";var s={moviePath:"ZeroClipboard.swf",trustedDomains:null,text:null,hoverClass:"zeroclipboard-is-hover",activeClass:"zeroclipboard-is-active",allowScriptAccess:"sameDomain",useNoCache:!0,forceHandCursor:!1};o.setDefaults=function(a){for(var b in a)s[b]=a[b]},o.destroy=function(){o.prototype._singleton.unglue(q);var a=o.prototype._singleton.htmlBridge;a.parentNode.removeChild(a),delete o.prototype._singleton},o.detectFlashSupport=function(){var a=!1;if(typeof ActiveXObject=="function")try{new ActiveXObject("ShockwaveFlash.ShockwaveFlash")&&(a=!0)}catch(b){}return!a&&navigator.mimeTypes["application/x-shockwave-flash"]&&(a=!0),a};var t=null,u=null,v=function(){var a=o.prototype._singleton,b=document.getElementById("global-zeroclipboard-html-bridge");if(!b){var c={};for(var d in a.options)c[d]=a.options[d];c.amdModuleId=t,c.cjsModuleId=u;var e=k(c),f='      <object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" id="global-zeroclipboard-flash-bridge" width="100%" height="100%">         <param name="movie" value="'+a.options.moviePath+j(a.options.moviePath)+'"/>         <param name="allowScriptAccess" value="'+a.options.allowScriptAccess+'"/>         <param name="scale" value="exactfit"/>         <param name="loop" value="false"/>         <param name="menu" value="false"/>         <param name="quality" value="best" />         <param name="bgcolor" value="#ffffff"/>         <param name="wmode" value="transparent"/>         <param name="flashvars" value="'+e+'"/>         <embed src="'+a.options.moviePath+j(a.options.moviePath)+'"           loop="false" menu="false"           quality="best" bgcolor="#ffffff"           width="100%" height="100%"           name="global-zeroclipboard-flash-bridge"           allowScriptAccess="always"           allowFullScreen="false"           type="application/x-shockwave-flash"           wmode="transparent"           pluginspage="http://www.macromedia.com/go/getflashplayer"           flashvars="'+e+'"           scale="exactfit">         </embed>       </object>';b=document.createElement("div"),b.id="global-zeroclipboard-html-bridge",b.setAttribute("class","global-zeroclipboard-container"),b.setAttribute("data-clipboard-ready",!1),b.style.position="absolute",b.style.left="-9999px",b.style.top="-9999px",b.style.width="15px",b.style.height="15px",b.style.zIndex="9999",b.innerHTML=f,document.body.appendChild(b)}a.htmlBridge=b,a.flashBridge=document["global-zeroclipboard-flash-bridge"]||b.children[0].lastElementChild};o.prototype.resetBridge=function(){this.htmlBridge.style.left="-9999px",this.htmlBridge.style.top="-9999px",this.htmlBridge.removeAttribute("title"),this.htmlBridge.removeAttribute("data-clipboard-text"),g(p,this.options.activeClass),p=null,this.options.text=null},o.prototype.ready=function(){var a=this.htmlBridge.getAttribute("data-clipboard-ready");return a==="true"||a===!0},o.prototype.reposition=function(){if(!p)return!1;var a=i(p);this.htmlBridge.style.top=a.top+"px",this.htmlBridge.style.left=a.left+"px",this.htmlBridge.style.width=a.width+"px",this.htmlBridge.style.height=a.height+"px",this.htmlBridge.style.zIndex=a.zIndex+1,this.setSize(a.width,a.height)},o.dispatch=function(a,b){o.prototype._singleton.receiveEvent(a,b)},o.prototype.on=function(a,b){var c=a.toString().split(/\s/g);for(var d=0;d<c.length;d++)a=c[d].toLowerCase().replace(/^on/,""),this.handlers[a]||(this.handlers[a]=b);this.handlers.noflash&&!o.detectFlashSupport()&&this.receiveEvent("onNoFlash",null)},o.prototype.addEventListener=o.prototype.on,o.prototype.off=function(a,b){var c=a.toString().split(/\s/g);for(var d=0;d<c.length;d++){a=c[d].toLowerCase().replace(/^on/,"");for(var e in this.handlers)e===a&&this.handlers[e]===b&&delete this.handlers[e]}},o.prototype.removeEventListener=o.prototype.off,o.prototype.receiveEvent=function(a,b){a=a.toString().toLowerCase().replace(/^on/,"");var c=p,d=!0;switch(a){case"load":if(b&&parseFloat(b.flashVersion.replace(",",".").replace(/[^0-9\.]/gi,""))<10){this.receiveEvent("onWrongFlash",{flashVersion:b.flashVersion});return}this.htmlBridge.setAttribute("data-clipboard-ready",!0);break;case"mouseover":f(c,this.options.hoverClass);break;case"mouseout":g(c,this.options.hoverClass),this.resetBridge();break;case"mousedown":f(c,this.options.activeClass);break;case"mouseup":g(c,this.options.activeClass);break;case"datarequested":var e=c.getAttribute("data-clipboard-target"),h=e?document.getElementById(e):null;if(h){var i=h.value||h.textContent||h.innerText;i&&this.setText(i)}else{var j=c.getAttribute("data-clipboard-text");j&&this.setText(j)}d=!1;break;case"complete":this.options.text=null}if(this.handlers[a]){var k=this.handlers[a];typeof k=="string"&&typeof window[k]=="function"&&(k=window[k]),typeof k=="function"&&n(k,c,this,b,d)}},o.prototype.glue=function(a){a=m(a);for(var b=0;b<a.length;b++)l(a[b],q)==-1&&(q.push(a[b]),d(a[b],"mouseover",c))},o.prototype.unglue=function(a){a=m(a);for(var b=0;b<a.length;b++){e(a[b],"mouseover",c);var d=l(a[b],q);d!=-1&&q.splice(d,1)}},typeof define=="function"&&define.amd?define(["require","exports","module"],function(a,b,c){return t=c&&c.id||null,o}):typeof module!="undefined"&&module?(u=module.id||null,module.exports=o):window.ZeroClipboard=o})();


// Some default UI customizations
// Datepicker localization
$.datepicker.regional['ru'] = {
	closeText: 'Закрыть',
	prevText: '&#x3c;Пред',
	nextText: 'След&#x3e;',
	currentText: 'Сегодня',
	monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь',
	'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
	monthNamesShort:['Январь','Февраль','Март','Апрель','Май','Июнь',
	'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
	dayNames: ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'],
	dayNamesShort: ['вск','пнд','втр','срд','чтв','птн','сбт'],
	dayNamesMin: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
	weekHeader: 'Не',
	dateFormat: 'dd.mm.yy',
	firstDay: 1,
	isRTL: false,
	showMonthAfterYear: false,
	yearSuffix: ''
};
$.datepicker.setDefaults($.datepicker.regional['ru']);




/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.9
 *
 * Requires: jQuery 1.2.2+
 */

(function (factory) {
	if ( typeof define === 'function' && define.amd ) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS style for Browserify
		module.exports = factory;
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var toFix  = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
		toBind = ( 'onwheel' in document || document.documentMode >= 9 ) ?
					['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
		slice  = Array.prototype.slice,
		nullLowestDeltaTimeout, lowestDelta;

	if ( $.event.fixHooks ) {
		for ( var i = toFix.length; i; ) {
			$.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
		}
	}

	var special = $.event.special.mousewheel = {
		version: '3.1.9',

		setup: function() {
			if ( this.addEventListener ) {
				for ( var i = toBind.length; i; ) {
					this.addEventListener( toBind[--i], handler, false );
				}
			} else {
				this.onmousewheel = handler;
			}
			// Store the line height and page height for this particular element
			$.data(this, 'mousewheel-line-height', special.getLineHeight(this));
			$.data(this, 'mousewheel-page-height', special.getPageHeight(this));
		},

		teardown: function() {
			if ( this.removeEventListener ) {
				for ( var i = toBind.length; i; ) {
					this.removeEventListener( toBind[--i], handler, false );
				}
			} else {
				this.onmousewheel = null;
			}
		},

		getLineHeight: function(elem) {
			return parseInt($(elem)['offsetParent' in $.fn ? 'offsetParent' : 'parent']().css('fontSize'), 10);
		},

		getPageHeight: function(elem) {
			return $(elem).height();
		},

		settings: {
			adjustOldDeltas: true
		}
	};

	$.fn.extend({
		mousewheel: function(fn) {
			return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
		},

		unmousewheel: function(fn) {
			return this.unbind('mousewheel', fn);
		}
	});


	function handler(event) {
		var orgEvent   = event || window.event,
			args       = slice.call(arguments, 1),
			delta      = 0,
			deltaX     = 0,
			deltaY     = 0,
			absDelta   = 0;
		event = $.event.fix(orgEvent);
		event.type = 'mousewheel';

		// Old school scrollwheel delta
		if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1;      }
		if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;       }
		if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY;      }
		if ( 'wheelDeltaX' in orgEvent ) { deltaX = orgEvent.wheelDeltaX * -1; }

		// Firefox < 17 horizontal scrolling related to DOMMouseScroll event
		if ( 'axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
			deltaX = deltaY * -1;
			deltaY = 0;
		}

		// Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
		delta = deltaY === 0 ? deltaX : deltaY;

		// New school wheel delta (wheel event)
		if ( 'deltaY' in orgEvent ) {
			deltaY = orgEvent.deltaY * -1;
			delta  = deltaY;
		}
		if ( 'deltaX' in orgEvent ) {
			deltaX = orgEvent.deltaX;
			if ( deltaY === 0 ) { delta  = deltaX * -1; }
		}

		// No change actually happened, no reason to go any further
		if ( deltaY === 0 && deltaX === 0 ) { return; }

		// Need to convert lines and pages to pixels if we aren't already in pixels
		// There are three delta modes:
		//   * deltaMode 0 is by pixels, nothing to do
		//   * deltaMode 1 is by lines
		//   * deltaMode 2 is by pages
		if ( orgEvent.deltaMode === 1 ) {
			var lineHeight = $.data(this, 'mousewheel-line-height');
			delta  *= lineHeight;
			deltaY *= lineHeight;
			deltaX *= lineHeight;
		} else if ( orgEvent.deltaMode === 2 ) {
			var pageHeight = $.data(this, 'mousewheel-page-height');
			delta  *= pageHeight;
			deltaY *= pageHeight;
			deltaX *= pageHeight;
		}

		// Store lowest absolute delta to normalize the delta values
		absDelta = Math.max( Math.abs(deltaY), Math.abs(deltaX) );

		if ( !lowestDelta || absDelta < lowestDelta ) {
			lowestDelta = absDelta;

			// Adjust older deltas if necessary
			if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
				lowestDelta /= 40;
			}
		}

		// Adjust older deltas if necessary
		if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
			// Divide all the things by 40!
			delta  /= 40;
			deltaX /= 40;
			deltaY /= 40;
		}

		// Get a whole, normalized value for the deltas
		delta  = Math[ delta  >= 1 ? 'floor' : 'ceil' ](delta  / lowestDelta);
		deltaX = Math[ deltaX >= 1 ? 'floor' : 'ceil' ](deltaX / lowestDelta);
		deltaY = Math[ deltaY >= 1 ? 'floor' : 'ceil' ](deltaY / lowestDelta);

		// Add information to the event object
		event.deltaX = deltaX;
		event.deltaY = deltaY;
		event.deltaFactor = lowestDelta;
		// Go ahead and set deltaMode to 0 since we converted to pixels
		// Although this is a little odd since we overwrite the deltaX/Y
		// properties with normalized deltas.
		event.deltaMode = 0;

		// Add event and delta to the front of the arguments
		args.unshift(event, delta, deltaX, deltaY);

		// Clearout lowestDelta after sometime to better
		// handle multiple device types that give different
		// a different lowestDelta
		// Ex: trackpad = 3 and mouse wheel = 120
		if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
		nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

		return ($.event.dispatch || $.event.handle).apply(this, args);
	}

	function nullLowestDelta() {
		lowestDelta = null;
	}

	function shouldAdjustOldDeltas(orgEvent, absDelta) {
		// If this is an older event and the delta is divisable by 120,
		// then we are assuming that the browser is treating this as an
		// older mouse wheel event and that we should divide the deltas
		// by 40 to try and get a more usable deltaFactor.
		// Side note, this actually impacts the reported scroll distance
		// in older browsers and can cause scrolling to be slower than native.
		// Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
		return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
	}

}));




/*scrollbar */
//Vertical slider script by Simon Battersby
//Reference: http://www.simonbattersby.com/blog/vertical-scrollbar-using-jquery-ui-slider/
//standard slider WITH HANDLE IMAGE
//DON'T LINK DIRECTLY TO THIS FILE - IT EATS MY BANDWIDTH. TAKE A COPY AND STORE ON YOUR OWN SERVER
function setSlider($scrollpane){//$scrollpane is the div to be scrolled
	//set options for handle image - amend this to true or false as required
	var handleImage = true;
	//change the main div to overflow-hidden as we can use the slider now
	$scrollpane.css('overflow','hidden');
	//f it's not there, wrap a div around the contents of the scrollpane to allow the scrolling
	if ($scrollpane.find('.scroll-content').length==0) $scrollpane.children().wrapAll('<\div class="scroll-content"> /');
	//compare the height of the scroll content to the scroll pane to see if we need a scrollbar
	var difference = $scrollpane.find('.scroll-content').height()-$scrollpane.height();//eg it's 200px longer
	$scrollpane.data('difference',difference);
	if(difference<=0 && $scrollpane.find('.slider-wrap').length>0)//scrollbar exists but is no longer required
	{
		$scrollpane.find('.slider-wrap').remove();//remove the scrollbar
		$scrollpane.find('.scroll-content').css({top:0});//and reset the top position
	}
	if(difference>0)//if the scrollbar is needed, set it up...
	{
		var proportion = difference / $scrollpane.find('.scroll-content').height();//eg 200px/500px
		var handleHeight = Math.round((1-proportion)*$scrollpane.height());//set the proportional height - round it to make sure everything adds up correctly later on
		handleHeight -= handleHeight%2;
		//if the slider has already been set up and this function is called again, we may need to set the position of the slider handle
		var contentposition = $scrollpane.find('.scroll-content').position();
		var sliderInitial = 100*(1-Math.abs(contentposition.top)/difference);
		if($scrollpane.find('.slider-wrap').length==0)//if the slider-wrap doesn't exist, insert it and set the initial value
			{
			$scrollpane.append('<\div class="slider-wrap"><\div class="slider-vertical"><\/div><\/div>');//append the necessary divs so they're only there if needed
			sliderInitial = 100;
			}
		$scrollpane.find('.slider-wrap').height($scrollpane.height());//set the height of the slider bar to that of the scroll pane
		//set up the slider
		$scrollpane.find('.slider-vertical').slider({
			orientation: 'vertical',
			min: 0,
			max: 100,
			range:'min',
			value: sliderInitial,
			slide: function(event, ui) {
				var topValue = -((100-ui.value)*difference/100);
				$scrollpane.find('.scroll-content').css({top:topValue});//move the top up (negative value) by the percentage the slider has been moved times the difference in height
				$('ui-slider-range').height(ui.value+'%');//set the height of the range element
			},
			change: function(event, ui) {
				var topValue = -((100-ui.value)*($scrollpane.find('.scroll-content').height()-$scrollpane.height())/100);//recalculate the difference on change
				$scrollpane.find('.scroll-content').css({top:topValue});//move the top up (negative value) by the percentage the slider has been moved times the difference in height
				$('ui-slider-range').height(ui.value+'%');
			}
		});
		//set the handle height and bottom margin so the middle of the handle is in line with the slider
		$scrollpane.find(".ui-slider-handle").css({height:handleHeight,'margin-bottom':-0.5*handleHeight});
		var origSliderHeight = $scrollpane.height();//read the original slider height
		var sliderHeight = origSliderHeight - handleHeight ;//the height through which the handle can move needs to be the original height minus the handle height
		var sliderMargin = (origSliderHeight - sliderHeight)*0.5;//so the slider needs to have both top and bottom margins equal to half the difference
		$scrollpane.find(".ui-slider").css({height:sliderHeight,'margin-top':sliderMargin});//set the slider height and margins
		$scrollpane.find(".ui-slider-range").css({bottom:-sliderMargin});//position the slider-range div at the top of the slider container
		//if required create elements to hold the images for the scrollbar handle
		if (handleImage){
			$(".ui-slider-handle").append('<span class="scrollbar-top" />');
			$(".ui-slider-handle").append('<span class="scrollbar-bottom" />');
			$(".ui-slider-handle").append('<span class="scrollbar-grip" />');
		}
	}//end if
	//code for clicks on the scrollbar outside the slider
	$(".ui-slider").click(function(event){//stop any clicks on the slider propagating through to the code below
		event.stopPropagation();
	});
	$(".slider-wrap").click(function(event){//clicks on the wrap outside the slider range
		var offsetTop = $(this).offset().top;//read the offset of the scroll pane
		var clickValue = (event.pageY-offsetTop)*100/$(this).height();//find the click point, subtract the offset, and calculate percentage of the slider clicked
		$(this).find(".slider-vertical").slider("value", 100-clickValue);//set the new value of the slider
	});
	//additional code for mousewheel
	if($.fn.mousewheel){
		$scrollpane.unmousewheel();//remove any previously attached mousewheel events
		$scrollpane.mousewheel(function(event, delta){
			var speed = Math.round(5000/$scrollpane.data('difference'));
			if (speed <1) speed = 1;
			if (speed >100) speed = 100;
			var sliderVal = $(this).find(".slider-vertical").slider("value");//read current value of the slider
			sliderVal += (delta*speed);//increment the current value
			$(this).find(".slider-vertical").slider("value", sliderVal);//and set the new value of the slider
			event.preventDefault();//stop any default behaviour
		});
	}
} 

/*
	Masked Input plugin for jQuery
	Copyright (c) 2007-2013 Josh Bush (digitalbush.com)
	Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license)
	Version: 1.3.1
*/
(function(e){function t(){var e=document.createElement("input"),t="onpaste";return e.setAttribute(t,""),"function"==typeof e[t]?"paste":"input"}var n,a=t()+".mask",r=navigator.userAgent,i=/iphone/i.test(r),o=/android/i.test(r);e.mask={definitions:{9:"[0-9]",a:"[A-Za-z]","*":"[A-Za-z0-9]"},dataName:"rawMaskFn",placeholder:"_"},e.fn.extend({caret:function(e,t){var n;if(0!==this.length&&!this.is(":hidden"))return"number"==typeof e?(t="number"==typeof t?t:e,this.each(function(){this.setSelectionRange?this.setSelectionRange(e,t):this.createTextRange&&(n=this.createTextRange(),n.collapse(!0),n.moveEnd("character",t),n.moveStart("character",e),n.select())})):(this[0].setSelectionRange?(e=this[0].selectionStart,t=this[0].selectionEnd):document.selection&&document.selection.createRange&&(n=document.selection.createRange(),e=0-n.duplicate().moveStart("character",-1e5),t=e+n.text.length),{begin:e,end:t})},unmask:function(){return this.trigger("unmask")},mask:function(t,r){var c,l,s,u,f,h;return!t&&this.length>0?(c=e(this[0]),c.data(e.mask.dataName)()):(r=e.extend({placeholder:e.mask.placeholder,completed:null},r),l=e.mask.definitions,s=[],u=h=t.length,f=null,e.each(t.split(""),function(e,t){"?"==t?(h--,u=e):l[t]?(s.push(RegExp(l[t])),null===f&&(f=s.length-1)):s.push(null)}),this.trigger("unmask").each(function(){function c(e){for(;h>++e&&!s[e];);return e}function d(e){for(;--e>=0&&!s[e];);return e}function m(e,t){var n,a;if(!(0>e)){for(n=e,a=c(t);h>n;n++)if(s[n]){if(!(h>a&&s[n].test(R[a])))break;R[n]=R[a],R[a]=r.placeholder,a=c(a)}b(),x.caret(Math.max(f,e))}}function p(e){var t,n,a,i;for(t=e,n=r.placeholder;h>t;t++)if(s[t]){if(a=c(t),i=R[t],R[t]=n,!(h>a&&s[a].test(i)))break;n=i}}function g(e){var t,n,a,r=e.which;8===r||46===r||i&&127===r?(t=x.caret(),n=t.begin,a=t.end,0===a-n&&(n=46!==r?d(n):a=c(n-1),a=46===r?c(a):a),k(n,a),m(n,a-1),e.preventDefault()):27==r&&(x.val(S),x.caret(0,y()),e.preventDefault())}function v(t){var n,a,i,l=t.which,u=x.caret();t.ctrlKey||t.altKey||t.metaKey||32>l||l&&(0!==u.end-u.begin&&(k(u.begin,u.end),m(u.begin,u.end-1)),n=c(u.begin-1),h>n&&(a=String.fromCharCode(l),s[n].test(a)&&(p(n),R[n]=a,b(),i=c(n),o?setTimeout(e.proxy(e.fn.caret,x,i),0):x.caret(i),r.completed&&i>=h&&r.completed.call(x))),t.preventDefault())}function k(e,t){var n;for(n=e;t>n&&h>n;n++)s[n]&&(R[n]=r.placeholder)}function b(){x.val(R.join(""))}function y(e){var t,n,a=x.val(),i=-1;for(t=0,pos=0;h>t;t++)if(s[t]){for(R[t]=r.placeholder;pos++<a.length;)if(n=a.charAt(pos-1),s[t].test(n)){R[t]=n,i=t;break}if(pos>a.length)break}else R[t]===a.charAt(pos)&&t!==u&&(pos++,i=t);return e?b():u>i+1?(x.val(""),k(0,h)):(b(),x.val(x.val().substring(0,i+1))),u?t:f}var x=e(this),R=e.map(t.split(""),function(e){return"?"!=e?l[e]?r.placeholder:e:void 0}),S=x.val();x.data(e.mask.dataName,function(){return e.map(R,function(e,t){return s[t]&&e!=r.placeholder?e:null}).join("")}),x.attr("readonly")||x.one("unmask",function(){x.unbind(".mask").removeData(e.mask.dataName)}).bind("focus.mask",function(){clearTimeout(n);var e;S=x.val(),e=y(),n=setTimeout(function(){b(),e==t.length?x.caret(0,e):x.caret(e)},10)}).bind("blur.mask",function(){y(),x.val()!=S&&x.change()}).bind("keydown.mask",g).bind("keypress.mask",v).bind(a,function(){setTimeout(function(){var e=y(!0);x.caret(e),r.completed&&e==x.val().length&&r.completed.call(x)},0)}),y()}))}})})(jQuery);
/* Author:
	http://notamedia.ru/
*/

var WND, DOC, BODY, touchdevice = false;
$(function() {
	WND = $(window), DOC = $(document), BODY = $('body');
	if (!$('html').hasClass('no-touch')) touchdevice = true;
	$('.iblock').cleanWS();
	$('.liveplayer').initLivePlayer();

	$('.liveprogrammes,.livetitle').refreshLivePopUp();
}); // DOM loaded

$(window).load(function(){
});

function setQuality(id, element, url) {
    var btn = $(element);

    btn.addClass('active').siblings().removeClass('active');

    $('#notaplayer_' + id)
        .jPlayer("setMedia", { mp3: 'http://ice912.echo.msk.ru:9120/' + url })
        .jPlayer("playHead", 0)
        .jPlayer("play");
}

(function($) { //create closure
$.fn.refreshLivePopUp = function(options){
	this.each(function(){
		var cont = $(this), cn = (cont.hasClass('livetitle'))?'livetitle':'liveprogrammes' , url = cont.data('url'), nextquery = cont.data('nextquery');
                function updateBlock(cn, url, nextquery) {
			var cont = $('.'+cn), url = cont.data('url'), nextquery = parseInt(cont.data('nextquery'));
			if (cn && url && nextquery) {
				$.ajax({
					url: url,
					method: 'GET',
					success: function(html){
						cont.before(html);
						cont.remove();
						window.setTimeout(function(){
							updateBlock(cn, url, nextquery)
						}, nextquery);
					}
				});
			}                	
                }
		window.setTimeout(function(){
			updateBlock(cn, url, nextquery)
		}, nextquery);
	});
}
})(jQuery);

(function($) { //create closure
$.fn.initLivePlayer = function(options){
	this.each(function(){
		var mainplayer = $(this), audioplayer = $('<div class="audioplayer"></div>').prependTo(mainplayer),
		title = mainplayer.find('.title').text(),
		setMedia = {}, supplied = '', id= mainplayer.attr('id')? mainplayer.attr('id') : 'a'+new Date().getTime();
		mainplayer.find('.media a').each(function(i){
			var a = $(this); supplied += (i>0) ? ','+a.attr('rel'):a.attr('rel');
			setMedia[a.attr('rel')] = a.attr('href');
		});

		// настройки берем из атрибута data-* контейнера
		var	width = (mainplayer.data('width'))? mainplayer.data('width') : 625,
			autoplay = (mainplayer.data('autoplay'))? mainplayer.data('autoplay') : false,
			volume = (mainplayer.data('volume'))? mainplayer.data('volume') : .6,
			mute = (mainplayer.data('mute'))? mainplayer.data('mute') : false,
			swfpath =  (mainplayer.data('swf'))? mainplayer.data('swf') : "/swf",
			currenttime, // в currenttime сохраним время по головке плеера во время воспроизведения
			duration, // длительность ролика (известна после loadedmetadata)
			firststart = false, seeking = false, playing = false, timetooltip, timetooltiptext; // tooltip для mouseover time

		var tpl = '<div id="container_'+id+'" class="nota_audio">'+
				'<div class="nota_type-single">'+
					'<div id="notaplayer_'+id+'" class="nota_jplayer"></div>'+
					'<div class="nota_gui">'+
						'<div class="nota_interface">'+
							'<div class="nota_title-container">'+
								'<div class="nota_title">'+ 
									title +
								'</div>'+
							'</div>'+
							'<div class="nota_progress-container">'+
								'<div class="nota_progress">'+
									'<div class="nota_seek-bar">'+
										'<div class="nota_play-bar"></div>'+
										'<div class="nota_time-container">'+
											'<span class="nota_current-time"></span> / '+
											'<span class="nota_duration"></span>'+
										'</div>'+
									'</div>'+
								'</div><div class="nota_time-tooltip"><span>00:00</span><i></i></div>'+
							'</div>'+
							'<div class="nota_controls-holder">'+
								'<div class="nota_controls">'+
									'<a href="javascript:;" class="nota_play" tabindex="1"><span>воспр.</span></a>'+
									'<a href="javascript:;" class="nota_pause" tabindex="1"><span>пауза</span></a>'+
									'<a href="javascript:;" class="nota_stop" tabindex="1"><span>стоп</span></a>'+
                                    '<div class="nota_quality">Качество: '+
                                        '<a href="javascript:;" onclick="setQuality(\''+id+'\', this, \'stream\')" class="nota_quality_item active" tabindex="1">обычное</a> / '+
                                        '<a href="javascript:;" onclick="setQuality(\''+id+'\', this, \'stream2\')" class="nota_quality_item" tabindex="1">высокое</a>'+
									'</div>'+
									'<div class="nota_volume-controls">'+
										'<a href="javascript:;" class="nota_mute" tabindex="1" title="выкл."><span>выкл.</span></a>'+
										'<a href="javascript:;" class="nota_unmute" tabindex="1" title="вкл."><span>вкл.</span></a>'+
										'<a href="javascript:;" class="nota_volume-max" tabindex="1" title="max volume"><span>вжарить</span></a>'+
										'<div class="nota_volume-bar">'+
											'<div class="nota_volume-bar-value"><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
										'</div>'+
									'</div>'+
								'</div>'+
							'</div>'+
						'</div>'+
					'</div>'+
					'<div class="nota_no-solution">'+
						'<span>Нужен плагин</span>'+
						'Для воспроизведения видео вам нужно обновить браузер или <a href="http://get.adobe.com/flashplayer/" target="_blank">Flash plugin</a>.'+
					'</div>'+
//					'<div class="nota_loader"></div>'+
				'</div>'+
			'</div>';
		$(tpl).appendTo(audioplayer);

		if (audioplayer.data('apready')!='apready') {
              		$('#notaplayer_'+id).jPlayer({
				ready: function (event) {
					var player = $(this);
					player.jPlayer("setMedia", setMedia);
					audioplayer.data('apready','apready');
						DOC.on('beforepagechange',function() {
						});
						DOC.on('pagechange',function() {
							setHeaderButton(player);
						});
					},
				loadedmetadata: function(e){
					},
				timeupdate: function(e){ // обновляет время воспроизведения (по позиции головки)
					},
				play: function() {
					},
				pause: function() {
					},
				stop: function() {
					},
				swfPath: "/assets",
				errorAlerts: false,
			cssSelectorAncestor: '#container_'+id,
			cssSelector: {
				play: ".nota_play",
				pause: ".nota_pause",
				stop: ".nota_stop",
				seekBar: ".nota_seek-bar",
				playBar: ".nota_play-bar",
				mute: ".nota_mute",
				unmute: ".nota_unmute",
				volumeBar: ".nota_volume-bar",
				volumeBarValue: ".nota_volume-bar-value",
				volumeMax: ".nota_volume-max",
				currentTime: ".nota_current-time",
				duration: ".nota_duration",
				fullScreen: ".nota_full-screen",
				restoreScreen: ".nota_restore-screen",
				repeat: ".nota_repeat",
				repeatOff: ".nota_repeat-off",
				gui: ".nota_gui",
				noSolution: ".nota_no-solution"
			},
				supplied: supplied,
				wmode: "window",
				smoothPlayBar: false,
				keyEnabled: true
			});
		} else {
		} // player init
				
	});


}
//end of closure
})(jQuery);


(function($) { //create closure
$.fn.cleanWS = function(options){
	this.each(function(){
		var iblock = this, par = iblock.parentNode, prev = iblock.previousSibling, next = iblock.nextSibling;
		while (prev) {
			var newprev = prev.previousSibling;
			if (prev.nodeType == 3 && prev.nodeValue) {
				for (var i=prev.nodeValue.length-1; i>-1; i--) {
					var cc = prev.nodeValue.charCodeAt(i);
					if (cc==9||cc==10||cc==32) {
						prev.nodeValue = prev.nodeValue.slice(0,i);
					} else {
						break;
					}
				}
			}
			if (prev.nodeType == 8)	par.removeChild(prev);
			prev = newprev;
		}
		while (next) {
			var newnext = next.nextSibling;
			if (next.nodeType == 3 && next.nodeValue) {
				while(next.nodeValue.length) {
					var cc = next.nodeValue.charCodeAt(0);
					if (cc==9||cc==10||cc==32) {
						next.nodeValue = next.nodeValue.slice(1);
					} else {
						break;
					}
				}
			}
			if (next.nodeType == 8)	par.removeChild(next);
			next = newnext;
		}
	});
}
//end of closure
})(jQuery);
// AUDIO //




(function($) { //create closure
        $.fn.audionota = function(options) {
            this.each(function() {
                var mainplayer = $(this),
                    audioplayer = $('<div class="audioplayer"></div>').prependTo(mainplayer),
                    title = mainplayer.find('.title').text(),
                    setMedia = {}, supplied = '',
                    id = mainplayer.attr('id') ? mainplayer.attr('id') : 'a' + new Date().getTime();
                mainplayer.find('.media a').each(function(i) {
                    var a = $(this);
                    supplied += (i > 0) ? ',' + a.attr('rel') : a.attr('rel');
                    setMedia[a.attr('rel')] = a.attr('href');
                });

                // настройки берем из атрибута data-* контейнера
                var width = (mainplayer.data('width')) ? mainplayer.data('width') : 625,
                    autoplay = (mainplayer.data('autoplay')) ? mainplayer.data('autoplay') : false,
                    mute = (mainplayer.data('mute')) ? mainplayer.data('mute') : false,
                    swfpath = (mainplayer.data('swf')) ? mainplayer.data('swf') : "/assets",
                    currenttime, // в currenttime сохраним время по головке плеера во время воспроизведения
                    duration, // длительность ролика (известна после loadedmetadata)
                    firststart = false,
                    seeking = false,
                    playing = false,
                    timetooltip, timetooltiptext; // tooltip для mouseover time
					var volume;
					if(mainplayer.data('volume')) {
						volume = mainplayer.data('volume');
						if (localStorage.getItem('volume') != null )
						{
							console.log( localStorage.getItem('volume'));
							volume = localStorage.getItem('volume');
							
						}
					}
					else {
						volume= .5;
					}
						
                var tpl = '<div id="container_' + id + '" class="nota_audio">' +
                    '<div class="nota_type-single">' +
                    '<div id="notaplayer_' + id + '" class="nota_jplayer"></div>' +
                    '<div class="nota_gui">' +
                    '<div class="nota_interface">' +
                    '<div class="nota_title-container">' +
                    '<div class="nota_title">' +
                    title +
                    '</div>' +
                    '</div>' +
                    '<div class="nota_progress-container">' +
                    '<div class="nota_progress">' +
                    '<div class="nota_seek-bar">' +
                    '<div class="nota_play-bar"></div>' +
                    '<div class="nota_time-container">' +
                    '<span class="nota_current-time"></span> / ' +
                    '<span class="nota_duration"></span>' +
                    '</div>' +
                    '</div>' +
                    '</div><div class="nota_time-tooltip"><span>00:00</span><i></i></div>' +
                    '</div>' +
                    '<div class="nota_controls-holder">' +
                    '<div class="nota_controls">' +
                    '<a href="javascript:;" class="nota_play" tabindex="1"><span>воспр.</span></a>' +
                    '<a href="javascript:;" class="nota_pause" tabindex="1"><span>пауза</span></a>' +
                    '<a href="javascript:;" class="nota_stop" tabindex="1"><span>стоп</span></a>' +
                    '<div class="nota_volume-controls">' +
                    '<a href="javascript:;" class="nota_mute" tabindex="1" title="выкл."><span>выкл.</span></a>' +
                    '<a href="javascript:;" class="nota_unmute" tabindex="1" title="вкл."><span>вкл.</span></a>' +
                    '<a href="javascript:;" class="nota_volume-max" tabindex="1" title="max volume"><span>вжарить</span></a>' +
                    '<div class="nota_volume-bar">' +
                    '<div class="nota_volume-bar-value"><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="errorlayer"><div class="errorstatus"></div></div>' + 
                    '<div class="waitinglayer"><div class="waitingstatus">Подождите, загрузка...</div></div>' + 
                    '<div class="nota_no-solution">' +
                    '<span>Нужен плагин</span>' +
                    'Для воспроизведения аудио вам нужно обновить браузер или <a href="http://get.adobe.com/flashplayer/" target="_blank">Flash plugin</a>.' +
                    '</div>' +
                //					'<div class="nota_loader"></div>'+
                '</div>' +
                    '</div>';
                $(tpl).appendTo(audioplayer);

                var errorcurrentpos = 0;
				var currentPercentRelative = 0,
					currentPercentAbsolute = 0,
					currentTime = 0,
					duration = 0,
					remaining = 0;

					var errorlayer = audioplayer.find('.errorlayer');
					var errorstatus = errorlayer.find('.errorstatus');
					var waitinglayer = audioplayer.find('.waitinglayer');
                var playerstatus;
                if (audioplayer.data('apready') != 'apready') {
                    $('#notaplayer_' + id).jPlayer({
                        ready: function(event) {
                            var player = $(this);
                            player.jPlayer("setMedia", setMedia);
                            audioplayer.data('apready', 'apready');
/*
                            DOC.on('beforepagechange', function() {});
                            DOC.on('pagechange', function() {
                                setHeaderButton(player);
                            });
*/
                        },
                        loadedmetadata: function(e) {
                        },
                        timeupdate: function(e) { // обновляет время воспроизведения (по позиции головки)

                        },
                        error: function(e) {
//                        	console.log('error');
//console.log(e.toSource());
	                      	var player = $(this);
//                        	player.find('.nota_play-bar').css('display','none');
							if (e.jPlayer.status.currentTime != undefined && e.jPlayer.status.currentTime>0) {
								errorcurrentpos = e.jPlayer.status.currentTime;
								currentPercentRelative = e.jPlayer.status.currentPercentRelative;
								currentPercentAbsolute = e.jPlayer.status.currentPercentAbsolute;
								currentTime = e.jPlayer.status.currentTime;
								duration = e.jPlayer.status.duration;
								remaining = e.jPlayer.status.remaining;
							} else {

							}
//                        	console.log('errorcurrentpos ' + errorcurrentpos)

							if (playerstatus=='play') {
								window.setTimeout(function(){
									e.jPlayer.status.currentPercentRelative = currentPercentRelative;
									e.jPlayer.status.currentPercentAbsolute = currentPercentAbsolute;
									e.jPlayer.status.currentTime = currentTime;
									e.jPlayer.status.duration = duration;
									e.jPlayer.status.remaining = remaining;
									errorlayer.css('display','');
									player.jPlayer("play", errorcurrentpos);
								},10000);
								errorlayer.css('display','block');
								errorstatus.html('Соединение с сервером прервано.<br>Восстановление соединения...');
							}
                        },
                        play: function(e) {
/*
								e.jPlayer.status.currentPercentRelative = currentPercentRelative;
								e.jPlayer.status.currentPercentAbsolute = currentPercentAbsolute;
								e.jPlayer.status.currentTime = currentTime;
								e.jPlayer.status.duration = duration;
								e.jPlayer.status.remaining = remaining;

*/
                        	playerstatus = 'play';
                       		var player = $(this);
//                        	console.log('play!')
/*
                        	if (audioplayer.data('apready')!='apready') {
                        		player.jPlayer("load");
                        	}
*/
                        	if (errorcurrentpos>0) {
                        		player.jPlayer("play", errorcurrentpos);
                        	}
                        },
                        pause: function() {
                        	playerstatus = 'pause';
//                        	console.log('pause!')
                        },
                        stop: function() {
                        	playerstatus = 'stop';
                        },
                        waiting: function() {
                        	waitinglayer.css('display','block');
                        },
                        canplay: function() {
                        	waitinglayer.css('display','');
                        },
                        seeking: function(e){
//                       		var player = $(this);
                       		errorcurrentpos = e.jPlayer.status.currentTime;
//                       		console.log('seeking '+ e.jPlayer.status.currentTime)
                        },
                        swfPath: swfpath,
                        errorAlerts: false,
                        cssSelectorAncestor: '#container_' + id,
                        cssSelector: {
                            play: ".nota_play",
                            pause: ".nota_pause",
                            stop: ".nota_stop",
                            seekBar: ".nota_seek-bar",
                            playBar: ".nota_play-bar",
                            mute: ".nota_mute",
                            unmute: ".nota_unmute",
                            volumeBar: ".nota_volume-bar",
                            volumeBarValue: ".nota_volume-bar-value",
                            volumeMax: ".nota_volume-max",
                            currentTime: ".nota_current-time",
                            duration: ".nota_duration",
                            fullScreen: ".nota_full-screen",
                            restoreScreen: ".nota_restore-screen",
                            repeat: ".nota_repeat",
                            repeatOff: ".nota_repeat-off",
                            gui: ".nota_gui",
                            noSolution: ".nota_no-solution"
                        },
						volumechange: function(e) {
							var v = e.jPlayer.options.volume;
							localStorage.setItem('volume', v);
                        },
						volume: volume,
                        supplied: supplied,
                        wmode: "window",
                        smoothPlayBar: false,
                        keyEnabled: false
                    });
					
                } else {} // player init

            });
		
        }
    }
    //end of closure
)(jQuery);









// VIDEO //

(function($) { //create closure
    $.fn.notaplayer = function(options) {
        this.each(function() {
            var mainplayer = $(this),
                videoplayer = $('<div class="videoplayer"></div>').prependTo(mainplayer),
                setMedia = {}, supplied = '',
                id = mainplayer.attr('id') ? mainplayer.attr('id') : 'v' + new Date().getTime();
            mainplayer.find('.media a').each(function(i) {
                var a = $(this);
                supplied += (i > 0) ? ',' + a.attr('rel') : a.attr('rel');
                setMedia[a.attr('rel')] = a.attr('href');
            });
            setMedia.poster = mainplayer.find('.preview img').attr('src');

            var isMobile = {
                Android: function() {
                    return navigator.userAgent.match(/Android/i) ? true : false;
                },
                BlackBerry: function() {
                    return navigator.userAgent.match(/BlackBerry/i) ? true : false;
                },
                iOS: function() {
                    return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
                },
                Windows: function() {
                    return navigator.userAgent.match(/IEMobile/i) ? true : false;
                },
                any: function() {
                    return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
                }
            };

            // настройки берем из атрибута data-* контейнера
            var width = (mainplayer.data('width')) ? mainplayer.data('width') : 590,
                height = (mainplayer.data('height')) ? mainplayer.data('height') : 396,
                autoplay = (mainplayer.data('autoplay')) ? mainplayer.data('autoplay') : false,
                volume = (mainplayer.data('volume')) ? mainplayer.data('volume') : .6,
                mute = (mainplayer.data('mute')) ? mainplayer.data('mute') : false,
                swfpath = (mainplayer.data('swf')) ? mainplayer.data('swf') : "/assets",
                currenttime, // в currenttime сохраним время по головке плеера во время воспроизведения
                duration, // длительность ролика (известна после loadedmetadata)
                cutstart, cutend, // время по вырезалке
                inpcutstart, inpcutend, inpcuttime, // поля в форме шары
                firststart = false,
                seeking = false,
                playing = false,
                cutslider, cutslideractivecontrol, notaloader, largeplaybutton,
                timetooltip, timetooltiptext; // tooltip для mouseover time
				

            var tpl = '<div id="container_' + id + '" class="nota_video" style="width:' + width + 'px;">' +
                '<div class="nota_type-single">' +
                '<div id="notaplayer_' + id + '" class="nota_jplayer"></div>' +
                '<div class="nota_video-play">' +
                '<a href="javascript:;" class="nota_video-play-icon" tabindex="1">воспр.</a>' +
                '</div>' +
                '<div class="nota_gui">' +
                '<div class="nota_interface">' +
                '<div class="nota_progress-container">' +
                '<div class="nota_time-cut"></div>' +
                '<div class="nota_progress">' +
                '<div class="nota_seek-bar">' +
                '<div class="nota_play-bar"></div>' +
                '<div class="nota_time-container">' +
                '<span class="nota_current-time"></span> / ' +
                '<span class="nota_duration"></span>' +
                '</div>' +
                '</div>' +
                '</div><div class="nota_time-tooltip"><span>00:00</span><i></i></div>' +
                '</div>' +
                '<div class="nota_controls-holder">' +
                '<div class="nota_controls">' +
                '<a href="javascript:;" class="nota_previous" tabindex="1"><span>пред.</span></a>' +
                '<a href="javascript:;" class="nota_play" tabindex="1"><span>воспр.</span></a>' +
                '<a href="javascript:;" class="nota_pause" tabindex="1"><span>пауза</span></a>' +
                '<a href="javascript:;" class="nota_next" tabindex="1"><span>след.</span></a>' +
                '<a href="javascript:;" class="nota_stop" tabindex="1"><span>стоп</span></a>' +
                '<div class="nota_volume-controls">' +
                '<a href="javascript:;" class="nota_mute" tabindex="1" title="выкл."><span>выкл.</span></a>' +
                '<a href="javascript:;" class="nota_unmute" tabindex="1" title="вкл."><span>вкл.</span></a>' +
                '<a href="javascript:;" class="nota_volume-max" tabindex="1" title="max volume"><span>вжарить</span></a>' +
                '<div class="nota_volume-bar">' +
                '<div class="nota_volume-bar-value"><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="nota_controls_row2">' +
                '<div class="nota_toggles">' +
                '<a href="javascript:;" class="nota_full-screen" tabindex="1" title="весь экран">весь экран</a>' +
                '<a href="javascript:;" class="nota_restore-screen" tabindex="1" title="обычный размер">обычный размер</a>' +
                '<a href="javascript:;" class="nota_repeat" tabindex="1" title="повторить">повторить</a>' +
                '<a href="javascript:;" class="nota_repeat-off" tabindex="1" title="не повторять">не повторять</a>' +
                '<a href="javascript:;" class="nota_shuffle" tabindex="1" title="вразнобой">вразнобой</a>' +
                '<a href="javascript:;" class="nota_shuffle-off" tabindex="1" title="по порядку">по порядку</a>' +
                '</div>' +
                '<div class="nota_speed">' +
                '<a href="javascript:;" class="nota_speed-up" tabindex="1" title="ускорить">ускорить</a>' +
                '</div>' +
                '<div class="nota_jump">' +
                '<a href="javascript:;" class="nota_jump-back" tabindex="1" title="чуть назад">-</a>' +
                '<span class="nota_jump-step">10</span>' +
                '<a href="javascript:;" class="nota_jump-forward" tabindex="1" title="чуть вперед">+</a>' +
                '</div>' +
                '<div class="nota_cut-control">' +
                '<a href="javascript:;" class="nota_cut-start" tabindex="1" title="от сих">от сих</a>' +
                '<a href="javascript:;" class="nota_cut-cancel" tabindex="1" title="очистить"><i></i><span>очистить</span></a>' +
                '<a href="javascript:;" class="nota_cut-end" tabindex="1" title="до сих">до сих</a>' +
                '</div>' +
                '</div>' +
                '<div class="nota_share-control">' +
                '<a href="javascript:;" class="nota_share-button" tabindex="1" title="поделиться"><i></i><span>поделиться</span></a>' +
                '</div>' +

            '</div>' +
                '</div>' +
                '</div>' +
                '<div class="nota_no-solution">' +
                '<span>Нужен плагин</span>' +
                'Для воспроизведения видео вам нужно обновить браузер или <a href="http://get.adobe.com/flashplayer/" target="_blank">Flash plugin</a>.' +
                '</div>' +
                '<div class="nota_share-panel"><a href="#" class="nota_close_share">закрыть</a><form action="." method="post">' +
                '<div class="nota_sp-getlink">' +
                '<span class="nota_code-field">' +
                '<label for="getlink_' + id + '">Получить ссылку на ролик</label><input type="text" id="getlink_' + id + '" name="getlink" readonly="readonly" /><button type="button" value="getlink" data-clipboard-target="getlink_' + id + '">скопировать ссылку</button>' +
                '</span>' +
                '</div>' +
                '<div class="nota_sp-embed">' +
                '<div class="nota_sp-size">' +
                '<span class="nota_title">Размеры видео</span>' +
                '<span class="nota_radio nota_checked"><input type="radio" id="vsize_' + id + '_1" name="vsize" value="large" checked="checked" /><label for="vsize_' + id + '_1">(590x396)<i></i>Большое</label></span>' +
                '<span class="nota_radio"><input type="radio" id="vsize_' + id + '_2" name="vsize" value="medium" /><label for="vsize_' + id + '_2">(420x282)<i></i>Среднее</label></span>' +
                '<span class="nota_radio"><input type="radio" id="vsize_' + id + '_3" name="vsize" value="small" /><label for="vsize_' + id + '_3">(180x120)<i></i>Малое</label></span>' +
                '</div>' +
                '<div class="nota_sp-getcode">' +
                '<span class="nota_code-field">' +
                '<label for="getcode_' + id + '">Встроить ролик на ваш сайт</label><input type="text" id="getcode_' + id + '" name="getcode" readonly="readonly" /><button type="button" value="getcode" data-clipboard-target="getcode_' + id + '">скопировать код</button>' +
                '</span>' +
                '</div>' +
                '<div class="nota_sp-cutsettings">' +
                '<div class="nota_sp-cutset">' +
                '<span class="nota_radio"><input type="radio" id="vcut_' + id + '_1" name="vcut" value="full" /><label for="vcut_' + id + '_1"><i><i></i></i>Полностью</label></span>' +
                '<span class="nota_radio nota_checked"><input type="radio" id="vcut_' + id + '_2" name="vcut" value="cut" checked="checked" /><label for="vcut_' + id + '_2"><i><i></i></i>Отрывок</label></span>' +
                '</div>' +
                '<div class="nota_sp-cutstart">' +
                '<span class="nota_cut-field">' +
                '<label for="cutstart_' + id + '">Начало времени</label><input type="text" id="cutstart_' + id + '" name="cutstart" readonly="readonly" />' +
                '</span>' +
                '</div>' +
                '<div class="nota_sp-cutend">' +
                '<span class="nota_cut-field">' +
                '<label for="cutend_' + id + '">Конец времени</label><input type="text" id="cutend_' + id + '" name="cutend" readonly="readonly" />' +
                '</span>' +
                '</div>' +
                '<div class="nota_sp-cuttime">' +
                '<span class="nota_cut-field">' +
                '<label for="cuttime_' + id + '">Полное время</label><input type="text" id="cuttime_' + id + '" name="cuttime" readonly="readonly" />' +
                '</span>' +
                '</div>' +
                '<div class="nota_sp-cutbut">' +
                '<div><button type="button" value="preview">предпросмотр</button></div>' +
                '<div><button type="button" value="reset">очистить клип</button></div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</form></div>' +
                '<div class="nota_loader"></div>' +
                '</div>' +
                '</div>';

            $(tpl).appendTo(videoplayer);


            var ssT;

            function sendstat(start, end) { // статистика просмотров
                if (!mainplayer.data('stat')) return false;
                abortstat();
                var t = 300 * (end - start);
                ssT = window.setTimeout(function() {
                    var fragment;
                    $('.playlist a', mainplayer).each(function(i) { // найти подходящий фрагмент
                        var a = $(this);
                        if (a.data('cutstart') == start && a.data('cutend') == end) {
                            fragment = a.data('fragment');
                        }
                    });

                    $.ajax({
                        url: mainplayer.data('stat'),
                        dataType: 'text',
                        type: "GET",
                        data: {
                            'videoid': mainplayer.data('videoid'), // ID видеоролика
                            'fragment': fragment, // ID фрагмента
                            'start': start, // начало фрагмента в сек.
                            'end': end // конец фрагмента в сек.
                        },
                        complete: function(data) { // ответ от сервера - число просмотров, будет заменено для выбранного фрагмента (или всего видео, если start==0)
                            // ничего не делать
                        }
                    });
                }, t);
            }

            function abortstat() {
                window.clearTimeout(ssT);
            }


            $('#notaplayer_' + id).jPlayer({
                ready: function(e) {
                    var player = $(this);
                    player.jPlayer("setMedia", setMedia);
                    var gui = mainplayer.find('.nota_gui');
                    mainplayer.find('.prepare').hide(); // прячем предустановки (ссылки на видео, превьюшку и т.п.)
                    mainplayer.find('.nota_video-play').css({
                        'margin-top': '-' + height + 'px',
                        'height': height + 'px'
                    });
                    if (autoplay)
                        player.jPlayer("play");

                    notaloader = mainplayer.find('.nota_loader');
                    largeplaybutton = mainplayer.find('.nota_video-play');

                    if (isMobile.any()) {
                        notaloader.hide();
                    }

                    timetooltip = mainplayer.find('.nota_time-tooltip');
                    timetooltiptext = $('span', timetooltip);
                    var seekbar = mainplayer.find('.nota_progress'),
                        seekbarpos = seekbar.offset(),
                        seekbarW = seekbar.width();
                    seekbar.mouseenter(function(e) {
                        timetooltip.show();
                        seekbarpos = seekbar.offset();
                        timetooltip.css({
                            'left': (e.pageX - seekbarpos.left) + 'px',
                            'top': (e.pageY - seekbarpos.top) + 'px'
                        });
                    }).mouseleave(function() {
                        timetooltip.hide();
                    }).mousemove(function(e) {
                        var l = e.pageX - seekbarpos.left;
                        timetooltip.css({
                            'left': l + 'px',
                            'top': (e.pageY - seekbarpos.top) + 'px'
                        });
                        timetooltiptext.text($.jPlayer.convertTime((l * 100 / seekbarW) * duration / 100));
                    }).click(function() {
                        seeking: true; // seeking event срабатывает слишком поздно после клика, поэтому флаг выставляем сразу
                    });
                    /* кнопка поделиться и слой для шары */
                    var jpsharebutton = mainplayer.find('.nota_share-button'),
                        jpsharepanel = mainplayer.find('.nota_share-panel');
                    jpsharepanel.css('opacity', 0);
                    jpsharebutton.click(function(e) {
                        e.preventDefault();
                        $(this).blur();
                        if (jpsharebutton.hasClass('opened')) {
                            jpsharepanel.stop().animate({
                                opacity: 0
                            }, function() {
                                jpsharebutton.removeClass('opened').html('<i></i><span>поделиться</span>');
                                jpsharepanel.css('display', 'none');
                            });
                        } else {
                            jpsharepanel.stop().css('display', 'block').animate({
                                opacity: 1
                            }, function() {
                                jpsharebutton.addClass('opened').html('<i></i><span>к просмотру</span>');
                            });
                        }
                    }); // jpsharebutton.click()
                    mainplayer.find('.nota_close_share').click(function(e) {
                        e.preventDefault();
                        $(this).blur();
                        jpsharebutton.click();
                    });


                    // кастомизация радиокнопок
                    mainplayer.find('.nota_radio').each(function() {
                        var cont = $(this),
                            par = cont.parent(),
                            inp = cont.find(':radio');
                        inp.bind('change', function(e) {
                            if ($(this).prop('checked')) {
                                par.find('.nota_checked').removeClass('nota_checked');
                                cont.addClass('nota_checked');
                            }
                        });
                    }); // mainplayer.find('.nota_radio')

                    // кнопки перепрыга по 10 сек
                    mainplayer.find('.nota_jump-back').click(function(e) {
                        e.preventDefault();
                        $(this).blur();
                        abortstat();
                        player.jPlayer("play", currenttime - 10);
                    }); // mainplayer.find('.nota_jump-back')
                    mainplayer.find('.nota_jump-forward').click(function(e) {
                        e.preventDefault();
                        $(this).blur();
                        abortstat();
                        player.jPlayer("play", currenttime + 10);
                    }); // mainplayer.find('.nota_jump-forward')

                    inpcutstart = $(':input[name="cutstart"]', mainplayer),
                    inpcutend = $(':input[name="cutend"]', mainplayer);
                    inpcuttime = $(':input[name="cuttime"]', mainplayer);
                    var getcode = $(':input[name="getcode"]', mainplayer);

                    if (mainplayer.data('permalink') != '') {
                        $(':input[name="getlink"]', mainplayer).val(mainplayer.data('permalink'));
                    } else {
                        mainplayer.find('.nota_sp-getlink').remove();
                    }
                    if (!mainplayer.data('embed')) {
                        mainplayer.find('.nota_sp-embed').remove();
                    }

                    $('.nota_sp-cutbut button[value=reset]', mainplayer).click(function() { // сброс параметров шары
                        $(':input[name="vcut"]:eq(0),:input[name="vsize"]:eq(0)', mainplayer).click();
                        mainplayer.trigger('cutchange');
                        $(this).blur();
                    });

                    $('.nota_sp-cutbut button[value=preview]', mainplayer).click(function() { // сброс параметров шары
                        mainplayer.find('.nota_share-button').click();
                        player.jPlayer("play", cutstart);
                        $(this).blur();
                    });

                    $(':input[name="vcut"],:input[name="vsize"]', mainplayer).bind('change', function(e) {
                        // смена чекбоксов в шаре
                        var inp = $(e.target);
                        if (inp.attr('name') == 'vcut') {
                            if (inp.val() == 'full') {
                                cutslider.slider({
                                    values: [0, 100]
                                });
                                cutstart = 0;
                                cutend = duration;
                            } else {
                                cutstart = currenttime;
                                cutslider.slider("values", 0, cutstart * 100 / duration);
                            }
                        }
                        mainplayer.trigger('cutchange');
                    });

                    // копирование кодов
                    var linkbutton = $('button[value="getlink"]', mainplayer);
                    var getlinkbutton = new ZeroClipboard(linkbutton, {
                        moviePath: mainplayer.data('swf') + "/ZeroClipboard.swf",
                        hoverClass: 'hover',
                        forceHandCursor: true
                    });
                    getlinkbutton.on('noFlash', function(client) {
                        linkbutton.hide();
                    });
                    getlinkbutton.on('complete', function(client, args) {});

                    var codebutton = $('button[value="getcode"]', mainplayer);
                    var getcodebutton = new ZeroClipboard(codebutton, {
                        moviePath: mainplayer.data('swf') + "/ZeroClipboard.swf",
                        hoverClass: 'hover',
                        forceHandCursor: true
                    });
                    getcodebutton.on('noFlash', function(client) {
                        codebutton.hide();
                    });
                    getcodebutton.on('complete', function(client, args) {});

                    mainplayer.bind('cutchange', function(e) { // обработчик любых изменений вырезалки
                        inpcutstart.val($.jPlayer.convertTime(cutstart));
                        inpcutend.val($.jPlayer.convertTime(cutend));
                        inpcuttime.val($.jPlayer.convertTime(cutend - cutstart));
                        if (mainplayer.data('embed') != '') { // поле "Встроить ролик на ваш сайт"
                            var href = mainplayer.data('embed'),
                                vcut = $(':input:checked[name="vcut"]', mainplayer).val(),
                                vsize = $(':input:checked[name="vsize"]', mainplayer).val();
                            href = (href.indexOf('?') > -1) ? href + '&' : href + '?';
                            var s = (vcut == 'full') ? 0 : cutstart,
                                e = (vcut == 'full') ? duration : cutend,
                                w = 590,
                                h = 396;
                            if (vsize == 'medium') {
                                w = 420;
                                h = 282;
                            }
                            if (vsize == 'small') {
                                w = 180;
                                h = 120;
                            }
                            if (cutstart > 0 || cutend < duration) {
                                $(':input[name="vcut"][value="cut"]', mainplayer).click();
                            }
                            getcode.val('<object data="' + href + 's=' + Math.round(s) + '&e=' + Math.round(e) + '&w=' + w + '&h=' + h + '" width="' + w + '" height="' + h + '"></object>');
                        }
                    });
                    if (!mainplayer.data('permalink') && !mainplayer.data('embed')) {
                        mainplayer.find('.nota_share-control').remove();
                    }

                    // панель управления прячется-показывается
                    var T;
                    mainplayer.mouseenter(function() {
                        window.clearTimeout(T);
                        gui.css('opacity', '');
                    }).mouseleave(function() {
                        T = window.setTimeout(function() {
                            if (!jpsharebutton.hasClass('opened')) gui.css('opacity', '0');
                        }, 2000);
                    });


                    if (width < 500) mainplayer.addClass('sizesmall');
                    if (width < 300) mainplayer.addClass('sizelite');

                },
                // когда получена инфа о ролике
                loadedmetadata: function(e) {
                    var player = $(this),
                        cutcontrol = mainplayer.find('.nota_cut-control');
                    cutslider = mainplayer.find('.nota_time-cut');
                    duration = e.jPlayer.status.duration;
                    cutstart = (mainplayer.data('cutstart')) ? mainplayer.data('cutstart') : 0;
                    cutend = (mainplayer.data('cutend')) ? mainplayer.data('cutend') : duration;
                    // можно строить навигацию по таймлайну
                    cutslider.slider({
                        range: true,
                        step: 0.01,
                        values: [cutstart * 100 / duration, cutend * 100 / duration],
                        slide: function(event, ui) {
                            timetooltip.css({
                                'display': 'block',
                                'left': +cutslider.slider("values", cutslideractivecontrol.data('index')) + '%',
                                top: '-10px'
                            });
                            timetooltiptext.text($.jPlayer.convertTime(cutslider.slider("values", cutslideractivecontrol.data('index')) * duration / 100));
                        },
                        stop: function(event, ui) {
                            var currpercent = currenttime * 100 / duration;
                            if (ui.values[0] >= currpercent) {
                                cutslider.slider({
                                    values: [currpercent, ui.values[1]]
                                });
                                cutstart = currenttime;
                            } else {
                                cutstart = ui.values[0] * duration / 100;
                            }
                            if (ui.values[1] <= currpercent) {
                                player.jPlayer("pause", currenttime);
                                cutslider.slider({
                                    values: [ui.values[0], currpercent]
                                });
                                cutend = currenttime;
                            } else {
                                cutend = ui.values[1] * duration / 100;
                            }
                            mainplayer.trigger('cutchange');
                            timetooltip.css('display', 'none');
                        },
                        start: function(event, ui) {
                            cutslideractivecontrol = cutslider.find('.ui-slider-handle.ui-state-hover, .ui-slider-handle.ui-state-active');
                        },
                        create: function(event, ui) {
                            cutslider.hide();
                            cutcontrol.find('.nota_cut-start').click(function(e) {
                                e.preventDefault();
                                $(this).blur();
                                cutstart = currenttime;
                                cutslider.slider("values", 0, cutstart * 100 / duration);
                                mainplayer.trigger('cutchange');
                            });
                            cutcontrol.find('.nota_cut-end').click(function(e) {
                                e.preventDefault();
                                $(this).blur();
                                cutend = currenttime;
                                cutslider.slider("values", 1, cutend * 100 / duration);
                                mainplayer.trigger('cutchange');
                            });
                            cutcontrol.find('.nota_cut-cancel').click(function(e) {
                                e.preventDefault();
                                $(this).blur();
                                cutstart = 0;
                                cutend = duration;
                                cutslider.slider({
                                    values: [cutstart * 100 / duration, cutend * 100 / duration]
                                });
                                mainplayer.trigger('cutchange');
                            });

                            cutslider.find('.ui-slider-handle').each(function(i) {
                                $(this).data('index', i);
                            });

                            mainplayer.trigger('cutchange');

                            var playlist = mainplayer.find('.playlist');
                            if (playlist.length > 0) {
                                playlist.find('.fullplay').data('cutstart', 0).data('cutend', duration);
                                $('a', playlist).click(function(e) {
                                    e.preventDefault();
                                    var a = $(this);
                                    cutstart = a.data('cutstart');
                                    cutend = a.data('cutend');
                                    cutslider.slider({
                                        values: [cutstart * 100 / duration, cutend * 100 / duration]
                                    });
                                    mainplayer.trigger('cutchange');
                                    player.jPlayer("play", cutstart);
                                    a.blur();
                                });

                                $('.nota_previous, .nota_next', mainplayer).click(function(e) {
                                    var button = $(this);
                                    // найти актуальную ссылку в playlist (.data('cutstart')<=cutstart && .data('cutend')>=cutend)
                                    var curr;
                                    $('.fragments a', playlist).each(function() {
                                        var a = $(this);
                                        if (a.data('cutstart') <= currenttime && a.data('cutend') >= currenttime) {
                                            curr = a.parent('.fragment');
                                        }
                                    });
                                    if (curr && curr.length > 0) {
                                        var newli = (button.hasClass('nota_next')) ? curr.next() : curr.prev();
                                        if (newli.length < 1) newli = (button.hasClass('nota_next')) ? $('.fragment:eq(0)', playlist) : $('.fragment:last', playlist);
                                        $('a', newli).click();
                                    } else {
                                        $('.fragments a:eq(0)', playlist).click();
                                    }
                                    button.blur();
                                });

                                var firstcut = $('.fragments a:eq(0)', playlist);
                                cutstart = firstcut.data('cutstart');
                                cutend = firstcut.data('cutend');
                                if (cutstart > 0 && !autoplay) {
                                    player.jPlayer("pause", cutstart);
                                }
                                cutslider.slider({
                                    values: [cutstart * 100 / duration, cutend * 100 / duration]
                                });
                                mainplayer.trigger('cutchange');
                            } else {
                                mainplayer.addClass('no_prev').addClass('no_next');
                            }
                        }
                    });
                    largeplaybutton.show();
                    firststart = true;

                },
                loadeddata: function(e) {
                    notaloader.hide();
                },
                seeked: function(e) {
                    if (currenttime > cutend) {
                        cutend = duration;
                        cutslider.slider("values", 1, 100);
                        mainplayer.trigger('cutchange');
                    }
                    if (currenttime < cutstart) {
                        cutstart = currenttime;
                        cutslider.slider("values", 0, cutstart * 100 / duration);
                        mainplayer.trigger('cutchange');
                    }
                    if (!firststart) {
                        largeplaybutton.hide();
                        notaloader.hide();
                    } else {
                        notaloader.hide(100, function() {
                            notaloader.css({
                                'background-color': 'transparent',
                                'opacity': 1
                            });
                        });
                        cutslider.show();
                        //					largeplaybutton.show();
                        firststart = false;
                    }
                    seeking = false;
                },
                seeking: function(e) {
                    seeking = true;
                    //				playing = false;
                    if (!isMobile.any()) {
                        notaloader.show();
                    }
                },
                waiting: function() {},
                timeupdate: function(e) { // обновляет время воспроизведения (по позиции головки)
                    currenttime = e.jPlayer.status.currentTime;
                    if (!seeking && playing && currenttime >= cutend) {
                        $(this).jPlayer('pause', cutend);
                    }
                },
                play: function(e) {
                    var player = $(this);
                    player.jPlayer("pauseOthers"); // To avoid both jPlayers playing together.
                    if (currenttime <= cutstart || currenttime >= cutend) player.jPlayer('play', cutstart);
                    playing = true;
                    largeplaybutton.hide();
                },
                playing: function(e) {
                    notaloader.hide();
                    largeplaybutton.hide();
                    playing = true;
                    sendstat(cutstart, cutend); // запустить статистику
                },
                pause: function(e) {
                    playing = false;
                    largeplaybutton.show();
                    abortstat(); // отменить статистику
                },
                cssSelectorAncestor: '#container_' + id,
                cssSelector: {
                    videoPlay: ".nota_video-play",
                    play: ".nota_play",
                    pause: ".nota_pause",
                    stop: ".nota_stop",
                    seekBar: ".nota_seek-bar",
                    playBar: ".nota_play-bar",
                    mute: ".nota_mute",
                    unmute: ".nota_unmute",
                    volumeBar: ".nota_volume-bar",
                    volumeBarValue: ".nota_volume-bar-value",
                    volumeMax: ".nota_volume-max",
                    currentTime: ".nota_current-time",
                    duration: ".nota_duration",
                    fullScreen: ".nota_full-screen",
                    restoreScreen: ".nota_restore-screen",
                    repeat: ".nota_repeat",
                    repeatOff: ".nota_repeat-off",
                    gui: ".nota_gui",
                    noSolution: ".nota_no-solution"
                },
                swfPath: swfpath,
                preload: 'metadata',
                solution: 'html,flash',
                volume: volume,
                muted: mute,
                supplied: supplied,
                size: {
                    width: width + "px",
                    height: height + "px",
                    cssClass: "nota_video-" + width + "p"
                },
                smoothPlayBar: false,
                keyEnabled: false
            }); // $('#notaplayer_'+id).jPlayer()


        });
    }
    //end of closure
})(jQuery);
/* Author:
  http://notamedia.ru/
*/



var _columns = 4; // [4|5] количество колонок, зависит от ширины экрана
var WND, DOC, BODY, CONT, touchdevice = false, echoears = false;


// основной объект
//
var main = {
  total: { // объект со значениями счетчиков для каждой сети
    fb_cnt: null,
    vk_cnt: null,
    tw_cnt: null
  },
  init: function() {
    pageuri = window.location; // из объекта со страницы
  },
  // отображение блока с социальными кнопками
  display_block: function(container) {
    $(container).show();
  }
}
//
// социальные кнопки и счетчики
//
var social = {
  // получаем счетчик facebook
  fb_count: function(container) {
    /*
    $.getJSON('http://api.facebook.com/restserver.php?method=links.getStats&callback=?&urls=' + escape(pageuri) + '&format=json', function(data) {
      // вставляем в DOM
      if (!data[0]) {
          return
      }
      $('span', container).text(data[0].share_count);
      main.total.fb_cnt = parseInt(data[0].share_count);
    });
    */
    main.total.fb_cnt = 0 ;
  },
  // получаем счетчик vkontakte
  vk_count: function(container) {
    VK = {};
    VK.Share = {};
    VK.Share.count = function(index, count) {
      // вставляем в DOM
      $('span', container).text(count);
      main.total.vk_cnt = parseInt(count);
    };
    $.getJSON('https://vk.com/share.php?act=count&index=1&url=' + pageuri + '&format=json&callback=?');
  },
  // получаем счетчик twitter
//  tw_count: function(container) {
//    $.getJSON('http://urls.api.twitter.com/1/urls/count.json?url=' + pageuri + '&callback=?', function(data) {
//      // вставляем в DOM
//      $('span', container).text(data.count);
//      main.total.tw_cnt = parseInt(data.count);
//    });
//  },
  // по клику по кнопке
  click_button: function(container) {
    var click = false;
    $(container).click(function() {
      // проверяем был ли уже клик по кнопке
      if (!click) {
        var social_box = $(this).parent('div');
        // увеличиваем значение счетчика социалки на 1
        var count = parseInt($('span', social_box).text());
        if (!isNaN(count)) {
          count = count + 1;
          $('span', social_box).text(count);
        }
        click = true;
      }
      // открываем окно
      window.open($(this).attr("href"), 'displayWindow', 'width=700,height=400,left=200,top=100,location=no, directories=no,status=no,toolbar=no,menubar=no');
      return false;
    });
  }
}






  function isNoAnotherPage(A) {
    var a = $(A),
      url = a.attr('href');
    return (url && (url == '' || url.substring(0, 1) == '#' || url.substring(0, 11) == 'javascript:' || a.attr('target') || a.attr('rel') == 'external' || a.attr('rel') == 'ajax')) ? false : true;
  }
  function bodyclassName (WND,BODY,CONT){
    if (!echoears) {
      if (WND.width() < 1300) {
        _columns = 4;
        BODY.removeClass('widescreen');
      } else {
        _columns = 5;
        BODY.addClass('widescreen');
      }
    }
    if (CONT.length > 0 && CONT.height() < $('#mainsidebar').height()) {
      _columns--;
      BODY.addClass('smallheight');
    } else {
      BODY.removeClass('smallheight');
    }
  }

$(function() {
  WND = $(window), DOC = $(document), BODY = $('body'), CONT = BODY.find('.content');
  if (!$('html').hasClass('no-touch')) touchdevice = true;
  if ($('.echoears').length>0) echoears = true;
  bodyclassName (WND,BODY,CONT);
  var Tcol;
  WND.on('resize', function() {
    window.clearTimeout(Tcol);
    Tcol = window.setTimeout(function() {
       bodyclassName (WND,BODY,CONT);
      BODY.trigger('changecolumns');
    }, 150);
  });

  // ищем все ссылки и вешаем события на все ссылки в нашем документе
  /*
  DOC.on('click', 'a', function(e) {
    if (isNoAnotherPage(this)) {
      DOC.trigger('beforepagechange');

      // заносим ссылку в историю
      history.pushState(null, null, this.href);
      // тут можете вызвать подгрузку данных и т.п.
      var old = $('.pagecontent');
      $.ajax({
        url: this.href,
        method: 'GET',
        success: function(html){
          window.scrollTo(0,0);
          var all = $('<div />');
          all.html(html);
          all.find('.pagecontent').prependTo('body');
          old.remove();
          DOC.trigger('pagechange');
        }
      });
      // не даем выполнить действие по умолчанию
      return false;
    }
  });

  // вешаем событие на popstate которое срабатывает при нажатии back/forward в браузере
  $(window).on('popstate', function(e) {

    DOC.trigger('beforepagechange');
    // получаем нормальный объект Location
    var returnLocation = history.location || document.location;
    // тут можете вызвать подгрузку данных и т.п.
    var old = $('.pagecontent');
    $.ajax({
      url: returnLocation.href,
      method: 'GET',
      success: function(html){
        window.scrollTo(0,0);
        var all = $('<div />');
        all.html(html);
        all.find('.pagecontent').prependTo('body');
        old.remove();
        DOC.trigger('pagechange');
      }
    });
  });
*/
  DOC.trigger('pagechange');
}); // DOM loaded


$(document).bind("pagechange", function(event, ui) {
  WND = $(window), DOC = $(document), BODY = $('body'), CONT = BODY.find('.content');
  $('.iblock, .mainmenu a, .secondmenu a').cleanWS();
  $('.supermaincarousel').supermaincarousel(); // суперкарусель
  $('.liveaudioplayer').initLive();
  $('.toair').on('click', function() {
    $.scrollTo($(this).attr('href'), 500, {
      easing: 'easeOut'
    })
  });
  // баннеры в шапке
  $('.echotop').echotop(); // центрирование баннера в шапке
  $('.echoleft, .echoright').echoleftright(); // центрирование баннеров-ушей

  $('.icsearch').showSearch(); //поиск в шапке
  $('.open_auth').authForm(); //авторизация в шапке
  $('.authorized').logoutForm(); //выход из авторизации

  $('.imgcarousel').mediacarousel(); // картинки
  $('.fragments').columnize({
    columns: 3,
    lastNeverTallest: true
  });
  $('.mainpreview').mainpreview(); // основной блок с анонсами
  $('.mainpeoples').mainpeoples(); // важные люди
  $('.notaplayer').notaplayer(); // video
  $('.audionota').audionota(); // audio
  $('.multimedia').mmtabs(); // табы в мультимедии
  $('.bonustabs').bonustabs(); // пара табов над новостями на морде

  $('.commentList').comFunc();
  $('.shareBlock').sharePopup();
  $('.custom_check').replaceCheckBox();
  $('.custom_radio').radioReplace();
  $('.votescharts').votescharts();
  $('.piechart').piechart();

  $('.carousel').notacarousel();
  $('#onair').onaircarousel(); // карусель "в эфире", она внизу страницы, ее последней инициализировать
  $('.title_info .open').footOpen(); //показать/скрыть информационные партнеры в подвале
  $('.programm_info').descrOpen();
  $('.search_result .c_select').selectReplace();

  $('.faq').faq();

  $('body').on('click', '.ajax_comments', function(e) {
    e.preventDefault();
    var a = $(this),
      COMMENTSBLOCK = $('.answform');
    $.ajax({
      url: a.attr('href'),
      method: 'GET',
      success: function(html) {
        $(html).insertBefore(COMMENTSBLOCK).fadeIn('slow');
        a.parent().remove();
      }

    });
    return false;
  });
  $('.abc a').click(function(e) {
    e.preventDefault();
    var a = $(this),
      list = $('.broadcast_list, .person_list');
    $('.abc a').removeClass('cur');
    $.ajax({
      url: a.attr('href'),
      method: 'GET',
      success: function(html) {

        list.html(html);

        //$(html).insertBefore(list).fadeIn('slow');
        //list.last().remove();
        a.addClass('cur');
        $('.iblock').cleanWS();
        list.trigger("update", []);
      }

    });
    return false;
  }); //алфавитный указатель
  $('#searchList').letterlist({
    inp: '#quicksearch',
    spn: '.author .name, .guestst b, .title h2 a'
  }); // живой поиск


  (function(){
    var $suggestCover = $(".js-suggest");
    var $search = $("#psearch", $suggestCover);
    var $suggest = $(".js-suggest-list", $suggestCover);
    var url = $suggestCover.data("src");

    $search.on("keyup", function(e){
      var val = $search.val();
      if (val.length < 3) {
        $suggest.addClass("_hidden");
        return;
      }
      $suggest.load(url + "?val=" + val, function(){
        $suggest.removeClass("_hidden");
      });
    });
  })();


  //(function(){
    //$("#personList").
  //	function setLoadMoreListeners(){
  //		console.log(1);
  //		addAjaxList($("#personList"), ".author", $(".js-person-list-load-more-btn"));
  //	}

  //	setLoadMoreListeners();

  //	$("#personList").on("update", setLoadMoreListeners)
//	})();

  //$("#psearch").);


//    $('#personList').letterlist({
//        inp: '#psearch',
//        spn: '.about .name, .about .post '
//    }); // живой поиск

  $(".calendar").each(function() {
    $(this).calendar();
  });
  pageUp();
  popularblFunc();
  if (!touchdevice) {
  DOC.on('mouseenter', '.preview', function() {
    var block = $(this);
    if (block.hasClass('mouseenter') || block.hasClass('previewclone') || block.parents('.mainpeoples').length > 0 || block.hasClass('voicepreview')) return false;
    $('.mouseenter').removeClass('mouseenter');
    $('.previewclone').remove();
    var clone = block.clone(true);
    clone.addClass('previewclone');
    if (block.hasClass('bdjhot')){
          clone.addClass('bdjhot');
    }
    if (block.hasClass('bdjnew')){
          clone.addClass('bdjnew');
    }
    block.addClass('mouseenter');

    var pos = block.offset(),
      cls = 'clone' + (new Date()).getTime();
    clone.appendTo('body');
    clone.css({
      'opacity': 0,
      'position': 'absolute',
      'top': pos.top,
      'left': pos.left,
      'margin': 0,
      'z-index': 10
    }).addClass('hover').addClass(cls);
    clone.stop().animate({
      'opacity': 1
    }, 250);
    clone.on('mouseleave', function(e) {
      if ($(e.tagret).parents('.' + cls).length > 0) return false;
      clone.stop().animate({
        'opacity': 0
      }, 100, function() {
        block.removeClass('mouseenter');
        clone.remove();
      });
    });
  });
  }
  DOC.on('click', '.js-expandtxt', function() {
    $(this).toggleClass('op');
  });
  DOC.on('click', '.js-popup', function() {
    $(this).popupList();
    return false;
  });


  $('.uipopup').uipopup();
  $('.connect_bl').tabs();

  $('.typical ul:not([class]), .typical ol:not([class])').each(function() {
    var list = $(this);
    list.addClass('norm');
    $('li', list).wrapInner('<div class="dark"></div>');
  });
  $('.typical table:not([class]) tr:gt(0)').mouseenter(function() {
    $(this).addClass('hover');
  }).mouseleave(function() {
    $(this).removeClass('hover');
  });

  $('.typicalform').each(function() {
    var form = $(this);
    $(':checkbox', form).replaceCheckBox();
    $(':radio', form).radioReplace();
    $('select', form).selectReplace();
    form.find('.birthdate').on('change', function() {
      form.find('.setbirthdate').val($(this).val());

    }).mask("99.99.9999");
    form.find('.setbirthdate').on('change', function() {
      form.find('.birthdate').val($(this).val());
    }).on('focus', function() {
      $.scrollTo($(this), {
        offset: {
          left: 0,
          top: -150
        }
      })
    });

  });
  $(".calend").click(function() {
    return false;
  });
  $(".calendarmonth").each(function() {
    $(this).calendarmonth();
  });
  $(".calendaryear").each(function() {
    $(this).calendaryear();
  });
  $(".calendarweek").each(function() {
    $(this).calendarweek();
  });



  // выравнивание высоты правой колонки по высоте контента
  $('#mainsidebar').each(function(){
    var aside = $(this), par = aside.parent(); cont = par.children('section');
    function ajustHeight() {
      aside.height('').removeClass('asideheightajust');
      var asideH = aside.outerHeight(), contH = 0;
      cont.each(function(){
        contH+=$(this).outerHeight(true);
      });
      if (asideH>contH) {
        aside.height(contH).addClass('asideheightajust');
      }
    }
    if(cont.length>0) {
      ajustHeight();
    }
    WND.on('resize load', ajustHeight);
  });


  $('body').on('click', '.open_auth_link, .open_reg_link', function(e){
    e.preventDefault();
    var a = $(this);
    var authpopup = $('.auth_popup');
    authpopup.find('.open').removeClass('open');
    authpopup.children((a.hasClass('open_auth_link'))?'.reg':'.auth').addClass('open');
    authpopup.find((a.hasClass('open_auth_link'))?'.authform, .socialblock':'.regform').addClass('open');
    DOC.scrollTo(0,600,{easing:'easeOutQuad',onAfter: function(){
      $('.header .open_auth').trigger('click');
    }});
  });

  $('.mainmenu').submenuOpen();

}); // pagechange



// mosewheel
function attacheWheelEvents(elem, onWheel) {
    if (elem.addEventListener) {
        if ('onwheel' in document) {
            // IE9+, FF17+
            elem.addEventListener ("wheel", onWheel, false);
        } else if ('onmousewheel' in document) {
            // устаревший вариант события
            elem.addEventListener ("mousewheel", onWheel, false);
        } else {
            // 3.5 <= Firefox < 17, более старое событие DOMMouseScroll пропустим
            elem.addEventListener ("MozMousePixelScroll", onWheel, false);
        }
    } else { // IE<9
        elem.attachEvent ("onmousewheel", onWheel);
    }
}


$(window).load(function() {
  WND = $(window), BODY = $('body'), CONT = BODY.find('.content');
  bodyclassName (WND,BODY,CONT);
        $('.mainbanner_box').fadeIn();
});







// после загрузки страницы начинаем все выводить и запускать
//
$(function() {
  var i = 0;
  main.init();
  // функции открытия нового окна по клику по кнопке
  social.click_button(".fb_btn");
  social.click_button(".vk_btn");
  social.click_button(".tw_btn");
  // получаем счетчики для каждой сети
  social.fb_count(".fb_sharer");
  social.vk_count(".vk_sharer");
//  social.tw_count(".tw_sharer");
  // проверяем получены ли счетчики и отображаем блок с кнопками
  interval = setInterval(function() {
    i++;
    // как только объект main.total содержит значения
    if ((main.total.fb_cnt !== null && main.total.vk_cnt !== null && main.total.tw_cnt !== null)) {
      // отображаем блок с социальными кнопками
      main.display_block('.social_block');
      // очищаем интервал
      clearInterval(interval);
    } else if (i > 30) {
      // очищаем интервал после 50 повторов
      clearInterval(interval);
    }
  }, 100);
});







(function($) { //create closure
  $.fn.cleanWS = function(options) {
    this.each(function() {
      var iblock = this,
        par = iblock.parentNode,
        prev = iblock.previousSibling,
        next = iblock.nextSibling;
      while (prev) {
        var newprev = prev.previousSibling;
        if (prev.nodeType == 3 && prev.nodeValue) {
          for (var i = prev.nodeValue.length - 1; i > -1; i--) {
            var cc = prev.nodeValue.charCodeAt(i);
            if (cc == 9 || cc == 10 || cc == 32) {
              prev.nodeValue = prev.nodeValue.slice(0, i);
            } else {
              break;
            }
          }
        }
        if (prev.nodeType == 8) par.removeChild(prev);
        prev = newprev;
      }
      while (next) {
        var newnext = next.nextSibling;
        if (next.nodeType == 3 && next.nodeValue) {
          while (next.nodeValue.length) {
            var cc = next.nodeValue.charCodeAt(0);
            if (cc == 9 || cc == 10 || cc == 32) {
              next.nodeValue = next.nodeValue.slice(1);
            } else {
              break;
            }
          }
        }
        if (next.nodeType == 8) par.removeChild(next);
        next = newnext;
      }
    });
  }
  //end of closure
})(jQuery);

(function($) { //create closure
  $.fn.notacarousel = function(options) {
    this.each(function() {
      var defaults = {
        T: (touchdevice) ? 350 : 800, // скорость
        A: (touchdevice) ? 'easeOutQuad' : 'easeOutQuad', //'easeOutElastic', // дрючка
        'slider': false
      };
      var errors = 0,
        msg = '',
        o;
      if (typeof options != 'string') {
        o = $.extend(defaults, options);
      } else {
        o = defaults;
      }
      var cont = $(this),
        items = cont.find('.iblock.preview'),
        size = items.length,
        T = o.T,
        A = o.A;

      function init() {
        var curr = cont.find('.current');
        items.wrapAll('<div class="carouselwrapper"><div class="carouselslide"></div></div>');
        var W = 0;
        items.each(function(i) {
          W += $(this).outerWidth(true);
        });
        cont.find('.carouselslide').width(W);
        setNav('init');
        if (curr.length > 0) {
          curr.nextAll('.preview').addClass('later');
          var val = (curr.index() + 1) * 100 / size;
          cont.find('.carouselslider').slider({
            value: val
          });
          moveBySlider(val, true);
        }
      }

      function reinit() {
        o.slider = (cont.find('.carouselslider').length > 0) ? true : false;
        cont.find('.carouselnav').remove();
        setNav('reinit');
      }

      if (options == 'reinit') {
        reinit();
      } else {
        init();
      }

      $('body').bind('changecolumns', function() {
        reinit();
      });

      function moveBySlider(val, bychange) {
        var block = Math.round(val * size / 100),
          ind = Math.ceil(block / _columns),
          nav = cont.find('.carouselnav'),
          navslides = $('li.slide', nav);

        if (bychange) {
          var slide = cont.find('.carouselslide'),
            wrapper = cont.find('.carouselwrapper'),
            W = 0,
            sw = slide.width(),
            ww = wrapper.width();
          nav.find('.current').removeClass('current');
          navslides.eq(ind - 1).addClass('current');
          if (block - 2 > 0) {
            for (var n = 0; n < block - 2; n++) {
              var item = items.eq(n);
              if (item.length > 0) W += Math.ceil(item.outerWidth(true));
            }
            if (sw - W < ww) W = sw - ww - parseInt(items.last().css('margin-right'));
          }
          slide.css({
            'margin-left': -W
          });
        } else {
          navslides.eq((ind - 1 > 0) ? (ind - 1) : 0).trigger('click', ['slide']);
        }
      }


      function setNav(evtype) {
        var nav = $('<ul class="carouselnav"/>').appendTo(cont);
        // карусель
        for (var i = 0; i < size; i++) {
          if (i % _columns == false) {
            nav.append('<li class="slide"><i class="num">' + i + '</i></li>');
          }
        }
        nav.append('<li class="toleft"><i class="wsico">&#x0033;</i></li><li class="toright"><i class="wsico">&#x0034;</i></li>');

        $('li.toleft,li.toright', nav).on('click', function() {
          var li = $(this),
            curr = nav.find('.current'),
            newli = (li.hasClass('toleft')) ? curr.prev('.slide') : curr.next('.slide');

          if (newli.length > 0) {
            newli.trigger('click');
          } else {

          }
        });

        var curr = 0;
        for (var i = 0; i < items.length; i++) {
          var pos = items.eq(i).position();
          if (pos.left >= 0) {
            break;
          }
          if (i % _columns == 0) curr++;
        }

        var linav = $('li.slide', nav),
          linavsize = linav.length;
        linav.each(function(i) {
          var navli = $(this);
          if (i == curr) {
            navli.addClass('current');
          } else {
            navli.addClass('gtcurrent');
          }

          navli.bind('dblclick', function(e) {
            e.preventDefault();
          });
          navli.children('i').text(i + 1);
          navli.click(function(e, esource) {
            e.preventDefault();

            var li = $(this),
              wrapper = cont.find('.carouselwrapper'),
              slide = cont.find('.carouselslide');
            if (li.hasClass('current') || cont.hasClass('inaction')) return false;
            if (esource != 'slide') {
              T = o.T;
              A = o.A;
              cont.addClass('inaction');
            } else {
              T = 0;
              A = 'linear';
            }
            var current = nav.find('.current'),
              ind = li.index();
            var W = 0;

            var num = ind * _columns,
              sw = slide.width(),
              ww = wrapper.width();
            for (var n = 0; n < num; n++) {
              var item = items.eq(n);
              if (item.length > 0) W += Math.ceil(item.outerWidth(true));
            }
            if (sw - W < ww) W = sw - ww - parseInt(items.last().css('margin-right'));
            slide.stop().animate({
              'margin-left': -W
            }, T, A, function() {
              current.removeClass('current');
              li.addClass('current');
              cont.removeClass('inaction');
              $('li.gtcurrent', nav).removeClass('gtcurrent');
              $('li.slide:gt(' + ind + ')', nav).addClass('gtcurrent');
              var ind = $('li.current', nav).index();
              $('li.toleft,li.toright', nav).removeClass('disabled');
              if (ind == 0) {
                $('li.toleft', nav).addClass('disabled');
              }
              if (ind == linavsize - 1) {
                $('li.toright', nav).addClass('disabled');
              }
            });

            if (o.slider) {
              var val = num * 100 / size;
              if (ind == 0) val = 0;
              if (ind == linavsize - 1) val = 100;
              cont.find('.carouselslider').slider({
                value: val
              });
            }


          });
          var ind = $('li.current', nav).index();
          $('li.toleft,li.toright', nav).removeClass('disabled');
          if (ind == 0) {
            $('li.toleft', nav).addClass('disabled');
          }
          if (ind == linavsize - 1) {
            $('li.toright', nav).addClass('disabled');
          }
        });




        var W = 0,
          slide = cont.find('.carouselslide'),
          sw = slide.width(),
          ww = cont.find('.carouselwrapper').width(),
          ML = parseInt(slide.css('margin-left'));
        if (ML < ww - sw) {
          W = sw - ww - parseInt(items.last().css('margin-right'));
          slide.stop().animate({
            'margin-left': -W
          }, T / 10, A, function() {});
        }



        if (evtype == 'init' && o.slider) {
          var slider = $('<div class="carouselslider" />').appendTo(cont);
          slider.slider({
            step: 100 / size,
            slide: function(event, ui) {
              moveBySlider(ui.value);
            },
            stop: function(event, ui) {
              moveBySlider(ui.value);
            },
            change: function(event, ui) {}
          });
        }
        // touch
        /*if (evtype == 'init' && touchdevice) {
          var TTT;
          var nc = cont.get(0);
          nc.ontouchstart = function(e) {
            _ipadY = e.targetTouches[0].pageY;
            _ipadX = e.targetTouches[0].pageX;
          }
          nc.ontouchmove = function(e) {
            e.preventDefault();
            if (!cont.hasClass('inaction') && Math.abs(_ipadY - e.targetTouches[0].pageY) < Math.abs(_ipadX - e.targetTouches[0].pageX)) {
              window.clearTimeout(TTT);
              TTT = window.setTimeout(function() {
                var next = (_ipadX - e.targetTouches[0].pageX < 0) ? cont.find('.toleft') : cont.find('.toright');
                if (next.length > 0) next.trigger('click'); // кликнуть по следующей ссылке в меню
              }, 20);
            }
          }
        }*/
        // mosewheel
        /*
        if (evtype=='init') {
          cont.on('DOMMouseScroll mousewheel', function(e){
            e.preventDefault();
            next = (e.originalEvent.detail < 0) ? cont.find('.toleft') : cont.find('.toright');
            if (next.length > 0) next.trigger('click'); // кликнуть по следующей ссылке в меню
            return;
          });
        }
*/
      }
    });
  }
  //end of closure
})(jQuery);





(function($) { //create closure
  $.fn.mainpeoples = function(options) {
    this.each(function() {
      var cont = $(this),
        sign = cont.find('.vip_sign'),
        showcase = cont.find('.vip_showcase');

      function init() {
        fake_showcase = showcase.clone();
        fake_showcase.find('.freshentry').remove();
        fake_showcase.addClass('fake').appendTo(cont);
        prepare('init');
      }

      function reinit() {
        prepare('reinit');
      }
      if (options == 'reinit') {
        reinit();
      } else {
        init();
      }
      $('body').bind('changecolumns', function() {
        reinit();
      });

      function prepare(evtype) {
        var W = showcase.width(),
          w = W * 4 / 9;
        showcase.children('.iblock').each(function() {
          var column = $(this),
            pos = column.position(),
            cw = column.width();
          if (pos.left < w) {
            column.removeClass('tol').addClass('tor');
          } else {
            column.removeClass('tor').addClass('tol');
          }
          if (evtype == 'init') {
            column.find('.mainperson').each(function() {
              var person = $(this),
                freshentry = person.find('.freshentry'),
                photo = person.children('.photo'),
                freshphoto = freshentry.find('.photo');
              freshentry.children().wrapAll('<div class="fe_bg"><div class="fe_cont"></div></div>');
              var txt = $('.author, .when, .txt, .meta, .mediamenu', freshentry);
              if (person.find('.mediamenu').length > 0) {
                person.addClass('wmarg');
              }
              txt.css('opacity', 0);
              photo.on('mouseenter', function() {
                photo.css('z-index', 100);
                person.css('z-index', 99);
                showcase.find('.vis').each(function() {
                  var vis = $(this);
                  vis.children('.photo').css('z-index', '');
                  vis.css('z-index', '').find('.author, .when, .txt, .meta, .mediamenu').stop().animate({
                    opacity: 0
                  }, 100, 'easeInCubic');
                  vis.removeClass('vis').find('.freshentry').stop().animate({
                    width: 0
                  }, 300, 'easeOutQuad');
                });
                var bordT = parseInt(freshphoto.css('border-top-width'));
                freshphoto.css('top', (photo.position()).top)

                if (column.hasClass('tor')) { // слева-направо
                  freshentry.css({
                    right: 'auto',
                    left: (column.position()).left - parseInt(freshphoto.css('left'))
                  });
                } else { // справа-налево
                  freshentry.css({
                    left: 'auto',
                    right: showcase.width() - (column.position()).left - column.width() - parseInt(freshphoto.css('right')) - parseInt(freshphoto.css('border-right-width'))
                  });
                }
                // выбрать ширину
                var fw = (person.hasClass('wmarg')) ? '41.625em' : '36.625em';
                if (column.hasClass('type2')) fw = (person.hasClass('wmarg')) ? '33.125em' : '28.125em';
                if (column.hasClass('type3')) fw = (person.hasClass('wmarg')) ? '28.4375em' : '23.4375em';
                // анимация
                freshentry.stop().animate({
                  width: fw
                }, 300, 'easeOutQuad', function() {
                  txt.animate({
                    opacity: 1
                  }, 500, function() {
                    photo.css('z-index', '');
                  });
                });
                person.addClass('vis');
                $(document).off('mousemove.closefreshentry').on('mouseout.closefreshentry', function(e) {
                  if ($(e.target).parents('.vip_showcase').length < 1) {
                    showcase.find('.vis').each(function() {
                      var vis = $(this);
                      vis.children('.photo').css('z-index', '');
                      vis.css('z-index', '').find('.author, .when, .txt, .meta, .mediamenu').stop().animate({
                        opacity: 0
                      }, 100, 'easeInCubic');
                      vis.removeClass('vis').find('.freshentry').stop().animate({
                        width: 0
                      }, 100, 'easeOutQuad');
                    });
                  }
                });

              }).on('mouseout', function() {}).on('click dblclick', function(e) {
                e.preventDefault();
              });
            });
            showcase.addClass('mp_ready');
          }
        });
      }
    });
  };
  //end of closure
})(jQuery);



(function($) { //create closure
  $.fn.mainpreview = function(options) {
    this.each(function() {
      var cont = $(this);
      var rel = cont.children('.rel'), relpos = rel.position();
      var morebutt = cont.find('.moregiant');
      morebutt.css({'position':'relative','margin-top':0,'clear':'none','margin-bottom':0,'width':500,'left':'50%','margin-left':-250});
      cont.addClass('clearfix').css({'margin-bottom':0});
        function setHeight(columns) {
          morebutt.css('margin-top','0');
            var maxh = 0, maxbh = 0;
            for (var i = 0; i < columns.length; i++) {
              var col = columns[i][columns[i].length-1];
              maxh = Math.max(col.sum, maxh);
              if (i>0 && i<columns.length-1) {
                maxbh = Math.max(col.sum, maxbh);
              }
            }
            rel.height(maxh);
            var bott = maxbh-maxh+20;
            morebutt.css({'margin-top':bott});

            cont.css({'margin-bottom': 0});

            var absbott = Math.abs(bott);
            if (absbott-60>0) {
              cont.css({'margin-bottom': absbott-60});
            }
        }

        function testImagesLoad(htmlcode, loader){
              var IMGS = htmlcode.find('img[src!=""]');
              var img = [];
              IMGS.each(function(i){
                if ($(this).attr('src')) {
                  var pic = new Image();
                  pic.src = $(this).attr('src');
                  img.push(pic);
                }
              });
              var count = 0;
              htmlcode.off('updatestat').on('updatestat', function(){
                count++;
                if(count>=img.length) {
                  prepare('reinit');
                  if (loader && loader.length>0) loader.remove();
                  $('a',morebutt).removeClass('onload');
                }
              });
              for (var i=0; i<img.length; i++) {
                $(img[i]).bind('load abort error',function(){
                  htmlcode.trigger('updatestat');
                });
              }

        }

      function init() {
        $('a',morebutt).click(function(e) {
          e.preventDefault();
          var a = $(this);
          if (a.hasClass('onload')) return false;
          a.addClass('onload');
          var loader = $('<div class="loader" style="margin-left:-15px;"><img src="/i/ajax-loader_.gif" alt="загрузка"></div>').prependTo(a.parent());
          var pos = a
          $.ajax({
             // url: a.attr('href') + $('.preview:last, .infinityitem:last', cont).data('maxid'),
            url: a.attr('href'),
            method: 'GET',
            success: function(html) {
              var htmlcode = $($(html).html());
//
              rel.height('')
              rel.append(htmlcode);
              cont.find('.iblock').cleanWS();

              testImagesLoad(rel, loader);

              prepare('reinit');
              cont.trigger('change');
            }
          });
        });
        prepare('init');
      }

      var reinitflag = false, runflag = false;

      function reinit() { prepare('reinit'); }
      if (options == 'reinit') { reinit(); } else { init(); }

      testImagesLoad(rel, false);
      testImagesLoad($('#mainnewscolumn'), false);
      testImagesLoad($('#mainsidebar'), false);

      $(window).bind('load', function() { window.setTimeout(function(){ reinit();},1000); });

      $('body').bind('changecolumns', function() {  reinit(); });



      function lineUp(columns, N, second) {

        if (reinitflag || runflag) return;
        runflag = true;
        /* здесь можно допилить и подтянуть слишком торчащие колонки */
        var maxtopblock, // последний блок в колонке, у которого верх ниже всех
          mintopblock, // последний блок в колонке, у которого верх выше всех
          maxpos = 0, // макс высота колонки
          minpos = 0, // мин высота колонки
          mincol = 0, // самая короткая колонка
          maxcol = 0, // самая длинная колонка
          minH = 0,
          minHCol = 0;

          for (var i = 0; i < columns.length; i++) {
            var col = columns[i][columns[i].length-1];
            var bottom = col.sum;
            if (i==0) {
              minpos = bottom;
              maxpos = bottom;
              mincol = 0;
              maxcol = 0;
              mintopblock = col.obj;
              maxtopblock = col.obj;
            } else {
              if (bottom<minpos) {
                minpos = bottom;
                mincol = i;
                mintopblock = col.obj;
              } else {
              }
              if (bottom>maxpos) {
                maxpos = bottom;
                maxcol = i;
                maxtopblock = col.obj;
              }
            }
          }


          var oldcol = columns[maxcol][columns[maxcol].length-1];
          var newcol = columns[mincol][columns[mincol].length-1];

//console.log(oldcol.toSource()+' | '+oldcol.obj.attr('id'))

            var needreconstruct = false;

            if (oldcol.sum-oldcol.H > newcol.sum && oldcol.obj.attr('id')!='mainsidebar') {
              // первый проход - заткнуть самую глубокую из самой высокой
              needreconstruct = true;
            }

            if (!needreconstruct && newcol.obj.attr('id')!='mainsidebar') {
              // второй проход - заткнуть самую глубокую маленькой, верх которой ниже ее высоты
              for (var i = 0; i < columns.length; i++) {
                var col = columns[i][columns[i].length-1];
                var top = col.sum-col.H;

                if (i==0) {
                  minH = col.H;
                  minHCol = 0;
                } else {
                  if (top > minpos) {
                    minHCol = i;
                  }
                }
              }
              var newHcol = columns[minHCol][columns[minHCol].length-1];
              if (newHcol.H < oldcol.sum-newcol.sum && newHcol.sum-newHcol.H>newcol.sum){
//console.log('+++')
                oldcol = newHcol;
                maxtopblock = oldcol.obj;
                mintopblock = newcol.obj;
                maxcol = minHCol;
                needreconstruct = true;
              }
            }

          if (needreconstruct){
            var h = Math.abs(parseInt(mintopblock.css('margin-bottom')));
            maxtopblock.css({
              'left':(mincol-maxcol)*240,
              'top': (mintopblock.offset()).top - (maxtopblock.offset()).top + mintopblock.outerHeight()+h});

            var removed = columns[maxcol].splice(columns[maxcol].length-1,1);
            var oldsum = columns[mincol][columns[mincol].length-1].sum;
            removed[0].sum = oldsum+removed[0].H;
            if (!columns[mincol]) {
              columns[mincol] = removed;
            } else {
              columns[mincol][columns[mincol].length] = removed[0];
            }
          }


            if (!needreconstruct && oldcol.obj.attr('id')!='mainsidebar' && newcol.obj.attr('id')!='mainsidebar' && oldcol.obj.attr('id')!='mainnewscolumn' && newcol.obj.attr('id')!='mainnewscolumn') {
              // третий проход -

              if(oldcol.H>newcol.H) {

                var oldtmp = columns[maxcol].splice(columns[maxcol].length-1,1);
                var newtmp = columns[mincol].splice(columns[mincol].length-1,1);
                var h = Math.abs(parseInt(newtmp[0].obj.css('margin-bottom')));
                var l = parseInt(oldtmp[0].obj.css('left'))+(mincol-maxcol)*240;


                var t = parseInt(oldtmp[0].obj.css('top'))+(((columns[mincol].length>0)?columns[mincol][columns[mincol].length-1].sum:0)-((columns[maxcol].length>0)?columns[maxcol][columns[maxcol].length-1].sum:0));

                oldtmp[0].obj.css({'left':l,'top':t});

                var h = Math.abs(parseInt(oldtmp[0].obj.css('margin-bottom')));
                var l = parseInt(newtmp[0].obj.css('left'))+(maxcol-mincol)*240;
                var t = parseInt(newtmp[0].obj.css('top'))+(((columns[maxcol].length>0)?columns[maxcol][columns[maxcol].length-1].sum:0)-((columns[mincol].length>0)?columns[mincol][columns[mincol].length-1].sum:0));
                newtmp[0].obj.css({'left':l,'top':t});
                oldtmp[0].sum = ((columns[mincol].length>0)?columns[mincol][columns[mincol].length-1].sum:0) + oldtmp[0].H;
                newtmp[0].sum = ((columns[maxcol].length>0)?columns[maxcol][columns[maxcol].length-1].sum:0) + newtmp[0].H;

                  if (!columns[mincol]) {
                    columns[mincol] = oldtmp;
                  } else {
                    columns[mincol][columns[mincol].length] = oldtmp[0];
                  }
                  if (!columns[maxcol]) {
                    columns[maxcol] = newtmp;
                  } else {
                    columns[maxcol][columns[maxcol].length] = newtmp[0];
                  }
              }
            }

          runflag = false;
          N++;
          if (N<columns.length) {
              lineUp(columns,N,second);
          } else {
            if (!second) {
              N=0;
            }
          }
//				setHeight();
      }



      function prepare(evtype) {
        var preview = cont.find('.preview, .infinityitem');
        //			if (preview.hasClass('.preview')) return false				if (preview.length < 5) {return false;}
        if (preview.length < 5) {return false;}
        if (evtype == 'reinit') {
          preview.css({ 'margin-top': ''});
        }
        var rowtop = 0,
          columns = [],
          W = cont.width(),
          cc = Math.ceil(W / 240);
        var sidebar = $('#mainsidebar'),
          column = $('#mainnewscolumn');
        if (!cont.closest('section').hasClass('content')) {
          columns[cc - 1] = (new Array({
            'obj': sidebar,
            'H': sidebar.outerHeight()-relpos.top+20,
            'sum': sidebar.outerHeight()-relpos.top+20
          }));
          columns[cc - 2] = (new Array({
            'obj': column,
            'H': column.outerHeight()-relpos.top+20,
            'sum': column.outerHeight()-relpos.top+20
          }));

        } else {}

        preview.css({
          position: 'static',
          top: '',
          left: ''
        }).each(function(i) {
          var block = $(this);
          if (!block.hasClass('preview')) return false;
          block.css('position', 'relative');
          var pos = block.position(),
            H = block.outerHeight(true);
          if (pos.top > rowtop) {
            rowtop = pos.top;
          } else { // первый элемент первого ряда или не первый элемент любого ряда

          }
          var ind = Math.round(pos.left / 240);
          var sum = (columns[ind] && columns[ind][columns[ind].length - 1]) ? columns[ind][columns[ind].length - 1].sum : 0;
          if (!columns[ind]) {
            columns[ind] = (new Array({'obj': block, 'id':block.data('maxid'), 'H': H, 'sum': sum + H }));
          } else {
            columns[ind].push({ 'obj': block,'id':block.data('maxid'),'H': H, 'sum': sum + H });
          }
          block.css({'margin-top': -(pos.top - sum) });

        });
        reinitflag = false;

        lineUp(columns,0);
        setHeight(columns);
         $(window).load(function(){setHeight(columns);});


      }
    });
  }
  //end of closure
})(jQuery);


(function($) { //create closure
  $.fn.bonustabs = function(options) {
    this.each(function() {
      var cont = $(this),
        nav = cont.find('.tabopener'),
        T = 450,
        A = 'easeOutQuad';

      nav.on('click', function(e) {
        e.preventDefault();
        if ($(this).hasClass('inaction')) return;
        var a = $(this),
          href = a.attr('href'),
          tab = $(href),
          txt = tab.find('.cont');
        a.addClass('inaction');
        if (tab.hasClass('opened')) { // закрыть, если до этого был открыт
          txt.css('opacity', 0);
          tab.stop().animate({
            height: 0
          }, T, A, function() {
            $(this).removeClass('opened');
            a.removeClass('inaction');
          });
        } else { // посмотреть высоту
          txt.css('opacity', 0);
          tab.height('auto');
          var H = tab.height();
          tab.height(0);
          // закрыть открытые
          cont.find('.opened').stop().animate({
            height: 0
          }, T / 10, A, function() {
            $(this).removeClass('opened');
          });
          // открыть новый
          tab.stop().animate({
            height: H
          }, T, A, function() {
            tab.addClass('opened').height('auto');
            a.removeClass('inaction');
          });
          // и показать его содержимое
          window.setTimeout(function() {
            txt.animate({
              opacity: 1
            }, T / 3, function() {});
          }, T / 4);
        }
      });

      cont.find('.form').submit(function(e) {
        var form = $(this);
        form.data('valid', false);
        form.formValidator();
        if (!form.data('valid')) {
          e.preventDefault();
            return false;

        }
        return true;
      });

    });
  }
  //end of closure
})(jQuery);


(function($) { //create closure
  $.fn.supermaincarousel = function(options) {
    this.each(function() {
      // cскопипастить в новую
      // новая станет рамкой
      // старую спрятать
      // в новую копировать нужные слайды перед анимацией
      var cont = $(this),
        A = 'easeInOutQuad';

      function init() {
        prepare('init');
      }

      function reinit() {
        prepare('reinit');
      }
      if (options == 'reinit') {
        reinit();
      } else {
        init();
      }
      $('body').bind('changecolumns', function() {
        reinit();
      });

      function scatter(mask, delta) {
        // кладем клоны блоков из хранилища в маску
        mask.find('.iblock').each(function(i) {
          var B = $(this),
            storage = cont.find('.slidestorage'),
            block = $('.iblock:eq(' + (i + delta) + ')', storage),
            clone = block.children('.slide').clone(true);
          clone.addClass('opened').appendTo(B); // раскидать .slide  в блоки маски
          var T;
          B.find('.opened .info').on('mouseenter', function() { // включить hover для .info
            B.addClass('hover');
            B.find('.text').stop().slideDown(300);
          }).on('mouseleave', function() {
            B.find('.text').stop().slideUp(200, function() {
              B.removeClass('hover');
            });
          });
        });
      }


      function setmask(mask, emergency) {
        mask.html('');
        if (emergency) { // если первая - широченная
          $('<div class="iblock type0" data-type="type0" />').appendTo(mask);
          if (_columns < 5) { // 4 колонки
            $('<div class="iblock type4" data-type="type4" />').appendTo(mask);
          } else { // 5 колонок
            $('<div class="iblock type3" data-type="type3" /><div class="iblock type4" data-type="type4" />').appendTo(mask);
          }
        } else {
          if (_columns < 5) { // 4 колонки
            $('<div class="iblock type1" data-type="type1" /><div class="iblock type2" data-type="type2" /><div class="iblock type4" data-type="type4" />').appendTo(mask);
          } else { // 5 колонок
            $('<div class="iblock type1" data-type="type1" /><div class="iblock type2" data-type="type2" /><div class="iblock type3" data-type="type3" /><div class="iblock type4" data-type="type4" />').appendTo(mask);
          }
        }
      }

      // TODO сдвиг картинок при переключении
      function prepare(evtype) {
        if (evtype == 'init') {
          var mask = $('<div class="slidesmask" />').appendTo(cont),
            blocks = cont.children('.iblock'),
            storage = $('<div class="slidestorage" />').appendTo(cont);
          blocks.appendTo(storage);
          // собираем маску
          if ($('.iblock:first', storage).hasClass('emergency')) {
            setmask(mask, true);
          } else {
            setmask(mask, false);
          }
          scatter(mask, 0); // раскидываем слайды
          // добавляем навигацию
          var nav = $('<div class="slidenav"><a href="#" class="toleft"><span class="wsico">&#x0033;</span></a><a href="#" class="toright"><span class="wsico">&#x0034;</span></a></div>').appendTo(cont);

          nav.find('.toright').on('click', function(e) { // клик вправо
            e.preventDefault();
            if (cont.hasClass('inaction')) return;
            cont.addClass('inaction');

            var scrollD = (_columns==4)?2:3; // по сколько слайдов пролистать

            var moveblock = $('.iblock', storage).slice(0, scrollD);
            moveblock.appendTo(storage);

            var mask = cont.find('.slidesmask'), newmask = $('<div class="slidesmask" />');

            mask.before(newmask);

            if ($('.iblock:eq(0)', storage).hasClass('emergency')) {
              setmask(newmask, true);
            } else {
              setmask(newmask, false);
            }

            scatter(newmask, 0); // и раскидываем слайды

            newmask.css({
              opacity: 0,
              position: 'absolute',
              top: 0,
              left: 0,
              'z-index': 10
            });

            var iblock = newmask.find('.iblock'),
              oldiblock = mask.find('.iblock'),
              oldtxt = $('.section, .info', oldiblock),
              oldphoto = oldiblock.find('.photo'),
              newphoto = iblock.find('.photo');
            newtxt = $('.section, .info', iblock);
            newphoto.css('margin-left', '100%');
            newtxt.css('opacity', 0);

            oldtxt.stop().animate({opacity: 0}, 100, function() {
              newmask.stop().animate({opacity: 1}, 100, A);

              iblock.each(function(i) {
                var B = $(this),
                  slide = B.find('.slide'),
                  photo = slide.find('.photo'),
                  txt = $('.section, .info', slide),
                  ml = (photo.data(B.data('type'))) ? photo.data(B.data('type')) : 0;

                slide.removeClass('opened');

                window.setTimeout(function(){

                  photo.stop().animate({'margin-left': ml + 'px'}, 550, A, function() {
                    window.setTimeout(function(){
                      txt.stop().animate({opacity: 1}, 300, A, function() {
                        if (i == iblock.length - 1) {
                          newmask.css({
                            'position': '',
                            'z-index': '',
                            'left': '',
                            'top': ''
                          });
                          if (i==iblock.length-1) {
                            cont.removeClass('inaction');
                            mask.remove();
                          }
                        }
                      });
                    },100);
                  });
                  if (i==0) {
                    oldphoto.each(function(i) {
                      var photo = $(this);
                      photo.animate({'margin-left': -photo.width()}, 550, A, function() {
                        //if (i == oldphoto.length - 1) {mask.remove();}
                      });
                    });
                  }

                }, 150);
              });
            });



          });
          nav.find('.toleft').on('click', function(e) { // клик влево
            e.preventDefault();
            if (cont.hasClass('inaction')) return;
            cont.addClass('inaction');


            var scrollD = (_columns==4)?2:3; // по сколько слайдов пролистать

            var moveblock = $('.iblock', storage).slice(-scrollD);
            if (moveblock.length>0){ moveblock.prependTo(storage); }

            var mask = cont.find('.slidesmask'),
              newmask = $('<div class="slidesmask" />');

            mask.before(newmask);

            if ($('.iblock:eq(0)', storage).hasClass('emergency')) {
              setmask(newmask, true);
            } else {
              setmask(newmask, false);
            }
            scatter(newmask, 0); // и раскидываем слайды

            newmask.css({
              opacity: 0.5,
              position: 'absolute',
              top: 0,
              left: 0,
              'z-index': 10
            });

            var iblock = newmask.find('.iblock'),
              oldiblock = mask.find('.iblock'),
              oldtxt = $('.section, .info', oldiblock),
              oldphoto = oldiblock.find('.photo'),
              newphoto = iblock.find('.photo');
            newtxt = $('.section, .info', iblock);
            newtxt.css('opacity', 0);
            newphoto.each(function() {
              var photo = $(this);
              photo.css('margin-left', -photo.width());
            });


            oldtxt.stop().animate({opacity: 0}, 100, function() {

              newmask.stop().animate({opacity: 1}, 100, A);

              iblock.each(function(i) {
                var B = $(this), slide = B.find('.slide'),
                  photo = slide.find('.photo'),
                  txt = $('.section, .info', slide),
                  ml = (photo.data(B.data('type'))) ? photo.data(B.data('type')) : 0;

                  slide.removeClass('opened');

                  window.setTimeout(function(){
                    photo.stop().animate({ 'margin-left': ml + 'px'}, 550, A, function() {
                      window.setTimeout(function(){
                        txt.stop().animate({ opacity: 1 }, 300, A, function() {
                          if (i == iblock.length - 1) { newmask.css({
                              'position': '',
                              'z-index': '',
                              'left': '',
                              'top': ''
                            });
                          }
                          if (i==iblock.length-1) {
                            cont.removeClass('inaction');
                            mask.remove();
                          }
                        });
                      }, 150);
                    });
                    if (i==0) {
                      oldphoto.stop().animate({ 'margin-left': '100%'	}, 550, A, function() {});
                    }
                  }, 150);
              });

            });

          });
          // init

          // touch
          /*if (evtype == 'init' && touchdevice) {
            var TTT;
            var nc = cont.get(0);
            nc.ontouchstart = function(e) {
              _ipadY = e.targetTouches[0].pageY;
              _ipadX = e.targetTouches[0].pageX;
            }
            nc.ontouchmove = function(e) {
              e.preventDefault();
              if (!cont.hasClass('inaction') && Math.abs(_ipadY - e.targetTouches[0].pageY) < Math.abs(_ipadX - e.targetTouches[0].pageX)) {
                window.clearTimeout(TTT);
                TTT = window.setTimeout(function() {
                  var next = (_ipadX - e.targetTouches[0].pageX < 0) ? cont.find('.toleft') : cont.find('.toright');
                  if (next.length > 0) next.trigger('click'); // кликнуть по следующей ссылке в меню
                }, 20);
              }
            }
          }*/
          // mosewheel
/*
          if (evtype == 'init') {
                      attacheWheelEvents(cont.get(0), function(e){
                        e = e || window.event;
                            e.preventDefault ? e.preventDefault() : (e.returnValue = false);
                          if (!cont.hasClass('inaction')) {
                              var delta = e.deltaY || e.detail || e.wheelDelta*(-1);

                next = (delta < 0) ? cont.find('.toleft') : cont.find('.toright');
                if (next.length > 0) next.trigger('click'); // кликнуть по следующей ссылке в меню
                return;
              }
                      });
          }
*/

        } else { // reinit
          var mask = cont.find('.slidesmask'),
            blocks = cont.children('.iblock'),
            storage = cont.find('.slidestorage');
          // собираем маску
          if ($('.iblock:first', storage).hasClass('emergency')) {
            setmask(mask, true);
          } else {
            setmask(mask, false);
          }
          scatter(mask, 0); // раскидываем слайды
        }
      }
    });
  }
  //end of closure
})(jQuery);






(function($) { //create closure
  $.fn.onaircarousel = function(options) {
    this.each(function() {
      var cont = $(this)

        function init() {
          prepare('init');
        }

        function reinit() {
          prepare('reinit');
        }
      if (options == 'reinit') {
        reinit();
      } else {
        init();
      }

      function prepare(evtype) {
        if (evtype == 'init') {}
        var x = new Date(),
          timezone = x.getTimezoneOffset() / 60;
        $.ajax({
          url: cont.data('url'),
          type: 'get',
          data: {
            timezone: timezone
          },
          cache: false
        }).done(function(html) {
          $(html).appendTo(cont);
          cont.find('.iblock').cleanWS();
          cont.find('.carousel').notacarousel({
            'slider': true
          });
          $('#fulldayswitcher a').on('click', function(e) {
            e.preventDefault();
            var id = $(this).attr('href'),
              ind = Math.floor(($(id).index() + _columns) / _columns)
              $('.carouselnav .slide:eq(' + ((ind - 1 > 0) ? (ind - 1) : 0) + ')', cont).trigger('click');
          });
          return false;
        });
      }
    });
  }
  //end of closure
})(jQuery);


(function($) { //create closure
  $.fn.initLive = function(options) {
    this.each(function() {
      var live = $(this),
        play = live.find('.playerbutton'),
        livewnd;
      play.on('click.firstclick', function(e) {
        e.preventDefault();
        var a = $(this);
        livewnd = window.open(a.attr('href'), 'echoliveplayer', 'location=no,locationbar=no,chrome=yes,titlebar=yes,menubar=no,toolbar=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,status=no,width=1000,height=820');
        livewnd.focus();
      });
    });
  }
  //end of closure
})(jQuery);


(function($) { //create closure
  $.fn.footOpen = function(options) {
    this.each(function() {
      var a = $(this),
        texts = ['показать', 'скрыть'],
        cont = $('.info_partner_block');
      cont.hide();

      a.on('click', function(e) {
        e.preventDefault();
        if (a.hasClass('show')) {
          a.find('span:last-child').text(texts[0]);
          a.removeClass('show');
          a.closest('.footer')
            .height(400)
            .prev().css({
              'padding-bottom': '450px'
            });
          cont.slideUp();
        } else {
          a.find('span:last-child').text(texts[1]);
          a.addClass('show');
          a.closest('.footer')
            .height(750)
            .prev().css({
              'padding-bottom': '800px'
            });
          cont.slideDown();
        }
        popularblFunc();
        return false;
      });
    });

  }
  //end of closure
})(jQuery);


(function($) { //create closure
  $.fn.showSearch = function(options) {
    this.each(function() {
      var a = $(this),
        cont = $(this).parent().find('form'),
        TO, TC;
      function hideSearch() {
        cont.removeClass('show');
      }

      function showSearch(){
        cont.addClass('show');
        cont.find('#searchq').focus();
        window.clearTimeout(TO);
        cont.one('mouseleave.opened', function(){
          TC = window.setTimeout(function() {
            hideSearch();
          }, 3000);
        });
      }
        cont.find('#searchq').on('focus',function(){
          cont.off('mouseleave.opened');
          window.clearTimeout(TC);
        }).on('blur',function(){
          var inp = $(this);
          TC = window.setTimeout(function() {
            if ($.trim(inp.val())=='') hideSearch();
          }, 3000);
        });

      a.on('mouseenter', function(e) {
        e.preventDefault();
        window.clearTimeout(TO);
        TO = window.setTimeout(function() {
          showSearch();
        }, 500);
      }).on('mouseleave', function(e) {
        window.clearTimeout(TO);
      }).on('click', function(e) {
        e.preventDefault();
        window.clearTimeout(TO);
        showSearch();
      });
      cont.find('.icmenu').on('click', function(e) {
        e.preventDefault();
        hideSearch();
        return false;
      });
    });

  }
  //end of closure
})(jQuery);

(function($){
  $.fn.logoutForm = function(){
    this.each(function(){
      var that = $(this),
        a = $('.open_logout'),
        cont = $('.logout-cont');
      that.on('click', function(e){
//                e.preventDefault();
        cont.toggleClass('show');
        a.toggleClass('show');
      });
      // that.on('click', function(e){
      //     e.preventDefault();
      //     cont.removeClass('show');
      //     a.removeClass('show');
      // })
    })
  }
})(jQuery);

(function($) { //create closure
  passwordSwitcher();
  $.fn.authForm = function(options) {
    this.each(function() {
      var a = $(this),
        cont = $('.auth_popup');
//			passwordSwitcher();
      a.on('click', function(e) {
        e.preventDefault();
        cont.addClass('show');
        a.addClass('show');
        var reg = cont.find('.reg');
        if (reg.hasClass('open')) {
          cont.find('.formsholder').css('min-width','');
        } else {
          cont.find('.formsholder').css('min-width',(BODY.hasClass('widescreen'))?'47.85em':'46.65em');
        }

        return false;
      });
      cont.find('.close').on('click', function(e) {
        e.preventDefault();
        cont.removeClass('show');
        a.removeClass('show');
        return false;
      });
      cont.find('.open_form').bind('click', function(e) {
        e.preventDefault();
          cont.find('.form').removeClass('open');
          cont.find('form' + $(this).attr('href')).addClass('open');
          var par = $(this).parent();
          if (par.hasClass('reg')) {
            par.removeClass('open');
            cont.find('.auth').addClass('open');
            cont.find('.socialblock').removeClass('open');
            cont.find('.formsholder').css('min-width',(BODY.hasClass('widescreen'))?'47.85em':'46.65em');
          }
          if (par.hasClass('auth')) {
            par.removeClass('open');
            cont.find('.reg').addClass('open');
            cont.find('.socialblock').addClass('open');
            cont.find('.formsholder').css('min-width','');
          }
        return false;
      });
      cont.find('.form').submit(function(e) {
        var form = $(this);
        form.formValidator()
        if (!form.data('valid')) {
          e.preventDefault();
          return false;
        }
        return true ;
      });


    });
  }
  //end of closure
})(jQuery);

(function($) { //create closure
  $.fn.sharePopup = function(options) {
    this.each(function() {
      var block = $(this),
        t;
      if (!block.hasClass('ready')) {
        var tt = 'http://twitter.com/home?status=%title% %url%';
        var fb = 'http://www.facebook.com/share.php?u=%url%&t=%title%';
        var mail = 'http://connect.mail.ru/share?url=%url%&title=%title&description=%description%'; // &imageurl=%image%
        var vk = 'https://vk.com/share.php?url=%url%&title=%title%';
        var lj = 'http://www.livejournal.com/update.bml?subject=%title%&event=%description%<br><a>%url%</a>';
        // tt
        block.find('.twitter').on('click', function(e) {
          e.preventDefault();
          window.open(encodeURI(tt.replace(/\%url\%/, $(this).attr('href')).replace(/%title%/, ''+$(this).attr('title')+'')));

        });
        // fb
        block.find('.facebook').on('click', function(e) {
          e.preventDefault();
          window.open(encodeURI(fb.replace(/\%url\%/, $(this).attr('href')).replace(/%title%/, ''+$(this).attr('title')+'')));
        });
        // mail
        block.find('.mailru').on('click', function(e) {
          e.preventDefault();
          window.open(encodeURI(mail.replace(/\%url\%/, $(this).attr('href')).replace(/%title%/, ''+$(this).attr('title')+'')));
        });
        // vk
        block.find('.vk').on('click', function(e) {
          e.preventDefault();
          window.open(encodeURI(vk.replace(/\%url\%/, $(this).attr('href')).replace(/%title%/, ''+$(this).attr('title')+'')));
        });
        // lj
        block.find('.lj').on('click', function(e) {
          e.preventDefault();
          window.open(encodeURI(lj.replace(/\%url\%/, $(this).attr('href')).replace(/%title%/, ''+$(this).attr('title')+'')));
        });

        block.addClass('ready');
      }

      function appendShareBlock(a) {
        if (a.hasClass('show')) return;
        var clone = block.clone(true),
          par = a.parent();
        par.append(clone);
        clone.show().addClass('shareClone');
        a.addClass('show');
        clone.find('a').attr('href',a.data('url'));
        clone.find('a').attr('title',a.data('title'));
        DOC.on('mouseover.share', function(e) {
          var targ = $(e.target);
          if (!targ.hasClass('meta') && !targ.hasClass('shareClone') && targ.parents('.shareClone').length + targ.parents('.share').length < 1) {
            removeAllOtherShare();
          }
        });
      }

      function removeAllOtherShare() {
        $('.shareClone').each(function() {
          var sClone = $(this);
          sClone.siblings('.share').removeClass('show');
          sClone.remove();
        });
        DOC.off('mouseover.share');
      }

      DOC.off('.share').on('mouseenter.share click.share', '.share', function(e) {
        e.preventDefault();
        var a = $(this);
        if (a.siblings('.shareClone').length > 0) return;
        window.clearTimeout(t);
        removeAllOtherShare();
        if (e.type != 'click') {
          t = window.setTimeout(function() {
            appendShareBlock(a);
          }, 1000);
        } else {
          appendShareBlock(a);
        }
      }).on('mouseleave', '.share', function(e) {
        window.clearTimeout(t);
      });
    });
  }
  //end of closure
})(jQuery);

(function($) { //create closure
  $.fn.comFunc = function(options) {
    this.each(function() {
      var cont = $(this),
        form = $('.answform', cont),
        obj = $('.commBlock', cont),
        a = $('.answ', obj);

      obj.filter('.commBlock').first().find('form').each(function() {
        var but = $(this).find('.add-btn'),
          txtarea = $(this).find('textarea');
        if (txtarea.val().length < 5) but.hide();
        txtarea.focus(function() {
          txtarea.height('12.5em');
          txtarea.bind('keyup', function() {
            if (txtarea.val().length >= 5) {
              but.slideDown(300);
            } else {
              but.slideUp(300);
            }
          });
        }).focusout(function() {
          if (txtarea.val().length < 5){
            but.slideUp(300);
            txtarea.height('3.5em');
          }
        });


      });
       /* DOC.on('click', '.answ', function() {
        $(this).blur();
        var par = $(this).closest('.onecomm');
        var answform = par.find('> .answform');
        if (answform.length > 0) {
          answform.remove();
          $(this).text('Ответить');
        } else {
          var f = form.clone(true);
          f.insertAfter($(this).parent()).show();
          $(this).text('Скрыть форму ответа');
        }
        return false;
      });

      form.find('form').submit(function(e) {
        var form = $(this);
        $.ajax({
          url: form.attr('action'),
          type: 'post',
          data: form.serialize(),
          cache: false
        }).done(function(data) {
          data = $.parseJSON(data);
          if (data.status == 'success') {
            alert(data.msg);
            location.reload();

          } else {
            alert(data.msg);
          }
          return false;
        });
        return false;
      });*/
      cont.find('.c_select').selectReplace();
    });
  }
  //end of closure
})(jQuery);


(function($) { //create closure
  $.fn.mmtabs = function(options) {
    this.each(function() {
      var cont = $(this),
        nav = cont.children('.mediamenu'),
        mm = cont.children('.mmcontainer'),
        T = 700,
        A = 'easeOutCubic',
        action = false;



      $('a.clicked', nav).click(function(e) {
        e.preventDefault();

        var a = $(this);

      if (a.hasClass('.current') || action) return;
        action = true;
        $('.nota_jplayer').jPlayer('pause');
        var id = a.attr('href'),
          oldcurr = mm.find('.current');
        oldcurr.find('.mmplayer').stop().slideUp(T, A, function() {
          oldcurr.removeClass('current');
        });
        $(id).addClass('current').find('.mmplayer').stop().slideDown(T, A, function() {
          action = false;
        });
        nav.find('.current').removeClass('current');
        a.addClass('current');





      });

      var hash = window.location.hash;
      if (hash && hash.length > 0) {
        $('a[href=' + hash + ']', nav).trigger('click');
        $(window).scrollTo('.multimedia');
      }

    });
  }
  //end of closure
})(jQuery);


(function($) { //create closure
  $.fn.mediacarousel = function(options) {
    this.each(function() {
      var defaults = {
        T: 600, // скорость
        A: 'easeOutQuad', // дрючка
        A_: 'easeInQuad',
        pic: 'img', // хз
        title: 'b', // селектор для подписи
        author: 'i', // селектор для автора
        prefix: 'img', // для css
        navvis: 5 // видно в навигации
      };
      var errors = 0,
        msg = '',
        o;
      if (typeof options != 'string') {
        o = $.extend(defaults, options);
      } else {
        o = defaults;
      }
      var cont = $(this),
        imgs = $('img', cont),
        k = 0;
      cont.css('opacity', 0);

      cont.wrap('<div class="' + o.prefix + 'carouselwnd"><div class="' + o.prefix + 'carouselwrp"><div class="' + o.prefix + 'carouselfrm"></div></div></div>');

      var wnd = cont.parents('.' + o.prefix + 'carouselwnd'),
        wrp = wnd.find('.' + o.prefix + 'carouselwrp'),
        navcont = $('<div class="' + o.prefix + 'carouselnav" />').appendTo(wnd),
        navlist = cont.clone();
      var loader = $('<div class="loader" />').appendTo(wnd);


      cont.bind('loaded', function() {
        var sign = $('<div class="' + o.prefix + 'sign"></div>').appendTo(wrp),
          title = $('<div class="' + o.prefix + 'title"></div>').appendTo(sign),
          author = $('<div class="' + o.prefix + 'author"></div>').appendTo(sign);
        navlist.appendTo(navcont);
        var navLI = $('li', navlist);
        $('img', navLI).addClass('loading');

        navLI.each(function(i) {
          var li = $(this);
          li.wrapInner('<span class="' + o.prefix + 'previewframe" />');
          li.data('LI', $('li:eq(' + i + ')', cont));
          li.bind('click', function(e) {
            e.preventDefault();
            if (cont.data('action') == 'run') return false;
            cont.data('action', 'run');
            sign.animate({
              'opacity': 0
            }, o.T / 2, o.A, function() {
              title.text(li.find(o.title).text());
              author.text(li.find(o.author).text());
              sign.animate({
                'opacity': 1
              }, o.T / 2, o.A_, function() {
                cont.data('action', 'stop');
              });
            });
            cont.add(navcont).find('.current').removeClass('current');
            li.addClass('current');
            li.data('LI').addClass('current');
          });
        });

        if ((navlist.children()).length > o.navvis) { // делать скроллнавигацию
          navlist.addClass('full');
          navLI.last().prependTo(navlist);
          showCarousel();
          var prev = $('<span class="' + o.prefix + 'prev" />').appendTo(navcont),
            next = $('<span class="' + o.prefix + 'next" />').appendTo(navcont);
          prev.bind('click', function(e) {
            e.preventDefault();
            if (cont.data('action') == 'run') return false;
            cont.data('action', 'run');
            var navLI = $('li', navlist),
              mslice = (o.navvis > 1) ? navLI.slice(navLI.length - o.navvis, navLI.length - 1) : navLI.last(),
              mclone = mslice.clone(true);
            var h = 0,
              pos = navlist.position();
            mslice.each(function() {
              h += $(this).outerHeight(true);
            });
            mslice.prependTo(navlist);
            mclone.appendTo(navlist);
            navlist.css('top', pos.top - h).animate({
              top: pos.top
            }, o.T * 1.5, o.A, function() {
              mclone.remove();
              navlist.css('top', '');
              cont.data('action', 'stop');
            });
          });
          next.bind('click', function(e) {
            e.preventDefault();
            if (cont.data('action') == 'run') return false;
            cont.data('action', 'run');
            var navLI = $('li', navlist),
              mslice = (o.navvis > 1) ? navLI.slice(0, o.navvis - 1) : navLI.first(),
              mclone = mslice.clone(true);
            var h = 0,
              pos = navlist.position();
            mslice.each(function() {
              h += $(this).outerHeight(true);
            });
            mslice.appendTo(navlist);
            mclone.prependTo(navlist);
            navlist.animate({
              top: pos.top - h
            }, o.T * 1.5, o.A, function() {
              mclone.remove();
              navlist.css('top', '');
              cont.data('action', 'stop');
            });
          });

        } else {
          showCarousel();
        }


        // touch
        /*if (touchdevice) {
          var TTT;
          var nc = navcont.get(0),
            wnd0 = wnd.get(0),
            wrp0 = wrp.get(0);
          wnd0.ontouchstart = function(e) {
            _ipadY = e.targetTouches[0].pageY;
            _ipadX = e.targetTouches[0].pageX;
          }
          nc.ontouchmove = function(e) {
            e.preventDefault();
            if (cont.data('action') != 'run' && Math.abs(_ipadY - e.targetTouches[0].pageY) > Math.abs(_ipadX - e.targetTouches[0].pageX)) {
              window.clearTimeout(TTT);
              TTT = window.setTimeout(function() {
                next = (_ipadY - e.targetTouches[0].pageY < 0) ? navcont.find('.' + o.prefix + 'prev') : navcont.find('.' + o.prefix + 'next');
                if (next.length > 0) next.trigger('click'); // кликнуть по следующей ссылке в меню
              }, 20);
            }
          }
          wrp0.ontouchmove = function(e) {
            e.preventDefault();
            if (cont.data('action') != 'run' && Math.abs(_ipadY - e.targetTouches[0].pageY) <= Math.abs(_ipadX - e.targetTouches[0].pageX)) {
              window.clearTimeout(TTT);
              TTT = window.setTimeout(function() {
                var curr = navlist.find('.current');
                if (_ipadX - e.targetTouches[0].pageX < 0) {
                  next = curr.prev();
                  if (!next.length) {
                    next = $('li:last', navlist);
                  }
                } else {
                  next = curr.next();
                  if (!next.length) {
                    next = $('li:first', navlist);
                  }
                }
                if (next.length > 0) next.trigger('click'); // кликнуть по следующей ссылке в меню
              }, 20);
            }
          }
        } // touch*/
        // mousewheel

        wrp.on('DOMMouseScroll mousewheel', function(e) {
          e.preventDefault();
          var curr = navlist.find('.current');
          if (e.originalEvent.detail > 0) {
            next = curr.next();
            if (!next.length) {
              next = $('li:first', navlist);
            }
          } else {
            next = curr.prev();
            if (!next.length) {
              next = $('li:last', navlist);
            }
          }
          if (next.length > 0) next.trigger('click'); // кликнуть по следующей ссылке в меню
          return;
        });
        navcont.on('DOMMouseScroll mousewheel', function(e) {
          e.preventDefault();
          next = (e.originalEvent.detail < 0) ? navcont.find('.' + o.prefix + 'prev') : navcont.find('.' + o.prefix + 'next');
          if (next.length > 0) next.trigger('click'); // кликнуть по следующей ссылке в меню
          return;
        });

        function showCarousel() {
          loader.remove();
          navlist.css('opacity', 1);
          cont.css('opacity', 1);
          $('li', navlist).each(function(i) {
            var li = $(this);
            window.setTimeout(function() {
              $('img', li).animate({
                top: 0
              }, o.T / 2, o.A, function() {
                $(this).removeClass('loading');
                if (li.index() == 0) {
                  navLI.eq(0).trigger('click');
                }
              });
            }, 200 + i * 150);
          });
        }

      })

      cont.bind('checkload', function() {
        k++;
        if (k == imgs.length) {
          cont.unbind('checkload');
          cont.trigger('loaded');
        }
      });

      imgs.each(function(i) {
        var img = $(this),
          fleximg = new Image();
        fleximg.src = img.attr('src');


        $(fleximg).bind('load', function() {
          if (!img.data('loaded')) {
            img.data('w', img.width()).data('h', img.height()).data('loaded', true);
            cont.trigger('checkload');
          }
        });
        try {
          if (fleximg.complete && !img.data('loaded')) {
            $(fleximg).trigger('load');
          }
        } catch (e) {}
      });

    });
  }
  //end of closure
})(jQuery);


(function($) { //create closure
  $.fn.letterlist = function(options) {
    var defaults = {
      inp: false,
      spn: false
    };
    var o = $.extend(defaults, options);
    this.each(function() {
      if (!o.inp) return false;
      o.inp = $(o.inp);
      if (!o.spn) return false;
      //			o.spn = $(o.spn);
      var ll = $(this),
        cache = [];
      ll.find('> div').each(function() {
        var li = $(this),
          words = [];
        $(this).find(o.spn).each(function() {
          var span = $(this),
            a = span.children('a'),
            t = (a.length > 0) ? t = a.text() : span.text();
          span.data('title', t.toLowerCase());
          words.push({
            'span': span,
            'hide': false
          });
        });
        li.data('hide', 0); // incremented by sum(words[n].hide)
        cache.push({
          'li': li,
          'words': words
        });
      });
      filter(o.inp.val());
      o.inp.bind('keyup', function() {
        filter($(this).val());
          setSlider($('#personList'));
      });
      o.inp.bind("keypress", function(e) {
        if (e.keyCode == 13) {
          o.inp.focus();
          filter($(this).val());
            setSlider($('#personList'));
          return false;

        }
      });

      function filter(val) {
        val = val.toLowerCase();
        for (var i = 0; i < cache.length; i++) {
          cache[i].li.data('hide', 0);
          for (var k = 0; k < cache[i].words.length; k++) {
            var w = cache[i].words[k];
            if (w.span.data('title').indexOf(val) > -1) { //найден
              if (w.hide) {
                w.span.removeClass('hidden');
                w.hide = false;
              }
            } else {
              cache[i].li.data('hide', cache[i].li.data('hide') * 1 + 1);
              //w.span.addClass('hidden');
              w.hide = true;
            }
          }
          if (cache[i].li.data('hide') == cache[i].words.length) {
            cache[i].li.addClass('hidden');
            cache[i].li.next().addClass('hidden');
          } else {
            cache[i].li.removeClass('hidden');
            cache[i].li.next().removeClass('hidden');
          }
        }
        if (ll.children('div:not(".hidden")').length == 0) {
          ll.hide();
          $('.noresult').show();
        } else {
          ll.show();
          $('.noresult').hide();
        }
      }

    });
  }
  //end of closure
})(jQuery);


(function($) {
  $.fn.calendar = function(options) {
    return this.each(function() {

      var cont = $(this),
        o = $.extend({}, $.fn.calendar.defaults, options),
        year, yearPrev, yearNext, yearName, yearString, DP,
        month, monthPrev, monthNext, monthName, monthString,
        popup, popupCnt, popupCloser, active, popupArrow, popupEvent,
        customMarkup = '<div class="b-calendar_month">' +
          '<div class="b-calendar_month-prev">' +
          '</div>' +
          '<div class="b-calendar_month-name">' +
          '</div>' +
          '<div class="b-calendar_month-next">' +
          '</div>' +
          '</div>' +
          '<div class="b-calendar_year">' +
          '<div class="b-calendar_year-prev">' +
          '</div>' +
          '<div class="b-calendar_year-name">' +
          '</div>' +
          '<div class="b-calendar_year-next">' +
          '</div>' +
          '</div>';

      initDatepicker();
      init();


      function initDatepicker() {
        cont.datepicker({
          showOtherMonths: true,
          changeMonth: true,
          changeYear: true,
          //maxDate: (cont.hasClass('setbirthdate')) ? "-12y" : "+0d",
          maxDate: (cont.data('maxdate') || "+0d"),
          beforeShow: function() {
            var pos = cont.offset() //, dp = $('#ui-datepicker-div');
            setTimeout(function() {
              init();
              //								$.datepicker._pos[0] = -230;// = [pos.left+cont.width()-dp.width(), pos.top+dp.height()];
            }, 100);
          },
          onChangeMonthYear: function() {
            setTimeout(function() {
              init();
            }, 100);
          }
        });
        // change event on calendar date
        /*
        cont.on('change', function(){
          alert(cont.val());
        });
        */
        DP = $('#ui-datepicker-div');
      };

      function init() {
        appendCustom();
        updateMonth();
        updateYear();
        customHandlers();
      };

      function appendCustom() {
        if ($('.b-calendar_month').length < 1) {
          $('.ui-datepicker-header').append(customMarkup);
          month = $('.b-calendar_month', cont);
          monthNext = $('.b-calendar_month-next', cont);
          monthPrev = $('.b-calendar_month-prev', cont);
          monthName = $('.b-calendar_month-name');
          year = $('.b-calendar_year');
          yearNext = $('.b-calendar_year-next', cont);
          yearPrev = $('.b-calendar_year-prev', cont);
          yearName = $('.b-calendar_year-name');
        }
      };


      function updateMonth() {
        monthString = $('.ui-datepicker-month :selected', DP).text();
        monthName.text(monthString);
      };

      function updateYear() {
        yearString = $('.ui-datepicker-year :selected', DP).text();
        yearName.text(yearString);
      };

      function customHandlers() {
        var month = $('.b-calendar_month'),
          monthNext = $('.b-calendar_month-next'),
          monthPrev = $('.b-calendar_month-prev'),
          monthName = $('.b-calendar_month-name'),
          year = $('.b-calendar_year'),
          yearNext = $('.b-calendar_year-next'),
          yearPrev = $('.b-calendar_year-prev'),
          yearName = $('.b-calendar_year-name');

        monthNext
          .off('click.calendar')
          .on('click.calendar', cont, function() {
            var month = $('.ui-datepicker-month', DP),
              val = month.val() * 1;
            if (val < $('option', month).length - 1) {
              (month.get(0)).selectedIndex = val + 1;
            } else {
              //							yearNext.click();
              (month.get(0)).selectedIndex = 0;
            }
            month.trigger('change');
            init();
          });
        monthPrev
          .off('click.calendar')
          .on('click.calendar', cont, function() {
            var month = $('.ui-datepicker-month', DP),
              val = month.val() * 1;
            if (val > 0) {
              (month.get(0)).selectedIndex = val - 1;
            } else {
              //							yearPrev.click();
              (month.get(0)).selectedIndex = $('option', month).length - 1;
            }
            month.trigger('change');
            init();
          });
        yearNext
          .off('click.calendar')
          .on('click.calendar', cont, function() {
            if ($('.ui-datepicker-year option:selected', DP).next().length < 1) return false;
            var m = $('.ui-datepicker-year option:selected', DP).next().attr('value');
            $('.ui-datepicker-year', DP).val(m).change();
            month.trigger('change');
            init();
          });
        yearPrev
          .off('click.calendar')
          .on('click.calendar', cont, function() {
            if ($('.ui-datepicker-year option:selected', DP).prev().length < 1) return false;
            var m = $('.ui-datepicker-year option:selected', DP).prev().attr('value');
            $('.ui-datepicker-year', DP).val(m).change();
            month.trigger('change');
            init();
          });

      };

    });

  };

  $.fn.calendar.defaults = {};

})(jQuery);

(function($) { //create closure
  $.fn.descrOpen = function(options) {
    this.each(function() {
      var cont = $(this),
        a = cont.find('.hide'),
        descr = a.closest(cont).find('.liveprogrammes');


      a.click(function(e) {
        e.preventDefault();
        if ($(this).hasClass('show')) {
          descr.slideDown(600);
          $(this).removeClass('show');
        } else {
          descr.slideUp(600);
          $(this).addClass('show');
        }
        return false;
      });

    });
  }
  //end of closure
})(jQuery);

(function($) { //create closure
  $.fn.votescharts = function(options) {
    this.each(function() {
      var cont = $(this)
      cont.find('.fill').each(function(i) {
        var f = $(this);
        window.setTimeout(function() {
          f.width(f.data('size'));
        }, 200 + i * 2);
      });
    });
  }
  //end of closure
})(jQuery);

(function($) { //create closure
  $.fn.piechart = function(options) {
    this.each(function() {
      var cont = $(this),
        legend = cont.siblings('.legend'),
        half = (cont.hasClass('halfpie')) ? true : false;
      var dataArray = [];
      $('li', legend).each(function(i) {
        dataArray.push(['' + (i + 1), $(this).data('percent')]);
      });
      cont.highcharts({
        colors: [
          '#ea171e',
          '#1d191a',
          '#1d191a',
          '#1d191a',
          '#1d191a',
          '#1d191a',
          '#1d191a',
          '#1d191a',
          '#1d191a',
          '#1d191a'
        ],
        chart: {
          plotBackgroundColor: null,
          plotBorderWidth: 0,
          plotShadow: false
        },
        credits: {
          enabled: false
        },
        title: {
          text: ''
        },
        tooltip: {
          enabled: false,
          pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
          pie: {
            dataLabels: {
              enabled: true,
              distance: -70,
              style: {
                fontWeight: 'bold',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                fontFamily: '"ProximaNova-Bold", sans-serif',
                textShadow: '0px 1px 2px black'
              }
            },
            size: (half) ? '175%' : '100%',
            endAngle: (half) ? 180 : 360,
            center: [(half) ? 0 : '50%', '50%']
          }
        },
        series: [{
          type: 'pie',
          data: dataArray
        }]
      });
    });
  }
  //end of closure
})(jQuery);

function pageUp() {
  var T, uplink = $('.up_link');
  if(!touchdevice){
  $(window).scroll(function() {
    window.clearTimeout(T);
    T = window.setTimeout(function() {
      if ($(document).scrollTop() > $(window).height()) {
        // 2 экранf проскроллен и ушел вверх
        uplink.slideDown(200);
      } else {
        // вернулись ближе к первому экрану
        uplink.slideUp(100);
      }
    }, 100);
  });
  }
}

(function($) {
  $.fn.calendarmonth = function(options) {

    return this.each(function() {

      var cont = $(this),
        o = $.extend({}, $.fn.calendarmonth.defaults, options),
        year, yearPrev, yearNext, yearName, yearString, DPm,
        month, monthString, date,
        popup, popupCnt, popupCloser, active, popupArrow, popupEvent,
        customMarkup = '<div class="b-calendar_year changeyear">' +
          '<div class="b-calendar_year-prev">' +
          '</div>' +
          '<div class="b-calendar_year-name">' +
          '</div>' +
          '<div class="b-calendar_year-next">' +
          '</div>' +
          '</div>',
        customMonth = '<div class="b-calendar_month changemonth">' +
          '</div>';

      initDatepicker();
      init();

      function initDatepicker() {
        cont
          .datepicker({
            dateFormat: 'mm.yy',
            showOtherMonths: true,
            selectOtherMonths: true,
            changeMonth: true,
            changeYear: true,
            firstDay: new Date(),
            maxDate: new Date(),
            beforeShow: function() {
              var pos = cont.offset();
              //$.datepicker._pos = [pos.left - 70, pos.top + 30];
              setTimeout(function() {
                init();
//                                cont.val()
              }, 100);
            },
            onChangeMonthYear: function() {
              setTimeout(function() {
                init();
              }, 100);
            }
          });
        // change event on calendar date
//                cont.on('change', function(){
 //                  alert(cont.val());
 //               });
        DPm = $('#ui-datepicker-div');
      };

      function init() {
        appendCustom();
        updateMonth();
        updateYear();
        customHandlers();

      };

      function appendCustom() {
        if ($('.b-calendar_month').length === 0) {
          $('.ui-datepicker-header').append(customMarkup);

          $('.ui-datepicker').append(customMonth);
          var monthName = '';
          $('.ui-datepicker-month option').each(function() {
            monthName += '<div class="b-calendar_month-name" data-event="click" data-handler="selectMonth"><a href="#" class="ui-state-default">' + $(this).text() + '</a></div>';
          });
          $('<div>' + monthName + '</div>').appendTo('.b-calendar_month');

           $('.ui-datepicker-calendar').hide();
          $('.ui-datepicker').css({'z-index': '11'});
          $('.ui-datepicker').addClass('calendarmonth-datepicker');
          year = $('.b-calendar_year');
          yearNext = $('.b-calendar_year-next', cont);
          yearPrev = $('.b-calendar_year-prev', cont);
          yearName = $('.b-calendar_year-name', DPm);

        }

      };


      function updateMonth() {
        $('.b-calendar_month-name:eq(' + $('.ui-datepicker-month :selected', DPm).index() + ')', DPm).find('a').addClass('ui-state-highlight');
      };

      function updateYear() {
        yearString = $('.ui-datepicker-year :selected', DPm).text();
         $('.b-calendar_year-name', DPm).text(yearString);
      };

      function customHandlers() {
        var month = $('.b-calendar_month'),
          monthName = $('.b-calendar_month-name'),
          year = $('.b-calendar_year'),
          yearNext = $('.b-calendar_year-next'),
          yearPrev = $('.b-calendar_year-prev'),
          yearName = $('.b-calendar_year-name', DPm);

        monthName
          .off('click.calendar')
          .on('click.calendar', cont, function(e) {
//                        e.preventDefault();
            var month = $('.ui-datepicker-month', DPm);
            var ind = $(this).index();
            $('.b-calendar_month-name a', DPm).removeClass('active');
            $(this).find('a').addClass('active');
            var m = $('.ui-datepicker-month option:eq(' + ind + ')', DPm).attr('value');
            $('.ui-datepicker-month', DPm).val(m).change();
            $('.ui-datepicker-calendar td[data-month="' + m + '"]:eq(0)', DPm).click();
            init();
          });
        yearNext
          .off('click.calendar')
          .on('click.calendar', cont, function() {
            if ($('.ui-datepicker-year option:selected', DPm).next().length < 1) return false;
            var m = $('.ui-datepicker-year option:selected', DPm).next().attr('value');
            $('.ui-datepicker-year', DPm).val(m).change();
            month.trigger('change');
            init();
          });
        yearPrev
          .off('click.calendar')
          .on('click.calendar', cont, function() {
             if ($('.ui-datepicker-year option:selected', DPm).prev().length < 1) return false;
            var m = $('.ui-datepicker-year option:selected', DPm).prev().attr('value');
            $('.ui-datepicker-year', DPm).val(m).change();
            month.trigger('change');
            init();
          });

      };
      return false;

    });

  };

  $.fn.calendarmonth.defaults = {};

})(jQuery);

(function($) {
  $.fn.calendaryear = function(options) {

    return this.each(function() {

      var cont = $(this),
        o = $.extend({}, $.fn.calendaryear.defaults, options),
        year, yearPrev, yearNext, yearName, yearString, yearName,  DPy,
        popup, popupCnt, popupCloser, active, popupArrow, popupEvent,
        customMarkup = '<div class="b-calendar_year year_calendar">' +
          '<div class="b-calendar_year-name"><a href="#" class="ui-state-default">. . .</a>' +
          '</div>' +
          '</div>';

      initDatepicker();
      init();


      function initDatepicker() {
        cont
          .datepicker({
            dateFormat: 'yy',
            changeYear: true,
            firstDay: new Date(),
            maxDate: new Date(),
            beforeShow: function() {
              var pos = cont.offset();
               // $.datepicker._pos = [pos.left - 12, pos.top + 30];
              setTimeout(function() {
                init();
              }, 100);
            },
            onChangeMonthYear: function() {
               // var month = $(".ui-datepicker-month :selected", DPy).val();
              //  var year = $(".ui-datepicker-year :selected", DPy).val();
              //cont.datepicker('setDate', new Date(year, month, 1));
              setTimeout(function() {
                init();
              }, 100);
            }
          });
        // change event on calendar date
        //  cont.on('change', function(){
        //    alert(cont.val());
        //});
        DPy = $('#ui-datepicker-div');
      };

      function init() {
        appendCustom();
        updateYear();
        customHandlers();
      };

      function appendCustom() {
        if ($('.b-calendar_year').length === 0) {
          $('.ui-datepicker').append(customMarkup);
          $('.ui-datepicker-header').hide();
          $('.ui-datepicker-calendar').hide();
          year = $('.b-calendar_year', cont);
          yearName = $('.b-calendar_year-name', cont);
          var yearName2 = '';
          $('.ui-datepicker-year option').each(function() {
            yearName2 += '<div class="b-calendar_year-name" data-event="click" data-handler="selectYear"><a href="#" class="ui-state-default">' + $(this).text() + '</a></div>';
          });

          $('<div>' + yearName2 + '</div>').insertBefore('.b-calendar_year-name');

          $('.b-calendar_year div').find('.b-calendar_year-name:eq(14)').nextAll().remove();
          var cl = $('.b-calendar_year > .b-calendar_year-name').clone();
          cl.appendTo('.b-calendar_year > div');
          $('.b-calendar_year > .b-calendar_year-name').remove();

          $('.ui-datepicker').css({ 'z-index': '11'});
          $('.ui-datepicker').addClass('calendaryear-datepicker');

        }
      };

      function updateYear() {
        yearString = $('.ui-datepicker-year :selected', DPy).index();
        $('.b-calendar_year-name').eq(yearString).find('a').addClass('ui-state-highlight');
      };

      function customHandlers() {
        var year = $('.b-calendar_year'),
          yearName = $('.b-calendar_year-name'),
          month = $(".ui-datepicker-month");


        DOC
          .off('click.calendar')
          .on('click.calendar', '.b-calendar_year-name', function() {
            $('.b-calendar_year-name a').removeClass('active');
            $(this).find('a').addClass('active');
            var ind = $(this).index();
            var m = $('.ui-datepicker-year option:eq(' + ind + ')', DPy).attr('value');
            $('.ui-datepicker-year', DPy).val(m).change();
            cont.val(m).change();
            cont.datepicker('hide');
            month.trigger('change');
            init();
          });


      };

    });

  };

  $.fn.calendaryear.defaults = {};

})(jQuery);


(function($) {
  $.fn.calendarweek = function(options) {
    return this.each(function() {

      var cont = $(this),
        o = $.extend({}, $.fn.calendarweek.defaults, options),
        year, yearPrev, yearNext, yearName, yearString, DPw,
        month, monthPrev, monthNext, monthName, monthString, weekName,
        popup, popupCnt, popupCloser, active, popupArrow, popupEvent,
        customMarkup = '<div class="b-calendar_month">' +
          '<div class="b-calendar_month-prev">' +
          '</div>' +
          '<div class="b-calendar_month-name">' +
          '</div>' +
          '<div class="b-calendar_month-next">' +
          '</div>' +
          '</div>' +
          '<div class="b-calendar_year">' +
          '<div class="b-calendar_year-prev">' +
          '</div>' +
          '<div class="b-calendar_year-name">' +
          '</div>' +
          '<div class="b-calendar_year-next">' +
          '</div>' +
          '</div>';

      initDatepicker();
      init();


      function initDatepicker() {
        cont
          .datepicker({
            showOtherMonths: true,
            changeMonth: true,
            changeYear: true,
            firstDay: new Date(),
            maxDate: new Date(),
            beforeShow: function() {
              var pos = cont.offset();
              //  $.datepicker._pos = [pos.left - 120, pos.top + 30];
              setTimeout(function() {
                init();
              }, 100);
            },
            onChangeMonthYear: function() {
              setTimeout(function() {
                init();
              }, 100);
            }
          });
         //change event on calendar date
        // cont.on('change', function(){
          //  alert(cont.val());
         // });
        DPw = $('#ui-datepicker-div');
      };

      function init() {
        appendCustom();
        updateMonth();
        updateYear();
        customHandlers();
      };

      function appendCustom() {
        if ($('.b-calendar_month').length === 0) {
          $('.ui-datepicker-header').append(customMarkup);

          month = $('.b-calendar_month', cont);
          monthNext = $('.b-calendar_month-next', cont);
          monthPrev = $('.b-calendar_month-prev', cont);
          monthName = $('.b-calendar_month-name');
          year = $('.b-calendar_year');
          yearNext = $('.b-calendar_year-next', cont);
          yearPrev = $('.b-calendar_year-prev', cont);
          yearName = $('.b-calendar_year-name');
          $('.ui-datepicker-calendar').hide();
          $.ajax({
            url: cont.data('ajax'),
            method: 'GET',
            success: function(html) {
              $(html).insertAfter($('.ui-datepicker-calendar')).fadeIn('slow');
            }

          });
           weekName = $('.b-calendar_week-name');
          $('.ui-datepicker').css({ 'z-index': '11' });
          $('.ui-datepicker').addClass('calendarweek-datepicker');

        }
      };


      function updateMonth() {
        monthString = $('.ui-datepicker-month :selected', DPw).text();
        var monthStringPrev = $('.ui-datepicker-month :selected', DPw).prev().text();
        if(monthStringPrev.length > 0){
          monthName.text(monthStringPrev + ' - ' + monthString);
        }
        else {
            monthName.text(monthString);
        }
      };

      function updateYear() {
        yearString = $('.ui-datepicker-year :selected', DPw).text();
        yearName.text(yearString);
      };

      function customHandlers() {
        var month = $('.b-calendar_month'),
          monthNext = $('.b-calendar_month-next'),
          monthPrev = $('.b-calendar_month-prev'),
          monthName = $('.b-calendar_month-name'),
          year = $('.b-calendar_year'),
          yearNext = $('.b-calendar_year-next'),
          yearPrev = $('.b-calendar_year-prev'),
          yearName = $('.b-calendar_year-name'),
          weekName = $('.b-calendar_week-name');

        monthNext
          .off('click.calendar')
          .on('click.calendar', cont, function() {
             var month = $('.ui-datepicker-month', DPw),
              val = month.val() * 1;
            if (val < $('option', month).length - 1) {
              (month.get(0)).selectedIndex = val + 1;
            } else {
              //							yearNext.click();
              (month.get(0)).selectedIndex = 0;
            }
            month.trigger('change');
            init();
          });

        DOC
          .off('click.calendar')
          .on('click.calendar', '.b-calendar_week-name', function() {
            $('.b-calendar_week-name a').removeClass('active');
            $(this).find('a').addClass('active');
            var yearv = $('.ui-datepicker-year :selected', DPw).val();
            var weekv = $(this).text();
            cont.val(''+yearv+ '. '+weekv+'');
            cont.trigger('change');
            cont.datepicker('hide');
            init();
          });

        monthPrev
          .off('click.calendar')
          .on('click.calendar', cont, function() {
            var month = $('.ui-datepicker-month', DPw),
              val = month.val() * 1;
            if (val > 0) {
              (month.get(0)).selectedIndex = val - 1;
            } else {
              //							yearPrev.click();
              (month.get(0)).selectedIndex = $('option', month).length - 1;
            }
             month.trigger('change');
            init();
          });
        yearNext
          .off('click.calendar')
          .on('click.calendar', cont, function() {
             if ($('.ui-datepicker-year :selected', DPw).next().length < 1) return false;
            var m = $('.ui-datepicker-year :selected', DPw).next().attr('value');
            $('.ui-datepicker-year', DPw).val(m).change();
             month.trigger('change');
            init();
          });
        yearPrev
          .off('click.calendar')
          .on('click.calendar', cont, function() {
            if ($('.ui-datepicker-year :selected', DPw).prev().length < 1) return false;
            var m = $('.ui-datepicker-year :selected', DPw).prev().attr('value');
            $('.ui-datepicker-year', DPw).val(m).change();
             month.trigger('change');
            init();
          });

      };

    });

  };

  $.fn.calendarweek.defaults = {};

})(jQuery);


// uipopup
(function($) { //create closure
  $.fn.uipopup = function(options) {
    this.each(function() {
      $(this).on('click', function(e) {
        e.preventDefault();
        var lnk = $(this),
          popup = $('.uipopupcontainer');
        if (popup.length < 1) {
          popup = $('<div class="uipopupcontainer hidden"></div>').appendTo('body');
        }
        popup.dialog({
          heigth: 595,
          width: 700,
          modal: true,
          draggable: false,
          resizable: false,
          dialogClass: 'popup2',
          title: lnk.data('title'),
          open: function() {
            $.ajax({
              url: lnk.attr('href'),
              method: 'GET',
              success: function(html) {
                popup.html(html);
              }
            });
            popup.removeClass('hidden');
            window.setTimeout(function() {
              popup.dialog("option", "position", {
                my: "center",
                at: "center",
                of: window
              });
            }, 250);
          },
          close: function() {
            popup.dialog("destroy").remove();
          }
        });
      });
    });
  }
  //end of closure
})(jQuery);


// aboutperson
(function($) { //create closure
  $.fn.popupList = function(options) {
    this.each(function() {
      var lnk = $(this);
      $('body').append('<div class="popupList hidden"></div>');
      var popup = $('.popupList');
      var form = '<form class="searchform form" action="." method="get"><fieldset><input type="search" value="" id="psearch" name="q" placeholder="поиск персоны по имени и (или) должности"><button value="1" disabled="disabled" type="submit"><span class="wsico lite">&#x21;</span></button></fieldset></form>';
      popup.append(form);
      $.ajax({
        url: lnk.attr('href'),
        method: 'GET',
        success: function(html) {
          popup.append($(html));
          $('#personList').letterlist({
            inp: '#psearch',
            spn: '.about .name, .about .post '
          }); // живой поиск
          setSlider($('#personList'));
        }
      });
      popup.dialog({
        heigth: 595,
        width: 700,
        modal: true,
        draggable: false,
        resizable: false,
        dialogClass: 'popup2',
        title: lnk.data('title'),
        open: function() {
          popup.removeClass('hidden');
          popup.dialog("option", "position", {
            my: "center",
            at: "center",
            of: window
          });
        },
        close: function() {
          popup.dialog().remove();
        }
      });

      return false;
    });
  }
  //end of closure
})(jQuery);



(function($) { //create closure
  $.fn.faq = function(options) {
    this.each(function() {
      var cont = $(this);
      cont.find('.qa_q a').on('click', function(e) {
        e.preventDefault();
        $(this).parents('.qa_question:eq(0)').toggleClass('qa_open');
      });
      cont.find('.all').on('click', function(e) {
        e.preventDefault();
        cont.find('.qa_question').addClass('qa_open');
      });
    });
  }
  //end of closure
})(jQuery);


/*function addAjaxList($list, listItemSelector, $btn){
  var loadedCount = $list.size();
  var src = $list.data("src");
  var itemsSize = $list.data("size");

  $btn.on("click", function(){
    $.get(src, function(html){
      $list.append(html);
      loadedCount += $($.parseHTML(html)).filter(listItemSelector).size();
      if (loadedCount >= itemsSize){
        $btn.remove();
      }
    }, "html");
  });
}*/


(function(){
  var $likeBtns = $(".js-like-button");

  $likeBtns.each(function(i, likeBtn){
    var $likeBtn = $(likeBtn);
    var $count = $(".js-like-button-count", $likeBtn);
    var state = $likeBtn.data("active");
    var src = $likeBtn.data("src");

    if (state){
      $likeBtn.addClass("_active");
    }

    $likeBtn.on("click", function(e){
      e.preventDefault();
      $.getJSON(src, function(data){
        if (data.activated){
          $likeBtn.addClass("_active");
        } else {
          $likeBtn.removeClass("_active");
        }
        $count.text(data.count);
      });
    });
  });

})();


(function(){
  var $recomBtns = $(".js-recom-button");

  $recomBtns.each(function(i, recomBtn){
    var $recomBtn = $(recomBtn);
    var $text = $(".js-recom-button-text", $recomBtn);
    var state = $recomBtn.data("active");
    var src = $recomBtn.data("src");
    var textActive = $recomBtn.data("recom-active-text");
    var textUnactive = $recomBtn.data("recom-unactive-text");

    if (state){
      $recomBtn.addClass("_active");
      $text.text(textActive);
    } else {
      $text.text(textUnactive);
    }

    $recomBtn.on("click", function(e){
      e.preventDefault();
      $.getJSON(src, function(data){
        if (data.activated){
          $recomBtn.addClass("_active");
          $text.text(textUnactive);
        } else {
          $recomBtn.removeClass("_active");
          $text.text(textActive);
        }
      });
    });
  });

})();






// баннеры в шапке
(function($) { //create closure
  $.fn.echotop = function(options) {
    this.each(function() {
      var cont = $(this), f = cont.children('.f'), chld = f.children();
      function recenter(){
        f.removeClass('fullwidth');
        if (WND.width()>chld.width()) f.addClass('fullwidth');
        f.css('margin-left',-chld.width()/2);
      } recenter();
      WND.on('load resize', function(){
         recenter();
      });
      cont.find('img').each(function(){
        $(this).on('load', recenter);
      });
    });
  }
  //end of closure
})(jQuery);

(function($) { //create closure
  $.fn.echoleftright = function(options) {
    this.each(function() {
      var cont = $(this), f = cont.children('.f'), chld = f.children();
      function recenter(){
        f.removeClass('fullwidth');
        if (f.width()>chld.width()) f.addClass('fullwidth');
        chld.css('margin-left',-chld.width()/2);
      } recenter();
      WND.on('load resize', function(){
         recenter();
      });
      cont.find('img').each(function(){
        $(this).on('load', recenter);
      });
    });
  }
  //end of closure
})(jQuery);

function popularblFunc() {
  var T, popularbl = $('.popular');
  if (popularbl.length === 0) return ;

  if(!touchdevice){
      if (localStorage.getItem('lock') != null )
            {
              if(localStorage.getItem('lock') == '2'){
                  $('.up_link').css("bottom", 0);
                  $('.popular').removeClass('open');
              }

            }


  popularbl.find('.door').on('click', function(){
    if(localStorage.getItem('lock') == '2'){
        $('.up_link').css("bottom", 80);
        popularbl.addClass('open');
        localStorage.setItem('lock', '1');
    }
    else {
        $('.up_link').css("bottom", 0);
        popularbl.removeClass('open');
        localStorage.setItem('lock', '2');
    }
    return false;
  });

  var hH = $('.header_body').height() + $('.header_body').offset().top;
  var otop = $('.footer .links_block').offset().top;
  $(window).scroll(function() {

    window.clearTimeout(T);
    T = window.setTimeout(function() {
      var hw = $(document).scrollTop() + $(window).height() - 537;
      if ($(document).scrollTop() > hH && hw < otop) {
        // 2 экранf проскроллен и ушел вверх
        popularbl.addClass('fixedpopul');
      } else {
        // вернулись ближе к первому экрану
        popularbl.removeClass('fixedpopul');
      }
    }, 100);
  });
  }
};

// баннеры в шапке
(function($) { //create closure
  $.fn.submenuOpen = function(options) {
    this.each(function() {
      var cont = $(this), a = cont.find('.menusection > a');
      if(touchdevice){
        a.each(function(){

        var lock = false;
        $(this).click(function(e){
            if(!lock){
              e.preventDefault();
              $(this).css({'background': '#000'});
            $(this).parent().find('.submenu').css({
              'height':'auto',
              'overflow':'visible',
              'padding':'7px 8px 16px 5px',
              'opacity':1
            });
              lock = true;
            return false;
            }
        });
        });
      }
    });
  }
  //end of closure
})(jQuery);

$(function() {    
    var placeholder = $('#commentsLoadOnScroll');

    if (!placeholder.length) {
        return;
    }

    var end = placeholder.offset().top,
        viewEnd = $(window).scrollTop() + $(window).height(),
        distance = end - viewEnd,
        loading = false;

    function loadComments() {
        if (loading) {
            return;
        }

        $.ajax({
            url: placeholder.data('url'),
            beforeSend: function() {
                loading = true;
            }
        }).done(function(response) {
            $(window).off('scroll.loadComments');
            placeholder.replaceWith(response);
            $('.commentList').comFunc();
        }).complete(function() {
            loading = false;
        })
    }

    if (distance < 100) {
        loadComments();
    }
        
    $(window).on('scroll.loadComments', function() {
        end = placeholder.offset().top;
        viewEnd = $(window).scrollTop() + $(window).height();
        distance = end - viewEnd;

        if (distance < 100) {
            loadComments();
        }
    })
})
;




