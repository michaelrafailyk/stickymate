Stickymate is a tool that designed to help web developers easily create animations without JavaScript knowledge, just setting animation params directly in the HTML markup. Stickymate combines extended sticky positioning and scroll-based animation features, so it can catch an element on the screen and animate it while the user scrolls the page. It is also possible to add and remove classes to control animation from CSS. Use your imagination to implement great ideas that will present your content in the most spectacular way.

## Demo

[Stickymate demonstration](https://rafailyk.github.io/stickymate/)

## Installing

- [Download](https://github.com/rafailyk/stickymate/archive/master.zip) and unzip, or just
```
$ npm install stickymate
```
- Include `stickymate.js` at the `head` section or at the end of the `body` tag.

## Usage

- Add a `data-sticky`, `data-animation` or `data-classes` attributes to your element together or apart.
``` html
<div data-sticky="..." data-animation="..." data-classes="..."></div>
```
- Set parameters for attributes.
``` html
<div data-sticky="from: 0, duration: 100vh" data-animation="opacity: {0: 1, 100vh: 0}" data-classes="0vh: {add: class1}"></div>
```
- Set parameters by the following scheme.
``` html
<div
    data-sticky="
        from: position,        // position from the top of the viewport when the element sticks to the screen
        duration: position     // position when the element will no longer sticky, extends the min-height of the parent container
    "
    data-animation="
        CSS property: {
            position: value,   // animate from
            position: value,   // optional, intermediate keys (.. to / from ..)
            position: value    // animate to
        },
        CSS property: {...}    // optional, additional CSS properties
    "
    data-classes="
        position: {                      // position from the top of the viewport
            add: classname classname,    // class names (one or more separated by a space) to be added
            remove: classname classname  // class names (one or more separated by a space) to be removed
        },
        position: {...}.                 // optional
    "
></div>
```
- The `data-sticky` attribute can contain only two params, namely `from` and `duration`.
- If there is no need to extends height of the parent container, you can specify `0` for the `duration` value.
- The `data-classes` attribute can contain `add` and `remove` keys separately or together.
- The `add` and `remove` keys of the `data-classes` attribute can contain one classname or several, separated by spaces.
- The `data-animation` attribute can contain one or more animated CSS properties, separated by commas.
- Every `data-animation` CSS property can contain two or more position keys, separated by commas.
- Set the name of animated CSS property without any vendor prefixes (`-webkit-` is added automatically).
- Units of position keys should be `px` (pixels), `vh` (viewport height) or `vw` (viewport width).
- You can set `from` position for `data-sticky` attribute like a `top / center / bottom`.
``` html
<div data-sticky="from: center, duration: 100vh"></div>
```
- Units and values of `data-animation` CSS property values are set the same as in CSS.
- `0` position can be set without units.
- `-100vh` = top of element reached the bottom of the viewport.
- `0vh` or `0px` or just `0` = top of element reached the top of the viewport.
- `100vh` = top of element reached the top of the viewport + one screen height has been scrolled after this.

## Examples

- All three attributes at once. In this example, the element sticks to the screen and its opacity changes from `1` to `0` while the user scrolls the page one viewport height. After that the class `class1` will be added to the element.
``` html
<div data-sticky="from: 0, duration: 100vh" data-animation="opacity: {0: 1, 100vh: 0}" data-classes="100vh: {add: class1}"></div>
```

- Sticky element. When top of the element reaches the top of the viewport (`from: 0`), it will stick on the screen until you scroll up two viewport height (`duration: 200vh`) from that moment.
``` html
<div data-sticky="from: 0, duration: 200vh"></div>
```

- Animated element with one CSS property and two position keys. While top of the element traverse from bottom of the viewport `-100vh` to the middle of the viewport `-50vh`, its `opacity` changes from `0` to `1`. Same as `opacity: 0;` and `opacity: 1;` in the CSS. Visually, this is a fade-in effect.
``` html
<div data-animation="opacity: {-100vh: 0, -50vh: 1}"></div>
```

- Animation with one CSS property and multiple position keys. In this example, the opacity of an element changes in two stages, from `0` to `1` (the top of the element moves along the lower quarter of the viewport: `-100vh`, `-75vh`) and then from `1` to `0.25` (the top of the element moves along the upper quarter of the viewport: `-25vh`, `0vh`).
``` html
<div data-animation="opacity: {-100vh: 0, -75vh: 1, -25vh: 1, 0vh: .25}"></div>
```

- Animation of `transform` CSS property with several values at once.
``` html
<div data-animation="transform: {-100vh: scale(1) translate(0, 0) rotate(0), -50vh: scale(.5) translate(50%, 0) rotate(22.5deg)}"></div>
```

- Animation with multiple CSS properties. Each CSS property has its own positioning keys and values.
``` html
<div data-animation="opacity: {-100vh: 0, -75vh: 1}, transform: {-100vh: scale(.75), -50vh: scale(1)}"></div>
```

- Adding and Removing Classes. Examples can be seen in the right column of the [Demo](https://rafaylik.github.io/stickymate/), where active keys are highlighted by classes.
``` html
<div data-classes="25vh: {add: class1}, 50vh: {add: class2 class3, remove: class1}, 75vh: {remove: class2 class3}"></div>
```

## Animated CSS properties

- You can animate any CSS property whose value contains just numbers or numbers in `%`, `px`, `vw`, `vh`, `em`, `rem`, `deg`.
- You cannot animate a `color` CSS property and a properties whose value contains: `left`, `right`, `top`, `bottom`, `center`, `none`, `auto`, `transparent` etc.
- Validated CSS properties:
    - `transform: matrix() scale() translate() rotate() translate3D() rotate3D()`
    - `opacity: 0-1`
    - `background-size: ...`
    - `background-position: ...`
    - `border: ...`
    - `font-size: ...`

## Browser compatibility

All modern browsers that support ECMAScript 6

- Chrome: 56
- Edge: 16
- Firefox: 48
- Internet Explorer: No
- Opera: 43
- Safari: 10
- Chrome on Android: 56
- Firefox on Android: 59
- Safari on iOS: 10

## Version history

- 1.2.5
    - Parameters setting has been simplified. Old syntax: `data-sticky='{"from": "0vh", "duration": "100vh"}'`. New syntax: `data-sticky="from: 0vh, duration: 100vh"`.
    - New `data-classes` attribute. Now you can add/remove one or more CSS classnames to element on specified key.
    - Multiple transform values, like `scale(...)`, `translate(...)` etc, are now automatically sorted in the same order for every key.
    - Release on npm.
- 1.3.0
    - Tracking elements with `IntersectionObserver` instead of constantly listening for the `scroll` event.
- 1.3.3
    - Incorrect calculation of parent element position type has been fixed.
- 1.3.6
    - Keys are now automatically sorted in order, which eliminates animation glitches if keys are specified in random order.

## Known minor issues

- Sticky element and parents overflow property. Any parent of `data-sticky` element should not have an `overflow` property. Read more about the issue: [Support position:sticky inside an overflow:hidden|auto on general parents](https://github.com/w3c/csswg-drafts/issues/865). If your animation overflows an element (any transformation that enlarges an element and creates a horizontal scroll bar) and you need to use `overflow: hidden`, just follow this scheme:
    - Doesn't work: `element with overflow: hidden` \> `sticky & animated element`.
    - Work: `sticky element with overflow: hidden` \> `animated element`.
- Matrix and rotation. Don't try to rotate the element with the `transform: matrix()` because script doesn't calculate `sin` and `cos` for correct transformation. To rotate, use `transform: rotate()`.
- Scrolling in Edge (EdgeHTML only). Periodic bugs in positioning animated elements inside parent with `overflow: hidden` when scrolling in the opposite direction.

## Author and license

**Michael Rafailyk** - [rafaylik](https://github.com/rafailyk) on GitHub. Project is licensed under the MIT License - see the [LICENSE.md](./LICENSE) file for details.