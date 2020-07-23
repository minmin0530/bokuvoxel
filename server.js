const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const assert = require('assert');
const { dirname } = require('path');
const http = require('http').Server(app);
const io = require('socket.io')(http);

const users = new Map();
const loginUsers = [];

const url = 'mongodb://localhost:27017';
const dbName = 'myMongo';
const connectOption = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}

class Room {
  constructor() {
    this.voxel = [];
    this.users = [];
    this.roomid = null;
    this.date = null;
    this.message = [];
  }
}

const room = [
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
  new Room(),
];

/*
MongoClient.connect(url, connectOption, (err, client) => {

  assert.equal(null, err);

  console.log('Connected successfully to server');

  const db = client.db(dbName);

  client.close();
});
*/

const transactionKururiDownload = async (data, res) => {
  let client;
  let login = false;
  try {
    client = await MongoClient.connect('mongodb://127.0.0.1:27017', {useNewUrlParser:true, useUnifiedTopology:true});
    const db = client.db(dbName);
    const collection = db.collection('account');
      await collection.find({}).toArray( (err, docs) => {
        for (const doc of docs) {
          if (doc.mail == data.mail) {
            if (doc.password == data.password) {
              login = true;
              data["tempid"] = Math.floor(Math.random() * 100000);
              room[data.roomid].roomid = data.roomid;
              loginUsers.push(data);
              res.sendFile(__dirname + "/index.html");
            }
          }
        }
        if (!login) {
          res.send("login error");
        }
//        res.send(docs);
//        client.close();
      });
  } catch (error) {
    console.log(error);
  } finally {
//    client.close();
  }

//   try {
//     client = await MongoClient.connect('mongodb://127.0.0.1:27017', {useNewUrlParser:true, useUnifiedTopology:true});
//     const db = client.db(dbName);
//     const collection = db.collection('room');
//     await collection.deleteMany();
//   } catch (error) {
//     console.log(error);
//   } finally {
// //    client.close();
//   }

};

const transactionVoxelDownload = async (emitid, data, io, socketid) => {
  if (!room[loginUsers[loginUsers.length - 1].roomid].date) {
    let client;
    let login = false;
    try {
      client = await MongoClient.connect('mongodb://127.0.0.1:27017', {useNewUrlParser:true, useUnifiedTopology:true});
      const db = client.db(dbName);
      const collection = db.collection('room');
      const doc = await collection.findOne({roomid:data});
      if (doc) {
        room[loginUsers[loginUsers.length - 1].roomid].message = doc.message;
        room[loginUsers[loginUsers.length - 1].roomid].voxel = doc.voxel;
      }
     console.log("roomid:" + loginUsers[loginUsers.length - 1].roomid);
  //        client.close();
    } catch (error) {
      console.log(error);
    } finally {
  //    client.close();
    }
  }
  loginUsers[loginUsers.length - 1].socketid = socketid;
  io.sockets.connected[socketid].emit(emitid, {
    userID: loginUsers[loginUsers.length - 1].tempid,
    roomID: loginUsers[loginUsers.length - 1].roomid,
    color: loginUsers[loginUsers.length - 1].color,
    room: room[loginUsers[loginUsers.length - 1].roomid],
  });


};



const transactionKururiInsert = async (data, res) => {
  let client;
  data = Object.assign(data, {date: new Date() });
  try {
    client = await MongoClient.connect('mongodb://127.0.0.1:27017', {useNewUrlParser:true, useUnifiedTopology:true});
    const db = client.db(dbName);
    const collection = db.collection('account');
    const a = await collection.updateOne({mail:data.mail, password:data.password, name:data.name, date:data.date}, {$set:data}, true );
    if (a.result.n == 0) {
      await collection.insertOne(data);
    }
  } catch (error) {
    console.log(error);
  } finally {
    client.close();
  }
};

const transactionVoxelInsert = async (data, res) => {
  let client;
  data = Object.assign(data, {date: new Date() });
  try {
    client = await MongoClient.connect('mongodb://127.0.0.1:27017', {useNewUrlParser:true, useUnifiedTopology:true});
    const db = client.db(dbName);
    const collection = db.collection('room');
console.log(data.message);
    const a = await collection.updateOne({
      roomid: data.roomid//, voxel: data.voxel, users: data.users, date:data.date
    }, {$set:data}, true );
    if (a.result.n == 0) {
      await collection.insertOne({roomid: data.roomid, message: data.message, voxel: data.voxel, users: data.users, date: data.date});
    } else {
      console.log("insert error");
    }
  } catch (error) {
    console.log(error);
  } finally {
    client.close();
  }
};


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
//  res.sendFile(__dirname + "/login.html");
  res.sendFile(__dirname + "/index.html");
});
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + "/signup.html");
});

app.post('/signup', async (req, res) => {
  let client;
  let exist = false;
  try {
    client = await MongoClient.connect('mongodb://127.0.0.1:27017', {useNewUrlParser:true, useUnifiedTopology:true});
    const db = client.db(dbName);
    const collection = db.collection('account');
      await collection.find({}).toArray( (err, docs) => {
        console.log(docs);
        for (const doc of docs) {
//          console.log(doc.mail);
          if (doc.mail == req.body.mail){
            console.log(req.body.mail);
            exist = true;
          }
        }

        let user = {mail:"", name:"", password:""};

        if (!exist && req.body.mail != "" && req.body.password != "") {
          user["mail"] = req.body.mail;
          user["password"] = req.body.password;
          user["name"] = user.mail.substr(0, user.mail.indexOf("@"));
      //  transactionKururiDownload(req.body, res);
          transactionKururiInsert(user, res);
      
          res.sendFile(__dirname + "/signuped.html");
        } else {
          res.sendFile(__dirname + "/signuperror.html");
        }
      

      });
  } catch (error) {
    console.log(error);
  } finally {
//    client.close();
  }


});


app.post('/', (req, res) => {
/*
  let user = {
    mail:"", name:"", password:"", roomid:"", tempid:"", socketid:"",
    color: [
      Math.floor( Math.random() * 16 ),
      Math.floor( Math.random() * 16 ),
      Math.floor( Math.random() * 16 ),
      Math.floor( Math.random() * 16 ),
      Math.floor( Math.random() * 16 ),
      Math.floor( Math.random() * 16 ),
    ],
  };

  user["mail"] = req.body.mail;
  user["password"] = req.body.password;
  user["name"] = user.mail.substr(0, user.mail.indexOf("@"));
  user["roomid"] = req.body.select;
  transactionKururiDownload(user, res);

  user["roomid"] = 0;
  user["tempid"] = Math.floor(Math.random() * 100000);
  room[0].roomid = user.roomid;
  loginUsers.push(data);
*/
  res.sendFile(__dirname + "/index.html");

});



io.on('connection', socket => {

  let connected = false;
  let index = 0;
  for (const l of loginUsers) {
    if (l.socketid == socket.id) {
      connected = true;
      break;
    }
    ++index;
  }

  if (connected) {
    io.sockets.connected[socket.id].emit('connected', {
      userID: loginUsers[index].tempid,
      roomID: loginUsers[index].roomid,
      color: loginUsers[index].color,
      room: room[loginUsers[index].roomid],
    });
  } else {
    io.sockets.connected[socket.id].emit('getUserId');
  }
  socket.on('getUserId', data => {
    if (data == null) {
    let user = {
      mail:"", name:"", password:"", roomid:"", tempid:"", socketid:"",
      color: [
        Math.floor( Math.random() * 16 ),
        Math.floor( Math.random() * 16 ),
        Math.floor( Math.random() * 16 ),
        Math.floor( Math.random() * 16 ),
        Math.floor( Math.random() * 16 ),
        Math.floor( Math.random() * 16 ),
      ],
    };
    user["roomid"] = 0;
    user["tempid"] = Math.floor(Math.random() * 100000);
    room[0].roomid = user.roomid;
    loginUsers.push(user);

    transactionVoxelDownload('connected', loginUsers[loginUsers.length - 1].roomid, io, socket.id);
    } else {
  let index = loginUsers.length - 1;
/*
  for (const l of loginUsers) {
    if (l.tempid == data) {
      break;
    }
    ++index;
  }
*/
console.log("index:"+index);
    io.sockets.connected[socket.id].emit('connected', {
      userID: data,//loginUsers[index].tempid,
      roomID: 0,//loginUsers[index].roomid,
      //color: loginUsers[index].color,
      color: [
        Math.floor( Math.random() * 16 ),
        Math.floor( Math.random() * 16 ),
        Math.floor( Math.random() * 16 ),
        Math.floor( Math.random() * 16 ),
        Math.floor( Math.random() * 16 ),
        Math.floor( Math.random() * 16 ),
      ],
      room: room[0],
    });
    }
  });
  socket.on('selectRoom', data => {
    loginUsers[loginUsers.length - 1].roomid = data;    
    transactionVoxelDownload('selectRoom', data, io, socket.id);


  });
  socket.on('saveRoom', data => {
//    room[data].date = new Date();
    room[data].roomid = data;
    transactionVoxelInsert(room[data]);
  });

  socket.on('loadRoom', data => {
  });

  socket.on('put', data => {
    room[data.roomID].date = new Date();
    room[data.roomID].voxel.push(data.voxel);
    console.log(data.voxel);
    io.emit('put', {
        roomID: data.roomID,
        userID: data.userID,
        voxel: data.voxel,
    });
  });

  socket.on('deleteVoxel', data => {
    room[data.roomID].date = new Date();
    room[data.roomID].voxel.splice(data.index, 1);
    console.log(data.voxel);
    io.emit('deleteVoxel', {
        roomID: data.roomID,
        userID: data.userID,
        index: data.index,
    });
  });

  socket.on('deleteAll', data => {
    room[data.roomID].date = new Date();
    room[data.roomID].voxel.length = 0;
    room[data.roomID].voxel = [];
    
    console.log("deleteAll");
    io.emit('deleteAll', {
        roomID: data.roomID,
        userID: data.userID,
    });
  });

  socket.on('updatePosition', data => {
      users.set(socket.id, {
          clientID: data.clientID,
          position: data.position
      });
      io.emit('updatePosition', data);
  });

  socket.on('sendMessage', data => {
    room[data.roomID].message.push(data.message);
    io.emit('recieveMessage', data);
  });
  // socket.on("disconnect",  () => {
  //     if (users.has(socket.id)) {
  //         io.emit('disconnected', users.get(socket.id).clientID);
  //         users.delete(socket.id);
  //         console.log('client disconnected:');
  //         console.log(Array.from(users.values()).reduce((acc, c) => {
  //             return acc + c.clientID + ', '
  //         }, '').slice(0, -2));
  //     }
  // });
});



http.listen(80, () => {
  console.log('listening on :80');
});
