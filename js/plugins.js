// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());


(function (factory) {

    if ( typeof define === 'function' && define.amd ) {

        // AMD. Register as an anonymous module.
        define([], factory);

    } else if ( typeof exports === 'object' ) {

        // Node/CommonJS
        module.exports = factory();

    } else {

        // Browser globals
        window.wNumb = factory();
    }

}(function(){

    'use strict';

var FormatOptions = [
    'decimals',
    'thousand',
    'mark',
    'prefix',
    'suffix',
    'encoder',
    'decoder',
    'negativeBefore',
    'negative',
    'edit',
    'undo'
];

// General

    // Reverse a string
    function strReverse ( a ) {
        return a.split('').reverse().join('');
    }

    // Check if a string starts with a specified prefix.
    function strStartsWith ( input, match ) {
        return input.substring(0, match.length) === match;
    }

    // Check is a string ends in a specified suffix.
    function strEndsWith ( input, match ) {
        return input.slice(-1 * match.length) === match;
    }

    // Throw an error if formatting options are incompatible.
    function throwEqualError( F, a, b ) {
        if ( (F[a] || F[b]) && (F[a] === F[b]) ) {
            throw new Error(a);
        }
    }

    // Check if a number is finite and not NaN
    function isValidNumber ( input ) {
        return typeof input === 'number' && isFinite( input );
    }

    // Provide rounding-accurate toFixed method.
    // Borrowed: http://stackoverflow.com/a/21323330/775265
    function toFixed ( value, exp ) {
        value = value.toString().split('e');
        value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));
        value = value.toString().split('e');
        return (+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp))).toFixed(exp);
    }


// Formatting

    // Accept a number as input, output formatted string.
    function formatTo ( decimals, thousand, mark, prefix, suffix, encoder, decoder, negativeBefore, negative, edit, undo, input ) {

        var originalInput = input, inputIsNegative, inputPieces, inputBase, inputDecimals = '', output = '';

        // Apply user encoder to the input.
        // Expected outcome: number.
        if ( encoder ) {
            input = encoder(input);
        }

        // Stop if no valid number was provided, the number is infinite or NaN.
        if ( !isValidNumber(input) ) {
            return false;
        }

        // Rounding away decimals might cause a value of -0
        // when using very small ranges. Remove those cases.
        if ( decimals !== false && parseFloat(input.toFixed(decimals)) === 0 ) {
            input = 0;
        }

        // Formatting is done on absolute numbers,
        // decorated by an optional negative symbol.
        if ( input < 0 ) {
            inputIsNegative = true;
            input = Math.abs(input);
        }

        // Reduce the number of decimals to the specified option.
        if ( decimals !== false ) {
            input = toFixed( input, decimals );
        }

        // Transform the number into a string, so it can be split.
        input = input.toString();

        // Break the number on the decimal separator.
        if ( input.indexOf('.') !== -1 ) {
            inputPieces = input.split('.');

            inputBase = inputPieces[0];

            if ( mark ) {
                inputDecimals = mark + inputPieces[1];
            }

        } else {

        // If it isn't split, the entire number will do.
            inputBase = input;
        }

        // Group numbers in sets of three.
        if ( thousand ) {
            inputBase = strReverse(inputBase).match(/.{1,3}/g);
            inputBase = strReverse(inputBase.join( strReverse( thousand ) ));
        }

        // If the number is negative, prefix with negation symbol.
        if ( inputIsNegative && negativeBefore ) {
            output += negativeBefore;
        }

        // Prefix the number
        if ( prefix ) {
            output += prefix;
        }

        // Normal negative option comes after the prefix. Defaults to '-'.
        if ( inputIsNegative && negative ) {
            output += negative;
        }

        // Append the actual number.
        output += inputBase;
        output += inputDecimals;

        // Apply the suffix.
        if ( suffix ) {
            output += suffix;
        }

        // Run the output through a user-specified post-formatter.
        if ( edit ) {
            output = edit ( output, originalInput );
        }

        // All done.
        return output;
    }

    // Accept a sting as input, output decoded number.
    function formatFrom ( decimals, thousand, mark, prefix, suffix, encoder, decoder, negativeBefore, negative, edit, undo, input ) {

        var originalInput = input, inputIsNegative, output = '';

        // User defined pre-decoder. Result must be a non empty string.
        if ( undo ) {
            input = undo(input);
        }

        // Test the input. Can't be empty.
        if ( !input || typeof input !== 'string' ) {
            return false;
        }

        // If the string starts with the negativeBefore value: remove it.
        // Remember is was there, the number is negative.
        if ( negativeBefore && strStartsWith(input, negativeBefore) ) {
            input = input.replace(negativeBefore, '');
            inputIsNegative = true;
        }

        // Repeat the same procedure for the prefix.
        if ( prefix && strStartsWith(input, prefix) ) {
            input = input.replace(prefix, '');
        }

        // And again for negative.
        if ( negative && strStartsWith(input, negative) ) {
            input = input.replace(negative, '');
            inputIsNegative = true;
        }

        // Remove the suffix.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice
        if ( suffix && strEndsWith(input, suffix) ) {
            input = input.slice(0, -1 * suffix.length);
        }

        // Remove the thousand grouping.
        if ( thousand ) {
            input = input.split(thousand).join('');
        }

        // Set the decimal separator back to period.
        if ( mark ) {
            input = input.replace(mark, '.');
        }

        // Prepend the negative symbol.
        if ( inputIsNegative ) {
            output += '-';
        }

        // Add the number
        output += input;

        // Trim all non-numeric characters (allow '.' and '-');
        output = output.replace(/[^0-9\.\-.]/g, '');

        // The value contains no parse-able number.
        if ( output === '' ) {
            return false;
        }

        // Covert to number.
        output = Number(output);

        // Run the user-specified post-decoder.
        if ( decoder ) {
            output = decoder(output);
        }

        // Check is the output is valid, otherwise: return false.
        if ( !isValidNumber(output) ) {
            return false;
        }

        return output;
    }


// Framework

    // Validate formatting options
    function validate ( inputOptions ) {

        var i, optionName, optionValue,
            filteredOptions = {};

        if ( inputOptions['suffix'] === undefined ) {
            inputOptions['suffix'] = inputOptions['postfix'];
        }

        for ( i = 0; i < FormatOptions.length; i+=1 ) {

            optionName = FormatOptions[i];
            optionValue = inputOptions[optionName];

            if ( optionValue === undefined ) {

                // Only default if negativeBefore isn't set.
                if ( optionName === 'negative' && !filteredOptions.negativeBefore ) {
                    filteredOptions[optionName] = '-';
                // Don't set a default for mark when 'thousand' is set.
                } else if ( optionName === 'mark' && filteredOptions.thousand !== '.' ) {
                    filteredOptions[optionName] = '.';
                } else {
                    filteredOptions[optionName] = false;
                }

            // Floating points in JS are stable up to 7 decimals.
            } else if ( optionName === 'decimals' ) {
                if ( optionValue >= 0 && optionValue < 8 ) {
                    filteredOptions[optionName] = optionValue;
                } else {
                    throw new Error(optionName);
                }

            // These options, when provided, must be functions.
            } else if ( optionName === 'encoder' || optionName === 'decoder' || optionName === 'edit' || optionName === 'undo' ) {
                if ( typeof optionValue === 'function' ) {
                    filteredOptions[optionName] = optionValue;
                } else {
                    throw new Error(optionName);
                }

            // Other options are strings.
            } else {

                if ( typeof optionValue === 'string' ) {
                    filteredOptions[optionName] = optionValue;
                } else {
                    throw new Error(optionName);
                }
            }
        }

        // Some values can't be extracted from a
        // string if certain combinations are present.
        throwEqualError(filteredOptions, 'mark', 'thousand');
        throwEqualError(filteredOptions, 'prefix', 'negative');
        throwEqualError(filteredOptions, 'prefix', 'negativeBefore');

        return filteredOptions;
    }

    // Pass all options as function arguments
    function passAll ( options, method, input ) {
        var i, args = [];

        // Add all options in order of FormatOptions
        for ( i = 0; i < FormatOptions.length; i+=1 ) {
            args.push(options[FormatOptions[i]]);
        }

        // Append the input, then call the method, presenting all
        // options as arguments.
        args.push(input);
        return method.apply('', args);
    }

    function wNumb ( options ) {

        if ( !(this instanceof wNumb) ) {
            return new wNumb ( options );
        }

        if ( typeof options !== "object" ) {
            return;
        }

        options = validate(options);

        // Call 'formatTo' with proper arguments.
        this.to = function ( input ) {
            return passAll(options, formatTo, input);
        };

        // Call 'formatFrom' with proper arguments.
        this.from = function ( input ) {
            return passAll(options, formatFrom, input);
        };
    }

    return wNumb;

}));


/*! nouislider - 11.1.0 - 2018-04-02 11:18:13 */

!function(a){"function"==typeof define&&define.amd?define([],a):"object"==typeof exports?module.exports=a():window.noUiSlider=a()}(function(){"use strict";function a(a){return"object"==typeof a&&"function"==typeof a.to&&"function"==typeof a.from}function b(a){a.parentElement.removeChild(a)}function c(a){return null!==a&&void 0!==a}function d(a){a.preventDefault()}function e(a){return a.filter(function(a){return!this[a]&&(this[a]=!0)},{})}function f(a,b){return Math.round(a/b)*b}function g(a,b){var c=a.getBoundingClientRect(),d=a.ownerDocument,e=d.documentElement,f=p(d);return/webkit.*Chrome.*Mobile/i.test(navigator.userAgent)&&(f.x=0),b?c.top+f.y-e.clientTop:c.left+f.x-e.clientLeft}function h(a){return"number"==typeof a&&!isNaN(a)&&isFinite(a)}function i(a,b,c){c>0&&(m(a,b),setTimeout(function(){n(a,b)},c))}function j(a){return Math.max(Math.min(a,100),0)}function k(a){return Array.isArray(a)?a:[a]}function l(a){a=String(a);var b=a.split(".");return b.length>1?b[1].length:0}function m(a,b){a.classList?a.classList.add(b):a.className+=" "+b}function n(a,b){a.classList?a.classList.remove(b):a.className=a.className.replace(new RegExp("(^|\\b)"+b.split(" ").join("|")+"(\\b|$)","gi")," ")}function o(a,b){return a.classList?a.classList.contains(b):new RegExp("\\b"+b+"\\b").test(a.className)}function p(a){var b=void 0!==window.pageXOffset,c="CSS1Compat"===(a.compatMode||"");return{x:b?window.pageXOffset:c?a.documentElement.scrollLeft:a.body.scrollLeft,y:b?window.pageYOffset:c?a.documentElement.scrollTop:a.body.scrollTop}}function q(){return window.navigator.pointerEnabled?{start:"pointerdown",move:"pointermove",end:"pointerup"}:window.navigator.msPointerEnabled?{start:"MSPointerDown",move:"MSPointerMove",end:"MSPointerUp"}:{start:"mousedown touchstart",move:"mousemove touchmove",end:"mouseup touchend"}}function r(){var a=!1;try{var b=Object.defineProperty({},"passive",{get:function(){a=!0}});window.addEventListener("test",null,b)}catch(a){}return a}function s(){return window.CSS&&CSS.supports&&CSS.supports("touch-action","none")}function t(a,b){return 100/(b-a)}function u(a,b){return 100*b/(a[1]-a[0])}function v(a,b){return u(a,a[0]<0?b+Math.abs(a[0]):b-a[0])}function w(a,b){return b*(a[1]-a[0])/100+a[0]}function x(a,b){for(var c=1;a>=b[c];)c+=1;return c}function y(a,b,c){if(c>=a.slice(-1)[0])return 100;var d=x(c,a),e=a[d-1],f=a[d],g=b[d-1],h=b[d];return g+v([e,f],c)/t(g,h)}function z(a,b,c){if(c>=100)return a.slice(-1)[0];var d=x(c,b),e=a[d-1],f=a[d],g=b[d-1];return w([e,f],(c-g)*t(g,b[d]))}function A(a,b,c,d){if(100===d)return d;var e=x(d,a),g=a[e-1],h=a[e];return c?d-g>(h-g)/2?h:g:b[e-1]?a[e-1]+f(d-a[e-1],b[e-1]):d}function B(a,b,c){var d;if("number"==typeof b&&(b=[b]),!Array.isArray(b))throw new Error("noUiSlider ("+$+"): 'range' contains invalid value.");if(d="min"===a?0:"max"===a?100:parseFloat(a),!h(d)||!h(b[0]))throw new Error("noUiSlider ("+$+"): 'range' value isn't numeric.");c.xPct.push(d),c.xVal.push(b[0]),d?c.xSteps.push(!isNaN(b[1])&&b[1]):isNaN(b[1])||(c.xSteps[0]=b[1]),c.xHighestCompleteStep.push(0)}function C(a,b,c){if(!b)return!0;c.xSteps[a]=u([c.xVal[a],c.xVal[a+1]],b)/t(c.xPct[a],c.xPct[a+1]);var d=(c.xVal[a+1]-c.xVal[a])/c.xNumSteps[a],e=Math.ceil(Number(d.toFixed(3))-1),f=c.xVal[a]+c.xNumSteps[a]*e;c.xHighestCompleteStep[a]=f}function D(a,b,c){this.xPct=[],this.xVal=[],this.xSteps=[c||!1],this.xNumSteps=[!1],this.xHighestCompleteStep=[],this.snap=b;var d,e=[];for(d in a)a.hasOwnProperty(d)&&e.push([a[d],d]);for(e.length&&"object"==typeof e[0][0]?e.sort(function(a,b){return a[0][0]-b[0][0]}):e.sort(function(a,b){return a[0]-b[0]}),d=0;d<e.length;d++)B(e[d][1],e[d][0],this);for(this.xNumSteps=this.xSteps.slice(0),d=0;d<this.xNumSteps.length;d++)C(d,this.xNumSteps[d],this)}function E(b){if(a(b))return!0;throw new Error("noUiSlider ("+$+"): 'format' requires 'to' and 'from' methods.")}function F(a,b){if(!h(b))throw new Error("noUiSlider ("+$+"): 'step' is not numeric.");a.singleStep=b}function G(a,b){if("object"!=typeof b||Array.isArray(b))throw new Error("noUiSlider ("+$+"): 'range' is not an object.");if(void 0===b.min||void 0===b.max)throw new Error("noUiSlider ("+$+"): Missing 'min' or 'max' in 'range'.");if(b.min===b.max)throw new Error("noUiSlider ("+$+"): 'range' 'min' and 'max' cannot be equal.");a.spectrum=new D(b,a.snap,a.singleStep)}function H(a,b){if(b=k(b),!Array.isArray(b)||!b.length)throw new Error("noUiSlider ("+$+"): 'start' option is incorrect.");a.handles=b.length,a.start=b}function I(a,b){if(a.snap=b,"boolean"!=typeof b)throw new Error("noUiSlider ("+$+"): 'snap' option must be a boolean.")}function J(a,b){if(a.animate=b,"boolean"!=typeof b)throw new Error("noUiSlider ("+$+"): 'animate' option must be a boolean.")}function K(a,b){if(a.animationDuration=b,"number"!=typeof b)throw new Error("noUiSlider ("+$+"): 'animationDuration' option must be a number.")}function L(a,b){var c,d=[!1];if("lower"===b?b=[!0,!1]:"upper"===b&&(b=[!1,!0]),!0===b||!1===b){for(c=1;c<a.handles;c++)d.push(b);d.push(!1)}else{if(!Array.isArray(b)||!b.length||b.length!==a.handles+1)throw new Error("noUiSlider ("+$+"): 'connect' option doesn't match handle count.");d=b}a.connect=d}function M(a,b){switch(b){case"horizontal":a.ort=0;break;case"vertical":a.ort=1;break;default:throw new Error("noUiSlider ("+$+"): 'orientation' option is invalid.")}}function N(a,b){if(!h(b))throw new Error("noUiSlider ("+$+"): 'margin' option must be numeric.");if(0!==b&&(a.margin=a.spectrum.getMargin(b),!a.margin))throw new Error("noUiSlider ("+$+"): 'margin' option is only supported on linear sliders.")}function O(a,b){if(!h(b))throw new Error("noUiSlider ("+$+"): 'limit' option must be numeric.");if(a.limit=a.spectrum.getMargin(b),!a.limit||a.handles<2)throw new Error("noUiSlider ("+$+"): 'limit' option is only supported on linear sliders with 2 or more handles.")}function P(a,b){if(!h(b)&&!Array.isArray(b))throw new Error("noUiSlider ("+$+"): 'padding' option must be numeric or array of exactly 2 numbers.");if(Array.isArray(b)&&2!==b.length&&!h(b[0])&&!h(b[1]))throw new Error("noUiSlider ("+$+"): 'padding' option must be numeric or array of exactly 2 numbers.");if(0!==b){if(Array.isArray(b)||(b=[b,b]),a.padding=[a.spectrum.getMargin(b[0]),a.spectrum.getMargin(b[1])],!1===a.padding[0]||!1===a.padding[1])throw new Error("noUiSlider ("+$+"): 'padding' option is only supported on linear sliders.");if(a.padding[0]<0||a.padding[1]<0)throw new Error("noUiSlider ("+$+"): 'padding' option must be a positive number(s).");if(a.padding[0]+a.padding[1]>=100)throw new Error("noUiSlider ("+$+"): 'padding' option must not exceed 100% of the range.")}}function Q(a,b){switch(b){case"ltr":a.dir=0;break;case"rtl":a.dir=1;break;default:throw new Error("noUiSlider ("+$+"): 'direction' option was not recognized.")}}function R(a,b){if("string"!=typeof b)throw new Error("noUiSlider ("+$+"): 'behaviour' must be a string containing options.");var c=b.indexOf("tap")>=0,d=b.indexOf("drag")>=0,e=b.indexOf("fixed")>=0,f=b.indexOf("snap")>=0,g=b.indexOf("hover")>=0;if(e){if(2!==a.handles)throw new Error("noUiSlider ("+$+"): 'fixed' behaviour must be used with 2 handles");N(a,a.start[1]-a.start[0])}a.events={tap:c||f,drag:d,fixed:e,snap:f,hover:g}}function S(a,b){if(!1!==b)if(!0===b){a.tooltips=[];for(var c=0;c<a.handles;c++)a.tooltips.push(!0)}else{if(a.tooltips=k(b),a.tooltips.length!==a.handles)throw new Error("noUiSlider ("+$+"): must pass a formatter for all handles.");a.tooltips.forEach(function(a){if("boolean"!=typeof a&&("object"!=typeof a||"function"!=typeof a.to))throw new Error("noUiSlider ("+$+"): 'tooltips' must be passed a formatter or 'false'.")})}}function T(a,b){a.ariaFormat=b,E(b)}function U(a,b){a.format=b,E(b)}function V(a,b){if("string"!=typeof b&&!1!==b)throw new Error("noUiSlider ("+$+"): 'cssPrefix' must be a string or `false`.");a.cssPrefix=b}function W(a,b){if("object"!=typeof b)throw new Error("noUiSlider ("+$+"): 'cssClasses' must be an object.");if("string"==typeof a.cssPrefix){a.cssClasses={};for(var c in b)b.hasOwnProperty(c)&&(a.cssClasses[c]=a.cssPrefix+b[c])}else a.cssClasses=b}function X(a){var b={margin:0,limit:0,padding:0,animate:!0,animationDuration:300,ariaFormat:_,format:_},d={step:{r:!1,t:F},start:{r:!0,t:H},connect:{r:!0,t:L},direction:{r:!0,t:Q},snap:{r:!1,t:I},animate:{r:!1,t:J},animationDuration:{r:!1,t:K},range:{r:!0,t:G},orientation:{r:!1,t:M},margin:{r:!1,t:N},limit:{r:!1,t:O},padding:{r:!1,t:P},behaviour:{r:!0,t:R},ariaFormat:{r:!1,t:T},format:{r:!1,t:U},tooltips:{r:!1,t:S},cssPrefix:{r:!0,t:V},cssClasses:{r:!0,t:W}},e={connect:!1,direction:"ltr",behaviour:"tap",orientation:"horizontal",cssPrefix:"noUi-",cssClasses:{target:"target",base:"base",origin:"origin",handle:"handle",handleLower:"handle-lower",handleUpper:"handle-upper",horizontal:"horizontal",vertical:"vertical",background:"background",connect:"connect",connects:"connects",ltr:"ltr",rtl:"rtl",draggable:"draggable",drag:"state-drag",tap:"state-tap",active:"active",tooltip:"tooltip",pips:"pips",pipsHorizontal:"pips-horizontal",pipsVertical:"pips-vertical",marker:"marker",markerHorizontal:"marker-horizontal",markerVertical:"marker-vertical",markerNormal:"marker-normal",markerLarge:"marker-large",markerSub:"marker-sub",value:"value",valueHorizontal:"value-horizontal",valueVertical:"value-vertical",valueNormal:"value-normal",valueLarge:"value-large",valueSub:"value-sub"}};a.format&&!a.ariaFormat&&(a.ariaFormat=a.format),Object.keys(d).forEach(function(f){if(!c(a[f])&&void 0===e[f]){if(d[f].r)throw new Error("noUiSlider ("+$+"): '"+f+"' is required.");return!0}d[f].t(b,c(a[f])?a[f]:e[f])}),b.pips=a.pips;var f=document.createElement("div"),g=void 0!==f.style.msTransform,h=void 0!==f.style.transform;b.transformRule=h?"transform":g?"msTransform":"webkitTransform";var i=[["left","top"],["right","bottom"]];return b.style=i[b.dir][b.ort],b}function Y(a,c,f){function h(a,b){var c=ya.createElement("div");return b&&m(c,b),a.appendChild(c),c}function l(a,b){var d=h(a,c.cssClasses.origin),e=h(d,c.cssClasses.handle);return e.setAttribute("data-handle",b),e.setAttribute("tabindex","0"),e.setAttribute("role","slider"),e.setAttribute("aria-orientation",c.ort?"vertical":"horizontal"),0===b?m(e,c.cssClasses.handleLower):b===c.handles-1&&m(e,c.cssClasses.handleUpper),d}function t(a,b){return!!b&&h(a,c.cssClasses.connect)}function u(a,b){var d=h(b,c.cssClasses.connects);ka=[],la=[],la.push(t(d,a[0]));for(var e=0;e<c.handles;e++)ka.push(l(b,e)),ta[e]=e,la.push(t(d,a[e+1]))}function v(a){m(a,c.cssClasses.target),0===c.dir?m(a,c.cssClasses.ltr):m(a,c.cssClasses.rtl),0===c.ort?m(a,c.cssClasses.horizontal):m(a,c.cssClasses.vertical),ja=h(a,c.cssClasses.base)}function w(a,b){return!!c.tooltips[b]&&h(a.firstChild,c.cssClasses.tooltip)}function x(){var a=ka.map(w);Q("update",function(b,d,e){if(a[d]){var f=b[d];!0!==c.tooltips[d]&&(f=c.tooltips[d].to(e[d])),a[d].innerHTML=f}})}function y(){Q("update",function(a,b,d,e,f){ta.forEach(function(a){var b=ka[a],e=U(sa,a,0,!0,!0,!0),g=U(sa,a,100,!0,!0,!0),h=f[a],i=c.ariaFormat.to(d[a]);b.children[0].setAttribute("aria-valuemin",e.toFixed(1)),b.children[0].setAttribute("aria-valuemax",g.toFixed(1)),b.children[0].setAttribute("aria-valuenow",h.toFixed(1)),b.children[0].setAttribute("aria-valuetext",i)})})}function z(a,b,c){if("range"===a||"steps"===a)return va.xVal;if("count"===a){if(b<2)throw new Error("noUiSlider ("+$+"): 'values' (>= 2) required for mode 'count'.");var d=b-1,e=100/d;for(b=[];d--;)b[d]=d*e;b.push(100),a="positions"}return"positions"===a?b.map(function(a){return va.fromStepping(c?va.getStep(a):a)}):"values"===a?c?b.map(function(a){return va.fromStepping(va.getStep(va.toStepping(a)))}):b:void 0}function A(a,b,c){function d(a,b){return(a+b).toFixed(7)/1}var f={},g=va.xVal[0],h=va.xVal[va.xVal.length-1],i=!1,j=!1,k=0;return c=e(c.slice().sort(function(a,b){return a-b})),c[0]!==g&&(c.unshift(g),i=!0),c[c.length-1]!==h&&(c.push(h),j=!0),c.forEach(function(e,g){var h,l,m,n,o,p,q,r,s,t,u=e,v=c[g+1];if("steps"===b&&(h=va.xNumSteps[g]),h||(h=v-u),!1!==u&&void 0!==v)for(h=Math.max(h,1e-7),l=u;l<=v;l=d(l,h)){for(n=va.toStepping(l),o=n-k,r=o/a,s=Math.round(r),t=o/s,m=1;m<=s;m+=1)p=k+m*t,f[p.toFixed(5)]=["x",0];q=c.indexOf(l)>-1?1:"steps"===b?2:0,!g&&i&&(q=0),l===v&&j||(f[n.toFixed(5)]=[l,q]),k=n}}),f}function B(a,b,d){function e(a,b){var d=b===c.cssClasses.value,e=d?k:l,f=d?i:j;return b+" "+e[c.ort]+" "+f[a]}function f(a,f){f[1]=f[1]&&b?b(f[0],f[1]):f[1];var i=h(g,!1);i.className=e(f[1],c.cssClasses.marker),i.style[c.style]=a+"%",f[1]&&(i=h(g,!1),i.className=e(f[1],c.cssClasses.value),i.setAttribute("data-value",f[0]),i.style[c.style]=a+"%",i.innerText=d.to(f[0]))}var g=ya.createElement("div"),i=[c.cssClasses.valueNormal,c.cssClasses.valueLarge,c.cssClasses.valueSub],j=[c.cssClasses.markerNormal,c.cssClasses.markerLarge,c.cssClasses.markerSub],k=[c.cssClasses.valueHorizontal,c.cssClasses.valueVertical],l=[c.cssClasses.markerHorizontal,c.cssClasses.markerVertical];return m(g,c.cssClasses.pips),m(g,0===c.ort?c.cssClasses.pipsHorizontal:c.cssClasses.pipsVertical),Object.keys(a).forEach(function(b){f(b,a[b])}),g}function C(){na&&(b(na),na=null)}function D(a){C();var b=a.mode,c=a.density||1,d=a.filter||!1,e=a.values||!1,f=a.stepped||!1,g=z(b,e,f),h=A(c,b,g),i=a.format||{to:Math.round};return na=ra.appendChild(B(h,d,i))}function E(){var a=ja.getBoundingClientRect(),b="offset"+["Width","Height"][c.ort];return 0===c.ort?a.width||ja[b]:a.height||ja[b]}function F(a,b,d,e){var f=function(f){return!!(f=G(f,e.pageOffset,e.target||b))&&(!(ra.hasAttribute("disabled")&&!e.doNotReject)&&(!(o(ra,c.cssClasses.tap)&&!e.doNotReject)&&(!(a===oa.start&&void 0!==f.buttons&&f.buttons>1)&&((!e.hover||!f.buttons)&&(qa||f.preventDefault(),f.calcPoint=f.points[c.ort],void d(f,e))))))},g=[];return a.split(" ").forEach(function(a){b.addEventListener(a,f,!!qa&&{passive:!0}),g.push([a,f])}),g}function G(a,b,c){var d,e,f=0===a.type.indexOf("touch"),g=0===a.type.indexOf("mouse"),h=0===a.type.indexOf("pointer");if(0===a.type.indexOf("MSPointer")&&(h=!0),f){var i=function(a){return a.target===c||c.contains(a.target)};if("touchstart"===a.type){var j=Array.prototype.filter.call(a.touches,i);if(j.length>1)return!1;d=j[0].pageX,e=j[0].pageY}else{var k=Array.prototype.find.call(a.changedTouches,i);if(!k)return!1;d=k.pageX,e=k.pageY}}return b=b||p(ya),(g||h)&&(d=a.clientX+b.x,e=a.clientY+b.y),a.pageOffset=b,a.points=[d,e],a.cursor=g||h,a}function H(a){var b=a-g(ja,c.ort),d=100*b/E();return d=j(d),c.dir?100-d:d}function I(a){var b=100,c=!1;return ka.forEach(function(d,e){if(!d.hasAttribute("disabled")){var f=Math.abs(sa[e]-a);(f<b||100===f&&100===b)&&(c=e,b=f)}}),c}function J(a,b){"mouseout"===a.type&&"HTML"===a.target.nodeName&&null===a.relatedTarget&&L(a,b)}function K(a,b){if(-1===navigator.appVersion.indexOf("MSIE 9")&&0===a.buttons&&0!==b.buttonsProperty)return L(a,b);var d=(c.dir?-1:1)*(a.calcPoint-b.startCalcPoint);W(d>0,100*d/b.baseSize,b.locations,b.handleNumbers)}function L(a,b){b.handle&&(n(b.handle,c.cssClasses.active),ua-=1),b.listeners.forEach(function(a){za.removeEventListener(a[0],a[1])}),0===ua&&(n(ra,c.cssClasses.drag),_(),a.cursor&&(Aa.style.cursor="",Aa.removeEventListener("selectstart",d))),b.handleNumbers.forEach(function(a){S("change",a),S("set",a),S("end",a)})}function M(a,b){var e;if(1===b.handleNumbers.length){var f=ka[b.handleNumbers[0]];if(f.hasAttribute("disabled"))return!1;e=f.children[0],ua+=1,m(e,c.cssClasses.active)}a.stopPropagation();var g=[],h=F(oa.move,za,K,{target:a.target,handle:e,listeners:g,startCalcPoint:a.calcPoint,baseSize:E(),pageOffset:a.pageOffset,handleNumbers:b.handleNumbers,buttonsProperty:a.buttons,locations:sa.slice()}),i=F(oa.end,za,L,{target:a.target,handle:e,listeners:g,doNotReject:!0,handleNumbers:b.handleNumbers}),j=F("mouseout",za,J,{target:a.target,handle:e,listeners:g,doNotReject:!0,handleNumbers:b.handleNumbers});g.push.apply(g,h.concat(i,j)),a.cursor&&(Aa.style.cursor=getComputedStyle(a.target).cursor,ka.length>1&&m(ra,c.cssClasses.drag),Aa.addEventListener("selectstart",d,!1)),b.handleNumbers.forEach(function(a){S("start",a)})}function N(a){a.stopPropagation();var b=H(a.calcPoint),d=I(b);if(!1===d)return!1;c.events.snap||i(ra,c.cssClasses.tap,c.animationDuration),aa(d,b,!0,!0),_(),S("slide",d,!0),S("update",d,!0),S("change",d,!0),S("set",d,!0),c.events.snap&&M(a,{handleNumbers:[d]})}function O(a){var b=H(a.calcPoint),c=va.getStep(b),d=va.fromStepping(c);Object.keys(xa).forEach(function(a){"hover"===a.split(".")[0]&&xa[a].forEach(function(a){a.call(ma,d)})})}function P(a){a.fixed||ka.forEach(function(a,b){F(oa.start,a.children[0],M,{handleNumbers:[b]})}),a.tap&&F(oa.start,ja,N,{}),a.hover&&F(oa.move,ja,O,{hover:!0}),a.drag&&la.forEach(function(b,d){if(!1!==b&&0!==d&&d!==la.length-1){var e=ka[d-1],f=ka[d],g=[b];m(b,c.cssClasses.draggable),a.fixed&&(g.push(e.children[0]),g.push(f.children[0])),g.forEach(function(a){F(oa.start,a,M,{handles:[e,f],handleNumbers:[d-1,d]})})}})}function Q(a,b){xa[a]=xa[a]||[],xa[a].push(b),"update"===a.split(".")[0]&&ka.forEach(function(a,b){S("update",b)})}function R(a){var b=a&&a.split(".")[0],c=b&&a.substring(b.length);Object.keys(xa).forEach(function(a){var d=a.split(".")[0],e=a.substring(d.length);b&&b!==d||c&&c!==e||delete xa[a]})}function S(a,b,d){Object.keys(xa).forEach(function(e){var f=e.split(".")[0];a===f&&xa[e].forEach(function(a){a.call(ma,wa.map(c.format.to),b,wa.slice(),d||!1,sa.slice())})})}function T(a){return a+"%"}function U(a,b,d,e,f,g){return ka.length>1&&(e&&b>0&&(d=Math.max(d,a[b-1]+c.margin)),f&&b<ka.length-1&&(d=Math.min(d,a[b+1]-c.margin))),ka.length>1&&c.limit&&(e&&b>0&&(d=Math.min(d,a[b-1]+c.limit)),f&&b<ka.length-1&&(d=Math.max(d,a[b+1]-c.limit))),c.padding&&(0===b&&(d=Math.max(d,c.padding[0])),b===ka.length-1&&(d=Math.min(d,100-c.padding[1]))),d=va.getStep(d),!((d=j(d))===a[b]&&!g)&&d}function V(a,b){var d=c.ort;return(d?b:a)+", "+(d?a:b)}function W(a,b,c,d){var e=c.slice(),f=[!a,a],g=[a,!a];d=d.slice(),a&&d.reverse(),d.length>1?d.forEach(function(a,c){var d=U(e,a,e[a]+b,f[c],g[c],!1);!1===d?b=0:(b=d-e[a],e[a]=d)}):f=g=[!0];var h=!1;d.forEach(function(a,d){h=aa(a,c[a]+b,f[d],g[d])||h}),h&&d.forEach(function(a){S("update",a),S("slide",a)})}function Y(a,b){return c.dir?100-a-b:a}function Z(a,b){sa[a]=b,wa[a]=va.fromStepping(b);var d="translate("+V(T(Y(b,0)-Ba),"0")+")";ka[a].style[c.transformRule]=d,ba(a),ba(a+1)}function _(){ta.forEach(function(a){var b=sa[a]>50?-1:1,c=3+(ka.length+b*a);ka[a].style.zIndex=c})}function aa(a,b,c,d){return!1!==(b=U(sa,a,b,c,d,!1))&&(Z(a,b),!0)}function ba(a){if(la[a]){var b=0,d=100;0!==a&&(b=sa[a-1]),a!==la.length-1&&(d=sa[a]);var e=d-b,f="translate("+V(T(Y(b,e)),"0")+")",g="scale("+V(e/100,"1")+")";la[a].style[c.transformRule]=f+" "+g}}function ca(a,b){return null===a||!1===a||void 0===a?sa[b]:("number"==typeof a&&(a=String(a)),a=c.format.from(a),a=va.toStepping(a),!1===a||isNaN(a)?sa[b]:a)}function da(a,b){var d=k(a),e=void 0===sa[0];b=void 0===b||!!b,c.animate&&!e&&i(ra,c.cssClasses.tap,c.animationDuration),ta.forEach(function(a){aa(a,ca(d[a],a),!0,!1)}),ta.forEach(function(a){aa(a,sa[a],!0,!0)}),_(),ta.forEach(function(a){S("update",a),null!==d[a]&&b&&S("set",a)})}function ea(a){da(c.start,a)}function fa(){var a=wa.map(c.format.to);return 1===a.length?a[0]:a}function ga(){for(var a in c.cssClasses)c.cssClasses.hasOwnProperty(a)&&n(ra,c.cssClasses[a]);for(;ra.firstChild;)ra.removeChild(ra.firstChild);delete ra.noUiSlider}function ha(){return sa.map(function(a,b){var c=va.getNearbySteps(a),d=wa[b],e=c.thisStep.step,f=null;!1!==e&&d+e>c.stepAfter.startValue&&(e=c.stepAfter.startValue-d),f=d>c.thisStep.startValue?c.thisStep.step:!1!==c.stepBefore.step&&d-c.stepBefore.highestStep,100===a?e=null:0===a&&(f=null);var g=va.countStepDecimals();return null!==e&&!1!==e&&(e=Number(e.toFixed(g))),null!==f&&!1!==f&&(f=Number(f.toFixed(g))),[f,e]})}function ia(a,b){var d=fa(),e=["margin","limit","padding","range","animate","snap","step","format"];e.forEach(function(b){void 0!==a[b]&&(f[b]=a[b])});var g=X(f);e.forEach(function(b){void 0!==a[b]&&(c[b]=g[b])}),va=g.spectrum,c.margin=g.margin,c.limit=g.limit,c.padding=g.padding,c.pips&&D(c.pips),sa=[],da(a.start||d,b)}var ja,ka,la,ma,na,oa=q(),pa=s(),qa=pa&&r(),ra=a,sa=[],ta=[],ua=0,va=c.spectrum,wa=[],xa={},ya=a.ownerDocument,za=ya.documentElement,Aa=ya.body,Ba="rtl"===ya.dir||1===c.ort?0:100;return v(ra),u(c.connect,ja),P(c.events),da(c.start),ma={destroy:ga,steps:ha,on:Q,off:R,get:fa,set:da,reset:ea,__moveHandles:function(a,b,c){W(a,b,sa,c)},options:f,updateOptions:ia,target:ra,removePips:C,pips:D},c.pips&&D(c.pips),c.tooltips&&x(),y(),ma}function Z(a,b){if(!a||!a.nodeName)throw new Error("noUiSlider ("+$+"): create requires a single element, got: "+a);if(a.noUiSlider)throw new Error("noUiSlider ("+$+"): Slider was already initialized.");var c=X(b,a),d=Y(a,c,b);return a.noUiSlider=d,d}var $="11.1.0";D.prototype.getMargin=function(a){var b=this.xNumSteps[0];if(b&&a/b%1!=0)throw new Error("noUiSlider ("+$+"): 'limit', 'margin' and 'padding' must be divisible by step.");return 2===this.xPct.length&&u(this.xVal,a)},D.prototype.toStepping=function(a){return a=y(this.xVal,this.xPct,a)},D.prototype.fromStepping=function(a){return z(this.xVal,this.xPct,a)},D.prototype.getStep=function(a){return a=A(this.xPct,this.xSteps,this.snap,a)},D.prototype.getNearbySteps=function(a){var b=x(a,this.xPct);return{stepBefore:{startValue:this.xVal[b-2],step:this.xNumSteps[b-2],highestStep:this.xHighestCompleteStep[b-2]},thisStep:{startValue:this.xVal[b-1],step:this.xNumSteps[b-1],highestStep:this.xHighestCompleteStep[b-1]},stepAfter:{startValue:this.xVal[b-0],step:this.xNumSteps[b-0],highestStep:this.xHighestCompleteStep[b-0]}}},D.prototype.countStepDecimals=function(){var a=this.xNumSteps.map(l);return Math.max.apply(null,a)},D.prototype.convert=function(a){return this.getStep(this.toStepping(a))};var _={to:function(a){return void 0!==a&&a.toFixed(2)},from:Number};return{version:$,create:Z}});


/*
     _ _      _       _
 ___| (_) ___| | __  (_)___
/ __| | |/ __| |/ /  | / __|
\__ \ | | (__|   < _ | \__ \
|___/_|_|\___|_|\_(_)/ |___/
                   |__/

 Version: 1.8.0
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */
!function(i){"use strict";"function"==typeof define&&define.amd?define(["jquery"],i):"undefined"!=typeof exports?module.exports=i(require("jquery")):i(jQuery)}(function(i){"use strict";var e=window.Slick||{};(e=function(){var e=0;return function(t,o){var s,n=this;n.defaults={accessibility:!0,adaptiveHeight:!1,appendArrows:i(t),appendDots:i(t),arrows:!0,asNavFor:null,prevArrow:'<button class="slick-prev" aria-label="Previous" type="button">Previous</button>',nextArrow:'<button class="slick-next" aria-label="Next" type="button">Next</button>',autoplay:!1,autoplaySpeed:3e3,centerMode:!1,centerPadding:"50px",cssEase:"ease",customPaging:function(e,t){return i('<button type="button" />').text(t+1)},dots:!1,dotsClass:"slick-dots",draggable:!0,easing:"linear",edgeFriction:.35,fade:!1,focusOnSelect:!1,focusOnChange:!1,infinite:!0,initialSlide:0,lazyLoad:"ondemand",mobileFirst:!1,pauseOnHover:!0,pauseOnFocus:!0,pauseOnDotsHover:!1,respondTo:"window",responsive:null,rows:1,rtl:!1,slide:"",slidesPerRow:1,slidesToShow:1,slidesToScroll:1,speed:500,swipe:!0,swipeToSlide:!1,touchMove:!0,touchThreshold:5,useCSS:!0,useTransform:!0,variableWidth:!1,vertical:!1,verticalSwiping:!1,waitForAnimate:!0,zIndex:1e3},n.initials={animating:!1,dragging:!1,autoPlayTimer:null,currentDirection:0,currentLeft:null,currentSlide:0,direction:1,$dots:null,listWidth:null,listHeight:null,loadIndex:0,$nextArrow:null,$prevArrow:null,scrolling:!1,slideCount:null,slideWidth:null,$slideTrack:null,$slides:null,sliding:!1,slideOffset:0,swipeLeft:null,swiping:!1,$list:null,touchObject:{},transformsEnabled:!1,unslicked:!1},i.extend(n,n.initials),n.activeBreakpoint=null,n.animType=null,n.animProp=null,n.breakpoints=[],n.breakpointSettings=[],n.cssTransitions=!1,n.focussed=!1,n.interrupted=!1,n.hidden="hidden",n.paused=!0,n.positionProp=null,n.respondTo=null,n.rowCount=1,n.shouldClick=!0,n.$slider=i(t),n.$slidesCache=null,n.transformType=null,n.transitionType=null,n.visibilityChange="visibilitychange",n.windowWidth=0,n.windowTimer=null,s=i(t).data("slick")||{},n.options=i.extend({},n.defaults,o,s),n.currentSlide=n.options.initialSlide,n.originalSettings=n.options,void 0!==document.mozHidden?(n.hidden="mozHidden",n.visibilityChange="mozvisibilitychange"):void 0!==document.webkitHidden&&(n.hidden="webkitHidden",n.visibilityChange="webkitvisibilitychange"),n.autoPlay=i.proxy(n.autoPlay,n),n.autoPlayClear=i.proxy(n.autoPlayClear,n),n.autoPlayIterator=i.proxy(n.autoPlayIterator,n),n.changeSlide=i.proxy(n.changeSlide,n),n.clickHandler=i.proxy(n.clickHandler,n),n.selectHandler=i.proxy(n.selectHandler,n),n.setPosition=i.proxy(n.setPosition,n),n.swipeHandler=i.proxy(n.swipeHandler,n),n.dragHandler=i.proxy(n.dragHandler,n),n.keyHandler=i.proxy(n.keyHandler,n),n.instanceUid=e++,n.htmlExpr=/^(?:\s*(<[\w\W]+>)[^>]*)$/,n.registerBreakpoints(),n.init(!0)}}()).prototype.activateADA=function(){this.$slideTrack.find(".slick-active").attr({"aria-hidden":"false"}).find("a, input, button, select").attr({tabindex:"0"})},e.prototype.addSlide=e.prototype.slickAdd=function(e,t,o){var s=this;if("boolean"==typeof t)o=t,t=null;else if(t<0||t>=s.slideCount)return!1;s.unload(),"number"==typeof t?0===t&&0===s.$slides.length?i(e).appendTo(s.$slideTrack):o?i(e).insertBefore(s.$slides.eq(t)):i(e).insertAfter(s.$slides.eq(t)):!0===o?i(e).prependTo(s.$slideTrack):i(e).appendTo(s.$slideTrack),s.$slides=s.$slideTrack.children(this.options.slide),s.$slideTrack.children(this.options.slide).detach(),s.$slideTrack.append(s.$slides),s.$slides.each(function(e,t){i(t).attr("data-slick-index",e)}),s.$slidesCache=s.$slides,s.reinit()},e.prototype.animateHeight=function(){var i=this;if(1===i.options.slidesToShow&&!0===i.options.adaptiveHeight&&!1===i.options.vertical){var e=i.$slides.eq(i.currentSlide).outerHeight(!0);i.$list.animate({height:e},i.options.speed)}},e.prototype.animateSlide=function(e,t){var o={},s=this;s.animateHeight(),!0===s.options.rtl&&!1===s.options.vertical&&(e=-e),!1===s.transformsEnabled?!1===s.options.vertical?s.$slideTrack.animate({left:e},s.options.speed,s.options.easing,t):s.$slideTrack.animate({top:e},s.options.speed,s.options.easing,t):!1===s.cssTransitions?(!0===s.options.rtl&&(s.currentLeft=-s.currentLeft),i({animStart:s.currentLeft}).animate({animStart:e},{duration:s.options.speed,easing:s.options.easing,step:function(i){i=Math.ceil(i),!1===s.options.vertical?(o[s.animType]="translate("+i+"px, 0px)",s.$slideTrack.css(o)):(o[s.animType]="translate(0px,"+i+"px)",s.$slideTrack.css(o))},complete:function(){t&&t.call()}})):(s.applyTransition(),e=Math.ceil(e),!1===s.options.vertical?o[s.animType]="translate3d("+e+"px, 0px, 0px)":o[s.animType]="translate3d(0px,"+e+"px, 0px)",s.$slideTrack.css(o),t&&setTimeout(function(){s.disableTransition(),t.call()},s.options.speed))},e.prototype.getNavTarget=function(){var e=this,t=e.options.asNavFor;return t&&null!==t&&(t=i(t).not(e.$slider)),t},e.prototype.asNavFor=function(e){var t=this.getNavTarget();null!==t&&"object"==typeof t&&t.each(function(){var t=i(this).slick("getSlick");t.unslicked||t.slideHandler(e,!0)})},e.prototype.applyTransition=function(i){var e=this,t={};!1===e.options.fade?t[e.transitionType]=e.transformType+" "+e.options.speed+"ms "+e.options.cssEase:t[e.transitionType]="opacity "+e.options.speed+"ms "+e.options.cssEase,!1===e.options.fade?e.$slideTrack.css(t):e.$slides.eq(i).css(t)},e.prototype.autoPlay=function(){var i=this;i.autoPlayClear(),i.slideCount>i.options.slidesToShow&&(i.autoPlayTimer=setInterval(i.autoPlayIterator,i.options.autoplaySpeed))},e.prototype.autoPlayClear=function(){var i=this;i.autoPlayTimer&&clearInterval(i.autoPlayTimer)},e.prototype.autoPlayIterator=function(){var i=this,e=i.currentSlide+i.options.slidesToScroll;i.paused||i.interrupted||i.focussed||(!1===i.options.infinite&&(1===i.direction&&i.currentSlide+1===i.slideCount-1?i.direction=0:0===i.direction&&(e=i.currentSlide-i.options.slidesToScroll,i.currentSlide-1==0&&(i.direction=1))),i.slideHandler(e))},e.prototype.buildArrows=function(){var e=this;!0===e.options.arrows&&(e.$prevArrow=i(e.options.prevArrow).addClass("slick-arrow"),e.$nextArrow=i(e.options.nextArrow).addClass("slick-arrow"),e.slideCount>e.options.slidesToShow?(e.$prevArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"),e.$nextArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"),e.htmlExpr.test(e.options.prevArrow)&&e.$prevArrow.prependTo(e.options.appendArrows),e.htmlExpr.test(e.options.nextArrow)&&e.$nextArrow.appendTo(e.options.appendArrows),!0!==e.options.infinite&&e.$prevArrow.addClass("slick-disabled").attr("aria-disabled","true")):e.$prevArrow.add(e.$nextArrow).addClass("slick-hidden").attr({"aria-disabled":"true",tabindex:"-1"}))},e.prototype.buildDots=function(){var e,t,o=this;if(!0===o.options.dots){for(o.$slider.addClass("slick-dotted"),t=i("<ul />").addClass(o.options.dotsClass),e=0;e<=o.getDotCount();e+=1)t.append(i("<li />").append(o.options.customPaging.call(this,o,e)));o.$dots=t.appendTo(o.options.appendDots),o.$dots.find("li").first().addClass("slick-active")}},e.prototype.buildOut=function(){var e=this;e.$slides=e.$slider.children(e.options.slide+":not(.slick-cloned)").addClass("slick-slide"),e.slideCount=e.$slides.length,e.$slides.each(function(e,t){i(t).attr("data-slick-index",e).data("originalStyling",i(t).attr("style")||"")}),e.$slider.addClass("slick-slider"),e.$slideTrack=0===e.slideCount?i('<div class="slick-track"/>').appendTo(e.$slider):e.$slides.wrapAll('<div class="slick-track"/>').parent(),e.$list=e.$slideTrack.wrap('<div class="slick-list"/>').parent(),e.$slideTrack.css("opacity",0),!0!==e.options.centerMode&&!0!==e.options.swipeToSlide||(e.options.slidesToScroll=1),i("img[data-lazy]",e.$slider).not("[src]").addClass("slick-loading"),e.setupInfinite(),e.buildArrows(),e.buildDots(),e.updateDots(),e.setSlideClasses("number"==typeof e.currentSlide?e.currentSlide:0),!0===e.options.draggable&&e.$list.addClass("draggable")},e.prototype.buildRows=function(){var i,e,t,o,s,n,r,l=this;if(o=document.createDocumentFragment(),n=l.$slider.children(),l.options.rows>1){for(r=l.options.slidesPerRow*l.options.rows,s=Math.ceil(n.length/r),i=0;i<s;i++){var d=document.createElement("div");for(e=0;e<l.options.rows;e++){var a=document.createElement("div");for(t=0;t<l.options.slidesPerRow;t++){var c=i*r+(e*l.options.slidesPerRow+t);n.get(c)&&a.appendChild(n.get(c))}d.appendChild(a)}o.appendChild(d)}l.$slider.empty().append(o),l.$slider.children().children().children().css({width:100/l.options.slidesPerRow+"%",display:"inline-block"})}},e.prototype.checkResponsive=function(e,t){var o,s,n,r=this,l=!1,d=r.$slider.width(),a=window.innerWidth||i(window).width();if("window"===r.respondTo?n=a:"slider"===r.respondTo?n=d:"min"===r.respondTo&&(n=Math.min(a,d)),r.options.responsive&&r.options.responsive.length&&null!==r.options.responsive){s=null;for(o in r.breakpoints)r.breakpoints.hasOwnProperty(o)&&(!1===r.originalSettings.mobileFirst?n<r.breakpoints[o]&&(s=r.breakpoints[o]):n>r.breakpoints[o]&&(s=r.breakpoints[o]));null!==s?null!==r.activeBreakpoint?(s!==r.activeBreakpoint||t)&&(r.activeBreakpoint=s,"unslick"===r.breakpointSettings[s]?r.unslick(s):(r.options=i.extend({},r.originalSettings,r.breakpointSettings[s]),!0===e&&(r.currentSlide=r.options.initialSlide),r.refresh(e)),l=s):(r.activeBreakpoint=s,"unslick"===r.breakpointSettings[s]?r.unslick(s):(r.options=i.extend({},r.originalSettings,r.breakpointSettings[s]),!0===e&&(r.currentSlide=r.options.initialSlide),r.refresh(e)),l=s):null!==r.activeBreakpoint&&(r.activeBreakpoint=null,r.options=r.originalSettings,!0===e&&(r.currentSlide=r.options.initialSlide),r.refresh(e),l=s),e||!1===l||r.$slider.trigger("breakpoint",[r,l])}},e.prototype.changeSlide=function(e,t){var o,s,n,r=this,l=i(e.currentTarget);switch(l.is("a")&&e.preventDefault(),l.is("li")||(l=l.closest("li")),n=r.slideCount%r.options.slidesToScroll!=0,o=n?0:(r.slideCount-r.currentSlide)%r.options.slidesToScroll,e.data.message){case"previous":s=0===o?r.options.slidesToScroll:r.options.slidesToShow-o,r.slideCount>r.options.slidesToShow&&r.slideHandler(r.currentSlide-s,!1,t);break;case"next":s=0===o?r.options.slidesToScroll:o,r.slideCount>r.options.slidesToShow&&r.slideHandler(r.currentSlide+s,!1,t);break;case"index":var d=0===e.data.index?0:e.data.index||l.index()*r.options.slidesToScroll;r.slideHandler(r.checkNavigable(d),!1,t),l.children().trigger("focus");break;default:return}},e.prototype.checkNavigable=function(i){var e,t;if(e=this.getNavigableIndexes(),t=0,i>e[e.length-1])i=e[e.length-1];else for(var o in e){if(i<e[o]){i=t;break}t=e[o]}return i},e.prototype.cleanUpEvents=function(){var e=this;e.options.dots&&null!==e.$dots&&(i("li",e.$dots).off("click.slick",e.changeSlide).off("mouseenter.slick",i.proxy(e.interrupt,e,!0)).off("mouseleave.slick",i.proxy(e.interrupt,e,!1)),!0===e.options.accessibility&&e.$dots.off("keydown.slick",e.keyHandler)),e.$slider.off("focus.slick blur.slick"),!0===e.options.arrows&&e.slideCount>e.options.slidesToShow&&(e.$prevArrow&&e.$prevArrow.off("click.slick",e.changeSlide),e.$nextArrow&&e.$nextArrow.off("click.slick",e.changeSlide),!0===e.options.accessibility&&(e.$prevArrow&&e.$prevArrow.off("keydown.slick",e.keyHandler),e.$nextArrow&&e.$nextArrow.off("keydown.slick",e.keyHandler))),e.$list.off("touchstart.slick mousedown.slick",e.swipeHandler),e.$list.off("touchmove.slick mousemove.slick",e.swipeHandler),e.$list.off("touchend.slick mouseup.slick",e.swipeHandler),e.$list.off("touchcancel.slick mouseleave.slick",e.swipeHandler),e.$list.off("click.slick",e.clickHandler),i(document).off(e.visibilityChange,e.visibility),e.cleanUpSlideEvents(),!0===e.options.accessibility&&e.$list.off("keydown.slick",e.keyHandler),!0===e.options.focusOnSelect&&i(e.$slideTrack).children().off("click.slick",e.selectHandler),i(window).off("orientationchange.slick.slick-"+e.instanceUid,e.orientationChange),i(window).off("resize.slick.slick-"+e.instanceUid,e.resize),i("[draggable!=true]",e.$slideTrack).off("dragstart",e.preventDefault),i(window).off("load.slick.slick-"+e.instanceUid,e.setPosition)},e.prototype.cleanUpSlideEvents=function(){var e=this;e.$list.off("mouseenter.slick",i.proxy(e.interrupt,e,!0)),e.$list.off("mouseleave.slick",i.proxy(e.interrupt,e,!1))},e.prototype.cleanUpRows=function(){var i,e=this;e.options.rows>1&&((i=e.$slides.children().children()).removeAttr("style"),e.$slider.empty().append(i))},e.prototype.clickHandler=function(i){!1===this.shouldClick&&(i.stopImmediatePropagation(),i.stopPropagation(),i.preventDefault())},e.prototype.destroy=function(e){var t=this;t.autoPlayClear(),t.touchObject={},t.cleanUpEvents(),i(".slick-cloned",t.$slider).detach(),t.$dots&&t.$dots.remove(),t.$prevArrow&&t.$prevArrow.length&&(t.$prevArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display",""),t.htmlExpr.test(t.options.prevArrow)&&t.$prevArrow.remove()),t.$nextArrow&&t.$nextArrow.length&&(t.$nextArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display",""),t.htmlExpr.test(t.options.nextArrow)&&t.$nextArrow.remove()),t.$slides&&(t.$slides.removeClass("slick-slide slick-active slick-center slick-visible slick-current").removeAttr("aria-hidden").removeAttr("data-slick-index").each(function(){i(this).attr("style",i(this).data("originalStyling"))}),t.$slideTrack.children(this.options.slide).detach(),t.$slideTrack.detach(),t.$list.detach(),t.$slider.append(t.$slides)),t.cleanUpRows(),t.$slider.removeClass("slick-slider"),t.$slider.removeClass("slick-initialized"),t.$slider.removeClass("slick-dotted"),t.unslicked=!0,e||t.$slider.trigger("destroy",[t])},e.prototype.disableTransition=function(i){var e=this,t={};t[e.transitionType]="",!1===e.options.fade?e.$slideTrack.css(t):e.$slides.eq(i).css(t)},e.prototype.fadeSlide=function(i,e){var t=this;!1===t.cssTransitions?(t.$slides.eq(i).css({zIndex:t.options.zIndex}),t.$slides.eq(i).animate({opacity:1},t.options.speed,t.options.easing,e)):(t.applyTransition(i),t.$slides.eq(i).css({opacity:1,zIndex:t.options.zIndex}),e&&setTimeout(function(){t.disableTransition(i),e.call()},t.options.speed))},e.prototype.fadeSlideOut=function(i){var e=this;!1===e.cssTransitions?e.$slides.eq(i).animate({opacity:0,zIndex:e.options.zIndex-2},e.options.speed,e.options.easing):(e.applyTransition(i),e.$slides.eq(i).css({opacity:0,zIndex:e.options.zIndex-2}))},e.prototype.filterSlides=e.prototype.slickFilter=function(i){var e=this;null!==i&&(e.$slidesCache=e.$slides,e.unload(),e.$slideTrack.children(this.options.slide).detach(),e.$slidesCache.filter(i).appendTo(e.$slideTrack),e.reinit())},e.prototype.focusHandler=function(){var e=this;e.$slider.off("focus.slick blur.slick").on("focus.slick blur.slick","*",function(t){t.stopImmediatePropagation();var o=i(this);setTimeout(function(){e.options.pauseOnFocus&&(e.focussed=o.is(":focus"),e.autoPlay())},0)})},e.prototype.getCurrent=e.prototype.slickCurrentSlide=function(){return this.currentSlide},e.prototype.getDotCount=function(){var i=this,e=0,t=0,o=0;if(!0===i.options.infinite)if(i.slideCount<=i.options.slidesToShow)++o;else for(;e<i.slideCount;)++o,e=t+i.options.slidesToScroll,t+=i.options.slidesToScroll<=i.options.slidesToShow?i.options.slidesToScroll:i.options.slidesToShow;else if(!0===i.options.centerMode)o=i.slideCount;else if(i.options.asNavFor)for(;e<i.slideCount;)++o,e=t+i.options.slidesToScroll,t+=i.options.slidesToScroll<=i.options.slidesToShow?i.options.slidesToScroll:i.options.slidesToShow;else o=1+Math.ceil((i.slideCount-i.options.slidesToShow)/i.options.slidesToScroll);return o-1},e.prototype.getLeft=function(i){var e,t,o,s,n=this,r=0;return n.slideOffset=0,t=n.$slides.first().outerHeight(!0),!0===n.options.infinite?(n.slideCount>n.options.slidesToShow&&(n.slideOffset=n.slideWidth*n.options.slidesToShow*-1,s=-1,!0===n.options.vertical&&!0===n.options.centerMode&&(2===n.options.slidesToShow?s=-1.5:1===n.options.slidesToShow&&(s=-2)),r=t*n.options.slidesToShow*s),n.slideCount%n.options.slidesToScroll!=0&&i+n.options.slidesToScroll>n.slideCount&&n.slideCount>n.options.slidesToShow&&(i>n.slideCount?(n.slideOffset=(n.options.slidesToShow-(i-n.slideCount))*n.slideWidth*-1,r=(n.options.slidesToShow-(i-n.slideCount))*t*-1):(n.slideOffset=n.slideCount%n.options.slidesToScroll*n.slideWidth*-1,r=n.slideCount%n.options.slidesToScroll*t*-1))):i+n.options.slidesToShow>n.slideCount&&(n.slideOffset=(i+n.options.slidesToShow-n.slideCount)*n.slideWidth,r=(i+n.options.slidesToShow-n.slideCount)*t),n.slideCount<=n.options.slidesToShow&&(n.slideOffset=0,r=0),!0===n.options.centerMode&&n.slideCount<=n.options.slidesToShow?n.slideOffset=n.slideWidth*Math.floor(n.options.slidesToShow)/2-n.slideWidth*n.slideCount/2:!0===n.options.centerMode&&!0===n.options.infinite?n.slideOffset+=n.slideWidth*Math.floor(n.options.slidesToShow/2)-n.slideWidth:!0===n.options.centerMode&&(n.slideOffset=0,n.slideOffset+=n.slideWidth*Math.floor(n.options.slidesToShow/2)),e=!1===n.options.vertical?i*n.slideWidth*-1+n.slideOffset:i*t*-1+r,!0===n.options.variableWidth&&(o=n.slideCount<=n.options.slidesToShow||!1===n.options.infinite?n.$slideTrack.children(".slick-slide").eq(i):n.$slideTrack.children(".slick-slide").eq(i+n.options.slidesToShow),e=!0===n.options.rtl?o[0]?-1*(n.$slideTrack.width()-o[0].offsetLeft-o.width()):0:o[0]?-1*o[0].offsetLeft:0,!0===n.options.centerMode&&(o=n.slideCount<=n.options.slidesToShow||!1===n.options.infinite?n.$slideTrack.children(".slick-slide").eq(i):n.$slideTrack.children(".slick-slide").eq(i+n.options.slidesToShow+1),e=!0===n.options.rtl?o[0]?-1*(n.$slideTrack.width()-o[0].offsetLeft-o.width()):0:o[0]?-1*o[0].offsetLeft:0,e+=(n.$list.width()-o.outerWidth())/2)),e},e.prototype.getOption=e.prototype.slickGetOption=function(i){return this.options[i]},e.prototype.getNavigableIndexes=function(){var i,e=this,t=0,o=0,s=[];for(!1===e.options.infinite?i=e.slideCount:(t=-1*e.options.slidesToScroll,o=-1*e.options.slidesToScroll,i=2*e.slideCount);t<i;)s.push(t),t=o+e.options.slidesToScroll,o+=e.options.slidesToScroll<=e.options.slidesToShow?e.options.slidesToScroll:e.options.slidesToShow;return s},e.prototype.getSlick=function(){return this},e.prototype.getSlideCount=function(){var e,t,o=this;return t=!0===o.options.centerMode?o.slideWidth*Math.floor(o.options.slidesToShow/2):0,!0===o.options.swipeToSlide?(o.$slideTrack.find(".slick-slide").each(function(s,n){if(n.offsetLeft-t+i(n).outerWidth()/2>-1*o.swipeLeft)return e=n,!1}),Math.abs(i(e).attr("data-slick-index")-o.currentSlide)||1):o.options.slidesToScroll},e.prototype.goTo=e.prototype.slickGoTo=function(i,e){this.changeSlide({data:{message:"index",index:parseInt(i)}},e)},e.prototype.init=function(e){var t=this;i(t.$slider).hasClass("slick-initialized")||(i(t.$slider).addClass("slick-initialized"),t.buildRows(),t.buildOut(),t.setProps(),t.startLoad(),t.loadSlider(),t.initializeEvents(),t.updateArrows(),t.updateDots(),t.checkResponsive(!0),t.focusHandler()),e&&t.$slider.trigger("init",[t]),!0===t.options.accessibility&&t.initADA(),t.options.autoplay&&(t.paused=!1,t.autoPlay())},e.prototype.initADA=function(){var e=this,t=Math.ceil(e.slideCount/e.options.slidesToShow),o=e.getNavigableIndexes().filter(function(i){return i>=0&&i<e.slideCount});e.$slides.add(e.$slideTrack.find(".slick-cloned")).attr({"aria-hidden":"true",tabindex:"-1"}).find("a, input, button, select").attr({tabindex:"-1"}),null!==e.$dots&&(e.$slides.not(e.$slideTrack.find(".slick-cloned")).each(function(t){var s=o.indexOf(t);i(this).attr({role:"tabpanel",id:"slick-slide"+e.instanceUid+t,tabindex:-1}),-1!==s&&i(this).attr({"aria-describedby":"slick-slide-control"+e.instanceUid+s})}),e.$dots.attr("role","tablist").find("li").each(function(s){var n=o[s];i(this).attr({role:"presentation"}),i(this).find("button").first().attr({role:"tab",id:"slick-slide-control"+e.instanceUid+s,"aria-controls":"slick-slide"+e.instanceUid+n,"aria-label":s+1+" of "+t,"aria-selected":null,tabindex:"-1"})}).eq(e.currentSlide).find("button").attr({"aria-selected":"true",tabindex:"0"}).end());for(var s=e.currentSlide,n=s+e.options.slidesToShow;s<n;s++)e.$slides.eq(s).attr("tabindex",0);e.activateADA()},e.prototype.initArrowEvents=function(){var i=this;!0===i.options.arrows&&i.slideCount>i.options.slidesToShow&&(i.$prevArrow.off("click.slick").on("click.slick",{message:"previous"},i.changeSlide),i.$nextArrow.off("click.slick").on("click.slick",{message:"next"},i.changeSlide),!0===i.options.accessibility&&(i.$prevArrow.on("keydown.slick",i.keyHandler),i.$nextArrow.on("keydown.slick",i.keyHandler)))},e.prototype.initDotEvents=function(){var e=this;!0===e.options.dots&&(i("li",e.$dots).on("click.slick",{message:"index"},e.changeSlide),!0===e.options.accessibility&&e.$dots.on("keydown.slick",e.keyHandler)),!0===e.options.dots&&!0===e.options.pauseOnDotsHover&&i("li",e.$dots).on("mouseenter.slick",i.proxy(e.interrupt,e,!0)).on("mouseleave.slick",i.proxy(e.interrupt,e,!1))},e.prototype.initSlideEvents=function(){var e=this;e.options.pauseOnHover&&(e.$list.on("mouseenter.slick",i.proxy(e.interrupt,e,!0)),e.$list.on("mouseleave.slick",i.proxy(e.interrupt,e,!1)))},e.prototype.initializeEvents=function(){var e=this;e.initArrowEvents(),e.initDotEvents(),e.initSlideEvents(),e.$list.on("touchstart.slick mousedown.slick",{action:"start"},e.swipeHandler),e.$list.on("touchmove.slick mousemove.slick",{action:"move"},e.swipeHandler),e.$list.on("touchend.slick mouseup.slick",{action:"end"},e.swipeHandler),e.$list.on("touchcancel.slick mouseleave.slick",{action:"end"},e.swipeHandler),e.$list.on("click.slick",e.clickHandler),i(document).on(e.visibilityChange,i.proxy(e.visibility,e)),!0===e.options.accessibility&&e.$list.on("keydown.slick",e.keyHandler),!0===e.options.focusOnSelect&&i(e.$slideTrack).children().on("click.slick",e.selectHandler),i(window).on("orientationchange.slick.slick-"+e.instanceUid,i.proxy(e.orientationChange,e)),i(window).on("resize.slick.slick-"+e.instanceUid,i.proxy(e.resize,e)),i("[draggable!=true]",e.$slideTrack).on("dragstart",e.preventDefault),i(window).on("load.slick.slick-"+e.instanceUid,e.setPosition),i(e.setPosition)},e.prototype.initUI=function(){var i=this;!0===i.options.arrows&&i.slideCount>i.options.slidesToShow&&(i.$prevArrow.show(),i.$nextArrow.show()),!0===i.options.dots&&i.slideCount>i.options.slidesToShow&&i.$dots.show()},e.prototype.keyHandler=function(i){var e=this;i.target.tagName.match("TEXTAREA|INPUT|SELECT")||(37===i.keyCode&&!0===e.options.accessibility?e.changeSlide({data:{message:!0===e.options.rtl?"next":"previous"}}):39===i.keyCode&&!0===e.options.accessibility&&e.changeSlide({data:{message:!0===e.options.rtl?"previous":"next"}}))},e.prototype.lazyLoad=function(){function e(e){i("img[data-lazy]",e).each(function(){var e=i(this),t=i(this).attr("data-lazy"),o=i(this).attr("data-srcset"),s=i(this).attr("data-sizes")||n.$slider.attr("data-sizes"),r=document.createElement("img");r.onload=function(){e.animate({opacity:0},100,function(){o&&(e.attr("srcset",o),s&&e.attr("sizes",s)),e.attr("src",t).animate({opacity:1},200,function(){e.removeAttr("data-lazy data-srcset data-sizes").removeClass("slick-loading")}),n.$slider.trigger("lazyLoaded",[n,e,t])})},r.onerror=function(){e.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"),n.$slider.trigger("lazyLoadError",[n,e,t])},r.src=t})}var t,o,s,n=this;if(!0===n.options.centerMode?!0===n.options.infinite?s=(o=n.currentSlide+(n.options.slidesToShow/2+1))+n.options.slidesToShow+2:(o=Math.max(0,n.currentSlide-(n.options.slidesToShow/2+1)),s=n.options.slidesToShow/2+1+2+n.currentSlide):(o=n.options.infinite?n.options.slidesToShow+n.currentSlide:n.currentSlide,s=Math.ceil(o+n.options.slidesToShow),!0===n.options.fade&&(o>0&&o--,s<=n.slideCount&&s++)),t=n.$slider.find(".slick-slide").slice(o,s),"anticipated"===n.options.lazyLoad)for(var r=o-1,l=s,d=n.$slider.find(".slick-slide"),a=0;a<n.options.slidesToScroll;a++)r<0&&(r=n.slideCount-1),t=(t=t.add(d.eq(r))).add(d.eq(l)),r--,l++;e(t),n.slideCount<=n.options.slidesToShow?e(n.$slider.find(".slick-slide")):n.currentSlide>=n.slideCount-n.options.slidesToShow?e(n.$slider.find(".slick-cloned").slice(0,n.options.slidesToShow)):0===n.currentSlide&&e(n.$slider.find(".slick-cloned").slice(-1*n.options.slidesToShow))},e.prototype.loadSlider=function(){var i=this;i.setPosition(),i.$slideTrack.css({opacity:1}),i.$slider.removeClass("slick-loading"),i.initUI(),"progressive"===i.options.lazyLoad&&i.progressiveLazyLoad()},e.prototype.next=e.prototype.slickNext=function(){this.changeSlide({data:{message:"next"}})},e.prototype.orientationChange=function(){var i=this;i.checkResponsive(),i.setPosition()},e.prototype.pause=e.prototype.slickPause=function(){var i=this;i.autoPlayClear(),i.paused=!0},e.prototype.play=e.prototype.slickPlay=function(){var i=this;i.autoPlay(),i.options.autoplay=!0,i.paused=!1,i.focussed=!1,i.interrupted=!1},e.prototype.postSlide=function(e){var t=this;t.unslicked||(t.$slider.trigger("afterChange",[t,e]),t.animating=!1,t.slideCount>t.options.slidesToShow&&t.setPosition(),t.swipeLeft=null,t.options.autoplay&&t.autoPlay(),!0===t.options.accessibility&&(t.initADA(),t.options.focusOnChange&&i(t.$slides.get(t.currentSlide)).attr("tabindex",0).focus()))},e.prototype.prev=e.prototype.slickPrev=function(){this.changeSlide({data:{message:"previous"}})},e.prototype.preventDefault=function(i){i.preventDefault()},e.prototype.progressiveLazyLoad=function(e){e=e||1;var t,o,s,n,r,l=this,d=i("img[data-lazy]",l.$slider);d.length?(t=d.first(),o=t.attr("data-lazy"),s=t.attr("data-srcset"),n=t.attr("data-sizes")||l.$slider.attr("data-sizes"),(r=document.createElement("img")).onload=function(){s&&(t.attr("srcset",s),n&&t.attr("sizes",n)),t.attr("src",o).removeAttr("data-lazy data-srcset data-sizes").removeClass("slick-loading"),!0===l.options.adaptiveHeight&&l.setPosition(),l.$slider.trigger("lazyLoaded",[l,t,o]),l.progressiveLazyLoad()},r.onerror=function(){e<3?setTimeout(function(){l.progressiveLazyLoad(e+1)},500):(t.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"),l.$slider.trigger("lazyLoadError",[l,t,o]),l.progressiveLazyLoad())},r.src=o):l.$slider.trigger("allImagesLoaded",[l])},e.prototype.refresh=function(e){var t,o,s=this;o=s.slideCount-s.options.slidesToShow,!s.options.infinite&&s.currentSlide>o&&(s.currentSlide=o),s.slideCount<=s.options.slidesToShow&&(s.currentSlide=0),t=s.currentSlide,s.destroy(!0),i.extend(s,s.initials,{currentSlide:t}),s.init(),e||s.changeSlide({data:{message:"index",index:t}},!1)},e.prototype.registerBreakpoints=function(){var e,t,o,s=this,n=s.options.responsive||null;if("array"===i.type(n)&&n.length){s.respondTo=s.options.respondTo||"window";for(e in n)if(o=s.breakpoints.length-1,n.hasOwnProperty(e)){for(t=n[e].breakpoint;o>=0;)s.breakpoints[o]&&s.breakpoints[o]===t&&s.breakpoints.splice(o,1),o--;s.breakpoints.push(t),s.breakpointSettings[t]=n[e].settings}s.breakpoints.sort(function(i,e){return s.options.mobileFirst?i-e:e-i})}},e.prototype.reinit=function(){var e=this;e.$slides=e.$slideTrack.children(e.options.slide).addClass("slick-slide"),e.slideCount=e.$slides.length,e.currentSlide>=e.slideCount&&0!==e.currentSlide&&(e.currentSlide=e.currentSlide-e.options.slidesToScroll),e.slideCount<=e.options.slidesToShow&&(e.currentSlide=0),e.registerBreakpoints(),e.setProps(),e.setupInfinite(),e.buildArrows(),e.updateArrows(),e.initArrowEvents(),e.buildDots(),e.updateDots(),e.initDotEvents(),e.cleanUpSlideEvents(),e.initSlideEvents(),e.checkResponsive(!1,!0),!0===e.options.focusOnSelect&&i(e.$slideTrack).children().on("click.slick",e.selectHandler),e.setSlideClasses("number"==typeof e.currentSlide?e.currentSlide:0),e.setPosition(),e.focusHandler(),e.paused=!e.options.autoplay,e.autoPlay(),e.$slider.trigger("reInit",[e])},e.prototype.resize=function(){var e=this;i(window).width()!==e.windowWidth&&(clearTimeout(e.windowDelay),e.windowDelay=window.setTimeout(function(){e.windowWidth=i(window).width(),e.checkResponsive(),e.unslicked||e.setPosition()},50))},e.prototype.removeSlide=e.prototype.slickRemove=function(i,e,t){var o=this;if(i="boolean"==typeof i?!0===(e=i)?0:o.slideCount-1:!0===e?--i:i,o.slideCount<1||i<0||i>o.slideCount-1)return!1;o.unload(),!0===t?o.$slideTrack.children().remove():o.$slideTrack.children(this.options.slide).eq(i).remove(),o.$slides=o.$slideTrack.children(this.options.slide),o.$slideTrack.children(this.options.slide).detach(),o.$slideTrack.append(o.$slides),o.$slidesCache=o.$slides,o.reinit()},e.prototype.setCSS=function(i){var e,t,o=this,s={};!0===o.options.rtl&&(i=-i),e="left"==o.positionProp?Math.ceil(i)+"px":"0px",t="top"==o.positionProp?Math.ceil(i)+"px":"0px",s[o.positionProp]=i,!1===o.transformsEnabled?o.$slideTrack.css(s):(s={},!1===o.cssTransitions?(s[o.animType]="translate("+e+", "+t+")",o.$slideTrack.css(s)):(s[o.animType]="translate3d("+e+", "+t+", 0px)",o.$slideTrack.css(s)))},e.prototype.setDimensions=function(){var i=this;!1===i.options.vertical?!0===i.options.centerMode&&i.$list.css({padding:"0px "+i.options.centerPadding}):(i.$list.height(i.$slides.first().outerHeight(!0)*i.options.slidesToShow),!0===i.options.centerMode&&i.$list.css({padding:i.options.centerPadding+" 0px"})),i.listWidth=i.$list.width(),i.listHeight=i.$list.height(),!1===i.options.vertical&&!1===i.options.variableWidth?(i.slideWidth=Math.ceil(i.listWidth/i.options.slidesToShow),i.$slideTrack.width(Math.ceil(i.slideWidth*i.$slideTrack.children(".slick-slide").length))):!0===i.options.variableWidth?i.$slideTrack.width(5e3*i.slideCount):(i.slideWidth=Math.ceil(i.listWidth),i.$slideTrack.height(Math.ceil(i.$slides.first().outerHeight(!0)*i.$slideTrack.children(".slick-slide").length)));var e=i.$slides.first().outerWidth(!0)-i.$slides.first().width();!1===i.options.variableWidth&&i.$slideTrack.children(".slick-slide").width(i.slideWidth-e)},e.prototype.setFade=function(){var e,t=this;t.$slides.each(function(o,s){e=t.slideWidth*o*-1,!0===t.options.rtl?i(s).css({position:"relative",right:e,top:0,zIndex:t.options.zIndex-2,opacity:0}):i(s).css({position:"relative",left:e,top:0,zIndex:t.options.zIndex-2,opacity:0})}),t.$slides.eq(t.currentSlide).css({zIndex:t.options.zIndex-1,opacity:1})},e.prototype.setHeight=function(){var i=this;if(1===i.options.slidesToShow&&!0===i.options.adaptiveHeight&&!1===i.options.vertical){var e=i.$slides.eq(i.currentSlide).outerHeight(!0);i.$list.css("height",e)}},e.prototype.setOption=e.prototype.slickSetOption=function(){var e,t,o,s,n,r=this,l=!1;if("object"===i.type(arguments[0])?(o=arguments[0],l=arguments[1],n="multiple"):"string"===i.type(arguments[0])&&(o=arguments[0],s=arguments[1],l=arguments[2],"responsive"===arguments[0]&&"array"===i.type(arguments[1])?n="responsive":void 0!==arguments[1]&&(n="single")),"single"===n)r.options[o]=s;else if("multiple"===n)i.each(o,function(i,e){r.options[i]=e});else if("responsive"===n)for(t in s)if("array"!==i.type(r.options.responsive))r.options.responsive=[s[t]];else{for(e=r.options.responsive.length-1;e>=0;)r.options.responsive[e].breakpoint===s[t].breakpoint&&r.options.responsive.splice(e,1),e--;r.options.responsive.push(s[t])}l&&(r.unload(),r.reinit())},e.prototype.setPosition=function(){var i=this;i.setDimensions(),i.setHeight(),!1===i.options.fade?i.setCSS(i.getLeft(i.currentSlide)):i.setFade(),i.$slider.trigger("setPosition",[i])},e.prototype.setProps=function(){var i=this,e=document.body.style;i.positionProp=!0===i.options.vertical?"top":"left","top"===i.positionProp?i.$slider.addClass("slick-vertical"):i.$slider.removeClass("slick-vertical"),void 0===e.WebkitTransition&&void 0===e.MozTransition&&void 0===e.msTransition||!0===i.options.useCSS&&(i.cssTransitions=!0),i.options.fade&&("number"==typeof i.options.zIndex?i.options.zIndex<3&&(i.options.zIndex=3):i.options.zIndex=i.defaults.zIndex),void 0!==e.OTransform&&(i.animType="OTransform",i.transformType="-o-transform",i.transitionType="OTransition",void 0===e.perspectiveProperty&&void 0===e.webkitPerspective&&(i.animType=!1)),void 0!==e.MozTransform&&(i.animType="MozTransform",i.transformType="-moz-transform",i.transitionType="MozTransition",void 0===e.perspectiveProperty&&void 0===e.MozPerspective&&(i.animType=!1)),void 0!==e.webkitTransform&&(i.animType="webkitTransform",i.transformType="-webkit-transform",i.transitionType="webkitTransition",void 0===e.perspectiveProperty&&void 0===e.webkitPerspective&&(i.animType=!1)),void 0!==e.msTransform&&(i.animType="msTransform",i.transformType="-ms-transform",i.transitionType="msTransition",void 0===e.msTransform&&(i.animType=!1)),void 0!==e.transform&&!1!==i.animType&&(i.animType="transform",i.transformType="transform",i.transitionType="transition"),i.transformsEnabled=i.options.useTransform&&null!==i.animType&&!1!==i.animType},e.prototype.setSlideClasses=function(i){var e,t,o,s,n=this;if(t=n.$slider.find(".slick-slide").removeClass("slick-active slick-center slick-current").attr("aria-hidden","true"),n.$slides.eq(i).addClass("slick-current"),!0===n.options.centerMode){var r=n.options.slidesToShow%2==0?1:0;e=Math.floor(n.options.slidesToShow/2),!0===n.options.infinite&&(i>=e&&i<=n.slideCount-1-e?n.$slides.slice(i-e+r,i+e+1).addClass("slick-active").attr("aria-hidden","false"):(o=n.options.slidesToShow+i,t.slice(o-e+1+r,o+e+2).addClass("slick-active").attr("aria-hidden","false")),0===i?t.eq(t.length-1-n.options.slidesToShow).addClass("slick-center"):i===n.slideCount-1&&t.eq(n.options.slidesToShow).addClass("slick-center")),n.$slides.eq(i).addClass("slick-center")}else i>=0&&i<=n.slideCount-n.options.slidesToShow?n.$slides.slice(i,i+n.options.slidesToShow).addClass("slick-active").attr("aria-hidden","false"):t.length<=n.options.slidesToShow?t.addClass("slick-active").attr("aria-hidden","false"):(s=n.slideCount%n.options.slidesToShow,o=!0===n.options.infinite?n.options.slidesToShow+i:i,n.options.slidesToShow==n.options.slidesToScroll&&n.slideCount-i<n.options.slidesToShow?t.slice(o-(n.options.slidesToShow-s),o+s).addClass("slick-active").attr("aria-hidden","false"):t.slice(o,o+n.options.slidesToShow).addClass("slick-active").attr("aria-hidden","false"));"ondemand"!==n.options.lazyLoad&&"anticipated"!==n.options.lazyLoad||n.lazyLoad()},e.prototype.setupInfinite=function(){var e,t,o,s=this;if(!0===s.options.fade&&(s.options.centerMode=!1),!0===s.options.infinite&&!1===s.options.fade&&(t=null,s.slideCount>s.options.slidesToShow)){for(o=!0===s.options.centerMode?s.options.slidesToShow+1:s.options.slidesToShow,e=s.slideCount;e>s.slideCount-o;e-=1)t=e-1,i(s.$slides[t]).clone(!0).attr("id","").attr("data-slick-index",t-s.slideCount).prependTo(s.$slideTrack).addClass("slick-cloned");for(e=0;e<o+s.slideCount;e+=1)t=e,i(s.$slides[t]).clone(!0).attr("id","").attr("data-slick-index",t+s.slideCount).appendTo(s.$slideTrack).addClass("slick-cloned");s.$slideTrack.find(".slick-cloned").find("[id]").each(function(){i(this).attr("id","")})}},e.prototype.interrupt=function(i){var e=this;i||e.autoPlay(),e.interrupted=i},e.prototype.selectHandler=function(e){var t=this,o=i(e.target).is(".slick-slide")?i(e.target):i(e.target).parents(".slick-slide"),s=parseInt(o.attr("data-slick-index"));s||(s=0),t.slideCount<=t.options.slidesToShow?t.slideHandler(s,!1,!0):t.slideHandler(s)},e.prototype.slideHandler=function(i,e,t){var o,s,n,r,l,d=null,a=this;if(e=e||!1,!(!0===a.animating&&!0===a.options.waitForAnimate||!0===a.options.fade&&a.currentSlide===i))if(!1===e&&a.asNavFor(i),o=i,d=a.getLeft(o),r=a.getLeft(a.currentSlide),a.currentLeft=null===a.swipeLeft?r:a.swipeLeft,!1===a.options.infinite&&!1===a.options.centerMode&&(i<0||i>a.getDotCount()*a.options.slidesToScroll))!1===a.options.fade&&(o=a.currentSlide,!0!==t?a.animateSlide(r,function(){a.postSlide(o)}):a.postSlide(o));else if(!1===a.options.infinite&&!0===a.options.centerMode&&(i<0||i>a.slideCount-a.options.slidesToScroll))!1===a.options.fade&&(o=a.currentSlide,!0!==t?a.animateSlide(r,function(){a.postSlide(o)}):a.postSlide(o));else{if(a.options.autoplay&&clearInterval(a.autoPlayTimer),s=o<0?a.slideCount%a.options.slidesToScroll!=0?a.slideCount-a.slideCount%a.options.slidesToScroll:a.slideCount+o:o>=a.slideCount?a.slideCount%a.options.slidesToScroll!=0?0:o-a.slideCount:o,a.animating=!0,a.$slider.trigger("beforeChange",[a,a.currentSlide,s]),n=a.currentSlide,a.currentSlide=s,a.setSlideClasses(a.currentSlide),a.options.asNavFor&&(l=(l=a.getNavTarget()).slick("getSlick")).slideCount<=l.options.slidesToShow&&l.setSlideClasses(a.currentSlide),a.updateDots(),a.updateArrows(),!0===a.options.fade)return!0!==t?(a.fadeSlideOut(n),a.fadeSlide(s,function(){a.postSlide(s)})):a.postSlide(s),void a.animateHeight();!0!==t?a.animateSlide(d,function(){a.postSlide(s)}):a.postSlide(s)}},e.prototype.startLoad=function(){var i=this;!0===i.options.arrows&&i.slideCount>i.options.slidesToShow&&(i.$prevArrow.hide(),i.$nextArrow.hide()),!0===i.options.dots&&i.slideCount>i.options.slidesToShow&&i.$dots.hide(),i.$slider.addClass("slick-loading")},e.prototype.swipeDirection=function(){var i,e,t,o,s=this;return i=s.touchObject.startX-s.touchObject.curX,e=s.touchObject.startY-s.touchObject.curY,t=Math.atan2(e,i),(o=Math.round(180*t/Math.PI))<0&&(o=360-Math.abs(o)),o<=45&&o>=0?!1===s.options.rtl?"left":"right":o<=360&&o>=315?!1===s.options.rtl?"left":"right":o>=135&&o<=225?!1===s.options.rtl?"right":"left":!0===s.options.verticalSwiping?o>=35&&o<=135?"down":"up":"vertical"},e.prototype.swipeEnd=function(i){var e,t,o=this;if(o.dragging=!1,o.swiping=!1,o.scrolling)return o.scrolling=!1,!1;if(o.interrupted=!1,o.shouldClick=!(o.touchObject.swipeLength>10),void 0===o.touchObject.curX)return!1;if(!0===o.touchObject.edgeHit&&o.$slider.trigger("edge",[o,o.swipeDirection()]),o.touchObject.swipeLength>=o.touchObject.minSwipe){switch(t=o.swipeDirection()){case"left":case"down":e=o.options.swipeToSlide?o.checkNavigable(o.currentSlide+o.getSlideCount()):o.currentSlide+o.getSlideCount(),o.currentDirection=0;break;case"right":case"up":e=o.options.swipeToSlide?o.checkNavigable(o.currentSlide-o.getSlideCount()):o.currentSlide-o.getSlideCount(),o.currentDirection=1}"vertical"!=t&&(o.slideHandler(e),o.touchObject={},o.$slider.trigger("swipe",[o,t]))}else o.touchObject.startX!==o.touchObject.curX&&(o.slideHandler(o.currentSlide),o.touchObject={})},e.prototype.swipeHandler=function(i){var e=this;if(!(!1===e.options.swipe||"ontouchend"in document&&!1===e.options.swipe||!1===e.options.draggable&&-1!==i.type.indexOf("mouse")))switch(e.touchObject.fingerCount=i.originalEvent&&void 0!==i.originalEvent.touches?i.originalEvent.touches.length:1,e.touchObject.minSwipe=e.listWidth/e.options.touchThreshold,!0===e.options.verticalSwiping&&(e.touchObject.minSwipe=e.listHeight/e.options.touchThreshold),i.data.action){case"start":e.swipeStart(i);break;case"move":e.swipeMove(i);break;case"end":e.swipeEnd(i)}},e.prototype.swipeMove=function(i){var e,t,o,s,n,r,l=this;return n=void 0!==i.originalEvent?i.originalEvent.touches:null,!(!l.dragging||l.scrolling||n&&1!==n.length)&&(e=l.getLeft(l.currentSlide),l.touchObject.curX=void 0!==n?n[0].pageX:i.clientX,l.touchObject.curY=void 0!==n?n[0].pageY:i.clientY,l.touchObject.swipeLength=Math.round(Math.sqrt(Math.pow(l.touchObject.curX-l.touchObject.startX,2))),r=Math.round(Math.sqrt(Math.pow(l.touchObject.curY-l.touchObject.startY,2))),!l.options.verticalSwiping&&!l.swiping&&r>4?(l.scrolling=!0,!1):(!0===l.options.verticalSwiping&&(l.touchObject.swipeLength=r),t=l.swipeDirection(),void 0!==i.originalEvent&&l.touchObject.swipeLength>4&&(l.swiping=!0,i.preventDefault()),s=(!1===l.options.rtl?1:-1)*(l.touchObject.curX>l.touchObject.startX?1:-1),!0===l.options.verticalSwiping&&(s=l.touchObject.curY>l.touchObject.startY?1:-1),o=l.touchObject.swipeLength,l.touchObject.edgeHit=!1,!1===l.options.infinite&&(0===l.currentSlide&&"right"===t||l.currentSlide>=l.getDotCount()&&"left"===t)&&(o=l.touchObject.swipeLength*l.options.edgeFriction,l.touchObject.edgeHit=!0),!1===l.options.vertical?l.swipeLeft=e+o*s:l.swipeLeft=e+o*(l.$list.height()/l.listWidth)*s,!0===l.options.verticalSwiping&&(l.swipeLeft=e+o*s),!0!==l.options.fade&&!1!==l.options.touchMove&&(!0===l.animating?(l.swipeLeft=null,!1):void l.setCSS(l.swipeLeft))))},e.prototype.swipeStart=function(i){var e,t=this;if(t.interrupted=!0,1!==t.touchObject.fingerCount||t.slideCount<=t.options.slidesToShow)return t.touchObject={},!1;void 0!==i.originalEvent&&void 0!==i.originalEvent.touches&&(e=i.originalEvent.touches[0]),t.touchObject.startX=t.touchObject.curX=void 0!==e?e.pageX:i.clientX,t.touchObject.startY=t.touchObject.curY=void 0!==e?e.pageY:i.clientY,t.dragging=!0},e.prototype.unfilterSlides=e.prototype.slickUnfilter=function(){var i=this;null!==i.$slidesCache&&(i.unload(),i.$slideTrack.children(this.options.slide).detach(),i.$slidesCache.appendTo(i.$slideTrack),i.reinit())},e.prototype.unload=function(){var e=this;i(".slick-cloned",e.$slider).remove(),e.$dots&&e.$dots.remove(),e.$prevArrow&&e.htmlExpr.test(e.options.prevArrow)&&e.$prevArrow.remove(),e.$nextArrow&&e.htmlExpr.test(e.options.nextArrow)&&e.$nextArrow.remove(),e.$slides.removeClass("slick-slide slick-active slick-visible slick-current").attr("aria-hidden","true").css("width","")},e.prototype.unslick=function(i){var e=this;e.$slider.trigger("unslick",[e,i]),e.destroy()},e.prototype.updateArrows=function(){var i=this;Math.floor(i.options.slidesToShow/2),!0===i.options.arrows&&i.slideCount>i.options.slidesToShow&&!i.options.infinite&&(i.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false"),i.$nextArrow.removeClass("slick-disabled").attr("aria-disabled","false"),0===i.currentSlide?(i.$prevArrow.addClass("slick-disabled").attr("aria-disabled","true"),i.$nextArrow.removeClass("slick-disabled").attr("aria-disabled","false")):i.currentSlide>=i.slideCount-i.options.slidesToShow&&!1===i.options.centerMode?(i.$nextArrow.addClass("slick-disabled").attr("aria-disabled","true"),i.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false")):i.currentSlide>=i.slideCount-1&&!0===i.options.centerMode&&(i.$nextArrow.addClass("slick-disabled").attr("aria-disabled","true"),i.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false")))},e.prototype.updateDots=function(){var i=this;null!==i.$dots&&(i.$dots.find("li").removeClass("slick-active").end(),i.$dots.find("li").eq(Math.floor(i.currentSlide/i.options.slidesToScroll)).addClass("slick-active"))},e.prototype.visibility=function(){var i=this;i.options.autoplay&&(document[i.hidden]?i.interrupted=!0:i.interrupted=!1)},i.fn.slick=function(){var i,t,o=this,s=arguments[0],n=Array.prototype.slice.call(arguments,1),r=o.length;for(i=0;i<r;i++)if("object"==typeof s||void 0===s?o[i].slick=new e(o[i],s):t=o[i].slick[s].apply(o[i].slick,n),void 0!==t)return t;return o}});
