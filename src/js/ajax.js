window.$ = {
    ajax: function (options) {
        var xhr = new XMLHttpRequest()
        var data = options.data
        var query = []
        var requesUrl = options.url
        if (!requesUrl) {
            console.log('请输入url')
            return false
        }
        /* 提取参数*/
        for (var key in data) {
            var paramStr = encodeURIComponent(key) + '=' +
                encodeURIComponent(data[key])
            query.push(paramStr)
        }
        var queryData = query.join('&')
        if (options.method == 'GET') {
            requesUrl = requesUrl + '?' + queryData
        }
        var randomNum = Date.now() + Math.random() * 1000
        var cacheString = requesUrl.indexOf('?') == -1 ? '?cache=' + randomNum : '&cache = ' + randomNum
        requesUrl = options.cache ? requesUrl + cacheString : requesUrl
        xhr.open(options.method || 'GET', requesUrl, options.asyn || true)
        if (options.method == 'POST') {
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
            xhr.send(queryData)
        } else {
            xhr.send()
        }
        options.beforeSend && options.beforeSend()
        xhr.onreadystatechange = function (res) {
            if (xhr.status == 200 && xhr.readyState == 4) {
                let res = xhr.responseText
                if (options.type === 'json') res = JSON.parse(res)
                options.success && options.success(res)
            } else if (xhr.status == 404 || xhr.status == 500) {
                options.error && options.error('error')
            }
        }
    }
}