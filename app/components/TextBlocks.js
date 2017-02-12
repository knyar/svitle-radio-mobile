/** @flow */

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export class SvitleRedirectBlocks extends Component {
  render() {
    return (
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
    )
  }
}

const styles = StyleSheet.create({
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
});
