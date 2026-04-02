"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Crown, Loader2, MessageSquare, Mic, MicOff,
  Monitor, PhoneOff, Send, Users, Video, VideoOff, X,
} from "lucide-react";

// ============================================================
// === TYPES & INTERFACES ===
// ============================================================

interface ZoomSessionProps {
  token: string;
  sessionName: string;
  userName: string;
  onLeave: () => void;
}

interface Participant {
  userId: number;
  displayName: string;
  bVideoOn: boolean;
  muted: boolean;
  isHost?: boolean;
}

interface ChatMsg {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  isSystem?: boolean;
}

type Status = "connecting" | "connected" | "error";

// ============================================================
// === STRICT MODE GUARDS ===
// ============================================================

let _leavePromise: Promise<void> | null = null;
let _joining = false;

// ============================================================
// === HELPERS ===
// ============================================================

const COLORS = [
  "#6366f1","#ec4899","#14b8a6","#f97316","#8b5cf6",
  "#06b6d4","#f43f5e","#84cc16","#3b82f6","#a855f7",
];

function avatarColor(userId: number) { return COLORS[Math.abs(userId) % COLORS.length]; }
function initials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2); }
function nowTime() { return new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}); }

function gridCols(n: number) {
  if (n <= 1) return "1fr";
  if (n <= 2) return "repeat(2,1fr)";
  if (n <= 4) return "repeat(2,1fr)";
  if (n <= 9) return "repeat(3,1fr)";
  return "repeat(4,1fr)";
}

// ============================================================
// === AVATAR BUBBLE ===
// ============================================================

function Avatar({ name, userId, size = 60 }: { name:string; userId:number; size?:number }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:avatarColor(userId),
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.34, fontWeight:700, color:"#fff", flexShrink:0,
      userSelect:"none",
    }}>
      {initials(name)}
    </div>
  );
}

// ============================================================
// === TILE OVERLAY (name bar, mute icon, badges) ===
// ============================================================

function TileOverlay({ name, muted, isHost, isYou }:
  { name:string; muted:boolean; isHost?:boolean; isYou?:boolean }) {
  return (
    <>
      {/* Bottom gradient */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background:"linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 45%)",
      }}/>
      {/* Name + mute row */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        padding:"14px 9px 7px",
        display:"flex", alignItems:"flex-end", justifyContent:"space-between",
        pointerEvents:"none",
      }}>
        <div style={{
          fontSize:12, fontWeight:600, color:"#fff",
          textShadow:"0 1px 4px rgba(0,0,0,.9)",
          display:"flex", alignItems:"center", gap:4,
          maxWidth:150, overflow:"hidden",
        }}>
          {isHost && <Crown size={11} color="#f59e0b" />}
          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
        </div>
        {muted && (
          <div style={{
            width:22, height:22, borderRadius:5,
            background:"rgba(224,59,59,.9)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <MicOff size={11} color="#fff"/>
          </div>
        )}
      </div>
      {/* Top badges */}
      {isYou && (
        <div style={{
          position:"absolute", top:7, left:7,
          background:"rgba(30,135,240,.85)", borderRadius:5,
          padding:"2px 7px", fontSize:10, fontWeight:700, color:"#fff",
        }}>You</div>
      )}
      {isHost && !isYou && (
        <div style={{
          position:"absolute", top:7, left:7,
          background:"rgba(245,158,11,.85)", borderRadius:5,
          padding:"2px 7px", fontSize:10, fontWeight:700, color:"#fff",
          display:"flex", alignItems:"center", gap:3,
        }}>
          <Crown size={9}/> Host
        </div>
      )}
    </>
  );
}

// ============================================================
// === REMOTE VIDEO TILE ===
// Each tile owns its VP container and manages attach/detach.
// ============================================================

function RemoteTile({ participant, stream, isSpeaking }: {
  participant: Participant;
  stream: any;
  isSpeaking: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const vpRef    = useRef<HTMLElement | null>(null);
  const { userId, displayName, bVideoOn, muted, isHost } = participant;

  // Create ONE video-player-container per tile (on mount)
  useEffect(() => {
    if (!mountRef.current) return;
    const vp = document.createElement("video-player-container") as HTMLElement;
    Object.assign(vp.style, { display:"block", width:"100%", height:"100%" });
    mountRef.current.appendChild(vp);
    vpRef.current = vp;
    return () => { vp.remove(); vpRef.current = null; };
  }, [userId]);

  // Attach / detach based on bVideoOn state
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp || !stream) return;

    if (bVideoOn) {
      stream.attachVideo(userId, 2)           // 2 = 180p — fine for grid tiles
        .then((el: HTMLElement) => {
          Object.assign(el.style, {
            width:"100%", height:"100%", objectFit:"cover", display:"block",
          });
          vp.appendChild(el);
        })
        .catch((e: any) => console.warn("[Zoom] attachVideo:", e));
    } else {
      stream.detachVideo(userId)
        .then((els: any) => {
          (Array.isArray(els) ? els : [els]).forEach((e: any) => e?.remove());
        })
        .catch(() => {});
    }
  }, [bVideoOn, userId, stream]);

  const border = isSpeaking
    ? "2px solid #2be08a"
    : isHost
    ? "2px solid rgba(245,158,11,.5)"
    : "2px solid transparent";
  const shadow = isSpeaking
    ? "0 0 0 1px #2be08a, 0 0 16px rgba(43,224,138,.22)"
    : "none";

  return (
    <div style={{
      position:"relative", background:"#2d2d2d", borderRadius:8,
      overflow:"hidden", minHeight:0, border, boxShadow:shadow,
      transition:"border-color .2s, box-shadow .2s",
    }}>
      {/* VP container mount */}
      <div ref={mountRef} style={{ position:"absolute", inset:0 }}/>

      {/* Camera-off placeholder — ALWAYS show if video is off */}
      {!bVideoOn && (
        <div style={{
          position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:10, background:"#2d2d2d",
        }}>
          <Avatar name={displayName} userId={userId}/>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.45)", fontWeight:500 }}>
            {displayName}
          </span>
        </div>
      )}

      <TileOverlay name={displayName} muted={muted} isHost={isHost}/>
    </div>
  );
}

// ============================================================
// === SELF VIDEO TILE ===
// CRITICAL: uses <video> element, NOT canvas.
// muted + playsInline are mandatory.
// ============================================================

function SelfTile({ name, isVideoOn, isMuted, isSpeaking, videoRef }: {
  name: string;
  isVideoOn: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const border = isSpeaking ? "2px solid #2be08a" : "2px solid transparent";
  const shadow = isSpeaking ? "0 0 0 1px #2be08a, 0 0 16px rgba(43,224,138,.22)" : "none";

  return (
    <div style={{
      position:"relative", background:"#2d2d2d", borderRadius:8,
      overflow:"hidden", minHeight:0, border, boxShadow:shadow,
      transition:"border-color .2s, box-shadow .2s",
    }}>
      {/*
        SELF-VIEW VIDEO ELEMENT
        ────────────────────────
        • muted      — CRITICAL: prevents audio echo/feedback
        • playsInline — CRITICAL: required on iOS, prevents fullscreen pop
        • autoPlay   — starts as soon as srcObject is set
        • transform: scaleX(-1) — mirror, matches Zoom's self-view feel
        • visibility (not display:none) — display:none breaks rendering in some browsers
      */}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        autoPlay
        muted
        playsInline
        style={{
          position:"absolute", inset:0, width:"100%", height:"100%",
          objectFit:"cover", display:"block",
          transform:"scaleX(-1)",
          visibility: isVideoOn ? "visible" : "hidden",
        }}
      />

      {/* Camera-off placeholder */}
      {!isVideoOn && (
        <div style={{
          position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:10, background:"#2d2d2d",
        }}>
          <Avatar name={name} userId={0}/>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.45)", fontWeight:500 }}>
            {name}
          </span>
        </div>
      )}

      <TileOverlay name={name} muted={isMuted} isYou/>
    </div>
  );
}

// ============================================================
// === CHAT PANEL ===
// ============================================================

function ChatPanel({ msgs, onSend, onClose }: {
  msgs: ChatMsg[];
  onSend: (text:string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  function send() { if (text.trim()) { onSend(text.trim()); setText(""); } }

  return (
    <div style={{
      width:340, background:"#1e1e1e",
      borderLeft:"1px solid rgba(255,255,255,.07)",
      display:"flex", flexDirection:"column", flexShrink:0,
    }}>
      <div style={{
        height:52, display:"flex", alignItems:"center",
        padding:"0 14px", borderBottom:"1px solid rgba(255,255,255,.07)", gap:10,
      }}>
        <span style={{ flex:1, fontSize:14, fontWeight:600, color:"#fff" }}>Chat</span>
        <button onClick={onClose} style={{ color:"rgba(255,255,255,.45)", padding:4, borderRadius:6, lineHeight:0 }}>
          <X size={16}/>
        </button>
      </div>

      <div style={{
        flex:1, overflowY:"auto", padding:"12px 12px 8px",
        display:"flex", flexDirection:"column", gap:3,
      }}>
        {msgs.map(m => m.isSystem ? (
          <div key={m.id} style={{
            textAlign:"center", fontSize:11, fontStyle:"italic",
            color:"rgba(255,255,255,.28)", padding:"5px 0",
          }}>
            {m.text}
          </div>
        ) : (
          <div key={m.id} style={{ display:"flex", flexDirection:"column", padding:"2px 0" }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:3 }}>
              <span style={{ fontSize:11, fontWeight:600, color: m.isMe ? "#3b82f6" : "rgba(255,255,255,.45)" }}>
                {m.sender}
              </span>
              <span style={{ fontSize:10, color:"rgba(255,255,255,.22)" }}>{m.time}</span>
            </div>
            <div style={{
              fontSize:13, lineHeight:1.55, color:"rgba(255,255,255,.9)",
              background: m.isMe ? "rgba(59,130,246,.14)" : "rgba(255,255,255,.06)",
              padding:"7px 10px", borderRadius:8,
              maxWidth:270, alignSelf: m.isMe ? "flex-end" : "flex-start",
              wordBreak:"break-word",
            }}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      <div style={{ padding:10, borderTop:"1px solid rgba(255,255,255,.07)", display:"flex", gap:7 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Message everyone…"
          style={{
            flex:1, background:"rgba(255,255,255,.07)",
            border:"1px solid rgba(255,255,255,.1)", borderRadius:8,
            padding:"8px 11px", color:"#fff", fontSize:13, outline:"none",
          }}
        />
        <button onClick={send} style={{
          width:38, height:38, borderRadius:8, background:"#1e87f0",
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          cursor:"pointer",
        }}>
          <Send size={14} color="#fff"/>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// === PARTICIPANTS PANEL ===
// ============================================================

function ParticipantsPanel({ participants, localId, onClose }: {
  participants: Participant[];
  localId: number | null;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = participants.filter(p =>
    p.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width:340, background:"#1e1e1e",
      borderLeft:"1px solid rgba(255,255,255,.07)",
      display:"flex", flexDirection:"column", flexShrink:0,
    }}>
      <div style={{
        height:52, display:"flex", alignItems:"center",
        padding:"0 14px", borderBottom:"1px solid rgba(255,255,255,.07)", gap:10,
      }}>
        <span style={{ flex:1, fontSize:14, fontWeight:600, color:"#fff" }}>
          Participants ({participants.length})
        </span>
        <button onClick={onClose} style={{ color:"rgba(255,255,255,.45)", padding:4, borderRadius:6, lineHeight:0 }}>
          <X size={16}/>
        </button>
      </div>

      <div style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          style={{
            width:"100%", background:"rgba(255,255,255,.07)",
            border:"1px solid rgba(255,255,255,.1)", borderRadius:8,
            padding:"7px 11px", color:"#fff", fontSize:13, outline:"none",
          }}
        />
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:6 }}>
        {filtered.map(p => (
          <div key={p.userId} style={{
            display:"flex", alignItems:"center", gap:9, padding:"8px",
            borderRadius:8, cursor:"default",
          }}
          onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,.05)")}
          onMouseLeave={e => (e.currentTarget.style.background="transparent")}
          >
            <Avatar name={p.displayName} userId={p.userId} size={34}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{
                fontSize:13, fontWeight:500, color:"#fff",
                display:"flex", alignItems:"center", gap:5,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>
                {p.displayName}
                {p.userId===localId && (
                  <span style={{ fontSize:9, background:"rgba(59,130,246,.2)", color:"#3b82f6", borderRadius:3, padding:"1px 5px" }}>You</span>
                )}
                {p.isHost && (
                  <span style={{ fontSize:9, background:"rgba(245,158,11,.2)", color:"#f59e0b", borderRadius:3, padding:"1px 5px" }}>Host</span>
                )}
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginTop:1 }}>
                {p.muted ? "Muted" : "Unmuted"} · {p.bVideoOn ? "Camera on" : "Camera off"}
              </div>
            </div>
            <div style={{ display:"flex", gap:5, flexShrink:0 }}>
              <span style={{ fontSize:13, opacity: p.muted ? 0.2 : 1 }} title={p.muted?"Muted":"Unmuted"}>🎤</span>
              <span style={{ fontSize:13, opacity: p.bVideoOn ? 1 : 0.2 }} title={p.bVideoOn?"Camera on":"Camera off"}>📷</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// === TOOLBAR BUTTON ===
// ============================================================

function TbBtn({ icon, label, onClick, active, danger, isLeave }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  active?: boolean; danger?: boolean; isLeave?: boolean;
}) {
  const [hov, setHov] = useState(false);

  const iconBg = isLeave
    ? (hov ? "#e03b3b" : "rgba(224,59,59,.15)")
    : danger
    ? "#e03b3b"
    : active
    ? "#1e87f0"
    : hov
    ? "rgba(255,255,255,.14)"
    : "rgba(255,255,255,.09)";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:5,
        padding:"8px 11px", borderRadius:10, cursor:"pointer",
        color: isLeave ? "#e03b3b" : danger ? "#e03b3b" : "rgba(255,255,255,.78)",
        background:"transparent", border:"none", minWidth:60,
        transition:"color .15s",
      }}
    >
      <div style={{
        width:44, height:44, borderRadius:"50%",
        background:iconBg, transition:"background .15s",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#fff",
      }}>
        {icon}
      </div>
      <span style={{ fontSize:10, fontWeight:500, letterSpacing:".1px", lineHeight:1 }}>
        {label}
      </span>
    </button>
  );
}

// ============================================================
// === MAIN COMPONENT ===
// ============================================================

export function ZoomSession({ token, sessionName, userName, onLeave }: ZoomSessionProps) {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const clientRef     = useRef<any>(null);
  const streamRef     = useRef<any>(null);
  const selfVideoRef  = useRef<HTMLVideoElement | null>(null);   // <video> for self-view
  const shareCanvasRef = useRef<HTMLCanvasElement | null>(null); // canvas for screen share view
  const localIdRef    = useRef<number | null>(null);
  const isChatOpenRef = useRef(false); // stale-closure-safe for event handlers

  // ── State ─────────────────────────────────────────────────────────────────
  const [status,        setStatus]        = useState<Status>("connecting");
  const [errorMsg,      setErrorMsg]      = useState("");
  const [participants,  setParticipants]  = useState<Participant[]>([]);
  const [activeSpeakers,setActiveSpeakers]= useState<Set<number>>(new Set());
  const [isMuted,       setIsMuted]       = useState(false);
  const [isVideoOn,     setIsVideoOn]     = useState(false);
  const [isSharing,     setIsSharing]     = useState(false);
  const [sharingUserId, setSharingUserId] = useState<number | null>(null);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [isChatOpen,    setIsChatOpen]    = useState(false);
  const [isPplOpen,     setIsPplOpen]     = useState(false);
  const [messages,      setMessages]      = useState<ChatMsg[]>([]);
  const [unread,        setUnread]        = useState(0);

  // Keep ref in sync for event handlers
  useEffect(() => { isChatOpenRef.current = isChatOpen; }, [isChatOpen]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const addMsg = useCallback((m: Omit<ChatMsg,"id">) => {
    setMessages(prev => [...prev, { ...m, id: crypto.randomUUID?.() ?? String(Date.now()+Math.random()) }]);
  }, []);

  // ── Leave ─────────────────────────────────────────────────────────────────
  const leave = useCallback(async () => {
    _joining = false;
    try { await clientRef.current?.leave(); } catch { /* ignore */ }
    onLeave();
  }, [onLeave]);

  // ── Session join effect ───────────────────────────────────────────────────
  useEffect(() => {
    if (_joining) return;
    _joining = true;

    async function startSession() {
      // Wait for any in-progress leave (React Strict Mode guard)
      if (_leavePromise) {
        try { await _leavePromise; } catch { /* ignore */ }
        _leavePromise = null;
      }

      if (typeof window !== "undefined" && !window.isSecureContext) {
        setErrorMsg("HTTPS required — use https://localhost:3000 or the deployed app.");
        setStatus("error");
        _joining = false;
        return;
      }

      try {
        const ZoomVideo = (await import("@zoom/videosdk")).default;
        const client = ZoomVideo.createClient();
        clientRef.current = client;

        await client.init("en-US", "CDN", { patchJsMedia: true });
        await client.join(sessionName, token, userName);

        setStatus("connected");
        const stream = client.getMediaStream();
        streamRef.current = stream;

        const me = client.getCurrentUserInfo?.();
        localIdRef.current = me?.userId ?? null;

        // Start audio (unmuted by default so student hears teacher)
        try { await stream.startAudio(); } catch (e: any) {
          console.warn("[Zoom] startAudio:", e?.type ?? e);
        }

        // Populate initial participants list
        const all: Participant[] = client.getAllUser?.() ?? [];
        setParticipants(all.filter(p => p.userId !== localIdRef.current));

        // System message
        addMsg({ sender:"", text:`You joined "${sessionName}"`, time:nowTime(), isMe:false, isSystem:true });

        // ── EVENT: other participants' video state ────────────────────────
        client.on("peer-video-state-change", (payload: any) => {
          const { userId, action } = payload;
          if (userId === localIdRef.current) {
            // Own video — state managed by toggleCamera()
            setIsVideoOn(action === "Start");
            return;
          }
          setParticipants(prev =>
            prev.map(p => p.userId===userId ? { ...p, bVideoOn: action==="Start" } : p)
          );
        });

        // ── EVENT: speaking detection ─────────────────────────────────────
        client.on("active-speaker-change", (payload: any) => {
          const speakers: Array<{userId:number}> = Array.isArray(payload) ? payload : [payload];
          const myId = localIdRef.current;
          const ids = new Set(speakers.map(s => s.userId));
          setActiveSpeakers(ids);
          setLocalSpeaking(ids.has(myId ?? -1) );
        });

        // ── EVENT: participants joining ───────────────────────────────────
        client.on("user-added", (payload: any) => {
          const added: Participant[] = Array.isArray(payload) ? payload : [payload];
          setParticipants(prev => {
            const map = new Map(prev.map(p => [p.userId, p]));
            for (const u of added) { if (u.userId!==localIdRef.current) map.set(u.userId,u); }
            return [...map.values()];
          });
          for (const u of added) {
            addMsg({ sender:"", text:`${u.displayName} joined`, time:nowTime(), isMe:false, isSystem:true });
          }
        });

        // ── EVENT: participants leaving ───────────────────────────────────
        client.on("user-removed", (payload: any) => {
          const removed: Participant[] = Array.isArray(payload) ? payload : [payload];
          const ids = new Set(removed.map(u => u.userId));
          setParticipants(prev => prev.filter(p => !ids.has(p.userId)));
        });

        // ── EVENT: participant state update (mute, etc.) ──────────────────
        client.on("user-updated", (payload: any) => {
          const updates: any[] = Array.isArray(payload) ? payload : [payload];
          setParticipants(prev =>
            prev.map(p => {
              const u = updates.find(u => u.userId===p.userId);
              return u ? { ...p, ...u } : p;
            })
          );
        });

        // ── EVENT: screen share ───────────────────────────────────────────
        client.on("active-share-change", async (payload: any) => {
          if (payload.state === "Active") {
            const canvas = shareCanvasRef.current;
            if (canvas) {
              const el = canvas.parentElement;
              canvas.width  = el?.clientWidth  || 1280;
              canvas.height = el?.clientHeight || 720;
              try { await stream.startShareView(canvas, payload.userId); }
              catch (e) { console.warn("[Zoom] startShareView:", e); }
            }
            setSharingUserId(payload.userId);
          } else {
            try { await stream.stopShareView(); } catch { /* ignore */ }
            setSharingUserId(null);
          }
        });

        // ── EVENT: incoming chat ──────────────────────────────────────────
        const chatClient = client.getChatClient?.();
        if (chatClient) {
          client.on("chat-on-message", (payload: any) => {
            // Skip own messages (we add them locally in sendMsg)
            if (payload.sender?.userId === localIdRef.current) return;
            addMsg({
              sender: payload.sender?.name ?? "Someone",
              text:   payload.message ?? "",
              time:   nowTime(),
              isMe:   false,
            });
            if (!isChatOpenRef.current) setUnread(u => u+1);
          });
        }

      } catch (err: any) {
        _joining = false;
        // React Strict Mode artifact — SDK still leaving from cleanup, retry after delay
        if (err?.reason==="LEAVING_MEETING" || err?.errorCode===3) {
          await new Promise(r => setTimeout(r, 700));
          _joining = true;
          startSession();
          return;
        }
        console.error("[Zoom] Session failed:", err);
        setErrorMsg(err?.message ?? "Failed to join session.");
        setStatus("error");
      }
    }

    startSession();

    return () => {
      if (clientRef.current) {
        _leavePromise = clientRef.current.leave().catch(() => {});
      }
      _joining = false;
    };
  }, [token, sessionName, userName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── MEDIA CONTROLS ────────────────────────────────────────────────────────

  async function toggleMic() {
    const s = streamRef.current;
    if (!s) return;
    try {
      if (isMuted) { await s.unmuteAudio(); setIsMuted(false); }
      else         { await s.muteAudio();   setIsMuted(true);  }
    } catch (e) { console.warn("[Zoom] toggleMic:", e); }
  }

  async function toggleCamera() {
    const s = streamRef.current;
    if (!s) return;

    if (!isVideoOn) {
      try {
        /*
         * SELF-VIEW FIX
         * ─────────────────────────────────────────────────────────────────
         * Pass the <video> element directly to startVideo().
         * This tells the Zoom SDK to render self-view into a real <video>
         * element instead of an internal canvas, which fixes the error:
         *   "Rendering self-view on Chromium without SharedArrayBuffer
         *    requires video tag"
         * The <video> element MUST have muted + playsInline attributes.
         */
        const opts: any = {};
        if (selfVideoRef.current) opts.videoElement = selfVideoRef.current;
        await s.startVideo(opts);
        setIsVideoOn(true);
      } catch (e: any) {
        console.warn("[Zoom] startVideo:", e?.type ?? e);
      }
    } else {
      try { await s.stopVideo(); setIsVideoOn(false); }
      catch (e) { console.warn("[Zoom] stopVideo:", e); }
    }
  }

  async function toggleShare() {
    const s = streamRef.current;
    if (!s) return;
    if (isSharing) {
      try { await s.stopShareScreen(); } catch { /* ignore */ }
      setIsSharing(false);
    } else {
      try {
        await s.startShareScreen(shareCanvasRef.current);
        setIsSharing(true);
      } catch (e: any) {
        if (e?.name !== "NotAllowedError") console.warn("[Zoom] startShareScreen:", e);
      }
    }
  }

  async function sendMsg(text: string) {
    // Add locally first (immediate feedback)
    addMsg({ sender:"You", text, time:nowTime(), isMe:true });
    // Send via Zoom SDK chat
    const chatClient = clientRef.current?.getChatClient?.();
    if (chatClient) {
      try { await chatClient.sendToAll(text); } catch (e) { console.warn("[Zoom] chat send:", e); }
    }
  }

  // ── STATUS SCREENS ────────────────────────────────────────────────────────

  if (status === "error") {
    return (
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        height:"100%", gap:16, padding:32, textAlign:"center", background:"#1c1c1c", color:"#fff",
      }}>
        <VideoOff size={48} color="#ef4444"/>
        <p style={{ color:"#f87171", fontSize:14, fontWeight:600, maxWidth:300 }}>{errorMsg}</p>
        <button onClick={onLeave} style={{
          marginTop:8, padding:"10px 24px", borderRadius:8,
          border:"1px solid rgba(255,255,255,.2)", color:"#fff", fontSize:14, cursor:"pointer",
        }}>
          Go Back
        </button>
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        height:"100%", gap:16, background:"#1c1c1c", color:"#fff",
      }}>
        <style>{`@keyframes zs-spin{to{transform:rotate(360deg)}}`}</style>
        <Loader2 size={44} color="#2be08a"
          style={{ animation:"zs-spin 1s linear infinite" }}/>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:15, fontWeight:600 }}>Joining session…</p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,.4)", marginTop:4 }}>{sessionName}</p>
        </div>
      </div>
    );
  }

  // ── MAIN LAYOUT ───────────────────────────────────────────────────────────

  const myId = localIdRef.current;
  const remotes = participants.filter(p => p.userId !== myId);
  const isSpeakerView = isSharing || sharingUserId !== null;
  const totalTiles = remotes.length + 1; // +1 for self

  return (
    <div style={{
      width:"100%", height:"100%", background:"#1c1c1c",
      display:"flex", flexDirection:"column",
      fontFamily:"'Inter',system-ui,sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .zs-grid { display:grid; width:100%; height:100%; gap:8px; }
        .zs-grid > * { min-height:0; aspect-ratio:16/9; }
        .zs-thumb > * { aspect-ratio:16/9; width:100%; flex-shrink:0; min-height:0; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        height:52, background:"#141414", borderBottom:"1px solid rgba(255,255,255,.07)",
        display:"flex", alignItems:"center", padding:"0 16px", gap:12, flexShrink:0,
      }}>
        <span style={{
          fontSize:14, fontWeight:600, color:"#fff", flex:1,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>
          {sessionName}
        </span>
        {isSharing && (
          <span style={{
            background:"rgba(239,68,68,.15)", color:"#ef4444",
            fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:20,
            display:"flex", alignItems:"center", gap:5, flexShrink:0,
          }}>
            <span style={{
              width:6, height:6, borderRadius:"50%", background:"#ef4444", display:"inline-block",
              animation:"zs-pulse 1s ease-in-out infinite",
            }}/>
            You are presenting
          </span>
        )}
        <style>{`@keyframes zs-pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        <span style={{ fontSize:12, color:"rgba(255,255,255,.35)", flexShrink:0 }}>
          👥 {totalTiles}
        </span>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", minHeight:0, overflow:"hidden" }}>

        {/* ── Video area ── */}
        <div style={{ flex:1, minWidth:0, position:"relative", overflow:"hidden" }}>
          {isSpeakerView ? (
            /* ── SPEAKER VIEW ── */
            <div style={{ display:"flex", height:"100%", gap:0 }}>
              {/* Main large panel */}
              <div style={{ flex:1, position:"relative", background:"#000", minWidth:0 }}>
                <canvas
                  ref={shareCanvasRef}
                  style={{ position:"absolute", inset:0, width:"100%", height:"100%", display:"block" }}
                />
                {!sharingUserId && !isSharing && (
                  <div style={{
                    position:"absolute", inset:0, display:"flex",
                    alignItems:"center", justifyContent:"center",
                    flexDirection:"column", gap:12, color:"rgba(255,255,255,.2)",
                  }}>
                    <Monitor size={52}/>
                    <span style={{ fontSize:13 }}>Screen share ended</span>
                  </div>
                )}
              </div>
              {/* Right thumbnail strip */}
              <div className="zs-thumb" style={{
                width:168, background:"#141414", flexShrink:0,
                padding:8, display:"flex", flexDirection:"column", gap:8, overflowY:"auto",
              }}>
                <SelfTile
                  name={userName}
                  isVideoOn={isVideoOn}
                  isMuted={isMuted}
                  isSpeaking={localSpeaking && !isMuted}
                  videoRef={selfVideoRef}
                />
                {remotes.map(p => (
                  <RemoteTile
                    key={p.userId}
                    participant={p}
                    stream={streamRef.current}
                    isSpeaking={activeSpeakers.has(p.userId)}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ── GALLERY VIEW ── */
            <div style={{ padding:10, height:"100%", display:"flex", alignItems:"center", overflow:"hidden" }}>
              <div
                className="zs-grid"
                style={{ gridTemplateColumns: gridCols(totalTiles) }}
              >
                <SelfTile
                  name={userName}
                  isVideoOn={isVideoOn}
                  isMuted={isMuted}
                  isSpeaking={localSpeaking && !isMuted}
                  videoRef={selfVideoRef}
                />
                {remotes.map(p => (
                  <RemoteTile
                    key={p.userId}
                    participant={p}
                    stream={streamRef.current}
                    isSpeaking={activeSpeakers.has(p.userId)}
                  />
                ))}
              </div>
              {/* Hidden canvas for screen share (always in DOM for ref stability) */}
              <canvas ref={shareCanvasRef} style={{ display:"none" }}/>
            </div>
          )}
        </div>

        {/* ── Chat sidebar ── */}
        {isChatOpen && (
          <ChatPanel
            msgs={messages}
            onSend={sendMsg}
            onClose={() => setIsChatOpen(false)}
          />
        )}

        {/* ── Participants sidebar ── */}
        {isPplOpen && (
          <ParticipantsPanel
            participants={[
              { userId: myId??0, displayName:userName, bVideoOn:isVideoOn, muted:isMuted },
              ...remotes,
            ]}
            localId={myId}
            onClose={() => setIsPplOpen(false)}
          />
        )}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div style={{
        height:76,
        background:"rgba(14,14,14,.96)",
        backdropFilter:"blur(20px)",
        WebkitBackdropFilter:"blur(20px)",
        borderTop:"1px solid rgba(255,255,255,.07)",
        display:"flex", alignItems:"center", justifyContent:"center",
        gap:3, padding:"0 20px", flexShrink:0,
      }}>
        <TbBtn
          icon={isMuted ? <MicOff size={18}/> : <Mic size={18}/>}
          label={isMuted ? "Unmute" : "Mute"}
          onClick={toggleMic}
          active={!isMuted}
          danger={isMuted}
        />
        <TbBtn
          icon={isVideoOn ? <Video size={18}/> : <VideoOff size={18}/>}
          label={isVideoOn ? "Stop Video" : "Start Video"}
          onClick={toggleCamera}
          active={isVideoOn}
          danger={!isVideoOn}
        />
        <TbBtn
          icon={<Monitor size={18}/>}
          label={isSharing ? "Stop Share" : "Share Screen"}
          onClick={toggleShare}
          active={isSharing}
        />

        {/* Divider */}
        <div style={{ width:1, height:36, background:"rgba(255,255,255,.1)", margin:"0 6px" }}/>

        <TbBtn
          icon={
            <div style={{ position:"relative" }}>
              <MessageSquare size={18}/>
              {unread > 0 && (
                <span style={{
                  position:"absolute", top:-7, right:-7,
                  background:"#e03b3b", color:"#fff", fontSize:9, fontWeight:700,
                  minWidth:15, height:15, borderRadius:8, padding:"0 3px",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
          }
          label="Chat"
          onClick={() => {
            const next = !isChatOpen;
            setIsChatOpen(next);
            if (next) { setUnread(0); setIsPplOpen(false); }
          }}
          active={isChatOpen}
        />
        <TbBtn
          icon={<Users size={18}/>}
          label="Participants"
          onClick={() => { setIsPplOpen(o => !o); setIsChatOpen(false); }}
          active={isPplOpen}
        />

        {/* Divider */}
        <div style={{ width:1, height:36, background:"rgba(255,255,255,.1)", margin:"0 6px" }}/>

        <TbBtn
          icon={<PhoneOff size={18}/>}
          label="Leave"
          onClick={leave}
          isLeave
        />
      </div>
    </div>
  );
}
