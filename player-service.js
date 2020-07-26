import TrackPlayer from 'react-native-track-player';

async function stop() {
    // This forces the player to be fully stopped and removed
    // from notification bar and lock screen, both on iOS and
    // Android.
    try {
      await TrackPlayer.reset()
    } catch (ignore) {}
    TrackPlayer.destroy()
}

module.exports = async function() {
  TrackPlayer.addEventListener('remote-play', async () => {
    console.log('Triggered remote-play')
    await TrackPlayer.play()
  })

  TrackPlayer.addEventListener('remote-pause', async () => {
    console.log('Triggered remote-pause')
    await stop()
  });

  TrackPlayer.addEventListener('remote-stop', async () => {
    console.log('Triggered remote-stop')
    await stop()
  });

  TrackPlayer.addEventListener('remote-duck', async (params) => {
    console.log('Triggered remote-duck; paused ' + params.paused + ", permanent " + params.permanent)
    if (params.permanent) {
      await stop()
    } else {
      if (params.paused) {
        await TrackPlayer.setVolume(0.3)
      } else {
        await TrackPlayer.setVolume(1)
      }
    }
  });
};