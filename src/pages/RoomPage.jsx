import React, {useEffect, useCallback, useState}from 'react' 
import { useSocket } from '../context/SocketProvider'
import ReactPlayer from 'react-player';
import PeerService from '../service/PeerService';


const RoomPage = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSokcetId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isVisible2, setIsVisible2] = useState(true);

    const handleUserJoined = useCallback(({email, id}) => {
        setRemoteSokcetId(id);
        console.log(`email joined ${email} the room ${id}`);
    }, []);

    const handleUserCall = useCallback(async() => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video: true});
        setMyStream(stream);
        setIsVisible(false);
        setIsVisible2(false);
        const offer = await PeerService.getOffer();
        socket.emit("user:call", {to:remoteSocketId, offer});
    }, [socket, remoteSocketId])

    const handleIncomingCall = useCallback(async({from, offer}) => {
        setRemoteSokcetId(from);
        const ans = await PeerService.getAnswer(offer);
        const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video: true});
        setMyStream(stream);
        setIsVisible2(true);
        socket.emit("call:accepted", {to:from, ans});
        setIsVisible(false);

    }, [socket]);

    const sendStream = useCallback(() => {
        for (const track of myStream.getTracks()) {
            PeerService.peer.addTrack(track, myStream);
        }
    }, [myStream]) ;

    const acceptCall = useCallback(() => {
        sendStream();
        setIsVisible2(false);
    }, [sendStream])

    const sendPeerStream = useCallback(() => {
        socket.emit('peer:stream:needed', {to:remoteSocketId})
    }, [socket]);

    const handleAcceptedCall = useCallback(async({from, ans}) => {
        await PeerService.setRemoteDescription(ans);
        sendStream();
        
    }, [sendStream]);

    const handleNegotiationNeeded = useCallback(async() => {
        const offer = await PeerService.getOffer();
        socket.emit('peer:nego:needed', {offer, to:remoteSocketId});
    }, [remoteSocketId, socket]);

    const handleTrack = useCallback(async ev => {
        const remoteStream = ev.streams;
        setRemoteStream(remoteStream[0]);
    }, [])

    const handleNegotiationAccept = useCallback(async ({from, offer}) => {
        const ans = await PeerService.getAnswer(offer);
        socket.emit("peer:nego:done", {to: from, ans})
    }, [socket]);

    const handleNegotiationFinal = useCallback(async({from, ans})=> {
        await PeerService.setRemoteDescription(ans);
    }, [])


    useEffect(() => {
        PeerService.peer.addEventListener('negotiationneeded', handleNegotiationNeeded);
        return () => {
            PeerService.peer.removeEventListener('negotiationneeded', handleNegotiationNeeded);
        }
    }, [handleNegotiationNeeded]);

    useEffect(() => {
        PeerService.peer.addEventListener('track', handleTrack);
        return () => {
            PeerService.peer.removeEventListener('track', handleTrack);
        }
    }, [handleTrack]);

    useEffect(() => {
        socket.on("user:joined", handleUserJoined);
        socket.on("incoming:call", handleIncomingCall);
        socket.on("call:accepted", handleAcceptedCall);
        socket.on("peer:nego:needed", handleNegotiationAccept);
        socket.on("peer:nego:final", handleNegotiationFinal);
        socket.on("peer:stream:needed", sendStream);
        return() => {
            socket.off("user:joined", handleUserJoined);
            socket.off("incoming:call", handleIncomingCall);
            socket.off("call:accepted", handleAcceptedCall);
            socket.off("peer:nego:needed", handleNegotiationAccept);
            socket.off("peer:nego:final", handleNegotiationFinal);
            socket.off("peer:stream:needed", sendStream);
        };
    }, [socket, handleUserJoined, handleIncomingCall, handleAcceptedCall, handleNegotiationAccept, handleNegotiationFinal, sendStream]);

    return(
        <div>
            <h1>RoomPage</h1>
            <h4>{remoteSocketId ? 'connected' : 'not connected'}</h4>
            {isVisible && remoteSocketId && <button id='callButton' onClick={handleUserCall}>Call</button>}
            {isVisible2 && myStream && <button onClick={acceptCall}>Accept Call</button>}
            {myStream && (
                <>
                <h1>My Stream</h1>
            <ReactPlayer height='200px' width='200px' playing muted url={myStream}></ReactPlayer>
            </>)}

            {remoteStream && (
                <>
                <h1>Remote Stream</h1>
            <ReactPlayer height='200px' width='200px' playing muted url={remoteStream}></ReactPlayer>
            </>)}
        </div>
    );
}

export default RoomPage;