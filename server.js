const LOBBY_ID = "main";

const UPDATE_INTERVAL = 500

var PlayerElements = {}

window.addEventListener('load', function () {

    SetCurrentLobby(LOBBY_ID);
    
    UpdateGame();
    setInterval(UpdateGame, UPDATE_INTERVAL, 0);
})


function CreatePlayer()
{
    const username = document.getElementById("username_input").value;

    PlayerJoin(username, LOBBY_ID).then(result => {
        if(result.value == false)
        {
            alert(result.message);
            return;
        }

        PlayerElements[username] = CreatePlayerElement(result.player);
        PlayerElements[username].className = "player current_player";
    })
}

/**
 * Removes all graphics and everything for the game. Call after leaving.
 */
function ClearGame()
{
    document.getElementById("player_display").innerText = "";

    //Remove all player elements.
    while(Object.keys(PlayerElements).length > 0)
    {
        Object.values(PlayerElements)[0].remove();
        delete PlayerElements[Object.keys(PlayerElements)[0]];
    }
}

function UpdateGame()
{
    //If no player, don't show anything.
    if(GetCurrentPlayer() == null){ClearGame(); return;}

    //Handle packets.
    PacketUpdate().then(packets => {
        var playerList = []

        for(var i = 0; i < packets.length; i++)
        {
            const packet = packets[i];
            //console.log(packet)

            if(packet.Packet.Type == PACKET_TYPES.PLAYER_UPDATE)
            {
                playerList.push(packet.Player.GetUsername());
            }

            HandlePacket(packet)
        }

        document.getElementById("player_display").innerText = playerList.join(", ");
        
        //Find if any players have left and remove their display elements.
        for(var i = 0; i < Object.keys(PlayerElements).length; i++)
        {
            const username = Object.keys(PlayerElements)[i];
            //Don't remove the current player.
            if(GetCurrentPlayer() != null && username == GetCurrentPlayer().GetUsername()){continue;}

            if(!playerList.includes(username))
            {
                Object.values(PlayerElements)[i].remove();
                delete PlayerElements[username];
                i--;
            }
        }

        if(GetCurrentPlayer() != null){ AfterServerUpdate(); }
    })
}

function HandlePacket(packetEvent)
{
    if(!(packetEvent instanceof PacketEvent)){return;}

    if(packetEvent.Packet.Type == PACKET_TYPES.PLAYER_UPDATE)
    {
        var playerElement = PlayerElements[packetEvent.Player.GetUsername()];

        if(playerElement == undefined || playerElement == null)
        {
            playerElement = CreatePlayerElement(packetEvent.Player);
            PlayerElements[packetEvent.Player.GetUsername()] = playerElement;
        }

       UpdatePlayerElement(packetEvent.Player, playerElement);

       return;
    }

    if(packetEvent.Packet.Type == PACKET_TYPES.PLAYER_COLOR_FLASH)
    {
        var playerElement = PlayerElements[packetEvent.Player.GetUsername()];
        if(playerElement == undefined || playerElement == null){ return; }
        playerElement.style.backgroundColor = packetEvent.Packet.Values[0];
    }
}

/**
 * Creates a new player element for the given player.
 * @param {Player} player 
 * @returns {Element}
 */
function CreatePlayerElement(player)
{
    var playerElement = document.createElement("div");
    playerElement.className = "player";

    const usernameDisplay = document.createElement("p");
    usernameDisplay.style.color = player.Color;
    usernameDisplay.textContent = player.GetUsername();
    playerElement.appendChild(usernameDisplay);

    //Set the player color.
    playerElement.style.backgroundColor = player.Color;

    document.body.appendChild(playerElement);

    return playerElement;
}

/**
 * Updates the specified player element to match the parameters of the specificed player.
 * @param {Player} player 
 * @param {Element} playerElement 
 * @returns 
 */
function UpdatePlayerElement(player, playerElement)
{
    if(playerElement == null || playerElement == undefined){return;} 
    if(player == null || player == undefined){return;} 
    if(!(playerElement instanceof Element)){return;}
    if(!(player instanceof Player)){return;}

    playerElement.style.bottom = player.Position.y + "px";
    playerElement.style.left = player.Position.x + "px";
}



//Page close.
window.addEventListener('beforeunload', function () {
    if(CurrentlyEditing.Component != null)
    {
        PlayerLeave();
    }

})

//Page reload.
window.addEventListener('pageshow', function (e) {
    if(e.persisted)
    {
        PlayerLeave();
    }
})