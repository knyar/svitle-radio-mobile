/** @flow */

import React, { Component } from 'react';
import {
  Animated,
  Image,
  Linking,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

type LogoProps = {
  url: String,
}
export class SvitleLogo extends Component {
  state = {
    bounceValue: Animated.Value,
  }
  constructor(props: LogoProps) {
    super(props);
    this.state = {
      bounceValue: new Animated.Value(0),
    };
  }
  componentDidMount() {
    this.state.bounceValue.setValue(0.05);
    Animated.spring(                          // Base: spring, decay, timing
      this.state.bounceValue,                 // Animate `bounceValue`
      {
        toValue: 1,                           // Animate to original size
        tension: 70                           // Spring with default tension
      }
    ).start();
  }
  onPress() {
    Linking.openURL(this.props.url);
  }
  render() {
    const image = <Animated.Image
      style={[styles.logo, {transform: [
        {scale: this.state.bounceValue}
      ]}]}
      source={require('../img/logo.png')} />;
    if (this.props.url) {
      return (
        <TouchableOpacity onPress={(e) => this.onPress(e)}>
          {image}
        </TouchableOpacity>
      )
    } else {
      return image;
    }
  }
}

const styles = StyleSheet.create({
  logo: {
    width: 200,
    height: 91,
  },
});
