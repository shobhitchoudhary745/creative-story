const firebase = require("firebase-admin");
const serviceAccount = require("./keep-it-going-e4d01-firebase-adminsdk-yqyb4-7b2a2240e0.json");

firebase.initializeApp({
    credential:firebase.credential.cert(serviceAccount)
});

module.exports = {firebase};