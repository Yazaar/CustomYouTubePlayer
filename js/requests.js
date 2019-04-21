let data = []
let completedRequests = 0

let params = new URL(window.location.href).searchParams.getAll("v") // get parameters from the URL
let res = []

if (params.length == 0){
    document.querySelector("article").innerHTML = "Invalid url<br>example url: " + window.location.href + "?v=hLjht9uJWgw&v=SItEOFwnKtQ%Yazaar"
}

// loop thru the parameters and check if twitch chat requested it
for (let param of params){
    if (/%/.test(param)){
        res.push(param.split("%")[0]) // found id + user
    } else {
        res.push(param) // found id
    }
}

// loop thru all id:s
for (let value of res) {
    data.push(undefined)
    getDataFromId(value)
}

// get data from URL
function getDataFromId(id) {
    let xml = new XMLHttpRequest()
    xml.onreadystatechange = () => {
        if (xml.readyState == 4) {
            data[res.indexOf(id)] = JSON.parse(xml.response)
            data[res.indexOf(id)].videoId = id

            if(/%/.test(params[res.indexOf(id)])){
                data[res.indexOf(id)].requestedBy = params[res.indexOf(id)].split("%")[1]
            }
            completedRequests++
            if (completedRequests == res.length) {
                addDataFromRequests()
            }
        }
    }
    xml.open("get", "https://noembed.com/embed?url=https://www.youtube.com/watch?v=" + id, true)
    xml.send()
}

// append data to variable (if the request is completed)
function addDataFromRequests() {
    let temp = ""
    let temp2

    for (i in data) {
        if (data[i].requestedBy !== undefined){
            // the video was requested
            temp2 = "<br>Requested by: " + data[i].requestedBy
        } else {
            temp2 = ""
        }
        temp += '<a href="' + data[i].url + '" target="_blank" rel="noopener noreferrer">' + '<span class="number">' + i + "</span>" + '<span class="info">Title: ' + data[i].title + "<br>" +"Channel: " + data[i].author_name + temp2 + "</span>" + "</a>"
    }

    document.querySelector("article").innerHTML = temp
}