/** @flow */

import React, { Component } from 'react';
import {
  AppRegistry,
} from 'react-native';

import SvitleContainer from './app/components/Container';

export default class SvitleRadio extends Component {
  render() {
    return (
      <SvitleContainer/>
    );
  }
}

AppRegistry.registerComponent('SvitleRadio', () => SvitleRadio);
