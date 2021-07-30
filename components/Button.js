import React from 'react';
import {Image, StyleSheet, TouchableOpacity} from 'react-native';

const Button = ({icon, iconStyle, buttonContainer, buttonPress}) => {
  return (
    <TouchableOpacity onPress={buttonPress} style={buttonContainer}>
      <Image source={icon} style={iconStyle} />
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({});
