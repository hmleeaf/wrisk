const Sound = (() => {
    const sounds = {
        'battle-end-defeat': new Audio('assets/battle-end-defeat.wav'),
        'battle-end-victory': new Audio('assets/battle-end-victory.mp3'),
        battle: new Audio('assets/battle.wav'),
        'dice-roll': new Audio('assets/dice-roll.wav'),
        'game-end-defeat': new Audio('assets/game-end-defeat.mp3'),
        'game-end-victory': new Audio('assets/game-end-victory.mp3'),
    };

    const play = (soundName) => {
        const sound = sounds[soundName];
        sound.pause();
        sound.currentTime = 0;
        sound.play();
    };

    const initialize = () => {
        sounds['battle-end-defeat'].volume = 0.2;
        sounds['battle-end-victory'].volume = 1;
        sounds['battle'].volume = 0.2;
        sounds['dice-roll'].volume = 0.2;
        sounds['game-end-defeat'].volume = 0.2;
        sounds['game-end-victory'].volume = 0.2;
    };

    return { sounds, play, initialize };
})();

// $(() => {
//     $(document).on('keydown', (e) => {
//         if (e.key === '1') {
//             Sound.play('battle-end-defeat');
//         } else if (e.key === '2') {
//             Sound.play('battle-end-victory');
//         } else if (e.key === '3') {
//             Sound.play('battle');
//         } else if (e.key === '4') {
//             Sound.play('dice-roll');
//         } else if (e.key === '5') {
//             Sound.play('game-end-defeat');
//         } else if (e.key === '6') {
//             Sound.play('game-end-victory');
//         }
//     });
// });
