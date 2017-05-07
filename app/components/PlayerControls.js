/** @flow */

import React from 'react';
import Reflux from 'reflux';
import {
  Image,
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  DeviceEventEmitter,
  TouchableOpacity,
  Platform,
} from 'react-native';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

import { ReactNativeAudioStreaming } from 'react-native-audio-streaming';
import MusicControl from 'react-native-music-control';

import { Actions, MetadataStore } from './Metadata';

export class PlayerControls extends Reflux.Component {
  _onPress: Function;
  _initializeMusicControl: Function;
  _updateMusicControlTitle: Function;
  _updateMusicControlState: Function;
  _playerStop: Function;
  _playerStart: Function;
  subscription: Object;

  constructor(props: Object) {
    super(props);
    this.store = MetadataStore;
    this.state = {status: "STOPPED"};
    this._onPress = this._onPress.bind(this);
  }
  componentDidMount() {
    this.subscription = DeviceEventEmitter.addListener(
      "AudioBridgeEvent", (evt) => {
        if (evt.status === "METADATA_UPDATED") {
          Actions.updateMetadata();
        } else {
          this.setState({status: evt.status});
        }
      }
    );

    ReactNativeAudioStreaming.getStatus((error, msg) => {
      (error) ? console.log(error) : this.setState({status: msg.status})
    });
    this._initializeMusicControl();
  }
  _initializeMusicControl() {
    MusicControl.enableBackgroundMode(true);
    MusicControl.on('play', this._playerStart.bind(this));
    MusicControl.on('pause', this._playerStop.bind(this));
    this._updateMusicControlTitle(true);
    this._updateMusicControlState();
  }
  _updateMusicControlTitle(initial) {
    // Android does not support changing title via MusicControl.updatePlayback,
    // so we need to send all information via setNowPlaying every time.
    if (Platform.OS === 'android' || initial) {
      MusicControl.setNowPlaying({
        artist: "Світле Радіо",
        title: this.state.current,
        artwork: Platform.select({
          // https://github.com/tanguyantoine/react-native-music-control/issues/46
          ios: resolveAssetSource(require('../img/artwork.png')).uri,
          android: require('../img/artwork.png'),
        }),
        // iOS determines playback state depending on 'speed', so we need to set
        // it in the initial setNowPlaying for correct initial state to be set.
        speed: this._musicControlState() == MusicControl.STATE_STOPPED ? 0 : 1,
      });
    } else {
      MusicControl.updatePlayback({title: this.state.current});
    }
  }
  _musicControlState() {
    switch (this.state.status) {
      case "PLAYING":
      case "STREAMING":
        return MusicControl.STATE_PLAYING;
      case "BUFFERING":
        return MusicControl.STATE_BUFFERING;
    }
    return MusicControl.STATE_STOPPED;
  }
  _updateMusicControlState() {
    state = this._musicControlState();
    if (state == MusicControl.STATE_STOPPED) {
      MusicControl.enableControl('play', true);
      MusicControl.enableControl('pause', false);
    } else {
      MusicControl.enableControl('play', false);
      MusicControl.enableControl('pause', true);
    }
    MusicControl.updatePlayback({state: state});
  }
  componentDidUpdate(prevProps: Object, prevState: Object) {
    if (prevState.current != this.state.current) {
      this._updateMusicControlTitle(false);
    }
    if (prevState.status != this.state.status) {
      this._updateMusicControlState();
    }
  }
  componentWillUnmount() {
    this.subscription.remove();
    MusicControl.resetNowPlaying();
    ReactNativeAudioStreaming.stop();
  }
  _playerStart() {
    ReactNativeAudioStreaming.play(this.state.streamUrl,
      {showIniOSMediaCenter: false, showInAndroidNotifications: false});
  }
  _playerStop() {
    ReactNativeAudioStreaming.stop();
  }
  _onPress() {
    switch (this.state.status) {
      case "PAUSED":
        ReactNativeAudioStreaming.resume();
        break;
      case "STOPPED":
      case "ERROR":
        this._playerStart();
        break;
      case "PLAYING":
      case "STREAMING":
      case "BUFFERING":
        this._playerStop();
        break;
    }
  }
  render() {
    return (
      <View style={styles.controlElements}>
        <PlayingBlock styleBlock={styles.nowBlock}
                      styleTitle={styles.nowTitle}
                      styleSubTitle={styles.nowSubTitle}
                      title="Зараз:"
                      text={this.state.current}/>
        <TouchableOpacity onPress={this._onPress}>
          <PlayButton status={this.state.status}/>
        </TouchableOpacity>
        <PlayingBlock styleBlock={styles.nextBlock}
                      styleTitle={styles.nextTitle}
                      styleSubTitle={styles.nextSubTitle}
                      title="Наступне:"
                      text={this.state.next}/>
      </View>
    )
  }
}

class PlayingBlock extends React.Component {
  render() {
    var title = " ";
    var text = " ";
    if (this.props.text) {
      title = this.props.title;
      text = this.props.text;
    }
    return (
      <View style={this.props.styleBlock}>
        <Text style={this.props.styleTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={this.props.styleSubTitle} numberOfLines={2}>
          {text}
        </Text>
      </View>
    );
  }
}

class PlayButton extends React.Component {
  render() {
    var button;
    switch (this.props.status) {
      case "PLAYING":
      case "STREAMING":
        button = <Image style={styles.playButton}
            source={require('../img/pause.png')}/>;
        break;
      case "PAUSED":
      case "STOPPED":
      case "ERROR":
        button = <Image style={styles.playButton}
            source={require('../img/play.png')}/>;
        break;
      case "BUFFERING":
      case "BUFFERING_START":
      case "START_PREPARING":
        button = <ActivityIndicator
            animating={true} style={styles.playButton}/>;
        break;
    }
    return button
  }
}

const styles = StyleSheet.create({
  controlElements: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'column',
    width: 300,
  },
  playButton: {
    width: 22,
    height: 29,
    margin: 20,
  },
  nowBlock: {
    alignItems: 'center',
    margin: 30,
    width: 300,
    height: 25,
  },
  nowTitle: {
    fontFamily: 'SFUIText-Regular',
    fontSize: 11,
    color: '#7c4f96',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  nowSubTitle: {
    fontFamily: 'SFUIText-Semibold',
    fontSize: 15,
    color: '#7c4f96',
    backgroundColor: 'rgba(0,0,0,0)',
    textAlign: 'center',
  },
  nextBlock: {
    alignItems: 'center',
    marginTop: 20,
    width: 300,
    height: 25,
  },
  nextTitle: {
    fontFamily: 'SFUIText-Regular',
    fontSize: 11,
    color: '#595959',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  nextSubTitle: {
    fontFamily: 'SFUIText-Semibold',
    fontSize: 13,
    color: '#595959',
    backgroundColor: 'rgba(0,0,0,0)',
    textAlign: 'center',
  },
});
