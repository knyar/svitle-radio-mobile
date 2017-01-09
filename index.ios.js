/** @flow */

import React, { Component } from 'react';
import {
  AppRegistry,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default class SvitleRedirect extends Component {
  _onPressBottomLink() {
    Linking.openURL('http://svitle.org/');
  }
  _onPressTopLink() {
    Linking.openURL(
      'https://itunes.apple.com/ua/app/svitle-radio/id1087280759');
  }
  render() {
    return (
      <View style={styles.appContainer}>
        <View style={styles.topHalf}>
          <TouchableOpacity onPress={this._onPressTopLink}>
            <Image style={styles.appLogo} source={require('./img/logo.png')} />
          </TouchableOpacity>
        </View>
        <Image style={styles.bottomHalf} source={require('./img/bg.png')}>
          <View style={styles.textBlocks}>
            <Text style={styles.textBlock}>
              На жаль, ця версія радіопрогравача вже не підтримується.
            </Text>
            <Text style={styles.textBlockBold}>
              Будь ласка, натисніть на логотип радіо, щоб безкоштовно
              завантажити нову версію. Після цього видалите цю стару версію з
              вашого пристрою.
            </Text>
            <Text style={styles.textBlock}>
              Просимо вибачення за ці незручності, викликані обмеженнями
              платформи Apple.
            </Text>
          </View>
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
  appContainer: {
    flex: 1,
    alignItems: 'stretch',
    backgroundColor: 'transparent',
  },
  topHalf: {
    flex: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLogo: {
    width: 200,
    height: 91,
  },
  bottomHalf: {
    flex: 54,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: null,
    height: null,
  },
  textBlocks: {
   alignItems: 'center',
   margin: 20,
   width: 300,
  },
  textBlock: {
    fontFamily: 'SFUIText-Regular',
    textAlign: 'center',
    margin: 5,
  },
  textBlockBold: {
    fontFamily: 'SFUIText-Semibold',
    textAlign: 'center',
    margin: 5,
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

AppRegistry.registerComponent('SvitleRedirect', () => SvitleRedirect);
