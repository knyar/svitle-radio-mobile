/** @flow */

import React from 'react';
import Reflux from 'reflux';
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  View,
} from 'react-native';

import { SvitleLogo } from './Logo';
import { PlayerControls } from './PlayerControls';
import { Actions, MetadataStore } from './Metadata';

export default class SvitleContainer extends Reflux.Component {
  constructor(props: Object) {
    super(props);
    this.store = MetadataStore;
  }
  _onPressBottomLink() {
    Linking.openURL('https://svitle.org/');
  }
  render() {
    var contents;
    if (!this.state.streamUrl) {
      contents = <ActivityIndicator animating={true}/>;
    } else {
      contents = <PlayerControls/>;
    }
    return (
      <View style={styles.container}>
        <View style={styles.topHalf}><SvitleLogo/></View>
        <View style={styles.bottomHalf}>
          <Image style={styles.bottomHalfBG} source={require('../img/bg.png')}/>
          {contents}
          <TouchableOpacity onPress={this._onPressBottomLink}>
            <Text style={styles.bottomLink}>
              Сайт радіо
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    backgroundColor: 'white',
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
  bottomHalfBG: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
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
