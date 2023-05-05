export const SVG = (() => {
    let svgPaths = [];

    $(() => {
        initSvgPaths('zone_', 19);
    });

    const initSvgPaths = (prefix, maxCount) => {
        svgPaths = [];
        for (let i = 0; i < maxCount; ++i) {
            svgPaths[i] = $('#' + prefix + i);
        }
    };

    const getSvgPathByEvent = (e) => {
        const { clientX: x, clientY: y } = e;
        const svg = $('#play_area').get()[0];
        // create points for different browser versions
        // https://developer.mozilla.org/en-US/docs/Web/API/SVGGeometryElement/isPointInFill
        const domPoint = new DOMPoint(x, y);
        const domPointLocal = domPoint.matrixTransform(
            svg.getScreenCTM().inverse()
        );
        const svgPoint = svg.createSVGPoint();
        svgPoint.x = x;
        svgPoint.y = y;
        const svgPointLocal = svgPoint.matrixTransform(
            svg.getScreenCTM().inverse()
        );

        for (let i = 0; i < svgPaths.length; ++i) {
            const path = svgPaths[i];

            // check for whether clicked location is in path's fill
            const pathDom = path.get()[0];
            let pointInPath;
            try {
                pointInPath = pathDom.isPointInFill(domPointLocal);
            } catch (e) {
                pointInPath = pathDom.isPointInFill(svgPointLocal);
            }

            // do things with path
            if (pointInPath) {
                return path;
            }
        }
    };

    const parseSvgToId = (svg) => {
        const arr = svg.attr('id').split('_');
        return parseInt(arr[arr.length - 1]);
    };

    const getPathsByIds = (ids) =>
        svgPaths.filter((path) => ids.includes(parseSvgToId(path)));
    const getPathById = (id) =>
        svgPaths.find((path) => parseSvgToId(path) === id);

    const setDebugPointTo = (x, y) => $('#debug-point').css({ cx: x, cy: y });

    const getPaths = () => svgPaths;

    return {
        initSvgPaths,
        getSvgPathByEvent,
        getPathsByIds,
        getPathById,
        parseSvgToId,
        setDebugPointTo,
        getPaths,
    };
})();
