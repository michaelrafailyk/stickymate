/*

	stickymate v1.2.9
	Licensed under the MIT License
	Copyright 2020 Michael Rafaylik
	rafaylik@icloud.com
	https://github.com/rafaylik/stickymate
	https://www.npmjs.com/package/stickymate

*/

{

	// sticky section
	let sticky = {
		attribute: 'data-sticky',
		elements: false,
		container: 'sticky-container',
		property: 'position: -webkit-sticky; position: sticky;',
		// check if browser support position: sticky
		supported: function() {
			let element = document.createElement('div');
			element.style.cssText = sticky.property;
			return element.style.position.match('sticky') ? true : false;
		},
		wrap: function() {
			if (sticky.supported()) {
				if (!sticky.elements && document.querySelectorAll('[' + sticky.attribute + ']').length) {
					sticky.elements = document.querySelectorAll('[' + sticky.attribute + ']');
					for (let i = 0; i < sticky.elements.length; i++) {
						// make sure that we wrap sticky only once
						if (!sticky.elements[i].parentNode.classList.contains(sticky.container)) {
							// wrap sticky only if its doesn't have a parent
							if (sticky.elements[i].parentNode.tagName.toLowerCase() == 'body') {
								let container = document.createElement('div');
								container.classList.add(sticky.container);
								container.style.position = 'relative';
								sticky.elements[i].parentNode.insertBefore(container, sticky.elements[i]);
								container.appendChild(sticky.elements[i]);
							} else {
								sticky.elements[i].parentNode.classList.add(sticky.container);
								// change static position to relative to properly get the offsetTop in animation.get
								if (!sticky.elements[i].parentNode.style.position.length) {
									sticky.elements[i].parentNode.style.position = 'relative';
								}
							}
						}
					}
				}
			}
		},
		get: function() {
			if (sticky.supported()) {
				element:
				for (let i = 0; i < sticky.elements.length; i++) {
					// get params about from/duration of sticky position
					let params = sticky.elements[i].getAttribute(sticky.attribute);
					// create correct json string
					params = validation.tojson(params);
					try {
						params = JSON.parse(params);
					} catch (e) {continue element}
					if (!params['from'] || !params['duration']) continue element;
					// break the params string to separate the numbers inside
					params['from'] = params['from'].split(/(-?\d*\.?\d+)/).filter(function(e) {return e === 0 || e});
					params['duration'] = params['duration'].split(/(-?\d*\.?\d+)/).filter(function(e) {return e === 0 || e});
					if (!params['from'][0].match(/\d|top|center|bottom/)) continue element;
					if (!params['duration'][0].match(/\d/)) continue element;
					if (params['from'] == 'top') {
						params['from'][0] = 0;
					}
					else if (params['from'] == 'center') {
						let vh = -document.documentElement.clientHeight / 2;
						let eh = -sticky.elements[i].offsetHeight / 2;
						params['from'][0] = vh - eh;
					}
					else if (params['from'] == 'bottom') {
						let vh = -document.documentElement.clientHeight;
						let eh = -sticky.elements[i].offsetHeight;
						params['from'][0] = vh - eh;
					}
					// convert any type of keys to the pixels
					let start = convert.unitsToPixels(+params['from'][0], params['from'][1]);
					start = -start + 0;
					let end = convert.unitsToPixels(+params['duration'][0], params['duration'][1]);
					// compose the min-height for the parent container
					// but get correct offset until the element is not a sticky
					let originalPosition = sticky.elements[i].style.position;
					sticky.elements[i].style.position = 'static';
					end += sticky.elements[i].offsetTop;
					end += sticky.elements[i].offsetHeight;
					sticky.elements[i].style.position = originalPosition;
					// apply params back to an elements
					sticky.set(sticky.elements[i], sticky.elements[i].parentElement, start, end);
				}
			}
		},
		set: function(element, container, start, end) {
			if (!element.style.position.match('sticky')) {
				// actually make the element sticky
				element.style.cssText = (element.getAttribute('style') || '') + sticky.property;
			}
			element.style.top = start + 'px';
			container.style.minHeight = end + 'px';
		}
	};

	// animation section
	let animation = {
		attribute: 'data-animation',
		elements: false,
		list: [],
		status: {
			before: 'before',
			active: 'active',
			after: 'after'
		},
		get: function() {
			if (!animation.elements && document.querySelectorAll('[' + animation.attribute + ']').length) {
				animation.elements = document.querySelectorAll('[' + animation.attribute + ']');
			}
			animation.list = [];
			element:
			for (let i = 0; i < animation.elements.length; i++) {
				// get correct top position
				// if animated element is inside the sticky, its top position moves along scroll
				let top = correctTop(animation.elements[i]);
				// get params about position keys and animated values
				let params = animation.elements[i].getAttribute(animation.attribute);
				// create correct json string
				params = validation.tojson(params);
				// to preserve the order of the keys, wrap each of them in an array of one element
				let beforeFirstKey = /\:(\s+)?\{(\s+)?\"/g;
				let beforeNextKeys = /\"(\s+)?\,(\s+)?\"/g;
				let afterEachKey = /\"(\s+)?\:(\s+)?\"/g;
				params = params.replace(beforeFirstKey, ': {"[').replace(beforeNextKeys, '", "[').replace(afterEachKey, ']": "');
				try {
					params = JSON.parse(params);
				} catch (e) {continue element}
				// create an array and fill it with verified params
				let paramsVerified = [];
				for (let property in params) {
					if (typeof animation.elements[i].style[property] === 'undefined') continue element;
					if (Object.keys(params[property]).length < 2) continue element;
					let list = {};
					list[property] = {
						'position': [],
						'values': [],
						'status': null,
						'locked': false
					};
					// extract keys and values, verify and prepare them
					keys:
					for (let key in params[property]) {
						let position = key.replace(/\[|\]/g, '').split(/(-?\d*\.?\d+)/).filter(function(e) {return e === 0 || e});
						if (!position[0].match(/\d/)) continue keys;
						for (let k = 0; k < list[property]['position'].length; k++) {
							if (position[0] === list[property]['position'][k][0]) continue keys;
						}
						list[property]['position'].push(position);
						list[property]['values'].push(params[property][key]);
					}
					// aligning the order of multiple transform values, like scale(...), translate(...) etc
					if (property == 'transform') {
						// separate subvalues
						for (let j = 0; j < list[property]['values'].length; j++) {
							list[property]['values'][j] = list[property]['values'][j].split(/\s(?=[^()]*\()/);
						}
						// make the same order of subvalues inside each value
						let subvalues = new Map([].concat(...list[property]['values']).map(function(item) {
							return [item.replace(/\(.*\)/, ''), item]
						}));
						let valuesOrdered = list[property]['values'].map(function(row) { 
							return [...row.reduce(function(map, item) {
								return map.set(item.replace(/\(.*\)/, ''), item)
							}, new Map(subvalues)).values()]
						});
						// join subvalues back to string
						for (let k = 0; k < list[property]['values'].length; k++) {
							list[property]['values'][k] = valuesOrdered[k].join(' ');
						}
					}
					// separate the numbers inside values
					for (let l = 0; l < list[property]['values'].length; l++) {
						list[property]['values'][l] = list[property]['values'][l].split(/(-?\d*\.?\d+)/).filter(function(e) {return e === 0 || e});
					}
					// verify values for missing units types
					validation.autocomplete(list[property]['values']);
					// convert positions units to pixels
					for (let j = 0; j < list[property]['position'].length; j++) {
						let numbers = +list[property]['position'][j][0];
						let units = list[property]['position'][j][1];
						list[property]['position'][j] = convert.unitsToPixels(numbers, units) + top;
					}
					paramsVerified.push(list);
				}
				// make a global list of animated elements with them positions, values and statuses
				animation.list.push({
					'element': animation.elements[i],
					'params': paramsVerified
				});
			}
		},
		detect: function() {
			let scroll = window.pageYOffset;
			for (let i = 0; i < animation.list.length; i++) {
				let properties = animation.list[i]['params'];
				for (let j = 0; j < properties.length; j++) {
					let percent;
					let property;
					let params;
					for (let key in properties[j]) {
						property = key;
					}
					params = properties[j][property];
					let position = params['position'];
					let first = 0;
					let last = position.length-1;
					// the element is before the first position key of its animation, apply changes only once
					if (scroll < position[first] && params['status'] != animation.status.before) {
						params['status'] = animation.status.before;
						percent = 0;
						animation.set(animation.list[i], percent, first, first, j, property);
					}
					// the element is after the last position key of its animation, apply changes only once
					else if (scroll >= position[last] && params['status'] != animation.status.after) {
						params['status'] = animation.status.after;
						percent = 100;
						animation.set(animation.list[i], percent, last, last, j, property);
					}
					// the element is between the first and last position keys of its animation
					else if (scroll >= position[first] && scroll < position[last]) {
						if (params['status'] != animation.status.active) {
							params['status'] = animation.status.active;
						}
						// animation has only two position keys (without intermediate)
						if (position.length == 2) {
							percent = convert.pixelsToPercent(position[first], position[last], scroll);
							animation.set(animation.list[i], percent, first, last, j, property);
						}
						// animation has intermediate position keys
						else {
							for (let k = 0; k < position.length; k++) {
								// looking for keys between which we are now
								if (position[k+1] && scroll >= position[k] && scroll < position[k+1]) {
									// at the first entry in any case, apply the changes
									// next time animate only if the values between keys are not identical
									if (!params['locked']) {
										percent = convert.pixelsToPercent(position[k], position[k+1], scroll);
										animation.set(animation.list[i], percent, k, k+1, j, property);
									}
									// compare values between keys, if they are the same - lock
									let start = '';
									let end = '';
									for (let l = 0; l < params['values'][k].length; l++) {
										start += params['values'][k][l];
										end += params['values'][k+1][l];
									}
									if (start == end && !params['locked']) {
										params['locked'] = true;
									} else if (start != end && params['locked']) {
										params['locked'] = false;
									}
								}
							}
						}
					}
				}
			}
		},
		set: function(element, percent, start, end, id, property) {
			start = element['params'][id][property]['values'][start];
			end = element['params'][id][property]['values'][end];
			// collect the value back to string
			let value = '';
			for (let i = 0; i < start.length; i++) {
				if (percent == 0) {
					value += start[i];
				} else if (percent == 100) {
					value += end[i];
				} else {
					if (validation.numbers(start[i])) {
						value += convert.percentToValue(start[i], end[i], percent);
					} else {
						value += start[i];
					}
				}
			}
			// apply changes to an element
			window.requestAnimationFrame(function() {
				if (property != 'opacity') {
					element['element'].style['-webkit-' + property] = value;
				}
				element['element'].style[property] = value;
			});
		}
	};

	// classes section
	let classes = {
		attribute: 'data-classes',
		elements: false,
		list: [],
		get: function() {
			if (!classes.elements) {
				classes.elements = document.querySelectorAll('[' + classes.attribute + ']');
			}
			classes.list = [];
			for (let i = 0; i < classes.elements.length; i++) {
				// get correct top position
				// if element is inside the sticky, its top position moves along scroll
				let top = correctTop(classes.elements[i]);
				// get params about position keys and classes in values
				let params = classes.elements[i].getAttribute(classes.attribute);
				// create correct json string
				params = validation.tojson(params);
				// to preserve the order of the keys, wrap each of them in an array of one element
				let beforeFirstKey = /^(\s+)?\{(\s+)?\"/g;
				let beforeEachKey = /\}(\s+)?\,(\s+)?\"/g;
				let afterEachKey = /\"(\s+)?\:(\s+)?\{(\s+)?\"/g;
				params = params.replace(beforeFirstKey, '{"[').replace(beforeEachKey, '}, "[').replace(afterEachKey, ']": {"');
				params = JSON.parse(params);
				// list of keys and final classes for current element
				let list = {
					'element': classes.elements[i],
					'params': []
				};
				// save original classlist and write first key
				if (!classes.elements[i].hasAttribute('data-classlist-original')) {
					classes.elements[i].setAttribute('data-classlist-original', classes.elements[i].className);
				}
				list['params'].push({
					'position': 0,
					'status': false,
					'classes': classes.elements[i].getAttribute('data-classlist-original')
				});
				// compare classlist of current key with classlist of previous key and rewrite updated current classlist
				let counter = 0;
				for (let key in params) {
					let position = key.replace(/\[|\]/g, '').split(/(-?\d*\.?\d+)/).filter(function(e) {return e === 0 || e});
					let numbers = +position[0];
					let units = position[1];
					// convert any type of keys to the pixels
					position = convert.unitsToPixels(numbers, units) + top;
					// compose current key
					let sublist = {
						'position': position,
						'status': false,
						'classes': list['params'][counter]['classes']
					};
					// add the class only if it was not in the previous key
					if (params[key]['add']) {
						let addList = params[key]['add'].split(/\,?\s+|\,|\s+/g);
						for (let j = 0; j < addList.length; j++) {
							if (!sublist['classes'].match(addList[j])) {
								sublist['classes'] += ' ' + addList[j];
							}
						}
					}
					// remove the class only if it was in the previous key
					if (params[key]['remove']) {
						let removeList = params[key]['remove'].split(/\,?\s+|\,|\s+/g);
						for (let j = 0; j < removeList.length; j++) {
							if (sublist['classes'].match(removeList[j])) {
								sublist['classes'] = sublist['classes'].replace(removeList[j], '');
							}
						}
						// remove extra spaces
						sublist['classes'] = sublist['classes'].replace(/^\s+|\s+$/, '').replace(/\s{2,}/, ' ');
					}
					list['params'].push(sublist);
					counter++;
				}
				// add the element, status and keys/classes to the global list
				classes.list.push(list);
			}
		},
		detect: function() {
			let scroll = window.pageYOffset;
			for (let i = 0; i < classes.list.length; i++) {
				let element = classes.list[i]['element'];
				let params = classes.list[i]['params'];
				for (let j = 0; j < params.length; j++) {
					let current = params[j]['position'];
					let prev;
					let next;
					if (params[j-1]) prev = params[j-1]['position'];
					if (params[j+1]) next = params[j+1]['position'];
					let last = params[params.length-1]['position'];
					// find the matching key
					let ifNotLast = next && (scroll >= current) && (scroll < next) && !params[j]['status'];
					let ifLast = (scroll >= current) && (current == last) && !params[j]['status'];
					if (ifNotLast || ifLast) {
						params[j]['status'] = true;
						// if there is a need to apply classes only once, need to remove the following two conditions
						if (params[j-1]) {
							params[j-1]['status'] = false;
						}
						if (params[j+1]) {
							params[j+1]['status'] = false;
						}
						// apply classes to an element
						classes.set(element, params[j]['classes']);
					}
				}
			}
		},
		set: function(element, list) {
			window.requestAnimationFrame(function() {
				element.className = list;
			});
		}
	};

	// utilities

	let validation = {
		numbers: function(data) {
			if (typeof data == 'number') return true;
			else if (data.match(/\d/)) return true;
			else return false;
		},
		tojson: function(data) {
			// wrap in brackets
			if (data.substring(0, 1) !== '{') data = '{' + data + '}';
			data = data
				// protect commas inside round brackets
				.replace(/,(?=[^()]*\))/g, '__')
				// remove spaces around base separators
				.replace(/([\s\r\n]+)?([:\,\{\}])([\s\r\n]+)?/g, '$2')
				// wrap key and values in double quotes
				.replace(/(['"])?([a-zA-Z0-9\.\%\-_\(\)\s]+)(['"])?/g, '"$2"')
				// return commas inside round brackets
				.replace(/__/g, ',');
			return data;
		},
		autocomplete: function(data) {
			// get the longest string
			let completed = data[0].slice();
			for (let i = 0; i < data.length; i++) {
				if (data[i].length > completed.length) {
					completed = data[i].slice();
				}
			}
			// get the longest substrings except numbers
			for (let i = 0; i < data.length; i++) {
				for (let j = 0; j < completed.length; j++) {
					if (data[i][j] && !validation.numbers(data[i][j])) {
						if (data[i][j].length > completed[j].length) {
							completed[j] = data[i][j];
						}
					}
				}
			}
			// correct the wrong substrings except numbers, in each string
			for (let i = 0; i < completed.length; i++) {
				for (let j = 0; j < data.length; j++) {
					if (data[j][i]) {
						if (validation.numbers(data[j][i])) {
							data[j][i] = +data[j][i];
						} else if (!validation.numbers(data[j][i]) && data[j][i] != completed[i]) {
							data[j][i] = completed[i];
						}
					} else {
						if (validation.numbers(completed[i])) {
							data[j][i] = +completed[i];
						} else {
							data[j][i] = completed[i];
						}
					}
				}
			}
			return data;
		}
	};

	let convert = {
		unitsToPixels: function(numbers, units) {
			units = units || 'px';
			if (units.match('px')) {return numbers}
			else if (units.match('vh')) {return (numbers / 100) * document.documentElement.clientHeight}
			else if (units.match('vw')) {return (numbers / 100) * document.documentElement.clientWidth}
		},
		pixelsToPercent: function(a, b, pixels) {
			return ((pixels - a) * 100) / (b - a);
		},
		percentToValue: function(a, b, percent) {
			return ((percent * (b - a)) / 100) + a;
		}
	};

	let correctTop = function(element) {
		let top = 0;
		while(element && !isNaN(element.offsetTop)) {
			if (!element.style.position.match('sticky')) {
				top += element.offsetTop - element.scrollTop;
			} else {
				let originalPosition = element.style.position;
				element.style.position = 'relative';
				top += element.offsetTop - element.scrollTop;
				element.style.position = originalPosition;
			}
			element = element.offsetParent;
		}
		return top;
	};

	let resizeEnd = function(params) {
		let startWidth = document.documentElement.clientWidth;
		let startHeight = document.documentElement.clientHeight;
		setTimeout(function() {
			let endWidth = document.documentElement.clientWidth;
			let endHeight = document.documentElement.clientHeight;
			if (startWidth == endWidth && startHeight == endHeight) {
				// end of resize event
				params();
			}
		}, 50);
	};



	// initialization
	// get data and set keys and params
	let initialization = function() {
		sticky.wrap();
		sticky.get();
		animation.get();
		animation.detect();
		classes.get();
		classes.detect();
	};
	// checking state after async and/or defer
	if (document.readyState == 'loading' || document.readyState == 'interactive') {
		document.addEventListener('readystatechange', initialization);
	} else {
		initialization();
	}
	window.addEventListener('resize', function() {
		resizeEnd(initialization);
	}, {passive: true});
	// detect keys
	window.addEventListener('scroll', function() {
		animation.detect();
		classes.detect();
	}, {passive: true});



}