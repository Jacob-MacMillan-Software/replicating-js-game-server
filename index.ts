import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({port: 3000});

wss.on('connection', (ws: WebSocket) => {
  const lastLocation = {x: 0, y: 0};

  ws.on('message', (message: string[]) => {
    console.log(`Received message => ${message}`);
    const messagearr = message.toString().split(',');
    const parsedMessage = [parseInt(messagearr[0], 10), parseInt(messagearr[1], 10)];
    console.log(parsedMessage);
    
    
    // TODO: check if the player can actually walk there
    // for now just assume they can
    lastLocation.x = parsedMessage[0];
    lastLocation.y = parsedMessage[1];

    ws.send(`position: ${parsedMessage[0]},${parsedMessage[1]}`);

    console.log(lastLocation);
  });

  ws.on('error', console.error);
  ws.on('close', console.log);

  ws.send('something');
  console.log('Client connected');
});
