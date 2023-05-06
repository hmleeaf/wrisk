export const PHASES = Object.freeze({
    DRAFT: 0,
    ATTACK: 1,
    FORTIFY: 2,
});

export const PHASE_MAP_SQUARE_ID = Object.freeze(
    new Map([
        [PHASES['DRAFT'], 'phase-square-draft'],
        [PHASES['ATTACK'], 'phase-square-attack'],
        [PHASES['FORTIFY'], 'phase-square-fortify'],
    ])
);

export const PHASE_MAP_NAME = Object.freeze(
    new Map([
        [PHASES['DRAFT'], 'Draft Phase'],
        [PHASES['ATTACK'], 'Attack Phase'],
        [PHASES['FORTIFY'], 'Fortify Phase'],
    ])
);
