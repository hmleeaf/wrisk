import colors from '../constants/colors.js';
import { STATES } from '../constants/states.js';
import { createStateMachine } from '../utils/stateMachine.js';
import { SVG } from '../utils/svg.js';
import { Board } from './board.js';

// set up default styles for svg components
$(() => {
    // text background
    $('ellipse').each((_, value) => {
        $(value).css({
            // translate each text background up to center them
            cy: $(value).attr('cy') - 7,
            // add outline
            'stroke-width': 3,
        });
    });

    // zone svg
    $('path').each((_, value) => {
        if ($(value).attr('id').includes('zone'))
            $(value).css({
                // add outline
                'stroke-width': 5,
            });
        if ($(value).attr('id').includes('sea_route'))
            $(value).css({
                // add outline
                'stroke-width': 3,
            });
    });
});

export const Game = (() => {
    const gameStateMachine = createStateMachine(STATES);
    const board = Board();

    $(document).ready(() => {
        $('#play_area').on('click', (e) => {
            gameStateMachine.data.zoneOnClick(e);
        });

        $('ellipse').each((_, value) => {
            const ellipse = $(value);
            const id = SVG.parseEllipseToId(ellipse);
            const owner = board.getZoneOwner(id);
            ellipse.css({
                fill:
                    owner === 0
                        ? colors.player1.secondary
                        : colors.player2.secondary,
            });
        });

        $('text').each((_, value) => {
            const text = $(value);
            const id = SVG.parseTextToId(text);
            const troop = board.getZoneTroop(id);
            text.text(troop);
        });

        $('path').each((_, value) => {
            const path = $(value);
            if (!path.attr('id').includes('zone')) return;
            const id = SVG.parsePathToId(path);
            const owner = board.getZoneOwner(id);
            path.css({
                fill:
                    owner === 0
                        ? colors.player1.primary
                        : colors.player2.primary,
            });
        });

        $(document).on('keydown', (e) => {
            if (e.key === 'Enter') {
                console.log('test');
                gameStateMachine.transition('next');
            }
        });
    });

    const draftZone = (path) => {
        const adjacentPaths = SVG.getPathsById(
            board.getAdjacentZones(SVG.parsePathToId(path))
        );

        console.log(path, adjacentPaths);
    };

    return { draftZone };
})();
