export const createStateMachine = (defs) => {
    const machine = {
        state: defs.initialState,
        data: defs[defs.initialState].data,
        transition: (event) => {
            const currStateDef = defs[machine.state];
            const destTransition = currStateDef.transitions[event];

            // early return if event not found in current state's transitions
            if (!destTransition) return;

            // extract destination state and definition
            const destState = destTransition.target;
            const destStateDef = defs[destState];

            // invoke functions in order
            destTransition.action();
            currStateDef.actions.onExit();
            destStateDef.actions.onEnter();

            // update machine state
            machine.state = destState;
            machine.data = defs[destState].data;
            return machine.state;
        },
    };

    return machine;
};
