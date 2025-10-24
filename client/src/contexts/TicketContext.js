import React, { createContext, useContext, useState } from 'react';

const TicketContext = createContext();

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([
    {
      _id: '1',
      title: 'WiFi not working in room A-101',
      description: 'The WiFi connection has been very slow and keeps disconnecting. Unable to attend online classes.',
      category: 'wifi',
      priority: 'high',
      status: 'open',
      student: {
        _id: 'student-1',
        name: 'Student User',
        email: 'student@example.com',
        roomNumber: 'A-101'
      },
      createdAt: new Date().toISOString(),
      comments: []
    },
    {
      _id: '2',
      title: 'Water leakage in bathroom',
      description: 'There is a continuous water leak from the pipe in the bathroom. Water is pooling on the floor.',
      category: 'maintenance',
      priority: 'medium',
      status: 'in_progress',
      student: {
        _id: 'student-1',
        name: 'Student User',
        email: 'student@example.com',
        roomNumber: 'A-101'
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      comments: [{ message: 'We have assigned a plumber to fix this issue.' }]
    },
    {
      _id: '3',
      title: 'Room cleaning request',
      description: 'Request for deep cleaning of the room as it has not been cleaned properly for a week.',
      category: 'cleaning',
      priority: 'low',
      status: 'resolved',
      student: {
        _id: 'student-1',
        name: 'Student User',
        email: 'student@example.com',
        roomNumber: 'A-101'
      },
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      comments: []
    },
    {
      _id: '4',
      title: 'Medical emergency - need first aid',
      description: 'Roommate has cut his hand and needs immediate first aid assistance.',
      category: 'medical',
      priority: 'urgent',
      status: 'resolved',
      student: {
        _id: 'student-1',
        name: 'Student User',
        email: 'student@example.com',
        roomNumber: 'A-101'
      },
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      comments: []
    },
    {
      _id: '5',
      title: 'Electricity issue - power cuts',
      description: 'Frequent power cuts in the room, especially during evening hours.',
      category: 'electricity',
      priority: 'high',
      status: 'open',
      student: {
        _id: 'student-2',
        name: 'Another Student',
        email: 'student2@example.com',
        roomNumber: 'B-205'
      },
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      comments: []
    }
  ]);

  const addTicket = (ticketData) => {
    const newTicket = {
      _id: Date.now().toString(),
      ...ticketData,
      createdAt: new Date().toISOString(),
      comments: []
    };
    setTickets(prev => [newTicket, ...prev]);
    return newTicket;
  };

  const updateTicket = (ticketId, updates) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket._id === ticketId 
          ? { ...ticket, ...updates }
          : ticket
      )
    );
  };

  const getTicketsByUser = (userId) => {
    return tickets.filter(ticket => ticket.student._id === userId);
  };

  const getAllTickets = () => {
    return tickets;
  };

  const getTicketById = (ticketId) => {
    return tickets.find(ticket => ticket._id === ticketId);
  };

  const value = {
    tickets,
    addTicket,
    updateTicket,
    getTicketsByUser,
    getAllTickets,
    getTicketById
  };

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
};
