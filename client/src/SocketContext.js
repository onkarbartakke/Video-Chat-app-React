import React , {createContext , useState , useRef , useEffect } from 'react';
import {io} from 'socket.io-client';
import Peer from 'simple-peer';
//import { children } from 'react';

const SocketContext = createContext();
//http://localhost:5000
const socket = io('https://video-chat-app-onkar.herokuapp.com/');

const ContextProvider = ({children})=>{

    const [stream , setStream ] = useState(null);
    const [me , setMe] = useState('');
    const [call ,setCall] = useState({});
    const [callAccepted , setcallAccepted] = useState(false);
    const [callEnded , setcallEnded] = useState(false);
    const [name , setName] = useState('');

    const myVideo = useRef(null);
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(()=>{
        navigator.mediaDevices.getUserMedia({video : true , audio : true})  //retruns a promise
            .then((currentStream)=>{
                setStream(currentStream); 

               // myVideo.current.srcObject = currentStream;
                myVideo.current.srcObject = currentStream;
            });

        socket.on('me' , (id)=> setMe(id));

        socket.on('callUser', ({from , name : callerName , signal})=>{

            setCall({isReceivedCall : true , from , name : callerName, signal});
        }); 

    },[]);

    const answerCall = ()=>{
        setcallAccepted(true);

        const peer = new Peer({initiator : false , trickle: false , stream});

        peer.on('signal' , (data)=>{
            socket.emit('answerCall',{signal : data , to : call.from});
        });

        peer.on('stream' , (currentStream)=>{
            userVideo.current.srcObject = currentStream;
        });

        peer.signal(call.signal);

        connectionRef.current = peer;
    }

    const callUser = (id)=>{

        const peer = new Peer({initiator : true , trickle: false , stream});

        peer.on('signal' , (data)=>{
            socket.emit('callUser',{userToCall : id , signalData : data, from : me  , name });
        });

        peer.on('stream' , (currentStream)=>{
            userVideo.current.srcObject = currentStream;
        });

        socket.on('callAccepted', (signal)=>{
            setcallAccepted(true);
            peer.signal(signal);
        });

        connectionRef.current = peer;
    }

    const leaveCall = ()=>{

        setcallEnded(true);
        connectionRef.current.destroy();

        window.location.reload();
    }

    return (
        <SocketContext.Provider value={{
            call,
            callAccepted,
            myVideo,
            userVideo,
            stream,
            name,
            setName,
            callEnded,
            me,
            callUser,
            leaveCall,
            answerCall,
        }}>

        {children}

        </SocketContext.Provider>
    );
}

export {ContextProvider , SocketContext};