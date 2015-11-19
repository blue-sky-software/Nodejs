module.exports = function(req, res, next) {
  if(req.session.user.isAdmin) {
    return next();
  }

  return res.redirect('/dashboard');
};
