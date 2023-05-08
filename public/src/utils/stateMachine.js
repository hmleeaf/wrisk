const createStateMachine = (defs, initialState) => {
    const machine = {
        state: initialState,
        data: defs[initialState].data,
        transition: (event, data = undefined) => {
            const currStateDef = defs[machine.state];
            const destTransition = currStateDef.transitions[event];

            // early return if event not found in current state's transitions
            if (!destTransition) return;

            // extract destination state and definition
            const destState = destTransition.target;
            const destStateDef = defs[destState];

            // invoke functions in order
            destTransition.action(data);
            currStateDef.actions.onExit(data);
            destStateDef.actions.onEnter(data);

            // update machine state
            machine.state = destState;
            machine.data = defs[destState].data;
            return machine.state;
        },
    };

    // directly invoke initial state's onEnter on initialization
    defs[initialState].actions.onEnter();

    return machine;
};

const STATES = {
    SelfDraft: {
        actions: {
            onEnter: (troops) => {
                console.log('SelfDraft: onEnter');
                if (troops !== undefined) Game.setDraftTroops(troops);
                UI.updateInfoPanel(true, PHASES.DRAFT, troops);
                UI.showHint(
                    'Tap any of your territories to begin deploying troops'
                );
            },
            onExit: () => {
                console.log('SelfDraft: onExit');
                UI.hideHint();
            },
        },
        data: {
            zoneOnClick: (e) => {
                const path = SVG.getSvgPathByEvent(e);
                if (path && Game.checkZoneCanDraft(path))
                    GameStateMachine.transition('select', path);
            },
        },
        transitions: {
            select: {
                target: 'SelfDraftSelected',
                action: () => {
                    console.log(
                        'transition action for "select" in "SelfDraft" state'
                    );
                },
            },
            next: {
                target: 'SelfAttack',
                action: () => {
                    console.log(
                        'transition action for "next" in "SelfDraft" state'
                    );
                },
            },
            card: {
                target: 'SelfDraft',
                action: () => {
                    console.log(
                        'transition action for "card" in "SelfDraft" state'
                    );
                },
            },
        },
    },

    SelfDraftSelected: {
        actions: {
            onEnter: (path) => {
                console.log('SelfDraftSelected: onEnter', path);
                Game.beginDraft(path);

                // const adjacentPaths = SVG.getPathsByIds(
                //     Board.getAdjacentZones(SVG.parseSvgToId(path))
                // );
                // UI.highlightBoardZones(adjacentPaths);
            },
            onExit: () => {
                console.log('SelfDraftSelected: onExit');
            },
        },
        data: {
            zoneOnClick: (e) => {
                const path = SVG.getSvgPathByEvent(e);
                if (path && Game.checkZoneCanDraft(path))
                    GameStateMachine.transition('select', path);
                else GameStateMachine.transition('back');
            },
        },
        transitions: {
            back: {
                target: 'SelfDraft',
                action: () => {
                    console.log(
                        'transition action for "back" in "SelfDraftSelected" state'
                    );
                    Game.cancelDraft();
                },
            },
            select: {
                target: 'SelfDraftSelected',
                action: () => {
                    console.log(
                        'transition action for "select" in "SelfDraftSelected" state'
                    );
                    Game.cancelDraft();
                },
            },
            next: {
                target: 'SelfDraft',
                action: () => {
                    console.log(
                        'transition action for "next" in "SelfDraftSelected" state'
                    );
                },
            },
        },
    },

    SelfAttack: {
        actions: {
            onEnter: () => {
                console.log('SelfAttack: onEnter');
                UI.updateInfoPanel(true, PHASES.ATTACK);
                UI.showHint('Select a territory to begin your attack from');
            },
            onExit: () => {
                console.log('SelfAttack: onExit');
                UI.hideHint();
            },
        },
        data: {
            zoneOnClick: (e) => {
                const path = SVG.getSvgPathByEvent(e);
                if (path && Game.checkZoneCanAttackFrom(path))
                    GameStateMachine.transition('select', path);
            },
        },
        transitions: {
            next: {
                target: 'SelfFortify',
                action: () => {
                    console.log(
                        'transition action for "next" in "SelfAttack" state'
                    );
                },
            },
            select: {
                target: 'SelfAttackSelected',
                action: () => {
                    console.log(
                        'transition action for "select" in "SelfAttack" state'
                    );
                },
            },
        },
    },

    SelfAttackSelected: {
        actions: {
            onEnter: (path) => {
                console.log('SelfAttackSelected: onEnter');
                UI.showHint('Select an adjacent territory to attack');
                Game.beginAttack(path);
            },
            onExit: () => {
                console.log('SelfAttackSelected: onExit');
                UI.hideHint();
            },
        },
        data: {
            zoneOnClick: (e) => {
                const path = SVG.getSvgPathByEvent(e);
                if (path && Game.checkZoneCanAttackTo(path))
                    GameStateMachine.transition('select', path);
                else if (path && Game.checkZoneCanAttackFrom(path))
                    GameStateMachine.transition('change', path);
                else GameStateMachine.transition('back');
            },
        },
        transitions: {
            back: {
                target: 'SelfAttack',
                action: () => {
                    console.log(
                        'transition action for "back" in "SelfAttackSelected" state'
                    );
                    Game.cancelAttack();
                },
            },
            select: {
                target: 'SelfAttackBattle',
                action: (path) => {
                    console.log(
                        'transition action for "select" in "SelfAttackSelected" state'
                    );
                    Game.beginAttackBattle(path);
                },
            },
            change: {
                target: 'SelfAttackSelected',
                action: () => {
                    console.log(
                        'transition action for "change" in "SelfAttackSelected" state'
                    );
                    Game.cancelAttack();
                },
            },
            next: {
                target: 'SelfFortify',
                action: () => {
                    console.log(
                        'transition action for "next" in "SelfAttackSelected" state'
                    );
                    Game.cancelAttack();
                },
            },
        },
    },

    SelfAttackBattle: {
        actions: {
            onEnter: () => {
                console.log('SelfAttackBattle: onEnter');
            },
            onExit: () => {
                console.log('SelfAttackBattle: onExit');
            },
        },
        data: {
            zoneOnClick: (e) => {
                // const { pageX: x, pageY: y } = e;
                // const path = SVG.getSvgPathByXY(x, y);
                // console.log(path);
            },
        },
        transitions: {
            back: {
                target: 'SelfAttackSelected',
                action: () => {
                    console.log(
                        'transition action for "back" in "SelfAttackBattle" state'
                    );
                },
            },
            lose: {
                target: 'SelfAttack',
                action: () => {
                    console.log(
                        'transition action for "finish" in "SelfAttackBattle" state'
                    );
                    Game.finishAttack();
                },
            },
            win: {
                target: 'SelfAttackDeploy',
                action: () => {
                    console.log(
                        'transition action for "finish" in "SelfAttackBattle" state'
                    );
                    Game.finishAttack();
                },
            },
        },
    },

    SelfAttackDeploy: {
        actions: {
            onEnter: () => {
                console.log('SelfAttackDeploy: onEnter');
                Game.beginAttackDeploy();
            },
            onExit: () => {
                console.log('SelfAttackDeploy: onExit');
                UI.hideHint();
            },
        },
        data: {
            zoneOnClick: (e) => {},
        },
        transitions: {
            next: {
                target: 'SelfAttack',
                action: () => {
                    console.log(
                        'transition action for "next" in "SelfAttackDeploy" state'
                    );
                },
            },
        },
    },

    SelfFortify: {
        actions: {
            onEnter: () => {
                console.log('SelfFortify: onEnter');
                UI.updateInfoPanel(true, PHASES.FORTIFY);
                UI.showHint('Select a territory to move your troops from');
            },
            onExit: () => {
                console.log('SelfFortify: onExit');
                UI.hideHint();
            },
        },
        data: {
            zoneOnClick: (e) => {
                const path = SVG.getSvgPathByEvent(e);
                if (path && Game.checkZoneCanFortifyFrom(path))
                    GameStateMachine.transition('select', path);
            },
        },
        transitions: {
            next: {
                target: 'Enemy',
                action: () => {
                    console.log(
                        'transition action for "next" in "SelfFortify" state'
                    );
                },
            },
            select: {
                target: 'SelfFortifySelected',
                action: () => {
                    console.log(
                        'transition action for "select" in "SelfFortify" state'
                    );
                },
            },
        },
    },

    SelfFortifySelected: {
        actions: {
            onEnter: (path) => {
                console.log('SelfFortifySelected: onEnter');
                Game.beginFortify(path);
                UI.showHint(
                    'Select an adjacent territory to move your troops to'
                );
            },
            onExit: () => {
                console.log('SelfFortifySelected: onExit');
                Game.cancelFortify();
                UI.hideHint();
            },
        },
        data: {
            zoneOnClick: (e) => {
                const path = SVG.getSvgPathByEvent(e);
                if (path && Game.checkZoneCanFortifyTo(path))
                    GameStateMachine.transition('select', path);
                else if (path && Game.checkZoneCanFortifyFrom(path))
                    GameStateMachine.transition('change', path);
                else GameStateMachine.transition('back');
            },
        },
        transitions: {
            back: {
                target: 'SelfFortify',
                action: () => {
                    console.log(
                        'transition action for "back" in "SelfFortifySelected" state'
                    );
                },
            },
            select: {
                target: 'SelfFortifyDeploy',
                action: () => {
                    console.log(
                        'transition action for "select" in "SelfFortifySelected" state'
                    );
                },
            },
            change: {
                target: 'SelfFortifySelected',
                action: () => {
                    console.log(
                        'transition action for "change" in "SelfFortifySelected" state'
                    );
                },
            },
            next: {
                target: 'Enemy',
                action: () => {
                    console.log(
                        'transition action for "next" in "SelfFortifySelected" state'
                    );
                },
            },
        },
    },

    SelfFortifyDeploy: {
        actions: {
            onEnter: (path) => {
                console.log('SelfFortifyDeploy: onEnter');
                Game.beginFortifyDeploy(path);
            },
            onExit: () => {
                console.log('SelfFortifyDeploy: onExit');
            },
        },
        data: {
            zoneOnClick: (e) => {
                const path = SVG.getSvgPathByEvent(e);
                if (path && Game.checkZoneCanFortifyTo(path))
                    GameStateMachine.transition('change', path);
                else GameStateMachine.transition('back');
            },
        },
        transitions: {
            back: {
                target: 'SelfFortifySelected',
                action: () => {
                    console.log(
                        'transition action for "back" in "SelfFortifyDeploy" state'
                    );
                    Game.cancelFortifyDeploy();
                },
            },
            next: {
                target: 'Enemy',
                action: () => {
                    console.log(
                        'transition action for "next" in "SelfFortifyDeploy" state'
                    );
                },
            },
            select: {
                target: 'SelfFortifySelected',
                action: () => {
                    console.log(
                        'transition action for "select" in "SelfFortifyDeploy" state'
                    );
                },
            },
            change: {
                target: 'SelfFortifyDeploy',
                action: () => {
                    console.log(
                        'transition action for "select" in "SelfFortifyDeploy" state'
                    );
                    Game.cancelFortifyDeploy();
                },
            },
        },
    },

    Enemy: {
        actions: {
            onEnter: () => {
                console.log('Enemy: onEnter');
                UI.updateInfoPanel(false, PHASES.DRAFT);
            },
            onExit: () => {
                console.log('Enemy: onExit');
            },
        },
        data: {
            zoneOnClick: (e) => {},
        },
        transitions: {
            next: {
                target: 'SelfDraft',
                action: () => {
                    console.log(
                        'transition action for "next" in "Enemy" state'
                    );
                },
            },
        },
    },
};

const GameStateMachine = createStateMachine(STATES, 'Enemy');

$(() => {
    $('#play_area').on('click', (e) => {
        GameStateMachine.data.zoneOnClick(e);
    });
});
