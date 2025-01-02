import {
  clearAppEndpoint,
  clearJWT,
  getAccessToken,
  getAppEndpointKey,
  getRefreshToken,
  NodeEvent,
  ResponseData,
  SubscriptionsClient,
} from '@calimero-network/calimero-client';
import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { connect, disconnect } from "get-starknet";
import { Contract, Provider, constants } from "starknet";
import {
  ClientApiDataSource,
  getWsSubscriptionsClient,
} from '../../api/dataSource/ClientApiDataSource';
import {
  Note,
  CreateNoteRequest,
  CreateNoteResponse,
  ListNotesResponse,
  UpdateNoteRequest,
  GetNoteResponse,
} from '../../api/clientApi';
import { getContextId, getStorageApplicationId } from '../../utils/node';
import { clearApplicationId } from '../../utils/storage';
import { useNavigate } from 'react-router-dom';

const FullPageCenter = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background-color: #111111;
  justify-content: start;
  align-items: center;
  flex-direction: column;
  padding: 2rem;
`;

const ChatContainer = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  padding: 1rem;
`;

const Message = styled.div<{ isBot?: boolean }>`
  padding: 1rem;
  border-radius: 8px;
  max-width: 70%;
  align-self: ${props => props.isBot ? 'flex-start' : 'flex-end'};
  background-color: ${props => props.isBot ? '#2C3E50' : '#5dbb63'};
  color: white;
  white-space: pre-line;
  font-size: 1rem;
  line-height: 1.5;
  word-break: break-word;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border-radius: 8px;
  border: none;
  background: #222222;
  color: white;
  font-size: 1rem;
  margin-top: 1rem;
  &:focus {
    outline: none;
    border: 1px solid #5dbb63;
  }
`;

const LogoutButton = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  color: black;
  padding: 0.25em 1em;
  border-radius: 8px;
  font-size: 1em;
  background: white;
  cursor: pointer;
  &:hover {
    background: #e0e0e0;
  }
`;

const ConnectButton = styled.div`
  position: fixed;
  top: 1rem;
  right: 7rem;
  color: white;
  padding: 0.25em 1em;
  border-radius: 8px;
  font-size: 1em;
  background: #5dbb63;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: #4da653;
  }
`;

const WalletInfo = styled.div`
  position: fixed;
  top: 4rem;
  right: 1rem;
  color: white;
  font-size: 0.9em;
  background: #2C3E50;
  padding: 0.5rem;
  border-radius: 4px;
`;

interface ChatMessage {
  text: string;
  isBot: boolean;
}

// STRK token contract address on testnet
const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

// STRK token ABI - simplified for transfer
const tokenAbi = [
  {
    members: [
      {
        name: "low",
        offset: 0,
        type: "felt",
      },
      {
        name: "high",
        offset: 1,
        type: "felt",
      },
    ],
    name: "Uint256",
    size: 2,
    type: "struct",
  },
  {
    inputs: [
      {
        name: "recipient",
        type: "felt",
      },
      {
        name: "amount",
        type: "Uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        name: "success",
        type: "felt",
      },
    ],
    type: "function",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const url = getAppEndpointKey();
  const applicationId = getStorageApplicationId();
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [awaitingTitle, setAwaitingTitle] = useState(false);
  const [awaitingContent, setAwaitingContent] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [awaitingUpdateTitle, setAwaitingUpdateTitle] = useState(false);
  const [awaitingUpdateContent, setAwaitingUpdateContent] = useState(false);
  const [awaitingDeleteConfirm, setAwaitingDeleteConfirm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [wallet, setWallet] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");

  useEffect(() => {
    if (!url || !applicationId || !accessToken || !refreshToken) {
      navigate('/auth');
    } else {
      setMessages([{
        text: "Hello! I'm your note-taking assistant. How can I help you?\n\nAvailable commands:\n- show notes\n- add note\n- update note <note number>\n- delete note <note number>\n- send <amount> STRK to <address>\n- help",
        isBot: true
      }]);
    }
  }, [accessToken, applicationId, navigate, refreshToken, url]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const connectWallet = async () => {
    try {
      const starknet = await connect();
      
      if (!starknet?.isConnected) {
        throw new Error("Failed to connect to wallet");
      }

      await starknet?.enable();
      setWallet(starknet);
      setWalletAddress(starknet.selectedAddress);
      
      setMessages(prev => [...prev, 
        { text: "Wallet connected successfully!", isBot: true }
      ]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setMessages(prev => [...prev, 
        { text: "Error connecting wallet. Please make sure you have AgentX installed.", isBot: true }
      ]);
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
      setWallet(null);
      setWalletAddress("");
      
      setMessages(prev => [...prev, 
        { text: "Wallet disconnected.", isBot: true }
      ]);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const sendSTRK = async (recipient: string, amount: number) => {
    try {
      if (!wallet || !wallet.isConnected) {
        setMessages(prev => [...prev, 
          { text: "Please connect your wallet first.", isBot: true }
        ]);
        return;
      }

      const contract = new Contract(tokenAbi, STRK_TOKEN_ADDRESS, wallet.provider);
      contract.connect(wallet.account);

      // Convert amount to token units (assuming 18 decimals)
      const tokenAmount = {
        low: amount * (10 ** 18),
        high: 0,
      };

      const transaction = await contract.transfer(
        recipient,
        tokenAmount
      );

      setMessages(prev => [...prev, 
        { text: `Transaction sent! Hash: ${transaction.transaction_hash}`, isBot: true }
      ]);

      // Wait for transaction confirmation
      await wallet.provider.waitForTransaction(transaction.transaction_hash);
      
      setMessages(prev => [...prev, 
        { text: "Transaction confirmed! Tokens transferred successfully.", isBot: true }
      ]);

    } catch (error: any) {
      console.error("Error sending tokens:", error);
      setMessages(prev => [...prev, 
        { text: `Error sending tokens: ${error.message}`, isBot: true }
      ]);
    }
  };

  const handleTokenTransfer = (command: string) => {
    const match = command.match(/send (\d+) STRK to (0x[a-fA-F0-9]+)/);
    if (match) {
      const amount = parseInt(match[1]);
      const recipient = match[2];
      sendSTRK(recipient, amount);
      return true;
    }
    return false;
  };

  async function handleCommand(command: string) {
    // Token transfer command check
    if (handleTokenTransfer(command)) {
      setMessages(prev => [...prev, { text: command, isBot: false }]);
      return;
    }

    // Note creation process
    if (awaitingTitle) {
      setTempTitle(command);
      setAwaitingTitle(false);
      setAwaitingContent(true);
      setMessages(prev => [...prev, 
        { text: command, isBot: false },
        { text: "Great! Now please write the content of your note:", isBot: true }
      ]);
      return;
    }

    if (awaitingContent) {
      await createNote(tempTitle, command);
      setAwaitingContent(false);
      setMessages(prev => [...prev, 
        { text: command, isBot: false },
        { text: "Note successfully added! What else can I do for you?", isBot: true }
      ]);
      return;
    }

    // Note update process
    if (awaitingUpdateTitle) {
      setNewTitle(command);
      setAwaitingUpdateTitle(false);
      setAwaitingUpdateContent(true);
      setMessages(prev => [...prev, 
        { text: command, isBot: false },
        { text: "Title updated! Now please write the new content:", isBot: true }
      ]);
      return;
    }

    if (awaitingUpdateContent) {
      await updateNote(selectedNoteId!, command);
      setAwaitingUpdateContent(false);
      setSelectedNoteId(null);
      return;
    }

    // Delete confirmation process
    if (awaitingDeleteConfirm) {
      if (command.toLowerCase() === 'yes') {
        await deleteNote(selectedNoteId!);
        setAwaitingDeleteConfirm(false);
        setSelectedNoteId(null);
        setMessages(prev => [...prev, 
          { text: command, isBot: false },
          { text: "Note successfully deleted!", isBot: true }
        ]);
      } else {
        setAwaitingDeleteConfirm(false);
        setSelectedNoteId(null);
        setMessages(prev => [...prev, 
          { text: command, isBot: false },
          { text: "Delete operation cancelled.", isBot: true }
        ]);
      }
      return;
    }

    // Main commands
    const normalizedCommand = command.toLowerCase().trim();
    
    // Update note command check
    if (normalizedCommand.startsWith('update note ')) {
      const noteId = parseInt(normalizedCommand.split(' ')[2]);
      if (isNaN(noteId)) {
        setMessages(prev => [...prev, 
          { text: command, isBot: false },
          { text: "Please enter a valid note number.", isBot: true }
        ]);
        return;
      }
      
      const note = notes.find(n => n.id === noteId);
      if (!note) {
        setMessages(prev => [...prev, 
          { text: command, isBot: false },
          { text: "Note not found with this number.", isBot: true }
        ]);
        return;
      }

      setSelectedNoteId(noteId);
      setAwaitingUpdateTitle(true);
      setMessages(prev => [...prev, 
        { text: command, isBot: false },
        { text: `Updating note #${noteId}.\nCurrent note:\nTitle: ${note.title}\nContent: ${note.content}\n\nPlease write the new title:`, isBot: true }
      ]);
      return;
    }

    // Delete note command check
    if (normalizedCommand.startsWith('delete note ')) {
      const noteId = parseInt(normalizedCommand.split(' ')[2]);
      if (isNaN(noteId)) {
        setMessages(prev => [...prev, 
          { text: command, isBot: false },
          { text: "Please enter a valid note number.", isBot: true }
        ]);
        return;
      }
      
      const note = notes.find(n => n.id === noteId);
      if (!note) {
        setMessages(prev => [...prev, 
          { text: command, isBot: false },
          { text: "Note not found with this number.", isBot: true }
        ]);
        return;
      }

      setSelectedNoteId(noteId);
      setAwaitingDeleteConfirm(true);
      setMessages(prev => [...prev, 
        { text: command, isBot: false },
        { text: `Are you sure you want to delete note #${noteId}?\nTitle: ${note.title}\n\nType 'yes' to confirm, anything else to cancel.`, isBot: true }
      ]);
      return;
    }

    switch(normalizedCommand) {
      case 'show notes':
        await fetchNotes();
        setMessages(prev => [...prev, { text: command, isBot: false }]);
        break;

      case 'add note':
        setAwaitingTitle(true);
        setMessages(prev => [...prev, 
          { text: command, isBot: false },
          { text: "Please write a title for your note:", isBot: true }
        ]);
        break;

        case 'help':
          setMessages(prev => [...prev, 
            { text: command, isBot: false },
            { text: "Available commands:\n- show notes: Display all your notes\n- add note: Create a new note\n- update note <number>: Update specified note\n- delete note <number>: Delete specified note\n- send <amount> STRK to <address>: Send STRK tokens\n- help: Show this message", isBot: true }
          ]);
          break;
  
        default:
          setMessages(prev => [...prev, 
            { text: command, isBot: false },
            { text: "Sorry, I didn't understand that command. Type 'help' to see available commands.", isBot: true }
          ]);
      }
    }
  
    async function createNote(title: string, content: string) {
      const params: CreateNoteRequest = { title, content };
      const result = await new ClientApiDataSource().createNote(params);
      
      if (result?.error) {
        console.error('Error:', result.error);
        setMessages(prev => [...prev, 
          { text: "Error adding note: " + result.error.message, isBot: true }
        ]);
        return;
      }
  
      await fetchNotes();
    }
  
    async function fetchNotes() {
      const result = await new ClientApiDataSource().listNotes();
      
      if (result?.error) {
        console.error('Error:', result.error);
        setMessages(prev => [...prev, 
          { text: "Error fetching notes: " + result.error.message, isBot: true }
        ]);
        return;
      }
  
      if (result.data?.notes) {
        setNotes(result.data.notes);
        if (result.data.notes.length > 0) {
          const notesList = result.data.notes.map(note => 
            `Note #${note.id}\nTitle: ${note.title}\nContent: ${note.content}\n`
          ).join('---------------\n');
          setMessages(prev => [...prev, 
            { text: "Here are your notes:\n\n" + notesList, isBot: true }
          ]);
        } else {
          setMessages(prev => [...prev, 
            { text: "You don't have any notes yet.", isBot: true }
          ]);
        }
      }
    }
  
    async function updateNote(noteId: number, newContent: string) {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;
  
      const params: UpdateNoteRequest = {
        noteId: noteId,
        title: newTitle || note.title,
        content: newContent
      };
      
      const result = await new ClientApiDataSource().updateNote(params);
      
      if (result?.error) {
        setMessages(prev => [...prev, 
          { text: newContent, isBot: false },
          { text: "Error updating note: " + result.error.message, isBot: true }
        ]);
        return;
      }
  
      setMessages(prev => [...prev, 
        { text: newContent, isBot: false },
        { text: "Note successfully updated! What else can I do for you?", isBot: true }
      ]);
      await fetchNotes();
      setNewTitle('');
    }
  
    async function deleteNote(noteId: number) {
      const result = await new ClientApiDataSource().deleteNote(noteId);
      
      if (result?.error) {
        setMessages(prev => [...prev, 
          { text: "Error deleting note: " + result.error.message, isBot: true }
        ]);
        return;
      }
  
      await fetchNotes();
    }
  
    useEffect(() => {
      const observeNodeEvents = async () => {
        let subscriptionsClient: SubscriptionsClient = getWsSubscriptionsClient();
        await subscriptionsClient.connect();
        subscriptionsClient.subscribe([getContextId()]);
  
        subscriptionsClient?.addCallback((data: NodeEvent) => {
          if (data.data.events && data.data.events.length > 0) {
            fetchNotes();
          }
        });
      };
  
      observeNodeEvents();
    }, []);
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      
      handleCommand(input);
      setInput('');
    };
  
    const logout = () => {
      clearAppEndpoint();
      clearJWT();
      clearApplicationId();
      navigate('/auth');
    };
  
    return (
      <FullPageCenter>
        <ConnectButton onClick={wallet ? disconnectWallet : connectWallet}>
          {wallet ? "Disconnect Wallet" : "Connect Wallet"}
        </ConnectButton>
        
        {walletAddress && (
          <WalletInfo>
            Connected: {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
          </WalletInfo>
        )}
  
        <LogoutButton onClick={logout}>Logout</LogoutButton>
        
        <ChatContainer ref={chatContainerRef}>
          {messages.map((message, index) => (
            <Message key={index} isBot={message.isBot}>
              {message.text}
            </Message>
          ))}
        </ChatContainer>
        
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '800px' }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              awaitingTitle ? "Enter note title..." : 
              awaitingContent ? "Enter note content..." :
              awaitingUpdateTitle ? "Enter new title..." :
              awaitingUpdateContent ? "Enter new content..." :
              awaitingDeleteConfirm ? "Type 'yes' to confirm..." :
              "Type a message..."
            }
          />
        </form>
      </FullPageCenter>
    );
  }