import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './AdminDash.css';
import { FaHome, FaBuilding, FaMoneyBillWave, FaEnvelope, FaBars, FaArrowLeft, FaPaperPlane, FaUser, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import LogoutButton from './LogoutButton';
import ProfileCircle from './ProfileCircle';
import { db, ensureAuthUser } from '../firebase';
import { ref, onValue, push, set, query, orderByChild } from 'firebase/database';
import { toast } from 'react-toastify';

export default function Chat() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(''); // 'tenant' or 'landlord'
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef(null);
  const [propertyDetails, setPropertyDetails] = useState(null);

  useEffect(() => {
    let off;
    let cancelled = false;
    let timeoutId;

    const initializeChat = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            setLoading(false);
            toast.error('Loading timeout. Please refresh the page.');
          }
        }, 2000);

        const user = await ensureAuthUser();
        if (cancelled) return;
        setCurrentUser(user);

        // Determine user type from URL
        const path = window.location.pathname;
        if (path.includes('/tenant')) {
          setUserType('tenant');
        } else if (path.includes('/landlord')) {
          setUserType('landlord');
        }

        // Check if there's a specific chat to open from URL params
        const landlordId = searchParams.get('landlord');
        const propertyId = searchParams.get('property');

        if (landlordId && propertyId) {
          // Load property details
          const propertyRef = ref(db, `properties/${propertyId}`);
          const propertySnap = await onValue(propertyRef, (snap) => {
            if (snap.exists()) {
              setPropertyDetails({ id: propertyId, ...snap.val() });
            }
          });

          // Create or find chat
          const chatId = `chat_${user.uid}_${landlordId}_${propertyId}`;
          await initializeOrJoinChat(chatId, landlordId, propertyId);
        }

        // Load user's chats
        loadUserChats(user.uid);

        // Clear timeout on success
        clearTimeout(timeoutId);

      } catch (error) {
        if (cancelled) return;
        console.error('Error initializing chat:', error);
        toast.error('Error initializing chat');
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    initializeChat();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (typeof off === 'function') off();
    };
  }, [searchParams]);

  const initializeOrJoinChat = async (chatId, landlordId, propertyId) => {
    try {
      const chatRef = ref(db, `chats/${chatId}`);
      const chatSnap = await onValue(chatRef, (snap) => {
        if (snap.exists()) {
          setSelectedChat({ id: chatId, ...snap.val() });
          loadMessages(chatId);
        } else {
          // Create new chat
          const newChat = {
            id: chatId,
            tenantId: currentUser.uid,
            landlordId: landlordId,
            propertyId: propertyId,
            createdAt: Date.now(),
            lastMessage: null,
            lastMessageTime: null
          };
          set(chatRef, newChat);
          setSelectedChat(newChat);
        }
      });
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Error creating chat');
    }
  };

  const loadUserChats = (userId) => {
    const chatsRef = ref(db, 'chats');
    const userChatsQuery = query(chatsRef, orderByChild(userType === 'tenant' ? 'tenantId' : 'landlordId'));
    
    onValue(userChatsQuery, (snap) => {
      const raw = snap.val() || {};
      const list = Object.entries(raw)
        .map(([id, chat]) => ({ id, ...chat }))
        .filter(chat => chat[userType === 'tenant' ? 'tenantId' : 'landlordId'] === userId)
        .sort((a, b) => (b.lastMessageTime || b.createdAt || 0) - (a.lastMessageTime || a.createdAt || 0));
      
      setChats(list);
      setLoading(false);
    });
  };

  const loadMessages = (chatId) => {
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));
    
    onValue(messagesQuery, (snap) => {
      const raw = snap.val() || {};
      const list = Object.entries(raw)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      
      setMessages(list);
      scrollToBottom();
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const messageData = {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderType: userType,
        timestamp: Date.now()
      };

      const messagesRef = ref(db, `chats/${selectedChat.id}/messages`);
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, messageData);

      // Update chat's last message
      const chatRef = ref(db, `chats/${selectedChat.id}`);
      await set(chatRef, {
        ...selectedChat,
        lastMessage: newMessage.trim(),
        lastMessageTime: Date.now()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectChat = (chat) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {mobileMenuOpen && <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="logo-section">
          <img src={logo} alt="ITT Real Estate Logo" />
          <span>ITT Real Estate</span>
        </div>
        <nav className="nav-menu">
          <div className="menu-items">
            <Link to={userType === 'tenant' ? '/tenant' : '/landlord'} className="nav-item">
              <FaHome /> Dashboard
            </Link>
            <Link to={userType === 'tenant' ? '/tenant/properties' : '/landlord/properties'} className="nav-item">
              <FaBuilding /> Properties
            </Link>
            <Link to={userType === 'tenant' ? '/tenant/transactions' : '/landlord/transactions'} className="nav-item">
              <FaMoneyBillWave /> Transactions
            </Link>
            <Link to={userType === 'tenant' ? '/tenant/chats' : '/landlord/chats'} className="nav-item last-item active">
              <FaEnvelope /> Chats
            </Link>
          </div>
          <div className="mobile-menu-footer">
            <ProfileCircle />
            <LogoutButton />
          </div>
        </nav>
      </aside>
      
      <main className="main-content" style={{ padding: 0, height: '100vh' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Chat List Sidebar */}
          <div style={{ 
            width: '350px', 
            borderRight: '1px solid #e2e8f0', 
            display: 'flex', 
            flexDirection: 'column',
            background: '#f8fafc'
          }}>
            <div style={{ 
              padding: '1rem', 
              borderBottom: '1px solid #e2e8f0',
              background: 'white'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Messages</h2>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {chats.length === 0 ? (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  color: '#64748b' 
                }}>
                  <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No conversations yet</div>
                  <div style={{ fontSize: '0.875rem' }}>Start a chat by contacting a property</div>
                </div>
              ) : (
                chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => selectChat(chat)}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      background: selectedChat?.id === chat.id ? '#eff6ff' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>
                        {userType === 'tenant' ? chat.landlordName || 'Landlord' : chat.tenantName || 'Tenant'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {formatTime(chat.lastMessageTime)}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      {chat.propertyName || 'Property'}
                    </div>
                    {chat.lastMessage && (
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#475569',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {chat.lastMessage}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div style={{ 
                  padding: '1rem', 
                  borderBottom: '1px solid #e2e8f0',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <button
                    onClick={() => setSelectedChat(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b'
                    }}
                  >
                    <FaArrowLeft />
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>
                      {userType === 'tenant' ? selectedChat.landlordName || 'Landlord' : selectedChat.tenantName || 'Tenant'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {selectedChat.propertyName || 'Property'}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  padding: '1rem',
                  background: '#f1f5f9'
                }}>
                  {messages.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '2rem', 
                      color: '#64748b' 
                    }}>
                      <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No messages yet</div>
                      <div style={{ fontSize: '0.875rem' }}>Start the conversation!</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {messages.map((message, index) => {
                        const isOwnMessage = message.senderId === currentUser.uid;
                        const showDate = index === 0 || 
                          formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp);
                        
                        return (
                          <div key={message.id}>
                            {showDate && (
                              <div style={{ 
                                textAlign: 'center', 
                                margin: '1rem 0',
                                fontSize: '0.75rem',
                                color: '#64748b'
                              }}>
                                {formatDate(message.timestamp)}
                              </div>
                            )}
                            <div style={{
                              display: 'flex',
                              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                              marginBottom: '0.5rem'
                            }}>
                              <div style={{
                                maxWidth: '70%',
                                padding: '0.75rem 1rem',
                                borderRadius: '1rem',
                                background: isOwnMessage ? '#3b82f6' : 'white',
                                color: isOwnMessage ? 'white' : '#1e293b',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                wordWrap: 'break-word'
                              }}>
                                <div style={{ marginBottom: '0.25rem' }}>
                                  {message.text}
                                </div>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  opacity: 0.7,
                                  textAlign: 'right'
                                }}>
                                  {formatTime(message.timestamp)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div style={{ 
                  padding: '1rem', 
                  borderTop: '1px solid #e2e8f0',
                  background: 'white'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem',
                    alignItems: 'flex-end'
                  }}>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '1.5rem',
                        resize: 'none',
                        minHeight: '40px',
                        maxHeight: '120px',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                      rows={1}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      style={{
                        background: newMessage.trim() ? '#3b82f6' : '#d1d5db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <FaPaperPlane />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#64748b'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Select a conversation</div>
                  <div style={{ fontSize: '0.875rem' }}>Choose a chat from the list to start messaging</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
