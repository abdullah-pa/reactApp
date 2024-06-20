import React, {useCallback, useState, useEffect} from 'react'
import {useSocket} from '../context/SocketProvider'
import {useNavigate} from 'react-router-dom'


const HomePage = () => {
  const [email, setEmail] = useState('');
  const [roomId, setRoomId] = useState('');
  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback((e) => {
    e.preventDefault();
    socket.emit("room:join", {email,roomId});
  }, [email, roomId, socket]);

  const handleRoomJoin = useCallback((data) => {
    const {email, roomId} = data;
    navigate(`/room/:${roomId}`);
    console.log(email, roomId);
  }, [navigate]);

  useEffect(() => {
    socket.on("room:join", handleRoomJoin);
    return () => {
      socket.off("room:join", handleRoomJoin);
     };
  }, [socket, handleRoomJoin]);

  
  return (
    <div className='homepage-container'>
      <h1>Lobby</h1>
      <form onSubmit={handleSubmitForm}>
        <label htmlFor='email'>Email id</label><input type='text' placeholder='example@mail.com' id='email' value={email} onChange={e => setEmail(e.target.value)}/>
        <br/>
        <label htmlFor='roomId'>Room id</label><input type='text' placeholder='RoomId' id='roomId' value={roomId} onChange={e => setRoomId(e.target.value)}/>
        <br/>
        <button>Join Room</button>
      </form>
      
    </div>
  )
}



export default HomePage

