// 2. This code loads the IFrame Player API code asynchronously.

let xml
let loading = false
let data
let SearchInput
let video_id
let video_data = {}
let queue = []
let PlayerState
let ShuffleStatus = false
let LockStatus = false
let CurrentlyPlaying
let SearchMethod
let CurrentSearchMethod
let listId

// Overlay
let OverlayToggle = false
let TimeUpdater
let TitleScrollStatus = false
let ChannelScrollStatus = false
let PixelsPerSecond = 10

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function StartYouTubeIframe(video_id) {
  start = false
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: video_id,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onYouTubeIframeAPIReady() {
  //document.getElementById("player").innerHTML = '<iframe frameborder="0" id="player" src="ready.html"></iframe>'
  document.getElementById("player").innerHTML = '<div style="background:#000000;color:#ffffff;width:100%;height:90%;display:flex;justify-content:center;align-items:center;text-align:center;"><h1>YouTube<br>READY FOR USE</h1></div>'
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  player.playVideo()
}


function onPlayerStateChange(event) {
  // YT.PlayerState.***** {"UNSTARTED":-1,"ENDED":0,"PLAYING":1,"PAUSED":2,"BUFFERING":3,"CUED":5}
  PlayerState = event.data
  if (event.data == YT.PlayerState.ENDED) {
    if (queue.length > 0) {
      let index
      if (ShuffleStatus == true) {
        index = Math.floor(Math.random() * queue.length)
      } else {
        index = 0
      }
      if (queue[index].kind == "youtube#playlistItem"){
        player.loadVideoById(queue[index].snippet.resourceId.videoId)
      } else {
        player.loadVideoById(queue[index].id.videoId)
      }

      CurrentlyPlaying = queue[index]
      document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = queue[index].snippet.title
      document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = queue[index].snippet.channelTitle
      updateOverlay()

      if (LockStatus == true){
        queue.push(queue[index])
        queue.splice(index, 1)
      } else {
        queue.splice(index, 1)
      }

      let InnerHTMLData = "<h1>Queue:</h1>"
      for (i in queue){
        InnerHTMLData += "<section><p>" + queue[i].snippet.title + "</p></section>"
      }
      document.getElementById("queue").innerHTML = InnerHTMLData
    }
  }
}

/*
  Event listerners start
*/

document.getElementById("Search").addEventListener("click", () => {
  RunSearch()
})

function RunSearch(){
  SearchInput = document.getElementById("SearchInput").value
  if (SearchInput != "" && SearchMethod == "video") {
    xml = new XMLHttpRequest()
    xml.onreadystatechange = function () {
        if (xml.readyState == 4) {
            video_data = {}
            data = JSON.parse(xml.response).items

            let InnerHTMLData = ""

            for (i in data) {
              InnerHTMLData += '<section onclick="GetVideoID(this)" data-videoid="' + data[i].id.videoId + '">' + '<img src="' + data[i].snippet.thumbnails.default.url + '">' + "<span>" + "<h1>" + data[i].snippet.title + "</h1>" + "<p>" + data[i].snippet.channelTitle + "</p>" + "</span>" + "</section>"
              video_data[data[i].id.videoId] = data[i]
            }
            document.getElementById("SearchResults").innerHTML = InnerHTMLData
        }
    }

    CurrentSearchMethod = "video"
    xml.open('get', 'https://www.googleapis.com/youtube/v3/search?part=snippet&key=AIzaSyBSyUYZf-2UqLAnBYJGDzd-fQZ8hps3-40&type=video&order=relevance&maxResults=25&q='+encodeURI(SearchInput), true)
    xml.send()
  } else if (SearchInput != "" && SearchMethod == "playlist") {
    MorePages = true
    xml = new XMLHttpRequest()
    xml.onreadystatechange = function () {
        if (xml.readyState == 4) {
            video_data = {}
            data = JSON.parse(xml.response).items

            let InnerHTMLData = ""

            for (i in data) {
              if(data[i].snippet.title == "Private video") {
                data[i].snippet.thumbnails = {}
                data[i].snippet.thumbnails.default = {}
                data[i].snippet.thumbnails.default.url = "img/no_thumbnail.jpg"
              }
              InnerHTMLData += '<section onclick="GetVideoID(this)" data-videoid="' + data[i].snippet.resourceId.videoId + '">' + '<img src="' + data[i].snippet.thumbnails.default.url + '">' + "<span>" + "<h1>" + data[i].snippet.title + "</h1>" + "<p>" + data[i].snippet.channelTitle + "</p>" + "</span>" + "</section>"
              video_data[data[i].snippet.resourceId.videoId] = data[i]
            }
            document.getElementById("SearchResults").innerHTML = InnerHTMLData
        }
    }
    listId = new URLSearchParams(SearchInput.split("?")[1])

    CurrentSearchMethod = "playlist"
    xml.open('get', 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=AIzaSyBSyUYZf-2UqLAnBYJGDzd-fQZ8hps3-40&maxResults=25&playlistId='+ listId.get("list"), true)
    xml.send()
  }
}


window.addEventListener("keypress", (e) => {
  if (e.path[0] == document.getElementById("SearchInput") && e.key == "Enter"){
    RunSearch()
  }
})

window.addEventListener("scroll", () => {
  if (document.getElementById("SearchResults").innerHTML == "") {
    return
  }

  if (window.pageYOffset + window.innerHeight*2 > document.querySelector("html").offsetHeight && CurrentSearchMethod == "video") {
    if (loading == false) {
      loading = true
      token = JSON.parse(xml.response).nextPageToken

      xml = new XMLHttpRequest()

      xml.onreadystatechange = function () {
        if (xml.readyState == 4) {
            data = JSON.parse(xml.response).items

            let InnerHTMLData = document.getElementById("SearchResults").innerHTML

            for (i in data) {
              InnerHTMLData += '<section onclick="GetVideoID(this)" data-videoid="' + data[i].id.videoId + '">' + '<img src="' + data[i].snippet.thumbnails.default.url + '">' + "<span>" + "<h1>" + data[i].snippet.title + "</h1>" + "<p>" + data[i].snippet.channelTitle + "</p>" + "</span>" + "</section>"
              video_data[data[i].id.videoId] = data[i]
            }
            document.getElementById("SearchResults").innerHTML = InnerHTMLData
            loading = false
        }
    }
    xml.open('get', 'https://www.googleapis.com/youtube/v3/search?part=snippet&key=AIzaSyBSyUYZf-2UqLAnBYJGDzd-fQZ8hps3-40&type=video&order=relevance&pageToken=' + token + '&maxResults=25&q='+encodeURI(SearchInput), true)
    xml.send()

    }
  } else if (window.pageYOffset + window.innerHeight*2 > document.querySelector("html").offsetHeight && CurrentSearchMethod == "playlist") {

      if (loading == false && MorePages == true) {

        loading = true
        
        if (! JSON.parse(xml.response).nextPageToken) {
          MorePages = false
          loading = false
          return
        }

        token = JSON.parse(xml.response).nextPageToken
        
        xml = new XMLHttpRequest()

        xml.onreadystatechange = function () {
          if (xml.readyState == 4) {

              data = JSON.parse(xml.response).items

              let InnerHTMLData = document.getElementById("SearchResults").innerHTML

              for (i in data) {
                if(data[i].snippet.title == "Private video") {
                  data[i].snippet.thumbnails = {}
                  data[i].snippet.thumbnails.default = {}
                  data[i].snippet.thumbnails.default.url = "img/no_thumbnail.jpg"
                }
                InnerHTMLData += '<section onclick="GetVideoID(this)" data-videoid="' + data[i].snippet.resourceId.videoId + '">' + '<img src="' + data[i].snippet.thumbnails.default.url + '">' + "<span>" + "<h1>" + data[i].snippet.title + "</h1>" + "<p>" + data[i].snippet.channelTitle + "</p>" + "</span>" + "</section>"
                video_data[data[i].snippet.resourceId.videoId] = data[i]
              }
              document.getElementById("SearchResults").innerHTML = InnerHTMLData
              loading = false
          }
      }
      xml.open('get', 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,id&key=AIzaSyBSyUYZf-2UqLAnBYJGDzd-fQZ8hps3-40&maxResults=25&pageToken=' + token + '&playlistId='+ listId.get("list"), true)
      xml.send()
    }
  }
})

document.getElementById("skip").addEventListener("click", () => {
  if (queue.length > 0) {
    let index
    if (ShuffleStatus == true) {
      index = Math.floor(Math.random() * queue.length)
    } else {
      index = 0
    }

    
    if (queue[index].kind == "youtube#playlistItem"){
      player.loadVideoById(queue[index].snippet.resourceId.videoId)
    } else {
      player.loadVideoById(queue[index].id.videoId)
    }

    CurrentlyPlaying = queue[index]
    document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = queue[index].snippet.title
    document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = queue[index].snippet.channelTitle
    updateOverlay()

    if (LockStatus == true){
      queue.push(queue[index])
      queue.splice(index, 1)
    } else {
      queue.splice(index, 1)
    }

    let InnerHTMLData = "<h1>Queue:</h1>"
    for (i in queue){
      InnerHTMLData += "<section><p>" + queue[i].snippet.title + "</p></section>"
    }
    document.getElementById("queue").innerHTML = InnerHTMLData
  }
})

document.getElementById("lock").addEventListener("click", () => {
  if (LockStatus == true) {
    LockStatus = false
    document.getElementById("lock").style.background = "#09ff00"
  } else {
    LockStatus = true
    document.getElementById("lock").style.background = "#ff0900"
  }
})

document.getElementById("shuffle").addEventListener("click", () => {
  if (ShuffleStatus == true) {
    ShuffleStatus = false
    document.getElementById("shuffle").style.background = "#09ff00"
  } else {
    ShuffleStatus = true
    document.getElementById("shuffle").style.background = "#ff0900"
  }
})

document.getElementById("youtube").addEventListener("click", () => {
  try{
    if (CurrentlyPlaying.kind == "youtube#playlistItem"){
      window.open("https://www.youtube.com/watch?v="+CurrentlyPlaying.snippet.resourceId.videoId)
    } else {
      window.open("https://www.youtube.com/watch?v="+CurrentlyPlaying.id.videoId)
    }
  } catch {
    {}
  }
})

document.getElementById("QueueClick").addEventListener("click", () => {
  let innerHTML = document.getElementById("QueueClick").innerHTML.toLowerCase()
  if (innerHTML == "remove") {
    document.getElementById("QueueClick").innerHTML = "Play now"
  } else if (innerHTML == "play now") {
    document.getElementById("QueueClick").innerHTML = "Move up"
  } else if (innerHTML == "move up") {
    document.getElementById("QueueClick").innerHTML = "Move down"
  } else if (innerHTML == "move down") {
    document.getElementById("QueueClick").innerHTML = "Remove"
  }
})


for (let i = 0; i < 5; i++) { 
  document.getElementById("PlayerSettings").querySelectorAll("span")[i].addEventListener("mouseover", (e) => {

    if (e.target.id == "shuffle") {
      document.getElementById("StatusMessage").innerHTML = "Pick video randomly"
    } else if (e.target.id == "skip") {
      document.getElementById("StatusMessage").innerHTML = "Skip to next video"
    } else if (e.target.id == "lock") {
      document.getElementById("StatusMessage").innerHTML = "Keep video in queue forever"
    } else if (e.target.id == "youtube") {
      document.getElementById("StatusMessage").innerHTML = "Open current video in YouTube (if embed above is blocked)"
    } else if (e.target.id == "QueueClick") {
      document.getElementById("StatusMessage").innerHTML = "Onclick event for queue"
    }
  })
}

for (let i = 0; i < document.getElementById("PlayerSettings").querySelectorAll("span").length; i++) { 
  document.getElementById("PlayerSettings").querySelectorAll("span")[i].addEventListener("mouseleave", (e) => {
  document.getElementById("StatusMessage").innerHTML = "Yazaar | YouTube Player"
  })
}

document.getElementById("queue").addEventListener("click", (e) => {
  if(e.target.nodeName == "P") {
    let QueueItems = []
    document.getElementById("queue").querySelectorAll("p").forEach((element) => {
      QueueItems.push(element)
    })
    let TargetIndex = QueueItems.indexOf(e.target)
    let innerHTML = document.getElementById("QueueClick").innerHTML.toLowerCase()

    CurrentlyPlaying = queue[TargetIndex]
    document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = CurrentlyPlaying.snippet.title
    document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = CurrentlyPlaying.snippet.channelTitle
    updateOverlay()

    if (innerHTML == "remove") {
      queue.splice(TargetIndex ,1)

      let CodeBlock = "<h1>Queue:</h1>"

      for (i in queue) {
        CodeBlock += "<section><p>" + queue[i].snippet.title + "</p></section>"
      }
      document.getElementById("queue").innerHTML = CodeBlock

    } else if (innerHTML == "play now") {

      if (queue[TargetIndex].kind == "youtube#playlistItem"){
        player.loadVideoById(queue[TargetIndex].snippet.resourceId.videoId)
      } else {
        player.loadVideoById(queue[TargetIndex].id.videoId)
      }

      if (LockStatus == true){
        queue.push(queue[TargetIndex])
        queue.splice(TargetIndex, 1)
      } else {
        queue.splice(TargetIndex, 1)
      }

      let CodeBlock = "<h1>Queue:</h1>"

      for (i in queue) {
        CodeBlock += "<section><p>" + queue[i].snippet.title + "</p></section>"
      }
      document.getElementById("queue").innerHTML = CodeBlock

    } else if (innerHTML == "move up") {

      let temp = queue[TargetIndex]

      if (TargetIndex == 0) {
        queue.push(queue[0])
        queue.splice(0, 1)
      } else {
        queue[TargetIndex] = queue[TargetIndex-1]
        queue[TargetIndex-1] = temp
      }

      let CodeBlock = "<h1>Queue:</h1>"

      for (i in queue) {
        CodeBlock += "<section><p>" + queue[i].snippet.title + "</p></section>"
      }
      document.getElementById("queue").innerHTML = CodeBlock
      
    } else if (innerHTML == "move down") {

      let temp = queue[TargetIndex]

      if (TargetIndex == queue.length-1) {
        queue.unshift(queue[queue.length-1])
        queue.splice(queue.length-1, 1)
      } else {
        queue[TargetIndex] = queue[TargetIndex+1]
        queue[TargetIndex+1] = temp
      }


      let CodeBlock = "<h1>Queue:</h1>"

      for (i in queue) {
        CodeBlock += "<section><p>" + queue[i].snippet.title + "</p></section>"
      }
      document.getElementById("queue").innerHTML = CodeBlock

    }

  }
})

document.getElementById("SearchInput").addEventListener("input", (e) => {
  if(e.target.value.toLowerCase().includes("youtube.com/playlist") && e.target.value.toLowerCase().includes("?") && e.target.value.toLowerCase().includes("list=")) {
    document.getElementById("Search").querySelector("p").innerHTML = "Search Playlist"
    SearchMethod = "playlist"
  } else {
    document.getElementById("Search").querySelector("p").innerHTML = "Search Video"
    SearchMethod = "video"
  }
})

/*
   Event listnerers end
*/

function GetVideoID(data_tag){
  video_id = new String(data_tag.getAttribute("data-videoid"))
  if (video_data[video_id].kind == "youtube#playlistItem"){
    
    if (document.getElementById("player").nodeName == "DIV") {
      CurrentlyPlaying = video_data[video_id]
      document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = CurrentlyPlaying.snippet.title
      document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = CurrentlyPlaying.snippet.channelTitle
      StartYouTubeIframe(video_id)
      updateOverlay()
    } else {
      if (PlayerState == 0){
        player.loadVideoById(video_id)
        CurrentlyPlaying = video_data[video_id]
        document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = CurrentlyPlaying.snippet.title
        document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = CurrentlyPlaying.snippet.channelTitle
        updateOverlay()
      } else {
        queue.push(video_data[video_id])
        document.getElementById("queue").innerHTML += "<section><p>" + queue[queue.length-1].snippet.title + "</p></section>"
      }
    }
    return
  }

  if (document.getElementById("player").nodeName == "DIV") {
    CurrentlyPlaying = video_data[video_id]
    document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = CurrentlyPlaying.snippet.title
    document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = CurrentlyPlaying.snippet.channelTitle
    StartYouTubeIframe(video_id)
    updateOverlay()
  } else {
    if (PlayerState == 0){
      player.loadVideoById(video_id)
      CurrentlyPlaying = video_data[video_id]
      document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = CurrentlyPlaying.snippet.title
      document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = CurrentlyPlaying.snippet.channelTitle
      updateOverlay()
    } else {
      queue.push(video_data[video_id])
      document.getElementById("queue").innerHTML += "<section><p>" + queue[queue.length-1].snippet.title + "</p></section>"
    }
  }
}

/* CODE FOR OVERLAY */

function updateOverlay() {
  if (OverlayToggle == true){
    
    try {
      document.getElementById("thumbnail").innerHTML = '<img src="' + CurrentlyPlaying.snippet.thumbnails.default.url + '" alt="Video Thumbnail">'
    } catch {
      {}
    }
    
    document.getElementById("title").innerHTML = document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML
    document.getElementById("channel").innerHTML = document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML
    
    document.getElementById("time").style.background = generateRGB()
    
    document.documentElement.style.setProperty("--TitleScroll", document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth + "px")
    document.documentElement.style.setProperty("--ChannelScroll", document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth + "px")
    
    if (document.getElementById("title").offsetWidth > document.getElementById("right").offsetWidth) {
      if (TitleScrollStatus != true) {
        TitleScrollStatus = true
        document.getElementById("title").style.animation = "TitleScroll " + (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / PixelsPerSecond + "s linear infinite"
        
      }
    } else {
      if (TitleScrollStatus != false) {
        TitleScrollStatus = false
        document.getElementById("title").style.animation = "none"
      }
    }

    if (document.getElementById("channel").offsetWidth > document.getElementById("right").offsetWidth) {
      if (ChannelScrollStatus != true) {
        ChannelScrollStatus = true
        document.getElementById("channel").style.animation = "ChannelScroll " + (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / PixelsPerSecond + "s linear infinite"
      }
    } else {
      if (ChannelScrollStatus != false) {
        ChannelScrollStatus = false
        document.getElementById("channel").style.animation = "none"
      }
    }
  }
}

document.getElementById("ToggleOverlay").addEventListener("click", () => {
  
  if (OverlayToggle == true) {
    document.getElementById("OverlaySettings").style.height = "2rem"
    document.getElementById("OverlaySettings").style.marginTop = "0px"
    document.getElementById("overlay").style.display = "none"
    OverlayToggle = false
    clearInterval(TimeUpdater)
  } else {
    document.getElementById("OverlaySettings").style.height = "auto"
    document.getElementById("overlay").style.display = "inline-flex"
    OverlayToggle = true
    generateOverlay()
    updateOverlay()
    document.getElementById("OverlaySettings").style.marginTop = document.getElementById("overlay").offsetHeight + 10 + "px"
  }
  if (document.getElementById("TitleFontSize").value == "") {
    document.getElementById("TitleFontSize").value = 14
    document.getElementById("ChannelFontSize").value = 14
    document.getElementById("TickerSpeed").value = 10
    document.getElementById("OverlayWidth").value = 250
    document.getElementById("OverlayHeight").value = 50
    document.getElementById("BGCR").value = 63
    document.getElementById("BGCG").value = 63
    document.getElementById("BGCB").value = 63
    document.getElementById("FTCR").value = 182
    document.getElementById("FTCG").value = 182
    document.getElementById("FTCB").value = 182
  }
})

document.getElementById("TitleFontSize").addEventListener("input", () => {
  document.getElementById("title").style.fontSize = document.getElementById("TitleFontSize").value + "px"
  document.documentElement.style.setProperty("--TitleScroll", document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth + "px")
})

document.getElementById("ChannelFontSize").addEventListener("input", () => {
  document.getElementById("channel").style.fontSize = document.getElementById("ChannelFontSize").value + "px"
  document.documentElement.style.setProperty("--ChannelScroll", document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth + "px")
})

document.getElementById("TickerSpeed").addEventListener("input", () => {
  PixelsPerSecond = document.getElementById("TickerSpeed").value
  if (TitleScrollStatus == true) {
    document.getElementById("title").style.animation = "TitleScroll " + (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / PixelsPerSecond + "s linear infinite"
  }
  if (ChannelScrollStatus == true) {
    document.getElementById("channel").style.animation = "ChannelScroll " + (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / PixelsPerSecond + "s linear infinite"
  }
})

document.getElementById("OverlayWidth").addEventListener("input", () => {
  document.getElementById("overlay").style.width = document.getElementById("OverlayWidth").value + "px"
  document.documentElement.style.setProperty("--TitleScroll", document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth + "px")
  document.documentElement.style.setProperty("--ChannelScroll", document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth + "px")
})

document.getElementById("OverlayHeight").addEventListener("input", () => {
  document.getElementById("overlay").style.height = document.getElementById("OverlayHeight").value + "px"
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight /0.75) + "px"
  document.getElementById("OverlaySettings").style.marginTop = document.getElementById("overlay").offsetHeight + 10 + "px"
})


document.getElementById("BGCR").addEventListener("input", backgroundColorChanged)
document.getElementById("BGCG").addEventListener("input", backgroundColorChanged)
document.getElementById("BGCB").addEventListener("input", backgroundColorChanged)

function backgroundColorChanged(){
  if (document.getElementById("BGCR").value == "") {
    document.getElementById("BGCR").value = 0
  }
  if (document.getElementById("BGCG").value == "") {
    document.getElementById("BGCG").value = 0
  }
  if (document.getElementById("BGCB").value == "") {
    document.getElementById("BGCB").value = 0
  }

  if (parseFloat(document.getElementById("BGCR").value) > 255) {
    document.getElementById("BGCR").value = 255
  }
  if (parseFloat(document.getElementById("BGCG").value) > 255) {
    document.getElementById("BGCG").value = 255
  }
  if (parseFloat(document.getElementById("BGCB").value) > 255) {
    document.getElementById("BGCB").value = 255
  }
  if (parseFloat(document.getElementById("BGCR").value) < 0) {
    document.getElementById("BGCR").value = 0
  }
  if (parseFloat(document.getElementById("BGCG").value) < 0) {
    document.getElementById("BGCG").value = 0
  }
  if (parseFloat(document.getElementById("BGCB").value) < 0) {
    document.getElementById("BGCB").value = 0
  }

  document.getElementById("overlay").style.background = "rgb(" + parseInt(document.getElementById("BGCR").value) + "," + parseInt(document.getElementById("BGCG").value) + "," + parseInt(document.getElementById("BGCB").value) + ")"
}


document.getElementById("FTCR").addEventListener("input", textColorChanged)
document.getElementById("FTCG").addEventListener("input", textColorChanged)
document.getElementById("FTCB").addEventListener("input", textColorChanged)

function textColorChanged(){
  if (document.getElementById("FTCR").value == "") {
    document.getElementById("FTCR").value = 0
  }
  if (document.getElementById("FTCG").value == "") {
    document.getElementById("FTCG").value = 0
  }
  if (document.getElementById("FTCB").value == "") {
    document.getElementById("FTCB").value = 0
  }

  if (parseFloat(document.getElementById("FTCR").value) > 255) {
    document.getElementById("FTCR").value = 255
  }
  if (parseFloat(document.getElementById("FTCG").value) > 255) {
    document.getElementById("FTCG").value = 255
  }
  if (parseFloat(document.getElementById("FTCB").value) > 255) {
    document.getElementById("FTCB").value = 255
  }
  if (parseFloat(document.getElementById("FTCR").value) < 0) {
    document.getElementById("FTCR").value = 0
  }
  if (parseFloat(document.getElementById("FTCG").value) < 0) {
    document.getElementById("FTCG").value = 0
  }
  if (parseFloat(document.getElementById("FTCB").value) < 0) {
    document.getElementById("FTCB").value = 0
  }

  document.getElementById("title").style.color = "rgb(" + parseInt(document.getElementById("FTCR").value) + "," + parseInt(document.getElementById("FTCG").value) + "," + parseInt(document.getElementById("FTCB").value) + ")"
  document.getElementById("channel").style.color = "rgb(" + parseInt(document.getElementById("FTCR").value) + "," + parseInt(document.getElementById("FTCG").value) + "," + parseInt(document.getElementById("FTCB").value) + ")"
}


document.getElementById("preset1").addEventListener("click", () => {
  document.getElementById("OverlayWidth").value = 300
  document.getElementById("overlay").style.width = document.getElementById("OverlayWidth").value + "px"

  document.getElementById("OverlayHeight").value = 75
  document.getElementById("overlay").style.height = document.getElementById("OverlayHeight").value + "px"
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight /0.75) + "px"
  document.getElementById("OverlaySettings").style.marginTop = document.getElementById("overlay").offsetHeight + 10 + "px"

  document.getElementById("TitleFontSize").value = 25
  document.getElementById("title").style.fontSize = document.getElementById("TitleFontSize").value + "px"

  document.getElementById("ChannelFontSize").value = 18
  document.getElementById("channel").style.fontSize = document.getElementById("ChannelFontSize").value + "px"

  document.documentElement.style.setProperty("--TitleScroll", document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth + "px")
  document.documentElement.style.setProperty("--ChannelScroll", document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth + "px")

  let timer1 = (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / PixelsPerSecond
  let timer2 = (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / PixelsPerSecond

  if (timer1 < 1) {
    timer1 = 1
  } else if (timer1 > 60) {
    timer1 = 60
  }

  if (timer2 < 1) {
    timer2 = 1
  } else if (timer2 > 60) {
    timer2 = 60
  }

  if (TitleScrollStatus == true) {
    document.getElementById("title").style.animation = "TitleScroll " + timer1 + "s linear infinite"
  }
  if (ChannelScrollStatus == true) {
    document.getElementById("channel").style.animation = "ChannelScroll " + timer2 + "s linear infinite"
  }
})

document.getElementById("preset2").addEventListener("click", () => {
  document.getElementById("OverlayWidth").value = 200
  document.getElementById("overlay").style.width = document.getElementById("OverlayWidth").value + "px"

  document.getElementById("OverlayHeight").value = 50
  document.getElementById("overlay").style.height = document.getElementById("OverlayHeight").value + "px"
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight /0.75) + "px"
  document.getElementById("OverlaySettings").style.marginTop = document.getElementById("overlay").offsetHeight + 10 + "px"

  document.getElementById("TitleFontSize").value = 20
  document.getElementById("title").style.fontSize = document.getElementById("TitleFontSize").value + "px"

  document.getElementById("ChannelFontSize").value = 0
  document.getElementById("channel").style.fontSize = document.getElementById("ChannelFontSize").value + "px"

  document.documentElement.style.setProperty("--TitleScroll", document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth + "px")
  document.documentElement.style.setProperty("--ChannelScroll", document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth + "px")

  let timer1 = (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / PixelsPerSecond
  let timer2 = (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / PixelsPerSecond

  if (timer1 < 1) {
    timer1 = 1
  } else if (timer1 > 60) {
    timer1 = 60
  }

  if (timer2 < 1) {
    timer2 = 1
  } else if (timer2 > 60) {
    timer2 = 60
  }

  if (TitleScrollStatus == true) {
    document.getElementById("title").style.animation = "TitleScroll " + timer1 + "s linear infinite"
  }
  if (ChannelScrollStatus == true) {
    document.getElementById("channel").style.animation = "ChannelScroll " + timer2 + "s linear infinite"
  }
})

document.getElementById("preset3").addEventListener("click", () => {
  document.getElementById("OverlayWidth").value = 250
  document.getElementById("overlay").style.width = document.getElementById("OverlayWidth").value + "px"

  document.getElementById("OverlayHeight").value = 50
  document.getElementById("overlay").style.height = document.getElementById("OverlayHeight").value + "px"
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight /0.75) + "px"
  document.getElementById("OverlaySettings").style.marginTop = document.getElementById("overlay").offsetHeight + 10 + "px"

  document.getElementById("TitleFontSize").value = 14
  document.getElementById("title").style.fontSize = document.getElementById("TitleFontSize").value + "px"

  document.getElementById("ChannelFontSize").value = 14
  document.getElementById("channel").style.fontSize = document.getElementById("ChannelFontSize").value + "px"

  document.documentElement.style.setProperty("--TitleScroll", document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth + "px")
  document.documentElement.style.setProperty("--ChannelScroll", document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth + "px")

  let timer1 = (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / PixelsPerSecond
  let timer2 = (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / PixelsPerSecond

  if (timer1 < 1) {
    timer1 = 1
  } else if (timer1 > 60) {
    timer1 = 60
  }

  if (timer2 < 1) {
    timer2 = 1
  } else if (timer2 > 60) {
    timer2 = 60
  }

  if (TitleScrollStatus == true) {
    document.getElementById("title").style.animation = "TitleScroll " + timer1 + "s linear infinite"
  }
  if (ChannelScrollStatus == true) {
    document.getElementById("channel").style.animation = "ChannelScroll " + timer2 + "s linear infinite"
  }
})



function generateOverlay() {
  document.getElementById("time").style.background = generateRGB()
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight /0.75) + "px"

  try{
    document.getElementById("thumbnail").innerHTML = '<img src="' + CurrentlyPlaying.snippet.thumbnails.default.url + '" alt="Video Thumbnail">'
  } catch {
    {}
  }

  document.getElementById("title").innerHTML = document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML
  document.getElementById("channel").innerHTML = document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML

  TimeUpdater = setInterval(() => {
    try {
      document.getElementById("time").style.width = player.getCurrentTime() / player.getDuration() * 100 + "%"
    } catch {
      document.getElementById("time").style.width = "0%"
    }

  }, 500);
}

/* CODE FOR OVERLAY */

function generateRGB() {
  let MyColor = [0,0,0]
  MyColor[Math.floor(Math.random()*3)] = 255

  let SecondIndex = Math.floor(Math.random()*4)

  if (MyColor[SecondIndex] == 0){
    MyColor[SecondIndex] = Math.floor(Math.random()*256)
  } else {
    MyColor[(SecondIndex + 1) % 2] = Math.floor(Math.random()*256)
  }
  return "rgb(" + MyColor[0] + "," + MyColor[1] + "," + MyColor[2] + ")"
}