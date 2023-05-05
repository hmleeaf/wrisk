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

            if (GameStateMachine.state === 'SelfAttackDeploy')
                Board.decreaseZoneTroop(attackerZoneId);

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

            if (GameStateMachine.state === 'SelfAttackDeploy')
                Board.increaseZoneTroop(attackerZoneId);

            return editingNewTroops;
        } else {
            return false;
        }
    };

    const getDeployableTroops = () => editingNewTroops;

    let attackerZoneId;
    let defenderZoneId;

    const beginAttack = (zone) => {
        UI.highlightBoardZones(zone);
        attackerZoneId = SVG.parseSvgToId(zone);
        UI.highlightBoardZones(
            SVG.getPathsByIds(Board.getAdjacentEnemyZones(attackerZoneId))
        );
    };

    const checkZoneAttackable = (zone) => {
        const adjacentZoneIds = Board.getAdjacentEnemyZones(attackerZoneId);
        return adjacentZoneIds.includes(SVG.parseSvgToId(zone));
    };

    const cancelAttack = () => {
        UI.unhighlightBoardZones();
    };

    const beginAttackBattle = (zone) => {
        defenderZoneId = SVG.parseSvgToId(zone);
        UI.showBattleScreen(attackerZoneId, defenderZoneId);
    };

    const cancelAttackBattle = () => {
        UI.hideBattleScreen();
        GameStateMachine.transition('back', SVG.getPathById(attackerZoneId));
    };

    const randomRolls = (length) =>
        Array(length)
            .fill(1)
            .map(() => Math.floor(Math.random() * 6) + 1)
            .sort((a, b) => b - a);

    const battle = () => {
        let attackTroops = Math.min(Board.getZoneTroop(attackerZoneId), 3);
        if (attackTroops <= 3) attackTroops--;
        const defendTroops = Math.min(Board.getZoneTroop(defenderZoneId), 2);
        const attackRolls = randomRolls(attackTroops);
        const defendRolls = randomRolls(defendTroops);
        UI.updateRolls(attackRolls, defendRolls);

        const rollResults = []; // true if attack wins
        let i = 0;
        while (attackRolls[i] && defendRolls[i]) {
            rollResults.push(attackRolls[i] > defendRolls[i]);
            ++i;
        }
        UI.updateRollResults(rollResults);

        rollResults.forEach((result) => {
            Board.decreaseZoneTroop(result ? defenderZoneId : attackerZoneId);
        });
        UI.updateBattleScreenTroops(attackerZoneId, defenderZoneId);

        // defender wins
        if (Board.getZoneTroop(attackerZoneId) <= 1) {
            GameStateMachine.transition('lose');
        }

        // attacker wins
        if (Board.getZoneTroop(defenderZoneId) <= 0) {
            GameStateMachine.transition('win', SVG.getPathById(defenderZoneId));
        }

        UI.updateBoardText();

        setTimeout(() => {
            UI.resetRolls(attackerZoneId, defenderZoneId);
        }, 1000);
    };

    const finishAttack = () => {
        UI.hideBattleScreen();
        UI.unhighlightBoardZones();
    };

    const beginAttackDeploy = () => {
        Board.increaseZoneTroop(defenderZoneId);
        Board.decreaseZoneTroop(attackerZoneId);

        originalZoneTroops = 0;
        originalNewTroops = Board.getZoneTroop(attackerZoneId) - 1;
        draftingZoneId = defenderZoneId;
        editingZoneTroops = originalZoneTroops;
        editingNewTroops = originalNewTroops;

        UI.updateTroopSelectorText();
        UI.showTroopSelector();
        UI.hideInfoPanel();
        UI.highlightBoardZones(
            SVG.getPathsByIds([attackerZoneId, defenderZoneId])
        );

        if (
            Board.getZoneTroop(attackerZoneId) === 1 &&
            Board.getZoneTroop(defenderZoneId) === 1
        ) {
            Game.commitDraft();
        }
    };

    return {
        beginDraft,
        cancelDraft,
        commitDraft,
        tryIncreaseDraft,
        tryDecreaseDraft,
        getDeployableTroops,
        beginAttack,
        cancelAttack,
        checkZoneAttackable,
        beginAttackBattle,
        cancelAttackBattle,
        battle,
        finishAttack,
        beginAttackDeploy,
    };
})();
