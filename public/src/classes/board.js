const Board = (() => {
    let board;

    const getAdjacentEnemyZones = (zoneId) => {
        return board.territories[zoneId].neighbours.filter(
            (id) =>
                board.territories[id].owner !== board.territories[zoneId].owner
        );
    };
    const getZoneOwner = (zoneId) => board.territories[zoneId].owner;
    const getZoneTroop = (zoneId) => board.territories[zoneId].troops;

    const decreaseZoneTroop = (zoneId) => board.territories[zoneId].troops--;
    const increaseZoneTroop = (zoneId) => board.territories[zoneId].troops++;
    const setZoneTroop = (zoneId, troops) =>
        (board.territories[zoneId].troops = troops);
    const setZoneOwner = (zoneId, owner) =>
        (board.territories[zoneId].owner = owner);

    const getConnectedFriendlyZones = (zoneId) => {
        const owner = board.territories[zoneId].owner;
        // dfs
        const connectedZones = [];
        const searchZones = [zoneId];
        while (searchZones.length > 0) {
            const currZone = searchZones.splice(searchZones.length - 1, 1)[0];
            const currZoneAdjacents = board.territories[currZone].neighbours;
            const currZoneAdjacentFriendly = currZoneAdjacents.filter(
                (zId) => board.territories[zId].owner === owner
            );
            currZoneAdjacentFriendly.forEach((adjacentZone) => {
                if (!connectedZones.includes(adjacentZone)) {
                    searchZones.push(adjacentZone);
                    connectedZones.push(adjacentZone);
                }
            });
        }

        return connectedZones.filter((z) => z !== zoneId);
    };

    const getOccupied = (owner) => {
        let continents = 0;
        board.continents.forEach((cont) => {
            if (
                cont.territories.reduce(
                    (prev, curr) =>
                        prev && board.territories[curr].owner === owner,
                    true
                )
            ) {
                continents++;
            }
        });
        let territories = 0;
        board.territories.forEach((terr) => {
            if (terr.owner === owner) {
                territories++;
            }
        });
        return { continents, territories };
    };

    const initialize = (board_) => {
        board = board_;
    };

    const updateBoard = (board_) => {
        board = board_;
    };

    return {
        getAdjacentEnemyZones,
        getZoneOwner,
        getZoneTroop,
        decreaseZoneTroop,
        increaseZoneTroop,
        setZoneTroop,
        getConnectedFriendlyZones,
        setZoneOwner,
        initialize,
        updateBoard,
        getOccupied,
    };
})();
