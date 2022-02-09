/*

	stickymate v1.3.7
	Licensed under the MIT License
	Copyright 2021 Michael Rafailyk
	rafailyk@icloud.com
	https://github.com/rafailyk/stickymate
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
								let parentPosition = window.getComputedStyle(sticky.elements[i].parentNode).getPropertyValue('position');
								if (parentPosition == 'static') {
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
					let start_numbers = -params['from'][0] + 0;
					let start_units = params['from'][1];
					let start = convert.unitsToPixels(start_numbers, start_units);
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
				try {
					params = JSON.parse(params);
				} catch (e) { continue element }
				// create an array and fill it with verified params
				let paramsVerified = [];
				for (let property_name in params) {
					if (typeof animation.elements[i].style[property_name] === 'undefined') continue element;
					if (Object.keys(params[property_name]).length < 2) continue element;
					let property_value = {};
					let list = {};
					list[property_name] = {
						'position': [],
						'values': [],
						'status': null,
						'locked': false
					};
					// convert keys to pixels and get sorted keys
					keys:
					for (let key in params[property_name]) {
						let position = key.split(/(-?\d*\.?\d+)/).filter(function(e) {return e === 0 || e});
						if (!position[0].match(/\d/)) continue keys;
						let numbers = +position[0] + 0;
						let units = position[1];
						position = convert.unitsToPixels(numbers, units) + top;
						position = Math.round(position);
						// version from Rattus
						// position = (0 > position) ? 0 : Math.round(position);
						property_value[position] = params[property_name][key];
					}
					// save keys and values saparately, verify and prepare them
					save:
					for (let key in property_value) {
						for (let k = 0; k < list[property_name]['position'].length; k++) {
							if (+key === list[property_name]['position'][k][0]) continue save;
						}
						list[property_name]['position'].push(+key);
						list[property_name]['values'].push(property_value[key]);
					}
					// aligning the order of multiple transform values, like scale(...), translate(...) etc
					if (property_name == 'transform') {
						// separate subvalues
						for (let j = 0; j < list[property_name]['values'].length; j++) {
							list[property_name]['values'][j] = list[property_name]['values'][j].split(/\s(?=[^()]*\()/);
						}
						// make the same order of subvalues inside each value
						let subvalues = new Map([].concat(...list[property_name]['values']).map(function(item) {
							return [item.replace(/\(.*\)/, ''), item]
						}));
						let valuesOrdered = list[property_name]['values'].map(function(row) { 
							return [...row.reduce(function(map, item) {
								return map.set(item.replace(/\(.*\)/, ''), item)
							}, new Map(subvalues)).values()]
						});
						// join subvalues back to string
						for (let k = 0; k < list[property_name]['values'].length; k++) {
							list[property_name]['values'][k] = valuesOrdered[k].join(' ');
						}
					}
					// separate the numbers inside values
					for (let l = 0; l < list[property_name]['values'].length; l++) {
						list[property_name]['values'][l] = list[property_name]['values'][l].split(/(-?\d*\.?\d+)/).filter(function(e) {return e === 0 || e});
					}
					// verify values for missing units types
					validation.autocomplete(list[property_name]['values']);
					paramsVerified.push(list);
				}
				// make a global list of animated elements with them positions, values and statuses
				animation.list.push({
					'element': animation.elements[i],
					'params': paramsVerified
				});
			}
		},
		detect: function(i, scroll) {
			scroll = scroll || window.pageYOffset;
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
			element:
			for (let i = 0; i < classes.elements.length; i++) {
				// get correct top position
				// if element is inside the sticky, its top position moves along scroll
				let top = correctTop(classes.elements[i]);
				// get params about position keys and classes in values
				let params = classes.elements[i].getAttribute(classes.attribute);
				// create correct json string
				params = validation.tojson(params);
				try {
					params = JSON.parse(params);
				} catch (e) { continue element }
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
				// convert keys to pixels and get sorted keys
				let params_sorted = {};
				keys:
				for (let key in params) {
					let position = key.split(/(-?\d*\.?\d+)/).filter(function(e) {return e === 0 || e});
					if (!position[0].match(/\d/)) continue keys;
					let numbers = +position[0] + 0;
					let units = position[1];
					position = convert.unitsToPixels(numbers, units) + top;
					position = Math.round(position);
					params_sorted[position] = params[key];
				}
				// compare classlist of current key with classlist of previous key and rewrite updated current classlist
				let counter = 0;
				for (let key in params_sorted) {
					// compose current key
					let sublist = {
						'position': +key,
						'status': false,
						'classes': list['params'][counter]['classes']
					};
					// add the class only if it was not in the previous key
					if (params_sorted[key]['add']) {
						let addList = params_sorted[key]['add'].split(/\,?\s+|\,|\s+/g);
						for (let j = 0; j < addList.length; j++) {
							if (!sublist['classes'].match(addList[j])) {
								sublist['classes'] += ' ' + addList[j];
							}
						}
					}
					// remove the class only if it was in the previous key
					if (params_sorted[key]['remove']) {
						let removeList = params_sorted[key]['remove'].split(/\,?\s+|\,|\s+/g);
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
		detect: function(i, scroll) {
			scroll = scroll || window.pageYOffset;
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

	let observation = function() {
		// decide whether to use IntersectionObserver or window scroll event for detecting elements
		if ('IntersectionObserver' in window) {
			// observe the visibility of elements in modern browsers
			let detector = {
				animation: function(i) {
					animation.detect(i);
				},
				classes: function(i) {
					classes.detect(i);
				},
				list: {
					animation: {},
					classes: {}
				}
			};
			const observer = new IntersectionObserver((entries, observer) => {
				entries.forEach(entry => {
					// get index and action type (animation/classes) of element to find it in animation/classes list
					let index = entry.target.animation_index;
					let action = entry.target.scroll_action;
					// prepare a personal function wrapper for detecting element in a window scroll event
					if (!detector.list[action][index]) {
						detector.list[action][index] = function() {
							detector[action](index);
						};
					}
					// link or unlink this function to scroll event only when the element intersect a viewport
					if (entry.isIntersecting) {
						window.addEventListener('scroll', detector.list[action][index], {passive: true});
					} else {
						window.removeEventListener('scroll', detector.list[action][index], {passive: true});
					}
				});
			});
			if (animation && animation.elements) {
				animation.elements.forEach((elem, index) => {
					// check if either parent has an overflow hidden
					let parent = elem.parentElement;
					while(parent) {
						let styles = window.getComputedStyle(parent);
						if (styles.getPropertyValue('overflow') == 'hidden' || styles.getPropertyValue('overflow-x') == 'hidden') {
							// be sure that parent's position is not static
							let parentPosition = window.getComputedStyle(elem.parentElement).getPropertyValue('position');
							if (parentPosition == 'static') {
								elem.parentElement.style.position = 'relative';
							}
							// add the new element before original element for observing instead of him
							let observed = document.createElement('div');
							observed.style.position = 'absolute';
							observed.style.pointerEvents = 'none';
							observed.style.left = '0px';
							observed.style.top = '0px';
							observed.style.width = '100%';
							observed.style.height = '100%';
							elem.before(observed);
							// now IntersectionObserver will observe this new element instead of original
							elem = observed;
							break;
						}
						parent = parent.parentElement;
					}
					// link index from animation/classes list and action type (animation/classes) to observed element
					elem.animation_index = index;
					elem.scroll_action = 'animation';
					observer.observe(elem);
				});
			}
			if (classes && classes.elements) {
				classes.elements.forEach((elem, index) => {
					elem.animation_index = index;
					elem.scroll_action = 'classes';
					observer.observe(elem);
				});
			}
		} else {
			// listen scroll event in older browsers
			window.addEventListener('scroll', function() {
				let scroll = window.pageYOffset;
				for (let i = 0; i < animation.list.length; i++) {
					animation.detect(i, scroll);
				}
				for (let i = 0; i < classes.list.length; i++) {
					classes.detect(i, scroll);
				}
			}, {passive: true});
		}
	};

	// initialization
	// get data and set keys and params
	let initialization = function() {
		sticky.wrap();
		sticky.get();
		animation.get();
		classes.get();
		for (let i = 0; i < animation.list.length; i++) {
			animation.detect(i);
		}
		for (let i = 0; i < classes.list.length; i++) {
			classes.detect(i);
		}
	};
	// checking DOM state
	if (document.readyState == 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			initialization();
			observation();
		});
		window.onload = initialization;
	} else if (document.readyState == 'interactive') {
		initialization();
		observation();
		window.onload = initialization;
	} else if (document.readyState == 'complete') {
		initialization();
		observation();
	}
	// update lists of element's position after resize
	window.addEventListener('resize', function() {
		resizeEnd(initialization);
	}, {passive: true});

}
