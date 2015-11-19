module.exports = function(req, res, next) {

  if (typeof req.session.user !== 'undefined') {
    res.locals.user = req.session.user;
    console.log('injected');
  }

  return next();
};
