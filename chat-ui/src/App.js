import React, { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import "./App.css";

function App() {

  const [booting, setBooting] = useState(true);
  const [bootLines, setBootLines] = useState([]);

  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);

  const chatEndRef = useRef(null);

  const systemInfo = {
    cpuThreads: navigator.hardwareConcurrency || "Unknown",
    memory: navigator.deviceMemory ? navigator.deviceMemory + " GB" : "Unknown",
    platform: navigator.platform,
    language: navigator.language,
    resolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth
  };

  const bootScript = [
`████████╗███████╗██████╗ ███╗   ███╗██╗   ██╗
╚══██╔══╝██╔════╝██╔══██╗████╗ ████║╚██╗ ██╔╝
   ██║   █████╗  ██████╔╝██╔████╔██║ ╚████╔╝
   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║  ╚██╔╝
   ██║   ███████╗██║  ██║██║ ╚═╝ ██║   ██║
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝   ╚═╝`,
"",
"TERMY TERMINAL v1.0",
"",
"Scanning hardware...",
`CPU Threads: ${systemInfo.cpuThreads}`,
`System Memory: ${systemInfo.memory}`,
`Platform: ${systemInfo.platform}`,
`Language: ${systemInfo.language}`,
"",
`Display Resolution: ${systemInfo.resolution}`,
`Color Depth: ${systemInfo.colorDepth}-bit`,
"",
"Network Interface: ONLINE",
"",
"Initializing WebSocket..."
];

  useEffect(() => {

    let i = 0;

    const interval = setInterval(() => {

      setBootLines(prev => [...prev, bootScript[i]]);
      i++;

      if (i === bootScript.length) {
        clearInterval(interval);

        setTimeout(() => {
          setBooting(false);
        }, 1200);
      }

    }, 200);

    return () => clearInterval(interval);

  }, []);

  useEffect(() => {

    if (booting) return;

    const socket = new SockJS("http://localhost:8080/ws");

    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,

      onConnect: () => {

        console.log("Connected");

        setConnected(true);

        stompClient.subscribe("/topic/messages", (msg) => {

          const newMessage = JSON.parse(msg.body);
          setMessages(prev => [...prev, newMessage]);

        });

      }
    });

    stompClient.activate();
    setClient(stompClient);

    return () => stompClient.deactivate();

  }, [booting]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {

    if (!client || !connected) return;
    if (!username.trim() || !message.trim()) return;

    const chatMessage = {
      username: username,
      content: message
    };

    client.publish({
      destination: "/app/chat",
      body: JSON.stringify(chatMessage)
    });

    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  if (booting) {
    return (
      <div className="terminal">

        {bootLines.map((line, i) => (
          <div key={i} style={{ whiteSpace: "pre" }}>
            {line}
          </div>
        ))}

        <span className="cursor">▋</span>

      </div>
    );
  }

  return (

    <div className="terminal">

      <div className="scanlines"/>

      <div style={{whiteSpace:"pre"}}>
{`
████████╗███████╗██████╗ ███╗   ███╗██╗   ██╗
╚══██╔══╝██╔════╝██╔══██╗████╗ ████║╚██╗ ██╔╝
   ██║   █████╗  ██████╔╝██╔████╔██║ ╚████╔╝
   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║  ╚██╔╝
   ██║   ███████╗██║  ██║██║ ╚═╝ ██║   ██║
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝   ╚═╝

██████╗██╗  ██╗ █████╗ ████████╗
██╔════╝██║  ██║██╔══██╗╚══██╔══╝
██║     ███████║███████║   ██║
██║     ██╔══██║██╔══██║   ██║
╚██████╗██║  ██║██║  ██║   ██║
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝
`}
      </div>

      {!connected && (
        <div style={{color:"#ffaa00"}}>
          Connecting to server...
        </div>
      )}

      {connected && (
        <div style={{color:"#00ffaa"}}>
          Connection established ✓
        </div>
      )}

      <div className="chatWindow">

        {messages.map((msg, index) => (
          <div key={index}>
            <span style={{color:"#00ffaa"}}>
              &gt; {msg.username}
            </span>
            : {msg.content}
          </div>
        ))}

        <div ref={chatEndRef} />

      </div>

      <div className="inputLine">

        <span style={{color:"#00ffaa"}}>&gt;</span>

        <input
          className="input"
          placeholder="nickname"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
        />

        <span style={{marginLeft:10}}>:</span>

        <input
          className="input"
          placeholder={connected ? "message" : "connecting..."}
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={!connected}
        />

        <span className="cursor">▋</span>

      </div>

    </div>

  );
}

export default App;