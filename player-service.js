import TrackPlayer from 'react-native-track-player';

module.exports = async function() {
  TrackPlayer.addEventListener('remote-play', async () => {
    console.log('Triggered remote-play')
    await TrackPlayer.play()
  })

  TrackPlayer.addEventListener('remote-pause', async () => {
    console.log('Triggered remote-pause')
    await TrackPlayer.pause()
  });

  TrackPlayer.addEventListener('remote-stop', async () => {
    console.log('Triggered remote-stop')
    await TrackPlayer.stop()
    await TrackPlayer.destroy()
  });

  TrackPlayer.addEventListener('remote-duck', async (paused, permanent) => {
    console.log('Triggered remote-duck')
    if (paused) {
      await TrackPlayer.pause()
    } else {
      await TrackPlayer.play()
    }
  });
};