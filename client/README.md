# TrackNow Frontend

React-based frontend for real-time order tracking with WebSocket integration.

## Features
- Create new orders
- View all orders
- Real-time order tracking
- Live status updates via WebSockets
- Responsive design

## Tech Stack
- React 18
- React Router for navigation
- Axios for API calls
- WebSocket for real-time updates
- CSS3 for styling

## Environment Variables

Create a `.env` file:
```
REACT_APP_ORDER_SERVICE_URL=http://localhost:3001
REACT_APP_STATUS_SERVICE_URL=http://localhost:3002
REACT_APP_WS_URL=ws://localhost:8080
```

## Development

```bash
npm install
npm start
```

Open http://localhost:3000

## Build for Production

```bash
npm run build
```

## Components

- **CreateOrder**: Form to create new orders
- **OrderList**: Display all orders
- **OrderTracking**: Real-time order tracking with WebSocket

## Services

- **api.js**: REST API integration
- **websocket.js**: WebSocket client service
