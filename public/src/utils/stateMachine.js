// import { STATES } from '../constants/states.js';
import { SVG } from '../utils/svg.js';
import { UI } from '../classes/ui.js';
import { PHASES } from '../constants/phases.js';
import { Board } from '../classes/board.js';
import { Game } from '../classes/game.js';

const createStateMachine = (defs) => {
    const machine = {
        state: defs.initialState,
        data: defs[defs.initialState].data,
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
    defs[defs.initialState].actions.onEnter();

    return machine;
};

const STATES = {
    initialState: 'SelfDraft',

    SelfDraft: {
        actions: {
            onEnter: () => {
                console.log('SelfDraft: onEnter');
                UI.updateInfoPanel(true, PHASES.DRAFT);
                UI.showNotification(
                    'Tap any of your territories to begin deploying troops'
                );
            },
            onExit: () => {
                console.log('SelfDraft: onExit');
                UI.hideNotification();
            },
        },
        data: {
            zoneOnClick: (e) => {
                const path = SVG.getSvgPathByEvent(e);
                if (path) GameStateMachine.transition('select', path);
            },
        },
        transitions: {
            select: {
                target: 'SelfDraftSelected',
                action: () => {
                    console.log(
                        'transition action for "next" in "SelfDraft" state'
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
                if (path) GameStateMachine.transition('select', path);
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
            },
            onExit: () => {
                console.log('SelfAttack: onExit');
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
            next: {
                target: 'SelfDraft',
                action: () => {
                    console.log(
                        'transition action for "next" in "SelfAttack" state'
                    );
                },
            },
        },
    },
};

export const GameStateMachine = createStateMachine(STATES);

$(() => {
    $('#play_area').on('click', (e) => {
        GameStateMachine.data.zoneOnClick(e);
    });

    $(document).on('keydown', (e) => {
        if (e.key === 'Enter') {
            GameStateMachine.transition('next');
        }
    });
});
