/** @flow */

import React, { Component } from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SvitleLogo } from './Logo';
import { SvitleRedirectBlocks } from './TextBlocks';
import { PlayerControls } from './PlayerControls';

export default class SvitleContainer extends Component {
  state = {
    redirect: Boolean,
  };
  constructor(props: Object) {
    super(props);
    this.state = {
      redirect: false,
    };
  }
  _onPressBottomLink() {
    Linking.openURL('https://svitle.org/');
  }
  render() {
    var logo, contents;
    if (this.state.redirect) {
      logo = <SvitleLogo url="https://itunes.apple.com/ua/app/svitle-radio/id1087280759"/>;
      contents = <SvitleRedirectBlocks/>;
    } else {
      logo = <SvitleLogo/>;
      contents = <PlayerControls/>;
    }
    return (
      <View style={styles.container}>
        <View style={styles.topHalf}>{logo}</View>
        <Image style={styles.bottomHalf} source={require('../img/bg.png')}>
          {contents}
          <TouchableOpacity onPress={this._onPressBottomLink}>
            <Text style={styles.bottomLink}>
              Сайт радіо
            </Text>
          </TouchableOpacity>
        </Image>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    backgroundColor: 'transparent',
  },
  topHalf: {
    flex: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomHalf: {
    flex: 54,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: null,
    height: null,
  },
  bottomLink: {
    fontFamily: 'SFUIText-Regular',
    fontSize: 11,
    color: '#393a35',
    backgroundColor: '#e1e1e3',
    padding: 4,
    borderRadius: 5,
    overflow: 'hidden',
    margin: 10,
  },
});
