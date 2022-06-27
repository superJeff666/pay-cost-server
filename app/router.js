'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, middleware } = app;
  const _jwt = middleware.jwtErr(app.config.jwt.secret); // 传入加密字符串
  router.get('/', controller.home.index);
  router.get('/user', controller.home.user);
  router.post('/add', controller.home.add);
  router.post('/add_user', controller.home.addUser);
  router.post('/edit_user', controller.home.editUser);
  router.post('/delete_user', controller.home.deleteUser);

  // ------------------------- 记账本接口 ----------------------------
  // 用户注册
  router.post('/api/user/register', controller.user.register);

  // 用户登录
  router.post('/api/user/login', controller.user.login);
  // 获取用户信息
  router.get('/api/user/get_userinfo', _jwt, controller.user.getUserInfo);
  // 编辑用户信息
  router.post('/api/user/edit_userinfo', _jwt, controller.user.editUserInfo);
  // 上传图片
  router.post('/api/upload', _jwt, controller.upload.upload);

  // 添加账单
  router.post('/api/bill/add', _jwt, controller.bill.add);
  // 获取账单列表
  router.get('/api/bill/list', _jwt, controller.bill.list);
  // 获取消费类型列表
  router.get('/api/type/list', _jwt, controller.type.list);
  // 获取详情
  router.get('/api/bill/detail', _jwt, controller.bill.detail);
  // 编辑账单
  router.post('/api/bill/update', _jwt, controller.bill.update);
  // 删除账单
  router.post('/api/bill/delete', _jwt, controller.bill.delete);
  // 获取图表数据
  router.get('/api/bill/data', _jwt, controller.bill.data);
  // 修改用户密码
  router.post('/api/user/modify_pass', _jwt, controller.user.modifyPassword);
  // 测试接口
  router.get('/api/user/test', _jwt, controller.user.test);
};
