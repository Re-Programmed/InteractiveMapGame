const MAX_PACKET_BACKLOG = 4

class IDObject
{
    _ID;

    constructor(id)
    {
        this._ID = id;
    }

    GetID()
    {
        return this._ID;
    }

    Encode()
    {
        var obj = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        delete obj["_ID"];
        return JSON.stringify(obj);
    }

    Decode(id, json)
    {
        this._ID = id;
    }
}

//The lobby is retrieved when a player joins the game and stores all initial data that should be held.
class Lobby extends IDObject
{
    Players;

    AddPlayer(username)
    {
        this.Players.push(username);
    } 

    RemovePlayer(username)
    {
        const index = this.Players.indexOf(username);
        if(index <= -1){ return false; }
        this.Players.splice(index, 1);
        return true;
    }

    constructor(id = "", players = [])
    {
        super(id);
        this.Players = players;
    }

    Decode(id, json)
    {
        super.Decode(id, json);
        this.Players = json.Players;
    }
}

const PACKET_TYPES = {
    PLAYER_UPDATE: "PLAYER_UPDATE", //Has no data and is passed no matter what.
    PLAYER_COLOR_FLASH: "PLAYER_COLOR_FLASH"
}

class Packet
{
    Type;
    Values;
    Timestamp;

    AddValue(value)
    {
        this.Values.push(value);
        return this.Values.length - 1;
    }

    RemoveValue(index)
    {
        if(this.Values.length <= index){ return; }
        this.Values.splice(index, 1);
    }
    
    constructor(type, values, timestamp = 0)
    {
        this.Type = type;
        this.Values = values;
        this.Timestamp = timestamp;
    }
}

/**
 * Represents a moveable entity that can send packets to the lobby.
 */
class Player extends IDObject 
{
    /**
     * The ID of the lobby the player is in.
     */
    Lobby;
    /**
     * The packets the player is trying to send.
     */
    Packets;
    /**
     * Where the player is.
     */
    Position;
    /**
     * The color attributed to this player.
     */
    Color;

    constructor(id = "", lobby = "", position = { x: 0, y: 0 }, color = "#FF0000", packets = [])
    {
        super(id);
        this.Lobby = lobby;
        this.Packets = packets;
        this.Position = position;
        this.Color = color;
    }

    /**
     * Decode a player object from JSON results.
     * @param {string} id 
     * @param {JSON} json 
     */
    Decode(id, json)
    {
        var lobby = id.split("_")[0];
        var trueID = id.split("_")[1];
        super.Decode(trueID, json);
        this.Lobby = lobby;
        this.Packets = json.Packets;
        this.Position = json.Position;
        this.Color = json.Color;
    }

    /**
     * Append a packet to the packets this player is trying to send.
     * @param {Packet} packet 
     * @returns 
     */
    RegisterPacket(packet)
    {
        if(!(packet instanceof Packet)){return;}

        //Add the packet at the start of the array.
        this.Packets.unshift(packet)
        
        //Remove excess packets.
        while(this.Packets.length > MAX_PACKET_BACKLOG)
        {
            this.Packets.pop();
        }
    }

    Translate(x, y)
    {
        this.Position.x += x;
        this.Position.y += y;
    }

    Encode()
    {
        var obj = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
        delete obj["_ID"];
        delete obj["Lobby"];
        return JSON.stringify(obj);
    }

    GetID()
    {
        return this.Lobby + "_" + this._ID;
    }

    GetUsername()
    {
        return this._ID;
    }

}