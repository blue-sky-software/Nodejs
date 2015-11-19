var request = require('supertest');
var expect = require('chai').expect;

describe('AuthController', function() {
  var user;

  before(function(done) {
    User
      .create({
        username: '_user',
        password: '_pass'
      })
      .exec(function(err, _user) {
        if(err) return done(err);
        user = _user;
        done();
      });
  });

  after(function(done) {
    user
      .destroy(done);
  });

  describe('#login()', function() {
    it('should reject invalid credentials', function (done) {
      request(sails.hooks.http.app)
        .post('/login')
        .send({ username: 'invalid', password: 'invalid' })
        .expect(200)
        .end(function(err, res) {
          expect(res.text).to.contain('Invalid username or password');
          done();
        });
    });

    it('should accept valid credentials', function (done) {
      request(sails.hooks.http.app)
        .post('/login')
        .send({ username: user.username, password: user.password })
        .expect(302)
        .end(function(err, res) {
          expect(res.text).to.not.contain('Invalid username or password');
          done();
        });
    });
  });

  describe('#logout()', function() {
    var agent;

    before(function(done) {
      agent = request.agent(sails.hooks.http.app);
      agent
        .post('/login')
        .send({ username: user.username, password: user.password })
        .expect(302, done);
    });

    it('should delete current session', function (done) {
      agent
        .get('/logout')
        .expect(302, done);
    });
  });

});