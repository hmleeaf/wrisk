const SignInForm = (function () {
    // This function initializes the UI
    const initialize = function () {
        // Populate the avatar selection
        Avatar.populate($('#register-avatar'));

        // Hide it
        // $('#signin-overlay').hide();

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
                    Authentication.getUser();
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
        $('#signin-overlay').show();
    };

    // This function hides the form
    const hide = function () {
        $('#signin-form').get(0).reset();
        $('#signin-message').text('');
        $('#register-message').text('');
        $('#signin-overlay').hide();
    };

    return { initialize, show, hide };
})();

const WaitingOverlay = (() => {
    const initialize = () => {};

    const show = () => {
        $('#waiting-overlay').show();
    };

    const hide = () => {
        $('#waiting-overlay').hide();
    };

    return { initialize, show, hide };
})();

const TitleOverlay = (() => {
    const initialize = () => {
        $('#title-instructions-button').on('click', () => {
            hide();
            InstructionsOverlay.show();
        });

        $('#title-play-button').on('click', () => {
            hide();
            SignInForm.show();
        });
    };

    const show = () => {
        $('#title-overlay').show();
    };

    const hide = () => {
        $('#title-overlay').hide();
    };

    return { initialize, show, hide };
})();

const InstructionsOverlay = (() => {
    const initialize = () => {
        $('#instructions-back-button').on('click', () => {
            hide();
            TitleOverlay.show();
        });

        hide();
    };

    const show = () => {
        $('#instructions-overlay').show();
    };

    const hide = () => {
        $('#instructions-overlay').hide();
    };

    return { initialize, show, hide };
})();

const EndOverlay = (() => {
    const initialize = () => {
        $('#end-exit-button').on('click', () => {
            Authentication.signout(() => {
                TitleOverlay.show();
                hide();
                Socket.disconnect();
            });
        });

        $('#end-rematch-button').on('click', () => {
            Socket.requestReplay();
        });

        $('#end-overlay').hide();
    };

    const updateRankingContainer = (players, rankName, containerId) => {
        $('#' + containerId).empty();
        players.sort((a, b) => a[rankName] - b[rankName]).reverse();
        players.forEach((player) => {
            const name =
                Authentication.getUser().username === player.user.username
                    ? 'You'
                    : player.user.name;
            $('#' + containerId).append(
                $(`<div>${name}: ${player[rankName]}</div>`)
            );
        });
    };

    const show = (data) => {
        $('#end-title-text').text(
            data.winner === UI.getPlayerIdx() ? 'You won!' : 'You lost...'
        );

        $('#stat-rounds').text(data.round);

        const seconds = data.duration / 1000;
        const minutes = Math.floor(seconds / 60);
        $('#stat-time').text(
            `${minutes} minute${minutes === 1 ? '' : 's'} ${
                Math.floor(seconds) - minutes * 60
            } second${Math.floor(seconds) - minutes * 60 === 1 ? '' : 's'}`
        );

        updateRankingContainer(
            data.players,
            'troopsReceived',
            'ranking-troops-received-container'
        );
        updateRankingContainer(
            data.players,
            'troopsKill',
            'ranking-troops-killed-container'
        );
        updateRankingContainer(
            data.players,
            'troopsLost',
            'ranking-troops-lost-container'
        );

        $('#end-overlay').fadeIn();
    };

    const hide = () => {
        $('#end-overlay').hide();
    };

    return { initialize, show, hide };
})();

const ErrorOverlay = (() => {
    const initialize = () => {
        $('#error-overlay-button').on('click', () => {
            hide();
        });

        $('#error-overlay').hide();
    };

    const show = (message) => {
        $('#error-overlay-text').text(message);
        $('#error-overlay').show();
    };

    const hide = () => {
        $('#error-overlay').hide();
    };

    return { initialize, show, hide };
})();

const UI = (() => {
    // set up default behaviors for HTML elements
    $('#popup-troops-selector').hide();
    $('#hint').hide();
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

    // set up events
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
        if (GameStateMachine.state === 'SelfDraftSelected') Game.commitDraft();
        else if (GameStateMachine.state === 'SelfAttackDeploy')
            Game.requestAttackDeploy();
        else if (GameStateMachine.state === 'SelfFortifyDeploy')
            Game.requestFortifyDeploy();
    });
    $('#next-phase-button').on('click', () => {
        if (GameStateMachine.state === 'SelfDraft') {
            Socket.requestFinishDraft();
        } else if (
            GameStateMachine.state === 'SelfAttack' ||
            GameStateMachine.state === 'SelfAttackSelected'
        ) {
            Socket.requestFinishAttack();
        } else if (
            GameStateMachine.state === 'SelfFortify' ||
            GameStateMachine.state === 'SelfFortifySelected'
        ) {
            Socket.requestFinishFortify();
        }
    });
    $('#close-battle-button').on('click', () => {
        Game.cancelAttackBattle();
    });
    $('#battle-button').on('click', () => {
        Game.requestBattle();
    });

    // $(() => {
    //     updateBoardText();
    //     updateBoardTextBackground();
    //     updateBoardZones();
    // });

    const updateBoardTextBackground = () => {
        $('g#text-backgrounds ellipse').each((_, value) => {
            const ellipse = $(value);
            const id = SVG.parseSvgToId(ellipse);
            const owner = Board.getZoneOwner(id);
            ellipse.css({
                fill:
                    owner === 0
                        ? COLORS.player1.background
                        : COLORS.player2.background,
                stroke:
                    owner === 0
                        ? COLORS.player1.outline
                        : COLORS.player2.outline,
            });
        });
    };

    const updateBoardText = () => {
        $('g#texts text').each((_, value) => {
            const text = $(value);
            const id = SVG.parseSvgToId(text);
            const troop = Board.getZoneTroop(id);
            text.text(troop);
        });
    };

    const updateBoardZones = () => {
        $('g#areas path').each((_, value) => {
            const path = $(value);
            const id = SVG.parseSvgToId(path);
            const owner = Board.getZoneOwner(id);
            path.css({
                fill: owner === 0 ? COLORS.player1.zone : COLORS.player2.zone,
            });
        });
    };

    const updateInfoPanel = (isSelfTurn, phase, troops) => {
        if (
            (phase !== undefined || null) &&
            (isSelfTurn !== undefined || null)
        ) {
            $('.phase-square').removeClass('player-0');
            $('.phase-square').removeClass('player-1');
            $('#' + PHASE_MAP_SQUARE_ID.get(phase)).addClass(
                isSelfTurn
                    ? 'player-' + playerIdx
                    : 'player-' + ((playerIdx + 1) % 2)
            );
            $('#phase-text').text(
                (isSelfTurn ? 'Your ' : "Enemy's ") + PHASE_MAP_NAME.get(phase)
            );
            if (isSelfTurn)
                $('#next-phase-button').css({ visibility: 'visible' });
            else $('#next-phase-button').css({ visibility: 'hidden' });

            if (phase === PHASES.ATTACK && isSelfTurn)
                $('#dice-spinner-wrapper').show();
            else $('#dice-spinner-wrapper').hide();

            if (phase !== PHASES.DRAFT) $('#deployable-troops-text').text('');

            // if (!isSelfTurn) $('#info-panel-display').hide();
            // else $('#info-panel-display').show();

            $('#deployable-troops').removeClass('player-0');
            $('#deployable-troops').removeClass('player-1');
            $('#deployable-troops').addClass(
                'player-' + (isSelfTurn ? playerIdx : (playerIdx + 1) % 2)
            );
        }

        if (troops !== undefined || null) {
            $('#deployable-troops-text').text(troops);

            if (troops > 0) {
                $('#next-phase-button').prop('disabled', true);
            } else {
                $('#next-phase-button').prop('disabled', false);
            }
        }
    };

    const updateTroopSelectorText = () => {
        $('#troops-text').text(Game.getDeployedTroops);
    };

    const highlightBoardZones = (zones) => {
        if (Array.isArray(zones)) {
            zones.forEach((zone) => {
                zone.css({
                    fill:
                        Board.getZoneOwner(SVG.parseSvgToId(zone)) === 0
                            ? COLORS.player1.highlight
                            : COLORS.player2.highlight,
                    transition: '500ms',
                });
            });
        } else {
            zones.css({
                fill:
                    Board.getZoneOwner(SVG.parseSvgToId(zones)) === 0
                        ? COLORS.player1.highlight
                        : COLORS.player2.highlight,
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
                            ? COLORS.player1.zone
                            : COLORS.player2.zone,
                    transition: '500ms',
                });
            });
        } else if (zones) {
            zones.css({
                fill:
                    Board.getZoneOwner(SVG.parseSvgToId(zones)) === 0
                        ? COLORS.player1.zone
                        : COLORS.player2.zone,
                transition: '500ms',
            });
        } else {
            SVG.getPaths().forEach((path) => {
                path.css({
                    fill:
                        Board.getZoneOwner(SVG.parseSvgToId(path)) === 0
                            ? COLORS.player1.zone
                            : COLORS.player2.zone,
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

    const showHint = (text) => {
        $('#hint').show();
        $('#hint').text(text);
    };

    const hideHint = () => {
        $('#hint').hide();
        $('#hint').text('');
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
            Sound.play('dice-roll');
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
        Sound.play('battle');
    };

    // The components of the UI are put here
    const components = [
        SignInForm,
        Notification,
        WaitingOverlay,
        TitleOverlay,
        InstructionsOverlay,
        EndOverlay,
        ErrorOverlay,
    ];

    // This function initializes the UI
    const initialize = function () {
        // Initialize the components
        for (const component of components) {
            component.initialize();
        }

        setInterval(() => {
            $('#dice-spinner-wrapper').empty();
            $('#dice-spinner-wrapper').append(
                DICE_SVG_STRING[Math.floor(Math.random() * 6 + 1)]
            );
        }, 5000);
    };

    let currentPlayerIdx;
    let playerIdx;
    let players;

    const getCurrentPlayerIdx = () => currentPlayerIdx;
    const updateCurrentPlayerIdx = (i) => (currentPlayerIdx = i);
    const getPlayerIdx = () => playerIdx;

    const initializeGame = (data) => {
        playerIdx = data.players.findIndex(
            (player) =>
                player.user.username === Authentication.getUser().username
        );
        players = data.players;
        currentPlayerIdx = data.currentPlayerIndex;

        $('#deployable-troops').removeClass('player-0');
        $('#deployable-troops').removeClass('player-1');
        $('#self-troops-text-wrapper').removeClass('player-0');
        $('#self-troops-text-wrapper').removeClass('player-1');
        $('#enemy-troops-text-wrapper').removeClass('player-0');
        $('#enemy-troops-text-wrapper').removeClass('player-1');
        $('#next-phase-button').removeClass('player-0');
        $('#next-phase-button').removeClass('player-1');

        $('#deployable-troops').addClass('player-' + data.currentPlayerIndex);
        $('#self-troops-text-wrapper').addClass('player-' + playerIdx);
        $('#enemy-troops-text-wrapper').addClass(
            'player-' + ((playerIdx + 1) % 2)
        );
        $('#next-phase-button').addClass('player-' + playerIdx);

        updateInfoPanel(
            playerIdx === data.currentPlayerIndex,
            data.state === 'draft'
                ? PHASES.DRAFT
                : res.state === 'attack' || res.state === 'post-attack-fortify'
                ? PHASES.ATTACK
                : res.state === 'fortify'
                ? PHASES.FORTIFY
                : undefined,
            undefined
        );

        Notification.queueNotification('introduction', {
            playerIdx,
            user: data.players[playerIdx].user,
        });

        // if (playerIdx !== currentPlayerIdx)
        //     Notification.queueNotification('phase', {
        //         phase: 'draft',
        //         currentPlayerIdx,
        //     });
    };

    const reset = () => {
        currentPlayerIdx = undefined;
        playerIdx = undefined;
        players = undefined;
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
        showHint,
        hideHint,
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
        initializeGame,
        getCurrentPlayerIdx,
        updateCurrentPlayerIdx,
        getPlayerIdx,
        reset,
    };
})();

$(() => {
    $('#quit-button').on('click', () => {
        Authentication.signout(() => {
            SignInForm.show();
            Socket.disconnect();
        });
    });
    $('#cheat-button').on('click', () => {
        Socket.requestCheat();
    });

    // Initialize the UI
    UI.initialize();

    // Validate the signin
    Authentication.validate(
        () => {
            Socket.connect();
            TitleOverlay.hide();
            InstructionsOverlay.hide();
        },
        () => {
            // SignInForm.show();
            WaitingOverlay.hide();
        }
    );

    Cards.initialize();
    Sound.initialize();
});
