import colors from '../constants/colors.js';
import {
    PHASES,
    PHASE_MAP_NAME,
    PHASE_MAP_SQUARE_ID,
} from '../constants/phases.js';
import { GameStateMachine } from '../utils/stateMachine.js';
import { SVG } from '../utils/svg.js';
import { Board } from './board.js';
import { Game } from './game.js';

export const UI = (() => {
    // set up default behaviors for HTML elements
    $('#popup-troops-selector').hide();
    $('#notification').hide();
    $('#battle-screen').hide();
    $('#close-battle-button').on('click', () => {
        $('#battle-screen').hide();
    });
    $('ellipse').each((_, value) => {
        $(value).css({
            // translate each text background up to center them
            cy: $(value).attr('cy') - 7,
        });
    });
    $('#troops-increase-button').on('click', () => {
        if (Game.tryIncreaseDraft() === false) return;

        updateTroopSelectorText();
        updateBoardText();
    });
    $('#troops-decrease-button').on('click', () => {
        if (Game.tryDecreaseDraft() === false) return;

        updateTroopSelectorText();
        updateBoardText();
    });
    $('#troops-cancel-button').on('click', () => {
        GameStateMachine.transition('back');
    });
    $('#troops-confirm-button').on('click', () => {
        Game.commitDraft();
    });

    $(() => {
        updateBoardText();
        updateBoardTextBackground();
        updateBoardZones();
    });

    const updateBoardTextBackground = () => {
        $('ellipse').each((_, value) => {
            const ellipse = $(value);
            const id = SVG.parseSvgToId(ellipse);
            const owner = Board.getZoneOwner(id);
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
    };

    const updateBoardText = () => {
        $('text').each((_, value) => {
            const text = $(value);
            if (!text.attr('id').includes('zone')) return;
            const id = SVG.parseSvgToId(text);
            const troop = Board.getZoneTroop(id);
            text.text(troop);
        });
    };

    const updateBoardZones = () => {
        $('path').each((_, value) => {
            const path = $(value);
            if (!path.attr('id').includes('zone')) return;
            const id = SVG.parseSvgToId(path);
            const owner = Board.getZoneOwner(id);
            path.css({
                fill: owner === 0 ? colors.player1.zone : colors.player2.zone,
            });
        });
    };

    const updateInfoPanel = (isSelfTurn, phase, troops) => {
        if (
            (phase !== undefined || null) &&
            (isSelfTurn !== undefined || null)
        ) {
            $('.phase-square').removeClass('activeSelf');
            $('.phase-square').removeClass('activeEnemy');
            $('#' + PHASE_MAP_SQUARE_ID.get(phase)).addClass(
                isSelfTurn ? 'activeSelf' : 'activeEnemy'
            );
            $('#phase-text').text(
                (isSelfTurn ? 'Your ' : "Enemy's ") + PHASE_MAP_NAME.get(phase)
            );
            $('#next-phase-button').removeClass('self');
            $('#next-phase-button').removeClass('enemy');
            $('#next-phase-button').addClass(isSelfTurn ? 'self' : 'enemy');
        }

        if (troops !== undefined || null) {
            $('#info-text').text(troops);
        }
    };

    const updateTroopSelectorText = () => {
        $('#troops-text').text(Game.getDeployableTroops);
    };

    const highlightBoardZones = (zones) => {
        if (Array.isArray(zones)) {
            zones.forEach((zone) => {
                zone.css({
                    fill:
                        Board.getZoneOwner(SVG.parseSvgToId(zone)) === 0
                            ? colors.player1.highlight
                            : colors.player2.highlight,
                    transition: '500ms',
                });
            });
        } else {
            zones.css({
                fill:
                    Board.getZoneOwner(SVG.parseSvgToId(zones)) === 0
                        ? colors.player1.highlight
                        : colors.player2.highlight,
                transition: '500ms',
            });
        }
    };

    const unhighlightBoardZones = (zones) => {
        if (Array.isArray(zones)) {
            zones.forEach((zone) => {
                zone.css({
                    fill:
                        Board.getZoneOwner(SVG.parseSvgToId(zone)) === 0
                            ? colors.player1.zone
                            : colors.player2.zone,
                    transition: '500ms',
                });
            });
        } else if (zones) {
            zones.css({
                fill:
                    Board.getZoneOwner(SVG.parseSvgToId(zones)) === 0
                        ? colors.player1.zone
                        : colors.player2.zone,
                transition: '500ms',
            });
        } else {
            SVG.getPaths().forEach((path) => {
                path.css({
                    fill:
                        Board.getZoneOwner(SVG.parseSvgToId(path)) === 0
                            ? colors.player1.zone
                            : colors.player2.zone,
                    transition: '500ms',
                });
            });
        }
    };

    const getTroopByZoneId = (id) => parseInt($('#zone_text_' + id).text());
    const getTroopByZone = (zone) =>
        parseInt($('#zone_text_' + SVG.parseSvgToId(zone)).text());

    const showTroopSelector = (maxTrps) => {
        $('#popup-troops-selector').show();
        $('#troops-text').text(maxTrps);
    };

    const hideTroopSelector = () => {
        $('#popup-troops-selector').hide();
    };

    const showInfoPanel = () => {
        $('#info-panel').show();
    };

    const hideInfoPanel = () => {
        $('#info-panel').hide();
    };

    const showNotification = (text) => {
        $('#notification').show();
        $('#notification').text(text);
    };

    const hideNotification = () => {
        $('#notification').hide();
        $('#notification').text('');
    };

    return {
        updateInfoPanel,
        highlightBoardZones,
        unhighlightBoardZones,
        showTroopSelector,
        hideTroopSelector,
        showInfoPanel,
        hideInfoPanel,
        getTroopByZone,
        updateTroopSelectorText,
        updateBoardTextBackground,
        updateBoardText,
        updateBoardZones,
        showNotification,
        hideNotification,
    };
})();
