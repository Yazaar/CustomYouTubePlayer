
// Main variables
let loading = false
let data
let SearchInput
let video_id
let video_data = {}
let queue = []
let PlayerState
let LockStatus = false
let CurrentlyPlaying
let SearchMethod
let CurrentSearchMethod
let query
let token
let morePages
let key = "AIzaSyBSyUYZf-2UqLAnBYJGDzd-fQZ8hps3-40"
let playerReady = false
if (typeof(window.localStorage.getItem('YTAPIKEY')) === 'string') {
  key = window.localStorage.getItem('YTAPIKEY')
}
// Main variables

// Overlay variables
let OverlayToggle = false
let TimeUpdater
let TitleScrollStatus = false
let ChannelScrollStatus = false
let tickerSpeed = 10
// Overlay variables

// Songrequest variables
let SongrequestToggle = false
let SongrequestQueue = []
let twitch_loading = false
let twitch_queue = []
let requestLimit = 2
let twitch_socket
let twitch_channel
let twitch_username
let twitch_tmi
let twitch_command = "!yt"
// Songrequest variables

// Socket variables
let SocketToggle = false
let socketConnecting = false
let socketConnection
let socketData = {
  channel: '',
  title: '',
  currentTime: 0,
  totalTime: 0,
  paused: false,
  tabId: -1,
  videoId: ''
}
let socketLoop = false
// Socket variables

// MusicLink variables
let musicLinkToggle = false
let musicLinkConnecting = false
let musicLink
let musicLinkData = {
  author: '',
  title: '',
  currentTime: 0,
  totalTime: 0,
  YTthumbnail: ''
}
let musicLinkLoop = false
let musicLinkLatestValid = '';
// MusicLink variables

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;

function StartYouTubeIframe(video_id) {
  // function which generates a youtube iframe with the player API.
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
  // function which triggers when the YouTube iframe API is ready (when you are able to generate the iframe)
  document.getElementById("player").innerHTML = '<div style="background:#000000;color:#ffffff;width:100%;height:90%;display:flex;justify-content:center;align-items:center;text-align:center;overflow:hidden;"><h1>YouTube<br>READY FOR USE</h1></div>'
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady() {
  // make sure that the video autoplays, this function is triggerd when the function StartYouTubeIframe is successful
  playerReady = true
  player.playVideo()
}


function onPlayerStateChange(event) {
  // function which is triggerd each time the player changes state
  // YT.PlayerState. {"UNSTARTED":-1,"ENDED":0,"PLAYING":1,"PAUSED":2,"BUFFERING":3,"CUED":5}
  if (event.data === -1 || event.data === 5) {
    return
  }
  PlayerState = event.data
  if (event.data == YT.PlayerState.ENDED) {
    if (document.getElementById('SRSplitQueue').checked === true && SongrequestQueue.length > 0){
      let index = 0

      player.loadVideoById(SongrequestQueue[index].id, 0)

      CurrentlyPlaying = SongrequestQueue[index]
      document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = SongrequestQueue[index].title
      document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = SongrequestQueue[index].channel
      document.getElementById("Currently-Playing-Views").innerHTML = SongrequestQueue[index].views
      document.getElementById("Currently-Playing-Likes").innerHTML = SongrequestQueue[index].likes
      document.getElementById("Currently-Playing-Dislikes").innerHTML = SongrequestQueue[index].dislikes

      updateOverlay()

      SongrequestQueue.shift()

      updateQueue("songrequest")
    } else if (queue.length > 0) {
      let index = 0

      player.loadVideoById(queue[index].id, 0)

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

      updateQueue("main")
    }
  }
}


//  Event listerners start


document.getElementById("Search").addEventListener("click", RunSearch)

function RunSearch() {
  // Run a search for youtube videos (triggerd thru the search button)
  if (loading == true) {
    return
  }
  loading = true
  morePages = true

  SearchInput = document.getElementById("SearchInput").value
  if (SearchInput == "") {
    loading = false
    morePages = false
    return
  }
  if (SearchMethod == "video") {
    let xml = new XMLHttpRequest()
    // API Call 1 (List videos)
    xml.onreadystatechange = function () {
      if (xml.readyState == 4) {
        video_data = {}
        data = JSON.parse(xml.response).items
        token = JSON.parse(xml.response).nextPageToken

        let ids = ""

        if (data === undefined || data.constructor !== Array) {
          loading = false
          morePages = false
          alert("Invalid API Key, please consider swapping key")
          document.getElementById("SwapKey").click()
          return
        }

        for (let i in data) {
          if (ids === "") {
            ids += data[i].id.videoId
          } else {
            ids += "," + data[i].id.videoId
          }
        }

        let xml2 = new XMLHttpRequest()
        // API Call 2 (Video data from id:s)
        xml2.onreadystatechange = () => {
          newRequestFromIDs(xml2)
        }
        xml2.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + ids + "&key=" + key, true)
        xml2.send()
      }
    }

    CurrentSearchMethod = "video"
    xml.open("get", "https://www.googleapis.com/youtube/v3/search?part=snippet&key=" + key + "&type=video&order=relevance&maxResults=50&q=" + encodeURI(SearchInput), true)
    xml.send()

  } else if (SearchMethod == "playlist") {
    let xml = new XMLHttpRequest()
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

        if (data === undefined || data.constructor !== Array) {
          loading = false
          morePages = false
          alert("Invalid API Key, please consider swapping key")
          document.getElementById("SwapKey").click()
          return
        }

        for (i of data) {
          if (ids === "") {
            ids += i.snippet.resourceId.videoId
          } else {
            ids += "," + i.snippet.resourceId.videoId
          }
        }

        let xml2 = new XMLHttpRequest()
        // API call 2 (Video data from id:s)
        xml2.onreadystatechange = () => {
          newRequestFromIDs(xml2)
        }

        CurrentSearchMethod = "playlist"
        xml2.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + ids + "&key=" + key, true)
        xml2.send()
      }
    }
    query = new URLSearchParams(SearchInput.split("?")[1])

    xml.open('get', 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=' + key + '&maxResults=50&playlistId=' + query.get("list"), true)
    xml.send()
  } else if (SearchMethod == "specific") {
    let xml = new XMLHttpRequest()
    // Check if video id is valid
    xml.onreadystatechange = function () {
      if (xml.readyState == 4) {
        if (JSON.parse(xml.response).error == "404 Not Found") {
          loading = false
          alert("Invalid video!")
          return
        }

        // Real API Call for video data
        let xml2 = new XMLHttpRequest()
        let processedData
        xml2.onreadystatechange = function () {
          if (xml2.readyState == 4) {
            processedData = JSON.parse(xml2.response)
            if (processedData.items === undefined || processedData.items.length == 0) {
              processedData = JSON.parse(xml.response)
              processedData = {
                "channel": processedData.author_name,
                "title": processedData.title,
                "thumbnail": processedData.thumbnail_url,
                "duration": 0,
                "id": processedData.url.split("v=")[1],
                "views": 0,
                "likes": 0,
                "dislikes": 0
              }
              video_data[processedData.id] = processedData
            } else {
              processedData = {
                "channel": processedData.items[0].snippet.channelTitle,
                "title": processedData.items[0].snippet.title,
                "thumbnail": processedData.items[0].snippet.thumbnails.default.url,
                "duration": convertTime(processedData.items[0].contentDetails.duration),
                "id": processedData.items[0].id,
                "views": convertNumber(processedData.items[0].statistics.viewCount),
                "likes": convertNumber(processedData.items[0].statistics.likeCount),
                "dislikes": convertNumber(processedData.items[0].statistics.dislikeCount)
              }
              video_data[processedData.id] = processedData
            }
            InnerHTMLData = '<section onclick="AddVideo(this)" data-videoid="' + processedData.id + '">' + '<img src="' + processedData.thumbnail + '">' + "<span>" + "<h1>" + processedData.title + "</h1>" + '<p class="VideoItem"><i class="fas fa-clock"></i>' + processedData.duration + "</p>" + '<p class="VideoItem"><i class="fas fa-eye"></i>' + processedData.views + "</p>" + '<p class="VideoItem"><i class="fas fa-thumbs-up"></i>' + processedData.likes + "</p>" + '<p class="VideoItem"><i class="fas fa-thumbs-down"></i>' + processedData.dislikes + "</p>" + "<p>" + processedData.channel + "</p>" + "</span>" + "</section>"
            document.getElementById("SearchResults").innerHTML = InnerHTMLData
            morePages = false
            let noMorePagesElement = document.createElement('h1')
            noMorePagesElement.innerText = 'Finished loading'
            document.getElementById('SearchResults').appendChild(noMorePagesElement)
            loading = false
          }
        }
        xml2.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + requestId + "&key=" + key, true)
        xml2.send()
      }
    }
    let requestId = SearchInput.match(/\?[^v]*v=([^&]+)/)[1]
    xml.open("get", "https://noembed.com/embed?url=https://www.youtube.com/watch?v=" + requestId, true)
    xml.send()
  } else if (SearchMethod == "channel") {
    let xml = new XMLHttpRequest()
    // API Call 1 (List videos)
    xml.onreadystatechange = function () {
      if (xml.readyState == 4) {
        video_data = {}
        data = JSON.parse(xml.response).items
        token = JSON.parse(xml.response).nextPageToken

        let ids = ""

        if (data === undefined || data.constructor !== Array) {
          loading = false
          morePages = false
          alert("Invalid API Key, please consider swapping key")
          document.getElementById("SwapKey").click()
          return
        }

        for (let i in data) {
          if (ids === "") {
            ids += data[i].id.videoId
          } else {
            ids += "," + data[i].id.videoId
          }
        }

        let xml2 = new XMLHttpRequest()
        // API Call 2 (Video data from id:s)
        xml2.onreadystatechange = function() {
          newRequestFromIDs(xml2)
        }
        xml2.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + ids + "&key=" + key, true)
        xml2.send()
      }
    }

    CurrentSearchMethod = "channel"
    query = SearchInput.match(/youtube.com\/channel\/([^\/\?#]+)/)[1]
    xml.open("get", "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=" + query + "&maxResults=50&order=date&key=" + key, true)
    xml.send()
  }
}


window.addEventListener("keypress", (e) => {
  if (e.target == document.getElementById("SearchInput") && e.key == "Enter") {
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
  if (morePages == false) {
    return
  }
  
  loading = true
  
  if (CurrentSearchMethod == "playlist") {
    let xml = new XMLHttpRequest()
    // API Call 1 (List videos)
    xml.onreadystatechange = function () {
      if (xml.readyState == 4) {
        data = JSON.parse(xml.response).items
        if (JSON.parse(xml.response).nextPageToken === undefined) {
          morePages = false
          let noMorePagesElement = document.createElement('h1')
          noMorePagesElement.innerText = 'Finished loading'
          document.getElementById('SearchResults').appendChild(noMorePagesElement)
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
        
        let xml2 = new XMLHttpRequest()
        // API Call 2 (Video data from id:s)
        xml2.onreadystatechange = () => {
          requestFromIDs(xml2)
        }
        xml2.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + ids + "&key=" + key, true)
        xml2.send()
      }
    }
    
    xml.open("get", "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=" + key + "&maxResults=50&playquery=" + query.get("list") + "&pageToken=" + token, true)
    xml.send()
    
    
  } else if (CurrentSearchMethod == "video") {
    let xml = new XMLHttpRequest()
    // API Call 1 (List videos)
    xml.onreadystatechange = function () {
      if (xml.readyState == 4) {
        data = JSON.parse(xml.response).items
        if (JSON.parse(xml.response).nextPageToken === undefined) {
          morePages = false
          let noMorePagesElement = document.createElement('h1')
          noMorePagesElement.innerText = 'Finished loading'
          document.getElementById('SearchResults').appendChild(noMorePagesElement)
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
        
        let xml2 = new XMLHttpRequest()
        // API Call 2 (Video data from id:s)
        xml2.onreadystatechange = () => {
          requestFromIDs(xml2)
        }
        xml2.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + ids + "&key=" + key, true)
        xml2.send()
      }
    }
    xml.open("get", "https://www.googleapis.com/youtube/v3/search?part=snippet&key=" + key + "&type=video&order=relevance&maxResults=50&q=" + encodeURI(SearchInput) + "&pageToken=" + token, true)
    xml.send()
  } else if (CurrentSearchMethod == "channel") {
    let xml = new XMLHttpRequest()
    // API Call 1 (List videos)
    xml.onreadystatechange = function () {
      if (xml.readyState == 4) {
        data = JSON.parse(xml.response).items
        token = JSON.parse(xml.response).nextPageToken
        if (token === undefined) {
          morePages = false
        }
        
        let ids = ""
        
        if (data === undefined || data.constructor !== Array) {
          loading = false
          morePages = false
          alert("Invalid API Key, please consider swapping key")
          document.getElementById("SwapKey").click()
          return
        }
        
        for (let i in data) {
          if (ids === "") {
            ids += data[i].id.videoId
          } else {
            ids += "," + data[i].id.videoId
          }
        }
        
        let xml2 = new XMLHttpRequest()
        // API Call 2 (Video data from id:s)
        xml2.onreadystatechange = function() {
          requestFromIDs(xml2)
        }
        xml2.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + ids + "&key=" + key, true)
        xml2.send()
      }
    }
    xml.open("get", "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=" + query + "&maxResults=50&pageToken=" + token + "&order=date&key=" + key, true)
    xml.send()
  }
})


document.getElementById("skip").addEventListener("click", () => {
  if (queue.length > 0) {
    let index = 0
    
    
    player.loadVideoById(queue[index].id, 0)

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

    updateQueue("main")
  } else {
    PlayerState = 0
    player.stopVideo()
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
  for (let i = 0; i < queue.length; i++) {
    let swapWith = Math.floor(Math.random() * queue.length)
    let temp = Object.assign({}, queue[swapWith])
    queue[swapWith] = Object.assign({}, queue[i])
    queue[i] = temp
  }
  updateQueue("main")
})

document.getElementById("SwapKey").addEventListener("click", () => {
  document.getElementById("SwapKeyWindow").style.display = "flex"
})

document.getElementById("CloseSwapKeyWindow").addEventListener("click", () => {
  document.getElementById("SwapAPIKeyInput").value = ""
  document.getElementById("SwapKeyWindow").style.display = "none"
})

document.getElementById("SaveKey").addEventListener("click", () => {
  let temp = document.getElementById("SwapAPIKeyInput").value
  if (temp != "") {
    key = temp
    window.localStorage.setItem('YTAPIKEY', temp)
    document.getElementById("SwapAPIKeyInput").value = ""
    document.getElementById("SwapKeyWindow").style.display = "none"
    loading = false
  }
})

document.getElementById("ResetKey").addEventListener("click", () => {
  document.getElementById("SwapAPIKeyInput").value = ""
  key = "AIzaSyBSyUYZf-2UqLAnBYJGDzd-fQZ8hps3-40"
  window.localStorage.removeItem('YTAPIKEY')
  document.getElementById("SwapKeyWindow").style.display = "none"
  loading = false
})

document.getElementById("CloseEditVolumeWindow").addEventListener("click", () => {
  document.getElementById("EditVolumeWindow").style.display = "none"
})

document.getElementById("EditYTVolume").addEventListener("input", (e) => {
  let IntInputValue = parseInt(e.target.value)
  if(IntInputValue !== e.target.val) {
    e.target.value = IntInputValue
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
    if (document.getElementById('SRSplitQueue').checked === true){
      document.getElementById("QueueClick").innerHTML = "Swap queue"
    } else {
      document.getElementById("QueueClick").innerHTML = "Remove"
    }
  } else if (innerHTML == "swap queue") {
    document.getElementById("QueueClick").innerHTML = "Remove"
  }
})


for (let i = 0; i < document.querySelectorAll("#PlayerSettings span").length; i++) {
  document.getElementById("PlayerSettings").querySelectorAll("span")[i].addEventListener("mouseover", (e) => {

    if (e.target.id == "shuffle") {
      document.getElementById("StatusMessage").innerHTML = "Shuffle the queue"
    } else if (e.target.id == "skip") {
      document.getElementById("StatusMessage").innerHTML = "Skip to next video"
    } else if (e.target.id == "lock") {
      document.getElementById("StatusMessage").innerHTML = "Keep video in queue forever"
    } else if (e.target.id == "youtube") {
      document.getElementById("StatusMessage").innerHTML = "Open current video in YouTube (if embed above is blocked)"
    } else if (e.target.id == "QueueClick") {
      document.getElementById("StatusMessage").innerHTML = "Onclick event for queue"
    } else if (e.target.id == "SwapKey") {
      document.getElementById("StatusMessage").innerHTML = "Swap API key to unluck additional requests"
    } else if (e.target.id == "EditVolume") {
      document.getElementById("StatusMessage").innerHTML = "Edit the YT volume easily by typing"
    } else if (e.target.id == "DeleteCopies") {
      document.getElementById("StatusMessage").innerHTML = "Delete copies from the queue"
    } else if (e.target.id == "AddLoaded") {
      document.getElementById("StatusMessage").innerHTML = "Add all loaded videos to the queue (scroll down to load all videos you need before clicking)"
    } else if (e.target.id == "ViewNotes") {
      document.getElementById("StatusMessage").innerHTML = "View your saved notes"
    }
  })
}

for (let i = 0; i < document.getElementById("PlayerSettings").querySelectorAll("span").length; i++) {
  document.getElementById("PlayerSettings").querySelectorAll("span")[i].addEventListener("mouseleave", (e) => {
    document.getElementById("StatusMessage").innerHTML = "Yazaar | YouTube Player"
  })
}

document.getElementById('AddLoaded').addEventListener('click', () => {
  let loadedItems = document.querySelectorAll('#SearchResults section')
  for (let i = 0; i < loadedItems.length; i++) {
    loadedItems[i].click()
  }
})

document.getElementById('CloseNotesWindow').addEventListener('click', () => {
  document.getElementById('NotesWindow').style.display = 'none'
  window.localStorage.setItem('UserNotes', document.getElementById('UserNotes').value)
})

document.getElementById('ViewNotes').addEventListener('click', () => {
  document.getElementById('NotesWindow').style.display = 'flex'
})

document.getElementById("EditVolume").addEventListener("click", () => {
  if(player !== undefined) {
    document.getElementById("EditYTVolume").value = player.getVolume()
  }
  document.getElementById("EditVolumeWindow").style.display = "flex"
})

document.getElementById("SetYTVolume").addEventListener("click", () => {
  let NewVolume = parseInt(document.getElementById("EditYTVolume").value)
  if (isNaN(NewVolume) || player === undefined) {
    return
  }
  player.setVolume(NewVolume)
  document.getElementById("EditVolumeWindow").style.display = "none"
})

document.getElementById("DeleteCopies").addEventListener("click", () => {
  let past = []
  let noDeletes = true
  for (let i = queue.length - 1; i > -1; i--) {
    let isCopy = false
    for (let j = 0; j < past.length; j++) {
      if (queue[i].id === past[j]) {
        isCopy = true
        break
      }
    }
    if (isCopy === true) {
      queue.splice(i, 1)
      if (noDeletes === true) {
        noDeletes = false
      }
    } else {
      past.push(queue[i].id)
    }
  }
  if(noDeletes === false) {
    updateQueue("main")
  }
})

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

      updateQueue("main")

    } else if (innerHTML == "play now") {

      CurrentlyPlaying = queue[TargetIndex]
      document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = CurrentlyPlaying.title
      document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = CurrentlyPlaying.channel
      document.getElementById("Currently-Playing-Views").innerHTML = CurrentlyPlaying.views
      document.getElementById("Currently-Playing-Likes").innerHTML = CurrentlyPlaying.likes
      document.getElementById("Currently-Playing-Dislikes").innerHTML = CurrentlyPlaying.dislikes
      updateOverlay()

      player.loadVideoById(queue[TargetIndex].id, 0)

      if (LockStatus == true) {
        queue.push(queue[TargetIndex])
        queue.splice(TargetIndex, 1)
      } else {
        queue.splice(TargetIndex, 1)
      }

      updateQueue("main")

    } else if (innerHTML == "move up") {

      let temp = queue[TargetIndex]

      if (TargetIndex == 0) {
        queue.push(queue[0])
        queue.splice(0, 1)
      } else {
        queue[TargetIndex] = queue[TargetIndex - 1]
        queue[TargetIndex - 1] = temp
      }

      updateQueue("main")

    } else if (innerHTML == "move down") {

      let temp = queue[TargetIndex]

      if (TargetIndex == queue.length - 1) {
        queue.unshift(queue[queue.length - 1])
        queue.splice(queue.length - 1, 1)
      } else {
        queue[TargetIndex] = queue[TargetIndex + 1]
        queue[TargetIndex + 1] = temp
      }


      updateQueue("main")
    } else if (innerHTML == "swap queue") {

      
      SongrequestQueue.push(queue[TargetIndex])
      
      queue.splice(TargetIndex, 1)

      updateQueue("main")
      updateQueue("songrequest")
    }

  }
})

document.getElementById("SearchInput").addEventListener("input", (e) => {
  SearchInputChange(e.target.value.toLowerCase())
})

function SearchInputChange(InputValue) {
  if (InputValue.includes("youtube.com/playlist") && InputValue.includes("?") && InputValue.includes("list=")) {
    document.getElementById("Search").innerHTML = "Search Playlist"
    SearchMethod = "playlist"
  } else if (/\?[^v]*v=[^&]+/.test(InputValue) && /youtube.com\/watch/.test(InputValue)) {
    document.getElementById("Search").innerHTML = "Find Video"
    SearchMethod = "specific"
  } else if (/\?[^v]*v=[^&]+/.test(InputValue) && /youtube.com\/watch/.test(InputValue)) {
    document.getElementById("Search").innerHTML = "Find Video"
    SearchMethod = "specific"
  } else if (/youtube.com\/channel\/[^\/]+/.test(InputValue)) {
    document.getElementById("Search").innerHTML = "Find User"
    SearchMethod = "channel"
  } else {
    document.getElementById("Search").innerHTML = "Search Video"
    SearchMethod = "video"
  }
}

//   Event listnerers end


function AddVideo(data_tag, queueType='main') {
  // add video to queue / play video

  let QueueElement
  let QueueObject

  if (queueType === 'main'){
    QueueElement = document.getElementById("queue")
    QueueObject = queue
  } else {
    QueueElement = document.getElementById("SRQueue")
    QueueObject = SongrequestQueue
  }

  if (data_tag.nodeName == "SECTION") {
    video_id = new String(data_tag.getAttribute("data-videoid"))
  } else {
    video_id = data_tag
  }

  if (video_data[video_id] === undefined) {
    return
  }

  if (document.getElementById("player").nodeName == "DIV") {
    if (LockStatus == true) {
      QueueObject.push(video_data[video_id])
      let p = document.createElement('p')
      let s = document.createElement('section')
      p.innerText = QueueObject[QueueObject.length - 1].title
      s.appendChild(p)
      QueueElement.appendChild(s)
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
      if (LockStatus == true && queueType === 'main') {
        QueueObject.push(video_data[video_id])
        let p = document.createElement('p')
        let s = document.createElement('section')
        p.innerText = QueueObject[QueueObject.length - 1].title
        s.appendChild(p)
        QueueElement.appendChild(s)
      }
      player.loadVideoById(video_id, 0)
      CurrentlyPlaying = video_data[video_id]
      document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = CurrentlyPlaying.title
      document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = CurrentlyPlaying.channel
      document.getElementById("Currently-Playing-Views").innerHTML = CurrentlyPlaying.views
      document.getElementById("Currently-Playing-Likes").innerHTML = CurrentlyPlaying.likes
      document.getElementById("Currently-Playing-Dislikes").innerHTML = CurrentlyPlaying.dislikes
      updateOverlay()
    } else {
      QueueObject.push(video_data[video_id])
      let p = document.createElement('p')
      let s = document.createElement('section')
      p.innerText = QueueObject[QueueObject.length - 1].title
      s.appendChild(p)
      QueueElement.appendChild(s)
    }
  }
}

// CODE FOR OVERLAY START

function updateOverlay() {
  // update the overlay data
  if (OverlayToggle == true) {

    try {
      document.getElementById("thumbnail").innerHTML = '<img src="' + CurrentlyPlaying.thumbnail + '" alt="YouTube video thumbnail">'
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
        let timer1 = (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed
        if (timer1 < 5) {
          timer1 = 5
        } else if (timer1 > 60) {
          timer1 = 60
        }
        document.getElementById("title").style.animation = "TitleScroll " + timer1 + "s linear infinite"
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
        let timer2 = (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed
        if (timer2 < 5) {
          timer2 = 5
        } else if (timer2 > 60) {
          timer2 = 60
        }
        document.getElementById("channel").style.animation = "ChannelScroll " + timer2 + "s linear infinite"
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
    document.getElementById("OverlaySettingsData").style.display = "none"
    document.getElementById("OverlaySettings").style.marginTop = "0px"
    document.getElementById("overlay").style.display = "none"
    document.getElementById("HideShowOverlaySettings").innerHTML = "Hide settings"
    document.getElementById("HideShowOverlaySettings").style.display = "none"
    OverlayToggle = false
    clearInterval(TimeUpdater)
  } else {
    document.getElementById("OverlaySettingsData").style.display = "block"
    document.getElementById("overlay").style.display = "inline-flex"
    document.getElementById("HideShowOverlaySettings").style.display = "inline-flex"
    OverlayToggle = true
    generateOverlay()
    document.getElementById("OverlaySettings").style.marginTop = document.getElementById("overlay").offsetHeight + 10 + "px"
  }
})

document.getElementById("HideShowOverlaySettings").addEventListener("click", () => {
  if (document.getElementById("OverlaySettingsData").style.display == "block") {
    document.getElementById("OverlaySettingsData").style.display = "none"
    document.getElementById("HideShowOverlaySettings").innerHTML = "Show settings"
  } else {
    document.getElementById("OverlaySettingsData").style.display = "block"
    document.getElementById("HideShowOverlaySettings").innerHTML = "Hide settings"
  }
})

document.getElementById("TitleFontSize").addEventListener("input", () => {
  document.getElementById("title").style.fontSize = document.getElementById("TitleFontSize").value + "px"
  updateOverlay()
})

document.getElementById("ChannelFontSize").addEventListener("input", () => {
  document.getElementById("channel").style.fontSize = document.getElementById("ChannelFontSize").value + "px"
  updateOverlay()
})

document.getElementById("TickerSpeed").addEventListener("input", () => {
  tickerSpeed = document.getElementById("TickerSpeed").value

  if (TitleScrollStatus == true) {
    let timer1 = (document.getElementById("title").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed
    if (timer1 < 5) {
      timer1 = 5
    } else if (timer1 > 60) {
      timer1 = 60
    }
    document.getElementById("title").style.animation = "TitleScroll " + timer1 + "s linear infinite"
  }
  if (ChannelScrollStatus == true) {
    let timer2 = (document.getElementById("channel").offsetWidth - document.getElementById("right").offsetWidth) / tickerSpeed
    if (timer2 < 5) {
      timer2 = 5
    } else if (timer2 > 60) {
      timer2 = 60
    }
    document.getElementById("channel").style.animation = "ChannelScroll " + timer2 + "s linear infinite"
  }
})

document.getElementById("OverlayWidth").addEventListener("input", () => {
  document.getElementById("overlay").style.width = document.getElementById("OverlayWidth").value + "px"
  updateOverlay()
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
  // function which is triggerd each time color changes are made for the overlay (background)

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

  let red, green, blue

  if (Number.isInteger((parseInt(document.getElementById("BGCR").value)))) {
    red = parseInt(document.getElementById("BGCR").value)
  } else {
    red = 0
  }

  if (Number.isInteger((parseInt(document.getElementById("BGCG").value)))) {
    green = parseInt(document.getElementById("BGCG").value)
  } else {
    green = 0
  }

  if (Number.isInteger(parseInt(document.getElementById("BGCB").value))) {
    blue = parseInt(document.getElementById("BGCB").value)
  } else {
    blue = 0
  }

  document.getElementById("overlay").style.background = "rgb(" + red + "," + green + "," + blue + ")"
}


document.getElementById("FTCR").addEventListener("input", textColorChanged)
document.getElementById("FTCG").addEventListener("input", textColorChanged)
document.getElementById("FTCB").addEventListener("input", textColorChanged)

function textColorChanged() {
  // function which is triggerd each time color changes are made for the overlay (font)

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

  let red, green, blue

  if (Number.isInteger((parseInt(document.getElementById("FTCR").value)))) {
    red = parseInt(document.getElementById("FTCR").value)
  } else {
    red = 0
  }

  if (Number.isInteger((parseInt(document.getElementById("FTCG").value)))) {
    green = parseInt(document.getElementById("FTCG").value)
  } else {
    green = 0
  }

  if (Number.isInteger(parseInt(document.getElementById("FTCB").value))) {
    blue = parseInt(document.getElementById("FTCB").value)
  } else {
    blue = 0
  }

  document.getElementById("title").style.color = "rgb(" + red + "," + green + "," + blue + ")"
  document.getElementById("channel").style.color = "rgb(" + red + "," + green + "," + blue + ")"
}


document.getElementById("preset1").addEventListener("click", () => {
  // preset 1 for the overlay
  document.getElementById("OverlayWidth").value = 300
  document.getElementById("overlay").style.width = document.getElementById("OverlayWidth").value + "px"

  document.getElementById("OverlayHeight").value = 75
  document.getElementById("overlay").style.height = document.getElementById("OverlayHeight").value + "px"
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight / 0.75) + "px"
  document.getElementById("OverlaySettings").style.marginTop = document.getElementById("overlay").offsetHeight + 10 + "px"

  document.getElementById("TitleFontSize").value = 18
  document.getElementById("title").style.fontSize = document.getElementById("TitleFontSize").value + "px"

  document.getElementById("ChannelFontSize").value = 15
  document.getElementById("channel").style.fontSize = document.getElementById("ChannelFontSize").value + "px"

  updateOverlay()
})

document.getElementById("preset2").addEventListener("click", () => {
  // preset 2 for the overlay
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

  updateOverlay()
})

document.getElementById("preset3").addEventListener("click", () => {
  // preset 3 for the overlay
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

  updateOverlay()
})



function generateOverlay() {
  // triggerd when the user enables overlay
  document.getElementById("time").style.background = generateRGB()
  document.getElementById("thumbnail").style.width = (document.getElementById("thumbnail").offsetHeight / 0.75) + "px"

  try {
    document.getElementById("thumbnail").innerHTML = '<img src="' + CurrentlyPlaying.thumbnail + '" alt="YouTube video thumbnail">'
  } catch (error) {
    {}
  }
  updateOverlay()
  TimeUpdater = setInterval(() => {
    try {
      document.getElementById("time").style.width = player.getCurrentTime() / player.getDuration() * 100 + "%"
    } catch (error) {
      document.getElementById("time").style.width = "0%"
    }

  }, 500);
}

// CODE FOR OVERLAY END

// CODE FOR SOCKET START

function updateSocket() {
  if (playerReady !== true) {
    return
  }
  let noChanges = true

  // check if title has changed
  if (CurrentlyPlaying.title !== socketData.title) {
    socketData.title = CurrentlyPlaying.title
    noChanges = false
  }
  
  let temp = player.getCurrentTime()
  if (isFinite(temp) === false) {
    temp = 0
  }
  if (temp !== socketData.currentTime) {
    socketData.currentTime = temp
    noChanges = false
  }
  
  temp = player.getDuration()
  if (isFinite(temp) === false) {
    temp = 0
  }
  if (temp !== socketData.totalTime) {
    socketData.totalTime = temp
    noChanges = false
  }
  
  temp = player.getPlayerState() === YT.PlayerState.PAUSED
  if (temp !== socketData.paused) {
    socketData.paused = temp
    noChanges = false
  }
  
  // check if channel has changed
  if (CurrentlyPlaying.channel !== socketData.channel) {
    socketData.channel = CurrentlyPlaying.channel
    noChanges = false
  }

  if (CurrentlyPlaying.id !== socketData.videoId){
      socketData.videoId = CurrentlyPlaying.id
      noChanges = false
  }

  // if changes has been done, forward the data to socket connection
  if (noChanges === false) {
      socketConnection.emit('ScriptTalk', {
          event: 'p-Yazaar_YouTube_Analyzer:Changes',
          data: socketData
      })
  }
}

document.getElementById('SocketButton').addEventListener('click', () => {
  if(socketConnecting === false) {
    let host = document.getElementById('SocketHost').value
    let port = parseInt(document.getElementById('SocketPort').value)
    if (host === '' || isNaN(port)) {
      return
    }
    
    socketConnecting = true
    document.getElementById('SocketClickToCloseTip').style.display = 'block'
    document.getElementById('SocketButton').innerText = 'Connecting'

    socketConnection = io('http://' + host + ':' + port, {transports: ['websocket']})
    socketConnection.on('connect', function(){
      document.getElementById('SocketButton').innerText = 'Connected'
      if (socketLoop === false) {
        socketLoop = setInterval(updateSocket, 1000)
      }
    })

    socketConnection.on('connect_error', function(){
      document.getElementById('SocketButton').innerText = 'Host unreachable'
    })
    
    socketConnection.on('reconnect', function(e){
      document.getElementById('SocketButton').innerText = 'Connected'
    })

    socketConnection.on('disconnect', function(){
    })

    socketConnection.on('reconnect_attempt', () => {
        socketConnection.io.opts.transports = ['polling', 'websocket']
    })

    socketConnection.on('error', function(e){
        console.log(e)
    })
  } else {
    clearInterval(socketLoop)
    socketLoop = false
    socketConnection.close()
    socketConnecting = false
    document.getElementById('SocketClickToCloseTip').style.display = ''
    document.getElementById('SocketButton').innerText = 'Connect'
  }
})

document.getElementById("ToggleSocket").addEventListener("click", () => {
  if (SocketToggle == true) {
    SocketToggle = false
    document.getElementById("SocketSettingsData").style.display = "none"
    document.getElementById("HideShowSocketSettings").style.display = "none"
    document.getElementById("HideShowSocketSettings").innerHTML = "Hide settings"
  } else {
    SocketToggle = true
    document.getElementById("SocketSettingsData").style.display = "block"
    document.getElementById("HideShowSocketSettings").style.display = "inline-flex"
  }
})

document.getElementById("HideShowSocketSettings").addEventListener("click", () => {
  if (document.getElementById("SocketSettingsData").style.display == "block") {
    document.getElementById("SocketSettingsData").style.display = "none"
    document.getElementById("HideShowSocketSettings").innerHTML = "Show settings"
  } else {
    document.getElementById("SocketSettingsData").style.display = "block"
    document.getElementById("HideShowSocketSettings").innerHTML = "Hide settings"
  }
})
// CODE FOR SOCKET END

// CODE FOR MusicLink START

function updateMusicLink() {
  if (playerReady !== true) {
    return
  }
  let noChanges = true

  // check if title has changed
  if (CurrentlyPlaying.title !== musicLinkData.title) {
    musicLinkData.title = CurrentlyPlaying.title
    noChanges = false
  }
  
  let temp = player.getCurrentTime()
  if (isFinite(temp) === false) {
    temp = 0
  }
  if (temp !== musicLinkData.currentTime) {
    musicLinkData.currentTime = temp
    noChanges = false
  }
  
  temp = player.getDuration()
  if (isFinite(temp) === false) {
    temp = 0
  }
  if (temp !== musicLinkData.totalTime) {
    musicLinkData.totalTime = temp
    noChanges = false
  }
  
  // check if channel has changed
  if (CurrentlyPlaying.channel !== musicLinkData.author) {
    musicLinkData.author = CurrentlyPlaying.channel
    noChanges = false
  }

  if (CurrentlyPlaying.id !== musicLinkData.YTthumbnail){
      musicLinkData.YTthumbnail = CurrentlyPlaying.id
      noChanges = false
  }

  // if changes has been done, forward the data to socket connection
  if (noChanges === false) {
      musicLink.emit('overlayUpdate', musicLinkData)
  }
}

document.getElementById('MusicLinkButton').addEventListener('click', () => {
  if(musicLinkConnecting === false) {
    
    if (musicLinkLatestValid === '') {
      return
    }

    musicLinkData.roomId = musicLinkLatestValid
    
    musicLinkConnecting = true
    document.getElementById('MusicLinkClickToCloseTip').style.display = 'block'
    document.getElementById('MusicLinkButton').innerText = 'Connecting'

    musicLink = io('https://yazaar.herokuapp.com', {transports: ['websocket']})
    musicLink.on('connect', function(){
      document.getElementById('MusicLinkButton').innerText = 'Connected'
      if (musicLinkLoop === false) {
        musicLinkLoop = setInterval(updateMusicLink, 1000)
      }
    })

    musicLink.on('connect_error', function(){
      document.getElementById('SocketButton').innerText = 'Host unreachable'
    })
    
    musicLink.on('reconnect', function(e){
      document.getElementById('SocketButton').innerText = 'Connected'
    })

    musicLink.on('disconnect', function(){
    })

    musicLink.on('reconnect_attempt', () => {
        musicLink.io.opts.transports = ['polling', 'websocket']
    })

    musicLink.on('error', function(e){
        console.log(e)
    })
  } else {
    clearInterval(musicLinkLoop)
    musicLinkLoop = false
    musicLink.close()
    musicLinkConnecting = false
    document.getElementById('MusicLinkClickToCloseTip').style.display = ''
    document.getElementById('MusicLinkButton').innerText = 'Connect'
  }
})

document.getElementById("ToggleMusicLink").addEventListener("click", () => {
  if (musicLinkToggle == true) {
    musicLinkToggle = false
    document.getElementById("MusicLinkSettingsData").style.display = "none"
    document.getElementById("HideShowMusicLinkSettings").style.display = "none"
    document.getElementById("HideShowMusicLinkSettings").innerHTML = "Hide settings"
  } else {
    musicLinkToggle = true
    document.getElementById("MusicLinkSettingsData").style.display = "block"
    document.getElementById("HideShowMusicLinkSettings").style.display = "inline-flex"
  }
})

document.getElementById("HideShowMusicLinkSettings").addEventListener("click", () => {
  if (document.getElementById("MusicLinkSettingsData").style.display == "block") {
    document.getElementById("MusicLinkSettingsData").style.display = "none"
    document.getElementById("HideShowMusicLinkSettings").innerHTML = "Show settings"
  } else {
    document.getElementById("MusicLinkSettingsData").style.display = "block"
    document.getElementById("HideShowMusicLinkSettings").innerHTML = "Hide settings"
  }
})

document.getElementById('MusicLinkRoomId').addEventListener('input', function() {
  let newValue = this.value
  if (/^[a-zA-Z0-9]*$/.test(newValue)) {
      musicLinkLatestValid = newValue
      let musicLinkLink = document.querySelector('#MusicLinkLink a')
      if (newValue === '') {
        document.getElementById('MusicLinkLink').style.display = 'none';
      } else {
        document.getElementById('MusicLinkLink').style.display = '';
        musicLinkLink.innerText = 'https://yazaar.herokuapp.com/MusicLink/overlay/' + newValue
        musicLinkLink.href = 'https://yazaar.herokuapp.com/MusicLink/overlay/' + newValue
       }
    } else {
      this.value = musicLinkLatestValid
  }
})

// CODE FOR MusicLink END

// CODE FOR SONGREQUEST START

document.getElementById("SRQueue").addEventListener("click", (e) => {
  if (e.target.nodeName == "P") {
    let QueueItems = []
    document.getElementById("SRQueue").querySelectorAll("p").forEach((element) => {
      QueueItems.push(element)
    })
    let TargetIndex = QueueItems.indexOf(e.target)
    let innerHTML = document.getElementById("QueueClick").innerHTML.toLowerCase()

    if (innerHTML == "remove") {
      SongrequestQueue.splice(TargetIndex, 1)

      updateQueue("songrequest")

    } else if (innerHTML == "play now") {

      CurrentlyPlaying = SongrequestQueue[TargetIndex]
      document.getElementById("Currently-Playing-Title").querySelector("p").innerHTML = CurrentlyPlaying.title
      document.getElementById("Currently-Playing-Channel").querySelector("p").innerHTML = CurrentlyPlaying.channel
      document.getElementById("Currently-Playing-Views").innerHTML = CurrentlyPlaying.views
      document.getElementById("Currently-Playing-Likes").innerHTML = CurrentlyPlaying.likes
      document.getElementById("Currently-Playing-Dislikes").innerHTML = CurrentlyPlaying.dislikes
      updateOverlay()

      player.loadVideoById(SongrequestQueue[TargetIndex].id, 0)

      SongrequestQueue.splice(TargetIndex, 1)

      updateQueue("songrequest")

    } else if (innerHTML == "move up") {

      let temp = SongrequestQueue[TargetIndex]

      if (TargetIndex == 0) {
        SongrequestQueue.push(SongrequestQueue[0])
        SongrequestQueue.splice(0, 1)
      } else {
        SongrequestQueue[TargetIndex] = SongrequestQueue[TargetIndex - 1]
        SongrequestQueue[TargetIndex - 1] = temp
      }

      updateQueue("songrequest")

    } else if (innerHTML == "move down") {

      let temp = SongrequestQueue[TargetIndex]

      if (TargetIndex == SongrequestQueue.length - 1) {
        SongrequestQueue.unshift(SongrequestQueue[SongrequestQueue.length - 1])
        SongrequestQueue.splice(SongrequestQueue.length - 1, 1)
      } else {
        SongrequestQueue[TargetIndex] = SongrequestQueue[TargetIndex + 1]
        SongrequestQueue[TargetIndex + 1] = temp
      }

      updateQueue("songrequest")
    } else if (innerHTML == "swap queue") {

      queue.push(SongrequestQueue[TargetIndex])
      SongrequestQueue.splice(TargetIndex, 1)

      updateQueue("main")
      updateQueue("songrequest")
    }

  }
})

document.getElementById("SRSplitQueue").addEventListener('change', function(){
  if (this.checked === true){
    document.getElementById('SRQueue').style.display = 'block'
  } else {
    document.getElementById('SRQueue').style.display = 'none'
  }
})

document.getElementById("ToggleSongrequest").addEventListener("click", () => {
  if (SongrequestToggle == true) {
    SongrequestToggle = false
    document.getElementById("SongrequestSettingsData").style.display = "none"
    document.getElementById("HideShowSongrequestSettings").style.display = "none"
    document.getElementById("HideShowSongrequestSettings").innerHTML = "Hide settings"
  } else {
    SongrequestToggle = true
    document.getElementById("SongrequestSettingsData").style.display = "block"
    document.getElementById("HideShowSongrequestSettings").style.display = "inline-flex"
  }
})

document.getElementById("HideShowSongrequestSettings").addEventListener("click", () => {
  if (document.getElementById("SongrequestSettingsData").style.display == "block") {
    document.getElementById("SongrequestSettingsData").style.display = "none"
    document.getElementById("HideShowSongrequestSettings").innerHTML = "Show settings"
  } else {
    document.getElementById("SongrequestSettingsData").style.display = "block"
    document.getElementById("HideShowSongrequestSettings").innerHTML = "Hide settings"
  }
})

document.getElementById("SRCommand").addEventListener("input", (e) => {
  twitch_command = e.target.value.toLowerCase()
})

document.getElementById("SRRequestLimit").addEventListener("input", (e) => {
  if (e.target.value < 0) {
    document.getElementById("SRRequestLimit").value = 0
    requestLimit = 0
  } else {
    requestLimit = parseInt(e.target.value)
  }
})

document.getElementById("SRConnect").addEventListener("click", () => {
  if (document.getElementById("SRConnect").innerHTML == "DISCONNECT") {
    leaveChannel(twitch_channel)
    document.getElementById("SRConnect").innerHTML = "CONNECT"
    document.getElementById("SRChannelSection").style.display = "block"
    return
  }

  if (twitch_socket !== undefined) {
    twitch_channel = document.getElementById("SRChannel").value.toLowerCase()

    if (twitch_channel == "") {
      alert("Songrequest error: TMI, username or channel is empty")
      return
    }
    joinChannel(twitch_channel)
    document.getElementById("SRConnect").innerHTML = "DISCONNECT"
    document.getElementById("SRChannelSection").style.display = "none"
    return
  }

  twitch_tmi = document.getElementById("SRTMI").value.toLowerCase()
  twitch_username = document.getElementById("SRUsername").value.toLowerCase()
  twitch_channel = document.getElementById("SRChannel").value.toLowerCase()

  if (twitch_tmi == "" || twitch_username == "" || twitch_channel == "") {
    alert("Songrequest error: TMI, username or channel is empty")
    return
  }

  if (window.location.protocol == "https:") {
    twitch_socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443")
  } else {
    twitch_socket = new WebSocket("ws://irc-ws.chat.twitch.tv:80")
  }

  twitch_socket.onopen = function () {
    twitch_socket.send("PASS " + twitch_tmi + "\r\n")
    twitch_socket.send("NICK " + twitch_username + "\r\n")
    joinChannel(twitch_channel)
    twitch_socket.send("CAP REQ :twitch.tv/tags\r\n")
    console.log("Connected to the channel " + twitch_channel)
    document.getElementById("SRConnect").innerHTML = "DISCONNECT"
    document.getElementById("SRTMISection").style.display = "none"
    document.getElementById("SRUsernameSection").style.display = "none"
    document.getElementById("SRChannelSection").style.display = "none"
    document.getElementById("SRReset").style.display = "inline-block"
  }

  twitch_socket.onerror = function (error) {
    alert("Songrequest error: " + error)
  }

  twitch_socket.onmessage = function (message) {
    if (message.data == ":tmi.twitch.tv NOTICE * :Login authentication failed\r\n" || message.data == ":tmi.twitch.tv NOTICE * :Improperly formatted auth\r\n") {
      document.getElementById("SRReset").click()
      alert("Invalid TMI")
      return

    } else if (message.data === "PING :tmi.twitch.tv\r\n") {
      twitch_socket.send("PONG :tmi.twitch.tv\r\n")
      return

    } else if (message.data.match(/PRIVMSG #[^ ]+ :/)) {
      if (twitch_loading === true) {
        twitch_queue.push(message)
      } else {
        twitch_loading = true
        handleMessage(message)
      }
    }
  }

  twitch_socket.onclose = function () {
    document.getElementById("SRTMISection").style.display = "block"
    document.getElementById("SRUsernameSection").style.display = "block"
    document.getElementById("SRChannelSection").style.display = "block"
    document.getElementById("SRConnect").innerHTML = "CONNECT"
    twitch_socket = undefined
    document.getElementById("SRReset").style.display = "none"
  }
})

function handleMessage(message) {
  // handle twitch socket message
  let params = getMessage(message.data).split(" ")
  if (params[0].toLowerCase() != twitch_command.toLowerCase()) {
    if (twitch_queue.length > 0) {
      handleMessage(twitch_queue[0])
      twitch_queue.shift()
    } else {
      twitch_loading = false
    }
    return
  }
  console.log(getUser(message.data) + ": " + getMessage(message.data))
  if (params[1] === undefined) {
    sendMessage("The docs for the player can be found here: " + window.location.origin + window.location.pathname.replace("index.html", "") + "pages/guide.html")
    endTwitchLoad()
    return
  }
  if (params[1].toLowerCase() == "request" && params[2] !== undefined) {
    if (params[2].match(/v=[^&]+/) !== null) { // check if parameter 2 is a video URL or not
      params[2] = params[2].match(/v=([^&]+)/)[1] // matched as an URL, extracting video id as parameter 2
    }
    processRequest({
      "user": getUser(message.data),
      "id": params[2],
      "modStatus": isMod(message.data)
    })
    endTwitchLoad()
    return
  }
  if (params[1].toLowerCase() == "help" || params[1].toLowerCase() == "docs" || params[1].toLowerCase() == "documentation" || params[1].toLowerCase() == "guide") {
    sendMessage("The docs for the player can be found here: " + window.location.origin + window.location.pathname.replace("index.html", "") + "pages/guide.html")
    endTwitchLoad()
    return
  }
  if (params[1].toLowerCase() == "commands") {
    sendMessage("All commands can be found here: " + window.location.origin + window.location.pathname.replace("index.html", "") + "pages/guide.html#Songrequest-Commands")
    endTwitchLoad()
    return
  }
  if (player === undefined) {
    sendMessage("Player has not been initialized. Please start a video. Docs can be found here: " + window.location.origin + window.location.pathname.replace("index.html", "") + "pages/guide.html")
    endTwitchLoad()
    return
  }
  if (params[1].toLowerCase() == "wrong") {
    handleWrongRequest(message)
    endTwitchLoad()
    return
  }
  if (params[1].toLowerCase() == "current") {
    if (CurrentlyPlaying !== undefined) {
      if (CurrentlyPlaying.requestedBy === undefined) {
        sendMessage(CurrentlyPlaying.title + " by " + CurrentlyPlaying.channel)
      } else {
        sendMessage(CurrentlyPlaying.title + " by " + CurrentlyPlaying.channel + ". Requested by: " + CurrentlyPlaying.requestedBy)
      }
    }
    endTwitchLoad()
    return
  }
  if (params[1].toLowerCase() == "skip" && isMod(message.data)) {
    document.getElementById("skip").click()
    sendMessage("Skipped!")
    endTwitchLoad()
    return
  }
  if (params[1].toLowerCase() == "volume" && isMod(message.data) && Number.isInteger(parseInt(params[2]))) {

    if (parseInt(params[2]) > 100) {
      params[2] = 100
    } else if (parseInt(params[2]) < 0) {
      params[2] = 0
    } else {
      params[2] = parseInt(params[2])
    }
    player.setVolume(params[2])
    sendMessage("The volume has been set to " + params[2] + "%")
    endTwitchLoad()
    return
  }
  if (params[1].toLowerCase() == "queue") {
    sendMessage("Current queue: " + getQueueURL())
    endTwitchLoad()
    return
  }
  if (params[1].toLowerCase() == "volume") {
    sendMessage("YouTube volume: " + player.getVolume() + "%")
    endTwitchLoad()
    return
  }
  if (params[1].toLowerCase() == "pause" && isMod(message.data)) {
    player.pauseVideo()
    sendMessage("YouTube is now paused!")
    endTwitchLoad()
    return
  }
  if (params[1].toLowerCase() == "play" && isMod(message.data)) {
    player.playVideo()
    sendMessage("YouTube is now playing!")
    endTwitchLoad()
    return
  }
  sendMessage("Commands can be found here: " + window.location.origin + window.location.pathname.replace("index.html", "") + "pages/guide.html#Songrequest-Commands")
  endTwitchLoad()
  return
}

document.getElementById("SRTMI").addEventListener("input", (e) => {
  if (e.target.value.length == 0) {
    document.getElementById("SRTMI").style.background = ""
    return
  }


  if (/^oauth:/.test(e.target.value)) {
    document.getElementById("SRTMI").style.background = ""
    return
  } else {
    document.getElementById("SRTMI").style.background = "#ff6666"
    return
  }
})

document.getElementById("SRReset").addEventListener("click", () => {
  twitch_socket.close()
})

function sendMessage(message) {
  // send a new message to the current chat which is connected
  twitch_socket.send("PRIVMSG #" + twitch_channel + " :" + message + "\r\n")
  return true
}

function getMessage(line) {
  // get the message which the user sent
  return line.split(/PRIVMSG #[^;]+ :/)[1].slice(0, -2)
}

function getChannel(line) {
  // get the channel which the message was sent in
  return line.match(/PRIVMSG #([^ ]+)/)[1]
}

function getUser(line) {
  // get the username of the user who sent the message
  return line.match(/;display-name=([^;]+)/)[1]
}

function isMod(line) {
  // check if the user which sent the message is a mod (or caster)
  if (/;mod=1;/.test(line) || isCaster(line)) {
    return true
  } else {
    return false
  }
}

function isCaster(line) {
  // check if the user which sent the message is the caster
  if (line.match(/badges=([^;]+)/) === null) {
    return false
  }

  if (/broadcaster/.test(line.match(/badges=([^;]+)/)[1]) === true) {
    return true
  } else {
    return false
  }
}

function joinChannel(channel) {
  // join twitch chat
  twitch_socket.send("JOIN #" + channel + "\r\n")
}

function leaveChannel(channel) {
  // leave twitch chat
  twitch_socket.send("PART #" + channel + "\r\n")
}

function handleWrongRequest(message) {
  let user = getUser(message.data).toLowerCase()
  for (let value in queue) {
    if (queue[queue.length - 1 - value].requestedBy.toLowerCase() == user) {
      sendMessage("Removed " + queue[queue.length - 1 - value].title)
      queue.splice(queue.length - 1 - value, 1)
      break
    }
  }
  updateQueue("main")
}

function requestPathway(requestUser, requestId, isMod) {
  // check for video duplicates and user requestlimit
  let requestCount = 0
  if (CurrentlyPlaying !== undefined) {
    if (CurrentlyPlaying.id === requestId) {
      sendMessage("The videoid " + requestId + " is already in queue " + requestUser)
      return true
    }
    if (CurrentlyPlaying.requestedBy !== undefined && CurrentlyPlaying.requestedBy.toLowerCase() === requestUser.toLowerCase()) {
      requestCount += 1
    }
  }
  for (let queueEntity of queue) {
    if (queueEntity.id == requestId) {
      sendMessage("The videoid " + requestId + " is already in queue " + requestUser)
      return true
    }
    if (queueEntity.requestedBy !== undefined && queueEntity.requestedBy.toLowerCase() === requestUser.toLowerCase()) {
      requestCount += 1
    }
  }
  if (requestCount >= requestLimit && isMod === false) {
    sendMessage("Too many songrequests from the user " + requestUser + ", please wait for 1 to play")
    return true
  }
  return false
}

function getQueueURL() {
  // generate a queue URL to requests.html
  let queueURL = window.location.origin + window.location.pathname.replace("index.html", "") + "pages/requests.html?v="
  if (CurrentlyPlaying.requestedBy !== undefined) {
    queueURL += CurrentlyPlaying.id + "%" + CurrentlyPlaying.requestedBy
  } else {
    queueURL += CurrentlyPlaying.id
  }
  for (i of queue) {
    if (i.requestedBy !== undefined) {
      queueURL += "&v=" + i.id + "%" + i.requestedBy
    } else {
      queueURL += "&v=" + i.id
    }
  }
  return queueURL
}

function processRequest(jsonData) {
  // New valid command, checking for all command instances
  let username = jsonData.user
  let requestId = jsonData.id
  let isMod = jsonData.modStatus
  if (requestPathway(username, requestId, isMod) === true) {
    endTwitchLoad()
    return
  }

  // Check if videoid is valid
  if (video_data[requestId] !== undefined){
    if (document.getElementById("SRSplitQueue").checked === true){
      AddVideo(requestId, 'songrequest')
    } else {
      AddVideo(requestId, 'main')
    }
    sendMessage("Added " + video_data[requestId].title)
    return
  }

  let requestedVideo = new XMLHttpRequest()
  requestedVideo.onreadystatechange = function () {
    if (requestedVideo.readyState == 4) {
      if (JSON.parse(requestedVideo.response).error == "404 Not Found") {
        sendMessage(username + " the video is invalid!")
        endTwitchLoad()
        return
      }

      // Real API Call for video data
      let requestedVideoData = new XMLHttpRequest()
      requestedVideoData.onreadystatechange = function () {
        if (requestedVideoData.readyState == 4) {
          let processedData
          if (JSON.parse(requestedVideoData.response).items === undefined || JSON.parse(requestedVideoData.response).items.length == 0) {
            processedData = JSON.parse(requestedVideo.response)
            processedData = {
              "channel": processedData.author_name,
              "title": processedData.title,
              "thumbnail": processedData.thumbnail_url,
              "duration": 0,
              "id": processedData.url.split("v=")[1],
              "views": 0,
              "likes": 0,
              "dislikes": 0,
              "requestedBy": username
            }
            video_data[processedData.id] = processedData
          } else {
            processedData = JSON.parse(requestedVideoData.response)
            processedData = {
              "channel": processedData.items[0].snippet.channelTitle,
              "title": processedData.items[0].snippet.title,
              "thumbnail": processedData.items[0].snippet.thumbnails.default.url,
              "duration": convertTime(processedData.items[0].contentDetails.duration),
              "id": processedData.items[0].id,
              "views": convertNumber(processedData.items[0].statistics.viewCount),
              "likes": convertNumber(processedData.items[0].statistics.likeCount),
              "dislikes": convertNumber(processedData.items[0].statistics.dislikeCount),
              "requestedBy": username
            }
            video_data[processedData.id] = processedData
          }
          if (document.getElementById("SRSplitQueue").checked === true){
            AddVideo(requestId, 'songrequest')
          } else {
            AddVideo(requestId, 'main')
          }
          sendMessage("Added " + processedData.title)
        }
      }
      requestedVideoData.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=" + requestId + "&key=" + key, true)
      requestedVideoData.send()
    }
  }
  requestedVideo.open("get", "https://noembed.com/embed?url=https://www.youtube.com/watch?v=" + requestId, true)
  requestedVideo.send()
}

function endTwitchLoad() {
  // wait for an x amount of milliseconds before handling next message (limit twitch_sockets postrate)
  setTimeout(() => {
    if (twitch_queue.length > 0) {
      handleMessage(twitch_queue[0])
      twitch_queue.shift()
    } else {
      twitch_loading = false
    }
  }, 2000);
}

// CODE FOR SONGREQUEST END

function generateRGB() {
  // generate a RGB color with specific ruleset.
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

function newRequestFromIDs(xml) {
  // generate video search feed (remove old data)
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
        "views": convertNumber(video.statistics.viewCount),
        "likes": convertNumber(video.statistics.likeCount),
        "dislikes": convertNumber(video.statistics.dislikeCount)
      }
      InnerHTMLData += '<section onclick="AddVideo(this)" data-videoid="' + video_data[video.id].id + '">' + '<img src="' + video_data[video.id].thumbnail + '">' + "<span>" + "<h1>" + video_data[video.id].title + "</h1>" + '<p class="VideoItem"><i class="fas fa-clock"></i>' + video_data[video.id].duration + "</p>" + '<p class="VideoItem"><i class="fas fa-eye"></i>' + video_data[video.id].views + "</p>" + '<p class="VideoItem"><i class="fas fa-thumbs-up"></i>' + video_data[video.id].likes + "</p>" + '<p class="VideoItem"><i class="fas fa-thumbs-down"></i>' + video_data[video.id].dislikes + "</p>" + "<p>" + video_data[video.id].channel + "</p>" + "</span>" + "</section>"
    }
    document.getElementById("SearchResults").innerHTML = InnerHTMLData
    if (morePages === false) {
      let noMorePagesElement = document.createElement('h1')
      noMorePagesElement.innerText = 'Finished loading'
      document.getElementById('SearchResults').appendChild(noMorePagesElement)
    }
    loading = false
  }
}

function requestFromIDs(xml) {
  // generate video search feed (append old data)
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
        "views": convertNumber(video.statistics.viewCount),
        "likes": convertNumber(video.statistics.likeCount),
        "dislikes": convertNumber(video.statistics.dislikeCount)
      }
      InnerHTMLData += '<section onclick="AddVideo(this)" data-videoid="' + video_data[video.id].id + '">' + '<img src="' + video_data[video.id].thumbnail + '">' + "<span>" + "<h1>" + video_data[video.id].title + "</h1>" + '<p class="VideoItem"><i class="fas fa-clock"></i>' + video_data[video.id].duration + "</p>" + '<p class="VideoItem"><i class="fas fa-eye"></i>' + video_data[video.id].views + "</p>" + '<p class="VideoItem"><i class="fas fa-thumbs-up"></i>' + video_data[video.id].likes + "</p>" + '<p class="VideoItem"><i class="fas fa-thumbs-down"></i>' + video_data[video.id].dislikes + "</p>" + "<p>" + video_data[video.id].channel + "</p>" + "</span>" + "</section>"
    }
    document.getElementById("SearchResults").innerHTML += InnerHTMLData
    if (morePages === false) {
      let noMorePagesElement = document.createElement('h1')
      noMorePagesElement.innerText = 'Finished loading'
      document.getElementById('SearchResults').appendChild(noMorePagesElement)
    }
    loading = false
  }
}

function convertTime(raw_timestamp) {
  // convert time format which comes from the YouTube API
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

function convertNumber(raw_number) {
  // convert number to a clear format (1000000 >> 1,000,000)
  try {
    raw_number.toString()
  } catch (e) {
    return raw_number
  }
  let number = raw_number.toString()
  let numDiff = 0
  for (let numLoop in raw_number.toString()) {
    if (numLoop % 3 == 0 && numLoop != 0) {
      number = replaceAt(number, number.length - numLoop - numDiff, "," + number[number.length - numLoop - numDiff])
      numDiff += 1
    }
  }
  return number
}

function replaceAt(string, index, value) {
  // replace index with a new value
  return string.substring(0, index) + value + string.substring(index + 1)
}

function updateQueue(queueType) {
  if (queueType === 'main'){
    let QueueElement = document.getElementById('queue')
    QueueElement.innerHTML = '<h1>Queue:</h1>'
  
    for (let i = 0; i < queue.length; i++) {
      let s = document.createElement('section')
      let p = document.createElement('p')
      p.innerText = queue[i].title
      s.appendChild(p)
      QueueElement.appendChild(s)
    }
  } else {
    let QueueElement = document.getElementById('SRQueue')
    QueueElement.innerHTML = '<h1>SR Queue:</h1>'
  
    for (let i = 0; i < SongrequestQueue.length; i++) {
      let s = document.createElement('section')
      let p = document.createElement('p')
      p.innerText = SongrequestQueue[i].title
      s.appendChild(p)
      QueueElement.appendChild(s)
    }

  }

}

function onLaunch() {
  let params = new URLSearchParams(window.location.search)
  if (params.get('LockQueue') !== null) {
    document.getElementById('lock').click()
  }
  let searchValue = params.get('search')
  if (searchValue !== null) {
    document.getElementById('SearchInput').value = searchValue
    SearchInputChange(searchValue)
  }
  let UserNotes = window.localStorage.getItem('UserNotes')
  if (UserNotes !== null) {
    document.getElementById('UserNotes').value = UserNotes
  }
}

onLaunch()