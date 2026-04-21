const TABLE = "MaraudersMapGame"

const PREFIXES = {
    LOBBY: "lobby_",
    PLAYER: "player_"
}

const DATA = {
    SetURL: `https://qdzmt1ev82.execute-api.us-west-2.amazonaws.com/default/create?table=${TABLE}&id=`,
    TableURL: `https://tjdzerjw9f.execute-api.us-west-2.amazonaws.com/default?table=${TABLE}`,
    FetchURL: `https://mnd5defj88.execute-api.us-west-2.amazonaws.com/default/get?table=${TABLE}&id=`,
  
    FetchValue: async function (prefix, id)
    {
        var data = await fetch(this.FetchURL + prefix + id);
        var result = await data.json();

        return result;
    },

    SetValue: async function(prefix, id, object)
    {
        var result = await fetch(this.SetURL + prefix + id + "&data=" + btoa(object.Encode()));
        return result;
    },

    GetLobbyInformation: async function(lobbyID)
    {
        var result = await this.FetchValue(PREFIXES.LOBBY, lobbyID);

        var lobby = new Lobby();
        lobby.Decode(lobbyID, JSON.parse(atob(result.data)));

        return lobby;
    },

    SetLobbyInformation: async function(lobby) 
    {
        var result = await this.SetValue(PREFIXES.LOBBY, lobby.GetID(), lobby);
        return result;
    },

    GetPlayerInformation: async function(lobbyID, playerID)
    {
        var result = await this.FetchValue(PREFIXES.PLAYER, lobbyID + "_" + playerID);

        var player = new Player();
        player.Decode(lobbyID + "_" + playerID, JSON.parse(atob(result.data)));

        return player;
    },

    SetPlayerInformation: async function(player) 
    {
        var result = await this.SetValue(PREFIXES.PLAYER, player.GetID(), player);
        return result;
    }
}