import colors from '../constants/colors.js';
import { GameStateMachine } from '../utils/stateMachine.js';
import { SVG } from '../utils/svg.js';
import { UI } from './ui.js';
import { Board } from './board.js';

export const Game = (() => {
    let originalZoneTroops;
    let originalNewTroops = 19; // TODO: remove when connect to socket
    let draftingZoneId;

    let editingZoneTroops;
    let editingNewTroops;

    const beginDraft = (zone) => {
        UI.highlightBoardZones(zone);
        UI.showTroopSelector(originalNewTroops);
        UI.hideInfoPanel();

        originalZoneTroops = UI.getTroopByZone(zone);
        editingZoneTroops = UI.getTroopByZone(zone);
        editingNewTroops = originalNewTroops;
        draftingZoneId = SVG.parseSvgToId(zone);
    };

    const cancelDraft = () => {
        UI.unhighlightBoardZones();
        UI.hideTroopSelector();
        UI.showInfoPanel();

        Board.setZoneTroop(draftingZoneId, originalZoneTroops);
        UI.updateBoardText();
    };

    const commitDraft = () => {
        UI.unhighlightBoardZones();
        UI.hideTroopSelector();
        UI.showInfoPanel();
        UI.updateInfoPanel(undefined, undefined, editingNewTroops);

        originalNewTroops = editingNewTroops;

        GameStateMachine.transition('next');
    };

    const tryIncreaseDraft = () => {
        if (editingNewTroops - 1 >= 0) {
            editingNewTroops--;
            editingZoneTroops++;
            Board.increaseZoneTroop(draftingZoneId);

            return editingNewTroops;
        } else {
            return false;
        }
    };

    const tryDecreaseDraft = () => {
        if (
            editingNewTroops + 1 <= originalNewTroops &&
            editingZoneTroops - 1 >= originalZoneTroops
        ) {
            editingNewTroops++;
            editingZoneTroops--;
            Board.decreaseZoneTroop(draftingZoneId);

            return editingNewTroops;
        } else {
            return false;
        }
    };

    const getDeployableTroops = () => editingNewTroops;

    return {
        beginDraft,
        cancelDraft,
        commitDraft,
        tryIncreaseDraft,
        tryDecreaseDraft,
        getDeployableTroops,
    };
})();
