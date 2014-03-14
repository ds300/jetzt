function save_options() {
    localStorage["jetzt_font"] =
            document.getElementById("font").value;
            
    localStorage["jetzt_wpm"] =
            document.getElementById("wpm").value;

    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
        status.innerHTML = "";
    }, 750);
}


function restore_options() {
    if localStorage["jetzt_font"] {
        document.getElementById("font").value = font;
    }
    if localStorage["jetzt_wpm"] {
        document.getElementById("wpm").value = wpm;
    }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
