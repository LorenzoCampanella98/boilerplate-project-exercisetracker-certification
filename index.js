const express = require('express');
const bodyParser = require('body-parser'); // added
const mongoose = require('mongoose'); //added
const app = express()
const cors = require('cors')
require('dotenv').config()

// ----------------------- MONGO DB CONFIG 
// get the client's ip (replit) to allow access to the Mongo project
/*const axios = require('axios');
axios.get('https://api.ipify.org?format=json')
  .then(response => {
    const ip = response.data.ip;
    console.log('Client IP:', ip);
  })
  .catch(error => {
    console.error('Error IP:', error);
  });*/

// Conection to Mongo DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connection succes MongoDB');
}).catch((error) => {
  console.error('Error connection MongoDB:', error);
});
// -----------------------------------------

app.use(cors());

// Middleware para analizar datos codificados en URL
app.use(express.urlencoded({ extended: false }));

// Middleware para analizar datos en formato JSON
app.use(express.json());

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// ------------------------ SOLUTION ------------------------
// ----------------- MONGO
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
});
let Users = mongoose.model('Users', userSchema);

const exerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
})
let Exercises = mongoose.model('Exercises', exerciseSchema);

// Method to add an user in DB
const addUser = (userName_) => {
  let newUser = new Users({
    username: userName_
  })
  return newUser.save()
}

// Method to return the username sending an id
const searchById = (id_) => {
  return Users.findById(id_).exec();
}

// Method to add Exercises in DB
const addExercise = (userId_, description_, duration_, date_) => {
  let newExercise = new Exercises({
    userId: userId_,
    description: description_,
    duration: duration_,
    date: date_
  })
  return newExercise.save()
}

// Method to seach an user by id
const getUsers = () => {
  return Users.find().exec();
}

// Rerturn the number of exercises from an user 
const getNumberOfExercises = (id_) => {
  return Exercises.countDocuments({ userId: id_ }).exec();
}

// Return the array of exercises from an user betwen a range of dates
const getArrayOfExercises = (id_, range, limit) => {
  return Exercises.find({ userId: id_ }).exec();
}

// -------------------------------


// Post to add Users
app.post('/api/users', (req, res) => {
  let userName;
  let id;
  addUser(req.body.username) //Insert the Id in the BD
    .then(result => {
      userName = result.username;
      id = result._id;
      res.json({
        'username': userName,
        '_id': id,
      })
    })
    .catch(error => {
      console.error(error);
    });
});

// Post to add exercises to an user
app.post('/api/users/:_id/exercises', (req, res) => {
  console.log(req.body);
  console.log(req.params._id);

  let _id = req.params._id;
  let description = req.body.description;
  let duration = parseInt(req.body.duration);
  let date = (req.body.date !== undefined ? new Date(req.body.date) : new Date());
  let userName;

  searchById(_id)
    .then(user => {
      console.log(user);
      userName = user.username;
      addExercise(_id, description, duration, date)
        .then(exercise => {
          res.json({
            _id: user._id,
            username: user.username,
            description: description,
            duration: duration,
            date: new Date(date).toDateString(),
          })
        })
        .catch(error => {
          console.error(error);
        });
    }).catch(error => {
      console.error(error);
    });
});

// API GET TO GET THE LIST OF USERS
app.get('/api/users', (req, res) => {
  getUsers()
    .then(result => {
      res.json(result)
    })
    .catch(error => {
      console.error(error);
    })
})

//function to filter an array by dates and limit of results
function filterTheLogsArray(array,from,to,limit){
    let filterArray = array.filter(filter => {
      let logDate = new Date(filter.date);
      return (new Date(logDate) >= new Date(from) && new Date(logDate) <= new Date(to));
    })
    const limitedArray = limit ? filterArray.slice(0, limit) : filterArray
    return limitedArray;
}

//API to get the user whit count of exercises
app.get('/api/users/:_id/logs', (req, res) => {
  let { from, to, limit } = req.query;
  if (!from) {
    from = new Date(0)
  }
  if (!to) {
    to = new Date();
  }
  let id_ = req.params._id;
  searchById(id_)
    .then(user => {
      getNumberOfExercises(id_)
        .then(count => {
          getArrayOfExercises(id_) //changed 
            .then(array => {
              //filter by date and limit
              let limitedArray = filterTheLogsArray(array,from,to,limit);
              res.json({
                _id: user._id,
                username: user.username,
                count: count,
                log: limitedArray.map(result => { //filter the array
                  return {
                    description: result.description,
                    duration: result.duration,
                    date: result.date.toDateString()
                  }
                })
              })
            })
            .catch(error => {
              console.error(error);
            })
        })
        .catch(error => {
          console.error(error);
        })
    })
    .catch(error => {
      console.error(error);
    })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
