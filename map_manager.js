const FOOTSTEP_FADE_TIME = 1000

var MapInteractables = []

var Colliders = []

class Collider
{
    Position;
    Scale;
    
    constructor(position = {x: 0, y: 0}, scale = {x: 0, y: 0})
    {
        this.Position = position;
        this.Scale = scale;
    }

    DebugDisplay()
    {
        const display = document.createElement('img');
        display.style.position = "fixed"
        display.style.width = this.Scale.x + "px";
        display.style.height = this.Scale.y + "px";
        UpdateElementPosition(display, this.Position);

        document.getElementById("object_holder").appendChild(display)
    }
}

function CreateCollider(position, scale)
{
    Colliders.push(new Collider(position, scale));
}

function DebugColliders()
{
    Colliders.forEach(col => { col.DebugDisplay(); })
}

function CreateFootstepParticle(position, angle)
{
    const footstep = document.createElement('img')
    footstep.className = 'footstep_particle'
    footstep.src = './assets/steps.png'
    
    footstep.style.left = (position.x) + "px";
    footstep.style.bottom = position.y + "px";
    footstep.style.rotate = angle + "rad";

    setTimeout(() => {
        footstep.remove();
    }, FOOTSTEP_FADE_TIME)

    document.getElementById("object_holder").appendChild(footstep)
}

function CreateBGElement(position, file, size)
{
    const bgElement = document.createElement("div");
    bgElement.className = "locale";
    bgElement.style.position = "absolute";

    bgElement.style.width = size.x + "px";
    bgElement.style.height = size.y + "px";
    bgElement.style.backgroundImage = `url('${file}')`;
    bgElement.style.backgroundRepeat = "no-repeat";
    bgElement.style.backgroundSize = "contain";

    UpdateElementPosition(bgElement, position);

    document.getElementById("object_holder").appendChild(bgElement)

    return bgElement
}

function CreateNameBanner(position, text, color)
{
    const banner = document.createElement("div");
    banner.className = "name_banner"
    banner.style.color = color;
    UpdateElementPosition(banner, position);

    const textElement = document.createElement("p");
    textElement.textContent = text;
    banner.appendChild(textElement)

    return banner;
}

function UpdateElementPosition(element, position)
{
    element.style.left = position.x + "px";
    element.style.bottom = position.y + "px";
}

class Door extends InteractableElement
{
    Destination;

    constructor(position = {x: 0, y: 0}, destination = {x: 0, y: 0}, ID = "")
    {
        super(position, ID);
        this.Destination = destination;

        const element = document.createElement("img")
        element.src = "./assets/door.png";
        element.id = this.ID;
        element.className = "door"
        UpdateElementPosition(element, position);

        document.getElementById("object_holder").appendChild(element);
    }

    PerformInteraction()
    {
        GetCurrentPlayer().Position = this.Destination;
        return false;
    }
}

class SoundInteractable extends InteractableElement
{
    IsUsed;
    Sound;
    Func;

    constructor(position = {x: 0, y: 0}, sound = "", img = "", func = () => {}, ID = "")
    {
        super(position, ID);
        this.IsUsed = false;
        this.Func = func;
        this.Sound = sound;

        const element = document.createElement("img")
        element.src = img;
        element.id = this.ID;
        element.className = "interactable"
        UpdateElementPosition(element, position);

        document.getElementById("object_holder").appendChild(element);
    }

    PerformInteraction()
    {
        if(Distance(GetCurrentPlayer().Position, this.Position) < 700)
        {
            if(this.IsUsed){return;}
            this.IsUsed = true;

            //Play the sound to nearby players.
            new Audio(this.Sound).play();

            if(Distance(GetCurrentPlayer().Position, this.Position) < 150)
            {
                this.Func();
            }

            this.GetElement().style.transform = "translate(-10px, 0)"

            setTimeout(() => { this.GetElement().style.transform = "translate(10px, 0)" }, 50);
            setTimeout(() => { this.GetElement().style.transform = "translate(-10px, 0)" }, 100);
            setTimeout(() => { this.GetElement().style.transform = "translate(10px, 0)" }, 150);
            setTimeout(() => { this.GetElement().style.transform = "translate(-10px, 0)" }, 200);
            setTimeout(() => { this.GetElement().style.transform = "translate(10px, 0)" }, 250);
            setTimeout(() => { this.GetElement().style.transform = "translate(-10px, 0)" }, 300);

            setTimeout(() => { this.GetElement().style.transform = "translate(0, 0)"; this.IsUsed = false; }, 350);

            return true;
        }

        return false;
    }
}

class GunInteractable extends InteractableElement
{
    IsUsed;
    Func;
    InitialSprite;

    constructor(position = {x: 0, y: 0}, img = "", func = () => {}, ID = "")
    {
        super(position, ID);
        this.IsUsed = false;
        this.InitialSprite = img;
        this.Func = func;

        const element = document.createElement("img")
        element.src = img;
        element.id = this.ID;
        element.className = "interactable"
        UpdateElementPosition(element, position);

        document.getElementById("object_holder").appendChild(element);
    }

    PerformInteraction()
    {
        if(Distance(GetCurrentPlayer().Position, this.Position) < 900)
        {
            if(this.IsUsed){return false;}
            this.IsUsed = true;

            //Play the sound to nearby players.
            new Audio("./assets/sounds/gun.mp3").play();
            this.GetElement().src = this.InitialSprite;

            CameraShake(650, 20);

            if(Distance(GetCurrentPlayer().Position, this.Position) < 150)
            {
                this.Func();
            }

            this.GetElement().style.opacity = "0";

            const smoke = document.createElement("img");
            smoke.className = "interactable";
            smoke.src = "./assets/explosion_smoke.png";
            
            UpdateElementPosition(smoke, {x: this.Position.x, y: this.Position.y});
            document.getElementById("object_holder").appendChild(smoke);

            setTimeout(() => {
                this.GetElement().style.opacity = "1";
                    smoke.remove();
                    this.IsUsed = false;
                }, 1000);

        }

        return true;
    }

}

class ExplosionInteractable extends InteractableElement
{
    IsUsed;
    Func;
    LitSprite;
    InitialSprite;

    constructor(position = {x: 0, y: 0}, img = "", litImg = "", func = () => {}, ID = "")
    {
        super(position, ID);
        this.IsUsed = false;
        this.LitSprite = litImg;
        this.InitialSprite = img;
        this.Func = func;

        const element = document.createElement("img")
        element.src = img;
        element.id = this.ID;
        element.className = "interactable"
        UpdateElementPosition(element, position);

        document.getElementById("object_holder").appendChild(element);
    }

    PerformInteraction()
    {
        if(Distance(GetCurrentPlayer().Position, this.Position) < 900)
        {
            if(this.IsUsed){return false;}
            this.IsUsed = true;

            new Audio("./assets/sounds/bomb_fuse.mp3").play();
            this.GetElement().src = this.LitSprite;


            setTimeout(() => {

                //Play the sound to nearby players.
                new Audio("./assets/sounds/bomb_explode.mp3").play();
                this.GetElement().src = this.InitialSprite;

                if(Distance(GetCurrentPlayer().Position, this.Position) < 500)
                {
                    //Push away people near the explosion.
                    GetCurrentPlayer().Position.x += Math.min(1/(GetCurrentPlayer().Position.x - this.Position.x) * 3000, 225);
                    GetCurrentPlayer().Position.y += Math.min(1/(GetCurrentPlayer().Position.y - this.Position.x) * 3000, 225);

                    GetCurrentPlayer().Exploded = 3000.0;

                    CameraShake(1000, 10);
                }

                if(Distance(GetCurrentPlayer().Position, this.Position) < 150)
                {
                    this.Func();
                }

                this.GetElement().style.opacity = "0";

                const smoke = document.createElement("img");
                smoke.className = "interactable";
                smoke.src = "./assets/explosion_smoke.png";
                
                UpdateElementPosition(smoke, {x: this.Position.x, y: this.Position.y});
                 document.getElementById("object_holder").appendChild(smoke);

                setTimeout(() => {
                    this.GetElement().style.opacity = "1";
                     smoke.remove();
                      this.IsUsed = false;
                     }, 1000);

            }, 1000)
        }

        return true;
    }
}

class PlantInteractable extends InteractableElement
{
    IsUsed;
    OriginalImage;
    GrownImage;

    constructor(position = {x: 0, y: 0}, img = "", grownImage = "", ID = "")
    {
        super(position, ID);
        this.IsUsed = false;

        this.OriginalImage = img;
        this.GrownImage = grownImage;

        const element = document.createElement("img")
        element.src = img;
        element.id = this.ID;
        element.className = "interactable"
        UpdateElementPosition(element, position);

        document.getElementById("object_holder").appendChild(element);
    }

    PerformInteraction()
    {
        if(this.IsUsed){return false;}
        this.IsUsed = true;

        new Audio("./assets/sounds/water_plant.mp3").play();

        setTimeout(() => {
            this.GetElement().src = this.GrownImage;
            new Audio("./assets/sounds/ding.mp3").play();
        }, 1250)

        setTimeout(() => {
            this.GetElement().src = this.OriginalImage;
            this.IsUsed = false;
        }, 4500)

        return true;
    }
}

class ShirtCollectable extends InteractableElement
{
    IsUsed;
    Indoctrination;

    constructor(position = {x: 0, y: 0}, img = "", indoctrination = "", ID = "")
    {
        super(position, ID);
        this.IsUsed = false;
        this.Indoctrination = indoctrination;

        const element = document.createElement("img")
        element.src = img;
        element.id = this.ID;
        element.className = "interactable"
        UpdateElementPosition(element, position);

        document.getElementById("object_holder").appendChild(element);
    }

    PerformInteraction()
    {
        if(this.IsUsed){return;}
        this.IsUsed = true;

        new Audio("./assets/sounds/equip.mp3").play();

        GetCurrentPlayer().Indoctrinated = this.Indoctrination;

        setTimeout(() => {this.IsUsed = false;}, 1000);

        return false;
    }
}

class LampPost extends InteractableElement
{
    IsOn;

    constructor(position = {x: 0, y: 0}, ID = "")
    {
        super(position, ID);
        this.IsOn = false;

        const element = document.createElement("img")
        element.src = "./assets/light_post_off.png";
        element.id = this.ID;
        element.className = "lamp_post"
        UpdateElementPosition(element, position);

        document.getElementById("object_holder").appendChild(element);
    }

    PerformInteraction()
    {
        if(this.IsOn){ return false; }   

        if(Distance(GetCurrentPlayer().Position, this.Position) < 1000)
        {
            const a = new Audio("./assets/sounds/light_on.mp3");
            a.volume = 0.25 + 0.75 * (Distance(GetCurrentPlayer().Position, this.Position)/1000)
            a.play()
        }

        this.GetElement().src = "./assets/light_post_on.png";
        this.IsOn = true;

        setTimeout(() => { this.GetElement().src = "./assets/light_post_off.png"; }, 50);
        setTimeout(() => { this.GetElement().src = "./assets/light_post_on.png"; }, 90);
        setTimeout(() => { this.GetElement().src = "./assets/light_post_off.png"; }, 115);
        setTimeout(() => { this.GetElement().src = "./assets/light_post_on.png"; }, 143);

        setTimeout(() => { 
            this.GetElement().src = "./assets/light_post_off.png";
            this.IsOn = false;
        }, 1725)


        return true;
    }
}

function GetPointIsColliding(point)
{
    for(var i = 0; i < Colliders.length; i++)
    {
        if(PointWithinBox(point, Colliders[i].Position, Colliders[i].Scale))
        {
            return true;
        }
    }

    return false;
}

var MapLocales = {
    SamadsHouse: {
        position: { x: 1500, y: 1500 },
        bg: "./assets/map/samads_house.png",
        scale: { x: 792 * 1.5, y: 446 * 1.5 }
    },
    ArchiesHouse: {
        position: { x: 2688, y: 1500 },
        bg: "./assets/map/archies_house.png",
        scale: { x: 788 * 1.5, y: 436 * 1.5 }
    },
    GlenardOakSchool: {
        position: { x: 3870, y: 1500 },
        bg: "./assets/map/glenard_oak_school.png",
        scale: { x: 783 * 1.5, y: 434 * 1.5 }
    },
    Mosque: {
        position: { x:5044.5, y: 1500 },
        bg: "./assets/map/mosque.png",
        scale: { x: 791 * 1.5, y: 433 * 1.5 }
    },
    Salon: {
        position: { x: 6231, y: 1500 },
        bg: "./assets/map/salon.png",
        scale: { x: 794 * 1.5, y: 440 * 1.5 }
    },
    FutureMouse: {
        position: { x: 7422, y: 1500 },
        bg: "./assets/map/future_mouse.png",
        scale: { x: 788 * 1.5, y: 442 * 1.5 }
    },
    OConnells: {
        position: { x: 8604, y: 1500 },
        bg: "./assets/map/o_connells.png",
        scale: { x: 791 * 1.5, y: 438 * 1.5 }
    },
    ChalfensHome: {
        position: { x: 9790.5, y: 1500 },
        bg: "./assets/map/chalfens_home.png",
        scale: { x: 797 * 1.5, y: 443 * 1.5 }
    },
    London: {
        position: { x: 0, y: 0 },
        bg: "./assets/map/white_teeth_city.png",
        scale: { x: 1336 * 2, y: 749 * 2 }
    }
}

//Loads all the interactables for the level.
window.addEventListener('load', LoadElements)
function LoadElements()
{
    Object.values(MapLocales).forEach(loc => {
        CreateBGElement(loc.position, loc.bg, loc.scale);
    })
    
    MapInteractables.push(new LampPost({ x: 328, y: 461 }));
    CreateCollider({x: 348, y: 461}, {x: 60, y: 100});

    MapInteractables.push(new LampPost({ x: 543, y: 461 }));
    CreateCollider({x: 563, y: 461}, {x: 60, y: 100});

    MapInteractables.push(new LampPost({ x: 705, y: 680 }));
    CreateCollider({x: 725, y: 680}, {x: 60, y: 100});

    MapInteractables.push(new LampPost({ x: 1601, y: 697 }));
    CreateCollider({x: 1621, y: 697}, {x: 60, y: 100});

    MapInteractables.push(new LampPost({ x: 1913, y: 697 }));
    CreateCollider({x: 1933, y: 697}, {x: 60, y: 100});

    MapInteractables.push(new LampPost({ x: 2528, y: 697 }));
    CreateCollider({x: 2548, y: 697}, {x: 60, y: 100});

    MapInteractables.push(new LampPost({ x: 1479, y: 341 }));
    CreateCollider({x: 1499, y: 341}, {x: 60, y: 100});

    MapInteractables.push(new LampPost({ x: 1096, y: 341 }));
    CreateCollider({x: 1116, y: 341}, {x: 60, y: 100});

    MapInteractables.push(new LampPost({ x: 692, y: 341 }));
    CreateCollider({x: 712, y: 341}, {x: 60, y: 100});


    //Samad's House
    CreateCollider({x: 50, y: 800}, {x: 220, y: 260})
    MapInteractables.push(new Door({ x: 328, y: 737 }, { x: 2043, y: 1707 }));
    MapInteractables[MapInteractables.length - 1].GetElement().style.transform = "scale(0.75)";
    CreateCollider({ x: 1888, y: 1548 }, {x: 600, y: 80 });
    CreateCollider({ x: 1708, y: 1548 }, {x: 250, y: 180 });
    CreateCollider({ x: 1708, y: 1548 }, {x: 150, y: 780 });
    CreateCollider({ x: 1708, y: 2108 }, {x: 680, y: 80 });
    CreateCollider({ x: 2308, y: 1548 }, {x: 150, y: 780 });
    CreateCollider({ x: 2208, y: 1548 }, {x: 250, y: 180 });
    MapInteractables.push(new Door({ x: 2035, y: 1579 }, { x: 328, y: 737 }));
    //  Beer
    MapInteractables.push(new SoundInteractable({x: 1860, y: 1742}, "./assets/sounds/slurp.mp3", "./assets/beer.png", () => {
        GetCurrentPlayer().IsDrunk = 5000.0;
    }));
    //Kevin Shirt
    MapInteractables.push(new ShirtCollectable({x: 2185, y: 1745}, "./assets/kevin_shirt.png", 'Kevin'));

    //Archie's House
    CreateCollider({x: 310, y: 800}, {x: 220, y: 260})
    MapInteractables.push(new Door({ x: 156, y: 737 }, { x: 3225, y: 1691 }));
    MapInteractables[MapInteractables.length - 1].GetElement().style.transform = "scale(0.75)";
    CreateCollider({ x: 2900, y: 1548 }, {x: 680, y: 80 });
    CreateCollider({ x: 2900, y: 1548 }, {x: 80, y: 780 });
    CreateCollider({ x: 2900, y: 2108 }, {x: 680, y: 80 });
    CreateCollider({ x: 3561, y: 1548 }, {x: 80, y: 780 });
    MapInteractables.push(new Door({ x: 3227, y: 1579 }, { x: 156, y: 737 }));
    //  Beer
    MapInteractables.push(new SoundInteractable({x: 2990, y: 1683}, "./assets/sounds/slurp.mp3", "./assets/beer.png", () => {
        GetCurrentPlayer().IsDrunk = 5000.0;
    }));
    //Teeth
    MapInteractables.push(new SoundInteractable({x: 3365, y: 1899}, "./assets/sounds/teeth.mp3", "./assets/teeth.png", () => {

    }));

    //Glenard Oak School
    CreateCollider({x: 851, y: 1000}, {x: 350, y: 300});
    MapInteractables.push(new Door({ x: 980, y: 940 }, { x: 4395, y: 1631 }));
    MapInteractables[MapInteractables.length - 1].GetElement().style.transform = "scale(0.75)";
    CreateCollider({ x: 4052, y: 1548 }, {x: 680, y: 80 });
    CreateCollider({ x: 4078, y: 1548 }, {x: 80, y: 780 });
    CreateCollider({ x: 4052, y: 2108 }, {x: 680, y: 80 });
    CreateCollider({ x: 4738, y: 1548 }, {x: 80, y: 780 });
    MapInteractables.push(new Door({ x: 4398, y: 1569 }, { x: 983, y: 927 }));
    //Bomb
    MapInteractables.push(new ExplosionInteractable({x: 4581, y: 1611}, "./assets/bomb.png", "./assets/bomb_lit.png", () => {}));

    //Mosque
    CreateCollider({ x: 1000, y: 700 }, { x: 440, y: 200 });
    MapInteractables.push(new Door({ x: 1175, y: 650 }, { x: 5299, y: 1755 }));
    MapInteractables[MapInteractables.length - 1].GetElement().style.transform = "scale(0.75)";
    CreateCollider({ x: 5211, y: 1564 }, {x: 820, y: 80 });
    CreateCollider({ x: 5211, y: 1564 }, {x: 80, y: 780 });
    CreateCollider({ x: 5211, y: 2108 }, {x: 820, y: 80 });
    CreateCollider({ x: 6011, y: 1564 }, {x: 80, y: 780 });
    //Mosque altar thing collider.
    CreateCollider({ x: 5554, y: 1664 }, {x: 120, y: 350 });
    MapInteractables.push(new Door({ x: 5222, y: 1780 }, { x: 1200, y: 650 }));

    //Salon
    CreateCollider({ x: 457, y: 1150 }, { x: 360, y: 250 });
    MapInteractables.push(new Door({ x: 626, y: 1099 }, { x: 6783, y: 1615 }));
    MapInteractables[MapInteractables.length - 1].GetElement().style.transform = "scale(0.75)";
    CreateCollider({ x: 6478, y: 1544 }, {x: 820, y: 80 });
    CreateCollider({ x: 6478, y: 1544 }, {x: 80, y: 780 });
    CreateCollider({ x: 6478, y: 2108 }, {x: 820, y: 80 });
    CreateCollider({ x: 7098, y: 1544 }, {x: 80, y: 780 });
    MapInteractables.push(new Door({ x: 6783, y: 1545 }, { x: 631, y: 1059 }));
    //Scissors
    MapInteractables.push(new SoundInteractable({x: 6567, y: 1620}, "./assets/sounds/scissors.mp3", "./assets/scissors.png", () => {
        GetCurrentPlayer().IsDapper = true;
    }));


    //FutureMouse
    CreateCollider({ x: 1767, y: 357 }, { x: 300, y: 250 });
    MapInteractables.push(new Door({ x: 1879, y: 306 }, { x: 7683, y: 1804 }));
    MapInteractables[MapInteractables.length - 1].GetElement().style.transform = "scale(0.75)";
    CreateCollider({ x: 7584, y: 1544 }, {x: 820, y: 80 });
    CreateCollider({ x: 7584, y: 1544 }, {x: 80, y: 780 });
    CreateCollider({ x: 7584, y: 2108 }, {x: 820, y: 80 });
    CreateCollider({ x: 8364, y: 1544 }, {x: 80, y: 780 });
    //Mouse area collider
    CreateCollider({ x: 8150, y: 1654 }, {x: 190, y: 380 });
    MapInteractables.push(new Door({ x: 7615, y: 1796 }, { x: 1879, y: 306 }));
    //Bomb
    MapInteractables.push(new ExplosionInteractable({x: 7756, y: 1938}, "./assets/bomb.png", "./assets/bomb_lit.png", () => {}));
    //Shirt
    MapInteractables.push(new ShirtCollectable({x: 7667, y: 1608}, "./assets/futuremouse_shirt.png", 'FutureMouse'));
    //Gun
    MapInteractables.push(new GunInteractable({x: 8019, y: 1654}, "./assets/gun.png", () => {}));

    //O'Connell's
    CreateCollider({ x: 2175, y: 696 }, { x: 250, y: 260 });
    MapInteractables.push(new Door({ x: 2319, y: 665 }, { x: 9029, y: 1655 }));
    MapInteractables[MapInteractables.length - 1].GetElement().style.transform = "scale(0.75)";
    CreateCollider({ x: 8744, y: 1544 }, {x: 820, y: 80 });
    CreateCollider({ x: 8744, y: 1544 }, {x: 80, y: 780 });
    CreateCollider({ x: 8744, y: 2108 }, {x: 820, y: 80 });
    CreateCollider({ x: 9564, y: 1544 }, {x: 80, y: 780 });
    //  Beer
    MapInteractables.push(new SoundInteractable({x: 9347, y: 1846}, "./assets/sounds/slurp.mp3", "./assets/beer.png", () => {
        GetCurrentPlayer().IsDrunk = 7000.0;
    }));//Bar Counter Collider
    CreateCollider({ x: 8927, y: 1898 }, {x: 350, y: 380 });
    MapInteractables.push(new Door({ x: 9035, y: 1554 }, { x: 2319, y: 635 }));
    
    //The Chalfen's Home
    CreateCollider({ x: -10, y: 483 }, { x: 196, y: 230 });
    MapInteractables.push(new Door({ x: 75, y: 432 }, { x: 10187, y: 1623 }));
    MapInteractables[MapInteractables.length - 1].GetElement().style.transform = "scale(0.75)";
    CreateCollider({ x: 10027, y: 1544 }, {x: 820, y: 80 });
    CreateCollider({ x: 10027, y: 1544 }, {x: 80, y: 780 });
    CreateCollider({ x: 10027, y: 2108 }, {x: 820, y: 80 });
    CreateCollider({ x: 10687, y: 1544 }, {x: 80, y: 780 });
    CreateCollider({ x: 10452, y: 1876 }, {x: 300, y: 300 });
    MapInteractables.push(new Door({ x: 10176, y: 1538 }, { x: 75, y: 400 }));
    //Shirt 
    MapInteractables.push(new ShirtCollectable({x: 10371, y: 1804}, "./assets/chalfen_shirt.png", 'Chalfen'));
    MapInteractables.push(new PlantInteractable({x: 10333, y: 1892}, './assets/plant_bud.png', './assets/plant_grown.png'));

    //General map elements
    MapInteractables.push(new ShirtCollectable({x: 1771, y: 715}, "./assets/blue_shirt.png", 'Blue'));
    MapInteractables.push(new ExplosionInteractable({x: 234, y: 1193}, "./assets/bomb.png", "./assets/bomb_lit.png", () => {}));
    MapInteractables.push(new SoundInteractable({x: 624, y: 95}, "./assets/sounds/slurp.mp3", "./assets/beer.png", () => {
        GetCurrentPlayer().IsDrunk = 5000.0;
    }));

    //Map Edge Colliders
    CreateCollider({x: 2646, y: -10}, { x: 100, y: 1471 });
    CreateCollider({x: -10, y: 1451}, { x: 2801, y: 100 });
    CreateCollider({x: -90, y: 0}, { x: 100, y: 1471 });
    CreateCollider({x: 0, y: -90}, { x: 2801, y: 100 });

    //DebugColliders();
}
