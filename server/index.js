const express=require('express');
const socketio=require('socket.io');
const http=require('http');
const cors=require('cors');

const {addUser,removeUser,getUser,getUsersinRoom} =require("./users");

const PORT=process.env.PORT || 5000;

const router=require('./router');
const app=express();
const server=http.createServer(app);
const io=socketio(server);

app.use(router);
app.use(cors());

io.on('connection',(socket) =>{

    socket.on('join',(arg,callback) => {
        console.log("user has joined")
        const {name,room}=arg;

       const {error,user}=addUser({id:socket.id,name:name,room:room});
       if(error){
           return callback(error);
       }

       socket.emit('message',{user:'admin',text:`${user.name} welcome to the room ${user.room}`});

       socket.broadcast.to(user.room).emit('message',{user:'admin',text:`${user.name} has joined`});

       socket.join(user.room);

       io.to(user.room).emit('roomData',{room:user.room,users:getUsersinRoom(user.room)});

       callback();

        // const error=true;

        // if(error){
        //     callback({error:'error'})
        // }
    });

    socket.on('sendMessage',(message,callback)=>{
        const user=getUser(socket.id);

        io.to(user.room).emit('message',{user:user.name,text:message});

        io.to(user.room).emit('roomData',{room:user.room,users:getUsersinRoom(user.room)});

        callback();
    });

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message',{user:'admin',text:`${user.name} has left`});
        }
    });

})



server.listen(PORT,()=>console.log("Server has started"));