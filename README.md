# PS-SoSe22

Entwicklung einer umgebungsbewussten, kartenbasierten, mobilen Videocall-
Anwendung zur Unterstützung des digitalen Lehrbetriebs

# Anleitung zur Installation

## Projekt klonen

```
git clone https://gitlab.gwdg.de/ps-mob-sose22/gruppe-3-videocall-anwendung-zur-unterstuetzung-des-digitalen-lehrbetriebs/ps-sose22.git
```

## Dependencies installieren

```
npm install peerjs (auf Mac: sudo npm install peerjs)
npm install
```

## Testen

```
node server.js
(oder npm run devStart)
```

Im Browser dann `localhost:8081` eingeben

# Aufbau

## Room.ejs

Enthält:

- Header – Quellen für Bibliotheken - in Head.ejs
- CSS-Informationen - unter Style ab Zeile 6
- Bootstrap
  - Navbar 154-163
  - Responsive Container ab 189
    - Game 193
    - Videobereich - 205
  - Modals 238 - 399
    - Login
    - Rollen
    - Moduswahl
  - Bootstrap Icons

## Game.js

- Basiert auf dem Phaser Framework
- Bestandteile wurden aus einem Open Source Tutorial übernommen für die Verwendung von Socket.io mit Phaser
  Phaser 2 CE
- wichtigste Methoden:
  - Game.preload(): Lädt alle Assets vor Zeile 9
  - Game.create(): Erstellt die Spielumgebung und wird bei Aufruf der Datei geladen Zeile 26
  - Game.getCoordinates(): Holt Koordinaten beim Klick Zeile 44
  - Game.addNewPlayer(): Funktion die alle Spieler auf die Map lädt Zeile 49
  - Game.movePlayer(): Spielerbewegung und Umgebungsbewusstsein über x und y Koordinaten Zeile 97

## Server.js

- Rouing und Setup von Express 1 - 35
- 36 - 39: Globale Variablen für Chat, Modus, Bühne und Screensharing
- 40 - 154: Reaktionen des Servers auf:
  - Spielerbeitritt und Bewegung 40 - 64
  - Kicken von Spielern 88
  - Chat 107,
  - Melden 97
  - Modi 112-125
  - Screenshare und Räume in Web-RTC 127 - 154, 79-86
- 156 getter Methode für Lsite von Spielern

## Client.js

- Zeile 1-19: Deklaration wichtigster Variablen:
  - Client{}: Objekt zur Verwaltung aller Attributen und Methoden in Client
  - myPeer: PeerObjekt -> Videoanruf
  - callsForm, callsTo[]: JS-Objekt zur Verwaltung von Calls
- Zeile 25-144: Handeln vom Stream
- Zeile 163-145: Pop-up Chat
- Zeile 187-192: Handeln der Spieler-Bewegung
- Zeile 194-306: Client.askPlayer(): Handlung nach dem erfolgreichen Log-In
- Zeile 316-332: connectToNewUser(): Methode, andere User/Spieler/Peer anzurufen
- Zeile 334-345: ANrufe beenden
- Zeile 347-397: Tutor-Privillegen
- Zeile 399-420: Share-Screen
- Zeile 422-443: Modus des Raumes ändern und abfragen
