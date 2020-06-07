import TrackPlayer from 'react-native-track-player';

module.exports = async function() {
  TrackPlayer.addEventListener('remote-play', () => {
    console.log('Triggered remote-play')
    TrackPlayer.play()
  })

  TrackPlayer.addEventListener('remote-pause', () => {
    console.log('Triggered remote-pause')
    TrackPlayer.pause()
  });

  TrackPlayer.addEventListener('remote-stop', () => {
    console.log('Triggered remote-stop')
    TrackPlayer.destroy()
  });

  TrackPlayer.addEventListener('remote-duck', (paused, permanent) => {
    console.log('Triggered remote-duck')
    if (paused) {
      TrackPlayer.pause()
    } else {
      TrackPlayer.play()
    }
  });
};