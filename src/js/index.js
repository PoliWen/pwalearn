(function () {
    /**
     * 用户订阅相关的push信息
     * 会生成对应的pushSubscription数据，用于标识用户与安全验证
     * @param {ServiceWorker Registration} registration
     * @param {string} publicKey 公钥
     * @return {Promise}
     */
    function subscribeUserToPush(registration, publicKey) {
        let subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: window.urlBase64ToUint8Array(publicKey)
        };
        console.log(subscribeOptions);

        //这是为何不执行这一步了呢,是因为要借助chrome的梯子才可以，本地的话我们可以用firefox浏览器来进行演示
        return registration.pushManager.subscribe(subscribeOptions).then(function (pushSubscription) {
            console.log('oooooooooooooooooooooooooooo');
            console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
            return pushSubscription;
        });
    }

    /**
     * 将浏览器生成的subscription信息提交到服务端
     * 服务端保存该信息用于向特定的客户端用户推送
     * @param {string} body 请求体
     * @param {string} url 提交的api路径，默认为/subscription
     * @return {Promise}
     */
    function sendSubscriptionToServer(body, url) {
        url = url || '/subscription';
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.timeout = 60000;
            xhr.onreadystatechange = function () {
                let response = {};
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        response = JSON.parse(xhr.responseText);
                    } catch (e) {
                        response = xhr.responseText;
                    }
                    resolve(response);
                } else if (xhr.readyState === 4) {
                    resolve();
                }
            };
            xhr.onabort = reject;
            xhr.onerror = reject;
            xhr.ontimeout = reject;
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(body);
        });
    }
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        let publicKey = 'BNeKSRHLJBGSKnRBRvtzCbg36TheRuOvY3KsBLLmpjIuUHfpRl9JUr5IOGlLnwFkkM81jQhqAvkt3cyr4D001W4';
        window.addEventListener('load', function () {
            // 注册service worker
            navigator.serviceWorker.register('../sw.js').then(function (registration) {
                return Promise.all([
                    registration,
                    askPermission()
                ])
            }).then(function (result) {
                let registration = result[0];
                //添加提醒功能
                document.querySelector('#notification-btn').addEventListener('click', function () {
                    let title = '本周热播的电影金刚川';
                    let options = {
                        body: '你想一起去看看吗',
                        icon: '/images/movie02.jpg',
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

                console.log('Service Worker 注册成功');

                // 开启该客户端的消息推送订阅功能
                return subscribeUserToPush(registration, publicKey);

            }).then(function (subscription) {
                let body = {
                    subscription: subscription
                };

                // 为了方便之后的推送，为每个客户端简单生成一个标识
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

    // 消息通信 
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', function (event) {
            let action = event.data;
            console.log(`receive post-message from sw, action is '${event.data}'`);
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

    /**
     * 获取用户授权
     */
    function askPermission() {
        return new Promise(function (resolve, reject) {
            let permissionResult = Notification.requestPermission(function (result) {
                resolve(result);
            });

            if (permissionResult) {
                permissionResult.then(resolve, reject);
            }
        }).then(function (permissionResult) {
            if (permissionResult !== 'granted') {
                throw new Error('We weren\'t granted permission.');
            }
        });
    }
})();