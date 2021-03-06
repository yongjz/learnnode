var express = require('express');
var session = require('express-session')
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var multipart = require('connect-multiparty');
var logger = require('morgan');
var path = require('path');
var mongoose = require('mongoose');
var mongoStore = require('connect-mongo')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');

var port = process.env.PORT || 3000;
var app = express();
var fs = require('fs');

var dbUrl = 'mongodb://localhost/test';

// models loading
var models_path = __dirname + '/app/models'

var walk = function(path) {
  fs
    .readdirSync(path)
    .forEach(function(file) {
      var newPath = path + '/' + file;
      var stat = fs.statSync(newPath);
      console.log("newPath:" + newPath);
      if (stat.isFile()) {
        if (/(.*)\.(js|coffee)/.test(file)) {
          require(newPath);
        }
      } else if (stat.isDirectory()) {
        walk(newPath);
      }
    })
}
walk(models_path);
app.set('views', './app/views/pages');
app.set('view engine', 'pug');
app.use(bodyParser.json({
  limit: '1mb'
}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '1mb'
}));
app.use(cookieParser());
app.use(multipart());
app.use(session({
  secret: 'imooc',
  resave: false,
  saveUninitialized: false,
  store: new mongoStore({
    url: dbUrl,
    collection: 'sessions'
  })
}));

app.use(passport.initialize());
app.use(flash());
app.use(passport.session());

var routes = require('./app/route/routes');
app.use('/', routes);

var Account = require('./app/models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

mongoose.connect(dbUrl);

if ('development' === app.get('env')) {
  app.set('showStackError', true);
  app.use(logger(':method :url :status'));
  app.locals.pretty = true;
  //mongoose.set('debug', true)
}

// pre handle user
app.use(function(req, res, next) {
  var _user = req.session.user;

  app.locals.user = _user;

  next();
});

app.listen(port);
app.locals.moment = require('moment');
app.use(express.static(path.join(__dirname, 'public')));

console.log('website started on port ' + port);
