window.addEventListener("resize", (e)=>{
    if(window.innerHeight < document.querySelector("aside article").offsetHeight){
        document.querySelector("aside article").style.position = "initial"
    } else {
        document.querySelector("aside article").style.position = ""
    }
})