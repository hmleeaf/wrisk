const Socket = (function () {
    // This stores the current Socket.IO socket
    let socket = null;

    let roomCode;

    // This function gets the socket from the module
    const getSocket = function () {
        return socket;
    };

    // This function connects the server and initializes the socket
    const connect = function () {
        socket = io();

        // Wait for the socket to connect successfully
        socket.on('connect', () => {
            socket.emit('join-waiting-area-request');
        });

        socket.on('join-waiting-area-response', (res) => {
            console.log('join-waiting-area-response', res);
            if (!res.success) handleError(res.reason);
            SignInForm.hide();
            WaitingOverlay.show();
        });

        socket.on('game-start-notification', (res) => {
            WaitingOverlay.hide();
            SignInForm.hide();
            console.log('game-start-notification', res);
            roomCode = res.roomCode;
            Board.initialize(res.board);
            Game.initialize(res);
            UI.initializeGame(res);
            if (
                Authentication.getUser().username !==
                res.players[res.currentPlayerIndex].user.username
            ) {
                Game.setEnemyPhase(res.state);
                Notification.queueNotification('phase', {
                    phase: 'draft',
                    currentPlayerIdx: UI.getCurrentPlayerIdx(),
                });
            }
        });

        socket.on('draft-notification', (res) => {
            console.log('draft-notification', res);
            if (
                // enters SelfDraft from Enemy via enemy ends turn
                GameStateMachine.state === 'Enemy'
            ) {
                UI.updateCurrentPlayerIdx(res.currentPlayerIndex);
                GameStateMachine.transition('next', res.draftTroops);
                Notification.queueNotification('phase', {
                    phase: 'draft',
                    currentPlayerIdx: UI.getCurrentPlayerIdx(),
                });
                Notification.queueNotification('troops', {
                    currentPlayerIdx: UI.getCurrentPlayerIdx(),
                    troops: res.draftTroops,
                    occupied: Board.getOccupied(UI.getCurrentPlayerIdx()),
                    user: res.players[UI.getCurrentPlayerIdx()].user,
                });
            }
            // enters SelfDraft from SelfDraftSelected via draft success
            else if (GameStateMachine.state === 'SelfDraftSelected') {
                GameStateMachine.transition('next', res.draftTroops);
            } else if (
                // enters SelfDraft from SelfDraft via redeem card success
                GameStateMachine.state === 'SelfDraft'
            ) {
                GameStateMachine.transition('card', res.draftTroops);
            }
        });

        socket.on('draft-response', (res) => {
            console.log('draft-response', res);
            if (!res.success) handleError(res.reason);
        });

        socket.on('finish-draft-response', (res) => {
            console.log('finish-draft-response', res);
            if (!res.success) handleError(res.reason);
            GameStateMachine.transition('next');
            Notification.queueNotification('phase', {
                phase: 'attack',
                currentPlayerIdx: UI.getCurrentPlayerIdx(),
            });
        });

        socket.on('map-update-notification', (res) => {
            console.log('map-update-notification', res, GameStateMachine.state);
            Board.updateBoard(res.board);
            UI.updateBoardText();
            UI.updateBoardTextBackground();
            UI.updateBoardZones();
            UI.updateCurrentPlayerIdx(res.currentPlayerIndex);

            if (GameStateMachine.state === 'Enemy') {
                UI.updateInfoPanel(
                    false,
                    res.state === 'draft'
                        ? PHASES.DRAFT
                        : res.state === 'attack' ||
                          res.state === 'post-attack-fortify'
                        ? PHASES.ATTACK
                        : res.state === 'fortify'
                        ? PHASES.FORTIFY
                        : undefined,
                    undefined
                );

                let state = res.state;
                if (state === 'post-attack-fortify') state = 'attack';
                if (
                    Game.getEnemyPhase() !== state
                    // !(Game.getEnemyPhase() === 'fortify' && state === 'draft')
                ) {
                    if (
                        !(
                            Game.getEnemyPhase() === 'fortify' &&
                            state === 'draft'
                        )
                    )
                        Notification.queueNotification('phase', {
                            phase: state,
                            currentPlayerIdx: UI.getCurrentPlayerIdx(),
                        });
                    Game.setEnemyPhase(res.state);
                }
            }
        });

        socket.on('post-attack-fortify-response', (res) => {
            console.log('post-attack-fortify-response', res);
            if (!res.success) handleError(res.reason);
            Game.commitAttackDeploy();
        });

        socket.on('attack-response', (res) => {
            console.log('attack-response', res);
            if (!res.success) handleError(res.reason);
            Game.battle(res);
        });

        socket.on('attack-blitz-response', (res) => {
            console.log('attack-response', res);
            if (!res.success) handleError(res.reason);
            Game.blitz(res);
        });

        socket.on('finish-attack-response', (res) => {
            console.log('finish-attack-response', res);
            if (!res.success) handleError(res.reason);
            GameStateMachine.transition('next');
            Notification.queueNotification('phase', {
                phase: 'fortify',
                currentPlayerIdx: UI.getCurrentPlayerIdx(),
            });
        });

        socket.on('fortify-response', (res) => {
            console.log('fortify-response', res);
            if (!res.success) handleError(res.reason);
            if (
                GameStateMachine.state === 'SelfFortify' ||
                GameStateMachine.state === 'SelfFortifySelected'
            )
                GameStateMachine.transition('next');
            else if (GameStateMachine.state === 'SelfFortifyDeploy')
                Game.commitFortifyDeploy();
        });

        socket.on('card-redeem-response', (res) => {
            console.log('card-redeem-response', res);
            if (!res.success) handleError(res.reason);
        });

        socket.on('update-cards-notification', (res) => {
            console.log('update-cards-notification', res);
            Cards.updateCards(res.cards);
        });

        socket.on('end-game-notification', (res) => {
            console.log('end-game-notification', res);
            EndOverlay.show(res);
            if (res.winner === UI.getPlayerIdx()) {
                Sound.play('game-end-victory');
            } else {
                Sound.play('game-end-defeat');
            }
        });

        socket.on('cheat-response', (res) => {
            console.log('cheat-response', res);
            if (!res.success) handleError(res.reason);
        });

        socket.on('replay-response', (res) => {
            console.log('replay-response', res);
            if (!res.success) handleError(res.reason);
            Game.reset();
            EndOverlay.hide();
            if (res.waiting) WaitingOverlay.show();
        });

        socket.on('quit-game-notification', (res) => {
            console.log('quit-game-notification', res);
            Game.reset();
            ErrorOverlay.show(
                'Your opponent left the game. You will be put into waiting.'
            );
            socket.emit('join-waiting-area-request');
        });
    };

    // This function disconnects the socket from the server
    const disconnect = function () {
        socket.disconnect();
        socket = null;
    };

    const handleError = (reason) => {
        console.error('error: ' + reason);
        Game.reset();
        disconnect();
        Authentication.signout();
        ErrorOverlay.show('An error has occurred: ' + reason);
        TitleOverlay.show();
    };

    const requestDraft = (zoneId, troops) => {
        socket.emit('draft-request', {
            roomCode,
            draftRequest: { id: zoneId, troops },
        });
    };

    const requestFinishDraft = () => {
        socket.emit('finish-draft-request', { roomCode });
    };

    const requestFinishAttack = () => {
        socket.emit('finish-attack-request', { roomCode });
    };

    const requestFinishFortify = () => {
        socket.emit('fortify-request', {
            roomCode,
            fromID: -1,
            toID: -1,
            fortifyTroops: 0,
        });
    };

    const requestAttack = (attackerID, defenderID) => {
        socket.emit('attack-request', {
            roomCode,
            attackerID,
            defenderID,
        });
    };

    const requestBlitz = (attackerID, defenderID) => {
        socket.emit('attack-blitz-request', {
            roomCode,
            attackerID,
            defenderID,
        });
    };

    const requestAttackFortify = (
        attackerID,
        defenderID,
        attackerTroops,
        defenderTroops
    ) => {
        socket.emit('post-attack-fortify-request', {
            roomCode,
            attackerID,
            defenderID,
            attackerTroops,
            defenderTroops,
        });
    };

    const requestFortify = (fromID, toID, fortifyTroops) => {
        socket.emit('fortify-request', {
            roomCode,
            fromID,
            toID,
            fortifyTroops,
        });
    };

    const requestCardTrade = (cardSetType) => {
        socket.emit('card-redeem-request', {
            roomCode,
            cardSetType,
        });
    };

    const requestCheat = () => {
        socket.emit('cheat-request', {
            roomCode,
        });
    };

    const requestReplay = () => {
        socket.emit('replay-request', {
            roomCode,
        });
    };

    return {
        getSocket,
        connect,
        disconnect,
        requestDraft,
        requestFinishDraft,
        requestFinishAttack,
        requestFinishFortify,
        requestAttack,
        requestAttackFortify,
        requestFortify,
        requestCardTrade,
        requestCheat,
        requestReplay,
        requestBlitz,
    };
})();
