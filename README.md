# Contesto progetto — Acchiappapeluche

## Associazione Gianmarco De Maria — Corsa Solidale IN PIGIAMA

Questo documento raccoglie il contesto completo della progettazione fatta in chat temporanea, così da poter continuare il lavoro in una nuova sessione.

---

# 1. Obiettivo del progetto

L’**Associazione Gianmarco De Maria**, con sede a Cosenza, supporta bambini e famiglie nell’ambito dell’oncologia pediatrica di Cosenza.

L’associazione sta organizzando un evento di lead generation:

**Corsa Solidale IN PIGIAMA**
Luogo: **Campo Scuola di Cosenza**
Data: **3 luglio 2026**

Durante l’evento si vuole proporre ai partecipanti una challenge interattiva via smartphone:

**Acchiappapeluche**

L’idea è che i partecipanti cerchino 5 peluche nascosti o posizionati nell’area dell’evento. Ogni peluche ha un QR code plastificato. L’utente inquadra il QR con la web app e registra il peluche trovato.

Quando l’utente trova tutti e 5 i peluche, il suo nickname viene salvato in Firebase e viene inserito nella ruota dell’estrazione premi.

---

# 2. Identità visiva

Sito associazione:

```text
https://www.gianmarcodemaria.it/
```

Logo:

```text
https://www.gianmarcodemaria.it/wp-content/uploads/2023/12/LogoSoloFiorePNG2.png
```

Colore principale associazione:

```css
rgb(210, 40, 121)
```

Dicitura principale da mostrare nell’app:

```text
Corsa Solidale IN PIGIAMA
```

Stile grafico richiesto:

```text
grafica tipo gioco / gaming / colorata / adatta anche a bambini e famiglie
```

Font consigliati:

* **Fredoka** per testi, bottoni e UI.
* **Bungee** per titoli gaming.
* Variante più arcade: **Press Start 2P**, ma meno leggibile su smartphone.

Scelta consigliata:

```text
Fredoka + Bungee
```

---

# 3. Architettura scelta

Soluzione consigliata:

```text
React + Vite
GitHub Pages
Firebase Spark Plan
Firebase Authentication
Cloud Firestore
html5-qrcode
canvas-confetti
```

Si è scelto di usare i QR sui pupazzi come modalità primaria, perché è molto più affidabile di un modello TensorFlow.js in un evento reale con luce variabile, smartphone diversi e movimento.

Il riconoscimento TensorFlow.js resta una possibile estensione futura, ma non come MVP principale.

---

# 4. Perché QR e non TensorFlow.js

La modalità TensorFlow.js richiederebbe:

1. Dataset fotografico dei pupazzi.
2. Foto da molte angolazioni.
3. Foto con luci diverse.
4. Addestramento modello.
5. Conversione per TensorFlow.js.
6. Test su smartphone reali.
7. Ottimizzazione prestazioni.

Invece il QR:

1. È più stabile.
2. È veloce da sviluppare.
3. È molto più affidabile.
4. Funziona su smartphone normali.
5. È adatto a 500 utenti.
6. Riduce il rischio tecnico durante l’evento.

Payload QR dei 5 peluche (il prefisso resta `UNICORN:` per compatibilità con i QR già stampati):

```text
UNICORN:stella
UNICORN:luna
UNICORN:arcobaleno
UNICORN:cuore
UNICORN:fiore
```

QR iniziale dell’evento:

```text
https://TUO-USERNAME.github.io/unicorn-challenge/#/play
```

URL admin:

```text
https://TUO-USERNAME.github.io/unicorn-challenge/#/admin
```

---

# 5. App previste

## 5.1 App partecipante

Percorso:

1. L’utente fotografa il QR iniziale dell’evento.
2. Si apre la web app.
3. Inserisce un nickname.
4. L’app fa login anonimo su Firebase.
5. Si apre la fotocamera.
6. L’utente cerca 5 peluche.
7. Ogni peluche viene riconosciuto tramite QR code.
8. Nel footer appaiono i 5 peluche con spunta per quelli trovati.
9. Quando li trova tutti, l’app salva il completamento su Firestore.
10. Se chiude involontariamente la pagina, lo stato resta salvato in `localStorage`.

## 5.2 App admin / estrazione

Percorso:

1. Admin apre la pagina `/admin`.
2. Fa login con email/password Firebase.
3. Vede i nickname di chi ha completato.
4. Può inserire nickname manuali.
5. Imposta numero premi.
6. Clicca “Estrai”.
7. La ruota gira e seleziona N vincitori senza duplicati.
8. L’estrazione viene salvata su Firestore.

---

# 6. Repository consigliato

Un solo repository GitHub:

```text
unicorn-challenge/
  package.json
  index.html
  vite.config.js
  src/
    App.jsx
    main.jsx
    firebase.js
    styles.css
    AdminRaffle.jsx
```

Routing tramite hash:

```text
/#/play
/#/admin
```

Questa scelta è adatta a GitHub Pages perché evita problemi con il refresh delle route.

---

# 7. Creazione progetto React

Comandi:

```bash
npm create vite@latest unicorn-challenge -- --template react
cd unicorn-challenge

npm install firebase html5-qrcode canvas-confetti
npm install -D gh-pages
```

---

# 8. package.json

```json
{
  "name": "unicorn-challenge",
  "version": "1.0.0",
  "private": true,
  "homepage": "https://TUO-USERNAME.github.io/unicorn-challenge",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "dependencies": {
    "canvas-confetti": "^1.9.3",
    "firebase": "^12.0.0",
    "html5-qrcode": "^2.3.8",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "gh-pages": "^6.3.0",
    "vite": "^7.0.0"
  }
}
```

Nota: se una versione non è disponibile nel proprio ambiente, usare le versioni proposte automaticamente da Vite/npm.

---

# 9. vite.config.js

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/unicorn-challenge/"
});
```

Il valore `base` deve corrispondere al nome del repository GitHub.

Esempio:

```js
base: "/corsa-pigiama/"
```

se il repository si chiama `corsa-pigiama`.

---

# 10. index.html

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="theme-color" content="#d22879" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <link
      href="https://fonts.googleapis.com/css2?family=Bungee&family=Fredoka:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <title>Corsa Solidale IN PIGIAMA - Acchiappapeluche</title>
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

# 11. Firebase — servizi da usare

Usare:

```text
Firebase Spark Plan
Authentication
Cloud Firestore
```

Non serve usare:

```text
Firebase Hosting
Cloud Functions
Cloud Storage
App Hosting
Blaze Plan
```

GitHub Pages ospita il frontend. Firebase serve solo come backend serverless.

---

# 12. Configurazione Firebase step by step

## 12.1 Creare progetto

Andare su:

```text
https://console.firebase.google.com/
```

Creare progetto:

```text
unicorn-challenge-agm
```

Google Analytics può essere disattivato per semplicità.

Verificare che il piano sia:

```text
Spark
```

---

## 12.2 Creare Web App Firebase

Nella dashboard Firebase cliccare icona Web:

```text
</>
```

Nome app:

```text
Unicorn Challenge Web
```

Non abilitare Firebase Hosting.

Copiare la config Firebase.

Esempio:

```js
const firebaseConfig = {
  apiKey: "xxx",
  authDomain: "unicorn-challenge-agm.firebaseapp.com",
  projectId: "unicorn-challenge-agm",
  storageBucket: "unicorn-challenge-agm.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## 12.3 Abilitare Authentication

Percorso:

```text
Build → Authentication → Get started → Sign-in method
```

Abilitare:

```text
Anonymous
Email/Password
```

Anonymous serve ai partecipanti.

Email/Password serve all’admin.

---

## 12.4 Creare utente admin

Percorso:

```text
Build → Authentication → Users → Add user
```

Email esempio:

```text
admin@gianmarcodemaria.it
```

Usare una password robusta, meglio se generata da password manager.

---

## 12.5 Creare Firestore

Percorso:

```text
Build → Firestore Database → Create database
```

Scegliere:

```text
Start in production mode
```

Scegliere una regione europea, se disponibile:

```text
eur3 - Europe
```

oppure altra regione europea proposta dalla console.

---

## 12.6 Authorized domains

Percorso:

```text
Build → Authentication → Settings → Authorized domains
```

Aggiungere:

```text
TUO-USERNAME.github.io
```

Non inserire l’intero URL, solo il dominio.

Corretto:

```text
mariorossi.github.io
```

Errato:

```text
https://mariorossi.github.io/unicorn-challenge/
```

---

# 13. src/firebase.js

```js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";

import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  onSnapshot,
  query,
  orderBy,
  getDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "INSERISCI_API_KEY",
  authDomain: "INSERISCI_AUTH_DOMAIN",
  projectId: "INSERISCI_PROJECT_ID",
  storageBucket: "INSERISCI_STORAGE_BUCKET",
  messagingSenderId: "INSERISCI_MESSAGING_SENDER_ID",
  appId: "INSERISCI_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  signInAnonymously,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  onSnapshot,
  query,
  orderBy,
  getDoc
};
```

---

# 14. Firestore Rules

Percorso:

```text
Build → Firestore Database → Rules
```

Sostituire la email admin con quella reale.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn()
        && request.auth.token.email in [
          "admin@gianmarcodemaria.it"
        ];
    }

    function validNickname(nickname) {
      return nickname is string
        && nickname.size() > 0
        && nickname.size() <= 24;
    }

    function validFoundMap(found) {
      return found is map
        && found.keys().hasOnly([
          "stella",
          "luna",
          "arcobaleno",
          "cuore",
          "fiore"
        ]);
    }

    match /participants/{uid} {
      allow create: if signedIn()
        && request.auth.uid == uid
        && request.resource.data.uid == request.auth.uid
        && validNickname(request.resource.data.nickname);

      allow update: if signedIn()
        && request.auth.uid == uid
        && resource.data.uid == request.auth.uid
        && request.resource.data.uid == request.auth.uid
        && validNickname(request.resource.data.nickname)
        && (
          !("found" in request.resource.data)
          || validFoundMap(request.resource.data.found)
        );

      allow read: if isAdmin();

      allow delete: if isAdmin();
    }

    match /completions/{uid} {
      allow create: if signedIn()
        && request.auth.uid == uid
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.completed == true
        && validNickname(request.resource.data.nickname);

      allow read: if isAdmin();

      allow update, delete: if isAdmin();
    }

    match /manualEntries/{id} {
      allow read, create, update, delete: if isAdmin();
    }

    match /draws/{id} {
      allow read, create, update, delete: if isAdmin();
    }
  }
}
```

---

# 15. Collezioni Firestore previste

Non vanno create manualmente.

Saranno create automaticamente.

## participants

Un documento per ogni utente anonimo.

Esempio:

```json
{
  "uid": "abc123",
  "nickname": "SuperLuna",
  "found": {
    "stella": true,
    "cuore": true
  },
  "completed": false,
  "createdAt": "...",
  "updatedAt": "..."
}
```

## completions

Solo utenti che completano la challenge.

```json
{
  "uid": "abc123",
  "nickname": "SuperLuna",
  "completed": true,
  "source": "challenge",
  "completedAt": "..."
}
```

## manualEntries

Nickname aggiunti manualmente dall’admin.

```json
{
  "nickname": "Mario",
  "source": "manuale",
  "createdAt": "..."
}
```

## draws

Storico estrazioni.

```json
{
  "winners": [
    {
      "id": "auto-abc123",
      "nickname": "SuperLuna",
      "source": "challenge"
    }
  ],
  "prizeCount": 3,
  "totalParticipants": 120,
  "createdAt": "..."
}
```

---

# 16. src/main.jsx

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import AdminRaffle from "./AdminRaffle.jsx";
import "./styles.css";

function Router() {
  const hash = window.location.hash || "#/play";

  if (hash.startsWith("#/admin")) {
    return <AdminRaffle />;
  }

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
```

---

# 17. src/App.jsx

```jsx
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
  }, [started, user]);

  useEffect(() => {
    if (allFound && !completed && user) {
      completeChallenge();
    }
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
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch {
      // evita errori quando React smonta il componente
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
```

Nota tecnica: in alcune versioni recenti di React/Vite, gli hook con dipendenze incomplete possono generare warning ESLint. Se servisse, stabilizzare `startScanner`, `stopScanner`, `completeChallenge` con `useCallback`, oppure disabilitare la regola solo nei punti necessari.

---

# 18. src/AdminRaffle.jsx

```jsx
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
        map.set(`auto-${item.uid || item.id}`, {
          id: `auto-${item.uid || item.id}`,
          nickname: item.nickname,
          source: "challenge"
        });
      }
    });

    manuals.forEach((item) => {
      if (item.nickname) {
        map.set(`manual-${item.id}`, {
          id: `manual-${item.id}`,
          nickname: item.nickname,
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

      try {
        await setDoc(doc(db, "draws", `draw-${Date.now()}`), {
          winners: selected,
          prizeCount: n,
          totalParticipants: participants.length,
          createdAt: serverTimestamp()
        });
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
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
```

---

# 19. src/styles.css

```css
:root {
  --agm-pink: rgb(210, 40, 121);
  --agm-pink-dark: rgb(165, 20, 88);
  --agm-yellow: #ffe066;
  --agm-blue: #6ecbff;
  --agm-purple: #8e6cff;
  --agm-bg: #fff2f8;
  --text: #35172a;
  --white: #ffffff;
  --shadow: 0 18px 45px rgba(93, 20, 64, 0.18);

  --font-body: "Fredoka", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-game: "Bungee", system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text);
  background: var(--agm-bg);
}

button,
input {
  font: inherit;
}

.page {
  min-height: 100vh;
  padding: 18px 16px 110px;
}

.game-bg {
  background:
    radial-gradient(circle at 15% 12%, rgba(255, 224, 102, 0.95), transparent 18%),
    radial-gradient(circle at 85% 20%, rgba(110, 203, 255, 0.85), transparent 20%),
    radial-gradient(circle at 15% 80%, rgba(142, 108, 255, 0.45), transparent 22%),
    linear-gradient(160deg, #fff7fb 0%, #ffe0ef 45%, #fff2f8 100%);
}

.hero {
  text-align: center;
  max-width: 820px;
  margin: 0 auto 18px;
}

.hero img {
  width: 82px;
  height: 82px;
  object-fit: contain;
  filter: drop-shadow(0 8px 14px rgba(210, 40, 121, 0.25));
}

.eyebrow {
  margin: 6px 0 0;
  font-weight: 800;
  color: var(--agm-pink);
  letter-spacing: 0.03em;
}

.hero h1 {
  margin: 4px 0;
  font-family: var(--font-game);
  font-size: clamp(1.55rem, 5vw, 3.4rem);
  line-height: 1.08;
  text-transform: uppercase;
  color: var(--agm-pink);
  text-shadow: 3px 3px 0 #fff, 7px 7px 0 rgba(210, 40, 121, 0.15);
}

.hero h2 {
  margin: 0;
  font-family: var(--font-game);
  font-size: clamp(1.15rem, 4.2vw, 2.2rem);
  color: #35172a;
}

.card h3,
.winners-box h3 {
  font-family: var(--font-game);
  letter-spacing: 0.02em;
}

.card {
  width: min(720px, 100%);
  margin: 0 auto;
  padding: 22px;
  border: 4px solid rgba(210, 40, 121, 0.18);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow);
  backdrop-filter: blur(8px);
}

.start-card {
  text-align: center;
}

.big-unicorn {
  font-size: 5rem;
  line-height: 1;
  animation: floaty 2.2s ease-in-out infinite;
}

.nickname-input {
  width: 100%;
  min-height: 52px;
  padding: 12px 16px;
  margin: 10px 0;
  border: 3px solid rgba(210, 40, 121, 0.25);
  border-radius: 18px;
  outline: none;
  background: #fff;
}

.nickname-input:focus {
  border-color: var(--agm-pink);
  box-shadow: 0 0 0 4px rgba(210, 40, 121, 0.12);
}

.primary-btn,
.ghost-btn {
  min-height: 52px;
  padding: 12px 18px;
  border: 0;
  border-radius: 999px;
  font-weight: 900;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}

.primary-btn {
  color: #fff;
  background: linear-gradient(135deg, var(--agm-pink), var(--agm-pink-dark));
  box-shadow: 0 10px 0 rgba(122, 18, 72, 0.25);
}

.ghost-btn {
  color: var(--agm-pink);
  background: #fff;
  border: 3px solid rgba(210, 40, 121, 0.25);
}

.primary-btn:active,
.ghost-btn:active {
  transform: translateY(3px);
  box-shadow: none;
}

.primary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.status {
  min-height: 28px;
  font-weight: 800;
  color: var(--agm-pink-dark);
}

.scanner-card {
  text-align: center;
}

.scanner-frame {
  overflow: hidden;
  border-radius: 24px;
  border: 5px dashed rgba(210, 40, 121, 0.35);
  background: #111;
}

#unicorn-qr-reader {
  width: 100%;
}

.progress-text {
  margin: 12px 0;
  font-weight: 900;
  font-size: 1.25rem;
}

.completed-box {
  text-align: center;
}

.unicorn-footer {
  position: fixed;
  left: 10px;
  right: 10px;
  bottom: 10px;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  max-width: 820px;
  margin: 0 auto;
  padding: 8px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow);
}

.unicorn-slot {
  display: flex;
  min-height: 72px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 18px;
  border: 3px solid rgba(210, 40, 121, 0.18);
  font-size: 0.72rem;
  font-weight: 900;
  background: #fff;
  opacity: 0.72;
}

.unicorn-slot.found {
  opacity: 1;
  background: linear-gradient(180deg, #fff, #ffeaf4);
  border-color: var(--agm-pink);
}

.unicorn-emoji {
  font-size: 1.7rem;
}

.admin-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 18px;
  max-width: 1120px;
  margin: 0 auto;
}

.wheel-card,
.admin-panel {
  width: 100%;
}

.wheel-card {
  position: relative;
  text-align: center;
}

.wheel-pointer {
  position: relative;
  z-index: 2;
  margin-bottom: -10px;
  font-size: 2.4rem;
  color: var(--agm-pink);
}

.wheel {
  position: relative;
  width: min(340px, 82vw);
  height: min(340px, 82vw);
  margin: 0 auto 20px;
  border-radius: 50%;
  border: 10px solid #fff;
  background:
    conic-gradient(
      from 0deg,
      #ffd1e6,
      #ffe066,
      #c4f0ff,
      #e3d7ff,
      #ffd1e6
    );
  box-shadow:
    inset 0 0 0 10px rgba(210, 40, 121, 0.22),
    var(--shadow);
  transition: transform 3.6s cubic-bezier(0.16, 0.9, 0.18, 1);
}

.wheel::after {
  content: "🦄";
  position: absolute;
  inset: 50%;
  width: 86px;
  height: 86px;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff;
  font-size: 2.7rem;
  box-shadow: 0 8px 18px rgba(93, 20, 64, 0.18);
}

.wheel-name {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 96px;
  margin-left: -48px;
  margin-top: -12px;
  font-size: 0.68rem;
  font-weight: 900;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.wheel-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 6rem;
}

.raffle-controls {
  display: flex;
  justify-content: center;
  align-items: end;
  gap: 12px;
  flex-wrap: wrap;
}

.raffle-controls label {
  display: grid;
  gap: 6px;
  font-weight: 900;
  color: var(--agm-pink-dark);
}

.small-input {
  width: 90px;
  min-height: 48px;
  border: 3px solid rgba(210, 40, 121, 0.25);
  border-radius: 16px;
  text-align: center;
  font-weight: 900;
}

.admin-form {
  display: grid;
  gap: 8px;
}

.manual-add {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}

.participant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
  margin-top: 16px;
  padding: 4px;
}

.participant-pill {
  display: inline-flex;
  flex-direction: column;
  padding: 8px 12px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid rgba(210, 40, 121, 0.2);
  font-weight: 900;
}

.participant-pill small {
  color: var(--agm-pink);
  font-size: 0.65rem;
}

.winners-box {
  margin-top: 18px;
  padding: 16px;
  border-radius: 22px;
  background: #fff3c4;
  border: 3px solid #ffe066;
}

.winners-box h3 {
  margin-top: 0;
}

.winners-box li {
  margin: 8px 0;
  font-size: 1.1rem;
}

@keyframes floaty {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }

  50% {
    transform: translateY(-10px) rotate(2deg);
  }
}

@media (max-width: 820px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 18px;
  }

  .unicorn-footer {
    grid-template-columns: repeat(5, 1fr);
  }

  .unicorn-slot {
    min-height: 64px;
    font-size: 0.62rem;
  }

  .unicorn-emoji {
    font-size: 1.45rem;
  }
}
```

---

# 20. Build e deploy GitHub Pages

## 20.1 Build locale

```bash
npm run build
```

Questo crea la cartella:

```text
dist/
```

## 20.2 Deploy con gh-pages

Prima configurare Git:

```bash
git init
git add .
git commit -m "Prima versione Unicorn Challenge"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/unicorn-challenge.git
git push -u origin main
```

Poi pubblicare:

```bash
npm run deploy
```

Questo comando fa:

```bash
npm run build
```

e pubblica `dist` sul branch:

```text
gh-pages
```

## 20.3 Configurazione GitHub Pages

Nel repository GitHub:

```text
Settings → Pages
```

Selezionare:

```text
Source: Deploy from a branch
Branch: gh-pages
Folder: /root
```

URL finale:

```text
https://TUO-USERNAME.github.io/unicorn-challenge/
```

Challenge:

```text
https://TUO-USERNAME.github.io/unicorn-challenge/#/play
```

Admin:

```text
https://TUO-USERNAME.github.io/unicorn-challenge/#/admin
```

---

# 21. Errore frequente: pagina bianca su GitHub Pages

Quasi sempre è colpa di `base` in `vite.config.js`.

Deve essere:

```js
base: "/NOME-REPOSITORY/"
```

Esempio:

```js
base: "/unicorn-challenge/"
```

Poi rifare:

```bash
npm run deploy
```

---

# 22. Checklist Firebase

```text
[ ] Firebase project creato
[ ] Piano Spark attivo
[ ] Web App registrata
[ ] firebaseConfig copiato in src/firebase.js
[ ] Authentication Anonymous abilitato
[ ] Authentication Email/Password abilitato
[ ] Utente admin creato
[ ] Firestore creato in production mode
[ ] Rules pubblicate
[ ] Dominio github.io autorizzato
[ ] Test /#/play completato
[ ] Documento completions creato
[ ] Login /#/admin funzionante
[ ] Nickname completati visibili nella ruota
[ ] Estrazione premi funzionante
```

---

# 23. Checklist evento

Prima del 3 luglio 2026:

```text
[ ] Testare app su iPhone Safari
[ ] Testare app su Android Chrome
[ ] Stampare QR grandi, almeno 6–8 cm
[ ] Plastificare QR
[ ] Evitare plastificazione lucida se crea riflessi
[ ] Fissare bene i QR ai pupazzi
[ ] Testare scansione QR da 30–80 cm
[ ] Preparare power bank
[ ] Preparare smartphone/tablet admin
[ ] Fare prova generale con almeno 20 telefoni
[ ] Preparare piano B con inserimento manuale nickname
[ ] Verificare che il dominio GitHub Pages sia autorizzato in Firebase
[ ] Verificare che Firestore non sia in test mode
```

---

# 24. Note su carico Firebase

Stima per 500 utenti:

```text
500 creazioni partecipanti
2.500 aggiornamenti scansione unicorni
500 completamenti
500-2.000 letture admin
poche scritture manuali
poche scritture estrazioni
```

Totale indicativo:

```text
3.500-4.000 write
500-2.000 read
```

Sotto il free tier Firestore standard.

---

# 25. Possibili miglioramenti futuri

## 25.1 PWA installabile

Aggiungere:

```text
manifest.webmanifest
service worker
icone app
offline shell
```

## 25.2 Anti-cheat leggero

Possibili controlli:

```text
salvare timestamp per ogni unicorno
evitare completamenti troppo rapidi
inserire QR con token più lungo
```

Esempio QR più sicuro:

```text
UNICORN:stella:AGM2026
```

## 25.3 Privacy

Non raccogliere dati personali reali.

Usare solo nickname.

Aggiungere messaggio:

```text
Non inserire nome e cognome. Usa un nickname.
```

## 25.4 Ruota più scenografica

La ruota attuale mostra fino a 24 nomi per leggibilità.

Per più partecipanti si può mostrare:

```text
nickname casuali durante animazione
vincitore finale grande
lista completa a lato
```

## 25.5 TensorFlow.js

Tenere come esperimento futuro, non come MVP principale.

Struttura possibile:

```text
src/scanners/qrScanner.js
src/scanners/tensorflowScanner.js
```

Parametro:

```js
const SCANNER_MODE = "qr";
// oppure
const SCANNER_MODE = "tensorflow";
```

---

# 26. Prompt utile per continuare in nuova chat

Copia questo testo in una nuova sessione:

```text
Sto sviluppando una React PWA per l’Associazione Gianmarco De Maria di Cosenza, evento “Corsa Solidale IN PIGIAMA”, 3 luglio 2026, Campo Scuola di Cosenza.

L’app è una Unicorn Challenge: i partecipanti inseriscono un nickname, scansionano 5 QR code applicati a pupazzi unicorno e, quando li trovano tutti, vengono salvati in Firebase Firestore per l’estrazione premi.

Stack scelto:
- React + Vite
- GitHub Pages
- Firebase Spark Plan
- Firebase Authentication anonima per partecipanti
- Firebase Email/Password per admin
- Cloud Firestore
- html5-qrcode
- canvas-confetti
- localStorage per recupero progressi
- routing hash: /#/play e /#/admin

Brand:
- colore rgb(210, 40, 121)
- logo https://www.gianmarcodemaria.it/wp-content/uploads/2023/12/LogoSoloFiorePNG2.png
- stile gaming
- font Fredoka + Bungee

QR unicorni:
UNICORN:stella
UNICORN:luna
UNICORN:arcobaleno
UNICORN:cuore
UNICORN:fiore

Ho già un primo codice per:
- src/App.jsx
- src/AdminRaffle.jsx
- src/firebase.js
- src/main.jsx
- src/styles.css
- vite.config.js
- package.json
- regole Firestore

Voglio continuare da questo contesto.
```

---

# 27. Stato attuale della progettazione

La soluzione è stata progettata top-down.

Scelte confermate:

```text
[OK] QR code come modalità principale
[OK] Firebase Spark come backend gratuito
[OK] GitHub Pages come hosting gratuito
[OK] App unica con /#/play e /#/admin
[OK] localStorage per chiusura involontaria
[OK] Admin con login email/password
[OK] Firestore Rules per separare utenti anonimi e admin
[OK] Grafica gaming con colori associazione
[OK] Font gaming Fredoka + Bungee
[OK] Possibilità di aggiungere nickname manuali
[OK] Numero premi parametrico
```

Prossimo step consigliato:

```text
Creare progetto localmente, copiare i file, configurare Firebase, fare test locale, poi deploy su GitHub Pages.
```
