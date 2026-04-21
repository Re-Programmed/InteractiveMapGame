var _input_KeysPressed = {}

function GetKeyDown(keyCode)
{
    const val = _input_KeysPressed[keyCode];
    if(val == undefined){ return false; }
    return val;
}

function GetKeyPressed(keyCode)
{
    
}

window.addEventListener('keydown', function (e) {
    _input_KeysPressed[e.code] = true;
})

window.addEventListener('keyup', function (e) {
    _input_KeysPressed[e.code] = false;
})