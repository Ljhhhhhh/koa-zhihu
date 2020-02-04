const path = require('path');
const success = require('../models/request-success');
class HomeCtl {
  index(ctx) {
    ctx.body = '<h1>这是主页</h1>';
  }
  upload(ctx) {
    const file = ctx.request.files.file;
    const basename = path.basename(file.path);
    ctx.body = success({ url: `${ctx.origin}/uploads/${basename}` });
  }
}

module.exports = new HomeCtl();