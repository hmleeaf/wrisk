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

    const getSvgPathByXY = (x, y) => {
        // create points for different browser versions
        // https://developer.mozilla.org/en-US/docs/Web/API/SVGGeometryElement/isPointInFill
        const domPoint = new DOMPoint(x, y);
        const svgPoint = $('#play_area').get()[0].createSVGPoint();
        svgPoint.x = x;
        svgPoint.y = y;

        for (let i = 0; i < svgPaths.length; ++i) {
            const path = svgPaths[i];

            // check for whether clicked location is in path's fill
            const pathDom = path.get()[0];
            let pointInPath;
            try {
                pointInPath = pathDom.isPointInFill(domPoint);
            } catch (e) {
                pointInPath = pathDom.isPointInFill(svgPoint);
            }

            // do things with path
            if (pointInPath) {
                return path;
            }
        }
    };

    const parsePathToId = (path) => parseInt(path.attr('id').split('_')[1]);
    const parseEllipseToId = (ellipse) =>
        parseInt(ellipse.attr('id').split('_')[2]);
    const parseTextToId = (text) => parseInt(text.attr('id').split('_')[1]);

    const getPathsById = (ids) =>
        svgPaths.filter((path) => ids.includes(parsePathToId(path)));

    return {
        initSvgPaths,
        getSvgPathByXY,
        parsePathToId,
        getPathsById,
        parseEllipseToId,
        parseTextToId,
    };
})();
