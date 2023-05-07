const Game = (() => {
    let originalZoneTroops;
    let originalNewTroops = 19; // TODO: remove when connect to socket
    let draftingZoneId;
    let editingZoneTroops;
    let editingNewTroops;

    const beginDraft = (zone) => {
        UI.highlightBoardZones(zone);
        UI.outlineBoardZone(zone);
        UI.showTroopSelector(originalNewTroops);
        UI.hideInfoPanel();

        originalZoneTroops = UI.getTroopByZone(zone);
        editingZoneTroops = UI.getTroopByZone(zone);
        editingNewTroops = originalNewTroops;
        draftingZoneId = SVG.parseSvgToId(zone);
    };

    const cancelDraft = () => {
        UI.unhighlightBoardZones();
        UI.unoutlineBoardZone();
        UI.hideTroopSelector();
        UI.showInfoPanel();

        Board.setZoneTroop(draftingZoneId, originalZoneTroops);
        UI.updateBoardText();
    };

    const commitDraft = () => {
        UI.unhighlightBoardZones();
        UI.unoutlineBoardZone();
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

            if (GameStateMachine.state === 'SelfFortifyDeploy')
                Board.decreaseZoneTroop(fortifyFromZoneId);

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

            if (GameStateMachine.state === 'SelfFortifyDeploy')
                Board.increaseZoneTroop(fortifyFromZoneId);

            return editingNewTroops;
        } else {
            return false;
        }
    };

    const getDeployableTroops = () => editingNewTroops;

    let attackerZoneId;
    let defenderZoneId;

    const checkZoneCanAttackFrom = (zone) => {
        const zoneId = SVG.parseSvgToId(zone);
        if (Board.getZoneOwner(zoneId) !== 0) return false;
        if (Board.getZoneTroop(zoneId) <= 1) return false;
        return true;
    };

    const beginAttack = (zone) => {
        UI.outlineBoardZone(zone);
        UI.highlightBoardZones(zone);
        attackerZoneId = SVG.parseSvgToId(zone);
        UI.highlightBoardZones(
            SVG.getPathsByIds(Board.getAdjacentEnemyZones(attackerZoneId))
        );
    };

    const checkZoneCanAttackTo = (zone) => {
        const adjacentZoneIds = Board.getAdjacentEnemyZones(attackerZoneId);
        return adjacentZoneIds.includes(SVG.parseSvgToId(zone));
    };

    const cancelAttack = () => {
        UI.unoutlineBoardZone();
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

    const randomRollValue = () => Math.floor(Math.random() * 6) + 1;

    const randomRolls = (length) =>
        Array(length)
            .fill(1)
            .map(() => randomRollValue())
            .sort((a, b) => b - a);

    const battle = () => {
        UI.battleScreenDisableInteraction();

        let attackTroops = Math.min(Board.getZoneTroop(attackerZoneId), 3);
        if (Board.getZoneTroop(attackerZoneId) <= 3) attackTroops--;
        const defendTroops = Math.min(Board.getZoneTroop(defenderZoneId), 2);
        const animateRollsIntervalId = UI.animateRolls(
            attackTroops,
            defendTroops
        );
        setTimeout(() => {
            clearInterval(animateRollsIntervalId);

            const attackRolls = randomRolls(attackTroops);
            const defendRolls = randomRolls(defendTroops);
            UI.updateRolls(attackRolls, defendRolls);

            setTimeout(() => {
                const rollResults = []; // true if attack wins
                let i = 0;
                while (attackRolls[i] && defendRolls[i]) {
                    rollResults.push(attackRolls[i] > defendRolls[i]);
                    ++i;
                }
                UI.updateRollResults(rollResults);

                rollResults.forEach((result) => {
                    Board.decreaseZoneTroop(
                        result ? defenderZoneId : attackerZoneId
                    );
                });
                UI.updateBattleScreenTroops(attackerZoneId, defenderZoneId);

                setTimeout(() => {
                    if (Board.getZoneTroop(attackerZoneId) <= 1) {
                        // defender wins
                        GameStateMachine.transition('lose');
                    } else if (Board.getZoneTroop(defenderZoneId) <= 0) {
                        // attacker wins
                        GameStateMachine.transition(
                            'win',
                            SVG.getPathById(defenderZoneId)
                        );
                    } else {
                        UI.resetRolls(attackerZoneId, defenderZoneId);
                    }
                    UI.updateBoardText();

                    UI.battleScreenEnableInteraction();
                }, 500); // time to show the disappear results for
            }, 500); // time to show the rolled dice for
        }, 1000); // time to play the random rolling animation for
    };

    const finishAttack = () => {
        UI.hideBattleScreen();
        UI.unhighlightBoardZones();
        UI.unoutlineBoardZone();
    };

    const beginAttackDeploy = () => {
        Board.setZoneOwner(defenderZoneId, Board.getZoneOwner(attackerZoneId));

        Board.increaseZoneTroop(defenderZoneId);
        Board.decreaseZoneTroop(attackerZoneId);

        originalZoneTroops = 0;
        originalNewTroops = Board.getZoneTroop(attackerZoneId) - 1;
        draftingZoneId = defenderZoneId;
        editingZoneTroops = originalZoneTroops;
        editingNewTroops = originalNewTroops;

        UI.updateTroopSelectorText();
        UI.updateBoardTextBackground();
        UI.updateBoardZones();
        UI.showTroopSelector();
        UI.hideTroopSelectorCancelButton();
        UI.hideInfoPanel();
        UI.outlineBoardZone(SVG.getPathById(attackerZoneId));
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

    let fortifyFromZoneId;
    let fortifyToZoneCandidateIds;
    let fortifyToZoneId;

    const checkZoneCanFortifyFrom = (zone) => {
        const zoneId = SVG.parseSvgToId(zone);
        if (Board.getZoneTroop(zoneId) <= 1) return false;
        if (Board.getZoneOwner(zoneId) !== 0) return false;
        return true;
    };

    const beginFortify = (fromZone) => {
        // fromZone undefined if back from SelfFortifyDeploy
        if (fromZone) {
            fortifyFromZoneId = SVG.parseSvgToId(fromZone);
        }
        UI.highlightBoardZones(SVG.getPathById(fortifyFromZoneId));
        UI.outlineBoardZone(SVG.getPathById(fortifyFromZoneId));

        fortifyToZoneCandidateIds =
            Board.getConnectedFriendlyZones(fortifyFromZoneId);

        UI.highlightBoardZones(SVG.getPathsByIds(fortifyToZoneCandidateIds));
    };

    const cancelFortify = () => {
        UI.unhighlightBoardZones();
        UI.unoutlineBoardZone();
    };

    const checkZoneCanFortifyTo = (zone) =>
        fortifyToZoneCandidateIds.includes(SVG.parseSvgToId(zone));

    let originalFortifyToTroops;

    const beginFortifyDeploy = (zone) => {
        fortifyToZoneId = SVG.parseSvgToId(zone);

        console.log(fortifyFromZoneId);

        originalZoneTroops = 0;
        originalNewTroops = Board.getZoneTroop(fortifyFromZoneId) - 1;
        draftingZoneId = fortifyToZoneId;
        editingZoneTroops = originalZoneTroops;
        editingNewTroops = originalNewTroops;
        originalFortifyToTroops = Board.getZoneTroop(fortifyToZoneId);

        UI.updateTroopSelectorText();
        UI.showTroopSelector();
        UI.hideInfoPanel();
        UI.highlightBoardZones(
            SVG.getPathsByIds([fortifyFromZoneId, fortifyToZoneId])
        );
    };

    const cancelFortifyDeploy = () => {
        UI.hideTroopSelector();
        UI.showInfoPanel();
        UI.unhighlightBoardZones();

        Board.setZoneTroop(fortifyFromZoneId, originalNewTroops + 1);
        Board.setZoneTroop(fortifyToZoneId, originalFortifyToTroops);
        UI.updateBoardText();
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
        checkZoneCanAttackTo,
        beginAttackBattle,
        cancelAttackBattle,
        battle,
        finishAttack,
        beginAttackDeploy,
        beginFortify,
        cancelFortify,
        checkZoneCanFortifyTo,
        beginFortifyDeploy,
        cancelFortifyDeploy,
        randomRollValue,
        checkZoneCanFortifyFrom,
        checkZoneCanAttackFrom,
    };
})();
