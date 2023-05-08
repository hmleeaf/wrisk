const TYPES_MAPPING = Object.freeze({
    introduction: {
        containerId: 'introduction-notification',
    },
});

const Notification = (() => {
    let queue = [];
    let busy = false;

    const initialize = () => {
        $('#notification-overlay').hide();
        $('#introduction-notification').hide();
        $('#phase-notification').hide();
        $('#troops-notification').hide();
        $('#card-notification').hide();
    };

    const queueNotification = (type, data) => {
        pushQueue({ type, data });

        if (!busy) notify();
    };

    const pushQueue = (item) => queue.push(item);
    const popQueue = () => {
        const item = queue[0];
        queue = queue.filter((_, i) => i !== 0);
        return item;
    };
    const isQueueEmpty = () => queue.length === 0;

    const notify = () => {
        // locks the component
        busy = true;

        // get the event from the queue
        const event = popQueue();

        // unlock component and do nothing if the type is invalid
        if (!['introduction', 'phase', 'troops', 'card'].includes(event.type)) {
            console.error('invalid notification type');
            busy = false;
            return;
        }

        // show the corresponding screen by the event
        displayNotification(event);

        // set a timeout to clear the screen after some show time
        setTimeout(() => {
            hideNotification();
            busy = false;

            // continue to notify if queue is not empty
            if (!isQueueEmpty()) notify();
        }, 3000); // time to show the screen for
    };

    const changePlayerClass = (jQueryElement, playerIdx) => {
        jQueryElement.removeClass('player-0');
        jQueryElement.removeClass('player-1');
        jQueryElement.addClass('player-' + playerIdx);
    };

    const displayNotification = (event) => {
        $('#notification-overlay').fadeIn(300);

        if (event.type === 'introduction') {
            // data {
            //     playerIdx,
            //     user: {
            //         avatar,
            //         name,
            //         username
            //     }
            // }
            changePlayerClass($('#introduction-icon'), event.data.playerIdx);
            $('#introduction-icon').html(
                Avatar.getCode(event.data.user.avatar)
            );
            $('#introduction-player-name-text').text(event.data.user.name);
            changePlayerClass(
                $('#introduction-color-icon'),
                event.data.playerIdx
            );
            $('#introduction-color-text').text(
                event.data.playerIdx === 0 ? 'Red' : 'Green'
            );

            $('#introduction-notification').fadeIn(300);
        } else if (event.type === 'phase') {
            // data = {
            //     currentPlayerIdx,
            //     phase,
            // }
            $('#phase-notification-text').text(event.data.phase.toUpperCase());
            changePlayerClass(
                $('#phase-notification-background'),
                event.data.currentPlayerIdx
            );

            $('#phase-notification').fadeIn(300);
        } else if (event.type === 'troops') {
            // data = {
            //     currentPlayerIdx,
            //     troops,
            //     occupied: {
            //         territories,
            //         continents,
            //     },
            //     user: {
            //         name
            //         avatar
            //     }
            // }
            $('#troops-notification-top-text').html(
                `${Avatar.getCode(event.data.user.avatar)} ${
                    event.data.user.name
                } turn`
            );
            changePlayerClass(
                $('#troops-notification-window-header'),
                event.data.currentPlayerIdx
            );
            changePlayerClass(
                $('#troops-notification-troops-text-wrapper'),
                event.data.currentPlayerIdx
            );
            $('#troops-notification-troops-text').text(event.data.troops);
            const text =
                event.data.occupied.continents === 0
                    ? `Troops awarded for occupying ${
                          event.data.occupied.territories
                      } territor${
                          event.data.occupied.territories === 1 ? 'y' : 'ies'
                      }`
                    : `Troops awarded for occupying ${
                          event.data.occupied.continents
                      } continent${
                          event.data.occupied.continents === 1 ? '' : 's'
                      } and ${event.data.occupied.territories} territor${
                          event.data.occupied.territories === 1 ? 'y' : 'ies'
                      }`;
            $('#troops-notification-troops-description').text(text);

            $('#troops-notification').fadeIn(300);
        } else if (event.type === 'card') {
            // data = {
            //     card
            // }
            $('#card-notification-card-wrapper').empty();
            const cardDiv = $('<div class="card"></div>');
            cardDiv.append($(CARDS_SVG[event.data.card]));
            cardDiv.append(event.data.card);
            $('#card-notification-card-wrapper').append(cardDiv);

            $('#card-notification').fadeIn(300);
        }
    };

    const hideNotification = () => {
        $('#notification-overlay').fadeOut(300);
        $('#introduction-notification').fadeOut(300);
        $('#phase-notification').fadeOut(300);
        $('#troops-notification').fadeOut(300);
        $('#card-notification').fadeOut(300);
    };

    return { initialize, queueNotification };
})();
