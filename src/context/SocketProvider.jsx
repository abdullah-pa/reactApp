import React, {createContext, useMemo, useContext} from 'react'
import {io}  from 'socket.io-client'

const SocketContext = createContext(null);

export const useSocket = () => {
    const socket = useContext(SocketContext);
    return socket;
};

export const SocketProvider = (props) => {
    const socket = useMemo(() => {
        return io("https://192.168.6.159:8000", {
            secure: true,
            rejectUnauthorized: false 
        });
    }, []);
    return (
        <SocketContext.Provider value={socket}>
            {props.children}
        </SocketContext.Provider>
    );
    
};

