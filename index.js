const express = require('express')
const socketIO = require('socket.io')
const cors = require('cors')
const http = require('http')

const PORT = process.env.PORT || 5000 
const router = require('./router')
const { addUser, removeUser, getUser, getUserInRoom } = require('./user.js')

const app = express()
app.use(cors())

const server = http.createServer(app)

// solve cors issue
const options={
    cors:true,
    origins:["http://localhost:3000"],
}

const io = socketIO(server, options)

io.on('connection', (socket) => {
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room })

        if (error) return callback(error)

        socket.emit('message', { user: 'admin', text: `${user.name}, wellcome to the room ${user.room}` })
        socket.broadcast.to(user.room).emit('message',  { user: 'admin', text: `${user.name}, has joined!` })
        socket.join(user.room)
        io.to(user.room).emit('roomData', { room: user.room, users:getUserInRoom(user.room)})

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('message', { user: user.name, text: message })
        // io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom})
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left`})
        }
    })
})

app.use(router)

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`))