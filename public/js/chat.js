const socket = io()
//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate =document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight
    
    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far are we scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage)

    const html = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        locationMessage: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('hh:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault() //prevent page refresh on submit

    $messageFormButton.setAttribute('disabled', 'disabled') //Disable button once submitted


    const sendMessage = event.target.elements.message.value
    socket.emit('sendMessage', sendMessage, (error) => {
        $messageFormButton.removeAttribute('disabled') //Re-enable button
        $messageFormInput.value = '' //Clear form field
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }

        console.log('Message Delivered')
    })
})

$sendLocation.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    $sendLocation.setAttribute('disabled', 'disabled') //Disable button
    
    navigator.geolocation.getCurrentPosition((position, error)  => {
        if (error) {
            console.log(error)
            console.log('Unable to find your location')
        }

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (acknowledged) => {
            $sendLocation.removeAttribute('disabled')
            if (acknowledged) {
                return console.log(acknowledged)
            }
            console.log('Failed to share location')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href= '/'
    }
})