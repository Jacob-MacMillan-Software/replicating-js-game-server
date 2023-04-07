import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({port: 3000});

const clients = {};
const lastLocation = {};

const playerSpeed = 300;

function updateAllClients(message: string, excludeClient: string | undefined = undefined) {
  console.log(`Broadcasting message: ${message}`);

  // Loop through all clients and send message
  // @ts-ignore
  for (const clientId in clients) {
    if (clientId !== excludeClient) {
      // @ts-ignore
      clients[clientId].send(message);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  // generate client ID
  const clientId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  // @ts-ignore
  lastLocation[clientId] = {x: 0, y: 0};

  // add client to clients object
  // idk how to define the type
  // @ts-ignore
  clients[clientId] = ws;

  ws.on('message', (rawMessage: string) => {
    console.log(`Received message from ${clientId} => ${rawMessage}`);

    // parse message
    const [req, message] = rawMessage.toString().split(':');

    if(req === 'position') {
      const messagearr = message.split(',');
      const parsedMessage = [parseFloat(messagearr[0]), parseFloat(messagearr[1])];
      console.log(parsedMessage);


      // TODO: check if the player can actually walk there
      // for now just assume they can
      // @ts-ignore
      lastLocation[clientId].x = parsedMessage[0];
      // @ts-ignore
      lastLocation[clientId].y = parsedMessage[1];

      updateAllClients(`${clientId}:position:${parsedMessage[0]},${parsedMessage[1]}`, clientId);

      console.log(lastLocation);
    } else if(req === 'moving') {
      updateAllClients(`${clientId}:moving:${message}`, clientId);
    } else if(req === "getPlayer") {
      if(message === 'all') {
        // @ts-ignore
        for (const otherClientId in clients) {
          if(otherClientId !== clientId) {
            // @ts-ignore
            ws.send(`connected:${otherClientId}`);
            // @ts-ignore
            ws.send(`${otherClientId}:position:${lastLocation[otherClientId].x},${lastLocation[otherClientId].y}`);
          }
        }
      } else {
        // @ts-ignore
        ws.send(`connected:${message}`);
        // @ts-ignore
        ws.send(`${clientId}:position:${lastLocation[message].x},${lastLocation[message].y}`);
      }
    }

  });

  ws.on('error', (error: Error) => {
    console.error(error);
    // @ts-ignore
    delete clients[clientId];

    // Notify all clients of disconnection
    updateAllClients(`disconnected:${clientId}`);
  });

  ws.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    // @ts-ignore
    delete clients[clientId];

    // Notify all clients of disconnection
    updateAllClients(`disconnected:${clientId}`);
  });

  ws.send(`id:${clientId}`);

  // Notify client of all other clients
  // @ts-ignore
  for (const otherClientId in clients) {
    if (otherClientId !== clientId) {
      ws.send(`connected:${otherClientId}`);
      // @ts-ignore
      ws.send(`${otherClientId}:position:${lastLocation[otherClientId].x},${lastLocation[otherClientId].y}`);
    }
  }

  // Inform all connected clients of new player
  updateAllClients(`connected:${clientId}`);

  console.log('Client connected');
});
