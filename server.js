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

var ServerDeltaTime = 0;
var _currentServerTime = 0;

//Used to ensure that packets are not handled more than one time.
var PreviouslyHandledPacketTimes = []
function UpdateGame()
{
    const now = Date.now().valueOf();
    ServerDeltaTime = now - _currentServerTime;
    _currentServerTime = now;

    //If no player, don't show anything.
    if(GetCurrentPlayer() == null){ClearGame(); return;}

    //Handle packets.
    PacketUpdate().then(packets => {
        var playerList = []

        for(var i = 0; i < packets.length; i++)
        {
            const packetEvent = packets[i];
            //console.log(packet)

            if(packetEvent.Packet.Type == PACKET_TYPES.PLAYER_UPDATE)
            {
                playerList.push(packetEvent.Player.GetUsername());
            }else{
                //If the packet has been handled, don't do it again.
                if(PreviouslyHandledPacketTimes.includes(packetEvent.Packet.Timestamp))
                {
                    continue;
                }

                PreviouslyHandledPacketTimes.push(packetEvent.Packet.Timestamp);
            }

            HandlePacket(packetEvent)
        }

        document.getElementById("player_display").innerText = "Characters: " + playerList.join(", ");
        
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

        return;
    }

    //Player interacted with an element.
    if(packetEvent.Packet.Type == PACKET_TYPES.PLAYER_INTERACTION)
    {
        console.log("got INTERACT" + packetEvent.Packet.Timestamp)
        const interactionID = packetEvent.Packet.Values[0];

        //Find the interactable that was used based on the ID.
        for(var i = 0; i < MapInteractables.length; i++)
        {
            if(MapInteractables[i].ID == interactionID)
            {
                //If found, perform interaction.
                MapInteractables[i].PerformInteraction();
                break;
            }
        }

        return;
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

    const usernameDisplay = CreateNameBanner({x: 0, y: 0}, player.GetUsername(), player.Color);
    playerElement.appendChild(usernameDisplay);

    //Set the player color.

    ApplyElementBGColor(playerElement, player.Color + "33");

    document.getElementById("object_holder").appendChild(playerElement);

    return playerElement;
}


var PlayerFootstepTimer = {}
const PLAYER_FOOTSTEP_INTERVAL = 1

/**
 * Updates the specified player element to match the parameters of the specificed player.
 * @param {Player} player 
 * @param {Element} playerElement 
 * @returns 
 */
function UpdatePlayerElement(player, playerElement, isCurrentPlayer = false)
{
    if(playerElement == null || playerElement == undefined){return;} 
    if(player == null || player == undefined){return;} 
    if(!(playerElement instanceof Element)){return;}
    if(!(player instanceof Player)){return;}

    playerElement.style.bottom = player.Position.y + "px";
    playerElement.style.left = player.Position.x + "px";

    //If this is not the current player, 
    if(!isCurrentPlayer)
    {
        const username = player.GetUsername();
        if(PlayerFootstepTimer[username] == undefined){ PlayerFootstepTimer[username] = {timer:0, lastPos: { x: player.Position.x, y: player.Position.y }}; }

        //Increment the footstep counter.
        PlayerFootstepTimer[username].timer += ServerDeltaTime;

        if(PlayerFootstepTimer[username].timer > PLAYER_FOOTSTEP_INTERVAL)
        {
            const previousPos = PlayerFootstepTimer[username].lastPos;
            var angleBetween = Math.atan2(previousPos.y - player.Position.y, player.Position.x - previousPos.x);

            if(Distance(previousPos, player.Position) < 1)
            {
                angleBetween = Math.random() * Math.PI * 2;
            }

            CreateFootstepParticle(player.Position, angleBetween);
            PlayerFootstepTimer[username].timer = 0;
            PlayerFootstepTimer[username].lastPos = player.Position;
            
        }
    }else{
        if(player.Exploded > 0.0)
        {
            player.Exploded -= DeltaTime;
            playerElement.style.backgroundImage = `url('./assets/player_exploded.png')`;
        }
    }
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