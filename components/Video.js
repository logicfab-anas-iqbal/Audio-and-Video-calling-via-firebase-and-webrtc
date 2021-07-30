import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MediaStream, MediaStreamTrack, RTCView} from 'react-native-webrtc';
import Button from './Button';
import InCallManager from 'react-native-incall-manager';

const video = ({hangup, localStream, remoteStream, audio}) => {
  const [MIC, setMIC] = useState(true);
  const [SPEAKER, setSPEAKER] = useState(false);
  const handleSwitchCamera = () => {
    localStream.getVideoTracks().forEach(track => {
      track._switchCamera();
    });
  };

  //On the call we will just display the local stream
  if (localStream && !remoteStream && !audio) {
    return (
      <View style={styles.container}>
        <RTCView
          streamURL={localStream.toURL()}
          objectFit="cover"
          style={styles.video}
        />
        <Button
          icon={require('./cameraSwitch.png')}
          iconStyle={{
            height: 25,
            width: 25,
            resizeMode: 'contain',
            tintColor: '#000',
          }}
          buttonContainer={{
            backgroundColor: '#f9f9f9',
            borderRadius: 100,
            padding: 10,
            position: 'absolute',
            top: 30,
            alignSelf: 'center',
            right: 30,
          }}
          buttonPress={handleSwitchCamera}
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
            position: 'absolute',
            bottom: 30,
            alignSelf: 'center',
          }}
          buttonPress={hangup}
        />
      </View>
    );
  }
  //On call connected will display the local stream on the top of remote stream
  if (localStream && remoteStream && !audio) {
    return (
      <View style={styles.container}>
        <RTCView
          streamURL={remoteStream.toURL()}
          objectFit="cover"
          style={styles.video}
        />
        <RTCView
          streamURL={localStream.toURL()}
          objectFit="cover"
          style={styles.videoLocal}
        />
        <Button
          icon={require('./cameraSwitch.png')}
          iconStyle={{
            height: 25,
            width: 25,
            resizeMode: 'contain',
            tintColor: '#000',
          }}
          buttonContainer={{
            backgroundColor: '#f9f9f9',
            borderRadius: 100,
            padding: 10,
            position: 'absolute',
            top: 30,
            alignSelf: 'center',
            right: 30,
          }}
          buttonPress={handleSwitchCamera}
        />

        <Button
          icon={!MIC ? require('./micMuted.png') : require('./mic.png')}
          iconStyle={{
            height: 25,
            width: 25,
            resizeMode: 'contain',
            tintColor: '#fff',
          }}
          buttonContainer={{
            backgroundColor: !MIC ? 'black' : 'green',
            borderRadius: 100,
            padding: 10,
            position: 'absolute',
            bottom: 30,
            alignSelf: 'center',
            left: 30,
          }}
          buttonPress={() => {
            if (MIC) {
              InCallManager.setMicrophoneMute(false);
              setMIC(false);
            } else {
              InCallManager.setMicrophoneMute(true);
              setMIC(true);
            }
          }}
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
            position: 'absolute',
            bottom: 30,
            alignSelf: 'center',
          }}
          buttonPress={hangup}
        />

        <Button
          icon={
            !SPEAKER
              ? require('./speakerMuted.png')
              : require('./speakerVolumed.png')
          }
          iconStyle={{
            height: 25,
            width: 25,
            resizeMode: 'contain',
            tintColor: '#fff',
          }}
          buttonContainer={{
            backgroundColor: !SPEAKER ? 'black' : 'green',
            borderRadius: 100,
            padding: 10,
            position: 'absolute',
            bottom: 30,
            alignSelf: 'center',
            right: 30,
          }}
          buttonPress={() => {
            if (SPEAKER) {
              InCallManager.setSpeakerphoneOn(false);
              setSPEAKER(false);
            } else {
              InCallManager.setSpeakerphoneOn(true);
              setSPEAKER(true);
            }
          }}
        />
      </View>
    );
  }

  return (
    <>
      <Text
        style={{
          fontSize: 20,
          position: 'absolute',
          top: 100,
          alignSelf: 'center',
          fontWeight: 'bold',
        }}>
        Audio Call
      </Text>
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
          position: 'absolute',
          bottom: 30,
          alignSelf: 'center',
        }}
        buttonPress={hangup}
      />
    </>
  );
};

export default video;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  video: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  videoLocal: {
    position: 'absolute',
    height: 150,
    width: 100,
    top: 10,
    left: 20,
    elevation: 10,
  },
});
