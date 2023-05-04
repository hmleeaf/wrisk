import { Game } from '../classes/game.js';
import { SVG } from '../utils/svg.js';

export const STATES = {
    initialState: 'SelfDraft',

    SelfDraft: {
        actions: {
            onEnter: () => {
                console.log('SelfDraft: onEnter');
            },
            onExit: () => {
                console.log('SelfDraft: onExit');
            },
        },
        data: {
            zoneOnClick: (e) => {
                const { pageX: x, pageY: y } = e;
                const path = SVG.getSvgPathByXY(x, y);
                if (path) Game.draftZone(path);
            },
        },
        transitions: {
            next: {
                target: 'SelfAttack',
                action: () => {
                    console.log(
                        'transition action for "next" in "SelfDraft" state'
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
                const { pageX: x, pageY: y } = e;
                const path = SVG.getSvgPathByXY(x, y);
                console.log(path);
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
