const Answer = require('../models/answers');
const success = require('../models/request-success');

class AnswersCtl {
  async find(ctx) {
    const { per_page = 10 } = ctx.query;
    const page = Math.max(ctx.query.page * 1, 1) - 1;
    const perPage = Math.max(per_page * 1, 1);
    const q = new RegExp(ctx.query.q);
    const records = await Answer
      .find({ content: q, questionId: ctx.params.questionId }).populate('answerer')
      .limit(perPage).skip(page * perPage)
    const total = await Answer
    .count({ content: q, questionId: ctx.params.questionId })
    ctx.body = success({
      total,
      records
    });
  }
  async checkAnswerExist(ctx, next) {
    const answer = await Answer.findById(ctx.params.id).select('+answerer');
    if (!answer) { ctx.throw(404, '答案不存在'); }
    // 只有删改查答案时候检查此逻辑，赞、踩答案时候不检查
    if (ctx.params.questionId && ctx.params.questionId !== answer.questionId) {
      ctx.throw(404, '该问题下没有此答案');
    }
    ctx.state.answer = answer;
    await next();
  }
  async findById(ctx) {
    const { fields = '' } = ctx.query;
    const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('');
    const answer = await Answer.findById(ctx.params.id).select(selectFields).populate('answerer');
    ctx.body = answer;
  }
  async create(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: true },
    });
    const answerer = ctx.state.user._id;
    const { questionId } = ctx.params;
    const answer = await new Answer({ ...ctx.request.body, answerer, questionId }).save();
    ctx.body = success(answer);
  }
  async checkAnswerer(ctx, next) {
    const { answer } = ctx.state;
    if (answer.answerer.toString() !== ctx.state.user._id) { ctx.throw(403, '没有权限'); }
    await next();
  }
  async update(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: false },
    });
    await ctx.state.answer.update(ctx.request.body);
    ctx.body = success(ctx.state.answer);
  }
  async delete(ctx) {
    await Answer.findByIdAndRemove(ctx.params.id);
    ctx.status = 204;
  }
}

module.exports = new AnswersCtl();