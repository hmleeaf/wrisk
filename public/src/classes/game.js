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
            const id = SVG.parseSvgToId(ellipse);
            const owner = board.getZoneOwner(id);
            ellipse.css({
                fill:
                    owner === 0
                        ? colors.player1.background
                        : colors.player2.background,
                stroke:
                    owner === 0
                        ? colors.player1.outline
                        : colors.player2.outline,
            });
        });

        $('text').each((_, value) => {
            const text = $(value);
            if (!text.attr('id').includes('zone')) return;
            const id = SVG.parseSvgToId(text);
            const troop = board.getZoneTroop(id);
            text.text(troop);
        });

        $('path').each((_, value) => {
            const path = $(value);
            if (!path.attr('id').includes('zone')) return;
            const id = SVG.parseSvgToId(path);
            const owner = board.getZoneOwner(id);
            path.css({
                fill: owner === 0 ? colors.player1.zone : colors.player2.zone,
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
            board.getAdjacentZones(SVG.parseSvgToId(path))
        );

        console.log(path, adjacentPaths);
    };

    return { draftZone };
})();
