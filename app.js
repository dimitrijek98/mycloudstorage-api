const express = require('express');
const Sequelize = require('sequelize');
const app = express();
const config = require('./config');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');


const port = 4000;


app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));

const sequelize = new Sequelize(`mysql://${config.db_user}:${config.db_pass}@localhost:3308/mycloudstorage`);


const User = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        field: 'id',
        autoIncrement: true,
        primaryKey: true
    },
    password: {
        type: Sequelize.STRING,
        field: 'password'
    },
    email: {
        type: Sequelize.STRING,
        field: 'email'
    },
    createdAt: {
        type: Sequelize.DATE,
        field: 'createdAt'
    },
    updatedAt: {
        type: Sequelize.DATE,
        field: 'updatedAt'
    }

});

const File = sequelize.define('file', {
    id: {
        type: Sequelize.INTEGER,
        field: 'id',
        autoIncrement: true,
        primaryKey: true
    },
    hash: {
        type: Sequelize.STRING,
        field: 'hash'
    },
    name: {
        type: Sequelize.STRING,
        field: 'name'
    },
    userId:{
        type: Sequelize.INTEGER,
        field: 'userId',
    },
    createdAt: {
        type: Sequelize.DATE,
        field: 'createdAt'
    },
    updatedAt: {
        type: Sequelize.DATE,
        field: 'updatedAt'
    }

});

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database', err);
    });


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'files')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' +file.originalname )
    }
});

const upload = multer({ storage: storage }).single('file');


app.get('/', (req, res) => res.send('Hello World!'));


app.listen(port, () => console.log(`Example app listening on port ${port}!`));

app.post('/login', (req, res) => {
    let password = req.body.password;
    let email = req.body.email;
    User.findOrCreate({where: {password: password, email: email}})
        .then(response => {
            console.log(response);
            if(!response)
                res.status(500).send('Server Error');
            else
                res.status(200).send(response);
        })
        .catch(err => {
            console.log(err);
        })
});
app.get('/allFiles', (req, res) => {
    const {userId} = req.query;
    File.findAll({where :{userId:userId}})
        .then(response => {
            res.json(response)
        })
});


app.post('/file', (req, res) => {

    let codedContent = req.body.fileCoded;
    let fileName = req.body.fileName;
    let uID = req.body.userId;
    let path = `files/${uID}`;
    if(!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
    fs.writeFile(`files/${uID}/${fileName}`, codedContent, function (err) {
        if (err) throw err;
    });

    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json('first',err)
        } else if (err) {
            return res.status(500).json('second',err)
        }
        else {
            File.create({userId: uID, name: fileName, hash: 'lHIh==9j'})
                .then(response => {
                    return res.status(200).send(req.file)
                })
                .catch(err => {
                    return res.status(500).send(err)
                })
        }

    })
});

app.use('/files', express.static('files'));