const util = require('./util');
const http = require('http');
const Koa = require('koa');
const serve = require('koa-static');
const Router = require('koa-router');
const koaBody = require('koa-body');
const webpush = require('web-push');
const open = require('open')

const port = process.env.PORT || 9898;
const app = new Koa();
const router = new Router();

/**
 * 根据关键词获取图书信息
 */
router.get('/book', async (ctx, next) => {
    let query = ctx.request.query;
    let {
        q,
        fields
    } = query;
    let url = `https://api.douban.com/v2/book/search?q=${q}&fields=${fields}&count=10`;
    let res = await util.get(url);
    ctx.response.body = res;
});

//使用web-push进行消息推送

// VAPID值
const vapidKeys = {
    publicKey: 'BNeKSRHLJBGSKnRBRvtzCbg36TheRuOvY3KsBLLmpjIuUHfpRl9JUr5IOGlLnwFkkM81jQhqAvkt3cyr4D001W4',
    privateKey: 'aUv36dOSNmpO7sZQtp4L5ngolrsIuRHveekbut6hWJw'
};

// 设置web-push的VAPID值
webpush.setVapidDetails(
    'mailto:kingw97@163.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

/**
 * 提交subscription信息，并保存
 */
router.post('/subscription', koaBody(), async ctx => {
    let body = ctx.request.body;
    console.log(body);
    await util.saveRecord(body);
    ctx.response.body = {
        status: 0
    };
});


/**
 * 向push service推送信息
 * @param {*} subscription 
 * @param {*} data
 */
function pushMessage(subscription, data = {}) {
    webpush.sendNotification(subscription, data).then(data => {
        console.log('push service的相应数据:', JSON.stringify(data));
        return;
    }).catch(err => {
        // 判断状态码，440和410表示失效
        if (err.statusCode === 410 || err.statusCode === 404) {
            return util.remove(subscription);
        } else {
            console.log(subscription);
            console.log(err);
        }
    })
}

/**
 * 消息推送API
 */
router.post('/push', koaBody(), async ctx => {
    let {
        uniqueid,
        payload
    } = ctx.request.body;
    let list = uniqueid ? await util.find({
        uniqueid
    }) : await util.findAll();
    let status = list.length > 0 ? 0 : -1;

    console.log(list);
    console.log('xxxxxxxxxxxxxxxxxxxxx');
    for (let i = 0; i < list.length; i++) {
        let subscription = list[i].subscription;
        pushMessage(subscription, JSON.stringify({
            'title': '最近上映了一部电影名字叫做金刚狼，推荐大家去看',
            'name': '金刚狼'
        }));
    }
    ctx.response.body = {
        status
    };
});

app.use(router.routes());
app.use(serve(__dirname + '/src'));
app.listen(port, () => {
    console.log(`listen on port: http://127.0.0.1:${port}`);
    // open(`http://127.0.0.1:${port}`, 'chrome')
});