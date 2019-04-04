// Main variables
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
let token
let morePages
let key = "AIzaSyBSyUYZf-2UqLAnBYJGDzd-fQZ8hps3-40"
// Main variables

// Overlay variables
let OverlayToggle = false
let TimeUpdater
let TitleScrollStatus = false
let ChannelScrollStatus = false
let tickerSpeed = 10
// Overlay variables

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

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
  document.getElementById("player").innerHTML = '<div style="background:#000000;color:#ffffff;width:100%;height:90%;display:flex;justify-content:center;align-items:center;text-align:center;overflow:hidden;"><h1>YouTube<br>READY FOR USE</h1></div>'
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  player.playVideo()
}


function onPlayerStateChange(event) {
  // YT.PlayerState. {"UNSTARTED":-1,"ENDED":0,"PLAYING":1,"PAUSED":2,"BUFFERING":3,"CUED":5}
  PlayerState = event.data
  if (event.data == YT.PlayerState.ENDED) {
    if (queue.length > 0) {
      let index
      if (ShuffleStatus == true) {
        index = Math.floor(Math.random() * queue.length)
      } else {
        index = 0
      }
      
      player.loadVideoById(queue[index].id)

      CurrentlyPlaying = queue[index]
      document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = queue[index].title
      document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = queue[index].channel
      document.getElementById("Currently-Playing-Views").innerHTML = queue[index].views
      document.getElementById("Currently-Playing-Likes").innerHTML = queue[index].likes
      document.getElementById("Currently-Playing-Dislikes").innerHTML = queue[index].dislikes

      updateOverlay()

      if (LockStatus == true) {
        queue.push(queue[index])
        queue.splice(index, 1)
      } else {
        queue.splice(index, 1)
      }

      let InnerHTMLData = "<h1>Queue:</h1>"
      for (let i in queue) {
        InnerHTMLData += "<section><p>" + queue[i].title + "</p></section>"
      }
      document.getElementById("queue").innerHTML = InnerHTMLData
    }
  }
}


//  Event listerners start


document.getElementById("Search").addEventListener("click", RunSearch)

function RunSearch() {
  if (loading == true) {
    return
  }
  loading = true
  morePages = true

  SearchInput = document.getElementById("SearchInput").value
  if (SearchInput != "" && SearchMethod == "video") {
    xml = new XMLHttpRequest()
    // API Call 1 (List videos)
    xml.onreadystatechange = function () {
      if (xml.readyState == 4) {
        video_data = {}
        data = JSON.parse(xml.response).items
        token = JSON.parse(xml.response).nextPageToken

        let ids = ""

        for (let i in data) {
          if (ids === "") {
            ids += data[i].id.videoId
          } else {
            ids += "," + data[i].id.videoId
          }
        }

        xml = new XMLHttpRequest()
        // API Call 2 (Video data from id:s)
        xml.onreadystatechange = newRequestFromIDs
        xml.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + ids + "&key=" + key, true)
        xml.send()
      }
    }

    CurrentSearchMethod = "video"
    xml.open("get", "https://www.googleapis.com/youtube/v3/search?part=snippet&key=" + key + "&type=video&order=relevance&maxResults=25&q=" + encodeURI(SearchInput), true)
    xml.send()

  } else if (SearchInput != "" && SearchMethod == "playlist") {
    xml = new XMLHttpRequest()
    // API call 1 (List videos)
    xml.onreadystatechange = function () {
      if (xml.readyState == 4) {
        video_data = {}
        data = JSON.parse(xml.response).items
        if (!JSON.parse(xml.response).nextPageToken) {
          morePages = false
        } else {
          token = JSON.parse(xml.response).nextPageToken
          morePages = true
        }

        let ids = ""

        for (i of data) {
          if (ids === "") {
            ids += i.snippet.resourceId.videoId
          } else {
            ids += "," + i.snippet.resourceId.videoId
          }
        }

        xml = new XMLHttpRequest()
        // API call 2 (Video data from id:s)
        xml.onreadystatechange = newRequestFromIDs

        CurrentSearchMethod = "playlist"
        xml.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + ids + "&key=" + key, true)
        xml.send()
      }
    }
    listId = new URLSearchParams(SearchInput.split("?")[1])

    xml.open('get', 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=' + key + '&maxResults=25&playlistId=' + listId.get("list"), true)
    xml.send()
  }
}


window.addEventListener("keypress", (e) => {
  if (e.path[0] == document.getElementById("SearchInput") && e.key == "Enter") {
    RunSearch()
  }
})


window.addEventListener("scroll", () => {
  if (loading == true) {
    return
  }
  if (document.getElementById("SearchResults").innerHTML == "") {
    return
  }
  if (window.pageYOffset + window.innerHeight * 2 < document.querySelector("html").offsetHeight) {
    return
  }
  if (morePages == false){
    return
  }

  loading = true

  if (SearchMethod == "playlist") {
    xml = new XMLHttpRequest()
    // API Call 1 (List videos)
    xml.onreadystatechange = function () {
      if (xml.readyState == 4) {
        data = JSON.parse(xml.response).items
        if (JSON.parse(xml.response).nextPageToken === undefined) {
          morePages = false
        } else {
          token = JSON.parse(xml.response).nextPageToken
        }

        let ids = ""

        for (i of data) {
          if (ids === "") {
            ids += i.snippet.resourceId.videoId
          } else {
            ids += "," + i.snippet.resourceId.videoId
          }
        }

        xml = new XMLHttpRequest()
        // API Call 2 (Video data from id:s)
        xml.onreadystatechange = requestFromIDs
        xml.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + ids + "&key=" + key, true)
        xml.send()
      }
    }

    xml.open("get", "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=" + key + "&maxResults=25&playlistId=" + listId.get("list") + "&pageToken=" + token, true)
    xml.send()


  } else if (SearchMethod == "video") {
    xml = new XMLHttpRequest()
    // API Call 1 (List videos)
    xml.onreadystatechange = function () {
      if (xml.readyState == 4) {
        data = JSON.parse(xml.response).items
        if (JSON.parse(xml.response).nextPageToken === undefined) {
          morePages = false
        } else {
          token = JSON.parse(xml.response).nextPageToken
        }

        let ids = ""

        for (let video of data) {
          if (ids === "") {
            ids += video.id.videoId
          } else {
            ids += "," + video.id.videoId
          }
        }

        xml = new XMLHttpRequest()
        // API Call 2 (Video data from id:s)
        xml.onreadystatechange = requestFromIDs
        xml.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + ids + "&key=" + key, true)
        xml.send()
      }
    }
    xml.open("get", "https://www.googleapis.com/youtube/v3/search?part=snippet&key=" + key + "&type=video&order=relevance&maxResults=25&q=" + encodeURI(SearchInput) + "&pageToken=" + token, true)
    xml.send()
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


    player.loadVideoById(queue[index].id)

    CurrentlyPlaying = queue[index]
    document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = queue[index].title
    document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = queue[index].channel
    document.getElementById("Currently-Playing-Views").innerHTML = queue[index].views
    document.getElementById("Currently-Playing-Likes").innerHTML = queue[index].likes
    document.getElementById("Currently-Playing-Dislikes").innerHTML = queue[index].dislikes
    updateOverlay()

    if (LockStatus == true) {
      queue.push(queue[index])
      queue.splice(index, 1)
    } else {
      queue.splice(index, 1)
    }

    let InnerHTMLData = "<h1>Queue:</h1>"
    for (let i in queue) {
      InnerHTMLData += "<section><p>" + queue[i].title + "</p></section>"
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
  try {
    window.open("https://www.youtube.com/watch?v=" + CurrentlyPlaying.id)
  } catch (error) {
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
  if (e.target.nodeName == "P") {
    let QueueItems = []
    document.getElementById("queue").querySelectorAll("p").forEach((element) => {
      QueueItems.push(element)
    })
    let TargetIndex = QueueItems.indexOf(e.target)
    let innerHTML = document.getElementById("QueueClick").innerHTML.toLowerCase()

    if (innerHTML == "remove") {
      queue.splice(TargetIndex, 1)

      let CodeBlock = "<h1>Queue:</h1>"

      for (let i of queue) {
        CodeBlock += "<section><p>" + i.title + "</p></section>"
      }
      document.getElementById("queue").innerHTML = CodeBlock

    } else if (innerHTML == "play now") {

      CurrentlyPlaying = queue[TargetIndex]
      document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = CurrentlyPlaying.title
      document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = CurrentlyPlaying.channel
      document.getElementById("Currently-Playing-Views").innerHTML = CurrentlyPlaying.views
      document.getElementById("Currently-Playing-Likes").innerHTML = CurrentlyPlaying.likes
      document.getElementById("Currently-Playing-Dislikes").innerHTML = CurrentlyPlaying.dislikes
      updateOverlay()

      player.loadVideoById(queue[TargetIndex].id)

      if (LockStatus == true) {
        queue.push(queue[TargetIndex])
        queue.splice(TargetIndex, 1)
      } else {
        queue.splice(TargetIndex, 1)
      }

      let CodeBlock = "<h1>Queue:</h1>"

      for (let i of queue) {
        CodeBlock += "<section><p>" + i.title + "</p></section>"
      }
      document.getElementById("queue").innerHTML = CodeBlock

    } else if (innerHTML == "move up") {

      let temp = queue[TargetIndex]

      if (TargetIndex == 0) {
        queue.push(queue[0])
        queue.splice(0, 1)
      } else {
        queue[TargetIndex] = queue[TargetIndex - 1]
        queue[TargetIndex - 1] = temp
      }

      let CodeBlock = "<h1>Queue:</h1>"

      for (let i of queue) {
        CodeBlock += "<section><p>" + i.title + "</p></section>"
      }
      document.getElementById("queue").innerHTML = CodeBlock

    } else if (innerHTML == "move down") {

      let temp = queue[TargetIndex]

      if (TargetIndex == queue.length - 1) {
        queue.unshift(queue[queue.length - 1])
        queue.splice(queue.length - 1, 1)
      } else {
        queue[TargetIndex] = queue[TargetIndex + 1]
        queue[TargetIndex + 1] = temp
      }


      let CodeBlock = "<h1>Queue:</h1>"

      for (let i of queue) {
        CodeBlock += "<section><p>" + i.title + "</p></section>"
      }
      document.getElementById("queue").innerHTML = CodeBlock
    }

  }
})

document.getElementById("SearchInput").addEventListener("input", (e) => {
  if (e.target.value.toLowerCase().includes("youtube.com/playlist") && e.target.value.toLowerCase().includes("?") && e.target.value.toLowerCase().includes("list=")) {
    document.getElementById("Search").querySelector("p").innerHTML = "Search Playlist"
    SearchMethod = "playlist"
  } else {
    document.getElementById("Search").querySelector("p").innerHTML = "Search Video"
    SearchMethod = "video"
  }
})

//   Event listnerers end


function AddVideo(data_tag) {
  video_id = new String(data_tag.getAttribute("data-videoid"))

  if (document.getElementById("player").nodeName == "DIV") {
    if (LockStatus == true) {
      queue.push(video_data[video_id])
      document.getElementById("queue").innerHTML += "<section><p>" + queue[queue.length - 1].title + "</p></section>"
    }
    CurrentlyPlaying = video_data[video_id]
    document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = CurrentlyPlaying.title
    document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = CurrentlyPlaying.channel
    document.getElementById("Currently-Playing-Views").innerHTML = CurrentlyPlaying.views
    document.getElementById("Currently-Playing-Likes").innerHTML = CurrentlyPlaying.likes
    document.getElementById("Currently-Playing-Dislikes").innerHTML = CurrentlyPlaying.dislikes
    StartYouTubeIframe(video_id)
    updateOverlay()
  } else {
    if (PlayerState == 0) {
      if (LockStatus == true) {
        queue.push(video_data[video_id])
        document.getElementById("queue").innerHTML += "<section><p>" + queue[queue.length - 1].title + "</p></section>"
      }
      player.loadVideoById(video_id)
      CurrentlyPlaying = video_data[video_id]
      document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = CurrentlyPlaying.title
      document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = CurrentlyPlaying.channel
      document.getElementById("Currently-Playing-Views").innerHTML = CurrentlyPlaying.views
      document.getElementById("Currently-Playing-Likes").innerHTML = CurrentlyPlaying.likes
      document.getElementById("Currently-Playing-Dislikes").innerHTML = CurrentlyPlaying.dislikes
      updateOverlay()
    } else {
      queue.push(video_data[video_id])
      document.getElementById("queue").innerHTML += "<section><p>" + queue[queue.length - 1].title + "</p></section>"
    }
  }
}

// CODE FOR OVERLAY START

function updateOverlay() {
  if (OverlayToggle == true) {

    try {
      document.getElementById("thumbnail").innerHTML = '<img src="' + CurrentlyPlaying.thumbnail + '" alt="Video Thumbnail">'
    } catch (error) {
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
        document.getElementById("title").style.animation = "TitleScroll " + (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed + "s linear infinite"
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
        document.getElementById("channel").style.animation = "ChannelScroll " + (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed + "s linear infinite"
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
  tickerSpeed = document.getElementById("TickerSpeed").value
  if (TitleScrollStatus == true) {
    document.getElementById("title").style.animation = "TitleScroll " + (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed + "s linear infinite"
  }
  if (ChannelScrollStatus == true) {
    document.getElementById("channel").style.animation = "ChannelScroll " + (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed + "s linear infinite"
  }
})

document.getElementById("OverlayWidth").addEventListener("input", () => {
  document.getElementById("overlay").style.width = document.getElementById("OverlayWidth").value + "px"
  document.documentElement.style.setProperty("--TitleScroll", document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth + "px")
  document.documentElement.style.setProperty("--ChannelScroll", document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth + "px")
})

document.getElementById("OverlayHeight").addEventListener("input", () => {
  document.getElementById("overlay").style.height = document.getElementById("OverlayHeight").value + "px"
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight / 0.75) + "px"
  document.getElementById("OverlaySettings").style.marginTop = document.getElementById("overlay").offsetHeight + 10 + "px"
})


document.getElementById("BGCR").addEventListener("input", backgroundColorChanged)
document.getElementById("BGCG").addEventListener("input", backgroundColorChanged)
document.getElementById("BGCB").addEventListener("input", backgroundColorChanged)

function backgroundColorChanged() {
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

function textColorChanged() {
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
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight / 0.75) + "px"
  document.getElementById("OverlaySettings").style.marginTop = document.getElementById("overlay").offsetHeight + 10 + "px"

  document.getElementById("TitleFontSize").value = 25
  document.getElementById("title").style.fontSize = document.getElementById("TitleFontSize").value + "px"

  document.getElementById("ChannelFontSize").value = 18
  document.getElementById("channel").style.fontSize = document.getElementById("ChannelFontSize").value + "px"

  document.documentElement.style.setProperty("--TitleScroll", document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth + "px")
  document.documentElement.style.setProperty("--ChannelScroll", document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth + "px")

  let timer1 = (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed
  let timer2 = (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed

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
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight / 0.75) + "px"
  document.getElementById("OverlaySettings").style.marginTop = document.getElementById("overlay").offsetHeight + 10 + "px"

  document.getElementById("TitleFontSize").value = 20
  document.getElementById("title").style.fontSize = document.getElementById("TitleFontSize").value + "px"

  document.getElementById("ChannelFontSize").value = 0
  document.getElementById("channel").style.fontSize = document.getElementById("ChannelFontSize").value + "px"

  document.documentElement.style.setProperty("--TitleScroll", document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth + "px")
  document.documentElement.style.setProperty("--ChannelScroll", document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth + "px")

  let timer1 = (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed
  let timer2 = (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed

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
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight / 0.75) + "px"
  document.getElementById("OverlaySettings").style.marginTop = document.getElementById("overlay").offsetHeight + 10 + "px"

  document.getElementById("TitleFontSize").value = 14
  document.getElementById("title").style.fontSize = document.getElementById("TitleFontSize").value + "px"

  document.getElementById("ChannelFontSize").value = 14
  document.getElementById("channel").style.fontSize = document.getElementById("ChannelFontSize").value + "px"

  document.documentElement.style.setProperty("--TitleScroll", document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth + "px")
  document.documentElement.style.setProperty("--ChannelScroll", document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth + "px")

  let timer1 = (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed
  let timer2 = (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed

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
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight / 0.75) + "px"

  try {
    document.getElementById("thumbnail").innerHTML = '<img src="' + CurrentlyPlaying.thumbnail + '" alt="Video Thumbnail">'
  } catch (error) {
    {}
  }

  document.getElementById("title").innerHTML = document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML
  document.getElementById("channel").innerHTML = document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML

  TimeUpdater = setInterval(() => {
    try {
      document.getElementById("time").style.width = player.getCurrentTime() / player.getDuration() * 100 + "%"
    } catch (error) {
      document.getElementById("time").style.width = "0%"
    }

  }, 500);
}

// CODE FOR OVERLAY END

function generateRGB() {
  let MyColor = [0, 0, 0]
  MyColor[Math.floor(Math.random() * 3)] = 255

  let SecondIndex = Math.floor(Math.random() * 4)

  if (MyColor[SecondIndex] == 0) {
    MyColor[SecondIndex] = Math.floor(Math.random() * 256)
  } else {
    MyColor[(SecondIndex + 1) % 2] = Math.floor(Math.random() * 256)
  }
  return "rgb(" + MyColor[0] + "," + MyColor[1] + "," + MyColor[2] + ")"
}

function newRequestFromIDs() {
  if (xml.readyState == 4) {
    data = JSON.parse(xml.response).items
    let InnerHTMLData = ""
    for (video of data) {
      video_data[video.id] = {
        "channel": video.snippet.channelTitle,
        "title": video.snippet.title,
        "thumbnail": video.snippet.thumbnails.default.url,
        "duration": convertTime(video.contentDetails.duration),
        "id": video.id,
        "views": video.statistics.viewCount,
        "likes": video.statistics.likeCount,
        "dislikes": video.statistics.dislikeCount
      }
      InnerHTMLData += '<section onclick="AddVideo(this)" data-videoid="' + video_data[video.id].id + '">' + '<img src="' + video_data[video.id].thumbnail + '">' + "<span>" + "<h1>" + video_data[video.id].title + "</h1>" + '<p class="VideoItem"><i class="fas fa-clock"></i>' + video_data[video.id].duration + "</p>" + '<p class="VideoItem"><i class="fas fa-eye"></i>' + video_data[video.id].views + "</p>" + '<p class="VideoItem"><i class="fas fa-thumbs-up"></i>' + video_data[video.id].likes + "</p>" + '<p class="VideoItem"><i class="fas fa-thumbs-down"></i>' + video_data[video.id].dislikes + "</p>" + "<p>" + video_data[video.id].channel + "</p>" + "</span>" + "</section>"
    }
    document.getElementById("SearchResults").innerHTML = InnerHTMLData
    loading = false
  }
}

function requestFromIDs() {
  if (xml.readyState == 4) {
    data = JSON.parse(xml.response).items
    let InnerHTMLData = ""
    for (video of data) {
      video_data[video.id] = {
        "channel": video.snippet.channelTitle,
        "title": video.snippet.title,
        "thumbnail": video.snippet.thumbnails.default.url,
        "duration": convertTime(video.contentDetails.duration),
        "id": video.id,
        "views": video.statistics.viewCount,
        "likes": video.statistics.likeCount,
        "dislikes": video.statistics.dislikeCount
      }
      InnerHTMLData += '<section onclick="AddVideo(this)" data-videoid="' + video_data[video.id].id + '">' + '<img src="' + video_data[video.id].thumbnail + '">' + "<span>" + "<h1>" + video_data[video.id].title + "</h1>" + '<p class="VideoItem"><i class="fas fa-clock"></i>' + video_data[video.id].duration + "</p>" + '<p class="VideoItem"><i class="fas fa-eye"></i>' + video_data[video.id].views + "</p>" + '<p class="VideoItem"><i class="fas fa-thumbs-up"></i>' + video_data[video.id].likes + "</p>" + '<p class="VideoItem"><i class="fas fa-thumbs-down"></i>' + video_data[video.id].dislikes + "</p>" + "<p>" + video_data[video.id].channel + "</p>" + "</span>" + "</section>"
    }
    document.getElementById("SearchResults").innerHTML += InnerHTMLData
    loading = false
  }
}

function convertTime(raw_timestamp) {
  timestamps = raw_timestamp.match(/\d+\w/g)
  // [DAYS, HOURS, MINUTES, SECONDS]
  let values = ["00", "00", "00", "00"]
  for (let i of timestamps) {
    if (i[i.length - 1] === "D") {
      if (i.length == 2) {
        values[0] = "0" + i.substring(0, i.length - 1)
      } else {
        values[0] = i.substring(0, i.length - 1)
      }
    } else if (i[i.length - 1] === "H") {
      if (i.length == 2) {
        values[1] = "0" + i.substring(0, i.length - 1)
      } else {
        values[1] = i.substring(0, i.length - 1)
      }
    } else if (i[i.length - 1] === "M") {
      if (i.length == 2) {
        values[2] = "0" + i.substring(0, i.length - 1)
      } else {
        values[2] = i.substring(0, i.length - 1)
      }
    } else if (i[i.length - 1] === "S") {
      if (i.length == 2) {
        values[3] = "0" + i.substring(0, i.length - 1)
      } else {
        values[3] = i.substring(0, i.length - 1)
      }
    }
  }
  while (values[0] == "00") {
    values.shift()
  }
  let res = ""
  for (let i of values) {
    res += i + ":"
  }
  return res.substring(0, res.length - 1)
}