const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map(); // Map to store client connections

        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });
    }

    handleConnection(ws, req) {
        // Extract token from query string
        const token = new URL(req.url, 'ws://localhost').searchParams.get('token');
        
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;

            // Store client connection
            this.clients.set(userId, ws);

            // Handle client messages
            ws.on('message', (message) => {
                this.handleMessage(userId, message);
            });

            // Handle client disconnection
            ws.on('close', () => {
                this.clients.delete(userId);
            });

            // Send initial connection success message
            ws.send(JSON.stringify({
                type: 'connection',
                status: 'success'
            }));

        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Authentication failed'
            }));
            ws.close();
        }
    }

    handleMessage(userId, message) {
        try {
            const data = JSON.parse(message);
            // Handle different message types
            switch (data.type) {
                case 'ticket_update':
                    this.broadcastToAdmins({
                        type: 'ticket_update',
                        data: data.ticket
                    });
                    break;
                case 'notification':
                    this.sendToUser(data.userId, {
                        type: 'notification',
                        data: data.notification
                    });
                    break;
            }
        } catch (error) {
            console.error('WebSocket message handling error:', error);
        }
    }

    sendToUser(userId, data) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    }

    broadcastToAdmins(data) {
        this.clients.forEach((client, userId) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }

    notifyTicketUpdate(ticketId, update) {
        const data = {
            type: 'ticket_update',
            ticketId,
            update
        };
        this.broadcastToAdmins(data);
    }

    notifyNewTicket(ticket) {
        const data = {
            type: 'new_ticket',
            ticket
        };
        this.broadcastToAdmins(data);
    }
}

module.exports = WebSocketServer;