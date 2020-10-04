const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const fs = require('fs')

const database = JSON.parse(fs.readFileSync(__dirname + '/database.json'))

app.get('/', (req, res) => {
    res.status(200).send("This application has no interface! Everything is working alright!")
})

app.get('/chat', (req, res) => {
    res.status(200).send(database)
})

io.on('connection', (socket) => {
    console.log('Socket ' + socket.id + ' has connected')

    socket.emit('LIST_ROOMS', {
        rooms: database.map(({ id, name, description }) => ({ id, name, description }))
    })

    socket.on('ENTER_ROOM', (data) => {
        const room = database.find(a => a.id === data.room)

        room.participants.push(data)
        socket.extra = data

        socket.join(room.name)
        socket.emit('ROOM_DETAILS', room)
    })

    socket.on('SEND_MESSAGE', (msg) => {
        const room = database.find(a => a.id === msg.room)

        io.to(room.name).emit('SEND_MESSAGE', msg)
    })

    socket.on('disconnect', () => {
        console.log('Socket ' + socket.id + ' has disconnected')
        const room = database.find(a => a.id === socket.extra.room)
        room.participants = room.participants.filter(a => a.id !== socket.extra.id)
        io.to(room.name).emit('SEND_MESSAGE', { name: 'System', text: socket.extra.name + ' saiu da sala!' })
    })
})

http.listen(3000, () => {
    console.log("SocketIO is listening on port 3000!");
    console.log("To connect a new client to the chat room just run `node client.js`")
})
