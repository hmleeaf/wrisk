const Socket = (function () {
    // This stores the current Socket.IO socket
    let socket = null;

    // This function gets the socket from the module
    const getSocket = function () {
        return socket;
    };

    // This function connects the server and initializes the socket
    const connect = function () {
        socket = io();

        // Wait for the socket to connect successfully
        socket.on('connect', () => {
            socket.emit('join-waiting-area-request');
        });

        socket.on('join-waiting-area-response', (res) => {
            if (!res.success) handleError(res.reason);
        });

        socket.on('game-start-notification', (res) => {
            console.log(res);
        });

        socket.on('draft-notification', () => {});

        socket.on('draft-response', () => {});

        socket.on('card-redeem-response', () => {});

        socket.on('finish-draft-response', () => {});

        socket.on('map-update-notification', () => {});

        socket.on('post-attack-fortify-response', () => {});

        socket.on('post-attack-result-notification', () => {});

        socket.on('attack-response', () => {});

        socket.on('finish-attack-response', () => {});

        socket.on('fortify-response', () => {});

        socket.on('update-cards-notification', () => {});

        socket.on('end-game-notification', () => {});
    };

    // This function disconnects the socket from the server
    const disconnect = function () {
        socket.disconnect();
        socket = null;
    };

    const handleError = (reason) => {
        console.log('error: ' + reason);
    };

    return { getSocket, connect, disconnect };
})();
