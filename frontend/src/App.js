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
        className="w-full h-32 p-4 bg-gray-800 text-white resize-none focus:outline-none"
        placeholder="Add notes, descriptions, or other details..."
      />
    </div>
  );
};

const StructuredSessionEditor = ({ session, onSave, onCancel }) => {
  const [sessionData, setSessionData] = useState({
    title: session?.title || "",
    session_type: "structured",
    structured_data: session?.structured_data || {
      session_number: null,
      session_date: null,
      players_present: [],
      session_goal: "",
      combat_encounters: [],
      roleplay_encounters: [],
      npcs_encountered: [],
      loot: [],
      notes: "",
      notable_roleplay_moments: [],
      next_session_goals: "",
      overarching_missions: []
    }
  });

  const [newPlayer, setNewPlayer] = useState("");
  const [activeSection, setActiveSection] = useState("info");

  const updateStructuredData = (field, value) => {
    setSessionData(prev => ({
      ...prev,
      structured_data: {
        ...prev.structured_data,
        [field]: value
      }
    }));
  };

  const addPlayer = () => {
    if (newPlayer.trim() && !sessionData.structured_data.players_present.includes(newPlayer.trim())) {
      updateStructuredData('players_present', [...sessionData.structured_data.players_present, newPlayer.trim()]);
      setNewPlayer("");
    }
  };

  const removePlayer = (player) => {
    updateStructuredData('players_present', sessionData.structured_data.players_present.filter(p => p !== player));
  };

  const addCombatEncounter = () => {
    const newEncounter = {
      id: Date.now().toString(),
      description: "",
      enemies: "",
      outcome: "",
      notable_events: ""
    };
    updateStructuredData('combat_encounters', [...sessionData.structured_data.combat_encounters, newEncounter]);
  };

  const updateCombatEncounter = (id, field, value) => {
    const updated = sessionData.structured_data.combat_encounters.map(enc => 
      enc.id === id ? { ...enc, [field]: value } : enc
    );
    updateStructuredData('combat_encounters', updated);
  };

  const removeCombatEncounter = (id) => {
    updateStructuredData('combat_encounters', sessionData.structured_data.combat_encounters.filter(enc => enc.id !== id));
  };

  const addRoleplayEncounter = () => {
    const newEncounter = {
      id: Date.now().toString(),
      description: "",
      npcs_involved: [],
      outcome: "",
      importance: ""
    };
    updateStructuredData('roleplay_encounters', [...sessionData.structured_data.roleplay_encounters, newEncounter]);
  };

  const updateRoleplayEncounter = (id, field, value) => {
    const updated = sessionData.structured_data.roleplay_encounters.map(enc => 
      enc.id === id ? { ...enc, [field]: value } : enc
    );
    updateStructuredData('roleplay_encounters', updated);
  };

  const removeRoleplayEncounter = (id) => {
    updateStructuredData('roleplay_encounters', sessionData.structured_data.roleplay_encounters.filter(enc => enc.id !== id));
  };

  const addNPCEncounter = () => {
    const newNPC = {
      id: Date.now().toString(),
      npc_name: "",
      role: "",
      notes: "",
      first_encounter: false
    };
    updateStructuredData('npcs_encountered', [...sessionData.structured_data.npcs_encountered, newNPC]);
  };

  const updateNPCEncounter = (id, field, value) => {
    const updated = sessionData.structured_data.npcs_encountered.map(npc => 
      npc.id === id ? { ...npc, [field]: value } : npc
    );
    updateStructuredData('npcs_encountered', updated);
  };

  const removeNPCEncounter = (id) => {
    updateStructuredData('npcs_encountered', sessionData.structured_data.npcs_encountered.filter(npc => npc.id !== id));
  };

  const addLootItem = () => {
    const newItem = {
      id: Date.now().toString(),
      item_name: "",
      description: "",
      value: "",
      recipient: ""
    };
    updateStructuredData('loot', [...sessionData.structured_data.loot, newItem]);
  };

  const updateLootItem = (id, field, value) => {
    const updated = sessionData.structured_data.loot.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    updateStructuredData('loot', updated);
  };

  const removeLootItem = (id) => {
    updateStructuredData('loot', sessionData.structured_data.loot.filter(item => item.id !== id));
  };

  const addRoleplayMoment = () => {
    updateStructuredData('notable_roleplay_moments', [...sessionData.structured_data.notable_roleplay_moments, ""]);
  };

  const updateRoleplayMoment = (index, value) => {
    const updated = [...sessionData.structured_data.notable_roleplay_moments];
    updated[index] = value;
    updateStructuredData('notable_roleplay_moments', updated);
  };

  const removeRoleplayMoment = (index) => {
    updateStructuredData('notable_roleplay_moments', sessionData.structured_data.notable_roleplay_moments.filter((_, i) => i !== index));
  };

  const addOverarchingMission = () => {
    const newMission = {
      id: Date.now().toString(),
      mission_name: "",
      status: "In Progress",
      description: "",
      notes: ""
    };
    updateStructuredData('overarching_missions', [...sessionData.structured_data.overarching_missions, newMission]);
  };

  const updateOverarchingMission = (id, field, value) => {
    const updated = sessionData.structured_data.overarching_missions.map(mission => 
      mission.id === id ? { ...mission, [field]: value } : mission
    );
    updateStructuredData('overarching_missions', updated);
  };

  const removeOverarchingMission = (id) => {
    updateStructuredData('overarching_missions', sessionData.structured_data.overarching_missions.filter(mission => mission.id !== id));
  };

  const handleSave = async () => {
    try {
      if (session) {
        await axios.put(`${API}/sessions/${session.id}`, sessionData);
      } else {
        await axios.post(`${API}/sessions`, sessionData);
      }
      onSave();
    } catch (err) {
      console.error("Error saving session:", err);
    }
  };

  const exportSession = async () => {
    if (!session) return;
    
    try {
      const response = await axios.get(`${API}/sessions/${session.id}/export`);
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sessionData.title.replace(/\s+/g, '_')}_export.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting session:", err);
    }
  };

  const sections = [
    { id: "info", name: "📅 Session Info", icon: "📅" },
    { id: "goal", name: "🎯 Session Goal", icon: "🎯" },
    { id: "combat", name: "⚔️ Combat", icon: "⚔️" },
    { id: "roleplay", name: "🎭 Roleplay", icon: "🎭" },
    { id: "npcs", name: "👥 NPCs", icon: "👥" },
    { id: "loot", name: "💰 Loot", icon: "💰" },
    { id: "notes", name: "📝 Notes", icon: "📝" },
    { id: "moments", name: "✨ Key Moments", icon: "✨" },
    { id: "next", name: "🚀 Next Session", icon: "🚀" },
    { id: "missions", name: "🌍 Missions", icon: "🌍" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">Session Title</label>
          <input
            type="text"
            value={sessionData.title}
            onChange={(e) => setSessionData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            placeholder="Enter session title..."
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`p-2 rounded text-sm transition ${
                activeSection === section.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {section.icon} {section.name.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        {activeSection === "info" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">📅 Session Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Session Number</label>
                <input
                  type="number"
                  value={sessionData.structured_data.session_number || ""}
                  onChange={(e) => updateStructuredData('session_number', parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 12"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Session Date</label>
                <input
                  type="date"
                  value={sessionData.structured_data.session_date || ""}
                  onChange={(e) => updateStructuredData('session_date', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Players Present</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPlayer}
                  onChange={(e) => setNewPlayer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  placeholder="Add player name..."
                />
                <button
                  onClick={addPlayer}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sessionData.structured_data.players_present.map((player, index) => (
                  <span key={index} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {player}
                    <button
                      onClick={() => removePlayer(player)}
                      className="text-blue-200 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === "goal" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">🎯 Session Goal</h3>
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">What did the party aim to achieve this session?</label>
              <RichTextEditor
                content={sessionData.structured_data.session_goal}
                onChange={(value) => updateStructuredData('session_goal', value)}
              />
            </div>
          </div>
        )}

        {activeSection === "combat" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">⚔️ Combat Encounters</h3>
              <button
                onClick={addCombatEncounter}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Add Combat
              </button>
            </div>
            
            {sessionData.structured_data.combat_encounters.map((encounter, index) => (
              <div key={encounter.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-bold">Combat {index + 1}</span>
                  <button
                    onClick={() => removeCombatEncounter(encounter.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Description</label>
                    <RichTextEditor
                      content={encounter.description}
                      onChange={(value) => updateCombatEncounter(encounter.id, 'description', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Enemies</label>
                    <input
                      type="text"
                      value={encounter.enemies}
                      onChange={(e) => updateCombatEncounter(encounter.id, 'enemies', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                      placeholder="e.g., 2 Goblins, 1 Orc Chieftain"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Outcome</label>
                    <input
                      type="text"
                      value={encounter.outcome}
                      onChange={(e) => updateCombatEncounter(encounter.id, 'outcome', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                      placeholder="e.g., Victory, Retreat, Negotiated peace"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "roleplay" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">🎭 Roleplay Encounters</h3>
              <button
                onClick={addRoleplayEncounter}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Add Roleplay
              </button>
            </div>
            
            {sessionData.structured_data.roleplay_encounters.map((encounter, index) => (
              <div key={encounter.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-bold">Roleplay {index + 1}</span>
                  <button
                    onClick={() => removeRoleplayEncounter(encounter.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Description</label>
                    <RichTextEditor
                      content={encounter.description}
                      onChange={(value) => updateRoleplayEncounter(encounter.id, 'description', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Outcome/Result</label>
                    <input
                      type="text"
                      value={encounter.outcome}
                      onChange={(e) => updateRoleplayEncounter(encounter.id, 'outcome', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                      placeholder="What was the result of this encounter?"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "npcs" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">👥 NPCs Encountered</h3>
              <button
                onClick={addNPCEncounter}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Add NPC
              </button>
            </div>
            
            {sessionData.structured_data.npcs_encountered.map((npc, index) => (
              <div key={npc.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-bold">NPC {index + 1}</span>
                  <button
                    onClick={() => removeNPCEncounter(npc.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">NPC Name</label>
                    <input
                      type="text"
                      value={npc.npc_name}
                      onChange={(e) => updateNPCEncounter(npc.id, 'npc_name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                      placeholder="e.g., Thorin the Blacksmith"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Role</label>
                    <input
                      type="text"
                      value={npc.role}
                      onChange={(e) => updateNPCEncounter(npc.id, 'role', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                      placeholder="e.g., Quest giver, Merchant, Enemy"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-300 text-sm font-bold mb-1">Notes</label>
                    <RichTextEditor
                      content={npc.notes}
                      onChange={(value) => updateNPCEncounter(npc.id, 'notes', value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={npc.first_encounter}
                        onChange={(e) => updateNPCEncounter(npc.id, 'first_encounter', e.target.checked)}
                        className="rounded"
                      />
                      First time encountering this NPC
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "loot" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">💰 Loot & Rewards</h3>
              <button
                onClick={addLootItem}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Add Item
              </button>
            </div>
            
            {sessionData.structured_data.loot.map((item, index) => (
              <div key={item.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-bold">Item {index + 1}</span>
                  <button
                    onClick={() => removeLootItem(item.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Item Name</label>
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => updateLootItem(item.id, 'item_name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                      placeholder="e.g., +1 Sword, Gold Pieces"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Value</label>
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => updateLootItem(item.id, 'value', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                      placeholder="e.g., 150 gp, Priceless"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLootItem(item.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                      placeholder="Item description or properties"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Recipient</label>
                    <input
                      type="text"
                      value={item.recipient}
                      onChange={(e) => updateLootItem(item.id, 'recipient', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                      placeholder="Who got this item?"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "notes" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">📝 Additional Notes</h3>
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Session Notes</label>
              <RichTextEditor
                content={sessionData.structured_data.notes}
                onChange={(value) => updateStructuredData('notes', value)}
              />
            </div>
          </div>
        )}

        {activeSection === "moments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">✨ Notable Roleplay Moments</h3>
              <button
                onClick={addRoleplayMoment}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Add Moment
              </button>
            </div>
            
            {sessionData.structured_data.notable_roleplay_moments.map((moment, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded border border-gray-600">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-bold">Moment {index + 1}</span>
                  <button
                    onClick={() => removeRoleplayMoment(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <RichTextEditor
                  content={moment}
                  onChange={(value) => updateRoleplayMoment(index, value)}
                />
              </div>
            ))}
          </div>
        )}

        {activeSection === "next" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">🚀 Next Session Goals</h3>
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">What does the party plan to do next week?</label>
              <RichTextEditor
                content={sessionData.structured_data.next_session_goals}
                onChange={(value) => updateStructuredData('next_session_goals', value)}
              />
            </div>
          </div>
        )}

        {activeSection === "missions" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">🌍 Overarching Missions</h3>
              <button
                onClick={addOverarchingMission}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Add Mission
              </button>
            </div>
            
            {sessionData.structured_data.overarching_missions.map((mission, index) => (
              <div key={mission.id} className="bg-gray-700 p-4 rounded border border-gray-600">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-bold">Mission {index + 1}</span>
                  <button
                    onClick={() => removeOverarchingMission(mission.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Mission Name</label>
                    <input
                      type="text"
                      value={mission.mission_name}
                      onChange={(e) => updateOverarchingMission(mission.id, 'mission_name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                      placeholder="e.g., Rescue the Princess"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-1">Status</label>
                    <select
                      value={mission.status}
                      onChange={(e) => updateOverarchingMission(mission.id, 'status', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-300 text-sm font-bold mb-1">Description</label>
                    <RichTextEditor
                      content={mission.description}
                      onChange={(value) => updateOverarchingMission(mission.id, 'description', value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-300 text-sm font-bold mb-1">Notes</label>
                    <RichTextEditor
                      content={mission.notes}
                      onChange={(value) => updateOverarchingMission(mission.id, 'notes', value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
        >
          Save Session
        </button>
        {session && (
          <button
            onClick={exportSession}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Export
          </button>
        )}
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

const FreeFormSessionEditor = ({ session, onSave, onCancel }) => {
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
      const sessionData = {
        title,
        content,
        session_type: "free_form"
      };
      
      if (session) {
        await axios.put(`${API}/sessions/${session.id}`, sessionData);
      } else {
        await axios.post(`${API}/sessions`, sessionData);
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
          <div className="border border-gray-600 rounded-lg bg-gray-800">
            <div className="flex gap-2 p-2 bg-gray-700 rounded-t-lg border-b border-gray-600">
              <button
                onClick={() => {/* formatting logic */}}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm font-bold"
                title="Bold"
              >
                B
              </button>
              <button
                onClick={() => {/* formatting logic */}}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm italic"
                title="Italic"
              >
                I
              </button>
              <button
                onClick={() => {/* formatting logic */}}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm underline"
                title="Underline"
              >
                U
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-64 p-4 bg-gray-800 text-white resize-none focus:outline-none"
              placeholder="Take your D&D session notes here... Select text and use the formatting buttons above, or highlight NPCs for extraction."
            />
          </div>
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

const MainApp = ({ username, onLogout }) => {
  const [currentView, setCurrentView] = useState("sessions");
  const [sessions, setSessions] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sessionType, setSessionType] = useState("structured"); // "structured" or "free_form"

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
              <div className="flex gap-2">
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="structured">📋 Structured Template</option>
                  <option value="free_form">📝 Free Form Notes</option>
                </select>
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
            </div>

            {isEditing ? (
              sessionType === "structured" ? (
                <StructuredSessionEditor
                  session={selectedSession}
                  onSave={handleSessionSave}
                  onCancel={() => {
                    setIsEditing(false);
                    setSelectedSession(null);
                  }}
                />
              ) : (
                <FreeFormSessionEditor
                  session={selectedSession}
                  onSave={handleSessionSave}
                  onCancel={() => {
                    setIsEditing(false);
                    setSelectedSession(null);
                  }}
                />
              )
            ) : (
              <div className="grid gap-4">
                {sessions.map((session) => (
                  <div key={session.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 session-card">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold">{session.title}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            session.session_type === 'structured' 
                              ? 'bg-blue-600 text-blue-100' 
                              : 'bg-green-600 text-green-100'
                          }`}>
                            {session.session_type === 'structured' ? '📋 Structured' : '📝 Free Form'}
                          </span>
                          {session.structured_data?.session_number && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-600 text-gray-100">
                              Session #{session.structured_data.session_number}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedSession(session);
                            setSessionType(session.session_type || 'free_form');
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
                      {session.structured_data?.session_date && (
                        <> • Session Date: {new Date(session.structured_data.session_date).toLocaleDateString()}</>
                      )}
                    </p>
                    
                    {session.structured_data ? (
                      <div className="mt-3 space-y-2">
                        {session.structured_data.session_goal && (
                          <div>
                            <span className="text-gray-400 text-sm">Goal:</span>
                            <p className="text-white text-sm">{session.structured_data.session_goal.substring(0, 100)}...</p>
                          </div>
                        )}
                        {session.structured_data.players_present.length > 0 && (
                          <div>
                            <span className="text-gray-400 text-sm">Players:</span>
                            <p className="text-white text-sm">{session.structured_data.players_present.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    ) : session.content && (
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
