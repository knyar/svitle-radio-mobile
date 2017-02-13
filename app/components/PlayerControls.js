/** @flow */

import React, { Component } from 'react';
import {
  Image,
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  DeviceEventEmitter,
  TouchableOpacity,
} from 'react-native';

import { ReactNativeAudioStreaming } from 'react-native-audio-streaming';

const STREAM_URL = "https://m.svitle.org/listen.php";

export class PlayerControls extends Component {
  _onPress: Function;
  _updateNowPlaying: Function;
  timer: number;
  subscription: Object;

  state = {
    status: String,
    playingCurrent: String,
    playingNext: String,
  }

  constructor(props: Object) {
    super(props);
    this._onPress = this._onPress.bind(this);
    this._updateNowPlaying = this._updateNowPlaying.bind(this);
    this.state = {
      status: "STOPPED",
      playingCurrent: "",
      playingNext: "",
    };
    this._updateNowPlaying();
  }
  componentDidMount() {
    this.subscription = DeviceEventEmitter.addListener(
      "AudioBridgeEvent", (evt) => {
        if (evt.status === "METADATA_UPDATED") {
          this._updateNowPlaying();
        } else {
          this.setState({status: evt.status});
        }
      }
    );

    ReactNativeAudioStreaming.getStatus((error, msg) => {
      (error) ? console.log(error) : this.setState({status: msg.status})
    });

    // Update "Now Playing" every 60 seconds.
    this.timer = setInterval(() => {
      this._updateNowPlaying();
    }, 60000);
  }
  componentWillUnmount() {
    clearInterval(this.timer);
    this.subscription.remove();
    ReactNativeAudioStreaming.stop();
  }
  _updateNowPlaying() {
    fetch("https://m.svitle.org/nowplaying.php")
    .then((response) => response.json())
    .then((responseData) => {
      var state = {
        playingCurrent: responseData.current,
        playingNext: "",
      };
      if (responseData.next) {
        state.playingNext = responseData.next;
      }
      this.setState(state);
    })
    .catch((error) => {
      console.log("Error fetching nowplaying: " + error);
      this.setState({
        playingCurrent: "",
        playingNext: "",
      });
    });
  }
  _onPress() {
    switch (this.state.status) {
      case "PAUSED":
        ReactNativeAudioStreaming.resume();
        break;
      case "STOPPED":
      case "ERROR":
        ReactNativeAudioStreaming.play(STREAM_URL,
          {showIniOSMediaCenter: true, showInAndroidNotifications: true});
        break;
      case "PLAYING":
      case "STREAMING":
      case "BUFFERING":
        ReactNativeAudioStreaming.stop();
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
                      text={this.state.playingCurrent}/>
        <TouchableOpacity onPress={this._onPress}>
          <PlayButton status={this.state.status}/>
        </TouchableOpacity>
        <PlayingBlock styleBlock={styles.nextBlock}
                      styleTitle={styles.nextTitle}
                      styleSubTitle={styles.nextSubTitle}
                      title="Наступне:"
                      text={this.state.playingNext}/>
      </View>
    )
  }
}

class PlayingBlock extends Component {
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

class PlayButton extends Component {
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
  },
  nowSubTitle: {
    fontFamily: 'SFUIText-Semibold',
    fontSize: 15,
    color: '#7c4f96',
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
  },
  nextSubTitle: {
    fontFamily: 'SFUIText-Semibold',
    fontSize: 13,
    color: '#595959',
    textAlign: 'center',
  },
});
