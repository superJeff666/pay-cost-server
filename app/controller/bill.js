'use strict';

const moment = require('moment');

const Controller = require('egg').Controller;

class BillController extends Controller {
  async add() {
    const { ctx, app } = this;
    const { amount, type_id, type_name, date, pay_type, remark = '' } = ctx.request.body;
    if (!amount || !type_id || !type_name || !date || !pay_type) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }
    try {
      // eslint-disable-next-line no-unused-vars
      let user_id;
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      // eslint-disable-next-line prefer-const
      user_id = decode.id;
      await ctx.service.bill.add({
        amount,
        type_id,
        type_name,
        date,
        pay_type,
        remark,
        user_id,
      });
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }
  async list() {
    const { ctx, app } = this;
    const { date, page = 1, page_size = 5, type_id = 'all' } = ctx.query;

    try {
      // eslint-disable-next-line no-unused-vars
      let user_id;
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      // eslint-disable-next-line prefer-const
      user_id = decode.id;
      // 拿到当前用户的账单列表
      const list = await ctx.service.bill.list(user_id);
      // 过滤出月份和类型所对应的账单列表
      const _list = list.filter(item => {
        if (type_id !== 'all') {
          return moment(Number(item.date)).format('YYYY-MM') === date && Number(type_id) === item.type_id;
        }
        return moment(Number(item.date)).format('YYYY-MM') === date;
      });
      // 格式化数据，变成我们定义好的json格式
      const listMap = _list.reduce((curr, item) => {
        // curr默认初始值是一个空数组 []
        // 把第一个账单项的时间格式化为 YYYY-MM-DD
        const date = moment(Number(item.date)).format('YYYY-MM-DD');
        if (curr && curr.length && curr.findIndex(item => item.date === date) > -1) {
          const index = curr.findIndex(item => item.date === date);
          curr[index].bills.push(item);
        }

        // 如果在累加的数组中找不到当前项目日期的，那么新建一项
        if (curr && curr.length && curr.findIndex(item => item.date === date) === -1) {
          curr.push({
            date,
            bills: [ item ],
          });
        }

        // 如果curr为空数组，默认添加第一个账单项 item
        if (!curr.length) {
          curr.push({
            date,
            bills: [ item ],
          });
        }

        return curr;
      }, []).sort((a, b) => moment(b.date) - moment(a.date));

      // 分页处理
      const filterListMap = listMap.slice((page - 1) * page_size, page * page_size);

      // 计算当月总收入和支出
      // 首先获取当月所有账单列表
      const __list = list.filter(item => moment(Number(item.date)).format('YYYY-MM') === date);
      // 累加计算支出
      const totalExpense = __list.reduce((curr, item) => {
        if (item.pay_type === 1) {
          curr += Number(item.amount);
          return curr;
        }
        return curr;
      }, 0);
      // 累加计算收入
      const totalIncome = __list.reduce((curr, item) => {
        if (item.pay_type === 2) {
          curr += Number(item.amount);
          return curr;
        }
        return curr;
      }, 0);

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          totalExpense, // 当月支出
          totalIncome, // 当月收入
          totalPage: Math.ceil(listMap.length / page_size),
          list: filterListMap || [],
        },
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }

  // 获取账单详情
  async detail() {
    const { ctx, app } = this;
    // 获取账单 id参数
    const { id = '' } = ctx.query;
    // 获取用户user_id
    // eslint-disable-next-line no-unused-vars
    let user_id;
    const token = ctx.request.header.authorization;
    // 获取用户信息
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return;
    // eslint-disable-next-line prefer-const
    user_id = decode.id;
    // 判断是否传入账单id
    if (!id) {
      ctx.body = {
        code: 500,
        msg: '订单id不为空',
        data: null,
      };
      return;
    }
    try {
      const detail = await ctx.service.bill.detail(id, user_id);
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: detail,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }

  // 编辑账单
  async update() {
    const { ctx, app } = this;
    const { id, amount, type_id, type_name, date, pay_type, remark = '' } = ctx.request.body;

    if (!amount || !type_id || !type_name || !date || !pay_type) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }
    try {
      // eslint-disable-next-line no-unused-vars
      let user_id;
      const token = ctx.request.header.authorization;
      // 获取用户信息
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      // eslint-disable-next-line prefer-const
      user_id = decode.id;
      // 根据 账单id 和 user_id，修改账单数据
      await ctx.service.bill.update({
        id,
        amount,
        type_id,
        type_name,
        date,
        pay_type,
        remark,
        user_id,
      });
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }

  // 删除账单
  async delete() {
    const { ctx, app } = this;
    const { id } = ctx.request.body;

    if (!id) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
    }
    try {
      // eslint-disable-next-line no-unused-vars
      let user_id;
      const token = ctx.request.header.authorization;
      // 获取用户信息
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      // eslint-disable-next-line prefer-const
      user_id = decode.id;
      await ctx.service.bill.delete(id, user_id);
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '系统错误',
        data: null,
      };
    }
  }
  // 数据图表模块
  async data() {
    const { ctx, app } = this;
    const { date = '' } = ctx.query;
    // eslint-disable-next-line no-unused-vars
    let user_id;
    const token = ctx.request.header.authorization;
    // 获取用户信息
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return;
    // eslint-disable-next-line prefer-const
    user_id = decode.id;
    if (!date) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }
    const result = await ctx.service.bill.list(user_id);
    const start = moment(date).startOf('month').unix() * 1000;
    const end = moment(date).endOf('month').unix() * 1000;
    const _data = result.filter(item => (Number(item.date) > start && Number(item.date) < end));
    // 总支出
    const total_expense = _data.reduce((arr, cur) => {
      if (cur.pay_type === 1) {
        arr += Number(cur.amount);
      }
      return arr;
    }, 0);
    // 总收入
    const total_income = _data.reduce((arr, cur) => {
      if (cur.pay_type === 2) {
        arr += Number(cur.amount);
      }
      return arr;
    }, 0);
    // 获取收支构成
    let total_data = _data.reduce((arr, cur) => {
      const index = arr.findIndex(item => item.type_id === cur.type_id);
      if (index === -1) {
        arr.push({
          type_id: cur.type_id,
          type_name: cur.type_name,
          pay_type: cur.pay_type,
          number: Number(cur.amount),
        });
      }
      if (index > -1) {
        arr[index].number += Number(cur.amount);
      }
      return arr;
    }, []);
    total_data = total_data.map(item => {
      item.number = Number(Number(item.number).toFixed(2));
      return item;
    });
    ctx.body = {
      code: 200,
      msg: '请求成功',
      data: {
        total_expense: Number(total_expense).toFixed(2),
        total_income: Number(total_income).toFixed(2),
        total_data: total_data || [],
      },
    };
  }
}
module.exports = BillController;
