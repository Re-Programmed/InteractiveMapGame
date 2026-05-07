/**
 * Stores the current lobby ID.
 *  */
var _currentLobbyID = "";
/**
 * Stores the current player object.
 */
var _currentPlayer = null;

/**
 * Returns the specified lobby's information.
 * @param {string} lobbyID 
 * @returns {Lobby}
 */
async function GetLobby(lobbyID)
{
    var lobby = await DATA.GetLobbyInformation(lobbyID);
    return lobby;
}

/**
 * Sets the current joined lobby to the specified ID.
 * @param {string} lobbyID 
 */
function SetCurrentLobby(lobbyID)
{
    _currentLobbyID = lobbyID;
}

/**
 * A packet event is something a player does. A packet event stores the player that did something and the packet they did.
 */
class PacketEvent
{
    Player;
    Packet;

    constructor(player, packet)
    {
        this.Player = player;
        this.Packet = packet;
    }
}

/**
 * Used to track what packets have already been processed.
 */
var _lastPacketEvents = []

/**
 * Returns all packet events that should occur.
 * @returns {[PacketEvent]}
 */
async function PacketUpdate()
{
    if(_currentPlayer == null){return [];}
    if(_currentLobbyID == ""){return [];}

    var packetEvents = [];

    var lobby = await GetLobby(_currentLobbyID);
    
    //Loop over all players to update each one.
    for(var i = 0; i < lobby.Players.length; i++)
    {
        //No need to update the current player.
        if(lobby.Players[i] == _currentPlayer.GetUsername()){continue;}
    
        var player = await DATA.GetPlayerInformation(lobby.GetID(), lobby.Players[i]);

        //Loop over all packets this player is trying to send.
        for(var packetIndex = 0; packetIndex < player.Packets.length; packetIndex++)
        {
            var hasBeenRead = false;

            //If the lastPacketEvents array contains a packet with the same timestamp, that means that this packet has been processed already and should be disregarded.
            for(var packetCheck = 0; packetCheck < _lastPacketEvents.length; packetCheck++)
            {
                if(player.Packets[packetIndex].Timestamp == _lastPacketEvents[packetCheck].Packet.Timestamp)
                {
                    hasBeenRead = true;
                    break;
                }
            }

            //The packet has not been processed, add it to the packetEvents array.
            if(!hasBeenRead)
            {
                var pe = new PacketEvent(player, player.Packets[packetIndex]);
                _lastPacketEvents.push(pe);
                packetEvents.push(pe);
            }
        }

        //Add a player update event that is used to check who is still online and update any player variables.
        var pUpdateEvent = new PacketEvent(player, new Packet(PACKET_TYPES.PLAYER_UPDATE, [], 0));
        packetEvents.push(pUpdateEvent);
    }

    for(var checkIndex = 0; checkIndex < _lastPacketEvents.length; checkIndex++)
    {

        var found = false;
        for(var eventIndex = 0; eventIndex < packetEvents.length; eventIndex++)
        {
            if(_lastPacketEvents[checkIndex].Packet.Timestamp == packetEvents[eventIndex].Packet.Timestamp)
            {
                found = true;
            }
        }

        if(!found)
        {
            _lastPacketEvents.splice(checkIndex, 1);
            checkIndex--;
        }
    }


    return packetEvents;
}

function GetCurrentPlayer()
{
    return _currentPlayer;
}

/**
 * Sends any updates made to the current player to the lobby.
 * @returns API Update Result
 */
async function UpdateCurrentPlayer()
{
    var result = await DATA.SetPlayerInformation(_currentPlayer);
    return result;
}

function _validateUsername(username)
{
    const regex = "^[a-zA-Z0-9]*";

    return username.match(regex) == username;
}

const RANDOM_SPAWNS = [
    { x: 622, y: 400 },
    { x: 64, y: 709 },
    { x: 2511, y: 621 },
    { x: 1701, y: 284 },
    { x: 646, y: 704 },
    { x: 515, y: 1055 }
]

/**
 * Creates a new player object and adds it to the specificed lobby. Returns a promise for the new player object (or null if the player cannot be created).
 * Also sets the current player to the created player. Must be called before any packets can send or recieve.
 * @param {string} username 
 * @param {string} lobbyID 
 * @returns {Player}
 */
async function PlayerJoin(username, lobbyID)
{
    if(_currentPlayer != null){return { value: false, message: "You are already in the game!" };}

    if(username.length < 3){return { value: false, message: "Username too short!" };}
    if(username.length > 24){return { value: false, message: "Username too long!" };}

    if(!_validateUsername(username)){return { value: false, message: "Invalid username!" };}

    var lobby = await GetLobby(lobbyID);

    //Check if a player already exists in this lobby with this username.
    for(var i = 0; i < lobby.Players.length; i++)
    {
        if(lobby.Players[i] == username)
        {
            return { value: false, message: "Username taken!" };
        }
    }

    //Create the player.
    var player = new Player(username, lobby.GetID(), { x: 0, y: 0 }, GetRandomColor());
    var playerSetResult = await DATA.SetPlayerInformation(player);

    //Add the player to the lobby information so new players that join will be updated.
    lobby.AddPlayer(username);
    var lobbySetResult = await DATA.SetLobbyInformation(lobby);

    //Set current player for tracking.
    _currentPlayer = player;

    const spawnPoint = RANDOM_SPAWNS[Math.floor(Math.random() * RANDOM_SPAWNS.length)];
    player.Position = spawnPoint;

    return { value: true, player: player };
}

/**
 * Removes the specificed player from the specified lobby. Also clears the current pla
 * @param {string} username 
 * @param {string} lobbyID 
 * @returns {boolean}
 */
async function PlayerLeave()
{
    var lobby = await GetLobby(_currentLobbyID);

    //Found and removed the player.
    if(lobby.RemovePlayer(_currentPlayer.GetUsername()))
    {
        var lobbyResult = await DATA.SetLobbyInformation(lobby);

        _currentPlayer = null;

        //No need to remove the player object since this is sufficient.
        
        return true;
    }


    return false;
}

/**
 * Sends a packet as the current player. Created packets will be sent when the player is updated.
 * @param {Packet} packet 
 * @returns 
 */
function CreatePacket(packet)
{
    if(!(packet instanceof Packet)){return;}

    if(GetCurrentPlayer() == null){return;}

    packet.Timestamp = Date.now();
    GetCurrentPlayer().RegisterPacket(packet);
}