import chalkAnimation from 'chalk-animation'

const rainbow = chalkAnimation.rainbow('~~~ G A T E W A Y  S E R V I C E ~~~')

setTimeout(() => {
    rainbow.stop() // Animation stops
}, 20)
