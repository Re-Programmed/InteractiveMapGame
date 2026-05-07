const PLAYER_TEXTURES = {
    STANDING: {FRAMES: ['./assets/player.png'], SPEED: 0},
    WALKING: {FRAMES: ['./assets/player.png', './assets/player_walk.png'], SPEED: 250},
    STANDING_KEVIN: {FRAMES: ['./assets/player_kevin.png'], SPEED: 0},
    WALKING_KEVIN: {FRAMES: ['./assets/player_kevin.png', './assets/player_walk_kevin.png'], SPEED: 250},
    STANDING_CHALFEN: {FRAMES: ['./assets/player_chalfen.png'], SPEED: 0},
    WALKING_CHALFEN: {FRAMES: ['./assets/player_chalfen.png', './assets/player_walk_chalfen.png'], SPEED: 250},
    STANDING_FUTUREMOUSE: {FRAMES: ['./assets/player_futuremouse.png'], SPEED: 0},
    WALKING_FUTUREMOUSE: {FRAMES: ['./assets/player_futuremouse.png', './assets/player_walk_futuremouse.png'], SPEED: 250},
    STANDING_BLUESHIRT: {FRAMES: ['./assets/player_blueshirt.png'], SPEED: 0},
    WALKING_BLUESHIRT: {FRAMES: ['./assets/player_blueshirt.png', './assets/player_walk_blueshirt.png'], SPEED: 250},
}

const MUSIC = [
    "./assets/sounds/waltz_and_mazurkas/b_133.mp3",
    "./assets/sounds/waltz_and_mazurkas/b_150.mp3",
    "./assets/sounds/waltz_and_mazurkas/no_1_m.mp3",
    "./assets/sounds/waltz_and_mazurkas/no_2_m.mp3",
    "./assets/sounds/waltz_and_mazurkas/no_15.mp3",
    "./assets/sounds/waltz_and_mazurkas/no_39.mp3",
]
var CurrentMusic = null;


var CurrentPlayerParameters = {
    FrameTimer: 0,
    CurrentFrame: 0,
    Texture: PLAYER_TEXTURES.STANDING
}


/**
 * The time that it was when the last frame started.
 */
var _previousTime = 0
/**
 * How much time elapsed between now and the last frame.
 */
var DeltaTime = 0

const CAMERA_MOVEMENT_PADDING = 100


function PlayRandomWaltz()
{
    const randomPiece = new Audio(MUSIC[Math.floor(Math.random() * MUSIC.length)]);
    randomPiece.volume = 0.33;

    //Don't play the same thing twice.
    if(CurrentMusic != null && randomPiece.src == CurrentMusic.src){
        PlayRandomWaltz();
        return;
    }

    try{
        randomPiece.play()
        CurrentMusic = randomPiece;
    }catch(e)
    {
        CurrentMusic = null;
    }

    randomPiece.onended = function () {
        CurrentMusic = null;
        PlayRandomWaltz();
    } 
    
}

DEFAULT_ZOOM = "100%"

function UpdateClient()
{
    document.body.style.zoom = DEFAULT_ZOOM;


    //Calculate the delta time.
    const now = Date.now().valueOf();
    DeltaTime = now - _previousTime;
    _previousTime = now;

    const player = GetCurrentPlayer();
    if(player == null){return;}
    const playerElement = PlayerElements[player.GetUsername()];


    HandlePlayerMotion(player, playerElement);

    HandlePlayerInteractions(player, playerElement);

    //Update the element to show the player's info.
    UpdatePlayerElement(player, playerElement, true);

    if(Distance({x: CameraPosition.x + window.innerWidth/2, y: CameraPosition.y + window.innerHeight/2}, player.Position) > CAMERA_MOVEMENT_PADDING)
    {
        SetCameraPosition({x: player.Position.x - window.innerWidth/2, y: player.Position.y - window.innerHeight/2});
    }
}

window.addEventListener('load', function () {
    setInterval(UpdateClient, 5);

    //Initilize camera pos.
    SetCameraPosition({x: 0, y: 0})

    
})

/**
 * Called after the server finishes updating.
 */
function AfterServerUpdate()
{
    UpdateCurrentPlayer();
}

var CameraPosition = {x: 0, y: 0}
var CameraShakeOffset = 0
function SetCameraPosition(position)
{
    CameraPosition = position;
    document.getElementById("object_holder").style.translate = `${-position.x + CameraShakeOffset}px ${position.y}px`;
}

function CameraShake(length, intensity)
{
    document.getElementById("object_holder").style.transitionDuration = "0s";
    for(var i = 0; i < length; i += 10)
    {
        setTimeout(() => { CameraShakeOffset = intensity; SetCameraPosition(CameraPosition); }, i);
        setTimeout(() => { CameraShakeOffset = -intensity; SetCameraPosition(CameraPosition); }, i + 5);
    }

    setTimeout(() => {
        CameraShakeOffset = 0;
        SetCameraPosition(CameraPosition);
        document.getElementById("object_holder").style.transitionDuration = "0.5s";
    }, length + 10);
}


const INTERACTION_DISTANCE = 50;
const INTERACTION_HIGHLIGHT = "#FFFF0035";

var keyEHeld = false;
function HandlePlayerInteractions(player, playerElement)
{
    var attemptedInteraction = false;

    if(GetKeyDown("KeyE"))
    {
        if(!keyEHeld)
        {
            keyEHeld = true;

            attemptedInteraction = true;
        }
    }else{
        keyEHeld = false;
    }

    for(var i = 0; i < MapInteractables.length; i++)
    {
        const interactable = MapInteractables[i];
        if(interactable instanceof InteractableElement)
        {
            //Make the interactable show above the player if the player is behind it.
            if(interactable.Position.y + 35 < player.Position.y)
            {
                interactable.GetElement().style.zIndex = 2;
            }else{
                interactable.GetElement().style.zIndex = 0;
            }

            if(Distance(player.Position, interactable.Position) < INTERACTION_DISTANCE)
            {
                interactable.GetElement().style.backgroundColor = INTERACTION_HIGHLIGHT;

                if(attemptedInteraction)
                {
                    if(interactable.PerformInteraction())
                    {
                        CreatePacket(interactable.CreatePacket());
                        break;
                    }
                }
            }else{
                interactable.GetElement().style.backgroundColor = "#ffffff00";
            }
        }
    }
}

var keyBHeld = false;

function HandlePlayerMotion(player, playerElement)
{

    if(player.IsDrunk > 0.0)
    {
        player.IsDrunk -= DeltaTime;
    }

    var destination = { x: player.Position.x, y: player.Position.y };

    var moved = false;

    if(GetKeyDown("KeyD"))
    {
        if(player.IsDrunk > 0.0)
        {
            destination.x -= 1;
            destination.y += 2.3 * (Math.random() > 0.5 ? -1.0 : 1.0);
        }else{
            destination.x += 1;
        }

        moved = true;
    }

    if(GetKeyDown("KeyA"))
    {
        if(player.IsDrunk > 0.0)
        {
            destination.x += 1;
            destination.y += 2.3 * (Math.random() > 0.5 ? -1.0 : 1.0);
        }else{
            destination.x -= 1;
        }
        
        moved = true;
    }

    //Don't move if the player is trying to move in to a location that is obstructed.
    if(GetPointIsColliding({ x: destination.x + 50 /*Add the width to check the middle of the player.*/, y: destination.y + 50 }))
    {
        destination.x = player.Position.x;
        moved = false;
    }

    if(GetKeyDown("KeyW"))
    {
        if(player.IsDrunk > 0.0)
        {
            destination.y -= 1;
            destination.x += 2.3 * (Math.random() > 0.5 ? -1.0 : 1.0);
        }else{
            destination.y += 1;
        }

        moved = true;
    }

    if(GetKeyDown("KeyS"))
    {
        if(player.IsDrunk > 0.0)
        {
            destination.y += 1;
            destination.x += 2.3 * (Math.random() > 0.5 ? -1.0 : 1.0);
        }else{
            destination.y -= 1;
        }

        moved = true;
    }

    //Don't move if the player is trying to move in to a location that is obstructed.
    if(GetPointIsColliding({ x: destination.x + 50, y: destination.y + 50 }))
    {
        destination.y = player.Position.y;
        moved = false;
    }


    player.Position = destination;

    animatePlayer(player, playerElement, moved);
    
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

var PlayerHair = null;

function animatePlayer(player, playerElement, moved)
{
    if(player.IsDapper)
    {
        if(PlayerHair == null)
        {
            PlayerHair = document.createElement("div");
            PlayerHair.className = "player_hair";
            playerElement.appendChild(PlayerHair);
        }
    }else{
        if(PlayerHair != null)
        {
            PlayerHair.remove();
            PlayerHair = null;
        }
    }
    
    if(player.Indoctrinated == "Kevin")
    {
        if(moved)
        {
            //Set the texture to the walking animation.
            CurrentPlayerParameters.Texture = PLAYER_TEXTURES.WALKING_KEVIN;
        }else{
            CurrentPlayerParameters.Texture = PLAYER_TEXTURES.STANDING_KEVIN;
        }
    }else if(player.Indoctrinated == "Chalfen")
    {
        if(moved)
        {
            //Set the texture to the walking animation.
            CurrentPlayerParameters.Texture = PLAYER_TEXTURES.WALKING_CHALFEN;
        }else{
            CurrentPlayerParameters.Texture = PLAYER_TEXTURES.STANDING_CHALFEN;
        }
    }else if(player.Indoctrinated == "FutureMouse")
    {
        if(moved)
        {
            //Set the texture to the walking animation.
            CurrentPlayerParameters.Texture = PLAYER_TEXTURES.WALKING_FUTUREMOUSE;
        }else{
            CurrentPlayerParameters.Texture = PLAYER_TEXTURES.STANDING_FUTUREMOUSE;
        }
    }else if(player.Indoctrinated == "Blue")
    {
        if(moved)
        {
            //Set the texture to the walking animation.
            CurrentPlayerParameters.Texture = PLAYER_TEXTURES.WALKING_BLUESHIRT;
        }else{
            CurrentPlayerParameters.Texture = PLAYER_TEXTURES.STANDING_BLUESHIRT;
        }
    }else{
        if(moved)
        {
            //Set the texture to the walking animation.
            CurrentPlayerParameters.Texture = PLAYER_TEXTURES.WALKING;
        }else{
            CurrentPlayerParameters.Texture = PLAYER_TEXTURES.STANDING;
        }
    }

        //Increment and change the frame.
        CurrentPlayerParameters.FrameTimer += DeltaTime;
        if(CurrentPlayerParameters.FrameTimer > CurrentPlayerParameters.Texture.SPEED)
        {
            CurrentPlayerParameters.CurrentFrame++;
            CurrentPlayerParameters.FrameTimer = 0;
            if(CurrentPlayerParameters.CurrentFrame >= CurrentPlayerParameters.Texture.FRAMES.length)
            {
                CurrentPlayerParameters.CurrentFrame = 0;
            }

            playerElement.style.backgroundImage = `url('${CurrentPlayerParameters.Texture.FRAMES[CurrentPlayerParameters.CurrentFrame]}')`;
        }
}
