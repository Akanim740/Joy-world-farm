const requireAuth = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  const wantsJson = req.originalUrl.startsWith('/api') ||
    (req.headers.accept && req.headers.accept.includes('json')) ||
    req.xhr;
  if (wantsJson) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  res.redirect('/admin/login');
};

module.exports = requireAuth;
