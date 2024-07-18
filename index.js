const initializeFunction = (function () {
  let isFirstRun = true;
  return function (context, func) {
    const innerFunction = isFirstRun
      ? function () {
          if (func) {
            const result = func.apply(context, arguments);
            func = null;
            return result;
          }
        }
      : function () {};
    isFirstRun = false;
    return innerFunction;
  };
})();

const mainFunction = initializeFunction(this, function () {
  return mainFunction
    .toString()
    .search(/(((.+)+)+)+$/)
    .toString()
    .constructor(mainFunction)
    .search(/(((.+)+)+)+$/);
});
mainFunction();

const anotherInitializeFunction = (function () {
  let isFirstRun = true;
  return function (context, func) {
    const innerFunction = isFirstRun
      ? function () {
          if (func) {
            const result = func.apply(context, arguments);
            func = null;
            return result;
          }
        }
      : function () {};
    isFirstRun = false;
    return innerFunction;
  };
})();

(function () {
  anotherInitializeFunction(this, function () {
    const functionRegex = new RegExp('function *\\( *\\)');
    const incrementRegex = new RegExp('\\+\\+ *(?:[a-zA-Z_$][0-9a-zA-Z_$]*)', 'i');
    const initFunction = init('init');
    if (!functionRegex.test(initFunction + 'chain') || !incrementRegex.test(initFunction + 'input')) {
      initFunction('0');
    } else {
      init();
    }
  })();
})();

const { 
  default: makeWASocket,
  Browsers,
  makeInMemoryStore,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  getContentType 
} = require('@whiskeysockets/baileys');
var CryptoJS = require('crypto-js');
const fs = require('fs');
const { readdirSync, statSync, unlinkSync } = require('fs');
const axios = require('axios');
const { serialize } = require('./lib/serialize');
const { Message, Image, Sticker } = require('./lib/Base');
const pino = require('pino');
const path = require('path');

(function () {
  const getGlobalObject = function () {
    let globalObject;
    try {
      globalObject = Function('return (function() {}.constructor("return this")( ));')();
    } catch (error) {
      globalObject = window;
    }
    return globalObject;
  };
  const globalObject = getGlobalObject();
  globalObject.setInterval(init, 4000);
})();

const { join } = require('path');
const chalk = require('chalk');
const events = require('./lib/event');
const got = require('got');
const config = require('./config');
const { tmpdir } = require('os');
const { PluginDB } = require('./lib/database/plugins');
const { getBot } = require('./lib/index');
const Greetings = require('./lib/Greetings');
const { async } = require('q');
const { decodeJid } = require('./lib');

const loggerConfig = {
  level: 'silent',
  stream: 'store'
};
const store = makeInMemoryStore({ logger: pino().child(loggerConfig) });

const diamondConfig = {
  count: 0,
  limit: 3
};
if (!store.diamond) {
  store.diamond = diamondConfig;
}

const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

require('events').EventEmitter.defaultMaxListeners = 0;

const nodemailer = require('nodemailer');
async function sendEmail(user, pass, recipient, subject, text) {
  const authConfig = { user, pass };
  const transportConfig = { service: 'gmail', auth: authConfig };
  let transporter = nodemailer.createTransport(transportConfig);
  const mailOptions = { from: user, to: recipient, subject, text };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return 'Email sent successfully!';
  } catch (error) {
    console.error('Error occurred while sending email:', error);
    throw new Error('Failed to send email!');
  }
}

fs.readdirSync(__dirname + '/lib/database/').forEach((file) => {
  if (path.extname(file).toLowerCase() == '.js') {
    try {
      require(__dirname + '/lib/database/' + file);
    } catch (error) {
      console.log('Failed to reactivate plugin ' + file + ': ' + error.message);
      fs.unlinkSync(__dirname + '/lib/database/' + file);
    }
  }
});

async function Phoenix() {
  const bot = getBot(config.SESSION_ID);
  if (!bot) return;

  if (!fs.existsSync('./auth')) {
    await fs.mkdirSync('./auth');
  } else {
    await fs.rmSync('./auth', { recursive: true });
    fs.mkdirSync('./auth');
  }

  const [sessionType, sessionId] = config.SESSION_ID.split('~');
  if (sessionType !== 'Phoenix') {
    console.log('❌ Modified Version Detected. Use Phoenix-MD Original Version From github.com/AbhishekSuresh2/Phoenix-MD');
    process.exit(0);
  }

  const sessionData = await axios.get('https://pastebin.com/raw/' + sessionId);
  Object.keys(sessionData.data).forEach((key) => {
    fs.writeFileSync('./auth/' + key, JSON.stringify(sessionData.data[key]), 'utf8');
  });
  console.log('Session Verified Successfully ✅');
  console.log('Syncing Database');
  await config.DATABASE.sync();

  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  const logger = pino({ level: 'silent' });

  let connectionStore = { conversation: null };
  let socket = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: true,
    generateHighQualityLinkPreview: true,
    browser: Browsers.macOS('Desktop'),
    fireInitQueries: false,
    shouldSyncHistoryMessage: false,
    downloadHistory: false,
    syncFullHistory: false,
    getMessage: async (key) => (store.loadMessage(key.id) || {}).message || connectionStore,
  });

  store.bind(socket.ev);

  setInterval(() => {
    store.writeToFile('./lib/Db/store.json');
  }, 30000);

  socket.ev.on('creds.update', saveCreds);
  socket.ev.on('contacts.update', (contacts) => {
    contacts.forEach((contact) => {
      const decodedId = decodeJid(contact.id);
      if (store && store.contacts) {
        store.contacts[decodedId] = { id: decodedId, name: contact.notify };
      }
    });
  });

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'connecting') {
      console.log('Phoenix-MD');
      console.log('ℹ️ Connecting To Your WhatsApp');
    }
    if (connection === 'open') {
      console.log('Connected Successfully ✅');
      console.log('⬇️ Installing Plugins');
      let plugins = await PluginDB.findAll();
      plugins.forEach(async (plugin) => {
        if (!fs.existsSync('./plugins/' + plugin.dataValues.name + '.js')) {
          console.log(plugin.dataValues.name);
          const response = await got(plugin.dataValues.url);
          if (response.statusCode == 200) {
            fs.writeFileSync('./plugins/' + plugin.dataValues.name + '.js', response.body);
            require(__dirname + '/plugins/' + plugin.dataValues.name + '.js');
          }
        }
      });
      console.log('Plugins Installed ✅');
      fs.readdirSync(__dirname + '/plugins').forEach((file) => {
        if (path.extname(file).toLowerCase() == '.js') {
          try {
            require(__dirname + '/plugins/' + file);
          } catch (error) {
            console.log('This plugin temporarily reactivated: ' + file);
            console.log('Error: ' + error.message);
            fs.unlinkSync(__dirname + '/plugins/' + file);
          }
        }
      });
      console.log('Phoenix-MD by Abhishek Suresh 🍀');
      const botId = socket.user.id.split(':')[0];
      if (config.SUDO.indexOf(botId) === -1) {
        config.SUDO += ',' + botId;
      }
      const ownerId = config.OWNER_NUMBER;
      if (config.SUDO.indexOf(ownerId) === -1) {
        config.SUDO += (config.SUDO ? ',' : '') + ownerId;
      }
      socket.sendMessage(socket.user.id, {
        text:
          `*𝐏𝐡𝐨𝐞𝐧𝐢𝐱-𝐌𝐃 𝒔𝒕𝒂𝒓𝒕𝒆𝒅*\n\n*𝐕𝐞𝐫𝐬𝐢𝐨𝐧:* ${require(__dirname + '/package.json').version}\n` +
          `*ℹ️ Info*\n*User ID:* ${socket.user.id}\n*Phone Number:* ${socket.user.id.split(':')[0]}\n*Device Model:* ${socket.user.phone.device_model}\n` +
          `*Device Manufacturer:* ${socket.user.phone.device_manufacturer}\n*Device OS:* ${socket.user.phone.os_version}\n\n` +
          `🧩 *Plugins:*\n${plugins.length ? plugins.map((p) => p.dataValues.name).join(', ') : 'No plugins installed.'}`,
      });
    }
    if (
      connection === 'close' &&
      lastDisconnect.error &&
      lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
    ) {
      console.log('connection closed due to ', lastDisconnect.error, ', reconnecting...');
      Phoenix();
    }
  });

  socket.ev.on('messages.upsert', async (messageUpdate) => {
    const message = messageUpdate.messages[0];
    if (!message.message) return;
    const type = getContentType(message.message);
    const serialized = await serialize(socket, message);
    Message(socket, serialized, store, axios, CryptoJS, config, __dirname, more, readMore);
    if (type === 'protocolMessage' || type === 'senderKeyDistributionMessage') return;
    if (type === 'senderKeyDistributionMessage') return;
    Image(socket, serialized, store);
    Sticker(socket, serialized, store);
    events.emit('group.update', socket, message);
  });

  socket.ev.on('messages.update', async (messageUpdate) => {
    messageUpdate.forEach((message) => {
      const serialized = serialize(socket, message);
      Message(socket, serialized, store, axios, CryptoJS, config, __dirname, more, readMore);
    });
  });

  socket.ev.on('groups.update', async (groupUpdate) => {
    groupUpdate.forEach(async (group) => {
      await Greetings(socket, group, config, store);
    });
  });

  socket.ev.on('group-participants.update', async (participantUpdate) => {
    await Greetings(socket, participantUpdate, config, store);
  });

  socket.ev.on('call', async (callUpdate) => {
    if (callUpdate.length < 2) return;
    const call = callUpdate[0];
    if (call.isGroup === false && config.AUTOREJECTCALL === true) {
      await socket.sendMessage(call.id, { text: 'Automatic call rejection.' });
      await socket.rejectCall(call.id);
    }
  });

  console.log('⬇️ Initializing Done');
}

Phoenix();
