const ZONE_GRAPH = {
    0: [1, 6, 13],
    1: [0, 2],
    2: [1, 3],
    3: [2, 4, 5],
    4: [3, 5, 18],
    5: [3, 4, 10],
    6: [0, 8],
    7: [8, 9],
    8: [6, 7, 9, 13],
    9: [7, 8, 10, 13, 14, 15],
    10: [5, 9, 11, 15],
    11: [10, 12, 15],
    12: [11, 17],
    13: [0, 8, 9, 14],
    14: [9, 13, 15, 16],
    15: [9, 10, 11, 14, 16],
    16: [14, 15, 17, 18],
    17: [12, 16, 18],
    18: [4, 16, 17],
};

const CONTINENT = {
    0: [13, 14, 15, 16],
    1: [17, 18],
    2: [6, 7, 8, 9],
    3: [10, 11, 12],
    4: [0, 1, 2],
    5: [3, 4, 5],
};
