// Ponto de entrada principal das Cloud Functions
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Importa e exporta as funções do módulo provision
const provision = require('./provision/index');

exports.provisionNewSchool = provision.provisionNewSchool;

// Outras funções podem ser exportadas aqui
