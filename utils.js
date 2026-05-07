function GetRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}


function ApplyElementBGColor(element, color)
{
  //element.style.backgroundColor = `${color}`
  //element.style.backgroundBlendMode = 'cover';
}

function Distance(position1, position2)
{
  return Math.sqrt(Math.pow(position1.x - position2.x, 2) + Math.pow(position1.y - position2.y, 2))
}

function PointWithinBox(point, bottomLeft, scale)
{
  return point.x <= bottomLeft.x + scale.x && point.x >= bottomLeft.x && point.y <= bottomLeft.y + scale.y && point.y >= bottomLeft.y;
}