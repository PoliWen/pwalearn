(function () {
    /**
     * 获取用户授权
     */
    function askPermission() {
        return new Promise((resolve, reject) => {
            let permissionResult = Notification.requestPermission(function (result) {
                resolve(result);
            });
            if (permissionResult) {
                permissionResult.then(resolve, reject);
            }
        }).then(permissionResult => {
            if (permissionResult !== 'granted') {
                throw new Error('We weren\'t granted permission.');
            }
        });
    }

    /**
     * 用户订阅相关的push信息,生成对应的pushSubscription数据，用于标识用户与安全验证
     * @param {ServiceWorker Registration} registration
     * @param {string} publicKey 公钥
     */
    function subscribeUserToPush(registration, publicKey) {
        let subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: window.urlBase64ToUint8Array(publicKey)
        };
        console.log(subscribeOptions);

        return registration.pushManager.subscribe(subscribeOptions).then(function (pushSubscription) {
            console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
            return pushSubscription;
        });
    }

    /**
     * 将push server返回的订阅信息发送给服务器保存下来
     */
    function sendSubscriptionToServer(data) {
        console.log(data)
        return new Promise((resolve, reject)=> {
            $.ajax({
                url: '/subscription',
                method: 'POST',
                type: 'json',
                data: data,
                success(res) {
                    resolve(data)
                },
                error(err) {
                    reject
                }
            })
        });
    }

    /**
     * 一个消息提示的demo
     */
    function notificationDemo(registration){
        document.querySelector('#notification-btn').addEventListener('click', () => {
            let title = '本周热播的电影金刚川';
            let options = {
                body: '你想一起去看看吗',
                image: '/images/movie02.jpg',
                icon: '/images/icons/book-128.png',
                actions: [{
                    action: 'show-book',
                    title: '去看看'
                }, {
                    action: 'contact-me',
                    title: '联系我'
                }],
                tag: 'pwa-starter',
                renotify: true
            };
            registration.showNotification(title, options);
        });
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
        //公钥值给push server服务用的
        let publicKey = 'BNeKSRHLJBGSKnRBRvtzCbg36TheRuOvY3KsBLLmpjIuUHfpRl9JUr5IOGlLnwFkkM81jQhqAvkt3cyr4D001W4';
        window.addEventListener('load', () => {
            
            // 注册service worker
            navigator.serviceWorker.register('../sw.js').then(registration => {
                return Promise.all([
                    registration,
                    askPermission()
                ])
            }).then(result => {
                let registration = result[0];
                console.log('Service Worker 注册成功');
                notificationDemo(registration)
                
                // 开启该客户端的消息推送订阅功能
                return subscribeUserToPush(registration, publicKey);
            }).then(subscription => {
                let body = {
                    subscription: subscription
                };
                body.uniqueid = new Date().getTime();
                console.log('uniqueid', body.uniqueid);
                
                // 将生成的客户端订阅信息存储在自己的服务器上
                return sendSubscriptionToServer(JSON.stringify(body));
            }).then(function (res) {
                console.log(res);
            }).catch(function (err) {
                console.log(err);
            });
        });
    }

    //  监听点击通知栏触发相关事件
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event=> {
            let action = event.data;
            console.log(`actions动作：'${event.data}'`);
            switch (action) {
                case 'show-book':
                    location.href = 'https://movie.douban.com/subject/35155748/';
                    break;
                case 'contact-me':
                    location.href = 'mailto:kingw97@163.com';
                    break;
                default:
                    document.querySelector('.panel').classList.add('show');
                    setTimeout(() => {
                        document.querySelector('.panel').classList.remove('show');
                    }, 3000);
                    break;
            }
        });
    }
})();