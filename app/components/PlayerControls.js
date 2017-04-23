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
} from 'react-native';

import { ReactNativeAudioStreaming } from 'react-native-audio-streaming';

import { Actions, MetadataStore } from './Metadata';

export class PlayerControls extends Reflux.Component {
  _onPress: Function;
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
  }
  componentWillUnmount() {
    this.subscription.remove();
    ReactNativeAudioStreaming.stop();
  }
  _onPress() {
    switch (this.state.status) {
      case "PAUSED":
        ReactNativeAudioStreaming.resume();
        break;
      case "STOPPED":
      case "ERROR":
        ReactNativeAudioStreaming.play(this.state.streamUrl,
          {showIniOSMediaCenter: true, showInAndroidNotifications: false});
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
