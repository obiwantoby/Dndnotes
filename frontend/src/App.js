import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set up axios defaults for basic auth
let authConfigured = false;

const configureAuth = (username, password) => {
  axios.defaults.auth = {
    username: username,
    password: password
  };
  authConfigured = true;
};

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${API}/auth/check`, {
        auth: { username, password }
      });
      
      if (response.data.authenticated) {
        configureAuth(username, password);
        onLogin(username);
      }
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">D&D Note Keeper</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

const RichTextEditor = ({ content, onChange }) => {
  const textareaRef = React.useRef(null);

  const handleFormatting = (command) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText = content;
    let formatChars = '';
    
    switch (command) {
      case 'bold':
        formatChars = '**';
        break;
      case 'italic':
        formatChars = '*';
        break;
      case 'underline':
        formatChars = '__';
        break;
    }
    
    if (selectedText) {
      newText = content.substring(0, start) + formatChars + selectedText + formatChars + content.substring(end);
    }
    
    onChange(newText);
  };

  return (
    <div className="border border-gray-600 rounded-lg bg-gray-800">
      <div className="flex gap-2 p-2 bg-gray-700 rounded-t-lg border-b border-gray-600">
        <button
          onClick={() => handleFormatting('bold')}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm font-bold"
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => handleFormatting('italic')}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm italic"
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => handleFormatting('underline')}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm underline"
          title="Underline"
        >
          U
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-64 p-4 bg-gray-800 text-white resize-none focus:outline-none"
        placeholder="Take your D&D session notes here... Select text and use the formatting buttons above, or highlight NPCs for extraction."
      />
    </div>
  );
};

const NPCCard = ({ npc, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(npc);

  const handleSave = async () => {
    try {
      await axios.put(`${API}/npcs/${npc.id}`, editData);
      onUpdate();
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating NPC:", err);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">Name</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">Status</label>
            <select
              value={editData.status}
              onChange={(e) => setEditData({...editData, status: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="Alive">Alive</option>
              <option value="Deceased">Deceased</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">Race</label>
            <input
              type="text"
              value={editData.race}
              onChange={(e) => setEditData({...editData, race: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">Class/Role</label>
            <input
              type="text"
              value={editData.class_role}
              onChange={(e) => setEditData({...editData, class_role: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-gray-300 text-sm font-bold mb-2">Appearance</label>
            <textarea
              value={editData.appearance}
              onChange={(e) => setEditData({...editData, appearance: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-20"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-gray-300 text-sm font-bold mb-2">Quirks/Mannerisms</label>
            <textarea
              value={editData.quirks_mannerisms}
              onChange={(e) => setEditData({...editData, quirks_mannerisms: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-20"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-gray-300 text-sm font-bold mb-2">Background</label>
            <textarea
              value={editData.background}
              onChange={(e) => setEditData({...editData, background: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-20"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-gray-300 text-sm font-bold mb-2">Notes</label>
            <textarea
              value={editData.notes}
              onChange={(e) => setEditData({...editData, notes: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-20"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{npc.name}</h3>
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        >
          Edit
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-400">Status:</span> <span className="text-white">{npc.status}</span></div>
        <div><span className="text-gray-400">Race:</span> <span className="text-white">{npc.race}</span></div>
        <div><span className="text-gray-400">Class/Role:</span> <span className="text-white">{npc.class_role}</span></div>
      </div>
      
      {npc.appearance && (
        <div className="mt-3">
          <span className="text-gray-400 text-sm">Appearance:</span>
          <p className="text-white text-sm mt-1">{npc.appearance}</p>
        </div>
      )}
      
      {npc.quirks_mannerisms && (
        <div className="mt-3">
          <span className="text-gray-400 text-sm">Quirks/Mannerisms:</span>
          <p className="text-white text-sm mt-1">{npc.quirks_mannerisms}</p>
        </div>
      )}
      
      {npc.background && (
        <div className="mt-3">
          <span className="text-gray-400 text-sm">Background:</span>
          <p className="text-white text-sm mt-1">{npc.background}</p>
        </div>
      )}
      
      {npc.notes && (
        <div className="mt-3">
          <span className="text-gray-400 text-sm">Notes:</span>
          <p className="text-white text-sm mt-1">{npc.notes}</p>
        </div>
      )}
      
      {npc.history && npc.history.length > 0 && (
        <div className="mt-4">
          <span className="text-gray-400 text-sm">History:</span>
          <div className="mt-2 space-y-2">
            {npc.history.map((entry, index) => (
              <div key={index} className="bg-gray-700 p-2 rounded text-sm">
                <p className="text-white">{entry.interaction}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SessionEditor = ({ session, onSave, onCancel }) => {
  const [title, setTitle] = useState(session?.title || "");
  const [content, setContent] = useState(session?.content || "");
  const [selectedText, setSelectedText] = useState("");
  const [showNPCExtraction, setShowNPCExtraction] = useState(false);
  const [npcName, setNpcName] = useState("");

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      setSelectedText(selection.toString());
      setShowNPCExtraction(true);
    }
  };

  const handleExtractNPC = async () => {
    if (!npcName.trim() || !selectedText.trim()) return;
    
    try {
      const response = await axios.post(`${API}/extract-npc`, {
        session_id: session?.id || "new",
        extracted_text: selectedText,
        npc_name: npcName.trim()
      });
      
      setShowNPCExtraction(false);
      setSelectedText("");
      setNpcName("");
      
      alert(`NPC "${npcName}" ${response.data.action} successfully!`);
    } catch (err) {
      console.error("Error extracting NPC:", err);
      alert("Error extracting NPC");
    }
  };

  const handleSave = async () => {
    try {
      if (session) {
        await axios.put(`${API}/sessions/${session.id}`, { title, content });
      } else {
        await axios.post(`${API}/sessions`, { title, content });
      }
      onSave();
    } catch (err) {
      console.error("Error saving session:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-300 text-sm font-bold mb-2">Session Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          placeholder="Enter session title..."
        />
      </div>
      
      <div>
        <label className="block text-gray-300 text-sm font-bold mb-2">Session Notes</label>
        <div onMouseUp={handleTextSelection}>
          <RichTextEditor content={content} onChange={setContent} />
        </div>
      </div>
      
      {showNPCExtraction && (
        <div className="bg-blue-900 border border-blue-700 p-4 rounded-lg">
          <h4 className="text-blue-200 font-bold mb-2">Extract NPC</h4>
          <p className="text-blue-200 text-sm mb-3">Selected text: "{selectedText}"</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={npcName}
              onChange={(e) => setNpcName(e.target.value)}
              placeholder="Enter NPC name..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
            <button
              onClick={handleExtractNPC}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Extract NPC
            </button>
            <button
              onClick={() => setShowNPCExtraction(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
        >
          Save Session
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const MainApp = ({ username, onLogout }) => {
  const [currentView, setCurrentView] = useState("sessions");
  const [sessions, setSessions] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchNpcs();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API}/sessions`);
      setSessions(response.data);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const fetchNpcs = async () => {
    try {
      const response = await axios.get(`${API}/npcs`);
      setNpcs(response.data);
    } catch (err) {
      console.error("Error fetching NPCs:", err);
    }
  };

  const handleSessionSave = () => {
    setIsEditing(false);
    setSelectedSession(null);
    fetchSessions();
    fetchNpcs(); // Refresh NPCs in case new ones were created
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      try {
        await axios.delete(`${API}/sessions/${sessionId}`);
        fetchSessions();
      } catch (err) {
        console.error("Error deleting session:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">D&D Note Keeper</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setCurrentView("sessions")}
              className={`px-4 py-2 rounded ${currentView === "sessions" ? "bg-blue-600" : "bg-gray-600 hover:bg-gray-500"}`}
            >
              Sessions
            </button>
            <button
              onClick={() => setCurrentView("npcs")}
              className={`px-4 py-2 rounded ${currentView === "npcs" ? "bg-blue-600" : "bg-gray-600 hover:bg-gray-500"}`}
            >
              NPCs
            </button>
            <span className="text-gray-300">Welcome, {username}</span>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        {currentView === "sessions" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Game Sessions</h2>
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setIsEditing(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                New Session
              </button>
            </div>

            {isEditing ? (
              <SessionEditor
                session={selectedSession}
                onSave={handleSessionSave}
                onCancel={() => {
                  setIsEditing(false);
                  setSelectedSession(null);
                }}
              />
            ) : (
              <div className="grid gap-4">
                {sessions.map((session) => (
                  <div key={session.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold">{session.title}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedSession(session);
                            setIsEditing(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Created: {new Date(session.created_at).toLocaleDateString()}
                    </p>
                    {session.content && (
                      <div className="mt-3 p-3 bg-gray-700 rounded">
                        <p className="text-white whitespace-pre-wrap">
                          {session.content.length > 200 
                            ? session.content.substring(0, 200) + "..." 
                            : session.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === "npcs" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Non-Player Characters</h2>
              <span className="text-gray-400">{npcs.length} NPCs tracked</span>
            </div>

            <div className="grid gap-6">
              {npcs.map((npc) => (
                <NPCCard key={npc.id} npc={npc} onUpdate={fetchNpcs} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUsername(user);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    authConfigured = false;
    delete axios.defaults.auth;
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <MainApp username={username} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
