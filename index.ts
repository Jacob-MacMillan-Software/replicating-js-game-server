import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({port: 3000});

interface IClients {
  [key: string]: WebSocket;
}

interface ILocations {
  [key: string]: {
    x: number;
    y: number;
  };
}

interface IEnemies {
  [key: string]: {
    health: number;
    nextDamageDealt: number;
    nextDamageTaken: number;
  };
}

const clients: IClients = {};
const lastLocation: ILocations = {};
const enemies: IEnemies = {};

const playerSpeed = 300;

function updateAllClients(message: string, excludeClient: string | undefined = undefined) {
  console.log(`Broadcasting message: ${message}`);

  // Loop through all clients and send message
  for (const clientId in clients) {
    if (clientId !== excludeClient) {
      clients[clientId].send(message);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  // generate client ID
  const clientId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  lastLocation[clientId] = {x: 0, y: 0};

  // add client to clients object
  // idk how to define the type
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
      lastLocation[clientId].x = parsedMessage[0];
      lastLocation[clientId].y = parsedMessage[1];

      updateAllClients(`${clientId}:position:${parsedMessage[0]},${parsedMessage[1]}`, clientId);

      console.log(lastLocation);
    } else if(req === 'moving') {
      updateAllClients(`${clientId}:moving:${message}`, clientId);
    } else if(req === "getPlayer") {
      if(message === 'all') {
        for (const otherClientId in clients) {
          if(otherClientId !== clientId) {
            ws.send(`connected:${otherClientId}`);
            ws.send(`${otherClientId}:position:${lastLocation[otherClientId].x},${lastLocation[otherClientId].y}`);
          }
        }
      } else {
        ws.send(`connected:${message}`);
        ws.send(`${clientId}:position:${lastLocation[message].x},${lastLocation[message].y}`);
      }
    } else if(req === "health") {
      if(!enemies[message]) {
        enemies[message] = {
          health: 370,
          nextDamageDealt: Math.random() * 230,
          nextDamageTaken: Math.random() * 230,
        };
      }
      
      ws.send(`health:${message}:${enemies[message].health},${enemies[message].nextDamageDealt},${enemies[message].nextDamageTaken}`);
    } else if(req === "damage") {
      if (enemies[message]) {
        enemies[message].health -= enemies[message].nextDamageTaken;
        enemies[message].nextDamageTaken = Math.random() * 230;
        enemies[message].nextDamageDealt = Math.random() * 230;
        
        ws.send(`health:${message}:${enemies[message].health},${enemies[message].nextDamageDealt},${enemies[message].nextDamageTaken}`);
      }
    }

  });

  ws.on('error', (error: Error) => {
    console.error(error);
    delete clients[clientId];

    // Notify all clients of disconnection
    updateAllClients(`disconnected:${clientId}`);
  });

  ws.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    delete clients[clientId];

    // Notify all clients of disconnection
    updateAllClients(`disconnected:${clientId}`);
  });

  ws.send(`id:${clientId}`);

  // Notify client of all other clients
  for (const otherClientId in clients) {
    if (otherClientId !== clientId) {
      ws.send(`connected:${otherClientId}`);
      ws.send(`${otherClientId}:position:${lastLocation[otherClientId].x},${lastLocation[otherClientId].y}`);
    }
  }

  // Inform all connected clients of new player
  updateAllClients(`connected:${clientId}`);

  console.log('Client connected');
});
