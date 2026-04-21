function UpdateClient()
{
    const player = GetCurrentPlayer();
    if(player == null){return;}
    const playerElement = PlayerElements[player.GetUsername()];

    HandlePlayerMotion(player, playerElement);

    //Update the element to show the player's info.
    UpdatePlayerElement(player, playerElement);
}

window.addEventListener('load', function () {
    setInterval(UpdateClient, 5);
})

/**
 * Called after the server finishes updating.
 */
function AfterServerUpdate()
{
    UpdateCurrentPlayer();
}

var keyBHeld = false;

function HandlePlayerMotion(player, playerElement)
{
    if(GetKeyDown("KeyD"))
    {
        player.Translate(1, 0);
    }

    if(GetKeyDown("KeyA"))
    {
        player.Translate(-1, 0);
    }

    if(GetKeyDown("KeyW"))
    {
        player.Translate(0, 1);
    }

    if(GetKeyDown("KeyS"))
    {
        player.Translate(0, -1);
    }

    if(GetKeyDown("KeyB"))
    {
        if(!keyBHeld)
        {
            CreatePacket(new Packet(PACKET_TYPES.PLAYER_COLOR_FLASH, ["#00FF00"]));
            keyBHeld = true;
        }

    }else{
        keyBHeld = false;
    }
}