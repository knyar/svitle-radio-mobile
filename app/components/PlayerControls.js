/** @flow */

import React, { Component } from 'react';
import {
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';

export class PlayerControls extends Component {
  _onPressButton() {

  }
  _onLongPressButton() {

  }
  render() {
    return (
      <View style={styles.controlElements}>
      <TouchableOpacity onPress={this._onPressButton}
          onLongPress={this._onLongPressButton}>
        <PlayButton/>
      </TouchableOpacity>
      </View>
    )
  }
}

class PlayButton extends Component {
  render() {
    var source = require('../img/play.png');
    return (
      <Image style={styles.playButton} source={source}/>
    )
  }
}

const styles = StyleSheet.create({
  controlElements: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  playButton: {
    width: 22,
    height: 29,
    margin: 20,
  },
});
