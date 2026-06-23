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
  serverTimestamp,
  onSnapshot,
  runTransaction
} from "./firebase";

const ASSOCIATION = {
  name: "Associazione Gianmarco De Maria",
  title: "Corsa Solidale IN PIGIAMA",
  color: "rgb(210, 40, 121)",
  logo: "https://www.gianmarcodemaria.it/wp-content/uploads/2023/12/LogoSoloFiorePNG2.png",
  social: {
    instagram: "https://www.instagram.com/associazionegianmarcodemaria/",
    facebook: "https://www.facebook.com/groups/41555539043/"
  }
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

// Stessa logica di AdminRaffle.slugify: chiave univoca del nickname.
// "Marco", "marco " e "MARCO" collidono come dovrebbero.
function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\wàèéìòù]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Codice premio personale, mostrato solo nell'app dell'utente e usato
// dallo staff per verificare l'identità del vincitore al ritiro.
// Alfabeto senza caratteri ambigui (niente I/O/0/1).
function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

const IS_MOBILE =
  typeof navigator !== "undefined" &&
  (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent)));

// Su mobile prova ad aprire l'app nativa; se non si apre entro la soglia,
// ricade sull'URL web. Su desktop lascia navigare il link normalmente.
function openSocial(event, appUrl, webUrl) {
  if (!IS_MOBILE) return;

  event.preventDefault();

  let appOpened = false;
  const onVisibilityChange = () => {
    if (document.hidden) appOpened = true;
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.location.href = appUrl;

  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (!appOpened) {
      window.location.href = webUrl;
    }
  }, 1200);
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
  const [code, setCode] = useState(restored?.code || "");
  const [prizeWon, setPrizeWon] = useState(null);

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
      completed,
      code
    });
  }, [nickname, started, found, completed, code]);

  // Ascolta in tempo reale se questo utente è stato estratto come vincitore.
  // Solo il proprietario può leggere winners/{uid} (vedi firestore.rules).
  useEffect(() => {
    if (!user) return undefined;

    const unsubscribe = onSnapshot(
      doc(db, "winners", user.uid),
      (snapshot) => {
        setPrizeWon(snapshot.exists() ? snapshot.data() : null);
      },
      (error) => {
        console.error(error);
      }
    );

    return () => unsubscribe();
  }, [user]);

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

    const slug = slugify(cleanNickname);

    if (!slug) {
      setStatus("Nickname non valido. Usa lettere o numeri.");
      setBusy(false);
      return;
    }

    // Codice personale: generato una sola volta e poi riusato.
    const playerCode = code || generateCode();

    try {
      // Prenotazione atomica del nickname. La transazione legge il documento
      // nicknames/{slug}: se esiste ed è di un altro utente il nickname è
      // occupato; altrimenti lo riserva a questo uid. Niente race condition.
      await runTransaction(db, async (tx) => {
        const slugRef = doc(db, "nicknames", slug);
        const slugSnap = await tx.get(slugRef);

        if (slugSnap.exists() && slugSnap.data().uid !== user.uid) {
          throw new Error("NICKNAME_TAKEN");
        }

        tx.set(
          slugRef,
          {
            uid: user.uid,
            nickname: cleanNickname,
            createdAt: serverTimestamp()
          },
          { merge: true }
        );
      });

      await setDoc(
        doc(db, "participants", user.uid),
        {
          uid: user.uid,
          nickname: cleanNickname,
          slug,
          code: playerCode,
          found,
          completed: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      setCode(playerCode);
      setNickname(cleanNickname);
      setStarted(true);
      setStatus("Trova i 5 unicorni nascosti al Campo Scuola!");
    } catch (error) {
      if (error.message === "NICKNAME_TAKEN") {
        setStatus("Questo nickname è già in uso. Scegline un altro.");
      } else {
        console.error(error);
        setStatus("Non riesco a salvare il partecipante. Controlla la rete.");
      }
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

    // Garantisce un codice anche se l'utente è ripartito da localStorage.
    const playerCode = code || generateCode();
    if (!code) setCode(playerCode);

    try {
      await stopScanner();

      await setDoc(
        doc(db, "participants", user.uid),
        {
          uid: user.uid,
          nickname,
          code: playerCode,
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
        code: playerCode,
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
    setCode("");
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

        <nav className="social-links" aria-label="Social Associazione Gianmarco De Maria">
          <a
            className="social-link instagram"
            href={ASSOCIATION.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) =>
              openSocial(
                e,
                "instagram://user?username=associazionegianmarcodemaria",
                ASSOCIATION.social.instagram
              )
            }
          >
            <svg
              className="social-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.62c-3.15 0-3.52.01-4.76.07-.92.04-1.42.2-1.75.33-.44.17-.76.38-1.09.71-.33.33-.54.65-.71 1.09-.13.33-.29.83-.33 1.75-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.92.2 1.42.33 1.75.17.44.38.76.71 1.09.33.33.65.54 1.09.71.33.13.83.29 1.75.33 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.92-.04 1.42-.2 1.75-.33.44-.17.76-.38 1.09-.71.33-.33.54-.65.71-1.09.13-.33.29-.83.33-1.75.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.92-.2-1.42-.33-1.75a2.94 2.94 0 0 0-.71-1.09 2.94 2.94 0 0 0-1.09-.71c-.33-.13-.83-.29-1.75-.33-1.24-.06-1.61-.07-4.76-.07Zm0 2.76a5.42 5.42 0 1 1 0 10.84 5.42 5.42 0 0 1 0-10.84Zm0 1.62a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm5.6-2.9a1.27 1.27 0 1 1 0 2.54 1.27 1.27 0 0 1 0-2.54Z" />
            </svg>
            Instagram
          </a>
          <a
            className="social-link facebook"
            href={ASSOCIATION.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) =>
              openSocial(e, "fb://group/41555539043", ASSOCIATION.social.facebook)
            }
          >
            <svg
              className="social-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
            </svg>
            Facebook
          </a>
        </nav>
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
              {nickname && (
                <p className="player-tag">
                  Stai giocando come <strong>{nickname}</strong>
                </p>
              )}

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
              {prizeWon ? (
                <>
                  <div className="big-unicorn">🏆🎉</div>
                  <h3>Hai vinto{prizeWon.prizeIndex ? ` il premio ${prizeWon.prizeIndex}` : ""}!</h3>
                  <p>
                    Complimenti <strong>{nickname}</strong>! Mostra questo codice
                    allo staff per ritirare il premio.
                  </p>
                </>
              ) : (
                <>
                  <div className="big-unicorn">🏆🦄</div>
                  <h3>Challenge completata!</h3>
                  <p>
                    Grande! Il nickname <strong>{nickname}</strong> è stato
                    inserito nella ruota dell’estrazione.
                  </p>
                </>
              )}

              {code && (
                <div className={`prize-code ${prizeWon ? "is-winner" : ""}`}>
                  <span className="prize-code-label">Il tuo codice premio</span>
                  <span className="prize-code-value">{code}</span>
                  <span className="prize-code-hint">
                    Serve allo staff per verificare che il premio sia davvero tuo.
                  </span>
                </div>
              )}
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