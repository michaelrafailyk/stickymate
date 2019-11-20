StickyMate is a tool that designed to help web developers easily create animations without JavaScript knowledge, just setting animation params in JSON format directly in the HTML markup. StickyMate combines extended sticky positioning and scroll-based animation features, so it can catch an element on the screen and animate it while the user scrolls the page. Use your imagination to implement great ideas that will present your content in the most spectacular way.

## Demo

[StickyMate demonstration](https://rafaylik.github.io/stickymate/)

## Installing

- [Download](https://github.com/rafaylik/stickymate/archive/master.zip) and unzip, or just `$ git clone https://github.com/rafaylik/stickymate.git`
- Place a `stickymate.js` in the directory of your application.
- Include it at the `head` section or at the end of the `body` tag.
``` html
<!DOCTYPE html>
<html>
    <head>

        <script src="stickymate.js" async defer></script>

    </head>
    <body>

        // elements

    </body>
</html>
```

## Usage

- Add a `data-sticky` or `data-animation` attributes (framed in single quotes) to your element together or apart.
``` html
<div data-sticky='{...}' data-animation='{...}'></div>
```
- Set parameters (with double quotes inside) for `data-sticky` and `data-animation` attributes by the following scheme (for simplicity, look at this in a hierarchical view).
``` html
<div
    data-sticky='{
        "start": "position",        // position from the top of the viewport when the element sticks to the screen
        "end": "position"           // position when the element will no longer sticky, extends the min-height of the parent container
    }'
    data-animation='{
        "CSS property": {
            "position": "value",    // animate from
            "position": "value",    // optional, intermediate keys (.. to / from ..)
            "position": "value"     // animate to
        },
        "CSS property": {...}       // optional, additional CSS properties
    }'
></div>
```
- The `data-sticky` attribute can contain only two params, namely `start` and `end`.
- If there is no need to extends the min-height of the parent container, you can specify `0` for the `end` value.
- The `data-animation` attribute can contain one or more animated CSS properties, separated by commas.
- Every `data-animation` CSS property can contain two or more position keys, separated by commas.
- Use JSON format with double quotes inside for every key and value.
- Set the name of animated CSS property without any vendor prefixes (`-webkit-` is added automatically).
- Inside one animated CSS property, for each value, keep the same order of sub values, if there are several. It is necessary for the correct operation of the autocomplete function.
``` html
<div data-animation='{"transform": {
    "-75vh": "scale(1) translate(0, 0)",       // sub values in order - scale, translate
    "-50vh": "scale(.5) translate(0, 50%)",    // correctly, the same sub values order
    "-25vh": "translate(0, 0) scale(1)"        // wrong, sub values order is different
}}'></div>
```
- Inside one animated CSS property, use the same units for setting position keys.
- Units of position keys should be `px` (pixels), `vh` (viewport height) or `vw` (viewport width).
- Units of `data-animation` CSS property values are set the same as in CSS.
- `0` position can be set without units.
- `-100vh` = top of element reached the bottom of the viewport.
- `0vh` or `0px` or just `0` = top of element reached the top of the viewport.
- `100vh` = top of element reached the top of the viewport + one screen height has been scrolled after this.

## Animated CSS properties

- You can animate any CSS property whose value contains just numbers or numbers in `%`, `px`, `vw`, `vh`, `em`, `rem`, `deg`.
- You cannot animate a `color` CSS property and a properties whose value contains: `left`, `right`, `top`, `bottom`, `center`, `none`, `auto`, `transparent` etc.
- Validated CSS properties:
    - `transform: matrix() scale() translate() rotate() translate3D() rotate3D()`
    - `opacity: 0-1`

## Examples

- Sticky element.
``` html
<div data-sticky='{"start": "0", "end": "200vh"}'></div>
```
When top of the element reaches the top of the viewport (`"start": "0"`), it will stick on the screen until you scroll up two viewport height (`"end": "200vh"`) from that moment.

- Animated element with one CSS property and two position keys.
``` html
<div data-animation='{"opacity": {"-100vh": "0", "-50vh": "1"}}'></div>
```
While top of the element traverse from bottom of the viewport `-100vh` to the middle of the viewport `-50vh`, its `opacity` changes from `0` to `1`. Same as `opacity: 0;` and `opacity: 1;` in the CSS. Visually, this is a fade-in effect.

- Animation with one CSS property and multiple position keys.
``` html
<div data-animation='{"opacity": {"-100vh": "0", "-75vh": "1", "-25vh": "1", "0vh": ".25"}}'></div>
```
In this example, the opacity of an element changes in two stages, from `0` to `1` (the top of the element moves along the lower quarter of the viewport: `-100vh`, `-75vh`) and then from `1` to `0.25` (the top of the element moves along the upper quarter of the viewport: `-25vh`, `0vh`).

- Animation with multiple CSS properties.
``` html
<div data-animation='{"opacity": {"-100vh": "0", "-75vh": "1"}, "transform": {"-100vh": "scale(.75)", "-50vh": "scale(1)"}}'></div>
```
Each CSS property has its own positioning keys and values.

- Sticky and animated element (two attributes at once).
``` html
<div data-sticky='{"start": "0", "end": "100vh"}' data-animation='{"opacity": {"0": "1", "100vh": "0"}}'></div>
```
In this case, you can manipulate an element while it is stuck on the screen.

## Browser compatibility

ECMAScript 6 required

- For `data-sticky`
    - Chrome: 56
    - Edge: 16
    - Firefox: 48
    - Internet Explorer: No
    - Opera: 43
    - Safari: 10
    - Chrome on Android: 56
    - Firefox on Android: 59
    - Safari on iOS: 10

- For `data-animation`
    - Chrome: 49
    - Edge: 16
    - Firefox: 44
    - Internet Explorer: 11
    - Opera: 17
    - Safari: 10
    - Chrome on Android: 49
    - Firefox on Android: 44
    - Safari on iOS: 10

## Known minor issues

- Sticky element and parents overflow property. Any parent of `data-sticky` element should not have an `overflow` property. Read more about the issue: [Support position:sticky inside an overflow:hidden|auto on general parents](https://github.com/w3c/csswg-drafts/issues/865). If your animation overflows an element (any transformation that enlarges an element and creates a horizontal scroll bar) and you need to use `overflow: hidden`, just follow this scheme:
    - Doesn't work: `element with overflow: hidden` \> `sticky & animated element`.
    - Work: `sticky element with overflow: hidden` \> `animated element`.
- Matrix and rotation. Don't try to rotate the element with the `transform: matrix()` because script doesn't calculate `sin` and `cos` for correct transformation. To rotate, use `transform: rotate()`.
- Animation and background fill in Safari macOS. If the sticky element doesn't have a `background` fill (`none` or `transparent`), the animation on the child element will not be smooth. **Under review**.
- Scrolling in Edge (EdgeHTML only). Periodic bugs in positioning animated elements inside parent with `overflow: hidden` when scrolling in the opposite direction. **Under review**.

## Author and license

**Michael Rafaylik** - [rafaylik](https://github.com/rafaylik) on GitHub.
Project is licensed under the MIT License - see the [LICENSE.md](./LICENSE) file for details.