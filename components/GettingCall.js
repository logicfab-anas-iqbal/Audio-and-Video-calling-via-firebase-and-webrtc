import React from 'react';
import {ImageBackground, StyleSheet, Text, View} from 'react-native';
import Button from './Button';

const GettingCall = ({hangup, join}) => {
  return (
    <ImageBackground
      source={require('./bg.jpg')}
      style={{
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
      }}>
      <Text style={{fontWeight: 'bold', fontSize: 20}}>Someone is Calling</Text>

      <View
        style={{
          flexDirection: 'row-reverse',
          width: 150,
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'absolute',
          bottom: 30,
          alignSelf: 'center',
        }}>
        <Button
          icon={require('./phone.png')}
          iconStyle={{
            height: 25,
            width: 25,
            resizeMode: 'contain',
            tintColor: '#fff',
          }}
          buttonContainer={{
            backgroundColor: 'green',
            borderRadius: 100,
            padding: 10,
          }}
          buttonPress={join}
        />
        <Button
          icon={require('./phone.png')}
          iconStyle={{
            height: 25,
            width: 25,
            resizeMode: 'contain',
            tintColor: '#fff',
          }}
          buttonContainer={{
            backgroundColor: 'red',
            borderRadius: 100,
            padding: 10,
         
          }}
          buttonPress={hangup}
        />
      </View>
    </ImageBackground>
  );
};

export default GettingCall;

const styles = StyleSheet.create({});
