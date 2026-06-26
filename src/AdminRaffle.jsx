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
  deleteDoc,
  getDocs,
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

const ORDINALS = [
  "primo",
  "secondo",
  "terzo",
  "quarto",
  "quinto",
  "sesto",
  "settimo",
  "ottavo",
  "nono",
  "decimo"
];

function ordinal(n) {
  return ORDINALS[n - 1] || `${n}°`;
}

export default function AdminRaffle() {
  const wheelRef = useRef(null);
  const rotationRef = useRef(0);

  const [authUser, setAuthUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [completions, setCompletions] = useState([]);
  const [manuals, setManuals] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [manualNickname, setManualNickname] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [prizeCount, setPrizeCount] = useState(3);
  const [winners, setWinners] = useState([]);
  const [drawTarget, setDrawTarget] = useState(0);
  const [awaitingNext, setAwaitingNext] = useState(false);
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

    const unsub3 = onSnapshot(
      collection(db, "hidden"),
      (snapshot) => {
        setHidden(snapshot.docs.map((d) => d.id));
      },
      (error) => {
        console.error(error);
        setStatus("Errore lettura nomi nascosti.");
      }
    );

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [authUser]);

  const hiddenIds = useMemo(() => new Set(hidden), [hidden]);

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

    return Array.from(map.values()).filter((p) => !hiddenIds.has(p.id));
  }, [completions, manuals, hiddenIds]);

  // Spicchi della ruota in SVG: uno per partecipante, con testo orientato
  // lungo il raggio e bordi evidenti.
  const WHEEL_PALETTE = [
    "#ffd1e6",
    "#ffe066",
    "#c4f0ff",
    "#e3d7ff",
    "#ffc9de",
    "#d6f5d6",
    "#ffe0c4"
  ];
  const WHEEL_CAP = 36;

  const wheelSlices = useMemo(() => {
    const list = participants.slice(0, WHEEL_CAP);
    const n = list.length;
    if (n === 0) return [];

    const step = 360 / n;
    const cx = 50;
    const cy = 50;
    const R = 47; // raggio degli spicchi
    const rLabelInner = 14.5; // dove inizia il testo, vicino al mozzo

    // angolo in gradi misurato in senso orario dall'alto (ore 12)
    const toXY = (r, deg) => {
      const a = ((deg - 90) * Math.PI) / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };

    return list.map((p, i) => {
      const start = i * step;
      const end = (i + 1) * step;
      const mid = start + step / 2;

      const [x0, y0] = toXY(R, start);
      const [x1, y1] = toXY(R, end);
      const largeArc = step > 180 ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;

      // Sulla metà sinistra il testo radiale risulterebbe capovolto:
      // lo ribaltiamo così resta leggibile dall'esterno.
      const flip = mid > 180 && mid < 360;
      const rot = flip ? mid + 90 : mid - 90;
      const anchor = flip ? "end" : "start";
      const tx = flip ? -rLabelInner : rLabelInner;

      const raw = p.nickname || "";
      const label = raw.length > 15 ? `${raw.slice(0, 14)}…` : raw;

      return {
        id: p.id,
        fill: WHEEL_PALETTE[i % WHEEL_PALETTE.length],
        path,
        rot,
        anchor,
        tx,
        label
      };
    });
  }, [participants]);

  const wheelLabelSize = Math.max(
    1.9,
    Math.min(3.3, 24 / Math.max(1, wheelSlices.length))
  );

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

  // Nasconde un partecipante dalla ruota (es. nome offensivo o scurrile).
  // Non cancella il dato originale: scrive un segnaposto nella collezione
  // "hidden" così l'esclusione è condivisa e reversibile.
  async function hideParticipant(p) {
    const ok = window.confirm(`Rimuovere "${p.nickname}" dalla ruota?`);
    if (!ok) return;

    try {
      await setDoc(doc(db, "hidden", p.id), {
        participantId: p.id,
        nickname: p.nickname,
        hiddenAt: serverTimestamp()
      });
      setStatus(`"${p.nickname}" rimosso dalla ruota.`);
    } catch (error) {
      console.error(error);
      setStatus("Non riesco a rimuovere il partecipante.");
    }
  }

  // Reset totale del gioco: cancella partecipanti, inserimenti manuali,
  // esclusioni e storico estrazioni. Operazione irreversibile.
  async function resetGame() {
    const ok = window.confirm(
      "RESET GIOCO\n\nVerranno eliminati TUTTI i partecipanti, gli inserimenti manuali, i nomi nascosti e lo storico estrazioni.\n\nL'operazione è irreversibile. Continuare?"
    );
    if (!ok) return;

    setStatus("Reset in corso...");

    try {
      const collections = [
        "completions",
        "manualEntries",
        "hidden",
        "winners",
        "draws"
      ];

      for (const name of collections) {
        const snap = await getDocs(collection(db, name));
        await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, name, d.id))));
      }

      setWinners([]);
      setDrawTarget(0);
      setAwaitingNext(false);
      setSpinning(false);
      rotationRef.current = 0;
      if (wheelRef.current) wheelRef.current.style.transform = "rotate(0deg)";

      setStatus("Gioco resettato: tutti i dati sono stati cancellati.");
    } catch (error) {
      console.error(error);
      setStatus("Errore durante il reset. Controlla le regole Firestore.");
    }
  }

  // Fa girare la ruota fermandola con la freccia (in alto, ore 12) sullo
  // spicchio del vincitore indicato. La rotazione è cumulativa, così ogni
  // estrazione successiva continua a girare in avanti invece di "saltare".
  function alignAndSpin(winner) {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const slices = wheelSlices.length;
    const idx = wheelSlices.findIndex((s) => s.id === winner.id);
    const current = rotationRef.current;

    let target;

    if (slices > 0 && idx >= 0) {
      const step = 360 / slices;
      // Centro dello spicchio, in gradi orari dall'alto.
      const mid = idx * step + step / 2;
      // Rotazione (mod 360) che porta quel centro sotto la freccia in alto.
      const targetResidue = (360 - (mid % 360)) % 360;
      target = current - (current % 360) + targetResidue;
      while (target < current + 360 * 5) target += 360;
    } else {
      // Vincitore non visibile sulla ruota (oltre il cap): giro generico.
      target = current + 360 * 6 + Math.floor(Math.random() * 360);
    }

    rotationRef.current = target;
    wheel.style.transform = `rotate(${target}deg)`;
  }

  // Estrae UN vincitore per giro, escludendo chi ha già vinto nei giri
  // precedenti (`alreadyWon`), così le estrazioni successive non ripescano
  // gli stessi nomi.
  function runSpin(index, target, alreadyWon) {
    const pool = participants.filter(
      (p) => !alreadyWon.some((w) => w.id === p.id)
    );

    if (pool.length === 0) {
      setSpinning(false);
      setAwaitingNext(false);
      setStatus(
        `Estratti ${alreadyWon.length} vincitori: partecipanti esauriti.`
      );
      if (alreadyWon.length > 0) saveDraw(alreadyWon);
      return;
    }

    setSpinning(true);
    setAwaitingNext(false);
    setStatus(
      target > 1
        ? `La ruota gira per il ${ordinal(index + 1)} premio di ${target}...`
        : "La ruota gira..."
    );

    const winner = shuffle(pool)[0];
    alignAndSpin(winner);

    window.setTimeout(() => {
      const updated = [...alreadyWon, winner];

      setWinners(updated);
      setSpinning(false);

      confetti({
        particleCount: 200,
        spread: 130,
        origin: { y: 0.55 }
      });

      const isLast = index + 1 >= target || updated.length >= participants.length;

      if (isLast) {
        setStatus(`Estratti ${updated.length} vincitori.`);
        saveDraw(updated);
      } else {
        setAwaitingNext(true);
        setStatus(
          `Premio ${index + 1} a ${winner.nickname}. Procedere con l'estrazione del ${ordinal(
            index + 2
          )}?`
        );
      }
    }, 3600);
  }

  function startDraw() {
    if (participants.length === 0) {
      setStatus("Nessun partecipante disponibile.");
      return;
    }

    const n = Math.max(1, Math.min(Number(prizeCount), participants.length));

    setDrawTarget(n);
    setWinners([]);
    setAwaitingNext(false);
    runSpin(0, n, []);
  }

  function confirmNext() {
    runSpin(winners.length, drawTarget, winners);
  }

  async function saveDraw(selected) {
    const drawId = `draw-${Date.now()}`;

    try {
      await setDoc(doc(db, "draws", drawId), {
        winners: selected,
        prizeCount: selected.length,
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

          <div className="wheel-wrap">
            <div className="wheel" ref={wheelRef}>
              {participants.length === 0 ? (
                <span className="wheel-empty">🧸</span>
              ) : (
                <svg
                  className="wheel-svg"
                  viewBox="0 0 100 100"
                  role="img"
                  aria-label="Ruota dei partecipanti"
                >
                  {wheelSlices.map((s) => (
                    <path key={s.id} className="wheel-slice" d={s.path} fill={s.fill} />
                  ))}
                  <circle
                    className="wheel-rim"
                    cx="50"
                    cy="50"
                    r="47"
                    fill="none"
                  />
                  {wheelSlices.map((s) => (
                    <text
                      key={`t-${s.id}`}
                      className="wheel-slice-label"
                      transform={`translate(50 50) rotate(${s.rot})`}
                      x={s.tx}
                      y="0"
                      textAnchor={s.anchor}
                      dominantBaseline="central"
                      fontSize={wheelLabelSize}
                    >
                      {s.label}
                    </text>
                  ))}
                </svg>
              )}
            </div>

            {/* Mozzo centrale col logo dell'associazione: sta fuori dall'elemento
                che ruota, così resta fermo mentre la ruota gira. */}
            <div className="wheel-hub">
              <img src={ASSOCIATION.logo} alt="Logo Associazione Gianmarco De Maria" />
            </div>
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
                disabled={spinning || awaitingNext}
              />
            </label>

            {awaitingNext ? (
              <button
                className="primary-btn"
                onClick={confirmNext}
                disabled={spinning}
              >
                {spinning
                  ? "Estrazione..."
                  : `Estrai il ${ordinal(winners.length + 1)}`}
              </button>
            ) : (
              <button
                className="primary-btn"
                onClick={startDraw}
                disabled={spinning || participants.length === 0}
              >
                {spinning ? "Estrazione..." : "Estrai vincitori"}
              </button>
            )}
          </div>

          <p className="status">{status}</p>
        </section>

        <section className="card admin-panel">
          <h3>Partecipanti completati: {participants.length}</h3>

          <button
            type="button"
            className="manual-toggle"
            onClick={() => setShowManual((v) => !v)}
            aria-expanded={showManual}
          >
            {showManual ? "Nascondi inserimento manuale ▲" : "Aggiungi a mano ▼"}
          </button>

          {showManual && (
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
          )}

          <div className="participant-list">
            {participants.map((p) => (
              <div key={p.id} className="participant-pill">
                <div className="participant-pill-text">
                  <span>{p.nickname}</span>
                  <small>{p.source}</small>
                </div>
                <button
                  type="button"
                  className="pill-remove"
                  onClick={() => hideParticipant(p)}
                  disabled={spinning || awaitingNext}
                  title="Rimuovi dalla ruota"
                  aria-label={`Rimuovi ${p.nickname}`}
                >
                  ×
                </button>
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

          <button
            type="button"
            className="danger-btn"
            onClick={resetGame}
            disabled={spinning || awaitingNext}
          >
            Reset gioco
          </button>
        </section>
      </main>

      <p className="version-tag">
        v{__APP_VERSION__} · {__BUILD_COMMIT__} · {__BUILD_DATE__}
      </p>
    </div>
  );
}