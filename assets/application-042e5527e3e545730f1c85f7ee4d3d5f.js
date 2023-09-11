(function($, undefined) {

/**
 * Unobtrusive scripting adapter for jQuery
 *
 * Requires jQuery 1.6.0 or later.
 * https://github.com/rails/jquery-ujs

 * Uploading file using rails.js
 * =============================
 *
 * By default, browsers do not allow files to be uploaded via AJAX. As a result, if there are any non-blank file fields
 * in the remote form, this adapter aborts the AJAX submission and allows the form to submit through standard means.
 *
 * The `ajax:aborted:file` event allows you to bind your own handler to process the form submission however you wish.
 *
 * Ex:
 *     $('form').live('ajax:aborted:file', function(event, elements){
 *       // Implement own remote file-transfer handler here for non-blank file inputs passed in `elements`.
 *       // Returning false in this handler tells rails.js to disallow standard form submission
 *       return false;
 *     });
 *
 * The `ajax:aborted:file` event is fired when a file-type input is detected with a non-blank value.
 *
 * Third-party tools can use this hook to detect when an AJAX file upload is attempted, and then use
 * techniques like the iframe method to upload the file instead.
 *
 * Required fields in rails.js
 * ===========================
 *
 * If any blank required inputs (required="required") are detected in the remote form, the whole form submission
 * is canceled. Note that this is unlike file inputs, which still allow standard (non-AJAX) form submission.
 *
 * The `ajax:aborted:required` event allows you to bind your own handler to inform the user of blank required inputs.
 *
 * !! Note that Opera does not fire the form's submit event if there are blank required inputs, so this event may never
 *    get fired in Opera. This event is what causes other browsers to exhibit the same submit-aborting behavior.
 *
 * Ex:
 *     $('form').live('ajax:aborted:required', function(event, elements){
 *       // Returning false in this handler tells rails.js to submit the form anyway.
 *       // The blank required inputs are passed to this function in `elements`.
 *       return ! confirm("Would you like to submit the form with missing info?");
 *     });
 */

  // Cut down on the number if issues from people inadvertently including jquery_ujs twice
  // by detecting and raising an error when it happens.
  var alreadyInitialized = function() {
    var events = $(document).data('events');
    return events && events.click && $.grep(events.click, function(e) { return e.namespace === 'rails'; }).length;
  }

  if ( alreadyInitialized() ) {
    $.error('jquery-ujs has already been loaded!');
  }

  // Shorthand to make it a little easier to call public rails functions from within rails.js
  var rails;

  $.rails = rails = {
    // Link elements bound by jquery-ujs
    linkClickSelector: 'a[data-confirm], a[data-method], a[data-remote], a[data-disable-with]',

    // Select elements bound by jquery-ujs
    inputChangeSelector: 'select[data-remote], input[data-remote], textarea[data-remote]',

    // Form elements bound by jquery-ujs
    formSubmitSelector: 'form',

    // Form input elements bound by jquery-ujs
    formInputClickSelector: 'form input[type=submit], form input[type=image], form button[type=submit], form button:not([type])',

    // Form input elements disabled during form submission
    disableSelector: 'input[data-disable-with], button[data-disable-with], textarea[data-disable-with]',

    // Form input elements re-enabled after form submission
    enableSelector: 'input[data-disable-with]:disabled, button[data-disable-with]:disabled, textarea[data-disable-with]:disabled',

    // Form required input elements
    requiredInputSelector: 'input[name][required]:not([disabled]),textarea[name][required]:not([disabled])',

    // Form file input elements
    fileInputSelector: 'input:file',

    // Link onClick disable selector with possible reenable after remote submission
    linkDisableSelector: 'a[data-disable-with]',

    // Make sure that every Ajax request sends the CSRF token
    CSRFProtection: function(xhr) {
      var token = $('meta[name="csrf-token"]').attr('content');
      if (token) xhr.setRequestHeader('X-CSRF-Token', token);
    },

    // Triggers an event on an element and returns false if the event result is false
    fire: function(obj, name, data) {
      var event = $.Event(name);
      obj.trigger(event, data);
      return event.result !== false;
    },

    // Default confirm dialog, may be overridden with custom confirm dialog in $.rails.confirm
    confirm: function(message) {
      return confirm(message);
    },

    // Default ajax function, may be overridden with custom function in $.rails.ajax
    ajax: function(options) {
      return $.ajax(options);
    },

    // Default way to get an element's href. May be overridden at $.rails.href.
    href: function(element) {
      return element.attr('href');
    },

    // Submits "remote" forms and links with ajax
    handleRemote: function(element) {
      var method, url, data, elCrossDomain, crossDomain, withCredentials, dataType, options;

      if (rails.fire(element, 'ajax:before')) {
        elCrossDomain = element.data('cross-domain');
        crossDomain = elCrossDomain === undefined ? null : elCrossDomain;
        withCredentials = element.data('with-credentials') || null;
        dataType = element.data('type') || ($.ajaxSettings && $.ajaxSettings.dataType);

        if (element.is('form')) {
          method = element.attr('method');
          url = element.attr('action');
          data = element.serializeArray();
          // memoized value from clicked submit button
          var button = element.data('ujs:submit-button');
          if (button) {
            data.push(button);
            element.data('ujs:submit-button', null);
          }
        } else if (element.is(rails.inputChangeSelector)) {
          method = element.data('method');
          url = element.data('url');
          data = element.serialize();
          if (element.data('params')) data = data + "&" + element.data('params');
        } else {
          method = element.data('method');
          url = rails.href(element);
          data = element.data('params') || null;
        }

        options = {
          type: method || 'GET', data: data, dataType: dataType,
          // stopping the "ajax:beforeSend" event will cancel the ajax request
          beforeSend: function(xhr, settings) {
            if (settings.dataType === undefined) {
              xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
            }
            return rails.fire(element, 'ajax:beforeSend', [xhr, settings]);
          },
          success: function(data, status, xhr) {
            element.trigger('ajax:success', [data, status, xhr]);
          },
          complete: function(xhr, status) {
            element.trigger('ajax:complete', [xhr, status]);
          },
          error: function(xhr, status, error) {
            element.trigger('ajax:error', [xhr, status, error]);
          },
          xhrFields: {
            withCredentials: withCredentials
          },
          crossDomain: crossDomain
        };
        // Only pass url to `ajax` options if not blank
        if (url) { options.url = url; }

        var jqxhr = rails.ajax(options);
        element.trigger('ajax:send', jqxhr);
        return jqxhr;
      } else {
        return false;
      }
    },

    // Handles "data-method" on links such as:
    // <a href="/users/5" data-method="delete" rel="nofollow" data-confirm="Are you sure?">Delete</a>
    handleMethod: function(link) {
      var href = rails.href(link),
        method = link.data('method'),
        target = link.attr('target'),
        csrf_token = $('meta[name=csrf-token]').attr('content'),
        csrf_param = $('meta[name=csrf-param]').attr('content'),
        form = $('<form method="post" action="' + href + '"></form>'),
        metadata_input = '<input name="_method" value="' + method + '" type="hidden" />';

      if (csrf_param !== undefined && csrf_token !== undefined) {
        metadata_input += '<input name="' + csrf_param + '" value="' + csrf_token + '" type="hidden" />';
      }

      if (target) { form.attr('target', target); }

      form.hide().append(metadata_input).appendTo('body');
      form.submit();
    },

    /* Disables form elements:
      - Caches element value in 'ujs:enable-with' data store
      - Replaces element text with value of 'data-disable-with' attribute
      - Sets disabled property to true
    */
    disableFormElements: function(form) {
      form.find(rails.disableSelector).each(function() {
        var element = $(this), method = element.is('button') ? 'html' : 'val';
        element.data('ujs:enable-with', element[method]());
        element[method](element.data('disable-with'));
        element.prop('disabled', true);
      });
    },

    /* Re-enables disabled form elements:
      - Replaces element text with cached value from 'ujs:enable-with' data store (created in `disableFormElements`)
      - Sets disabled property to false
    */
    enableFormElements: function(form) {
      form.find(rails.enableSelector).each(function() {
        var element = $(this), method = element.is('button') ? 'html' : 'val';
        if (element.data('ujs:enable-with')) element[method](element.data('ujs:enable-with'));
        element.prop('disabled', false);
      });
    },

   /* For 'data-confirm' attribute:
      - Fires `confirm` event
      - Shows the confirmation dialog
      - Fires the `confirm:complete` event

      Returns `true` if no function stops the chain and user chose yes; `false` otherwise.
      Attaching a handler to the element's `confirm` event that returns a `falsy` value cancels the confirmation dialog.
      Attaching a handler to the element's `confirm:complete` event that returns a `falsy` value makes this function
      return false. The `confirm:complete` event is fired whether or not the user answered true or false to the dialog.
   */
    allowAction: function(element) {
      var message = element.data('confirm'),
          answer = false, callback;
      if (!message) { return true; }

      if (rails.fire(element, 'confirm')) {
        answer = rails.confirm(message);
        callback = rails.fire(element, 'confirm:complete', [answer]);
      }
      return answer && callback;
    },

    // Helper function which checks for blank inputs in a form that match the specified CSS selector
    blankInputs: function(form, specifiedSelector, nonBlank) {
      var inputs = $(), input, valueToCheck,
        selector = specifiedSelector || 'input,textarea';
      form.find(selector).each(function() {
        input = $(this);
        valueToCheck = input.is(':checkbox,:radio') ? input.is(':checked') : input.val();
        // If nonBlank and valueToCheck are both truthy, or nonBlank and valueToCheck are both falsey
        if (valueToCheck == !!nonBlank) {
          inputs = inputs.add(input);
        }
      });
      return inputs.length ? inputs : false;
    },

    // Helper function which checks for non-blank inputs in a form that match the specified CSS selector
    nonBlankInputs: function(form, specifiedSelector) {
      return rails.blankInputs(form, specifiedSelector, true); // true specifies nonBlank
    },

    // Helper function, needed to provide consistent behavior in IE
    stopEverything: function(e) {
      $(e.target).trigger('ujs:everythingStopped');
      e.stopImmediatePropagation();
      return false;
    },

    // find all the submit events directly bound to the form and
    // manually invoke them. If anyone returns false then stop the loop
    callFormSubmitBindings: function(form, event) {
      var events = form.data('events'), continuePropagation = true;
      if (events !== undefined && events['submit'] !== undefined) {
        $.each(events['submit'], function(i, obj){
          if (typeof obj.handler === 'function') return continuePropagation = obj.handler(event);
        });
      }
      return continuePropagation;
    },

    //  replace element's html with the 'data-disable-with' after storing original html
    //  and prevent clicking on it
    disableElement: function(element) {
      element.data('ujs:enable-with', element.html()); // store enabled state
      element.html(element.data('disable-with')); // set to disabled state
      element.bind('click.railsDisable', function(e) { // prevent further clicking
        return rails.stopEverything(e);
      });
    },

    // restore element to its original state which was disabled by 'disableElement' above
    enableElement: function(element) {
      if (element.data('ujs:enable-with') !== undefined) {
        element.html(element.data('ujs:enable-with')); // set to old enabled state
        // this should be element.removeData('ujs:enable-with')
        // but, there is currently a bug in jquery which makes hyphenated data attributes not get removed
        element.data('ujs:enable-with', false); // clean up cache
      }
      element.unbind('click.railsDisable'); // enable element
    }

  };

  if (rails.fire($(document), 'rails:attachBindings')) {

    $.ajaxPrefilter(function(options, originalOptions, xhr){ if ( !options.crossDomain ) { rails.CSRFProtection(xhr); }});

    $(document).delegate(rails.linkDisableSelector, 'ajax:complete', function() {
        rails.enableElement($(this));
    });

    $(document).delegate(rails.linkClickSelector, 'click.rails', function(e) {
      var link = $(this), method = link.data('method'), data = link.data('params');
      if (!rails.allowAction(link)) return rails.stopEverything(e);

      if (link.is(rails.linkDisableSelector)) rails.disableElement(link);

      if (link.data('remote') !== undefined) {
        if ( (e.metaKey || e.ctrlKey) && (!method || method === 'GET') && !data ) { return true; }

        if (rails.handleRemote(link) === false) { rails.enableElement(link); }
        return false;

      } else if (link.data('method')) {
        rails.handleMethod(link);
        return false;
      }
    });

    $(document).delegate(rails.inputChangeSelector, 'change.rails', function(e) {
      var link = $(this);
      if (!rails.allowAction(link)) return rails.stopEverything(e);

      rails.handleRemote(link);
      return false;
    });

    $(document).delegate(rails.formSubmitSelector, 'submit.rails', function(e) {
      var form = $(this),
        remote = form.data('remote') !== undefined,
        blankRequiredInputs = rails.blankInputs(form, rails.requiredInputSelector),
        nonBlankFileInputs = rails.nonBlankInputs(form, rails.fileInputSelector);

      if (!rails.allowAction(form)) return rails.stopEverything(e);

      // skip other logic when required values are missing or file upload is present
      if (blankRequiredInputs && form.attr("novalidate") == undefined && rails.fire(form, 'ajax:aborted:required', [blankRequiredInputs])) {
        return rails.stopEverything(e);
      }

      if (remote) {
        if (nonBlankFileInputs) {
          setTimeout(function(){ rails.disableFormElements(form); }, 13);
          return rails.fire(form, 'ajax:aborted:file', [nonBlankFileInputs]);
        }

        // If browser does not support submit bubbling, then this live-binding will be called before direct
        // bindings. Therefore, we should directly call any direct bindings before remotely submitting form.
        if (!$.support.submitBubbles && $().jquery < '1.7' && rails.callFormSubmitBindings(form, e) === false) return rails.stopEverything(e);

        rails.handleRemote(form);
        return false;

      } else {
        // slight timeout so that the submit button gets properly serialized
        setTimeout(function(){ rails.disableFormElements(form); }, 13);
      }
    });

    $(document).delegate(rails.formInputClickSelector, 'click.rails', function(event) {
      var button = $(this);

      if (!rails.allowAction(button)) return rails.stopEverything(event);

      // register the pressed submit button
      var name = button.attr('name'),
        data = name ? {name:name, value:button.val()} : null;

      button.closest('form').data('ujs:submit-button', data);
    });

    $(document).delegate(rails.formSubmitSelector, 'ajax:beforeSend.rails', function(event) {
      if (this == event.target) rails.disableFormElements($(this));
    });

    $(document).delegate(rails.formSubmitSelector, 'ajax:complete.rails', function(event) {
      if (this == event.target) rails.enableFormElements($(this));
    });

    $(function(){
      // making sure that all forms have actual up-to-date token(cached forms contain old one)
      csrf_token = $('meta[name=csrf-token]').attr('content');
      csrf_param = $('meta[name=csrf-param]').attr('content');
      $('form input[name="' + csrf_param + '"]').val(csrf_token);
    });
  }

})( jQuery );
// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS

/**
 * @license Highcharts JS v3.0.9 (2014-01-15)
 *
 * (c) 2009-2014 Torstein Honsi
 *
 * License: www.highcharts.com/license
 */

// JSLint options:
/*global Highcharts, document, window, navigator, setInterval, clearInterval, clearTimeout, setTimeout, location, jQuery, $, console, each, grep */


(function () {
// encapsulated variables
var UNDEFINED,
	doc = document,
	win = window,
	math = Math,
	mathRound = math.round,
	mathFloor = math.floor,
	mathCeil = math.ceil,
	mathMax = math.max,
	mathMin = math.min,
	mathAbs = math.abs,
	mathCos = math.cos,
	mathSin = math.sin,
	mathPI = math.PI,
	deg2rad = mathPI * 2 / 360,


	// some variables
	userAgent = navigator.userAgent,
	isOpera = win.opera,
	isIE = /msie/i.test(userAgent) && !isOpera,
	docMode8 = doc.documentMode === 8,
	isWebKit = /AppleWebKit/.test(userAgent),
	isFirefox = /Firefox/.test(userAgent),
	isTouchDevice = /(Mobile|Android|Windows Phone)/.test(userAgent),
	SVG_NS = 'http://www.w3.org/2000/svg',
	hasSVG = !!doc.createElementNS && !!doc.createElementNS(SVG_NS, 'svg').createSVGRect,
	hasBidiBug = isFirefox && parseInt(userAgent.split('Firefox/')[1], 10) < 4, // issue #38
	useCanVG = !hasSVG && !isIE && !!doc.createElement('canvas').getContext,
	Renderer,
	hasTouch = doc.documentElement.ontouchstart !== UNDEFINED,
	symbolSizes = {},
	idCounter = 0,
	garbageBin,
	defaultOptions,
	dateFormat, // function
	globalAnimation,
	pathAnim,
	timeUnits,
	noop = function () {},
	charts = [],
	PRODUCT = 'Highcharts',
	VERSION = '3.0.9',

	// some constants for frequently used strings
	DIV = 'div',
	ABSOLUTE = 'absolute',
	RELATIVE = 'relative',
	HIDDEN = 'hidden',
	PREFIX = 'highcharts-',
	VISIBLE = 'visible',
	PX = 'px',
	NONE = 'none',
	M = 'M',
	L = 'L',
	numRegex = /^[0-9]+$/,
	/*
	 * Empirical lowest possible opacities for TRACKER_FILL
	 * IE6: 0.002
	 * IE7: 0.002
	 * IE8: 0.002
	 * IE9: 0.00000000001 (unlimited)
	 * IE10: 0.0001 (exporting only)
	 * FF: 0.00000000001 (unlimited)
	 * Chrome: 0.000001
	 * Safari: 0.000001
	 * Opera: 0.00000000001 (unlimited)
	 */
	TRACKER_FILL = 'rgba(192,192,192,' + (hasSVG ? 0.0001 : 0.002) + ')', // invisible but clickable
	//TRACKER_FILL = 'rgba(192,192,192,0.5)',
	NORMAL_STATE = '',
	HOVER_STATE = 'hover',
	SELECT_STATE = 'select',
	MILLISECOND = 'millisecond',
	SECOND = 'second',
	MINUTE = 'minute',
	HOUR = 'hour',
	DAY = 'day',
	WEEK = 'week',
	MONTH = 'month',
	YEAR = 'year',
	
	// Object for extending Axis
	AxisPlotLineOrBandExtension,

	// constants for attributes
	LINEAR_GRADIENT = 'linearGradient',
	STOPS = 'stops',
	STROKE_WIDTH = 'stroke-width',

	// time methods, changed based on whether or not UTC is used
	makeTime,
	timezoneOffset,
	getMinutes,
	getHours,
	getDay,
	getDate,
	getMonth,
	getFullYear,
	setMinutes,
	setHours,
	setDate,
	setMonth,
	setFullYear,


	// lookup over the types and the associated classes
	seriesTypes = {};

// The Highcharts namespace
win.Highcharts = win.Highcharts ? error(16, true) : {};

/**
 * Extend an object with the members of another
 * @param {Object} a The object to be extended
 * @param {Object} b The object to add to the first one
 */
function extend(a, b) {
	var n;
	if (!a) {
		a = {};
	}
	for (n in b) {
		a[n] = b[n];
	}
	return a;
}
	
/**
 * Deep merge two or more objects and return a third object. If the first argument is
 * true, the contents of the second object is copied into the first object.
 * Previously this function redirected to jQuery.extend(true), but this had two limitations.
 * First, it deep merged arrays, which lead to workarounds in Highcharts. Second,
 * it copied properties from extended prototypes. 
 */
function merge() {
	var i,
		args = arguments,
		len,
		ret = {},
		doCopy = function (copy, original) {
			var value, key;

			// An object is replacing a primitive
			if (typeof copy !== 'object') {
				copy = {};
			}

			for (key in original) {
				if (original.hasOwnProperty(key)) {
					value = original[key];

					// Copy the contents of objects, but not arrays or DOM nodes
					if (value && typeof value === 'object' && Object.prototype.toString.call(value) !== '[object Array]'
							&& typeof value.nodeType !== 'number') {
						copy[key] = doCopy(copy[key] || {}, value);
				
					// Primitives and arrays are copied over directly
					} else {
						copy[key] = original[key];
					}
				}
			}
			return copy;
		};

	// If first argument is true, copy into the existing object. Used in setOptions.
	if (args[0] === true) {
		ret = args[1];
		args = Array.prototype.slice.call(args, 2);
	}

	// For each argument, extend the return
	len = args.length;
	for (i = 0; i < len; i++) {
		ret = doCopy(ret, args[i]);
	}

	return ret;
}

/**
 * Take an array and turn into a hash with even number arguments as keys and odd numbers as
 * values. Allows creating constants for commonly used style properties, attributes etc.
 * Avoid it in performance critical situations like looping
 */
function hash() {
	var i = 0,
		args = arguments,
		length = args.length,
		obj = {};
	for (; i < length; i++) {
		obj[args[i++]] = args[i];
	}
	return obj;
}

/**
 * Shortcut for parseInt
 * @param {Object} s
 * @param {Number} mag Magnitude
 */
function pInt(s, mag) {
	return parseInt(s, mag || 10);
}

/**
 * Check for string
 * @param {Object} s
 */
function isString(s) {
	return typeof s === 'string';
}

/**
 * Check for object
 * @param {Object} obj
 */
function isObject(obj) {
	return typeof obj === 'object';
}

/**
 * Check for array
 * @param {Object} obj
 */
function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

/**
 * Check for number
 * @param {Object} n
 */
function isNumber(n) {
	return typeof n === 'number';
}

function log2lin(num) {
	return math.log(num) / math.LN10;
}
function lin2log(num) {
	return math.pow(10, num);
}

/**
 * Remove last occurence of an item from an array
 * @param {Array} arr
 * @param {Mixed} item
 */
function erase(arr, item) {
	var i = arr.length;
	while (i--) {
		if (arr[i] === item) {
			arr.splice(i, 1);
			break;
		}
	}
	//return arr;
}

/**
 * Returns true if the object is not null or undefined. Like MooTools' $.defined.
 * @param {Object} obj
 */
function defined(obj) {
	return obj !== UNDEFINED && obj !== null;
}

/**
 * Set or get an attribute or an object of attributes. Can't use jQuery attr because
 * it attempts to set expando properties on the SVG element, which is not allowed.
 *
 * @param {Object} elem The DOM element to receive the attribute(s)
 * @param {String|Object} prop The property or an abject of key-value pairs
 * @param {String} value The value if a single property is set
 */
function attr(elem, prop, value) {
	var key,
		setAttribute = 'setAttribute',
		ret;

	// if the prop is a string
	if (isString(prop)) {
		// set the value
		if (defined(value)) {

			elem[setAttribute](prop, value);

		// get the value
		} else if (elem && elem.getAttribute) { // elem not defined when printing pie demo...
			ret = elem.getAttribute(prop);
		}

	// else if prop is defined, it is a hash of key/value pairs
	} else if (defined(prop) && isObject(prop)) {
		for (key in prop) {
			elem[setAttribute](key, prop[key]);
		}
	}
	return ret;
}
/**
 * Check if an element is an array, and if not, make it into an array. Like
 * MooTools' $.splat.
 */
function splat(obj) {
	return isArray(obj) ? obj : [obj];
}


/**
 * Return the first value that is defined. Like MooTools' $.pick.
 */
function pick() {
	var args = arguments,
		i,
		arg,
		length = args.length;
	for (i = 0; i < length; i++) {
		arg = args[i];
		if (typeof arg !== 'undefined' && arg !== null) {
			return arg;
		}
	}
}

/**
 * Set CSS on a given element
 * @param {Object} el
 * @param {Object} styles Style object with camel case property names
 */
function css(el, styles) {
	if (isIE) {
		if (styles && styles.opacity !== UNDEFINED) {
			styles.filter = 'alpha(opacity=' + (styles.opacity * 100) + ')';
		}
	}
	extend(el.style, styles);
}

/**
 * Utility function to create element with attributes and styles
 * @param {Object} tag
 * @param {Object} attribs
 * @param {Object} styles
 * @param {Object} parent
 * @param {Object} nopad
 */
function createElement(tag, attribs, styles, parent, nopad) {
	var el = doc.createElement(tag);
	if (attribs) {
		extend(el, attribs);
	}
	if (nopad) {
		css(el, {padding: 0, border: NONE, margin: 0});
	}
	if (styles) {
		css(el, styles);
	}
	if (parent) {
		parent.appendChild(el);
	}
	return el;
}

/**
 * Extend a prototyped class by new members
 * @param {Object} parent
 * @param {Object} members
 */
function extendClass(parent, members) {
	var object = function () {};
	object.prototype = new parent();
	extend(object.prototype, members);
	return object;
}

/**
 * Format a number and return a string based on input settings
 * @param {Number} number The input number to format
 * @param {Number} decimals The amount of decimals
 * @param {String} decPoint The decimal point, defaults to the one given in the lang options
 * @param {String} thousandsSep The thousands separator, defaults to the one given in the lang options
 */
function numberFormat(number, decimals, decPoint, thousandsSep) {
	var lang = defaultOptions.lang,
		// http://kevin.vanzonneveld.net/techblog/article/javascript_equivalent_for_phps_number_format/
		n = +number || 0,
		c = decimals === -1 ?
			(n.toString().split('.')[1] || '').length : // preserve decimals
			(isNaN(decimals = mathAbs(decimals)) ? 2 : decimals),
		d = decPoint === undefined ? lang.decimalPoint : decPoint,
		t = thousandsSep === undefined ? lang.thousandsSep : thousandsSep,
		s = n < 0 ? "-" : "",
		i = String(pInt(n = mathAbs(n).toFixed(c))),
		j = i.length > 3 ? i.length % 3 : 0;

	return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
		(c ? d + mathAbs(n - i).toFixed(c).slice(2) : "");
}

/**
 * Pad a string to a given length by adding 0 to the beginning
 * @param {Number} number
 * @param {Number} length
 */
function pad(number, length) {
	// Create an array of the remaining length +1 and join it with 0's
	return new Array((length || 2) + 1 - String(number).length).join(0) + number;
}

/**
 * Wrap a method with extended functionality, preserving the original function
 * @param {Object} obj The context object that the method belongs to 
 * @param {String} method The name of the method to extend
 * @param {Function} func A wrapper function callback. This function is called with the same arguments
 * as the original function, except that the original function is unshifted and passed as the first 
 * argument. 
 */
function wrap(obj, method, func) {
	var proceed = obj[method];
	obj[method] = function () {
		var args = Array.prototype.slice.call(arguments);
		args.unshift(proceed);
		return func.apply(this, args);
	};
}

/**
 * Based on http://www.php.net/manual/en/function.strftime.php
 * @param {String} format
 * @param {Number} timestamp
 * @param {Boolean} capitalize
 */
dateFormat = function (format, timestamp, capitalize) {
	if (!defined(timestamp) || isNaN(timestamp)) {
		return 'Invalid date';
	}
	format = pick(format, '%Y-%m-%d %H:%M:%S');

	var date = new Date(timestamp - timezoneOffset),
		key, // used in for constuct below
		// get the basic time values
		hours = date[getHours](),
		day = date[getDay](),
		dayOfMonth = date[getDate](),
		month = date[getMonth](),
		fullYear = date[getFullYear](),
		lang = defaultOptions.lang,
		langWeekdays = lang.weekdays,

		// List all format keys. Custom formats can be added from the outside. 
		replacements = extend({

			// Day
			'a': langWeekdays[day].substr(0, 3), // Short weekday, like 'Mon'
			'A': langWeekdays[day], // Long weekday, like 'Monday'
			'd': pad(dayOfMonth), // Two digit day of the month, 01 to 31
			'e': dayOfMonth, // Day of the month, 1 through 31

			// Week (none implemented)
			//'W': weekNumber(),

			// Month
			'b': lang.shortMonths[month], // Short month, like 'Jan'
			'B': lang.months[month], // Long month, like 'January'
			'm': pad(month + 1), // Two digit month number, 01 through 12

			// Year
			'y': fullYear.toString().substr(2, 2), // Two digits year, like 09 for 2009
			'Y': fullYear, // Four digits year, like 2009

			// Time
			'H': pad(hours), // Two digits hours in 24h format, 00 through 23
			'I': pad((hours % 12) || 12), // Two digits hours in 12h format, 00 through 11
			'l': (hours % 12) || 12, // Hours in 12h format, 1 through 12
			'M': pad(date[getMinutes]()), // Two digits minutes, 00 through 59
			'p': hours < 12 ? 'AM' : 'PM', // Upper case AM or PM
			'P': hours < 12 ? 'am' : 'pm', // Lower case AM or PM
			'S': pad(date.getSeconds()), // Two digits seconds, 00 through  59
			'L': pad(mathRound(timestamp % 1000), 3) // Milliseconds (naming from Ruby)
		}, Highcharts.dateFormats);


	// do the replaces
	for (key in replacements) {
		while (format.indexOf('%' + key) !== -1) { // regex would do it in one line, but this is faster
			format = format.replace('%' + key, typeof replacements[key] === 'function' ? replacements[key](timestamp) : replacements[key]);
		}
	}

	// Optionally capitalize the string and return
	return capitalize ? format.substr(0, 1).toUpperCase() + format.substr(1) : format;
};

/** 
 * Format a single variable. Similar to sprintf, without the % prefix.
 */
function formatSingle(format, val) {
	var floatRegex = /f$/,
		decRegex = /\.([0-9])/,
		lang = defaultOptions.lang,
		decimals;

	if (floatRegex.test(format)) { // float
		decimals = format.match(decRegex);
		decimals = decimals ? decimals[1] : -1;
		val = numberFormat(
			val,
			decimals,
			lang.decimalPoint,
			format.indexOf(',') > -1 ? lang.thousandsSep : ''
		);
	} else {
		val = dateFormat(format, val);
	}
	return val;
}

/**
 * Format a string according to a subset of the rules of Python's String.format method.
 */
function format(str, ctx) {
	var splitter = '{',
		isInside = false,
		segment,
		valueAndFormat,
		path,
		i,
		len,
		ret = [],
		val,
		index;
	
	while ((index = str.indexOf(splitter)) !== -1) {
		
		segment = str.slice(0, index);
		if (isInside) { // we're on the closing bracket looking back
			
			valueAndFormat = segment.split(':');
			path = valueAndFormat.shift().split('.'); // get first and leave format
			len = path.length;
			val = ctx;

			// Assign deeper paths
			for (i = 0; i < len; i++) {
				val = val[path[i]];
			}

			// Format the replacement
			if (valueAndFormat.length) {
				val = formatSingle(valueAndFormat.join(':'), val);
			}

			// Push the result and advance the cursor
			ret.push(val);
			
		} else {
			ret.push(segment);
			
		}
		str = str.slice(index + 1); // the rest
		isInside = !isInside; // toggle
		splitter = isInside ? '}' : '{'; // now look for next matching bracket
	}
	ret.push(str);
	return ret.join('');
}

/**
 * Get the magnitude of a number
 */
function getMagnitude(num) {
	return math.pow(10, mathFloor(math.log(num) / math.LN10));
}

/**
 * Take an interval and normalize it to multiples of 1, 2, 2.5 and 5
 * @param {Number} interval
 * @param {Array} multiples
 * @param {Number} magnitude
 * @param {Object} options
 */
function normalizeTickInterval(interval, multiples, magnitude, options) {
	var normalized, i;

	// round to a tenfold of 1, 2, 2.5 or 5
	magnitude = pick(magnitude, 1);
	normalized = interval / magnitude;

	// multiples for a linear scale
	if (!multiples) {
		multiples = [1, 2, 2.5, 5, 10];

		// the allowDecimals option
		if (options && options.allowDecimals === false) {
			if (magnitude === 1) {
				multiples = [1, 2, 5, 10];
			} else if (magnitude <= 0.1) {
				multiples = [1 / magnitude];
			}
		}
	}

	// normalize the interval to the nearest multiple
	for (i = 0; i < multiples.length; i++) {
		interval = multiples[i];
		if (normalized <= (multiples[i] + (multiples[i + 1] || multiples[i])) / 2) {
			break;
		}
	}

	// multiply back to the correct magnitude
	interval *= magnitude;

	return interval;
}


/**
 * Helper class that contains variuos counters that are local to the chart.
 */
function ChartCounters() {
	this.color = 0;
	this.symbol = 0;
}

ChartCounters.prototype =  {
	/**
	 * Wraps the color counter if it reaches the specified length.
	 */
	wrapColor: function (length) {
		if (this.color >= length) {
			this.color = 0;
		}
	},

	/**
	 * Wraps the symbol counter if it reaches the specified length.
	 */
	wrapSymbol: function (length) {
		if (this.symbol >= length) {
			this.symbol = 0;
		}
	}
};


/**
 * Utility method that sorts an object array and keeping the order of equal items.
 * ECMA script standard does not specify the behaviour when items are equal.
 */
function stableSort(arr, sortFunction) {
	var length = arr.length,
		sortValue,
		i;

	// Add index to each item
	for (i = 0; i < length; i++) {
		arr[i].ss_i = i; // stable sort index
	}

	arr.sort(function (a, b) {
		sortValue = sortFunction(a, b);
		return sortValue === 0 ? a.ss_i - b.ss_i : sortValue;
	});

	// Remove index from items
	for (i = 0; i < length; i++) {
		delete arr[i].ss_i; // stable sort index
	}
}

/**
 * Non-recursive method to find the lowest member of an array. Math.min raises a maximum
 * call stack size exceeded error in Chrome when trying to apply more than 150.000 points. This
 * method is slightly slower, but safe.
 */
function arrayMin(data) {
	var i = data.length,
		min = data[0];

	while (i--) {
		if (data[i] < min) {
			min = data[i];
		}
	}
	return min;
}

/**
 * Non-recursive method to find the lowest member of an array. Math.min raises a maximum
 * call stack size exceeded error in Chrome when trying to apply more than 150.000 points. This
 * method is slightly slower, but safe.
 */
function arrayMax(data) {
	var i = data.length,
		max = data[0];

	while (i--) {
		if (data[i] > max) {
			max = data[i];
		}
	}
	return max;
}

/**
 * Utility method that destroys any SVGElement or VMLElement that are properties on the given object.
 * It loops all properties and invokes destroy if there is a destroy method. The property is
 * then delete'ed.
 * @param {Object} The object to destroy properties on
 * @param {Object} Exception, do not destroy this property, only delete it.
 */
function destroyObjectProperties(obj, except) {
	var n;
	for (n in obj) {
		// If the object is non-null and destroy is defined
		if (obj[n] && obj[n] !== except && obj[n].destroy) {
			// Invoke the destroy
			obj[n].destroy();
		}

		// Delete the property from the object.
		delete obj[n];
	}
}


/**
 * Discard an element by moving it to the bin and delete
 * @param {Object} The HTML node to discard
 */
function discardElement(element) {
	// create a garbage bin element, not part of the DOM
	if (!garbageBin) {
		garbageBin = createElement(DIV);
	}

	// move the node and empty bin
	if (element) {
		garbageBin.appendChild(element);
	}
	garbageBin.innerHTML = '';
}

/**
 * Provide error messages for debugging, with links to online explanation 
 */
function error(code, stop) {
	var msg = 'Highcharts error #' + code + ': www.highcharts.com/errors/' + code;
	if (stop) {
		throw msg;
	} else if (win.console) {
		console.log(msg);
	}
}

/**
 * Fix JS round off float errors
 * @param {Number} num
 */
function correctFloat(num) {
	return parseFloat(
		num.toPrecision(14)
	);
}

/**
 * Set the global animation to either a given value, or fall back to the
 * given chart's animation option
 * @param {Object} animation
 * @param {Object} chart
 */
function setAnimation(animation, chart) {
	globalAnimation = pick(animation, chart.animation);
}

/**
 * The time unit lookup
 */
/*jslint white: true*/
timeUnits = hash(
	MILLISECOND, 1,
	SECOND, 1000,
	MINUTE, 60000,
	HOUR, 3600000,
	DAY, 24 * 3600000,
	WEEK, 7 * 24 * 3600000,
	MONTH, 31 * 24 * 3600000,
	YEAR, 31556952000
);
/*jslint white: false*/
/**
 * Path interpolation algorithm used across adapters
 */
pathAnim = {
	/**
	 * Prepare start and end values so that the path can be animated one to one
	 */
	init: function (elem, fromD, toD) {
		fromD = fromD || '';
		var shift = elem.shift,
			bezier = fromD.indexOf('C') > -1,
			numParams = bezier ? 7 : 3,
			endLength,
			slice,
			i,
			start = fromD.split(' '),
			end = [].concat(toD), // copy
			startBaseLine,
			endBaseLine,
			sixify = function (arr) { // in splines make move points have six parameters like bezier curves
				i = arr.length;
				while (i--) {
					if (arr[i] === M) {
						arr.splice(i + 1, 0, arr[i + 1], arr[i + 2], arr[i + 1], arr[i + 2]);
					}
				}
			};

		if (bezier) {
			sixify(start);
			sixify(end);
		}

		// pull out the base lines before padding
		if (elem.isArea) {
			startBaseLine = start.splice(start.length - 6, 6);
			endBaseLine = end.splice(end.length - 6, 6);
		}

		// if shifting points, prepend a dummy point to the end path
		if (shift <= end.length / numParams && start.length === end.length) {
			while (shift--) {
				end = [].concat(end).splice(0, numParams).concat(end);
			}
		}
		elem.shift = 0; // reset for following animations

		// copy and append last point until the length matches the end length
		if (start.length) {
			endLength = end.length;
			while (start.length < endLength) {

				//bezier && sixify(start);
				slice = [].concat(start).splice(start.length - numParams, numParams);
				if (bezier) { // disable first control point
					slice[numParams - 6] = slice[numParams - 2];
					slice[numParams - 5] = slice[numParams - 1];
				}
				start = start.concat(slice);
			}
		}

		if (startBaseLine) { // append the base lines for areas
			start = start.concat(startBaseLine);
			end = end.concat(endBaseLine);
		}
		return [start, end];
	},

	/**
	 * Interpolate each value of the path and return the array
	 */
	step: function (start, end, pos, complete) {
		var ret = [],
			i = start.length,
			startVal;

		if (pos === 1) { // land on the final path without adjustment points appended in the ends
			ret = complete;

		} else if (i === end.length && pos < 1) {
			while (i--) {
				startVal = parseFloat(start[i]);
				ret[i] =
					isNaN(startVal) ? // a letter instruction like M or L
						start[i] :
						pos * (parseFloat(end[i] - startVal)) + startVal;

			}
		} else { // if animation is finished or length not matching, land on right value
			ret = end;
		}
		return ret;
	}
};

(function ($) {
	/**
	 * The default HighchartsAdapter for jQuery
	 */
	win.HighchartsAdapter = win.HighchartsAdapter || ($ && {
		
		/**
		 * Initialize the adapter by applying some extensions to jQuery
		 */
		init: function (pathAnim) {
			
			// extend the animate function to allow SVG animations
			var Fx = $.fx,
				Step = Fx.step,
				dSetter,
				Tween = $.Tween,
				propHooks = Tween && Tween.propHooks,
				opacityHook = $.cssHooks.opacity;
			
			/*jslint unparam: true*//* allow unused param x in this function */
			$.extend($.easing, {
				easeOutQuad: function (x, t, b, c, d) {
					return -c * (t /= d) * (t - 2) + b;
				}
			});
			/*jslint unparam: false*/
		
			// extend some methods to check for elem.attr, which means it is a Highcharts SVG object
			$.each(['cur', '_default', 'width', 'height', 'opacity'], function (i, fn) {
				var obj = Step,
					base;
					
				// Handle different parent objects
				if (fn === 'cur') {
					obj = Fx.prototype; // 'cur', the getter, relates to Fx.prototype
				
				} else if (fn === '_default' && Tween) { // jQuery 1.8 model
					obj = propHooks[fn];
					fn = 'set';
				}
		
				// Overwrite the method
				base = obj[fn];
				if (base) { // step.width and step.height don't exist in jQuery < 1.7
		
					// create the extended function replacement
					obj[fn] = function (fx) {

						var elem;
						
						// Fx.prototype.cur does not use fx argument
						fx = i ? fx : this;

						// Don't run animations on textual properties like align (#1821)
						if (fx.prop === 'align') {
							return;
						}
		
						// shortcut
						elem = fx.elem;
		
						// Fx.prototype.cur returns the current value. The other ones are setters
						// and returning a value has no effect.
						return elem.attr ? // is SVG element wrapper
							elem.attr(fx.prop, fn === 'cur' ? UNDEFINED : fx.now) : // apply the SVG wrapper's method
							base.apply(this, arguments); // use jQuery's built-in method
					};
				}
			});

			// Extend the opacity getter, needed for fading opacity with IE9 and jQuery 1.10+
			wrap(opacityHook, 'get', function (proceed, elem, computed) {
				return elem.attr ? (elem.opacity || 0) : proceed.call(this, elem, computed);
			});
			
			
			// Define the setter function for d (path definitions)
			dSetter = function (fx) {
				var elem = fx.elem,
					ends;
		
				// Normally start and end should be set in state == 0, but sometimes,
				// for reasons unknown, this doesn't happen. Perhaps state == 0 is skipped
				// in these cases
				if (!fx.started) {
					ends = pathAnim.init(elem, elem.d, elem.toD);
					fx.start = ends[0];
					fx.end = ends[1];
					fx.started = true;
				}
		
		
				// interpolate each value of the path
				elem.attr('d', pathAnim.step(fx.start, fx.end, fx.pos, elem.toD));
			};
			
			// jQuery 1.8 style
			if (Tween) {
				propHooks.d = {
					set: dSetter
				};
			// pre 1.8
			} else {
				// animate paths
				Step.d = dSetter;
			}
			
			/**
			 * Utility for iterating over an array. Parameters are reversed compared to jQuery.
			 * @param {Array} arr
			 * @param {Function} fn
			 */
			this.each = Array.prototype.forEach ?
				function (arr, fn) { // modern browsers
					return Array.prototype.forEach.call(arr, fn);
					
				} : 
				function (arr, fn) { // legacy
					var i = 0, 
						len = arr.length;
					for (; i < len; i++) {
						if (fn.call(arr[i], arr[i], i, arr) === false) {
							return i;
						}
					}
				};
			
			/**
			 * Register Highcharts as a plugin in the respective framework
			 */
			$.fn.highcharts = function () {
				var constr = 'Chart', // default constructor
					args = arguments,
					options,
					ret,
					chart;

				if (isString(args[0])) {
					constr = args[0];
					args = Array.prototype.slice.call(args, 1); 
				}
				options = args[0];

				// Create the chart
				if (options !== UNDEFINED) {
					/*jslint unused:false*/
					options.chart = options.chart || {};
					options.chart.renderTo = this[0];
					chart = new Highcharts[constr](options, args[1]);
					ret = this;
					/*jslint unused:true*/
				}

				// When called without parameters or with the return argument, get a predefined chart
				if (options === UNDEFINED) {
					ret = charts[attr(this[0], 'data-highcharts-chart')];
				}	

				return ret;
			};

		},

		
		/**
		 * Downloads a script and executes a callback when done.
		 * @param {String} scriptLocation
		 * @param {Function} callback
		 */
		getScript: $.getScript,
		
		/**
		 * Return the index of an item in an array, or -1 if not found
		 */
		inArray: $.inArray,
		
		/**
		 * A direct link to jQuery methods. MooTools and Prototype adapters must be implemented for each case of method.
		 * @param {Object} elem The HTML element
		 * @param {String} method Which method to run on the wrapped element
		 */
		adapterRun: function (elem, method) {
			return $(elem)[method]();
		},
	
		/**
		 * Filter an array
		 */
		grep: $.grep,
	
		/**
		 * Map an array
		 * @param {Array} arr
		 * @param {Function} fn
		 */
		map: function (arr, fn) {
			//return jQuery.map(arr, fn);
			var results = [],
				i = 0,
				len = arr.length;
			for (; i < len; i++) {
				results[i] = fn.call(arr[i], arr[i], i, arr);
			}
			return results;
	
		},
	
		/**
		 * Get the position of an element relative to the top left of the page
		 */
		offset: function (el) {
			return $(el).offset();
		},
	
		/**
		 * Add an event listener
		 * @param {Object} el A HTML element or custom object
		 * @param {String} event The event type
		 * @param {Function} fn The event handler
		 */
		addEvent: function (el, event, fn) {
			$(el).bind(event, fn);
		},
	
		/**
		 * Remove event added with addEvent
		 * @param {Object} el The object
		 * @param {String} eventType The event type. Leave blank to remove all events.
		 * @param {Function} handler The function to remove
		 */
		removeEvent: function (el, eventType, handler) {
			// workaround for jQuery issue with unbinding custom events:
			// http://forum.jQuery.com/topic/javascript-error-when-unbinding-a-custom-event-using-jQuery-1-4-2
			var func = doc.removeEventListener ? 'removeEventListener' : 'detachEvent';
			if (doc[func] && el && !el[func]) {
				el[func] = function () {};
			}
	
			$(el).unbind(eventType, handler);
		},
	
		/**
		 * Fire an event on a custom object
		 * @param {Object} el
		 * @param {String} type
		 * @param {Object} eventArguments
		 * @param {Function} defaultFunction
		 */
		fireEvent: function (el, type, eventArguments, defaultFunction) {
			var event = $.Event(type),
				detachedType = 'detached' + type,
				defaultPrevented;
	
			// Remove warnings in Chrome when accessing layerX and layerY. Although Highcharts
			// never uses these properties, Chrome includes them in the default click event and
			// raises the warning when they are copied over in the extend statement below.
			//
			// To avoid problems in IE (see #1010) where we cannot delete the properties and avoid
			// testing if they are there (warning in chrome) the only option is to test if running IE.
			if (!isIE && eventArguments) {
				delete eventArguments.layerX;
				delete eventArguments.layerY;
			}
	
			extend(event, eventArguments);
	
			// Prevent jQuery from triggering the object method that is named the
			// same as the event. For example, if the event is 'select', jQuery
			// attempts calling el.select and it goes into a loop.
			if (el[type]) {
				el[detachedType] = el[type];
				el[type] = null;
			}
	
			// Wrap preventDefault and stopPropagation in try/catch blocks in
			// order to prevent JS errors when cancelling events on non-DOM
			// objects. #615.
			/*jslint unparam: true*/
			$.each(['preventDefault', 'stopPropagation'], function (i, fn) {
				var base = event[fn];
				event[fn] = function () {
					try {
						base.call(event);
					} catch (e) {
						if (fn === 'preventDefault') {
							defaultPrevented = true;
						}
					}
				};
			});
			/*jslint unparam: false*/
	
			// trigger it
			$(el).trigger(event);
	
			// attach the method
			if (el[detachedType]) {
				el[type] = el[detachedType];
				el[detachedType] = null;
			}
	
			if (defaultFunction && !event.isDefaultPrevented() && !defaultPrevented) {
				defaultFunction(event);
			}
		},
		
		/**
		 * Extension method needed for MooTools
		 */
		washMouseEvent: function (e) {
			var ret = e.originalEvent || e;
			
			// computed by jQuery, needed by IE8
			if (ret.pageX === UNDEFINED) { // #1236
				ret.pageX = e.pageX;
				ret.pageY = e.pageY;
			}
			
			return ret;
		},
	
		/**
		 * Animate a HTML element or SVG element wrapper
		 * @param {Object} el
		 * @param {Object} params
		 * @param {Object} options jQuery-like animation options: duration, easing, callback
		 */
		animate: function (el, params, options) {
			var $el = $(el);
			if (!el.style) {
				el.style = {}; // #1881
			}
			if (params.d) {
				el.toD = params.d; // keep the array form for paths, used in $.fx.step.d
				params.d = 1; // because in jQuery, animating to an array has a different meaning
			}
	
			$el.stop();
			if (params.opacity !== UNDEFINED && el.attr) {
				params.opacity += 'px'; // force jQuery to use same logic as width and height (#2161)
			}
			$el.animate(params, options);
	
		},
		/**
		 * Stop running animation
		 */
		stop: function (el) {
			$(el).stop();
		}
	});
}(win.jQuery));


// check for a custom HighchartsAdapter defined prior to this file
var globalAdapter = win.HighchartsAdapter,
	adapter = globalAdapter || {};
	
// Initialize the adapter
if (globalAdapter) {
	globalAdapter.init.call(globalAdapter, pathAnim);
}


// Utility functions. If the HighchartsAdapter is not defined, adapter is an empty object
// and all the utility functions will be null. In that case they are populated by the
// default adapters below.
var adapterRun = adapter.adapterRun,
	getScript = adapter.getScript,
	inArray = adapter.inArray,
	each = adapter.each,
	grep = adapter.grep,
	offset = adapter.offset,
	map = adapter.map,
	addEvent = adapter.addEvent,
	removeEvent = adapter.removeEvent,
	fireEvent = adapter.fireEvent,
	washMouseEvent = adapter.washMouseEvent,
	animate = adapter.animate,
	stop = adapter.stop;



/* ****************************************************************************
 * Handle the options                                                         *
 *****************************************************************************/
var

defaultLabelOptions = {
	enabled: true,
	// rotation: 0,
	// align: 'center',
	x: 0,
	y: 15,
	/*formatter: function () {
		return this.value;
	},*/
	style: {
		color: '#666',
		cursor: 'default',
		fontSize: '11px'
	}
};

defaultOptions = {
	colors: ['#2f7ed8', '#0d233a', '#8bbc21', '#910000', '#1aadce', '#492970',
		'#f28f43', '#77a1e5', '#c42525', '#a6c96a'],
	symbols: ['circle', 'diamond', 'square', 'triangle', 'triangle-down'],
	lang: {
		loading: 'Loading...',
		months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
				'August', 'September', 'October', 'November', 'December'],
		shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		decimalPoint: '.',
		numericSymbols: ['k', 'M', 'G', 'T', 'P', 'E'], // SI prefixes used in axis labels
		resetZoom: 'Reset zoom',
		resetZoomTitle: 'Reset zoom level 1:1',
		thousandsSep: ','
	},
	global: {
		useUTC: true,
		//timezoneOffset: 0,
		canvasToolsURL: 'http://code.highcharts.com/3.0.9/modules/canvas-tools.js',
		VMLRadialGradientURL: 'http://code.highcharts.com/3.0.9/gfx/vml-radial-gradient.png'
	},
	chart: {
		//animation: true,
		//alignTicks: false,
		//reflow: true,
		//className: null,
		//events: { load, selection },
		//margin: [null],
		//marginTop: null,
		//marginRight: null,
		//marginBottom: null,
		//marginLeft: null,
		borderColor: '#4572A7',
		//borderWidth: 0,
		borderRadius: 5,
		defaultSeriesType: 'line',
		ignoreHiddenSeries: true,
		//inverted: false,
		//shadow: false,
		spacing: [10, 10, 15, 10],
		//spacingTop: 10,
		//spacingRight: 10,
		//spacingBottom: 15,
		//spacingLeft: 10,
		style: {
			fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif', // default font
			fontSize: '12px'
		},
		backgroundColor: '#FFFFFF',
		//plotBackgroundColor: null,
		plotBorderColor: '#C0C0C0',
		//plotBorderWidth: 0,
		//plotShadow: false,
		//zoomType: ''
		resetZoomButton: {
			theme: {
				zIndex: 20
			},
			position: {
				align: 'right',
				x: -10,
				//verticalAlign: 'top',
				y: 10
			}
			// relativeTo: 'plot'
		}
	},
	title: {
		text: 'Chart title',
		align: 'center',
		// floating: false,
		margin: 15,
		// x: 0,
		// verticalAlign: 'top',
		// y: null,
		style: {
			color: '#274b6d',//#3E576F',
			fontSize: '16px'
		}

	},
	subtitle: {
		text: '',
		align: 'center',
		// floating: false
		// x: 0,
		// verticalAlign: 'top',
		// y: null,
		style: {
			color: '#4d759e'
		}
	},

	plotOptions: {
		line: { // base series options
			allowPointSelect: false,
			showCheckbox: false,
			animation: {
				duration: 1000
			},
			//connectNulls: false,
			//cursor: 'default',
			//clip: true,
			//dashStyle: null,
			//enableMouseTracking: true,
			events: {},
			//legendIndex: 0,
			//linecap: 'round',
			lineWidth: 2,
			//shadow: false,
			// stacking: null,
			marker: {
				enabled: true,
				//symbol: null,
				lineWidth: 0,
				radius: 4,
				lineColor: '#FFFFFF',
				//fillColor: null,
				states: { // states for a single point
					hover: {
						enabled: true
						//radius: base + 2
					},
					select: {
						fillColor: '#FFFFFF',
						lineColor: '#000000',
						lineWidth: 2
					}
				}
			},
			point: {
				events: {}
			},
			dataLabels: merge(defaultLabelOptions, {
				align: 'center',
				enabled: false,
				formatter: function () {
					return this.y === null ? '' : numberFormat(this.y, -1);
				},
				verticalAlign: 'bottom', // above singular point
				y: 0
				// backgroundColor: undefined,
				// borderColor: undefined,
				// borderRadius: undefined,
				// borderWidth: undefined,
				// padding: 3,
				// shadow: false
			}),
			cropThreshold: 300, // draw points outside the plot area when the number of points is less than this
			pointRange: 0,
			//pointStart: 0,
			//pointInterval: 1,
			//showInLegend: null, // auto: true for standalone series, false for linked series
			states: { // states for the entire series
				hover: {
					//enabled: false,
					//lineWidth: base + 1,
					marker: {
						// lineWidth: base + 1,
						// radius: base + 1
					}
				},
				select: {
					marker: {}
				}
			},
			stickyTracking: true,
			//tooltip: {
				//pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b>'
				//valueDecimals: null,
				//xDateFormat: '%A, %b %e, %Y',
				//valuePrefix: '',
				//ySuffix: ''				
			//}
			turboThreshold: 1000
			// zIndex: null
		}
	},
	labels: {
		//items: [],
		style: {
			//font: defaultFont,
			position: ABSOLUTE,
			color: '#3E576F'
		}
	},
	legend: {
		enabled: true,
		align: 'center',
		//floating: false,
		layout: 'horizontal',
		labelFormatter: function () {
			return this.name;
		},
		borderWidth: 1,
		borderColor: '#909090',
		borderRadius: 5,
		navigation: {
			// animation: true,
			activeColor: '#274b6d',
			// arrowSize: 12
			inactiveColor: '#CCC'
			// style: {} // text styles
		},
		// margin: 10,
		// reversed: false,
		shadow: false,
		// backgroundColor: null,
		/*style: {
			padding: '5px'
		},*/
		itemStyle: {
			cursor: 'pointer',
			color: '#274b6d',
			fontSize: '12px'
		},
		itemHoverStyle: {
			//cursor: 'pointer', removed as of #601
			color: '#000'
		},
		itemHiddenStyle: {
			color: '#CCC'
		},
		itemCheckboxStyle: {
			position: ABSOLUTE,
			width: '13px', // for IE precision
			height: '13px'
		},
		// itemWidth: undefined,
		// symbolWidth: 16,
		symbolPadding: 5,
		verticalAlign: 'bottom',
		// width: undefined,
		x: 0,
		y: 0,
		title: {
			//text: null,
			style: {
				fontWeight: 'bold'
			}
		}			
	},

	loading: {
		// hideDuration: 100,
		labelStyle: {
			fontWeight: 'bold',
			position: RELATIVE,
			top: '1em'
		},
		// showDuration: 0,
		style: {
			position: ABSOLUTE,
			backgroundColor: 'white',
			opacity: 0.5,
			textAlign: 'center'
		}
	},

	tooltip: {
		enabled: true,
		animation: hasSVG,
		//crosshairs: null,
		backgroundColor: 'rgba(255, 255, 255, .85)',
		borderWidth: 1,
		borderRadius: 3,
		dateTimeLabelFormats: { 
			millisecond: '%A, %b %e, %H:%M:%S.%L',
			second: '%A, %b %e, %H:%M:%S',
			minute: '%A, %b %e, %H:%M',
			hour: '%A, %b %e, %H:%M',
			day: '%A, %b %e, %Y',
			week: 'Week from %A, %b %e, %Y',
			month: '%B %Y',
			year: '%Y'
		},
		//formatter: defaultFormatter,
		headerFormat: '<span style="font-size: 10px">{point.key}</span><br/>',
		pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
		shadow: true,
		//shared: false,
		snap: isTouchDevice ? 25 : 10,
		style: {
			color: '#333333',
			cursor: 'default',
			fontSize: '12px',
			padding: '8px',
			whiteSpace: 'nowrap'
		}
		//xDateFormat: '%A, %b %e, %Y',
		//valueDecimals: null,
		//valuePrefix: '',
		//valueSuffix: ''
	},

	credits: {
		enabled: true,
		text: 'Highcharts.com',
		href: 'http://www.highcharts.com',
		position: {
			align: 'right',
			x: -10,
			verticalAlign: 'bottom',
			y: -5
		},
		style: {
			cursor: 'pointer',
			color: '#909090',
			fontSize: '9px'
		}
	}
};




// Series defaults
var defaultPlotOptions = defaultOptions.plotOptions,
	defaultSeriesOptions = defaultPlotOptions.line;

// set the default time methods
setTimeMethods();



/**
 * Set the time methods globally based on the useUTC option. Time method can be either
 * local time or UTC (default).
 */
function setTimeMethods() {
	var useUTC = defaultOptions.global.useUTC,
		GET = useUTC ? 'getUTC' : 'get',
		SET = useUTC ? 'setUTC' : 'set';


	timezoneOffset = ((useUTC && defaultOptions.global.timezoneOffset) || 0) * 60000;
	makeTime = useUTC ? Date.UTC : function (year, month, date, hours, minutes, seconds) {
		return new Date(
			year,
			month,
			pick(date, 1),
			pick(hours, 0),
			pick(minutes, 0),
			pick(seconds, 0)
		).getTime();
	};
	getMinutes =  GET + 'Minutes';
	getHours =    GET + 'Hours';
	getDay =      GET + 'Day';
	getDate =     GET + 'Date';
	getMonth =    GET + 'Month';
	getFullYear = GET + 'FullYear';
	setMinutes =  SET + 'Minutes';
	setHours =    SET + 'Hours';
	setDate =     SET + 'Date';
	setMonth =    SET + 'Month';
	setFullYear = SET + 'FullYear';

}

/**
 * Merge the default options with custom options and return the new options structure
 * @param {Object} options The new custom options
 */
function setOptions(options) {
	
	// Copy in the default options
	defaultOptions = merge(true, defaultOptions, options);
	
	// Apply UTC
	setTimeMethods();

	return defaultOptions;
}

/**
 * Get the updated default options. Until 3.0.7, merely exposing defaultOptions for outside modules
 * wasn't enough because the setOptions method created a new object.
 */
function getOptions() {
	return defaultOptions;
}


/**
 * Handle color operations. The object methods are chainable.
 * @param {String} input The input color in either rbga or hex format
 */
var rgbaRegEx = /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]?(?:\.[0-9]+)?)\s*\)/,
	hexRegEx = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
	rgbRegEx = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/;

var Color = function (input) {
	// declare variables
	var rgba = [], result, stops;

	/**
	 * Parse the input color to rgba array
	 * @param {String} input
	 */
	function init(input) {

		// Gradients
		if (input && input.stops) {
			stops = map(input.stops, function (stop) {
				return Color(stop[1]);
			});

		// Solid colors
		} else {
			// rgba
			result = rgbaRegEx.exec(input);
			if (result) {
				rgba = [pInt(result[1]), pInt(result[2]), pInt(result[3]), parseFloat(result[4], 10)];
			} else { 
				// hex
				result = hexRegEx.exec(input);
				if (result) {
					rgba = [pInt(result[1], 16), pInt(result[2], 16), pInt(result[3], 16), 1];
				} else {
					// rgb
					result = rgbRegEx.exec(input);
					if (result) {
						rgba = [pInt(result[1]), pInt(result[2]), pInt(result[3]), 1];
					}
				}
			}
		}		

	}
	/**
	 * Return the color a specified format
	 * @param {String} format
	 */
	function get(format) {
		var ret;

		if (stops) {
			ret = merge(input);
			ret.stops = [].concat(ret.stops);
			each(stops, function (stop, i) {
				ret.stops[i] = [ret.stops[i][0], stop.get(format)];
			});

		// it's NaN if gradient colors on a column chart
		} else if (rgba && !isNaN(rgba[0])) {
			if (format === 'rgb') {
				ret = 'rgb(' + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ')';
			} else if (format === 'a') {
				ret = rgba[3];
			} else {
				ret = 'rgba(' + rgba.join(',') + ')';
			}
		} else {
			ret = input;
		}
		return ret;
	}

	/**
	 * Brighten the color
	 * @param {Number} alpha
	 */
	function brighten(alpha) {
		if (stops) {
			each(stops, function (stop) {
				stop.brighten(alpha);
			});
		
		} else if (isNumber(alpha) && alpha !== 0) {
			var i;
			for (i = 0; i < 3; i++) {
				rgba[i] += pInt(alpha * 255);

				if (rgba[i] < 0) {
					rgba[i] = 0;
				}
				if (rgba[i] > 255) {
					rgba[i] = 255;
				}
			}
		}
		return this;
	}
	/**
	 * Set the color's opacity to a given alpha value
	 * @param {Number} alpha
	 */
	function setOpacity(alpha) {
		rgba[3] = alpha;
		return this;
	}

	// initialize: parse the input
	init(input);

	// public methods
	return {
		get: get,
		brighten: brighten,
		rgba: rgba,
		setOpacity: setOpacity
	};
};


/**
 * A wrapper object for SVG elements
 */
function SVGElement() {}

SVGElement.prototype = {
	/**
	 * Initialize the SVG renderer
	 * @param {Object} renderer
	 * @param {String} nodeName
	 */
	init: function (renderer, nodeName) {
		var wrapper = this;
		wrapper.element = nodeName === 'span' ?
			createElement(nodeName) :
			doc.createElementNS(SVG_NS, nodeName);
		wrapper.renderer = renderer;
		/**
		 * A collection of attribute setters. These methods, if defined, are called right before a certain
		 * attribute is set on an element wrapper. Returning false prevents the default attribute
		 * setter to run. Returning a value causes the default setter to set that value. Used in
		 * Renderer.label.
		 */
		wrapper.attrSetters = {};
	},
	/**
	 * Default base for animation
	 */
	opacity: 1,
	/**
	 * Animate a given attribute
	 * @param {Object} params
	 * @param {Number} options The same options as in jQuery animation
	 * @param {Function} complete Function to perform at the end of animation
	 */
	animate: function (params, options, complete) {
		var animOptions = pick(options, globalAnimation, true);
		stop(this); // stop regardless of animation actually running, or reverting to .attr (#607)
		if (animOptions) {
			animOptions = merge(animOptions);
			if (complete) { // allows using a callback with the global animation without overwriting it
				animOptions.complete = complete;
			}
			animate(this, params, animOptions);
		} else {
			this.attr(params);
			if (complete) {
				complete();
			}
		}
	},
	/**
	 * Set or get a given attribute
	 * @param {Object|String} hash
	 * @param {Mixed|Undefined} val
	 */
	attr: function (hash, val) {
		var wrapper = this,
			key,
			value,
			result,
			i,
			child,
			element = wrapper.element,
			nodeName = element.nodeName.toLowerCase(), // Android2 requires lower for "text"
			renderer = wrapper.renderer,
			skipAttr,
			titleNode,
			attrSetters = wrapper.attrSetters,
			shadows = wrapper.shadows,
			hasSetSymbolSize,
			doTransform,
			ret = wrapper;

		// single key-value pair
		if (isString(hash) && defined(val)) {
			key = hash;
			hash = {};
			hash[key] = val;
		}

		// used as a getter: first argument is a string, second is undefined
		if (isString(hash)) {
			key = hash;
			if (nodeName === 'circle') {
				key = { x: 'cx', y: 'cy' }[key] || key;
			} else if (key === 'strokeWidth') {
				key = 'stroke-width';
			}
			ret = attr(element, key) || wrapper[key] || 0;
			if (key !== 'd' && key !== 'visibility' && key !== 'fill') { // 'd' is string in animation step
				ret = parseFloat(ret);
			}

		// setter
		} else {

			for (key in hash) {
				skipAttr = false; // reset
				value = hash[key];

				// check for a specific attribute setter
				result = attrSetters[key] && attrSetters[key].call(wrapper, value, key);

				if (result !== false) {
					if (result !== UNDEFINED) {
						value = result; // the attribute setter has returned a new value to set
					}


					// paths
					if (key === 'd') {
						if (value && value.join) { // join path
							value = value.join(' ');
						}
						if (/(NaN| {2}|^$)/.test(value)) {
							value = 'M 0 0';
						}
						//wrapper.d = value; // shortcut for animations

					// update child tspans x values
					} else if (key === 'x' && nodeName === 'text') {
						for (i = 0; i < element.childNodes.length; i++) {
							child = element.childNodes[i];
							// if the x values are equal, the tspan represents a linebreak
							if (attr(child, 'x') === attr(element, 'x')) {
								//child.setAttribute('x', value);
								attr(child, 'x', value);
							}
						}

					} else if (wrapper.rotation && (key === 'x' || key === 'y')) {
						doTransform = true;

					// apply gradients
					} else if (key === 'fill') {
						value = renderer.color(value, element, key);

					// circle x and y
					} else if (nodeName === 'circle' && (key === 'x' || key === 'y')) {
						key = { x: 'cx', y: 'cy' }[key] || key;

					// rectangle border radius
					} else if (nodeName === 'rect' && key === 'r') {
						attr(element, {
							rx: value,
							ry: value
						});
						skipAttr = true;

					// translation and text rotation
					} else if (key === 'translateX' || key === 'translateY' || key === 'rotation' ||
							key === 'verticalAlign' || key === 'scaleX' || key === 'scaleY') {
						doTransform = true;
						skipAttr = true;

					// apply opacity as subnode (required by legacy WebKit and Batik)
					} else if (key === 'stroke') {
						value = renderer.color(value, element, key);

					// emulate VML's dashstyle implementation
					} else if (key === 'dashstyle') {
						key = 'stroke-dasharray';
						value = value && value.toLowerCase();
						if (value === 'solid') {
							value = NONE;
						} else if (value) {
							value = value
								.replace('shortdashdotdot', '3,1,1,1,1,1,')
								.replace('shortdashdot', '3,1,1,1')
								.replace('shortdot', '1,1,')
								.replace('shortdash', '3,1,')
								.replace('longdash', '8,3,')
								.replace(/dot/g, '1,3,')
								.replace('dash', '4,3,')
								.replace(/,$/, '')
								.split(','); // ending comma

							i = value.length;
							while (i--) {
								value[i] = pInt(value[i]) * pick(hash['stroke-width'], wrapper['stroke-width']);
							}
							value = value.join(',');
						}

					// IE9/MooTools combo: MooTools returns objects instead of numbers and IE9 Beta 2
					// is unable to cast them. Test again with final IE9.
					} else if (key === 'width') {
						value = pInt(value);

					// Text alignment
					} else if (key === 'align') {
						key = 'text-anchor';
						value = { left: 'start', center: 'middle', right: 'end' }[value];

					// Title requires a subnode, #431
					} else if (key === 'title') {
						titleNode = element.getElementsByTagName('title')[0];
						if (!titleNode) {
							titleNode = doc.createElementNS(SVG_NS, 'title');
							element.appendChild(titleNode);
						}
						titleNode.textContent = value;
					}

					// jQuery animate changes case
					if (key === 'strokeWidth') {
						key = 'stroke-width';
					}

					// In Chrome/Win < 6 as well as Batik, the stroke attribute can't be set when the stroke-
					// width is 0. #1369
					if (key === 'stroke-width' || key === 'stroke') {
						wrapper[key] = value;
						// Only apply the stroke attribute if the stroke width is defined and larger than 0
						if (wrapper.stroke && wrapper['stroke-width']) {
							attr(element, 'stroke', wrapper.stroke);
							attr(element, 'stroke-width', wrapper['stroke-width']);
							wrapper.hasStroke = true;
						} else if (key === 'stroke-width' && value === 0 && wrapper.hasStroke) {
							element.removeAttribute('stroke');
							wrapper.hasStroke = false;
						}
						skipAttr = true;
					}

					// symbols
					if (wrapper.symbolName && /^(x|y|width|height|r|start|end|innerR|anchorX|anchorY)/.test(key)) {


						if (!hasSetSymbolSize) {
							wrapper.symbolAttr(hash);
							hasSetSymbolSize = true;
						}
						skipAttr = true;
					}

					// let the shadow follow the main element
					if (shadows && /^(width|height|visibility|x|y|d|transform|cx|cy|r)$/.test(key)) {
						i = shadows.length;
						while (i--) {
							attr(
								shadows[i],
								key,
								key === 'height' ?
									mathMax(value - (shadows[i].cutHeight || 0), 0) :
									value
							);
						}
					}

					// validate heights
					if ((key === 'width' || key === 'height') && nodeName === 'rect' && value < 0) {
						value = 0;
					}

					// Record for animation and quick access without polling the DOM
					wrapper[key] = value;


					if (key === 'text') {
						// Delete bBox memo when the text changes
						if (value !== wrapper.textStr) {
							delete wrapper.bBox;
						}
						wrapper.textStr = value;
						if (wrapper.added) {
							renderer.buildText(wrapper);
						}
					} else if (!skipAttr) {
						attr(element, key, value);
					}

				}

			}

			// Update transform. Do this outside the loop to prevent redundant updating for batch setting
			// of attributes.
			if (doTransform) {
				wrapper.updateTransform();
			}

		}

		return ret;
	},


	/**
	 * Add a class name to an element
	 */
	addClass: function (className) {
		var element = this.element,
			currentClassName = attr(element, 'class') || '';

		if (currentClassName.indexOf(className) === -1) {
			attr(element, 'class', currentClassName + ' ' + className);
		}
		return this;
	},
	/* hasClass and removeClass are not (yet) needed
	hasClass: function (className) {
		return attr(this.element, 'class').indexOf(className) !== -1;
	},
	removeClass: function (className) {
		attr(this.element, 'class', attr(this.element, 'class').replace(className, ''));
		return this;
	},
	*/

	/**
	 * If one of the symbol size affecting parameters are changed,
	 * check all the others only once for each call to an element's
	 * .attr() method
	 * @param {Object} hash
	 */
	symbolAttr: function (hash) {
		var wrapper = this;

		each(['x', 'y', 'r', 'start', 'end', 'width', 'height', 'innerR', 'anchorX', 'anchorY'], function (key) {
			wrapper[key] = pick(hash[key], wrapper[key]);
		});

		wrapper.attr({
			d: wrapper.renderer.symbols[wrapper.symbolName](
				wrapper.x,
				wrapper.y,
				wrapper.width,
				wrapper.height,
				wrapper
			)
		});
	},

	/**
	 * Apply a clipping path to this object
	 * @param {String} id
	 */
	clip: function (clipRect) {
		return this.attr('clip-path', clipRect ? 'url(' + this.renderer.url + '#' + clipRect.id + ')' : NONE);
	},

	/**
	 * Calculate the coordinates needed for drawing a rectangle crisply and return the
	 * calculated attributes
	 * @param {Number} strokeWidth
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} width
	 * @param {Number} height
	 */
	crisp: function (strokeWidth, x, y, width, height) {

		var wrapper = this,
			key,
			attribs = {},
			values = {},
			normalizer;

		strokeWidth = strokeWidth || wrapper.strokeWidth || (wrapper.attr && wrapper.attr('stroke-width')) || 0;
		normalizer = mathRound(strokeWidth) % 2 / 2; // mathRound because strokeWidth can sometimes have roundoff errors

		// normalize for crisp edges
		values.x = mathFloor(x || wrapper.x || 0) + normalizer;
		values.y = mathFloor(y || wrapper.y || 0) + normalizer;
		values.width = mathFloor((width || wrapper.width || 0) - 2 * normalizer);
		values.height = mathFloor((height || wrapper.height || 0) - 2 * normalizer);
		values.strokeWidth = strokeWidth;

		for (key in values) {
			if (wrapper[key] !== values[key]) { // only set attribute if changed
				wrapper[key] = attribs[key] = values[key];
			}
		}

		return attribs;
	},

	/**
	 * Set styles for the element
	 * @param {Object} styles
	 */
	css: function (styles) {
		/*jslint unparam: true*//* allow unused param a in the regexp function below */
		var elemWrapper = this,
			elem = elemWrapper.element,
			textWidth = elemWrapper.textWidth = styles && styles.width && elem.nodeName.toLowerCase() === 'text' && pInt(styles.width),
			n,
			serializedCss = '',
			hyphenate = function (a, b) { return '-' + b.toLowerCase(); };
		/*jslint unparam: false*/

		// convert legacy
		if (styles && styles.color) {
			styles.fill = styles.color;
		}

		// Merge the new styles with the old ones
		styles = extend(
			elemWrapper.styles,
			styles
		);

		// store object
		elemWrapper.styles = styles;

		if (textWidth) {
			delete styles.width;
		}

		// serialize and set style attribute
		if (isIE && !hasSVG) {
			css(elemWrapper.element, styles);
		} else {
			for (n in styles) {
				serializedCss += n.replace(/([A-Z])/g, hyphenate) + ':' + styles[n] + ';';
			}
			attr(elem, 'style', serializedCss); // #1881
		}


		// re-build text
		if (textWidth && elemWrapper.added) {
			elemWrapper.renderer.buildText(elemWrapper);
		}

		return elemWrapper;
	},

	/**
	 * Add an event listener
	 * @param {String} eventType
	 * @param {Function} handler
	 */
	on: function (eventType, handler) {
		var svgElement = this,
			element = svgElement.element;
		
		// touch
		if (hasTouch && eventType === 'click') {
			element.ontouchstart = function (e) {			
				svgElement.touchEventFired = Date.now();				
				e.preventDefault();
				handler.call(element, e);
			};
			element.onclick = function (e) {												
				if (userAgent.indexOf('Android') === -1 || Date.now() - (svgElement.touchEventFired || 0) > 1100) { // #2269
					handler.call(element, e);
				}
			};			
		} else {
			// simplest possible event model for internal use
			element['on' + eventType] = handler;
		}
		return this;
	},

	/**
	 * Set the coordinates needed to draw a consistent radial gradient across
	 * pie slices regardless of positioning inside the chart. The format is
	 * [centerX, centerY, diameter] in pixels.
	 */
	setRadialReference: function (coordinates) {
		this.element.radialReference = coordinates;
		return this;
	},

	/**
	 * Move an object and its children by x and y values
	 * @param {Number} x
	 * @param {Number} y
	 */
	translate: function (x, y) {
		return this.attr({
			translateX: x,
			translateY: y
		});
	},

	/**
	 * Invert a group, rotate and flip
	 */
	invert: function () {
		var wrapper = this;
		wrapper.inverted = true;
		wrapper.updateTransform();
		return wrapper;
	},

	/**
	 * Private method to update the transform attribute based on internal
	 * properties
	 */
	updateTransform: function () {
		var wrapper = this,
			translateX = wrapper.translateX || 0,
			translateY = wrapper.translateY || 0,
			scaleX = wrapper.scaleX,
			scaleY = wrapper.scaleY,
			inverted = wrapper.inverted,
			rotation = wrapper.rotation,
			transform;

		// flipping affects translate as adjustment for flipping around the group's axis
		if (inverted) {
			translateX += wrapper.attr('width');
			translateY += wrapper.attr('height');
		}

		// Apply translate. Nearly all transformed elements have translation, so instead
		// of checking for translate = 0, do it always (#1767, #1846).
		transform = ['translate(' + translateX + ',' + translateY + ')'];

		// apply rotation
		if (inverted) {
			transform.push('rotate(90) scale(-1,1)');
		} else if (rotation) { // text rotation
			transform.push('rotate(' + rotation + ' ' + (wrapper.x || 0) + ' ' + (wrapper.y || 0) + ')');
		}

		// apply scale
		if (defined(scaleX) || defined(scaleY)) {
			transform.push('scale(' + pick(scaleX, 1) + ' ' + pick(scaleY, 1) + ')');
		}

		if (transform.length) {
			attr(wrapper.element, 'transform', transform.join(' '));
		}
	},
	/**
	 * Bring the element to the front
	 */
	toFront: function () {
		var element = this.element;
		element.parentNode.appendChild(element);
		return this;
	},


	/**
	 * Break down alignment options like align, verticalAlign, x and y
	 * to x and y relative to the chart.
	 *
	 * @param {Object} alignOptions
	 * @param {Boolean} alignByTranslate
	 * @param {String[Object} box The box to align to, needs a width and height. When the
	 *        box is a string, it refers to an object in the Renderer. For example, when
	 *        box is 'spacingBox', it refers to Renderer.spacingBox which holds width, height
	 *        x and y properties.
	 *
	 */
	align: function (alignOptions, alignByTranslate, box) {
		var align,
			vAlign,
			x,
			y,
			attribs = {},
			alignTo,
			renderer = this.renderer,
			alignedObjects = renderer.alignedObjects;

		// First call on instanciate
		if (alignOptions) {
			this.alignOptions = alignOptions;
			this.alignByTranslate = alignByTranslate;
			if (!box || isString(box)) { // boxes other than renderer handle this internally
				this.alignTo = alignTo = box || 'renderer';
				erase(alignedObjects, this); // prevent duplicates, like legendGroup after resize
				alignedObjects.push(this);
				box = null; // reassign it below
			}

		// When called on resize, no arguments are supplied
		} else {
			alignOptions = this.alignOptions;
			alignByTranslate = this.alignByTranslate;
			alignTo = this.alignTo;
		}

		box = pick(box, renderer[alignTo], renderer);

		// Assign variables
		align = alignOptions.align;
		vAlign = alignOptions.verticalAlign;
		x = (box.x || 0) + (alignOptions.x || 0); // default: left align
		y = (box.y || 0) + (alignOptions.y || 0); // default: top align

		// Align
		if (align === 'right' || align === 'center') {
			x += (box.width - (alignOptions.width || 0)) /
					{ right: 1, center: 2 }[align];
		}
		attribs[alignByTranslate ? 'translateX' : 'x'] = mathRound(x);


		// Vertical align
		if (vAlign === 'bottom' || vAlign === 'middle') {
			y += (box.height - (alignOptions.height || 0)) /
					({ bottom: 1, middle: 2 }[vAlign] || 1);

		}
		attribs[alignByTranslate ? 'translateY' : 'y'] = mathRound(y);

		// Animate only if already placed
		this[this.placed ? 'animate' : 'attr'](attribs);
		this.placed = true;
		this.alignAttr = attribs;

		return this;
	},

	/**
	 * Get the bounding box (width, height, x and y) for the element
	 */
	getBBox: function () {
		var wrapper = this,
			bBox = wrapper.bBox,
			renderer = wrapper.renderer,
			width,
			height,
			rotation = wrapper.rotation,
			element = wrapper.element,
			styles = wrapper.styles,
			rad = rotation * deg2rad,
			textStr = wrapper.textStr,
			numKey;

		// Since numbers are monospaced, and numerical labels appear a lot in a chart,
		// we assume that a label of n characters has the same bounding box as others 
		// of the same length.
		if (textStr === '' || numRegex.test(textStr)) {
			numKey = textStr.length + '|' + styles.fontSize + '|' + styles.fontFamily;
			bBox = renderer.cache[numKey];
		}

		// No cache found
		if (!bBox) {

			// SVG elements
			if (element.namespaceURI === SVG_NS || renderer.forExport) {
				try { // Fails in Firefox if the container has display: none.

					bBox = element.getBBox ?
						// SVG: use extend because IE9 is not allowed to change width and height in case
						// of rotation (below)
						extend({}, element.getBBox()) :
						// Canvas renderer and legacy IE in export mode
						{
							width: element.offsetWidth,
							height: element.offsetHeight
						};
				} catch (e) {}

				// If the bBox is not set, the try-catch block above failed. The other condition
				// is for Opera that returns a width of -Infinity on hidden elements.
				if (!bBox || bBox.width < 0) {
					bBox = { width: 0, height: 0 };
				}


			// VML Renderer or useHTML within SVG
			} else {

				bBox = wrapper.htmlGetBBox();

			}

			// True SVG elements as well as HTML elements in modern browsers using the .useHTML option
			// need to compensated for rotation
			if (renderer.isSVG) {
				width = bBox.width;
				height = bBox.height;

				// Workaround for wrong bounding box in IE9 and IE10 (#1101, #1505, #1669, #2568)
				if (isIE && styles && styles.fontSize === '11px' && height.toPrecision(3) === '16.9') {
					bBox.height = height = 14;
				}

				// Adjust for rotated text
				if (rotation) {
					bBox.width = mathAbs(height * mathSin(rad)) + mathAbs(width * mathCos(rad));
					bBox.height = mathAbs(height * mathCos(rad)) + mathAbs(width * mathSin(rad));
				}
			}

			// Cache it
			wrapper.bBox = bBox;
			if (numKey) {
				renderer.cache[numKey] = bBox;
			}
		}
		return bBox;
	},

	/**
	 * Show the element
	 */
	show: function () {
		return this.attr({ visibility: VISIBLE });
	},

	/**
	 * Hide the element
	 */
	hide: function () {
		return this.attr({ visibility: HIDDEN });
	},

	fadeOut: function (duration) {
		var elemWrapper = this;
		elemWrapper.animate({
			opacity: 0
		}, {
			duration: duration || 150,
			complete: function () {
				elemWrapper.hide();
			}
		});
	},

	/**
	 * Add the element
	 * @param {Object|Undefined} parent Can be an element, an element wrapper or undefined
	 *    to append the element to the renderer.box.
	 */
	add: function (parent) {

		var renderer = this.renderer,
			parentWrapper = parent || renderer,
			parentNode = parentWrapper.element || renderer.box,
			childNodes = parentNode.childNodes,
			element = this.element,
			zIndex = attr(element, 'zIndex'),
			otherElement,
			otherZIndex,
			i,
			inserted;

		if (parent) {
			this.parentGroup = parent;
		}

		// mark as inverted
		this.parentInverted = parent && parent.inverted;

		// build formatted text
		if (this.textStr !== undefined) {
			renderer.buildText(this);
		}

		// mark the container as having z indexed children
		if (zIndex) {
			parentWrapper.handleZ = true;
			zIndex = pInt(zIndex);
		}

		// insert according to this and other elements' zIndex
		if (parentWrapper.handleZ) { // this element or any of its siblings has a z index
			for (i = 0; i < childNodes.length; i++) {
				otherElement = childNodes[i];
				otherZIndex = attr(otherElement, 'zIndex');
				if (otherElement !== element && (
						// insert before the first element with a higher zIndex
						pInt(otherZIndex) > zIndex ||
						// if no zIndex given, insert before the first element with a zIndex
						(!defined(zIndex) && defined(otherZIndex))

						)) {
					parentNode.insertBefore(element, otherElement);
					inserted = true;
					break;
				}
			}
		}

		// default: append at the end
		if (!inserted) {
			parentNode.appendChild(element);
		}

		// mark as added
		this.added = true;

		// fire an event for internal hooks
		fireEvent(this, 'add');

		return this;
	},

	/**
	 * Removes a child either by removeChild or move to garbageBin.
	 * Issue 490; in VML removeChild results in Orphaned nodes according to sIEve, discardElement does not.
	 */
	safeRemoveChild: function (element) {
		var parentNode = element.parentNode;
		if (parentNode) {
			parentNode.removeChild(element);
		}
	},

	/**
	 * Destroy the element and element wrapper
	 */
	destroy: function () {
		var wrapper = this,
			element = wrapper.element || {},
			shadows = wrapper.shadows,
			parentToClean = wrapper.renderer.isSVG && element.nodeName === 'SPAN' && wrapper.parentGroup,
			grandParent,
			key,
			i;

		// remove events
		element.onclick = element.onmouseout = element.onmouseover = element.onmousemove = element.point = null;
		stop(wrapper); // stop running animations

		if (wrapper.clipPath) {
			wrapper.clipPath = wrapper.clipPath.destroy();
		}

		// Destroy stops in case this is a gradient object
		if (wrapper.stops) {
			for (i = 0; i < wrapper.stops.length; i++) {
				wrapper.stops[i] = wrapper.stops[i].destroy();
			}
			wrapper.stops = null;
		}

		// remove element
		wrapper.safeRemoveChild(element);

		// destroy shadows
		if (shadows) {
			each(shadows, function (shadow) {
				wrapper.safeRemoveChild(shadow);
			});
		}

		// In case of useHTML, clean up empty containers emulating SVG groups (#1960, #2393).
		while (parentToClean && parentToClean.div.childNodes.length === 0) {
			grandParent = parentToClean.parentGroup;
			wrapper.safeRemoveChild(parentToClean.div);
			delete parentToClean.div;
			parentToClean = grandParent;
		}

		// remove from alignObjects
		if (wrapper.alignTo) {
			erase(wrapper.renderer.alignedObjects, wrapper);
		}

		for (key in wrapper) {
			delete wrapper[key];
		}

		return null;
	},

	/**
	 * Add a shadow to the element. Must be done after the element is added to the DOM
	 * @param {Boolean|Object} shadowOptions
	 */
	shadow: function (shadowOptions, group, cutOff) {
		var shadows = [],
			i,
			shadow,
			element = this.element,
			strokeWidth,
			shadowWidth,
			shadowElementOpacity,

			// compensate for inverted plot area
			transform;


		if (shadowOptions) {
			shadowWidth = pick(shadowOptions.width, 3);
			shadowElementOpacity = (shadowOptions.opacity || 0.15) / shadowWidth;
			transform = this.parentInverted ?
				'(-1,-1)' :
				'(' + pick(shadowOptions.offsetX, 1) + ', ' + pick(shadowOptions.offsetY, 1) + ')';
			for (i = 1; i <= shadowWidth; i++) {
				shadow = element.cloneNode(0);
				strokeWidth = (shadowWidth * 2) + 1 - (2 * i);
				attr(shadow, {
					'isShadow': 'true',
					'stroke': shadowOptions.color || 'black',
					'stroke-opacity': shadowElementOpacity * i,
					'stroke-width': strokeWidth,
					'transform': 'translate' + transform,
					'fill': NONE
				});
				if (cutOff) {
					attr(shadow, 'height', mathMax(attr(shadow, 'height') - strokeWidth, 0));
					shadow.cutHeight = strokeWidth;
				}

				if (group) {
					group.element.appendChild(shadow);
				} else {
					element.parentNode.insertBefore(shadow, element);
				}

				shadows.push(shadow);
			}

			this.shadows = shadows;
		}
		return this;

	}
};


/**
 * The default SVG renderer
 */
var SVGRenderer = function () {
	this.init.apply(this, arguments);
};
SVGRenderer.prototype = {
	Element: SVGElement,

	/**
	 * Initialize the SVGRenderer
	 * @param {Object} container
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Boolean} forExport
	 */
	init: function (container, width, height, forExport) {
		var renderer = this,
			loc = location,
			boxWrapper,
			element,
			desc;

		boxWrapper = renderer.createElement('svg')
			.attr({
				version: '1.1'
			});
		element = boxWrapper.element;
		container.appendChild(element);

		// For browsers other than IE, add the namespace attribute (#1978)
		if (container.innerHTML.indexOf('xmlns') === -1) {
			attr(element, 'xmlns', SVG_NS);
		}

		// object properties
		renderer.isSVG = true;
		renderer.box = element;
		renderer.boxWrapper = boxWrapper;
		renderer.alignedObjects = [];

		// Page url used for internal references. #24, #672, #1070
		renderer.url = (isFirefox || isWebKit) && doc.getElementsByTagName('base').length ?
			loc.href
				.replace(/#.*?$/, '') // remove the hash
				.replace(/([\('\)])/g, '\\$1') // escape parantheses and quotes
				.replace(/ /g, '%20') : // replace spaces (needed for Safari only)
			'';

		// Add description
		desc = this.createElement('desc').add();
		desc.element.appendChild(doc.createTextNode('Created with ' + PRODUCT + ' ' + VERSION));


		renderer.defs = this.createElement('defs').add();
		renderer.forExport = forExport;
		renderer.gradients = {}; // Object where gradient SvgElements are stored
		renderer.cache = {}; // Cache for numerical bounding boxes

		renderer.setSize(width, height, false);



		// Issue 110 workaround:
		// In Firefox, if a div is positioned by percentage, its pixel position may land
		// between pixels. The container itself doesn't display this, but an SVG element
		// inside this container will be drawn at subpixel precision. In order to draw
		// sharp lines, this must be compensated for. This doesn't seem to work inside
		// iframes though (like in jsFiddle).
		var subPixelFix, rect;
		if (isFirefox && container.getBoundingClientRect) {
			renderer.subPixelFix = subPixelFix = function () {
				css(container, { left: 0, top: 0 });
				rect = container.getBoundingClientRect();
				css(container, {
					left: (mathCeil(rect.left) - rect.left) + PX,
					top: (mathCeil(rect.top) - rect.top) + PX
				});
			};

			// run the fix now
			subPixelFix();

			// run it on resize
			addEvent(win, 'resize', subPixelFix);
		}
	},

	/**
	 * Detect whether the renderer is hidden. This happens when one of the parent elements
	 * has display: none. #608.
	 */
	isHidden: function () {
		return !this.boxWrapper.getBBox().width;
	},

	/**
	 * Destroys the renderer and its allocated members.
	 */
	destroy: function () {
		var renderer = this,
			rendererDefs = renderer.defs;
		renderer.box = null;
		renderer.boxWrapper = renderer.boxWrapper.destroy();

		// Call destroy on all gradient elements
		destroyObjectProperties(renderer.gradients || {});
		renderer.gradients = null;

		// Defs are null in VMLRenderer
		// Otherwise, destroy them here.
		if (rendererDefs) {
			renderer.defs = rendererDefs.destroy();
		}

		// Remove sub pixel fix handler
		// We need to check that there is a handler, otherwise all functions that are registered for event 'resize' are removed
		// See issue #982
		if (renderer.subPixelFix) {
			removeEvent(win, 'resize', renderer.subPixelFix);
		}

		renderer.alignedObjects = null;

		return null;
	},

	/**
	 * Create a wrapper for an SVG element
	 * @param {Object} nodeName
	 */
	createElement: function (nodeName) {
		var wrapper = new this.Element();
		wrapper.init(this, nodeName);
		return wrapper;
	},

	/**
	 * Dummy function for use in canvas renderer
	 */
	draw: function () {},

	/**
	 * Parse a simple HTML string into SVG tspans
	 *
	 * @param {Object} textNode The parent text SVG node
	 */
	buildText: function (wrapper) {
		var textNode = wrapper.element,
			renderer = this,
			forExport = renderer.forExport,
			lines = pick(wrapper.textStr, '').toString()
				.replace(/<(b|strong)>/g, '<span style="font-weight:bold">')
				.replace(/<(i|em)>/g, '<span style="font-style:italic">')
				.replace(/<a/g, '<span')
				.replace(/<\/(b|strong|i|em|a)>/g, '</span>')
				.split(/<br.*?>/g),
			childNodes = textNode.childNodes,
			styleRegex = /style="([^"]+)"/,
			hrefRegex = /href="(http[^"]+)"/,
			parentX = attr(textNode, 'x'),
			textStyles = wrapper.styles,
			width = wrapper.textWidth,
			textLineHeight = textStyles && textStyles.lineHeight,
			i = childNodes.length,
			getLineHeight = function (tspan) {
				return textLineHeight ? 
					pInt(textLineHeight) :
					renderer.fontMetrics(
						/px$/.test(tspan && tspan.style.fontSize) ?
							tspan.style.fontSize :
							(textStyles.fontSize || 11)
					).h;
			};

		/// remove old text
		while (i--) {
			textNode.removeChild(childNodes[i]);
		}

		if (width && !wrapper.added) {
			this.box.appendChild(textNode); // attach it to the DOM to read offset width
		}

		// remove empty line at end
		if (lines[lines.length - 1] === '') {
			lines.pop();
		}

		// build the lines
		each(lines, function (line, lineNo) {
			var spans, spanNo = 0;

			line = line.replace(/<span/g, '|||<span').replace(/<\/span>/g, '</span>|||');
			spans = line.split('|||');

			each(spans, function (span) {
				if (span !== '' || spans.length === 1) {
					var attributes = {},
						tspan = doc.createElementNS(SVG_NS, 'tspan'),
						spanStyle; // #390
					if (styleRegex.test(span)) {
						spanStyle = span.match(styleRegex)[1].replace(/(;| |^)color([ :])/, '$1fill$2');
						attr(tspan, 'style', spanStyle);
					}
					if (hrefRegex.test(span) && !forExport) { // Not for export - #1529
						attr(tspan, 'onclick', 'location.href=\"' + span.match(hrefRegex)[1] + '\"');
						css(tspan, { cursor: 'pointer' });
					}

					span = (span.replace(/<(.|\n)*?>/g, '') || ' ')
						.replace(/&lt;/g, '<')
						.replace(/&gt;/g, '>');

					// Nested tags aren't supported, and cause crash in Safari (#1596)
					if (span !== ' ') {

						// add the text node
						tspan.appendChild(doc.createTextNode(span));

						if (!spanNo) { // first span in a line, align it to the left
							attributes.x = parentX;
						} else {
							attributes.dx = 0; // #16
						}

						// add attributes
						attr(tspan, attributes);

						// first span on subsequent line, add the line height
						if (!spanNo && lineNo) {

							// allow getting the right offset height in exporting in IE
							if (!hasSVG && forExport) {
								css(tspan, { display: 'block' });
							}

							// Set the line height based on the font size of either
							// the text element or the tspan element
							attr(
								tspan,
								'dy',
								getLineHeight(tspan),
								// Safari 6.0.2 - too optimized for its own good (#1539)
								// TODO: revisit this with future versions of Safari
								isWebKit && tspan.offsetHeight
							);
						}

						// Append it
						textNode.appendChild(tspan);

						spanNo++;

						// check width and apply soft breaks
						if (width) {
							var words = span.replace(/([^\^])-/g, '$1- ').split(' '), // #1273
								hasWhiteSpace = words.length > 1 && textStyles.whiteSpace !== 'nowrap',
								tooLong,
								actualWidth,
								clipHeight = wrapper._clipHeight,
								rest = [],
								dy = getLineHeight(),
								softLineNo = 1,
								bBox;

							while (hasWhiteSpace && (words.length || rest.length)) {
								delete wrapper.bBox; // delete cache
								bBox = wrapper.getBBox();
								actualWidth = bBox.width;

								// Old IE cannot measure the actualWidth for SVG elements (#2314)
								if (!hasSVG && renderer.forExport) {
									actualWidth = renderer.measureSpanWidth(tspan.firstChild.data, wrapper.styles);
								}

								tooLong = actualWidth > width;
								if (!tooLong || words.length === 1) { // new line needed
									words = rest;
									rest = [];
									if (words.length) {
										softLineNo++;

										if (clipHeight && softLineNo * dy > clipHeight) {
											words = ['...'];
											wrapper.attr('title', wrapper.textStr);
										} else {

											tspan = doc.createElementNS(SVG_NS, 'tspan');
											attr(tspan, {
												dy: dy,
												x: parentX
											});
											if (spanStyle) { // #390
												attr(tspan, 'style', spanStyle);
											}
											textNode.appendChild(tspan);

											if (actualWidth > width) { // a single word is pressing it out
												width = actualWidth;
											}
										}
									}
								} else { // append to existing line tspan
									tspan.removeChild(tspan.firstChild);
									rest.unshift(words.pop());
								}
								if (words.length) {
									tspan.appendChild(doc.createTextNode(words.join(' ').replace(/- /g, '-')));
								}
							}
						}
					}
				}
			});
		});
	},

	/**
	 * Create a button with preset states
	 * @param {String} text
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Function} callback
	 * @param {Object} normalState
	 * @param {Object} hoverState
	 * @param {Object} pressedState
	 */
	button: function (text, x, y, callback, normalState, hoverState, pressedState, disabledState, shape) {
		var label = this.label(text, x, y, shape, null, null, null, null, 'button'),
			curState = 0,
			stateOptions,
			stateStyle,
			normalStyle,
			hoverStyle,
			pressedStyle,
			disabledStyle,
			STYLE = 'style',
			verticalGradient = { x1: 0, y1: 0, x2: 0, y2: 1 };

		// Normal state - prepare the attributes
		normalState = merge({
			'stroke-width': 1,
			stroke: '#CCCCCC',
			fill: {
				linearGradient: verticalGradient,
				stops: [
					[0, '#FEFEFE'],
					[1, '#F6F6F6']
				]
			},
			r: 2,
			padding: 5,
			style: {
				color: 'black'
			}
		}, normalState);
		normalStyle = normalState[STYLE];
		delete normalState[STYLE];

		// Hover state
		hoverState = merge(normalState, {
			stroke: '#68A',
			fill: {
				linearGradient: verticalGradient,
				stops: [
					[0, '#FFF'],
					[1, '#ACF']
				]
			}
		}, hoverState);
		hoverStyle = hoverState[STYLE];
		delete hoverState[STYLE];

		// Pressed state
		pressedState = merge(normalState, {
			stroke: '#68A',
			fill: {
				linearGradient: verticalGradient,
				stops: [
					[0, '#9BD'],
					[1, '#CDF']
				]
			}
		}, pressedState);
		pressedStyle = pressedState[STYLE];
		delete pressedState[STYLE];

		// Disabled state
		disabledState = merge(normalState, {
			style: {
				color: '#CCC'
			}
		}, disabledState);
		disabledStyle = disabledState[STYLE];
		delete disabledState[STYLE];

		// Add the events. IE9 and IE10 need mouseover and mouseout to funciton (#667).
		addEvent(label.element, isIE ? 'mouseover' : 'mouseenter', function () {
			if (curState !== 3) {
				label.attr(hoverState)
					.css(hoverStyle);
			}
		});
		addEvent(label.element, isIE ? 'mouseout' : 'mouseleave', function () {
			if (curState !== 3) {
				stateOptions = [normalState, hoverState, pressedState][curState];
				stateStyle = [normalStyle, hoverStyle, pressedStyle][curState];
				label.attr(stateOptions)
					.css(stateStyle);
			}
		});

		label.setState = function (state) {
			label.state = curState = state;
			if (!state) {
				label.attr(normalState)
					.css(normalStyle);
			} else if (state === 2) {
				label.attr(pressedState)
					.css(pressedStyle);
			} else if (state === 3) {
				label.attr(disabledState)
					.css(disabledStyle);
			}
		};

		return label
			.on('click', function () {
				if (curState !== 3) {
					callback.call(label);
				}
			})
			.attr(normalState)
			.css(extend({ cursor: 'default' }, normalStyle));
	},

	/**
	 * Make a straight line crisper by not spilling out to neighbour pixels
	 * @param {Array} points
	 * @param {Number} width
	 */
	crispLine: function (points, width) {
		// points format: [M, 0, 0, L, 100, 0]
		// normalize to a crisp line
		if (points[1] === points[4]) {
			// Substract due to #1129. Now bottom and left axis gridlines behave the same.
			points[1] = points[4] = mathRound(points[1]) - (width % 2 / 2);
		}
		if (points[2] === points[5]) {
			points[2] = points[5] = mathRound(points[2]) + (width % 2 / 2);
		}
		return points;
	},


	/**
	 * Draw a path
	 * @param {Array} path An SVG path in array form
	 */
	path: function (path) {
		var attr = {
			fill: NONE
		};
		if (isArray(path)) {
			attr.d = path;
		} else if (isObject(path)) { // attributes
			extend(attr, path);
		}
		return this.createElement('path').attr(attr);
	},

	/**
	 * Draw and return an SVG circle
	 * @param {Number} x The x position
	 * @param {Number} y The y position
	 * @param {Number} r The radius
	 */
	circle: function (x, y, r) {
		var attr = isObject(x) ?
			x :
			{
				x: x,
				y: y,
				r: r
			};

		return this.createElement('circle').attr(attr);
	},

	/**
	 * Draw and return an arc
	 * @param {Number} x X position
	 * @param {Number} y Y position
	 * @param {Number} r Radius
	 * @param {Number} innerR Inner radius like used in donut charts
	 * @param {Number} start Starting angle
	 * @param {Number} end Ending angle
	 */
	arc: function (x, y, r, innerR, start, end) {
		var arc;

		if (isObject(x)) {
			y = x.y;
			r = x.r;
			innerR = x.innerR;
			start = x.start;
			end = x.end;
			x = x.x;
		}

		// Arcs are defined as symbols for the ability to set
		// attributes in attr and animate
		arc = this.symbol('arc', x || 0, y || 0, r || 0, r || 0, {
			innerR: innerR || 0,
			start: start || 0,
			end: end || 0
		});
		arc.r = r; // #959
		return arc;
	},

	/**
	 * Draw and return a rectangle
	 * @param {Number} x Left position
	 * @param {Number} y Top position
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Number} r Border corner radius
	 * @param {Number} strokeWidth A stroke width can be supplied to allow crisp drawing
	 */
	rect: function (x, y, width, height, r, strokeWidth) {

		r = isObject(x) ? x.r : r;

		var wrapper = this.createElement('rect').attr({
				rx: r,
				ry: r,
				fill: NONE
			});
		return wrapper.attr(
				isObject(x) ?
					x :
					// do not crispify when an object is passed in (as in column charts)
					wrapper.crisp(strokeWidth, x, y, mathMax(width, 0), mathMax(height, 0))
			);
	},

	/**
	 * Resize the box and re-align all aligned elements
	 * @param {Object} width
	 * @param {Object} height
	 * @param {Boolean} animate
	 *
	 */
	setSize: function (width, height, animate) {
		var renderer = this,
			alignedObjects = renderer.alignedObjects,
			i = alignedObjects.length;

		renderer.width = width;
		renderer.height = height;

		renderer.boxWrapper[pick(animate, true) ? 'animate' : 'attr']({
			width: width,
			height: height
		});

		while (i--) {
			alignedObjects[i].align();
		}
	},

	/**
	 * Create a group
	 * @param {String} name The group will be given a class name of 'highcharts-{name}'.
	 *     This can be used for styling and scripting.
	 */
	g: function (name) {
		var elem = this.createElement('g');
		return defined(name) ? elem.attr({ 'class': PREFIX + name }) : elem;
	},

	/**
	 * Display an image
	 * @param {String} src
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} width
	 * @param {Number} height
	 */
	image: function (src, x, y, width, height) {
		var attribs = {
				preserveAspectRatio: NONE
			},
			elemWrapper;

		// optional properties
		if (arguments.length > 1) {
			extend(attribs, {
				x: x,
				y: y,
				width: width,
				height: height
			});
		}

		elemWrapper = this.createElement('image').attr(attribs);

		// set the href in the xlink namespace
		if (elemWrapper.element.setAttributeNS) {
			elemWrapper.element.setAttributeNS('http://www.w3.org/1999/xlink',
				'href', src);
		} else {
			// could be exporting in IE
			// using href throws "not supported" in ie7 and under, requries regex shim to fix later
			elemWrapper.element.setAttribute('hc-svg-href', src);
	}

		return elemWrapper;
	},

	/**
	 * Draw a symbol out of pre-defined shape paths from the namespace 'symbol' object.
	 *
	 * @param {Object} symbol
	 * @param {Object} x
	 * @param {Object} y
	 * @param {Object} radius
	 * @param {Object} options
	 */
	symbol: function (symbol, x, y, width, height, options) {

		var obj,

			// get the symbol definition function
			symbolFn = this.symbols[symbol],

			// check if there's a path defined for this symbol
			path = symbolFn && symbolFn(
				mathRound(x),
				mathRound(y),
				width,
				height,
				options
			),

			imageElement,
			imageRegex = /^url\((.*?)\)$/,
			imageSrc,
			imageSize,
			centerImage;

		if (path) {

			obj = this.path(path);
			// expando properties for use in animate and attr
			extend(obj, {
				symbolName: symbol,
				x: x,
				y: y,
				width: width,
				height: height
			});
			if (options) {
				extend(obj, options);
			}


		// image symbols
		} else if (imageRegex.test(symbol)) {

			// On image load, set the size and position
			centerImage = function (img, size) {
				if (img.element) { // it may be destroyed in the meantime (#1390)
					img.attr({
						width: size[0],
						height: size[1]
					});

					if (!img.alignByTranslate) { // #185
						img.translate(
							mathRound((width - size[0]) / 2), // #1378
							mathRound((height - size[1]) / 2)
						);
					}
				}
			};

			imageSrc = symbol.match(imageRegex)[1];
			imageSize = symbolSizes[imageSrc];

			// Ireate the image synchronously, add attribs async
			obj = this.image(imageSrc)
				.attr({
					x: x,
					y: y
				});
			obj.isImg = true;

			if (imageSize) {
				centerImage(obj, imageSize);
			} else {
				// Initialize image to be 0 size so export will still function if there's no cached sizes.
				//
				obj.attr({ width: 0, height: 0 });

				// Create a dummy JavaScript image to get the width and height. Due to a bug in IE < 8,
				// the created element must be assigned to a variable in order to load (#292).
				imageElement = createElement('img', {
					onload: function () {
						centerImage(obj, symbolSizes[imageSrc] = [this.width, this.height]);
					},
					src: imageSrc
				});
			}
		}

		return obj;
	},

	/**
	 * An extendable collection of functions for defining symbol paths.
	 */
	symbols: {
		'circle': function (x, y, w, h) {
			var cpw = 0.166 * w;
			return [
				M, x + w / 2, y,
				'C', x + w + cpw, y, x + w + cpw, y + h, x + w / 2, y + h,
				'C', x - cpw, y + h, x - cpw, y, x + w / 2, y,
				'Z'
			];
		},

		'square': function (x, y, w, h) {
			return [
				M, x, y,
				L, x + w, y,
				x + w, y + h,
				x, y + h,
				'Z'
			];
		},

		'triangle': function (x, y, w, h) {
			return [
				M, x + w / 2, y,
				L, x + w, y + h,
				x, y + h,
				'Z'
			];
		},

		'triangle-down': function (x, y, w, h) {
			return [
				M, x, y,
				L, x + w, y,
				x + w / 2, y + h,
				'Z'
			];
		},
		'diamond': function (x, y, w, h) {
			return [
				M, x + w / 2, y,
				L, x + w, y + h / 2,
				x + w / 2, y + h,
				x, y + h / 2,
				'Z'
			];
		},
		'arc': function (x, y, w, h, options) {
			var start = options.start,
				radius = options.r || w || h,
				end = options.end - 0.001, // to prevent cos and sin of start and end from becoming equal on 360 arcs (related: #1561)
				innerRadius = options.innerR,
				open = options.open,
				cosStart = mathCos(start),
				sinStart = mathSin(start),
				cosEnd = mathCos(end),
				sinEnd = mathSin(end),
				longArc = options.end - start < mathPI ? 0 : 1;

			return [
				M,
				x + radius * cosStart,
				y + radius * sinStart,
				'A', // arcTo
				radius, // x radius
				radius, // y radius
				0, // slanting
				longArc, // long or short arc
				1, // clockwise
				x + radius * cosEnd,
				y + radius * sinEnd,
				open ? M : L,
				x + innerRadius * cosEnd,
				y + innerRadius * sinEnd,
				'A', // arcTo
				innerRadius, // x radius
				innerRadius, // y radius
				0, // slanting
				longArc, // long or short arc
				0, // clockwise
				x + innerRadius * cosStart,
				y + innerRadius * sinStart,

				open ? '' : 'Z' // close
			];
		}
	},

	/**
	 * Define a clipping rectangle
	 * @param {String} id
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} width
	 * @param {Number} height
	 */
	clipRect: function (x, y, width, height) {
		var wrapper,
			id = PREFIX + idCounter++,

			clipPath = this.createElement('clipPath').attr({
				id: id
			}).add(this.defs);

		wrapper = this.rect(x, y, width, height, 0).add(clipPath);
		wrapper.id = id;
		wrapper.clipPath = clipPath;

		return wrapper;
	},


	/**
	 * Take a color and return it if it's a string, make it a gradient if it's a
	 * gradient configuration object. Prior to Highstock, an array was used to define
	 * a linear gradient with pixel positions relative to the SVG. In newer versions
	 * we change the coordinates to apply relative to the shape, using coordinates
	 * 0-1 within the shape. To preserve backwards compatibility, linearGradient
	 * in this definition is an object of x1, y1, x2 and y2.
	 *
	 * @param {Object} color The color or config object
	 */
	color: function (color, elem, prop) {
		var renderer = this,
			colorObject,
			regexRgba = /^rgba/,
			gradName,
			gradAttr,
			gradients,
			gradientObject,
			stops,
			stopColor,
			stopOpacity,
			radialReference,
			n,
			id,
			key = [];

		// Apply linear or radial gradients
		if (color && color.linearGradient) {
			gradName = 'linearGradient';
		} else if (color && color.radialGradient) {
			gradName = 'radialGradient';
		}

		if (gradName) {
			gradAttr = color[gradName];
			gradients = renderer.gradients;
			stops = color.stops;
			radialReference = elem.radialReference;

			// Keep < 2.2 kompatibility
			if (isArray(gradAttr)) {
				color[gradName] = gradAttr = {
					x1: gradAttr[0],
					y1: gradAttr[1],
					x2: gradAttr[2],
					y2: gradAttr[3],
					gradientUnits: 'userSpaceOnUse'
				};
			}

			// Correct the radial gradient for the radial reference system
			if (gradName === 'radialGradient' && radialReference && !defined(gradAttr.gradientUnits)) {
				gradAttr = merge(gradAttr, {
					cx: (radialReference[0] - radialReference[2] / 2) + gradAttr.cx * radialReference[2],
					cy: (radialReference[1] - radialReference[2] / 2) + gradAttr.cy * radialReference[2],
					r: gradAttr.r * radialReference[2],
					gradientUnits: 'userSpaceOnUse'
				});
			}

			// Build the unique key to detect whether we need to create a new element (#1282)
			for (n in gradAttr) {
				if (n !== 'id') {
					key.push(n, gradAttr[n]);
				}
			}
			for (n in stops) {
				key.push(stops[n]);
			}
			key = key.join(',');

			// Check if a gradient object with the same config object is created within this renderer
			if (gradients[key]) {
				id = gradients[key].id;

			} else {

				// Set the id and create the element
				gradAttr.id = id = PREFIX + idCounter++;
				gradients[key] = gradientObject = renderer.createElement(gradName)
					.attr(gradAttr)
					.add(renderer.defs);


				// The gradient needs to keep a list of stops to be able to destroy them
				gradientObject.stops = [];
				each(stops, function (stop) {
					var stopObject;
					if (regexRgba.test(stop[1])) {
						colorObject = Color(stop[1]);
						stopColor = colorObject.get('rgb');
						stopOpacity = colorObject.get('a');
					} else {
						stopColor = stop[1];
						stopOpacity = 1;
					}
					stopObject = renderer.createElement('stop').attr({
						offset: stop[0],
						'stop-color': stopColor,
						'stop-opacity': stopOpacity
					}).add(gradientObject);

					// Add the stop element to the gradient
					gradientObject.stops.push(stopObject);
				});
			}

			// Return the reference to the gradient object
			return 'url(' + renderer.url + '#' + id + ')';

		// Webkit and Batik can't show rgba.
		} else if (regexRgba.test(color)) {
			colorObject = Color(color);
			attr(elem, prop + '-opacity', colorObject.get('a'));

			return colorObject.get('rgb');


		} else {
			// Remove the opacity attribute added above. Does not throw if the attribute is not there.
			elem.removeAttribute(prop + '-opacity');

			return color;
		}

	},


	/**
	 * Add text to the SVG object
	 * @param {String} str
	 * @param {Number} x Left position
	 * @param {Number} y Top position
	 * @param {Boolean} useHTML Use HTML to render the text
	 */
	text: function (str, x, y, useHTML) {

		// declare variables
		var renderer = this,
			defaultChartStyle = defaultOptions.chart.style,
			fakeSVG = useCanVG || (!hasSVG && renderer.forExport),
			wrapper;

		if (useHTML && !renderer.forExport) {
			return renderer.html(str, x, y);
		}

		x = mathRound(pick(x, 0));
		y = mathRound(pick(y, 0));

		wrapper = renderer.createElement('text')
			.attr({
				x: x,
				y: y,
				text: str
			})
			.css({
				fontFamily: defaultChartStyle.fontFamily,
				fontSize: defaultChartStyle.fontSize
			});

		// Prevent wrapping from creating false offsetWidths in export in legacy IE (#1079, #1063)
		if (fakeSVG) {
			wrapper.css({
				position: ABSOLUTE
			});
		}

		wrapper.x = x;
		wrapper.y = y;
		return wrapper;
	},

	/**
	 * Utility to return the baseline offset and total line height from the font size
	 */
	fontMetrics: function (fontSize) {
		fontSize = pInt(fontSize || 11);

		// Empirical values found by comparing font size and bounding box height.
		// Applies to the default font family. http://jsfiddle.net/highcharts/7xvn7/
		var lineHeight = fontSize < 24 ? fontSize + 4 : mathRound(fontSize * 1.2),
			baseline = mathRound(lineHeight * 0.8);

		return {
			h: lineHeight,
			b: baseline
		};
	},

	/**
	 * Add a label, a text item that can hold a colored or gradient background
	 * as well as a border and shadow.
	 * @param {string} str
	 * @param {Number} x
	 * @param {Number} y
	 * @param {String} shape
	 * @param {Number} anchorX In case the shape has a pointer, like a flag, this is the
	 *    coordinates it should be pinned to
	 * @param {Number} anchorY
	 * @param {Boolean} baseline Whether to position the label relative to the text baseline,
	 *    like renderer.text, or to the upper border of the rectangle.
	 * @param {String} className Class name for the group
	 */
	label: function (str, x, y, shape, anchorX, anchorY, useHTML, baseline, className) {

		var renderer = this,
			wrapper = renderer.g(className),
			text = renderer.text('', 0, 0, useHTML)
				.attr({
					zIndex: 1
				}),
				//.add(wrapper),
			box,
			bBox,
			alignFactor = 0,
			padding = 3,
			paddingLeft = 0,
			width,
			height,
			wrapperX,
			wrapperY,
			crispAdjust = 0,
			deferredAttr = {},
			baselineOffset,
			attrSetters = wrapper.attrSetters,
			needsBox;

		/**
		 * This function runs after the label is added to the DOM (when the bounding box is
		 * available), and after the text of the label is updated to detect the new bounding
		 * box and reflect it in the border box.
		 */
		function updateBoxSize() {
			var boxX,
				boxY,
				style = text.element.style;

			bBox = (width === undefined || height === undefined || wrapper.styles.textAlign) &&
				text.getBBox();
			wrapper.width = (width || bBox.width || 0) + 2 * padding + paddingLeft;
			wrapper.height = (height || bBox.height || 0) + 2 * padding;

			// update the label-scoped y offset
			baselineOffset = padding + renderer.fontMetrics(style && style.fontSize).b;

			if (needsBox) {

				// create the border box if it is not already present
				if (!box) {
					boxX = mathRound(-alignFactor * padding);
					boxY = baseline ? -baselineOffset : 0;

					wrapper.box = box = shape ?
						renderer.symbol(shape, boxX, boxY, wrapper.width, wrapper.height, deferredAttr) :
						renderer.rect(boxX, boxY, wrapper.width, wrapper.height, 0, deferredAttr[STROKE_WIDTH]);
					box.add(wrapper);
				}

				// apply the box attributes
				if (!box.isImg) { // #1630
					box.attr(merge({
						width: wrapper.width,
						height: wrapper.height
					}, deferredAttr));
				}
				deferredAttr = null;
			}
		}

		/**
		 * This function runs after setting text or padding, but only if padding is changed
		 */
		function updateTextPadding() {
			var styles = wrapper.styles,
				textAlign = styles && styles.textAlign,
				x = paddingLeft + padding * (1 - alignFactor),
				y;

			// determin y based on the baseline
			y = baseline ? 0 : baselineOffset;

			// compensate for alignment
			if (defined(width) && (textAlign === 'center' || textAlign === 'right')) {
				x += { center: 0.5, right: 1 }[textAlign] * (width - bBox.width);
			}

			// update if anything changed
			if (x !== text.x || y !== text.y) {
				text.attr({
					x: x,
					y: y
				});
			}

			// record current values
			text.x = x;
			text.y = y;
		}

		/**
		 * Set a box attribute, or defer it if the box is not yet created
		 * @param {Object} key
		 * @param {Object} value
		 */
		function boxAttr(key, value) {
			if (box) {
				box.attr(key, value);
			} else {
				deferredAttr[key] = value;
			}
		}

		function getSizeAfterAdd() {
			text.add(wrapper);
			wrapper.attr({
				text: str, // alignment is available now
				x: x,
				y: y
			});

			if (box && defined(anchorX)) {
				wrapper.attr({
					anchorX: anchorX,
					anchorY: anchorY
				});
			}
		}

		/**
		 * After the text element is added, get the desired size of the border box
		 * and add it before the text in the DOM.
		 */
		addEvent(wrapper, 'add', getSizeAfterAdd);

		/*
		 * Add specific attribute setters.
		 */

		// only change local variables
		attrSetters.width = function (value) {
			width = value;
			return false;
		};
		attrSetters.height = function (value) {
			height = value;
			return false;
		};
		attrSetters.padding =  function (value) {
			if (defined(value) && value !== padding) {
				padding = value;
				updateTextPadding();
			}
			return false;
		};
		attrSetters.paddingLeft =  function (value) {
			if (defined(value) && value !== paddingLeft) {
				paddingLeft = value;
				updateTextPadding();
			}
			return false;
		};


		// change local variable and set attribue as well
		attrSetters.align = function (value) {
			alignFactor = { left: 0, center: 0.5, right: 1 }[value];
			return false; // prevent setting text-anchor on the group
		};

		// apply these to the box and the text alike
		attrSetters.text = function (value, key) {
			text.attr(key, value);
			updateBoxSize();
			updateTextPadding();
			return false;
		};

		// apply these to the box but not to the text
		attrSetters[STROKE_WIDTH] = function (value, key) {
			needsBox = true;
			crispAdjust = value % 2 / 2;
			boxAttr(key, value);
			return false;
		};
		attrSetters.stroke = attrSetters.fill = attrSetters.r = function (value, key) {
			if (key === 'fill') {
				needsBox = true;
			}
			boxAttr(key, value);
			return false;
		};
		attrSetters.anchorX = function (value, key) {
			anchorX = value;
			boxAttr(key, value + crispAdjust - wrapperX);
			return false;
		};
		attrSetters.anchorY = function (value, key) {
			anchorY = value;
			boxAttr(key, value - wrapperY);
			return false;
		};

		// rename attributes
		attrSetters.x = function (value) {
			wrapper.x = value; // for animation getter
			value -= alignFactor * ((width || bBox.width) + padding);
			wrapperX = mathRound(value);

			wrapper.attr('translateX', wrapperX);
			return false;
		};
		attrSetters.y = function (value) {
			wrapperY = wrapper.y = mathRound(value);
			wrapper.attr('translateY', wrapperY);
			return false;
		};

		// Redirect certain methods to either the box or the text
		var baseCss = wrapper.css;
		return extend(wrapper, {
			/**
			 * Pick up some properties and apply them to the text instead of the wrapper
			 */
			css: function (styles) {
				if (styles) {
					var textStyles = {};
					styles = merge(styles); // create a copy to avoid altering the original object (#537)
					each(['fontSize', 'fontWeight', 'fontFamily', 'color', 'lineHeight', 'width', 'textDecoration', 'textShadow'], function (prop) {
						if (styles[prop] !== UNDEFINED) {
							textStyles[prop] = styles[prop];
							delete styles[prop];
						}
					});
					text.css(textStyles);
				}
				return baseCss.call(wrapper, styles);
			},
			/**
			 * Return the bounding box of the box, not the group
			 */
			getBBox: function () {
				return {
					width: bBox.width + 2 * padding,
					height: bBox.height + 2 * padding,
					x: bBox.x - padding,
					y: bBox.y - padding
				};
			},
			/**
			 * Apply the shadow to the box
			 */
			shadow: function (b) {
				if (box) {
					box.shadow(b);
				}
				return wrapper;
			},
			/**
			 * Destroy and release memory.
			 */
			destroy: function () {
				removeEvent(wrapper, 'add', getSizeAfterAdd);

				// Added by button implementation
				removeEvent(wrapper.element, 'mouseenter');
				removeEvent(wrapper.element, 'mouseleave');

				if (text) {
					text = text.destroy();
				}
				if (box) {
					box = box.destroy();
				}
				// Call base implementation to destroy the rest
				SVGElement.prototype.destroy.call(wrapper);

				// Release local pointers (#1298)
				wrapper = renderer = updateBoxSize = updateTextPadding = boxAttr = getSizeAfterAdd = null;
			}
		});
	}
}; // end SVGRenderer


// general renderer
Renderer = SVGRenderer;
// extend SvgElement for useHTML option
extend(SVGElement.prototype, {
	/**
	 * Apply CSS to HTML elements. This is used in text within SVG rendering and
	 * by the VML renderer
	 */
	htmlCss: function (styles) {
		var wrapper = this,
			element = wrapper.element,
			textWidth = styles && element.tagName === 'SPAN' && styles.width;

		if (textWidth) {
			delete styles.width;
			wrapper.textWidth = textWidth;
			wrapper.updateTransform();
		}

		wrapper.styles = extend(wrapper.styles, styles);
		css(wrapper.element, styles);

		return wrapper;
	},

	/**
	 * VML and useHTML method for calculating the bounding box based on offsets
	 * @param {Boolean} refresh Whether to force a fresh value from the DOM or to
	 * use the cached value
	 *
	 * @return {Object} A hash containing values for x, y, width and height
	 */

	htmlGetBBox: function () {
		var wrapper = this,
			element = wrapper.element,
			bBox = wrapper.bBox;

		// faking getBBox in exported SVG in legacy IE
		if (!bBox) {
			// faking getBBox in exported SVG in legacy IE (is this a duplicate of the fix for #1079?)
			if (element.nodeName === 'text') {
				element.style.position = ABSOLUTE;
			}

			bBox = wrapper.bBox = {
				x: element.offsetLeft,
				y: element.offsetTop,
				width: element.offsetWidth,
				height: element.offsetHeight
			};
		}

		return bBox;
	},

	/**
	 * VML override private method to update elements based on internal
	 * properties based on SVG transform
	 */
	htmlUpdateTransform: function () {
		// aligning non added elements is expensive
		if (!this.added) {
			this.alignOnAdd = true;
			return;
		}

		var wrapper = this,
			renderer = wrapper.renderer,
			elem = wrapper.element,
			translateX = wrapper.translateX || 0,
			translateY = wrapper.translateY || 0,
			x = wrapper.x || 0,
			y = wrapper.y || 0,
			align = wrapper.textAlign || 'left',
			alignCorrection = { left: 0, center: 0.5, right: 1 }[align],
			shadows = wrapper.shadows;

		// apply translate
		css(elem, {
			marginLeft: translateX,
			marginTop: translateY
		});
		if (shadows) { // used in labels/tooltip
			each(shadows, function (shadow) {
				css(shadow, {
					marginLeft: translateX + 1,
					marginTop: translateY + 1
				});
			});
		}

		// apply inversion
		if (wrapper.inverted) { // wrapper is a group
			each(elem.childNodes, function (child) {
				renderer.invertChild(child, elem);
			});
		}

		if (elem.tagName === 'SPAN') {

			var width,
				rotation = wrapper.rotation,
				baseline,
				textWidth = pInt(wrapper.textWidth),
				currentTextTransform = [rotation, align, elem.innerHTML, wrapper.textWidth].join(',');

			if (currentTextTransform !== wrapper.cTT) { // do the calculations and DOM access only if properties changed


				baseline = renderer.fontMetrics(elem.style.fontSize).b;

				// Renderer specific handling of span rotation
				if (defined(rotation)) {
					wrapper.setSpanRotation(rotation, alignCorrection, baseline);
				}

				width = pick(wrapper.elemWidth, elem.offsetWidth);

				// Update textWidth
				if (width > textWidth && /[ \-]/.test(elem.textContent || elem.innerText)) { // #983, #1254
					css(elem, {
						width: textWidth + PX,
						display: 'block',
						whiteSpace: 'normal'
					});
					width = textWidth;
				}

				wrapper.getSpanCorrection(width, baseline, alignCorrection, rotation, align);
			}

			// apply position with correction
			css(elem, {
				left: (x + (wrapper.xCorr || 0)) + PX,
				top: (y + (wrapper.yCorr || 0)) + PX
			});

			// force reflow in webkit to apply the left and top on useHTML element (#1249)
			if (isWebKit) {
				baseline = elem.offsetHeight; // assigned to baseline for JSLint purpose
			}

			// record current text transform
			wrapper.cTT = currentTextTransform;
		}
	},

	/**
	 * Set the rotation of an individual HTML span
	 */
	setSpanRotation: function (rotation, alignCorrection, baseline) {
		var rotationStyle = {},
			cssTransformKey = isIE ? '-ms-transform' : isWebKit ? '-webkit-transform' : isFirefox ? 'MozTransform' : isOpera ? '-o-transform' : '';

		rotationStyle[cssTransformKey] = rotationStyle.transform = 'rotate(' + rotation + 'deg)';
		rotationStyle[cssTransformKey + (isFirefox ? 'Origin' : '-origin')] = (alignCorrection * 100) + '% ' + baseline + 'px';
		css(this.element, rotationStyle);
	},

	/**
	 * Get the correction in X and Y positioning as the element is rotated.
	 */
	getSpanCorrection: function (width, baseline, alignCorrection) {
		this.xCorr = -width * alignCorrection;
		this.yCorr = -baseline;
	}
});

// Extend SvgRenderer for useHTML option.
extend(SVGRenderer.prototype, {
	/**
	 * Create HTML text node. This is used by the VML renderer as well as the SVG
	 * renderer through the useHTML option.
	 *
	 * @param {String} str
	 * @param {Number} x
	 * @param {Number} y
	 */
	html: function (str, x, y) {
		var defaultChartStyle = defaultOptions.chart.style,
			wrapper = this.createElement('span'),
			attrSetters = wrapper.attrSetters,
			element = wrapper.element,
			renderer = wrapper.renderer;

		// Text setter
		attrSetters.text = function (value) {
			if (value !== element.innerHTML) {
				delete this.bBox;
			}
			element.innerHTML = value;
			return false;
		};

		// Various setters which rely on update transform
		attrSetters.x = attrSetters.y = attrSetters.align = attrSetters.rotation = function (value, key) {
			if (key === 'align') {
				key = 'textAlign'; // Do not overwrite the SVGElement.align method. Same as VML.
			}
			wrapper[key] = value;
			wrapper.htmlUpdateTransform();
			return false;
		};

		// Set the default attributes
		wrapper.attr({
				text: str,
				x: mathRound(x),
				y: mathRound(y)
			})
			.css({
				position: ABSOLUTE,
				whiteSpace: 'nowrap',
				fontFamily: defaultChartStyle.fontFamily,
				fontSize: defaultChartStyle.fontSize
			});

		// Use the HTML specific .css method
		wrapper.css = wrapper.htmlCss;

		// This is specific for HTML within SVG
		if (renderer.isSVG) {
			wrapper.add = function (svgGroupWrapper) {

				var htmlGroup,
					container = renderer.box.parentNode,
					parentGroup,
					parents = [];

				this.parentGroup = svgGroupWrapper;

				// Create a mock group to hold the HTML elements
				if (svgGroupWrapper) {
					htmlGroup = svgGroupWrapper.div;
					if (!htmlGroup) {

						// Read the parent chain into an array and read from top down
						parentGroup = svgGroupWrapper;
						while (parentGroup) {

							parents.push(parentGroup);

							// Move up to the next parent group
							parentGroup = parentGroup.parentGroup;
						}

						// Ensure dynamically updating position when any parent is translated
						each(parents.reverse(), function (parentGroup) {
							var htmlGroupStyle;

							// Create a HTML div and append it to the parent div to emulate
							// the SVG group structure
							htmlGroup = parentGroup.div = parentGroup.div || createElement(DIV, {
								className: attr(parentGroup.element, 'class')
							}, {
								position: ABSOLUTE,
								left: (parentGroup.translateX || 0) + PX,
								top: (parentGroup.translateY || 0) + PX
							}, htmlGroup || container); // the top group is appended to container

							// Shortcut
							htmlGroupStyle = htmlGroup.style;

							// Set listeners to update the HTML div's position whenever the SVG group
							// position is changed
							extend(parentGroup.attrSetters, {
								translateX: function (value) {
									htmlGroupStyle.left = value + PX;
								},
								translateY: function (value) {
									htmlGroupStyle.top = value + PX;
								},
								visibility: function (value, key) {
									htmlGroupStyle[key] = value;
								}
							});
						});

					}
				} else {
					htmlGroup = container;
				}

				htmlGroup.appendChild(element);

				// Shared with VML:
				wrapper.added = true;
				if (wrapper.alignOnAdd) {
					wrapper.htmlUpdateTransform();
				}

				return wrapper;
			};
		}
		return wrapper;
	}
});

/* ****************************************************************************
 *                                                                            *
 * START OF INTERNET EXPLORER <= 8 SPECIFIC CODE                              *
 *                                                                            *
 * For applications and websites that don't need IE support, like platform    *
 * targeted mobile apps and web apps, this code can be removed.               *
 *                                                                            *
 *****************************************************************************/

/**
 * @constructor
 */
var VMLRenderer, VMLElement;
if (!hasSVG && !useCanVG) {

/**
 * The VML element wrapper.
 */
Highcharts.VMLElement = VMLElement = {

	/**
	 * Initialize a new VML element wrapper. It builds the markup as a string
	 * to minimize DOM traffic.
	 * @param {Object} renderer
	 * @param {Object} nodeName
	 */
	init: function (renderer, nodeName) {
		var wrapper = this,
			markup =  ['<', nodeName, ' filled="f" stroked="f"'],
			style = ['position: ', ABSOLUTE, ';'],
			isDiv = nodeName === DIV;

		// divs and shapes need size
		if (nodeName === 'shape' || isDiv) {
			style.push('left:0;top:0;width:1px;height:1px;');
		}
		style.push('visibility: ', isDiv ? HIDDEN : VISIBLE);

		markup.push(' style="', style.join(''), '"/>');

		// create element with default attributes and style
		if (nodeName) {
			markup = isDiv || nodeName === 'span' || nodeName === 'img' ?
				markup.join('')
				: renderer.prepVML(markup);
			wrapper.element = createElement(markup);
		}

		wrapper.renderer = renderer;
		wrapper.attrSetters = {};
	},

	/**
	 * Add the node to the given parent
	 * @param {Object} parent
	 */
	add: function (parent) {
		var wrapper = this,
			renderer = wrapper.renderer,
			element = wrapper.element,
			box = renderer.box,
			inverted = parent && parent.inverted,

			// get the parent node
			parentNode = parent ?
				parent.element || parent :
				box;


		// if the parent group is inverted, apply inversion on all children
		if (inverted) { // only on groups
			renderer.invertChild(element, parentNode);
		}

		// append it
		parentNode.appendChild(element);

		// align text after adding to be able to read offset
		wrapper.added = true;
		if (wrapper.alignOnAdd && !wrapper.deferUpdateTransform) {
			wrapper.updateTransform();
		}

		// fire an event for internal hooks
		fireEvent(wrapper, 'add');

		return wrapper;
	},

	/**
	 * VML always uses htmlUpdateTransform
	 */
	updateTransform: SVGElement.prototype.htmlUpdateTransform,

	/**
	 * Set the rotation of a span with oldIE's filter
	 */
	setSpanRotation: function () {
		// Adjust for alignment and rotation. Rotation of useHTML content is not yet implemented
		// but it can probably be implemented for Firefox 3.5+ on user request. FF3.5+
		// has support for CSS3 transform. The getBBox method also needs to be updated
		// to compensate for the rotation, like it currently does for SVG.
		// Test case: http://jsfiddle.net/highcharts/Ybt44/

		var rotation = this.rotation,
			costheta = mathCos(rotation * deg2rad),
			sintheta = mathSin(rotation * deg2rad);
					
		css(this.element, {
			filter: rotation ? ['progid:DXImageTransform.Microsoft.Matrix(M11=', costheta,
				', M12=', -sintheta, ', M21=', sintheta, ', M22=', costheta,
				', sizingMethod=\'auto expand\')'].join('') : NONE
		});
	},

	/**
	 * Get the positioning correction for the span after rotating. 
	 */
	getSpanCorrection: function (width, baseline, alignCorrection, rotation, align) {

		var costheta = rotation ? mathCos(rotation * deg2rad) : 1,
			sintheta = rotation ? mathSin(rotation * deg2rad) : 0,
			height = pick(this.elemHeight, this.element.offsetHeight),
			quad,
			nonLeft = align && align !== 'left';

		// correct x and y
		this.xCorr = costheta < 0 && -width;
		this.yCorr = sintheta < 0 && -height;

		// correct for baseline and corners spilling out after rotation
		quad = costheta * sintheta < 0;
		this.xCorr += sintheta * baseline * (quad ? 1 - alignCorrection : alignCorrection);
		this.yCorr -= costheta * baseline * (rotation ? (quad ? alignCorrection : 1 - alignCorrection) : 1);
		// correct for the length/height of the text
		if (nonLeft) {
			this.xCorr -= width * alignCorrection * (costheta < 0 ? -1 : 1);
			if (rotation) {
				this.yCorr -= height * alignCorrection * (sintheta < 0 ? -1 : 1);
			}
			css(this.element, {
				textAlign: align
			});
		}
	},

	/**
	 * Converts a subset of an SVG path definition to its VML counterpart. Takes an array
	 * as the parameter and returns a string.
	 */
	pathToVML: function (value) {
		// convert paths
		var i = value.length,
			path = [];

		while (i--) {

			// Multiply by 10 to allow subpixel precision.
			// Substracting half a pixel seems to make the coordinates
			// align with SVG, but this hasn't been tested thoroughly
			if (isNumber(value[i])) {
				path[i] = mathRound(value[i] * 10) - 5;
			} else if (value[i] === 'Z') { // close the path
				path[i] = 'x';
			} else {
				path[i] = value[i];

				// When the start X and end X coordinates of an arc are too close,
				// they are rounded to the same value above. In this case, substract or 
				// add 1 from the end X and Y positions. #186, #760, #1371, #1410.
				if (value.isArc && (value[i] === 'wa' || value[i] === 'at')) {
					// Start and end X
					if (path[i + 5] === path[i + 7]) {
						path[i + 7] += value[i + 7] > value[i + 5] ? 1 : -1;
					}
					// Start and end Y
					if (path[i + 6] === path[i + 8]) {
						path[i + 8] += value[i + 8] > value[i + 6] ? 1 : -1;
					}
				}
			}
		}

		
		// Loop up again to handle path shortcuts (#2132)
		/*while (i++ < path.length) {
			if (path[i] === 'H') { // horizontal line to
				path[i] = 'L';
				path.splice(i + 2, 0, path[i - 1]);
			} else if (path[i] === 'V') { // vertical line to
				path[i] = 'L';
				path.splice(i + 1, 0, path[i - 2]);
			}
		}*/
		return path.join(' ') || 'x';
	},

	/**
	 * Get or set attributes
	 */
	attr: function (hash, val) {
		var wrapper = this,
			key,
			value,
			i,
			result,
			element = wrapper.element || {},
			elemStyle = element.style,
			nodeName = element.nodeName,
			renderer = wrapper.renderer,
			symbolName = wrapper.symbolName,
			hasSetSymbolSize,
			shadows = wrapper.shadows,
			skipAttr,
			attrSetters = wrapper.attrSetters,
			ret = wrapper;

		// single key-value pair
		if (isString(hash) && defined(val)) {
			key = hash;
			hash = {};
			hash[key] = val;
		}

		// used as a getter, val is undefined
		if (isString(hash)) {
			key = hash;
			if (key === 'strokeWidth' || key === 'stroke-width') {
				ret = wrapper.strokeweight;
			} else {
				ret = wrapper[key];
			}

		// setter
		} else {
			for (key in hash) {
				value = hash[key];
				skipAttr = false;

				// check for a specific attribute setter
				result = attrSetters[key] && attrSetters[key].call(wrapper, value, key);

				if (result !== false && value !== null) { // #620

					if (result !== UNDEFINED) {
						value = result; // the attribute setter has returned a new value to set
					}


					// prepare paths
					// symbols
					if (symbolName && /^(x|y|r|start|end|width|height|innerR|anchorX|anchorY)/.test(key)) {
						// if one of the symbol size affecting parameters are changed,
						// check all the others only once for each call to an element's
						// .attr() method
						if (!hasSetSymbolSize) {
							wrapper.symbolAttr(hash);

							hasSetSymbolSize = true;
						}
						skipAttr = true;

					} else if (key === 'd') {
						value = value || [];
						wrapper.d = value.join(' '); // used in getter for animation

						element.path = value = wrapper.pathToVML(value);

						// update shadows
						if (shadows) {
							i = shadows.length;
							while (i--) {
								shadows[i].path = shadows[i].cutOff ? this.cutOffPath(value, shadows[i].cutOff) : value;
							}
						}
						skipAttr = true;

					// handle visibility
					} else if (key === 'visibility') {

						// let the shadow follow the main element
						if (shadows) {
							i = shadows.length;
							while (i--) {
								shadows[i].style[key] = value;
							}
						}

						// Instead of toggling the visibility CSS property, move the div out of the viewport.
						// This works around #61 and #586
						if (nodeName === 'DIV') {
							value = value === HIDDEN ? '-999em' : 0;

							// In order to redraw, IE7 needs the div to be visible when tucked away
							// outside the viewport. So the visibility is actually opposite of
							// the expected value. This applies to the tooltip only.
							if (!docMode8) {
								elemStyle[key] = value ? VISIBLE : HIDDEN;
							}
							key = 'top';
						}
						elemStyle[key] = value;
						skipAttr = true;

					// directly mapped to css
					} else if (key === 'zIndex') {

						if (value) {
							elemStyle[key] = value;
						}
						skipAttr = true;

					// x, y, width, height
					} else if (inArray(key, ['x', 'y', 'width', 'height']) !== -1) {

						wrapper[key] = value; // used in getter

						if (key === 'x' || key === 'y') {
							key = { x: 'left', y: 'top' }[key];
						} else {
							value = mathMax(0, value); // don't set width or height below zero (#311)
						}

						// clipping rectangle special
						if (wrapper.updateClipping) {
							wrapper[key] = value; // the key is now 'left' or 'top' for 'x' and 'y'
							wrapper.updateClipping();
						} else {
							// normal
							elemStyle[key] = value;
						}

						skipAttr = true;

					// class name
					} else if (key === 'class' && nodeName === 'DIV') {
						// IE8 Standards mode has problems retrieving the className
						element.className = value;

					// stroke
					} else if (key === 'stroke') {

						value = renderer.color(value, element, key);

						key = 'strokecolor';

					// stroke width
					} else if (key === 'stroke-width' || key === 'strokeWidth') {
						element.stroked = value ? true : false;
						key = 'strokeweight';
						wrapper[key] = value; // used in getter, issue #113
						if (isNumber(value)) {
							value += PX;
						}

					// dashStyle
					} else if (key === 'dashstyle') {
						var strokeElem = element.getElementsByTagName('stroke')[0] ||
							createElement(renderer.prepVML(['<stroke/>']), null, null, element);
						strokeElem[key] = value || 'solid';
						wrapper.dashstyle = value; /* because changing stroke-width will change the dash length
							and cause an epileptic effect */
						skipAttr = true;

					// fill
					} else if (key === 'fill') {

						if (nodeName === 'SPAN') { // text color
							elemStyle.color = value;
						} else if (nodeName !== 'IMG') { // #1336
							element.filled = value !== NONE ? true : false;

							value = renderer.color(value, element, key, wrapper);

							key = 'fillcolor';
						}

					// opacity: don't bother - animation is too slow and filters introduce artifacts
					} else if (key === 'opacity') {
						/*css(element, {
							opacity: value
						});*/
						skipAttr = true;

					// rotation on VML elements
					} else if (nodeName === 'shape' && key === 'rotation') {

						wrapper[key] = element.style[key] = value; // style is for #1873

						// Correction for the 1x1 size of the shape container. Used in gauge needles.
						element.style.left = -mathRound(mathSin(value * deg2rad) + 1) + PX;
						element.style.top = mathRound(mathCos(value * deg2rad)) + PX;

					// translation for animation
					} else if (key === 'translateX' || key === 'translateY' || key === 'rotation') {
						wrapper[key] = value;
						wrapper.updateTransform();

						skipAttr = true;

					}


					if (!skipAttr) {
						if (docMode8) { // IE8 setAttribute bug
							element[key] = value;
						} else {
							attr(element, key, value);
						}
					}

				}
			}
		}
		return ret;
	},

	/**
	 * Set the element's clipping to a predefined rectangle
	 *
	 * @param {String} id The id of the clip rectangle
	 */
	clip: function (clipRect) {
		var wrapper = this,
			clipMembers,
			cssRet;

		if (clipRect) {
			clipMembers = clipRect.members;
			erase(clipMembers, wrapper); // Ensure unique list of elements (#1258)
			clipMembers.push(wrapper);
			wrapper.destroyClip = function () {
				erase(clipMembers, wrapper);
			};
			cssRet = clipRect.getCSS(wrapper);

		} else {
			if (wrapper.destroyClip) {
				wrapper.destroyClip();
			}
			cssRet = { clip: docMode8 ? 'inherit' : 'rect(auto)' }; // #1214
		}

		return wrapper.css(cssRet);

	},

	/**
	 * Set styles for the element
	 * @param {Object} styles
	 */
	css: SVGElement.prototype.htmlCss,

	/**
	 * Removes a child either by removeChild or move to garbageBin.
	 * Issue 490; in VML removeChild results in Orphaned nodes according to sIEve, discardElement does not.
	 */
	safeRemoveChild: function (element) {
		// discardElement will detach the node from its parent before attaching it
		// to the garbage bin. Therefore it is important that the node is attached and have parent.
		if (element.parentNode) {
			discardElement(element);
		}
	},

	/**
	 * Extend element.destroy by removing it from the clip members array
	 */
	destroy: function () {
		if (this.destroyClip) {
			this.destroyClip();
		}

		return SVGElement.prototype.destroy.apply(this);
	},

	/**
	 * Add an event listener. VML override for normalizing event parameters.
	 * @param {String} eventType
	 * @param {Function} handler
	 */
	on: function (eventType, handler) {
		// simplest possible event model for internal use
		this.element['on' + eventType] = function () {
			var evt = win.event;
			evt.target = evt.srcElement;
			handler(evt);
		};
		return this;
	},

	/**
	 * In stacked columns, cut off the shadows so that they don't overlap
	 */
	cutOffPath: function (path, length) {

		var len;

		path = path.split(/[ ,]/);
		len = path.length;

		if (len === 9 || len === 11) {
			path[len - 4] = path[len - 2] = pInt(path[len - 2]) - 10 * length;
		}
		return path.join(' ');
	},

	/**
	 * Apply a drop shadow by copying elements and giving them different strokes
	 * @param {Boolean|Object} shadowOptions
	 */
	shadow: function (shadowOptions, group, cutOff) {
		var shadows = [],
			i,
			element = this.element,
			renderer = this.renderer,
			shadow,
			elemStyle = element.style,
			markup,
			path = element.path,
			strokeWidth,
			modifiedPath,
			shadowWidth,
			shadowElementOpacity;

		// some times empty paths are not strings
		if (path && typeof path.value !== 'string') {
			path = 'x';
		}
		modifiedPath = path;

		if (shadowOptions) {
			shadowWidth = pick(shadowOptions.width, 3);
			shadowElementOpacity = (shadowOptions.opacity || 0.15) / shadowWidth;
			for (i = 1; i <= 3; i++) {

				strokeWidth = (shadowWidth * 2) + 1 - (2 * i);

				// Cut off shadows for stacked column items
				if (cutOff) {
					modifiedPath = this.cutOffPath(path.value, strokeWidth + 0.5);
				}

				markup = ['<shape isShadow="true" strokeweight="', strokeWidth,
					'" filled="false" path="', modifiedPath,
					'" coordsize="10 10" style="', element.style.cssText, '" />'];

				shadow = createElement(renderer.prepVML(markup),
					null, {
						left: pInt(elemStyle.left) + pick(shadowOptions.offsetX, 1),
						top: pInt(elemStyle.top) + pick(shadowOptions.offsetY, 1)
					}
				);
				if (cutOff) {
					shadow.cutOff = strokeWidth + 1;
				}

				// apply the opacity
				markup = ['<stroke color="', shadowOptions.color || 'black', '" opacity="', shadowElementOpacity * i, '"/>'];
				createElement(renderer.prepVML(markup), null, null, shadow);


				// insert it
				if (group) {
					group.element.appendChild(shadow);
				} else {
					element.parentNode.insertBefore(shadow, element);
				}

				// record it
				shadows.push(shadow);

			}

			this.shadows = shadows;
		}
		return this;

	}
};
VMLElement = extendClass(SVGElement, VMLElement);

/**
 * The VML renderer
 */
var VMLRendererExtension = { // inherit SVGRenderer

	Element: VMLElement,
	isIE8: userAgent.indexOf('MSIE 8.0') > -1,


	/**
	 * Initialize the VMLRenderer
	 * @param {Object} container
	 * @param {Number} width
	 * @param {Number} height
	 */
	init: function (container, width, height) {
		var renderer = this,
			boxWrapper,
			box,
			css;

		renderer.alignedObjects = [];

		boxWrapper = renderer.createElement(DIV);
		box = boxWrapper.element;
		box.style.position = RELATIVE; // for freeform drawing using renderer directly
		container.appendChild(boxWrapper.element);


		// generate the containing box
		renderer.isVML = true;
		renderer.box = box;
		renderer.boxWrapper = boxWrapper;
		renderer.cache = {};


		renderer.setSize(width, height, false);

		// The only way to make IE6 and IE7 print is to use a global namespace. However,
		// with IE8 the only way to make the dynamic shapes visible in screen and print mode
		// seems to be to add the xmlns attribute and the behaviour style inline.
		if (!doc.namespaces.hcv) {

			doc.namespaces.add('hcv', 'urn:schemas-microsoft-com:vml');

			// Setup default CSS (#2153, #2368, #2384)
			css = 'hcv\\:fill, hcv\\:path, hcv\\:shape, hcv\\:stroke' +
				'{ behavior:url(#default#VML); display: inline-block; } ';
			try {
				doc.createStyleSheet().cssText = css;
			} catch (e) {
				doc.styleSheets[0].cssText += css;
			}

		}
	},


	/**
	 * Detect whether the renderer is hidden. This happens when one of the parent elements
	 * has display: none
	 */
	isHidden: function () {
		return !this.box.offsetWidth;
	},

	/**
	 * Define a clipping rectangle. In VML it is accomplished by storing the values
	 * for setting the CSS style to all associated members.
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} width
	 * @param {Number} height
	 */
	clipRect: function (x, y, width, height) {

		// create a dummy element
		var clipRect = this.createElement(),
			isObj = isObject(x);

		// mimic a rectangle with its style object for automatic updating in attr
		return extend(clipRect, {
			members: [],
			left: (isObj ? x.x : x) + 1,
			top: (isObj ? x.y : y) + 1,
			width: (isObj ? x.width : width) - 1,
			height: (isObj ? x.height : height) - 1,
			getCSS: function (wrapper) {
				var element = wrapper.element,
					nodeName = element.nodeName,
					isShape = nodeName === 'shape',
					inverted = wrapper.inverted,
					rect = this,
					top = rect.top - (isShape ? element.offsetTop : 0),
					left = rect.left,
					right = left + rect.width,
					bottom = top + rect.height,
					ret = {
						clip: 'rect(' +
							mathRound(inverted ? left : top) + 'px,' +
							mathRound(inverted ? bottom : right) + 'px,' +
							mathRound(inverted ? right : bottom) + 'px,' +
							mathRound(inverted ? top : left) + 'px)'
					};

				// issue 74 workaround
				if (!inverted && docMode8 && nodeName === 'DIV') {
					extend(ret, {
						width: right + PX,
						height: bottom + PX
					});
				}
				return ret;
			},

			// used in attr and animation to update the clipping of all members
			updateClipping: function () {
				each(clipRect.members, function (member) {
					member.css(clipRect.getCSS(member));
				});
			}
		});

	},


	/**
	 * Take a color and return it if it's a string, make it a gradient if it's a
	 * gradient configuration object, and apply opacity.
	 *
	 * @param {Object} color The color or config object
	 */
	color: function (color, elem, prop, wrapper) {
		var renderer = this,
			colorObject,
			regexRgba = /^rgba/,
			markup,
			fillType,
			ret = NONE;

		// Check for linear or radial gradient
		if (color && color.linearGradient) {
			fillType = 'gradient';
		} else if (color && color.radialGradient) {
			fillType = 'pattern';
		}


		if (fillType) {

			var stopColor,
				stopOpacity,
				gradient = color.linearGradient || color.radialGradient,
				x1,
				y1,
				x2,
				y2,
				opacity1,
				opacity2,
				color1,
				color2,
				fillAttr = '',
				stops = color.stops,
				firstStop,
				lastStop,
				colors = [],
				addFillNode = function () {
					// Add the fill subnode. When colors attribute is used, the meanings of opacity and o:opacity2
					// are reversed.
					markup = ['<fill colors="' + colors.join(',') + '" opacity="', opacity2, '" o:opacity2="', opacity1,
						'" type="', fillType, '" ', fillAttr, 'focus="100%" method="any" />'];
					createElement(renderer.prepVML(markup), null, null, elem);
				};

			// Extend from 0 to 1
			firstStop = stops[0];
			lastStop = stops[stops.length - 1];
			if (firstStop[0] > 0) {
				stops.unshift([
					0,
					firstStop[1]
				]);
			}
			if (lastStop[0] < 1) {
				stops.push([
					1,
					lastStop[1]
				]);
			}

			// Compute the stops
			each(stops, function (stop, i) {
				if (regexRgba.test(stop[1])) {
					colorObject = Color(stop[1]);
					stopColor = colorObject.get('rgb');
					stopOpacity = colorObject.get('a');
				} else {
					stopColor = stop[1];
					stopOpacity = 1;
				}

				// Build the color attribute
				colors.push((stop[0] * 100) + '% ' + stopColor);

				// Only start and end opacities are allowed, so we use the first and the last
				if (!i) {
					opacity1 = stopOpacity;
					color2 = stopColor;
				} else {
					opacity2 = stopOpacity;
					color1 = stopColor;
				}
			});

			// Apply the gradient to fills only.
			if (prop === 'fill') {

				// Handle linear gradient angle
				if (fillType === 'gradient') {
					x1 = gradient.x1 || gradient[0] || 0;
					y1 = gradient.y1 || gradient[1] || 0;
					x2 = gradient.x2 || gradient[2] || 0;
					y2 = gradient.y2 || gradient[3] || 0;
					fillAttr = 'angle="' + (90  - math.atan(
						(y2 - y1) / // y vector
						(x2 - x1) // x vector
						) * 180 / mathPI) + '"';

					addFillNode();

				// Radial (circular) gradient
				} else {

					var r = gradient.r,
						sizex = r * 2,
						sizey = r * 2,
						cx = gradient.cx,
						cy = gradient.cy,
						radialReference = elem.radialReference,
						bBox,
						applyRadialGradient = function () {
							if (radialReference) {
								bBox = wrapper.getBBox();
								cx += (radialReference[0] - bBox.x) / bBox.width - 0.5;
								cy += (radialReference[1] - bBox.y) / bBox.height - 0.5;
								sizex *= radialReference[2] / bBox.width;
								sizey *= radialReference[2] / bBox.height;
							}
							fillAttr = 'src="' + defaultOptions.global.VMLRadialGradientURL + '" ' +
								'size="' + sizex + ',' + sizey + '" ' +
								'origin="0.5,0.5" ' +
								'position="' + cx + ',' + cy + '" ' +
								'color2="' + color2 + '" ';

							addFillNode();
						};

					// Apply radial gradient
					if (wrapper.added) {
						applyRadialGradient();
					} else {
						// We need to know the bounding box to get the size and position right
						addEvent(wrapper, 'add', applyRadialGradient);
					}

					// The fill element's color attribute is broken in IE8 standards mode, so we
					// need to set the parent shape's fillcolor attribute instead.
					ret = color1;
				}

			// Gradients are not supported for VML stroke, return the first color. #722.
			} else {
				ret = stopColor;
			}

		// if the color is an rgba color, split it and add a fill node
		// to hold the opacity component
		} else if (regexRgba.test(color) && elem.tagName !== 'IMG') {

			colorObject = Color(color);

			markup = ['<', prop, ' opacity="', colorObject.get('a'), '"/>'];
			createElement(this.prepVML(markup), null, null, elem);

			ret = colorObject.get('rgb');


		} else {
			var propNodes = elem.getElementsByTagName(prop); // 'stroke' or 'fill' node
			if (propNodes.length) {
				propNodes[0].opacity = 1;
				propNodes[0].type = 'solid';
			}
			ret = color;
		}

		return ret;
	},

	/**
	 * Take a VML string and prepare it for either IE8 or IE6/IE7.
	 * @param {Array} markup A string array of the VML markup to prepare
	 */
	prepVML: function (markup) {
		var vmlStyle = 'display:inline-block;behavior:url(#default#VML);',
			isIE8 = this.isIE8;

		markup = markup.join('');

		if (isIE8) { // add xmlns and style inline
			markup = markup.replace('/>', ' xmlns="urn:schemas-microsoft-com:vml" />');
			if (markup.indexOf('style="') === -1) {
				markup = markup.replace('/>', ' style="' + vmlStyle + '" />');
			} else {
				markup = markup.replace('style="', 'style="' + vmlStyle);
			}

		} else { // add namespace
			markup = markup.replace('<', '<hcv:');
		}

		return markup;
	},

	/**
	 * Create rotated and aligned text
	 * @param {String} str
	 * @param {Number} x
	 * @param {Number} y
	 */
	text: SVGRenderer.prototype.html,

	/**
	 * Create and return a path element
	 * @param {Array} path
	 */
	path: function (path) {
		var attr = {
			// subpixel precision down to 0.1 (width and height = 1px)
			coordsize: '10 10'
		};
		if (isArray(path)) {
			attr.d = path;
		} else if (isObject(path)) { // attributes
			extend(attr, path);
		}
		// create the shape
		return this.createElement('shape').attr(attr);
	},

	/**
	 * Create and return a circle element. In VML circles are implemented as
	 * shapes, which is faster than v:oval
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} r
	 */
	circle: function (x, y, r) {
		var circle = this.symbol('circle');
		if (isObject(x)) {
			r = x.r;
			y = x.y;
			x = x.x;
		}
		circle.isCircle = true; // Causes x and y to mean center (#1682)
		circle.r = r;
		return circle.attr({ x: x, y: y });
	},

	/**
	 * Create a group using an outer div and an inner v:group to allow rotating
	 * and flipping. A simple v:group would have problems with positioning
	 * child HTML elements and CSS clip.
	 *
	 * @param {String} name The name of the group
	 */
	g: function (name) {
		var wrapper,
			attribs;

		// set the class name
		if (name) {
			attribs = { 'className': PREFIX + name, 'class': PREFIX + name };
		}

		// the div to hold HTML and clipping
		wrapper = this.createElement(DIV).attr(attribs);

		return wrapper;
	},

	/**
	 * VML override to create a regular HTML image
	 * @param {String} src
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} width
	 * @param {Number} height
	 */
	image: function (src, x, y, width, height) {
		var obj = this.createElement('img')
			.attr({ src: src });

		if (arguments.length > 1) {
			obj.attr({
				x: x,
				y: y,
				width: width,
				height: height
			});
		}
		return obj;
	},

	/**
	 * VML uses a shape for rect to overcome bugs and rotation problems
	 */
	rect: function (x, y, width, height, r, strokeWidth) {

		var wrapper = this.symbol('rect');
		wrapper.r = isObject(x) ? x.r : r;

		//return wrapper.attr(wrapper.crisp(strokeWidth, x, y, mathMax(width, 0), mathMax(height, 0)));
		return wrapper.attr(
				isObject(x) ?
					x :
					// do not crispify when an object is passed in (as in column charts)
					wrapper.crisp(strokeWidth, x, y, mathMax(width, 0), mathMax(height, 0))
			);
	},

	/**
	 * In the VML renderer, each child of an inverted div (group) is inverted
	 * @param {Object} element
	 * @param {Object} parentNode
	 */
	invertChild: function (element, parentNode) {
		var parentStyle = parentNode.style;
		css(element, {
			flip: 'x',
			left: pInt(parentStyle.width) - 1,
			top: pInt(parentStyle.height) - 1,
			rotation: -90
		});
	},

	/**
	 * Symbol definitions that override the parent SVG renderer's symbols
	 *
	 */
	symbols: {
		// VML specific arc function
		arc: function (x, y, w, h, options) {
			var start = options.start,
				end = options.end,
				radius = options.r || w || h,
				innerRadius = options.innerR,
				cosStart = mathCos(start),
				sinStart = mathSin(start),
				cosEnd = mathCos(end),
				sinEnd = mathSin(end),
				ret;

			if (end - start === 0) { // no angle, don't show it.
				return ['x'];
			}

			ret = [
				'wa', // clockwise arc to
				x - radius, // left
				y - radius, // top
				x + radius, // right
				y + radius, // bottom
				x + radius * cosStart, // start x
				y + radius * sinStart, // start y
				x + radius * cosEnd, // end x
				y + radius * sinEnd  // end y
			];

			if (options.open && !innerRadius) {
				ret.push(
					'e',
					M,
					x,// - innerRadius,
					y// - innerRadius
				);
			}

			ret.push(
				'at', // anti clockwise arc to
				x - innerRadius, // left
				y - innerRadius, // top
				x + innerRadius, // right
				y + innerRadius, // bottom
				x + innerRadius * cosEnd, // start x
				y + innerRadius * sinEnd, // start y
				x + innerRadius * cosStart, // end x
				y + innerRadius * sinStart, // end y
				'x', // finish path
				'e' // close
			);

			ret.isArc = true;
			return ret;

		},
		// Add circle symbol path. This performs significantly faster than v:oval.
		circle: function (x, y, w, h, wrapper) {

			if (wrapper) {
				w = h = 2 * wrapper.r;
			}

			// Center correction, #1682
			if (wrapper && wrapper.isCircle) {
				x -= w / 2;
				y -= h / 2;
			}

			// Return the path
			return [
				'wa', // clockwisearcto
				x, // left
				y, // top
				x + w, // right
				y + h, // bottom
				x + w, // start x
				y + h / 2,     // start y
				x + w, // end x
				y + h / 2,     // end y
				//'x', // finish path
				'e' // close
			];
		},
		/**
		 * Add rectangle symbol path which eases rotation and omits arcsize problems
		 * compared to the built-in VML roundrect shape
		 *
		 * @param {Number} left Left position
		 * @param {Number} top Top position
		 * @param {Number} r Border radius
		 * @param {Object} options Width and height
		 */

		rect: function (left, top, width, height, options) {

			var right = left + width,
				bottom = top + height,
				ret,
				r;

			// No radius, return the more lightweight square
			if (!defined(options) || !options.r) {
				ret = SVGRenderer.prototype.symbols.square.apply(0, arguments);

			// Has radius add arcs for the corners
			} else {

				r = mathMin(options.r, width, height);
				ret = [
					M,
					left + r, top,

					L,
					right - r, top,
					'wa',
					right - 2 * r, top,
					right, top + 2 * r,
					right - r, top,
					right, top + r,

					L,
					right, bottom - r,
					'wa',
					right - 2 * r, bottom - 2 * r,
					right, bottom,
					right, bottom - r,
					right - r, bottom,

					L,
					left + r, bottom,
					'wa',
					left, bottom - 2 * r,
					left + 2 * r, bottom,
					left + r, bottom,
					left, bottom - r,

					L,
					left, top + r,
					'wa',
					left, top,
					left + 2 * r, top + 2 * r,
					left, top + r,
					left + r, top,


					'x',
					'e'
				];
			}
			return ret;
		}
	}
};
Highcharts.VMLRenderer = VMLRenderer = function () {
	this.init.apply(this, arguments);
};
VMLRenderer.prototype = merge(SVGRenderer.prototype, VMLRendererExtension);

	// general renderer
	Renderer = VMLRenderer;
}

// This method is used with exporting in old IE, when emulating SVG (see #2314)
SVGRenderer.prototype.measureSpanWidth = function (text, styles) {
	var measuringSpan = doc.createElement('span'),
		offsetWidth,
	textNode = doc.createTextNode(text);

	measuringSpan.appendChild(textNode);
	css(measuringSpan, styles);
	this.box.appendChild(measuringSpan);
	offsetWidth = measuringSpan.offsetWidth;
	discardElement(measuringSpan); // #2463
	return offsetWidth;
};


/* ****************************************************************************
 *                                                                            *
 * END OF INTERNET EXPLORER <= 8 SPECIFIC CODE                                *
 *                                                                            *
 *****************************************************************************/
/* ****************************************************************************
 *                                                                            *
 * START OF ANDROID < 3 SPECIFIC CODE. THIS CAN BE REMOVED IF YOU'RE NOT      *
 * TARGETING THAT SYSTEM.                                                     *
 *                                                                            *
 *****************************************************************************/
var CanVGRenderer,
	CanVGController;

if (useCanVG) {
	/**
	 * The CanVGRenderer is empty from start to keep the source footprint small.
	 * When requested, the CanVGController downloads the rest of the source packaged
	 * together with the canvg library.
	 */
	Highcharts.CanVGRenderer = CanVGRenderer = function () {
		// Override the global SVG namespace to fake SVG/HTML that accepts CSS
		SVG_NS = 'http://www.w3.org/1999/xhtml';
	};

	/**
	 * Start with an empty symbols object. This is needed when exporting is used (exporting.src.js will add a few symbols), but 
	 * the implementation from SvgRenderer will not be merged in until first render.
	 */
	CanVGRenderer.prototype.symbols = {};

	/**
	 * Handles on demand download of canvg rendering support.
	 */
	CanVGController = (function () {
		// List of renderering calls
		var deferredRenderCalls = [];

		/**
		 * When downloaded, we are ready to draw deferred charts.
		 */
		function drawDeferred() {
			var callLength = deferredRenderCalls.length,
				callIndex;

			// Draw all pending render calls
			for (callIndex = 0; callIndex < callLength; callIndex++) {
				deferredRenderCalls[callIndex]();
			}
			// Clear the list
			deferredRenderCalls = [];
		}

		return {
			push: function (func, scriptLocation) {
				// Only get the script once
				if (deferredRenderCalls.length === 0) {
					getScript(scriptLocation, drawDeferred);
				}
				// Register render call
				deferredRenderCalls.push(func);
			}
		};
	}());

	Renderer = CanVGRenderer;
} // end CanVGRenderer

/* ****************************************************************************
 *                                                                            *
 * END OF ANDROID < 3 SPECIFIC CODE                                           *
 *                                                                            *
 *****************************************************************************/

/**
 * The Tick class
 */
function Tick(axis, pos, type, noLabel) {
	this.axis = axis;
	this.pos = pos;
	this.type = type || '';
	this.isNew = true;

	if (!type && !noLabel) {
		this.addLabel();
	}
}

Tick.prototype = {
	/**
	 * Write the tick label
	 */
	addLabel: function () {
		var tick = this,
			axis = tick.axis,
			options = axis.options,
			chart = axis.chart,
			horiz = axis.horiz,
			categories = axis.categories,
			names = axis.names,
			pos = tick.pos,
			labelOptions = options.labels,
			str,
			tickPositions = axis.tickPositions,
			width = (horiz && categories &&
				!labelOptions.step && !labelOptions.staggerLines &&
				!labelOptions.rotation &&
				chart.plotWidth / tickPositions.length) ||
				(!horiz && (chart.margin[3] || chart.chartWidth * 0.33)), // #1580, #1931
			isFirst = pos === tickPositions[0],
			isLast = pos === tickPositions[tickPositions.length - 1],
			css,
			attr,
			value = categories ?
				pick(categories[pos], names[pos], pos) : 
				pos,
			label = tick.label,
			tickPositionInfo = tickPositions.info,
			dateTimeLabelFormat;

		// Set the datetime label format. If a higher rank is set for this position, use that. If not,
		// use the general format.
		if (axis.isDatetimeAxis && tickPositionInfo) {
			dateTimeLabelFormat = options.dateTimeLabelFormats[tickPositionInfo.higherRanks[pos] || tickPositionInfo.unitName];
		}

		// set properties for access in render method
		tick.isFirst = isFirst;
		tick.isLast = isLast;

		// get the string
		str = axis.labelFormatter.call({
			axis: axis,
			chart: chart,
			isFirst: isFirst,
			isLast: isLast,
			dateTimeLabelFormat: dateTimeLabelFormat,
			value: axis.isLog ? correctFloat(lin2log(value)) : value
		});

		// prepare CSS
		css = width && { width: mathMax(1, mathRound(width - 2 * (labelOptions.padding || 10))) + PX };
		css = extend(css, labelOptions.style);

		// first call
		if (!defined(label)) {
			attr = {
				align: axis.labelAlign
			};
			if (isNumber(labelOptions.rotation)) {
				attr.rotation = labelOptions.rotation;
			}
			if (width && labelOptions.ellipsis) {
				attr._clipHeight = axis.len / tickPositions.length;
			}

			tick.label =
				defined(str) && labelOptions.enabled ?
					chart.renderer.text(
							str,
							0,
							0,
							labelOptions.useHTML
						)
						.attr(attr)
						// without position absolute, IE export sometimes is wrong
						.css(css)
						.add(axis.labelGroup) :
					null;

		// update
		} else if (label) {
			label.attr({
					text: str
				})
				.css(css);
		}
	},

	/**
	 * Get the offset height or width of the label
	 */
	getLabelSize: function () {
		var label = this.label,
			axis = this.axis;
		return label ?
			label.getBBox()[axis.horiz ? 'height' : 'width'] :
			0;
	},

	/**
	 * Find how far the labels extend to the right and left of the tick's x position. Used for anti-collision
	 * detection with overflow logic.
	 */
	getLabelSides: function () {
		var bBox = this.label.getBBox(),
			axis = this.axis,
			horiz = axis.horiz,
			options = axis.options,
			labelOptions = options.labels,
			size = horiz ? bBox.width : bBox.height,
			leftSide = horiz ?
				size * { left: 0, center: 0.5, right: 1 }[axis.labelAlign] - labelOptions.x : 
				size;

		return [-leftSide, size - leftSide];
	},

	/**
	 * Handle the label overflow by adjusting the labels to the left and right edge, or
	 * hide them if they collide into the neighbour label.
	 */
	handleOverflow: function (index, xy) {
		var show = true,
			axis = this.axis,
			isFirst = this.isFirst,
			isLast = this.isLast,
			horiz = axis.horiz,
			pxPos = horiz ? xy.x : xy.y,
			reversed = axis.reversed,
			tickPositions = axis.tickPositions,
			sides = this.getLabelSides(),
			leftSide = sides[0],
			rightSide = sides[1],
			axisLeft = axis.pos,
			axisRight = axisLeft + axis.len,
			neighbour,
			neighbourEdge,
			line = this.label.line || 0,
			labelEdge = axis.labelEdge,
			justifyLabel = axis.justifyLabels && (isFirst || isLast);

		// Hide it if it now overlaps the neighbour label
		if (labelEdge[line] === UNDEFINED || pxPos + leftSide > labelEdge[line]) {
			labelEdge[line] = pxPos + rightSide;
			
		} else if (!justifyLabel) {
			show = false;
		}
		
		if (justifyLabel) {
			neighbour = axis.ticks[tickPositions[index + (isFirst ? 1 : -1)]];
			neighbourEdge = neighbour && neighbour.label.xy && neighbour.label.xy.x + neighbour.getLabelSides()[isFirst ? 0 : 1];

			if ((isFirst && !reversed) || (isLast && reversed)) {
				// Is the label spilling out to the left of the plot area?
				if (pxPos + leftSide < axisLeft) {

					// Align it to plot left
					pxPos = axisLeft - leftSide;

					// Hide it if it now overlaps the neighbour label
					if (neighbour && pxPos + rightSide > neighbourEdge) {
						show = false;
					}
				}

			} else {
				// Is the label spilling out to the right of the plot area?
				if (pxPos + rightSide > axisRight) {

					// Align it to plot right
					pxPos = axisRight - rightSide;

					// Hide it if it now overlaps the neighbour label
					if (neighbour && pxPos + leftSide < neighbourEdge) {
						show = false;
					}

				}
			}

			// Set the modified x position of the label
			xy.x = pxPos;
		}
		return show;
	},

	/**
	 * Get the x and y position for ticks and labels
	 */
	getPosition: function (horiz, pos, tickmarkOffset, old) {
		var axis = this.axis,
			chart = axis.chart,
			cHeight = (old && chart.oldChartHeight) || chart.chartHeight;
		
		return {
			x: horiz ?
				axis.translate(pos + tickmarkOffset, null, null, old) + axis.transB :
				axis.left + axis.offset + (axis.opposite ? ((old && chart.oldChartWidth) || chart.chartWidth) - axis.right - axis.left : 0),

			y: horiz ?
				cHeight - axis.bottom + axis.offset - (axis.opposite ? axis.height : 0) :
				cHeight - axis.translate(pos + tickmarkOffset, null, null, old) - axis.transB
		};
		
	},
	
	/**
	 * Get the x, y position of the tick label
	 */
	getLabelPosition: function (x, y, label, horiz, labelOptions, tickmarkOffset, index, step) {
		var axis = this.axis,
			transA = axis.transA,
			reversed = axis.reversed,
			staggerLines = axis.staggerLines,
			baseline = axis.chart.renderer.fontMetrics(labelOptions.style.fontSize).b,
			rotation = labelOptions.rotation;
			
		x = x + labelOptions.x - (tickmarkOffset && horiz ?
			tickmarkOffset * transA * (reversed ? -1 : 1) : 0);
		y = y + labelOptions.y - (tickmarkOffset && !horiz ?
			tickmarkOffset * transA * (reversed ? 1 : -1) : 0);

		// Correct for rotation (#1764)
		if (rotation && axis.side === 2) {
			y -= baseline - baseline * mathCos(rotation * deg2rad);
		}
		
		// Vertically centered
		if (!defined(labelOptions.y) && !rotation) { // #1951
			y += baseline - label.getBBox().height / 2;
		}
		
		// Correct for staggered labels
		if (staggerLines) {
			label.line = (index / (step || 1) % staggerLines);
			y += label.line * (axis.labelOffset / staggerLines);
		}
		
		return {
			x: x,
			y: y
		};
	},
	
	/**
	 * Extendible method to return the path of the marker
	 */
	getMarkPath: function (x, y, tickLength, tickWidth, horiz, renderer) {
		return renderer.crispLine([
				M,
				x,
				y,
				L,
				x + (horiz ? 0 : -tickLength),
				y + (horiz ? tickLength : 0)
			], tickWidth);
	},

	/**
	 * Put everything in place
	 *
	 * @param index {Number}
	 * @param old {Boolean} Use old coordinates to prepare an animation into new position
	 */
	render: function (index, old, opacity) {
		var tick = this,
			axis = tick.axis,
			options = axis.options,
			chart = axis.chart,
			renderer = chart.renderer,
			horiz = axis.horiz,
			type = tick.type,
			label = tick.label,
			pos = tick.pos,
			labelOptions = options.labels,
			gridLine = tick.gridLine,
			gridPrefix = type ? type + 'Grid' : 'grid',
			tickPrefix = type ? type + 'Tick' : 'tick',
			gridLineWidth = options[gridPrefix + 'LineWidth'],
			gridLineColor = options[gridPrefix + 'LineColor'],
			dashStyle = options[gridPrefix + 'LineDashStyle'],
			tickLength = options[tickPrefix + 'Length'],
			tickWidth = options[tickPrefix + 'Width'] || 0,
			tickColor = options[tickPrefix + 'Color'],
			tickPosition = options[tickPrefix + 'Position'],
			gridLinePath,
			mark = tick.mark,
			markPath,
			step = labelOptions.step,
			attribs,
			show = true,
			tickmarkOffset = axis.tickmarkOffset,
			xy = tick.getPosition(horiz, pos, tickmarkOffset, old),
			x = xy.x,
			y = xy.y,
			reverseCrisp = ((horiz && x === axis.pos + axis.len) || (!horiz && y === axis.pos)) ? -1 : 1; // #1480, #1687

		this.isActive = true;
		
		// create the grid line
		if (gridLineWidth) {
			gridLinePath = axis.getPlotLinePath(pos + tickmarkOffset, gridLineWidth * reverseCrisp, old, true);

			if (gridLine === UNDEFINED) {
				attribs = {
					stroke: gridLineColor,
					'stroke-width': gridLineWidth
				};
				if (dashStyle) {
					attribs.dashstyle = dashStyle;
				}
				if (!type) {
					attribs.zIndex = 1;
				}
				if (old) {
					attribs.opacity = 0;
				}
				tick.gridLine = gridLine =
					gridLineWidth ?
						renderer.path(gridLinePath)
							.attr(attribs).add(axis.gridGroup) :
						null;
			}

			// If the parameter 'old' is set, the current call will be followed
			// by another call, therefore do not do any animations this time
			if (!old && gridLine && gridLinePath) {
				gridLine[tick.isNew ? 'attr' : 'animate']({
					d: gridLinePath,
					opacity: opacity
				});
			}
		}

		// create the tick mark
		if (tickWidth && tickLength) {

			// negate the length
			if (tickPosition === 'inside') {
				tickLength = -tickLength;
			}
			if (axis.opposite) {
				tickLength = -tickLength;
			}

			markPath = tick.getMarkPath(x, y, tickLength, tickWidth * reverseCrisp, horiz, renderer);

			if (mark) { // updating
				mark.animate({
					d: markPath,
					opacity: opacity
				});
			} else { // first time
				tick.mark = renderer.path(
					markPath
				).attr({
					stroke: tickColor,
					'stroke-width': tickWidth,
					opacity: opacity
				}).add(axis.axisGroup);
			}
		}

		// the label is created on init - now move it into place
		if (label && !isNaN(x)) {
			label.xy = xy = tick.getLabelPosition(x, y, label, horiz, labelOptions, tickmarkOffset, index, step);

			// Apply show first and show last. If the tick is both first and last, it is 
			// a single centered tick, in which case we show the label anyway (#2100).
			if ((tick.isFirst && !tick.isLast && !pick(options.showFirstLabel, 1)) ||
					(tick.isLast && !tick.isFirst && !pick(options.showLastLabel, 1))) {
				show = false;

			// Handle label overflow and show or hide accordingly
			} else if (!axis.isRadial && !labelOptions.step && !labelOptions.rotation && !old && opacity !== 0) {
				show = tick.handleOverflow(index, xy);
			}

			// apply step
			if (step && index % step) {
				// show those indices dividable by step
				show = false;
			}
		
			// Set the new position, and show or hide
			if (show && !isNaN(xy.y)) {
				xy.opacity = opacity;
				label[tick.isNew ? 'attr' : 'animate'](xy);
				tick.isNew = false;
			} else {
				label.attr('y', -9999); // #1338
			}
		}
	},

	/**
	 * Destructor for the tick prototype
	 */
	destroy: function () {
		destroyObjectProperties(this, this.axis);
	}
};

/**
 * The object wrapper for plot lines and plot bands
 * @param {Object} options
 */
var PlotLineOrBand = function (axis, options) {
	this.axis = axis;

	if (options) {
		this.options = options;
		this.id = options.id;
	}
};

PlotLineOrBand.prototype = {
	
	/**
	 * Render the plot line or plot band. If it is already existing,
	 * move it.
	 */
	render: function () {
		var plotLine = this,
			axis = plotLine.axis,
			horiz = axis.horiz,
			halfPointRange = (axis.pointRange || 0) / 2,
			options = plotLine.options,
			optionsLabel = options.label,
			label = plotLine.label,
			width = options.width,
			to = options.to,
			from = options.from,
			isBand = defined(from) && defined(to),
			value = options.value,
			dashStyle = options.dashStyle,
			svgElem = plotLine.svgElem,
			path = [],
			addEvent,
			eventType,
			xs,
			ys,
			x,
			y,
			color = options.color,
			zIndex = options.zIndex,
			events = options.events,
			attribs,
			renderer = axis.chart.renderer;

		// logarithmic conversion
		if (axis.isLog) {
			from = log2lin(from);
			to = log2lin(to);
			value = log2lin(value);
		}

		// plot line
		if (width) {
			path = axis.getPlotLinePath(value, width);
			attribs = {
				stroke: color,
				'stroke-width': width
			};
			if (dashStyle) {
				attribs.dashstyle = dashStyle;
			}
		} else if (isBand) { // plot band
			
			// keep within plot area
			from = mathMax(from, axis.min - halfPointRange);
			to = mathMin(to, axis.max + halfPointRange);
			
			path = axis.getPlotBandPath(from, to, options);
			attribs = {
				fill: color
			};
			if (options.borderWidth) {
				attribs.stroke = options.borderColor;
				attribs['stroke-width'] = options.borderWidth;
			}
		} else {
			return;
		}
		// zIndex
		if (defined(zIndex)) {
			attribs.zIndex = zIndex;
		}

		// common for lines and bands
		if (svgElem) {
			if (path) {
				svgElem.animate({
					d: path
				}, null, svgElem.onGetPath);
			} else {
				svgElem.hide();
				svgElem.onGetPath = function () {
					svgElem.show();
				};
				if (label) {
					plotLine.label = label = label.destroy();
				}
			}
		} else if (path && path.length) {
			plotLine.svgElem = svgElem = renderer.path(path)
				.attr(attribs).add();

			// events
			if (events) {
				addEvent = function (eventType) {
					svgElem.on(eventType, function (e) {
						events[eventType].apply(plotLine, [e]);
					});
				};
				for (eventType in events) {
					addEvent(eventType);
				}
			}
		}

		// the plot band/line label
		if (optionsLabel && defined(optionsLabel.text) && path && path.length && axis.width > 0 && axis.height > 0) {
			// apply defaults
			optionsLabel = merge({
				align: horiz && isBand && 'center',
				x: horiz ? !isBand && 4 : 10,
				verticalAlign : !horiz && isBand && 'middle',
				y: horiz ? isBand ? 16 : 10 : isBand ? 6 : -4,
				rotation: horiz && !isBand && 90
			}, optionsLabel);

			// add the SVG element
			if (!label) {
				plotLine.label = label = renderer.text(
						optionsLabel.text,
						0,
						0,
						optionsLabel.useHTML
					)
					.attr({
						align: optionsLabel.textAlign || optionsLabel.align,
						rotation: optionsLabel.rotation,
						zIndex: zIndex
					})
					.css(optionsLabel.style)
					.add();
			}

			// get the bounding box and align the label
			xs = [path[1], path[4], pick(path[6], path[1])];
			ys = [path[2], path[5], pick(path[7], path[2])];
			x = arrayMin(xs);
			y = arrayMin(ys);

			label.align(optionsLabel, false, {
				x: x,
				y: y,
				width: arrayMax(xs) - x,
				height: arrayMax(ys) - y
			});
			label.show();

		} else if (label) { // move out of sight
			label.hide();
		}

		// chainable
		return plotLine;
	},

	/**
	 * Remove the plot line or band
	 */
	destroy: function () {
		// remove it from the lookup
		erase(this.axis.plotLinesAndBands, this);
		
		delete this.axis;
		destroyObjectProperties(this);
	}
};

/**
 * Object with members for extending the Axis prototype
 */

AxisPlotLineOrBandExtension = {

	/**
	 * Create the path for a plot band
	 */ 
	getPlotBandPath: function (from, to) {
		var toPath = this.getPlotLinePath(to),
			path = this.getPlotLinePath(from);

		if (path && toPath) {
			path.push(
				toPath[4],
				toPath[5],
				toPath[1],
				toPath[2]
			);
		} else { // outside the axis area
			path = null;
		}
		
		return path;
	},

	addPlotBand: function (options) {
		this.addPlotBandOrLine(options, 'plotBands');
	},
	
	addPlotLine: function (options) {
			this.addPlotBandOrLine(options, 'plotLines');
	},

	/**
	 * Add a plot band or plot line after render time
	 *
	 * @param options {Object} The plotBand or plotLine configuration object
	 */
	addPlotBandOrLine: function (options, coll) {
		var obj = new PlotLineOrBand(this, options).render(),
			userOptions = this.userOptions;

		if (obj) { // #2189
			// Add it to the user options for exporting and Axis.update
			if (coll) {
				userOptions[coll] = userOptions[coll] || [];
				userOptions[coll].push(options); 
			}
			this.plotLinesAndBands.push(obj); 
		}
		
		return obj;
	},

	/**
	 * Remove a plot band or plot line from the chart by id
	 * @param {Object} id
	 */
	removePlotBandOrLine: function (id) {
		var plotLinesAndBands = this.plotLinesAndBands,
			options = this.options,
			userOptions = this.userOptions,
			i = plotLinesAndBands.length;
		while (i--) {
			if (plotLinesAndBands[i].id === id) {
				plotLinesAndBands[i].destroy();
			}
		}
		each([options.plotLines || [], userOptions.plotLines || [], options.plotBands || [], userOptions.plotBands || []], function (arr) {
			i = arr.length;
			while (i--) {
				if (arr[i].id === id) {
					erase(arr, arr[i]);
				}
			}
		});
	}
};

/**
 * Create a new axis object
 * @param {Object} chart
 * @param {Object} options
 */
function Axis() {
	this.init.apply(this, arguments);
}

Axis.prototype = {

	/**
	 * Default options for the X axis - the Y axis has extended defaults
	 */
	defaultOptions: {
		// allowDecimals: null,
		// alternateGridColor: null,
		// categories: [],
		dateTimeLabelFormats: {
			millisecond: '%H:%M:%S.%L',
			second: '%H:%M:%S',
			minute: '%H:%M',
			hour: '%H:%M',
			day: '%e. %b',
			week: '%e. %b',
			month: '%b \'%y',
			year: '%Y'
		},
		endOnTick: false,
		gridLineColor: '#C0C0C0',
		// gridLineDashStyle: 'solid',
		// gridLineWidth: 0,
		// reversed: false,

		labels: defaultLabelOptions,
			// { step: null },
		lineColor: '#C0D0E0',
		lineWidth: 1,
		//linkedTo: null,
		//max: undefined,
		//min: undefined,
		minPadding: 0.01,
		maxPadding: 0.01,
		//minRange: null,
		minorGridLineColor: '#E0E0E0',
		// minorGridLineDashStyle: null,
		minorGridLineWidth: 1,
		minorTickColor: '#A0A0A0',
		//minorTickInterval: null,
		minorTickLength: 2,
		minorTickPosition: 'outside', // inside or outside
		//minorTickWidth: 0,
		//opposite: false,
		//offset: 0,
		//plotBands: [{
		//	events: {},
		//	zIndex: 1,
		//	labels: { align, x, verticalAlign, y, style, rotation, textAlign }
		//}],
		//plotLines: [{
		//	events: {}
		//  dashStyle: {}
		//	zIndex:
		//	labels: { align, x, verticalAlign, y, style, rotation, textAlign }
		//}],
		//reversed: false,
		// showFirstLabel: true,
		// showLastLabel: true,
		startOfWeek: 1,
		startOnTick: false,
		tickColor: '#C0D0E0',
		//tickInterval: null,
		tickLength: 5,
		tickmarkPlacement: 'between', // on or between
		tickPixelInterval: 100,
		tickPosition: 'outside',
		tickWidth: 1,
		title: {
			//text: null,
			align: 'middle', // low, middle or high
			//margin: 0 for horizontal, 10 for vertical axes,
			//rotation: 0,
			//side: 'outside',
			style: {
				color: '#4d759e',
				//font: defaultFont.replace('normal', 'bold')
				fontWeight: 'bold'
			}
			//x: 0,
			//y: 0
		},
		type: 'linear' // linear, logarithmic or datetime
	},

	/**
	 * This options set extends the defaultOptions for Y axes
	 */
	defaultYAxisOptions: {
		endOnTick: true,
		gridLineWidth: 1,
		tickPixelInterval: 72,
		showLastLabel: true,
		labels: {
			x: -8,
			y: 3
		},
		lineWidth: 0,
		maxPadding: 0.05,
		minPadding: 0.05,
		startOnTick: true,
		tickWidth: 0,
		title: {
			rotation: 270,
			text: 'Values'
		},
		stackLabels: {
			enabled: false,
			//align: dynamic,
			//y: dynamic,
			//x: dynamic,
			//verticalAlign: dynamic,
			//textAlign: dynamic,
			//rotation: 0,
			formatter: function () {
				return numberFormat(this.total, -1);
			},
			style: defaultLabelOptions.style
		}
	},

	/**
	 * These options extend the defaultOptions for left axes
	 */
	defaultLeftAxisOptions: {
		labels: {
			x: -8,
			y: null
		},
		title: {
			rotation: 270
		}
	},

	/**
	 * These options extend the defaultOptions for right axes
	 */
	defaultRightAxisOptions: {
		labels: {
			x: 8,
			y: null
		},
		title: {
			rotation: 90
		}
	},

	/**
	 * These options extend the defaultOptions for bottom axes
	 */
	defaultBottomAxisOptions: {
		labels: {
			x: 0,
			y: 14
			// overflow: undefined,
			// staggerLines: null
		},
		title: {
			rotation: 0
		}
	},
	/**
	 * These options extend the defaultOptions for left axes
	 */
	defaultTopAxisOptions: {
		labels: {
			x: 0,
			y: -5
			// overflow: undefined
			// staggerLines: null
		},
		title: {
			rotation: 0
		}
	},

	/**
	 * Initialize the axis
	 */
	init: function (chart, userOptions) {


		var isXAxis = userOptions.isX,
			axis = this;

		// Flag, is the axis horizontal
		axis.horiz = chart.inverted ? !isXAxis : isXAxis;

		// Flag, isXAxis
		axis.isXAxis = isXAxis;
		axis.coll = isXAxis ? 'xAxis' : 'yAxis';
	
		axis.opposite = userOptions.opposite; // needed in setOptions
		axis.side = userOptions.side || (axis.horiz ?
				(axis.opposite ? 0 : 2) : // top : bottom
				(axis.opposite ? 1 : 3));  // right : left

		axis.setOptions(userOptions);


		var options = this.options,
			type = options.type,
			isDatetimeAxis = type === 'datetime';

		axis.labelFormatter = options.labels.formatter || axis.defaultLabelFormatter; // can be overwritten by dynamic format


		// Flag, stagger lines or not
		axis.userOptions = userOptions;

		//axis.axisTitleMargin = UNDEFINED,// = options.title.margin,
		axis.minPixelPadding = 0;
		//axis.ignoreMinPadding = UNDEFINED; // can be set to true by a column or bar series
		//axis.ignoreMaxPadding = UNDEFINED;

		axis.chart = chart;
		axis.reversed = options.reversed;
		axis.zoomEnabled = options.zoomEnabled !== false;

		// Initial categories
		axis.categories = options.categories || type === 'category';
		axis.names = [];

		// Elements
		//axis.axisGroup = UNDEFINED;
		//axis.gridGroup = UNDEFINED;
		//axis.axisTitle = UNDEFINED;
		//axis.axisLine = UNDEFINED;

		// Shorthand types
		axis.isLog = type === 'logarithmic';
		axis.isDatetimeAxis = isDatetimeAxis;

		// Flag, if axis is linked to another axis
		axis.isLinked = defined(options.linkedTo);
		// Linked axis.
		//axis.linkedParent = UNDEFINED;

		// Tick positions
		//axis.tickPositions = UNDEFINED; // array containing predefined positions
		// Tick intervals
		//axis.tickInterval = UNDEFINED;
		//axis.minorTickInterval = UNDEFINED;

		axis.tickmarkOffset = (axis.categories && options.tickmarkPlacement === 'between') ? 0.5 : 0;

		// Major ticks
		axis.ticks = {};
		axis.labelEdge = [];
		// Minor ticks
		axis.minorTicks = {};
		//axis.tickAmount = UNDEFINED;

		// List of plotLines/Bands
		axis.plotLinesAndBands = [];

		// Alternate bands
		axis.alternateBands = {};

		// Axis metrics
		//axis.left = UNDEFINED;
		//axis.top = UNDEFINED;
		//axis.width = UNDEFINED;
		//axis.height = UNDEFINED;
		//axis.bottom = UNDEFINED;
		//axis.right = UNDEFINED;
		//axis.transA = UNDEFINED;
		//axis.transB = UNDEFINED;
		//axis.oldTransA = UNDEFINED;
		axis.len = 0;
		//axis.oldMin = UNDEFINED;
		//axis.oldMax = UNDEFINED;
		//axis.oldUserMin = UNDEFINED;
		//axis.oldUserMax = UNDEFINED;
		//axis.oldAxisLength = UNDEFINED;
		axis.minRange = axis.userMinRange = options.minRange || options.maxZoom;
		axis.range = options.range;
		axis.offset = options.offset || 0;


		// Dictionary for stacks
		axis.stacks = {};
		axis.oldStacks = {};

		// Dictionary for stacks max values
		axis.stackExtremes = {};

		// Min and max in the data
		//axis.dataMin = UNDEFINED,
		//axis.dataMax = UNDEFINED,

		// The axis range
		axis.max = null;
		axis.min = null;

		// User set min and max
		//axis.userMin = UNDEFINED,
		//axis.userMax = UNDEFINED,

		// Crosshair options
		axis.crosshair = pick(options.crosshair, splat(chart.options.tooltip.crosshairs)[isXAxis ? 0 : 1], false);
		// Run Axis

		var eventType,
			events = axis.options.events;

		// Register
		if (inArray(axis, chart.axes) === -1) { // don't add it again on Axis.update()
			chart.axes.push(axis);
			chart[axis.coll].push(axis);
		}

		axis.series = axis.series || []; // populated by Series

		// inverted charts have reversed xAxes as default
		if (chart.inverted && isXAxis && axis.reversed === UNDEFINED) {
			axis.reversed = true;
		}

		axis.removePlotBand = axis.removePlotBandOrLine;
		axis.removePlotLine = axis.removePlotBandOrLine;


		// register event listeners
		for (eventType in events) {
			addEvent(axis, eventType, events[eventType]);
		}

		// extend logarithmic axis
		if (axis.isLog) {
			axis.val2lin = log2lin;
			axis.lin2val = lin2log;
		}
	},

	/**
	 * Merge and set options
	 */
	setOptions: function (userOptions) {
		this.options = merge(
			this.defaultOptions,
			this.isXAxis ? {} : this.defaultYAxisOptions,
			[this.defaultTopAxisOptions, this.defaultRightAxisOptions,
				this.defaultBottomAxisOptions, this.defaultLeftAxisOptions][this.side],
			merge(
				defaultOptions[this.coll], // if set in setOptions (#1053)
				userOptions
			)
		);
	},

	/**
	 * The default label formatter. The context is a special config object for the label.
	 */
	defaultLabelFormatter: function () {
		var axis = this.axis,
			value = this.value,
			categories = axis.categories,
			dateTimeLabelFormat = this.dateTimeLabelFormat,
			numericSymbols = defaultOptions.lang.numericSymbols,
			i = numericSymbols && numericSymbols.length,
			multi,
			ret,
			formatOption = axis.options.labels.format,

			// make sure the same symbol is added for all labels on a linear axis
			numericSymbolDetector = axis.isLog ? value : axis.tickInterval;

		if (formatOption) {
			ret = format(formatOption, this);

		} else if (categories) {
			ret = value;

		} else if (dateTimeLabelFormat) { // datetime axis
			ret = dateFormat(dateTimeLabelFormat, value);

		} else if (i && numericSymbolDetector >= 1000) {
			// Decide whether we should add a numeric symbol like k (thousands) or M (millions).
			// If we are to enable this in tooltip or other places as well, we can move this
			// logic to the numberFormatter and enable it by a parameter.
			while (i-- && ret === UNDEFINED) {
				multi = Math.pow(1000, i + 1);
				if (numericSymbolDetector >= multi && numericSymbols[i] !== null) {
					ret = numberFormat(value / multi, -1) + numericSymbols[i];
				}
			}
		}

		if (ret === UNDEFINED) {
			if (value >= 10000) { // add thousands separators
				ret = numberFormat(value, 0);

			} else { // small numbers
				ret = numberFormat(value, -1, UNDEFINED, ''); // #2466
			}
		}

		return ret;
	},

	/**
	 * Get the minimum and maximum for the series of each axis
	 */
	getSeriesExtremes: function () {
		var axis = this,
			chart = axis.chart;

		axis.hasVisibleSeries = false;

		// reset dataMin and dataMax in case we're redrawing
		axis.dataMin = axis.dataMax = null;

		// reset cached stacking extremes
		axis.stackExtremes = {};

		axis.buildStacks();

		// loop through this axis' series
		each(axis.series, function (series) {

			if (series.visible || !chart.options.chart.ignoreHiddenSeries) {

				var seriesOptions = series.options,
					xData,
					threshold = seriesOptions.threshold,
					seriesDataMin,
					seriesDataMax;

				axis.hasVisibleSeries = true;

				// Validate threshold in logarithmic axes
				if (axis.isLog && threshold <= 0) {
					threshold = null;
				}

				// Get dataMin and dataMax for X axes
				if (axis.isXAxis) {
					xData = series.xData;
					if (xData.length) {
						axis.dataMin = mathMin(pick(axis.dataMin, xData[0]), arrayMin(xData));
						axis.dataMax = mathMax(pick(axis.dataMax, xData[0]), arrayMax(xData));
					}

				// Get dataMin and dataMax for Y axes, as well as handle stacking and processed data
				} else {

					// Get this particular series extremes
					series.getExtremes();
					seriesDataMax = series.dataMax;
					seriesDataMin = series.dataMin;

					// Get the dataMin and dataMax so far. If percentage is used, the min and max are
					// always 0 and 100. If seriesDataMin and seriesDataMax is null, then series
					// doesn't have active y data, we continue with nulls
					if (defined(seriesDataMin) && defined(seriesDataMax)) {
						axis.dataMin = mathMin(pick(axis.dataMin, seriesDataMin), seriesDataMin);
						axis.dataMax = mathMax(pick(axis.dataMax, seriesDataMax), seriesDataMax);
					}

					// Adjust to threshold
					if (defined(threshold)) {
						if (axis.dataMin >= threshold) {
							axis.dataMin = threshold;
							axis.ignoreMinPadding = true;
						} else if (axis.dataMax < threshold) {
							axis.dataMax = threshold;
							axis.ignoreMaxPadding = true;
						}
					}
				}
			}
		});
	},

	/**
	 * Translate from axis value to pixel position on the chart, or back
	 *
	 */
	translate: function (val, backwards, cvsCoord, old, handleLog, pointPlacement) {
		var axis = this,
			axisLength = axis.len,
			sign = 1,
			cvsOffset = 0,
			localA = old ? axis.oldTransA : axis.transA,
			localMin = old ? axis.oldMin : axis.min,
			returnValue,
			minPixelPadding = axis.minPixelPadding,
			postTranslate = (axis.options.ordinal || (axis.isLog && handleLog)) && axis.lin2val;

		if (!localA) {
			localA = axis.transA;
		}

		// In vertical axes, the canvas coordinates start from 0 at the top like in
		// SVG.
		if (cvsCoord) {
			sign *= -1; // canvas coordinates inverts the value
			cvsOffset = axisLength;
		}

		// Handle reversed axis
		if (axis.reversed) {
			sign *= -1;
			cvsOffset -= sign * axisLength;
		}

		// From pixels to value
		if (backwards) { // reverse translation

			val = val * sign + cvsOffset;
			val -= minPixelPadding;
			returnValue = val / localA + localMin; // from chart pixel to value
			if (postTranslate) { // log and ordinal axes
				returnValue = axis.lin2val(returnValue);
			}

		// From value to pixels
		} else {
			if (postTranslate) { // log and ordinal axes
				val = axis.val2lin(val);
			}
			if (pointPlacement === 'between') {
				pointPlacement = 0.5;
			}
			returnValue = sign * (val - localMin) * localA + cvsOffset + (sign * minPixelPadding) +
				(isNumber(pointPlacement) ? localA * pointPlacement * axis.pointRange : 0);
		}

		return returnValue;
	},

	/**
	 * Utility method to translate an axis value to pixel position.
	 * @param {Number} value A value in terms of axis units
	 * @param {Boolean} paneCoordinates Whether to return the pixel coordinate relative to the chart
	 *        or just the axis/pane itself.
	 */
	toPixels: function (value, paneCoordinates) {
		return this.translate(value, false, !this.horiz, null, true) + (paneCoordinates ? 0 : this.pos);
	},

	/*
	 * Utility method to translate a pixel position in to an axis value
	 * @param {Number} pixel The pixel value coordinate
	 * @param {Boolean} paneCoordiantes Whether the input pixel is relative to the chart or just the
	 *        axis/pane itself.
	 */
	toValue: function (pixel, paneCoordinates) {
		return this.translate(pixel - (paneCoordinates ? 0 : this.pos), true, !this.horiz, null, true);
	},

	/**
	 * Create the path for a plot line that goes from the given value on
	 * this axis, across the plot to the opposite side
	 * @param {Number} value
	 * @param {Number} lineWidth Used for calculation crisp line
	 * @param {Number] old Use old coordinates (for resizing and rescaling)
	 */
	getPlotLinePath: function (value, lineWidth, old, force, translatedValue) {
		var axis = this,
			chart = axis.chart,
			axisLeft = axis.left,
			axisTop = axis.top,
			x1,
			y1,
			x2,
			y2,
			cHeight = (old && chart.oldChartHeight) || chart.chartHeight,
			cWidth = (old && chart.oldChartWidth) || chart.chartWidth,
			skip,
			transB = axis.transB;

		translatedValue = pick(translatedValue, axis.translate(value, null, null, old));
		x1 = x2 = mathRound(translatedValue + transB);
		y1 = y2 = mathRound(cHeight - translatedValue - transB);

		if (isNaN(translatedValue)) { // no min or max
			skip = true;

		} else if (axis.horiz) {
			y1 = axisTop;
			y2 = cHeight - axis.bottom;
			if (x1 < axisLeft || x1 > axisLeft + axis.width) {
				skip = true;
			}
		} else {
			x1 = axisLeft;
			x2 = cWidth - axis.right;

			if (y1 < axisTop || y1 > axisTop + axis.height) {
				skip = true;
			}
		}
		return skip && !force ?
			null :
			chart.renderer.crispLine([M, x1, y1, L, x2, y2], lineWidth || 1);
	},

	/**
	 * Set the tick positions of a linear axis to round values like whole tens or every five.
	 */
	getLinearTickPositions: function (tickInterval, min, max) {
		var pos,
			lastPos,
			roundedMin = correctFloat(mathFloor(min / tickInterval) * tickInterval),
			roundedMax = correctFloat(mathCeil(max / tickInterval) * tickInterval),
			tickPositions = [];

		// Populate the intermediate values
		pos = roundedMin;
		while (pos <= roundedMax) {

			// Place the tick on the rounded value
			tickPositions.push(pos);

			// Always add the raw tickInterval, not the corrected one.
			pos = correctFloat(pos + tickInterval);

			// If the interval is not big enough in the current min - max range to actually increase
			// the loop variable, we need to break out to prevent endless loop. Issue #619
			if (pos === lastPos) {
				break;
			}

			// Record the last value
			lastPos = pos;
		}
		return tickPositions;
	},

	/**
	 * Return the minor tick positions. For logarithmic axes, reuse the same logic
	 * as for major ticks.
	 */
	getMinorTickPositions: function () {
		var axis = this,
			options = axis.options,
			tickPositions = axis.tickPositions,
			minorTickInterval = axis.minorTickInterval,
			minorTickPositions = [],
			pos,
			i,
			len;

		if (axis.isLog) {
			len = tickPositions.length;
			for (i = 1; i < len; i++) {
				minorTickPositions = minorTickPositions.concat(
					axis.getLogTickPositions(minorTickInterval, tickPositions[i - 1], tickPositions[i], true)
				);
			}
		} else if (axis.isDatetimeAxis && options.minorTickInterval === 'auto') { // #1314
			minorTickPositions = minorTickPositions.concat(
				axis.getTimeTicks(
					axis.normalizeTimeTickInterval(minorTickInterval),
					axis.min,
					axis.max,
					options.startOfWeek
				)
			);
			if (minorTickPositions[0] < axis.min) {
				minorTickPositions.shift();
			}
		} else {
			for (pos = axis.min + (tickPositions[0] - axis.min) % minorTickInterval; pos <= axis.max; pos += minorTickInterval) {
				minorTickPositions.push(pos);
			}
		}
		return minorTickPositions;
	},

	/**
	 * Adjust the min and max for the minimum range. Keep in mind that the series data is
	 * not yet processed, so we don't have information on data cropping and grouping, or
	 * updated axis.pointRange or series.pointRange. The data can't be processed until
	 * we have finally established min and max.
	 */
	adjustForMinRange: function () {
		var axis = this,
			options = axis.options,
			min = axis.min,
			max = axis.max,
			zoomOffset,
			spaceAvailable = axis.dataMax - axis.dataMin >= axis.minRange,
			closestDataRange,
			i,
			distance,
			xData,
			loopLength,
			minArgs,
			maxArgs;

		// Set the automatic minimum range based on the closest point distance
		if (axis.isXAxis && axis.minRange === UNDEFINED && !axis.isLog) {

			if (defined(options.min) || defined(options.max)) {
				axis.minRange = null; // don't do this again

			} else {

				// Find the closest distance between raw data points, as opposed to
				// closestPointRange that applies to processed points (cropped and grouped)
				each(axis.series, function (series) {
					xData = series.xData;
					loopLength = series.xIncrement ? 1 : xData.length - 1;
					for (i = loopLength; i > 0; i--) {
						distance = xData[i] - xData[i - 1];
						if (closestDataRange === UNDEFINED || distance < closestDataRange) {
							closestDataRange = distance;
						}
					}
				});
				axis.minRange = mathMin(closestDataRange * 5, axis.dataMax - axis.dataMin);
			}
		}

		// if minRange is exceeded, adjust
		if (max - min < axis.minRange) {
			var minRange = axis.minRange;
			zoomOffset = (minRange - max + min) / 2;

			// if min and max options have been set, don't go beyond it
			minArgs = [min - zoomOffset, pick(options.min, min - zoomOffset)];
			if (spaceAvailable) { // if space is available, stay within the data range
				minArgs[2] = axis.dataMin;
			}
			min = arrayMax(minArgs);

			maxArgs = [min + minRange, pick(options.max, min + minRange)];
			if (spaceAvailable) { // if space is availabe, stay within the data range
				maxArgs[2] = axis.dataMax;
			}

			max = arrayMin(maxArgs);

			// now if the max is adjusted, adjust the min back
			if (max - min < minRange) {
				minArgs[0] = max - minRange;
				minArgs[1] = pick(options.min, max - minRange);
				min = arrayMax(minArgs);
			}
		}

		// Record modified extremes
		axis.min = min;
		axis.max = max;
	},

	/**
	 * Update translation information
	 */
	setAxisTranslation: function (saveOld) {
		var axis = this,
			range = axis.max - axis.min,
			pointRange = 0,
			closestPointRange,
			minPointOffset = 0,
			pointRangePadding = 0,
			linkedParent = axis.linkedParent,
			ordinalCorrection,
			hasCategories = !!axis.categories,
			transA = axis.transA;

		// Adjust translation for padding. Y axis with categories need to go through the same (#1784).
		if (axis.isXAxis || hasCategories) {
			if (linkedParent) {
				minPointOffset = linkedParent.minPointOffset;
				pointRangePadding = linkedParent.pointRangePadding;

			} else {
				each(axis.series, function (series) {
					var seriesPointRange = mathMax(series.pointRange, +hasCategories),
						pointPlacement = series.options.pointPlacement,
						seriesClosestPointRange = series.closestPointRange;

					if (seriesPointRange > range) { // #1446
						seriesPointRange = 0;
					}
					pointRange = mathMax(pointRange, seriesPointRange);

					// minPointOffset is the value padding to the left of the axis in order to make
					// room for points with a pointRange, typically columns. When the pointPlacement option
					// is 'between' or 'on', this padding does not apply.
					minPointOffset = mathMax(
						minPointOffset,
						isString(pointPlacement) ? 0 : seriesPointRange / 2
					);

					// Determine the total padding needed to the length of the axis to make room for the
					// pointRange. If the series' pointPlacement is 'on', no padding is added.
					pointRangePadding = mathMax(
						pointRangePadding,
						pointPlacement === 'on' ? 0 : seriesPointRange
					);

					// Set the closestPointRange
					if (!series.noSharedTooltip && defined(seriesClosestPointRange)) {
						closestPointRange = defined(closestPointRange) ?
							mathMin(closestPointRange, seriesClosestPointRange) :
							seriesClosestPointRange;
					}
				});
			}

			// Record minPointOffset and pointRangePadding
			ordinalCorrection = axis.ordinalSlope && closestPointRange ? axis.ordinalSlope / closestPointRange : 1; // #988, #1853
			axis.minPointOffset = minPointOffset = minPointOffset * ordinalCorrection;
			axis.pointRangePadding = pointRangePadding = pointRangePadding * ordinalCorrection;

			// pointRange means the width reserved for each point, like in a column chart
			axis.pointRange = mathMin(pointRange, range);

			// closestPointRange means the closest distance between points. In columns
			// it is mostly equal to pointRange, but in lines pointRange is 0 while closestPointRange
			// is some other value
			axis.closestPointRange = closestPointRange;
		}

		// Secondary values
		if (saveOld) {
			axis.oldTransA = transA;
		}
		axis.translationSlope = axis.transA = transA = axis.len / ((range + pointRangePadding) || 1);
		axis.transB = axis.horiz ? axis.left : axis.bottom; // translation addend
		axis.minPixelPadding = transA * minPointOffset;
	},

	/**
	 * Set the tick positions to round values and optionally extend the extremes
	 * to the nearest tick
	 */
	setTickPositions: function (secondPass) {
		var axis = this,
			chart = axis.chart,
			options = axis.options,
			isLog = axis.isLog,
			isDatetimeAxis = axis.isDatetimeAxis,
			isXAxis = axis.isXAxis,
			isLinked = axis.isLinked,
			tickPositioner = axis.options.tickPositioner,
			maxPadding = options.maxPadding,
			minPadding = options.minPadding,
			length,
			linkedParentExtremes,
			tickIntervalOption = options.tickInterval,
			minTickIntervalOption = options.minTickInterval,
			tickPixelIntervalOption = options.tickPixelInterval,
			tickPositions,
			keepTwoTicksOnly,
			categories = axis.categories;

		// linked axis gets the extremes from the parent axis
		if (isLinked) {
			axis.linkedParent = chart[axis.coll][options.linkedTo];
			linkedParentExtremes = axis.linkedParent.getExtremes();
			axis.min = pick(linkedParentExtremes.min, linkedParentExtremes.dataMin);
			axis.max = pick(linkedParentExtremes.max, linkedParentExtremes.dataMax);
			if (options.type !== axis.linkedParent.options.type) {
				error(11, 1); // Can't link axes of different type
			}
		} else { // initial min and max from the extreme data values
			axis.min = pick(axis.userMin, options.min, axis.dataMin);
			axis.max = pick(axis.userMax, options.max, axis.dataMax);
		}

		if (isLog) {
			if (!secondPass && mathMin(axis.min, pick(axis.dataMin, axis.min)) <= 0) { // #978
				error(10, 1); // Can't plot negative values on log axis
			}
			axis.min = correctFloat(log2lin(axis.min)); // correctFloat cures #934
			axis.max = correctFloat(log2lin(axis.max));
		}

		// handle zoomed range
		if (axis.range && defined(axis.max)) {
			axis.userMin = axis.min = mathMax(axis.min, axis.max - axis.range); // #618
			axis.userMax = axis.max;
			
			axis.range = null;  // don't use it when running setExtremes
		}

		// Hook for adjusting this.min and this.max. Used by bubble series.
		if (axis.beforePadding) {
			axis.beforePadding();
		}

		// adjust min and max for the minimum range
		axis.adjustForMinRange();

		// Pad the values to get clear of the chart's edges. To avoid tickInterval taking the padding
		// into account, we do this after computing tick interval (#1337).
		if (!categories && !axis.usePercentage && !isLinked && defined(axis.min) && defined(axis.max)) {
			length = axis.max - axis.min;
			if (length) {
				if (!defined(options.min) && !defined(axis.userMin) && minPadding && (axis.dataMin < 0 || !axis.ignoreMinPadding)) {
					axis.min -= length * minPadding;
				}
				if (!defined(options.max) && !defined(axis.userMax)  && maxPadding && (axis.dataMax > 0 || !axis.ignoreMaxPadding)) {
					axis.max += length * maxPadding;
				}
			}
		}

		// get tickInterval
		if (axis.min === axis.max || axis.min === undefined || axis.max === undefined) {
			axis.tickInterval = 1;
		} else if (isLinked && !tickIntervalOption &&
				tickPixelIntervalOption === axis.linkedParent.options.tickPixelInterval) {
			axis.tickInterval = axis.linkedParent.tickInterval;
		} else {
			axis.tickInterval = pick(
				tickIntervalOption,
				categories ? // for categoried axis, 1 is default, for linear axis use tickPix
					1 :
					// don't let it be more than the data range
					(axis.max - axis.min) * tickPixelIntervalOption / mathMax(axis.len, tickPixelIntervalOption)
			);
			// For squished axes, set only two ticks
			if (!defined(tickIntervalOption) && axis.len < tickPixelIntervalOption && !this.isRadial &&
					!categories && options.startOnTick && options.endOnTick) {
				keepTwoTicksOnly = true;
				axis.tickInterval /= 4; // tick extremes closer to the real values
			}
		}

		// Now we're finished detecting min and max, crop and group series data. This
		// is in turn needed in order to find tick positions in ordinal axes.
		if (isXAxis && !secondPass) {
			each(axis.series, function (series) {
				series.processData(axis.min !== axis.oldMin || axis.max !== axis.oldMax);
			});
		}

		// set the translation factor used in translate function
		axis.setAxisTranslation(true);

		// hook for ordinal axes and radial axes
		if (axis.beforeSetTickPositions) {
			axis.beforeSetTickPositions();
		}

		// hook for extensions, used in Highstock ordinal axes
		if (axis.postProcessTickInterval) {
			axis.tickInterval = axis.postProcessTickInterval(axis.tickInterval);
		}

		// In column-like charts, don't cramp in more ticks than there are points (#1943)
		if (axis.pointRange) {
			axis.tickInterval = mathMax(axis.pointRange, axis.tickInterval);
		}

		// Before normalizing the tick interval, handle minimum tick interval. This applies only if tickInterval is not defined.
		if (!tickIntervalOption && axis.tickInterval < minTickIntervalOption) {
			axis.tickInterval = minTickIntervalOption;
		}

		// for linear axes, get magnitude and normalize the interval
		if (!isDatetimeAxis && !isLog) { // linear
			if (!tickIntervalOption) {
				axis.tickInterval = normalizeTickInterval(axis.tickInterval, null, getMagnitude(axis.tickInterval), options);
			}
		}

		// get minorTickInterval
		axis.minorTickInterval = options.minorTickInterval === 'auto' && axis.tickInterval ?
				axis.tickInterval / 5 : options.minorTickInterval;

		// find the tick positions
		axis.tickPositions = tickPositions = options.tickPositions ?
			[].concat(options.tickPositions) : // Work on a copy (#1565)
			(tickPositioner && tickPositioner.apply(axis, [axis.min, axis.max]));
		if (!tickPositions) {

			// Too many ticks
			if (!axis.ordinalPositions && (axis.max - axis.min) / axis.tickInterval > mathMax(2 * axis.len, 200)) {
				error(19, true);
			}

			if (isDatetimeAxis) {
				tickPositions = axis.getTimeTicks(
					axis.normalizeTimeTickInterval(axis.tickInterval, options.units),
					axis.min,
					axis.max,
					options.startOfWeek,
					axis.ordinalPositions,
					axis.closestPointRange,
					true
				);
			} else if (isLog) {
				tickPositions = axis.getLogTickPositions(axis.tickInterval, axis.min, axis.max);
			} else {
				tickPositions = axis.getLinearTickPositions(axis.tickInterval, axis.min, axis.max);
			}

			if (keepTwoTicksOnly) {
				tickPositions.splice(1, tickPositions.length - 2);
			}

			axis.tickPositions = tickPositions;
		}

		if (!isLinked) {

			// reset min/max or remove extremes based on start/end on tick
			var roundedMin = tickPositions[0],
				roundedMax = tickPositions[tickPositions.length - 1],
				minPointOffset = axis.minPointOffset || 0,
				singlePad;

			if (options.startOnTick) {
				axis.min = roundedMin;
			} else if (axis.min - minPointOffset > roundedMin) {
				tickPositions.shift();
			}

			if (options.endOnTick) {
				axis.max = roundedMax;
			} else if (axis.max + minPointOffset < roundedMax) {
				tickPositions.pop();
			}

			// When there is only one point, or all points have the same value on this axis, then min
			// and max are equal and tickPositions.length is 1. In this case, add some padding
			// in order to center the point, but leave it with one tick. #1337.
			if (tickPositions.length === 1) {
				singlePad = 0.001; // The lowest possible number to avoid extra padding on columns
				axis.min -= singlePad;
				axis.max += singlePad;
			}
		}
	},

	/**
	 * Set the max ticks of either the x and y axis collection
	 */
	setMaxTicks: function () {

		var chart = this.chart,
			maxTicks = chart.maxTicks || {},
			tickPositions = this.tickPositions,
			key = this._maxTicksKey = [this.coll, this.pos, this.len].join('-');
		
		if (!this.isLinked && !this.isDatetimeAxis && tickPositions && tickPositions.length > (maxTicks[key] || 0) && this.options.alignTicks !== false) {
			maxTicks[key] = tickPositions.length;
		}
		chart.maxTicks = maxTicks;
	},

	/**
	 * When using multiple axes, adjust the number of ticks to match the highest
	 * number of ticks in that group
	 */
	adjustTickAmount: function () {
		var axis = this,
			chart = axis.chart,
			key = axis._maxTicksKey,
			tickPositions = axis.tickPositions,
			maxTicks = chart.maxTicks;

		if (maxTicks && maxTicks[key] && !axis.isDatetimeAxis && !axis.categories && !axis.isLinked &&
				axis.options.alignTicks !== false && this.min !== UNDEFINED) {
			var oldTickAmount = axis.tickAmount,
				calculatedTickAmount = tickPositions.length,
				tickAmount;

			// set the axis-level tickAmount to use below
			axis.tickAmount = tickAmount = maxTicks[key];

			if (calculatedTickAmount < tickAmount) {
				while (tickPositions.length < tickAmount) {
					tickPositions.push(correctFloat(
						tickPositions[tickPositions.length - 1] + axis.tickInterval
					));
				}
				axis.transA *= (calculatedTickAmount - 1) / (tickAmount - 1);
				axis.max = tickPositions[tickPositions.length - 1];

			}
			if (defined(oldTickAmount) && tickAmount !== oldTickAmount) {
				axis.isDirty = true;
			}
		}
	},

	/**
	 * Set the scale based on data min and max, user set min and max or options
	 *
	 */
	setScale: function () {
		var axis = this,
			stacks = axis.stacks,
			type,
			i,
			isDirtyData,
			isDirtyAxisLength;

		axis.oldMin = axis.min;
		axis.oldMax = axis.max;
		axis.oldAxisLength = axis.len;

		// set the new axisLength
		axis.setAxisSize();
		//axisLength = horiz ? axisWidth : axisHeight;
		isDirtyAxisLength = axis.len !== axis.oldAxisLength;

		// is there new data?
		each(axis.series, function (series) {
			if (series.isDirtyData || series.isDirty ||
					series.xAxis.isDirty) { // when x axis is dirty, we need new data extremes for y as well
				isDirtyData = true;
			}
		});

		// do we really need to go through all this?
		if (isDirtyAxisLength || isDirtyData || axis.isLinked || axis.forceRedraw ||
			axis.userMin !== axis.oldUserMin || axis.userMax !== axis.oldUserMax) {

			// reset stacks
			if (!axis.isXAxis) {
				for (type in stacks) {
					for (i in stacks[type]) {
						stacks[type][i].total = null;
						stacks[type][i].cum = 0;
					}
				}
			}

			axis.forceRedraw = false;

			// get data extremes if needed
			axis.getSeriesExtremes();

			// get fixed positions based on tickInterval
			axis.setTickPositions();

			// record old values to decide whether a rescale is necessary later on (#540)
			axis.oldUserMin = axis.userMin;
			axis.oldUserMax = axis.userMax;

			// Mark as dirty if it is not already set to dirty and extremes have changed. #595.
			if (!axis.isDirty) {
				axis.isDirty = isDirtyAxisLength || axis.min !== axis.oldMin || axis.max !== axis.oldMax;
			}
		} else if (!axis.isXAxis) {
			if (axis.oldStacks) {
				stacks = axis.stacks = axis.oldStacks;
			}

			// reset stacks
			for (type in stacks) {
				for (i in stacks[type]) {
					stacks[type][i].cum = stacks[type][i].total;
				}
			}
		}

		// Set the maximum tick amount
		axis.setMaxTicks();
	},

	/**
	 * Set the extremes and optionally redraw
	 * @param {Number} newMin
	 * @param {Number} newMax
	 * @param {Boolean} redraw
	 * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
	 *    configuration
	 * @param {Object} eventArguments
	 *
	 */
	setExtremes: function (newMin, newMax, redraw, animation, eventArguments) {
		var axis = this,
			chart = axis.chart;

		redraw = pick(redraw, true); // defaults to true

		// Extend the arguments with min and max
		eventArguments = extend(eventArguments, {
			min: newMin,
			max: newMax
		});

		// Fire the event
		fireEvent(axis, 'setExtremes', eventArguments, function () { // the default event handler

			axis.userMin = newMin;
			axis.userMax = newMax;
			axis.eventArgs = eventArguments;

			// Mark for running afterSetExtremes
			axis.isDirtyExtremes = true;

			// redraw
			if (redraw) {
				chart.redraw(animation);
			}
		});
	},

	/**
	 * Overridable method for zooming chart. Pulled out in a separate method to allow overriding
	 * in stock charts.
	 */
	zoom: function (newMin, newMax) {

		// Prevent pinch zooming out of range. Check for defined is for #1946.
		if (!this.allowZoomOutside) {
			if (defined(this.dataMin) && newMin <= this.dataMin) {
				newMin = UNDEFINED;
			}
			if (defined(this.dataMax) && newMax >= this.dataMax) {
				newMax = UNDEFINED;
			}
		}

		// In full view, displaying the reset zoom button is not required
		this.displayBtn = newMin !== UNDEFINED || newMax !== UNDEFINED;

		// Do it
		this.setExtremes(
			newMin,
			newMax,
			false,
			UNDEFINED,
			{ trigger: 'zoom' }
		);
		return true;
	},

	/**
	 * Update the axis metrics
	 */
	setAxisSize: function () {
		var chart = this.chart,
			options = this.options,
			offsetLeft = options.offsetLeft || 0,
			offsetRight = options.offsetRight || 0,
			horiz = this.horiz,
			width,
			height,
			top,
			left;

		// Expose basic values to use in Series object and navigator
		this.left = left = pick(options.left, chart.plotLeft + offsetLeft);
		this.top = top = pick(options.top, chart.plotTop);
		this.width = width = pick(options.width, chart.plotWidth - offsetLeft + offsetRight);
		this.height = height = pick(options.height, chart.plotHeight);
		this.bottom = chart.chartHeight - height - top;
		this.right = chart.chartWidth - width - left;

		// Direction agnostic properties
		this.len = mathMax(horiz ? width : height, 0); // mathMax fixes #905
		this.pos = horiz ? left : top; // distance from SVG origin
	},

	/**
	 * Get the actual axis extremes
	 */
	getExtremes: function () {
		var axis = this,
			isLog = axis.isLog;

		return {
			min: isLog ? correctFloat(lin2log(axis.min)) : axis.min,
			max: isLog ? correctFloat(lin2log(axis.max)) : axis.max,
			dataMin: axis.dataMin,
			dataMax: axis.dataMax,
			userMin: axis.userMin,
			userMax: axis.userMax
		};
	},

	/**
	 * Get the zero plane either based on zero or on the min or max value.
	 * Used in bar and area plots
	 */
	getThreshold: function (threshold) {
		var axis = this,
			isLog = axis.isLog;

		var realMin = isLog ? lin2log(axis.min) : axis.min,
			realMax = isLog ? lin2log(axis.max) : axis.max;

		if (realMin > threshold || threshold === null) {
			threshold = realMin;
		} else if (realMax < threshold) {
			threshold = realMax;
		}

		return axis.translate(threshold, 0, 1, 0, 1);
	},

	/**
	 * Compute auto alignment for the axis label based on which side the axis is on
	 * and the given rotation for the label
	 */
	autoLabelAlign: function (rotation) {
		var ret,
			angle = (pick(rotation, 0) - (this.side * 90) + 720) % 360;

		if (angle > 15 && angle < 165) {
			ret = 'right';
		} else if (angle > 195 && angle < 345) {
			ret = 'left';
		} else {
			ret = 'center';
		}
		return ret;
	},

	/**
	 * Render the tick labels to a preliminary position to get their sizes
	 */
	getOffset: function () {
		var axis = this,
			chart = axis.chart,
			renderer = chart.renderer,
			options = axis.options,
			tickPositions = axis.tickPositions,
			ticks = axis.ticks,
			horiz = axis.horiz,
			side = axis.side,
			invertedSide = chart.inverted ? [1, 0, 3, 2][side] : side,
			hasData,
			showAxis,
			titleOffset = 0,
			titleOffsetOption,
			titleMargin = 0,
			axisTitleOptions = options.title,
			labelOptions = options.labels,
			labelOffset = 0, // reset
			axisOffset = chart.axisOffset,
			clipOffset = chart.clipOffset,
			directionFactor = [-1, 1, 1, -1][side],
			n,
			i,
			autoStaggerLines = 1,
			maxStaggerLines = pick(labelOptions.maxStaggerLines, 5),
			sortedPositions,
			lastRight,
			overlap,
			pos,
			bBox,
			x,
			w,
			lineNo;
			
		// For reuse in Axis.render
		axis.hasData = hasData = (axis.hasVisibleSeries || (defined(axis.min) && defined(axis.max) && !!tickPositions));
		axis.showAxis = showAxis = hasData || pick(options.showEmpty, true);

		// Set/reset staggerLines
		axis.staggerLines = axis.horiz && labelOptions.staggerLines;
		
		// Create the axisGroup and gridGroup elements on first iteration
		if (!axis.axisGroup) {
			axis.gridGroup = renderer.g('grid')
				.attr({ zIndex: options.gridZIndex || 1 })
				.add();
			axis.axisGroup = renderer.g('axis')
				.attr({ zIndex: options.zIndex || 2 })
				.add();
			axis.labelGroup = renderer.g('axis-labels')
				.attr({ zIndex: labelOptions.zIndex || 7 })
				.add();
		}

		if (hasData || axis.isLinked) {

			// Set the explicit or automatic label alignment
			axis.labelAlign = pick(labelOptions.align || axis.autoLabelAlign(labelOptions.rotation));

			// Generate ticks
			each(tickPositions, function (pos) {
				if (!ticks[pos]) {
					ticks[pos] = new Tick(axis, pos);
				} else {
					ticks[pos].addLabel(); // update labels depending on tick interval
				}
			});

			// Handle automatic stagger lines
			if (axis.horiz && !axis.staggerLines && maxStaggerLines && !labelOptions.rotation) {
				sortedPositions = axis.reversed ? [].concat(tickPositions).reverse() : tickPositions;
				while (autoStaggerLines < maxStaggerLines) {
					lastRight = [];
					overlap = false;

					for (i = 0; i < sortedPositions.length; i++) {
						pos = sortedPositions[i];
						bBox = ticks[pos].label && ticks[pos].label.getBBox();
						w = bBox ? bBox.width : 0;
						lineNo = i % autoStaggerLines;

						if (w) {
							x = axis.translate(pos); // don't handle log
							if (lastRight[lineNo] !== UNDEFINED && x < lastRight[lineNo]) {
								overlap = true;
							}
							lastRight[lineNo] = x + w;
						}
					}
					if (overlap) {
						autoStaggerLines++;
					} else {
						break;
					}
				}

				if (autoStaggerLines > 1) {
					axis.staggerLines = autoStaggerLines;
				}
			}


			each(tickPositions, function (pos) {
				// left side must be align: right and right side must have align: left for labels
				if (side === 0 || side === 2 || { 1: 'left', 3: 'right' }[side] === axis.labelAlign) {

					// get the highest offset
					labelOffset = mathMax(
						ticks[pos].getLabelSize(),
						labelOffset
					);
				}

			});
			if (axis.staggerLines) {
				labelOffset *= axis.staggerLines;
				axis.labelOffset = labelOffset;
			}


		} else { // doesn't have data
			for (n in ticks) {
				ticks[n].destroy();
				delete ticks[n];
			}
		}

		if (axisTitleOptions && axisTitleOptions.text && axisTitleOptions.enabled !== false) {
			if (!axis.axisTitle) {
				axis.axisTitle = renderer.text(
					axisTitleOptions.text,
					0,
					0,
					axisTitleOptions.useHTML
				)
				.attr({
					zIndex: 7,
					rotation: axisTitleOptions.rotation || 0,
					align:
						axisTitleOptions.textAlign ||
						{ low: 'left', middle: 'center', high: 'right' }[axisTitleOptions.align]
				})
				.css(axisTitleOptions.style)
				.add(axis.axisGroup);
				axis.axisTitle.isNew = true;
			}

			if (showAxis) {
				titleOffset = axis.axisTitle.getBBox()[horiz ? 'height' : 'width'];
				titleMargin = pick(axisTitleOptions.margin, horiz ? 5 : 10);
				titleOffsetOption = axisTitleOptions.offset;
			}

			// hide or show the title depending on whether showEmpty is set
			axis.axisTitle[showAxis ? 'show' : 'hide']();
		}

		// handle automatic or user set offset
		axis.offset = directionFactor * pick(options.offset, axisOffset[side]);

		axis.axisTitleMargin =
			pick(titleOffsetOption,
				labelOffset + titleMargin +
				(side !== 2 && labelOffset && directionFactor * options.labels[horiz ? 'y' : 'x'])
			);

		axisOffset[side] = mathMax(
			axisOffset[side],
			axis.axisTitleMargin + titleOffset + directionFactor * axis.offset
		);
		clipOffset[invertedSide] = mathMax(clipOffset[invertedSide], mathFloor(options.lineWidth / 2) * 2);
	},

	/**
	 * Get the path for the axis line
	 */
	getLinePath: function (lineWidth) {
		var chart = this.chart,
			opposite = this.opposite,
			offset = this.offset,
			horiz = this.horiz,
			lineLeft = this.left + (opposite ? this.width : 0) + offset,
			lineTop = chart.chartHeight - this.bottom - (opposite ? this.height : 0) + offset;

		if (opposite) {
			lineWidth *= -1; // crispify the other way - #1480, #1687
		}

		return chart.renderer.crispLine([
				M,
				horiz ?
					this.left :
					lineLeft,
				horiz ?
					lineTop :
					this.top,
				L,
				horiz ?
					chart.chartWidth - this.right :
					lineLeft,
				horiz ?
					lineTop :
					chart.chartHeight - this.bottom
			], lineWidth);
	},

	/**
	 * Position the title
	 */
	getTitlePosition: function () {
		// compute anchor points for each of the title align options
		var horiz = this.horiz,
			axisLeft = this.left,
			axisTop = this.top,
			axisLength = this.len,
			axisTitleOptions = this.options.title,
			margin = horiz ? axisLeft : axisTop,
			opposite = this.opposite,
			offset = this.offset,
			fontSize = pInt(axisTitleOptions.style.fontSize || 12),

			// the position in the length direction of the axis
			alongAxis = {
				low: margin + (horiz ? 0 : axisLength),
				middle: margin + axisLength / 2,
				high: margin + (horiz ? axisLength : 0)
			}[axisTitleOptions.align],

			// the position in the perpendicular direction of the axis
			offAxis = (horiz ? axisTop + this.height : axisLeft) +
				(horiz ? 1 : -1) * // horizontal axis reverses the margin
				(opposite ? -1 : 1) * // so does opposite axes
				this.axisTitleMargin +
				(this.side === 2 ? fontSize : 0);

		return {
			x: horiz ?
				alongAxis :
				offAxis + (opposite ? this.width : 0) + offset +
					(axisTitleOptions.x || 0), // x
			y: horiz ?
				offAxis - (opposite ? this.height : 0) + offset :
				alongAxis + (axisTitleOptions.y || 0) // y
		};
	},

	/**
	 * Render the axis
	 */
	render: function () {
		var axis = this,
			horiz = axis.horiz,
			reversed = axis.reversed,
			chart = axis.chart,
			renderer = chart.renderer,
			options = axis.options,
			isLog = axis.isLog,
			isLinked = axis.isLinked,
			tickPositions = axis.tickPositions,
			sortedPositions,
			axisTitle = axis.axisTitle,
			stacks = axis.stacks,
			ticks = axis.ticks,
			minorTicks = axis.minorTicks,
			alternateBands = axis.alternateBands,
			stackLabelOptions = options.stackLabels,
			alternateGridColor = options.alternateGridColor,
			tickmarkOffset = axis.tickmarkOffset,
			lineWidth = options.lineWidth,
			linePath,
			hasRendered = chart.hasRendered,
			slideInTicks = hasRendered && defined(axis.oldMin) && !isNaN(axis.oldMin),
			hasData = axis.hasData,
			showAxis = axis.showAxis,
			from,
			justifyLabels = axis.justifyLabels = !axis.staggerLines && horiz && options.labels.overflow === 'justify',
			to;

		// Reset
		axis.labelEdge.length = 0;

		// Mark all elements inActive before we go over and mark the active ones
		each([ticks, minorTicks, alternateBands], function (coll) {
			var pos;
			for (pos in coll) {
				coll[pos].isActive = false;
			}
		});

		// If the series has data draw the ticks. Else only the line and title
		if (hasData || isLinked) {

			// minor ticks
			if (axis.minorTickInterval && !axis.categories) {
				each(axis.getMinorTickPositions(), function (pos) {
					if (!minorTicks[pos]) {
						minorTicks[pos] = new Tick(axis, pos, 'minor');
					}

					// render new ticks in old position
					if (slideInTicks && minorTicks[pos].isNew) {
						minorTicks[pos].render(null, true);
					}

					minorTicks[pos].render(null, false, 1);
				});
			}

			// Major ticks. Pull out the first item and render it last so that
			// we can get the position of the neighbour label. #808.
			if (tickPositions.length) { // #1300
				sortedPositions = tickPositions.slice();
				if ((horiz && reversed) || (!horiz && !reversed)) {
					sortedPositions.reverse();
				}
				if (justifyLabels) {
					sortedPositions = sortedPositions.slice(1).concat([sortedPositions[0]]);
				}
				each(sortedPositions, function (pos, i) {

					// Reorganize the indices
					if (justifyLabels) {
						i = (i === sortedPositions.length - 1) ? 0 : i + 1;
					}

					// linked axes need an extra check to find out if
					if (!isLinked || (pos >= axis.min && pos <= axis.max)) {

						if (!ticks[pos]) {
							ticks[pos] = new Tick(axis, pos);
						}

						// render new ticks in old position
						if (slideInTicks && ticks[pos].isNew) {
							ticks[pos].render(i, true, 0.1);
						}

						ticks[pos].render(i, false, 1);
					}

				});
				// In a categorized axis, the tick marks are displayed between labels. So
				// we need to add a tick mark and grid line at the left edge of the X axis.
				if (tickmarkOffset && axis.min === 0) {
					if (!ticks[-1]) {
						ticks[-1] = new Tick(axis, -1, null, true);
					}
					ticks[-1].render(-1);
				}

			}

			// alternate grid color
			if (alternateGridColor) {
				each(tickPositions, function (pos, i) {
					if (i % 2 === 0 && pos < axis.max) {
						if (!alternateBands[pos]) {
							alternateBands[pos] = new PlotLineOrBand(axis);
						}
						from = pos + tickmarkOffset; // #949
						to = tickPositions[i + 1] !== UNDEFINED ? tickPositions[i + 1] + tickmarkOffset : axis.max;
						alternateBands[pos].options = {
							from: isLog ? lin2log(from) : from,
							to: isLog ? lin2log(to) : to,
							color: alternateGridColor
						};
						alternateBands[pos].render();
						alternateBands[pos].isActive = true;
					}
				});
			}

			// custom plot lines and bands
			if (!axis._addedPlotLB) { // only first time
				each((options.plotLines || []).concat(options.plotBands || []), function (plotLineOptions) {
					axis.addPlotBandOrLine(plotLineOptions);
				});
				axis._addedPlotLB = true;
			}

		} // end if hasData

		// Remove inactive ticks
		each([ticks, minorTicks, alternateBands], function (coll) {
			var pos,
				i,
				forDestruction = [],
				delay = globalAnimation ? globalAnimation.duration || 500 : 0,
				destroyInactiveItems = function () {
					i = forDestruction.length;
					while (i--) {
						// When resizing rapidly, the same items may be destroyed in different timeouts,
						// or the may be reactivated
						if (coll[forDestruction[i]] && !coll[forDestruction[i]].isActive) {
							coll[forDestruction[i]].destroy();
							delete coll[forDestruction[i]];
						}
					}

				};

			for (pos in coll) {

				if (!coll[pos].isActive) {
					// Render to zero opacity
					coll[pos].render(pos, false, 0);
					coll[pos].isActive = false;
					forDestruction.push(pos);
				}
			}

			// When the objects are finished fading out, destroy them
			if (coll === alternateBands || !chart.hasRendered || !delay) {
				destroyInactiveItems();
			} else if (delay) {
				setTimeout(destroyInactiveItems, delay);
			}
		});

		// Static items. As the axis group is cleared on subsequent calls
		// to render, these items are added outside the group.
		// axis line
		if (lineWidth) {
			linePath = axis.getLinePath(lineWidth);
			if (!axis.axisLine) {
				axis.axisLine = renderer.path(linePath)
					.attr({
						stroke: options.lineColor,
						'stroke-width': lineWidth,
						zIndex: 7
					})
					.add(axis.axisGroup);
			} else {
				axis.axisLine.animate({ d: linePath });
			}

			// show or hide the line depending on options.showEmpty
			axis.axisLine[showAxis ? 'show' : 'hide']();
		}

		if (axisTitle && showAxis) {

			axisTitle[axisTitle.isNew ? 'attr' : 'animate'](
				axis.getTitlePosition()
			);
			axisTitle.isNew = false;
		}

		// Stacked totals:
		if (stackLabelOptions && stackLabelOptions.enabled) {
			var stackKey, oneStack, stackCategory,
				stackTotalGroup = axis.stackTotalGroup;

			// Create a separate group for the stack total labels
			if (!stackTotalGroup) {
				axis.stackTotalGroup = stackTotalGroup =
					renderer.g('stack-labels')
						.attr({
							visibility: VISIBLE,
							zIndex: 6
						})
						.add();
			}

			// plotLeft/Top will change when y axis gets wider so we need to translate the
			// stackTotalGroup at every render call. See bug #506 and #516
			stackTotalGroup.translate(chart.plotLeft, chart.plotTop);

			// Render each stack total
			for (stackKey in stacks) {
				oneStack = stacks[stackKey];
				for (stackCategory in oneStack) {
					oneStack[stackCategory].render(stackTotalGroup);
				}
			}
		}
		// End stacked totals

		axis.isDirty = false;
	},

	/**
	 * Redraw the axis to reflect changes in the data or axis extremes
	 */
	redraw: function () {
		var axis = this,
			chart = axis.chart,
			pointer = chart.pointer;

		// hide tooltip and hover states
		if (pointer.reset) {
			pointer.reset(true);
		}

		// render the axis
		axis.render();

		// move plot lines and bands
		each(axis.plotLinesAndBands, function (plotLine) {
			plotLine.render();
		});

		// mark associated series as dirty and ready for redraw
		each(axis.series, function (series) {
			series.isDirty = true;
		});

	},

	/**
	 * Build the stacks from top down
	 */
	buildStacks: function () {
		var series = this.series,
			i = series.length;
		if (!this.isXAxis) {
			while (i--) {
				series[i].setStackedPoints();
			}
			// Loop up again to compute percent stack
			if (this.usePercentage) {
				for (i = 0; i < series.length; i++) {
					series[i].setPercentStacks();
				}
			}
		}
	},

	/**
	 * Destroys an Axis instance.
	 */
	destroy: function (keepEvents) {
		var axis = this,
			stacks = axis.stacks,
			stackKey,
			plotLinesAndBands = axis.plotLinesAndBands,
			i;

		// Remove the events
		if (!keepEvents) {
			removeEvent(axis);
		}

		// Destroy each stack total
		for (stackKey in stacks) {
			destroyObjectProperties(stacks[stackKey]);

			stacks[stackKey] = null;
		}

		// Destroy collections
		each([axis.ticks, axis.minorTicks, axis.alternateBands], function (coll) {
			destroyObjectProperties(coll);
		});
		i = plotLinesAndBands.length;
		while (i--) { // #1975
			plotLinesAndBands[i].destroy();
		}

		// Destroy local variables
		each(['stackTotalGroup', 'axisLine', 'axisTitle', 'axisGroup', 'cross', 'gridGroup', 'labelGroup'], function (prop) {
			if (axis[prop]) {
				axis[prop] = axis[prop].destroy();
			}
		});

		// Destroy crosshair
		if (this.cross) {
			this.cross.destroy();
		}
	},

	/**
	 * Draw the crosshair
	 */
	drawCrosshair: function (e, point) {
		if (!this.crosshair) { return; }// Do not draw crosshairs if you don't have too.

		if ((defined(point) || !pick(this.crosshair.snap, true)) === false) {
			this.hideCrosshair();
			return;
		}

		var path,
			options = this.crosshair,
			animation = options.animation,
			pos;

		// Get the path
		if (!pick(options.snap, true)) {
			pos = (this.horiz ? e.chartX - this.pos : this.len - e.chartY + this.pos);
		} else if (defined(point)) {
			/*jslint eqeq: true*/
			pos = (this.chart.inverted != this.horiz) ? point.plotX : this.len - point.plotY;
			/*jslint eqeq: false*/
		}

		if (this.isRadial) {
			path = this.getPlotLinePath(this.isXAxis ? point.x : pick(point.stackY, point.y));
		} else {
			path = this.getPlotLinePath(null, null, null, null, pos);
		}

		if (path === null) {
			this.hideCrosshair();
			return;
		}

		// Draw the cross
		if (this.cross) {
			this.cross
				.attr({ visibility: VISIBLE })[animation ? 'animate' : 'attr']({ d: path }, animation);
		} else {
			var attribs = {
				'stroke-width': options.width || 1,
				stroke: options.color || '#C0C0C0',
				zIndex: options.zIndex || 2
			};
			if (options.dashStyle) {
				attribs.dashstyle = options.dashStyle;
			}
			this.cross = this.chart.renderer.path(path).attr(attribs).add();
		}
	},

	/**
	 *	Hide the crosshair.
	 */
	hideCrosshair: function () {
		if (this.cross) {
			this.cross.hide();
		}
	}
}; // end Axis

extend(Axis.prototype, AxisPlotLineOrBandExtension);
/**
 * Methods defined on the Axis prototype
 */

/**
 * Set the tick positions of a logarithmic axis
 */
Axis.prototype.getLogTickPositions = function (interval, min, max, minor) {
	var axis = this,
		options = axis.options,
		axisLength = axis.len,
		// Since we use this method for both major and minor ticks,
		// use a local variable and return the result
		positions = []; 
	
	// Reset
	if (!minor) {
		axis._minorAutoInterval = null;
	}
	
	// First case: All ticks fall on whole logarithms: 1, 10, 100 etc.
	if (interval >= 0.5) {
		interval = mathRound(interval);
		positions = axis.getLinearTickPositions(interval, min, max);
		
	// Second case: We need intermediary ticks. For example 
	// 1, 2, 4, 6, 8, 10, 20, 40 etc. 
	} else if (interval >= 0.08) {
		var roundedMin = mathFloor(min),
			intermediate,
			i,
			j,
			len,
			pos,
			lastPos,
			break2;
			
		if (interval > 0.3) {
			intermediate = [1, 2, 4];
		} else if (interval > 0.15) { // 0.2 equals five minor ticks per 1, 10, 100 etc
			intermediate = [1, 2, 4, 6, 8];
		} else { // 0.1 equals ten minor ticks per 1, 10, 100 etc
			intermediate = [1, 2, 3, 4, 5, 6, 7, 8, 9];
		}
		
		for (i = roundedMin; i < max + 1 && !break2; i++) {
			len = intermediate.length;
			for (j = 0; j < len && !break2; j++) {
				pos = log2lin(lin2log(i) * intermediate[j]);
				
				if (pos > min && (!minor || lastPos <= max)) { // #1670
					positions.push(lastPos);
				}
				
				if (lastPos > max) {
					break2 = true;
				}
				lastPos = pos;
			}
		}
		
	// Third case: We are so deep in between whole logarithmic values that
	// we might as well handle the tick positions like a linear axis. For
	// example 1.01, 1.02, 1.03, 1.04.
	} else {
		var realMin = lin2log(min),
			realMax = lin2log(max),
			tickIntervalOption = options[minor ? 'minorTickInterval' : 'tickInterval'],
			filteredTickIntervalOption = tickIntervalOption === 'auto' ? null : tickIntervalOption,
			tickPixelIntervalOption = options.tickPixelInterval / (minor ? 5 : 1),
			totalPixelLength = minor ? axisLength / axis.tickPositions.length : axisLength;
		
		interval = pick(
			filteredTickIntervalOption,
			axis._minorAutoInterval,
			(realMax - realMin) * tickPixelIntervalOption / (totalPixelLength || 1)
		);
		
		interval = normalizeTickInterval(
			interval, 
			null, 
			getMagnitude(interval)
		);
		
		positions = map(axis.getLinearTickPositions(
			interval, 
			realMin,
			realMax	
		), log2lin);
		
		if (!minor) {
			axis._minorAutoInterval = interval / 5;
		}
	}
	
	// Set the axis-level tickInterval variable 
	if (!minor) {
		axis.tickInterval = interval;
	}
	return positions;
};
/**
 * Set the tick positions to a time unit that makes sense, for example
 * on the first of each month or on every Monday. Return an array
 * with the time positions. Used in datetime axes as well as for grouping
 * data on a datetime axis.
 *
 * @param {Object} normalizedInterval The interval in axis values (ms) and the count
 * @param {Number} min The minimum in axis values
 * @param {Number} max The maximum in axis values
 * @param {Number} startOfWeek
 */
Axis.prototype.getTimeTicks = function (normalizedInterval, min, max, startOfWeek) {
	var tickPositions = [],
		i,
		higherRanks = {},
		useUTC = defaultOptions.global.useUTC,
		minYear, // used in months and years as a basis for Date.UTC()
		minDate = new Date(min - timezoneOffset),
		interval = normalizedInterval.unitRange,
		count = normalizedInterval.count;

	if (defined(min)) { // #1300
		if (interval >= timeUnits[SECOND]) { // second
			minDate.setMilliseconds(0);
			minDate.setSeconds(interval >= timeUnits[MINUTE] ? 0 :
				count * mathFloor(minDate.getSeconds() / count));
		}
	
		if (interval >= timeUnits[MINUTE]) { // minute
			minDate[setMinutes](interval >= timeUnits[HOUR] ? 0 :
				count * mathFloor(minDate[getMinutes]() / count));
		}
	
		if (interval >= timeUnits[HOUR]) { // hour
			minDate[setHours](interval >= timeUnits[DAY] ? 0 :
				count * mathFloor(minDate[getHours]() / count));
		}
	
		if (interval >= timeUnits[DAY]) { // day
			minDate[setDate](interval >= timeUnits[MONTH] ? 1 :
				count * mathFloor(minDate[getDate]() / count));
		}
	
		if (interval >= timeUnits[MONTH]) { // month
			minDate[setMonth](interval >= timeUnits[YEAR] ? 0 :
				count * mathFloor(minDate[getMonth]() / count));
			minYear = minDate[getFullYear]();
		}
	
		if (interval >= timeUnits[YEAR]) { // year
			minYear -= minYear % count;
			minDate[setFullYear](minYear);
		}
	
		// week is a special case that runs outside the hierarchy
		if (interval === timeUnits[WEEK]) {
			// get start of current week, independent of count
			minDate[setDate](minDate[getDate]() - minDate[getDay]() +
				pick(startOfWeek, 1));
		}
	
	
		// get tick positions
		i = 1;
		if (timezoneOffset) {
			minDate = new Date(minDate.getTime() + timezoneOffset);
		}
		minYear = minDate[getFullYear]();
		var time = minDate.getTime(),
			minMonth = minDate[getMonth](),
			minDateDate = minDate[getDate](),
			localTimezoneOffset = useUTC ? 
				timezoneOffset : 
				(24 * 3600 * 1000 + minDate.getTimezoneOffset() * 60 * 1000) % (24 * 3600 * 1000); // #950
	
		// iterate and add tick positions at appropriate values
		while (time < max) {
			tickPositions.push(time);
	
			// if the interval is years, use Date.UTC to increase years
			if (interval === timeUnits[YEAR]) {
				time = makeTime(minYear + i * count, 0);
	
			// if the interval is months, use Date.UTC to increase months
			} else if (interval === timeUnits[MONTH]) {
				time = makeTime(minYear, minMonth + i * count);
	
			// if we're using global time, the interval is not fixed as it jumps
			// one hour at the DST crossover
			} else if (!useUTC && (interval === timeUnits[DAY] || interval === timeUnits[WEEK])) {
				time = makeTime(minYear, minMonth, minDateDate +
					i * count * (interval === timeUnits[DAY] ? 1 : 7));
	
			// else, the interval is fixed and we use simple addition
			} else {
				time += interval * count;
			}
	
			i++;
		}
	
		// push the last time
		tickPositions.push(time);


		// mark new days if the time is dividible by day (#1649, #1760)
		each(grep(tickPositions, function (time) {
			return interval <= timeUnits[HOUR] && time % timeUnits[DAY] === localTimezoneOffset;
		}), function (time) {
			higherRanks[time] = DAY;
		});
	}


	// record information on the chosen unit - for dynamic label formatter
	tickPositions.info = extend(normalizedInterval, {
		higherRanks: higherRanks,
		totalRange: interval * count
	});

	return tickPositions;
};

/**
 * Get a normalized tick interval for dates. Returns a configuration object with
 * unit range (interval), count and name. Used to prepare data for getTimeTicks. 
 * Previously this logic was part of getTimeTicks, but as getTimeTicks now runs
 * of segments in stock charts, the normalizing logic was extracted in order to 
 * prevent it for running over again for each segment having the same interval. 
 * #662, #697.
 */
Axis.prototype.normalizeTimeTickInterval = function (tickInterval, unitsOption) {
	var units = unitsOption || [[
				MILLISECOND, // unit name
				[1, 2, 5, 10, 20, 25, 50, 100, 200, 500] // allowed multiples
			], [
				SECOND,
				[1, 2, 5, 10, 15, 30]
			], [
				MINUTE,
				[1, 2, 5, 10, 15, 30]
			], [
				HOUR,
				[1, 2, 3, 4, 6, 8, 12]
			], [
				DAY,
				[1, 2]
			], [
				WEEK,
				[1, 2]
			], [
				MONTH,
				[1, 2, 3, 4, 6]
			], [
				YEAR,
				null
			]],
		unit = units[units.length - 1], // default unit is years
		interval = timeUnits[unit[0]],
		multiples = unit[1],
		count,
		i;
		
	// loop through the units to find the one that best fits the tickInterval
	for (i = 0; i < units.length; i++) {
		unit = units[i];
		interval = timeUnits[unit[0]];
		multiples = unit[1];


		if (units[i + 1]) {
			// lessThan is in the middle between the highest multiple and the next unit.
			var lessThan = (interval * multiples[multiples.length - 1] +
						timeUnits[units[i + 1][0]]) / 2;

			// break and keep the current unit
			if (tickInterval <= lessThan) {
				break;
			}
		}
	}

	// prevent 2.5 years intervals, though 25, 250 etc. are allowed
	if (interval === timeUnits[YEAR] && tickInterval < 5 * interval) {
		multiples = [1, 2, 5];
	}

	// get the count
	count = normalizeTickInterval(
		tickInterval / interval, 
		multiples,
		unit[0] === YEAR ? mathMax(getMagnitude(tickInterval / interval), 1) : 1 // #1913, #2360
	);
	
	return {
		unitRange: interval,
		count: count,
		unitName: unit[0]
	};
};/**
 * The class for stack items
 */
function StackItem(axis, options, isNegative, x, stackOption, stacking) {
	
	var inverted = axis.chart.inverted;

	this.axis = axis;

	// Tells if the stack is negative
	this.isNegative = isNegative;

	// Save the options to be able to style the label
	this.options = options;

	// Save the x value to be able to position the label later
	this.x = x;

	// Initialize total value
	this.total = null;

	// This will keep each points' extremes stored by series.index
	this.points = {};

	// Save the stack option on the series configuration object, and whether to treat it as percent
	this.stack = stackOption;
	this.percent = stacking === 'percent';

	// The align options and text align varies on whether the stack is negative and
	// if the chart is inverted or not.
	// First test the user supplied value, then use the dynamic.
	this.alignOptions = {
		align: options.align || (inverted ? (isNegative ? 'left' : 'right') : 'center'),
		verticalAlign: options.verticalAlign || (inverted ? 'middle' : (isNegative ? 'bottom' : 'top')),
		y: pick(options.y, inverted ? 4 : (isNegative ? 14 : -6)),
		x: pick(options.x, inverted ? (isNegative ? -6 : 6) : 0)
	};

	this.textAlign = options.textAlign || (inverted ? (isNegative ? 'right' : 'left') : 'center');
}

StackItem.prototype = {
	destroy: function () {
		destroyObjectProperties(this, this.axis);
	},

	/**
	 * Renders the stack total label and adds it to the stack label group.
	 */
	render: function (group) {
		var options = this.options,
			formatOption = options.format,
			str = formatOption ?
				format(formatOption, this) : 
				options.formatter.call(this);  // format the text in the label

		// Change the text to reflect the new total and set visibility to hidden in case the serie is hidden
		if (this.label) {
			this.label.attr({text: str, visibility: HIDDEN});
		// Create new label
		} else {
			this.label =
				this.axis.chart.renderer.text(str, 0, 0, options.useHTML)		// dummy positions, actual position updated with setOffset method in columnseries
					.css(options.style)				// apply style
					.attr({
						align: this.textAlign,				// fix the text-anchor
						rotation: options.rotation,	// rotation
						visibility: HIDDEN					// hidden until setOffset is called
					})				
					.add(group);							// add to the labels-group
		}
	},

	/**
	 * Sets the offset that the stack has from the x value and repositions the label.
	 */
	setOffset: function (xOffset, xWidth) {
		var stackItem = this,
			axis = stackItem.axis,
			chart = axis.chart,
			inverted = chart.inverted,
			neg = this.isNegative,							// special treatment is needed for negative stacks
			y = axis.translate(this.percent ? 100 : this.total, 0, 0, 0, 1), // stack value translated mapped to chart coordinates
			yZero = axis.translate(0),						// stack origin
			h = mathAbs(y - yZero),							// stack height
			x = chart.xAxis[0].translate(this.x) + xOffset,	// stack x position
			plotHeight = chart.plotHeight,
			stackBox = {	// this is the box for the complete stack
				x: inverted ? (neg ? y : y - h) : x,
				y: inverted ? plotHeight - x - xWidth : (neg ? (plotHeight - y - h) : plotHeight - y),
				width: inverted ? h : xWidth,
				height: inverted ? xWidth : h
			},
			label = this.label,
			alignAttr;
		
		if (label) {
			label.align(this.alignOptions, null, stackBox);	// align the label to the box
				
			// Set visibility (#678)
			alignAttr = label.alignAttr;
			label.attr({ 
				visibility: this.options.crop === false || chart.isInsidePlot(alignAttr.x, alignAttr.y) ? 
					(hasSVG ? 'inherit' : VISIBLE) : 
					HIDDEN
			});
		}
	}
};
/**
 * The tooltip object
 * @param {Object} chart The chart instance
 * @param {Object} options Tooltip options
 */
function Tooltip() {
	this.init.apply(this, arguments);
}

Tooltip.prototype = {

	init: function (chart, options) {

		var borderWidth = options.borderWidth,
			style = options.style,
			padding = pInt(style.padding);

		// Save the chart and options
		this.chart = chart;
		this.options = options;

		// Keep track of the current series
		//this.currentSeries = UNDEFINED;

		// List of crosshairs
		this.crosshairs = [];

		// Current values of x and y when animating
		this.now = { x: 0, y: 0 };

		// The tooltip is initially hidden
		this.isHidden = true;


		// create the label
		this.label = chart.renderer.label('', 0, 0, options.shape, null, null, options.useHTML, null, 'tooltip')
			.attr({
				padding: padding,
				fill: options.backgroundColor,
				'stroke-width': borderWidth,
				r: options.borderRadius,
				zIndex: 8
			})
			.css(style)
			.css({ padding: 0 }) // Remove it from VML, the padding is applied as an attribute instead (#1117)
			.add()
			.attr({ y: -999 }); // #2301

		// When using canVG the shadow shows up as a gray circle
		// even if the tooltip is hidden.
		if (!useCanVG) {
			this.label.shadow(options.shadow);
		}

		// Public property for getting the shared state.
		this.shared = options.shared;
	},

	/**
	 * Destroy the tooltip and its elements.
	 */
	destroy: function () {
		// Destroy and clear local variables
		if (this.label) {
			this.label = this.label.destroy();
		}
		clearTimeout(this.hideTimer);
		clearTimeout(this.tooltipTimeout);
	},

	/**
	 * Provide a soft movement for the tooltip
	 *
	 * @param {Number} x
	 * @param {Number} y
	 * @private
	 */
	move: function (x, y, anchorX, anchorY) {
		var tooltip = this,
			now = tooltip.now,
			animate = tooltip.options.animation !== false && !tooltip.isHidden;

		// get intermediate values for animation
		extend(now, {
			x: animate ? (2 * now.x + x) / 3 : x,
			y: animate ? (now.y + y) / 2 : y,
			anchorX: animate ? (2 * now.anchorX + anchorX) / 3 : anchorX,
			anchorY: animate ? (now.anchorY + anchorY) / 2 : anchorY
		});

		// move to the intermediate value
		tooltip.label.attr(now);

		
		// run on next tick of the mouse tracker
		if (animate && (mathAbs(x - now.x) > 1 || mathAbs(y - now.y) > 1)) {
		
			// never allow two timeouts
			clearTimeout(this.tooltipTimeout);
			
			// set the fixed interval ticking for the smooth tooltip
			this.tooltipTimeout = setTimeout(function () {
				// The interval function may still be running during destroy, so check that the chart is really there before calling.
				if (tooltip) {
					tooltip.move(x, y, anchorX, anchorY);
				}
			}, 32);
			
		}
	},

	/**
	 * Hide the tooltip
	 */
	hide: function () {
		var tooltip = this,
			hoverPoints;
		
		clearTimeout(this.hideTimer); // disallow duplicate timers (#1728, #1766)
		if (!this.isHidden) {
			hoverPoints = this.chart.hoverPoints;

			this.hideTimer = setTimeout(function () {
				tooltip.label.fadeOut();
				tooltip.isHidden = true;
			}, pick(this.options.hideDelay, 500));

			// hide previous hoverPoints and set new
			if (hoverPoints) {
				each(hoverPoints, function (point) {
					point.setState();
				});
			}

			this.chart.hoverPoints = null;
		}
	},
	
	/** 
	 * Extendable method to get the anchor position of the tooltip
	 * from a point or set of points
	 */
	getAnchor: function (points, mouseEvent) {
		var ret,
			chart = this.chart,
			inverted = chart.inverted,
			plotTop = chart.plotTop,
			plotX = 0,
			plotY = 0,
			yAxis;
		
		points = splat(points);
		
		// Pie uses a special tooltipPos
		ret = points[0].tooltipPos;
		
		// When tooltip follows mouse, relate the position to the mouse
		if (this.followPointer && mouseEvent) {
			if (mouseEvent.chartX === UNDEFINED) {
				mouseEvent = chart.pointer.normalize(mouseEvent);
			}
			ret = [
				mouseEvent.chartX - chart.plotLeft,
				mouseEvent.chartY - plotTop
			];
		}
		// When shared, use the average position
		if (!ret) {
			each(points, function (point) {
				yAxis = point.series.yAxis;
				plotX += point.plotX;
				plotY += (point.plotLow ? (point.plotLow + point.plotHigh) / 2 : point.plotY) +
					(!inverted && yAxis ? yAxis.top - plotTop : 0); // #1151
			});
			
			plotX /= points.length;
			plotY /= points.length;
			
			ret = [
				inverted ? chart.plotWidth - plotY : plotX,
				this.shared && !inverted && points.length > 1 && mouseEvent ? 
					mouseEvent.chartY - plotTop : // place shared tooltip next to the mouse (#424)
					inverted ? chart.plotHeight - plotX : plotY
			];
		}

		return map(ret, mathRound);
	},
	
	/**
	 * Place the tooltip in a chart without spilling over
	 * and not covering the point it self.
	 */
	getPosition: function (boxWidth, boxHeight, point) {
		
		// Set up the variables
		var chart = this.chart,
			plotLeft = chart.plotLeft,
			plotTop = chart.plotTop,
			plotWidth = chart.plotWidth,
			plotHeight = chart.plotHeight,
			distance = pick(this.options.distance, 12),
			pointX = point.plotX,
			pointY = point.plotY,
			x = pointX + plotLeft + (chart.inverted ? distance : -boxWidth - distance),
			y = pointY - boxHeight + plotTop + 15, // 15 means the point is 15 pixels up from the bottom of the tooltip
			alignedRight;
	
		// It is too far to the left, adjust it
		if (x < 7) {
			x = plotLeft + mathMax(pointX, 0) + distance;
		}
	
		// Test to see if the tooltip is too far to the right,
		// if it is, move it back to be inside and then up to not cover the point.
		if ((x + boxWidth) > (plotLeft + plotWidth)) {
			x -= (x + boxWidth) - (plotLeft + plotWidth);
			y = pointY - boxHeight + plotTop - distance;
			alignedRight = true;
		}
	
		// If it is now above the plot area, align it to the top of the plot area
		if (y < plotTop + 5) {
			y = plotTop + 5;
	
			// If the tooltip is still covering the point, move it below instead
			if (alignedRight && pointY >= y && pointY <= (y + boxHeight)) {
				y = pointY + plotTop + distance; // below
			}
		} 
	
		// Now if the tooltip is below the chart, move it up. It's better to cover the
		// point than to disappear outside the chart. #834.
		if (y + boxHeight > plotTop + plotHeight) {
			y = mathMax(plotTop, plotTop + plotHeight - boxHeight - distance); // below
		}
	
		return {x: x, y: y};
	},

	/**
	 * In case no user defined formatter is given, this will be used. Note that the context
	 * here is an object holding point, series, x, y etc.
	 */
	defaultFormatter: function (tooltip) {
		var items = this.points || splat(this),
			series = items[0].series,
			s;

		// build the header
		s = [series.tooltipHeaderFormatter(items[0])];

		// build the values
		each(items, function (item) {
			series = item.series;
			s.push((series.tooltipFormatter && series.tooltipFormatter(item)) ||
				item.point.tooltipFormatter(series.tooltipOptions.pointFormat));
		});

		// footer
		s.push(tooltip.options.footerFormat || '');

		return s.join('');
	},

	/**
	 * Refresh the tooltip's text and position.
	 * @param {Object} point
	 */
	refresh: function (point, mouseEvent) {
		var tooltip = this,
			chart = tooltip.chart,
			label = tooltip.label,
			options = tooltip.options,
			x,
			y,
			anchor,
			textConfig = {},
			text,
			pointConfig = [],
			formatter = options.formatter || tooltip.defaultFormatter,
			hoverPoints = chart.hoverPoints,
			borderColor,
			shared = tooltip.shared,
			currentSeries;
			
		clearTimeout(this.hideTimer);
		
		// get the reference point coordinates (pie charts use tooltipPos)
		tooltip.followPointer = splat(point)[0].series.tooltipOptions.followPointer;
		anchor = tooltip.getAnchor(point, mouseEvent);
		x = anchor[0];
		y = anchor[1];

		// shared tooltip, array is sent over
		if (shared && !(point.series && point.series.noSharedTooltip)) {
			
			// hide previous hoverPoints and set new
			
			chart.hoverPoints = point;
			if (hoverPoints) {
				each(hoverPoints, function (point) {
					point.setState();
				});
			}

			each(point, function (item) {
				item.setState(HOVER_STATE);

				pointConfig.push(item.getLabelConfig());
			});

			textConfig = {
				x: point[0].category,
				y: point[0].y
			};
			textConfig.points = pointConfig;
			point = point[0];

		// single point tooltip
		} else {
			textConfig = point.getLabelConfig();
		}
		text = formatter.call(textConfig, tooltip);

		// register the current series
		currentSeries = point.series;

		// update the inner HTML
		if (text === false) {
			this.hide();
		} else {

			// show it
			if (tooltip.isHidden) {
				stop(label);
				label.attr('opacity', 1).show();
			}

			// update text
			label.attr({
				text: text
			});

			// set the stroke color of the box
			borderColor = options.borderColor || point.color || currentSeries.color || '#606060';
			label.attr({
				stroke: borderColor
			});
			
			tooltip.updatePosition({ plotX: x, plotY: y });
		
			this.isHidden = false;
		}
		fireEvent(chart, 'tooltipRefresh', {
				text: text,
				x: x + chart.plotLeft,
				y: y + chart.plotTop,
				borderColor: borderColor
			});
	},
	
	/**
	 * Find the new position and perform the move
	 */
	updatePosition: function (point) {
		var chart = this.chart,
			label = this.label, 
			pos = (this.options.positioner || this.getPosition).call(
				this,
				label.width,
				label.height,
				point
			);

		// do the move
		this.move(
			mathRound(pos.x), 
			mathRound(pos.y), 
			point.plotX + chart.plotLeft, 
			point.plotY + chart.plotTop
		);
	}
};
/**
 * The mouse tracker object. All methods starting with "on" are primary DOM event handlers. 
 * Subsequent methods should be named differently from what they are doing.
 * @param {Object} chart The Chart instance
 * @param {Object} options The root options object
 */
var Pointer = Highcharts.Pointer = function (chart, options) {
	this.init(chart, options);
};

Pointer.prototype = {
	/**
	 * Initialize Pointer
	 */
	init: function (chart, options) {
		
		var chartOptions = options.chart,
			chartEvents = chartOptions.events,
			zoomType = useCanVG ? '' : chartOptions.zoomType,
			inverted = chart.inverted,
			zoomX,
			zoomY;

		// Store references
		this.options = options;
		this.chart = chart;
		
		// Zoom status
		this.zoomX = zoomX = /x/.test(zoomType);
		this.zoomY = zoomY = /y/.test(zoomType);
		this.zoomHor = (zoomX && !inverted) || (zoomY && inverted);
		this.zoomVert = (zoomY && !inverted) || (zoomX && inverted);

		// Do we need to handle click on a touch device?
		this.runChartClick = chartEvents && !!chartEvents.click;

		this.pinchDown = [];
		this.lastValidTouch = {};

		if (options.tooltip.enabled) {
			chart.tooltip = new Tooltip(chart, options.tooltip);
		}

		this.setDOMEvents();
	}, 

	/**
	 * Add crossbrowser support for chartX and chartY
	 * @param {Object} e The event object in standard browsers
	 */
	normalize: function (e, chartPosition) {
		var chartX,
			chartY,
			ePos;

		// common IE normalizing
		e = e || win.event;
		if (!e.target) {
			e.target = e.srcElement;
		}

		// Framework specific normalizing (#1165)
		e = washMouseEvent(e);
		
		// iOS
		ePos = e.touches ? e.touches.item(0) : e;

		// Get mouse position
		if (!chartPosition) {
			this.chartPosition = chartPosition = offset(this.chart.container);
		}

		// chartX and chartY
		if (ePos.pageX === UNDEFINED) { // IE < 9. #886.
			chartX = mathMax(e.x, e.clientX - chartPosition.left); // #2005, #2129: the second case is 
				// for IE10 quirks mode within framesets
			chartY = e.y;
		} else {
			chartX = ePos.pageX - chartPosition.left;
			chartY = ePos.pageY - chartPosition.top;
		}

		return extend(e, {
			chartX: mathRound(chartX),
			chartY: mathRound(chartY)
		});
	},

	/**
	 * Get the click position in terms of axis values.
	 *
	 * @param {Object} e A pointer event
	 */
	getCoordinates: function (e) {
		var coordinates = {
				xAxis: [],
				yAxis: []
			};

		each(this.chart.axes, function (axis) {
			coordinates[axis.isXAxis ? 'xAxis' : 'yAxis'].push({
				axis: axis,
				value: axis.toValue(e[axis.horiz ? 'chartX' : 'chartY'])
			});
		});
		return coordinates;
	},
	
	/**
	 * Return the index in the tooltipPoints array, corresponding to pixel position in 
	 * the plot area.
	 */
	getIndex: function (e) {
		var chart = this.chart;
		return chart.inverted ? 
			chart.plotHeight + chart.plotTop - e.chartY : 
			e.chartX - chart.plotLeft;
	},

	/**
	 * With line type charts with a single tracker, get the point closest to the mouse.
	 * Run Point.onMouseOver and display tooltip for the point or points.
	 */
	runPointActions: function (e) {
		var pointer = this,
			chart = pointer.chart,
			series = chart.series,
			tooltip = chart.tooltip,
			point,
			points,
			hoverPoint = chart.hoverPoint,
			hoverSeries = chart.hoverSeries,
			i,
			j,
			distance = chart.chartWidth,
			index = pointer.getIndex(e),
			anchor;

		// shared tooltip
		if (tooltip && pointer.options.tooltip.shared && !(hoverSeries && hoverSeries.noSharedTooltip)) {
			points = [];

			// loop over all series and find the ones with points closest to the mouse
			i = series.length;
			for (j = 0; j < i; j++) {
				if (series[j].visible &&
						series[j].options.enableMouseTracking !== false &&
						!series[j].noSharedTooltip && series[j].tooltipPoints.length) {
					point = series[j].tooltipPoints[index];
					if (point && point.series) { // not a dummy point, #1544
						point._dist = mathAbs(index - point.clientX);
						distance = mathMin(distance, point._dist);
						points.push(point);
					}
				}
			}
			// remove furthest points
			i = points.length;
			while (i--) {
				if (points[i]._dist > distance) {
					points.splice(i, 1);
				}
			}
			// refresh the tooltip if necessary
			if (points.length && (points[0].clientX !== pointer.hoverX)) {
				tooltip.refresh(points, e);
				pointer.hoverX = points[0].clientX;
			}
		}

		// separate tooltip and general mouse events
		if (hoverSeries && hoverSeries.tracker) { // only use for line-type series with common tracker

			// get the point
			point = hoverSeries.tooltipPoints[index];

			// a new point is hovered, refresh the tooltip
			if (point && point !== hoverPoint) {

				// trigger the events
				point.onMouseOver(e);

			}
			
		} else if (tooltip && tooltip.followPointer && !tooltip.isHidden) {
			anchor = tooltip.getAnchor([{}], e);
			tooltip.updatePosition({ plotX: anchor[0], plotY: anchor[1] });
		}

		// Start the event listener to pick up the tooltip 
		if (tooltip && !pointer._onDocumentMouseMove) {
			pointer._onDocumentMouseMove = function (e) {
				pointer.onDocumentMouseMove(e);
			};
			addEvent(doc, 'mousemove', pointer._onDocumentMouseMove);
		}

		// Draw independent crosshairs
		each(chart.axes, function (axis) {
			axis.drawCrosshair(e, pick(point, hoverPoint));
		});
	},



	/**
	 * Reset the tracking by hiding the tooltip, the hover series state and the hover point
	 * 
	 * @param allowMove {Boolean} Instead of destroying the tooltip altogether, allow moving it if possible
	 */
	reset: function (allowMove) {
		var pointer = this,
			chart = pointer.chart,
			hoverSeries = chart.hoverSeries,
			hoverPoint = chart.hoverPoint,
			tooltip = chart.tooltip,
			tooltipPoints = tooltip && tooltip.shared ? chart.hoverPoints : hoverPoint;
			
		// Narrow in allowMove
		allowMove = allowMove && tooltip && tooltipPoints;
			
		// Check if the points have moved outside the plot area, #1003
		if (allowMove && splat(tooltipPoints)[0].plotX === UNDEFINED) {
			allowMove = false;
		}	

		// Just move the tooltip, #349
		if (allowMove) {
			tooltip.refresh(tooltipPoints);
			if (hoverPoint) { // #2500
				hoverPoint.setState(hoverPoint.state, true);
			}

		// Full reset
		} else {

			if (hoverPoint) {
				hoverPoint.onMouseOut();
			}

			if (hoverSeries) {
				hoverSeries.onMouseOut();
			}

			if (tooltip) {
				tooltip.hide();
			}

			if (pointer._onDocumentMouseMove) {
				removeEvent(doc, 'mousemove', pointer._onDocumentMouseMove);
				pointer._onDocumentMouseMove = null;
			}

			// Remove crosshairs
			each(chart.axes, function (axis) {
				axis.hideCrosshair();
			});
			
			pointer.hoverX = null;

		}
	},

	/**
	 * Scale series groups to a certain scale and translation
	 */
	scaleGroups: function (attribs, clip) {

		var chart = this.chart,
			seriesAttribs;

		// Scale each series
		each(chart.series, function (series) {
			seriesAttribs = attribs || series.getPlotBox(); // #1701
			if (series.xAxis && series.xAxis.zoomEnabled) {
				series.group.attr(seriesAttribs);
				if (series.markerGroup) {
					series.markerGroup.attr(seriesAttribs);
					series.markerGroup.clip(clip ? chart.clipRect : null);
				}
				if (series.dataLabelsGroup) {
					series.dataLabelsGroup.attr(seriesAttribs);
				}
			}
		});
		
		// Clip
		chart.clipRect.attr(clip || chart.clipBox);
	},

	/**
	 * Run translation operations
	 */
	pinchTranslate: function (zoomHor, zoomVert, pinchDown, touches, transform, selectionMarker, clip, lastValidTouch) {
		if (zoomHor) {
			this.pinchTranslateDirection(true, pinchDown, touches, transform, selectionMarker, clip, lastValidTouch);
		}
		if (zoomVert) {
			this.pinchTranslateDirection(false, pinchDown, touches, transform, selectionMarker, clip, lastValidTouch);
		}
	},

	/**
	 * Run translation operations for each direction (horizontal and vertical) independently
	 */
	pinchTranslateDirection: function (horiz, pinchDown, touches, transform, selectionMarker, clip, lastValidTouch, forcedScale) {
		var chart = this.chart,
			xy = horiz ? 'x' : 'y',
			XY = horiz ? 'X' : 'Y',
			sChartXY = 'chart' + XY,
			wh = horiz ? 'width' : 'height',
			plotLeftTop = chart['plot' + (horiz ? 'Left' : 'Top')],
			selectionWH,
			selectionXY,
			clipXY,
			scale = forcedScale || 1,
			inverted = chart.inverted,
			bounds = chart.bounds[horiz ? 'h' : 'v'],
			singleTouch = pinchDown.length === 1,
			touch0Start = pinchDown[0][sChartXY],
			touch0Now = touches[0][sChartXY],
			touch1Start = !singleTouch && pinchDown[1][sChartXY],
			touch1Now = !singleTouch && touches[1][sChartXY],
			outOfBounds,
			transformScale,
			scaleKey,
			setScale = function () {
				if (!singleTouch && mathAbs(touch0Start - touch1Start) > 20) { // Don't zoom if fingers are too close on this axis
					scale = forcedScale || mathAbs(touch0Now - touch1Now) / mathAbs(touch0Start - touch1Start);	
				}
				
				clipXY = ((plotLeftTop - touch0Now) / scale) + touch0Start;
				selectionWH = chart['plot' + (horiz ? 'Width' : 'Height')] / scale;
			};

		// Set the scale, first pass
		setScale();

		selectionXY = clipXY; // the clip position (x or y) is altered if out of bounds, the selection position is not

		// Out of bounds
		if (selectionXY < bounds.min) {
			selectionXY = bounds.min;
			outOfBounds = true;
		} else if (selectionXY + selectionWH > bounds.max) {
			selectionXY = bounds.max - selectionWH;
			outOfBounds = true;
		}
		
		// Is the chart dragged off its bounds, determined by dataMin and dataMax?
		if (outOfBounds) {

			// Modify the touchNow position in order to create an elastic drag movement. This indicates
			// to the user that the chart is responsive but can't be dragged further.
			touch0Now -= 0.8 * (touch0Now - lastValidTouch[xy][0]);
			if (!singleTouch) {
				touch1Now -= 0.8 * (touch1Now - lastValidTouch[xy][1]);
			}

			// Set the scale, second pass to adapt to the modified touchNow positions
			setScale();

		} else {
			lastValidTouch[xy] = [touch0Now, touch1Now];
		}

		// Set geometry for clipping, selection and transformation
		if (!inverted) { // TODO: implement clipping for inverted charts
			clip[xy] = clipXY - plotLeftTop;
			clip[wh] = selectionWH;
		}
		scaleKey = inverted ? (horiz ? 'scaleY' : 'scaleX') : 'scale' + XY;
		transformScale = inverted ? 1 / scale : scale;

		selectionMarker[wh] = selectionWH;
		selectionMarker[xy] = selectionXY;
		transform[scaleKey] = scale;
		transform['translate' + XY] = (transformScale * plotLeftTop) + (touch0Now - (transformScale * touch0Start));
	},
	
	/**
	 * Handle touch events with two touches
	 */
	pinch: function (e) {

		var self = this,
			chart = self.chart,
			pinchDown = self.pinchDown,
			followTouchMove = chart.tooltip && chart.tooltip.options.followTouchMove,
			touches = e.touches,
			touchesLength = touches.length,
			lastValidTouch = self.lastValidTouch,
			zoomHor = self.zoomHor || self.pinchHor,
			zoomVert = self.zoomVert || self.pinchVert,
			hasZoom = zoomHor || zoomVert,
			selectionMarker = self.selectionMarker,
			transform = {},
			fireClickEvent = touchesLength === 1 && ((self.inClass(e.target, PREFIX + 'tracker') && 
				chart.runTrackerClick) || chart.runChartClick),
			clip = {};

		// On touch devices, only proceed to trigger click if a handler is defined
		if ((hasZoom || followTouchMove) && !fireClickEvent) {
			e.preventDefault();
		}
		
		// Normalize each touch
		map(touches, function (e) {
			return self.normalize(e);
		});
		
		// Register the touch start position
		if (e.type === 'touchstart') {
			each(touches, function (e, i) {
				pinchDown[i] = { chartX: e.chartX, chartY: e.chartY };
			});
			lastValidTouch.x = [pinchDown[0].chartX, pinchDown[1] && pinchDown[1].chartX];
			lastValidTouch.y = [pinchDown[0].chartY, pinchDown[1] && pinchDown[1].chartY];

			// Identify the data bounds in pixels
			each(chart.axes, function (axis) {
				if (axis.zoomEnabled) {
					var bounds = chart.bounds[axis.horiz ? 'h' : 'v'],
						minPixelPadding = axis.minPixelPadding,
						min = axis.toPixels(axis.dataMin),
						max = axis.toPixels(axis.dataMax),
						absMin = mathMin(min, max),
						absMax = mathMax(min, max);

					// Store the bounds for use in the touchmove handler
					bounds.min = mathMin(axis.pos, absMin - minPixelPadding);
					bounds.max = mathMax(axis.pos + axis.len, absMax + minPixelPadding);
				}
			});
		
		// Event type is touchmove, handle panning and pinching
		} else if (pinchDown.length) { // can be 0 when releasing, if touchend fires first
			

			// Set the marker
			if (!selectionMarker) {
				self.selectionMarker = selectionMarker = extend({
					destroy: noop
				}, chart.plotBox);
			}
			
			self.pinchTranslate(zoomHor, zoomVert, pinchDown, touches, transform, selectionMarker, clip, lastValidTouch);

			self.hasPinched = hasZoom;

			// Scale and translate the groups to provide visual feedback during pinching
			self.scaleGroups(transform, clip);
			
			// Optionally move the tooltip on touchmove
			if (!hasZoom && followTouchMove && touchesLength === 1) {
				this.runPointActions(self.normalize(e));
			}
		}
	},

	/**
	 * Start a drag operation
	 */
	dragStart: function (e) {
		var chart = this.chart;

		// Record the start position
		chart.mouseIsDown = e.type;
		chart.cancelClick = false;
		chart.mouseDownX = this.mouseDownX = e.chartX;
		chart.mouseDownY = this.mouseDownY = e.chartY;
	},

	/**
	 * Perform a drag operation in response to a mousemove event while the mouse is down
	 */
	drag: function (e) {

		var chart = this.chart,
			chartOptions = chart.options.chart,
			chartX = e.chartX,
			chartY = e.chartY,
			zoomHor = this.zoomHor,
			zoomVert = this.zoomVert,
			plotLeft = chart.plotLeft,
			plotTop = chart.plotTop,
			plotWidth = chart.plotWidth,
			plotHeight = chart.plotHeight,
			clickedInside,
			size,
			mouseDownX = this.mouseDownX,
			mouseDownY = this.mouseDownY;

		// If the mouse is outside the plot area, adjust to cooordinates
		// inside to prevent the selection marker from going outside
		if (chartX < plotLeft) {
			chartX = plotLeft;
		} else if (chartX > plotLeft + plotWidth) {
			chartX = plotLeft + plotWidth;
		}

		if (chartY < plotTop) {
			chartY = plotTop;
		} else if (chartY > plotTop + plotHeight) {
			chartY = plotTop + plotHeight;
		}
		
		// determine if the mouse has moved more than 10px
		this.hasDragged = Math.sqrt(
			Math.pow(mouseDownX - chartX, 2) +
			Math.pow(mouseDownY - chartY, 2)
		);
		if (this.hasDragged > 10) {
			clickedInside = chart.isInsidePlot(mouseDownX - plotLeft, mouseDownY - plotTop);

			// make a selection
			if (chart.hasCartesianSeries && (this.zoomX || this.zoomY) && clickedInside) {
				if (!this.selectionMarker) {
					this.selectionMarker = chart.renderer.rect(
						plotLeft,
						plotTop,
						zoomHor ? 1 : plotWidth,
						zoomVert ? 1 : plotHeight,
						0
					)
					.attr({
						fill: chartOptions.selectionMarkerFill || 'rgba(69,114,167,0.25)',
						zIndex: 7
					})
					.add();
				}
			}

			// adjust the width of the selection marker
			if (this.selectionMarker && zoomHor) {
				size = chartX - mouseDownX;
				this.selectionMarker.attr({
					width: mathAbs(size),
					x: (size > 0 ? 0 : size) + mouseDownX
				});
			}
			// adjust the height of the selection marker
			if (this.selectionMarker && zoomVert) {
				size = chartY - mouseDownY;
				this.selectionMarker.attr({
					height: mathAbs(size),
					y: (size > 0 ? 0 : size) + mouseDownY
				});
			}

			// panning
			if (clickedInside && !this.selectionMarker && chartOptions.panning) {
				chart.pan(e, chartOptions.panning);
			}
		}
	},

	/**
	 * On mouse up or touch end across the entire document, drop the selection.
	 */
	drop: function (e) {
		var chart = this.chart,
			hasPinched = this.hasPinched;

		if (this.selectionMarker) {
			var selectionData = {
					xAxis: [],
					yAxis: [],
					originalEvent: e.originalEvent || e
				},
				selectionBox = this.selectionMarker,
				selectionLeft = selectionBox.x,
				selectionTop = selectionBox.y,
				runZoom;
			// a selection has been made
			if (this.hasDragged || hasPinched) {

				// record each axis' min and max
				each(chart.axes, function (axis) {
					if (axis.zoomEnabled) {
						var horiz = axis.horiz,
							selectionMin = axis.toValue((horiz ? selectionLeft : selectionTop)),
							selectionMax = axis.toValue((horiz ? selectionLeft + selectionBox.width : selectionTop + selectionBox.height));

						if (!isNaN(selectionMin) && !isNaN(selectionMax)) { // #859
							selectionData[axis.coll].push({
								axis: axis,
								min: mathMin(selectionMin, selectionMax), // for reversed axes,
								max: mathMax(selectionMin, selectionMax)
							});
							runZoom = true;
						}
					}
				});
				if (runZoom) {
					fireEvent(chart, 'selection', selectionData, function (args) { 
						chart.zoom(extend(args, hasPinched ? { animation: false } : null)); 
					});
				}

			}
			this.selectionMarker = this.selectionMarker.destroy();

			// Reset scaling preview
			if (hasPinched) {
				this.scaleGroups();
			}
		}

		// Reset all
		if (chart) { // it may be destroyed on mouse up - #877
			css(chart.container, { cursor: chart._cursor });
			chart.cancelClick = this.hasDragged > 10; // #370
			chart.mouseIsDown = this.hasDragged = this.hasPinched = false;
			this.pinchDown = [];
		}
	},

	onContainerMouseDown: function (e) {

		e = this.normalize(e);

		// issue #295, dragging not always working in Firefox
		if (e.preventDefault) {
			e.preventDefault();
		}
		
		this.dragStart(e);
	},

	

	onDocumentMouseUp: function (e) {
		this.drop(e);
	},

	/**
	 * Special handler for mouse move that will hide the tooltip when the mouse leaves the plotarea.
	 * Issue #149 workaround. The mouseleave event does not always fire. 
	 */
	onDocumentMouseMove: function (e) {
		var chart = this.chart,
			chartPosition = this.chartPosition,
			hoverSeries = chart.hoverSeries;

		e = this.normalize(e, chartPosition);

		// If we're outside, hide the tooltip
		if (chartPosition && hoverSeries && !this.inClass(e.target, 'highcharts-tracker') &&
				!chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) {
			this.reset();
		}
	},

	/**
	 * When mouse leaves the container, hide the tooltip.
	 */
	onContainerMouseLeave: function () {
		this.reset();
		this.chartPosition = null; // also reset the chart position, used in #149 fix
	},

	// The mousemove, touchmove and touchstart event handler
	onContainerMouseMove: function (e) {

		var chart = this.chart;

		// normalize
		e = this.normalize(e);		
		
		if (chart.mouseIsDown === 'mousedown') {
			this.drag(e);
		} 
		
		// Show the tooltip and run mouse over events (#977)
		if ((this.inClass(e.target, 'highcharts-tracker') || 
				chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) && !chart.openMenu) {
			this.runPointActions(e);
		}
	},

	/**
	 * Utility to detect whether an element has, or has a parent with, a specific
	 * class name. Used on detection of tracker objects and on deciding whether
	 * hovering the tooltip should cause the active series to mouse out.
	 */
	inClass: function (element, className) {
		var elemClassName;
		while (element) {
			elemClassName = attr(element, 'class');
			if (elemClassName) {
				if (elemClassName.indexOf(className) !== -1) {
					return true;
				} else if (elemClassName.indexOf(PREFIX + 'container') !== -1) {
					return false;
				}
			}
			element = element.parentNode;
		}		
	},

	onTrackerMouseOut: function (e) {
		var series = this.chart.hoverSeries,
			relatedTarget = e.relatedTarget || e.toElement,
			relatedSeries = relatedTarget && relatedTarget.point && relatedTarget.point.series; // #2499
		
		if (series && !series.options.stickyTracking && !this.inClass(relatedTarget, PREFIX + 'tooltip') &&
				relatedSeries !== series) {
			series.onMouseOut();
		}
	},

	onContainerClick: function (e) {
		var chart = this.chart,
			hoverPoint = chart.hoverPoint, 
			plotLeft = chart.plotLeft,
			plotTop = chart.plotTop,
			inverted = chart.inverted,
			chartPosition,
			plotX,
			plotY;
		
		e = this.normalize(e);
		e.cancelBubble = true; // IE specific

		if (!chart.cancelClick) {
			
			// On tracker click, fire the series and point events. #783, #1583
			if (hoverPoint && this.inClass(e.target, PREFIX + 'tracker')) {
				chartPosition = this.chartPosition;
				plotX = hoverPoint.plotX;
				plotY = hoverPoint.plotY;

				// add page position info
				extend(hoverPoint, {
					pageX: chartPosition.left + plotLeft +
						(inverted ? chart.plotWidth - plotY : plotX),
					pageY: chartPosition.top + plotTop +
						(inverted ? chart.plotHeight - plotX : plotY)
				});
			
				// the series click event
				fireEvent(hoverPoint.series, 'click', extend(e, {
					point: hoverPoint
				}));

				// the point click event
				if (chart.hoverPoint) { // it may be destroyed (#1844)
					hoverPoint.firePointEvent('click', e);
				}

			// When clicking outside a tracker, fire a chart event
			} else {
				extend(e, this.getCoordinates(e));

				// fire a click event in the chart
				if (chart.isInsidePlot(e.chartX - plotLeft, e.chartY - plotTop)) {
					fireEvent(chart, 'click', e);
				}
			}


		}
	},

	onContainerTouchStart: function (e) {
		var chart = this.chart;

		if (e.touches.length === 1) {

			e = this.normalize(e);

			if (chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop)) {

				// Prevent the click pseudo event from firing unless it is set in the options
				/*if (!chart.runChartClick) {
					e.preventDefault();
				}*/
			
				// Run mouse events and display tooltip etc
				this.runPointActions(e);

				this.pinch(e);

			} else {
				// Hide the tooltip on touching outside the plot area (#1203)
				this.reset();
			}

		} else if (e.touches.length === 2) {
			this.pinch(e);
		}		
	},

	onContainerTouchMove: function (e) {
		if (e.touches.length === 1 || e.touches.length === 2) {
			this.pinch(e);
		}
	},

	onDocumentTouchEnd: function (e) {
		this.drop(e);
	},

	/**
	 * Set the JS DOM events on the container and document. This method should contain
	 * a one-to-one assignment between methods and their handlers. Any advanced logic should
	 * be moved to the handler reflecting the event's name.
	 */
	setDOMEvents: function () {

		var pointer = this,
			container = pointer.chart.container,
			events;

		this._events = events = [
			[container, 'onmousedown', 'onContainerMouseDown'],
			[container, 'onmousemove', 'onContainerMouseMove'],
			[container, 'onclick', 'onContainerClick'],
			[container, 'mouseleave', 'onContainerMouseLeave'],
			[doc, 'mouseup', 'onDocumentMouseUp']
		];

		if (hasTouch) {
			events.push(
				[container, 'ontouchstart', 'onContainerTouchStart'],
				[container, 'ontouchmove', 'onContainerTouchMove'],
				[doc, 'touchend', 'onDocumentTouchEnd']
			);
		}

		each(events, function (eventConfig) {

			// First, create the callback function that in turn calls the method on Pointer
			pointer['_' + eventConfig[2]] = function (e) {
				pointer[eventConfig[2]](e);
			};

			// Now attach the function, either as a direct property or through addEvent
			if (eventConfig[1].indexOf('on') === 0) {
				eventConfig[0][eventConfig[1]] = pointer['_' + eventConfig[2]];
			} else {
				addEvent(eventConfig[0], eventConfig[1], pointer['_' + eventConfig[2]]);
			}
		});

		
	},

	/**
	 * Destroys the Pointer object and disconnects DOM events.
	 */
	destroy: function () {
		var pointer = this;

		// Release all DOM events
		each(pointer._events, function (eventConfig) {	
			if (eventConfig[1].indexOf('on') === 0) {
				eventConfig[0][eventConfig[1]] = null; // delete breaks oldIE
			} else {		
				removeEvent(eventConfig[0], eventConfig[1], pointer['_' + eventConfig[2]]);
			}
		});
		delete pointer._events;

		// memory and CPU leak
		clearInterval(pointer.tooltipTimeout);
	}
};


/**
 * PointTrackerMixin
 */

var TrackerMixin = Highcharts.TrackerMixin = {
	drawTrackerPoint: function () {
		var series = this,
			chart = series.chart,
			pointer = chart.pointer,
			cursor = series.options.cursor,
			css = cursor && { cursor: cursor },
			onMouseOver = function (e) {
				var target = e.target,
					point;

				if (chart.hoverSeries !== series) {
					series.onMouseOver();
				}
				while (target && !point) {
					point = target.point;
					target = target.parentNode;
				}
				if (point !== UNDEFINED && point !== chart.hoverPoint) { // undefined on graph in scatterchart
					point.onMouseOver(e);
				}
			};

		// Add reference to the point
		each(series.points, function (point) {
			if (point.graphic) {
				point.graphic.element.point = point;
			}
			if (point.dataLabel) {
				point.dataLabel.element.point = point;
			}
		});

		// Add the event listeners, we need to do this only once
		if (!series._hasTracking) {
			each(series.trackerGroups, function (key) {
				if (series[key]) { // we don't always have dataLabelsGroup
					series[key]
						.addClass(PREFIX + 'tracker')
						.on('mouseover', onMouseOver)
						.on('mouseout', function (e) { pointer.onTrackerMouseOut(e); })
						.css(css);
					if (hasTouch) {
						series[key].on('touchstart', onMouseOver);
					}
				}
			});
			series._hasTracking = true;
		}
	},

	/**
	 * Draw the tracker object that sits above all data labels and markers to
	 * track mouse events on the graph or points. For the line type charts
	 * the tracker uses the same graphPath, but with a greater stroke width
	 * for better control.
	 */
	drawTrackerGraph: function () {
		var series = this,
			options = series.options,
			trackByArea = options.trackByArea,
			trackerPath = [].concat(trackByArea ? series.areaPath : series.graphPath),
			trackerPathLength = trackerPath.length,
			chart = series.chart,
			pointer = chart.pointer,
			renderer = chart.renderer,
			snap = chart.options.tooltip.snap,
			tracker = series.tracker,
			cursor = options.cursor,
			css = cursor && { cursor: cursor },
			singlePoints = series.singlePoints,
			singlePoint,
			i,
			onMouseOver = function () {
				if (chart.hoverSeries !== series) {
					series.onMouseOver();
				}
			};

		// Extend end points. A better way would be to use round linecaps,
		// but those are not clickable in VML.
		if (trackerPathLength && !trackByArea) {
			i = trackerPathLength + 1;
			while (i--) {
				if (trackerPath[i] === M) { // extend left side
					trackerPath.splice(i + 1, 0, trackerPath[i + 1] - snap, trackerPath[i + 2], L);
				}
				if ((i && trackerPath[i] === M) || i === trackerPathLength) { // extend right side
					trackerPath.splice(i, 0, L, trackerPath[i - 2] + snap, trackerPath[i - 1]);
				}
			}
		}

		// handle single points
		for (i = 0; i < singlePoints.length; i++) {
			singlePoint = singlePoints[i];
			trackerPath.push(M, singlePoint.plotX - snap, singlePoint.plotY,
				L, singlePoint.plotX + snap, singlePoint.plotY);
		}

		// draw the tracker
		if (tracker) {
			tracker.attr({ d: trackerPath });

		} else { // create

			series.tracker = renderer.path(trackerPath)
				.attr({
					'stroke-linejoin': 'round', // #1225
					visibility: series.visible ? VISIBLE : HIDDEN,
					stroke: TRACKER_FILL,
					fill: trackByArea ? TRACKER_FILL : NONE,
					'stroke-width' : options.lineWidth + (trackByArea ? 0 : 2 * snap),
					zIndex: 2
				})
				.add(series.group);

			// The tracker is added to the series group, which is clipped, but is covered
			// by the marker group. So the marker group also needs to capture events.
			each([series.tracker, series.markerGroup], function (tracker) {
				tracker.addClass(PREFIX + 'tracker')
					.on('mouseover', onMouseOver)
					.on('mouseout', function (e) { pointer.onTrackerMouseOut(e); })
					.css(css);

				if (hasTouch) {
					tracker.on('touchstart', onMouseOver);
				}
			});
		}

	}	
};
if (win.PointerEvent || win.MSPointerEvent) {
	
	// The touches object keeps track of the points being touched at all times
	var touches = {};

	// Emulate a Webkit TouchList 
	Pointer.prototype.getWebkitTouches = function () {
		var key, fake = [];
		fake.item = function (i) { return this[i]; };
		for (key in touches) {
			if (touches.hasOwnProperty(key)) {
				fake.push({
					pageX: touches[key].pageX,
					pageY: touches[key].pageY,
					target: touches[key].target
				});
			}
		}
		return fake;
	};

	// Disable default IE actions for pinch and such on chart element
	wrap(Pointer.prototype, 'init', function (proceed, chart, options) {
		chart.container.style["-ms-touch-action"] = chart.container.style["touch-action"] = "none";
		proceed.call(this, chart, options);
	});

	// Add IE specific touch events to chart
	wrap(Pointer.prototype, 'setDOMEvents', function (proceed) {
		var pointer = this, eventmap;
		proceed.apply(this, Array.prototype.slice.call(arguments, 1));
		eventmap = [
			[this.chart.container, "PointerDown", "touchstart", "onContainerTouchStart", function (e) {
				touches[e.pointerId] = { pageX: e.pageX, pageY: e.pageY, target: e.currentTarget };
			}],
			[this.chart.container, "PointerMove", "touchmove", "onContainerTouchMove", function (e) {
				touches[e.pointerId] = { pageX: e.pageX, pageY: e.pageY };
				if (!touches[e.pointerId].target) {
					touches[e.pointerId].target = e.currentTarget;
				}	
			}],
			[document, "PointerUp", "touchend", "onDocumentTouchEnd", function (e) {
				delete touches[e.pointerId];
			}]
		];
		
		each(eventmap, function (eventConfig) {
			addEvent(eventConfig[0], window.PointerEvent ? eventConfig[1].toLowerCase() : "MS" + eventConfig[1], function (e) {
				e = e.originalEvent;
				if (e.pointerType === "touch" || e.pointerType === e.MSPOINTER_TYPE_TOUCH) {
					eventConfig[4](e);
					
					// This event corresponds to ontouchstart - call onContainerTouchStart
					pointer[eventConfig[3]]({
						type: eventConfig[2],
						target: e.currentTarget,
						preventDefault: noop,
						touches: pointer.getWebkitTouches()
					});
				}
			});
		});
	   
	});
}	 
/**
 * The overview of the chart's series
 */
var Legend = Highcharts.Legend = function (chart, options) {
	this.init(chart, options);
};

Legend.prototype = {
	
	/**
	 * Initialize the legend
	 */
	init: function (chart, options) {
		
		var legend = this,
			itemStyle = options.itemStyle,
			padding = pick(options.padding, 8),
			itemMarginTop = options.itemMarginTop || 0;
	
		this.options = options;

		if (!options.enabled) {
			return;
		}
	
		legend.baseline = pInt(itemStyle.fontSize) + 3 + itemMarginTop; // used in Series prototype
		legend.itemStyle = itemStyle;
		legend.itemHiddenStyle = merge(itemStyle, options.itemHiddenStyle);
		legend.itemMarginTop = itemMarginTop;
		legend.padding = padding;
		legend.initialItemX = padding;
		legend.initialItemY = padding - 5; // 5 is the number of pixels above the text
		legend.maxItemWidth = 0;
		legend.chart = chart;
		legend.itemHeight = 0;
		legend.lastLineHeight = 0;
		legend.symbolWidth = pick(options.symbolWidth, 16);
		legend.pages = [];


		// Render it
		legend.render();

		// move checkboxes
		addEvent(legend.chart, 'endResize', function () { 
			legend.positionCheckboxes();
		});

	},

	/**
	 * Set the colors for the legend item
	 * @param {Object} item A Series or Point instance
	 * @param {Object} visible Dimmed or colored
	 */
	colorizeItem: function (item, visible) {
		var legend = this,
			options = legend.options,
			legendItem = item.legendItem,
			legendLine = item.legendLine,
			legendSymbol = item.legendSymbol,
			hiddenColor = legend.itemHiddenStyle.color,
			textColor = visible ? options.itemStyle.color : hiddenColor,
			symbolColor = visible ? (item.legendColor || item.color) : hiddenColor,
			markerOptions = item.options && item.options.marker,
			symbolAttr = {
				stroke: symbolColor,
				fill: symbolColor
			},
			key,
			val;
		
		if (legendItem) {
			legendItem.css({ fill: textColor, color: textColor }); // color for #1553, oldIE
		}
		if (legendLine) {
			legendLine.attr({ stroke: symbolColor });
		}
		
		if (legendSymbol) {
			
			// Apply marker options
			if (markerOptions && legendSymbol.isMarker) { // #585
				markerOptions = item.convertAttribs(markerOptions);
				for (key in markerOptions) {
					val = markerOptions[key];
					if (val !== UNDEFINED) {
						symbolAttr[key] = val;
					}
				}
			}

			legendSymbol.attr(symbolAttr);
		}
	},

	/**
	 * Position the legend item
	 * @param {Object} item A Series or Point instance
	 */
	positionItem: function (item) {
		var legend = this,
			options = legend.options,
			symbolPadding = options.symbolPadding,
			ltr = !options.rtl,
			legendItemPos = item._legendItemPos,
			itemX = legendItemPos[0],
			itemY = legendItemPos[1],
			checkbox = item.checkbox;

		if (item.legendGroup) {
			item.legendGroup.translate(
				ltr ? itemX : legend.legendWidth - itemX - 2 * symbolPadding - 4,
				itemY
			);
		}

		if (checkbox) {
			checkbox.x = itemX;
			checkbox.y = itemY;
		}
	},

	/**
	 * Destroy a single legend item
	 * @param {Object} item The series or point
	 */
	destroyItem: function (item) {
		var checkbox = item.checkbox;

		// destroy SVG elements
		each(['legendItem', 'legendLine', 'legendSymbol', 'legendGroup'], function (key) {
			if (item[key]) {
				item[key] = item[key].destroy();
			}
		});

		if (checkbox) {
			discardElement(item.checkbox);
		}
	},

	/**
	 * Destroys the legend.
	 */
	destroy: function () {
		var legend = this,
			legendGroup = legend.group,
			box = legend.box;

		if (box) {
			legend.box = box.destroy();
		}

		if (legendGroup) {
			legend.group = legendGroup.destroy();
		}
	},

	/**
	 * Position the checkboxes after the width is determined
	 */
	positionCheckboxes: function (scrollOffset) {
		var alignAttr = this.group.alignAttr,
			translateY,
			clipHeight = this.clipHeight || this.legendHeight;

		if (alignAttr) {
			translateY = alignAttr.translateY;
			each(this.allItems, function (item) {
				var checkbox = item.checkbox,
					top;
				
				if (checkbox) {
					top = (translateY + checkbox.y + (scrollOffset || 0) + 3);
					css(checkbox, {
						left: (alignAttr.translateX + item.legendItemWidth + checkbox.x - 20) + PX,
						top: top + PX,
						display: top > translateY - 6 && top < translateY + clipHeight - 6 ? '' : NONE
					});
				}
			});
		}
	},
	
	/**
	 * Render the legend title on top of the legend
	 */
	renderTitle: function () {
		var options = this.options,
			padding = this.padding,
			titleOptions = options.title,
			titleHeight = 0,
			bBox;
		
		if (titleOptions.text) {
			if (!this.title) {
				this.title = this.chart.renderer.label(titleOptions.text, padding - 3, padding - 4, null, null, null, null, null, 'legend-title')
					.attr({ zIndex: 1 })
					.css(titleOptions.style)
					.add(this.group);
			}
			bBox = this.title.getBBox();
			titleHeight = bBox.height;
			this.offsetWidth = bBox.width; // #1717
			this.contentGroup.attr({ translateY: titleHeight });
		}
		this.titleHeight = titleHeight;
	},

	/**
	 * Render a single specific legend item
	 * @param {Object} item A series or point
	 */
	renderItem: function (item) {
		var legend = this,
			chart = legend.chart,
			renderer = chart.renderer,
			options = legend.options,
			horizontal = options.layout === 'horizontal',
			symbolWidth = legend.symbolWidth,
			symbolPadding = options.symbolPadding,
			itemStyle = legend.itemStyle,
			itemHiddenStyle = legend.itemHiddenStyle,
			padding = legend.padding,
			itemDistance = horizontal ? pick(options.itemDistance, 8) : 0,
			ltr = !options.rtl,
			itemHeight,
			widthOption = options.width,
			itemMarginBottom = options.itemMarginBottom || 0,
			itemMarginTop = legend.itemMarginTop,
			initialItemX = legend.initialItemX,
			bBox,
			itemWidth,
			li = item.legendItem,
			series = item.series && item.series.drawLegendSymbol ? item.series : item,
			seriesOptions = series.options,
			showCheckbox = seriesOptions && seriesOptions.showCheckbox,
			useHTML = options.useHTML;

		if (!li) { // generate it once, later move it

			// Generate the group box
			// A group to hold the symbol and text. Text is to be appended in Legend class.
			item.legendGroup = renderer.g('legend-item')
				.attr({ zIndex: 1 })
				.add(legend.scrollGroup);

			// Draw the legend symbol inside the group box
			series.drawLegendSymbol(legend, item);

			// Generate the list item text and add it to the group
			item.legendItem = li = renderer.text(
					options.labelFormat ? format(options.labelFormat, item) : options.labelFormatter.call(item),
					ltr ? symbolWidth + symbolPadding : -symbolPadding,
					legend.baseline,
					useHTML
				)
				.css(merge(item.visible ? itemStyle : itemHiddenStyle)) // merge to prevent modifying original (#1021)
				.attr({
					align: ltr ? 'left' : 'right',
					zIndex: 2
				})
				.add(item.legendGroup);

			// Set the events on the item group, or in case of useHTML, the item itself (#1249)
			(useHTML ? li : item.legendGroup).on('mouseover', function () {
					item.setState(HOVER_STATE);
					li.css(legend.options.itemHoverStyle);
				})
				.on('mouseout', function () {
					li.css(item.visible ? itemStyle : itemHiddenStyle);
					item.setState();
				})
				.on('click', function (event) {
					var strLegendItemClick = 'legendItemClick',
						fnLegendItemClick = function () {
							item.setVisible();
						};
						
					// Pass over the click/touch event. #4.
					event = {
						browserEvent: event
					};

					// click the name or symbol
					if (item.firePointEvent) { // point
						item.firePointEvent(strLegendItemClick, event, fnLegendItemClick);
					} else {
						fireEvent(item, strLegendItemClick, event, fnLegendItemClick);
					}
				});

			// Colorize the items
			legend.colorizeItem(item, item.visible);

			// add the HTML checkbox on top
			if (showCheckbox) {
				item.checkbox = createElement('input', {
					type: 'checkbox',
					checked: item.selected,
					defaultChecked: item.selected // required by IE7
				}, options.itemCheckboxStyle, chart.container);

				addEvent(item.checkbox, 'click', function (event) {
					var target = event.target;
					fireEvent(item, 'checkboxClick', {
							checked: target.checked
						},
						function () {
							item.select();
						}
					);
				});
			}
		}

		// calculate the positions for the next line
		bBox = li.getBBox();

		itemWidth = item.legendItemWidth = 
			options.itemWidth || item.legendItemWidth || symbolWidth + symbolPadding + bBox.width + itemDistance +
			(showCheckbox ? 20 : 0);
		legend.itemHeight = itemHeight = mathRound(item.legendItemHeight || bBox.height);

		// if the item exceeds the width, start a new line
		if (horizontal && legend.itemX - initialItemX + itemWidth >
				(widthOption || (chart.chartWidth - 2 * padding - initialItemX))) {
			legend.itemX = initialItemX;
			legend.itemY += itemMarginTop + legend.lastLineHeight + itemMarginBottom;
			legend.lastLineHeight = 0; // reset for next line
		}

		// If the item exceeds the height, start a new column
		/*if (!horizontal && legend.itemY + options.y + itemHeight > chart.chartHeight - spacingTop - spacingBottom) {
			legend.itemY = legend.initialItemY;
			legend.itemX += legend.maxItemWidth;
			legend.maxItemWidth = 0;
		}*/

		// Set the edge positions
		legend.maxItemWidth = mathMax(legend.maxItemWidth, itemWidth);
		legend.lastItemY = itemMarginTop + legend.itemY + itemMarginBottom;
		legend.lastLineHeight = mathMax(itemHeight, legend.lastLineHeight); // #915

		// cache the position of the newly generated or reordered items
		item._legendItemPos = [legend.itemX, legend.itemY];

		// advance
		if (horizontal) {
			legend.itemX += itemWidth;

		} else {
			legend.itemY += itemMarginTop + itemHeight + itemMarginBottom;
			legend.lastLineHeight = itemHeight;
		}

		// the width of the widest item
		legend.offsetWidth = widthOption || mathMax(
			(horizontal ? legend.itemX - initialItemX - itemDistance : itemWidth) + padding,
			legend.offsetWidth
		);
	},

	/**
	 * Get all items, which is one item per series for normal series and one item per point
	 * for pie series.
	 */
	getAllItems: function () {
		var allItems = [];
		each(this.chart.series, function (series) {
			var seriesOptions = series.options;

			// Handle showInLegend. If the series is linked to another series, defaults to false.
			if (!pick(seriesOptions.showInLegend, !defined(seriesOptions.linkedTo) ? UNDEFINED : false, true)) {
				return;
			}

			// use points or series for the legend item depending on legendType
			allItems = allItems.concat(
					series.legendItems ||
					(seriesOptions.legendType === 'point' ?
							series.data :
							series)
			);
		});
		return allItems;
	},

	/**
	 * Render the legend. This method can be called both before and after
	 * chart.render. If called after, it will only rearrange items instead
	 * of creating new ones.
	 */
	render: function () {
		var legend = this,
			chart = legend.chart,
			renderer = chart.renderer,
			legendGroup = legend.group,
			allItems,
			display,
			legendWidth,
			legendHeight,
			box = legend.box,
			options = legend.options,
			padding = legend.padding,
			legendBorderWidth = options.borderWidth,
			legendBackgroundColor = options.backgroundColor;

		legend.itemX = legend.initialItemX;
		legend.itemY = legend.initialItemY;
		legend.offsetWidth = 0;
		legend.lastItemY = 0;

		if (!legendGroup) {
			legend.group = legendGroup = renderer.g('legend')
				.attr({ zIndex: 7 }) 
				.add();
			legend.contentGroup = renderer.g()
				.attr({ zIndex: 1 }) // above background
				.add(legendGroup);
			legend.scrollGroup = renderer.g()
				.add(legend.contentGroup);
		}
		
		legend.renderTitle();

		// add each series or point
		allItems = legend.getAllItems();

		// sort by legendIndex
		stableSort(allItems, function (a, b) {
			return ((a.options && a.options.legendIndex) || 0) - ((b.options && b.options.legendIndex) || 0);
		});

		// reversed legend
		if (options.reversed) {
			allItems.reverse();
		}

		legend.allItems = allItems;
		legend.display = display = !!allItems.length;

		// render the items
		each(allItems, function (item) {
			legend.renderItem(item); 
		});

		// Draw the border
		legendWidth = options.width || legend.offsetWidth;
		legendHeight = legend.lastItemY + legend.lastLineHeight + legend.titleHeight;
		
		
		legendHeight = legend.handleOverflow(legendHeight);

		if (legendBorderWidth || legendBackgroundColor) {
			legendWidth += padding;
			legendHeight += padding;

			if (!box) {
				legend.box = box = renderer.rect(
					0,
					0,
					legendWidth,
					legendHeight,
					options.borderRadius,
					legendBorderWidth || 0
				).attr({
					stroke: options.borderColor,
					'stroke-width': legendBorderWidth || 0,
					fill: legendBackgroundColor || NONE
				})
				.add(legendGroup)
				.shadow(options.shadow);
				box.isNew = true;

			} else if (legendWidth > 0 && legendHeight > 0) {
				box[box.isNew ? 'attr' : 'animate'](
					box.crisp(null, null, null, legendWidth, legendHeight)
				);
				box.isNew = false;
			}

			// hide the border if no items
			box[display ? 'show' : 'hide']();
		}
		
		legend.legendWidth = legendWidth;
		legend.legendHeight = legendHeight;

		// Now that the legend width and height are established, put the items in the 
		// final position
		each(allItems, function (item) {
			legend.positionItem(item);
		});

		// 1.x compatibility: positioning based on style
		/*var props = ['left', 'right', 'top', 'bottom'],
			prop,
			i = 4;
		while (i--) {
			prop = props[i];
			if (options.style[prop] && options.style[prop] !== 'auto') {
				options[i < 2 ? 'align' : 'verticalAlign'] = prop;
				options[i < 2 ? 'x' : 'y'] = pInt(options.style[prop]) * (i % 2 ? -1 : 1);
			}
		}*/

		if (display) {
			legendGroup.align(extend({
				width: legendWidth,
				height: legendHeight
			}, options), true, 'spacingBox');
		}

		if (!chart.isResizing) {
			this.positionCheckboxes();
		}
	},
	
	/**
	 * Set up the overflow handling by adding navigation with up and down arrows below the
	 * legend.
	 */
	handleOverflow: function (legendHeight) {
		var legend = this,
			chart = this.chart,
			renderer = chart.renderer,
			options = this.options,
			optionsY = options.y,
			alignTop = options.verticalAlign === 'top',
			spaceHeight = chart.spacingBox.height + (alignTop ? -optionsY : optionsY) - this.padding,
			maxHeight = options.maxHeight,
			clipHeight,
			clipRect = this.clipRect,
			navOptions = options.navigation,
			animation = pick(navOptions.animation, true),
			arrowSize = navOptions.arrowSize || 12,
			nav = this.nav,
			pages = this.pages,
			lastY,
			allItems = this.allItems;
			
		// Adjust the height
		if (options.layout === 'horizontal') {
			spaceHeight /= 2;
		}
		if (maxHeight) {
			spaceHeight = mathMin(spaceHeight, maxHeight);
		}
		
		// Reset the legend height and adjust the clipping rectangle
		pages.length = 0;
		if (legendHeight > spaceHeight && !options.useHTML) {

			this.clipHeight = clipHeight = spaceHeight - 20 - this.titleHeight - this.padding;
			this.currentPage = pick(this.currentPage, 1);
			this.fullHeight = legendHeight;
			
			// Fill pages with Y positions so that the top of each a legend item defines
			// the scroll top for each page (#2098)
			each(allItems, function (item, i) {
				var y = item._legendItemPos[1],
					h = mathRound(item.legendItem.bBox.height),
					len = pages.length;
				
				if (!len || (y - pages[len - 1] > clipHeight)) {
					pages.push(lastY || y);
				}
				
				if (i === allItems.length - 1 && y + h - pages[len - 1] > clipHeight) {
					pages.push(y);
				}
				if (y !== lastY) {
					lastY = y;
				}
			});

			// Only apply clipping if needed. Clipping causes blurred legend in PDF export (#1787)
			if (!clipRect) {
				clipRect = legend.clipRect = renderer.clipRect(0, this.padding, 9999, 0);
				legend.contentGroup.clip(clipRect);
			}
			clipRect.attr({
				height: clipHeight
			});
			
			// Add navigation elements
			if (!nav) {
				this.nav = nav = renderer.g().attr({ zIndex: 1 }).add(this.group);
				this.up = renderer.symbol('triangle', 0, 0, arrowSize, arrowSize)
					.on('click', function () {
						legend.scroll(-1, animation);
					})
					.add(nav);
				this.pager = renderer.text('', 15, 10)
					.css(navOptions.style)
					.add(nav);
				this.down = renderer.symbol('triangle-down', 0, 0, arrowSize, arrowSize)
					.on('click', function () {
						legend.scroll(1, animation);
					})
					.add(nav);
			}
			
			// Set initial position
			legend.scroll(0);
			
			legendHeight = spaceHeight;
			
		} else if (nav) {
			clipRect.attr({
				height: chart.chartHeight
			});
			nav.hide();
			this.scrollGroup.attr({
				translateY: 1
			});
			this.clipHeight = 0; // #1379
		}
		
		return legendHeight;
	},
	
	/**
	 * Scroll the legend by a number of pages
	 * @param {Object} scrollBy
	 * @param {Object} animation
	 */
	scroll: function (scrollBy, animation) {
		var pages = this.pages,
			pageCount = pages.length,
			currentPage = this.currentPage + scrollBy,
			clipHeight = this.clipHeight,
			navOptions = this.options.navigation,
			activeColor = navOptions.activeColor,
			inactiveColor = navOptions.inactiveColor,
			pager = this.pager,
			padding = this.padding,
			scrollOffset;
		
		// When resizing while looking at the last page
		if (currentPage > pageCount) {
			currentPage = pageCount;
		}
		
		if (currentPage > 0) {
			
			if (animation !== UNDEFINED) {
				setAnimation(animation, this.chart);
			}
			
			this.nav.attr({
				translateX: padding,
				translateY: clipHeight + this.padding + 7 + this.titleHeight,
				visibility: VISIBLE
			});
			this.up.attr({
					fill: currentPage === 1 ? inactiveColor : activeColor
				})
				.css({
					cursor: currentPage === 1 ? 'default' : 'pointer'
				});
			pager.attr({
				text: currentPage + '/' + pageCount
			});
			this.down.attr({
					x: 18 + this.pager.getBBox().width, // adjust to text width
					fill: currentPage === pageCount ? inactiveColor : activeColor
				})
				.css({
					cursor: currentPage === pageCount ? 'default' : 'pointer'
				});
			
			scrollOffset = -pages[currentPage - 1] + this.initialItemY;

			this.scrollGroup.animate({
				translateY: scrollOffset
			});			
			
			this.currentPage = currentPage;
			this.positionCheckboxes(scrollOffset);
		}
			
	}
	
};

/*
 * LegendSymbolMixin
 */ 

var LegendSymbolMixin = Highcharts.LegendSymbolMixin = {

	/**
	 * Get the series' symbol in the legend
	 * 
	 * @param {Object} legend The legend object
	 * @param {Object} item The series (this) or point
	 */
	drawRectangle: function (legend, item) {
		var symbolHeight = legend.options.symbolHeight || 12;
		
		item.legendSymbol = this.chart.renderer.rect(
			0,
			legend.baseline - 5 - (symbolHeight / 2),
			legend.symbolWidth,
			symbolHeight,
			pick(legend.options.symbolRadius, 2)
		).attr({
			zIndex: 3
		}).add(item.legendGroup);		
		
	},

	/**
	 * Get the series' symbol in the legend. This method should be overridable to create custom 
	 * symbols through Highcharts.seriesTypes[type].prototype.drawLegendSymbols.
	 * 
	 * @param {Object} legend The legend object
	 */
	drawLineMarker: function (legend) {

		var options = this.options,
			markerOptions = options.marker,
			radius,
			legendOptions = legend.options,
			legendSymbol,
			symbolWidth = legend.symbolWidth,
			renderer = this.chart.renderer,
			legendItemGroup = this.legendGroup,
			verticalCenter = legend.baseline - mathRound(renderer.fontMetrics(legendOptions.itemStyle.fontSize).b * 0.3),
			attr;
			
		// Draw the line
		if (options.lineWidth) {
			attr = {
				'stroke-width': options.lineWidth
			};
			if (options.dashStyle) {
				attr.dashstyle = options.dashStyle;
			}
			this.legendLine = renderer.path([
				M,
				0,
				verticalCenter,
				L,
				symbolWidth,
				verticalCenter
			])
			.attr(attr)
			.add(legendItemGroup);
		}
		
		// Draw the marker
		if (markerOptions && markerOptions.enabled) {
			radius = markerOptions.radius;
			this.legendSymbol = legendSymbol = renderer.symbol(
				this.symbol,
				(symbolWidth / 2) - radius,
				verticalCenter - radius,
				2 * radius,
				2 * radius
			)
			.add(legendItemGroup);
			legendSymbol.isMarker = true;
		}
	}
};

// Workaround for #2030, horizontal legend items not displaying in IE11 Preview.
// TODO: When IE11 is released, check again for this bug, and remove the fix
// or make a better one.
if (/Trident\/7\.0/.test(userAgent)) {
	wrap(Legend.prototype, 'positionItem', function (proceed, item) {
		var legend = this,
			runPositionItem = function () { // If chart destroyed in sync, this is undefined (#2030)
				if (item._legendItemPos) {
					proceed.call(legend, item);
				}
			};

		if (legend.chart.renderer.forExport) {
			runPositionItem();
		} else {
			setTimeout(runPositionItem);
		}
	});
}
/**
 * The chart class
 * @param {Object} options
 * @param {Function} callback Function to run when the chart has loaded
 */
function Chart() {
	this.init.apply(this, arguments);
}

Chart.prototype = {

	/**
	 * Initialize the chart
	 */
	init: function (userOptions, callback) {

		// Handle regular options
		var options,
			seriesOptions = userOptions.series; // skip merging data points to increase performance

		userOptions.series = null;
		options = merge(defaultOptions, userOptions); // do the merge
		options.series = userOptions.series = seriesOptions; // set back the series data
		this.userOptions = userOptions;

		var optionsChart = options.chart;
		
		// Create margin & spacing array
		this.margin = this.splashArray('margin', optionsChart);
		this.spacing = this.splashArray('spacing', optionsChart);

		var chartEvents = optionsChart.events;

		//this.runChartClick = chartEvents && !!chartEvents.click;
		this.bounds = { h: {}, v: {} }; // Pixel data bounds for touch zoom

		this.callback = callback;
		this.isResizing = 0;
		this.options = options;
		//chartTitleOptions = UNDEFINED;
		//chartSubtitleOptions = UNDEFINED;

		this.axes = [];
		this.series = [];
		this.hasCartesianSeries = optionsChart.showAxes;
		//this.axisOffset = UNDEFINED;
		//this.maxTicks = UNDEFINED; // handle the greatest amount of ticks on grouped axes
		//this.inverted = UNDEFINED;
		//this.loadingShown = UNDEFINED;
		//this.container = UNDEFINED;
		//this.chartWidth = UNDEFINED;
		//this.chartHeight = UNDEFINED;
		//this.marginRight = UNDEFINED;
		//this.marginBottom = UNDEFINED;
		//this.containerWidth = UNDEFINED;
		//this.containerHeight = UNDEFINED;
		//this.oldChartWidth = UNDEFINED;
		//this.oldChartHeight = UNDEFINED;

		//this.renderTo = UNDEFINED;
		//this.renderToClone = UNDEFINED;

		//this.spacingBox = UNDEFINED

		//this.legend = UNDEFINED;

		// Elements
		//this.chartBackground = UNDEFINED;
		//this.plotBackground = UNDEFINED;
		//this.plotBGImage = UNDEFINED;
		//this.plotBorder = UNDEFINED;
		//this.loadingDiv = UNDEFINED;
		//this.loadingSpan = UNDEFINED;

		var chart = this,
			eventType;

		// Add the chart to the global lookup
		chart.index = charts.length;
		charts.push(chart);

		// Set up auto resize
		if (optionsChart.reflow !== false) {
			addEvent(chart, 'load', function () {
				chart.initReflow();
			});
		}

		// Chart event handlers
		if (chartEvents) {
			for (eventType in chartEvents) {
				addEvent(chart, eventType, chartEvents[eventType]);
			}
		}

		chart.xAxis = [];
		chart.yAxis = [];

		// Expose methods and variables
		chart.animation = useCanVG ? false : pick(optionsChart.animation, true);
		chart.pointCount = 0;
		chart.counters = new ChartCounters();

		chart.firstRender();
	},

	/**
	 * Initialize an individual series, called internally before render time
	 */
	initSeries: function (options) {
		var chart = this,
			optionsChart = chart.options.chart,
			type = options.type || optionsChart.type || optionsChart.defaultSeriesType,
			series,
			constr = seriesTypes[type];

		// No such series type
		if (!constr) {
			error(17, true);
		}

		series = new constr();
		series.init(this, options);
		return series;
	},

	/**
	 * Check whether a given point is within the plot area
	 *
	 * @param {Number} plotX Pixel x relative to the plot area
	 * @param {Number} plotY Pixel y relative to the plot area
	 * @param {Boolean} inverted Whether the chart is inverted
	 */
	isInsidePlot: function (plotX, plotY, inverted) {
		var x = inverted ? plotY : plotX,
			y = inverted ? plotX : plotY;
			
		return x >= 0 &&
			x <= this.plotWidth &&
			y >= 0 &&
			y <= this.plotHeight;
	},

	/**
	 * Adjust all axes tick amounts
	 */
	adjustTickAmounts: function () {
		if (this.options.chart.alignTicks !== false) {
			each(this.axes, function (axis) {
				axis.adjustTickAmount();
			});
		}
		this.maxTicks = null;
	},

	/**
	 * Redraw legend, axes or series based on updated data
	 *
	 * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
	 *    configuration
	 */
	redraw: function (animation) {
		var chart = this,
			axes = chart.axes,
			series = chart.series,
			pointer = chart.pointer,
			legend = chart.legend,
			redrawLegend = chart.isDirtyLegend,
			hasStackedSeries,
			hasDirtyStacks,
			isDirtyBox = chart.isDirtyBox, // todo: check if it has actually changed?
			seriesLength = series.length,
			i = seriesLength,
			serie,
			renderer = chart.renderer,
			isHiddenChart = renderer.isHidden(),
			afterRedraw = [];
			
		setAnimation(animation, chart);
		
		if (isHiddenChart) {
			chart.cloneRenderTo();
		}

		// Adjust title layout (reflow multiline text)
		chart.layOutTitles();

		// link stacked series
		while (i--) {
			serie = series[i];

			if (serie.options.stacking) {
				hasStackedSeries = true;
				
				if (serie.isDirty) {
					hasDirtyStacks = true;
					break;
				}
			}
		}
		if (hasDirtyStacks) { // mark others as dirty
			i = seriesLength;
			while (i--) {
				serie = series[i];
				if (serie.options.stacking) {
					serie.isDirty = true;
				}
			}
		}

		// handle updated data in the series
		each(series, function (serie) {
			if (serie.isDirty) { // prepare the data so axis can read it
				if (serie.options.legendType === 'point') {
					redrawLegend = true;
				}
			}
		});

		// handle added or removed series
		if (redrawLegend && legend.options.enabled) { // series or pie points are added or removed
			// draw legend graphics
			legend.render();

			chart.isDirtyLegend = false;
		}

		// reset stacks
		if (hasStackedSeries) {
			chart.getStacks();
		}


		if (chart.hasCartesianSeries) {
			if (!chart.isResizing) {

				// reset maxTicks
				chart.maxTicks = null;

				// set axes scales
				each(axes, function (axis) {
					axis.setScale();
				});
			}

			chart.adjustTickAmounts();
			chart.getMargins();

			// If one axis is dirty, all axes must be redrawn (#792, #2169)
			each(axes, function (axis) {
				if (axis.isDirty) {
					isDirtyBox = true;
				}
			});

			// redraw axes
			each(axes, function (axis) {
				
				// Fire 'afterSetExtremes' only if extremes are set
				if (axis.isDirtyExtremes) { // #821
					axis.isDirtyExtremes = false;
					afterRedraw.push(function () { // prevent a recursive call to chart.redraw() (#1119)
						fireEvent(axis, 'afterSetExtremes', extend(axis.eventArgs, axis.getExtremes())); // #747, #751
						delete axis.eventArgs;
					});
				}
				
				if (isDirtyBox || hasStackedSeries) {
					axis.redraw();
				}
			});


		}
		// the plot areas size has changed
		if (isDirtyBox) {
			chart.drawChartBox();
		}


		// redraw affected series
		each(series, function (serie) {
			if (serie.isDirty && serie.visible &&
					(!serie.isCartesian || serie.xAxis)) { // issue #153
				serie.redraw();
			}
		});

		// move tooltip or reset
		if (pointer && pointer.reset) {
			pointer.reset(true);
		}

		// redraw if canvas
		renderer.draw();

		// fire the event
		fireEvent(chart, 'redraw'); // jQuery breaks this when calling it from addEvent. Overwrites chart.redraw
		
		if (isHiddenChart) {
			chart.cloneRenderTo(true);
		}
		
		// Fire callbacks that are put on hold until after the redraw
		each(afterRedraw, function (callback) {
			callback.call();
		});
	},

	/**
	 * Get an axis, series or point object by id.
	 * @param id {String} The id as given in the configuration options
	 */
	get: function (id) {
		var chart = this,
			axes = chart.axes,
			series = chart.series;

		var i,
			j,
			points;

		// search axes
		for (i = 0; i < axes.length; i++) {
			if (axes[i].options.id === id) {
				return axes[i];
			}
		}

		// search series
		for (i = 0; i < series.length; i++) {
			if (series[i].options.id === id) {
				return series[i];
			}
		}

		// search points
		for (i = 0; i < series.length; i++) {
			points = series[i].points || [];
			for (j = 0; j < points.length; j++) {
				if (points[j].id === id) {
					return points[j];
				}
			}
		}
		return null;
	},

	/**
	 * Create the Axis instances based on the config options
	 */
	getAxes: function () {
		var chart = this,
			options = this.options,
			xAxisOptions = options.xAxis = splat(options.xAxis || {}),
			yAxisOptions = options.yAxis = splat(options.yAxis || {}),
			optionsArray,
			axis;

		// make sure the options are arrays and add some members
		each(xAxisOptions, function (axis, i) {
			axis.index = i;
			axis.isX = true;
		});

		each(yAxisOptions, function (axis, i) {
			axis.index = i;
		});

		// concatenate all axis options into one array
		optionsArray = xAxisOptions.concat(yAxisOptions);

		each(optionsArray, function (axisOptions) {
			axis = new Axis(chart, axisOptions);
		});

		chart.adjustTickAmounts();
	},


	/**
	 * Get the currently selected points from all series
	 */
	getSelectedPoints: function () {
		var points = [];
		each(this.series, function (serie) {
			points = points.concat(grep(serie.points || [], function (point) {
				return point.selected;
			}));
		});
		return points;
	},

	/**
	 * Get the currently selected series
	 */
	getSelectedSeries: function () {
		return grep(this.series, function (serie) {
			return serie.selected;
		});
	},

	/**
	 * Generate stacks for each series and calculate stacks total values
	 */
	getStacks: function () {
		var chart = this;

		// reset stacks for each yAxis
		each(chart.yAxis, function (axis) {
			if (axis.stacks && axis.hasVisibleSeries) {
				axis.oldStacks = axis.stacks;
			}
		});

		each(chart.series, function (series) {
			if (series.options.stacking && (series.visible === true || chart.options.chart.ignoreHiddenSeries === false)) {
				series.stackKey = series.type + pick(series.options.stack, '');
			}
		});
	},

	/**
	 * Display the zoom button
	 */
	showResetZoom: function () {
		var chart = this,
			lang = defaultOptions.lang,
			btnOptions = chart.options.chart.resetZoomButton,
			theme = btnOptions.theme,
			states = theme.states,
			alignTo = btnOptions.relativeTo === 'chart' ? null : 'plotBox';
			
		this.resetZoomButton = chart.renderer.button(lang.resetZoom, null, null, function () { chart.zoomOut(); }, theme, states && states.hover)
			.attr({
				align: btnOptions.position.align,
				title: lang.resetZoomTitle
			})
			.add()
			.align(btnOptions.position, false, alignTo);
			
	},

	/**
	 * Zoom out to 1:1
	 */
	zoomOut: function () {
		var chart = this;
		fireEvent(chart, 'selection', { resetSelection: true }, function () { 
			chart.zoom();
		});
	},

	/**
	 * Zoom into a given portion of the chart given by axis coordinates
	 * @param {Object} event
	 */
	zoom: function (event) {
		var chart = this,
			hasZoomed,
			pointer = chart.pointer,
			displayButton = false,
			resetZoomButton;

		// If zoom is called with no arguments, reset the axes
		if (!event || event.resetSelection) {
			each(chart.axes, function (axis) {
				hasZoomed = axis.zoom();
			});
		} else { // else, zoom in on all axes
			each(event.xAxis.concat(event.yAxis), function (axisData) {
				var axis = axisData.axis,
					isXAxis = axis.isXAxis;

				// don't zoom more than minRange
				if (pointer[isXAxis ? 'zoomX' : 'zoomY'] || pointer[isXAxis ? 'pinchX' : 'pinchY']) {
					hasZoomed = axis.zoom(axisData.min, axisData.max);
					if (axis.displayBtn) {
						displayButton = true;
					}
				}
			});
		}
		
		// Show or hide the Reset zoom button
		resetZoomButton = chart.resetZoomButton;
		if (displayButton && !resetZoomButton) {
			chart.showResetZoom();
		} else if (!displayButton && isObject(resetZoomButton)) {
			chart.resetZoomButton = resetZoomButton.destroy();
		}
		

		// Redraw
		if (hasZoomed) {
			chart.redraw(
				pick(chart.options.chart.animation, event && event.animation, chart.pointCount < 100) // animation
			);
		}
	},

	/**
	 * Pan the chart by dragging the mouse across the pane. This function is called
	 * on mouse move, and the distance to pan is computed from chartX compared to
	 * the first chartX position in the dragging operation.
	 */
	pan: function (e, panning) {

		var chart = this,
			hoverPoints = chart.hoverPoints,
			doRedraw;

		// remove active points for shared tooltip
		if (hoverPoints) {
			each(hoverPoints, function (point) {
				point.setState();
			});
		}

		each(panning === 'xy' ? [1, 0] : [1], function (isX) { // xy is used in maps
			var mousePos = e[isX ? 'chartX' : 'chartY'],
				axis = chart[isX ? 'xAxis' : 'yAxis'][0],
				startPos = chart[isX ? 'mouseDownX' : 'mouseDownY'],
				halfPointRange = (axis.pointRange || 0) / 2,
				extremes = axis.getExtremes(),
				newMin = axis.toValue(startPos - mousePos, true) + halfPointRange,
				newMax = axis.toValue(startPos + chart[isX ? 'plotWidth' : 'plotHeight'] - mousePos, true) - halfPointRange;

			if (axis.series.length && newMin > mathMin(extremes.dataMin, extremes.min) && newMax < mathMax(extremes.dataMax, extremes.max)) {
				axis.setExtremes(newMin, newMax, false, false, { trigger: 'pan' });
				doRedraw = true;
			}

			chart[isX ? 'mouseDownX' : 'mouseDownY'] = mousePos; // set new reference for next run
		});

		if (doRedraw) {
			chart.redraw(false);
		}
		css(chart.container, { cursor: 'move' });
	},

	/**
	 * Show the title and subtitle of the chart
	 *
	 * @param titleOptions {Object} New title options
	 * @param subtitleOptions {Object} New subtitle options
	 *
	 */
	setTitle: function (titleOptions, subtitleOptions) {
		var chart = this,
			options = chart.options,
			chartTitleOptions,
			chartSubtitleOptions;

		chartTitleOptions = options.title = merge(options.title, titleOptions);
		chartSubtitleOptions = options.subtitle = merge(options.subtitle, subtitleOptions);

		// add title and subtitle
		each([
			['title', titleOptions, chartTitleOptions],
			['subtitle', subtitleOptions, chartSubtitleOptions]
		], function (arr) {
			var name = arr[0],
				title = chart[name],
				titleOptions = arr[1],
				chartTitleOptions = arr[2];

			if (title && titleOptions) {
				chart[name] = title = title.destroy(); // remove old
			}
			
			if (chartTitleOptions && chartTitleOptions.text && !title) {
				chart[name] = chart.renderer.text(
					chartTitleOptions.text,
					0,
					0,
					chartTitleOptions.useHTML
				)
				.attr({
					align: chartTitleOptions.align,
					'class': PREFIX + name,
					zIndex: chartTitleOptions.zIndex || 4
				})
				.css(chartTitleOptions.style)
				.add();
			}	
		});
		chart.layOutTitles();
	},

	/**
	 * Lay out the chart titles and cache the full offset height for use in getMargins
	 */
	layOutTitles: function () {
		var titleOffset = 0,
			title = this.title,
			subtitle = this.subtitle,
			options = this.options,
			titleOptions = options.title,
			subtitleOptions = options.subtitle,
			autoWidth = this.spacingBox.width - 44; // 44 makes room for default context button

		if (title) {
			title
				.css({ width: (titleOptions.width || autoWidth) + PX })
				.align(extend({ y: 15 }, titleOptions), false, 'spacingBox');
			
			if (!titleOptions.floating && !titleOptions.verticalAlign) {
				titleOffset = title.getBBox().height;

				// Adjust for browser consistency + backwards compat after #776 fix
				if (titleOffset >= 18 && titleOffset <= 25) {
					titleOffset = 15; 
				}
			}
		}
		if (subtitle) {
			subtitle
				.css({ width: (subtitleOptions.width || autoWidth) + PX })
				.align(extend({ y: titleOffset + titleOptions.margin }, subtitleOptions), false, 'spacingBox');
			
			if (!subtitleOptions.floating && !subtitleOptions.verticalAlign) {
				titleOffset = mathCeil(titleOffset + subtitle.getBBox().height);
			}
		}

		this.titleOffset = titleOffset; // used in getMargins
	},

	/**
	 * Get chart width and height according to options and container size
	 */
	getChartSize: function () {
		var chart = this,
			optionsChart = chart.options.chart,
			renderTo = chart.renderToClone || chart.renderTo;

		// get inner width and height from jQuery (#824)
		chart.containerWidth = adapterRun(renderTo, 'width');
		chart.containerHeight = adapterRun(renderTo, 'height');
		
		chart.chartWidth = mathMax(0, optionsChart.width || chart.containerWidth || 600); // #1393, 1460
		chart.chartHeight = mathMax(0, pick(optionsChart.height,
			// the offsetHeight of an empty container is 0 in standard browsers, but 19 in IE7:
			chart.containerHeight > 19 ? chart.containerHeight : 400));
	},

	/**
	 * Create a clone of the chart's renderTo div and place it outside the viewport to allow
	 * size computation on chart.render and chart.redraw
	 */
	cloneRenderTo: function (revert) {
		var clone = this.renderToClone,
			container = this.container;
		
		// Destroy the clone and bring the container back to the real renderTo div
		if (revert) {
			if (clone) {
				this.renderTo.appendChild(container);
				discardElement(clone);
				delete this.renderToClone;
			}
		
		// Set up the clone
		} else {
			if (container && container.parentNode === this.renderTo) {
				this.renderTo.removeChild(container); // do not clone this
			}
			this.renderToClone = clone = this.renderTo.cloneNode(0);
			css(clone, {
				position: ABSOLUTE,
				top: '-9999px',
				display: 'block' // #833
			});
			doc.body.appendChild(clone);
			if (container) {
				clone.appendChild(container);
			}
		}
	},

	/**
	 * Get the containing element, determine the size and create the inner container
	 * div to hold the chart
	 */
	getContainer: function () {
		var chart = this,
			container,
			optionsChart = chart.options.chart,
			chartWidth,
			chartHeight,
			renderTo,
			indexAttrName = 'data-highcharts-chart',
			oldChartIndex,
			containerId;

		chart.renderTo = renderTo = optionsChart.renderTo;
		containerId = PREFIX + idCounter++;

		if (isString(renderTo)) {
			chart.renderTo = renderTo = doc.getElementById(renderTo);
		}
		
		// Display an error if the renderTo is wrong
		if (!renderTo) {
			error(13, true);
		}
		
		// If the container already holds a chart, destroy it
		oldChartIndex = pInt(attr(renderTo, indexAttrName));
		if (!isNaN(oldChartIndex) && charts[oldChartIndex]) {
			charts[oldChartIndex].destroy();
		}		
		
		// Make a reference to the chart from the div
		attr(renderTo, indexAttrName, chart.index);

		// remove previous chart
		renderTo.innerHTML = '';

		// If the container doesn't have an offsetWidth, it has or is a child of a node
		// that has display:none. We need to temporarily move it out to a visible
		// state to determine the size, else the legend and tooltips won't render
		// properly
		if (!renderTo.offsetWidth) {
			chart.cloneRenderTo();
		}

		// get the width and height
		chart.getChartSize();
		chartWidth = chart.chartWidth;
		chartHeight = chart.chartHeight;

		// create the inner container
		chart.container = container = createElement(DIV, {
				className: PREFIX + 'container' +
					(optionsChart.className ? ' ' + optionsChart.className : ''),
				id: containerId
			}, extend({
				position: RELATIVE,
				overflow: HIDDEN, // needed for context menu (avoid scrollbars) and
					// content overflow in IE
				width: chartWidth + PX,
				height: chartHeight + PX,
				textAlign: 'left',
				lineHeight: 'normal', // #427
				zIndex: 0, // #1072
				'-webkit-tap-highlight-color': 'rgba(0,0,0,0)'
			}, optionsChart.style),
			chart.renderToClone || renderTo
		);

		// cache the cursor (#1650)
		chart._cursor = container.style.cursor;

		chart.renderer =
			optionsChart.forExport ? // force SVG, used for SVG export
				new SVGRenderer(container, chartWidth, chartHeight, true) :
				new Renderer(container, chartWidth, chartHeight);

		if (useCanVG) {
			// If we need canvg library, extend and configure the renderer
			// to get the tracker for translating mouse events
			chart.renderer.create(chart, container, chartWidth, chartHeight);
		}
	},

	/**
	 * Calculate margins by rendering axis labels in a preliminary position. Title,
	 * subtitle and legend have already been rendered at this stage, but will be
	 * moved into their final positions
	 */
	getMargins: function () {
		var chart = this,
			spacing = chart.spacing,
			axisOffset,
			legend = chart.legend,
			margin = chart.margin,
			legendOptions = chart.options.legend,
			legendMargin = pick(legendOptions.margin, 10),
			legendX = legendOptions.x,
			legendY = legendOptions.y,
			align = legendOptions.align,
			verticalAlign = legendOptions.verticalAlign,
			titleOffset = chart.titleOffset;

		chart.resetMargins();
		axisOffset = chart.axisOffset;

		// Adjust for title and subtitle
		if (titleOffset && !defined(margin[0])) {
			chart.plotTop = mathMax(chart.plotTop, titleOffset + chart.options.title.margin + spacing[0]);
		}
		
		// Adjust for legend
		if (legend.display && !legendOptions.floating) {
			if (align === 'right') { // horizontal alignment handled first
				if (!defined(margin[1])) {
					chart.marginRight = mathMax(
						chart.marginRight,
						legend.legendWidth - legendX + legendMargin + spacing[1]
					);
				}
			} else if (align === 'left') {
				if (!defined(margin[3])) {
					chart.plotLeft = mathMax(
						chart.plotLeft,
						legend.legendWidth + legendX + legendMargin + spacing[3]
					);
				}

			} else if (verticalAlign === 'top') {
				if (!defined(margin[0])) {
					chart.plotTop = mathMax(
						chart.plotTop,
						legend.legendHeight + legendY + legendMargin + spacing[0]
					);
				}

			} else if (verticalAlign === 'bottom') {
				if (!defined(margin[2])) {
					chart.marginBottom = mathMax(
						chart.marginBottom,
						legend.legendHeight - legendY + legendMargin + spacing[2]
					);
				}
			}
		}

		// adjust for scroller
		if (chart.extraBottomMargin) {
			chart.marginBottom += chart.extraBottomMargin;
		}
		if (chart.extraTopMargin) {
			chart.plotTop += chart.extraTopMargin;
		}

		// pre-render axes to get labels offset width
		if (chart.hasCartesianSeries) {
			each(chart.axes, function (axis) {
				axis.getOffset();
			});
		}
		
		if (!defined(margin[3])) {
			chart.plotLeft += axisOffset[3];
		}
		if (!defined(margin[0])) {
			chart.plotTop += axisOffset[0];
		}
		if (!defined(margin[2])) {
			chart.marginBottom += axisOffset[2];
		}
		if (!defined(margin[1])) {
			chart.marginRight += axisOffset[1];
		}

		chart.setChartSize();

	},

	/**
	 * Resize the chart to its container if size is not explicitly set
	 */
	reflow: function (e) {
		var chart = this,
			optionsChart = chart.options.chart,
			renderTo = chart.renderTo,
			width = optionsChart.width || adapterRun(renderTo, 'width'),
			height = optionsChart.height || adapterRun(renderTo, 'height'),
			target = e ? e.target : win, // #805 - MooTools doesn't supply e
			doReflow = function () {
				if (chart.container) { // It may have been destroyed in the meantime (#1257)
					chart.setSize(width, height, false);
					chart.hasUserSize = null;
				}
			};
			
		// Width and height checks for display:none. Target is doc in IE8 and Opera,
		// win in Firefox, Chrome and IE9.
		if (!chart.hasUserSize && width && height && (target === win || target === doc)) {
			
			if (width !== chart.containerWidth || height !== chart.containerHeight) {
				clearTimeout(chart.reflowTimeout);
				if (e) { // Called from window.resize
					chart.reflowTimeout = setTimeout(doReflow, 100);
				} else { // Called directly (#2224)
					doReflow();
				}
			}
			chart.containerWidth = width;
			chart.containerHeight = height;
		}
	},

	/**
	 * Add the event handlers necessary for auto resizing
	 */
	initReflow: function () {
		var chart = this,
			reflow = function (e) {
				chart.reflow(e);
			};
			
		
		addEvent(win, 'resize', reflow);
		addEvent(chart, 'destroy', function () {
			removeEvent(win, 'resize', reflow);
		});
	},

	/**
	 * Resize the chart to a given width and height
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Object|Boolean} animation
	 */
	setSize: function (width, height, animation) {
		var chart = this,
			chartWidth,
			chartHeight,
			fireEndResize;

		// Handle the isResizing counter
		chart.isResizing += 1;
		fireEndResize = function () {
			if (chart) {
				fireEvent(chart, 'endResize', null, function () {
					chart.isResizing -= 1;
				});
			}
		};

		// set the animation for the current process
		setAnimation(animation, chart);

		chart.oldChartHeight = chart.chartHeight;
		chart.oldChartWidth = chart.chartWidth;
		if (defined(width)) {
			chart.chartWidth = chartWidth = mathMax(0, mathRound(width));
			chart.hasUserSize = !!chartWidth;
		}
		if (defined(height)) {
			chart.chartHeight = chartHeight = mathMax(0, mathRound(height));
		}

		// Resize the container with the global animation applied if enabled (#2503)
		(globalAnimation ? animate : css)(chart.container, {
			width: chartWidth + PX,
			height: chartHeight + PX
		}, globalAnimation);

		chart.setChartSize(true);
		chart.renderer.setSize(chartWidth, chartHeight, animation);

		// handle axes
		chart.maxTicks = null;
		each(chart.axes, function (axis) {
			axis.isDirty = true;
			axis.setScale();
		});

		// make sure non-cartesian series are also handled
		each(chart.series, function (serie) {
			serie.isDirty = true;
		});

		chart.isDirtyLegend = true; // force legend redraw
		chart.isDirtyBox = true; // force redraw of plot and chart border

		chart.getMargins();

		chart.redraw(animation);


		chart.oldChartHeight = null;
		fireEvent(chart, 'resize');

		// fire endResize and set isResizing back
		// If animation is disabled, fire without delay
		if (globalAnimation === false) {
			fireEndResize();
		} else { // else set a timeout with the animation duration
			setTimeout(fireEndResize, (globalAnimation && globalAnimation.duration) || 500);
		}
	},

	/**
	 * Set the public chart properties. This is done before and after the pre-render
	 * to determine margin sizes
	 */
	setChartSize: function (skipAxes) {
		var chart = this,
			inverted = chart.inverted,
			renderer = chart.renderer,
			chartWidth = chart.chartWidth,
			chartHeight = chart.chartHeight,
			optionsChart = chart.options.chart,
			spacing = chart.spacing,
			clipOffset = chart.clipOffset,
			clipX,
			clipY,
			plotLeft,
			plotTop,
			plotWidth,
			plotHeight,
			plotBorderWidth;

		chart.plotLeft = plotLeft = mathRound(chart.plotLeft);
		chart.plotTop = plotTop = mathRound(chart.plotTop);
		chart.plotWidth = plotWidth = mathMax(0, mathRound(chartWidth - plotLeft - chart.marginRight));
		chart.plotHeight = plotHeight = mathMax(0, mathRound(chartHeight - plotTop - chart.marginBottom));

		chart.plotSizeX = inverted ? plotHeight : plotWidth;
		chart.plotSizeY = inverted ? plotWidth : plotHeight;
		
		chart.plotBorderWidth = optionsChart.plotBorderWidth || 0;

		// Set boxes used for alignment
		chart.spacingBox = renderer.spacingBox = {
			x: spacing[3],
			y: spacing[0],
			width: chartWidth - spacing[3] - spacing[1],
			height: chartHeight - spacing[0] - spacing[2]
		};
		chart.plotBox = renderer.plotBox = {
			x: plotLeft,
			y: plotTop,
			width: plotWidth,
			height: plotHeight
		};

		plotBorderWidth = 2 * mathFloor(chart.plotBorderWidth / 2);
		clipX = mathCeil(mathMax(plotBorderWidth, clipOffset[3]) / 2);
		clipY = mathCeil(mathMax(plotBorderWidth, clipOffset[0]) / 2);
		chart.clipBox = {
			x: clipX, 
			y: clipY, 
			width: mathFloor(chart.plotSizeX - mathMax(plotBorderWidth, clipOffset[1]) / 2 - clipX), 
			height: mathFloor(chart.plotSizeY - mathMax(plotBorderWidth, clipOffset[2]) / 2 - clipY)
		};

		if (!skipAxes) {
			each(chart.axes, function (axis) {
				axis.setAxisSize();
				axis.setAxisTranslation();
			});
		}
	},

	/**
	 * Initial margins before auto size margins are applied
	 */
	resetMargins: function () {
		var chart = this,
			spacing = chart.spacing,
			margin = chart.margin;

		chart.plotTop = pick(margin[0], spacing[0]);
		chart.marginRight = pick(margin[1], spacing[1]);
		chart.marginBottom = pick(margin[2], spacing[2]);
		chart.plotLeft = pick(margin[3], spacing[3]);
		chart.axisOffset = [0, 0, 0, 0]; // top, right, bottom, left
		chart.clipOffset = [0, 0, 0, 0];
	},

	/**
	 * Draw the borders and backgrounds for chart and plot area
	 */
	drawChartBox: function () {
		var chart = this,
			optionsChart = chart.options.chart,
			renderer = chart.renderer,
			chartWidth = chart.chartWidth,
			chartHeight = chart.chartHeight,
			chartBackground = chart.chartBackground,
			plotBackground = chart.plotBackground,
			plotBorder = chart.plotBorder,
			plotBGImage = chart.plotBGImage,
			chartBorderWidth = optionsChart.borderWidth || 0,
			chartBackgroundColor = optionsChart.backgroundColor,
			plotBackgroundColor = optionsChart.plotBackgroundColor,
			plotBackgroundImage = optionsChart.plotBackgroundImage,
			plotBorderWidth = optionsChart.plotBorderWidth || 0,
			mgn,
			bgAttr,
			plotLeft = chart.plotLeft,
			plotTop = chart.plotTop,
			plotWidth = chart.plotWidth,
			plotHeight = chart.plotHeight,
			plotBox = chart.plotBox,
			clipRect = chart.clipRect,
			clipBox = chart.clipBox;

		// Chart area
		mgn = chartBorderWidth + (optionsChart.shadow ? 8 : 0);

		if (chartBorderWidth || chartBackgroundColor) {
			if (!chartBackground) {
				
				bgAttr = {
					fill: chartBackgroundColor || NONE
				};
				if (chartBorderWidth) { // #980
					bgAttr.stroke = optionsChart.borderColor;
					bgAttr['stroke-width'] = chartBorderWidth;
				}
				chart.chartBackground = renderer.rect(mgn / 2, mgn / 2, chartWidth - mgn, chartHeight - mgn,
						optionsChart.borderRadius, chartBorderWidth)
					.attr(bgAttr)
					.add()
					.shadow(optionsChart.shadow);

			} else { // resize
				chartBackground.animate(
					chartBackground.crisp(null, null, null, chartWidth - mgn, chartHeight - mgn)
				);
			}
		}


		// Plot background
		if (plotBackgroundColor) {
			if (!plotBackground) {
				chart.plotBackground = renderer.rect(plotLeft, plotTop, plotWidth, plotHeight, 0)
					.attr({
						fill: plotBackgroundColor
					})
					.add()
					.shadow(optionsChart.plotShadow);
			} else {
				plotBackground.animate(plotBox);
			}
		}
		if (plotBackgroundImage) {
			if (!plotBGImage) {
				chart.plotBGImage = renderer.image(plotBackgroundImage, plotLeft, plotTop, plotWidth, plotHeight)
					.add();
			} else {
				plotBGImage.animate(plotBox);
			}
		}
		
		// Plot clip
		if (!clipRect) {
			chart.clipRect = renderer.clipRect(clipBox);
		} else {
			clipRect.animate({
				width: clipBox.width,
				height: clipBox.height
			});
		}

		// Plot area border
		if (plotBorderWidth) {
			if (!plotBorder) {
				chart.plotBorder = renderer.rect(plotLeft, plotTop, plotWidth, plotHeight, 0, -plotBorderWidth)
					.attr({
						stroke: optionsChart.plotBorderColor,
						'stroke-width': plotBorderWidth,
						zIndex: 1
					})
					.add();
			} else {
				plotBorder.animate(
					plotBorder.crisp(null, plotLeft, plotTop, plotWidth, plotHeight)
				);
			}
		}

		// reset
		chart.isDirtyBox = false;
	},

	/**
	 * Detect whether a certain chart property is needed based on inspecting its options
	 * and series. This mainly applies to the chart.invert property, and in extensions to 
	 * the chart.angular and chart.polar properties.
	 */
	propFromSeries: function () {
		var chart = this,
			optionsChart = chart.options.chart,
			klass,
			seriesOptions = chart.options.series,
			i,
			value;
			
			
		each(['inverted', 'angular', 'polar'], function (key) {
			
			// The default series type's class
			klass = seriesTypes[optionsChart.type || optionsChart.defaultSeriesType];
			
			// Get the value from available chart-wide properties
			value = (
				chart[key] || // 1. it is set before
				optionsChart[key] || // 2. it is set in the options
				(klass && klass.prototype[key]) // 3. it's default series class requires it
			);
	
			// 4. Check if any the chart's series require it
			i = seriesOptions && seriesOptions.length;
			while (!value && i--) {
				klass = seriesTypes[seriesOptions[i].type];
				if (klass && klass.prototype[key]) {
					value = true;
				}
			}
	
			// Set the chart property
			chart[key] = value;	
		});
		
	},

	/**
	 * Link two or more series together. This is done initially from Chart.render,
	 * and after Chart.addSeries and Series.remove.
	 */
	linkSeries: function () {
		var chart = this,
			chartSeries = chart.series;

		// Reset links
		each(chartSeries, function (series) {
			series.linkedSeries.length = 0;
		});

		// Apply new links
		each(chartSeries, function (series) {
			var linkedTo = series.options.linkedTo;
			if (isString(linkedTo)) {
				if (linkedTo === ':previous') {
					linkedTo = chart.series[series.index - 1];
				} else {
					linkedTo = chart.get(linkedTo);
				}
				if (linkedTo) {
					linkedTo.linkedSeries.push(series);
					series.linkedParent = linkedTo;
				}
			}
		});
	},

	/**
	 * Render all graphics for the chart
	 */
	render: function () {
		var chart = this,
			axes = chart.axes,
			renderer = chart.renderer,
			options = chart.options;

		var labels = options.labels,
			credits = options.credits,
			creditsHref;

		// Title
		chart.setTitle();


		// Legend
		chart.legend = new Legend(chart, options.legend);

		chart.getStacks(); // render stacks

		// Get margins by pre-rendering axes
		// set axes scales
		each(axes, function (axis) {
			axis.setScale();
		});

		chart.getMargins();

		chart.maxTicks = null; // reset for second pass
		each(axes, function (axis) {
			axis.setTickPositions(true); // update to reflect the new margins
			axis.setMaxTicks();
		});
		chart.adjustTickAmounts();
		chart.getMargins(); // second pass to check for new labels


		// Draw the borders and backgrounds
		chart.drawChartBox();		


		// Axes
		if (chart.hasCartesianSeries) {
			each(axes, function (axis) {
				axis.render();
			});
		}

		// The series
		if (!chart.seriesGroup) {
			chart.seriesGroup = renderer.g('series-group')
				.attr({ zIndex: 3 })
				.add();
		}
		each(chart.series, function (serie) {
			serie.translate();
			serie.setTooltipPoints();
			serie.render();
		});

		// Labels
		if (labels.items) {
			each(labels.items, function (label) {
				var style = extend(labels.style, label.style),
					x = pInt(style.left) + chart.plotLeft,
					y = pInt(style.top) + chart.plotTop + 12;

				// delete to prevent rewriting in IE
				delete style.left;
				delete style.top;

				renderer.text(
					label.html,
					x,
					y
				)
				.attr({ zIndex: 2 })
				.css(style)
				.add();

			});
		}

		// Credits
		if (credits.enabled && !chart.credits) {
			creditsHref = credits.href;
			chart.credits = renderer.text(
				credits.text,
				0,
				0
			)
			.on('click', function () {
				if (creditsHref) {
					location.href = creditsHref;
				}
			})
			.attr({
				align: credits.position.align,
				zIndex: 8
			})
			.css(credits.style)
			.add()
			.align(credits.position);
		}

		// Set flag
		chart.hasRendered = true;

	},

	/**
	 * Clean up memory usage
	 */
	destroy: function () {
		var chart = this,
			axes = chart.axes,
			series = chart.series,
			container = chart.container,
			i,
			parentNode = container && container.parentNode;
			
		// fire the chart.destoy event
		fireEvent(chart, 'destroy');
		
		// Delete the chart from charts lookup array
		charts[chart.index] = UNDEFINED;
		chart.renderTo.removeAttribute('data-highcharts-chart');

		// remove events
		removeEvent(chart);

		// ==== Destroy collections:
		// Destroy axes
		i = axes.length;
		while (i--) {
			axes[i] = axes[i].destroy();
		}

		// Destroy each series
		i = series.length;
		while (i--) {
			series[i] = series[i].destroy();
		}

		// ==== Destroy chart properties:
		each(['title', 'subtitle', 'chartBackground', 'plotBackground', 'plotBGImage', 
				'plotBorder', 'seriesGroup', 'clipRect', 'credits', 'pointer', 'scroller', 
				'rangeSelector', 'legend', 'resetZoomButton', 'tooltip', 'renderer'], function (name) {
			var prop = chart[name];

			if (prop && prop.destroy) {
				chart[name] = prop.destroy();
			}
		});

		// remove container and all SVG
		if (container) { // can break in IE when destroyed before finished loading
			container.innerHTML = '';
			removeEvent(container);
			if (parentNode) {
				discardElement(container);
			}

		}

		// clean it all up
		for (i in chart) {
			delete chart[i];
		}

	},


	/**
	 * VML namespaces can't be added until after complete. Listening
	 * for Perini's doScroll hack is not enough.
	 */
	isReadyToRender: function () {
		var chart = this;

		// Note: in spite of JSLint's complaints, win == win.top is required
		/*jslint eqeq: true*/
		if ((!hasSVG && (win == win.top && doc.readyState !== 'complete')) || (useCanVG && !win.canvg)) {
		/*jslint eqeq: false*/
			if (useCanVG) {
				// Delay rendering until canvg library is downloaded and ready
				CanVGController.push(function () { chart.firstRender(); }, chart.options.global.canvasToolsURL);
			} else {
				doc.attachEvent('onreadystatechange', function () {
					doc.detachEvent('onreadystatechange', chart.firstRender);
					if (doc.readyState === 'complete') {
						chart.firstRender();
					}
				});
			}
			return false;
		}
		return true;
	},

	/**
	 * Prepare for first rendering after all data are loaded
	 */
	firstRender: function () {
		var chart = this,
			options = chart.options,
			callback = chart.callback;

		// Check whether the chart is ready to render
		if (!chart.isReadyToRender()) {
			return;
		}

		// Create the container
		chart.getContainer();

		// Run an early event after the container and renderer are established
		fireEvent(chart, 'init');

		
		chart.resetMargins();
		chart.setChartSize();

		// Set the common chart properties (mainly invert) from the given series
		chart.propFromSeries();

		// get axes
		chart.getAxes();

		// Initialize the series
		each(options.series || [], function (serieOptions) {
			chart.initSeries(serieOptions);
		});

		chart.linkSeries();

		// Run an event after axes and series are initialized, but before render. At this stage,
		// the series data is indexed and cached in the xData and yData arrays, so we can access
		// those before rendering. Used in Highstock. 
		fireEvent(chart, 'beforeRender'); 

		// depends on inverted and on margins being set
		chart.pointer = new Pointer(chart, options);

		chart.render();

		// add canvas
		chart.renderer.draw();
		// run callbacks
		if (callback) {
			callback.apply(chart, [chart]);
		}
		each(chart.callbacks, function (fn) {
			fn.apply(chart, [chart]);
		});
		
		
		// If the chart was rendered outside the top container, put it back in
		chart.cloneRenderTo(true);

		fireEvent(chart, 'load');

	},

	/**
	* Creates arrays for spacing and margin from given options.
	*/
	splashArray: function (target, options) {
		var oVar = options[target],
			tArray = isObject(oVar) ? oVar : [oVar, oVar, oVar, oVar];

		return [pick(options[target + 'Top'], tArray[0]),
				pick(options[target + 'Right'], tArray[1]),
				pick(options[target + 'Bottom'], tArray[2]),
				pick(options[target + 'Left'], tArray[3])];
	}
}; // end Chart

// Hook for exporting module
Chart.prototype.callbacks = [];

var CenteredSeriesMixin = Highcharts.CenteredSeriesMixin = {
	/**
	 * Get the center of the pie based on the size and center options relative to the  
	 * plot area. Borrowed by the polar and gauge series types.
	 */
	getCenter: function () {
		
		var options = this.options,
			chart = this.chart,
			slicingRoom = 2 * (options.slicedOffset || 0),
			handleSlicingRoom,
			plotWidth = chart.plotWidth - 2 * slicingRoom,
			plotHeight = chart.plotHeight - 2 * slicingRoom,
			centerOption = options.center,
			positions = [pick(centerOption[0], '50%'), pick(centerOption[1], '50%'), options.size || '100%', options.innerSize || 0],
			smallestSize = mathMin(plotWidth, plotHeight),
			isPercent;
		
		return map(positions, function (length, i) {
			isPercent = /%$/.test(length);
			handleSlicingRoom = i < 2 || (i === 2 && isPercent);
			return (isPercent ?
				// i == 0: centerX, relative to width
				// i == 1: centerY, relative to height
				// i == 2: size, relative to smallestSize
				// i == 4: innerSize, relative to smallestSize
				[plotWidth, plotHeight, smallestSize, smallestSize][i] *
					pInt(length) / 100 :
				length) + (handleSlicingRoom ? slicingRoom : 0);
		});
	}
};

/**
 * The Point object and prototype. Inheritable and used as base for PiePoint
 */
var Point = function () {};
Point.prototype = {

	/**
	 * Initialize the point
	 * @param {Object} series The series object containing this point
	 * @param {Object} options The data in either number, array or object format
	 */
	init: function (series, options, x) {

		var point = this,
			colors;
		point.series = series;
		point.applyOptions(options, x);
		point.pointAttr = {};

		if (series.options.colorByPoint) {
			colors = series.options.colors || series.chart.options.colors;
			point.color = point.color || colors[series.colorCounter++];
			// loop back to zero
			if (series.colorCounter === colors.length) {
				series.colorCounter = 0;
			}
		}

		series.chart.pointCount++;
		return point;
	},
	/**
	 * Apply the options containing the x and y data and possible some extra properties.
	 * This is called on point init or from point.update.
	 *
	 * @param {Object} options
	 */
	applyOptions: function (options, x) {
		var point = this,
			series = point.series,
			pointValKey = series.pointValKey;

		options = Point.prototype.optionsToObject.call(this, options);

		// copy options directly to point
		extend(point, options);
		point.options = point.options ? extend(point.options, options) : options;

		// For higher dimension series types. For instance, for ranges, point.y is mapped to point.low.
		if (pointValKey) {
			point.y = point[pointValKey];
		}

		// If no x is set by now, get auto incremented value. All points must have an
		// x value, however the y value can be null to create a gap in the series
		if (point.x === UNDEFINED && series) {
			point.x = x === UNDEFINED ? series.autoIncrement() : x;
		}

		return point;
	},

	/**
	 * Transform number or array configs into objects
	 */
	optionsToObject: function (options) {
		var ret = {},
			series = this.series,
			pointArrayMap = series.pointArrayMap || ['y'],
			valueCount = pointArrayMap.length,
			firstItemType,
			i = 0,
			j = 0;

		if (typeof options === 'number' || options === null) {
			ret[pointArrayMap[0]] = options;

		} else if (isArray(options)) {
			// with leading x value
			if (options.length > valueCount) {
				firstItemType = typeof options[0];
				if (firstItemType === 'string') {
					ret.name = options[0];
				} else if (firstItemType === 'number') {
					ret.x = options[0];
				}
				i++;
			}
			while (j < valueCount) {
				ret[pointArrayMap[j++]] = options[i++];
			}
		} else if (typeof options === 'object') {
			ret = options;

			// This is the fastest way to detect if there are individual point dataLabels that need
			// to be considered in drawDataLabels. These can only occur in object configs.
			if (options.dataLabels) {
				series._hasPointLabels = true;
			}

			// Same approach as above for markers
			if (options.marker) {
				series._hasPointMarkers = true;
			}
		}
		return ret;
	},

	/**
	 * Destroy a point to clear memory. Its reference still stays in series.data.
	 */
	destroy: function () {
		var point = this,
			series = point.series,
			chart = series.chart,
			hoverPoints = chart.hoverPoints,
			prop;

		chart.pointCount--;

		if (hoverPoints) {
			point.setState();
			erase(hoverPoints, point);
			if (!hoverPoints.length) {
				chart.hoverPoints = null;
			}

		}
		if (point === chart.hoverPoint) {
			point.onMouseOut();
		}

		// remove all events
		if (point.graphic || point.dataLabel) { // removeEvent and destroyElements are performance expensive
			removeEvent(point);
			point.destroyElements();
		}

		if (point.legendItem) { // pies have legend items
			chart.legend.destroyItem(point);
		}

		for (prop in point) {
			point[prop] = null;
		}


	},

	/**
	 * Destroy SVG elements associated with the point
	 */
	destroyElements: function () {
		var point = this,
			props = ['graphic', 'dataLabel', 'dataLabelUpper', 'group', 'connector', 'shadowGroup'],
			prop,
			i = 6;
		while (i--) {
			prop = props[i];
			if (point[prop]) {
				point[prop] = point[prop].destroy();
			}
		}
	},

	/**
	 * Return the configuration hash needed for the data label and tooltip formatters
	 */
	getLabelConfig: function () {
		var point = this;
		return {
			x: point.category,
			y: point.y,
			key: point.name || point.category,
			series: point.series,
			point: point,
			percentage: point.percentage,
			total: point.total || point.stackTotal
		};
	},

	/**
	 * Toggle the selection status of a point
	 * @param {Boolean} selected Whether to select or unselect the point.
	 * @param {Boolean} accumulate Whether to add to the previous selection. By default,
	 *     this happens if the control key (Cmd on Mac) was pressed during clicking.
	 */
	select: function (selected, accumulate) {
		var point = this,
			series = point.series,
			chart = series.chart;

		selected = pick(selected, !point.selected);

		// fire the event with the defalut handler
		point.firePointEvent(selected ? 'select' : 'unselect', { accumulate: accumulate }, function () {
			point.selected = point.options.selected = selected;
			series.options.data[inArray(point, series.data)] = point.options;

			point.setState(selected && SELECT_STATE);

			// unselect all other points unless Ctrl or Cmd + click
			if (!accumulate) {
				each(chart.getSelectedPoints(), function (loopPoint) {
					if (loopPoint.selected && loopPoint !== point) {
						loopPoint.selected = loopPoint.options.selected = false;
						series.options.data[inArray(loopPoint, series.data)] = loopPoint.options;
						loopPoint.setState(NORMAL_STATE);
						loopPoint.firePointEvent('unselect');
					}
				});
			}
		});
	},

	/**
	 * Runs on mouse over the point
	 */
	onMouseOver: function (e) {
		var point = this,
			series = point.series,
			chart = series.chart,
			tooltip = chart.tooltip,
			hoverPoint = chart.hoverPoint;

		// set normal state to previous series
		if (hoverPoint && hoverPoint !== point) {
			hoverPoint.onMouseOut();
		}

		// trigger the event
		point.firePointEvent('mouseOver');

		// update the tooltip
		if (tooltip && (!tooltip.shared || series.noSharedTooltip)) {
			tooltip.refresh(point, e);
		}

		// hover this
		point.setState(HOVER_STATE);
		chart.hoverPoint = point;
	},

	/**
	 * Runs on mouse out from the point
	 */
	onMouseOut: function () {
		var chart = this.series.chart,
			hoverPoints = chart.hoverPoints;

		if (!hoverPoints || inArray(this, hoverPoints) === -1) { // #887
			this.firePointEvent('mouseOut');

			this.setState();
			chart.hoverPoint = null;
		}
	},

	/**
	 * Extendable method for formatting each point's tooltip line
	 *
	 * @return {String} A string to be concatenated in to the common tooltip text
	 */
	tooltipFormatter: function (pointFormat) {

		// Insert options for valueDecimals, valuePrefix, and valueSuffix
		var series = this.series,
			seriesTooltipOptions = series.tooltipOptions,
			valueDecimals = pick(seriesTooltipOptions.valueDecimals, ''),
			valuePrefix = seriesTooltipOptions.valuePrefix || '',
			valueSuffix = seriesTooltipOptions.valueSuffix || '';

		// Loop over the point array map and replace unformatted values with sprintf formatting markup
		each(series.pointArrayMap || ['y'], function (key) {
			key = '{point.' + key; // without the closing bracket
			if (valuePrefix || valueSuffix) {
				pointFormat = pointFormat.replace(key + '}', valuePrefix + key + '}' + valueSuffix);
			}
			pointFormat = pointFormat.replace(key + '}', key + ':,.' + valueDecimals + 'f}');
		});

		return format(pointFormat, {
			point: this,
			series: this.series
		});
	},

	/**
	 * Fire an event on the Point object. Must not be renamed to fireEvent, as this
	 * causes a name clash in MooTools
	 * @param {String} eventType
	 * @param {Object} eventArgs Additional event arguments
	 * @param {Function} defaultFunction Default event handler
	 */
	firePointEvent: function (eventType, eventArgs, defaultFunction) {
		var point = this,
			series = this.series,
			seriesOptions = series.options;

		// load event handlers on demand to save time on mouseover/out
		if (seriesOptions.point.events[eventType] || (point.options && point.options.events && point.options.events[eventType])) {
			this.importEvents();
		}

		// add default handler if in selection mode
		if (eventType === 'click' && seriesOptions.allowPointSelect) {
			defaultFunction = function (event) {
				// Control key is for Windows, meta (= Cmd key) for Mac, Shift for Opera
				point.select(null, event.ctrlKey || event.metaKey || event.shiftKey);
			};
		}

		fireEvent(this, eventType, eventArgs, defaultFunction);
	},
	/**
	 * Import events from the series' and point's options. Only do it on
	 * demand, to save processing time on hovering.
	 */
	importEvents: function () {
		if (!this.hasImportedEvents) {
			var point = this,
				options = merge(point.series.options.point, point.options),
				events = options.events,
				eventType;

			point.events = events;

			for (eventType in events) {
				addEvent(point, eventType, events[eventType]);
			}
			this.hasImportedEvents = true;

		}
	},

	/**
	 * Set the point's state
	 * @param {String} state
	 */
	setState: function (state, move) {
		var point = this,
			plotX = point.plotX,
			plotY = point.plotY,
			series = point.series,
			stateOptions = series.options.states,
			markerOptions = defaultPlotOptions[series.type].marker && series.options.marker,
			normalDisabled = markerOptions && !markerOptions.enabled,
			markerStateOptions = markerOptions && markerOptions.states[state],
			stateDisabled = markerStateOptions && markerStateOptions.enabled === false,
			stateMarkerGraphic = series.stateMarkerGraphic,
			pointMarker = point.marker || {},
			chart = series.chart,
			radius,
			newSymbol,
			pointAttr = point.pointAttr;

		state = state || NORMAL_STATE; // empty string
		move = move && stateMarkerGraphic;

		if (
				// already has this state
				(state === point.state && !move) ||
				// selected points don't respond to hover
				(point.selected && state !== SELECT_STATE) ||
				// series' state options is disabled
				(stateOptions[state] && stateOptions[state].enabled === false) ||
				// general point marker's state options is disabled
				(state && (stateDisabled || (normalDisabled && !markerStateOptions.enabled))) ||
				// individual point marker's state options is disabled
				(state && pointMarker.states && pointMarker.states[state] && pointMarker.states[state].enabled === false) // #1610

			) {
			return;
		}


		// apply hover styles to the existing point
		if (point.graphic) {
			radius = markerOptions && point.graphic.symbolName && pointAttr[state].r;
			point.graphic.attr(merge(
				pointAttr[state],
				radius ? { // new symbol attributes (#507, #612)
					x: plotX - radius,
					y: plotY - radius,
					width: 2 * radius,
					height: 2 * radius
				} : {}
			));
		} else {
			// if a graphic is not applied to each point in the normal state, create a shared
			// graphic for the hover state
			if (state && markerStateOptions) {
				radius = markerStateOptions.radius;
				newSymbol = pointMarker.symbol || series.symbol;

				// If the point has another symbol than the previous one, throw away the
				// state marker graphic and force a new one (#1459)
				if (stateMarkerGraphic && stateMarkerGraphic.currentSymbol !== newSymbol) {
					stateMarkerGraphic = stateMarkerGraphic.destroy();
				}

				// Add a new state marker graphic
				if (!stateMarkerGraphic) {
					series.stateMarkerGraphic = stateMarkerGraphic = chart.renderer.symbol(
						newSymbol,
						plotX - radius,
						plotY - radius,
						2 * radius,
						2 * radius
					)
					.attr(pointAttr[state])
					.add(series.markerGroup);
					stateMarkerGraphic.currentSymbol = newSymbol;

				// Move the existing graphic
				} else {
					stateMarkerGraphic[move ? 'animate' : 'attr']({ // #1054
						x: plotX - radius,
						y: plotY - radius
					});
				}
			}

			if (stateMarkerGraphic) {
				stateMarkerGraphic[state && chart.isInsidePlot(plotX, plotY, chart.inverted) ? 'show' : 'hide'](); // #2450
			}
		}

		point.state = state;
	}
};/**
 * @classDescription The base function which all other series types inherit from. The data in the series is stored
 * in various arrays.
 *
 * - First, series.options.data contains all the original config options for
 * each point whether added by options or methods like series.addPoint.
 * - Next, series.data contains those values converted to points, but in case the series data length
 * exceeds the cropThreshold, or if the data is grouped, series.data doesn't contain all the points. It
 * only contains the points that have been created on demand.
 * - Then there's series.points that contains all currently visible point objects. In case of cropping,
 * the cropped-away points are not part of this array. The series.points array starts at series.cropStart
 * compared to series.data and series.options.data. If however the series data is grouped, these can't
 * be correlated one to one.
 * - series.xData and series.processedXData contain clean x values, equivalent to series.data and series.points.
 * - series.yData and series.processedYData contain clean x values, equivalent to series.data and series.points.
 *
 * @param {Object} chart
 * @param {Object} options
 */
var Series = function () {};

Series.prototype = {

	isCartesian: true,
	type: 'line',
	pointClass: Point,
	sorted: true, // requires the data to be sorted
	requireSorting: true,
	pointAttrToOptions: { // mapping between SVG attributes and the corresponding options
		stroke: 'lineColor',
		'stroke-width': 'lineWidth',
		fill: 'fillColor',
		r: 'radius'
	},
	axisTypes: ['xAxis', 'yAxis'],
	colorCounter: 0,
	parallelArrays: ['x', 'y'], // each point's x and y values are stored in this.xData and this.yData
	init: function (chart, options) {
		var series = this,
			eventType,
			events,
			chartSeries = chart.series,
			sortByIndex = function (a, b) {
				return pick(a.options.index, a._i) - pick(b.options.index, b._i);
			};

		series.chart = chart;
		series.options = options = series.setOptions(options); // merge with plotOptions
		series.linkedSeries = [];

		// bind the axes
		series.bindAxes();

		// set some variables
		extend(series, {
			name: options.name,
			state: NORMAL_STATE,
			pointAttr: {},
			visible: options.visible !== false, // true by default
			selected: options.selected === true // false by default
		});

		// special
		if (useCanVG) {
			options.animation = false;
		}

		// register event listeners
		events = options.events;
		for (eventType in events) {
			addEvent(series, eventType, events[eventType]);
		}
		if (
			(events && events.click) ||
			(options.point && options.point.events && options.point.events.click) ||
			options.allowPointSelect
		) {
			chart.runTrackerClick = true;
		}

		series.getColor();
		series.getSymbol();

		// Set the data
		each(series.parallelArrays, function (key) {
			series[key + 'Data'] = [];
		});
		series.setData(options.data, false);

		// Mark cartesian
		if (series.isCartesian) {
			chart.hasCartesianSeries = true;
		}

		// Register it in the chart
		chartSeries.push(series);
		series._i = chartSeries.length - 1;

		// Sort series according to index option (#248, #1123, #2456)
		stableSort(chartSeries, sortByIndex);
		if (this.yAxis) {
			stableSort(this.yAxis.series, sortByIndex);
		}

		each(chartSeries, function (series, i) {
			series.index = i;
			series.name = series.name || 'Series ' + (i + 1);
		});

	},

	/**
	 * Set the xAxis and yAxis properties of cartesian series, and register the series
	 * in the axis.series array
	 */
	bindAxes: function () {
		var series = this,
			seriesOptions = series.options,
			chart = series.chart,
			axisOptions;

		each(series.axisTypes || [], function (AXIS) { // repeat for xAxis and yAxis

			each(chart[AXIS], function (axis) { // loop through the chart's axis objects
				axisOptions = axis.options;

				// apply if the series xAxis or yAxis option mathches the number of the
				// axis, or if undefined, use the first axis
				if ((seriesOptions[AXIS] === axisOptions.index) ||
						(seriesOptions[AXIS] !== UNDEFINED && seriesOptions[AXIS] === axisOptions.id) ||
						(seriesOptions[AXIS] === UNDEFINED && axisOptions.index === 0)) {

					// register this series in the axis.series lookup
					axis.series.push(series);

					// set this series.xAxis or series.yAxis reference
					series[AXIS] = axis;

					// mark dirty for redraw
					axis.isDirty = true;
				}
			});

			// The series needs an X and an Y axis
			if (!series[AXIS] && series.optionalAxis !== AXIS) {
				error(18, true);
			}

		});
	},

	/**
	 * For simple series types like line and column, the data values are held in arrays like
	 * xData and yData for quick lookup to find extremes and more. For multidimensional series
	 * like bubble and map, this can be extended with arrays like zData and valueData by
	 * adding to the series.parallelArrays array.
	 */
	updateParallelArrays: function (point, i) {
		var series = point.series,
			args = arguments,
			fn = typeof i === 'number' ?
				 // Insert the value in the given position
				function (key) {
					var val = key === 'y' && series.toYData ? series.toYData(point) : point[key];
					series[key + 'Data'][i] = val;
				} :
				// Apply the method specified in i with the following arguments as arguments
				function (key) {
					Array.prototype[i].apply(series[key + 'Data'], Array.prototype.slice.call(args, 2));
				};

		each(series.parallelArrays, fn);
	},

	/**
	 * Return an auto incremented x value based on the pointStart and pointInterval options.
	 * This is only used if an x value is not given for the point that calls autoIncrement.
	 */
	autoIncrement: function () {
		var series = this,
			options = series.options,
			xIncrement = series.xIncrement;

		xIncrement = pick(xIncrement, options.pointStart, 0);

		series.pointInterval = pick(series.pointInterval, options.pointInterval, 1);

		series.xIncrement = xIncrement + series.pointInterval;
		return xIncrement;
	},

	/**
	 * Divide the series data into segments divided by null values.
	 */
	getSegments: function () {
		var series = this,
			lastNull = -1,
			segments = [],
			i,
			points = series.points,
			pointsLength = points.length;

		if (pointsLength) { // no action required for []

			// if connect nulls, just remove null points
			if (series.options.connectNulls) {
				i = pointsLength;
				while (i--) {
					if (points[i].y === null) {
						points.splice(i, 1);
					}
				}
				if (points.length) {
					segments = [points];
				}

			// else, split on null points
			} else {
				each(points, function (point, i) {
					if (point.y === null) {
						if (i > lastNull + 1) {
							segments.push(points.slice(lastNull + 1, i));
						}
						lastNull = i;
					} else if (i === pointsLength - 1) { // last value
						segments.push(points.slice(lastNull + 1, i + 1));
					}
				});
			}
		}

		// register it
		series.segments = segments;
	},

	/**
	 * Set the series options by merging from the options tree
	 * @param {Object} itemOptions
	 */
	setOptions: function (itemOptions) {
		var chart = this.chart,
			chartOptions = chart.options,
			plotOptions = chartOptions.plotOptions,
			userOptions = chart.userOptions || {},
			userPlotOptions = userOptions.plotOptions || {},
			typeOptions = plotOptions[this.type],
			options;

		this.userOptions = itemOptions;

		options = merge(
			typeOptions,
			plotOptions.series,
			itemOptions
		);

		// The tooltip options are merged between global and series specific options
		this.tooltipOptions = merge(
			defaultOptions.tooltip,
			defaultOptions.plotOptions[this.type].tooltip,
			userOptions.tooltip,
			userPlotOptions.series && userPlotOptions.series.tooltip,
			userPlotOptions[this.type] && userPlotOptions[this.type].tooltip,
			itemOptions.tooltip
		);

		// Delete marker object if not allowed (#1125)
		if (typeOptions.marker === null) {
			delete options.marker;
		}

		return options;

	},
	/**
	 * Get the series' color
	 */
	getColor: function () {
		var options = this.options,
			userOptions = this.userOptions,
			defaultColors = this.chart.options.colors,
			counters = this.chart.counters,
			color,
			colorIndex;

		color = options.color || defaultPlotOptions[this.type].color;

		if (!color && !options.colorByPoint) {
			if (defined(userOptions._colorIndex)) { // after Series.update()
				colorIndex = userOptions._colorIndex;
			} else {
				userOptions._colorIndex = counters.color;
				colorIndex = counters.color++;
			}
			color = defaultColors[colorIndex];
		}

		this.color = color;
		counters.wrapColor(defaultColors.length);
	},
	/**
	 * Get the series' symbol
	 */
	getSymbol: function () {
		var series = this,
			userOptions = series.userOptions,
			seriesMarkerOption = series.options.marker,
			chart = series.chart,
			defaultSymbols = chart.options.symbols,
			counters = chart.counters,
			symbolIndex;

		series.symbol = seriesMarkerOption.symbol;
		if (!series.symbol) {
			if (defined(userOptions._symbolIndex)) { // after Series.update()
				symbolIndex = userOptions._symbolIndex;
			} else {
				userOptions._symbolIndex = counters.symbol;
				symbolIndex = counters.symbol++;
			}
			series.symbol = defaultSymbols[symbolIndex];
		}

		// don't substract radius in image symbols (#604)
		if (/^url/.test(series.symbol)) {
			seriesMarkerOption.radius = 0;
		}
		counters.wrapSymbol(defaultSymbols.length);
	},

	drawLegendSymbol: LegendSymbolMixin.drawLineMarker,

	/**
	 * Replace the series data with a new set of data
	 * @param {Object} data
	 * @param {Object} redraw
	 */
	setData: function (data, redraw) {
		var series = this,
			oldData = series.points,
			options = series.options,
			chart = series.chart,
			firstPoint = null,
			xAxis = series.xAxis,
			hasCategories = xAxis && !!xAxis.categories,
			i;

		// reset properties
		series.xIncrement = null;
		series.pointRange = hasCategories ? 1 : options.pointRange;

		series.colorCounter = 0; // for series with colorByPoint (#1547)
		data = data || [];

		// parallel arrays
		var dataLength = data.length,
			turboThreshold = options.turboThreshold,
			pt,
			xData = this.xData,
			yData = this.yData,
			pointArrayMap = series.pointArrayMap,
			valueCount = pointArrayMap && pointArrayMap.length;

		each(this.parallelArrays, function (key) {
			series[key + 'Data'].length = 0;
		});

		// In turbo mode, only one- or twodimensional arrays of numbers are allowed. The
		// first value is tested, and we assume that all the rest are defined the same
		// way. Although the 'for' loops are similar, they are repeated inside each
		// if-else conditional for max performance.
		if (turboThreshold && dataLength > turboThreshold) {

			// find the first non-null point
			i = 0;
			while (firstPoint === null && i < dataLength) {
				firstPoint = data[i];
				i++;
			}


			if (isNumber(firstPoint)) { // assume all points are numbers
				var x = pick(options.pointStart, 0),
					pointInterval = pick(options.pointInterval, 1);

				for (i = 0; i < dataLength; i++) {
					xData[i] = x;
					yData[i] = data[i];
					x += pointInterval;
				}
				series.xIncrement = x;
			} else if (isArray(firstPoint)) { // assume all points are arrays
				if (valueCount) { // [x, low, high] or [x, o, h, l, c]
					for (i = 0; i < dataLength; i++) {
						pt = data[i];
						xData[i] = pt[0];
						yData[i] = pt.slice(1, valueCount + 1);
					}
				} else { // [x, y]
					for (i = 0; i < dataLength; i++) {
						pt = data[i];
						xData[i] = pt[0];
						yData[i] = pt[1];
					}
				}
			} else {
				error(12); // Highcharts expects configs to be numbers or arrays in turbo mode
			}
		} else {
			for (i = 0; i < dataLength; i++) {
				if (data[i] !== UNDEFINED) { // stray commas in oldIE
					pt = { series: series };
					series.pointClass.prototype.applyOptions.apply(pt, [data[i]]);
					series.updateParallelArrays(pt, i);
					if (hasCategories && pt.name) {
						xAxis.names[pt.x] = pt.name; // #2046
					}
				}
			}
		}

		// Forgetting to cast strings to numbers is a common caveat when handling CSV or JSON
		if (isString(yData[0])) {
			error(14, true);
		}

		series.data = [];
		series.options.data = data;
		//series.zData = zData;

		// destroy old points
		i = (oldData && oldData.length) || 0;
		while (i--) {
			if (oldData[i] && oldData[i].destroy) {
				oldData[i].destroy();
			}
		}

		// reset minRange (#878)
		if (xAxis) {
			xAxis.minRange = xAxis.userMinRange;
		}

		// redraw
		series.isDirty = series.isDirtyData = chart.isDirtyBox = true;
		if (pick(redraw, true)) {
			chart.redraw(false);
		}
	},

	/**
	 * Process the data by cropping away unused data points if the series is longer
	 * than the crop threshold. This saves computing time for lage series.
	 */
	processData: function (force) {
		var series = this,
			processedXData = series.xData, // copied during slice operation below
			processedYData = series.yData,
			dataLength = processedXData.length,
			croppedData,
			cropStart = 0,
			cropped,
			distance,
			closestPointRange,
			xAxis = series.xAxis,
			i, // loop variable
			options = series.options,
			cropThreshold = options.cropThreshold,
			isCartesian = series.isCartesian;

		// If the series data or axes haven't changed, don't go through this. Return false to pass
		// the message on to override methods like in data grouping.
		if (isCartesian && !series.isDirty && !xAxis.isDirty && !series.yAxis.isDirty && !force) {
			return false;
		}


		// optionally filter out points outside the plot area
		if (isCartesian && series.sorted && (!cropThreshold || dataLength > cropThreshold || series.forceCrop)) {
			var min = xAxis.min,
				max = xAxis.max;

			// it's outside current extremes
			if (processedXData[dataLength - 1] < min || processedXData[0] > max) {
				processedXData = [];
				processedYData = [];

			// only crop if it's actually spilling out
			} else if (processedXData[0] < min || processedXData[dataLength - 1] > max) {
				croppedData = this.cropData(series.xData, series.yData, min, max);
				processedXData = croppedData.xData;
				processedYData = croppedData.yData;
				cropStart = croppedData.start;
				cropped = true;
			}
		}


		// Find the closest distance between processed points
		for (i = processedXData.length - 1; i >= 0; i--) {
			distance = processedXData[i] - processedXData[i - 1];
			if (distance > 0 && (closestPointRange === UNDEFINED || distance < closestPointRange)) {
				closestPointRange = distance;

			// Unsorted data is not supported by the line tooltip, as well as data grouping and
			// navigation in Stock charts (#725) and width calculation of columns (#1900)
			} else if (distance < 0 && series.requireSorting) {
				error(15);
			}
		}

		// Record the properties
		series.cropped = cropped; // undefined or true
		series.cropStart = cropStart;
		series.processedXData = processedXData;
		series.processedYData = processedYData;

		if (options.pointRange === null) { // null means auto, as for columns, candlesticks and OHLC
			series.pointRange = closestPointRange || 1;
		}
		series.closestPointRange = closestPointRange;

	},

	/**
	 * Iterate over xData and crop values between min and max. Returns object containing crop start/end
	 * cropped xData with corresponding part of yData, dataMin and dataMax within the cropped range
	 */
	cropData: function (xData, yData, min, max) {
		var dataLength = xData.length,
			cropStart = 0,
			cropEnd = dataLength,
			cropShoulder = pick(this.cropShoulder, 1), // line-type series need one point outside
			i;

		// iterate up to find slice start
		for (i = 0; i < dataLength; i++) {
			if (xData[i] >= min) {
				cropStart = mathMax(0, i - cropShoulder);
				break;
			}
		}

		// proceed to find slice end
		for (; i < dataLength; i++) {
			if (xData[i] > max) {
				cropEnd = i + cropShoulder;
				break;
			}
		}

		return {
			xData: xData.slice(cropStart, cropEnd),
			yData: yData.slice(cropStart, cropEnd),
			start: cropStart,
			end: cropEnd
		};
	},


	/**
	 * Generate the data point after the data has been processed by cropping away
	 * unused points and optionally grouped in Highcharts Stock.
	 */
	generatePoints: function () {
		var series = this,
			options = series.options,
			dataOptions = options.data,
			data = series.data,
			dataLength,
			processedXData = series.processedXData,
			processedYData = series.processedYData,
			pointClass = series.pointClass,
			processedDataLength = processedXData.length,
			cropStart = series.cropStart || 0,
			cursor,
			hasGroupedData = series.hasGroupedData,
			point,
			points = [],
			i;

		if (!data && !hasGroupedData) {
			var arr = [];
			arr.length = dataOptions.length;
			data = series.data = arr;
		}

		for (i = 0; i < processedDataLength; i++) {
			cursor = cropStart + i;
			if (!hasGroupedData) {
				if (data[cursor]) {
					point = data[cursor];
				} else if (dataOptions[cursor] !== UNDEFINED) { // #970
					data[cursor] = point = (new pointClass()).init(series, dataOptions[cursor], processedXData[i]);
				}
				points[i] = point;
			} else {
				// splat the y data in case of ohlc data array
				points[i] = (new pointClass()).init(series, [processedXData[i]].concat(splat(processedYData[i])));
			}
		}

		// Hide cropped-away points - this only runs when the number of points is above cropThreshold, or when
		// swithching view from non-grouped data to grouped data (#637)
		if (data && (processedDataLength !== (dataLength = data.length) || hasGroupedData)) {
			for (i = 0; i < dataLength; i++) {
				if (i === cropStart && !hasGroupedData) { // when has grouped data, clear all points
					i += processedDataLength;
				}
				if (data[i]) {
					data[i].destroyElements();
					data[i].plotX = UNDEFINED; // #1003
				}
			}
		}

		series.data = data;
		series.points = points;
	},

	/**
	 * Adds series' points value to corresponding stack
	 */
	setStackedPoints: function () {
		if (!this.options.stacking || (this.visible !== true && this.chart.options.chart.ignoreHiddenSeries !== false)) {
			return;
		}

		var series = this,
			xData = series.processedXData,
			yData = series.processedYData,
			stackedYData = [],
			yDataLength = yData.length,
			seriesOptions = series.options,
			threshold = seriesOptions.threshold,
			stackOption = seriesOptions.stack,
			stacking = seriesOptions.stacking,
			stackKey = series.stackKey,
			negKey = '-' + stackKey,
			negStacks = series.negStacks,
			yAxis = series.yAxis,
			stacks = yAxis.stacks,
			oldStacks = yAxis.oldStacks,
			isNegative,
			stack,
			other,
			key,
			i,
			x,
			y;

		// loop over the non-null y values and read them into a local array
		for (i = 0; i < yDataLength; i++) {
			x = xData[i];
			y = yData[i];

			// Read stacked values into a stack based on the x value,
			// the sign of y and the stack key. Stacking is also handled for null values (#739)
			isNegative = negStacks && y < threshold;
			key = isNegative ? negKey : stackKey;

			// Create empty object for this stack if it doesn't exist yet
			if (!stacks[key]) {
				stacks[key] = {};
			}

			// Initialize StackItem for this x
			if (!stacks[key][x]) {
				if (oldStacks[key] && oldStacks[key][x]) {
					stacks[key][x] = oldStacks[key][x];
					stacks[key][x].total = null;
				} else {
					stacks[key][x] = new StackItem(yAxis, yAxis.options.stackLabels, isNegative, x, stackOption, stacking);
				}
			}

			// If the StackItem doesn't exist, create it first
			stack = stacks[key][x];
			stack.points[series.index] = [stack.cum || 0];

			// Add value to the stack total
			if (stacking === 'percent') {

				// Percent stacked column, totals are the same for the positive and negative stacks
				other = isNegative ? stackKey : negKey;
				if (negStacks && stacks[other] && stacks[other][x]) {
					other = stacks[other][x];
					stack.total = other.total = mathMax(other.total, stack.total) + mathAbs(y) || 0;

				// Percent stacked areas
				} else {
					stack.total = correctFloat(stack.total + (mathAbs(y) || 0));
				}
			} else {
				stack.total = correctFloat(stack.total + (y || 0));
			}

			stack.cum = (stack.cum || 0) + (y || 0);

			stack.points[series.index].push(stack.cum);
			stackedYData[i] = stack.cum;

		}

		if (stacking === 'percent') {
			yAxis.usePercentage = true;
		}

		this.stackedYData = stackedYData; // To be used in getExtremes

		// Reset old stacks
		yAxis.oldStacks = {};
	},

	/**
	 * Iterate over all stacks and compute the absolute values to percent
	 */
	setPercentStacks: function () {
		var series = this,
			stackKey = series.stackKey,
			stacks = series.yAxis.stacks;

		each([stackKey, '-' + stackKey], function (key) {
			var i = series.xData.length,
				x,
				stack,
				pointExtremes,
				totalFactor;

			while (i--) {
				x = series.xData[i];
				stack = stacks[key] && stacks[key][x];
				pointExtremes = stack && stack.points[series.index];
				if (pointExtremes) {
					totalFactor = stack.total ? 100 / stack.total : 0;
					pointExtremes[0] = correctFloat(pointExtremes[0] * totalFactor); // Y bottom value
					pointExtremes[1] = correctFloat(pointExtremes[1] * totalFactor); // Y value
					series.stackedYData[i] = pointExtremes[1];
				}
			}
		});
	},

	/**
	 * Calculate Y extremes for visible data
	 */
	getExtremes: function (yData) {
		var xAxis = this.xAxis,
			yAxis = this.yAxis,
			xData = this.processedXData,
			yDataLength,
			activeYData = [],
			activeCounter = 0,
			xExtremes = xAxis.getExtremes(), // #2117, need to compensate for log X axis
			xMin = xExtremes.min,
			xMax = xExtremes.max,
			validValue,
			withinRange,
			dataMin,
			dataMax,
			x,
			y,
			i,
			j;

		yData = yData || this.stackedYData || this.processedYData;
		yDataLength = yData.length;

		for (i = 0; i < yDataLength; i++) {

			x = xData[i];
			y = yData[i];

			// For points within the visible range, including the first point outside the
			// visible range, consider y extremes
			validValue = y !== null && y !== UNDEFINED && (!yAxis.isLog || (y.length || y > 0));
			withinRange = this.getExtremesFromAll || this.cropped || ((xData[i + 1] || x) >= xMin &&
				(xData[i - 1] || x) <= xMax);

			if (validValue && withinRange) {

				j = y.length;
				if (j) { // array, like ohlc or range data
					while (j--) {
						if (y[j] !== null) {
							activeYData[activeCounter++] = y[j];
						}
					}
				} else {
					activeYData[activeCounter++] = y;
				}
			}
		}
		this.dataMin = pick(dataMin, arrayMin(activeYData));
		this.dataMax = pick(dataMax, arrayMax(activeYData));
	},

	/**
	 * Translate data points from raw data values to chart specific positioning data
	 * needed later in drawPoints, drawGraph and drawTracker.
	 */
	translate: function () {
		if (!this.processedXData) { // hidden series
			this.processData();
		}
		this.generatePoints();
		var series = this,
			options = series.options,
			stacking = options.stacking,
			xAxis = series.xAxis,
			categories = xAxis.categories,
			yAxis = series.yAxis,
			points = series.points,
			dataLength = points.length,
			hasModifyValue = !!series.modifyValue,
			i,
			pointPlacement = options.pointPlacement,
			dynamicallyPlaced = pointPlacement === 'between' || isNumber(pointPlacement),
			threshold = options.threshold;

		// Translate each point
		for (i = 0; i < dataLength; i++) {
			var point = points[i],
				xValue = point.x,
				yValue = point.y,
				yBottom = point.low,
				stack = stacking && yAxis.stacks[(series.negStacks && yValue < threshold ? '-' : '') + series.stackKey],
				pointStack,
				stackValues;

			// Discard disallowed y values for log axes
			if (yAxis.isLog && yValue <= 0) {
				point.y = yValue = null;
			}

			// Get the plotX translation
			point.plotX = xAxis.translate(xValue, 0, 0, 0, 1, pointPlacement, this.type === 'flags'); // Math.round fixes #591


			// Calculate the bottom y value for stacked series
			if (stacking && series.visible && stack && stack[xValue]) {

				pointStack = stack[xValue];
				stackValues = pointStack.points[series.index];
				yBottom = stackValues[0];
				yValue = stackValues[1];

				if (yBottom === 0) {
					yBottom = pick(threshold, yAxis.min);
				}
				if (yAxis.isLog && yBottom <= 0) { // #1200, #1232
					yBottom = null;
				}

				point.total = point.stackTotal = pointStack.total;
				point.percentage = stacking === 'percent' && (point.y / pointStack.total * 100);
				point.stackY = yValue;

				// Place the stack label
				pointStack.setOffset(series.pointXOffset || 0, series.barW || 0);

			}

			// Set translated yBottom or remove it
			point.yBottom = defined(yBottom) ?
				yAxis.translate(yBottom, 0, 1, 0, 1) :
				null;

			// general hook, used for Highstock compare mode
			if (hasModifyValue) {
				yValue = series.modifyValue(yValue, point);
			}

			// Set the the plotY value, reset it for redraws
			point.plotY = (typeof yValue === 'number' && yValue !== Infinity) ?
				//mathRound(yAxis.translate(yValue, 0, 1, 0, 1) * 10) / 10 : // Math.round fixes #591
				yAxis.translate(yValue, 0, 1, 0, 1) :
				UNDEFINED;

			// Set client related positions for mouse tracking
			point.clientX = dynamicallyPlaced ? xAxis.translate(xValue, 0, 0, 0, 1) : point.plotX; // #1514

			point.negative = point.y < (threshold || 0);

			// some API data
			point.category = categories && categories[point.x] !== UNDEFINED ?
				categories[point.x] : point.x;


		}

		// now that we have the cropped data, build the segments
		series.getSegments();
	},
	/**
	 * Memoize tooltip texts and positions
	 */
	setTooltipPoints: function (renew) {
		var series = this,
			points = [],
			pointsLength,
			low,
			high,
			xAxis = series.xAxis,
			xExtremes = xAxis && xAxis.getExtremes(),
			axisLength = xAxis ? (xAxis.tooltipLen || xAxis.len) : series.chart.plotSizeX, // tooltipLen and tooltipPosName used in polar
			point,
			pointX,
			nextPoint,
			i,
			tooltipPoints = []; // a lookup array for each pixel in the x dimension

		// don't waste resources if tracker is disabled
		if (series.options.enableMouseTracking === false) {
			return;
		}

		// renew
		if (renew) {
			series.tooltipPoints = null;
		}

		// concat segments to overcome null values
		each(series.segments || series.points, function (segment) {
			points = points.concat(segment);
		});

		// Reverse the points in case the X axis is reversed
		if (xAxis && xAxis.reversed) {
			points = points.reverse();
		}

		// Polar needs additional shaping
		if (series.orderTooltipPoints) {
			series.orderTooltipPoints(points);
		}

		// Assign each pixel position to the nearest point
		pointsLength = points.length;
		for (i = 0; i < pointsLength; i++) {
			point = points[i];
			pointX = point.x;
			if (pointX >= xExtremes.min && pointX <= xExtremes.max) { // #1149
				nextPoint = points[i + 1];

				// Set this range's low to the last range's high plus one
				low = high === UNDEFINED ? 0 : high + 1;
				// Now find the new high
				high = points[i + 1] ?
					mathMin(mathMax(0, mathFloor( // #2070
						(point.clientX + (nextPoint ? (nextPoint.wrappedClientX || nextPoint.clientX) : axisLength)) / 2
					)), axisLength) :
					axisLength;

				while (low >= 0 && low <= high) {
					tooltipPoints[low++] = point;
				}
			}
		}
		series.tooltipPoints = tooltipPoints;
	},

	/**
	 * Format the header of the tooltip
	 */
	tooltipHeaderFormatter: function (point) {
		var series = this,
			tooltipOptions = series.tooltipOptions,
			dateTimeLabelFormats = tooltipOptions.dateTimeLabelFormats,
			xDateFormat = tooltipOptions.xDateFormat,
			xAxis = series.xAxis,
			isDateTime = xAxis && xAxis.options.type === 'datetime',
			headerFormat = tooltipOptions.headerFormat,
			closestPointRange = xAxis && xAxis.closestPointRange,
			n;

		// Guess the best date format based on the closest point distance (#568)
		if (isDateTime && !xDateFormat) {
			if (closestPointRange) {
				for (n in timeUnits) {
					if (timeUnits[n] >= closestPointRange) {
						xDateFormat = dateTimeLabelFormats[n];
						break;
					}
				}
			} else {
				xDateFormat = dateTimeLabelFormats.day;
			}

			xDateFormat = xDateFormat || dateTimeLabelFormats.year; // #2546, 2581

		}

		// Insert the header date format if any
		if (isDateTime && xDateFormat && isNumber(point.key)) {
			headerFormat = headerFormat.replace('{point.key}', '{point.key:' + xDateFormat + '}');
		}

		return format(headerFormat, {
			point: point,
			series: series
		});
	},

	/**
	 * Series mouse over handler
	 */
	onMouseOver: function () {
		var series = this,
			chart = series.chart,
			hoverSeries = chart.hoverSeries;

		// set normal state to previous series
		if (hoverSeries && hoverSeries !== series) {
			hoverSeries.onMouseOut();
		}

		// trigger the event, but to save processing time,
		// only if defined
		if (series.options.events.mouseOver) {
			fireEvent(series, 'mouseOver');
		}

		// hover this
		series.setState(HOVER_STATE);
		chart.hoverSeries = series;
	},

	/**
	 * Series mouse out handler
	 */
	onMouseOut: function () {
		// trigger the event only if listeners exist
		var series = this,
			options = series.options,
			chart = series.chart,
			tooltip = chart.tooltip,
			hoverPoint = chart.hoverPoint;

		// trigger mouse out on the point, which must be in this series
		if (hoverPoint) {
			hoverPoint.onMouseOut();
		}

		// fire the mouse out event
		if (series && options.events.mouseOut) {
			fireEvent(series, 'mouseOut');
		}


		// hide the tooltip
		if (tooltip && !options.stickyTracking && (!tooltip.shared || series.noSharedTooltip)) {
			tooltip.hide();
		}

		// set normal state
		series.setState();
		chart.hoverSeries = null;
	},

	/**
	 * Animate in the series
	 */
	animate: function (init) {
		var series = this,
			chart = series.chart,
			renderer = chart.renderer,
			clipRect,
			markerClipRect,
			animation = series.options.animation,
			clipBox = chart.clipBox,
			inverted = chart.inverted,
			sharedClipKey;

		// Animation option is set to true
		if (animation && !isObject(animation)) {
			animation = defaultPlotOptions[series.type].animation;
		}
		sharedClipKey = '_sharedClip' + animation.duration + animation.easing;

		// Initialize the animation. Set up the clipping rectangle.
		if (init) {

			// If a clipping rectangle with the same properties is currently present in the chart, use that.
			clipRect = chart[sharedClipKey];
			markerClipRect = chart[sharedClipKey + 'm'];
			if (!clipRect) {
				chart[sharedClipKey] = clipRect = renderer.clipRect(
					extend(clipBox, { width: 0 })
				);

				chart[sharedClipKey + 'm'] = markerClipRect = renderer.clipRect(
					-99, // include the width of the first marker
					inverted ? -chart.plotLeft : -chart.plotTop,
					99,
					inverted ? chart.chartWidth : chart.chartHeight
				);
			}
			series.group.clip(clipRect);
			series.markerGroup.clip(markerClipRect);
			series.sharedClipKey = sharedClipKey;

		// Run the animation
		} else {
			clipRect = chart[sharedClipKey];
			if (clipRect) {
				clipRect.animate({
					width: chart.plotSizeX
				}, animation);
				chart[sharedClipKey + 'm'].animate({
					width: chart.plotSizeX + 99
				}, animation);
			}

			// Delete this function to allow it only once
			series.animate = null;

			// Call the afterAnimate function on animation complete (but don't overwrite the animation.complete option
			// which should be available to the user).
			series.animationTimeout = setTimeout(function () {
				series.afterAnimate();
			}, animation.duration);
		}
	},

	/**
	 * This runs after animation to land on the final plot clipping
	 */
	afterAnimate: function () {
		var chart = this.chart,
			sharedClipKey = this.sharedClipKey,
			group = this.group;

		if (group && this.options.clip !== false) {
			group.clip(chart.clipRect);
			this.markerGroup.clip(); // no clip
		}

		// Remove the shared clipping rectancgle when all series are shown
		setTimeout(function () {
			if (sharedClipKey && chart[sharedClipKey]) {
				chart[sharedClipKey] = chart[sharedClipKey].destroy();
				chart[sharedClipKey + 'm'] = chart[sharedClipKey + 'm'].destroy();
			}
		}, 100);
	},

	/**
	 * Draw the markers
	 */
	drawPoints: function () {
		var series = this,
			pointAttr,
			points = series.points,
			chart = series.chart,
			plotX,
			plotY,
			i,
			point,
			radius,
			symbol,
			isImage,
			graphic,
			options = series.options,
			seriesMarkerOptions = options.marker,
			pointMarkerOptions,
			enabled,
			isInside,
			markerGroup = series.markerGroup;

		if (seriesMarkerOptions.enabled || series._hasPointMarkers) {

			i = points.length;
			while (i--) {
				point = points[i];
				plotX = mathFloor(point.plotX); // #1843
				plotY = point.plotY;
				graphic = point.graphic;
				pointMarkerOptions = point.marker || {};
				enabled = (seriesMarkerOptions.enabled && pointMarkerOptions.enabled === UNDEFINED) || pointMarkerOptions.enabled;
				isInside = chart.isInsidePlot(mathRound(plotX), plotY, chart.inverted); // #1858

				// only draw the point if y is defined
				if (enabled && plotY !== UNDEFINED && !isNaN(plotY) && point.y !== null) {

					// shortcuts
					pointAttr = point.pointAttr[point.selected ? SELECT_STATE : NORMAL_STATE];
					radius = pointAttr.r;
					symbol = pick(pointMarkerOptions.symbol, series.symbol);
					isImage = symbol.indexOf('url') === 0;

					if (graphic) { // update
						graphic
							.attr({ // Since the marker group isn't clipped, each individual marker must be toggled
								visibility: isInside ? (hasSVG ? 'inherit' : VISIBLE) : HIDDEN
							})
							.animate(extend({
								x: plotX - radius,
								y: plotY - radius
							}, graphic.symbolName ? { // don't apply to image symbols #507
								width: 2 * radius,
								height: 2 * radius
							} : {}));
					} else if (isInside && (radius > 0 || isImage)) {
						point.graphic = graphic = chart.renderer.symbol(
							symbol,
							plotX - radius,
							plotY - radius,
							2 * radius,
							2 * radius
						)
						.attr(pointAttr)
						.add(markerGroup);
					}

				} else if (graphic) {
					point.graphic = graphic.destroy(); // #1269
				}
			}
		}

	},

	/**
	 * Convert state properties from API naming conventions to SVG attributes
	 *
	 * @param {Object} options API options object
	 * @param {Object} base1 SVG attribute object to inherit from
	 * @param {Object} base2 Second level SVG attribute object to inherit from
	 */
	convertAttribs: function (options, base1, base2, base3) {
		var conversion = this.pointAttrToOptions,
			attr,
			option,
			obj = {};

		options = options || {};
		base1 = base1 || {};
		base2 = base2 || {};
		base3 = base3 || {};

		for (attr in conversion) {
			option = conversion[attr];
			obj[attr] = pick(options[option], base1[attr], base2[attr], base3[attr]);
		}
		return obj;
	},

	/**
	 * Get the state attributes. Each series type has its own set of attributes
	 * that are allowed to change on a point's state change. Series wide attributes are stored for
	 * all series, and additionally point specific attributes are stored for all
	 * points with individual marker options. If such options are not defined for the point,
	 * a reference to the series wide attributes is stored in point.pointAttr.
	 */
	getAttribs: function () {
		var series = this,
			seriesOptions = series.options,
			normalOptions = defaultPlotOptions[series.type].marker ? seriesOptions.marker : seriesOptions,
			stateOptions = normalOptions.states,
			stateOptionsHover = stateOptions[HOVER_STATE],
			pointStateOptionsHover,
			seriesColor = series.color,
			normalDefaults = {
				stroke: seriesColor,
				fill: seriesColor
			},
			points = series.points || [], // #927
			i,
			point,
			seriesPointAttr = [],
			pointAttr,
			pointAttrToOptions = series.pointAttrToOptions,
			hasPointSpecificOptions,
			negativeColor = seriesOptions.negativeColor,
			defaultLineColor = normalOptions.lineColor,
			defaultFillColor = normalOptions.fillColor,
			attr,
			key;

		// series type specific modifications
		if (seriesOptions.marker) { // line, spline, area, areaspline, scatter

			// if no hover radius is given, default to normal radius + 2
			stateOptionsHover.radius = stateOptionsHover.radius || normalOptions.radius + 2;
			stateOptionsHover.lineWidth = stateOptionsHover.lineWidth || normalOptions.lineWidth + 1;

		} else { // column, bar, pie

			// if no hover color is given, brighten the normal color
			stateOptionsHover.color = stateOptionsHover.color ||
				Color(stateOptionsHover.color || seriesColor)
					.brighten(stateOptionsHover.brightness).get();
		}

		// general point attributes for the series normal state
		seriesPointAttr[NORMAL_STATE] = series.convertAttribs(normalOptions, normalDefaults);

		// HOVER_STATE and SELECT_STATE states inherit from normal state except the default radius
		each([HOVER_STATE, SELECT_STATE], function (state) {
			seriesPointAttr[state] =
					series.convertAttribs(stateOptions[state], seriesPointAttr[NORMAL_STATE]);
		});

		// set it
		series.pointAttr = seriesPointAttr;


		// Generate the point-specific attribute collections if specific point
		// options are given. If not, create a referance to the series wide point
		// attributes
		i = points.length;
		while (i--) {
			point = points[i];
			normalOptions = (point.options && point.options.marker) || point.options;
			if (normalOptions && normalOptions.enabled === false) {
				normalOptions.radius = 0;
			}

			if (point.negative && negativeColor) {
				point.color = point.fillColor = negativeColor;
			}

			hasPointSpecificOptions = seriesOptions.colorByPoint || point.color; // #868

			// check if the point has specific visual options
			if (point.options) {
				for (key in pointAttrToOptions) {
					if (defined(normalOptions[pointAttrToOptions[key]])) {
						hasPointSpecificOptions = true;
					}
				}
			}

			// a specific marker config object is defined for the individual point:
			// create it's own attribute collection
			if (hasPointSpecificOptions) {
				normalOptions = normalOptions || {};
				pointAttr = [];
				stateOptions = normalOptions.states || {}; // reassign for individual point
				pointStateOptionsHover = stateOptions[HOVER_STATE] = stateOptions[HOVER_STATE] || {};

				// Handle colors for column and pies
				if (!seriesOptions.marker) { // column, bar, point
					// if no hover color is given, brighten the normal color
					pointStateOptionsHover.color =
						Color(pointStateOptionsHover.color || point.color)
							.brighten(pointStateOptionsHover.brightness ||
							stateOptionsHover.brightness).get();

				}

				// normal point state inherits series wide normal state
				attr = { color: point.color }; // #868
				if (!defaultFillColor) { // Individual point color or negative color markers (#2219)
					attr.fillColor = point.color;
				}
				if (!defaultLineColor) {
					attr.lineColor = point.color; // Bubbles take point color, line markers use white
				}
				pointAttr[NORMAL_STATE] = series.convertAttribs(extend(attr, normalOptions), seriesPointAttr[NORMAL_STATE]);

				// inherit from point normal and series hover
				pointAttr[HOVER_STATE] = series.convertAttribs(
					stateOptions[HOVER_STATE],
					seriesPointAttr[HOVER_STATE],
					pointAttr[NORMAL_STATE]
				);

				// inherit from point normal and series hover
				pointAttr[SELECT_STATE] = series.convertAttribs(
					stateOptions[SELECT_STATE],
					seriesPointAttr[SELECT_STATE],
					pointAttr[NORMAL_STATE]
				);


			// no marker config object is created: copy a reference to the series-wide
			// attribute collection
			} else {
				pointAttr = seriesPointAttr;
			}

			point.pointAttr = pointAttr;

		}
	},

	/**
	 * Clear DOM objects and free up memory
	 */
	destroy: function () {
		var series = this,
			chart = series.chart,
			issue134 = /AppleWebKit\/533/.test(userAgent),
			destroy,
			i,
			data = series.data || [],
			point,
			prop,
			axis;

		// add event hook
		fireEvent(series, 'destroy');

		// remove all events
		removeEvent(series);

		// erase from axes
		each(series.axisTypes || [], function (AXIS) {
			axis = series[AXIS];
			if (axis) {
				erase(axis.series, series);
				axis.isDirty = axis.forceRedraw = true;
			}
		});

		// remove legend items
		if (series.legendItem) {
			series.chart.legend.destroyItem(series);
		}

		// destroy all points with their elements
		i = data.length;
		while (i--) {
			point = data[i];
			if (point && point.destroy) {
				point.destroy();
			}
		}
		series.points = null;

		// Clear the animation timeout if we are destroying the series during initial animation
		clearTimeout(series.animationTimeout);

		// destroy all SVGElements associated to the series
		each(['area', 'graph', 'dataLabelsGroup', 'group', 'markerGroup', 'tracker',
				'graphNeg', 'areaNeg', 'posClip', 'negClip'], function (prop) {
			if (series[prop]) {

				// issue 134 workaround
				destroy = issue134 && prop === 'group' ?
					'hide' :
					'destroy';

				series[prop][destroy]();
			}
		});

		// remove from hoverSeries
		if (chart.hoverSeries === series) {
			chart.hoverSeries = null;
		}
		erase(chart.series, series);

		// clear all members
		for (prop in series) {
			delete series[prop];
		}
	},

	/**
	 * Return the graph path of a segment
	 */
	getSegmentPath: function (segment) {
		var series = this,
			segmentPath = [],
			step = series.options.step;

		// build the segment line
		each(segment, function (point, i) {

			var plotX = point.plotX,
				plotY = point.plotY,
				lastPoint;

			if (series.getPointSpline) { // generate the spline as defined in the SplineSeries object
				segmentPath.push.apply(segmentPath, series.getPointSpline(segment, point, i));

			} else {

				// moveTo or lineTo
				segmentPath.push(i ? L : M);

				// step line?
				if (step && i) {
					lastPoint = segment[i - 1];
					if (step === 'right') {
						segmentPath.push(
							lastPoint.plotX,
							plotY
						);

					} else if (step === 'center') {
						segmentPath.push(
							(lastPoint.plotX + plotX) / 2,
							lastPoint.plotY,
							(lastPoint.plotX + plotX) / 2,
							plotY
						);

					} else {
						segmentPath.push(
							plotX,
							lastPoint.plotY
						);
					}
				}

				// normal line to next point
				segmentPath.push(
					point.plotX,
					point.plotY
				);
			}
		});

		return segmentPath;
	},

	/**
	 * Get the graph path
	 */
	getGraphPath: function () {
		var series = this,
			graphPath = [],
			segmentPath,
			singlePoints = []; // used in drawTracker

		// Divide into segments and build graph and area paths
		each(series.segments, function (segment) {

			segmentPath = series.getSegmentPath(segment);

			// add the segment to the graph, or a single point for tracking
			if (segment.length > 1) {
				graphPath = graphPath.concat(segmentPath);
			} else {
				singlePoints.push(segment[0]);
			}
		});

		// Record it for use in drawGraph and drawTracker, and return graphPath
		series.singlePoints = singlePoints;
		series.graphPath = graphPath;

		return graphPath;

	},

	/**
	 * Draw the actual graph
	 */
	drawGraph: function () {
		var series = this,
			options = this.options,
			props = [['graph', options.lineColor || this.color]],
			lineWidth = options.lineWidth,
			dashStyle =  options.dashStyle,
			roundCap = options.linecap !== 'square',
			graphPath = this.getGraphPath(),
			negativeColor = options.negativeColor;

		if (negativeColor) {
			props.push(['graphNeg', negativeColor]);
		}

		// draw the graph
		each(props, function (prop, i) {
			var graphKey = prop[0],
				graph = series[graphKey],
				attribs;

			if (graph) {
				stop(graph); // cancel running animations, #459
				graph.animate({ d: graphPath });

			} else if (lineWidth && graphPath.length) { // #1487
				attribs = {
					stroke: prop[1],
					'stroke-width': lineWidth,
					zIndex: 1 // #1069
				};
				if (dashStyle) {
					attribs.dashstyle = dashStyle;
				} else if (roundCap) {
					attribs['stroke-linecap'] = attribs['stroke-linejoin'] = 'round';
				}

				series[graphKey] = series.chart.renderer.path(graphPath)
					.attr(attribs)
					.add(series.group)
					.shadow(!i && options.shadow);
			}
		});
	},

	/**
	 * Clip the graphs into the positive and negative coloured graphs
	 */
	clipNeg: function () {
		var options = this.options,
			chart = this.chart,
			renderer = chart.renderer,
			negativeColor = options.negativeColor || options.negativeFillColor,
			translatedThreshold,
			posAttr,
			negAttr,
			graph = this.graph,
			area = this.area,
			posClip = this.posClip,
			negClip = this.negClip,
			chartWidth = chart.chartWidth,
			chartHeight = chart.chartHeight,
			chartSizeMax = mathMax(chartWidth, chartHeight),
			yAxis = this.yAxis,
			above,
			below;

		if (negativeColor && (graph || area)) {
			translatedThreshold = mathRound(yAxis.toPixels(options.threshold || 0, true));
			if (translatedThreshold < 0) {
				chartSizeMax -= translatedThreshold; // #2534
			}
			above = {
				x: 0,
				y: 0,
				width: chartSizeMax,
				height: translatedThreshold
			};
			below = {
				x: 0,
				y: translatedThreshold,
				width: chartSizeMax,
				height: chartSizeMax
			};

			if (chart.inverted) {

				above.height = below.y = chart.plotWidth - translatedThreshold;
				if (renderer.isVML) {
					above = {
						x: chart.plotWidth - translatedThreshold - chart.plotLeft,
						y: 0,
						width: chartWidth,
						height: chartHeight
					};
					below = {
						x: translatedThreshold + chart.plotLeft - chartWidth,
						y: 0,
						width: chart.plotLeft + translatedThreshold,
						height: chartWidth
					};
				}
			}

			if (yAxis.reversed) {
				posAttr = below;
				negAttr = above;
			} else {
				posAttr = above;
				negAttr = below;
			}

			if (posClip) { // update
				posClip.animate(posAttr);
				negClip.animate(negAttr);
			} else {

				this.posClip = posClip = renderer.clipRect(posAttr);
				this.negClip = negClip = renderer.clipRect(negAttr);

				if (graph && this.graphNeg) {
					graph.clip(posClip);
					this.graphNeg.clip(negClip);
				}

				if (area) {
					area.clip(posClip);
					this.areaNeg.clip(negClip);
				}
			}
		}
	},

	/**
	 * Initialize and perform group inversion on series.group and series.markerGroup
	 */
	invertGroups: function () {
		var series = this,
			chart = series.chart;

		// Pie, go away (#1736)
		if (!series.xAxis) {
			return;
		}

		// A fixed size is needed for inversion to work
		function setInvert() {
			var size = {
				width: series.yAxis.len,
				height: series.xAxis.len
			};

			each(['group', 'markerGroup'], function (groupName) {
				if (series[groupName]) {
					series[groupName].attr(size).invert();
				}
			});
		}

		addEvent(chart, 'resize', setInvert); // do it on resize
		addEvent(series, 'destroy', function () {
			removeEvent(chart, 'resize', setInvert);
		});

		// Do it now
		setInvert(); // do it now

		// On subsequent render and redraw, just do setInvert without setting up events again
		series.invertGroups = setInvert;
	},

	/**
	 * General abstraction for creating plot groups like series.group, series.dataLabelsGroup and
	 * series.markerGroup. On subsequent calls, the group will only be adjusted to the updated plot size.
	 */
	plotGroup: function (prop, name, visibility, zIndex, parent) {
		var group = this[prop],
			isNew = !group;

		// Generate it on first call
		if (isNew) {
			this[prop] = group = this.chart.renderer.g(name)
				.attr({
					visibility: visibility,
					zIndex: zIndex || 0.1 // IE8 needs this
				})
				.add(parent);
		}
		// Place it on first and subsequent (redraw) calls
		group[isNew ? 'attr' : 'animate'](this.getPlotBox());
		return group;
	},

	/**
	 * Get the translation and scale for the plot area of this series
	 */
	getPlotBox: function () {
		return {
			translateX: this.xAxis ? this.xAxis.left : this.chart.plotLeft,
			translateY: this.yAxis ? this.yAxis.top : this.chart.plotTop,
			scaleX: 1, // #1623
			scaleY: 1
		};
	},

	/**
	 * Render the graph and markers
	 */
	render: function () {
		var series = this,
			chart = series.chart,
			group,
			options = series.options,
			animation = options.animation,
			doAnimation = animation && !!series.animate &&
				chart.renderer.isSVG, // this animation doesn't work in IE8 quirks when the group div is hidden,
				// and looks bad in other oldIE
			visibility = series.visible ? VISIBLE : HIDDEN,
			zIndex = options.zIndex,
			hasRendered = series.hasRendered,
			chartSeriesGroup = chart.seriesGroup;

		// the group
		group = series.plotGroup(
			'group',
			'series',
			visibility,
			zIndex,
			chartSeriesGroup
		);

		series.markerGroup = series.plotGroup(
			'markerGroup',
			'markers',
			visibility,
			zIndex,
			chartSeriesGroup
		);

		// initiate the animation
		if (doAnimation) {
			series.animate(true);
		}

		// cache attributes for shapes
		series.getAttribs();

		// SVGRenderer needs to know this before drawing elements (#1089, #1795)
		group.inverted = series.isCartesian ? chart.inverted : false;

		// draw the graph if any
		if (series.drawGraph) {
			series.drawGraph();
			series.clipNeg();
		}

		// draw the data labels (inn pies they go before the points)
		if (series.drawDataLabels) {
			series.drawDataLabels();
		}

		// draw the points
		if (series.visible) {
			series.drawPoints();
		}


		// draw the mouse tracking area
		if (series.options.enableMouseTracking !== false) {
			series.drawTracker();
		}

		// Handle inverted series and tracker groups
		if (chart.inverted) {
			series.invertGroups();
		}

		// Initial clipping, must be defined after inverting groups for VML
		if (options.clip !== false && !series.sharedClipKey && !hasRendered) {
			group.clip(chart.clipRect);
		}

		// Run the animation
		if (doAnimation) {
			series.animate();
		} else if (!hasRendered) {
			series.afterAnimate();
		}

		series.isDirty = series.isDirtyData = false; // means data is in accordance with what you see
		// (See #322) series.isDirty = series.isDirtyData = false; // means data is in accordance with what you see
		series.hasRendered = true;
	},

	/**
	 * Redraw the series after an update in the axes.
	 */
	redraw: function () {
		var series = this,
			chart = series.chart,
			wasDirtyData = series.isDirtyData, // cache it here as it is set to false in render, but used after
			group = series.group,
			xAxis = series.xAxis,
			yAxis = series.yAxis;

		// reposition on resize
		if (group) {
			if (chart.inverted) {
				group.attr({
					width: chart.plotWidth,
					height: chart.plotHeight
				});
			}

			group.animate({
				translateX: pick(xAxis && xAxis.left, chart.plotLeft),
				translateY: pick(yAxis && yAxis.top, chart.plotTop)
			});
		}

		series.translate();
		series.setTooltipPoints(true);

		series.render();
		if (wasDirtyData) {
			fireEvent(series, 'updatedData');
		}
	},

	/**
	 * Set the state of the graph
	 */
	setState: function (state) {
		var series = this,
			options = series.options,
			graph = series.graph,
			graphNeg = series.graphNeg,
			stateOptions = options.states,
			lineWidth = options.lineWidth,
			attribs;

		state = state || NORMAL_STATE;

		if (series.state !== state) {
			series.state = state;

			if (stateOptions[state] && stateOptions[state].enabled === false) {
				return;
			}

			if (state) {
				lineWidth = stateOptions[state].lineWidth || lineWidth + 1;
			}

			if (graph && !graph.dashstyle) { // hover is turned off for dashed lines in VML
				attribs = {
					'stroke-width': lineWidth
				};
				// use attr because animate will cause any other animation on the graph to stop
				graph.attr(attribs);
				if (graphNeg) {
					graphNeg.attr(attribs);
				}
			}
		}
	},

	/**
	 * Set the visibility of the graph
	 *
	 * @param vis {Boolean} True to show the series, false to hide. If UNDEFINED,
	 *        the visibility is toggled.
	 */
	setVisible: function (vis, redraw) {
		var series = this,
			chart = series.chart,
			legendItem = series.legendItem,
			showOrHide,
			ignoreHiddenSeries = chart.options.chart.ignoreHiddenSeries,
			oldVisibility = series.visible;

		// if called without an argument, toggle visibility
		series.visible = vis = series.userOptions.visible = vis === UNDEFINED ? !oldVisibility : vis;
		showOrHide = vis ? 'show' : 'hide';

		// show or hide elements
		each(['group', 'dataLabelsGroup', 'markerGroup', 'tracker'], function (key) {
			if (series[key]) {
				series[key][showOrHide]();
			}
		});


		// hide tooltip (#1361)
		if (chart.hoverSeries === series) {
			series.onMouseOut();
		}


		if (legendItem) {
			chart.legend.colorizeItem(series, vis);
		}


		// rescale or adapt to resized chart
		series.isDirty = true;
		// in a stack, all other series are affected
		if (series.options.stacking) {
			each(chart.series, function (otherSeries) {
				if (otherSeries.options.stacking && otherSeries.visible) {
					otherSeries.isDirty = true;
				}
			});
		}

		// show or hide linked series
		each(series.linkedSeries, function (otherSeries) {
			otherSeries.setVisible(vis, false);
		});

		if (ignoreHiddenSeries) {
			chart.isDirtyBox = true;
		}
		if (redraw !== false) {
			chart.redraw();
		}

		fireEvent(series, showOrHide);
	},

	/**
	 * Show the graph
	 */
	show: function () {
		this.setVisible(true);
	},

	/**
	 * Hide the graph
	 */
	hide: function () {
		this.setVisible(false);
	},


	/**
	 * Set the selected state of the graph
	 *
	 * @param selected {Boolean} True to select the series, false to unselect. If
	 *        UNDEFINED, the selection state is toggled.
	 */
	select: function (selected) {
		var series = this;
		// if called without an argument, toggle
		series.selected = selected = (selected === UNDEFINED) ? !series.selected : selected;

		if (series.checkbox) {
			series.checkbox.checked = selected;
		}

		fireEvent(series, selected ? 'select' : 'unselect');
	},

	drawTracker: TrackerMixin.drawTrackerGraph

}; // end Series prototype

// Extend the Chart prototype for dynamic methods
extend(Chart.prototype, {

	/**
	 * Add a series dynamically after  time
	 *
	 * @param {Object} options The config options
	 * @param {Boolean} redraw Whether to redraw the chart after adding. Defaults to true.
	 * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
	 *    configuration
	 *
	 * @return {Object} series The newly created series object
	 */
	addSeries: function (options, redraw, animation) {
		var series,
			chart = this;

		if (options) {
			redraw = pick(redraw, true); // defaults to true

			fireEvent(chart, 'addSeries', { options: options }, function () {
				series = chart.initSeries(options);

				chart.isDirtyLegend = true; // the series array is out of sync with the display
				chart.linkSeries();
				if (redraw) {
					chart.redraw(animation);
				}
			});
		}

		return series;
	},

	/**
     * Add an axis to the chart
     * @param {Object} options The axis option
     * @param {Boolean} isX Whether it is an X axis or a value axis
     */
	addAxis: function (options, isX, redraw, animation) {
		var key = isX ? 'xAxis' : 'yAxis',
			chartOptions = this.options,
			axis;

		/*jslint unused: false*/
		axis = new Axis(this, merge(options, {
			index: this[key].length,
			isX: isX
		}));
		/*jslint unused: true*/

		// Push the new axis options to the chart options
		chartOptions[key] = splat(chartOptions[key] || {});
		chartOptions[key].push(options);

		if (pick(redraw, true)) {
			this.redraw(animation);
		}
	},

	/**
	 * Dim the chart and show a loading text or symbol
	 * @param {String} str An optional text to show in the loading label instead of the default one
	 */
	showLoading: function (str) {
		var chart = this,
			options = chart.options,
			loadingDiv = chart.loadingDiv;

		var loadingOptions = options.loading;

		// create the layer at the first call
		if (!loadingDiv) {
			chart.loadingDiv = loadingDiv = createElement(DIV, {
				className: PREFIX + 'loading'
			}, extend(loadingOptions.style, {
				zIndex: 10,
				display: NONE
			}), chart.container);

			chart.loadingSpan = createElement(
				'span',
				null,
				loadingOptions.labelStyle,
				loadingDiv
			);

		}

		// update text
		chart.loadingSpan.innerHTML = str || options.lang.loading;

		// show it
		if (!chart.loadingShown) {
			css(loadingDiv, {
				opacity: 0,
				display: '',
				left: chart.plotLeft + PX,
				top: chart.plotTop + PX,
				width: chart.plotWidth + PX,
				height: chart.plotHeight + PX
			});
			animate(loadingDiv, {
				opacity: loadingOptions.style.opacity
			}, {
				duration: loadingOptions.showDuration || 0
			});
			chart.loadingShown = true;
		}
	},

	/**
	 * Hide the loading layer
	 */
	hideLoading: function () {
		var options = this.options,
			loadingDiv = this.loadingDiv;

		if (loadingDiv) {
			animate(loadingDiv, {
				opacity: 0
			}, {
				duration: options.loading.hideDuration || 100,
				complete: function () {
					css(loadingDiv, { display: NONE });
				}
			});
		}
		this.loadingShown = false;
	}
});

// extend the Point prototype for dynamic methods
extend(Point.prototype, {
	/**
	 * Update the point with new options (typically x/y data) and optionally redraw the series.
	 *
	 * @param {Object} options Point options as defined in the series.data array
	 * @param {Boolean} redraw Whether to redraw the chart or wait for an explicit call
	 * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
	 *    configuration
	 *
	 */
	update: function (options, redraw, animation) {
		var point = this,
			series = point.series,
			graphic = point.graphic,
			i,
			data = series.data,
			chart = series.chart,
			seriesOptions = series.options;

		redraw = pick(redraw, true);

		// fire the event with a default handler of doing the update
		point.firePointEvent('update', { options: options }, function () {

			point.applyOptions(options);

			// update visuals
			if (isObject(options)) {
				series.getAttribs();
				if (graphic) {
					if (options && options.marker && options.marker.symbol) {
						point.graphic = graphic.destroy();
					} else {
						graphic.attr(point.pointAttr[point.state || '']);
					}
				}
				if (options && options.dataLabels && point.dataLabel) { // #2468
					point.dataLabel = point.dataLabel.destroy();
				}
			}

			// record changes in the parallel arrays
			i = inArray(point, data);
			series.updateParallelArrays(point, i);

			seriesOptions.data[i] = point.options;

			// redraw
			series.isDirty = series.isDirtyData = true;
			if (!series.fixedBox && series.hasCartesianSeries) { // #1906, #2320
				chart.isDirtyBox = true;
			}

			if (seriesOptions.legendType === 'point') { // #1831, #1885
				chart.legend.destroyItem(point);
			}
			if (redraw) {
				chart.redraw(animation);
			}
		});
	},

	/**
	 * Remove a point and optionally redraw the series and if necessary the axes
	 * @param {Boolean} redraw Whether to redraw the chart or wait for an explicit call
	 * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
	 *    configuration
	 */
	remove: function (redraw, animation) {
		var point = this,
			series = point.series,
			points = series.points,
			chart = series.chart,
			i,
			data = series.data;

		setAnimation(animation, chart);
		redraw = pick(redraw, true);

		// fire the event with a default handler of removing the point
		point.firePointEvent('remove', null, function () {

			// splice all the parallel arrays
			i = inArray(point, data);
			if (data.length === points.length) {
				points.splice(i, 1);
			}
			data.splice(i, 1);
			series.options.data.splice(i, 1);
			series.updateParallelArrays(point, 'splice', i, 1);

			point.destroy();

			// redraw
			series.isDirty = true;
			series.isDirtyData = true;
			if (redraw) {
				chart.redraw();
			}
		});
	}
});

// Extend the series prototype for dynamic methods
extend(Series.prototype, {
	/**
	 * Add a point dynamically after chart load time
	 * @param {Object} options Point options as given in series.data
	 * @param {Boolean} redraw Whether to redraw the chart or wait for an explicit call
	 * @param {Boolean} shift If shift is true, a point is shifted off the start
	 *    of the series as one is appended to the end.
	 * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
	 *    configuration
	 */
	addPoint: function (options, redraw, shift, animation) {
		var series = this,
			seriesOptions = series.options,
			data = series.data,
			graph = series.graph,
			area = series.area,
			chart = series.chart,
			names = series.xAxis && series.xAxis.names,
			currentShift = (graph && graph.shift) || 0,
			dataOptions = seriesOptions.data,
			point,
			isInTheMiddle,
			xData = series.xData,
			x,
			i;

		setAnimation(animation, chart);

		// Make graph animate sideways
		if (shift) {
			each([graph, area, series.graphNeg, series.areaNeg], function (shape) {
				if (shape) {
					shape.shift = currentShift + 1;
				}
			});
		}
		if (area) {
			area.isArea = true; // needed in animation, both with and without shift
		}

		// Optional redraw, defaults to true
		redraw = pick(redraw, true);

		// Get options and push the point to xData, yData and series.options. In series.generatePoints
		// the Point instance will be created on demand and pushed to the series.data array.
		point = { series: series };
		series.pointClass.prototype.applyOptions.apply(point, [options]);
		x = point.x;

		// Get the insertion point
		i = xData.length;
		if (series.requireSorting && x < xData[i - 1]) {
			isInTheMiddle = true;
			while (i && xData[i - 1] > x) {
				i--;
			}
		}

		series.updateParallelArrays(point, 'splice', i, 0, 0); // insert undefined item
		series.updateParallelArrays(point, i); // update it

		if (names) {
			names[x] = point.name;
		}
		dataOptions.splice(i, 0, options);

		if (isInTheMiddle) {
			series.data.splice(i, 0, null);
			series.processData();
		}

		// Generate points to be added to the legend (#1329)
		if (seriesOptions.legendType === 'point') {
			series.generatePoints();
		}

		// Shift the first point off the parallel arrays
		// todo: consider series.removePoint(i) method
		if (shift) {
			if (data[0] && data[0].remove) {
				data[0].remove(false);
			} else {
				data.shift();
				series.updateParallelArrays(point, 'shift');

				dataOptions.shift();
			}
		}

		// redraw
		series.isDirty = true;
		series.isDirtyData = true;
		if (redraw) {
			series.getAttribs(); // #1937
			chart.redraw();
		}
	},

	/**
	 * Remove a series and optionally redraw the chart
	 *
	 * @param {Boolean} redraw Whether to redraw the chart or wait for an explicit call
	 * @param {Boolean|Object} animation Whether to apply animation, and optionally animation
	 *    configuration
	 */

	remove: function (redraw, animation) {
		var series = this,
			chart = series.chart;
		redraw = pick(redraw, true);

		if (!series.isRemoving) {  /* prevent triggering native event in jQuery
				(calling the remove function from the remove event) */
			series.isRemoving = true;

			// fire the event with a default handler of removing the point
			fireEvent(series, 'remove', null, function () {


				// destroy elements
				series.destroy();


				// redraw
				chart.isDirtyLegend = chart.isDirtyBox = true;
				chart.linkSeries();

				if (redraw) {
					chart.redraw(animation);
				}
			});

		}
		series.isRemoving = false;
	},

	/**
	 * Update the series with a new set of options
	 */
	update: function (newOptions, redraw) {
		var chart = this.chart,
			// must use user options when changing type because this.options is merged
			// in with type specific plotOptions
			oldOptions = this.userOptions,
			oldType = this.type,
			proto = seriesTypes[oldType].prototype,
			n;

		// Do the merge, with some forced options
		newOptions = merge(oldOptions, {
			animation: false,
			index: this.index,
			pointStart: this.xData[0] // when updating after addPoint
		}, { data: this.options.data }, newOptions);

		// Destroy the series and reinsert methods from the type prototype
		this.remove(false);
		for (n in proto) { // Overwrite series-type specific methods (#2270)
			if (proto.hasOwnProperty(n)) {
				this[n] = UNDEFINED;
			}
		}
		extend(this, seriesTypes[newOptions.type || oldType].prototype);


		this.init(chart, newOptions);
		if (pick(redraw, true)) {
			chart.redraw(false);
		}
	}
});

// Extend the Axis.prototype for dynamic methods
extend(Axis.prototype, {

	/**
	 * Update the axis with a new options structure
	 */
	update: function (newOptions, redraw) {
		var chart = this.chart;

		newOptions = chart.options[this.coll][this.options.index] = merge(this.userOptions, newOptions);

		this.destroy(true);
		this._addedPlotLB = this.userMin = this.userMax = UNDEFINED; // #1611, #2306

		this.init(chart, extend(newOptions, { events: UNDEFINED }));

		chart.isDirtyBox = true;
		if (pick(redraw, true)) {
			chart.redraw();
		}
	},

	/**
     * Remove the axis from the chart
     */
	remove: function (redraw) {
		var chart = this.chart,
			key = this.coll; // xAxis or yAxis

		// Remove associated series
		each(this.series, function (series) {
			series.remove(false);
		});

		// Remove the axis
		erase(chart.axes, this);
		erase(chart[key], this);
		chart.options[key].splice(this.options.index, 1);
		each(chart[key], function (axis, i) { // Re-index, #1706
			axis.options.index = i;
		});
		this.destroy();
		chart.isDirtyBox = true;

		if (pick(redraw, true)) {
			chart.redraw();
		}
	},

	/**
	 * Update the axis title by options
	 */
	setTitle: function (newTitleOptions, redraw) {
		this.update({ title: newTitleOptions }, redraw);
	},

	/**
	 * Set new axis categories and optionally redraw
	 * @param {Array} categories
	 * @param {Boolean} redraw
	 */
	setCategories: function (categories, redraw) {
		this.update({ categories: categories }, redraw);
	}

});


/**
 * LineSeries object
 */
var LineSeries = extendClass(Series);
seriesTypes.line = LineSeries;

/**
 * Set the default options for area
 */
defaultPlotOptions.area = merge(defaultSeriesOptions, {
	threshold: 0
	// trackByArea: false,
	// lineColor: null, // overrides color, but lets fillColor be unaltered
	// fillOpacity: 0.75,
	// fillColor: null
});

/**
 * AreaSeries object
 */
var AreaSeries = extendClass(Series, {
	type: 'area',
	/**
	 * For stacks, don't split segments on null values. Instead, draw null values with 
	 * no marker. Also insert dummy points for any X position that exists in other series
	 * in the stack.
	 */ 
	getSegments: function () {
		var segments = [],
			segment = [],
			keys = [],
			xAxis = this.xAxis,
			yAxis = this.yAxis,
			stack = yAxis.stacks[this.stackKey],
			pointMap = {},
			plotX,
			plotY,
			points = this.points,
			connectNulls = this.options.connectNulls,
			val,
			i,
			x;

		if (this.options.stacking && !this.cropped) { // cropped causes artefacts in Stock, and perf issue
			// Create a map where we can quickly look up the points by their X value.
			for (i = 0; i < points.length; i++) {
				pointMap[points[i].x] = points[i];
			}

			// Sort the keys (#1651)
			for (x in stack) {
				if (stack[x].total !== null) { // nulled after switching between grouping and not (#1651, #2336)
					keys.push(+x);
				}
			}
			keys.sort(function (a, b) {
				return a - b;
			});

			each(keys, function (x) {
				if (connectNulls && (!pointMap[x] || pointMap[x].y === null)) { // #1836
					return;

				// The point exists, push it to the segment
				} else if (pointMap[x]) {
					segment.push(pointMap[x]);

				// There is no point for this X value in this series, so we 
				// insert a dummy point in order for the areas to be drawn
				// correctly.
				} else {
					plotX = xAxis.translate(x);
					val = stack[x].percent ? (stack[x].total ? stack[x].cum * 100 / stack[x].total : 0) : stack[x].cum; // #1991
					plotY = yAxis.toPixels(val, true);
					segment.push({ 
						y: null, 
						plotX: plotX,
						clientX: plotX, 
						plotY: plotY, 
						yBottom: plotY,
						onMouseOver: noop
					});
				}
			});

			if (segment.length) {
				segments.push(segment);
			}

		} else {
			Series.prototype.getSegments.call(this);
			segments = this.segments;
		}

		this.segments = segments;
	},
	
	/**
	 * Extend the base Series getSegmentPath method by adding the path for the area.
	 * This path is pushed to the series.areaPath property.
	 */
	getSegmentPath: function (segment) {
		
		var segmentPath = Series.prototype.getSegmentPath.call(this, segment), // call base method
			areaSegmentPath = [].concat(segmentPath), // work on a copy for the area path
			i,
			options = this.options,
			segLength = segmentPath.length,
			translatedThreshold = this.yAxis.getThreshold(options.threshold), // #2181
			yBottom;
		
		if (segLength === 3) { // for animation from 1 to two points
			areaSegmentPath.push(L, segmentPath[1], segmentPath[2]);
		}
		if (options.stacking && !this.closedStacks) {
			
			// Follow stack back. Todo: implement areaspline. A general solution could be to 
			// reverse the entire graphPath of the previous series, though may be hard with
			// splines and with series with different extremes
			for (i = segment.length - 1; i >= 0; i--) {

				yBottom = pick(segment[i].yBottom, translatedThreshold);
			
				// step line?
				if (i < segment.length - 1 && options.step) {
					areaSegmentPath.push(segment[i + 1].plotX, yBottom);
				}
				
				areaSegmentPath.push(segment[i].plotX, yBottom);
			}

		} else { // follow zero line back
			this.closeSegment(areaSegmentPath, segment, translatedThreshold);
		}
		this.areaPath = this.areaPath.concat(areaSegmentPath);
		return segmentPath;
	},
	
	/**
	 * Extendable method to close the segment path of an area. This is overridden in polar 
	 * charts.
	 */
	closeSegment: function (path, segment, translatedThreshold) {
		path.push(
			L,
			segment[segment.length - 1].plotX,
			translatedThreshold,
			L,
			segment[0].plotX,
			translatedThreshold
		);
	},
	
	/**
	 * Draw the graph and the underlying area. This method calls the Series base
	 * function and adds the area. The areaPath is calculated in the getSegmentPath
	 * method called from Series.prototype.drawGraph.
	 */
	drawGraph: function () {
		
		// Define or reset areaPath
		this.areaPath = [];
		
		// Call the base method
		Series.prototype.drawGraph.apply(this);
		
		// Define local variables
		var series = this,
			areaPath = this.areaPath,
			options = this.options,
			negativeColor = options.negativeColor,
			negativeFillColor = options.negativeFillColor,
			props = [['area', this.color, options.fillColor]]; // area name, main color, fill color
		
		if (negativeColor || negativeFillColor) {
			props.push(['areaNeg', negativeColor, negativeFillColor]);
		}
		
		each(props, function (prop) {
			var areaKey = prop[0],
				area = series[areaKey];
				
			// Create or update the area
			if (area) { // update
				area.animate({ d: areaPath });
	
			} else { // create
				series[areaKey] = series.chart.renderer.path(areaPath)
					.attr({
						fill: pick(
							prop[2],
							Color(prop[1]).setOpacity(pick(options.fillOpacity, 0.75)).get()
						),
						zIndex: 0 // #1069
					}).add(series.group);
			}
		});
	},

	drawLegendSymbol: LegendSymbolMixin.drawRectangle
});

seriesTypes.area = AreaSeries;
/**
 * Set the default options for spline
 */
defaultPlotOptions.spline = merge(defaultSeriesOptions);

/**
 * SplineSeries object
 */
var SplineSeries = extendClass(Series, {
	type: 'spline',

	/**
	 * Get the spline segment from a given point's previous neighbour to the given point
	 */
	getPointSpline: function (segment, point, i) {
		var smoothing = 1.5, // 1 means control points midway between points, 2 means 1/3 from the point, 3 is 1/4 etc
			denom = smoothing + 1,
			plotX = point.plotX,
			plotY = point.plotY,
			lastPoint = segment[i - 1],
			nextPoint = segment[i + 1],
			leftContX,
			leftContY,
			rightContX,
			rightContY,
			ret;

		// find control points
		if (lastPoint && nextPoint) {
		
			var lastX = lastPoint.plotX,
				lastY = lastPoint.plotY,
				nextX = nextPoint.plotX,
				nextY = nextPoint.plotY,
				correction;

			leftContX = (smoothing * plotX + lastX) / denom;
			leftContY = (smoothing * plotY + lastY) / denom;
			rightContX = (smoothing * plotX + nextX) / denom;
			rightContY = (smoothing * plotY + nextY) / denom;

			// have the two control points make a straight line through main point
			correction = ((rightContY - leftContY) * (rightContX - plotX)) /
				(rightContX - leftContX) + plotY - rightContY;

			leftContY += correction;
			rightContY += correction;

			// to prevent false extremes, check that control points are between
			// neighbouring points' y values
			if (leftContY > lastY && leftContY > plotY) {
				leftContY = mathMax(lastY, plotY);
				rightContY = 2 * plotY - leftContY; // mirror of left control point
			} else if (leftContY < lastY && leftContY < plotY) {
				leftContY = mathMin(lastY, plotY);
				rightContY = 2 * plotY - leftContY;
			}
			if (rightContY > nextY && rightContY > plotY) {
				rightContY = mathMax(nextY, plotY);
				leftContY = 2 * plotY - rightContY;
			} else if (rightContY < nextY && rightContY < plotY) {
				rightContY = mathMin(nextY, plotY);
				leftContY = 2 * plotY - rightContY;
			}

			// record for drawing in next point
			point.rightContX = rightContX;
			point.rightContY = rightContY;

		}
		
		// Visualize control points for debugging
		/*
		if (leftContX) {
			this.chart.renderer.circle(leftContX + this.chart.plotLeft, leftContY + this.chart.plotTop, 2)
				.attr({
					stroke: 'red',
					'stroke-width': 1,
					fill: 'none'
				})
				.add();
			this.chart.renderer.path(['M', leftContX + this.chart.plotLeft, leftContY + this.chart.plotTop,
				'L', plotX + this.chart.plotLeft, plotY + this.chart.plotTop])
				.attr({
					stroke: 'red',
					'stroke-width': 1
				})
				.add();
			this.chart.renderer.circle(rightContX + this.chart.plotLeft, rightContY + this.chart.plotTop, 2)
				.attr({
					stroke: 'green',
					'stroke-width': 1,
					fill: 'none'
				})
				.add();
			this.chart.renderer.path(['M', rightContX + this.chart.plotLeft, rightContY + this.chart.plotTop,
				'L', plotX + this.chart.plotLeft, plotY + this.chart.plotTop])
				.attr({
					stroke: 'green',
					'stroke-width': 1
				})
				.add();
		}
		*/

		// moveTo or lineTo
		if (!i) {
			ret = [M, plotX, plotY];
		} else { // curve from last point to this
			ret = [
				'C',
				lastPoint.rightContX || lastPoint.plotX,
				lastPoint.rightContY || lastPoint.plotY,
				leftContX || plotX,
				leftContY || plotY,
				plotX,
				plotY
			];
			lastPoint.rightContX = lastPoint.rightContY = null; // reset for updating series later
		}
		return ret;
	}
});
seriesTypes.spline = SplineSeries;

/**
 * Set the default options for areaspline
 */
defaultPlotOptions.areaspline = merge(defaultPlotOptions.area);

/**
 * AreaSplineSeries object
 */
var areaProto = AreaSeries.prototype,
	AreaSplineSeries = extendClass(SplineSeries, {
		type: 'areaspline',
		closedStacks: true, // instead of following the previous graph back, follow the threshold back
		
		// Mix in methods from the area series
		getSegmentPath: areaProto.getSegmentPath,
		closeSegment: areaProto.closeSegment,
		drawGraph: areaProto.drawGraph,
		drawLegendSymbol: LegendSymbolMixin.drawRectangle
	});

seriesTypes.areaspline = AreaSplineSeries;

/**
 * Set the default options for column
 */
defaultPlotOptions.column = merge(defaultSeriesOptions, {
	borderColor: '#FFFFFF',
	borderWidth: 1,
	borderRadius: 0,
	//colorByPoint: undefined,
	groupPadding: 0.2,
	//grouping: true,
	marker: null, // point options are specified in the base options
	pointPadding: 0.1,
	//pointWidth: null,
	minPointLength: 0,
	cropThreshold: 50, // when there are more points, they will not animate out of the chart on xAxis.setExtremes
	pointRange: null, // null means auto, meaning 1 in a categorized axis and least distance between points if not categories
	states: {
		hover: {
			brightness: 0.1,
			shadow: false
		},
		select: {
			color: '#C0C0C0',
			borderColor: '#000000',
			shadow: false
		}
	},
	dataLabels: {
		align: null, // auto
		verticalAlign: null, // auto
		y: null
	},
	stickyTracking: false,
	threshold: 0
});

/**
 * ColumnSeries object
 */
var ColumnSeries = extendClass(Series, {
	type: 'column',
	pointAttrToOptions: { // mapping between SVG attributes and the corresponding options
		stroke: 'borderColor',
		'stroke-width': 'borderWidth',
		fill: 'color',
		r: 'borderRadius'
	},
	cropShoulder: 0,
	trackerGroups: ['group', 'dataLabelsGroup'],
	negStacks: true, // use separate negative stacks, unlike area stacks where a negative 
		// point is substracted from previous (#1910)
	
	/**
	 * Initialize the series
	 */
	init: function () {
		Series.prototype.init.apply(this, arguments);

		var series = this,
			chart = series.chart;

		// if the series is added dynamically, force redraw of other
		// series affected by a new column
		if (chart.hasRendered) {
			each(chart.series, function (otherSeries) {
				if (otherSeries.type === series.type) {
					otherSeries.isDirty = true;
				}
			});
		}
	},

	/**
	 * Return the width and x offset of the columns adjusted for grouping, groupPadding, pointPadding,
	 * pointWidth etc. 
	 */
	getColumnMetrics: function () {

		var series = this,
			options = series.options,
			xAxis = series.xAxis,
			yAxis = series.yAxis,
			reversedXAxis = xAxis.reversed,
			stackKey,
			stackGroups = {},
			columnIndex,
			columnCount = 0;

		// Get the total number of column type series.
		// This is called on every series. Consider moving this logic to a
		// chart.orderStacks() function and call it on init, addSeries and removeSeries
		if (options.grouping === false) {
			columnCount = 1;
		} else {
			each(series.chart.series, function (otherSeries) {
				var otherOptions = otherSeries.options,
					otherYAxis = otherSeries.yAxis;
				if (otherSeries.type === series.type && otherSeries.visible &&
						yAxis.len === otherYAxis.len && yAxis.pos === otherYAxis.pos) {  // #642, #2086
					if (otherOptions.stacking) {
						stackKey = otherSeries.stackKey;
						if (stackGroups[stackKey] === UNDEFINED) {
							stackGroups[stackKey] = columnCount++;
						}
						columnIndex = stackGroups[stackKey];
					} else if (otherOptions.grouping !== false) { // #1162
						columnIndex = columnCount++;
					}
					otherSeries.columnIndex = columnIndex;
				}
			});
		}

		var categoryWidth = mathMin(
				mathAbs(xAxis.transA) * (xAxis.ordinalSlope || options.pointRange || xAxis.closestPointRange || 1), 
				xAxis.len // #1535
			),
			groupPadding = categoryWidth * options.groupPadding,
			groupWidth = categoryWidth - 2 * groupPadding,
			pointOffsetWidth = groupWidth / columnCount,
			optionPointWidth = options.pointWidth,
			pointPadding = defined(optionPointWidth) ? (pointOffsetWidth - optionPointWidth) / 2 :
				pointOffsetWidth * options.pointPadding,
			pointWidth = pick(optionPointWidth, pointOffsetWidth - 2 * pointPadding), // exact point width, used in polar charts
			colIndex = (reversedXAxis ? 
				columnCount - (series.columnIndex || 0) : // #1251
				series.columnIndex) || 0,
			pointXOffset = pointPadding + (groupPadding + colIndex *
				pointOffsetWidth - (categoryWidth / 2)) *
				(reversedXAxis ? -1 : 1);

		// Save it for reading in linked series (Error bars particularly)
		return (series.columnMetrics = { 
			width: pointWidth, 
			offset: pointXOffset 
		});
			
	},

	/**
	 * Translate each point to the plot area coordinate system and find shape positions
	 */
	translate: function () {
		var series = this,
			chart = series.chart,
			options = series.options,
			borderWidth = options.borderWidth,
			yAxis = series.yAxis,
			threshold = options.threshold,
			translatedThreshold = series.translatedThreshold = yAxis.getThreshold(threshold),
			minPointLength = pick(options.minPointLength, 5),
			metrics = series.getColumnMetrics(),
			pointWidth = metrics.width,
			seriesBarW = series.barW = mathCeil(mathMax(pointWidth, 1 + 2 * borderWidth)), // rounded and postprocessed for border width
			pointXOffset = series.pointXOffset = metrics.offset,
			xCrisp = -(borderWidth % 2 ? 0.5 : 0),
			yCrisp = borderWidth % 2 ? 0.5 : 1;

		if (chart.renderer.isVML && chart.inverted) {
			yCrisp += 1;
		}

		Series.prototype.translate.apply(series);

		// record the new values
		each(series.points, function (point) {
			var yBottom = pick(point.yBottom, translatedThreshold),
				plotY = mathMin(mathMax(-999 - yBottom, point.plotY), yAxis.len + 999 + yBottom), // Don't draw too far outside plot area (#1303, #2241)
				barX = point.plotX + pointXOffset,
				barW = seriesBarW,
				barY = mathMin(plotY, yBottom),
				right,
				bottom,
				fromTop,
				fromLeft,
				barH = mathMax(plotY, yBottom) - barY;

			// Handle options.minPointLength
			if (mathAbs(barH) < minPointLength) {
				if (minPointLength) {
					barH = minPointLength;
					barY =
						mathRound(mathAbs(barY - translatedThreshold) > minPointLength ? // stacked
							yBottom - minPointLength : // keep position
							translatedThreshold - (yAxis.translate(point.y, 0, 1, 0, 1) <= translatedThreshold ? minPointLength : 0)); // use exact yAxis.translation (#1485)
				}
			}

			// Cache for access in polar
			point.barX = barX;
			point.pointWidth = pointWidth;


			// Round off to obtain crisp edges
			fromLeft = mathAbs(barX) < 0.5;
			right = mathRound(barX + barW) + xCrisp;
			barX = mathRound(barX) + xCrisp;
			barW = right - barX;

			fromTop = mathAbs(barY) < 0.5;
			bottom = mathRound(barY + barH) + yCrisp;
			barY = mathRound(barY) + yCrisp;
			barH = bottom - barY;

			// Top and left edges are exceptions
			if (fromLeft) {
				barX += 1;
				barW -= 1;
			}
			if (fromTop) {
				barY -= 1;
				barH += 1;
			}

			// Register shape type and arguments to be used in drawPoints
			point.shapeType = 'rect';
			point.shapeArgs = {
				x: barX,
				y: barY,
				width: barW,
				height: barH
			};
		});

	},

	getSymbol: noop,
	
	/**
	 * Use a solid rectangle like the area series types
	 */
	drawLegendSymbol: LegendSymbolMixin.drawRectangle,
	
	
	/**
	 * Columns have no graph
	 */
	drawGraph: noop,

	/**
	 * Draw the columns. For bars, the series.group is rotated, so the same coordinates
	 * apply for columns and bars. This method is inherited by scatter series.
	 *
	 */
	drawPoints: function () {
		var series = this,
			chart = this.chart,
			options = series.options,
			renderer = chart.renderer,
			animationLimit = chart.options.animationLimit || 250,
			shapeArgs;

		// draw the columns
		each(series.points, function (point) {
			var plotY = point.plotY,
				graphic = point.graphic;

			if (plotY !== UNDEFINED && !isNaN(plotY) && point.y !== null) {
				shapeArgs = point.shapeArgs;
				
				if (graphic) { // update
					stop(graphic);
					graphic[chart.pointCount < animationLimit ? 'animate' : 'attr'](merge(shapeArgs));

				} else {
					point.graphic = graphic = renderer[point.shapeType](shapeArgs)
						.attr(point.pointAttr[point.selected ? SELECT_STATE : NORMAL_STATE])
						.add(series.group)
						.shadow(options.shadow, null, options.stacking && !options.borderRadius);
				}

			} else if (graphic) {
				point.graphic = graphic.destroy(); // #1269
			}
		});
	},

	/**
	 * Add tracking event listener to the series group, so the point graphics
	 * themselves act as trackers
	 */
	drawTracker: TrackerMixin.drawTrackerPoint,

	/**
	 * Animate the column heights one by one from zero
	 * @param {Boolean} init Whether to initialize the animation or run it
	 */
	animate: function (init) {
		var series = this,
			yAxis = this.yAxis,
			options = series.options,
			inverted = this.chart.inverted,
			attr = {},
			translatedThreshold;

		if (hasSVG) { // VML is too slow anyway
			if (init) {
				attr.scaleY = 0.001;
				translatedThreshold = mathMin(yAxis.pos + yAxis.len, mathMax(yAxis.pos, yAxis.toPixels(options.threshold)));
				if (inverted) {
					attr.translateX = translatedThreshold - yAxis.len;
				} else {
					attr.translateY = translatedThreshold;
				}
				series.group.attr(attr);

			} else { // run the animation
				
				attr.scaleY = 1;
				attr[inverted ? 'translateX' : 'translateY'] = yAxis.pos;
				series.group.animate(attr, series.options.animation);

				// delete this function to allow it only once
				series.animate = null;
			}
		}
	},
	
	/**
	 * Remove this series from the chart
	 */
	remove: function () {
		var series = this,
			chart = series.chart;

		// column and bar series affects other series of the same type
		// as they are either stacked or grouped
		if (chart.hasRendered) {
			each(chart.series, function (otherSeries) {
				if (otherSeries.type === series.type) {
					otherSeries.isDirty = true;
				}
			});
		}

		Series.prototype.remove.apply(series, arguments);
	}
});
seriesTypes.column = ColumnSeries;
/**
 * Set the default options for bar
 */
defaultPlotOptions.bar = merge(defaultPlotOptions.column);
/**
 * The Bar series class
 */
var BarSeries = extendClass(ColumnSeries, {
	type: 'bar',
	inverted: true
});
seriesTypes.bar = BarSeries;

/**
 * Set the default options for scatter
 */
defaultPlotOptions.scatter = merge(defaultSeriesOptions, {
	lineWidth: 0,
	tooltip: {
		headerFormat: '<span style="font-size: 10px; color:{series.color}">{series.name}</span><br/>',
		pointFormat: 'x: <b>{point.x}</b><br/>y: <b>{point.y}</b><br/>',
		followPointer: true
	},
	stickyTracking: false
});

/**
 * The scatter series class
 */
var ScatterSeries = extendClass(Series, {
	type: 'scatter',
	sorted: false,
	requireSorting: false,
	noSharedTooltip: true,
	trackerGroups: ['markerGroup'],
	takeOrdinalPosition: false, // #2342
	drawTracker: TrackerMixin.drawTrackerPoint,
	drawGraph: function () {
		if (this.options.lineWidth) {
			Series.prototype.drawGraph.call(this);
		}
	},
	setTooltipPoints: noop
});

seriesTypes.scatter = ScatterSeries;

/**
 * Set the default options for pie
 */
defaultPlotOptions.pie = merge(defaultSeriesOptions, {
	borderColor: '#FFFFFF',
	borderWidth: 1,
	center: [null, null],
	clip: false,
	colorByPoint: true, // always true for pies
	dataLabels: {
		// align: null,
		// connectorWidth: 1,
		// connectorColor: point.color,
		// connectorPadding: 5,
		distance: 30,
		enabled: true,
		formatter: function () {
			return this.point.name;
		}
		// softConnector: true,
		//y: 0
	},
	ignoreHiddenPoint: true,
	//innerSize: 0,
	legendType: 'point',
	marker: null, // point options are specified in the base options
	size: null,
	showInLegend: false,
	slicedOffset: 10,
	states: {
		hover: {
			brightness: 0.1,
			shadow: false
		}
	},
	stickyTracking: false,
	tooltip: {
		followPointer: true
	}
});

/**
 * Extended point object for pies
 */
var PiePoint = extendClass(Point, {
	/**
	 * Initiate the pie slice
	 */
	init: function () {

		Point.prototype.init.apply(this, arguments);

		var point = this,
			toggleSlice;

		// Disallow negative values (#1530)
		if (point.y < 0) {
			point.y = null;
		}

		//visible: options.visible !== false,
		extend(point, {
			visible: point.visible !== false,
			name: pick(point.name, 'Slice')
		});

		// add event listener for select
		toggleSlice = function (e) {
			point.slice(e.type === 'select');
		};
		addEvent(point, 'select', toggleSlice);
		addEvent(point, 'unselect', toggleSlice);

		return point;
	},

	/**
	 * Toggle the visibility of the pie slice
	 * @param {Boolean} vis Whether to show the slice or not. If undefined, the
	 *    visibility is toggled
	 */
	setVisible: function (vis) {
		var point = this,
			series = point.series,
			chart = series.chart,
			method;

		// if called without an argument, toggle visibility
		point.visible = point.options.visible = vis = vis === UNDEFINED ? !point.visible : vis;
		series.options.data[inArray(point, series.data)] = point.options; // update userOptions.data
		
		method = vis ? 'show' : 'hide';

		// Show and hide associated elements
		each(['graphic', 'dataLabel', 'connector', 'shadowGroup'], function (key) {
			if (point[key]) {
				point[key][method]();
			}
		});

		if (point.legendItem) {
			chart.legend.colorizeItem(point, vis);
		}
		
		// Handle ignore hidden slices
		if (!series.isDirty && series.options.ignoreHiddenPoint) {
			series.isDirty = true;
			chart.redraw();
		}
	},

	/**
	 * Set or toggle whether the slice is cut out from the pie
	 * @param {Boolean} sliced When undefined, the slice state is toggled
	 * @param {Boolean} redraw Whether to redraw the chart. True by default.
	 */
	slice: function (sliced, redraw, animation) {
		var point = this,
			series = point.series,
			chart = series.chart,
			translation;

		setAnimation(animation, chart);

		// redraw is true by default
		redraw = pick(redraw, true);

		// if called without an argument, toggle
		point.sliced = point.options.sliced = sliced = defined(sliced) ? sliced : !point.sliced;
		series.options.data[inArray(point, series.data)] = point.options; // update userOptions.data

		translation = sliced ? point.slicedTranslation : {
			translateX: 0,
			translateY: 0
		};

		point.graphic.animate(translation);
		
		if (point.shadowGroup) {
			point.shadowGroup.animate(translation);
		}

	}
});

/**
 * The Pie series class
 */
var PieSeries = {
	type: 'pie',
	isCartesian: false,
	pointClass: PiePoint,
	requireSorting: false,
	noSharedTooltip: true,
	trackerGroups: ['group', 'dataLabelsGroup'],
	axisTypes: [],
	pointAttrToOptions: { // mapping between SVG attributes and the corresponding options
		stroke: 'borderColor',
		'stroke-width': 'borderWidth',
		fill: 'color'
	},

	/**
	 * Pies have one color each point
	 */
	getColor: noop,

	/**
	 * Animate the pies in
	 */
	animate: function (init) {
		var series = this,
			points = series.points,
			startAngleRad = series.startAngleRad;

		if (!init) {
			each(points, function (point) {
				var graphic = point.graphic,
					args = point.shapeArgs;

				if (graphic) {
					// start values
					graphic.attr({
						r: series.center[3] / 2, // animate from inner radius (#779)
						start: startAngleRad,
						end: startAngleRad
					});

					// animate
					graphic.animate({
						r: args.r,
						start: args.start,
						end: args.end
					}, series.options.animation);
				}
			});

			// delete this function to allow it only once
			series.animate = null;
		}
	},

	/**
	 * Extend the basic setData method by running processData and generatePoints immediately,
	 * in order to access the points from the legend.
	 */
	setData: function (data, redraw) {
		Series.prototype.setData.call(this, data, false);
		this.processData();
		this.generatePoints();
		if (pick(redraw, true)) {
			this.chart.redraw();
		} 
	},

	/**
	 * Extend the generatePoints method by adding total and percentage properties to each point
	 */
	generatePoints: function () {
		var i,
			total = 0,
			points,
			len,
			point,
			ignoreHiddenPoint = this.options.ignoreHiddenPoint;

		Series.prototype.generatePoints.call(this);

		// Populate local vars
		points = this.points;
		len = points.length;
		
		// Get the total sum
		for (i = 0; i < len; i++) {
			point = points[i];
			total += (ignoreHiddenPoint && !point.visible) ? 0 : point.y;
		}
		this.total = total;

		// Set each point's properties
		for (i = 0; i < len; i++) {
			point = points[i];
			point.percentage = total > 0 ? (point.y / total) * 100 : 0;
			point.total = total;
		}
		
	},
	
	/**
	 * Do translation for pie slices
	 */
	translate: function (positions) {
		this.generatePoints();
		
		var series = this,
			cumulative = 0,
			precision = 1000, // issue #172
			options = series.options,
			slicedOffset = options.slicedOffset,
			connectorOffset = slicedOffset + options.borderWidth,
			start,
			end,
			angle,
			startAngle = options.startAngle || 0,
			startAngleRad = series.startAngleRad = mathPI / 180 * (startAngle - 90),
			endAngleRad = series.endAngleRad = mathPI / 180 * ((options.endAngle || (startAngle + 360)) - 90),
			circ = endAngleRad - startAngleRad, //2 * mathPI,
			points = series.points,
			radiusX, // the x component of the radius vector for a given point
			radiusY,
			labelDistance = options.dataLabels.distance,
			ignoreHiddenPoint = options.ignoreHiddenPoint,
			i,
			len = points.length,
			point;

		// Get positions - either an integer or a percentage string must be given.
		// If positions are passed as a parameter, we're in a recursive loop for adjusting
		// space for data labels.
		if (!positions) {
			series.center = positions = series.getCenter();
		}

		// utility for getting the x value from a given y, used for anticollision logic in data labels
		series.getX = function (y, left) {

			angle = math.asin((y - positions[1]) / (positions[2] / 2 + labelDistance));

			return positions[0] +
				(left ? -1 : 1) *
				(mathCos(angle) * (positions[2] / 2 + labelDistance));
		};

		// Calculate the geometry for each point
		for (i = 0; i < len; i++) {
			
			point = points[i];
			
			// set start and end angle
			start = startAngleRad + (cumulative * circ);
			if (!ignoreHiddenPoint || point.visible) {
				cumulative += point.percentage / 100;
			}
			end = startAngleRad + (cumulative * circ);

			// set the shape
			point.shapeType = 'arc';
//alert(positions[2]+' | '+point.percentage+' | '+point.percentage*100/positions[2])
			point.shapeArgs = {
				x: positions[0],
				y: positions[1],
				r: positions[2] / (2.5 - point.percentage / 100), 
//				r: positions[2]/10+point.percentage*positions[2]/100, // (2.5-point.percentage / 100), 
				innerR: positions[3] / 2,
				start: mathRound(start * precision) / precision,
				end: mathRound(end * precision) / precision
			};

			// center for the sliced out slice
			angle = (end + start) / 2;
			if (angle > 0.75 * circ) {
				angle -= 2 * mathPI;
			}
			point.slicedTranslation = {
				translateX: mathRound(mathCos(angle) * slicedOffset),
				translateY: mathRound(mathSin(angle) * slicedOffset)
			};

			// set the anchor point for tooltips
			radiusX = mathCos(angle) * positions[2] / 2;
			radiusY = mathSin(angle) * positions[2] / 2;
			point.tooltipPos = [
				positions[0] + radiusX * 0.7,
				positions[1] + radiusY * 0.7
			];
			
			point.half = angle < -mathPI / 2 || angle > mathPI / 2 ? 1 : 0;
			point.angle = angle;

			// set the anchor point for data labels
			connectorOffset = mathMin(connectorOffset, labelDistance / 2); // #1678
			point.labelPos = [
				positions[0] + radiusX + mathCos(angle) * labelDistance, // first break of connector
				positions[1] + radiusY + mathSin(angle) * labelDistance, // a/a
				positions[0] + radiusX + mathCos(angle) * connectorOffset, // second break, right outside pie
				positions[1] + radiusY + mathSin(angle) * connectorOffset, // a/a
				positions[0] + radiusX, // landing point for connector
				positions[1] + radiusY, // a/a
				labelDistance < 0 ? // alignment
					'center' :
					point.half ? 'right' : 'left', // alignment
				angle // center angle
			];

		}
	},

	setTooltipPoints: noop,
	drawGraph: null,

	/**
	 * Draw the data points
	 */
	drawPoints: function () {
		var series = this,
			chart = series.chart,
			renderer = chart.renderer,
			groupTranslation,
			//center,
			graphic,
			//group,
			shadow = series.options.shadow,
			shadowGroup,
			shapeArgs;

		if (shadow && !series.shadowGroup) {
			series.shadowGroup = renderer.g('shadow')
				.add(series.group);
		}

		// draw the slices
		each(series.points, function (point) {
			graphic = point.graphic;
			shapeArgs = point.shapeArgs;
			shadowGroup = point.shadowGroup;

			// put the shadow behind all points
			if (shadow && !shadowGroup) {
				shadowGroup = point.shadowGroup = renderer.g('shadow')
					.add(series.shadowGroup);
			}

			// if the point is sliced, use special translation, else use plot area traslation
			groupTranslation = point.sliced ? point.slicedTranslation : {
				translateX: 0,
				translateY: 0
			};

			//group.translate(groupTranslation[0], groupTranslation[1]);
			if (shadowGroup) {
				shadowGroup.attr(groupTranslation);
			}

			// draw the slice
			if (graphic) {
				graphic.animate(extend(shapeArgs, groupTranslation));
			} else {
				point.graphic = graphic = renderer.arc(shapeArgs)
					.setRadialReference(series.center)
					.attr(
						point.pointAttr[point.selected ? SELECT_STATE : NORMAL_STATE]
					)
					.attr({ 'stroke-linejoin': 'round' })
					.attr(groupTranslation)
					.add(series.group)
					.shadow(shadow, shadowGroup);	
			}

			// detect point specific visibility (#2430)
			if (point.visible !== undefined) {
				point.setVisible(point.visible);
			}

		});

	},

	/**
	 * Utility for sorting data labels
	 */
	sortByAngle: function (points, sign) {
		points.sort(function (a, b) {
			return a.angle !== undefined && (b.angle - a.angle) * sign;
		});
	},		

	/**
	 * Draw point specific tracker objects. Inherit directly from column series.
	 */
	drawTracker: TrackerMixin.drawTrackerPoint,

	/**
	 * Use a simple symbol from LegendSymbolMixin
	 */
	drawLegendSymbol: LegendSymbolMixin.drawRectangle,

	/**
	 * Use the getCenter method from drawLegendSymbol
	 */
	getCenter: CenteredSeriesMixin.getCenter,

	/**
	 * Pies don't have point marker symbols
	 */
	getSymbol: noop

};
PieSeries = extendClass(Series, PieSeries);
seriesTypes.pie = PieSeries;

/**
 * Draw the data labels
 */
Series.prototype.drawDataLabels = function () {

	var series = this,
		seriesOptions = series.options,
		cursor = seriesOptions.cursor,
		options = seriesOptions.dataLabels,
		points = series.points,
		pointOptions,
		generalOptions,
		str,
		dataLabelsGroup;

	if (options.enabled || series._hasPointLabels) {

		// Process default alignment of data labels for columns
		if (series.dlProcessOptions) {
			series.dlProcessOptions(options);
		}

		// Create a separate group for the data labels to avoid rotation
		dataLabelsGroup = series.plotGroup(
			'dataLabelsGroup',
			'data-labels',
			series.visible ? VISIBLE : HIDDEN,
			options.zIndex || 6
		);

		// Make the labels for each point
		generalOptions = options;
		each(points, function (point) {

			var enabled,
				dataLabel = point.dataLabel,
				labelConfig,
				attr,
				name,
				rotation,
				connector = point.connector,
				isNew = true;

			// Determine if each data label is enabled
			pointOptions = point.options && point.options.dataLabels;
			enabled = pick(pointOptions && pointOptions.enabled, generalOptions.enabled); // #2282


			// If the point is outside the plot area, destroy it. #678, #820
			if (dataLabel && !enabled) {
				point.dataLabel = dataLabel.destroy();

			// Individual labels are disabled if the are explicitly disabled
			// in the point options, or if they fall outside the plot area.
			} else if (enabled) {

				// Create individual options structure that can be extended without
				// affecting others
				options = merge(generalOptions, pointOptions);

				rotation = options.rotation;

				// Get the string
				labelConfig = point.getLabelConfig();
				str = options.format ?
					format(options.format, labelConfig) :
					options.formatter.call(labelConfig, options);

				// Determine the color
				options.style.color = pick(options.color, options.style.color, series.color, 'black');


				// update existing label
				if (dataLabel) {

					if (defined(str)) {
						dataLabel
							.attr({
								text: str
							});
						isNew = false;

					} else { // #1437 - the label is shown conditionally
						point.dataLabel = dataLabel = dataLabel.destroy();
						if (connector) {
							point.connector = connector.destroy();
						}
					}

				// create new label
				} else if (defined(str)) {
					attr = {
						//align: align,
						fill: options.backgroundColor,
						stroke: options.borderColor,
						'stroke-width': options.borderWidth,
						r: options.borderRadius || 0,
						rotation: rotation,
						padding: options.padding,
						zIndex: 1
					};
					// Remove unused attributes (#947)
					for (name in attr) {
						if (attr[name] === UNDEFINED) {
							delete attr[name];
						}
					}

					dataLabel = point.dataLabel = series.chart.renderer[rotation ? 'text' : 'label']( // labels don't support rotation
						str,
						0,
						-999,
						null,
						null,
						null,
						options.useHTML
					)
					.attr(attr)
					.css(extend(options.style, cursor && { cursor: cursor }))
					.add(dataLabelsGroup)
					.shadow(options.shadow);

				}

				if (dataLabel) {
					// Now the data label is created and placed at 0,0, so we need to align it
					series.alignDataLabel(point, dataLabel, options, null, isNew);
				}
			}
		});
	}
};

/**
 * Align each individual data label
 */
Series.prototype.alignDataLabel = function (point, dataLabel, options, alignTo, isNew) {
	var chart = this.chart,
		inverted = chart.inverted,
		plotX = pick(point.plotX, -999),
		plotY = pick(point.plotY, -999),
		bBox = dataLabel.getBBox(),
		visible = this.visible && (point.series.forceDL || chart.isInsidePlot(point.plotX, point.plotY, inverted)),
		alignAttr; // the final position;

	if (visible) {

		// The alignment box is a singular point
		alignTo = extend({
			x: inverted ? chart.plotWidth - plotY : plotX,
			y: mathRound(inverted ? chart.plotHeight - plotX : plotY),
			width: 0,
			height: 0
		}, alignTo);

		// Add the text size for alignment calculation
		extend(options, {
			width: bBox.width,
			height: bBox.height
		});

		// Allow a hook for changing alignment in the last moment, then do the alignment
		if (options.rotation) { // Fancy box alignment isn't supported for rotated text
			alignAttr = {
				align: options.align,
				x: alignTo.x + options.x + alignTo.width / 2,
				y: alignTo.y + options.y + alignTo.height / 2
			};
			dataLabel[isNew ? 'attr' : 'animate'](alignAttr);
		} else {
			dataLabel.align(options, null, alignTo);
			alignAttr = dataLabel.alignAttr;

			// Handle justify or crop
			if (pick(options.overflow, 'justify') === 'justify') {
				this.justifyDataLabel(dataLabel, options, alignAttr, bBox, alignTo, isNew);

			} else if (pick(options.crop, true)) {
				// Now check that the data label is within the plot area
				visible = chart.isInsidePlot(alignAttr.x, alignAttr.y) && chart.isInsidePlot(alignAttr.x + bBox.width, alignAttr.y + bBox.height);

			}
		}
	}

	// Show or hide based on the final aligned position
	if (!visible) {
		dataLabel.attr({ y: -999 });
		dataLabel.placed = false; // don't animate back in
	}

};

/**
 * If data labels fall partly outside the plot area, align them back in, in a way that
 * doesn't hide the point.
 */
Series.prototype.justifyDataLabel = function (dataLabel, options, alignAttr, bBox, alignTo, isNew) {
	var chart = this.chart,
		align = options.align,
		verticalAlign = options.verticalAlign,
		off,
		justified;

	// Off left
	off = alignAttr.x;
	if (off < 0) {
		if (align === 'right') {
			options.align = 'left';
		} else {
			options.x = -off;
		}
		justified = true;
	}

	// Off right
	off = alignAttr.x + bBox.width;
	if (off > chart.plotWidth) {
		if (align === 'left') {
			options.align = 'right';
		} else {
			options.x = chart.plotWidth - off;
		}
		justified = true;
	}

	// Off top
	off = alignAttr.y;
	if (off < 0) {
		if (verticalAlign === 'bottom') {
			options.verticalAlign = 'top';
		} else {
			options.y = -off;
		}
		justified = true;
	}

	// Off bottom
	off = alignAttr.y + bBox.height;
	if (off > chart.plotHeight) {
		if (verticalAlign === 'top') {
			options.verticalAlign = 'bottom';
		} else {
			options.y = chart.plotHeight - off;
		}
		justified = true;
	}

	if (justified) {
		dataLabel.placed = !isNew;
		dataLabel.align(options, null, alignTo);
	}
};

/**
 * Override the base drawDataLabels method by pie specific functionality
 */
if (seriesTypes.pie) {
	seriesTypes.pie.prototype.drawDataLabels = function () {
		var series = this,
			data = series.data,
			point,
			chart = series.chart,
			options = series.options.dataLabels,
			connectorPadding = pick(options.connectorPadding, 10),
			connectorWidth = pick(options.connectorWidth, 1),
			plotWidth = chart.plotWidth,
			plotHeight = chart.plotHeight,
			connector,
			connectorPath,
			softConnector = pick(options.softConnector, true),
			distanceOption = options.distance,
			seriesCenter = series.center,
			radius = seriesCenter[2] / 2,
			centerY = seriesCenter[1],
			outside = distanceOption > 0,
			dataLabel,
			dataLabelWidth,
			labelPos,
			labelHeight,
			halves = [// divide the points into right and left halves for anti collision
				[], // right
				[]  // left
			],
			x,
			y,
			visibility,
			rankArr,
			i,
			j,
			overflow = [0, 0, 0, 0], // top, right, bottom, left
			sort = function (a, b) {
				return b.y - a.y;
			};

		// get out if not enabled
		if (!series.visible || (!options.enabled && !series._hasPointLabels)) {
			return;
		}

		// run parent method
		Series.prototype.drawDataLabels.apply(series);

		// arrange points for detection collision
		each(data, function (point) {
			if (point.dataLabel && point.visible) { // #407, #2510
				halves[point.half].push(point);
			}
		});

		// assume equal label heights
		i = 0;
		while (!labelHeight && data[i]) { // #1569
			labelHeight = data[i] && data[i].dataLabel && (data[i].dataLabel.getBBox().height || 21); // 21 is for #968
			i++;
		}

		/* Loop over the points in each half, starting from the top and bottom
		 * of the pie to detect overlapping labels.
		 */
		i = 2;
		while (i--) {

			var slots = [],
				slotsLength,
				usedSlots = [],
				points = halves[i],
				pos,
				length = points.length,
				slotIndex;

			// Sort by angle
			series.sortByAngle(points, i - 0.5);

			// Only do anti-collision when we are outside the pie and have connectors (#856)
			if (distanceOption > 0) {

				// build the slots
				for (pos = centerY - radius - distanceOption; pos <= centerY + radius + distanceOption; pos += labelHeight) {
					slots.push(pos);

					// visualize the slot
					/*
					var slotX = series.getX(pos, i) + chart.plotLeft - (i ? 100 : 0),
						slotY = pos + chart.plotTop;
					if (!isNaN(slotX)) {
						chart.renderer.rect(slotX, slotY - 7, 100, labelHeight, 1)
							.attr({
								'stroke-width': 1,
								stroke: 'silver'
							})
							.add();
						chart.renderer.text('Slot '+ (slots.length - 1), slotX, slotY + 4)
							.attr({
								fill: 'silver'
							}).add();
					}
					*/
				}
				slotsLength = slots.length;

				// if there are more values than available slots, remove lowest values
				if (length > slotsLength) {
					// create an array for sorting and ranking the points within each quarter
					rankArr = [].concat(points);
					rankArr.sort(sort);
					j = length;
					while (j--) {
						rankArr[j].rank = j;
					}
					j = length;
					while (j--) {
						if (points[j].rank >= slotsLength) {
							points.splice(j, 1);
						}
					}
					length = points.length;
				}

				// The label goes to the nearest open slot, but not closer to the edge than
				// the label's index.
				for (j = 0; j < length; j++) {

					point = points[j];
					labelPos = point.labelPos;

					var closest = 9999,
						distance,
						slotI;

					// find the closest slot index
					for (slotI = 0; slotI < slotsLength; slotI++) {
						distance = mathAbs(slots[slotI] - labelPos[1]);
						if (distance < closest) {
							closest = distance;
							slotIndex = slotI;
						}
					}

					// if that slot index is closer to the edges of the slots, move it
					// to the closest appropriate slot
					if (slotIndex < j && slots[j] !== null) { // cluster at the top
						slotIndex = j;
					} else if (slotsLength  < length - j + slotIndex && slots[j] !== null) { // cluster at the bottom
						slotIndex = slotsLength - length + j;
						while (slots[slotIndex] === null) { // make sure it is not taken
							slotIndex++;
						}
					} else {
						// Slot is taken, find next free slot below. In the next run, the next slice will find the
						// slot above these, because it is the closest one
						while (slots[slotIndex] === null) { // make sure it is not taken
							slotIndex++;
						}
					}

					usedSlots.push({ i: slotIndex, y: slots[slotIndex] });
					slots[slotIndex] = null; // mark as taken
				}
				// sort them in order to fill in from the top
				usedSlots.sort(sort);
			}

			// now the used slots are sorted, fill them up sequentially
			for (j = 0; j < length; j++) {

				var slot, naturalY;

				point = points[j];
				labelPos = point.labelPos;
				dataLabel = point.dataLabel;
				visibility = point.visible === false ? HIDDEN : VISIBLE;
				naturalY = labelPos[1];

				if (distanceOption > 0) {
					slot = usedSlots.pop();
					slotIndex = slot.i;

					// if the slot next to currrent slot is free, the y value is allowed
					// to fall back to the natural position
					y = slot.y;
					if ((naturalY > y && slots[slotIndex + 1] !== null) ||
							(naturalY < y &&  slots[slotIndex - 1] !== null)) {
						y = naturalY;
					}

				} else {
					y = naturalY;
				}

				// get the x - use the natural x position for first and last slot, to prevent the top
				// and botton slice connectors from touching each other on either side
				x = options.justify ?
					seriesCenter[0] + (i ? -1 : 1) * (radius + distanceOption) :
					series.getX(slotIndex === 0 || slotIndex === slots.length - 1 ? naturalY : y, i);


				// Record the placement and visibility
				dataLabel._attr = {
					visibility: visibility,
					align: labelPos[6]
				};
				dataLabel._pos = {
					x: x + options.x +
						({ left: connectorPadding, right: -connectorPadding }[labelPos[6]] || 0),
					y: y + options.y - 10 // 10 is for the baseline (label vs text)
				};
				dataLabel.connX = x;
				dataLabel.connY = y;


				// Detect overflowing data labels
				if (this.options.size === null) {
					dataLabelWidth = dataLabel.width;
					// Overflow left
					if (x - dataLabelWidth < connectorPadding) {
						overflow[3] = mathMax(mathRound(dataLabelWidth - x + connectorPadding), overflow[3]);

					// Overflow right
					} else if (x + dataLabelWidth > plotWidth - connectorPadding) {
						overflow[1] = mathMax(mathRound(x + dataLabelWidth - plotWidth + connectorPadding), overflow[1]);
					}

					// Overflow top
					if (y - labelHeight / 2 < 0) {
						overflow[0] = mathMax(mathRound(-y + labelHeight / 2), overflow[0]);

					// Overflow left
					} else if (y + labelHeight / 2 > plotHeight) {
						overflow[2] = mathMax(mathRound(y + labelHeight / 2 - plotHeight), overflow[2]);
					}
				}
			} // for each point
		} // for each half

		// Do not apply the final placement and draw the connectors until we have verified
		// that labels are not spilling over.
		if (arrayMax(overflow) === 0 || this.verifyDataLabelOverflow(overflow)) {

			// Place the labels in the final position
			this.placeDataLabels();

			// Draw the connectors
			if (outside && connectorWidth) {
				each(this.points, function (point) {
					connector = point.connector;
					labelPos = point.labelPos;
					dataLabel = point.dataLabel;

					if (dataLabel && dataLabel._pos) {
						visibility = dataLabel._attr.visibility;
						x = dataLabel.connX;
						y = dataLabel.connY;
						connectorPath = softConnector ? [
							M,
							x + (labelPos[6] === 'left' ? 5 : -5), y, // end of the string at the label
							'C',
							x, y, // first break, next to the label
							2 * labelPos[2] - labelPos[4], 2 * labelPos[3] - labelPos[5],
							labelPos[2], labelPos[3], // second break
							L,
							labelPos[4], labelPos[5] // base
						] : [
							M,
							x + (labelPos[6] === 'left' ? 5 : -5), y, // end of the string at the label
							L,
							labelPos[2], labelPos[3], // second break
							L,
							labelPos[4], labelPos[5] // base
						];

						if (connector) {
							connector.animate({ d: connectorPath });
							connector.attr('visibility', visibility);

						} else {
							point.connector = connector = series.chart.renderer.path(connectorPath).attr({
								'stroke-width': connectorWidth,
								stroke: options.connectorColor || point.color || '#606060',
								visibility: visibility
							})
							.add(series.group);
						}
					} else if (connector) {
						point.connector = connector.destroy();
					}
				});
			}
		}
	};
	/**
	 * Perform the final placement of the data labels after we have verified that they
	 * fall within the plot area.
	 */
	seriesTypes.pie.prototype.placeDataLabels = function () {
		each(this.points, function (point) {
			var dataLabel = point.dataLabel,
				_pos;

			if (dataLabel) {
				_pos = dataLabel._pos;
				if (_pos) {
					dataLabel.attr(dataLabel._attr);
					dataLabel[dataLabel.moved ? 'animate' : 'attr'](_pos);
					dataLabel.moved = true;
				} else if (dataLabel) {
					dataLabel.attr({ y: -999 });
				}
			}
		});
	};

	seriesTypes.pie.prototype.alignDataLabel =  noop;

	/**
	 * Verify whether the data labels are allowed to draw, or we should run more translation and data
	 * label positioning to keep them inside the plot area. Returns true when data labels are ready
	 * to draw.
	 */
	seriesTypes.pie.prototype.verifyDataLabelOverflow = function (overflow) {

		var center = this.center,
			options = this.options,
			centerOption = options.center,
			minSize = options.minSize || 80,
			newSize = minSize,
			ret;

		// Handle horizontal size and center
		if (centerOption[0] !== null) { // Fixed center
			newSize = mathMax(center[2] - mathMax(overflow[1], overflow[3]), minSize);

		} else { // Auto center
			newSize = mathMax(
				center[2] - overflow[1] - overflow[3], // horizontal overflow
				minSize
			);
			center[0] += (overflow[3] - overflow[1]) / 2; // horizontal center
		}

		// Handle vertical size and center
		if (centerOption[1] !== null) { // Fixed center
			newSize = mathMax(mathMin(newSize, center[2] - mathMax(overflow[0], overflow[2])), minSize);

		} else { // Auto center
			newSize = mathMax(
				mathMin(
					newSize,
					center[2] - overflow[0] - overflow[2] // vertical overflow
				),
				minSize
			);
			center[1] += (overflow[0] - overflow[2]) / 2; // vertical center
		}

		// If the size must be decreased, we need to run translate and drawDataLabels again
		if (newSize < center[2]) {
			center[2] = newSize;
			this.translate(center);
			each(this.points, function (point) {
				if (point.dataLabel) {
					point.dataLabel._pos = null; // reset
				}
			});

			if (this.drawDataLabels) {
				this.drawDataLabels();
			}
		// Else, return true to indicate that the pie and its labels is within the plot area
		} else {
			ret = true;
		}
		return ret;
	};
}

if (seriesTypes.column) {

	/**
	 * Override the basic data label alignment by adjusting for the position of the column
	 */
	seriesTypes.column.prototype.alignDataLabel = function (point, dataLabel, options,  alignTo, isNew) {
		var chart = this.chart,
			inverted = chart.inverted,
			dlBox = point.dlBox || point.shapeArgs, // data label box for alignment
			below = point.below || (point.plotY > pick(this.translatedThreshold, chart.plotSizeY)),
			inside = pick(options.inside, !!this.options.stacking); // draw it inside the box?

		// Align to the column itself, or the top of it
		if (dlBox) { // Area range uses this method but not alignTo
			alignTo = merge(dlBox);
			if (inverted) {
				alignTo = {
					x: chart.plotWidth - alignTo.y - alignTo.height,
					y: chart.plotHeight - alignTo.x - alignTo.width,
					width: alignTo.height,
					height: alignTo.width
				};
			}

			// Compute the alignment box
			if (!inside) {
				if (inverted) {
					alignTo.x += below ? 0 : alignTo.width;
					alignTo.width = 0;
				} else {
					alignTo.y += below ? alignTo.height : 0;
					alignTo.height = 0;
				}
			}
		}

		// When alignment is undefined (typically columns and bars), display the individual
		// point below or above the point depending on the threshold
		options.align = pick(
			options.align,
			!inverted || inside ? 'center' : below ? 'right' : 'left'
		);
		options.verticalAlign = pick(
			options.verticalAlign,
			inverted || inside ? 'middle' : below ? 'top' : 'bottom'
		);

		// Call the parent method
		Series.prototype.alignDataLabel.call(this, point, dataLabel, options, alignTo, isNew);
	};
}




// global variables
extend(Highcharts, {
	
	// Constructors
	Axis: Axis,
	Chart: Chart,
	Color: Color,
	Point: Point,
	Tick: Tick,
	Tooltip: Tooltip,
	Renderer: Renderer,
	Series: Series,
	SVGElement: SVGElement,
	SVGRenderer: SVGRenderer,
	
	// Various
	arrayMin: arrayMin,
	arrayMax: arrayMax,
	charts: charts,
	dateFormat: dateFormat,
	format: format,
	pathAnim: pathAnim,
	getOptions: getOptions,
	hasBidiBug: hasBidiBug,
	isTouchDevice: isTouchDevice,
	numberFormat: numberFormat,
	seriesTypes: seriesTypes,
	setOptions: setOptions,
	addEvent: addEvent,
	removeEvent: removeEvent,
	createElement: createElement,
	discardElement: discardElement,
	css: css,
	each: each,
	extend: extend,
	map: map,
	merge: merge,
	pick: pick,
	splat: splat,
	extendClass: extendClass,
	pInt: pInt,
	wrap: wrap,
	svg: hasSVG,
	canvas: useCanVG,
	vml: !hasSVG && !useCanVG,
	product: PRODUCT,
	version: VERSION
});

}());
// jHtmlArea - http://jhtmlarea.codeplex.com - (c)2012 Chris Pietschmann

﻿
(function($){$.fn.htmlarea=function(opts){if(opts&&typeof(opts)==="string"){var args=[];for(var i=1;i<arguments.length;i++){args.push(arguments[i]);}
var htmlarea=jHtmlArea(this[0]);var f=htmlarea[opts];if(f){return f.apply(htmlarea,args);}}
return this.each(function(){jHtmlArea(this,opts);});};var jHtmlArea=window.jHtmlArea=function(elem,options){if(elem.jquery){return jHtmlArea(elem[0]);}
if(elem.jhtmlareaObject){return elem.jhtmlareaObject;}else{return new jHtmlArea.fn.init(elem,options);}};jHtmlArea.fn=jHtmlArea.prototype={jhtmlarea:"0.7.5",init:function(elem,options){if(elem.nodeName.toLowerCase()==="textarea"){var opts=$.extend({},jHtmlArea.defaultOptions,options);elem.jhtmlareaObject=this;var textarea=this.textarea=$(elem);var container=this.container=$("<div/>").addClass("jHtmlArea").width(textarea.width()).insertAfter(textarea);var toolbar=this.toolbar=$("<div/>").addClass("ToolBar").appendTo(container);priv.initToolBar.call(this,opts);var iframe=this.iframe=$("<iframe/>").height(textarea.height());iframe.width(textarea.width()-($.browser.msie?0:4));var htmlarea=this.htmlarea=$("<div/>").append(iframe);container.append(htmlarea).append(textarea.hide());priv.initEditor.call(this,opts);priv.attachEditorEvents.call(this);iframe.height(iframe.height()-toolbar.height());toolbar.width(textarea.width()-2);if(opts.loaded){opts.loaded.call(this);}}},dispose:function(){this.textarea.show().insertAfter(this.container);this.container.remove();this.textarea[0].jhtmlareaObject=null;},execCommand:function(a,b,c){this.iframe[0].contentWindow.focus();this.editor.execCommand(a,b||false,c||null);this.updateTextArea();},ec:function(a,b,c){this.execCommand(a,b,c);},queryCommandValue:function(a){this.iframe[0].contentWindow.focus();return this.editor.queryCommandValue(a);},qc:function(a){return this.queryCommandValue(a);},getSelectedHTML:function(){if($.browser.msie){return this.getRange().htmlText;}else{var elem=this.getRange().cloneContents();return $("<p/>").append($(elem)).html();}},getSelection:function(){if($.browser.msie){return this.editor.selection;}else{return this.iframe[0].contentDocument.defaultView.getSelection();}},getRange:function(){var s=this.getSelection();if(!s){return null;}
return(s.getRangeAt)?s.getRangeAt(0):s.createRange();},html:function(v){if(v){this.textarea.val(v);this.updateHtmlArea();}else{return this.toHtmlString();}},pasteHTML:function(html){this.iframe[0].contentWindow.focus();var r=this.getRange();if($.browser.msie){r.pasteHTML(html);}else if($.browser.mozilla){r.deleteContents();r.insertNode($((html.indexOf("<")!=0)?$("<span/>").append(html):html)[0]);}else{r.deleteContents();r.insertNode($(this.iframe[0].contentWindow.document.createElement("span")).append($((html.indexOf("<")!=0)?"<span>"+html+"</span>":html))[0]);}
r.collapse(false);r.select();},cut:function(){this.ec("cut");},copy:function(){this.ec("copy");},paste:function(){this.ec("paste");},bold:function(){this.ec("bold");},italic:function(){this.ec("italic");},underline:function(){this.ec("underline");},strikeThrough:function(){this.ec("strikethrough");},image:function(url){if($.browser.msie&&!url){this.ec("insertImage",true);}else{this.ec("insertImage",false,(url||prompt("Image URL:","http://")));}},removeFormat:function(){this.ec("removeFormat",false,[]);this.unlink();},link:function(){if($.browser.msie){this.ec("createLink",true);}else{this.ec("createLink",false,prompt("Link URL:","http://"));}},unlink:function(){this.ec("unlink",false,[]);},orderedList:function(){this.ec("insertorderedlist");},unorderedList:function(){this.ec("insertunorderedlist");},superscript:function(){this.ec("superscript");},subscript:function(){this.ec("subscript");},p:function(){this.formatBlock("<p>");},h1:function(){this.heading(1);},h2:function(){this.heading(2);},h3:function(){this.heading(3);},h4:function(){this.heading(4);},h5:function(){this.heading(5);},h6:function(){this.heading(6);},heading:function(h){this.formatBlock($.browser.msie?"Heading "+h:"h"+h);},indent:function(){this.ec("indent");},outdent:function(){this.ec("outdent");},insertHorizontalRule:function(){this.ec("insertHorizontalRule",false,"ht");},justifyLeft:function(){this.ec("justifyLeft");},justifyCenter:function(){this.ec("justifyCenter");},justifyRight:function(){this.ec("justifyRight");},increaseFontSize:function(){if($.browser.msie){this.ec("fontSize",false,this.qc("fontSize")+1);}else if($.browser.safari){this.getRange().surroundContents($(this.iframe[0].contentWindow.document.createElement("span")).css("font-size","larger")[0]);}else{this.ec("increaseFontSize",false,"big");}},decreaseFontSize:function(){if($.browser.msie){this.ec("fontSize",false,this.qc("fontSize")-1);}else if($.browser.safari){this.getRange().surroundContents($(this.iframe[0].contentWindow.document.createElement("span")).css("font-size","smaller")[0]);}else{this.ec("decreaseFontSize",false,"small");}},forecolor:function(c){this.ec("foreColor",false,c||prompt("Enter HTML Color:","#"));},formatBlock:function(v){this.ec("formatblock",false,v||null);},showHTMLView:function(){this.updateTextArea();this.textarea.show();this.htmlarea.hide();$("ul li:not(li:has(a.html))",this.toolbar).hide();$("ul:not(:has(:visible))",this.toolbar).hide();$("ul li a.html",this.toolbar).addClass("highlighted");},hideHTMLView:function(){this.updateHtmlArea();this.textarea.hide();this.htmlarea.show();$("ul",this.toolbar).show();$("ul li",this.toolbar).show().find("a.html").removeClass("highlighted");},toggleHTMLView:function(){(this.textarea.is(":hidden"))?this.showHTMLView():this.hideHTMLView();},toHtmlString:function(){return this.editor.body.innerHTML;},toString:function(){return this.editor.body.innerText;},updateTextArea:function(){this.textarea.val(this.toHtmlString());},updateHtmlArea:function(){this.editor.body.innerHTML=this.textarea.val();}};jHtmlArea.fn.init.prototype=jHtmlArea.fn;jHtmlArea.defaultOptions={toolbar:[["html"],["bold","italic","underline","strikethrough","|","subscript","superscript"],["increasefontsize","decreasefontsize"],["orderedlist","unorderedlist"],["indent","outdent"],["justifyleft","justifycenter","justifyright"],["link","unlink","image","horizontalrule"],["p","h1","h2","h3","h4","h5","h6"],["cut","copy","paste"]],css:null,toolbarText:{bold:"Bold",italic:"Italic",underline:"Underline",strikethrough:"Strike-Through",cut:"Cut",copy:"Copy",paste:"Paste",h1:"Heading 1",h2:"Heading 2",h3:"Heading 3",h4:"Heading 4",h5:"Heading 5",h6:"Heading 6",p:"Paragraph",indent:"Indent",outdent:"Outdent",horizontalrule:"Insert Horizontal Rule",justifyleft:"Left Justify",justifycenter:"Center Justify",justifyright:"Right Justify",increasefontsize:"Increase Font Size",decreasefontsize:"Decrease Font Size",forecolor:"Text Color",link:"Insert Link",unlink:"Remove Link",image:"Insert Image",orderedlist:"Insert Ordered List",unorderedlist:"Insert Unordered List",subscript:"Subscript",superscript:"Superscript",html:"Show/Hide HTML Source View"}};var priv={toolbarButtons:{strikethrough:"strikeThrough",orderedlist:"orderedList",unorderedlist:"unorderedList",horizontalrule:"insertHorizontalRule",justifyleft:"justifyLeft",justifycenter:"justifyCenter",justifyright:"justifyRight",increasefontsize:"increaseFontSize",decreasefontsize:"decreaseFontSize",html:function(btn){this.toggleHTMLView();}},initEditor:function(options){var edit=this.editor=this.iframe[0].contentWindow.document;edit.designMode='on';edit.open();edit.write(this.textarea.val());edit.close();if(options.css){var e=edit.createElement('link');e.rel='stylesheet';e.type='text/css';e.href=options.css;edit.getElementsByTagName('head')[0].appendChild(e);}},initToolBar:function(options){var that=this;var menuItem=function(className,altText,action){return $("<li/>").append($("<a href='javascript:void(0);'/>").addClass(className).attr("title",altText).click(function(){action.call(that,$(this));}));};function addButtons(arr){var ul=$("<ul/>").appendTo(that.toolbar);for(var i=0;i<arr.length;i++){var e=arr[i];if((typeof(e)).toLowerCase()==="string"){if(e==="|"){ul.append($('<li class="separator"/>'));}else{var f=(function(e){var m=priv.toolbarButtons[e]||e;if((typeof(m)).toLowerCase()==="function"){return function(btn){m.call(this,btn);};}else{return function(){this[m]();this.editor.body.focus();};}})(e.toLowerCase());var t=options.toolbarText[e.toLowerCase()];ul.append(menuItem(e.toLowerCase(),t||e,f));}}else{ul.append(menuItem(e.css,e.text,e.action));}}};if(options.toolbar.length!==0&&priv.isArray(options.toolbar[0])){for(var i=0;i<options.toolbar.length;i++){addButtons(options.toolbar[i]);}}else{addButtons(options.toolbar);}},attachEditorEvents:function(){var t=this;var fnHA=function(){t.updateHtmlArea();};this.textarea.click(fnHA).keyup(fnHA).keydown(fnHA).mousedown(fnHA).blur(fnHA);var fnTA=function(){t.updateTextArea();};$(this.editor.body).click(fnTA).keyup(fnTA).keydown(fnTA).mousedown(fnTA).blur(fnTA);$('form').submit(function(){t.toggleHTMLView();t.toggleHTMLView();});if(window.__doPostBack){var old__doPostBack=__doPostBack;window.__doPostBack=function(){if(t){if(t.toggleHTMLView){t.toggleHTMLView();t.toggleHTMLView();}}
return old__doPostBack.apply(window,arguments);};}},isArray:function(v){return v&&typeof v==='object'&&typeof v.length==='number'&&typeof v.splice==='function'&&!(v.propertyIsEnumerable('length'));}};})(jQuery);
// jHtmlArea - http://jhtmlarea.codeplex.com - (c)2009 Chris Pietschmann﻿
(function($){if(jHtmlArea){var oldForecolor=jHtmlArea.fn.forecolor;jHtmlArea.fn.forecolor=function(c){if(c){oldForecolor.call(this,c);}else{var that=this;var rng=this.getRange();jHtmlAreaColorPickerMenu($(".forecolor",this.toolbar),{colorChosen:function(color){if($.browser.msie){rng.execCommand("ForeColor",false,color);}else{that.forecolor(color);}}});}};}
var menu=window.jHtmlAreaColorPickerMenu=function(ownerElement,options){return new jHtmlAreaColorPickerMenu.fn.init(ownerElement,options);};menu.fn=menu.prototype={jhtmlareacolorpickermenu:"0.7.0",init:function(ownerElement,options){var opts=$.extend({},menu.defaultOptions,options);var that=this;var owner=this.owner=$(ownerElement);var position=owner.position();if(menu.instance){menu.instance.hide();}
jHtmlAreaColorPickerMenu.instance=this;var picker=this.picker=$("<div/>").css({position:"absolute",left:position.left+opts.offsetLeft,top:position.top+owner.height()+opts.offsetTop,"z-index":opts["z-index"]}).addClass("jHtmlAreaColorPickerMenu");for(var i=0;i<opts.colors.length;i++){var c=opts.colors[i];$("<div/>").css("background-color",c).appendTo(picker).click((function(color){return function(){if(opts.colorChosen){opts.colorChosen.call(this,color);}
that.hide();};})(c));}
$("<div/>").html("<div></div>Automatic").addClass("automatic").appendTo(picker).click(function(){if(opts.colorChosen){opts.colorChosen.call(this,null);}
that.hide();});var autoHide=false;picker.appendTo(owner.parent()).show().mouseout(function(){autoHide=true;that.currentTimeout=window.setTimeout(function(){if(autoHide===true){that.hide();}},1000);}).mouseover(function(){if(that.currentTimeout){window.clearTimeout(that.currentTimeout);that.currentTimeout=null;}
autoHide=false;});},hide:function(){this.picker.hide();this.picker.remove();}};menu.fn.init.prototype=menu.fn;menu.defaultOptions={"z-index":0,offsetTop:0,offsetLeft:0,colors:["#ffffff","#cccccc","#c0c0c0","#999999","#666666","#333333","#000000","#ffcccc","#ff6666","#ff0000","#cc0000","#990000","#660000","#330000","#ffcc99","#ff9966","#ff9900","#ff6600","#cc6600","#993300","#663300","#ffff99","#ffff66","#ffcc66","#ffcc33","#cc9933","#996633","#663333","#ffffcc","#ffff33","#ffff00","#ffcc00","#999900","#666600","#333300","#99ff99","#66ff99","#33ff33","#33cc00","#009900","#006600","#003300","#99FFFF","#33FFFF","#66CCCC","#00CCCC","#339999","#336666","#003333","#CCFFFF","#66FFFF","#33CCFF","#3366FF","#3333FF","#000099","#000066","#CCCCFF","#9999FF","#6666CC","#6633FF","#6600CC","#333399","#330099","#FFCCFF","#FF99FF","#CC66CC","#CC33CC","#993399","#663366","#330033"],colorChosen:null};})(jQuery);
(function(d,f,g,b){var e="tooltipster",c={animation:"fade",arrow:true,arrowColor:"",content:"",delay:200,fixedWidth:0,maxWidth:0,functionBefore:function(m,n){n()},functionReady:function(m,n){},functionAfter:function(m){},icon:"(?)",iconDesktop:false,iconTouch:false,iconTheme:".tooltipster-icon",interactive:false,interactiveTolerance:350,offsetX:0,offsetY:0,onlyOne:true,position:"top",speed:350,timer:0,theme:".tooltipster-default",touchDevices:true,trigger:"hover",updateAnimation:true};function j(n,m){this.element=n;this.options=d.extend({},c,m);this._defaults=c;this._name=e;this.init()}function k(){return !!("ontouchstart" in f)}function a(){var m=g.body||g.documentElement;var o=m.style;var q="transition";if(typeof o[q]=="string"){return true}v=["Moz","Webkit","Khtml","O","ms"],q=q.charAt(0).toUpperCase()+q.substr(1);for(var n=0;n<v.length;n++){if(typeof o[v[n]+q]=="string"){return true}}return false}var l=true;if(!a()){l=false}var h=k();d(f).on("mousemove.tooltipster",function(){h=false;d(f).off("mousemove.tooltipster")});j.prototype={init:function(){var s=d(this.element);var o=this;var r=true;if((o.options.touchDevices==false)&&(h)){r=false}if(g.all&&!g.querySelector){r=false}if(r==true){if((this.options.iconDesktop==true)&&(!h)||((this.options.iconTouch==true)&&(h))){var n=s.attr("title");s.removeAttr("title");var q=o.options.iconTheme;var p=d('<span class="'+q.replace(".","")+'" title="'+n+'">'+this.options.icon+"</span>");p.insertAfter(s);s.data("tooltipsterIcon",p);s=p}var m=d.trim(o.options.content).length>0?o.options.content:s.attr("title");s.data("tooltipsterContent",m);s.removeAttr("title");if((this.options.touchDevices==true)&&(h)&&((this.options.trigger=="click")||(this.options.trigger=="hover"))){s.bind("touchstart",function(u,t){o.showTooltip()})}else{if(this.options.trigger=="hover"){s.on("mouseenter.tooltipster",function(){o.showTooltip()});if(this.options.interactive==true){s.on("mouseleave.tooltipster",function(){var u=s.data("tooltipster");var w=false;if((u!==b)&&(u!=="")){u.mouseenter(function(){w=true});u.mouseleave(function(){w=false});var t=setTimeout(function(){if(w==true){u.mouseleave(function(){/*o.hideTooltip()*/})}else{/*o.hideTooltip()*/}},o.options.interactiveTolerance)}else{/*o.hideTooltip()*/}})}else{s.on("mouseleave.tooltipster",function(){/*o.hideTooltip()*/})}}if(this.options.trigger=="click"){s.on("click.tooltipster",function(){if((s.data("tooltipster")=="")||(s.data("tooltipster")==b)){o.showTooltip()}else{o.hideTooltip()}})}}}},showTooltip:function(n){var o=d(this.element);var m=this;if(o.data("tooltipsterIcon")!==b){o=o.data("tooltipsterIcon")}if(!o.hasClass("tooltipster-disable")){if((d(".tooltipster-base").not(".tooltipster-dying").length>0)&&(m.options.onlyOne==true)){d(".tooltipster-base").not(".tooltipster-dying").not(o.data("tooltipster")).each(function(){d(this).addClass("tooltipster-kill");var p=d(this).data("origin");p.data("plugin_tooltipster").hideTooltip()})}o.clearQueue().delay(m.options.delay).queue(function(){m.options.functionBefore(o,function(){if((o.data("tooltipster")!==b)&&(o.data("tooltipster")!=="")){var y=o.data("tooltipster");if(!y.hasClass("tooltipster-kill")){var u="tooltipster-"+m.options.animation;y.removeClass("tooltipster-dying");if(l==true){y.clearQueue().addClass(u+"-show")}if(m.options.timer>0){var r=y.data("tooltipsterTimer");clearTimeout(r);r=setTimeout(function(){y.data("tooltipsterTimer",b);m.hideTooltip()},m.options.timer);y.data("tooltipsterTimer",r)}if((m.options.touchDevices==true)&&(h)){d("body").bind("touchstart",function(D){if(m.options.interactive==true){var F=d(D.target);var E=true;F.parents().each(function(){if(d(this).hasClass("tooltipster-base")){E=false}});if(E==true){m.hideTooltip();d("body").unbind("touchstart")}}else{m.hideTooltip();d("body").unbind("touchstart")}})}}}else{d("body").css("overflow-x","hidden");var z=o.data("tooltipsterContent");var x=m.options.theme;var A=x.replace(".","");var u="tooltipster-"+m.options.animation;var t="-webkit-transition-duration: "+m.options.speed+"ms; -webkit-animation-duration: "+m.options.speed+"ms; -moz-transition-duration: "+m.options.speed+"ms; -moz-animation-duration: "+m.options.speed+"ms; -o-transition-duration: "+m.options.speed+"ms; -o-animation-duration: "+m.options.speed+"ms; -ms-transition-duration: "+m.options.speed+"ms; -ms-animation-duration: "+m.options.speed+"ms; transition-duration: "+m.options.speed+"ms; animation-duration: "+m.options.speed+"ms;";var p=m.options.fixedWidth>0?"width:"+m.options.fixedWidth+"px;":"";var B=m.options.maxWidth>0?"max-width:"+m.options.maxWidth+"px;":"";var w=m.options.interactive==true?"pointer-events: auto;":"";var y=d('<div class="tooltipster-base '+A+" "+u+'" style="'+p+" "+B+" "+w+" "+t+'"></div>');var s=d('<div class="tooltipster-content"></div>');s.html(z);y.append(s);y.appendTo("body");o.data("tooltipster",y);y.data("origin",o);m.positionTooltip();m.options.functionReady(o,y);if(l==true){y.addClass(u+"-show")}else{y.css("display","none").removeClass(u).fadeIn(m.options.speed)}var C=z;var q=setInterval(function(){var D=o.data("tooltipsterContent");if(d("body").find(o).length==0){y.addClass("tooltipster-dying");m.hideTooltip()}else{if((C!==D)&&(D!=="")){C=D;y.find(".tooltipster-content").html(D);if(m.options.updateAnimation==true){if(a()){y.css({width:"","-webkit-transition":"all "+m.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-moz-transition":"all "+m.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-o-transition":"all "+m.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms","-ms-transition":"all "+m.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms",transition:"all "+m.options.speed+"ms, width 0ms, height 0ms, left 0ms, top 0ms"}).addClass("tooltipster-content-changing");setTimeout(function(){y.removeClass("tooltipster-content-changing");setTimeout(function(){y.css({"-webkit-transition":m.options.speed+"ms","-moz-transition":m.options.speed+"ms","-o-transition":m.options.speed+"ms","-ms-transition":m.options.speed+"ms",transition:m.options.speed+"ms"})},m.options.speed)},m.options.speed)}else{y.fadeTo(m.options.speed,0.5,function(){y.fadeTo(m.options.speed,1)})}}m.positionTooltip()}}if((d("body").find(y).length==0)||(d("body").find(o).length==0)){clearInterval(q)}},200);if(m.options.timer>0){var r=setTimeout(function(){y.data("tooltipsterTimer",b);m.hideTooltip()},m.options.timer+m.options.speed);y.data("tooltipsterTimer",r)}if((m.options.touchDevices==true)&&(h)){d("body").bind("touchstart",function(D){if(m.options.interactive==true){var F=d(D.target);var E=true;F.parents().each(function(){if(d(this).hasClass("tooltipster-base")){E=false}});if(E==true){m.hideTooltip();d("body").unbind("touchstart")}}else{m.hideTooltip();d("body").unbind("touchstart")}})}y.mouseleave(function(){/*m.hideTooltip()*/})}});o.dequeue()})}},hideTooltip:function(n){var q=d(this.element);var m=this;if(q.data("tooltipsterIcon")!==b){q=q.data("tooltipsterIcon")}var p=q.data("tooltipster");if(p==b){p=d(".tooltipster-dying")}q.clearQueue();if((p!==b)&&(p!=="")){var r=p.data("tooltipsterTimer");if(r!==b){clearTimeout(r)}var o="tooltipster-"+m.options.animation;if(l==true){p.clearQueue().removeClass(o+"-show").addClass("tooltipster-dying").delay(m.options.speed).queue(function(){p.remove();q.data("tooltipster","");d("body").css("verflow-x","");m.options.functionAfter(q)})}else{p.clearQueue().addClass("tooltipster-dying").fadeOut(m.options.speed,function(){p.remove();q.data("tooltipster","");d("body").css("verflow-x","");m.options.functionAfter(q)})}}},positionTooltip:function(P){var B=d(this.element);var ac=this;if(B.data("tooltipsterIcon")!==b){B=B.data("tooltipsterIcon")}if((B.data("tooltipster")!==b)&&(B.data("tooltipster")!=="")){var ai=B.data("tooltipster");ai.css("width","");var aj=d(f).width();var C=B.outerWidth(false);var ah=B.outerHeight(false);var am=ai.outerWidth(false);var n=ai.innerWidth()+1;var N=ai.outerHeight(false);var ab=B.offset();var aa=ab.top;var w=ab.left;var z=b;if(B.is("area")){var U=B.attr("shape");var ag=B.parent().attr("name");var Q=d('img[usemap="#'+ag+'"]');var o=Q.offset().left;var M=Q.offset().top;var X=B.attr("coords")!==b?B.attr("coords").split(","):b;if(U=="circle"){var O=parseInt(X[0]);var s=parseInt(X[1]);var E=parseInt(X[2]);ah=E*2;C=E*2;aa=M+s-E;w=o+O-E}else{if(U=="rect"){var O=parseInt(X[0]);var s=parseInt(X[1]);var r=parseInt(X[2]);var K=parseInt(X[3]);ah=K-s;C=r-O;aa=M+s;w=o+O}else{if(U=="poly"){var y=[];var af=[];var I=0,H=0,ae=0,ad=0;var ak="even";for(i=0;i<X.length;i++){var G=parseInt(X[i]);if(ak=="even"){if(G>ae){ae=G;if(i==0){I=ae}}if(G<I){I=G}ak="odd"}else{if(G>ad){ad=G;if(i==1){H=ad}}if(G<H){H=G}ak="even"}}ah=ad-H;C=ae-I;aa=M+H;w=o+I}else{ah=Q.outerHeight(false);C=Q.outerWidth(false);aa=M;w=o}}}}if(ac.options.fixedWidth==0){ai.css({width:n+"px","padding-left":"0px","padding-right":"0px"})}var t=0,W=0;var Y=parseInt(ac.options.offsetY);var Z=parseInt(ac.options.offsetX);var q="";function x(){var ao=d(f).scrollLeft();if((t-ao)<0){var an=t-ao;t=ao;ai.data("arrow-reposition",an)}if(((t+am)-ao)>aj){var an=t-((aj+ao)-am);t=(aj+ao)-am;ai.data("arrow-reposition",an)}}function u(ao,an){if(((aa-d(f).scrollTop()-N-Y-12)<0)&&(an.indexOf("top")>-1)){ac.options.position=ao;z=an}if(((aa+ah+N+12+Y)>(d(f).scrollTop()+d(f).height()))&&(an.indexOf("bottom")>-1)){ac.options.position=ao;z=an;W=(aa-N)-Y-12}}if(ac.options.position=="top"){var R=(w+am)-(w+C);t=(w+Z)-(R/2);W=(aa-N)-Y-12;x();u("bottom","top")}if(ac.options.position=="top-left"){t=w+Z;W=(aa-N)-Y-12;x();u("bottom-left","top-left")}if(ac.options.position=="top-right"){t=(w+C+Z)-am;W=(aa-N)-Y-12;x();u("bottom-right","top-right")}if(ac.options.position=="bottom"){var R=(w+am)-(w+C);t=w-(R/2)+Z;W=(aa+ah)+Y+12;x();u("top","bottom")}if(ac.options.position=="bottom-left"){t=w+Z;W=(aa+ah)+Y+12;x();u("top-left","bottom-left")}if(ac.options.position=="bottom-right"){t=(w+C+Z)-am;W=(aa+ah)+Y+12;x();u("top-right","bottom-right")}if(ac.options.position=="left"){t=w-Z-am-12;myLeftMirror=w+Z+C+12;var L=(aa+N)-(aa+B.outerHeight(false));W=aa-(L/2)-Y;if((t<0)&&((myLeftMirror+am)>aj)){var p=parseFloat(ai.css("border-width"))*2;var m=(am+t)-p;ai.css("width",m+"px");N=ai.outerHeight(false);t=w-Z-m-12-p;L=(aa+N)-(aa+B.outerHeight(false));W=aa-(L/2)-Y}else{if(t<0){t=w+Z+C+12;ai.data("arrow-reposition","left")}}}if(ac.options.position=="right"){t=w+Z+C+12;myLeftMirror=w-Z-am-12;var L=(aa+N)-(aa+B.outerHeight(false));W=aa-(L/2)-Y;if(((t+am)>aj)&&(myLeftMirror<0)){var p=parseFloat(ai.css("border-width"))*2;var m=(aj-t)-p;ai.css("width",m+"px");N=ai.outerHeight(false);L=(aa+N)-(aa+B.outerHeight(false));W=aa-(L/2)-Y}else{if((t+am)>aj){t=w-Z-am-12;ai.data("arrow-reposition","right")}}}if(ac.options.arrow==true){var J="tooltipster-arrow-"+ac.options.position;if(ac.options.arrowColor.length<1){var S=ai.css("background-color")}else{var S=ac.options.arrowColor}var al=ai.data("arrow-reposition");if(!al){al=""}else{if(al=="left"){J="tooltipster-arrow-right";al=""}else{if(al=="right"){J="tooltipster-arrow-left";al=""}else{al="left:"+al+"px;"}}}if((ac.options.position=="top")||(ac.options.position=="top-left")||(ac.options.position=="top-right")){var V=parseFloat(ai.css("border-bottom-width"));var A=ai.css("border-bottom-color")}else{if((ac.options.position=="bottom")||(ac.options.position=="bottom-left")||(ac.options.position=="bottom-right")){var V=parseFloat(ai.css("border-top-width"));var A=ai.css("border-top-color")}else{if(ac.options.position=="left"){var V=parseFloat(ai.css("border-right-width"));var A=ai.css("border-right-color")}else{if(ac.options.position=="right"){var V=parseFloat(ai.css("border-left-width"));var A=ai.css("border-left-color")}else{var V=parseFloat(ai.css("border-bottom-width"));var A=ai.css("border-bottom-color")}}}}if(V>1){V++}var F="";if(V!==0){var D="";var T="border-color: "+A+";";if(J.indexOf("bottom")!==-1){D="margin-top: -"+V+"px;"}else{if(J.indexOf("top")!==-1){D="margin-bottom: -"+V+"px;"}else{if(J.indexOf("left")!==-1){D="margin-right: -"+V+"px;"}else{if(J.indexOf("right")!==-1){D="margin-left: -"+V+"px;"}}}}F='<span class="tooltipster-arrow-border" style="'+D+" "+T+';"></span>'}ai.find(".tooltipster-arrow").remove();q='<div class="'+J+' tooltipster-arrow" style="'+al+'">'+F+'<span style="border-color:'+S+';"></span></div>';ai.append(q)}ai.css({top:W+"px",left:t+"px"});if(z!==b){ac.options.position=z}}}};d.fn[e]=function(n){if(typeof n==="string"){var p=this;var m=arguments[1];if(p.data("plugin_tooltipster")==b){var o=p.find("*");p=d();o.each(function(){if(d(this).data("plugin_tooltipster")!==b){p.push(d(this))}})}p.each(function(){switch(n.toLowerCase()){case"show":d(this).data("plugin_tooltipster").showTooltip();break;case"hide":d(this).data("plugin_tooltipster").hideTooltip();break;case"disable":d(this).addClass("tooltipster-disable");break;case"enable":d(this).removeClass("tooltipster-disable");break;case"destroy":d(this).data("plugin_tooltipster").hideTooltip();d(this).data("plugin_tooltipster","").attr("title",p.data("tooltipsterContent")).data("tooltipsterContent","").data("plugin_tooltipster","").off("mouseenter.tooltipster mouseleave.tooltipster click.tooltipster");break;case"update":if(d(this).data("tooltipsterIcon")==b){d(this).data("tooltipsterContent",m)}else{var q=d(this).data("tooltipsterIcon");q.data("tooltipsterContent",m)}break;case"reposition":d(this).data("plugin_tooltipster").positionTooltip();break}});return this}return this.each(function(){if(!d.data(this,"plugin_"+e)){d.data(this,"plugin_"+e,new j(this,n))}var q=d(this).data("plugin_tooltipster").options;if((q.iconDesktop==true)&&(!h)||((q.iconTouch==true)&&(h))){var r=d(this).data("plugin_tooltipster");d(this).next().data("plugin_tooltipster",r)}})};if(h){f.addEventListener("orientationchange",function(){if(d(".tooltipster-base").length>0){d(".tooltipster-base").each(function(){var m=d(this).data("origin");m.data("plugin_tooltipster").hideTooltip()})}},false)}d(f).on("resize.tooltipster",function(){var m=d(".tooltipster-base").data("origin");if((m!==null)&&(m!==b)){m.tooltipster("reposition")}})})(jQuery,window,document);
/*
 * @build  : 24 Aug, 2013
 * @author : Ram swaroop
 * @company: Compzets.com
 */

(function($){
    function setSelection() {
        var target = document.getElementsByTagName('mark')[0];
        var rng, sel;
        if ( document.createRange ) {
            rng = document.createRange();
            rng.selectNode( target )
            sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange( rng );
        } else {
            var rng = document.body.createTextRange();
            rng.moveToElementText( target );
            rng.select();
        }
    }

   $.fn.contentshare = function(options) {        
        // fetch options
        var opts = $.extend({},$.fn.contentshare.defaults,options);
        
        $.extend($.fn.contentshare,{
            
            init : function(shareable) {
                $.fn.contentshare.defaults.shareable = shareable;
            },
            getContent : function() {
                var content="";
                for(var i=0;i<opts.shareLinks.length;i++){
                    content +=
	              '<a href="' + opts.shareLinks[i] +
	              encodeURIComponent($('mark.contentshare').html().replace(/\&nbsp;/g,' ').replace(/(<([^>]+)>)/g, '')) +
	              '" '+((opts.newTab)?"target=\"_blank\"":"")+'><img src="'+opts.shareIcons[i]+'" '+((i!=0)?"style=\"margin-left:5px\"":"")+'/></a>';
                }
                return content;
            },
            getSelection : function(option) {
                if(window.getSelection){
                    return (option=='string')?encodeURIComponent($.trim(window.getSelection().getRangeAt(0).toString())):window.getSelection().getRangeAt(0);
                }
                else if(document.selection){
                    return (option=='string')?encodeURIComponent($.trim(document.selection.createRange().text)):document.selection.createRange();
                }
            },                
            showTooltip : function() {
                this.clear();
                if(this.getSelection('string').length < opts.minLength)
                    return;
                this.preloadShareIcons(opts.shareIcons);
                var range = this.getSelection();
                var newNode = document.createElement("mark");
                range.surroundContents(newNode);
                $('mark').addClass(opts.className);
                $('.'+opts.className).tooltipster({trigger:'custom',interactive:true,content:this.getContent(),animation:opts.animation});
                $('.'+opts.className).tooltipster('show');
                setSelection();
            },
            preloadShareIcons : function(array) {
                for (var i = 0; i < array.length; i++) {
                    var img = new Image();
                    img.src = array[i];
                }
            },
            clear : function() {
                $('.'+opts.className).tooltipster('hide');
                $('mark').contents().unwrap();
                $('mark').remove();
            }
        });        
        
        // initialize the awesome plugin
        $.fn.contentshare.init(this);
    };
    
    // default options
    $.fn.contentshare.defaults = {
        shareable  : {},
        shareIcons : ["img/fb.png","img/tw.png"],
        shareLinks : ["http://www.facebook.com/sharer.php?s=100&p[url]="+document.URL+"&p[title]="+document.title+"&p[summary]=" , "http://twitter.com/intent/tweet?text="],
        minLength  : 5,
        newTab     : true,
        className  : "contentshare",
        animation  : "grow"
    };

}(jQuery));
/*!
 * Masonry PACKAGED v3.1.5
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */


!function(a){function b(){}function c(a){function c(b){b.prototype.option||(b.prototype.option=function(b){a.isPlainObject(b)&&(this.options=a.extend(!0,this.options,b))})}function e(b,c){a.fn[b]=function(e){if("string"==typeof e){for(var g=d.call(arguments,1),h=0,i=this.length;i>h;h++){var j=this[h],k=a.data(j,b);if(k)if(a.isFunction(k[e])&&"_"!==e.charAt(0)){var l=k[e].apply(k,g);if(void 0!==l)return l}else f("no such method '"+e+"' for "+b+" instance");else f("cannot call methods on "+b+" prior to initialization; attempted to call '"+e+"'")}return this}return this.each(function(){var d=a.data(this,b);d?(d.option(e),d._init()):(d=new c(this,e),a.data(this,b,d))})}}if(a){var f="undefined"==typeof console?b:function(a){console.error(a)};return a.bridget=function(a,b){c(b),e(a,b)},a.bridget}}var d=Array.prototype.slice;"function"==typeof define&&define.amd?define("jquery-bridget/jquery.bridget",["jquery"],c):c(a.jQuery)}(window),function(a){function b(b){var c=a.event;return c.target=c.target||c.srcElement||b,c}var c=document.documentElement,d=function(){};c.addEventListener?d=function(a,b,c){a.addEventListener(b,c,!1)}:c.attachEvent&&(d=function(a,c,d){a[c+d]=d.handleEvent?function(){var c=b(a);d.handleEvent.call(d,c)}:function(){var c=b(a);d.call(a,c)},a.attachEvent("on"+c,a[c+d])});var e=function(){};c.removeEventListener?e=function(a,b,c){a.removeEventListener(b,c,!1)}:c.detachEvent&&(e=function(a,b,c){a.detachEvent("on"+b,a[b+c]);try{delete a[b+c]}catch(d){a[b+c]=void 0}});var f={bind:d,unbind:e};"function"==typeof define&&define.amd?define("eventie/eventie",f):"object"==typeof exports?module.exports=f:a.eventie=f}(this),function(a){function b(a){"function"==typeof a&&(b.isReady?a():f.push(a))}function c(a){var c="readystatechange"===a.type&&"complete"!==e.readyState;if(!b.isReady&&!c){b.isReady=!0;for(var d=0,g=f.length;g>d;d++){var h=f[d];h()}}}function d(d){return d.bind(e,"DOMContentLoaded",c),d.bind(e,"readystatechange",c),d.bind(a,"load",c),b}var e=a.document,f=[];b.isReady=!1,"function"==typeof define&&define.amd?(b.isReady="function"==typeof requirejs,define("doc-ready/doc-ready",["eventie/eventie"],d)):a.docReady=d(a.eventie)}(this),function(){function a(){}function b(a,b){for(var c=a.length;c--;)if(a[c].listener===b)return c;return-1}function c(a){return function(){return this[a].apply(this,arguments)}}var d=a.prototype,e=this,f=e.EventEmitter;d.getListeners=function(a){var b,c,d=this._getEvents();if(a instanceof RegExp){b={};for(c in d)d.hasOwnProperty(c)&&a.test(c)&&(b[c]=d[c])}else b=d[a]||(d[a]=[]);return b},d.flattenListeners=function(a){var b,c=[];for(b=0;b<a.length;b+=1)c.push(a[b].listener);return c},d.getListenersAsObject=function(a){var b,c=this.getListeners(a);return c instanceof Array&&(b={},b[a]=c),b||c},d.addListener=function(a,c){var d,e=this.getListenersAsObject(a),f="object"==typeof c;for(d in e)e.hasOwnProperty(d)&&-1===b(e[d],c)&&e[d].push(f?c:{listener:c,once:!1});return this},d.on=c("addListener"),d.addOnceListener=function(a,b){return this.addListener(a,{listener:b,once:!0})},d.once=c("addOnceListener"),d.defineEvent=function(a){return this.getListeners(a),this},d.defineEvents=function(a){for(var b=0;b<a.length;b+=1)this.defineEvent(a[b]);return this},d.removeListener=function(a,c){var d,e,f=this.getListenersAsObject(a);for(e in f)f.hasOwnProperty(e)&&(d=b(f[e],c),-1!==d&&f[e].splice(d,1));return this},d.off=c("removeListener"),d.addListeners=function(a,b){return this.manipulateListeners(!1,a,b)},d.removeListeners=function(a,b){return this.manipulateListeners(!0,a,b)},d.manipulateListeners=function(a,b,c){var d,e,f=a?this.removeListener:this.addListener,g=a?this.removeListeners:this.addListeners;if("object"!=typeof b||b instanceof RegExp)for(d=c.length;d--;)f.call(this,b,c[d]);else for(d in b)b.hasOwnProperty(d)&&(e=b[d])&&("function"==typeof e?f.call(this,d,e):g.call(this,d,e));return this},d.removeEvent=function(a){var b,c=typeof a,d=this._getEvents();if("string"===c)delete d[a];else if(a instanceof RegExp)for(b in d)d.hasOwnProperty(b)&&a.test(b)&&delete d[b];else delete this._events;return this},d.removeAllListeners=c("removeEvent"),d.emitEvent=function(a,b){var c,d,e,f,g=this.getListenersAsObject(a);for(e in g)if(g.hasOwnProperty(e))for(d=g[e].length;d--;)c=g[e][d],c.once===!0&&this.removeListener(a,c.listener),f=c.listener.apply(this,b||[]),f===this._getOnceReturnValue()&&this.removeListener(a,c.listener);return this},d.trigger=c("emitEvent"),d.emit=function(a){var b=Array.prototype.slice.call(arguments,1);return this.emitEvent(a,b)},d.setOnceReturnValue=function(a){return this._onceReturnValue=a,this},d._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},d._getEvents=function(){return this._events||(this._events={})},a.noConflict=function(){return e.EventEmitter=f,a},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return a}):"object"==typeof module&&module.exports?module.exports=a:this.EventEmitter=a}.call(this),function(a){function b(a){if(a){if("string"==typeof d[a])return a;a=a.charAt(0).toUpperCase()+a.slice(1);for(var b,e=0,f=c.length;f>e;e++)if(b=c[e]+a,"string"==typeof d[b])return b}}var c="Webkit Moz ms Ms O".split(" "),d=document.documentElement.style;"function"==typeof define&&define.amd?define("get-style-property/get-style-property",[],function(){return b}):"object"==typeof exports?module.exports=b:a.getStyleProperty=b}(window),function(a){function b(a){var b=parseFloat(a),c=-1===a.indexOf("%")&&!isNaN(b);return c&&b}function c(){for(var a={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},b=0,c=g.length;c>b;b++){var d=g[b];a[d]=0}return a}function d(a){function d(a){if("string"==typeof a&&(a=document.querySelector(a)),a&&"object"==typeof a&&a.nodeType){var d=f(a);if("none"===d.display)return c();var e={};e.width=a.offsetWidth,e.height=a.offsetHeight;for(var k=e.isBorderBox=!(!j||!d[j]||"border-box"!==d[j]),l=0,m=g.length;m>l;l++){var n=g[l],o=d[n];o=h(a,o);var p=parseFloat(o);e[n]=isNaN(p)?0:p}var q=e.paddingLeft+e.paddingRight,r=e.paddingTop+e.paddingBottom,s=e.marginLeft+e.marginRight,t=e.marginTop+e.marginBottom,u=e.borderLeftWidth+e.borderRightWidth,v=e.borderTopWidth+e.borderBottomWidth,w=k&&i,x=b(d.width);x!==!1&&(e.width=x+(w?0:q+u));var y=b(d.height);return y!==!1&&(e.height=y+(w?0:r+v)),e.innerWidth=e.width-(q+u),e.innerHeight=e.height-(r+v),e.outerWidth=e.width+s,e.outerHeight=e.height+t,e}}function h(a,b){if(e||-1===b.indexOf("%"))return b;var c=a.style,d=c.left,f=a.runtimeStyle,g=f&&f.left;return g&&(f.left=a.currentStyle.left),c.left=b,b=c.pixelLeft,c.left=d,g&&(f.left=g),b}var i,j=a("boxSizing");return function(){if(j){var a=document.createElement("div");a.style.width="200px",a.style.padding="1px 2px 3px 4px",a.style.borderStyle="solid",a.style.borderWidth="1px 2px 3px 4px",a.style[j]="border-box";var c=document.body||document.documentElement;c.appendChild(a);var d=f(a);i=200===b(d.width),c.removeChild(a)}}(),d}var e=a.getComputedStyle,f=e?function(a){return e(a,null)}:function(a){return a.currentStyle},g=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];"function"==typeof define&&define.amd?define("get-size/get-size",["get-style-property/get-style-property"],d):"object"==typeof exports?module.exports=d(require("get-style-property")):a.getSize=d(a.getStyleProperty)}(window),function(a,b){function c(a,b){return a[h](b)}function d(a){if(!a.parentNode){var b=document.createDocumentFragment();b.appendChild(a)}}function e(a,b){d(a);for(var c=a.parentNode.querySelectorAll(b),e=0,f=c.length;f>e;e++)if(c[e]===a)return!0;return!1}function f(a,b){return d(a),c(a,b)}var g,h=function(){if(b.matchesSelector)return"matchesSelector";for(var a=["webkit","moz","ms","o"],c=0,d=a.length;d>c;c++){var e=a[c],f=e+"MatchesSelector";if(b[f])return f}}();if(h){var i=document.createElement("div"),j=c(i,"div");g=j?c:f}else g=e;"function"==typeof define&&define.amd?define("matches-selector/matches-selector",[],function(){return g}):window.matchesSelector=g}(this,Element.prototype),function(a){function b(a,b){for(var c in b)a[c]=b[c];return a}function c(a){for(var b in a)return!1;return b=null,!0}function d(a){return a.replace(/([A-Z])/g,function(a){return"-"+a.toLowerCase()})}function e(a,e,f){function h(a,b){a&&(this.element=a,this.layout=b,this.position={x:0,y:0},this._create())}var i=f("transition"),j=f("transform"),k=i&&j,l=!!f("perspective"),m={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend",transition:"transitionend"}[i],n=["transform","transition","transitionDuration","transitionProperty"],o=function(){for(var a={},b=0,c=n.length;c>b;b++){var d=n[b],e=f(d);e&&e!==d&&(a[d]=e)}return a}();b(h.prototype,a.prototype),h.prototype._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},h.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},h.prototype.getSize=function(){this.size=e(this.element)},h.prototype.css=function(a){var b=this.element.style;for(var c in a){var d=o[c]||c;b[d]=a[c]}},h.prototype.getPosition=function(){var a=g(this.element),b=this.layout.options,c=b.isOriginLeft,d=b.isOriginTop,e=parseInt(a[c?"left":"right"],10),f=parseInt(a[d?"top":"bottom"],10);e=isNaN(e)?0:e,f=isNaN(f)?0:f;var h=this.layout.size;e-=c?h.paddingLeft:h.paddingRight,f-=d?h.paddingTop:h.paddingBottom,this.position.x=e,this.position.y=f},h.prototype.layoutPosition=function(){var a=this.layout.size,b=this.layout.options,c={};b.isOriginLeft?(c.left=this.position.x+a.paddingLeft+"px",c.right=""):(c.right=this.position.x+a.paddingRight+"px",c.left=""),b.isOriginTop?(c.top=this.position.y+a.paddingTop+"px",c.bottom=""):(c.bottom=this.position.y+a.paddingBottom+"px",c.top=""),this.css(c),this.emitEvent("layout",[this])};var p=l?function(a,b){return"translate3d("+a+"px, "+b+"px, 0)"}:function(a,b){return"translate("+a+"px, "+b+"px)"};h.prototype._transitionTo=function(a,b){this.getPosition();var c=this.position.x,d=this.position.y,e=parseInt(a,10),f=parseInt(b,10),g=e===this.position.x&&f===this.position.y;if(this.setPosition(a,b),g&&!this.isTransitioning)return void this.layoutPosition();var h=a-c,i=b-d,j={},k=this.layout.options;h=k.isOriginLeft?h:-h,i=k.isOriginTop?i:-i,j.transform=p(h,i),this.transition({to:j,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})},h.prototype.goTo=function(a,b){this.setPosition(a,b),this.layoutPosition()},h.prototype.moveTo=k?h.prototype._transitionTo:h.prototype.goTo,h.prototype.setPosition=function(a,b){this.position.x=parseInt(a,10),this.position.y=parseInt(b,10)},h.prototype._nonTransition=function(a){this.css(a.to),a.isCleaning&&this._removeStyles(a.to);for(var b in a.onTransitionEnd)a.onTransitionEnd[b].call(this)},h.prototype._transition=function(a){if(!parseFloat(this.layout.options.transitionDuration))return void this._nonTransition(a);var b=this._transn;for(var c in a.onTransitionEnd)b.onEnd[c]=a.onTransitionEnd[c];for(c in a.to)b.ingProperties[c]=!0,a.isCleaning&&(b.clean[c]=!0);if(a.from){this.css(a.from);var d=this.element.offsetHeight;d=null}this.enableTransition(a.to),this.css(a.to),this.isTransitioning=!0};var q=j&&d(j)+",opacity";h.prototype.enableTransition=function(){this.isTransitioning||(this.css({transitionProperty:q,transitionDuration:this.layout.options.transitionDuration}),this.element.addEventListener(m,this,!1))},h.prototype.transition=h.prototype[i?"_transition":"_nonTransition"],h.prototype.onwebkitTransitionEnd=function(a){this.ontransitionend(a)},h.prototype.onotransitionend=function(a){this.ontransitionend(a)};var r={"-webkit-transform":"transform","-moz-transform":"transform","-o-transform":"transform"};h.prototype.ontransitionend=function(a){if(a.target===this.element){var b=this._transn,d=r[a.propertyName]||a.propertyName;if(delete b.ingProperties[d],c(b.ingProperties)&&this.disableTransition(),d in b.clean&&(this.element.style[a.propertyName]="",delete b.clean[d]),d in b.onEnd){var e=b.onEnd[d];e.call(this),delete b.onEnd[d]}this.emitEvent("transitionEnd",[this])}},h.prototype.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(m,this,!1),this.isTransitioning=!1},h.prototype._removeStyles=function(a){var b={};for(var c in a)b[c]="";this.css(b)};var s={transitionProperty:"",transitionDuration:""};return h.prototype.removeTransitionStyles=function(){this.css(s)},h.prototype.removeElem=function(){this.element.parentNode.removeChild(this.element),this.emitEvent("remove",[this])},h.prototype.remove=function(){if(!i||!parseFloat(this.layout.options.transitionDuration))return void this.removeElem();var a=this;this.on("transitionEnd",function(){return a.removeElem(),!0}),this.hide()},h.prototype.reveal=function(){delete this.isHidden,this.css({display:""});var a=this.layout.options;this.transition({from:a.hiddenStyle,to:a.visibleStyle,isCleaning:!0})},h.prototype.hide=function(){this.isHidden=!0,this.css({display:""});var a=this.layout.options;this.transition({from:a.visibleStyle,to:a.hiddenStyle,isCleaning:!0,onTransitionEnd:{opacity:function(){this.isHidden&&this.css({display:"none"})}}})},h.prototype.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},h}var f=a.getComputedStyle,g=f?function(a){return f(a,null)}:function(a){return a.currentStyle};"function"==typeof define&&define.amd?define("outlayer/item",["eventEmitter/EventEmitter","get-size/get-size","get-style-property/get-style-property"],e):(a.Outlayer={},a.Outlayer.Item=e(a.EventEmitter,a.getSize,a.getStyleProperty))}(window),function(a){function b(a,b){for(var c in b)a[c]=b[c];return a}function c(a){return"[object Array]"===l.call(a)}function d(a){var b=[];if(c(a))b=a;else if(a&&"number"==typeof a.length)for(var d=0,e=a.length;e>d;d++)b.push(a[d]);else b.push(a);return b}function e(a,b){var c=n(b,a);-1!==c&&b.splice(c,1)}function f(a){return a.replace(/(.)([A-Z])/g,function(a,b,c){return b+"-"+c}).toLowerCase()}function g(c,g,l,n,o,p){function q(a,c){if("string"==typeof a&&(a=h.querySelector(a)),!a||!m(a))return void(i&&i.error("Bad "+this.constructor.namespace+" element: "+a));this.element=a,this.options=b({},this.constructor.defaults),this.option(c);var d=++r;this.element.outlayerGUID=d,s[d]=this,this._create(),this.options.isInitLayout&&this.layout()}var r=0,s={};return q.namespace="outlayer",q.Item=p,q.defaults={containerStyle:{position:"relative"},isInitLayout:!0,isOriginLeft:!0,isOriginTop:!0,isResizeBound:!0,isResizingContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}},b(q.prototype,l.prototype),q.prototype.option=function(a){b(this.options,a)},q.prototype._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),b(this.element.style,this.options.containerStyle),this.options.isResizeBound&&this.bindResize()},q.prototype.reloadItems=function(){this.items=this._itemize(this.element.children)},q.prototype._itemize=function(a){for(var b=this._filterFindItemElements(a),c=this.constructor.Item,d=[],e=0,f=b.length;f>e;e++){var g=b[e],h=new c(g,this);d.push(h)}return d},q.prototype._filterFindItemElements=function(a){a=d(a);for(var b=this.options.itemSelector,c=[],e=0,f=a.length;f>e;e++){var g=a[e];if(m(g))if(b){o(g,b)&&c.push(g);for(var h=g.querySelectorAll(b),i=0,j=h.length;j>i;i++)c.push(h[i])}else c.push(g)}return c},q.prototype.getItemElements=function(){for(var a=[],b=0,c=this.items.length;c>b;b++)a.push(this.items[b].element);return a},q.prototype.layout=function(){this._resetLayout(),this._manageStamps();var a=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;this.layoutItems(this.items,a),this._isLayoutInited=!0},q.prototype._init=q.prototype.layout,q.prototype._resetLayout=function(){this.getSize()},q.prototype.getSize=function(){this.size=n(this.element)},q.prototype._getMeasurement=function(a,b){var c,d=this.options[a];d?("string"==typeof d?c=this.element.querySelector(d):m(d)&&(c=d),this[a]=c?n(c)[b]:d):this[a]=0},q.prototype.layoutItems=function(a,b){a=this._getItemsForLayout(a),this._layoutItems(a,b),this._postLayout()},q.prototype._getItemsForLayout=function(a){for(var b=[],c=0,d=a.length;d>c;c++){var e=a[c];e.isIgnored||b.push(e)}return b},q.prototype._layoutItems=function(a,b){function c(){d.emitEvent("layoutComplete",[d,a])}var d=this;if(!a||!a.length)return void c();this._itemsOn(a,"layout",c);for(var e=[],f=0,g=a.length;g>f;f++){var h=a[f],i=this._getItemLayoutPosition(h);i.item=h,i.isInstant=b||h.isLayoutInstant,e.push(i)}this._processLayoutQueue(e)},q.prototype._getItemLayoutPosition=function(){return{x:0,y:0}},q.prototype._processLayoutQueue=function(a){for(var b=0,c=a.length;c>b;b++){var d=a[b];this._positionItem(d.item,d.x,d.y,d.isInstant)}},q.prototype._positionItem=function(a,b,c,d){d?a.goTo(b,c):a.moveTo(b,c)},q.prototype._postLayout=function(){this.resizeContainer()},q.prototype.resizeContainer=function(){if(this.options.isResizingContainer){var a=this._getContainerSize();a&&(this._setContainerMeasure(a.width,!0),this._setContainerMeasure(a.height,!1))}},q.prototype._getContainerSize=k,q.prototype._setContainerMeasure=function(a,b){if(void 0!==a){var c=this.size;c.isBorderBox&&(a+=b?c.paddingLeft+c.paddingRight+c.borderLeftWidth+c.borderRightWidth:c.paddingBottom+c.paddingTop+c.borderTopWidth+c.borderBottomWidth),a=Math.max(a,0),this.element.style[b?"width":"height"]=a+"px"}},q.prototype._itemsOn=function(a,b,c){function d(){return e++,e===f&&c.call(g),!0}for(var e=0,f=a.length,g=this,h=0,i=a.length;i>h;h++){var j=a[h];j.on(b,d)}},q.prototype.ignore=function(a){var b=this.getItem(a);b&&(b.isIgnored=!0)},q.prototype.unignore=function(a){var b=this.getItem(a);b&&delete b.isIgnored},q.prototype.stamp=function(a){if(a=this._find(a)){this.stamps=this.stamps.concat(a);for(var b=0,c=a.length;c>b;b++){var d=a[b];this.ignore(d)}}},q.prototype.unstamp=function(a){if(a=this._find(a))for(var b=0,c=a.length;c>b;b++){var d=a[b];e(d,this.stamps),this.unignore(d)}},q.prototype._find=function(a){return a?("string"==typeof a&&(a=this.element.querySelectorAll(a)),a=d(a)):void 0},q.prototype._manageStamps=function(){if(this.stamps&&this.stamps.length){this._getBoundingRect();for(var a=0,b=this.stamps.length;b>a;a++){var c=this.stamps[a];this._manageStamp(c)}}},q.prototype._getBoundingRect=function(){var a=this.element.getBoundingClientRect(),b=this.size;this._boundingRect={left:a.left+b.paddingLeft+b.borderLeftWidth,top:a.top+b.paddingTop+b.borderTopWidth,right:a.right-(b.paddingRight+b.borderRightWidth),bottom:a.bottom-(b.paddingBottom+b.borderBottomWidth)}},q.prototype._manageStamp=k,q.prototype._getElementOffset=function(a){var b=a.getBoundingClientRect(),c=this._boundingRect,d=n(a),e={left:b.left-c.left-d.marginLeft,top:b.top-c.top-d.marginTop,right:c.right-b.right-d.marginRight,bottom:c.bottom-b.bottom-d.marginBottom};return e},q.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},q.prototype.bindResize=function(){this.isResizeBound||(c.bind(a,"resize",this),this.isResizeBound=!0)},q.prototype.unbindResize=function(){this.isResizeBound&&c.unbind(a,"resize",this),this.isResizeBound=!1},q.prototype.onresize=function(){function a(){b.resize(),delete b.resizeTimeout}this.resizeTimeout&&clearTimeout(this.resizeTimeout);var b=this;this.resizeTimeout=setTimeout(a,100)},q.prototype.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},q.prototype.needsResizeLayout=function(){var a=n(this.element),b=this.size&&a;return b&&a.innerWidth!==this.size.innerWidth},q.prototype.addItems=function(a){var b=this._itemize(a);return b.length&&(this.items=this.items.concat(b)),b},q.prototype.appended=function(a){var b=this.addItems(a);b.length&&(this.layoutItems(b,!0),this.reveal(b))},q.prototype.prepended=function(a){var b=this._itemize(a);if(b.length){var c=this.items.slice(0);this.items=b.concat(c),this._resetLayout(),this._manageStamps(),this.layoutItems(b,!0),this.reveal(b),this.layoutItems(c)}},q.prototype.reveal=function(a){var b=a&&a.length;if(b)for(var c=0;b>c;c++){var d=a[c];d.reveal()}},q.prototype.hide=function(a){var b=a&&a.length;if(b)for(var c=0;b>c;c++){var d=a[c];d.hide()}},q.prototype.getItem=function(a){for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];if(d.element===a)return d}},q.prototype.getItems=function(a){if(a&&a.length){for(var b=[],c=0,d=a.length;d>c;c++){var e=a[c],f=this.getItem(e);f&&b.push(f)}return b}},q.prototype.remove=function(a){a=d(a);var b=this.getItems(a);if(b&&b.length){this._itemsOn(b,"remove",function(){this.emitEvent("removeComplete",[this,b])});for(var c=0,f=b.length;f>c;c++){var g=b[c];g.remove(),e(g,this.items)}}},q.prototype.destroy=function(){var a=this.element.style;a.height="",a.position="",a.width="";for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];d.destroy()}this.unbindResize(),delete this.element.outlayerGUID,j&&j.removeData(this.element,this.constructor.namespace)},q.data=function(a){var b=a&&a.outlayerGUID;return b&&s[b]},q.create=function(a,c){function d(){q.apply(this,arguments)}return Object.create?d.prototype=Object.create(q.prototype):b(d.prototype,q.prototype),d.prototype.constructor=d,d.defaults=b({},q.defaults),b(d.defaults,c),d.prototype.settings={},d.namespace=a,d.data=q.data,d.Item=function(){p.apply(this,arguments)},d.Item.prototype=new p,g(function(){for(var b=f(a),c=h.querySelectorAll(".js-"+b),e="data-"+b+"-options",g=0,k=c.length;k>g;g++){var l,m=c[g],n=m.getAttribute(e);try{l=n&&JSON.parse(n)}catch(o){i&&i.error("Error parsing "+e+" on "+m.nodeName.toLowerCase()+(m.id?"#"+m.id:"")+": "+o);continue}var p=new d(m,l);j&&j.data(m,a,p)}}),j&&j.bridget&&j.bridget(a,d),d},q.Item=p,q}var h=a.document,i=a.console,j=a.jQuery,k=function(){},l=Object.prototype.toString,m="object"==typeof HTMLElement?function(a){return a instanceof HTMLElement}:function(a){return a&&"object"==typeof a&&1===a.nodeType&&"string"==typeof a.nodeName},n=Array.prototype.indexOf?function(a,b){return a.indexOf(b)}:function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1};"function"==typeof define&&define.amd?define("outlayer/outlayer",["eventie/eventie","doc-ready/doc-ready","eventEmitter/EventEmitter","get-size/get-size","matches-selector/matches-selector","./item"],g):a.Outlayer=g(a.eventie,a.docReady,a.EventEmitter,a.getSize,a.matchesSelector,a.Outlayer.Item)}(window),function(a){function b(a,b){var d=a.create("masonry");return d.prototype._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns();var a=this.cols;for(this.colYs=[];a--;)this.colYs.push(0);this.maxY=0},d.prototype.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var a=this.items[0],c=a&&a.element;this.columnWidth=c&&b(c).outerWidth||this.containerWidth}this.columnWidth+=this.gutter,this.cols=Math.floor((this.containerWidth+this.gutter)/this.columnWidth),this.cols=Math.max(this.cols,1)},d.prototype.getContainerWidth=function(){var a=this.options.isFitWidth?this.element.parentNode:this.element,c=b(a);this.containerWidth=c&&c.innerWidth},d.prototype._getItemLayoutPosition=function(a){a.getSize();var b=a.size.outerWidth%this.columnWidth,d=b&&1>b?"round":"ceil",e=Math[d](a.size.outerWidth/this.columnWidth);e=Math.min(e,this.cols);for(var f=this._getColGroup(e),g=Math.min.apply(Math,f),h=c(f,g),i={x:this.columnWidth*h,y:g},j=g+a.size.outerHeight,k=this.cols+1-f.length,l=0;k>l;l++)this.colYs[h+l]=j;return i},d.prototype._getColGroup=function(a){if(2>a)return this.colYs;for(var b=[],c=this.cols+1-a,d=0;c>d;d++){var e=this.colYs.slice(d,d+a);b[d]=Math.max.apply(Math,e)}return b},d.prototype._manageStamp=function(a){var c=b(a),d=this._getElementOffset(a),e=this.options.isOriginLeft?d.left:d.right,f=e+c.outerWidth,g=Math.floor(e/this.columnWidth);g=Math.max(0,g);var h=Math.floor(f/this.columnWidth);h-=f%this.columnWidth?0:1,h=Math.min(this.cols-1,h);for(var i=(this.options.isOriginTop?d.top:d.bottom)+c.outerHeight,j=g;h>=j;j++)this.colYs[j]=Math.max(i,this.colYs[j])},d.prototype._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var a={height:this.maxY};return this.options.isFitWidth&&(a.width=this._getContainerFitWidth()),a},d.prototype._getContainerFitWidth=function(){for(var a=0,b=this.cols;--b&&0===this.colYs[b];)a++;return(this.cols-a)*this.columnWidth-this.gutter},d.prototype.needsResizeLayout=function(){var a=this.containerWidth;return this.getContainerWidth(),a!==this.containerWidth},d}var c=Array.prototype.indexOf?function(a,b){return a.indexOf(b)}:function(a,b){for(var c=0,d=a.length;d>c;c++){var e=a[c];if(e===b)return c}return-1};"function"==typeof define&&define.amd?define(["outlayer/outlayer","get-size/get-size"],b):a.Masonry=b(a.Outlayer,a.getSize)}(window);
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
    $.getJSON('http://api.facebook.com/restserver.php?method=links.getStats&callback=?&urls=' + escape(pageuri) + '&format=json', function(data) {
      // вставляем в DOM
      $('span', container).text(data[0].share_count);
      main.total.fb_cnt = parseInt(data[0].share_count);
    });
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
    $.getJSON('http://vkontakte.ru/share.php?act=count&index=1&url=' + pageuri + '&format=json&callback=?');
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

  $('.ajax_comments').click(function(e) {
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


  $('.open_auth_link, .open_reg_link').on('click', function(e){
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
        livewnd = window.open(a.attr('href'), 'echoliveplayer', 'location=no,locationbar=no,chrome=yes,titlebar=yes,menubar=no,toolbar=no,resizable=yes,scrollbars=yes,personalbar=no,directories=no,status=no,width=800,height=820');
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
        var vk = 'http://vkontakte.ru/share.php?url=%url%&title=%title%';
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
	$('.settings').settingsform();
	$('.removeentry').removeentry();
	
}); // DOM loaded

(function($) { //create closure
$.fn.settingsform = function(options){
	this.each(function(){
		var form = $(this);
		// попапы для смены email и password
		$('.fieldspopup').each(function(){
			var cont=$(this), opener=$('a[href="#'+cont.attr('id')+'"]');
			cont.css('display','none');
			opener.on('click',function(e){
				e.preventDefault();
				cont.find('.success').remove();
				cont.slideDown(200,function(){
					$(':input', cont).prop('disabled',false);
					$(document).off('.fieldspopup').on('click.fieldspopup', function(e){
						if ($(e.target).parents("#"+cont.attr('id')).length<1) {
							cont.css('display','none');
							cont.find('.success').remove();
							$(':input', cont).prop('disabled',true);
							$(document).off('.fieldspopup');
						}
					});
				});
			});
			// сменить пароль
			if (cont.hasClass('changepassword')) {
				cont.find('.error').css('display','none');
				cont.find('.button').on('click', function(e){
					e.preventDefault();
					cont.find('.error').css('display','none');
					cont.find('.success').remove();
					var inp = cont.find('.inpresetpassword'), val = inp.val();
					if (val.length<1) {
						cont.find('.required').css('display','block'); 
					} else if (val.length<6) {
						cont.find('.validate').css('display','block'); 
					} else {
						cont.find('.error').css('display','none');
// заглушка для сохранения пароля
						$.ajax({
							url: cont.data('path'),
							data: $(':input',cont).serialize(),
							method: 'POST',
							success: function(html){
								var success = $(html);
								inp.after(success);
							}
						});
					}
				});
			} //if (cont.hasClass('.changepassword'))

			// сменить e-mail
			if (cont.hasClass('changeemail')) {
				cont.find('.error').css('display','none');
				cont.find('.button').on('click', function(e){
					e.preventDefault();
					cont.find('.error').css('display','none');
					cont.find('.success').remove();
					var inp = cont.find('.inpresetemail'), val = inp.val();
					if (val.length<1) {
						cont.find('.required').css('display','block'); 
					} else if (!(/^([a-z0-9_\-]+\.)*[a-z0-9_\-]+@([a-z0-9][a-z0-9\-]*[a-z0-9]\.)+[a-z]{2,4}$/i).test(val)) {
						cont.find('.validate').css('display','block'); 
					} else {
						cont.find('.error').css('display','none');
// заглушка для сохранения емайла 
						$.ajax({
							url: cont.data('path'),
							data: $(':input',cont).serialize(),
							method: 'POST',
							success: function(html){
								var success = $(html);
								inp.after(success);
							}
						});
					}
				});
			} //if (cont.hasClass('.changeemail'))


		});





// отправка формы
		form.on('submit', function(e){
			var form =$(this);form.formValidator();
			if (!form.data('valid')) {
				$.scrollTo(form)
				return false;
			}
			return true;
		});



	});
}
//end of closure
})(jQuery);




(function($) { //create closure
$.fn.removeentry = function(options){
	this.each(function(){
		var cont = $(this), a = cont.children('a'), confirm = cont.children('.confirm'), 
		bcancel = cont.find('.cancel'), bok = cont.find('.ok'), entry = cont.parents('.entry:eq(0)');
		a.on('click', function(e){
			e.preventDefault();
			confirm.slideDown(200, function(){
				$(document).off('.confirm').on('click.confirm', function(e){
					if ($(e.target).parents(".confirm").length<1) {
						confirm.css('display','none');
						$(document).off('.confirm');
					}
				});
			});
		});
		bcancel.on('click', function(e){
			e.preventDefault();
				confirm.css('display','none');
				$(document).off('.confirm');
		});
		bok.on('click', function(e){
			e.preventDefault();
				$.ajax({
					url: $(this).attr('href'),
					method: 'GET',
					success: function(html){
						entry.addClass('remove').animate({'opacity':0}, 400, function(){
							entry.remove();
						});
					}
				});
				confirm.css('display','none');
				$(document).off('.confirm');
		});
	});
}
//end of closure
})(jQuery);




// SETTINGS
_MOBILEPOPUP = {'link':'http://m.echo.msk.ru/',
		'text':'Вы можете перейти<br />на мобильную версию сайта', // HTML is allowed
		'yes':'Перейти',
		'no':'Отказаться',
		'id':'goToMobilePopUp', // popup ID attribute
		'returntimeout': 30*60*1000 // min * sec * ms => 30*60*1000  => 30min
		};
(function () {
   var main = /\d+/.exec($('body').attr('data-main')) ;
   var mlink = 'http://m.echo.msk.ru'
   if (/^\/news/.test(location.pathname)) {
     if (main) {
       mlink += '/news/detail.php?ID=' + main ;
     } else {
       mlink += '/news/' ;
     }
   }
   if (/^\/blog/.test(location.pathname)) {
     if (main) {
       mlink += '/blogs/detail.php?ID=' + main ;
     } else {
       mlink += '/blogs/' ;
     }
   }
   if (/^\/schedule/.test(location.pathname)) {
     mlink += '/schedule/' ;
   }
   if (/^\/polls/.test(location.pathname)) {
     mlink += '/polls/' ;
   }
   if (/^\/(contributors|guests)/.test(location.pathname)) {
     if (main) {
       mlink += '/peoples/detail.php?ID=' + main ;
     } else {
       mlink += '/peoples/' ;
     }
   }
   if (/^\/(programs|interview)/.test(location.pathname)) {
     if (main) {
       if (/^P/.test($('body').attr('data-main'))) {
	 mlink += '/programs/detail.php?ID=' + main ;
       } else {
	 mlink += '/interview/detail.php?ID=' + main ;
       }
     } else {
       if (/^\/programs/.test(location.pathname)) {
	 mlink += '/programs/' ;
       } else {
	 mlink += '/interview/' ;
       }
     }
   }
   _MOBILEPOPUP.link = mlink ;
})() ;

$(document).ready(function() {
    if (window.echoInit != undefined)
      window.echoInit() ;
      
    $('.cont_tab[data-selected]').each(function () {
        var me = $(this);
        var sel = me.attr('data-selected') ;
        me.find("a[data-key='" + sel + "']").each(function () {
            $(this).addClass('current') ;
        }) ;
    }) ;

    $('a.print').click(function(e) {
      e.preventDefault() ;
      link = $('link#css-print') ;
      if (link.attr('media') == 'all') {
        link.attr('media', 'print') ;
      } else {
        link.attr('media', 'all') ;
      }
    }) ;

    $('div.typical a[href]:not([target])').each(function() {
      linkedHost = this.hostname.toLowerCase() ;
      if (linkedHost != window.location.hostname.toLowerCase() &&
	  linkedHost != 'echo.msk.ru') {
	$(this).attr('target', '_blank');
      }
    }) ;
      
    (function () {
      var comments_path = '/elements/' + $('body').attr('data-main') +
        '/comments_page/'
      var cp = $('.commentPage .pager a') ;
      if (cp.size() > 0) {
        var cid = window.location.hash ;
	cp.find('a[href="' + cid + '"]').each(function () {
	  $(this).trigger('click') ;
	}) ;
	
	if (cid.match(/^#cmnt-/)) {
	  $.get(comments_path + cid.substr(1) + '.html', function (data) {
	    $('.commentPage').html(data) ;
	    window.location.hash = cid;
	  }) ;
	}
      }

      $(document).on('click', '.commentList .pager a.ajax', function (e) {
	var me = $(this) ;
	$.get(comments_path + me.attr('name') + '.html', function (data) {
	  $('.commentPage').html(data) ;
	  window.location.hash = '#comments';
	}) ;
	e.preventDefault() ;
      }) ;

      $('.c_select').change(function (e) {
	var page = $(this).find('option:selected').val();
	switch (page) {
	case 'full' :
	  window.location.assign($('.com_titl h2 a').attr('href')) ;
	  break ;
	case 'all' :
	  window.location.reload() ;
	  window.location.hash = '#comments' ;
	  break ;
	case 'answered' :
	  window.location.assign($('div.conthead a.right').attr('href')) ;
	  break ;
	case 'queue' :
	  window.location.assign($('div.conthead a.right').attr('href') + 'queue') ;
	  break ;
	default :
	  $('div.commentPage').load(comments_path + page + '.html',
	    function () {
	      window.location.hash = '#comments' ;
	    }) ;
	}
      }) ;
    })() ;

    (function () {
      $('a.like, a.recom').on('switch', function (e, state) {
	var self = $(this) ;
	if (state == 1) {
	  self.addClass('on-state') ;
	} else {
	  self.removeClass('on-state') ;
	} ;
      }) ;
      $('a.like').on('switch', function (e, state, count) {
	if (count) {
	  var self = $(this) ;
	  self.html('<span class="wsico">&nbsp;</span>' + count) ;
	  self.parent().find('div.likeList').load(self.attr('href')) ;
	}
      }) ;
      $('a.recom').on('switch', function (e, state) {
	var self = $(this) ;
	if (state == 1) {
	  self.html('<span class="wsico">&nbsp;</span>не рекомендовать') ;
	} else {
	  self.html('<span class="wsico">&nbsp;</span>рекомендовать') ;
	} ;
      }) ;

      function like_caption (e) {
        if (e.hasClass('flag')) {
	  if (e.hasClass('on-state')) {
	    e.html('(Вы пожаловались)') ;
	  } else {
	    e.html('Пожаловаться') ;
	  }
	}
	if (e.hasClass('like'))
	  e.parent().find('div.likeList').load(e.attr('href')) ;
      } ;

      $(document).on('click', 'a.like, a.recom, a.flag, a.foe, a.ignor',
	function (e) {
	  var self = $(this) ;
	  var data = {state: 0, _method: 'put'} ;
	  if (self.hasClass('on-state')) {
	    data.state = 0 ;
	  } else {
	    if (self.hasClass('flag') &&
	      !confirm('Действительно пожаловаться?')) {
       	      e.preventDefault() ;
	      return ;
	    }
	    if (self.hasClass('ignor')) {
	      if (confirm('Вы уверены, что хотите внести пользователя в чёрный список?')) {
	        self.hide() ;
	      } else {
	        e.preventDefault() ;
		return ;
	      } ;
	    } ;
	    data.state = 1 ;
	  }
	  $.post(self.attr('href'), data, function (d) {
	    if (d.error) {
	      alert(d.error) ;
	    } else {
	      if (self.hasClass('like') || self.hasClass('recom')) {
	        $('[href="' + self.attr('href') + '"]').
	          trigger('switch', [d.state, d.count]) ;
	      } else {
	        if (d.state == 1) {
	          self.addClass('on-state') ;
	        } else {
	          self.removeClass('on-state') ;
	        } ;
	        like_caption(self) ;
	      } ;
	    } ;
	  }, 'json') ;
	  e.preventDefault() ;
        });

      $(document).on('click', 'a.hide', function (e) {
	var self = $(this) ;
	var opts = {} ;
	if (self.hasClass('delete'))
	  opts._method = 'delete' ;
	$.post(self.attr('href'), opts, function (d) {
	  self.parents('div.onecomm').first().replaceWith(
	    $(d).find('div.onecomm')) ;
	}, 'html') ;
	e.preventDefault() ;
      }) ;

      $(document).on('click', 'a.ban-request', function (e) {
	var self = $(this) ;
	if (confirm('Предложить забанить этого пользователя?')) {
	  $.post(self.attr('href'), function (d) {
	    if (d.error) {
	      alert(d.error) ;
	    } else {
	      self.hide() ;
	      alert('Сообщение отправлено') ;
	    }
	  }, 'json') ;
	} ;
	e.preventDefault() ;
      }) ;

      var udata = $.data(document.body, 'user') || {} ;
      var access_level = udata.access_level || 0 ;
      if (access_level < 6 && udata.own_id &&
	$('div.blog').attr('data-creator') == udata.own_id) {
        access_level = 6 ;
      } ;

      if (udata.liked) {
	$.each(udata.liked, function (i, v) {
	  $('a[href="/likes/' + v + '/"]').trigger('switch', [1]) ;
	}) ;
      } ;
      if (udata.foes) {
	$.each(udata.foes, function (i, v) {
	  $('#foe' + v).addClass('on-state') ;
	  $('[data-author="' + v + '"]').each(function (i, cmnt) {
	    var self = $(this) ;
	    if (self.hasClass('bcast-q')) {
	      self.html('(вопрос проигнорирован)') ;
	    } else {
	      self.html('(комментарий проигнорирован)') ;
	    }
	  }) ;
	}) ;
      } ;

      $(document).on('mouseover', '.onecomm.to-load', function () {
	var self = $(this) ;
	self.removeClass('to-load') ;
	var author = self.attr('data-author') ;
	var mlevel = self.attr('data-mlevel') ;
	var btn_bar = self.find('div.morelink') ;
	var hidden = self.hasClass('cmnt-hidden') ;
	var autor_div = self.find('.author .about') ;
        var like_btn = btn_bar.find('a.like') ;
	if ((udata.own_id != author) && udata.liked && udata.flagged) {
	  if (udata.liked.indexOf(btn_bar.attr('id')) >= 0) {
	    like_btn.addClass('on-state').attr('title', 'Вы поддержали') ;
	  } ;
	  if (mlevel == 3) {
	    // cannot hide other moderator's comments
	    mlevel ++ ;
	  } ;
	  if (access_level >= 2) { // can ignore
	    self.find('.author a.dark').after(
	      '<a href="/foes/' + author + '" class="ignor">Игнорировать</a>') ;
	  } ;
	  if (access_level >= 3 && access_level < 6) { //can flag
	    btn_bar.append('<a ref="nofollow" href="/flags/' +
	      btn_bar.attr('id') + '" class="red flag">Пожаловаться</a>') ;
	    if (udata.flagged.indexOf(btn_bar.attr('id')) >= 0 ) {
	      var flag_btn = btn_bar.find('a.flag') ;
	      flag_btn.addClass('on-state') ;
	      like_caption(flag_btn) ;
	    }
	  } ;
	} ;

	if (access_level > 3 && access_level > mlevel) {
	  if (hidden) {
	    btn_bar.append(
	      '<a rel="nofollow" href="/moderate/comments/' +
	      btn_bar.attr('id') +
	      '/unhide.html" class="red hide">(Показать)</a>') ;
	  } else {
	    btn_bar.append(
	      '<a rel="nofollow" href="/moderate/comments/' +
	      btn_bar.attr('id') +
	      '/hide.html" class="red hide">(Скрыть)</a>') ;
	  } ;
	  if (access_level < 6) {
	    if (autor_div.size() > 0 && udata.own_id != author) {
	      btn_bar.append('<a rel="nofollow" href="/moderate/comments/' +
		  btn_bar.attr('id') +
		  '/ban_request.html" class="red ban-request">(Предложить бан)</a>') ;
	    } ;
	  } else {
	    btn_bar.append(
	      '<a rel="nofollow" href="/moderate/comments/' +
	      btn_bar.attr('id') +
	      '.html" class="red hide delete">(Удалить)</a>') ;
	    if (autor_div.size() > 0) {
	      btn_bar.append(
		'<a rel="nofollow" href="/moderate/comments/' +
		btn_bar.attr('id') +
		'/ban.html" class="red hide">(Забанить)</a>') ;
	    } ;
	  } ;
	} ;
	if (access_level > 3 && autor_div.size() == 0) {
	  btn_bar.append('<strong>(Забанен)</strong>') ;
	} ;
      }) ;
      $(document).on('mouseover', '.likeBlock.to-load', function () {
	var self = $(this) ;
	self.removeClass('to-load') ;
	like_caption(self.find('a.like')) ;
      }) ;
    }) () ;

    $(document).on('click', '.answ', function (e) {
	var self = $(this) ;
	var div = self.parents('div.onecomm').first() ;
	div.find('.error').remove() ;
	if (div.find('div.answform').size() > 0) {
	  $('.answform').remove().appendTo($('.commentPage')).hide() ;
	} else {
	  $('.answform').remove().appendTo(div).show() ;
	  $('.answform input#comment_parent_id').
	    val(self.attr('data-parent-id')) ;
	  $('.answform textarea#comment_body').val(div.find('strong.name').text() + ': ' +
	    $('.answform textarea#comment_body').val()) ;
	}
	e.preventDefault() ;
    }) ;

    $(document).on('ajax:success', '.add-comm form', function (ev, data) {
	var reply = $(data) ;
	var self = $(this) ;
	self.parent().find('.error').remove() ;
	if (reply.hasClass('error')) {
	 self.before(reply) ;
	} else {
          if (self.find('#qa_answer').size() > 0) {
	    self.parents('.commBlock').first().replaceWith(reply) ;
	  } else if (self.find('#comment_parent_id').size() > 0) {
	    reply.insertAfter(self.parents('.onecomm').first()) ;
	    $('.answform').remove().appendTo($('.commentPage')).hide() ;
	  } else {
	    reply.prependTo($('div.commentPage')) ;
	  }
	  self.find('textarea').val('') ;
	}
    }) ;

    $(document).on('click', '.qa-reply', function (e) {
      e.preventDefault() ;
      $(this).closest('.commBlock').find('.answform').toggle() ;
    }) ;

    $(document).on('ajax:success', 'a.qa-moderate', function (e, data) {
      e.preventDefault() ;
      $(this).closest('.commBlock').parents('.commBlock').first().
        replaceWith(data) ;
    }) ;

    (function () {
        var sav = $('div.avatar#setavatar') ;
        $('.fileupload input[type=file]').on('change', function (e) {
            var fd = new FormData() ;
            fd.append(this.name, this.files[0]) ;
            $.ajax({
                url: $(this).data('path'),
                method: 'POST',
                data: fd,
                cache: false,
                contentType: false,
                processData: false,
                error: function () { alert('Ошибка загрузки файла') ; },
                success: function (html) {
                    $('.pic', sav).html(html) ;
                    $('a.delete', sav).show() ;
                }
            }) ;
        }) ;

        $(document).on('ajax:success', 'div.avatar#setavatar a.delete',
            function (e, data) {
                $('.pic', sav).html(data) ;
                $(this).hide() ;
            }
        ) ;

    })() ;

    $('.filtrsearch input').click(function () {
      $('#search_cond_what').val($(this).val()) ;
    }) ;
    $('select.c_select#search_cond_when').change(function () {
	$('form#search_when').submit() ;
    }) ;

    $('a.calend input.calendar').on('change', function () {
        var self = $(this) ;
        var form = self.closest('form') ;
        var fmt = form.data('format') ;
        if (fmt) {
            var d = self.val().split('.').reverse() ;
            var a = form.attr('action') ;
            switch (fmt) {
                case 'schedule':
                    form.attr('action', a + d.join('-') + '.html') ;
                    break ;
                case 'news':
                    form.attr('action', a + d.join('/') + '.html') ;
                    break ;
            }
        }
        form.submit() ;
    }) ;

    $('.mainpreview').on('change', function (e) {
        var self = $(this) ;
        var d = $('span[data-more]', self) ;
        e.preventDefault() ;
        if (d.length > 0) {
            $('.moregiant a[href]', self).attr('href', d.data('more')) ;
            d.remove() ;
        } else {
            $('.moregiant', self).remove() ;
        } ;
    }) ;
    $(document).delegate('[data-remote].replace-me', 'ajax:success',
        function (e, html, st) { $(this).replaceWith(html) ; }) ;
    $(function () {
	$(".js-tabs").tabs();
	$(".js-top-7").masonry({
          itemSelector: ".js-top-7-item",
          columnWidth: 220,
	  gutter: 20
    	});
    });

    $(function () {
	function updClubReq() {
	  if ($('#user_club_req').attr('checked')) {
	    $('.club_only').show() ;
	  } else {
	    $('.club_only').hide() ;
	  }
	} ;
	updClubReq() ;
	$('#user_club_req').on('change', function () {
	  updClubReq() ;
	}) ;
    }) ;

    (function () {
        var main = $('body').data('main') ;
        if (main != '') {
            var udata = $.data(document.body, 'user') || {} ;
            var data = {'main': main} ;
            if (udata.own_id) data['user_id'] = udata.own_id ;

            $.ajax({
                url: '/assets/counters.js',
                async: true,
                cache: false,
                data: data
            }) ;
        }
    })() ;
    
    $('form.voteform').submit(function () {
	var fa = $(this).find('.free_answer') ;
	if (fa.size() > 0 && fa.val() != '') {
	  return true ;
	}
	if ($(this).find('span.checked').size() == 0) {
	  alert('Пожалуйста, выберите ваш вариант ответа') ;
	  return false ;
	} ;
        return true ;
    }) ;

    $('blockquote.tw').each(function () {
        var self = $(this) ;
        var url = window.location.href ;
        var text = self.text() ;

        if (text.length > 120) return ;

        self.append(
                '<span class="twitter-share-button">' +
                '<span class="social_block">' +
                '<span class="iblock tw_sharer">' +
                '<a class="ico tw tw_btn" href="http://twitter.com/share?url=' +
                url +
                '&text=' +
                encodeURIComponent(text) +
                '" target="_blank" title="Retweet">' +
                '<strong class="wsico">Q</strong>' +
                '<span>Твитнуть</span>' +
                '</a></span></span></span>'
                ) ;
    }) ;

    $('.notifications a.close').on('click', function (e) {
	e.preventDefault() ;
	$(this).closest('.notifications').fadeOut() ;
    }) ;

    (function () {
        if (typeof(sched_current) != 'undefined' && sched_current && sched_now) {
            var i ;
            for (i = 0; i < sched_current.length; i += 1) {
                var c = sched_current[i] ;
                if (sched_now >= c[0]) {
                    $('.liveprogtitle').html(c[1]) ;
                    break ;
                }
            }
        }
    })() ;

    $(document).on('update', '.person_list', function () {
      $(this).find('.audionota').audionota();
    }) ;

    (function () {
      fbLink =
        "https://www.facebook.com/dialog/feed?app_id=229675500419533&link=" +
        document.URL + "&redirect_uri=" + document.URL + "&name=" + document.title + "&caption="
      twLink = "http://twitter.com/intent/tweet?text=" + document.URL + '%20' ;
      var author = $('meta[name=author]').attr('content') ;
      if (author.length > 0) {
	twLink += encodeURIComponent(author + ": ") ;
      } ;
      vkLink = "https://vk.com/share.php?url=" + document.URL + "&title=" +
        document.title + "&description="
      $("div.typical").contentshare({
	shareIcons : ["/i/contentshare/fb.png", "/i/contentshare/tw.png", "/i/contentshare/vk.png"],
	shareLinks : [fbLink, twLink, vkLink]
      }) ;
      $.fn.contentshare.defaults.shareable.on('mouseup',function(){
	$.fn.contentshare.showTooltip();
      });            
    })() ;
}) ;
// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
//  require_tree .












// require gotomobile

;
