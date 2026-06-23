import React, { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";

import {
  auth,
  db,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  serverTimestamp
} from "./firebase";

const ASSOCIATION = {
  name: "Associazione Gianmarco De Maria",
  title: "Corsa Solidale IN PIGIAMA",
  color: "rgb(210, 40, 121)",
  logo: "https://www.gianmarcodemaria.it/wp-content/uploads/2023/12/LogoSoloFiorePNG2.png"
};

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\wàèéìòù]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default function AdminRaffle() {
  const wheelRef = useRef(null);

  const [authUser, setAuthUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [completions, setCompletions] = useState([]);
  const [manuals, setManuals] = useState([]);
  const [manualNickname, setManualNickname] = useState("");
  const [prizeCount, setPrizeCount] = useState(3);
  const [winners, setWinners] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [status, setStatus] = useState("Accedi come admin per vedere la ruota.");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser?.email) return;

    const q1 = query(collection(db, "completions"), orderBy("completedAt", "asc"));
    const q2 = query(collection(db, "manualEntries"), orderBy("createdAt", "asc"));

    const unsub1 = onSnapshot(
      q1,
      (snapshot) => {
        setCompletions(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }))
        );
      },
      (error) => {
        console.error(error);
        setStatus("Errore lettura completati. Controlla regole Firestore.");
      }
    );

    const unsub2 = onSnapshot(
      q2,
      (snapshot) => {
        setManuals(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }))
        );
      },
      (error) => {
        console.error(error);
        setStatus("Errore lettura inserimenti manuali.");
      }
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [authUser]);

  const participants = useMemo(() => {
    const map = new Map();

    completions.forEach((item) => {
      if (item.nickname) {
        const uid = item.uid || item.id;
        map.set(`auto-${uid}`, {
          id: `auto-${uid}`,
          uid,
          nickname: item.nickname,
          code: item.code || null,
          source: "challenge"
        });
      }
    });

    manuals.forEach((item) => {
      if (item.nickname) {
        map.set(`manual-${item.id}`, {
          id: `manual-${item.id}`,
          uid: null,
          nickname: item.nickname,
          code: null,
          source: "manuale"
        });
      }
    });

    return Array.from(map.values());
  }, [completions, manuals]);

  async function login(e) {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStatus("Admin connesso.");
    } catch (error) {
      console.error(error);
      setStatus("Login non riuscito. Controlla email e password.");
    }
  }

  async function addManualNickname() {
    const clean = manualNickname.trim().replace(/\s+/g, " ").slice(0, 24);

    if (!clean) {
      setStatus("Inserisci un nickname manuale valido.");
      return;
    }

    const id = `${slugify(clean)}-${Date.now()}`;

    try {
      await setDoc(doc(db, "manualEntries", id), {
        nickname: clean,
        source: "manuale",
        createdAt: serverTimestamp()
      });

      setManualNickname("");
      setStatus(`Nickname manuale aggiunto: ${clean}`);
    } catch (error) {
      console.error(error);
      setStatus("Non riesco ad aggiungere il nickname manuale.");
    }
  }

  async function drawWinners() {
    if (participants.length === 0) {
      setStatus("Nessun partecipante disponibile.");
      return;
    }

    const n = Math.max(1, Math.min(Number(prizeCount), participants.length));

    setSpinning(true);
    setWinners([]);
    setStatus("La ruota gira...");

    const wheel = wheelRef.current;

    if (wheel) {
      const turns = 360 * 6 + Math.floor(Math.random() * 360);
      wheel.style.transform = `rotate(${turns}deg)`;
    }

    window.setTimeout(async () => {
      const selected = shuffle(participants).slice(0, n);

      setWinners(selected);
      setSpinning(false);
      setStatus(`Estratti ${selected.length} vincitori.`);

      confetti({
        particleCount: 200,
        spread: 130,
        origin: { y: 0.55 }
      });

      const drawId = `draw-${Date.now()}`;

      try {
        await setDoc(doc(db, "draws", drawId), {
          winners: selected,
          prizeCount: n,
          totalParticipants: participants.length,
          createdAt: serverTimestamp()
        });

        // Notifica in tempo reale ogni vincitore della challenge nella sua app.
        // I nickname manuali non hanno uid, quindi vengono saltati.
        await Promise.all(
          selected
            .filter((w) => w.uid)
            .map((w) =>
              setDoc(doc(db, "winners", w.uid), {
                uid: w.uid,
                nickname: w.nickname,
                prizeIndex: selected.indexOf(w) + 1,
                drawId,
                wonAt: serverTimestamp()
              })
            )
        );
      } catch (error) {
        console.error(error);
        setStatus(
          "Vincitori estratti, ma non sono riuscito a salvare lo storico estrazione."
        );
      }
    }, 3600);
  }

  if (!authUser?.email) {
    return (
      <div className="page game-bg">
        <header className="hero">
          <img src={ASSOCIATION.logo} alt="Logo Associazione Gianmarco De Maria" />
          <p className="eyebrow">{ASSOCIATION.name}</p>
          <h1>{ASSOCIATION.title}</h1>
          <h2>Estrazione Premi</h2>
        </header>

        <main className="card start-card">
          <h3>Accesso Admin</h3>

          <form onSubmit={login} className="admin-form">
            <input
              className="nickname-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email admin"
            />

            <input
              className="nickname-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            <button className="primary-btn" type="submit">
              Entra
            </button>
          </form>

          <p className="status">{status}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="page game-bg">
      <header className="hero">
        <img src={ASSOCIATION.logo} alt="Logo Associazione Gianmarco De Maria" />
        <p className="eyebrow">{ASSOCIATION.name}</p>
        <h1>{ASSOCIATION.title}</h1>
        <h2>Ruota dell’Estrazione</h2>
      </header>

      <main className="admin-layout">
        <section className="card wheel-card">
          <div className="wheel-pointer">▼</div>

          <div className="wheel" ref={wheelRef}>
            {participants.length === 0 ? (
              <span className="wheel-empty">🦄</span>
            ) : (
              participants.slice(0, 24).map((p, index) => {
                const angle = (360 / Math.min(participants.length, 24)) * index;

                return (
                  <span
                    key={p.id}
                    className="wheel-name"
                    style={{
                      transform: `rotate(${angle}deg) translate(0, -135px) rotate(${-angle}deg)`
                    }}
                  >
                    {p.nickname}
                  </span>
                );
              })
            )}
          </div>

          <div className="raffle-controls">
            <label>
              Numero premi
              <input
                className="small-input"
                type="number"
                min="1"
                max={Math.max(1, participants.length)}
                value={prizeCount}
                onChange={(e) => setPrizeCount(e.target.value)}
              />
            </label>

            <button
              className="primary-btn"
              onClick={drawWinners}
              disabled={spinning || participants.length === 0}
            >
              {spinning ? "Estrazione..." : "Estrai vincitori"}
            </button>
          </div>

          <p className="status">{status}</p>
        </section>

        <section className="card admin-panel">
          <h3>Partecipanti completati: {participants.length}</h3>

          <div className="manual-add">
            <input
              className="nickname-input"
              value={manualNickname}
              onChange={(e) => setManualNickname(e.target.value)}
              placeholder="Nickname manuale"
            />
            <button className="ghost-btn" onClick={addManualNickname}>
              Aggiungi
            </button>
          </div>

          <div className="participant-list">
            {participants.map((p) => (
              <div key={p.id} className="participant-pill">
                <span>{p.nickname}</span>
                <small>{p.source}</small>
              </div>
            ))}
          </div>

          {winners.length > 0 && (
            <div className="winners-box">
              <h3>🏆 Vincitori</h3>
              <ol>
                {winners.map((w, index) => (
                  <li key={w.id}>
                    Premio {index + 1}: <strong>{w.nickname}</strong>
                    {w.code ? (
                      <span className="winner-code"> · codice {w.code}</span>
                    ) : (
                      <span className="winner-code manual"> · (manuale)</span>
                    )}
                  </li>
                ))}
              </ol>
              <p className="winner-verify-hint">
                Verifica: il codice qui sopra deve combaciare con quello mostrato
                nell’app del vincitore.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}