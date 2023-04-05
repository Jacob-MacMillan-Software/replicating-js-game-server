import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({port: 3000});

const clients = {};

function updateAllClients(message: string) {
  console.log(`Broadcasting message: ${message}`);

  // Loop through all clients and send message
  // @ts-ignore
  for (const clientId in clients) {
    // @ts-ignore
    clients[clientId].send(message);
  }
}

wss.on('connection', (ws: WebSocket) => {
  // generate client ID
  const clientId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const lastLocation = {x: 0, y: 0};
  
  // add client to clients object
  // idk how to define the type
  // @ts-ignore
  clients[clientId] = ws;

  ws.on('message', (message: string[]) => {
    console.log(`Received message from ${clientId} => ${message}`);
    const messagearr = message.toString().split(',');
    const parsedMessage = [parseFloat(messagearr[0]), parseFloat(messagearr[1])];
    console.log(parsedMessage);
    
    
    // TODO: check if the player can actually walk there
    // for now just assume they can
    lastLocation.x = parsedMessage[0];
    lastLocation.y = parsedMessage[1];

    updateAllClients(`${clientId}:position:${parsedMessage[0]},${parsedMessage[1]}`);

    console.log(lastLocation);
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
    }
  }
  
  // Inform all connected clients of new player
  updateAllClients(`connected:${clientId}`);

  console.log('Client connected');
});
