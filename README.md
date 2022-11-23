# Project Seminar - Summer Semester 2022

Development of an environment-aware, map-based, mobile video call application to support digital teaching

# Deployed version of the app
- Heroku app: http://map-to-school.herokuapp.com
- *Note*: To test the most simple use case, open two tabs, one for Tutor role and one for the Student role. The password for tutor role is **Tutor**, for student role is **Tutand**. There can be only one Tutor in a session 

# Key Features
There are 3 modes:
- Alle sehen alle (standard): everyone can see each other, just like a normal Zoom session
- Nur Tutor sichtbar: Only the tutor is visible to everyone, students can only see themselves' and tutor's camera. This is useful for the lecture
- Tischgruppen: Only the people "sitting" at the same table can see each other. This is useful for small discussions

# Installation guide

## Clone project

```
git clone https://github.com/duynguyen1509/map-based-video-call.git
```

## Install dependencies

```
npm install peerjs (auf Mac: sudo npm install peerjs)
npm install
```

## Test on local host

```
node server.js
(oder npm run devStart)
```

Then enter `localhost:8081` in the browser
