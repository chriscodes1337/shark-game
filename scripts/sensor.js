//Define canvas borders
const cTopLeft = {x: -20, y: -20};
const cTopRight = {x: 660, y: -20};
const cBottomLeft = {x: -20, y: 660};
const cBottomRight = {x: 660, y: 660};
const cBorders = [
    [cTopLeft, cBottomLeft],
    [cTopRight, cBottomRight],
    [cTopLeft, cTopRight],
    [cBottomLeft, cBottomRight]
];

class Sensor {
    constructor(unit) {
        this.unit = unit;
        //Use a rayCount that is 1 higher than required for > 180 degrees
        this.rayCount = 33;
        //452.55 is the max. possible length for a canvas of size 640x640
        this.rayLength = 452.55;
        this.raySpreadAngle = (4 / 3) * Math.PI;
        
        this.raysArray = [];
        this.readingsArray = [];
    }

    update() {
        this.castRays();
        this.readingsArray = [];
        for (let i = 0; i < this.raysArray.length; i++) {
            this.readingsArray.push(
                this.getReading(this.raysArray[i]))
        }
    }

    getReading(ray) {
        let contacts = [];
        for (let i = 0; i < cBorders.length; i++) {
            const contact = getIntersection(
                ray[0],
                ray[1],
                cBorders[i][0],
                cBorders[i][1]
            );
            if (contact) {
                const returnValue = {
                    x: contact.x,
                    y: contact.y,
                    offset: contact.offset,
                    velocity: {x: 0, y: 0},
                    isPredator: 0,
                    isHuman: 0,
                    isBoundary: 1
                }
                contacts.push(returnValue);
            } 
        }
        for (let i = 0; i < units.length; i++) {
            //Only check for intersection if it is not the unit's own polygon
            if (units[i] != this.unit) {
                const poly = units[i].polygon;
                const velo = units[i].velocity;
                const pred = units[i].isPredator;
                const hum = units[i].isHuman;
                for (let j = 0; j < poly.length; j++) {
                    const value = getIntersection(
                        ray[0],
                        ray[1],
                        poly[j],
                        poly[(j+1) % poly.length]
                    );
                    if (value) {
                        const returnValue = {
                            x: value.x,
                            y: value.y,
                            offset: value.offset,
                            velocity: velo,
                            isPredator: pred,
                            isHuman: hum,
                            isBoundary: 0
                        }
                        contacts.push(returnValue);
                    }
                }
            }
        }
        if (contacts.length == 0) {
            return null;
        } else {
            const offsets = contacts.map(e=>e.offset);
            const minOffset = Math.min(...offsets);
            //Go through all contacts element by element and find the one with the minimum offset
            return contacts.find(e=>e.offset == minOffset);
        }
    }

    getInputs() {
        const inputs = this.readingsArray.map(e=>e.offset).concat(this.readingsArray.map(e=>e.velocity.x)).concat(this.readingsArray.map(e=>e.velocity.y)).concat(this.readingsArray.map(e=>e.isPredator)).concat(this.readingsArray.map(e=>e.isHuman)).concat(this.readingsArray.map(e=>e.isBoundary));
        return inputs;
    }

    castRays() {
        this.raysArray = [];
        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle = lerp(
                this.raySpreadAngle / 2,
                -this.raySpreadAngle / 2,
                this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
            );
        
        const start = {x: this.unit.x, y: this.unit.y};
        //Rotate ray here
        const totalAngle = Math.atan2(this.unit.velocity.y, this.unit.velocity.x) + rayAngle + Math.PI;
        const end = {
            x: this.unit.x -
                Math.cos(totalAngle) * this.rayLength,
            y: this.unit.y -
                Math.sin(totalAngle) * this.rayLength
        };
        //If the spread angle is greater than 180 degrees, the last ray must be omitted
        if (this.raySpreadAngle > Math.PI && i == this.rayCount - 1) {
            break;
        }
        this.raysArray.push([start, end]);
        }
    }

    draw(c) {
        for (let i = 0; i < this.rayCount; i++) {
            //If the spread angle is greater than 180 degrees, the last ray must be omitted
            if (this.raySpreadAngle > Math.PI && i == this.rayCount - 1) {
                break;
            }
            let end = this.raysArray[i][1];
            if (this.readingsArray[i]) {
                end = this.readingsArray[i];
            }
            c.beginPath();
            c.lineWidth = 2;
            c.strokeStyle = "red";
            //First thing in raysArray[i] is the start location
            c.moveTo(
                this.raysArray[i][0].x,
                this.raysArray[i][0].y
            );
            //raysArray[i][1] is end location
            c.lineTo(
                end.x,
                end.y
            );
            c.stroke();
        }
    }
}