const util = require('./util');
const http = require('http');
const Koa = require('koa');
const serve = require('koa-static');
const Router = require('koa-router');
const koaBody = require('koa-body');
const webpush = require('web-push');
const open = require('open')

const port = process.env.PORT || 8082;
const app = new Koa();
const router = new Router();

/**
 * 获取电影列表信息
 */
router.get('/queryMovies', async (ctx, next) => {
    let res = {
        status: 1,
        data: [{
            title: '数码宝贝：最后的进化',
            coverImg: 'images/movie01.jpg',
            score: '7.6'
        }, {
            title: '金刚川',
            coverImg: 'images/movie02.jpg',
            score: '6.5'
        }, {
            title: '月半爱丽丝',
            coverImg: 'images/movie03.jpg',
            score: '3.9'
        }, {
            title: '掬水月在手',
            coverImg: 'images/movie04.jpg',
            score: '8.1'
        }, {
            title: '我和我的家乡',
            coverImg: 'images/movie05.jpg',
            score: '7.4'
        }, {
            title: '八百',
            coverImg: 'images/movie06.jpg',
            score: '7.6'
        }, {
            title: '姜子牙',
            coverImg: 'images/movie07.jpg',
            score: '7.0'
        }, {
            title: '女巫',
            coverImg: 'images/movie08.jpg',
            score: '5.8'
        }, {
            title: '波拉特',
            coverImg: 'images/movie09.jpg',
            score: '7.4'
        }]
    }
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
    open(`http://127.0.0.1:${port}`, 'chrome')
});