import zonesGraph from '../constants/zoneGraph.js';

export const Vector2 = (_x, _y) => {
    const x = _x;
    const y = _y;

    return { x, y };
};

export const Zone = (_owner, _troop, _adjacentZoneIds) => {
    const owner = _owner;
    const troop = _troop;
    const adjacentZoneIds = _adjacentZoneIds;

    return { owner, troop, adjacentZoneIds };
};

const dummyInitBoard = {
    0: {
        owner: 0,
        troop: 5,
    },
    1: {
        owner: 1,
        troop: 3,
    },
    2: {
        owner: 0,
        troop: 4,
    },
    3: {
        owner: 1,
        troop: 2,
    },
    4: {
        owner: 1,
        troop: 2,
    },
    5: {
        owner: 1,
        troop: 5,
    },
    6: {
        owner: 1,
        troop: 2,
    },
    7: {
        owner: 0,
        troop: 6,
    },
    8: {
        owner: 0,
        troop: 7,
    },
    9: {
        owner: 1,
        troop: 2,
    },
    10: {
        owner: 0,
        troop: 5,
    },
    11: {
        owner: 1,
        troop: 3,
    },
    12: {
        owner: 1,
        troop: 5,
    },
    13: {
        owner: 1,
        troop: 6,
    },
    14: {
        owner: 0,
        troop: 3,
    },
    15: {
        owner: 0,
        troop: 3,
    },
    16: {
        owner: 0,
        troop: 2,
    },
    17: {
        owner: 0,
        troop: 3,
    },
    18: {
        owner: 1,
        troop: 2,
    },
};

export const Board = (() => {
    const zones = Object.fromEntries(
        Object.keys(zonesGraph).map((key) => [
            key,
            Zone(
                dummyInitBoard[key].owner,
                dummyInitBoard[key].troop,
                zonesGraph[key]
            ),
        ])
    );

    const getAdjacentEnemyZones = (zoneId) => {
        return zones[zoneId].adjacentZoneIds.filter(
            (id) => zones[id].owner !== zones[zoneId].owner
        );
    };
    const getZoneOwner = (zoneId) => zones[zoneId].owner;
    const getZoneTroop = (zoneId) => zones[zoneId].troop;

    const decreaseZoneTroop = (zoneId) => zones[zoneId].troop--;
    const increaseZoneTroop = (zoneId) => zones[zoneId].troop++;
    const setZoneTroop = (zoneId, troops) => (zones[zoneId].troop = troops);
    const setZoneOwner = (zoneId, owner) => (zones[zoneId].owner = owner);

    const getConnectedFriendlyZones = (zoneId) => {
        const owner = zones[zoneId].owner;
        // dfs
        const connectedZones = [];
        const searchZones = [zoneId];
        while (searchZones.length > 0) {
            const currZone = searchZones.splice(searchZones.length - 1, 1)[0];
            const currZoneAdjacents = zones[currZone].adjacentZoneIds;
            const currZoneAdjacentFriendly = currZoneAdjacents.filter(
                (zId) => zones[zId].owner === owner
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

    return {
        getAdjacentEnemyZones,
        getZoneOwner,
        getZoneTroop,
        decreaseZoneTroop,
        increaseZoneTroop,
        setZoneTroop,
        getConnectedFriendlyZones,
        setZoneOwner,
    };
})();
