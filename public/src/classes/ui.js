import colors from '../constants/colors.js';
import { DICE_SVG_STRING } from '../constants/dice.js';
import {
    PHASES,
    PHASE_MAP_NAME,
    PHASE_MAP_SQUARE_ID,
} from '../constants/phases.js';
import { GameStateMachine } from '../utils/stateMachine.js';
import { SVG } from '../utils/svg.js';
import { Authentication } from './authentication.js';
import { Avatar } from './avatar.js';
import { Board } from './board.js';
import { Game } from './game.js';
import { Registration } from './registration.js';
import { Socket } from './socket.js';

const SignInForm = (function () {
    // This function initializes the UI
    const initialize = function () {
        // Populate the avatar selection
        Avatar.populate($('#register-avatar'));

        // Hide it
        $('#signin-overlay').hide();

        // Submit event for the signin form
        $('#signin-form').on('submit', (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $('#signin-username').val().trim();
            const password = $('#signin-password').val().trim();

            // Send a signin request
            Authentication.signin(
                username,
                password,
                () => {
                    hide();
                    // Authentication.getUser()

                    Socket.connect();
                },
                (error) => {
                    $('#signin-message').text(error);
                }
            );
        });

        // Submit event for the register form
        $('#register-form').on('submit', (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $('#register-username').val().trim();
            const avatar = $('#register-avatar').val();
            const name = $('#register-name').val().trim();
            const password = $('#register-password').val().trim();
            const confirmPassword = $('#register-confirm').val().trim();

            // Password and confirmation does not match
            if (password != confirmPassword) {
                $('#register-message').text('Passwords do not match.');
                return;
            }

            // Send a register request
            Registration.register(
                username,
                avatar,
                name,
                password,
                () => {
                    $('#register-form').get(0).reset();
                    $('#register-message').text('You can sign in now.');
                },
                (error) => {
                    $('#register-message').text(error);
                }
            );
        });
    };

    // This function shows the form
    const show = function () {
        $('#signin-overlay').fadeIn(500);
    };

    // This function hides the form
    const hide = function () {
        $('#signin-form').get(0).reset();
        $('#signin-message').text('');
        $('#register-message').text('');
        $('#signin-overlay').fadeOut(500);
    };

    return { initialize, show, hide };
})();

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
    $('#next-phase-button').on('click', () => {
        GameStateMachine.transition('next');
    });
    $('#close-battle-button').on('click', () => {
        Game.cancelAttackBattle();
    });
    $('#battle-button').on('click', () => {
        Game.battle();
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

    const outlineBoardZone = (zone) => {
        zone.css({
            stroke: '#fff',
            transition: '500ms',
        });
    };

    const unoutlineBoardZone = () => {
        SVG.getPaths().forEach((path) => {
            path.css({
                stroke: '#000',
                transition: '500ms',
            });
        });
    };

    const getTroopByZone = (zone) =>
        parseInt($('#zone_text_' + SVG.parseSvgToId(zone)).text());

    const showTroopSelector = (maxTrps) => {
        $('#popup-troops-selector').show();
        $('#troops-text').text(maxTrps);
    };

    const hideTroopSelector = () => {
        $('#popup-troops-selector').hide();
        $('#troops-cancel-button').css({ visibility: 'visible' });
    };

    const hideTroopSelectorCancelButton = () => {
        $('#troops-cancel-button').css({ visibility: 'hidden' });
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

    const updateBattleScreenTroops = (attackerZoneId, defenderZoneId) => {
        const attackerTroops = Board.getZoneTroop(attackerZoneId);
        const defenderTroops = Board.getZoneTroop(defenderZoneId);
        $('#self-troops-text').text(attackerTroops);
        $('#enemy-troops-text').text(defenderTroops);
    };

    const showBattleScreen = (attackerZoneId, defenderZoneId) => {
        $('#battle-screen').fadeIn();
        updateBattleScreenTroops(attackerZoneId, defenderZoneId);
        resetRolls(attackerZoneId, defenderZoneId);
    };

    const hideBattleScreen = () => {
        $('#battle-screen').fadeOut();
    };

    const battleScreenDisableInteraction = () => {
        $('#battle-buttons-wrapper').children().css({ visibility: 'hidden' });
        $('#close-battle-button').hide();
    };

    const battleScreenEnableInteraction = () => {
        $('#battle-buttons-wrapper').children().css({ visibility: 'visible' });
        $('#close-battle-button').show();
    };

    const createDice = (faceValue) => $(DICE_SVG_STRING[faceValue]);

    const animateRolls = (attackDice, defendDice) => {
        for (let i = 0; i < 3; ++i) {
            const diceDiv = $('#self-dice-' + (i + 1));
            if (i < attackDice) diceDiv.show();
            else diceDiv.hide();
        }
        for (let i = 0; i < 2; ++i) {
            const diceDiv = $('#enemy-dice-' + (i + 1));
            if (i < defendDice) diceDiv.show();
            else diceDiv.hide();
        }
        return setInterval(() => {
            for (let i = 0; i < attackDice; ++i) {
                const diceDiv = $('#self-dice-' + (i + 1));
                diceDiv.empty();
                diceDiv.append(createDice(Game.randomRollValue()));
            }
            for (let i = 0; i < defendDice; ++i) {
                const diceDiv = $('#enemy-dice-' + (i + 1));
                diceDiv.empty();
                diceDiv.append(createDice(Game.randomRollValue()));
            }
        }, 50);
    };

    const updateRolls = (attackRolls, defendRolls) => {
        for (let i = 0; i < 3; ++i) {
            const diceDiv = $('#self-dice-' + (i + 1));
            if (attackRolls[i]) {
                diceDiv.show();
                diceDiv.empty();
                diceDiv.append(createDice(attackRolls[i]));
            } else diceDiv.hide();
        }
        for (let i = 0; i < 2; ++i) {
            const diceDiv = $('#enemy-dice-' + (i + 1));
            if (defendRolls[i]) {
                diceDiv.show();
                diceDiv.empty();
                diceDiv.append(createDice(defendRolls[i]));
            } else diceDiv.hide();
        }
    };

    const resetRolls = (attackerZoneId, defenderZoneId) => {
        const attackerTroops = Board.getZoneTroop(attackerZoneId) - 1;
        const defenderTroops = Board.getZoneTroop(defenderZoneId);
        for (let i = 0; i < 3; ++i) {
            const diceDiv = $('#self-dice-' + (i + 1));
            if (i < attackerTroops) {
                diceDiv.show();
                diceDiv.empty();
                diceDiv.append(createDice(0));
            } else diceDiv.hide();
        }
        for (let i = 0; i < 2; ++i) {
            const diceDiv = $('#enemy-dice-' + (i + 1));
            if (i < defenderTroops) {
                diceDiv.show();
                diceDiv.empty();
                diceDiv.append(createDice(0));
            } else diceDiv.hide();
        }
    };

    const updateRollResults = (rollResults) => {
        $('#self-dice-1').css({ color: 'white' });
        $('#self-dice-2').css({ color: 'white' });
        $('#self-dice-3').css({ color: 'white' });
        $('#enemy-dice-1').css({ color: 'white' });
        $('#enemy-dice-2').css({ color: 'white' });
        rollResults.forEach((result, idx) => {
            if (result) {
                $('#enemy-dice-' + (idx + 1)).fadeOut();
            } else {
                $('#self-dice-' + (idx + 1)).fadeOut();
            }
        });
    };

    // The components of the UI are put here
    const components = [SignInForm];

    // This function initializes the UI
    const initialize = function () {
        // Initialize the components
        for (const component of components) {
            component.initialize();
        }
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
        showBattleScreen,
        hideBattleScreen,
        updateRolls,
        updateRollResults,
        updateBattleScreenTroops,
        resetRolls,
        outlineBoardZone,
        unoutlineBoardZone,
        hideTroopSelectorCancelButton,
        animateRolls,
        battleScreenDisableInteraction,
        battleScreenEnableInteraction,
        initialize,
    };
})();

$(() => {
    $('#quit-button').on('click', () => {
        Authentication.signout(() => {
            SignInForm.show();
            Socket.disconnect();
        });
    });

    // Initialize the UI
    UI.initialize();

    // Validate the signin
    Authentication.validate(
        () => {
            SignInForm.hide();

            Socket.connect();
        },
        () => {
            SignInForm.show();
        }
    );
});
