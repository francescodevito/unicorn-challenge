import React, { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import confetti from "canvas-confetti";

import {
  auth,
  db,
  signInAnonymously,
  onAuthStateChanged,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "./firebase";

const ASSOCIATION = {
  name: "Associazione Gianmarco De Maria",
  title: "Corsa Solidale IN PIGIAMA",
  color: "rgb(210, 40, 121)",
  logo: "https://www.gianmarcodemaria.it/wp-content/uploads/2023/12/LogoSoloFiorePNG2.png"
};

const UNICORNS = [
  { id: "stella", label: "Stella", emoji: "⭐" },
  { id: "luna", label: "Luna", emoji: "🌙" },
  { id: "arcobaleno", label: "Arcobaleno", emoji: "🌈" },
  { id: "cuore", label: "Cuore", emoji: "💖" },
  { id: "fiore", label: "Fiore", emoji: "🌸" }
];

const STORAGE_KEY = "agm_unicorn_challenge_v1";

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocalState(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function normalizeNickname(value) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
}

function parseUnicornQr(decodedText) {
  if (!decodedText) return null;

  const value = decodedText.trim();

  if (!value.startsWith("UNICORN:")) {
    return null;
  }

  const id = value.replace("UNICORN:", "").trim().toLowerCase();

  const exists = UNICORNS.some((u) => u.id === id);
  return exists ? id : null;
}

export default function App() {
  const scannerRef = useRef(null);
  const scannerElementId = "unicorn-qr-reader";

  const restored = useMemo(() => loadLocalState(), []);

  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState(restored?.nickname || "");
  const [started, setStarted] = useState(Boolean(restored?.started));
  const [found, setFound] = useState(restored?.found || {});
  const [status, setStatus] = useState("Inserisci il nickname per iniziare.");
  const [cameraActive, setCameraActive] = useState(false);
  const [completed, setCompleted] = useState(Boolean(restored?.completed));
  const [busy, setBusy] = useState(false);

  const foundCount = Object.values(found).filter(Boolean).length;
  const allFound = foundCount === UNICORNS.length;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    signInAnonymously(auth).catch((error) => {
      console.error(error);
      setStatus("Errore di accesso anonimo. Controlla la connessione.");
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    saveLocalState({
      nickname,
      started,
      found,
      completed
    });
  }, [nickname, started, found, completed]);

  useEffect(() => {
    if (started && user && !cameraActive && !completed) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, user]);

  useEffect(() => {
    if (allFound && !completed && user) {
      completeChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFound, completed, user]);

  async function startGame() {
    const cleanNickname = normalizeNickname(nickname);

    if (!cleanNickname) {
      setStatus("Scegli un nickname prima di iniziare.");
      return;
    }

    if (!user) {
      setStatus("Connessione in corso. Riprova tra qualche secondo.");
      return;
    }

    setBusy(true);

    try {
      await setDoc(
        doc(db, "participants", user.uid),
        {
          uid: user.uid,
          nickname: cleanNickname,
          found,
          completed: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      setNickname(cleanNickname);
      setStarted(true);
      setStatus("Trova i 5 unicorni nascosti al Campo Scuola!");
    } catch (error) {
      console.error(error);
      setStatus("Non riesco a salvare il partecipante. Controlla la rete.");
    } finally {
      setBusy(false);
    }
  }

  async function startScanner() {
    try {
      const scanner = new Html5Qrcode(scannerElementId);
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0
      };

      await scanner.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          const unicornId = parseUnicornQr(decodedText);

          if (!unicornId) {
            setStatus("QR non valido. Cerca un QR unicorno.");
            return;
          }

          await markFound(unicornId);
        },
        () => {}
      );

      setCameraActive(true);
      setStatus("Inquadra il QR su un pupazzo unicorno.");
    } catch (error) {
      console.error(error);
      setStatus(
        "Non riesco ad aprire la fotocamera. Controlla i permessi del browser."
      );
    }
  }

  async function stopScanner() {
    if (!scannerRef.current) return;

    try {
      const state = scannerRef.current.getState?.();
      if (state) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.clear();
    } catch {
      // Evita errori rumorosi quando React smonta il componente.
    } finally {
      scannerRef.current = null;
      setCameraActive(false);
    }
  }

  async function markFound(unicornId) {
    if (found[unicornId]) {
      const item = UNICORNS.find((u) => u.id === unicornId);
      setStatus(`${item?.emoji || "🦄"} ${item?.label || "Unicorno"} già trovato!`);
      return;
    }

    const nextFound = {
      ...found,
      [unicornId]: true
    };

    setFound(nextFound);

    const item = UNICORNS.find((u) => u.id === unicornId);

    setStatus(`${item.emoji} Hai trovato ${item.label}!`);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 }
    });

    if (user) {
      try {
        await updateDoc(doc(db, "participants", user.uid), {
          found: nextFound,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error(error);
        setStatus(
          "Unicorno salvato sul telefono. La sincronizzazione online riproverà al completamento."
        );
      }
    }
  }

  async function completeChallenge() {
    setBusy(true);

    try {
      await stopScanner();

      await setDoc(
        doc(db, "participants", user.uid),
        {
          uid: user.uid,
          nickname,
          found,
          completed: true,
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      await setDoc(doc(db, "completions", user.uid), {
        uid: user.uid,
        nickname,
        completed: true,
        source: "challenge",
        completedAt: serverTimestamp()
      });

      setCompleted(true);

      confetti({
        particleCount: 180,
        spread: 120,
        origin: { y: 0.6 }
      });

      setStatus("Challenge completata! Sei nella ruota dell’estrazione.");
    } catch (error) {
      console.error(error);
      setStatus(
        "Hai completato la challenge, ma non riesco a inviare il risultato. Controlla la connessione e riapri l’app."
      );
    } finally {
      setBusy(false);
    }
  }

  function resetLocalProgress() {
    localStorage.removeItem(STORAGE_KEY);
    setNickname("");
    setStarted(false);
    setFound({});
    setCompleted(false);
    setStatus("Progressi cancellati da questo telefono.");
    stopScanner();
  }

  return (
    <div className="page game-bg">
      <header className="hero">
        <img src={ASSOCIATION.logo} alt="Logo Associazione Gianmarco De Maria" />
        <p className="eyebrow">{ASSOCIATION.name}</p>
        <h1>{ASSOCIATION.title}</h1>
        <h2>Unicorn Challenge</h2>
      </header>

      {!started && (
        <main className="card start-card">
          <div className="big-unicorn">🦄</div>
          <h3>Pronto a cercare gli unicorni?</h3>
          <p>
            Inserisci un nickname. Quando trovi tutti e 5 gli unicorni, entri
            automaticamente nell’estrazione dei premi.
          </p>

          <input
            className="nickname-input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Il tuo nickname"
            maxLength={24}
          />

          <button className="primary-btn" onClick={startGame} disabled={busy}>
            {busy ? "Avvio..." : "Inizia la challenge"}
          </button>

          <p className="status">{status}</p>
        </main>
      )}

      {started && (
        <main className="card scanner-card">
          {!completed && (
            <>
              <div className="scanner-frame">
                <div id={scannerElementId} />
              </div>

              <p className="status">{status}</p>

              <div className="progress-text">
                {foundCount} / {UNICORNS.length} unicorni trovati
              </div>
            </>
          )}

          {completed && (
            <section className="completed-box">
              <div className="big-unicorn">🏆🦄</div>
              <h3>Challenge completata!</h3>
              <p>
                Grande! Il nickname <strong>{nickname}</strong> è stato inserito
                nella ruota dell’estrazione.
              </p>
            </section>
          )}

          <button className="ghost-btn" onClick={resetLocalProgress}>
            Ricomincia su questo telefono
          </button>
        </main>
      )}

      <footer className="unicorn-footer">
        {UNICORNS.map((unicorn) => (
          <div
            key={unicorn.id}
            className={`unicorn-slot ${found[unicorn.id] ? "found" : ""}`}
          >
            <span className="unicorn-emoji">{unicorn.emoji}</span>
            <span>{unicorn.label}</span>
            <strong>{found[unicorn.id] ? "✓" : "?"}</strong>
          </div>
        ))}
      </footer>
    </div>
  );
}