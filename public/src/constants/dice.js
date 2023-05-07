const DICE_SVG_STRING = Object.freeze({
    1: `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
            <rect stroke-width="0" rx="32" id="svg_1" height="128.125" width="127.8125" y="-0.0625" x="0.09375" stroke="#000" fill="#bf0000"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_8" cy="64" cx="64" stroke="#000" fill="#ffffff"/>
        </svg>`,
    2: `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
            <rect stroke-width="0" rx="32" id="svg_1" height="128.125" width="127.8125" y="-0.0625" x="0.09375" stroke="#000" fill="#bf0000"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_3" cy="32" cx="96" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_8" cy="96" cx="32" stroke="#000" fill="#ffffff"/>
        </svg>`,
    3: `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
            <rect stroke-width="0" rx="32" id="svg_1" height="128.125" width="127.8125" y="-0.0625" x="0.09375" stroke="#000" fill="#bf0000"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_3" cy="32" cx="96" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_6" cy="64" cx="64" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_8" cy="96" cx="32" stroke="#000" fill="#ffffff"/>
        </svg>`,
    4: `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
            <rect stroke-width="0" rx="32" id="svg_1" height="128.125" width="127.8125" y="-0.0625" x="0.09375" stroke="#000" fill="#bf0000"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_3" cy="32" cx="96" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_6" cy="32" cx="32" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_7" cy="96" cx="96" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_8" cy="96" cx="32" stroke="#000" fill="#ffffff"/>
        </svg>`,
    5: `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
            <rect stroke-width="0" rx="32" id="svg_1" height="128.125" width="127.8125" y="-0.0625" x="0.09375" stroke="#000" fill="#bf0000"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_3" cy="32" cx="96" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_6" cy="32" cx="32" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_7" cy="96" cx="96" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_8" cy="96" cx="32" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_11" cy="64" cx="64" stroke="#000" fill="#ffffff"/>
        </svg>`,
    6: `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
            <rect stroke-width="0" rx="32" id="svg_1" height="128.125" width="127.8125" y="-0.0625" x="0.09375" stroke="#000" fill="#bf0000"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_3" cy="32" cx="96" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_6" cy="32" cx="32" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_7" cy="96" cx="96" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_8" cy="96" cx="32" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_10" cy="64" cx="32" stroke="#000" fill="#ffffff"/>
            <ellipse stroke-width="0" ry="12" rx="12" id="svg_11" cy="64" cx="96" stroke="#000" fill="#ffffff"/>
        </svg>`,

    // 0 is ?
    0: `<svg viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
            <rect stroke-width="0" rx="300" id="svg_1" height="1200" width="1200" y="0" x="0" stroke="#000" fill="#bf0000"/>
            <path fill="#fff" transform="translate(104, -40)" d="M419 724q1-88 20.5-128.5T505 519q38-30 57-61.109T581 393q0-40-25.5-65.5T485 302q-47 0-75 27t-42 66l-118-51q26-72 84.5-118.5T484.756 179q108.228 0 167.736 61.148Q712 301.297 712 390q0 59-22 103.5T624 578q-47 42-58 67t-10 79H419Zm65.788 277Q448 1001 421.5 974.5T395 911.504q0-37.495 26.42-63.5Q447.841 822 484.92 822 523 822 549 848.004q26 26.005 26 63.5Q575 948 548.788 974.5q-26.213 26.5-64 26.5Z"/>
        </svg>`,
});
