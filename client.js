const prompts = require('prompts')
const socketioclient = require('socket.io-client')
const repl = require('repl')

async function main() {
    const socket = socketioclient('http://localhost:3000')

    console.log("\n\n===GRUPOU===\n\n")

    socket.on('connect', function(arg) {
    })

    socket.on('event', function(data){
        console.log(data)
    })

    let me = null

    socket.on('LIST_ROOMS', async ({ rooms }) => {
        const ids = rooms.map(a => a.id)

        console.log(rooms.map(room => {
            return `[${room.id}] - ${room.name} (${room.description})`
        }).join("\n") + "\n")

        const response = await prompts([
            {
                type: 'number',
                name: 'room',
                message: 'Informe número do grupo que deseja entrar: ',
                validate: room => !ids.includes(room) ? `Número de grupo inválido` : true
            },
            {
                type: 'text',
                name: 'name',
                message: 'Informe o seu nome: ',
                validate: name => name === "" ? `Nome inválido!` : true
            }
        ])

        response.id = +new Date()

        me = response

        socket.emit('ENTER_ROOM', response)
    })

    socket.on('ROOM_DETAILS', async (data) => {
        console.log('\n\nSala: ' + data.name)
        console.log('Descrição: ' + data.description)
        console.log('Participantes: ' + data.participants.map(a => a.name).join(", "))
        console.log('\nMensagens: ')
        console.log(data.messages.map(a => {
            return `[${data.participants.find(b => b.id === a.from).name}]: ${a.text}`
        }).join("\n"))

        repl.start({
            prompt: '',
            eval: (msg) => {
                msg = msg.slice(0, -1)
                socket.emit('SEND_MESSAGE', { text: msg, ...me })
            }
        })
    })

    socket.on('SEND_MESSAGE', async (msg) => {
        if (msg.id !== me.id) process.stdout.write(`[${msg.name}]: ${msg.text}\n`)
    })

    socket.on('disconnect', function() {

    })
}

main()