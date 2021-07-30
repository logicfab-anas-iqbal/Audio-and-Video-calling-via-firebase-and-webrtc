import React, {useState, useRef, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Button from './components/Button';
import GettingCall from './components/GettingCall';
import Video from './components/Video';
import {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import Utils from './components/Utils';
import firestore from '@react-native-firebase/firestore';
import InCallManager from 'react-native-incall-manager';

const configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};

const App = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [gettingCall, setGettingCall] = useState(false);
  const [AudioCalling, setAudioCalling] = useState(true);
  const pc = useRef(null);
  const connecting = useRef(false);

  useEffect(() => {
    const cRef = firestore().collection('meet').doc('chatId');

    const subscribe = cRef.onSnapshot(snapshot => {
      const data = snapshot.data();

      //On answer start the call

      if (pc.current && !pc.current.remoteDescription && data && data.answer) {
        pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }

      //If there is offer for chatId set the getting call flag
      if (data && data.offer && !connecting.current) {
        InCallManager.startRingtone('_DEFAULT_');
        setGettingCall(true);
      }
    });

    /**
     * On Delete of collection call hangup
     * The Other side has clicked on hangup
     */
    const subscribeDelete = cRef.collection('callee').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type == 'removed') {
          hangup();
        }
      });
    });
    return () => {
      //cleanup
      subscribe();
      subscribeDelete();
    };
  }, []);

  const setupAudioWebrtc = async () => {
    setAudioCalling(true);
    pc.current = new RTCPeerConnection(configuration);

    //Get audio and video for the call
    const stream = await Utils.getAudioStream();

    console.log('Stream', stream);
    if (stream) {
      setLocalStream(stream);
      pc.current.addStream(stream);
    }

    //Get the remote stream once it is available
    pc.current.onaddstream = event => {
      setRemoteStream(event.stream);
    };
  };

  const setupVideoWebrtc = async () => {
    setAudioCalling(false);
    pc.current = new RTCPeerConnection(configuration);

    //Get audio and video for the call
    const stream = await Utils.getVideoStream();

    console.log('Stream', stream);
    if (stream) {
      setLocalStream(stream);
      pc.current.addStream(stream);
    }

    //Get the remote stream once it is available
    pc.current.onaddstream = event => {
      setRemoteStream(event.stream);
    };
  };

  const create = async TAG => {
    console.log('Calling');
    connecting.current = true;

    //setup webrtc
    if (TAG === 'AUDIO') {
      await setupAudioWebrtc();
    } else {
      await setupVideoWebrtc();
    }

    //Document for the call
    const cRef = firestore().collection('meet').doc('chatId');

    //Exchange the ICE candidates between the caller and callee
    collectIceCandidates(cRef, 'caller', 'callee');

    if (pc.current) {
      //Create the offer for the call
      //Store the offer under the document

      const offer = await pc.current.createOffer();
      pc.current.setLocalDescription(offer);

      const cWithOffer = {
        offer: {
          type: offer.type,
          sdp: offer.sdp,
          tag: TAG,
        },
      };

      cRef.set(cWithOffer);
      //OFFER ({user.id,cWithOffer})
    }
  };

  const join = async () => {
    InCallManager.stopRingtone();

    console.log('Joining the call');
    connecting.current = true;
    setGettingCall(false);

    const cRef = firestore().collection('meet').doc('chatId');
    const offer = (await cRef.get()).data()?.offer;

    if (offer) {
      if (offer?.tag === 'AUDIO') {
        await setupAudioWebrtc();
      } else {
        await setupVideoWebrtc();
      }

      //Exchange the ICE candidates
      // Check the parameters, Its reversed. Since the joining part is callee
      collectIceCandidates(cRef, 'callee', 'caller');

      if (pc.current) {
        pc.current.setRemoteDescription(new RTCSessionDescription(offer));

        //Create the answer for the call
        //Update the document with answer

        const answer = await pc.current.createAnswer();
        console.log("ANSWER",answer)
        pc.current.setLocalDescription(answer);

        const cWithAnswer = {
          answer: {
            type: answer.type,
            sdp: answer.sdp,
          },
        };
        cRef.update(cWithAnswer);
        //answer({user.id,cWithAnswer})
      }
    }
  };

  const hangup = async () => {
    InCallManager.stopRingtone();
    setGettingCall(false);
    connecting.current = false;
    streamCleanup();
    firestoreCleanup();
    if (pc.current) {
      pc.current.close();
    }
  };

  const streamCleanup = async () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream.release();
    }
    setLocalStream(null);
    setRemoteStream(null);
  };

  const firestoreCleanup = async () => {
    const cRef = firestore().collection('meet').doc('chatId');

    if (cRef) {
      const calleeCandidate = await cRef.collection('callee').get();
      calleeCandidate.forEach(async candidate => {
        await candidate.ref.delete();
      });
      const callerCandidate = await cRef.collection('caller').get();
      callerCandidate.forEach(async candidate => {
        await candidate.ref.delete();
      });
      cRef.delete();
    }
  };

  const collectIceCandidates = async (cRef, localName, remoteName) => {
    const candidateCollection = cRef.collection(localName);
    if (pc.current) {
      //On new ICE candidate add it to firestore
      pc.current.onicecandidate = event => {
        if (event.candidate) {
          candidateCollection.add(event.candidate);
          //CANDIDATE({user.id,event.candidate})
        }
      };

      //Get the ICE candidate added to firestore and update the local PC
      //LISTEN CANDIDATE
      cRef.collection(remoteName).onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type == 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.current?.addIceCandidate(candidate);
          }
        });
      });
    }
  };

  if (gettingCall) {
    return <GettingCall hangup={hangup} join={join} />;
  }

  if (localStream) {
    return (
      <Video
        hangup={hangup}
        localStream={localStream}
        remoteStream={remoteStream}
        audio={AudioCalling}
      />
    );
  }

  return (
    <View style={[styles.container, {flexDirection: 'row-reverse'}]}>
      <Button
        icon={require('./components/videoCall.png')}
        iconStyle={{
          height: 32,
          width: 32,
          resizeMode: 'contain',
          tintColor: '#fff',
        }}
        buttonContainer={{
          backgroundColor: '#d2d2d3',
          borderRadius: 100,
          padding: 10,
        }}
        buttonPress={() => create('VIDEO')}
      />
      <Button
        icon={require('./components/phone.png')}
        iconStyle={{
          height: 30,
          width: 30,
          resizeMode: 'contain',
          tintColor: '#fff',
        }}
        buttonContainer={{
          backgroundColor: '#000',
          borderRadius: 100,
          padding: 10,
          marginRight: 50,
        }}
        buttonPress={() => create('AUDIO')}
      />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
